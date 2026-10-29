package config

import (
	"errors"
	"fmt"
	"net"
	"net/url"
	"os"
	"strings"
)

const (
	defaultHTTPAddr = ":8080"
	defaultMQTTURL  = "mqtt://localhost:1883"
)

type Config struct {
	HTTPAddr    string
	DatabaseURL string
	MQTTURL     string
}

func Load() (Config, error) {
	databaseURL := strings.TrimSpace(os.Getenv("EDGEOPS_DATABASE_URL"))
	if databaseURL == "" {
		return Config{}, errors.New("EDGEOPS_DATABASE_URL is required")
	}

	cfg := Config{
		HTTPAddr:    valueOrDefault("EDGEOPS_HTTP_ADDR", defaultHTTPAddr),
		DatabaseURL: databaseURL,
		MQTTURL:     valueOrDefault("EDGEOPS_MQTT_URL", defaultMQTTURL),
	}

	if err := validateHTTPAddress(cfg.HTTPAddr); err != nil {
		return Config{}, fmt.Errorf("EDGEOPS_HTTP_ADDR: %w", err)
	}
	if err := validateURL(cfg.DatabaseURL, map[string]bool{"postgres": true, "postgresql": true}); err != nil {
		return Config{}, fmt.Errorf("EDGEOPS_DATABASE_URL: %w", err)
	}
	if err := validateURL(cfg.MQTTURL, map[string]bool{"mqtt": true, "mqtts": true, "tcp": true, "ssl": true, "ws": true, "wss": true}); err != nil {
		return Config{}, fmt.Errorf("EDGEOPS_MQTT_URL: %w", err)
	}

	return cfg, nil
}

func valueOrDefault(name, fallback string) string {
	if value := strings.TrimSpace(os.Getenv(name)); value != "" {
		return value
	}
	return fallback
}

func validateHTTPAddress(address string) error {
	if _, _, err := net.SplitHostPort(address); err != nil {
		return fmt.Errorf("must be a host:port listen address: %w", err)
	}
	return nil
}

func validateURL(rawURL string, allowedSchemes map[string]bool) error {
	parsed, err := url.Parse(rawURL)
	if err != nil {
		return errors.New("must be a valid URL")
	}
	if !allowedSchemes[parsed.Scheme] {
		return fmt.Errorf("unsupported URL scheme %q", parsed.Scheme)
	}
	if parsed.Host == "" {
		return fmt.Errorf("must include a host")
	}
	return nil
}
