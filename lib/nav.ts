import {
  LayoutDashboard,
  Building2,
  Boxes,
  Shapes,
  Cpu,
  FileCog,
  RadioTower,
  TriangleAlert,
  PackageCheck,
  Users,
  ScrollText,
  Settings,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  section: 'operate' | 'infrastructure' | 'admin'
}

export const navItems: NavItem[] = [
  { label: 'Overview', href: '/', icon: LayoutDashboard, section: 'operate' },
  { label: 'Sites', href: '/sites', icon: Building2, section: 'operate' },
  { label: 'Assets', href: '/assets', icon: Boxes, section: 'operate' },
  { label: 'Asset Types', href: '/asset-types', icon: Shapes, section: 'operate' },
  { label: 'Alarms', href: '/alarms', icon: TriangleAlert, section: 'operate' },
  { label: 'Devices', href: '/devices', icon: Cpu, section: 'infrastructure' },
  { label: 'Device Profiles', href: '/device-profiles', icon: FileCog, section: 'infrastructure' },
  { label: 'Gateways', href: '/gateways', icon: RadioTower, section: 'infrastructure' },
  { label: 'Firmware', href: '/firmware', icon: PackageCheck, section: 'infrastructure' },
  { label: 'Users & Roles', href: '/users', icon: Users, section: 'admin' },
  { label: 'Audit Log', href: '/audit', icon: ScrollText, section: 'admin' },
  { label: 'Settings', href: '/settings', icon: Settings, section: 'admin' },
]

export const sectionLabels: Record<NavItem['section'], string> = {
  operate: 'Operate',
  infrastructure: 'Infrastructure',
  admin: 'Administration',
}
