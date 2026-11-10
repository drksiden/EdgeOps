package physical

import (
	"context"
	"encoding/json"
	"errors"
	"os"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"
)

func TestDeviceCreationTransactionAndTenancy(t *testing.T) {
	url := os.Getenv("EDGEOPS_TEST_DATABASE_URL")
	if url == "" {
		t.Skip("EDGEOPS_TEST_DATABASE_URL is not set")
	}
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, url)
	if err != nil {
		t.Fatal(err)
	}
	defer pool.Close()
	var org, site, otherSite, foreignOrg, foreignSite, profile, version, draftVersion, gateway string
	err = pool.QueryRow(ctx, `INSERT INTO organizations(name,slug) VALUES('Physical Test', 'physical-test-'||gen_random_uuid()) RETURNING id`).Scan(&org)
	if err != nil {
		t.Fatal(err)
	}
	defer func() {
		_, _ = pool.Exec(ctx, `DELETE FROM organizations WHERE id=$1`, org)
		if profile != "" {
			_, _ = pool.Exec(ctx, `DELETE FROM device_profiles WHERE id=$1`, profile)
		}
	}()
	err = pool.QueryRow(ctx, `INSERT INTO organization_memberships(user_id,organization_id,role) VALUES('00000000-0000-4000-8000-000000000001',$1,'owner') RETURNING id`, org).Scan(new(string))
	if err != nil {
		t.Fatal(err)
	}
	err = pool.QueryRow(ctx, `INSERT INTO sites(organization_id,name) VALUES($1,'Test Site') RETURNING id`, org).Scan(&site)
	if err != nil {
		t.Fatal(err)
	}
	err = pool.QueryRow(ctx, `INSERT INTO sites(organization_id,name) VALUES($1,'Other Site') RETURNING id`, org).Scan(&otherSite)
	if err != nil {
		t.Fatal(err)
	}
	err = pool.QueryRow(ctx, `INSERT INTO gateways(organization_id,site_id,name,type,hardware_model) VALUES($1,$2,'Other Gateway','esp32_p4','test') RETURNING id`, org, otherSite).Scan(&gateway)
	if err != nil {
		t.Fatal(err)
	}
	err = pool.QueryRow(ctx, `INSERT INTO organizations(name,slug) VALUES('Foreign Test', 'foreign-test-'||gen_random_uuid()) RETURNING id`).Scan(&foreignOrg)
	if err != nil {
		t.Fatal(err)
	}
	defer func() { _, _ = pool.Exec(ctx, `DELETE FROM organizations WHERE id=$1`, foreignOrg) }()
	err = pool.QueryRow(ctx, `INSERT INTO sites(organization_id,name) VALUES($1,'Foreign Site') RETURNING id`, foreignOrg).Scan(&foreignSite)
	if err != nil {
		t.Fatal(err)
	}
	err = pool.QueryRow(ctx, `INSERT INTO device_profiles(name,manufacturer,model,status) VALUES('Test Profile','Tests','tx-'||gen_random_uuid(),'active') RETURNING id`).Scan(&profile)
	if err != nil {
		t.Fatal(err)
	}
	err = pool.QueryRow(ctx, `INSERT INTO device_profile_versions(device_profile_id,version,status,published_at) VALUES($1,1,'published',now()) RETURNING id`, profile).Scan(&version)
	if err != nil {
		t.Fatal(err)
	}
	_, err = pool.Exec(ctx, `INSERT INTO channel_definitions(device_profile_version_id,key,name,kind,data_type,access,hardware_ref) VALUES($1,'relay','Relay','gpio_output','boolean','read_write','GPIO4'),($1,'input','Input','gpio_input','boolean','read','GPIO5')`, version)
	if err != nil {
		t.Fatal(err)
	}
	err = pool.QueryRow(ctx, `INSERT INTO device_profile_versions(device_profile_id,version,status) VALUES($1,2,'draft') RETURNING id`, profile).Scan(&draftVersion)
	if err != nil {
		t.Fatal(err)
	}
	_, err = pool.Exec(ctx, `INSERT INTO channel_definitions(device_profile_version_id,key,name,kind,data_type,access,hardware_ref) VALUES($1,'draft','Draft','sensor','boolean','read','GPIO6')`, draftVersion)
	if err != nil {
		t.Fatal(err)
	}

	repo := NewRepository(pool)
	in := CreateDevice{ProfileVersionID: version, Name: "Created Device"}
	in.Connection.Type = "native_mqtt"
	in.Connection.Config = json.RawMessage(`{"clientId":"created-1"}`)
	created, err := repo.CreateDevice(ctx, "00000000-0000-4000-8000-000000000001", org, site, in)
	if err != nil {
		t.Fatal(err)
	}
	if len(created.Channels) != 2 {
		t.Fatalf("expected 2 instantiated channels, got %d", len(created.Channels))
	}
	if created.Connection.Type != "native_mqtt" {
		t.Fatalf("unexpected safe connection DTO: %#v", created.Connection)
	}

	in.Name = "Rejected Device"
	in.GatewayID = &gateway
	_, err = repo.CreateDevice(ctx, "00000000-0000-4000-8000-000000000001", org, site, in)
	if !errors.Is(err, ErrInvalid) {
		t.Fatalf("expected gateway mismatch ErrInvalid, got %v", err)
	}
	var rejected int
	pool.QueryRow(ctx, `SELECT count(*) FROM devices WHERE organization_id=$1 AND name='Rejected Device'`, org).Scan(&rejected)
	if rejected != 0 {
		t.Fatal("failed device transaction left a device row")
	}

	in.GatewayID = nil
	in.ProfileVersionID = draftVersion
	in.Name = "Draft Device"
	_, err = repo.CreateDevice(ctx, "00000000-0000-4000-8000-000000000001", org, site, in)
	if !errors.Is(err, ErrInvalid) {
		t.Fatalf("expected unpublished version rejection, got %v", err)
	}
	_, err = repo.CreateGateway(ctx, "00000000-0000-4000-8000-000000000001", foreignOrg, foreignSite, CreateGateway{Name: "Denied", Type: "esp32_p4", HardwareModel: "test"})
	if !errors.Is(err, ErrForbidden) {
		t.Fatalf("expected gateway tenant denial, got %v", err)
	}

	_, err = repo.ListDevices(ctx, "00000000-0000-4000-8000-000000000001", foreignOrg, foreignSite)
	if !errors.Is(err, ErrForbidden) {
		t.Fatalf("expected tenant denial, got %v", err)
	}
}

