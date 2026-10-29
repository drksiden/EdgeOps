import Link from 'next/link'
import { ArrowRight, Cpu, Building2, Activity, Waves, TriangleAlert, CircleCheck } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { MetricCard } from '@/components/metric-card'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { HealthIndicator } from '@/components/health-indicator'
import { SeverityBadge } from '@/components/status-badge'
import { ActivityTimeline } from '@/components/activity-timeline'
import { TelemetryChart } from '@/components/telemetry-chart'
import { platformStats, sites, alarms, recentActivity, series } from '@/lib/mock-data'

export default function OverviewPage() {
  const activeAlarms = alarms.filter((a) => a.state !== 'resolved')
  const criticalSites = sites.filter((s) => s.health === 'critical' || s.health === 'warning')

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Overview"
        description="Fleet-wide health across all sites in ANTB Engineering."
        actions={
          <>
            <Button variant="outline" size="sm">
              Last 24 hours
            </Button>
            <Link href="/alarms" className={buttonVariants({ size: 'sm' })}>
              View alarms
              <ArrowRight className="size-4" />
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Sites" value={platformStats.sites} icon={Building2} hint="4 organizations" />
        <MetricCard
          label="Devices online"
          value={platformStats.online}
          icon={Cpu}
          tone="success"
          hint={`${platformStats.devices} provisioned`}
        />
        <MetricCard
          label="Telemetry rate"
          value={platformStats.telemetryRate}
          icon={Waves}
          tone="primary"
          hint="ingest, live"
        />
        <MetricCard
          label="Availability"
          value={platformStats.availability}
          icon={Activity}
          hint="30-day rolling"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div className="flex flex-col gap-1">
                <CardTitle>Fleet telemetry</CardTitle>
                <span className="text-xs text-muted-foreground">Aggregate ingest across all gateways</span>
              </div>
              <Badge variant="primary">live</Badge>
            </CardHeader>
            <CardContent>
              <TelemetryChart data={series(3, 60, 3200, 900)} height={160} color={1} />
              <div className="mt-4 grid grid-cols-3 divide-x divide-border border-t border-border pt-4 text-center">
                <div className="flex flex-col gap-0.5">
                  <span className="text-lg font-semibold tabular-nums text-[var(--success)]">{platformStats.online}</span>
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Online</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-lg font-semibold tabular-nums text-[var(--warning)]">{platformStats.warning}</span>
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Warning</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-lg font-semibold tabular-nums text-destructive">{platformStats.offline}</span>
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Offline</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Sites needing attention</CardTitle>
              <Link href="/sites" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
                All sites
                <ArrowRight className="size-4" />
              </Link>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              {criticalSites.map((s) => (
                <Link
                  key={s.id}
                  href={`/sites/${s.id}`}
                  className="flex items-center justify-between gap-4 rounded-md border border-transparent px-2 py-2.5 transition-colors hover:border-border hover:bg-muted/40"
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium">{s.name}</span>
                    <span className="text-xs text-muted-foreground">{s.location}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="hidden text-xs text-muted-foreground tabular-nums sm:block">
                      {s.devicesOnline}/{s.devices} online
                    </span>
                    {s.activeAlarms > 0 && (
                      <Badge variant="critical">
                        <TriangleAlert className="size-3" />
                        {s.activeAlarms}
                      </Badge>
                    )}
                    <HealthIndicator status={s.health} showLabel={false} pulse />
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Active alarms</CardTitle>
              <Badge variant="critical">{activeAlarms.length}</Badge>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {activeAlarms.slice(0, 4).map((a) => (
                <Link
                  key={a.id}
                  href="/alarms"
                  className="flex flex-col gap-1.5 rounded-md border border-border bg-background/40 p-3 transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-center justify-between gap-2">
                    <SeverityBadge severity={a.severity} />
                    <span className="font-mono text-xs text-muted-foreground">{a.duration}</span>
                  </div>
                  <span className="text-sm leading-snug text-pretty">{a.title}</span>
                  <span className="text-xs text-muted-foreground">{a.assetName} · {a.siteName}</span>
                </Link>
              ))}
              {activeAlarms.length === 0 && (
                <div className="flex items-center gap-2 rounded-md border border-border p-3 text-sm text-muted-foreground">
                  <CircleCheck className="size-4 text-[var(--success)]" />
                  No active alarms
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityTimeline events={recentActivity} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
