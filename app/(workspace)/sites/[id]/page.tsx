import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, MapPin, Cpu, Router, Boxes, TriangleAlert } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MetricCard } from '@/components/metric-card'
import { HealthIndicator } from '@/components/health-indicator'
import { ConnectionBadge, SeverityBadge, AlarmStateBadge } from '@/components/status-badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState } from '@/components/empty-state'
import {
  getSite,
  assetsForSite,
  devicesForSite,
  gatewaysForSite,
  alarmsForSite,
} from '@/lib/mock-data'

export default async function SiteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const site = getSite(id)
  if (!site) notFound()

  const siteAssets = assetsForSite(id)
  const siteDevices = devicesForSite(id)
  const siteGateways = gatewaysForSite(id)
  const siteAlarms = alarmsForSite(id)

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/sites"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Sites
      </Link>

      <PageHeader
        title={site.name}
        description={site.org}
        actions={<HealthIndicator status={site.health} pulse />}
      >
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-3.5" /> {site.location}
          </span>
          <span>Last seen {site.lastSeen}</span>
        </div>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          label="Devices online"
          value={`${site.devicesOnline}/${site.devices}`}
          icon={Cpu}
          tone={site.devicesOnline < site.devices ? 'warning' : 'success'}
        />
        <MetricCard
          label="Gateways"
          value={`${site.gatewaysOnline}/${site.gateways}`}
          icon={Router}
          tone={site.gatewaysOnline < site.gateways ? 'warning' : 'success'}
        />
        <MetricCard label="Assets" value={siteAssets.length} icon={Boxes} />
        <MetricCard
          label="Active alarms"
          value={site.activeAlarms}
          icon={TriangleAlert}
          tone={site.activeAlarms > 0 ? 'critical' : 'success'}
        />
      </div>

      <Tabs defaultValue="assets">
        <TabsList>
          <TabsTrigger value="assets">Assets ({siteAssets.length})</TabsTrigger>
          <TabsTrigger value="devices">Devices ({siteDevices.length})</TabsTrigger>
          <TabsTrigger value="gateways">Gateways ({siteGateways.length})</TabsTrigger>
          <TabsTrigger value="alarms">Alarms ({siteAlarms.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="assets" className="mt-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {siteAssets.map((a) => (
              <Card key={a.id}>
                <CardHeader className="flex-row items-start justify-between">
                  <div className="flex flex-col gap-0.5">
                    <CardTitle>
                      <Link href={`/assets/${a.id}`} className="hover:text-primary">
                        {a.name}
                      </Link>
                    </CardTitle>
                    <span className="text-xs text-muted-foreground">{a.type}</span>
                  </div>
                  <HealthIndicator status={a.health} showLabel={false} pulse />
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <Badge variant={a.stateTone === 'default' ? 'outline' : a.stateTone}>{a.state}</Badge>
                  <span className="text-xs text-muted-foreground">{a.lastUpdate}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="devices" className="mt-4">
          <Card className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Transport</TableHead>
                  <TableHead>Firmware</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {siteDevices.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>
                      <Link href={`/devices/${d.id}`} className="font-medium text-foreground hover:text-primary">
                        {d.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{d.type}</TableCell>
                    <TableCell>
                      <ConnectionBadge status={d.status} />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{d.transport}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{d.firmware}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="gateways" className="mt-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {siteGateways.map((g) => (
              <Card key={g.id}>
                <CardHeader className="flex-row items-start justify-between">
                  <div className="flex flex-col gap-0.5">
                    <CardTitle>
                      <Link href={`/gateways/${g.id}`} className="hover:text-primary">
                        {g.name}
                      </Link>
                    </CardTitle>
                    <span className="font-mono text-xs text-muted-foreground">{g.ip}</span>
                  </div>
                  <ConnectionBadge status={g.status} />
                </CardHeader>
                <CardContent className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{g.localDevices} devices</span>
                  <span>CPU {g.cpu}% · Mem {g.memory}%</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="alarms" className="mt-4">
          {siteAlarms.length === 0 ? (
            <EmptyState
              icon={TriangleAlert}
              title="No alarms at this site"
              description="All monitored assets are operating within their configured thresholds."
            />
          ) : (
            <Card className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Severity</TableHead>
                    <TableHead>Alarm</TableHead>
                    <TableHead>Asset</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>State</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {siteAlarms.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <SeverityBadge severity={a.severity} />
                      </TableCell>
                      <TableCell className="text-foreground">{a.title}</TableCell>
                      <TableCell className="text-muted-foreground">{a.assetName}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{a.duration}</TableCell>
                      <TableCell>
                        <AlarmStateBadge state={a.state} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
