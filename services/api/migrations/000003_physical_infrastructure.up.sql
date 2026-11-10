ALTER TABLE sites ADD CONSTRAINT sites_id_organization_unique UNIQUE (id, organization_id);

CREATE TABLE device_profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    manufacturer text NOT NULL,
    model text NOT NULL,
    description text NOT NULL DEFAULT '',
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'deprecated')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (manufacturer, model)
);

CREATE TABLE device_profile_versions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    device_profile_id uuid NOT NULL REFERENCES device_profiles(id) ON DELETE CASCADE,
    version integer NOT NULL CHECK (version > 0),
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'deprecated')),
    created_at timestamptz NOT NULL DEFAULT now(),
    published_at timestamptz,
    UNIQUE (device_profile_id, version),
    CHECK ((status = 'published' AND published_at IS NOT NULL) OR status <> 'published')
);

CREATE TABLE channel_definitions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    device_profile_version_id uuid NOT NULL REFERENCES device_profile_versions(id) ON DELETE CASCADE,
    key text NOT NULL,
    name text NOT NULL,
    kind text NOT NULL,
    data_type text NOT NULL CHECK (data_type IN ('boolean', 'integer', 'float', 'string', 'enum')),
    access text NOT NULL CHECK (access IN ('read', 'write', 'read_write')),
    hardware_ref text NOT NULL,
    unit text,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (device_profile_version_id, key)
);

CREATE TABLE gateways (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    site_id uuid NOT NULL,
    name text NOT NULL,
    type text NOT NULL CHECK (type IN ('esp32_p4', 'linux_agent')),
    hardware_model text NOT NULL,
    software_version text NOT NULL DEFAULT '',
    status text NOT NULL DEFAULT 'provisioning' CHECK (status IN ('provisioning', 'online', 'offline', 'disabled')),
    last_seen_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    FOREIGN KEY (site_id, organization_id) REFERENCES sites(id, organization_id) ON DELETE CASCADE,
    UNIQUE (id, organization_id, site_id),
    UNIQUE (site_id, name)
);

CREATE TABLE devices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    site_id uuid NOT NULL,
    gateway_id uuid,
    device_profile_version_id uuid NOT NULL REFERENCES device_profile_versions(id),
    name text NOT NULL,
    external_id text,
    serial_number text,
    status text NOT NULL DEFAULT 'provisioning' CHECK (status IN ('provisioning', 'online', 'offline', 'disabled', 'error')),
    last_seen_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    FOREIGN KEY (site_id, organization_id) REFERENCES sites(id, organization_id) ON DELETE CASCADE,
    FOREIGN KEY (gateway_id, organization_id, site_id) REFERENCES gateways(id, organization_id, site_id),
    UNIQUE (id, organization_id, site_id),
    UNIQUE (organization_id, external_id),
    UNIQUE (organization_id, serial_number),
    UNIQUE (site_id, name)
);

CREATE TABLE device_connections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id uuid NOT NULL UNIQUE REFERENCES devices(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('native_mqtt', 'modbus_rtu', 'modbus_tcp')),
    config jsonb NOT NULL CHECK (jsonb_typeof(config) = 'object'),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE device_channels (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id uuid NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    channel_definition_id uuid NOT NULL REFERENCES channel_definitions(id),
    enabled boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (device_id, channel_definition_id)
);

CREATE INDEX device_profile_versions_profile_idx ON device_profile_versions (device_profile_id);
CREATE INDEX channel_definitions_version_idx ON channel_definitions (device_profile_version_id);
CREATE INDEX gateways_tenant_site_idx ON gateways (organization_id, site_id);
CREATE INDEX devices_tenant_site_idx ON devices (organization_id, site_id);
CREATE INDEX devices_gateway_idx ON devices (gateway_id) WHERE gateway_id IS NOT NULL;
CREATE INDEX devices_profile_version_idx ON devices (device_profile_version_id);
CREATE INDEX device_channels_device_idx ON device_channels (device_id);

INSERT INTO device_profiles (id, name, manufacturer, model, description, status)
VALUES (
    '00000000-0000-4000-8000-000000001000',
    'ESP32-C3 Control Node', 'EdgeOps', 'ESP32-C3 Super Mini',
    'Native EdgeOps relay and digital-input control node.', 'active'
);

INSERT INTO device_profile_versions (id, device_profile_id, version, status, published_at)
VALUES (
    '00000000-0000-4000-8000-000000001001',
    '00000000-0000-4000-8000-000000001000', 1, 'published', now()
);

INSERT INTO channel_definitions (id, device_profile_version_id, key, name, kind, data_type, access, hardware_ref)
VALUES
    ('00000000-0000-4000-8000-000000001010', '00000000-0000-4000-8000-000000001001', 'relay_1', 'Relay 1', 'gpio_output', 'boolean', 'read_write', 'GPIO4'),
    ('00000000-0000-4000-8000-000000001011', '00000000-0000-4000-8000-000000001001', 'feedback_1', 'Feedback 1', 'gpio_input', 'boolean', 'read', 'GPIO5'),
    ('00000000-0000-4000-8000-000000001012', '00000000-0000-4000-8000-000000001001', 'door_contact', 'Door Contact', 'gpio_input', 'boolean', 'read', 'GPIO6');

INSERT INTO gateways (id, organization_id, site_id, name, type, hardware_model, software_version, status)
VALUES (
    '00000000-0000-4000-8000-000000002000',
    '00000000-0000-4000-8000-000000000010',
    '00000000-0000-4000-8000-000000000100',
    'Demo Edge Gateway', 'esp32_p4', 'ESP32-P4 + ESP32-C6', '0.1.0-dev', 'offline'
);

INSERT INTO devices (id, organization_id, site_id, device_profile_version_id, name, external_id, status)
VALUES (
    '00000000-0000-4000-8000-000000003000',
    '00000000-0000-4000-8000-000000000010',
    '00000000-0000-4000-8000-000000000100',
    '00000000-0000-4000-8000-000000001001',
    'Control Node #1', 'edgeops-c3-01', 'offline'
);

INSERT INTO device_connections (id, device_id, type, config)
VALUES (
    '00000000-0000-4000-8000-000000003001',
    '00000000-0000-4000-8000-000000003000',
    'native_mqtt', '{"clientId":"edgeops-c3-01"}'::jsonb
);

INSERT INTO device_channels (device_id, channel_definition_id)
SELECT '00000000-0000-4000-8000-000000003000', id
FROM channel_definitions
WHERE device_profile_version_id = '00000000-0000-4000-8000-000000001001';
