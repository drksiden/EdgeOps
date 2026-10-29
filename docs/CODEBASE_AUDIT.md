# EdgeOps Codebase Audit

Audit date: 2026-09-23

> This document records the pre-backend baseline. Phase 1 subsequently added the Go API and local PostgreSQL/EMQX foundation described in [BACKEND.md](./BACKEND.md); the frontend findings remain a historical snapshot.

## 1. Executive summary

The repository is a frontend-only Next.js App Router prototype located at the repository root. It is not currently a monorepo, despite the presence of `pnpm-workspace.yaml`. The approved visual system and most planned product surfaces already exist as static or locally interactive screens.

The prototype contains two strong product ideas that should be preserved:

- a clear distinction between engineering views of profiles, devices, raw channels, and mappings and customer views of assets, states, controls, and alarms;
- an asset creation workflow that starts from an Asset Type, instantiates its expected Points conceptually, and allows those Points to be bound to Channels from multiple Devices at the same Site.

The largest architectural problem is not visual. The mock layer contains two competing mapping models:

1. a legacy model that stores semantic fields such as `pointName`, `pointType`, and `assetId` directly on each `Channel`; and
2. a newer, architecture-aligned `AssetType` / `PointSpec` / `PointMapping` model.

The main Asset detail screen still reads the legacy Channel-embedded model. The newer `pointMappings` collection and `resolvedPointsForAsset()` helper are not used by any screen. This creates contradictory UI behavior and must not be copied into backend contracts.

Phase 0 baseline hardening resolved the `/assets/new` Suspense failure, added strict type-check and lint scripts, configured ESLint, and removed the production build's type-error suppression. Type-check and lint now pass. A complete webpack production build passes; the normal Turbopack build remains blocked in the audit environment because its CSS worker is not permitted to bind a local port. Automated tests are still not configured.

## 2. Audit scope and assumptions

This audit inspected `AGENTS.md`, every existing architecture document under `docs/`, all application routes, shared components, configuration, dependency metadata, and the complete mock-data module.

Assumptions:

- The current UI, layout, styling, navigation, and route structure are approved product work.
- Inert buttons and local-only mutations are prototype behavior, not promises of completed functionality.
- Exact database/API contracts should follow the documented versioned physical and semantic model rather than serializing the current mock objects verbatim.
- No source files should be moved during Phase 0.

The checkout contains an empty/read-only `.git` directory and `git status` reports that this is not a Git repository. Consequently, no commit history or tracked-file baseline was available for the audit.

## 3. Current stack and versions

Versions below distinguish manifest constraints from versions actually installed in `node_modules`.

| Area | Current baseline |
| --- | --- |
| Runtime observed during audit | Node.js `24.18.0` |
| Package manager | pnpm `12.3.4`, declared by `packageManager` and observed locally |
| Framework | Next.js `16.3.3`, App Router |
| UI runtime | React `19.2.4`, React DOM `19.2.4` (manifest uses `^19`) |
| Language | TypeScript `5.7.3`, `strict: true`, `noEmit: true` |
| Linting | ESLint `9.39.5` with `eslint-config-next` `16.3.3`, Core Web Vitals, and TypeScript rules |
| Styling | Tailwind CSS `4.3.3`, CSS-first configuration through `app/globals.css` |
| PostCSS | PostCSS `8.5.6`, `@tailwindcss/postcss` `4.3.3` |
| shadcn/ui | `components.json` uses the `base-nova` style, RSC and TSX; installed `shadcn` CLI is `4.19.0` |
| Component primitive | `@base-ui/react` `1.5.0` is used by the Button component |
| Icons | `lucide-react` `1.17.0` |
| Theme | `next-themes` `0.4.6`; dark mode is the default |
| Utility styling | `class-variance-authority`, `clsx`, `tailwind-merge`, `tw-animate-css` |
| Analytics | `@vercel/analytics` `1.6.1`, rendered only in production |

Important stack observations:

