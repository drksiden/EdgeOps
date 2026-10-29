# AGENTS.md — EdgeOps

This file defines the working rules for AI coding agents and human contributors in this repository.

## 1. Project goal

EdgeOps is a distributed cloud-edge platform for centralized management of IoT and edge infrastructure.

The platform must support two different mental models at the same time:

- **Engineering model**: gateways, devices, protocols, channels, firmware, diagnostics, commissioning.
- **Customer model**: sites, assets, understandable states, controls, alarms, history, reports.

The core abstraction is:

```text
Device Profile -> Device -> Channel
                     |
                     v
               Point Mapping
                     |
                     v
Asset Type -> Asset -> Point -> Customer-facing UI
```

Raw protocol details must not leak into normal customer workflows unless explicitly requested through engineering drill-down.

## 2. Current repository state

The repository contains an approved frontend prototype originally generated in v0 and downloaded locally as `edge-ops-platform-architecture`.

Treat the existing frontend as an **approved product/design prototype**, not as disposable scaffolding.

Before changing frontend architecture:

1. inspect the existing routes, components, mock data, styles, and dependencies;
2. verify the project builds and type-checks;
3. document the impact of any proposed structural change;
4. prefer incremental refactors over rewrites.

Do not redesign the visual language unless explicitly asked.

## 3. Required reading before making architectural changes

Read these files first:

- `docs/ARCHITECTURE.md`
- `docs/DOMAIN_MODEL.md`
- `docs/DATA_MODEL.md`
- `docs/COMMUNICATION.md`
- `docs/ROADMAP.md`
- `docs/DEVELOPMENT_WORKFLOW.md`

If implementation and documentation disagree, stop and report the conflict before making a large architectural change.

## 4. Architecture invariants

Do not violate these without an explicit architecture decision.

### 4.1 Cloud

- Backend is a **Go modular monolith** for the initial product.
- PostgreSQL is the system of record.
- MQTT is the primary cloud-edge/device messaging transport.
- Browser clients do not connect directly to field-device MQTT topics.
- Browser realtime is delivered by the backend, initially through WebSocket or Server-Sent Events.
- Do not introduce microservices, Kafka, Kubernetes, or multiple databases without a demonstrated need.

### 4.2 Edge

- Edge gateways must continue useful local operation when the cloud is unavailable.
- A gateway owns local protocol adapters and translates generic EdgeOps operations to field protocols such as Modbus.
- External/legacy devices do not need EdgeOps firmware.
- Native EdgeOps devices may communicate directly using the EdgeOps device protocol.

### 4.3 Domain

Keep the physical and semantic models separate:

```text
Physical: Device Profile -> Device -> Channel
Semantic: Asset Type -> Asset -> Point
Binding:  Point Mapping
```

Never model `Asset == Device` as a general assumption.

A single Asset may use Points sourced from multiple Devices.

### 4.4 Commands

A customer action must resolve through the semantic model:

```text
Asset action
-> Point
-> Point Mapping
-> Device Channel
-> Gateway / Native Device
-> Protocol operation
```

Do not let normal customer code write raw Modbus addresses, GPIO numbers, or MQTT topics directly.

### 4.5 History and audit

Distinguish:

- `Event`: technical/system event.
- `Alarm`: condition requiring attention.
- `Audit Log`: who changed or controlled something.
- `Telemetry`: measured historical values.
- `Current State`: latest resolved state for fast UI access.

## 5. Planned technology stack

Use this unless the existing frontend proves a compatible equivalent is already in place.

### Frontend

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query
- TanStack Table
- ECharts for telemetry-oriented charts
- Fumadocs for product/API documentation

### Backend

- Go
- `net/http` + chi
- Huma for typed HTTP APIs and OpenAPI generation where practical
- pgx for PostgreSQL access
- SQL migrations
- modular monolith package structure

### Data and messaging

- PostgreSQL
- TimescaleDB only when telemetry volume/query requirements justify it
- EMQX as planned MQTT broker
- S3-compatible object storage for firmware and large artifacts

