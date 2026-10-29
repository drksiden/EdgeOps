import Link from 'next/link'
import { Plus, Search, TriangleAlert, ChevronRight } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { HealthIndicator } from '@/components/health-indicator'
import { sites } from '@/lib/mock-data'

export default function SitesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Sites"
        description="Physical locations where gateways and devices are deployed."
        actions={
          <Button size="sm">
            <Plus className="size-4" />
            Add site
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input placeholder="Filter sites..." className="pl-8" />
        </div>
        <Button variant="outline" size="sm">All health</Button>
        <Button variant="outline" size="sm">All regions</Button>
      </div>

      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Site</TableHead>
              <TableHead>Health</TableHead>
              <TableHead>Devices</TableHead>
              <TableHead>Gateways</TableHead>
              <TableHead>Alarms</TableHead>
              <TableHead>Last seen</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sites.map((s) => (
              <TableRow key={s.id} className="cursor-pointer">
                <TableCell>
                  <Link href={`/sites/${s.id}`} className="flex flex-col">
                    <span className="font-medium text-foreground">{s.name}</span>
                    <span className="text-xs text-muted-foreground">{s.location}</span>
                  </Link>
                </TableCell>
                <TableCell>
                  <HealthIndicator status={s.health} pulse={s.health !== 'healthy'} />
                </TableCell>
                <TableCell className="tabular-nums">
                  <span className={s.devicesOnline < s.devices ? 'text-[var(--warning)]' : 'text-foreground'}>
                    {s.devicesOnline}
                  </span>
                  <span className="text-muted-foreground">/{s.devices}</span>
                </TableCell>
                <TableCell className="tabular-nums text-muted-foreground">
                  {s.gatewaysOnline}/{s.gateways}
                </TableCell>
                <TableCell>
                  {s.activeAlarms > 0 ? (
                    <Badge variant="critical">
                      <TriangleAlert className="size-3" />
                      {s.activeAlarms}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{s.lastSeen}</TableCell>
                <TableCell>
                  <Link href={`/sites/${s.id}`} className="flex text-muted-foreground hover:text-foreground">
                    <ChevronRight className="size-4" />
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
