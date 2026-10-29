// EdgeOps mock data layer.
// Clean frontend abstractions over the physical/logical hierarchy:
//   Organization -> Site -> Gateway -> Device -> Channel -> Point -> Asset
// Designed to be swapped for a Go backend (REST + WebSocket) later.

export type HealthStatus = 'healthy' | 'warning' | 'critical' | 'offline'
export type ConnectionStatus = 'online' | 'offline' | 'warning' | 'updating'
export type AlarmSeverity = 'critical' | 'warning' | 'info'
export type AlarmState = 'active' | 'acknowledged' | 'resolved'

export interface Organization {
  id: string
  name: string
  plan: 'Starter' | 'Business' | 'Enterprise'
  sites: number
  devices: number
  health: HealthStatus
}

export interface Site {
  id: string
  name: string
  org: string
  location: string
  health: HealthStatus
  devices: number
  devicesOnline: number
  gateways: number
  gatewaysOnline: number
  activeAlarms: number
  lastSeen: string
}

export interface Gateway {
  id: string
  name: string
  siteId: string
  hardware: string
  swVersion: string
  status: ConnectionStatus
  localDevices: number
  cpu: number
  memory: number
  storage: number
  mqtt: 'connected' | 'disconnected'
  bufferedEvents: number
  uptime: string
  ip: string
}

export type ChannelInterface =
  | 'Digital Input'
  | 'Digital Output'
  | 'Analog Input'
  | 'Modbus Coil'
  | 'Discrete Input'
  | 'Input Register'
  | 'Holding Register'

export type PointType = 'Boolean Control' | 'Boolean State' | 'Analog'

export interface Channel {
  id: string
  ref: string // raw hardware address e.g. Coil 00001, GPIO 4, Holding Register 40012
  interface: ChannelInterface
  displayName: string | null
  pointName: string | null
  pointType: PointType | null
  assetId: string | null
  unit: string | null
  writable: boolean
  inverted: boolean
  scale: number
  value: string // raw value as read from the bus (ON/OFF, CLOSED/OPEN, or numeric)
}

export interface Device {
  id: string
  name: string
  type: string
  category: 'ESP32' | 'Modbus' | 'Sensor' | 'Gateway'
  siteId: string
  gatewayId: string
  status: ConnectionStatus
  firmware: string
  lastSeen: string
  ip: string
  mac: string
  rssi: number
  transport: 'Wi-Fi' | 'Ethernet' | 'RS-485' | 'LoRa'
  uptime: string
  model: string
  profileId?: string
  slaveAddress?: number
  serial?: string
  channels: Channel[]
}

export interface AssetMetric {
  label: string
  value: string
  tone?: 'default' | 'success' | 'warning' | 'critical'
}

export interface Asset {
  id: string
  name: string
  type: string
  typeId?: string
  siteId: string
  deviceId: string
  state: string
  stateTone: 'success' | 'warning' | 'critical' | 'default'
  health: HealthStatus
  activeAlarms: number
  lastUpdate: string
  metrics: AssetMetric[]
}

export interface Alarm {
  id: string
  severity: AlarmSeverity
  title: string
  assetId: string | null
  assetName: string
  siteId: string
  siteName: string
  started: string
  duration: string
  state: AlarmState
  acknowledgedBy: string | null
  rule: string
}

export interface FirmwareVersion {
  product: string
  version: string
  build: string
  compatible: string[]
  released: string
  adoption: number
  status: 'stable' | 'beta' | 'deprecated'
}

export interface User {
  id: string
  name: string
  email: string
  status: 'active' | 'invited' | 'disabled'
  scopes: { scope: string; role: string }[]
}

export interface AuditEntry {
  id: string
  time: string
  actor: string
  action: string
  target: string
  site: string
  source: string
  result: 'success' | 'failed'
}

export interface ActivityEvent {
  id: string
  time: string
  kind: 'command' | 'alarm' | 'status' | 'deployment' | 'config'
  text: string
}

// -- Organizations ----------------------------------------------------------

export const organizations: Organization[] = [
  { id: 'org-antb', name: 'ANTB Engineering', plan: 'Business', sites: 12, devices: 284, health: 'warning' },
  { id: 'org-acme', name: 'Acme Engineering', plan: 'Business', sites: 12, devices: 284, health: 'healthy' },
  { id: 'org-northwind', name: 'Northwind Facilities', plan: 'Enterprise', sites: 34, devices: 902, health: 'healthy' },
  { id: 'org-lumen', name: 'Lumen Integrations', plan: 'Starter', sites: 3, devices: 41, health: 'critical' },
]

// -- Sites -------------------------------------------------------------------

export const sites: Site[] = [
  {
    id: 'site-bca',
    name: 'Business Center A',
    org: 'ANTB Engineering',
    location: 'Warsaw, PL',
    health: 'critical',
    devices: 126,
    devicesOnline: 124,
    gateways: 3,
    gatewaysOnline: 3,
    activeAlarms: 1,
    lastSeen: '2s ago',
  },
  {
    id: 'site-warehouse',
    name: 'Main Warehouse',
    org: 'ANTB Engineering',
    location: 'Katowice, PL',
    health: 'healthy',
    devices: 46,
    devicesOnline: 46,
    gateways: 2,
    gatewaysOnline: 2,
    activeAlarms: 0,
    lastSeen: '4s ago',
  },
  {
    id: 'site-office',
    name: 'Main Office',
    org: 'ANTB Engineering',
    location: 'Warsaw, PL',
    health: 'warning',
    devices: 38,
    devicesOnline: 20,
    gateways: 2,
    gatewaysOnline: 1,
    activeAlarms: 2,
    lastSeen: '18m ago',
  },
  {
    id: 'site-serverroom',
    name: 'Server Room #1',
    org: 'ANTB Engineering',
    location: 'Warsaw, PL',
    health: 'healthy',
    devices: 22,
    devicesOnline: 22,
    gateways: 1,
    gatewaysOnline: 1,
    activeAlarms: 0,
    lastSeen: '1s ago',
  },
  {
    id: 'site-lab',
    name: 'Demo Laboratory',
    org: 'ANTB Engineering',
    location: 'Krakow, PL',
    health: 'warning',
    devices: 14,
    devicesOnline: 13,
    gateways: 1,
    gatewaysOnline: 1,
    activeAlarms: 1,
    lastSeen: '9s ago',
  },
]

