# EdgeOps Development Workflow

## 1. Principle

Build vertical slices, not disconnected layers.

Bad order:

```text
finish entire database
finish entire backend
finish entire frontend
finish firmware
integrate everything at the end
```

Preferred order:

```text
small domain slice
-> persistence
-> API
-> UI
-> MQTT/edge path
-> test end to end
```

## 2. Development environments

### Local infrastructure

Planned through Docker Compose:

```text
PostgreSQL
EMQX
optional object storage later
```

### Frontend

Use the existing v0 project as the approved baseline.

Do not move it until the codebase audit determines the safest repository migration plan.

### Backend

Go service with a modular monolith structure.

### Edge simulation

Before embedded firmware is ready, maintain a small Gateway simulator for integration testing.

This lets backend/device protocol work continue independently of hardware availability.

## 3. Branch/task discipline

Each task should have one main architectural purpose.

Examples:

```text
feat: persist device profiles
feat: add asset mapping API
feat: ingest gateway telemetry
feat: implement command outbox
```

Avoid one agent task that simultaneously:

- reorganizes the repo;
- changes the design system;
- adds authentication;
- adds MQTT;
- rewrites mock data;
- introduces a new database library.

## 4. Architecture decision process

For decisions that change a project invariant, write a short ADR or update the architecture docs before implementation.

Examples:

- changing MQTT topic namespace;
- replacing PostgreSQL;
- splitting the Go modular monolith;
- changing the Point Mapping model;
- moving transforms from cloud to edge;
- switching frontend state/data strategy.

An ADR can be short:

```text
Context
Decision
Alternatives
Consequences
```

## 5. API-first boundaries

The UI should not import backend implementation concepts directly.

Prefer explicit contracts:

```text
REST/OpenAPI
Realtime message schema
MQTT message schema
```

Frontend mock data should gradually be replaced by API adapters without destroying the existing page/component structure.

## 6. Database workflow

For every persistent feature:

1. define domain behavior;
2. design migration;
3. add constraints/indexes;
4. add query/repository code;
5. add service logic;
6. add API;
7. add integration tests;
8. wire frontend.

Do not use JSONB merely to avoid modeling stable relational data. Use JSONB for protocol-specific metadata and extensible payloads.

## 7. Device protocol workflow

For every MQTT message type:

1. define schema;
2. define idempotency expectations;
3. define QoS expectation;
4. define retry/timeout behavior;
5. define observability/logging;
6. test with simulator;
7. implement on real gateway.

## 8. Frontend migration from mocks

Do not delete all mock data at once.

Recommended sequence:

```text
Sites API
-> Device/Profile API
-> Asset/Mapping API
-> Runtime state API
-> Telemetry API
-> Command API
```

Keep the existing visual pages functional during migration where practical.

## 9. First vertical slice

The first implementation target should demonstrate:

```text
1. Create Site.
2. Create Gateway.
3. Create Device from Device Profile.
4. Device gets Channel instances.
5. Create Asset from Asset Type.
6. Map Asset Points to Device Channels.
7. Simulator publishes channel telemetry.
8. Backend resolves it to semantic Point state.
9. Frontend updates realtime.
10. Customer sends a semantic command.
11. Backend resolves Point -> Channel.
12. Simulator receives command and ACKs it.
13. Feedback confirms requested state.
14. Command becomes VERIFIED.
```

Do not proceed to OTA or advanced automation before this flow is reliable.

## 10. Observability from the start

At minimum, backend logs should carry structured context such as:

```text
request_id
organization_id
site_id
gateway_id
device_id
command_id
message_id
```

Do not log secrets or full sensitive credential payloads.

## 11. Documentation maintenance

Update docs with implementation changes.

When APIs stabilize:

```text
Go/Huma -> OpenAPI -> Fumadocs API reference
```

When MQTT contracts stabilize:

```text
Message schemas -> AsyncAPI or equivalent -> device docs
```

Conceptual docs remain hand-written because generated reference docs do not explain system intent.