### Embedded / edge

- ESP32-P4 + ESP32-C6 reference gateway
- ESP-IDF
- Linux edge agent in Rust is a later extension, not an MVP requirement

## 6. Repository organization target

Do not move the current frontend blindly. First audit the existing repository.

The long-term target may resemble:

```text
/
  AGENTS.md
  apps/
    web/                 # EdgeOps platform frontend
    docs/                # Fumadocs
  services/
    api/                 # Go backend
  edge/
    gateway-esp32/       # ESP32-P4/C6 gateway firmware
    agent-rust/          # later Linux edge agent
  packages/
    contracts/           # OpenAPI/AsyncAPI/generated shared contracts
  infra/
    docker/
    migrations/
  docs/
```

The first agent must inspect whether the current frontend is already at repository root. Moving it is a separate migration task and must not be done merely to match this target tree.

## 7. Coding rules

### General

- Prefer boring, explicit, maintainable code.
- Avoid premature abstraction.
- Avoid hidden magic when protocol or safety behavior is involved.
- Use stable identifiers rather than display names for domain relationships.
- Do not store secrets in source control.
- Do not invent production credentials, private keys, certificates, or real customer data.

### TypeScript

- Keep strict TypeScript enabled.
- Avoid `any` unless isolated and justified.
- Keep server data types separate from transient UI state when possible.
- Reuse the approved design system instead of introducing a second UI component library.

### Go

- Keep HTTP handlers thin.
- Business logic belongs in application/domain packages, not handlers.
- Database access belongs behind focused repositories/query modules.
- Pass `context.Context` through request, DB, and message flows.
- Return typed/domain errors and translate them at boundaries.
- Do not build generic repository abstractions before there is a concrete need.

### Database

- All schema changes use migrations.
- Prefer explicit SQL.
- Add foreign keys and meaningful unique constraints.
- Include `created_at` / `updated_at` where domain history benefits from them.
- Tenant-sensitive queries must be scoped by organization/site ownership, not only by client-side filtering.

## 8. Testing expectations

For each non-trivial change, run the applicable checks.

Frontend, depending on existing package manager/scripts:

```text
type-check
lint
build
relevant tests
```

Backend once created:

```text
go test ./...
go vet ./...
```

Do not claim verification that was not actually run.

For critical command/device flows, prefer integration tests over only unit tests.

## 9. Documentation discipline

If a change modifies one of these, update the matching docs in the same task:

- domain entities;
- command lifecycle;
- MQTT topics/messages;
- API contracts;
- database schema;
- repository structure;
- roadmap milestone status.

Generated OpenAPI documentation does not replace conceptual documentation.

## 10. Agent workflow

Every substantial task should follow this order:

1. Inspect current implementation.
2. Read relevant docs.
3. State assumptions.
4. Make the smallest coherent change.
5. Run verification.
6. Summarize files changed, decisions made, and remaining risks.

For large changes, write or update an architecture note before implementation.

## 11. Things agents must not do without explicit approval

- Rewrite the existing frontend from scratch.
- Replace the current design system.
- Introduce microservices.
- Introduce Kubernetes.
- Add Kafka/NATS/Redis merely because they are common infrastructure tools.
- Change the core Device/Channel/Point/Asset abstraction.
- Bypass Point Mapping for customer commands.
- Couple Assets directly to one Device as a universal rule.
- Add payment processing.
- Implement cloud-dependent safety-critical automation.
- Treat a delivered field command as proof that the physical equipment reached the requested state.

## 12. Definition of the first working vertical slice

The first end-to-end milestone is complete when a real or simulated field device can follow this path:

```text
Organization
-> Site
-> Gateway
-> Device Profile
-> Device
-> Channel
-> Asset Type
-> Asset
-> Point Mapping
-> Telemetry over MQTT
-> Go backend
-> PostgreSQL current state/history
-> Realtime frontend
-> Customer command
-> Go command record
-> MQTT command
-> Gateway protocol write
-> ACK
-> feedback verification
```

Do not prioritize broad feature count over completing this path.
