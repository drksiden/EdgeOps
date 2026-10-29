import { Fan, Droplets, Battery, BatteryCharging, Lightbulb, Gauge, type LucideIcon } from 'lucide-react'
import type { AssetType, PointRole } from '@/lib/mock-data'

type BadgeVariant = 'default' | 'primary' | 'info' | 'success' | 'warning' | 'critical' | 'outline'

const ICONS: Record<AssetType['icon'], LucideIcon> = {
  fan: Fan,
  pump: Droplets,
  battery: Battery,
  ups: BatteryCharging,
  lightbulb: Lightbulb,
  gauge: Gauge,
}

export function assetTypeIcon(icon: AssetType['icon']): LucideIcon {
  return ICONS[icon] ?? Gauge
}

export function AssetTypeIcon({
  icon,
  className,
}: {
  icon: AssetType['icon']
  className?: string
}) {
  const Icon = ICONS[icon] ?? Gauge
  return <Icon className={className} />
}

export const roleBadgeVariant: Record<PointRole, BadgeVariant> = {
  command: 'primary',
  status: 'info',
  measurement: 'outline',
  alarm: 'critical',
  setpoint: 'warning',
}
