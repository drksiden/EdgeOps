package physical

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

type DB interface {
	Query(context.Context, string, ...any) (pgx.Rows, error)
	QueryRow(context.Context, string, ...any) pgx.Row
	Begin(context.Context) (pgx.Tx, error)
}

type Repository struct{ db DB }

func NewRepository(db DB) *Repository { return &Repository{db: db} }

func mapError(err error) error {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && (pgErr.Code == "23505" || pgErr.Code == "23503" || pgErr.Code == "23514") {
		return errors.Join(ErrConflict, err)
	}
	return err
}

func (r *Repository) ListProfiles(ctx context.Context) ([]DeviceProfile, error) {
	rows, err := r.db.Query(ctx, `SELECT id,name,manufacturer,model,description,status,created_at,updated_at FROM device_profiles ORDER BY name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []DeviceProfile{}
	for rows.Next() {
		var x DeviceProfile
		if err := scanProfile(rows, &x); err != nil {
			return nil, err
		}
		items = append(items, x)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	rows.Close()
	for i := range items {
		items[i].Versions, err = r.listVersions(ctx, r.db, items[i].ID)
		if err != nil {
			return nil, err
		}
	}
	return items, nil
}

func (r *Repository) GetProfile(ctx context.Context, id string) (DeviceProfile, error) {
	var x DeviceProfile
	if err := scanProfile(r.db.QueryRow(ctx, `SELECT id,name,manufacturer,model,description,status,created_at,updated_at FROM device_profiles WHERE id=$1`, id), &x); errors.Is(err, pgx.ErrNoRows) {
		return x, ErrNotFound
	} else if err != nil {
		return x, err
	}
	versions, err := r.listVersions(ctx, r.db, id)
	x.Versions = versions
	return x, err
}

func (r *Repository) GetVersion(ctx context.Context, profileID, versionID string) (ProfileVersion, error) {
	var v ProfileVersion
	err := scanVersion(r.db.QueryRow(ctx, `SELECT id,device_profile_id,version,status,created_at,published_at FROM device_profile_versions WHERE device_profile_id=$1 AND id=$2`, profileID, versionID), &v)
	if errors.Is(err, pgx.ErrNoRows) {
		return v, ErrNotFound
	}
	if err != nil {
		return v, err
	}
	v.Channels, err = r.listDefinitions(ctx, r.db, v.ID)
	return v, err
}

func (r *Repository) CreateProfile(ctx context.Context, in CreateProfile) (DeviceProfile, error) {
	var x DeviceProfile
	err := scanProfile(r.db.QueryRow(ctx, `INSERT INTO device_profiles(name,manufacturer,model,description,status) VALUES($1,$2,$3,$4,$5) RETURNING id,name,manufacturer,model,description,status,created_at,updated_at`, in.Name, in.Manufacturer, in.Model, in.Description, in.Status), &x)
	return x, mapError(err)
}

func (r *Repository) CreateVersion(ctx context.Context, profileID string, in CreateProfileVersion) (ProfileVersion, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return ProfileVersion{}, err
	}
	defer tx.Rollback(ctx)
	var exists bool
	if err = tx.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM device_profiles WHERE id=$1)`, profileID).Scan(&exists); err != nil {
		return ProfileVersion{}, err
	}
	if !exists {
		return ProfileVersion{}, ErrNotFound
	}
	var v ProfileVersion
	err = scanVersion(tx.QueryRow(ctx, `INSERT INTO device_profile_versions(device_profile_id,version,status,published_at) VALUES($1,$2,$3,CASE WHEN $3='published' THEN now() END) RETURNING id,device_profile_id,version,status,created_at,published_at`, profileID, in.Version, in.Status), &v)
	if err != nil {
		return v, mapError(err)
	}
	for _, c := range in.Channels {
		if c.Metadata == nil {
			c.Metadata = map[string]any{}
		}
		raw, _ := json.Marshal(c.Metadata)
		var d ChannelDefinition
		err = scanDefinition(tx.QueryRow(ctx, `INSERT INTO channel_definitions(device_profile_version_id,key,name,kind,data_type,access,hardware_ref,unit,metadata) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id,key,name,kind,data_type,access,hardware_ref,unit,metadata`, v.ID, c.Key, c.Name, c.Kind, c.DataType, c.Access, c.HardwareRef, c.Unit, raw), &d)
		if err != nil {
			return v, mapError(err)
		}
		v.Channels = append(v.Channels, d)
	}
	if err = tx.Commit(ctx); err != nil {
		return v, err
	}
	return v, nil
}

