import Link from 'next/link'
import { Plus, Search, TriangleAlert } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { HealthIndicator } from '@/components/health-indicator'
import { assets, siteName } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

const stateToneClass: Record<string, string> = {
  success: 'text-[var(--success)]',
  warning: 'text-[var(--warning)]',
  critical: 'text-destructive',
  default: 'text-foreground',
}

export default function AssetsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Assets"
        description="Logical equipment abstracted from the devices and channels that drive them."
        actions={
          <Link href="/assets/new" className={cn(buttonVariants({ size: 'sm' }))}>
            <Plus className="size-4" />
            New asset
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input placeholder="Filter assets..." className="pl-8" />
        </div>
        <Button variant="outline" size="sm">All types</Button>
        <Button variant="outline" size="sm">All sites</Button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {assets.map((a) => (
          <Link key={a.id} href={`/assets/${a.id}`} className="group">
            <Card className="h-full transition-colors group-hover:border-primary/50">
              <CardContent className="flex flex-col gap-4 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium">{a.name}</span>
                    <span className="text-xs text-muted-foreground">{a.type}</span>
                  </div>
                  <HealthIndicator status={a.health} showLabel={false} pulse={a.health !== 'healthy'} />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className={`text-sm font-semibold ${stateToneClass[a.stateTone]}`}>{a.state}</span>
                  {a.activeAlarms > 0 && (
                    <Badge variant="critical">
                      <TriangleAlert className="size-3" />
                      {a.activeAlarms}
                    </Badge>
                  )}
                </div>

                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border pt-3">
                  {a.metrics.slice(0, 4).map((m) => (
                    <div key={m.label} className="flex flex-col gap-0.5">
                      <dt className="text-xs text-muted-foreground truncate">{m.label}</dt>
                      <dd
                        className={`text-sm font-medium tabular-nums ${
                          m.tone ? stateToneClass[m.tone] : 'text-foreground'
                        }`}
                      >
                        {m.value}
                      </dd>
                    </div>
                  ))}
                </dl>

                <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                  <span>{siteName(a.siteId)}</span>
                  <span className="font-mono">{a.lastUpdate}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
