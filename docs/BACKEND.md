# EdgeOps backend

## Purpose

`services/api` is the initial EdgeOps modular monolith. It exposes typed HTTP operations, owns PostgreSQL access, and will later communicate with EMQX. This phase contains infrastructure endpoints only; it intentionally has no EdgeOps domain resources or MQTT consumer.

The repository copy has no usable Git remote metadata, so the service currently uses the local-only Go module path `edgeops.local/services/api`. Replace it only after a canonical repository namespace is established.

## Structure

```text
services/api/
  cmd/api/                 API process
  cmd/migrate/             repository-local migration runner
  internal/app/            HTTP lifecycle and graceful shutdown
  internal/config/         environment configuration
  internal/database/       pgx connection pool
  internal/health/         liveness/readiness behavior
  internal/transport/http/ chi and Huma transport
  migrations/              ordered SQL migrations
```

The API uses Go's `net/http` server, chi routing, Huma for OpenAPI 3.1 operations, pgx/pgxpool for PostgreSQL, and `slog` JSON logging. Dependencies are constructed explicitly in `cmd/api`; there is no dependency injection framework or ORM.

## Prerequisites and configuration

Use Go 1.25.11 or newer and Docker with Docker Compose. Local defaults match `infra/docker/compose.yaml`:

| Variable | Local behavior | Purpose |
| --- | --- | --- |
| `EDGEOPS_HTTP_ADDR` | `:8080` | API listen address |
| `EDGEOPS_DATABASE_URL` | Required; `.env.example` contains the Compose development URL | PostgreSQL connection URL |
| `EDGEOPS_MQTT_URL` | `mqtt://localhost:1883` | Reserved broker URL for the later MQTT integration |

The database URL is deliberately required so no password is embedded in Go source. The HTTP and unauthenticated local MQTT defaults are development-safe. Invalid addresses, URL schemes, and missing URL hosts fail configuration parsing. The API never logs full database or MQTT URLs.

## Local workflow

Start PostgreSQL and EMQX from the repository root:

```bash
docker compose -f infra/docker/compose.yaml up -d
docker compose -f infra/docker/compose.yaml ps
export EDGEOPS_DATABASE_URL='postgres://edgeops:edgeops@localhost:5432/edgeops?sslmode=disable'
```

PostgreSQL listens on `localhost:5432`. EMQX MQTT listens on `localhost:1883`, and its local debugging dashboard is at `http://localhost:18083` (`admin` / `edgeops`). These credentials are explicitly for local development.

Run and inspect migrations from the API module:

```bash
cd services/api
go run ./cmd/migrate -command up
go run ./cmd/migrate -command status
go run ./cmd/migrate -command down
```

The migration runner uses `golang-migrate`, selected because it is a focused, established SQL migration library with PostgreSQL support. Keeping a small runner in the module makes migrations reproducible without a globally installed CLI. `down` rolls back one migration.

Start the API:

```bash
cd services/api
go run ./cmd/api
```

Then verify it:

```bash
curl -i http://localhost:8080/health
curl -i http://localhost:8080/ready
```

`GET /health` is process liveness and does not query PostgreSQL. `GET /ready` pings PostgreSQL and returns HTTP 503 when it is unavailable. Future domain operations are reserved below `/api/v1/`.

The generated OpenAPI 3.1 contract is available at `http://localhost:8080/openapi.json` and `http://localhost:8080/openapi.yaml`. Huma's development documentation is available at `http://localhost:8080/docs`.

Stop local infrastructure without deleting its named volumes:

```bash
docker compose -f infra/docker/compose.yaml down
```

## Checks

Run from `services/api`:

```bash
gofmt -w .
go vet ./...
go test ./...
go build -buildvcs=false ./...
```

The HTTP tests use a small readiness-check interface, so liveness and both readiness outcomes are verified without a production database.

The downloaded workspace has placeholder `.git` metadata rather than a usable Git repository, so the build command disables VCS stamping. A normal Git clone can use `go build ./...`.
