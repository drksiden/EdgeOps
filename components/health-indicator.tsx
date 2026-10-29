import { cn } from '@/lib/utils'
import { StatusDot } from '@/components/status-badge'
import type { HealthStatus } from '@/lib/mock-data'

const label: Record<HealthStatus, string> = {
  healthy: 'Healthy',
  warning: 'Warning',
  critical: 'Critical',
  offline: 'Offline',
}

const textColor: Record<HealthStatus, string> = {
  healthy: 'text-[var(--success)]',
  warning: 'text-[var(--warning)]',
  critical: 'text-destructive',
  offline: 'text-muted-foreground',
}

export function HealthIndicator({
  status,
  showLabel = true,
  pulse,
  className,
}: {
  status: HealthStatus
  showLabel?: boolean
  pulse?: boolean
  className?: string
}) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-sm', className)}>
      <StatusDot status={status} pulse={pulse} />
      {showLabel && <span className={cn('font-medium', textColor[status])}>{label[status]}</span>}
    </span>
  )
}
