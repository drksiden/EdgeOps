package tenant

import "time"

type Organization struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Slug      string    `json:"slug"`
	Status    string    `json:"status"`
	SiteCount int       `json:"siteCount"`
	CreatedAt time.Time `json:"createdAt"`
}

type Site struct {
	ID             string    `json:"id"`
	OrganizationID string    `json:"organizationId"`
	Organization   string    `json:"organizationName"`
	Name           string    `json:"name"`
	Timezone       string    `json:"timezone"`
	AddressText    string    `json:"addressText"`
	Status         string    `json:"status"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
}

type CreateSite struct {
	Name        string `json:"name" minLength:"1" maxLength:"200"`
	Timezone    string `json:"timezone" minLength:"1" maxLength:"100"`
	AddressText string `json:"addressText" maxLength:"500"`
}

type UpdateSite struct {
	Name        string `json:"name" minLength:"1" maxLength:"200"`
	Timezone    string `json:"timezone" minLength:"1" maxLength:"100"`
	AddressText string `json:"addressText" maxLength:"500"`
	Status      string `json:"status" enum:"active,disabled"`
}