// -- Gateways ----------------------------------------------------------------

export const gateways: Gateway[] = [
  {
    id: 'gw-01',
    name: 'Edge Gateway #01',
    siteId: 'site-bca',
    hardware: 'ESP32-P4 + ESP32-C6',
    swVersion: '2.3.1',
    status: 'online',
    localDevices: 62,
    cpu: 34,
    memory: 58,
    storage: 41,
    mqtt: 'connected',
    bufferedEvents: 0,
    uptime: '21d 4h',
    ip: '10.20.4.11',
  },
  {
    id: 'gw-02',
    name: 'Edge Gateway #02',
    siteId: 'site-bca',
    hardware: 'ESP32-P4 + ESP32-C6',
    swVersion: '2.3.1',
    status: 'online',
    localDevices: 64,
    cpu: 47,
    memory: 63,
    storage: 44,
    mqtt: 'connected',
    bufferedEvents: 0,
    uptime: '11d 9h',
    ip: '10.20.4.12',
  },
  {
    id: 'gw-office',
    name: 'Office Gateway',
    siteId: 'site-office',
    hardware: 'Linux Edge Gateway',
    swVersion: '2.2.9',
    status: 'offline',
    localDevices: 18,
    cpu: 0,
    memory: 0,
    storage: 52,
    mqtt: 'disconnected',
    bufferedEvents: 2481,
    uptime: '—',
    ip: '10.30.1.4',
  },
  {
    id: 'gw-wh',
    name: 'Warehouse Gateway',
    siteId: 'site-warehouse',
    hardware: 'ESP32-P4 + ESP32-C6',
    swVersion: '2.3.1',
    status: 'online',
    localDevices: 46,
    cpu: 28,
    memory: 49,
    storage: 37,
    mqtt: 'connected',
    bufferedEvents: 0,
    uptime: '48d 2h',
    ip: '10.40.2.10',
  },
]

// -- Channels (attached to devices) -----------------------------------------

// Flagship example — the controller behind "Ventilation Unit V1".
// A generic third-party Modbus 8R8I board: raw coils + discrete inputs, no
// intrinsic meaning until an engineer maps them to logical points.
const ventChannels: Channel[] = [
  { id: 'ch-c1', ref: 'Coil 00001', interface: 'Modbus Coil', displayName: 'Fan start relay', pointName: 'Start Command', pointType: 'Boolean Control', assetId: 'asset-vent', unit: null, writable: true, inverted: false, scale: 1, value: 'ON' },
  { id: 'ch-c2', ref: 'Coil 00002', interface: 'Modbus Coil', displayName: null, pointName: null, pointType: null, assetId: null, unit: null, writable: true, inverted: false, scale: 1, value: 'OFF' },
  { id: 'ch-c3', ref: 'Coil 00003', interface: 'Modbus Coil', displayName: null, pointName: null, pointType: null, assetId: null, unit: null, writable: true, inverted: false, scale: 1, value: 'OFF' },
  { id: 'ch-di1', ref: 'Discrete Input 10001', interface: 'Discrete Input', displayName: 'Run contactor aux', pointName: 'Running Feedback', pointType: 'Boolean State', assetId: 'asset-vent', unit: null, writable: false, inverted: false, scale: 1, value: 'CLOSED' },
  { id: 'ch-di2', ref: 'Discrete Input 10002', interface: 'Discrete Input', displayName: 'Fault relay', pointName: 'Fault', pointType: 'Boolean State', assetId: 'asset-vent', unit: null, writable: false, inverted: false, scale: 1, value: 'OPEN' },
  { id: 'ch-di3', ref: 'Discrete Input 10003', interface: 'Discrete Input', displayName: null, pointName: null, pointType: null, assetId: null, unit: null, writable: false, inverted: false, scale: 1, value: 'OPEN' },
  { id: 'ch-ir1', ref: 'Input Register 30010', interface: 'Input Register', displayName: 'Supply air temperature', pointName: 'Air Temperature', pointType: 'Analog', assetId: 'asset-vent', unit: '°C', writable: false, inverted: false, scale: 0.1, value: '26.4' },
  { id: 'ch-hr1', ref: 'Holding Register 40012', interface: 'Holding Register', displayName: 'Motor current', pointName: 'Motor Current', pointType: 'Analog', assetId: 'asset-vent', unit: 'A', writable: false, inverted: false, scale: 0.01, value: '4.82' },
]

// Generic ESP32 relay board, freshly discovered — raw GPIO with no mapping yet.
const relayChannels: Channel[] = [
  { id: 'ch-di1', ref: 'GPIO 2', interface: 'Digital Input', displayName: null, pointName: null, pointType: null, assetId: null, unit: null, writable: false, inverted: false, scale: 1, value: 'false' },
  { id: 'ch-di2', ref: 'GPIO 3', interface: 'Digital Input', displayName: null, pointName: null, pointType: null, assetId: null, unit: null, writable: false, inverted: false, scale: 1, value: 'false' },
  { id: 'ch-do1', ref: 'GPIO 4', interface: 'Digital Output', displayName: null, pointName: null, pointType: null, assetId: null, unit: null, writable: true, inverted: false, scale: 1, value: 'false' },
  { id: 'ch-do2', ref: 'GPIO 5', interface: 'Digital Output', displayName: null, pointName: null, pointType: null, assetId: null, unit: null, writable: true, inverted: false, scale: 1, value: 'false' },
  { id: 'ch-adc1', ref: 'ADC 1', interface: 'Analog Input', displayName: null, pointName: null, pointType: null, assetId: null, unit: null, writable: false, inverted: false, scale: 0.1, value: '0.0' },
  { id: 'ch-mb2', ref: 'Coil 00001', interface: 'Modbus Coil', displayName: null, pointName: null, pointType: null, assetId: null, unit: null, writable: true, inverted: false, scale: 1, value: 'OFF' },
]

