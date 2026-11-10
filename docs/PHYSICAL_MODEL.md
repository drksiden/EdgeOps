# EdgeOps Physical Model

Phase 3 persists inventory and configuration only. It does not connect to MQTT, collect telemetry, or introduce semantic Assets and Points.

## Profiles and concrete devices

A **Device Profile** identifies a reusable hardware family, such as an ESP32-C3 control node. A **Device Profile Version** is an immutable published hardware contract. Its **Channel Definitions** describe the signals exposed by that contract.

A **Device** is one installed physical unit at one Site. It references a published Profile Version, never only the mutable Profile. A **Device Channel** is the concrete instance of a Channel Definition for that Device. Device creation instantiates all channels atomically.

```text
Device Profile -> Profile Version -> Channel Definition
                         |                  |
                         v                  v
                       Device ------> Device Channel
```

Channel Definitions contain physical facts (`kind`, `dataType`, `access`, `hardwareRef`, raw unit). Device Channels deliberately contain no Asset, Point, or mapping fields.

## Gateways and connections

A **Gateway** is an edge computer installed at a Site. Phase 3 stores `organization_id` explicitly as well as `site_id`. A composite foreign key guarantees that both resolve to the same tenant, improving tenant-scoped queries without trusting duplicated data.

A Device may have no Gateway when it is a native cloud-connected ESP32 node. External devices such as Modbus RTU controllers normally reference a Gateway at the same Site.

A **Device Connection** stores the transport configuration separately from Device identity. Phase 3 supports `native_mqtt`, `modbus_rtu`, and `modbus_tcp` persistence and validation, but implements no runtime clients. The MVP permits exactly one connection per Device. Normal Device DTOs expose the connection type but not its configuration, so future secrets cannot leak through inventory reads.

## Immutability and creation

Published Profile Versions and their Channel Definitions have no update endpoint. Device creation validates tenant membership, Site and optional Gateway ownership, published profile status, and connection configuration. Device, connection, and channels are committed in one PostgreSQL transaction or all rolled back.
