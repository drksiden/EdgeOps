package physical

import "context"

type Service struct{ repository *Repository }

func NewService(repository *Repository) *Service { return &Service{repository: repository} }
func (s *Service) ListProfiles(c context.Context) ([]DeviceProfile, error) {
	return s.repository.ListProfiles(c)
}
func (s *Service) GetProfile(c context.Context, id string) (DeviceProfile, error) {
	return s.repository.GetProfile(c, id)
}
func (s *Service) GetVersion(c context.Context, p, v string) (ProfileVersion, error) {
	return s.repository.GetVersion(c, p, v)
}
func (s *Service) CreateProfile(c context.Context, in CreateProfile) (DeviceProfile, error) {
	return s.repository.CreateProfile(c, in)
}
func (s *Service) CreateVersion(c context.Context, id string, in CreateProfileVersion) (ProfileVersion, error) {
	return s.repository.CreateVersion(c, id, in)
}
func (s *Service) ListGateways(c context.Context, principal, org, site string) ([]Gateway, error) {
	return s.repository.ListGateways(c, principal, org, site)
}
func (s *Service) GetGateway(c context.Context, principal, id string) (Gateway, error) {
	return s.repository.GetGateway(c, principal, id)
}
func (s *Service) CreateGateway(c context.Context, principal, org, site string, in CreateGateway) (Gateway, error) {
	return s.repository.CreateGateway(c, principal, org, site, in)
}
func (s *Service) UpdateGateway(c context.Context, principal, id string, in UpdateGateway) (Gateway, error) {
	return s.repository.UpdateGateway(c, principal, id, in)
}
func (s *Service) ListDevices(c context.Context, principal, org, site string) ([]Device, error) {
	return s.repository.ListDevices(c, principal, org, site)
}
func (s *Service) GetDevice(c context.Context, principal, id string) (Device, error) {
	return s.repository.GetDevice(c, principal, id)
}
func (s *Service) ListDeviceChannels(c context.Context, principal, id string) ([]DeviceChannel, error) {
	return s.repository.ListDeviceChannels(c, principal, id)
}
func (s *Service) CreateDevice(c context.Context, principal, org, site string, in CreateDevice) (Device, error) {
	if err := ValidateConnection(in.Connection.Type, in.Connection.Config); err != nil {
		return Device{}, err
	}
	return s.repository.CreateDevice(c, principal, org, site, in)
}
func (s *Service) UpdateDevice(c context.Context, principal, id string, in UpdateDevice) (Device, error) {
	return s.repository.UpdateDevice(c, principal, id, in)
}
