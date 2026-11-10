package httptransport

import (
	"context"
	"errors"
	"net/http"

	"edgeops.local/services/api/internal/physical"
	"github.com/danielgtaylor/huma/v2"
)

const developmentPrincipalID = "00000000-0000-4000-8000-000000000001"

type profileOutput struct{ Body physical.DeviceProfile }
type profilesOutput struct{ Body []physical.DeviceProfile }
type versionOutput struct{ Body physical.ProfileVersion }
type profileIDInput struct {
	ProfileID string `path:"profileID" format:"uuid"`
}
type versionIDInput struct {
	ProfileID string `path:"profileID" format:"uuid"`
	VersionID string `path:"versionID" format:"uuid"`
}
type createProfileInput struct{ Body physical.CreateProfile }
type createVersionInput struct {
	ProfileID string `path:"profileID" format:"uuid"`
	Body      physical.CreateProfileVersion
}

type sitePhysicalInput struct {
	OrganizationID string `path:"organizationID" format:"uuid"`
	SiteID         string `path:"siteID" format:"uuid"`
}
type gatewayIDInput struct {
	GatewayID string `path:"gatewayID" format:"uuid"`
}
type createGatewayInput struct {
	OrganizationID string `path:"organizationID" format:"uuid"`
	SiteID         string `path:"siteID" format:"uuid"`
	Body           physical.CreateGateway
}
type updateGatewayInput struct {
	GatewayID string `path:"gatewayID" format:"uuid"`
	Body      physical.UpdateGateway
}
type gatewayOutput struct{ Body physical.Gateway }
type gatewaysOutput struct{ Body []physical.Gateway }

type deviceIDInput struct {
	DeviceID string `path:"deviceID" format:"uuid"`
}
type createDeviceInput struct {
	OrganizationID string `path:"organizationID" format:"uuid"`
	SiteID         string `path:"siteID" format:"uuid"`
	Body           physical.CreateDevice
}
type updateDeviceInput struct {
	DeviceID string `path:"deviceID" format:"uuid"`
	Body     physical.UpdateDevice
}
type deviceOutput struct{ Body physical.Device }
type devicesOutput struct{ Body []physical.Device }
type channelsOutput struct{ Body []physical.DeviceChannel }

