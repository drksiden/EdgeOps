import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import type { LucideIcon } from 'lucide-react'

export function MetricCard({
  label,
  value,
  unit,
  icon: Icon,
  hint,
  tone = 'default',
  className,
}: {
  label: string
  value: string | number
  unit?: string
  icon?: LucideIcon
  hint?: React.ReactNode
  tone?: 'default' | 'success' | 'warning' | 'critical' | 'primary'
  className?: string
}) {
  const toneColor = {
    default: 'text-foreground',
    primary: 'text-primary',
    success: 'text-[var(--success)]',
    warning: 'text-[var(--warning)]',
    critical: 'text-destructive',
  }[tone]

  return (
    <Card className={cn('p-4', className)}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
        {Icon && <Icon className="size-4 text-muted-foreground" aria-hidden />}
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className={cn('text-2xl font-semibold tabular-nums tracking-tight', toneColor)}>{value}</span>
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </div>
      {hint && <div className="mt-1.5 text-xs text-muted-foreground">{hint}</div>}
    </Card>
  )
}
