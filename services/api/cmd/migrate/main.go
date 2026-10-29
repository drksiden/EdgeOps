package main

import (
	"errors"
	"flag"
	"fmt"
	"log/slog"
	"net/url"
	"os"
	"path/filepath"

	"edgeops.local/services/api/internal/config"
	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

func main() {
	os.Exit(run())
}

func run() int {
	command := flag.String("command", "status", "migration command: up, down, or status")
	migrationsPath := flag.String("path", "migrations", "path to the migration directory")
	flag.Parse()

	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	cfg, err := config.Load()
	if err != nil {
		logger.Error("invalid configuration", "error", err)
		return 1
	}

	absolutePath, err := filepath.Abs(*migrationsPath)
	if err != nil {
		logger.Error("could not resolve migration path", "error", err)
		return 1
	}

	sourceURL := (&url.URL{Scheme: "file", Path: absolutePath}).String()
	migrator, err := migrate.New(sourceURL, cfg.DatabaseURL)
	if err != nil {
		logger.Error("could not initialize migrations", "error", err)
		return 1
	}
	defer func() {
		sourceErr, databaseErr := migrator.Close()
		if sourceErr != nil || databaseErr != nil {
			logger.Warn("could not close migration resources", "source_error", sourceErr, "database_error", databaseErr)
		}
	}()

	switch *command {
	case "up":
		err = migrator.Up()
	case "down":
		err = migrator.Steps(-1)
	case "status":
		version, dirty, versionErr := migrator.Version()
		if errors.Is(versionErr, migrate.ErrNilVersion) {
			logger.Info("migration status", "version", "none", "dirty", false)
			return 0
		}
		if versionErr != nil {
			err = versionErr
			break
		}
		logger.Info("migration status", "version", version, "dirty", dirty)
		return 0
	default:
		logger.Error("unsupported migration command", "command", *command)
		fmt.Fprintln(os.Stderr, "valid commands are: up, down, status")
		return 2
	}

	if errors.Is(err, migrate.ErrNoChange) {
		logger.Info("migrations already at requested state", "command", *command)
		return 0
	}
	if err != nil {
		logger.Error("migration failed", "command", *command, "error", err)
		return 1
	}

	logger.Info("migration completed", "command", *command)
	return 0
}