const batteryChannels: Channel[] = [
  { id: 'ch-b1', ref: 'Holding Register 40001', interface: 'Holding Register', displayName: 'String Voltage', pointName: 'Voltage', pointType: 'Analog', assetId: 'asset-ups', unit: 'V', writable: false, inverted: false, scale: 0.1, value: '48.3' },
  { id: 'ch-b2', ref: 'Holding Register 40002', interface: 'Holding Register', displayName: 'Charge Current', pointName: 'Current', pointType: 'Analog', assetId: 'asset-ups', unit: 'A', writable: false, inverted: false, scale: 0.1, value: '12.6' },
  { id: 'ch-b3', ref: 'Holding Register 40003', interface: 'Holding Register', displayName: 'State of Charge', pointName: 'SoC', pointType: 'Analog', assetId: 'asset-ups', unit: '%', writable: false, inverted: false, scale: 1, value: '96' },
]

// -- Devices -----------------------------------------------------------------

export const devices: Device[] = [
  {
    id: 'dev-relay01',
    name: 'Ventilation Controller · VENT-01',
    type: 'Generic ESP32 Modbus 8R8I',
    category: 'Modbus',
    siteId: 'site-bca',
    gatewayId: 'gw-01',
    status: 'online',
    firmware: '1.4.2',
    lastSeen: '2s ago',
    ip: '10.20.4.51',
    mac: 'A0:B7:65:2C:14:8E',
    rssi: -61,
    transport: 'RS-485',
    uptime: '6d 3h',
    model: 'Generic ESP32 Modbus 8R8I',
    profileId: 'prof-8r8i',
    slaveAddress: 3,
    serial: '9600 8N1',
    channels: ventChannels,
  },
  {
    id: 'dev-relay03',
    profileId: 'prof-esp32-relay',
    name: 'ESP32 Relay Controller #03',
    type: 'ESP32 8-Relay Controller',
    category: 'ESP32',
    siteId: 'site-bca',
    gatewayId: 'gw-02',
    status: 'warning',
    firmware: '1.4.1',
    lastSeen: '47s ago',
    ip: '10.20.4.53',
    mac: 'A0:B7:65:2C:19:C2',
    rssi: -74,
    transport: 'Wi-Fi',
    uptime: '2d 11h',
    model: 'EdgeOps ESP32 Node',
    channels: relayChannels,
  },
  {
    id: 'dev-temp14',
    profileId: 'prof-c3',
    name: 'Temperature Node #14',
    type: 'ESP32-C3 Sensor Node',
    category: 'Sensor',
    siteId: 'site-bca',
    gatewayId: 'gw-01',
    status: 'online',
    firmware: '1.4.2',
    lastSeen: '5s ago',
    ip: '10.20.4.88',
    mac: 'B4:E6:2D:71:0A:45',
    rssi: -58,
    transport: 'Wi-Fi',
    uptime: '19d 6h',
    model: 'EdgeOps ESP32-C3 Node',
    channels: [
      { id: 'ch-t1', ref: 'ADC 1', interface: 'Analog Input', displayName: 'Ambient Temperature', pointName: 'Temperature', pointType: 'Analog', assetId: null, unit: '°C', writable: false, inverted: false, scale: 0.1, value: '24.7' },
      { id: 'ch-t2', ref: 'ADC 2', interface: 'Analog Input', displayName: 'Relative Humidity', pointName: 'Humidity', pointType: 'Analog', assetId: null, unit: '%', writable: false, inverted: false, scale: 1, value: '42' },
    ],
  },
  {
    id: 'dev-batt02',
    profileId: 'prof-battery',
    name: 'Battery Monitor #02',
    type: 'Modbus Battery Monitor',
    category: 'Modbus',
    siteId: 'site-serverroom',
    gatewayId: 'gw-01',
    status: 'online',
    firmware: '1.3.8',
    lastSeen: '3s ago',
    ip: '10.20.4.61',
    mac: 'C8:2B:96:41:7D:10',
    rssi: -66,
    transport: 'RS-485',
    uptime: '54d 1h',
    model: 'Generic Modbus Battery Monitor',
    channels: batteryChannels,
  },
  {
    id: 'dev-meter07',
    profileId: 'prof-energy',
    name: 'Energy Meter #07',
    type: 'Modbus Energy Meter',
    category: 'Modbus',
    siteId: 'site-warehouse',
    gatewayId: 'gw-wh',
    status: 'online',
    firmware: '1.3.8',
    lastSeen: '6s ago',
    ip: '10.40.2.31',
    mac: 'C8:2B:96:41:88:2A',
    rssi: -70,
    transport: 'RS-485',
    uptime: '48d 0h',
    model: 'Generic Modbus Energy Meter',
    channels: [
      { id: 'ch-e1', ref: 'Holding Register 40010', interface: 'Holding Register', displayName: 'Active Power', pointName: 'Power', pointType: 'Analog', assetId: null, unit: 'kW', writable: false, inverted: false, scale: 0.01, value: '18.42' },
      { id: 'ch-e2', ref: 'Holding Register 40020', interface: 'Holding Register', displayName: 'Line Voltage', pointName: 'Voltage', pointType: 'Analog', assetId: null, unit: 'V', writable: false, inverted: false, scale: 0.1, value: '398.6' },
    ],
  },
  {
    id: 'dev-relay08',
    profileId: 'prof-esp32-relay',
    name: 'ESP32 Relay Controller #08',
    type: 'ESP32 8-Relay Controller',
    category: 'ESP32',
    siteId: 'site-office',
    gatewayId: 'gw-office',
    status: 'offline',
    firmware: '1.4.0',
    lastSeen: '18m ago',
    ip: '10.30.1.51',
    mac: 'A0:B7:65:2C:33:71',
    rssi: -88,
    transport: 'Wi-Fi',
    uptime: '—',
    model: 'EdgeOps ESP32 Node',
    channels: relayChannels,
  },
  {
    id: 'dev-relay12',
    profileId: 'prof-esp32-relay',
    name: 'ESP32 Relay Controller #12',
    type: 'ESP32 8-Relay Controller',
    category: 'ESP32',
    siteId: 'site-lab',
    gatewayId: 'gw-wh',
    status: 'updating',
    firmware: '1.4.1 → 1.4.2',
    lastSeen: '12s ago',
    ip: '10.20.4.72',
    mac: 'A0:B7:65:2C:41:9F',
    rssi: -63,
    transport: 'Wi-Fi',
    uptime: '0m',
    model: 'EdgeOps ESP32 Node',
    channels: relayChannels,
  },
]