- Tailwind v4 is configured in CSS with `@import 'tailwindcss'`; there is intentionally no `tailwind.config.*` file.
- shadcn configuration and local `components/ui/*` components exist, but this is a small curated/customized component set rather than a large generated registry.
- `shadcn` is currently a production dependency even though it is primarily a development CLI.
- TanStack Query, TanStack Table, ECharts, Fumadocs, an HTTP client, and a realtime client are not installed.
- Tables are local presentational components. Charts are deterministic inline SVGs, not ECharts.
- Fonts use `next/font/google` for Geist and therefore require Google Fonts access during a clean production build.

## 4. Package manager and scripts

`pnpm-lock.yaml` is present and uses lockfile format `9.0`. Phase 0 added the matching Next.js ESLint configuration and records the transitive `unrs-resolver` build as intentionally disabled because the packaged native binding is sufficient for linting.

Available scripts:

| Script | Command |
| --- | --- |
| `dev` | `next dev` |
| `type-check` | `tsc --noEmit` |
| `lint` | `eslint .` |
| `build` | `next build` |
| `start` | `next start` |

There is no `test` script. `pnpm-workspace.yaml` contains pnpm settings but no `packages:` declaration, so it does not currently define workspace packages.

## 5. Actual repository tree

The Next.js application lives at the repository root. There is no `src/` directory and no `apps/web/` directory.

```text
/
├── AGENTS.md
├── app/
│   ├── layout.tsx
│   ├── globals.css
│   └── (workspace)/
│       ├── layout.tsx
│       ├── page.tsx
│       ├── alarms/page.tsx
│       ├── asset-types/page.tsx
│       ├── asset-types/[id]/page.tsx
│       ├── assets/page.tsx
│       ├── assets/new/page.tsx
│       ├── assets/[id]/page.tsx
│       ├── audit/page.tsx
│       ├── device-profiles/page.tsx
│       ├── device-profiles/[id]/page.tsx
│       ├── devices/page.tsx
│       ├── devices/[id]/page.tsx
│       ├── firmware/page.tsx
│       ├── gateways/page.tsx
│       ├── gateways/[id]/page.tsx
│       ├── settings/page.tsx
│       ├── sites/page.tsx
│       ├── sites/[id]/page.tsx
│       └── users/page.tsx
├── components/
│   ├── ui/
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── table.tsx
│   │   └── tabs.tsx
│   ├── abstraction-trail.tsx
│   ├── activity-timeline.tsx
│   ├── app-shell.tsx
│   ├── app-sidebar.tsx
│   ├── asset-type-visuals.tsx
│   ├── command-palette.tsx
│   ├── empty-state.tsx
│   ├── health-indicator.tsx
│   ├── metric-card.tsx
│   ├── organization-switcher.tsx
│   ├── page-header.tsx
│   ├── property-list.tsx
│   ├── resource-bar.tsx
│   ├── status-badge.tsx
│   ├── telemetry-chart.tsx
│   ├── theme-provider.tsx
│   ├── theme-toggle.tsx
│   ├── top-bar.tsx
│   └── user-menu.tsx
├── lib/
│   ├── mock-data.ts
│   ├── nav.ts
│   └── utils.ts
├── docs/
│   ├── ARCHITECTURE.md
│   ├── COMMUNICATION.md
│   ├── DATA_MODEL.md
│   ├── DEVELOPMENT_WORKFLOW.md
│   ├── DOMAIN_MODEL.md
│   ├── ROADMAP.md
│   ├── CODEBASE_AUDIT.md
│   └── BASELINE.md
├── public/
│   └── icons, logos, and v0 placeholder assets
├── components.json
├── eslint.config.mjs
├── next.config.mjs
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── postcss.config.mjs
└── tsconfig.json
```

Generated/local directories `node_modules/` and `.next/` were present before verification. `.agents/`, `.codex/`, and `.git/` are empty environment placeholders.

## 6. Existing routes and core screens

The `(workspace)` route group does not appear in URLs. Nineteen page routes exist.

