import { cn } from '@/lib/utils'
import { Terminal, TriangleAlert, Activity, PackageCheck, Settings2 } from 'lucide-react'
import type { ActivityEvent } from '@/lib/mock-data'

const iconMap = {
  command: Terminal,
  alarm: TriangleAlert,
  status: Activity,
  deployment: PackageCheck,
  config: Settings2,
}

const toneMap = {
  command: 'text-primary',
  alarm: 'text-destructive',
  status: 'text-[var(--warning)]',
  deployment: 'text-[var(--info)]',
  config: 'text-muted-foreground',
}

export function ActivityTimeline({ events, className }: { events: ActivityEvent[]; className?: string }) {
  return (
    <ol className={cn('relative flex flex-col', className)}>
      {events.map((e, i) => {
        const Icon = iconMap[e.kind]
        return (
          <li key={e.id} className="relative flex gap-3 pb-4 last:pb-0">
            {i !== events.length - 1 && (
              <span className="absolute left-[11px] top-6 bottom-0 w-px bg-border" aria-hidden />
            )}
            <span
              className={cn(
                'relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border border-border bg-card',
                toneMap[e.kind],
              )}
            >
              <Icon className="size-3" aria-hidden />
            </span>
            <div className="flex min-w-0 flex-col gap-0.5 pt-0.5">
              <p className="text-sm leading-snug text-foreground text-pretty">{e.text}</p>
              <span className="font-mono text-xs text-muted-foreground">{e.time}</span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