// -- Assets ------------------------------------------------------------------

export const assets: Asset[] = [
  {
    id: 'asset-vent',
    typeId: 'at-ventilation',
    name: 'Ventilation Unit V1',
    type: 'HVAC / Ventilation',
    siteId: 'site-bca',
    deviceId: 'dev-relay01',
    state: 'Running',
    stateTone: 'success',
    health: 'critical',
    activeAlarms: 1,
    lastUpdate: '2s ago',
    metrics: [
      { label: 'Air Temperature', value: '26.4 °C' },
      { label: 'Feedback', value: 'RUNNING', tone: 'success' },
      { label: 'Fault', value: 'Normal', tone: 'success' },
      { label: 'Motor Current', value: '4.82 A' },
    ],
  },
  {
    id: 'asset-ups',
    typeId: 'at-ups',
    name: 'UPS Server Room',
    type: 'Power / UPS',
    siteId: 'site-serverroom',
    deviceId: 'dev-batt02',
    state: 'On Battery',
    stateTone: 'warning',
    health: 'warning',
    activeAlarms: 0,
    lastUpdate: '3s ago',
    metrics: [
      { label: 'String Voltage', value: '48.3 V' },
      { label: 'State of Charge', value: '96 %' },
      { label: 'Charge Current', value: '12.6 A' },
      { label: 'Runtime', value: '38 min' },
    ],
  },
  {
    id: 'asset-pump',
    typeId: 'at-pump',
    name: 'Main Pump',
    type: 'Water / Pump',
    siteId: 'site-bca',
    deviceId: 'dev-relay03',
    state: 'Stopped',
    stateTone: 'default',
    health: 'healthy',
    activeAlarms: 0,
    lastUpdate: '47s ago',
    metrics: [
      { label: 'Feedback', value: 'STOPPED' },
      { label: 'Pressure', value: '2.1 bar' },
      { label: 'Fault', value: 'Normal', tone: 'success' },
    ],
  },
  {
    id: 'asset-light',
    typeId: 'at-lighting',
    name: 'Lighting Zone 1',
    type: 'Lighting',
    siteId: 'site-office',
    deviceId: 'dev-relay08',
    state: 'Unknown',
    stateTone: 'critical',
    health: 'offline',
    activeAlarms: 1,
    lastUpdate: '18m ago',
    metrics: [
      { label: 'Feedback', value: 'NO DATA', tone: 'critical' },
      { label: 'Fault', value: 'Unknown', tone: 'warning' },
    ],
  },
  {
    id: 'asset-batt3',
    name: 'Battery String #3',
    type: 'Power / Battery',
    siteId: 'site-serverroom',
    deviceId: 'dev-batt02',
    state: 'Charging',
    stateTone: 'success',
    health: 'healthy',
    activeAlarms: 0,
    lastUpdate: '3s ago',
    metrics: [
      { label: 'Voltage', value: '13.8 V' },
      { label: 'State of Charge', value: '96 %' },
      { label: 'Temperature', value: '28.1 °C' },
    ],
  },
]

// -- Alarms ------------------------------------------------------------------

export const alarms: Alarm[] = [
  {
    id: 'alm-1001',
    severity: 'critical',
    title: 'Fan start confirmation was not received',
    assetId: 'asset-vent',
    assetName: 'Ventilation Unit V1',
    siteId: 'site-bca',
    siteName: 'Business Center A',
    started: '2026-09-22 09:41:12',
    duration: '14m',
    state: 'active',
    acknowledgedBy: null,
    rule: 'Feedback mismatch after Start Command (5s)',
  },
  {
    id: 'alm-1002',
    severity: 'critical',
    title: 'Gateway offline — no telemetry',
    assetId: null,
    assetName: 'Office Gateway',
    siteId: 'site-office',
    siteName: 'Main Office',
    started: '2026-09-22 09:23:40',
    duration: '18m',
    state: 'active',
    acknowledgedBy: null,
    rule: 'Heartbeat missing for 60s',
  },
  {
    id: 'alm-1003',
    severity: 'warning',
    title: 'Low Wi-Fi signal strength',
    assetId: null,
    assetName: 'ESP32 Relay Controller #03',
    siteId: 'site-bca',
    siteName: 'Business Center A',
    started: '2026-09-22 08:58:02',
    duration: '43m',
    state: 'acknowledged',
    acknowledgedBy: 'Danil',
    rule: 'RSSI below -70 dBm for 5m',
  },
  {
    id: 'alm-1004',
    severity: 'warning',
    title: 'UPS switched to battery power',
    assetId: 'asset-ups',
    assetName: 'UPS Server Room',
    siteId: 'site-serverroom',
    siteName: 'Server Room #1',
    started: '2026-09-22 09:36:19',
    duration: '5m',
    state: 'active',
    acknowledgedBy: null,
    rule: 'Mains input lost',
  },
  {
    id: 'alm-1005',
    severity: 'info',
    title: 'Firmware update completed on 12 devices',
    assetId: null,
    assetName: 'Business Center A',
    siteId: 'site-bca',
    siteName: 'Business Center A',
    started: '2026-09-22 07:12:00',
    duration: '—',
    state: 'resolved',
    acknowledgedBy: 'System',
    rule: 'Deployment lifecycle',
  },
]

