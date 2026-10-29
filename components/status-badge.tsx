import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import type { ConnectionStatus, AlarmSeverity, AlarmState } from '@/lib/mock-data'

const connectionMap: Record<ConnectionStatus, { label: string; variant: 'success' | 'warning' | 'critical' | 'info' | 'default' }> = {
  online: { label: 'Online', variant: 'success' },
  offline: { label: 'Offline', variant: 'critical' },
  warning: { label: 'Warning', variant: 'warning' },
  updating: { label: 'Updating', variant: 'info' },
}

export function ConnectionBadge({ status, className }: { status: ConnectionStatus; className?: string }) {
  const { label, variant } = connectionMap[status]
  return (
    <Badge variant={variant} className={className}>
      <StatusDot status={status} />
      {label}
    </Badge>
  )
}

const severityMap: Record<AlarmSeverity, { label: string; variant: 'critical' | 'warning' | 'info' }> = {
  critical: { label: 'Critical', variant: 'critical' },
  warning: { label: 'Warning', variant: 'warning' },
  info: { label: 'Info', variant: 'info' },
}

export function SeverityBadge({ severity }: { severity: AlarmSeverity }) {
  const { label, variant } = severityMap[severity]
  return <Badge variant={variant}>{label}</Badge>
}

const alarmStateMap: Record<AlarmState, { label: string; variant: 'default' | 'success' | 'warning' }> = {
  active: { label: 'Active', variant: 'warning' },
  acknowledged: { label: 'Acknowledged', variant: 'default' },
  resolved: { label: 'Resolved', variant: 'success' },
}

export function AlarmStateBadge({ state }: { state: AlarmState }) {
  const { label, variant } = alarmStateMap[state]
  return <Badge variant={variant}>{label}</Badge>
}

const dotColor: Record<string, string> = {
  online: 'bg-[var(--success)]',
  healthy: 'bg-[var(--success)]',
  warning: 'bg-[var(--warning)]',
  critical: 'bg-destructive',
  offline: 'bg-muted-foreground',
  updating: 'bg-[var(--info)]',
}

export function StatusDot({ status, pulse }: { status: string; pulse?: boolean }) {
  return (
    <span className="relative inline-flex size-2 items-center justify-center">
      {pulse && status !== 'offline' && (
        <span className={cn('absolute inline-flex size-2 animate-ping rounded-full opacity-60', dotColor[status])} />
      )}
      <span className={cn('inline-flex size-2 rounded-full', dotColor[status] ?? 'bg-muted-foreground')} />
    </span>
  )
}