func (r *Repository) ListGateways(ctx context.Context, principal, org, site string) ([]Gateway, error) {
	if err := ensureSiteAccess(ctx, r.db, principal, org, site); err != nil {
		return nil, err
	}
	rows, err := r.db.Query(ctx, gatewaySelect+` WHERE g.organization_id=$1 AND g.site_id=$2 ORDER BY g.name`, org, site)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []Gateway{}
	for rows.Next() {
		var x Gateway
		if err := scanGateway(rows, &x); err != nil {
			return nil, err
		}
		items = append(items, x)
	}
	return items, rows.Err()
}
func (r *Repository) GetGateway(ctx context.Context, principal, id string) (Gateway, error) {
	var x Gateway
	err := scanGateway(r.db.QueryRow(ctx, gatewaySelect+` JOIN organization_memberships m ON m.organization_id=g.organization_id AND m.user_id=$2 WHERE g.id=$1`, id, principal), &x)
	if errors.Is(err, pgx.ErrNoRows) {
		return x, ErrNotFound
	}
	return x, err
}
func (r *Repository) CreateGateway(ctx context.Context, principal, org, site string, in CreateGateway) (Gateway, error) {
	if err := ensureSiteAccess(ctx, r.db, principal, org, site); err != nil {
		return Gateway{}, err
	}
	var x Gateway
	err := scanGateway(r.db.QueryRow(ctx, `WITH i AS (INSERT INTO gateways(organization_id,site_id,name,type,hardware_model,software_version) VALUES($1,$2,$3,$4,$5,$6) RETURNING *) SELECT i.id,i.organization_id,i.site_id,s.name,i.name,i.type,i.hardware_model,i.software_version,i.status,i.last_seen_at,i.created_at,i.updated_at FROM i JOIN sites s ON s.id=i.site_id`, org, site, in.Name, in.Type, in.HardwareModel, in.SoftwareVersion), &x)
	return x, mapError(err)
}
func (r *Repository) UpdateGateway(ctx context.Context, principal, id string, in UpdateGateway) (Gateway, error) {
	var x Gateway
	err := scanGateway(r.db.QueryRow(ctx, `WITH u AS (UPDATE gateways g SET name=$3,hardware_model=$4,software_version=$5,status=$6,updated_at=now() FROM organization_memberships m WHERE g.id=$1 AND m.user_id=$2 AND m.organization_id=g.organization_id RETURNING g.*) SELECT u.id,u.organization_id,u.site_id,s.name,u.name,u.type,u.hardware_model,u.software_version,u.status,u.last_seen_at,u.created_at,u.updated_at FROM u JOIN sites s ON s.id=u.site_id`, id, principal, in.Name, in.HardwareModel, in.SoftwareVersion, in.Status), &x)
	if errors.Is(err, pgx.ErrNoRows) {
		return x, ErrNotFound
	}
	return x, mapError(err)
}