// -- Firmware ----------------------------------------------------------------

export const firmware: FirmwareVersion[] = [
  { product: 'EdgeOps ESP32 Node', version: '1.4.2', build: '20260918.1', compatible: ['ESP32 8-Relay Controller', 'ESP32-C3 Sensor Node'], released: '2026-09-18', adoption: 68, status: 'stable' },
  { product: 'EdgeOps ESP32 Node', version: '1.4.1', build: '20260902.3', compatible: ['ESP32 8-Relay Controller', 'ESP32-C3 Sensor Node'], released: '2026-09-02', adoption: 24, status: 'stable' },
  { product: 'EdgeOps ESP32 Node', version: '1.3.8', build: '20260714.2', compatible: ['ESP32 8-Relay Controller'], released: '2026-07-14', adoption: 8, status: 'deprecated' },
  { product: 'EdgeOps Gateway', version: '2.3.1', build: '20260910.5', compatible: ['ESP32-P4 + ESP32-C6', 'Linux Edge Gateway'], released: '2026-09-10', adoption: 82, status: 'stable' },
]

// -- Users -------------------------------------------------------------------

export const users: User[] = [
  { id: 'u-danil', name: 'Danil', email: 'danil@antb.io', status: 'active', scopes: [{ scope: 'Business Center A', role: 'Engineer' }, { scope: 'Main Warehouse', role: 'Viewer' }] },
  { id: 'u-maria', name: 'Maria Kovač', email: 'maria@antb.io', status: 'active', scopes: [{ scope: 'Organization', role: 'Organization Administrator' }] },
  { id: 'u-tom', name: 'Tom Reyes', email: 'tom@antb.io', status: 'active', scopes: [{ scope: 'Main Office', role: 'Installer' }] },
  { id: 'u-ana', name: 'Ana Duarte', email: 'ana@antb.io', status: 'invited', scopes: [{ scope: 'Demo Laboratory', role: 'Viewer' }] },
]

// -- Audit log ---------------------------------------------------------------

export const auditLog: AuditEntry[] = [
  { id: 'a-9', time: '2026-09-22 09:44:01', actor: 'Danil', action: 'Started asset', target: 'Ventilation Unit V1', site: 'Business Center A', source: '10.20.4.9', result: 'success' },
  { id: 'a-8', time: '2026-09-22 09:31:22', actor: 'Maria Kovač', action: 'Deployed firmware v1.4.2', target: '42 devices', site: 'Business Center A', source: 'web', result: 'success' },
  { id: 'a-7', time: '2026-09-22 09:12:47', actor: 'Danil', action: 'Changed device configuration', target: 'ESP32 Relay Controller #01', site: 'Business Center A', source: '10.20.4.9', result: 'success' },
  { id: 'a-6', time: '2026-09-22 08:58:10', actor: 'Tom Reyes', action: 'Added device', target: 'Temperature Node #14', site: 'Business Center A', source: 'mobile', result: 'success' },
  { id: 'a-5', time: '2026-09-22 08:40:03', actor: 'System', action: 'Acknowledged alarm', target: 'Low Wi-Fi signal strength', site: 'Business Center A', source: 'auto', result: 'success' },
  { id: 'a-4', time: '2026-09-22 08:21:55', actor: 'Ana Duarte', action: 'Failed sign-in', target: 'Console', site: '—', source: '188.32.10.4', result: 'failed' },
]

// -- Activity ----------------------------------------------------------------

export const recentActivity: ActivityEvent[] = [
  { id: 'ev-1', time: '2s ago', kind: 'command', text: 'Danil sent Start Command to Ventilation Unit V1' },
  { id: 'ev-2', time: '4m ago', kind: 'alarm', text: 'Critical alarm raised on Ventilation Unit V1 (feedback mismatch)' },
  { id: 'ev-3', time: '18m ago', kind: 'status', text: 'Office Gateway went offline' },
  { id: 'ev-4', time: '32m ago', kind: 'deployment', text: 'Firmware v1.4.2 rollout reached 68% adoption' },
  { id: 'ev-5', time: '1h ago', kind: 'config', text: 'Channel GPIO 4 mapped to Point "Start Command"' },
]

// -- Device profiles ---------------------------------------------------------
// A Device Profile is the template describing what a class of hardware exposes:
// its protocol, transport and the physical channels it presents. Onboarding a
// device applies a profile, which materialises its raw channels automatically.

export interface ProfileChannel {
  ref: string
  interface: ChannelInterface
  writable: boolean
  unit?: string | null
}

export interface DeviceProfile {
  id: string
  name: string
  vendor: string
  protocol: string
  transport: string
  description: string
  channels: ProfileChannel[]
}

const range = (n: number, start = 0) => Array.from({ length: n }, (_, i) => i + start)
const coil = (i: number): ProfileChannel => ({ ref: `Coil ${(i).toString().padStart(5, '0')}`, interface: 'Modbus Coil', writable: true })
const discrete = (i: number): ProfileChannel => ({ ref: `Discrete Input ${10000 + i}`, interface: 'Discrete Input', writable: false })
const inputReg = (i: number): ProfileChannel => ({ ref: `Input Register ${30000 + i}`, interface: 'Input Register', writable: false })
const holdingReg = (i: number): ProfileChannel => ({ ref: `Holding Register ${40000 + i}`, interface: 'Holding Register', writable: true })

