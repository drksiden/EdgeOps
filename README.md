# EdgeOps

EdgeOps is a cloud-edge platform for managing IoT and industrial edge infrastructure. It keeps the engineering view of gateways, devices, protocols, and channels separate from the customer view of sites, assets, understandable states, and controls.

The project is currently building its first end-to-end vertical slice: a real ESP32-C3 node connects through MQTT, physical channels are mapped to semantic asset points, and the web application displays state and sends verified commands.

## Why EdgeOps

Most device platforms expose raw protocol details directly to users. EdgeOps introduces a semantic layer so that customer workflows operate on equipment concepts instead of GPIO pins, Modbus addresses, or MQTT topics.

```text
Physical model                         Semantic model

Device Profile                        Asset Type
  -> Profile Version                    -> Point Definition
    -> Channel Definition
             |                                  |
             v                                  v
           Device -------- Point Mapping ----> Asset
             |                                  |
             v                                  v
       Device Channel                       Asset Point
```

A customer command is intended to follow this path:

```text
Asset action
-> Asset Point
-> Point Mapping
-> Device Channel
-> native device or edge gateway
-> physical operation
-> feedback verification
```

## Current status

Implemented:

- approved Next.js product prototype;
- PostgreSQL-backed users, organizations, memberships, and sites;
- immutable Device Profile Versions and Channel Definitions;
- tenant-safe gateways, devices, connections, and concrete Device Channels;
- transactional Device creation with channel instantiation;
- typed Go/Huma APIs and OpenAPI 3.1 output;
- ESP-IDF firmware bootstrap for an ESP32-C3 SuperMini;
- Wi-Fi reconnect, MQTT presence/Last Will, and diagnostic heartbeat firmware behavior;
- local PostgreSQL 17 and EMQX 5 development infrastructure.

Not implemented yet:

- semantic Asset Types, Assets, Points, and Point Mappings;
- Go MQTT consumer and runtime presence persistence;
- channel telemetry and historical/current point state;
- commands, acknowledgements, and feedback verification;
- browser realtime updates;
- production device provisioning, credentials, TLS, and OTA.

Some frontend areas intentionally remain backed by prototype data until their corresponding backend phase is implemented. See the [roadmap](docs/ROADMAP.md) for the planned sequence.

## Technology stack

| Layer | Technology |
| --- | --- |
| Web | Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui |
| API | Go, chi, Huma, pgx |
| Database | PostgreSQL 17 |
| Messaging | EMQX 5 / MQTT |
| Native device | ESP32-C3, ESP-IDF 6.1, ESP-MQTT |
| Local infrastructure | Docker Compose |

## Repository layout

```text
.
├── app/                    Next.js App Router application
├── components/             approved UI components
├── lib/                    frontend API boundary and remaining mock data
├── services/api/           Go modular monolith
│   ├── cmd/api/            API entry point
│   ├── cmd/migrate/        migration runner
│   ├── internal/           application modules
│   └── migrations/         PostgreSQL migrations and development fixtures
├── firmware/c3-node/       native ESP32-C3 ESP-IDF firmware
├── infra/docker/           PostgreSQL and EMQX Compose stack
└── docs/                   architecture, domain, communication, and roadmap docs
```

## Prerequisites

For the web/API development stack:

- Node.js compatible with Next.js 16;
- pnpm 12;
- Go 1.25.11 or newer;
- Docker with Docker Compose.

For firmware development:

- ESP-IDF 5.3 or newer; the verified environment uses ESP-IDF 6.1;
- an ESP32-C3 board and a data-capable USB cable;
- optional Nix with flakes enabled for the repository development shell.

## Quick start

### 1. Install frontend dependencies

```bash
pnpm install
```

### 2. Start PostgreSQL and EMQX

```bash
docker compose -f infra/docker/compose.yaml up -d
docker compose -f infra/docker/compose.yaml ps
```

Local services:

