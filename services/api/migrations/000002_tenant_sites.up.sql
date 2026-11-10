CREATE TABLE users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL UNIQUE,
    display_name text NOT NULL,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE organizations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE organization_memberships (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('owner', 'admin', 'engineer', 'operator', 'viewer')),
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, organization_id)
);

CREATE TABLE sites (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name text NOT NULL,
    timezone text NOT NULL DEFAULT 'UTC',
    address_text text NOT NULL DEFAULT '',
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (organization_id, name)
);

CREATE INDEX sites_organization_id_idx ON sites (organization_id);

INSERT INTO users (id, email, display_name)
VALUES ('00000000-0000-4000-8000-000000000001', 'developer@edgeops.local', 'EdgeOps Developer');

INSERT INTO organizations (id, name, slug)
VALUES ('00000000-0000-4000-8000-000000000010', 'ANTB Engineering', 'antb-engineering');

INSERT INTO organization_memberships (user_id, organization_id, role)
VALUES (
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000010',
    'owner'
);

INSERT INTO sites (id, organization_id, name, timezone, address_text)
VALUES (
    '00000000-0000-4000-8000-000000000100',
    '00000000-0000-4000-8000-000000000010',
    'Demo Laboratory',
    'Asia/Almaty',
    'Almaty, Kazakhstan'
);