export const deviceProfiles: DeviceProfile[] = [
  {
    id: 'prof-8r8i',
    name: 'Generic ESP32 Modbus 8R8I',
    vendor: 'Generic / OEM',
    protocol: 'Modbus RTU',
    transport: 'RS-485',
    description: 'Common third-party 8-relay / 8-input board bridged over an EdgeOps gateway. Coils drive relays, discrete inputs read dry contacts, registers expose analog telemetry.',
    channels: [
      ...range(8, 1).map(coil),
      ...range(8, 1).map(discrete),
      inputReg(10),
      holdingReg(12),
    ],
  },
  {
    id: 'prof-esp32-relay',
    name: 'EdgeOps ESP32 8-Relay Node',
    vendor: 'EdgeOps',
    protocol: 'Native EdgeOps',
    transport: 'Wi-Fi',
    description: 'First-party ESP32 relay controller. Exposes GPIO digital inputs and outputs plus an on-board ADC, reported natively over MQTT.',
    channels: [
      ...range(4, 2).map((i): ProfileChannel => ({ ref: `GPIO ${i}`, interface: 'Digital Input', writable: false })),
      ...range(4, 6).map((i): ProfileChannel => ({ ref: `GPIO ${i}`, interface: 'Digital Output', writable: true })),
      { ref: 'ADC 1', interface: 'Analog Input', writable: false },
    ],
  },
  {
    id: 'prof-c3',
    name: 'EdgeOps ESP32-C3 Sensor',
    vendor: 'EdgeOps',
    protocol: 'Native EdgeOps',
    transport: 'Wi-Fi',
    description: 'Compact environmental sensor node with two analog inputs, reported natively over MQTT.',
    channels: [
      { ref: 'ADC 1', interface: 'Analog Input', writable: false, unit: '°C' },
      { ref: 'ADC 2', interface: 'Analog Input', writable: false, unit: '%' },
    ],
  },
  {
    id: 'prof-battery',
    name: 'Generic Modbus Battery Monitor',
    vendor: 'Generic / OEM',
    protocol: 'Modbus RTU',
    transport: 'RS-485',
    description: 'Battery string monitor exposing voltage, current and state-of-charge as holding registers.',
    channels: [holdingReg(1), holdingReg(2), holdingReg(3)],
  },
  {
    id: 'prof-energy',
    name: 'Generic Modbus Energy Meter',
    vendor: 'Generic / OEM',
    protocol: 'Modbus RTU',
    transport: 'RS-485',
    description: 'Three-phase energy meter exposing power and line metrics as holding registers.',
    channels: [holdingReg(10), holdingReg(20)],
  },
]

// -- Derived helpers ---------------------------------------------------------

export function getSite(id: string) {
  return sites.find((s) => s.id === id)
}
export function getDevice(id: string) {
  return devices.find((d) => d.id === id)
}
export function getAsset(id: string) {
  return assets.find((a) => a.id === id)
}
export function getGateway(id: string) {
  return gateways.find((g) => g.id === id)
}
export function siteName(id: string) {
  return getSite(id)?.name ?? id
}
export function assetsForSite(id: string) {
  return assets.filter((a) => a.siteId === id)
}
export function devicesForSite(id: string) {
  return devices.filter((d) => d.siteId === id)
}
export function gatewaysForSite(id: string) {
  return gateways.filter((g) => g.siteId === id)
}
export function alarmsForSite(id: string) {
  return alarms.filter((a) => a.siteId === id)
}
export function assetName(id: string | null) {
  if (!id) return '—'
  return getAsset(id)?.name ?? id
}
export function getProfile(id?: string) {
  if (!id) return undefined
  return deviceProfiles.find((p) => p.id === id)
}

// -- The abstraction: Channel -> Point -> Asset ------------------------------
// A Point is the logical, named signal an engineer creates by mapping a raw
// hardware channel. Its "direction" is what makes the asset UI understandable
// to a non-technical customer.

export type PointDirection = 'command' | 'feedback' | 'measurement'

export interface Point {
  id: string // channel id it derives from
  name: string
  direction: PointDirection
  pointType: PointType
  writable: boolean
  unit: string | null
  rawValue: string
  inverted: boolean
  channelRef: string
  channelInterface: ChannelInterface
  deviceId: string
  deviceName: string
}

export function directionForPointType(pt: PointType | null): PointDirection {
  if (pt === 'Boolean Control') return 'command'
  if (pt === 'Analog') return 'measurement'
  return 'feedback'
}

const ON_VALUES = new Set(['on', 'closed', 'true', '1', 'running', 'active', 'high'])

// Resolve a boolean channel's raw contact state into a logical active flag,
// applying the engineer's inversion setting.
export function boolActive(rawValue: string, inverted: boolean): boolean {
  const on = ON_VALUES.has(rawValue.trim().toLowerCase())
  return inverted ? !on : on
}

export function pointsForAsset(assetId: string): Point[] {
  const out: Point[] = []
  for (const d of devices) {
    for (const ch of d.channels) {
      if (ch.assetId === assetId && ch.pointName && ch.pointType) {
        out.push({
          id: ch.id,
          name: ch.pointName,
          direction: directionForPointType(ch.pointType),
          pointType: ch.pointType,
          writable: ch.writable,
          unit: ch.unit,
          rawValue: ch.value,
          inverted: ch.inverted,
          channelRef: ch.ref,
          channelInterface: ch.interface,
          deviceId: d.id,
          deviceName: d.name,
        })
      }
    }
  }
  return out
}

export function devicesForAsset(assetId: string) {
  return devices.filter((d) => d.channels.some((c) => c.assetId === assetId))
}

