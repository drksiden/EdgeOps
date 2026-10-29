# EdgeOps Roadmap

The roadmap prioritizes one complete vertical slice before breadth.

## Phase 0 — Repository audit and architecture freeze

Goal: understand the downloaded v0 frontend and establish the repository baseline without breaking it.

Tasks:

- inspect current repository structure;
- identify package manager and framework versions;
- map routes/components/mock-data structures;
- verify type-check/lint/build;
- compare current frontend domain model with architecture docs;
- create `docs/CODEBASE_AUDIT.md`;
- identify safe target repository structure;
- do not redesign or rewrite the frontend.

Exit criteria:

- current frontend verification status is known;
- gaps/conflicts are documented;
- next implementation step is agreed.

## Phase 1 — Backend foundation

Goal: create a minimal Go API and local infrastructure.

Tasks:

- add Go service skeleton;
- choose module/package layout consistent with `ARCHITECTURE.md`;
- local PostgreSQL via Docker Compose;
- local EMQX via Docker Compose;
- migration tooling;
- health/readiness endpoints;
- database connectivity;
- OpenAPI pipeline skeleton;
- Fumadocs app or docs plan only if it does not delay the vertical slice.

Exit criteria:

```text
GET /health
PostgreSQL connected
EMQX running
backend tests pass
```

## Phase 2 — Tenant + site model

Goal: replace the first slice of mock data with real persistence.

Implement:

- organizations;
- sites;
- basic users/memberships only as much as needed for development;
- seed/dev fixtures.

Do not build full authentication complexity yet if it blocks infrastructure work. Use a clearly temporary development identity strategy if required.

Exit criteria:

- frontend can list real Organizations/Sites from Go API;
- create/edit flow persists to PostgreSQL.

## Phase 3 — Device profiles and device commissioning

Goal: persist the physical model.

Implement:

- Device Profile;
- Device Profile Version;
- Channel Definition;
- Gateway;
- Device;
- Device Connection;
- Device Channel instantiation;
- Add Device / commissioning API;
- connection configuration model.

Initial supported protocol:

- Modbus RTU model/configuration.

Actual Modbus hardware connectivity can be simulated first.

Exit criteria:

```text
Select Device Profile
-> create Device
-> instantiate Channels
-> device appears Unmapped
```

## Phase 4 — Asset types, assets, points, mappings

Goal: persist the semantic model currently present in v0 mock data.

Implement:

- Asset Type;
- Asset Type Version;
- Point Definition;
- Asset;
- Asset Point;
- Point Mapping;
- compatibility validation;
- initial transforms: invert, scale, offset.

Exit criteria:

```text
Create Asset
-> instantiate Points
-> map Points to physical Channels
-> load resulting Asset from backend
```

## Phase 5 — MQTT gateway simulator

Goal: prove cloud-edge messaging before embedded firmware is complete.

Create a simple simulator capable of:

- connecting to EMQX;
- publishing presence;
- publishing channel telemetry;
- receiving generic commands;
- publishing command ACK;
- simulating connection loss.

Use Go, Python, or another simple implementation; this simulator is disposable test infrastructure, not the final Gateway.

Exit criteria:

```text
simulator -> MQTT -> backend -> DB -> frontend realtime
```

## Phase 6 — Telemetry and current state

Goal: complete the first half of the runtime path.

Implement:

- MQTT consumer;
- message envelope validation;
- channel resolution;
- Point Mapping transforms;
- `point_state`;
- `telemetry_samples`;
- frontend realtime updates;
- telemetry history API.

Exit criteria:

A simulated or real device value changes and the mapped Asset updates in the browser without refresh.

## Phase 7 — Commands end to end

Goal: complete the first full control loop.

Implement:

- semantic command endpoint;
- command persistence;
- physical target resolution;
- command outbox;
- MQTT command publisher;
- Gateway/simulator ACK;
- command state updates;
- UI pending/success/failure states;
- audit entry.

Exit criteria:

```text
Customer button
-> semantic command
-> MQTT
-> Gateway/simulator
-> ACK
-> UI result
```

## Phase 8 — Feedback verification and alarms

Goal: distinguish protocol success from physical success.

Implement:

- verification point relationship/rule;
- verification timeout;
- `VERIFIED` / `UNCONFIRMED` states;
- alarm generation;
- alarm acknowledgement;
- command + telemetry timeline.

Exit criteria:

A command can ACK successfully but still raise an alarm when expected feedback is absent.

## Phase 9 — Real ESP32-P4 + C6 gateway

Goal: replace/supplement simulator with reference embedded hardware.

Implement in ESP-IDF:

- provisioning/development configuration;
- MQTT/TLS connection;
- presence;
- config bundle application;
- local device/channel registry;
- Modbus RTU adapter;
- telemetry batching;
- command execution;
- command ACK;
- offline telemetry outbox;
- reconnect flush.

Exit criteria:

A real external Modbus controller or test slave can be monitored and controlled through EdgeOps.

## Phase 10 — Device lifecycle and OTA

Implement after core runtime is stable:

- firmware products/versions;
- artifact storage;
- deployments;
- staged rollout model;
- ESP32 OTA;
- health check;
- rollback reporting.

## Phase 11 — Documentation

Fumadocs becomes a first-class product surface.

Implement:

- concepts;
- engineer onboarding;
- commissioning guides;
- REST API reference from OpenAPI;
- MQTT/device contract docs;
- customer guides.

Documentation should begin earlier in small form, but this phase represents a polished product-ready docs surface.

## Phase 12 — Advanced features

Only after the core works:

- offline local automation;
- rule engine;
- Linux/Rust Edge Agent;
- SNMP adapters;
- Modbus TCP;
- advanced RBAC;
- reports;
- subscriptions/plan enforcement;
- on-premise deployment;
- native mobile commissioning app;
- predictive analytics.

## MVP definition

The diploma MVP does not require every roadmap phase.

A strong MVP includes:

- Organization/Site;
- Gateway;
- Device Profile/Device/Channels;
- Asset Type/Asset/Points/Mapping;
- MQTT telemetry;
- current state + history;
- semantic commands;
- ACK + feedback verification;
- alarms;
- one real ESP32/Modbus demonstration;
- working web UI.
