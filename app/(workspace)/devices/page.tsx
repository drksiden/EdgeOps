'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Cpu, Search, Plus, ChevronRight } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConnectionBadge } from '@/components/status-badge'
import { EmptyState } from '@/components/empty-state'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { devices, siteName, type ConnectionStatus } from '@/lib/mock-data'

const categories = ['All', 'ESP32', 'Modbus', 'Sensor', 'Gateway'] as const

function rssiTone(rssi: number) {
  if (rssi >= -60) return 'text-[var(--success)]'
  if (rssi >= -75) return 'text-[var(--warning)]'
  return 'text-destructive'
}

export default function DevicesPage() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<(typeof categories)[number]>('All')
  const [status, setStatus] = useState<'all' | ConnectionStatus>('all')

  const filtered = useMemo(() => {
    return devices.filter((d) => {
      const matchesQuery =
        !query ||
        [d.name, d.type, d.ip, d.mac, d.model].some((f) => f.toLowerCase().includes(query.toLowerCase()))
      const matchesCategory = category === 'All' || d.category === category
      const matchesStatus = status === 'all' || d.status === status
      return matchesQuery && matchesCategory && matchesStatus
    })
  }, [query, category, status])

  const online = devices.filter((d) => d.status === 'online').length

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Devices"
        description={`${devices.length} devices provisioned · ${online} online`}
        actions={
          <Button>
            <Plus /> Add device
          </Button>
        }
      />

      <Card className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, IP, MAC, model…"
            className="pl-8"
            aria-label="Search devices"
          />
        </div>
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-thin">
          {categories.map((c) => (
            <Button
              key={c}
              size="sm"
              variant={category === c ? 'secondary' : 'ghost'}
              onClick={() => setCategory(c)}
            >
              {c}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          {(['all', 'online', 'offline'] as const).map((s) => (
            <Button
              key={s}
              size="sm"
              variant={status === s ? 'secondary' : 'ghost'}
              onClick={() => setStatus(s)}
              className="capitalize"
            >
              {s}
            </Button>
          ))}
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Cpu}
            title="No devices match your filters"
            description="Try clearing the search or switching category."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Transport</TableHead>
                <TableHead className="text-right">Signal</TableHead>
                <TableHead>Firmware</TableHead>
                <TableHead className="text-right">Channels</TableHead>
                <TableHead>Last seen</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((d) => (
                <TableRow key={d.id} className="group cursor-pointer">
                  <TableCell>
                    <Link href={`/devices/${d.id}`} className="flex flex-col">
                      <span className="font-medium text-foreground">{d.name}</span>
                      <span className="font-mono text-xs text-muted-foreground">{d.mac}</span>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <ConnectionBadge status={d.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{siteName(d.siteId)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{d.transport}</Badge>
                  </TableCell>
                  <TableCell className={`text-right font-mono text-xs ${rssiTone(d.rssi)}`}>
                    {d.rssi} dBm
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{d.firmware}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {d.channels.length}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{d.lastSeen}</TableCell>
                  <TableCell>
                    <Link href={`/devices/${d.id}`} aria-label={`Open ${d.name}`}>
                      <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
