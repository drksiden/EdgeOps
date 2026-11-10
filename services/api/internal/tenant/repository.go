package tenant

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
)

var ErrNotFound = errors.New("tenant resource not found")

type DB interface {
	Query(context.Context, string, ...any) (pgx.Rows, error)
	QueryRow(context.Context, string, ...any) pgx.Row
}

type Repository struct{ db DB }

func NewRepository(db DB) *Repository { return &Repository{db: db} }

func (r *Repository) ListOrganizations(ctx context.Context) ([]Organization, error) {
	rows, err := r.db.Query(ctx, `
		SELECT o.id, o.name, o.slug, o.status, count(s.id), o.created_at
		FROM organizations o
		LEFT JOIN sites s ON s.organization_id = o.id
		GROUP BY o.id
		ORDER BY o.name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := make([]Organization, 0)
	for rows.Next() {
		var item Organization
		if err := rows.Scan(&item.ID, &item.Name, &item.Slug, &item.Status, &item.SiteCount, &item.CreatedAt); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *Repository) ListSites(ctx context.Context, organizationID string) ([]Site, error) {
	rows, err := r.db.Query(ctx, `
		SELECT s.id, s.organization_id, o.name, s.name, s.timezone, s.address_text, s.status, s.created_at, s.updated_at
		FROM sites s JOIN organizations o ON o.id = s.organization_id
		WHERE s.organization_id = $1 ORDER BY s.name`, organizationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := make([]Site, 0)
	for rows.Next() {
		var item Site
		if err := scanSite(rows, &item); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *Repository) GetSite(ctx context.Context, organizationID, siteID string) (Site, error) {
	var item Site
	err := scanSite(r.db.QueryRow(ctx, `
		SELECT s.id, s.organization_id, o.name, s.name, s.timezone, s.address_text, s.status, s.created_at, s.updated_at
		FROM sites s JOIN organizations o ON o.id = s.organization_id
		WHERE s.organization_id = $1 AND s.id = $2`, organizationID, siteID), &item)
	if errors.Is(err, pgx.ErrNoRows) {
		return Site{}, ErrNotFound
	}
	return item, err
}

func (r *Repository) CreateSite(ctx context.Context, organizationID string, input CreateSite) (Site, error) {
	var item Site
	err := scanSite(r.db.QueryRow(ctx, `
		WITH inserted AS (
			INSERT INTO sites (organization_id, name, timezone, address_text)
			SELECT id, $2, $3, $4 FROM organizations WHERE id = $1
			RETURNING *
		)
		SELECT s.id, s.organization_id, o.name, s.name, s.timezone, s.address_text, s.status, s.created_at, s.updated_at
		FROM inserted s JOIN organizations o ON o.id = s.organization_id`, organizationID, input.Name, input.Timezone, input.AddressText), &item)
	if errors.Is(err, pgx.ErrNoRows) {
		return Site{}, ErrNotFound
	}
	return item, err
}

func (r *Repository) UpdateSite(ctx context.Context, organizationID, siteID string, input UpdateSite) (Site, error) {
	var item Site
	err := scanSite(r.db.QueryRow(ctx, `
		WITH updated AS (
			UPDATE sites SET name=$3, timezone=$4, address_text=$5, status=$6, updated_at=now()
			WHERE organization_id=$1 AND id=$2 RETURNING *
		)
		SELECT s.id, s.organization_id, o.name, s.name, s.timezone, s.address_text, s.status, s.created_at, s.updated_at
		FROM updated s JOIN organizations o ON o.id = s.organization_id`, organizationID, siteID, input.Name, input.Timezone, input.AddressText, input.Status), &item)
	if errors.Is(err, pgx.ErrNoRows) {
		return Site{}, ErrNotFound
	}
	return item, err
}

type scanner interface{ Scan(...any) error }

func scanSite(row scanner, item *Site) error {
	return row.Scan(&item.ID, &item.OrganizationID, &item.Organization, &item.Name, &item.Timezone, &item.AddressText, &item.Status, &item.CreatedAt, &item.UpdatedAt)
}