| Route | Screen and current behavior |
| --- | --- |
| `/` | Fleet overview: summary metrics, deterministic telemetry graphic, sites needing attention, alarms, and activity. |
| `/sites` | Site table. Search and filter controls are visual only; Add Site is inert. |
| `/sites/[id]` | Site detail with Assets, Devices, Gateways, and Alarms tabs. |
| `/assets` | Customer-facing asset cards with current-looking status and metrics; filters are visual only. |
| `/assets/new` | Four-step Asset Type -> details -> Point bindings -> review wizard. It supports Points sourced from multiple Devices at one Site, but “create” only changes local state. |
| `/assets/[id]` | Customer status/control view plus engineer provenance, telemetry, activity, and alarms. Commands mutate local state only. |
| `/asset-types` | Asset Type catalog with Point summaries. New Asset Type is inert. |
| `/asset-types/[id]` | Point contract and deployed Asset instances, with a link into `/assets/new?type=...`. |
| `/alarms` | Locally interactive Active/Acknowledged/Resolved/All views. Acknowledge and Resolve mutate component state only. |
| `/devices` | Searchable/filterable Device table. Add Device is inert. |
| `/devices/[id]` | Device identity, connection, raw Channels, mapping editor, mapping preview, and mock telemetry. Mapping changes are local only. |
| `/device-profiles` | Device Profile catalog. New Profile is inert. |
| `/device-profiles/[id]` | Profile metadata, Channel template, and applied Devices. |
| `/gateways` | Gateway cards with connection, local buffering, resource, and MQTT presentation. |
| `/gateways/[id]` | Gateway resource history, details, and local Device table. |
| `/firmware` | Firmware build catalog and adoption; Upload/Deploy controls are inert. There is no Deployments route. |
| `/users` | Users and free-form scoped roles; Invite/Manage controls are inert. |
| `/audit` | Static audit table; Export CSV is inert. |
| `/settings` | General, connectivity, notifications, and API-key tabs. Inputs/toggles are local; save/create/revoke actions are inert. |

All specifically requested surfaces exist: `/device-profiles`, `/asset-types`, `/assets/new`, Device detail, mapping UI, alarms, gateways, firmware, users, audit, and settings. Mapping UI exists in two places: the Device detail “Point mapping” tab and the asset creation wizard.

Missing planned surfaces include Deployments, Organizations/platform administration, authentication, API routes, reports, and product/API documentation.

## 7. Important shared components

- `AppShell`, `AppSidebar`, and `TopBar` implement the responsive workspace shell and navigation.
- `OrganizationSwitcher`, `UserMenu`, `ThemeToggle`, and `CommandPalette` provide global interactions.
- `AbstractionTrail` visibly reinforces Hardware -> Channel -> Point -> Asset -> Customer.
- `PageHeader`, `MetricCard`, `PropertyList`, `HealthIndicator`, `StatusBadge`, `ActivityTimeline`, and `EmptyState` provide the product visual vocabulary.
- `TelemetryChart` is a lightweight server-renderable SVG chart with deterministic generated data.
- `components/ui/*` contains the approved local Button, Badge, Card, Input, Table, and Tabs implementations.
- `asset-type-visuals.tsx` maps semantic Asset Type icons and Point roles to presentation.

`components/ui/tabs.tsx` is a custom context/state implementation rather than a complete accessible tab primitive. It provides roles and selection state but no keyboard arrow behavior or tab/panel relationships.

## 8. Mock data, domain types, and current state ownership

Nearly all domain types, fixture data, selectors, transforms, and generated chart series live together in `lib/mock-data.ts` (1,149 lines). Navigation metadata lives in `lib/nav.ts`. Settings-page fixtures such as API-key prefixes live directly in that page rather than in the mock module.

There is no API call, Server Action, route handler, WebSocket, EventSource, MQTT browser client, query cache, or persistence layer.

Interactive state is implemented with React local state:

- Device filters: `useState` + `useMemo`.
- Alarm acknowledgement/resolution: a component-local copy of the mock array.
- Device mapping: a component-local Channel working copy with dirty/saved flags.
- Asset creation: component-local wizard state and binding records.
- Asset commands: component-local pending dialog, boolean command state, and activity list.
- Settings, menus, organization selection, tabs, mobile navigation, and palette: component/context local state.
- Theme persistence is delegated to `next-themes`.

All domain mutations disappear after refresh/navigation. The Organization switcher changes only its own label and does not scope any route data.

## 9. Current frontend domain model

### 9.1 Tenant and site

