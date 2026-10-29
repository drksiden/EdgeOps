import { cn } from '@/lib/utils'

function barTone(value: number) {
  if (value >= 80) return 'bg-destructive'
  if (value >= 60) return 'bg-[var(--warning)]'
  return 'bg-primary'
}

export function ResourceBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono tabular-nums text-foreground">{value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full transition-all', barTone(value))} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}