func registerPhysicalRoutes(api huma.API, repo *physical.Service) {
	huma.Register(api, huma.Operation{OperationID: "list-device-profiles", Method: http.MethodGet, Path: "/api/v1/device-profiles", Summary: "List device profiles", Tags: []string{"Device Profiles"}}, func(ctx context.Context, _ *emptyInput) (*profilesOutput, error) {
		x, e := repo.ListProfiles(ctx)
		if e != nil {
			return nil, physicalHTTPError(e)
		}
		return &profilesOutput{Body: x}, nil
	})
	huma.Register(api, huma.Operation{OperationID: "get-device-profile", Method: http.MethodGet, Path: "/api/v1/device-profiles/{profileID}", Summary: "Get device profile", Tags: []string{"Device Profiles"}}, func(ctx context.Context, in *profileIDInput) (*profileOutput, error) {
		x, e := repo.GetProfile(ctx, in.ProfileID)
		if e != nil {
			return nil, physicalHTTPError(e)
		}
		return &profileOutput{Body: x}, nil
	})
	huma.Register(api, huma.Operation{OperationID: "get-device-profile-version", Method: http.MethodGet, Path: "/api/v1/device-profiles/{profileID}/versions/{versionID}", Summary: "Get profile version", Tags: []string{"Device Profiles"}}, func(ctx context.Context, in *versionIDInput) (*versionOutput, error) {
		x, e := repo.GetVersion(ctx, in.ProfileID, in.VersionID)
		if e != nil {
			return nil, physicalHTTPError(e)
		}
		return &versionOutput{Body: x}, nil
	})
	huma.Register(api, huma.Operation{OperationID: "create-device-profile", Method: http.MethodPost, Path: "/api/v1/device-profiles", Summary: "Create device profile", Tags: []string{"Device Profiles"}}, func(ctx context.Context, in *createProfileInput) (*profileOutput, error) {
		x, e := repo.CreateProfile(ctx, in.Body)
		if e != nil {
			return nil, physicalHTTPError(e)
		}
		return &profileOutput{Body: x}, nil
	})
	huma.Register(api, huma.Operation{OperationID: "create-device-profile-version", Method: http.MethodPost, Path: "/api/v1/device-profiles/{profileID}/versions", Summary: "Create immutable profile version", Tags: []string{"Device Profiles"}}, func(ctx context.Context, in *createVersionInput) (*versionOutput, error) {
		x, e := repo.CreateVersion(ctx, in.ProfileID, in.Body)
		if e != nil {
			return nil, physicalHTTPError(e)
		}
		return &versionOutput{Body: x}, nil
	})

	huma.Register(api, huma.Operation{OperationID: "list-site-gateways", Method: http.MethodGet, Path: "/api/v1/organizations/{organizationID}/sites/{siteID}/gateways", Summary: "List site gateways", Tags: []string{"Gateways"}}, func(ctx context.Context, in *sitePhysicalInput) (*gatewaysOutput, error) {
		x, e := repo.ListGateways(ctx, developmentPrincipalID, in.OrganizationID, in.SiteID)
		if e != nil {
			return nil, physicalHTTPError(e)
		}
		return &gatewaysOutput{Body: x}, nil
	})
	huma.Register(api, huma.Operation{OperationID: "get-gateway", Method: http.MethodGet, Path: "/api/v1/gateways/{gatewayID}", Summary: "Get gateway", Tags: []string{"Gateways"}}, func(ctx context.Context, in *gatewayIDInput) (*gatewayOutput, error) {
		x, e := repo.GetGateway(ctx, developmentPrincipalID, in.GatewayID)
		if e != nil {
			return nil, physicalHTTPError(e)
		}
		return &gatewayOutput{Body: x}, nil
	})
	huma.Register(api, huma.Operation{OperationID: "create-gateway", Method: http.MethodPost, Path: "/api/v1/organizations/{organizationID}/sites/{siteID}/gateways", Summary: "Create gateway", Tags: []string{"Gateways"}}, func(ctx context.Context, in *createGatewayInput) (*gatewayOutput, error) {
		x, e := repo.CreateGateway(ctx, developmentPrincipalID, in.OrganizationID, in.SiteID, in.Body)
		if e != nil {
			return nil, physicalHTTPError(e)
		}
		return &gatewayOutput{Body: x}, nil
	})
	huma.Register(api, huma.Operation{OperationID: "update-gateway", Method: http.MethodPut, Path: "/api/v1/gateways/{gatewayID}", Summary: "Update gateway", Tags: []string{"Gateways"}}, func(ctx context.Context, in *updateGatewayInput) (*gatewayOutput, error) {
		x, e := repo.UpdateGateway(ctx, developmentPrincipalID, in.GatewayID, in.Body)
		if e != nil {
			return nil, physicalHTTPError(e)
		}
		return &gatewayOutput{Body: x}, nil
	})

	huma.Register(api, huma.Operation{OperationID: "list-site-devices", Method: http.MethodGet, Path: "/api/v1/organizations/{organizationID}/sites/{siteID}/devices", Summary: "List site devices", Tags: []string{"Devices"}}, func(ctx context.Context, in *sitePhysicalInput) (*devicesOutput, error) {
		x, e := repo.ListDevices(ctx, developmentPrincipalID, in.OrganizationID, in.SiteID)
		if e != nil {
			return nil, physicalHTTPError(e)
		}
		return &devicesOutput{Body: x}, nil
	})
	huma.Register(api, huma.Operation{OperationID: "get-device", Method: http.MethodGet, Path: "/api/v1/devices/{deviceID}", Summary: "Get device with channels", Tags: []string{"Devices"}}, func(ctx context.Context, in *deviceIDInput) (*deviceOutput, error) {
		x, e := repo.GetDevice(ctx, developmentPrincipalID, in.DeviceID)
		if e != nil {
			return nil, physicalHTTPError(e)
		}
		return &deviceOutput{Body: x}, nil
	})
	huma.Register(api, huma.Operation{OperationID: "create-device", Method: http.MethodPost, Path: "/api/v1/organizations/{organizationID}/sites/{siteID}/devices", Summary: "Create device and instantiate channels", Tags: []string{"Devices"}}, func(ctx context.Context, in *createDeviceInput) (*deviceOutput, error) {
		x, e := repo.CreateDevice(ctx, developmentPrincipalID, in.OrganizationID, in.SiteID, in.Body)
		if e != nil {
			return nil, physicalHTTPError(e)
		}
		return &deviceOutput{Body: x}, nil
	})
	huma.Register(api, huma.Operation{OperationID: "update-device", Method: http.MethodPut, Path: "/api/v1/devices/{deviceID}", Summary: "Update device inventory", Tags: []string{"Devices"}}, func(ctx context.Context, in *updateDeviceInput) (*deviceOutput, error) {
		x, e := repo.UpdateDevice(ctx, developmentPrincipalID, in.DeviceID, in.Body)
		if e != nil {
			return nil, physicalHTTPError(e)
		}
		return &deviceOutput{Body: x}, nil
	})
	huma.Register(api, huma.Operation{OperationID: "list-device-channels", Method: http.MethodGet, Path: "/api/v1/devices/{deviceID}/channels", Summary: "List concrete device channels", Tags: []string{"Devices"}}, func(ctx context.Context, in *deviceIDInput) (*channelsOutput, error) {
		x, e := repo.ListDeviceChannels(ctx, developmentPrincipalID, in.DeviceID)
		if e != nil {
			return nil, physicalHTTPError(e)
		}
		return &channelsOutput{Body: x}, nil
	})
}

func physicalHTTPError(err error) error {
	switch {
	case errors.Is(err, physical.ErrForbidden):
		return huma.Error403Forbidden("organization membership does not permit this resource")
	case errors.Is(err, physical.ErrNotFound):
		return huma.Error404NotFound("physical resource not found")
	case errors.Is(err, physical.ErrInvalid):
		return huma.Error422UnprocessableEntity(err.Error())
	case errors.Is(err, physical.ErrConflict):
		return huma.Error409Conflict("physical resource conflicts with existing data")
	default:
		return huma.Error500InternalServerError("physical operation failed")
	}
}
