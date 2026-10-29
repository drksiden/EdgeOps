import { cn } from '@/lib/utils'

export interface Property {
  label: string
  value: React.ReactNode
  mono?: boolean
}

export function PropertyList({ items, className }: { items: Property[]; className?: string }) {
  return (
    <dl className={cn('grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-y-0', className)}>
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center justify-between gap-4 py-2 sm:border-b sm:border-border"
        >
          <dt className="text-xs text-muted-foreground uppercase tracking-wide">{item.label}</dt>
          <dd className={cn('text-sm text-foreground text-right', item.mono && 'font-mono text-[0.8rem]')}>
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