| Concept | Current representation | Notes |
| --- | --- | --- |
| Organization | `Organization` | Includes UI aggregate counts, plan, and health. |
| Site | `Site` | Stores `org` as a display-name string, not `organizationId`. Counts are denormalized mock values. |
| User/membership | `User.scopes[]` | Scope and role are free-form strings; there is no Membership entity or stable scope identifier. |

### 9.2 Physical model

| Concept | Current representation | Notes |
| --- | --- | --- |
| Device Profile | `DeviceProfile` | Has `id`, `name`, `vendor`, `protocol`, `transport`, description, and embedded Channel templates. No version entity/status. |
| Channel Definition | `ProfileChannel` | Has `ref`, `interface`, `writable`, and optional unit. It lacks a stable key, data type, access enum, and metadata. |
| Gateway | `Gateway` | Captures Site, hardware/software, connectivity, resources, MQTT state, buffering, uptime, and IP. |
| Device | `Device` | References unversioned `profileId`, Site, and Gateway and embeds protocol/network/serial fields plus concrete Channels. |
| Device Connection | Not separated | IP/MAC/RSSI/transport/slave/serial are generic Device fields. |
| Device Channel | `Channel` inside `Device.channels` | Combines physical definition, live value, transform, display label, and legacy semantic mapping state. Channel IDs are only safe in combination with Device ID. |

### 9.3 Semantic model

| Concept | Current representation | Notes |
| --- | --- | --- |
| Asset Type | `AssetType` | Good semantic template with category, icon, description, and Point Specs. No version entity/status. |
| Point Definition | `PointSpec` | Architecture-aligned stable key, role, type, access, unit, required flag, and description. |
| Asset | `Asset` | References unversioned `typeId` and Site, but also has a single required `deviceId`, which conflicts with multi-Device Assets. Current state/health/metrics are embedded display fields. |
| Asset Point | Not persisted explicitly | Conceptually represented by an Asset Type `PointSpec` joined to an Asset. The legacy `Point` type is instead derived from a Channel and uses the Channel ID as its own ID. |
| Point Mapping | `PointMapping` | Separate binding from Asset + Point key to Device + Channel, with inversion. It has no scale/offset, ownership, timestamps, or concrete Asset Point ID. |

### 9.4 Two competing Point/Mapping paths

The legacy path is:

```text
Device.Channel
  + pointName
  + pointType
  + assetId
  + inverted/scale
-> pointsForAsset()
-> Asset detail screen
```

The newer path is:

```text
Asset.typeId
-> AssetType.PointSpec
-> PointMapping(assetId, pointKey, deviceId, channelId)
-> resolvedPointsForAsset()
```

No page calls `resolvedPointsForAsset()`, `mappingsForAsset()`, or `mappedDevicesForAsset()`. The asset creation wizard constructs compatible binding-shaped local state but does not persist it. Device detail edits only Channel-embedded semantic fields and can create an Asset option with a name but no Asset Type.

This produces concrete contradictions:

- Main Pump has multi-Device records in `pointMappings`, but its Asset detail page sees no Points because `pointsForAsset()` reads Channel fields instead.
- Several Devices share the same `relayChannels` array and repeated Channel IDs, making Channel-embedded mappings unsafe as independent instance state.
- `Asset.deviceId` suggests one Device even though Main Pump is deliberately modeled across two Devices.
- A device-oriented mapping can invent a Point name/type directly, bypassing the Asset Type version and Point Definition contract.

The backend must choose the documented model as the single source of truth:

```text
Asset -> Asset Point -> Point Mapping -> Device Channel
```

Device-oriented and asset-oriented mapping screens can both remain, but both must operate on that same resource model.

## 10. Concepts already modeled well

The prototype already expresses several architectural decisions correctly:

- Physical hardware concepts and semantic customer concepts are visually distinct.
- Device Profiles describe reusable hardware capability, while Asset Types describe reusable semantic contracts.
- Assets are presented in customer language while engineer views preserve raw Channel provenance.
- The asset creation wizard limits candidates to Devices at the selected Site.
- Required versus optional Points are visible during creation.
- A single Asset can source Points from multiple Devices; Main Pump is the explicit example.
- Writable semantic intent is filtered toward writable Channels.
- Inversion is exposed as a mapping transform.
- Gateways visibly support offline buffering/store-and-forward.
- Alarm acknowledgement, firmware catalog, audit history, and telemetry/current-looking state have separate product surfaces.
- The command confirmation copy acknowledges edge delivery rather than claiming physical success, and the alarm fixtures include a missing-feedback scenario.

