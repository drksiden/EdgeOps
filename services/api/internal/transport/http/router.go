package httptransport

import (
	"context"
	"net/http"

	"edgeops.local/services/api/internal/health"
	"github.com/danielgtaylor/huma/v2"
	"github.com/danielgtaylor/huma/v2/adapters/humachi"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

type emptyInput struct{}

type healthOutput struct {
	Body health.Response
}

func NewHandler(readiness health.ReadinessChecker) http.Handler {
	router := chi.NewRouter()
	router.Use(middleware.RequestID)
	router.Use(middleware.RealIP)
	router.Use(middleware.Recoverer)

	api := humachi.New(router, huma.DefaultConfig("EdgeOps API", "development / v1"))
	service := health.NewService(readiness)

	huma.Register(api, huma.Operation{
		OperationID: "get-health",
		Method:      http.MethodGet,
		Path:        "/health",
		Summary:     "Process health",
		Tags:        []string{"Operations"},
	}, func(_ context.Context, _ *emptyInput) (*healthOutput, error) {
		return &healthOutput{Body: service.Live()}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "get-readiness",
		Method:      http.MethodGet,
		Path:        "/ready",
		Summary:     "Dependency readiness",
		Tags:        []string{"Operations"},
	}, func(ctx context.Context, _ *emptyInput) (*healthOutput, error) {
		response, err := service.Ready(ctx)
		if err != nil {
			return nil, huma.Error503ServiceUnavailable("required dependency is unavailable")
		}
		return &healthOutput{Body: response}, nil
	})

	// Domain operations will be mounted below this prefix in later slices.
	router.Mount("/api/v1", chi.NewRouter())

	return router
}
