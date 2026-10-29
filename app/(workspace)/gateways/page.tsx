import Link from 'next/link'
import { Router, ChevronRight, TriangleAlert } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ConnectionBadge } from '@/components/status-badge'
import { ResourceBar } from '@/components/resource-bar'
import { gateways, siteName } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

export default function GatewaysPage() {
  const online = gateways.filter((g) => g.status === 'online').length

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Gateways" description={`${gateways.length} edge gateways · ${online} online`} />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {gateways.map((g) => {
          const offline = g.status === 'offline'
          return (
            <Card key={g.id} className={cn(offline && 'border-destructive/40')}>
              <CardHeader className="flex-row items-start justify-between">
                <div className="flex items-start gap-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Router className="size-4" />
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <CardTitle>
                      <Link href={`/gateways/${g.id}`} className="hover:text-primary">
                        {g.name}
                      </Link>
                    </CardTitle>
                    <span className="text-xs text-muted-foreground">{siteName(g.siteId)}</span>
                  </div>
                </div>
                <ConnectionBadge status={g.status} />
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {offline ? (
                  <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
                    <TriangleAlert className="mt-px size-3.5 shrink-0" />
                    <span>
                      Buffering locally — {g.bufferedEvents.toLocaleString()} events queued for store-and-forward.
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    <ResourceBar label="CPU" value={g.cpu} />
                    <ResourceBar label="Memory" value={g.memory} />
                    <ResourceBar label="Storage" value={g.storage} />
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
                  <span>{g.localDevices} devices</span>
                  <span className="font-mono">{g.ip}</span>
                  <Badge variant={g.mqtt === 'connected' ? 'success' : 'critical'}>MQTT {g.mqtt}</Badge>
                  <span className="ml-auto inline-flex items-center gap-1 text-primary">
                    <Link href={`/gateways/${g.id}`} className="inline-flex items-center gap-0.5 hover:underline">
                      Details <ChevronRight className="size-3" />
                    </Link>
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
