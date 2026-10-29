package config

import (
	"strings"
	"testing"
)

func TestLoadRequiresDatabaseURL(t *testing.T) {
	t.Setenv("EDGEOPS_DATABASE_URL", "")
	t.Setenv("EDGEOPS_HTTP_ADDR", "")
	t.Setenv("EDGEOPS_MQTT_URL", "")

	_, err := Load()
	if err == nil || !strings.Contains(err.Error(), "EDGEOPS_DATABASE_URL is required") {
		t.Fatalf("expected required database URL error, got %v", err)
	}
}

func TestLoadUsesSafeDefaults(t *testing.T) {
	t.Setenv("EDGEOPS_DATABASE_URL", "postgres://localhost/edgeops")
	t.Setenv("EDGEOPS_HTTP_ADDR", "")
	t.Setenv("EDGEOPS_MQTT_URL", "")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("load configuration: %v", err)
	}
	if cfg.HTTPAddr != defaultHTTPAddr {
		t.Fatalf("expected HTTP default %q, got %q", defaultHTTPAddr, cfg.HTTPAddr)
	}
	if cfg.MQTTURL != defaultMQTTURL {
		t.Fatalf("expected MQTT default %q, got %q", defaultMQTTURL, cfg.MQTTURL)
	}
}

func TestLoadDoesNotEchoMalformedDatabaseURL(t *testing.T) {
	secret := "do-not-leak"
	t.Setenv("EDGEOPS_DATABASE_URL", "postgres://edgeops:"+secret+"%zz@localhost/edgeops")

	_, err := Load()
	if err == nil {
		t.Fatal("expected malformed database URL error")
	}
	if strings.Contains(err.Error(), secret) {
		t.Fatal("configuration error exposed the database password")
	}
}
