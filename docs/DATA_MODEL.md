# EdgeOps Data Model v1

This document defines the intended PostgreSQL model at the conceptual level. It is not yet a migration file.

## 1. Tenant and access tables

### `users`

```text
id
email
display_name
status
created_at
updated_at
```

### `organizations`

```text
id
name
slug
status
created_at
updated_at
```

### `memberships`

```text
id
user_id -> users.id
organization_id -> organizations.id
role
created_at
```

Later, site-scoped permissions can be modeled separately instead of encoding all access into one role column.

### `sites`

```text
id
organization_id -> organizations.id
name
timezone
address_text
status
created_at
updated_at
```

## 2. Physical model tables

### `device_profiles`

```text
id
manufacturer
name
model
description
created_at
updated_at
```

### `device_profile_versions`

```text
id
device_profile_id -> device_profiles.id
version
protocol
transport
status
published_at
created_at
```

Recommended unique constraint:

```text
(device_profile_id, version)
```

### `channel_definitions`

```text
id
profile_version_id -> device_profile_versions.id
key
name
kind
data_type
access
address_text
unit
metadata jsonb
created_at
```

Recommended unique constraint:

```text
(profile_version_id, key)
```

### `gateways`

```text
id
organization_id -> organizations.id
site_id -> sites.id
name
type
hardware_model
software_version
status
last_seen_at
config_revision
created_at
updated_at
```

### `devices`

```text
id
organization_id -> organizations.id
site_id -> sites.id
gateway_id -> gateways.id nullable
profile_version_id -> device_profile_versions.id
name
serial_number nullable
external_id nullable
status
last_seen_at
created_at
updated_at
```

### `device_connections`

```text
id
device_id -> devices.id
type
config jsonb
created_at
updated_at
```

Example `config` for Modbus RTU:

```json
{
  "port": "rs485-1",
  "baud": 9600,
  "dataBits": 8,
  "parity": "none",
  "stopBits": 1,
  "slaveId": 3
}
```

### `device_channels`

```text
id
device_id -> devices.id
channel_definition_id -> channel_definitions.id
enabled
metadata jsonb
created_at
updated_at
```

Recommended unique constraint:

```text
(device_id, channel_definition_id)
```

## 3. Semantic model tables

### `asset_types`

```text
id
name
description
created_at
updated_at
```

### `asset_type_versions`

```text
id
asset_type_id -> asset_types.id
version
status
published_at
created_at
```

Recommended unique constraint:

```text
(asset_type_id, version)
```

### `point_definitions`

```text
id
asset_type_version_id -> asset_type_versions.id
key
name
role
data_type
access
unit nullable
required
alarm_capable
metadata jsonb
created_at
```

Recommended unique constraint:

```text
(asset_type_version_id, key)
```

### `assets`

```text
id
organization_id -> organizations.id
site_id -> sites.id
asset_type_version_id -> asset_type_versions.id
name
description nullable
status
created_at
updated_at
```

### `asset_points`

```text
id
asset_id -> assets.id
point_definition_id -> point_definitions.id
display_name nullable
enabled
created_at
updated_at
```

Recommended unique constraint:

```text
(asset_id, point_definition_id)
```

### `point_mappings`

```text
id
organization_id -> organizations.id
asset_point_id -> asset_points.id
device_channel_id -> device_channels.id
invert
scale nullable
offset nullable
transform jsonb nullable
created_at
updated_at
```

The service layer must validate tenant/site consistency between the Asset Point and Device Channel.

## 4. Runtime tables

### `point_state`

Latest state only.

```text
point_id -> asset_points.id primary key
value_boolean nullable
value_number nullable
value_text nullable
quality
source_device_id -> devices.id nullable
observed_at
updated_at
```

Only one value column should be logically active based on the Point data type.

### `telemetry_samples`

Append-only history.

```text
time
organization_id
site_id
point_id
source_device_id
value_boolean nullable
value_number nullable
value_text nullable
quality
message_id
sequence nullable
```

Start with PostgreSQL partitioning/indexing only when needed. Convert to a TimescaleDB hypertable later if telemetry volume justifies it.

Important indexes will likely include:

```text
(point_id, time desc)
(site_id, time desc)
(source_device_id, time desc)
```

### `commands`

```text
id
organization_id
site_id
asset_id
point_id
requested_by_user_id nullable
requested_value jsonb
status
physical_target_snapshot jsonb
created_at
queued_at nullable
dispatched_at nullable
acknowledged_at nullable
verified_at nullable
completed_at nullable
error_code nullable
error_message nullable
```

Persist the resolved physical target snapshot so historical commands remain understandable even after mappings change.

### `events`

```text
id
organization_id
site_id
gateway_id nullable
device_id nullable
kind
severity
payload jsonb
occurred_at
created_at
```

### `alarms`

```text
id
organization_id
site_id
asset_id nullable
point_id nullable
severity
code
title
message
status
opened_at
acknowledged_at nullable
acknowledged_by nullable
closed_at nullable
metadata jsonb
```

### `audit_log`

```text
id
organization_id
user_id nullable
action
target_type
target_id nullable
site_id nullable
result
metadata jsonb
created_at
```

## 5. Messaging reliability tables

### `outbox_messages`

For reliable DB -> MQTT/event publication.

```text
id
topic_or_kind
payload jsonb
status
attempts
created_at
published_at nullable
last_error nullable
```

Use the transactional outbox pattern for operations where persisting domain state and publishing a message must not diverge.

### Optional later: `inbox_messages`

Can be added if explicit durable deduplication is needed for inbound MQTT messages.

## 6. Firmware domain — later milestone

Planned tables:

```text
firmware_products
firmware_versions
firmware_artifacts
deployments
deployment_targets
deployment_events
```

Do not implement before the first telemetry + command vertical slice works.

## 7. Ownership and tenant safety

Even where ownership can be inferred through joins, carrying `organization_id` on high-volume/runtime records is acceptable when it materially improves:

- authorization safety;
- query simplicity;
- partitioning/filtering;
- operational debugging.

However, duplicates must be protected by service validation and foreign-key-consistent relationships.

Never rely only on frontend filtering for tenant isolation.
