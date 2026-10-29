import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  tone = 'default',
  className,
}: {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  tone?: 'default' | 'warning' | 'critical'
  className?: string
}) {
  const iconTone = {
    default: 'text-muted-foreground bg-muted',
    warning: 'text-[var(--warning)] bg-[var(--warning)]/10',
    critical: 'text-destructive bg-destructive/10',
  }[tone]

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed border-border px-6 py-12 text-center',
        className,
      )}
    >
      <span className={cn('flex size-11 items-center justify-center rounded-lg', iconTone)}>
        <Icon className="size-5" aria-hidden />
      </span>
      <h3 className="mt-4 text-sm font-medium text-foreground">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground text-pretty">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