| Service | Address |
| --- | --- |
| PostgreSQL | `localhost:5432` |
| MQTT | `localhost:1883` |
| EMQX dashboard | [http://localhost:18083](http://localhost:18083) |

The development-only EMQX dashboard credentials are `admin` / `edgeops`.

### 3. Apply database migrations

```bash
export EDGEOPS_DATABASE_URL='postgres://edgeops:edgeops@localhost:5432/edgeops?sslmode=disable'
cd services/api
go run ./cmd/migrate -command up
go run ./cmd/migrate -command status
```

The migrations create reproducible development fixtures, including:

```text
ANTB Engineering
└── Demo Laboratory
    ├── Demo Edge Gateway
    └── Control Node #1
        ├── relay_1       GPIO4
        ├── feedback_1    GPIO5
        └── door_contact  GPIO6
```

The seeded native device UUID is:

```text
00000000-0000-4000-8000-000000003000
```

### 4. Start the Go API

From `services/api` with `EDGEOPS_DATABASE_URL` still exported:

```bash
go run ./cmd/api
```

Verify the service:

```bash
curl http://localhost:8080/health
curl http://localhost:8080/ready
```

API resources:

- API base: `http://localhost:8080/api/v1`
- interactive API docs: [http://localhost:8080/docs](http://localhost:8080/docs)
- OpenAPI JSON: [http://localhost:8080/openapi.json](http://localhost:8080/openapi.json)
- OpenAPI YAML: [http://localhost:8080/openapi.yaml](http://localhost:8080/openapi.yaml)

### 5. Start the web application

From the repository root, in another terminal:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

The frontend uses `http://localhost:8080` by default. Override it when necessary:

```bash
EDGEOPS_API_URL='http://localhost:8080' pnpm dev
```

### 6. Stop local infrastructure

```bash
docker compose -f infra/docker/compose.yaml down
```

This keeps the named PostgreSQL and EMQX volumes. Add `-v` only when you intentionally want to delete local data.

## ESP32-C3 firmware

The native-node firmware lives in [`firmware/c3-node`](firmware/c3-node). It currently validates identity and connectivity, not GPIO channel runtime.

Enter the optional Nix development shell:

```bash
nix develop
```

Configure, build, flash, and monitor:

```bash
cd firmware/c3-node
idf.py set-target esp32c3
idf.py menuconfig
idf.py build
idf.py -p /dev/ttyACM0 flash monitor
```

The board may appear as `/dev/ttyUSB0` instead. Configure these values under `EdgeOps C3 Node`:

- Wi-Fi SSID and password;
- MQTT broker URI reachable from the ESP32;
- persisted EdgeOps Device UUID;
- optional device name and heartbeat period.

Do not use `localhost` in the device broker URI: on the ESP32 it refers to the ESP32 itself. Also note that the default Compose MQTT port is bound to host loopback for safe local development. A physical device requires an explicitly LAN-accessible broker listener and appropriate firewall rules; do not expose an unauthenticated development broker to an untrusted network.

Firmware topics for `{deviceId}`:

```text
edgeops/v1/devices/{deviceId}/up/presence
edgeops/v1/devices/{deviceId}/up/state
edgeops/v1/devices/{deviceId}/up/events       # reserved
edgeops/v1/devices/{deviceId}/up/telemetry    # reserved
edgeops/v1/devices/{deviceId}/down/commands   # reserved
edgeops/v1/devices/{deviceId}/down/config     # reserved
```

See [ESP32-C3 firmware documentation](docs/FIRMWARE_C3.md) for payloads, QoS/retain decisions, reconnect behavior, and EMQX validation steps.

## Verification

Frontend:

```bash
pnpm type-check
pnpm lint
pnpm build
```

Backend:

```bash
cd services/api
gofmt -w .
go vet ./...
go test ./...
go build -buildvcs=false ./...
```

PostgreSQL integration tests additionally use `EDGEOPS_TEST_DATABASE_URL`. Tests that need it are skipped when the variable is absent.

Firmware:

```bash
cd firmware/c3-node
idf.py build
```

## Architecture principles

- PostgreSQL is the system of record.
- The initial backend is a Go modular monolith.
- MQTT is the device/cloud transport; browsers do not connect to field MQTT topics.
- Physical Devices and semantic Assets are separate concepts.
- Customer commands never bypass Point Mapping to write raw protocol addresses directly.
- Delivered commands are not considered physically successful until feedback verifies the requested state.
- Gateways must eventually continue useful local operation during cloud outages.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Domain model](docs/DOMAIN_MODEL.md)
- [Data model](docs/DATA_MODEL.md)
- [Physical model](docs/PHYSICAL_MODEL.md)
- [Communication and MQTT conventions](docs/COMMUNICATION.md)
- [Backend](docs/BACKEND.md)
- [ESP32-C3 firmware](docs/FIRMWARE_C3.md)
- [Development workflow](docs/DEVELOPMENT_WORKFLOW.md)
- [Roadmap](docs/ROADMAP.md)
- [ADR: versioned device profiles](docs/adr/0002-versioned-device-profiles.md)

## Development security boundary

The current stack is designed for an isolated local development environment. Default database and dashboard credentials, unauthenticated plain MQTT, manual firmware configuration, and the temporary development principal are not production security mechanisms.

Production device connectivity will require TLS, unique device credentials or certificates, broker ACLs, secure provisioning, credential rotation, and audited authorization.

