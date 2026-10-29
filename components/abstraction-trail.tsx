import { ChevronRight, Cpu, Cable, Tag, Boxes, MonitorSmartphone } from 'lucide-react'
import { cn } from '@/lib/utils'

const STAGES = [
  { key: 'hardware', label: 'Hardware', icon: Cpu },
  { key: 'channel', label: 'Channel', icon: Cable },
  { key: 'point', label: 'Point', icon: Tag },
  { key: 'asset', label: 'Asset', icon: Boxes },
  { key: 'customer', label: 'Customer', icon: MonitorSmartphone },
] as const

type StageKey = (typeof STAGES)[number]['key']

export function AbstractionTrail({
  active,
  className,
}: {
  active: StageKey | StageKey[]
  className?: string
}) {
  const activeSet = new Set(Array.isArray(active) ? active : [active])
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-1 rounded-lg border border-border bg-card/50 px-3 py-2',
        className,
      )}
      aria-label="EdgeOps abstraction: hardware to customer"
    >
      {STAGES.map((stage, i) => {
        const on = activeSet.has(stage.key)
        return (
          <div key={stage.key} className="flex items-center gap-1">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors',
                on ? 'bg-primary/15 text-primary' : 'text-muted-foreground',
              )}
            >
              <stage.icon className="size-3.5" />
              {stage.label}
            </span>
            {i < STAGES.length - 1 && (
              <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/50" aria-hidden />
            )}
          </div>
        )
      })}
    </div>
  )
}
