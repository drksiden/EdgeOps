package physical

import (
	"encoding/json"
	"time"
)

type ChannelDefinition struct {
	ID          string         `json:"id"`
	Key         string         `json:"key"`
	Name        string         `json:"name"`
	Kind        string         `json:"kind"`
	DataType    string         `json:"dataType"`
	Access      string         `json:"access"`
	HardwareRef string         `json:"hardwareRef"`
	Unit        *string        `json:"unit"`
	Metadata    map[string]any `json:"metadata"`
}

type ProfileVersion struct {
	ID          string              `json:"id"`
	ProfileID   string              `json:"profileId"`
	Version     int                 `json:"version"`
	Status      string              `json:"status"`
	CreatedAt   time.Time           `json:"createdAt"`
	PublishedAt *time.Time          `json:"publishedAt"`
	Channels    []ChannelDefinition `json:"channels"`
}

type DeviceProfile struct {
	ID           string           `json:"id"`
	Name         string           `json:"name"`
	Manufacturer string           `json:"manufacturer"`
	Model        string           `json:"model"`
	Description  string           `json:"description"`
	Status       string           `json:"status"`
	CreatedAt    time.Time        `json:"createdAt"`
	UpdatedAt    time.Time        `json:"updatedAt"`
	Versions     []ProfileVersion `json:"versions"`
}

type CreateProfile struct {
	Name         string `json:"name" minLength:"1" maxLength:"200"`
	Manufacturer string `json:"manufacturer" minLength:"1" maxLength:"200"`
	Model        string `json:"model" minLength:"1" maxLength:"200"`
	Description  string `json:"description" maxLength:"2000"`
	Status       string `json:"status" enum:"draft,active,deprecated"`
}

type CreateChannelDefinition struct {
	Key         string         `json:"key" minLength:"1" maxLength:"100"`
	Name        string         `json:"name" minLength:"1" maxLength:"200"`
	Kind        string         `json:"kind" minLength:"1" maxLength:"100"`
	DataType    string         `json:"dataType" enum:"boolean,integer,float,string,enum"`
	Access      string         `json:"access" enum:"read,write,read_write"`
	HardwareRef string         `json:"hardwareRef" minLength:"1" maxLength:"200"`
	Unit        *string        `json:"unit,omitempty" maxLength:"50"`
	Metadata    map[string]any `json:"metadata,omitempty"`
}

type CreateProfileVersion struct {
	Version  int                       `json:"version" minimum:"1"`
	Status   string                    `json:"status" enum:"draft,published,deprecated"`
	Channels []CreateChannelDefinition `json:"channels" minItems:"1"`
}

type Gateway struct {
	ID              string     `json:"id"`
	OrganizationID  string     `json:"organizationId"`
	SiteID          string     `json:"siteId"`
	SiteName        string     `json:"siteName"`
	Name            string     `json:"name"`
	Type            string     `json:"type"`
	HardwareModel   string     `json:"hardwareModel"`
	SoftwareVersion string     `json:"softwareVersion"`
	Status          string     `json:"status"`
	LastSeenAt      *time.Time `json:"lastSeenAt"`
	CreatedAt       time.Time  `json:"createdAt"`
	UpdatedAt       time.Time  `json:"updatedAt"`
}

type CreateGateway struct {
	Name            string `json:"name" minLength:"1" maxLength:"200"`
	Type            string `json:"type" enum:"esp32_p4,linux_agent"`
	HardwareModel   string `json:"hardwareModel" minLength:"1" maxLength:"200"`
	SoftwareVersion string `json:"softwareVersion" maxLength:"100"`
}

type UpdateGateway struct {
	Name            string `json:"name" minLength:"1" maxLength:"200"`
	HardwareModel   string `json:"hardwareModel" minLength:"1" maxLength:"200"`
	SoftwareVersion string `json:"softwareVersion" maxLength:"100"`
	Status          string `json:"status" enum:"provisioning,online,offline,disabled"`
}

type ConnectionSummary struct {
	Type string `json:"type"`
}

type DeviceChannel struct {
	ID           string  `json:"id"`
	DefinitionID string  `json:"definitionId"`
	Key          string  `json:"key"`
	Name         string  `json:"name"`
	Kind         string  `json:"kind"`
	DataType     string  `json:"dataType"`
	Access       string  `json:"access"`
	HardwareRef  string  `json:"hardwareRef"`
	Unit         *string `json:"unit"`
	Enabled      bool    `json:"enabled"`
}

type Device struct {
	ID               string            `json:"id"`
	OrganizationID   string            `json:"organizationId"`
	SiteID           string            `json:"siteId"`
	SiteName         string            `json:"siteName"`
	GatewayID        *string           `json:"gatewayId"`
	GatewayName      *string           `json:"gatewayName"`
	ProfileID        string            `json:"profileId"`
	ProfileVersionID string            `json:"profileVersionId"`
	ProfileName      string            `json:"profileName"`
	ProfileVersion   int               `json:"profileVersion"`
	Name             string            `json:"name"`
	ExternalID       *string           `json:"externalId"`
	SerialNumber     *string           `json:"serialNumber"`
	Status           string            `json:"status"`
	LastSeenAt       *time.Time        `json:"lastSeenAt"`
	Connection       ConnectionSummary `json:"connection"`
	Channels         []DeviceChannel   `json:"channels"`
	CreatedAt        time.Time         `json:"createdAt"`
	UpdatedAt        time.Time         `json:"updatedAt"`
}

type CreateDevice struct {
	GatewayID        *string `json:"gatewayId,omitempty" format:"uuid"`
	ProfileVersionID string  `json:"profileVersionId" format:"uuid"`
	Name             string  `json:"name" minLength:"1" maxLength:"200"`
	ExternalID       *string `json:"externalId,omitempty" maxLength:"200"`
	SerialNumber     *string `json:"serialNumber,omitempty" maxLength:"200"`
	Connection       struct {
		Type   string          `json:"type" enum:"native_mqtt,modbus_rtu,modbus_tcp"`
		Config json.RawMessage `json:"config"`
	} `json:"connection"`
}

type UpdateDevice struct {
	Name         string  `json:"name" minLength:"1" maxLength:"200"`
	ExternalID   *string `json:"externalId,omitempty" maxLength:"200"`
	SerialNumber *string `json:"serialNumber,omitempty" maxLength:"200"`
	Status       string  `json:"status" enum:"provisioning,online,offline,disabled,error"`
}