func (r *Repository) ListDevices(ctx context.Context, principal, org, site string) ([]Device, error) {
	if err := ensureSiteAccess(ctx, r.db, principal, org, site); err != nil {
		return nil, err
	}
	rows, err := r.db.Query(ctx, deviceSelect+` WHERE d.organization_id=$1 AND d.site_id=$2 ORDER BY d.name`, org, site)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []Device{}
	for rows.Next() {
		var x Device
		if err := scanDevice(rows, &x); err != nil {
			return nil, err
		}
		x.Channels, err = r.listDeviceChannels(ctx, r.db, x.ID)
		if err != nil {
			return nil, err
		}
		items = append(items, x)
	}
	return items, rows.Err()
}
func (r *Repository) GetDevice(ctx context.Context, principal, id string) (Device, error) {
	var x Device
	err := scanDevice(r.db.QueryRow(ctx, deviceSelect+` JOIN organization_memberships m ON m.organization_id=d.organization_id AND m.user_id=$2 WHERE d.id=$1`, id, principal), &x)
	if errors.Is(err, pgx.ErrNoRows) {
		return x, ErrNotFound
	}
	if err != nil {
		return x, err
	}
	x.Channels, err = r.listDeviceChannels(ctx, r.db, x.ID)
	return x, err
}
func (r *Repository) ListDeviceChannels(ctx context.Context, principal, deviceID string) ([]DeviceChannel, error) {
	var ok bool
	err := r.db.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM devices d JOIN organization_memberships m ON m.organization_id=d.organization_id WHERE d.id=$1 AND m.user_id=$2)`, deviceID, principal).Scan(&ok)
	if err != nil {
		return nil, err
	}
	if !ok {
		return nil, ErrNotFound
	}
	return r.listDeviceChannels(ctx, r.db, deviceID)
}

func (r *Repository) CreateDevice(ctx context.Context, principal, org, site string, in CreateDevice) (Device, error) {
	if err := ValidateConnection(in.Connection.Type, in.Connection.Config); err != nil {
		return Device{}, err
	}
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return Device{}, err
	}
	defer tx.Rollback(ctx)
	if err = ensureSiteAccess(ctx, tx, principal, org, site); err != nil {
		return Device{}, err
	}
	var published bool
	err = tx.QueryRow(ctx, `SELECT status='published' FROM device_profile_versions WHERE id=$1`, in.ProfileVersionID).Scan(&published)
	if errors.Is(err, pgx.ErrNoRows) {
		return Device{}, ErrNotFound
	}
	if err != nil {
		return Device{}, err
	}
	if !published {
		return Device{}, errors.Join(ErrInvalid, errors.New("profile version must be published"))
	}
	if in.GatewayID != nil {
		var ok bool
		err = tx.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM gateways WHERE id=$1 AND organization_id=$2 AND site_id=$3)`, *in.GatewayID, org, site).Scan(&ok)
		if err != nil {
			return Device{}, err
		}
		if !ok {
			return Device{}, errors.Join(ErrInvalid, errors.New("gateway must belong to device site"))
		}
	}
	var id string
	err = tx.QueryRow(ctx, `INSERT INTO devices(organization_id,site_id,gateway_id,device_profile_version_id,name,external_id,serial_number) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id`, org, site, in.GatewayID, in.ProfileVersionID, in.Name, in.ExternalID, in.SerialNumber).Scan(&id)
	if err != nil {
		return Device{}, mapError(err)
	}
	_, err = tx.Exec(ctx, `INSERT INTO device_connections(device_id,type,config) VALUES($1,$2,$3)`, id, in.Connection.Type, in.Connection.Config)
	if err != nil {
		return Device{}, mapError(err)
	}
	result, err := tx.Exec(ctx, `INSERT INTO device_channels(device_id,channel_definition_id) SELECT $1,id FROM channel_definitions WHERE device_profile_version_id=$2`, id, in.ProfileVersionID)
	if err != nil {
		return Device{}, err
	}
	if result.RowsAffected() == 0 {
		return Device{}, errors.Join(ErrInvalid, errors.New("profile version has no channel definitions"))
	}
	if err = tx.Commit(ctx); err != nil {
		return Device{}, err
	}
	return r.GetDevice(ctx, principal, id)
}
func (r *Repository) UpdateDevice(ctx context.Context, principal, id string, in UpdateDevice) (Device, error) {
	var changed string
	err := r.db.QueryRow(ctx, `UPDATE devices d SET name=$3,external_id=$4,serial_number=$5,status=$6,updated_at=now() FROM organization_memberships m WHERE d.id=$1 AND m.user_id=$2 AND m.organization_id=d.organization_id RETURNING d.id`, id, principal, in.Name, in.ExternalID, in.SerialNumber, in.Status).Scan(&changed)
	if errors.Is(err, pgx.ErrNoRows) {
		return Device{}, ErrNotFound
	}
	if err != nil {
		return Device{}, mapError(err)
	}
	return r.GetDevice(ctx, principal, changed)
}

const gatewaySelect = `SELECT g.id,g.organization_id,g.site_id,s.name,g.name,g.type,g.hardware_model,g.software_version,g.status,g.last_seen_at,g.created_at,g.updated_at FROM gateways g JOIN sites s ON s.id=g.site_id`
const deviceSelect = `SELECT d.id,d.organization_id,d.site_id,s.name,d.gateway_id,g.name,p.id,d.device_profile_version_id,p.name,pv.version,d.name,d.external_id,d.serial_number,d.status,d.last_seen_at,c.type,d.created_at,d.updated_at FROM devices d JOIN sites s ON s.id=d.site_id LEFT JOIN gateways g ON g.id=d.gateway_id JOIN device_profile_versions pv ON pv.id=d.device_profile_version_id JOIN device_profiles p ON p.id=pv.device_profile_id JOIN device_connections c ON c.device_id=d.id`

