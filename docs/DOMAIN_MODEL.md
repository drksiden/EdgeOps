# EdgeOps Domain Model

## 1. Design principle

EdgeOps separates **hardware topology** from **customer semantics**.

The customer should not need to understand this:

```text
Modbus Coil 00001 = 1
```

The customer should see this:

```text
Ventilation Unit V1 — Running
```

Engineering tools must preserve full provenance so an engineer can trace the semantic state back to the physical source.

## 2. Commercial / tenant domain

### Organization

A tenant/customer workspace.

Examples:

- an engineering company;
- a direct enterprise customer;
- a service provider.

### User

A human account.

A user may belong to multiple organizations.

### Membership

Relationship between User and Organization.

Carries role/access information.

### Site

A physical managed location.

Examples:

- business center;
- office;
- warehouse;
- server room;
- demo laboratory.

## 3. Physical domain

### Device Profile

Reusable definition of a hardware family/model.

It describes what the device can expose, not one concrete installation.

Example:

```text
Generic ESP32 Modbus 8R8I
```

### Device Profile Version

Immutable/published version of a Device Profile.

Needed because changing Modbus addresses or channel definitions must not silently mutate already deployed devices.

### Channel Definition

A profile-level declaration of one physical signal.

Properties may include:

- key;
- name;
- protocol kind;
- address;
- data type;
- access mode;
- raw unit;
- metadata.

Examples:

```text
relay_1 -> Modbus Coil 00001 -> boolean -> read/write
input_1 -> Discrete Input 10001 -> boolean -> read
```

### Gateway

An EdgeOps edge node responsible for cloud communication and local protocol access.

Examples:

- ESP32-P4 + ESP32-C6 gateway;
- future Linux/Rust gateway.

### Device

A concrete physical device installed at a Site.

Examples:

- Relay Controller #03;
- Temperature Node #14;
- Modbus Meter #02.

A Device references a specific Device Profile Version.

### Device Channel

Concrete channel instance belonging to a Device.

A profile declares `relay_1`; a concrete Device has its own instance of `relay_1`.

### Device Connection

Protocol-specific information needed to reach a Device.

Examples:

```text
Modbus RTU:
- gateway
- serial port
- baud
- parity
- stop bits
- slave ID
```

or:

```text
Modbus TCP:
- host
- port
- unit ID
```

Keep protocol-specific settings out of generic device columns where practical.

## 4. Semantic domain

### Asset Type

Reusable semantic template for a class of real-world equipment.

Examples:

- Ventilation Unit;
- Pump;
- UPS;
- Battery String;
- Lighting Zone.

### Asset Type Version

Published version of an Asset Type contract.

### Point Definition

Declares a logical property/control expected by an Asset Type.

Recommended attributes:

```text
key
name
role
data_type
access
unit
required
alarm_capable
```

#### Roles

Initial roles:

- `command`
- `status`
- `measurement`
- `alarm`
- `setpoint`

#### Data types

Initial data types:

- `boolean`
- `integer`
- `float`
- `enum`
- `string`

#### Access modes

- `read`
- `write`
- `read_write`

### Asset

Concrete real-world equipment instance installed at a Site.

Example:

```text
Ventilation Unit V1
```

An Asset is not generally equal to a Device.

### Asset Point

Concrete logical point instantiated for an Asset from a Point Definition.

Example:

```text
Ventilation Unit V1 / Running Feedback
```

### Point Mapping

Binds an Asset Point to a Device Channel.

Example:

```text
Ventilation Unit V1 / Start Command
-> Relay Controller #03 / Coil 00001
```

A Mapping may contain transforms.

Initial transforms:

- invert;
- scale;
- offset.

Later:

- enum mapping;
- bit extraction;
- masks;
- formulas;
- clamping.

## 5. Mapping compatibility

The system must validate mappings.

Compatibility should progressively consider:

- source/target data type;
- read/write capability;
- semantic role;
- unit compatibility;
- transform availability;
- range constraints.

Examples:

```text
Start Command (boolean/write)
-> Modbus Coil (boolean/read_write) : compatible
```

```text
Temperature (float/read/°C)
-> Digital Input (boolean/read) : incompatible
```

## 6. Mapping cardinality

Initial policy recommendation:

- Read-only Device Channels may feed multiple read-only semantic Points where intentional.
- Writable channels should normally have a single authoritative writable semantic mapping.
- Exceptions must be explicit and visible to engineers.

This avoids accidental conflicts where two unrelated Assets control the same physical output.

## 7. Runtime domain

### Point State

Latest resolved value for fast UI reads.

This is the current digital state, not historical telemetry.

### Telemetry Sample

Append-only historical measurement/state record.

### Command

Represents a semantic control request.

Recommended lifecycle:

```text
CREATED
QUEUED
DISPATCHED
ACKNOWLEDGED
VERIFIED
COMPLETED
```

Failure states:

```text
REJECTED
FAILED
TIMED_OUT
UNCONFIRMED
CANCELLED
```

### Event

Technical/system event.

Examples:

- device connected;
- gateway restarted;
- configuration applied.

### Alarm

Condition requiring attention.

Examples:

- gateway offline;
- fan did not confirm start;
- battery voltage below threshold.

### Audit Log

Human/system action history.

Examples:

- user changed mapping;
- engineer deployed firmware;
- customer started an Asset.

## 8. Example complete model

```text
Site: Business Center A

Gateway: Edge Gateway #01

Device: Relay Controller #03
Profile: Generic ESP32 Modbus 8R8I v1
Channel: Coil 00001

Device: Temperature Sensor #08
Profile: Modbus Temperature Sensor v2
Channel: Input Register 30004

Asset: Ventilation Unit V1
Type: Ventilation Unit v1

Points:
- Start Command
  -> Relay Controller #03 / Coil 00001

- Running Feedback
  -> Relay Controller #03 / Discrete Input 10001

- Temperature
  -> Temperature Sensor #08 / Input Register 30004
```

The customer sees one Asset even though its Points are sourced from multiple physical Devices.
