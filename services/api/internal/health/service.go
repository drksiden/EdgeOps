package health

import (
	"context"
	"time"
)

const readinessTimeout = 2 * time.Second

type ReadinessChecker interface {
	Ping(context.Context) error
}

type Response struct {
	Status       string            `json:"status"`
	Dependencies map[string]string `json:"dependencies,omitempty"`
}

type Service struct {
	readiness ReadinessChecker
}

func NewService(readiness ReadinessChecker) *Service {
	return &Service{readiness: readiness}
}

func (s *Service) Live() Response {
	return Response{Status: "ok"}
}

func (s *Service) Ready(ctx context.Context) (Response, error) {
	checkCtx, cancel := context.WithTimeout(ctx, readinessTimeout)
	defer cancel()

	if err := s.readiness.Ping(checkCtx); err != nil {
		return Response{}, err
	}

	return Response{
		Status: "ok",
		Dependencies: map[string]string{
			"postgresql": "ok",
		},
	}, nil
}