type querier interface {
	Query(context.Context, string, ...any) (pgx.Rows, error)
	QueryRow(context.Context, string, ...any) pgx.Row
}

func ensureSiteAccess(ctx context.Context, q querier, principal, org, site string) error {
	var ok bool
	err := q.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM sites s JOIN organization_memberships m ON m.organization_id=s.organization_id WHERE s.id=$1 AND s.organization_id=$2 AND m.user_id=$3)`, site, org, principal).Scan(&ok)
	if err != nil {
		return err
	}
	if !ok {
		return ErrForbidden
	}
	return nil
}
func (r *Repository) listVersions(ctx context.Context, q querier, profile string) ([]ProfileVersion, error) {
	rows, err := q.Query(ctx, `SELECT id,device_profile_id,version,status,created_at,published_at FROM device_profile_versions WHERE device_profile_id=$1 ORDER BY version DESC`, profile)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []ProfileVersion{}
	for rows.Next() {
		var v ProfileVersion
		if err := scanVersion(rows, &v); err != nil {
			return nil, err
		}
		v.Channels, err = r.listDefinitions(ctx, q, v.ID)
		if err != nil {
			return nil, err
		}
		out = append(out, v)
	}
	return out, rows.Err()
}
func (r *Repository) listDefinitions(ctx context.Context, q querier, version string) ([]ChannelDefinition, error) {
	rows, err := q.Query(ctx, `SELECT id,key,name,kind,data_type,access,hardware_ref,unit,metadata FROM channel_definitions WHERE device_profile_version_id=$1 ORDER BY key`, version)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []ChannelDefinition{}
	for rows.Next() {
		var d ChannelDefinition
		if err := scanDefinition(rows, &d); err != nil {
			return nil, err
		}
		out = append(out, d)
	}
	return out, rows.Err()
}
func (r *Repository) listDeviceChannels(ctx context.Context, q querier, device string) ([]DeviceChannel, error) {
	rows, err := q.Query(ctx, `SELECT dc.id,cd.id,cd.key,cd.name,cd.kind,cd.data_type,cd.access,cd.hardware_ref,cd.unit,dc.enabled FROM device_channels dc JOIN channel_definitions cd ON cd.id=dc.channel_definition_id WHERE dc.device_id=$1 ORDER BY cd.key`, device)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []DeviceChannel{}
	for rows.Next() {
		var c DeviceChannel
		if err := rows.Scan(&c.ID, &c.DefinitionID, &c.Key, &c.Name, &c.Kind, &c.DataType, &c.Access, &c.HardwareRef, &c.Unit, &c.Enabled); err != nil {
			return nil, err
		}
		out = append(out, c)
	}
	return out, rows.Err()
}

type scanner interface{ Scan(...any) error }

func scanProfile(s scanner, x *DeviceProfile) error {
	return s.Scan(&x.ID, &x.Name, &x.Manufacturer, &x.Model, &x.Description, &x.Status, &x.CreatedAt, &x.UpdatedAt)
}
func scanVersion(s scanner, x *ProfileVersion) error {
	return s.Scan(&x.ID, &x.ProfileID, &x.Version, &x.Status, &x.CreatedAt, &x.PublishedAt)
}
func scanDefinition(s scanner, x *ChannelDefinition) error {
	var raw []byte
	if err := s.Scan(&x.ID, &x.Key, &x.Name, &x.Kind, &x.DataType, &x.Access, &x.HardwareRef, &x.Unit, &raw); err != nil {
		return err
	}
	return json.Unmarshal(raw, &x.Metadata)
}
func scanGateway(s scanner, x *Gateway) error {
	return s.Scan(&x.ID, &x.OrganizationID, &x.SiteID, &x.SiteName, &x.Name, &x.Type, &x.HardwareModel, &x.SoftwareVersion, &x.Status, &x.LastSeenAt, &x.CreatedAt, &x.UpdatedAt)
}
func scanDevice(s scanner, x *Device) error {
	return s.Scan(&x.ID, &x.OrganizationID, &x.SiteID, &x.SiteName, &x.GatewayID, &x.GatewayName, &x.ProfileID, &x.ProfileVersionID, &x.ProfileName, &x.ProfileVersion, &x.Name, &x.ExternalID, &x.SerialNumber, &x.Status, &x.LastSeenAt, &x.Connection.Type, &x.CreatedAt, &x.UpdatedAt)
}
