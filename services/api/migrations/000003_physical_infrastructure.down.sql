DROP TABLE IF EXISTS device_channels;
DROP TABLE IF EXISTS device_connections;
DROP TABLE IF EXISTS devices;
DROP TABLE IF EXISTS gateways;
DROP TABLE IF EXISTS channel_definitions;
DROP TABLE IF EXISTS device_profile_versions;
DROP TABLE IF EXISTS device_profiles;
ALTER TABLE sites DROP CONSTRAINT IF EXISTS sites_id_organization_unique;