These product concepts should be preserved even where the current fixture shape is replaced.

## 11. Differences from the planned architecture

### 11.1 Naming and representation conflicts

- `DeviceProfile.vendor` versus documented `manufacturer`.
- `ProfileChannel.ref/interface/writable` versus documented Channel Definition `key/kind/data_type/access/address_text`.
- Legacy `PointType` values (`Boolean Control`, `Boolean State`, `Analog`) overlap and conflict with the richer `PointRole`, `PointDataType`, and `PointAccess` dimensions.
- Legacy `PointDirection.feedback` is presentation terminology; the domain role is documented as `status`.
- `Asset.deviceId` encodes a false one-Asset-to-one-Device assumption.
- `Site.org` and `User.scopes` use display strings where the backend needs stable IDs and Membership/access records.
- Device and Asset reference unversioned Profile/Type IDs rather than immutable published versions.
- Protocol-specific connection fields are stored directly on Device rather than in Device Connection.
- `PointMapping` targets an Asset + Point key rather than a concrete Asset Point.

### 11.2 Missing domain distinctions

- Device Profile Version and Asset Type Version.
- Stable Channel Definition and concrete Device Channel identity separation.
- Concrete Asset Point records.
- Device Connection.
- Organization Membership.
- Point State separate from Telemetry Sample history.
- Durable Command and its lifecycle, target snapshot, ACK, verification, timeout, and failure.
- Technical Event separate from the UI-only `ActivityEvent` union.
- Firmware Product, Artifact, Deployment, target, and deployment event separation.
- Tenant ownership and authorization boundaries.

### 11.3 Backend-hostile frontend assumptions

- A single module is simultaneously database fixture, domain model, API substitute, selector layer, transform layer, and chart generator.
- Pages import mutable-looking global arrays directly instead of accessing a data boundary.
- Denormalized display counts and state can disagree with the fixture records.
- Mock Site/Gateway consistency is not enforced: for example, `dev-batt02` belongs to `site-serverroom` but references `gw-01` at `site-bca`, and `dev-relay12` belongs to `site-lab` but references the warehouse gateway.
- Mapping compatibility checks only writability. They do not yet enforce data type, role, units, ranges, uniqueness, or same-Site ownership comprehensively.
- Read Points currently allow any Channel, including an incompatible data type.
- Writable Channel single-authority constraints are not represented.
- The asset command UI flips local desired state immediately; it has no queued/dispatched/acknowledged/verified distinction.
- The customer command confirmation names the raw Channel address and Device. That provenance belongs in an explicit engineering drill-down, not the normal customer action flow.
- Organization switching does not scope any data.
- “Live” telemetry and state labels are static/deterministic.

### 11.4 Planned frontend tools not yet present

- TanStack Query is absent because there is no server state yet.
- TanStack Table is absent; current tables are straightforward static tables.
- ECharts is absent; the inline SVG chart is sufficient for the prototype but not for rich telemetry interactions.
- Fumadocs is absent.

These are gaps, not immediate reasons to replace working UI. Add each tool when its real use case arrives.

## 12. Ideas the architecture docs should absorb from the prototype

The implementation should not be forced blindly into the current conceptual documents. Before persistence contracts are finalized, consider documenting these useful prototype ideas:

1. **Asset Type presentation metadata.** Preserve `category`, a stable visual icon key, and Point descriptions in either first-class columns or clearly governed metadata. They materially support the approved UI.
2. **Commissioning lifecycle.** Define whether an Asset may exist as a draft with missing required mappings, or whether creation and required mappings are atomic. The wizard currently requires every required Point before creation.
3. **Two mapping entry points.** Support both the Asset-centric wizard and Device-centric engineering view, but state that each edits the same Asset Point / Point Mapping records. Device-centric mapping must select an existing Point Definition/Asset Point rather than inventing a parallel Point.
4. **Presentation label versus domain role.** The UI can call a `status` Point “Feedback” where that is clearer to installers without changing the stored role vocabulary.
5. **Engineer provenance drill-down.** Preserve the UI’s visible chain from semantic Point to Device Channel, while keeping that detail out of routine customer controls.

