# EdgeOps Communication and Protocols v1

## 1. Communication boundaries

EdgeOps uses different transports for different actors.

### Browser / application clients

```text
Browser -> Go Backend
REST for commands and CRUD
WebSocket/SSE for realtime updates
```

The browser must not communicate directly with field MQTT topics.

### Cloud / edge

```text
Go Backend <-> MQTT Broker <-> Gateway / Native Device
```

### Gateway / field device

Examples:

```text
Modbus RTU
Modbus TCP
GPIO
I2C
future SNMP
```

## 2. MQTT topic model

Initial gateway-oriented convention:

### Edge -> Cloud

```text
edgeops/v1/gateways/{gatewayId}/up/presence
edgeops/v1/gateways/{gatewayId}/up/telemetry
edgeops/v1/gateways/{gatewayId}/up/events
edgeops/v1/gateways/{gatewayId}/up/command-ack
edgeops/v1/gateways/{gatewayId}/up/config-ack
```

### Cloud -> Edge

```text
edgeops/v1/gateways/{gatewayId}/down/commands
edgeops/v1/gateways/{gatewayId}/down/config
edgeops/v1/gateways/{gatewayId}/down/ota
```

Phase 3.5 introduces the native-device namespace:

```text
edgeops/v1/devices/{deviceId}/up/presence
edgeops/v1/devices/{deviceId}/up/state
edgeops/v1/devices/{deviceId}/up/events
edgeops/v1/devices/{deviceId}/up/telemetry
edgeops/v1/devices/{deviceId}/down/commands
edgeops/v1/devices/{deviceId}/down/config
```

Only presence and state are implemented by the Phase 3.5 firmware. The other topics are reserved for later runtime phases.

## 3. Common message envelope

Prefer a consistent envelope for traceability and deduplication.

Example:

```json
{
  "version": 1,
  "messageId": "msg_01ABC...",
  "timestamp": "2026-09-23T05:00:00.000Z",
  "sequence": 18241,
  "payload": {}
}
```

Recommended fields:

- `version`: contract version;
- `messageId`: globally unique message identifier;
- `timestamp`: source timestamp where meaningful;
- `sequence`: gateway-local monotonic sequence when available;
- `payload`: type-specific content.

## 4. Presence

Presence should communicate more than just MQTT connectivity when possible.

Example:

```json
{
  "status": "online",
  "softwareVersion": "0.1.0",
  "configRevision": 42,
  "uptimeSeconds": 18422
}
```

Use MQTT Last Will for unexpected disconnect/offline state where supported.

## 5. Telemetry

Gateway may batch multiple raw channel samples.

Example:

```json
{
  "version": 1,
  "messageId": "msg_01...",
  "timestamp": "2026-09-23T05:01:12.421Z",
  "sequence": 18242,
  "samples": [
    {
      "deviceId": "dev_01",
      "channelId": "ch_01",
      "value": true,
      "quality": "good"
    },
    {
      "deviceId": "dev_02",
      "channelId": "ch_07",
      "value": 247,
      "quality": "good"
    }
  ]
}
```

Initial cloud processing:

```text
Device Channel
-> Point Mapping
-> Transform
-> Asset Point
-> point_state
-> telemetry_samples
-> realtime UI update
```

## 6. Commands

Cloud publishes a protocol-neutral field command.

Example:

```json
{
  "commandId": "cmd_01...",
  "deviceId": "dev_03",
  "channelId": "ch_42",
  "operation": "write",
  "value": true,
  "timeoutMs": 5000
}
```

The Gateway translates the generic channel operation using its configuration.

Example:

```text
channel ch_42
-> Device: Relay Controller #03
-> Modbus RTU
-> Slave ID 3
-> Coil 00001
-> Write Single Coil
```

## 7. Command acknowledgement

Gateway response example:

```json
{
  "commandId": "cmd_01...",
  "status": "acknowledged",
  "timestamp": "2026-09-23T05:02:14.991Z",
  "details": {
    "responseTimeMs": 18
  }
}
```

Failure example:

```json
{
  "commandId": "cmd_01...",
  "status": "failed",
  "errorCode": "MODBUS_TIMEOUT",
  "message": "No response from slave 3"
}
```

Acknowledgement confirms protocol execution, not necessarily the physical equipment state.

## 8. Verification

A command may define or infer a verification point.

Example:

```text
Command Point: Start
Verification Point: Running Feedback
Expected Value: true
Timeout: 5 seconds
```

Possible result:

```text
ACKNOWLEDGED -> VERIFIED -> COMPLETED
```

or:

```text
ACKNOWLEDGED -> UNCONFIRMED
```

The second case may open an Alarm.

## 9. Configuration distribution

Cloud sends versioned configuration bundles.

Example:

```json
{
  "revision": 43,
  "generatedAt": "2026-09-23T05:10:00Z",
  "devices": [],
  "channels": [],
  "mappings": []
}
```

Gateway applies configurations atomically where practical and replies with a config acknowledgement.

The Gateway must keep the last valid configuration if a new bundle is invalid or interrupted.

## 10. Offline buffering

Gateway maintains an outbox for messages that should survive cloud outages.

Concept:

```text
sequence
message_id
message_type
payload
created_at
sent_at
```

On reconnect:

1. reconnect MQTT;
2. confirm cloud session;
3. flush buffered messages in sequence order;
4. retain messages until acknowledged according to implementation policy;
5. reconcile configuration revision.

Cloud ingestion must tolerate duplicates.

## 11. QoS guidance

Initial recommendation:

```text
Presence       QoS 1
Telemetry      QoS 0 or 1; MVP may use QoS 1
Events         QoS 1
Commands       QoS 1
Command ACK    QoS 1
Configuration  QoS 1
OTA control    QoS 1
```

Do not use QoS 2 unless a concrete requirement justifies the added complexity.

## 12. Security direction

Development can begin with isolated local credentials, but the target model is per-gateway/per-device identity.

Preferred direction:

```text
unique gateway/device identity
TLS
later mTLS/device certificates
broker ACL scoped to own topic namespace
```

Never use one universal production device password.

## 13. API and documentation contracts

REST API:

- OpenAPI 3.x;
- generated/validated from Go API definitions where possible;
- rendered through Fumadocs.

MQTT/device API:

- maintain explicit schemas;
- later add AsyncAPI once the first message contracts stabilize.
