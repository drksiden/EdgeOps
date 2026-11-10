package httptransport

import (
	"context"
	"errors"
	"net/http"

	"edgeops.local/services/api/internal/health"
	"edgeops.local/services/api/internal/physical"
	"edgeops.local/services/api/internal/tenant"
	"github.com/danielgtaylor/huma/v2"
	"github.com/danielgtaylor/huma/v2/adapters/humachi"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

type emptyInput struct{}

type healthOutput struct {
	Body health.Response
}

type organizationListOutput struct{ Body []tenant.Organization }
type siteListOutput struct{ Body []tenant.Site }
type siteOutput struct{ Body tenant.Site }
type organizationPath struct {
	OrganizationID string `path:"organizationID" format:"uuid"`
}
type sitePath struct {
	OrganizationID string `path:"organizationID" format:"uuid"`
	SiteID         string `path:"siteID" format:"uuid"`
}
type createSiteInput struct {
	OrganizationID string `path:"organizationID" format:"uuid"`
	Body           tenant.CreateSite
}
type updateSiteInput struct {
	OrganizationID string `path:"organizationID" format:"uuid"`
	SiteID         string `path:"siteID" format:"uuid"`
	Body           tenant.UpdateSite
}

func NewHandler(readiness health.ReadinessChecker, tenantDB ...tenant.DB) http.Handler {
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

	if len(tenantDB) > 0 {
		repository := tenant.NewRepository(tenantDB[0])
		registerTenantRoutes(api, repository)
		if physicalDB, ok := tenantDB[0].(physical.DB); ok {
			repository := physical.NewRepository(physicalDB)
			registerPhysicalRoutes(api, physical.NewService(repository))
		}
	}

	return router
}

func registerTenantRoutes(api huma.API, repository *tenant.Repository) {
	huma.Register(api, huma.Operation{OperationID: "list-organizations", Method: http.MethodGet, Path: "/api/v1/organizations", Summary: "List organizations", Tags: []string{"Organizations"}},
		func(ctx context.Context, _ *emptyInput) (*organizationListOutput, error) {
			items, err := repository.ListOrganizations(ctx)
			if err != nil {
				return nil, huma.Error500InternalServerError("could not list organizations")
			}
			return &organizationListOutput{Body: items}, nil
		})

	huma.Register(api, huma.Operation{OperationID: "list-sites", Method: http.MethodGet, Path: "/api/v1/organizations/{organizationID}/sites", Summary: "List organization sites", Tags: []string{"Sites"}},
		func(ctx context.Context, input *organizationPath) (*siteListOutput, error) {
			items, err := repository.ListSites(ctx, input.OrganizationID)
			if err != nil {
				return nil, huma.Error500InternalServerError("could not list sites")
			}
			return &siteListOutput{Body: items}, nil
		})

	huma.Register(api, huma.Operation{OperationID: "get-site", Method: http.MethodGet, Path: "/api/v1/organizations/{organizationID}/sites/{siteID}", Summary: "Get a site", Tags: []string{"Sites"}},
		func(ctx context.Context, input *sitePath) (*siteOutput, error) {
			item, err := repository.GetSite(ctx, input.OrganizationID, input.SiteID)
			if errors.Is(err, tenant.ErrNotFound) {
				return nil, huma.Error404NotFound("site not found")
			}
			if err != nil {
				return nil, huma.Error500InternalServerError("could not get site")
			}
			return &siteOutput{Body: item}, nil
		})

	huma.Register(api, huma.Operation{OperationID: "create-site", Method: http.MethodPost, Path: "/api/v1/organizations/{organizationID}/sites", Summary: "Create a site", Tags: []string{"Sites"}},
		func(ctx context.Context, input *createSiteInput) (*siteOutput, error) {
			item, err := repository.CreateSite(ctx, input.OrganizationID, input.Body)
			if errors.Is(err, tenant.ErrNotFound) {
				return nil, huma.Error404NotFound("organization not found")
			}
			if err != nil {
				return nil, huma.Error500InternalServerError("could not create site")
			}
			return &siteOutput{Body: item}, nil
		})

	huma.Register(api, huma.Operation{OperationID: "update-site", Method: http.MethodPut, Path: "/api/v1/organizations/{organizationID}/sites/{siteID}", Summary: "Update a site", Tags: []string{"Sites"}},
		func(ctx context.Context, input *updateSiteInput) (*siteOutput, error) {
			item, err := repository.UpdateSite(ctx, input.OrganizationID, input.SiteID, input.Body)
			if errors.Is(err, tenant.ErrNotFound) {
				return nil, huma.Error404NotFound("site not found")
			}
			if err != nil {
				return nil, huma.Error500InternalServerError("could not update site")
			}
			return &siteOutput{Body: item}, nil
		})
}