No architecture document was changed during this audit; these are proposed clarifications for a later contract/ADR task.

## 13. Verification results

| Check | Command | Result |
| --- | --- | --- |
| Dependency state | `pnpm install --offline --frozen-lockfile` | Passed. The lockfile and installed dependency graph are consistent. |
| Strict type-check | `pnpm type-check` | Passed with exit code 0 and no diagnostics. |
| Lint | `pnpm lint` | Passed with exit code 0 and no warnings. |
| Configured production build | `pnpm build` | Environment-blocked before application compilation. Turbopack's PostCSS worker cannot bind a required local port (`Operation not permitted`), including in the network-enabled execution context. |
| Diagnostic production build | `pnpm exec next build --webpack` | Passed completely: compilation, TypeScript validation, page-data collection, and all 15 static page generations succeeded. `/assets/new` now prerenders successfully. |
| Tests | Not run | No test script, test dependency, or test files exist. |

`typescript.ignoreBuildErrors` has been removed. Production builds now run real TypeScript validation.

Overall verification status: **type-check passes; lint passes; the full webpack production build passes; the default Turbopack build is environment-blocked; tests are unavailable.**

## 14. Risks and technical debt

### High priority

- Duplicate, contradictory Point/Mapping models are the largest risk to API and schema design.
- No automated test guardrail exists.
- Asset, Point, mapping, command, current-state, and telemetry shapes are mixed with transient display state.
- Mock tenant/site/gateway relationships are not consistently referentially valid.

### Medium priority

- `lib/mock-data.ts` (1,149 lines) and Device detail (approximately 840 lines) are large multi-responsibility files.
- Many visible action controls are inert; others give a temporary success impression without persistence.
- Site and Asset search/filter controls are visual only, while Device filters work.
- The Device detail mapping editor can create an untyped Asset name, bypassing Asset Type semantics.
- Only inversion is represented on `PointMapping`; scale is on Channel and offset is absent.
- Reused `relayChannels` objects mean several Device fixtures do not have independent Channel instances.
- Root layout has v0 generator metadata, the package is still named `my-project`, and placeholder public assets remain.
- Settings fixtures live in the page rather than the mock/data boundary.
- Clean builds depend on external Google Fonts availability; self-hosting should be considered for reproducibility.
- The hand-built Tabs component has incomplete keyboard/accessibility behavior.

### Lower priority until backend integration

- The compatible Next.js 16.3.3 lint stack currently uses ESLint 9.39.5, which pnpm marks as deprecated; revisit ESLint 10 when the bundled React plugin declares support.
- No loading, error, stale, optimistic, or reconnect state conventions exist.
- No API DTO/domain/display-model separation exists.
- No pagination exists for fleet-scale lists.
- There is no frontend environment configuration or API base URL.
- There is no visual regression or end-to-end coverage for the approved UI.

## 15. Recommended repository organization

The safest near-term structure is additive. Keep the approved Next.js application at root while Phase 1 introduces backend and local infrastructure beside it:

```text
/
├── app/                     # existing Next.js application; unchanged location
├── components/              # existing approved UI/design system
├── lib/                     # existing frontend code; split incrementally later
├── public/
├── package.json
├── pnpm-lock.yaml
├── services/
│   └── api/
│       ├── cmd/api/
│       ├── internal/        # modular-monolith application/domain/adapters
│       ├── migrations/      # or a documented infra/migrations location, not both
│       └── go.mod
├── infra/
│   └── docker/
│       └── compose.yaml     # PostgreSQL and EMQX for local development
├── packages/
│   └── contracts/           # add when OpenAPI/generated artifacts actually exist
└── docs/
```

Reasons to keep the web app at root for now:

- all imports, shadcn aliases, CSS paths, public assets, lockfile, and deployment assumptions are root-based;
- the repository is not yet a functioning pnpm monorepo;
- moving it adds no value to the first backend health/database/broker milestone;
- a move would obscure whether failures came from baseline code or repository migration.

An eventual `apps/web` move can still be appropriate when a second JavaScript app such as Fumadocs is introduced. It should be a dedicated migration with updated pnpm workspace packages, path aliases, CI/build commands, deployment roots, documentation, and a before/after UI verification pass.

