import { listOrganizations, listSites, type Site } from '@/lib/edgeops-api'

export type ChannelDefinition={id:string;key:string;name:string;kind:string;dataType:string;access:string;hardwareRef:string;unit:string|null;metadata:Record<string,unknown>}
export type ProfileVersion={id:string;profileId:string;version:number;status:'draft'|'published'|'deprecated';createdAt:string;publishedAt:string|null;channels:ChannelDefinition[]}
export type DeviceProfile={id:string;name:string;manufacturer:string;model:string;description:string;status:'draft'|'active'|'deprecated';createdAt:string;updatedAt:string;versions:ProfileVersion[]}
export type Gateway={id:string;organizationId:string;siteId:string;siteName:string;name:string;type:'esp32_p4'|'linux_agent';hardwareModel:string;softwareVersion:string;status:'provisioning'|'online'|'offline'|'disabled';lastSeenAt:string|null;createdAt:string;updatedAt:string}
export type DeviceChannel={id:string;definitionId:string;key:string;name:string;kind:string;dataType:string;access:string;hardwareRef:string;unit:string|null;enabled:boolean}
export type Device={id:string;organizationId:string;siteId:string;siteName:string;gatewayId:string|null;gatewayName:string|null;profileId:string;profileVersionId:string;profileName:string;profileVersion:number;name:string;externalId:string|null;serialNumber:string|null;status:'provisioning'|'online'|'offline'|'disabled'|'error';lastSeenAt:string|null;connection:{type:'native_mqtt'|'modbus_rtu'|'modbus_tcp'};channels:DeviceChannel[];createdAt:string;updatedAt:string}

const apiURL=process.env.EDGEOPS_API_URL??'http://localhost:8080'
async function request<T>(path:string,init?:RequestInit):Promise<T>{const response=await fetch(`${apiURL}${path}`,{cache:'no-store',...init});if(!response.ok)throw new Error(`EdgeOps API returned ${response.status}`);return response.json() as Promise<T>}
export const listDeviceProfiles=()=>request<DeviceProfile[]>('/api/v1/device-profiles')
export const getDeviceProfile=(id:string)=>request<DeviceProfile>(`/api/v1/device-profiles/${id}`)
export const getProfileVersion=(profile:string,version:string)=>request<ProfileVersion>(`/api/v1/device-profiles/${profile}/versions/${version}`)
export const listGateways=(org:string,site:string)=>request<Gateway[]>(`/api/v1/organizations/${org}/sites/${site}/gateways`)
export const getGateway=(id:string)=>request<Gateway>(`/api/v1/gateways/${id}`)
export const listDevices=(org:string,site:string)=>request<Device[]>(`/api/v1/organizations/${org}/sites/${site}/devices`)
export const getDevice=(id:string)=>request<Device>(`/api/v1/devices/${id}`)
export const listDeviceChannels=(id:string)=>request<DeviceChannel[]>(`/api/v1/devices/${id}/channels`)
export function createDevice(org:string,site:string,input:unknown){return request<Device>(`/api/v1/organizations/${org}/sites/${site}/devices`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(input)})}

export async function inventoryContext(){const organizations=await listOrganizations();const sites=(await Promise.all(organizations.map(async organization=>(await listSites(organization.id)).map(site=>({organization,site}))))).flat();return {organizations,sites}}
export async function allGateways(){const {sites}=await inventoryContext();return (await Promise.all(sites.map(({organization,site})=>listGateways(organization.id,site.id)))).flat()}
export async function allDevices(){const {sites}=await inventoryContext();return (await Promise.all(sites.map(({organization,site})=>listDevices(organization.id,site.id)))).flat()}
export type SiteContext={organization:{id:string;name:string};site:Site}
