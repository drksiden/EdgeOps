import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Cpu, HardDrive, Radio, Server } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConnectionBadge } from '@/components/status-badge'
import { MetricCard } from '@/components/metric-card'
import { PropertyList } from '@/components/property-list'
import { ResourceBar } from '@/components/resource-bar'
import { TelemetryChart } from '@/components/telemetry-chart'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getGateway, siteName, devices, series } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

export default async function GatewayDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const gw = getGateway(id)
  if (!gw) notFound()

  const localDevices = devices.filter((d) => d.gatewayId === gw.id)

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/gateways"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Gateways
      </Link>

      <PageHeader
        title={gw.name}
        description={`${gw.hardware} · ${siteName(gw.siteId)}`}
        actions={<ConnectionBadge status={gw.status} />}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="CPU" value={gw.cpu} unit="%" icon={Cpu} tone={gw.cpu >= 80 ? 'critical' : 'default'} />
        <MetricCard label="Memory" value={gw.memory} unit="%" icon={Server} tone={gw.memory >= 80 ? 'critical' : 'default'} />
        <MetricCard label="Storage" value={gw.storage} unit="%" icon={HardDrive} />
        <MetricCard
          label="Buffered events"
          value={gw.bufferedEvents.toLocaleString()}
          icon={Radio}
          tone={gw.bufferedEvents > 0 ? 'warning' : 'success'}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Resource utilization · last 4h</CardTitle>
          </CardHeader>
          <CardContent>
            <TelemetryChart data={series(gw.cpu || 5, 48, gw.cpu || 6, 8)} color={2} unit="%" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Live utilization</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <ResourceBar label="CPU" value={gw.cpu} />
            <ResourceBar label="Memory" value={gw.memory} />
            <ResourceBar label="Storage" value={gw.storage} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Gateway details</CardTitle>
          </CardHeader>
          <CardContent>
            <PropertyList
              items={[
                { label: 'Hardware', value: gw.hardware },
                { label: 'Software', value: gw.swVersion, mono: true },
                { label: 'IP address', value: gw.ip, mono: true },
                { label: 'Uptime', value: gw.uptime },
                { label: 'MQTT', value: <Badge variant={gw.mqtt === 'connected' ? 'success' : 'critical'}>{gw.mqtt}</Badge> },
                { label: 'Local devices', value: gw.localDevices },
              ]}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 p-0">
          <CardHeader className="px-4 py-3.5">
            <CardTitle>Local devices ({localDevices.length})</CardTitle>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Transport</TableHead>
                <TableHead>Firmware</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {localDevices.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>
                    <Link href={`/devices/${d.id}`} className="font-medium text-foreground hover:text-primary">
                      {d.name}
                    </Link>
                  </TableCell>
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
          <div className="border-t border-border px-4 py-3">
            <Link href={`/sites/${gw.siteId}`} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
              View site
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