## 16. Migration plan: mocks to backend without breaking the UI

### Step 0: make the baseline enforceable

- Completed: fixed the `/assets/new` Suspense build failure without visual changes.
- Completed: added explicit `type-check` and `lint` scripts with matching Next.js/TypeScript lint configuration.
- Completed: removed `ignoreBuildErrors`; the diagnostic production build performs and passes real TypeScript validation.
- Deferred: add route smoke or visual regression coverage when the project introduces its first test framework.

### Step 1: bootstrap infrastructure beside the root frontend

- Add `services/api` as a Go modular monolith.
- Add local PostgreSQL and EMQX under `infra/docker`.
- Add health/readiness, database connectivity, SQL migrations, and an OpenAPI skeleton.
- Do not move or re-style the frontend in this step.

### Step 2: establish one frontend data boundary

- Separate API DTOs, domain/view models, and transient UI state.
- Introduce focused frontend data modules by resource rather than one generic repository abstraction.
- Keep mock fixtures behind the same resource interfaces for tests and unfinished routes.
- Cut over one resource/route at a time; do not maintain two writable sources of truth for the same route.
- Add TanStack Query when the first client-side server mutation/revalidation flow needs it, not as a blanket rewrite of server-renderable pages.

### Step 3: migrate tenant and Site data first

- Implement Organization/Site persistence and a temporary explicit development identity.
- Replace Site list/detail reads and create/edit operations while leaving unrelated screens on fixtures.
- Make organization selection a real stable-ID scope and enforce that scope in backend queries.

### Step 4: migrate the physical model

- Persist Device Profile, immutable Profile Version, Channel Definitions, Gateway, Device, Device Connection, and concrete Device Channels.
- Adapt existing Device/Profile/Gateway pages to API responses without changing their layouts.
- Treat protocol connection details as engineer-only data.

### Step 5: converge the semantic model before wiring mapping mutations

- Persist Asset Type Version, Point Definitions, Asset, concrete Asset Points, and Point Mappings.
- Remove `Asset.deviceId` from the authoritative contract.
- Make both `/assets/new` and the Device detail mapping tab edit the same mapping API.
- In the Device detail mapping flow, select an existing compatible Asset Point instead of creating arbitrary semantic fields on a Channel.
- Validate organization, Site, data type, access, role, unit, and writable-channel authority in the backend.

### Step 6: migrate runtime reads

- Add Point State and Telemetry APIs.
- Replace embedded Asset metrics and deterministic charts with API-backed current state/history.
- Add WebSocket or SSE from the Go backend for realtime UI updates; the browser must not subscribe to field MQTT topics.
- Introduce ECharts only where telemetry interaction requirements exceed the current lightweight chart.

### Step 7: migrate commands safely

- Submit semantic commands using Asset Point IDs and requested values only.
- Resolve Point Mapping to Device Channel in the backend and persist the physical target snapshot.
- Show queued, dispatched, acknowledged, verified/completed, and failed/unconfirmed states distinctly.
- Keep raw protocol addresses in engineer provenance, not normal customer confirmation text.

### Step 8: alarms, events, audit, firmware

- Migrate these after the first runtime control loop works.
- Keep Event, Alarm, Audit Log, Telemetry, and Current State as separate resources.
- Defer full firmware deployment implementation until the telemetry/command vertical slice is reliable, as required by the roadmap.

### Step 9: remove mocks deliberately

- Retain small typed fixtures for component/tests if useful.
- Remove production route imports from the monolithic mock module only after each route has an API-backed replacement.
- Split the remaining fixture/domain/view-model concerns rather than performing a bulk rewrite.

## 17. Recommended next implementation task

Begin Roadmap Phase 1 by adding `services/api` and `infra/docker` beside the root frontend, with Go health/readiness endpoints, PostgreSQL connectivity/migrations, and local EMQX. Do not move the frontend into `apps/web` during that task.

Before the first Asset/Mapping API is designed, record one explicit contract decision: the authoritative path is Asset -> Asset Point -> Point Mapping -> Device Channel, and Channel-embedded semantic mapping fields are prototype-only legacy state.
