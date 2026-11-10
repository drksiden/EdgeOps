export interface Organization {
  id: string
  name: string
  slug: string
  status: 'active' | 'disabled'
  siteCount: number
  createdAt: string
}

export interface Site {
  id: string
  organizationId: string
  organizationName: string
  name: string
  timezone: string
  addressText: string
  status: 'active' | 'disabled'
  createdAt: string
  updatedAt: string
}

const apiURL = process.env.EDGEOPS_API_URL ?? 'http://localhost:8080'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiURL}${path}`, { cache: 'no-store', ...init })
  if (!response.ok) throw new Error(`EdgeOps API returned ${response.status}`)
  return response.json() as Promise<T>
}

export function listOrganizations() {
  return request<Organization[]>('/api/v1/organizations')
}

export function listSites(organizationId: string) {
  return request<Site[]>(`/api/v1/organizations/${organizationId}/sites`)
}

export function getSite(organizationId: string, siteId: string) {
  return request<Site>(`/api/v1/organizations/${organizationId}/sites/${siteId}`)
}

export function createSite(organizationId: string, input: Pick<Site, 'name' | 'timezone' | 'addressText'>) {
  return request<Site>(`/api/v1/organizations/${organizationId}/sites`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(input),
  })
}

export function updateSite(organizationId: string, siteId: string, input: Pick<Site, 'name' | 'timezone' | 'addressText' | 'status'>) {
  return request<Site>(`/api/v1/organizations/${organizationId}/sites/${siteId}`, {
    method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(input),
  })
}
