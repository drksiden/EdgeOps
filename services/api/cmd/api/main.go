package main

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"syscall"
	"time"

	"edgeops.local/services/api/internal/app"
	"edgeops.local/services/api/internal/config"
	"edgeops.local/services/api/internal/database"
	httptransport "edgeops.local/services/api/internal/transport/http"
)

func main() {
	os.Exit(run())
}

func run() int {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))

	cfg, err := config.Load()
	if err != nil {
		logger.Error("invalid configuration", "error", err)
		return 1
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	db, err := database.Open(ctx, cfg.DatabaseURL)
	if err != nil {
		logger.Error("could not configure database pool", "error", err)
		return 1
	}
	defer func() {
		db.Close()
		logger.Info("database connections closed")
	}()

	pingCtx, cancelPing := context.WithTimeout(ctx, 5*time.Second)
	err = db.Ping(pingCtx)
	cancelPing()
	if err != nil {
		logger.Warn("database is not ready; readiness checks will fail until connectivity is restored", "error", err)
	} else {
		logger.Info("database connection ready")
	}

	handler := httptransport.NewHandler(db, db)
	application := app.New(cfg.HTTPAddr, handler, logger)

	logger.Info("starting EdgeOps API", "http_addr", cfg.HTTPAddr)
	if err := application.Run(ctx); err != nil {
		logger.Error("API stopped with an error", "error", err)
		return 1
	}

	logger.Info("EdgeOps API stopped")
	return 0
}
