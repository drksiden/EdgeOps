package httptransport

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"edgeops.local/services/api/internal/health"
)

type stubReadiness struct {
	err error
}

func (s stubReadiness) Ping(context.Context) error {
	return s.err
}

func TestHealthReturnsSuccessWithoutCheckingDependencies(t *testing.T) {
	handler := NewHandler(stubReadiness{err: errors.New("database unavailable")})
	request := httptest.NewRequest(http.MethodGet, "/health", nil)
	response := httptest.NewRecorder()

	handler.ServeHTTP(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, response.Code)
	}

	var body health.Response
	if err := json.NewDecoder(response.Body).Decode(&body); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if body.Status != "ok" {
		t.Fatalf("expected status body %q, got %q", "ok", body.Status)
	}
}

func TestReadyReturnsSuccessWhenDatabaseIsReady(t *testing.T) {
	handler := NewHandler(stubReadiness{})
	request := httptest.NewRequest(http.MethodGet, "/ready", nil)
	response := httptest.NewRecorder()

	handler.ServeHTTP(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, response.Code)
	}

	var body health.Response
	if err := json.NewDecoder(response.Body).Decode(&body); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if body.Dependencies["postgresql"] != "ok" {
		t.Fatalf("expected PostgreSQL readiness, got %#v", body.Dependencies)
	}
}

func TestReadyReturnsServiceUnavailableWithoutLeakingDependencyError(t *testing.T) {
	secretError := "connect failed for password=do-not-leak"
	handler := NewHandler(stubReadiness{err: errors.New(secretError)})
	request := httptest.NewRequest(http.MethodGet, "/ready", nil)
	response := httptest.NewRecorder()

	handler.ServeHTTP(response, request)

	if response.Code != http.StatusServiceUnavailable {
		t.Fatalf("expected status %d, got %d", http.StatusServiceUnavailable, response.Code)
	}
	if strings.Contains(response.Body.String(), secretError) {
		t.Fatal("readiness response exposed the dependency error")
	}
}
