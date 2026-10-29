CREATE TABLE edgeops_infrastructure_metadata (
    key text PRIMARY KEY,
    value text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO edgeops_infrastructure_metadata (key, value)
VALUES ('schema_baseline', 'phase-1');