func TestProfileAndVersionUniqueness(t *testing.T) {
	url := os.Getenv("EDGEOPS_TEST_DATABASE_URL")
	if url == "" {
		t.Skip("EDGEOPS_TEST_DATABASE_URL is not set")
	}
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, url)
	if err != nil {
		t.Fatal(err)
	}
	defer pool.Close()
	repo := NewRepository(pool)
	in := CreateProfile{Name: "Unique Profile", Manufacturer: "Tests", Model: "unique-model", Description: "", Status: "active"}
	p, err := repo.CreateProfile(ctx, in)
	if err != nil {
		t.Fatal(err)
	}
	defer pool.Exec(ctx, `DELETE FROM device_profiles WHERE id=$1`, p.ID)
	if _, err = repo.CreateProfile(ctx, in); !errors.Is(err, ErrConflict) {
		t.Fatalf("expected profile uniqueness conflict, got %v", err)
	}
	v := CreateProfileVersion{Version: 1, Status: "published", Channels: []CreateChannelDefinition{{Key: "one", Name: "One", Kind: "sensor", DataType: "boolean", Access: "read", HardwareRef: "GPIO1"}}}
	if _, err = repo.CreateVersion(ctx, p.ID, v); err != nil {
		t.Fatal(err)
	}
	if _, err = repo.CreateVersion(ctx, p.ID, v); !errors.Is(err, ErrConflict) {
		t.Fatalf("expected version uniqueness conflict, got %v", err)
	}
	duplicate := CreateProfileVersion{Version: 2, Status: "published", Channels: []CreateChannelDefinition{{Key: "same", Name: "One", Kind: "sensor", DataType: "boolean", Access: "read", HardwareRef: "GPIO1"}, {Key: "same", Name: "Two", Kind: "sensor", DataType: "boolean", Access: "read", HardwareRef: "GPIO2"}}}
	if _, err = repo.CreateVersion(ctx, p.ID, duplicate); !errors.Is(err, ErrConflict) {
		t.Fatalf("expected channel key uniqueness conflict, got %v", err)
	}
}