export function deviceMappingStats(d: Device) {
  const mapped = d.channels.filter((c) => c.pointName)
  const assetIds = new Set(mapped.map((c) => c.assetId).filter(Boolean))
  return {
    channels: d.channels.length,
    mapped: mapped.length,
    unmapped: d.channels.length - mapped.length,
    points: mapped.length,
    assets: assetIds.size,
  }
}

export const platformStats = {
  organizations: 4,
  sites: 61,
  devices: 1284,
  online: 1251,
  warning: 21,
  offline: 12,
  telemetryRate: '3.4k pts/s',
  availability: '99.94%',
}

// Deterministic pseudo-random time series for telemetry charts.
export function series(seed: number, points = 48, base = 24, amp = 4): number[] {
  const out: number[] = []
  let x = seed * 1000
  for (let i = 0; i < points; i++) {
    x = (x * 9301 + 49297) % 233280
    const r = x / 233280
    const wave = Math.sin(i / 5 + seed) * amp
    out.push(Number((base + wave + (r - 0.5) * amp).toFixed(2)))
  }
  return out
}

// -- Asset Types --------------------------------------------------------------
// An Asset Type is a reusable semantic template for a class of real-world
// equipment. It declares the logical Points every asset of that kind should
// expose — independent of which hardware ultimately provides them. This is the
// counterpart to a Device Profile: a profile says what a box CAN do, an asset
// type says what a piece of equipment MEANS to a person.

export type PointRole = 'command' | 'status' | 'measurement' | 'alarm' | 'setpoint'
export type PointDataType = 'boolean' | 'integer' | 'float' | 'enum' | 'string'
export type PointAccess = 'read' | 'write' | 'read_write'

export const pointRoleLabels: Record<PointRole, string> = {
  command: 'Command',
  status: 'Status',
  measurement: 'Measurement',
  alarm: 'Alarm',
  setpoint: 'Setpoint',
}

export const pointDataTypeLabels: Record<PointDataType, string> = {
  boolean: 'Boolean',
  integer: 'Integer',
  float: 'Float',
  enum: 'Enum',
  string: 'String',
}

export const pointAccessLabels: Record<PointAccess, string> = {
  read: 'Read',
  write: 'Write',
  read_write: 'Read / Write',
}

// A single logical signal declared by an asset type.
export interface PointSpec {
  key: string // stable within the type, e.g. 'start'
  name: string // 'Start Command'
  role: PointRole
  dataType: PointDataType
  access: PointAccess
  unit?: string
  required: boolean
  description?: string
}

export interface AssetType {
  id: string
  name: string
  category: string
  icon: 'fan' | 'pump' | 'battery' | 'ups' | 'lightbulb' | 'gauge'
  description: string
  points: PointSpec[]
}

export const assetTypes: AssetType[] = [
  {
    id: 'at-ventilation',
    name: 'Ventilation Unit',
    category: 'HVAC',
    icon: 'fan',
    description: 'A fan or air-handling unit that can be started and stopped, reports whether it is actually running, and raises a fault.',
    points: [
      { key: 'start', name: 'Start Command', role: 'command', dataType: 'boolean', access: 'write', required: true, description: 'Starts and stops the unit.' },
      { key: 'running', name: 'Running Feedback', role: 'status', dataType: 'boolean', access: 'read', required: true, description: 'True when the motor is confirmed running.' },
      { key: 'fault', name: 'Fault', role: 'alarm', dataType: 'boolean', access: 'read', required: true, description: 'Active when the unit reports a fault.' },
      { key: 'airTemp', name: 'Air Temperature', role: 'measurement', dataType: 'float', access: 'read', unit: '°C', required: false },
      { key: 'motorCurrent', name: 'Motor Current', role: 'measurement', dataType: 'float', access: 'read', unit: 'A', required: false },
    ],
  },
  {
    id: 'at-pump',
    name: 'Pump',
    category: 'Water',
    icon: 'pump',
    description: 'A motor-driven pump with start/stop control, run feedback, fault and optional discharge pressure.',
    points: [
      { key: 'start', name: 'Start Command', role: 'command', dataType: 'boolean', access: 'write', required: true },
      { key: 'running', name: 'Running Feedback', role: 'status', dataType: 'boolean', access: 'read', required: true },
      { key: 'fault', name: 'Fault', role: 'alarm', dataType: 'boolean', access: 'read', required: true },
      { key: 'pressure', name: 'Discharge Pressure', role: 'measurement', dataType: 'float', access: 'read', unit: 'bar', required: false },
    ],
  },
  {
    id: 'at-ups',
    name: 'UPS',
    category: 'Power',
    icon: 'ups',
    description: 'An uninterruptible power supply reporting mains/battery status and battery health.',
    points: [
      { key: 'onBattery', name: 'On Battery', role: 'status', dataType: 'boolean', access: 'read', required: true },
      { key: 'voltage', name: 'String Voltage', role: 'measurement', dataType: 'float', access: 'read', unit: 'V', required: true },
      { key: 'soc', name: 'State of Charge', role: 'measurement', dataType: 'float', access: 'read', unit: '%', required: true },
      { key: 'current', name: 'Charge Current', role: 'measurement', dataType: 'float', access: 'read', unit: 'A', required: false },
    ],
  },
  {
    id: 'at-battery',
    name: 'Battery String',
    category: 'Power',
    icon: 'battery',
    description: 'A battery bank reporting voltage, state of charge and temperature.',
    points: [
      { key: 'voltage', name: 'Voltage', role: 'measurement', dataType: 'float', access: 'read', unit: 'V', required: true },
      { key: 'soc', name: 'State of Charge', role: 'measurement', dataType: 'float', access: 'read', unit: '%', required: true },
      { key: 'temperature', name: 'Temperature', role: 'measurement', dataType: 'float', access: 'read', unit: '°C', required: false },
    ],
  },
  {
    id: 'at-lighting',
    name: 'Lighting Zone',
    category: 'Lighting',
    icon: 'lightbulb',
    description: 'A switchable lighting circuit with on/off control and optional state feedback.',
    points: [
      { key: 'onOff', name: 'On / Off Command', role: 'command', dataType: 'boolean', access: 'write', required: true },
      { key: 'state', name: 'State Feedback', role: 'status', dataType: 'boolean', access: 'read', required: false },
    ],
  },
]

// -- Point Mappings -----------------------------------------------------------
// A Point Mapping is the binding between one logical Point (declared by an asset
// type) and one physical Channel (presented by a device). It is deliberately a
// SEPARATE entity so that a single asset can draw its points from several
// different physical devices, and so the physical source can be re-bound
// without changing the asset's semantic contract.

export interface PointMapping {
  id: string
  assetId: string
  pointKey: string // references PointSpec.key on the asset's type
  pointName: string
  role: PointRole
  deviceId: string
  channelId: string
  inverted: boolean
}

export const pointMappings: PointMapping[] = [
  // Ventilation Unit V1 — all points from the one Modbus 8R8I controller.
  { id: 'pm-vent-1', assetId: 'asset-vent', pointKey: 'start', pointName: 'Start Command', role: 'command', deviceId: 'dev-relay01', channelId: 'ch-c1', inverted: false },
  { id: 'pm-vent-2', assetId: 'asset-vent', pointKey: 'running', pointName: 'Running Feedback', role: 'status', deviceId: 'dev-relay01', channelId: 'ch-di1', inverted: false },
  { id: 'pm-vent-3', assetId: 'asset-vent', pointKey: 'fault', pointName: 'Fault', role: 'alarm', deviceId: 'dev-relay01', channelId: 'ch-di2', inverted: false },
  { id: 'pm-vent-4', assetId: 'asset-vent', pointKey: 'airTemp', pointName: 'Air Temperature', role: 'measurement', deviceId: 'dev-relay01', channelId: 'ch-ir1', inverted: false },
  { id: 'pm-vent-5', assetId: 'asset-vent', pointKey: 'motorCurrent', pointName: 'Motor Current', role: 'measurement', deviceId: 'dev-relay01', channelId: 'ch-hr1', inverted: false },
  // Main Pump — spans TWO devices: relay controller for control, sensor node for pressure.
  { id: 'pm-pump-1', assetId: 'asset-pump', pointKey: 'start', pointName: 'Start Command', role: 'command', deviceId: 'dev-relay03', channelId: 'ch-do1', inverted: false },
  { id: 'pm-pump-2', assetId: 'asset-pump', pointKey: 'running', pointName: 'Running Feedback', role: 'status', deviceId: 'dev-relay03', channelId: 'ch-di1', inverted: false },
  { id: 'pm-pump-3', assetId: 'asset-pump', pointKey: 'fault', pointName: 'Fault', role: 'alarm', deviceId: 'dev-relay03', channelId: 'ch-di2', inverted: true },
  { id: 'pm-pump-4', assetId: 'asset-pump', pointKey: 'pressure', pointName: 'Discharge Pressure', role: 'measurement', deviceId: 'dev-temp14', channelId: 'ch-t1', inverted: false },
  // UPS Server Room — battery monitor holding registers.
  { id: 'pm-ups-1', assetId: 'asset-ups', pointKey: 'voltage', pointName: 'String Voltage', role: 'measurement', deviceId: 'dev-batt02', channelId: 'ch-b1', inverted: false },
  { id: 'pm-ups-2', assetId: 'asset-ups', pointKey: 'current', pointName: 'Charge Current', role: 'measurement', deviceId: 'dev-batt02', channelId: 'ch-b2', inverted: false },
  { id: 'pm-ups-3', assetId: 'asset-ups', pointKey: 'soc', pointName: 'State of Charge', role: 'measurement', deviceId: 'dev-batt02', channelId: 'ch-b3', inverted: false },
]

// -- Asset Type / Profile / Mapping helpers ----------------------------------

export function getAssetType(id?: string) {
  if (!id) return undefined
  return assetTypes.find((t) => t.id === id)
}

export function assetTypeForAsset(asset: Asset) {
  return getAssetType(asset.typeId)
}

export function assetsOfType(typeId: string) {
  return assets.filter((a) => a.typeId === typeId)
}

export function devicesForProfile(profileId: string) {
  return devices.filter((d) => d.profileId === profileId)
}

export function mappingsForAsset(assetId: string) {
  return pointMappings.filter((m) => m.assetId === assetId)
}

// A logical point spec joined with its current binding (if any) and the live
// value read from the underlying channel — the full provenance chain.
export interface ResolvedPoint {
  spec: PointSpec
  mapping?: PointMapping
  device?: Device
  channel?: Channel
  rawValue?: string
  boolActive?: boolean
}

export function resolvedPointsForAsset(assetId: string): ResolvedPoint[] {
  const asset = getAsset(assetId)
  const type = asset ? assetTypeForAsset(asset) : undefined
  if (!type) return []
  const mappings = mappingsForAsset(assetId)
  return type.points.map((spec) => {
    const mapping = mappings.find((m) => m.pointKey === spec.key)
    const device = mapping ? getDevice(mapping.deviceId) : undefined
    const channel = device?.channels.find((c) => c.id === mapping?.channelId)
    const rawValue = channel?.value
    return {
      spec,
      mapping,
      device,
      channel,
      rawValue,
      boolActive: spec.dataType === 'boolean' && rawValue != null ? boolActive(rawValue, mapping?.inverted ?? false) : undefined,
    }
  })
}

// Distinct devices that contribute at least one point to an asset (via mappings).
export function mappedDevicesForAsset(assetId: string) {
  const ids = new Set(mappingsForAsset(assetId).map((m) => m.deviceId))
  return devices.filter((d) => ids.has(d.id))
}
