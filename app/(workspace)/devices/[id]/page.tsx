'use client'

import { use, useMemo, useState } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  Boxes,
  Cable,
  Cpu,
  Gauge,
  Pencil,
  Plus,
  Power,
  RotateCw,
  Save,
  Signal,
  Tag,
  Wifi,
  X,
} from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { AbstractionTrail } from '@/components/abstraction-trail'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ConnectionBadge } from '@/components/status-badge'
import { MetricCard } from '@/components/metric-card'
import { PropertyList } from '@/components/property-list'
import { TelemetryChart } from '@/components/telemetry-chart'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  getDevice,
  getProfile,
  siteName,
  assets as allAssets,
  series,
  directionForPointType,
  type Channel,
  type PointType,
} from '@/lib/mock-data'
import { cn } from '@/lib/utils'

type AssetOption = { id: string; name: string }

const INTERFACE_META: Record<Channel['interface'], { access: 'R' | 'R/W'; group: 'digital' | 'analog' }> = {
  'Modbus Coil': { access: 'R/W', group: 'digital' },
  'Digital Output': { access: 'R/W', group: 'digital' },
  'Discrete Input': { access: 'R', group: 'digital' },
  'Digital Input': { access: 'R', group: 'digital' },
  'Input Register': { access: 'R', group: 'analog' },
  'Holding Register': { access: 'R', group: 'analog' },
  'Analog Input': { access: 'R', group: 'analog' },
}

const DIRECTION_LABEL: Record<'command' | 'feedback' | 'measurement', string> = {
  command: 'Command',
  feedback: 'Feedback',
  measurement: 'Measurement',
}

export default function DeviceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const device = getDevice(id)
  if (!device) notFound()

  const profile = getProfile(device.profileId)
  const isSerial = device.transport === 'RS-485'

  // Working copy of the channel table — the whole mapping workflow is local.
  const [rows, setRows] = useState<Channel[]>(device.channels)
  const [assetOptions, setAssetOptions] = useState<AssetOption[]>(
    allAssets.filter((a) => a.siteId === device.siteId).map((a) => ({ id: a.id, name: a.name })),
  )
  const [tab, setTab] = useState('overview')
  const [dirty, setDirty] = useState(false)
  const [saved, setSaved] = useState(false)
  const [editing, setEditing] = useState<Channel | null>(null)
  const [creatingAsset, setCreatingAsset] = useState(false)

  const mapped = rows.filter((r) => r.pointName)
  const boundAssetIds = useMemo(
    () => [...new Set(mapped.map((r) => r.assetId).filter(Boolean) as string[])],
    [mapped],
  )

  function commit(next: Channel[]) {
    setRows(next)
    setDirty(true)
    setSaved(false)
  }

  function savePoint(updated: Channel) {
    commit(rows.map((r) => (r.id === updated.id ? updated : r)))
    setEditing(null)
  }

  function clearMapping(id: string) {
    commit(
      rows.map((r) =>
        r.id === id ? { ...r, pointName: null, pointType: null, assetId: null, displayName: null } : r,
      ),
    )
  }

  function addAsset(name: string): string {
    const newId = `asset-new-${Date.now()}`
    setAssetOptions((prev) => [...prev, { id: newId, name }])
    return newId
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/devices"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Devices
      </Link>

      <PageHeader
        title={device.name}
        description={`${device.type} · ${siteName(device.siteId)}`}
        actions={
          <>
            <Badge variant="outline" className="mr-1 gap-1.5">
              <Cpu className="size-3" /> Physical device
            </Badge>
            <ConnectionBadge status={device.status} className="mr-1" />
            <Button variant="outline" size="sm">
              <RotateCw /> Reboot
            </Button>
            <Button variant="outline" size="sm">
              <Power /> Identify
            </Button>
            <Button size="sm">
              <Pencil /> Configure
            </Button>
          </>
        }
      />

      <AbstractionTrail active={['hardware', 'channel', 'point']} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {isSerial ? (
          <MetricCard label="Slave address" value={device.slaveAddress ?? '—'} icon={Cable} />
        ) : (
          <MetricCard
            label="Signal"
            value={device.rssi}
            unit="dBm"
            icon={Signal}
            tone={device.rssi >= -70 ? 'success' : 'warning'}
          />
        )}
        <MetricCard label="Transport" value={isSerial ? device.serial ?? 'RS-485' : device.transport} icon={Wifi} />
        <MetricCard label="Channels" value={rows.length} icon={Cable} />
        <MetricCard label="Points mapped" value={`${mapped.length}/${rows.length}`} icon={Tag} tone="primary" />
      </div>

      <Tabs defaultValue="overview" value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="channels">Raw channels</TabsTrigger>
          <TabsTrigger value="mapping">Point mapping</TabsTrigger>
          <TabsTrigger value="telemetry">Telemetry</TabsTrigger>
        </TabsList>

        {/* -- Overview ---------------------------------------------------- */}
        <TabsContent value="overview">
          <div className="grid gap-3 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Identity</CardTitle>
              </CardHeader>
              <CardContent>
                <PropertyList
                  items={[
                    { label: 'Model', value: device.model },
                    { label: 'Category', value: device.category },
                    { label: 'Profile', value: profile?.name ?? 'None applied' },
                    { label: 'Firmware', value: device.firmware, mono: true },
                    { label: 'MAC', value: device.mac, mono: true },
                    { label: 'Gateway', value: device.gatewayId, mono: true },
                    { label: 'Last seen', value: device.lastSeen },
                  ]}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Connection</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <PropertyList
                  items={
                    isSerial
                      ? [
                          { label: 'Transport', value: 'RS-485 (Modbus RTU)' },
                          { label: 'Slave address', value: String(device.slaveAddress ?? '—'), mono: true },
                          { label: 'Serial', value: device.serial ?? '—', mono: true },
                          { label: 'Uptime', value: device.uptime },
                        ]
                      : [
                          { label: 'Transport', value: device.transport },
                          { label: 'IP address', value: device.ip, mono: true },
                          { label: 'Signal', value: `${device.rssi} dBm`, mono: true },
                          { label: 'Uptime', value: device.uptime },
                        ]
                  }
                />
                <div className="flex gap-2">
                  <Link
                    href={`/gateways/${device.gatewayId}`}
                    className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                  >
                    View gateway
                  </Link>
                  <Link
                    href={`/sites/${device.siteId}`}
                    className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                  >
                    View site
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Abstraction summary — how this physical device becomes logical assets */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>From hardware to assets</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setTab('mapping')}>
                  Edit mapping <ArrowRight />
                </Button>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="grid grid-cols-3 gap-3">
                  <LadderStat icon={Cable} label="Raw channels" value={rows.length} caption="exposed by hardware" />
                  <LadderStat icon={Tag} label="Logical points" value={mapped.length} caption="named & typed" tone />
                  <LadderStat icon={Boxes} label="Assets fed" value={boundAssetIds.length} caption="customer-facing" />
                </div>

                {boundAssetIds.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Assets built from this device
                    </span>
                    {boundAssetIds.map((aid) => {
                      const name = assetOptions.find((a) => a.id === aid)?.name ?? aid
                      const points = mapped.filter((r) => r.assetId === aid)
                      return (
                        <Link
                          key={aid}
                          href={`/assets/${aid}`}
                          className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 transition-colors hover:border-primary/40 hover:bg-muted/50"
                        >
                          <span className="flex items-center gap-3">
                            <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                              <Boxes className="size-4" />
                            </span>
                            <span className="flex flex-col">
                              <span className="text-sm font-medium text-foreground">{name}</span>
                              <span className="text-xs text-muted-foreground">
                                {points.length} point{points.length === 1 ? '' : 's'} ·{' '}
                                {points.map((p) => p.pointName).join(', ')}
                              </span>
                            </span>
                          </span>
                          <ArrowRight className="size-4 text-muted-foreground" />
                        </Link>
                      )
                    })}
                  </div>
                ) : (
                  <p className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
                    No points mapped yet. Open <span className="text-foreground">Point mapping</span> to turn raw
                    channels into logical points and assign them to an asset.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* -- Raw channels ------------------------------------------------ */}
        <TabsContent value="channels">
          <Card className="p-0">
            <div className="flex flex-col gap-1 border-b border-border p-4">
              <h2 className="text-sm font-medium text-foreground">Raw hardware channels</h2>
              <p className="text-xs text-muted-foreground text-pretty">
                Signals exposed by the controller exactly as read from the bus — addresses and raw values, with no
                meaning attached. Map a channel to give it a logical name and behavior.
              </p>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Address</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-center">Access</TableHead>
                  <TableHead className="text-right">Raw value</TableHead>
                  <TableHead>Mapping</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((ch) => {
                  const meta = INTERFACE_META[ch.interface]
                  return (
                    <TableRow key={ch.id}>
                      <TableCell className="font-mono text-xs text-foreground">{ch.ref}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{ch.interface}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={cn(
                            'font-mono text-xs',
                            meta.access === 'R/W' ? 'text-primary' : 'text-muted-foreground',
                          )}
                        >
                          {meta.access}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs tabular-nums text-foreground">
                        {ch.value}
                        {ch.unit ? ` ${ch.unit}` : ''}
                      </TableCell>
                      <TableCell>
                        {ch.pointName ? (
                          <span className="flex flex-wrap items-center gap-1.5">
                            <Badge variant="primary">{ch.pointName}</Badge>
                            <span className="text-xs text-muted-foreground">
                              → {assetOptions.find((a) => a.id === ch.assetId)?.name ?? '—'}
                            </span>
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Unmapped</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => {
                            setEditing(ch)
                            setTab('mapping')
                          }}
                        >
                          {ch.pointName ? 'Edit' : 'Map'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* -- Point mapping ----------------------------------------------- */}
        <TabsContent value="mapping">
          <div className="grid gap-3 lg:grid-cols-3">
            <Card className="p-0 lg:col-span-2">
              <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-0.5">
                  <h2 className="text-sm font-medium text-foreground">Channel → point mapping</h2>
                  <p className="text-xs text-muted-foreground">
                    {mapped.length} of {rows.length} channels mapped to logical points
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {saved && (
                    <Badge variant="success">
                      <Save className="size-3" /> Saved
                    </Badge>
                  )}
                  <Button
                    size="sm"
                    disabled={!dirty}
                    onClick={() => {
                      setDirty(false)
                      setSaved(true)
                    }}
                  >
                    <Save /> Save mapping
                  </Button>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Address</TableHead>
                    <TableHead>Point</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Asset</TableHead>
                    <TableHead className="text-right">Live</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((ch) => (
                    <TableRow key={ch.id}>
                      <TableCell className="font-mono text-xs text-foreground">{ch.ref}</TableCell>
                      <TableCell>
                        {ch.pointName ? (
                          <span className="text-sm text-foreground">{ch.pointName}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {ch.pointType ? (
                          <Badge variant="outline">{DIRECTION_LABEL[directionForPointType(ch.pointType)]}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {ch.assetId ? (
                          <span className="text-sm text-foreground">
                            {assetOptions.find((a) => a.id === ch.assetId)?.name ?? ch.assetId}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs tabular-nums text-foreground">
                        {ch.value}
                        {ch.unit ? ` ${ch.unit}` : ''}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="xs" onClick={() => setEditing(ch)}>
                            {ch.pointName ? 'Edit' : 'Map'}
                          </Button>
                          {ch.pointName && (
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              aria-label={`Clear mapping for ${ch.ref}`}
                              onClick={() => clearMapping(ch.id)}
                            >
                              <X />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>

            {/* Live "resulting asset" preview */}
            <MappingPreview rows={mapped} assetOptions={assetOptions} boundAssetIds={boundAssetIds} />
          </div>
        </TabsContent>

        {/* -- Telemetry --------------------------------------------------- */}
        <TabsContent value="telemetry">
          <div className="grid gap-3 lg:grid-cols-2">
            {rows.filter((ch) => INTERFACE_META[ch.interface].group === 'analog').length === 0 && (
              <Card className="lg:col-span-2">
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  This controller only exposes digital channels — no analog telemetry to trend.
                </CardContent>
              </Card>
            )}
            {rows
              .filter((ch) => INTERFACE_META[ch.interface].group === 'analog')
              .map((ch, i) => (
                <Card key={ch.id}>
                  <CardHeader className="flex-row items-center justify-between">
                    <div className="flex flex-col gap-0.5">
                      <CardTitle>{ch.displayName ?? ch.pointName ?? ch.ref}</CardTitle>
                      <span className="font-mono text-xs text-muted-foreground">{ch.ref}</span>
                    </div>
                    <span className="font-mono text-sm tabular-nums text-foreground">
                      {ch.value}
                      {ch.unit ? ` ${ch.unit}` : ''}
                    </span>
                  </CardHeader>
                  <CardContent>
                    <TelemetryChart
                      data={series(i + 3, 48, 20 + i * 6, 5)}
                      color={((i % 5) + 1) as 1 | 2 | 3 | 4 | 5}
                      unit={ch.unit ?? undefined}
                    />
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>

      {editing && (
        <PointDialog
          channel={editing}
          assetOptions={assetOptions}
          onClose={() => setEditing(null)}
          onSave={savePoint}
          onCreateAsset={() => setCreatingAsset(true)}
          addAsset={addAsset}
        />
      )}

      {creatingAsset && (
        <CreateAssetDialog
          onClose={() => setCreatingAsset(false)}
          onCreate={(name) => {
            addAsset(name)
            setCreatingAsset(false)
          }}
        />
      )}
    </div>
  )
}

function LadderStat({
  icon: Icon,
  label,
  value,
  caption,
  tone,
}: {
  icon: typeof Cable
  label: string
  value: number
  caption: string
  tone?: boolean
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border p-3">
      <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className={cn('size-3.5', tone && 'text-primary')} /> {label}
      </span>
      <span className={cn('text-2xl font-semibold tabular-nums', tone ? 'text-primary' : 'text-foreground')}>
        {value}
      </span>
      <span className="text-xs text-muted-foreground">{caption}</span>
    </div>
  )
}

function MappingPreview({
  rows,
  assetOptions,
  boundAssetIds,
}: {
  rows: Channel[]
  assetOptions: AssetOption[]
  boundAssetIds: string[]
}) {
  return (
    <Card className="lg:sticky lg:top-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge className="size-4 text-primary" /> Resulting asset
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-xs text-muted-foreground text-pretty">
          A live preview of how these points appear to a customer once mapped.
        </p>
        {boundAssetIds.length === 0 && (
          <p className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
            Map a channel to an asset to see the customer view.
          </p>
        )}
        {boundAssetIds.map((aid) => {
          const name = assetOptions.find((a) => a.id === aid)?.name ?? aid
          const points = rows.filter((r) => r.assetId === aid)
          return (
            <div key={aid} className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-3">
              <span className="text-sm font-medium text-foreground">{name}</span>
              {points.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{p.pointName}</span>
                  <span className="font-mono tabular-nums text-foreground">
                    {p.value}
                    {p.unit ? ` ${p.unit}` : ''}
                  </span>
                </div>
              ))}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

const POINT_TYPES: { value: PointType; label: string; hint: string }[] = [
  { value: 'Boolean Control', label: 'Command (writable)', hint: 'Start / stop the equipment' },
  { value: 'Boolean State', label: 'Feedback (read-only)', hint: 'Running, fault, contact state' },
  { value: 'Analog', label: 'Measurement', hint: 'Temperature, current, pressure' },
]

function PointDialog({
  channel,
  assetOptions,
  onClose,
  onSave,
  addAsset,
}: {
  channel: Channel
  assetOptions: AssetOption[]
  onClose: () => void
  onSave: (c: Channel) => void
  onCreateAsset: () => void
  addAsset: (name: string) => string
}) {
  const meta = INTERFACE_META[channel.interface]
  const [name, setName] = useState(channel.pointName ?? channel.displayName ?? '')
  const [type, setType] = useState<PointType>(
    channel.pointType ?? (meta.group === 'analog' ? 'Analog' : meta.access === 'R/W' ? 'Boolean Control' : 'Boolean State'),
  )
  const [assetId, setAssetId] = useState<string>(channel.assetId ?? '')
  const [unit, setUnit] = useState(channel.unit ?? '')
  const [inverted, setInverted] = useState(channel.inverted)
  const [newAssetName, setNewAssetName] = useState('')
  const [showNewAsset, setShowNewAsset] = useState(false)

  const isAnalog = type === 'Analog'
  const canSave = name.trim().length > 0 && assetId.length > 0

  function handleSave() {
    if (!canSave) return
    onSave({
      ...channel,
      pointName: name.trim(),
      displayName: channel.displayName ?? name.trim(),
      pointType: type,
      assetId,
      unit: isAnalog ? unit.trim() || null : null,
      inverted,
      writable: type === 'Boolean Control' ? true : channel.writable,
    })
  }

  return (
    <Overlay onClose={onClose}>
      <Card className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="flex-row items-start justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle className="flex items-center gap-2">
              <Tag className="size-4 text-primary" /> {channel.pointName ? 'Edit point' : 'Create point'}
            </CardTitle>
            <span className="font-mono text-xs text-muted-foreground">
              {channel.ref} · {channel.interface} · {meta.access}
            </span>
          </div>
          <Button variant="ghost" size="icon-xs" onClick={onClose} aria-label="Close">
            <X />
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field label="Point name">
            <Input
              value={name}
              autoFocus
              placeholder="e.g. Start Command"
              onChange={(e) => setName(e.target.value)}
            />
          </Field>

          <Field label="Role">
            <div className="flex flex-col gap-1.5">
              {POINT_TYPES.map((pt) => {
                const disabled = pt.value === 'Boolean Control' && meta.access !== 'R/W'
                return (
                  <button
                    key={pt.value}
                    type="button"
                    disabled={disabled}
                    onClick={() => setType(pt.value)}
                    className={cn(
                      'flex items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors disabled:opacity-40',
                      type === pt.value
                        ? 'border-primary/50 bg-primary/10'
                        : 'border-border hover:border-primary/30',
                    )}
                  >
                    <span className="flex flex-col">
                      <span className="text-sm text-foreground">{pt.label}</span>
                      <span className="text-xs text-muted-foreground">{pt.hint}</span>
                    </span>
                    <span
                      className={cn(
                        'size-3.5 rounded-full border',
                        type === pt.value ? 'border-primary bg-primary' : 'border-border',
                      )}
                    />
                  </button>
                )
              })}
            </div>
          </Field>

          {isAnalog && (
            <Field label="Unit">
              <Input value={unit} placeholder="°C, A, kW…" onChange={(e) => setUnit(e.target.value)} className="max-w-32" />
            </Field>
          )}

          {!isAnalog && (
            <label className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <span className="flex flex-col">
                <span className="text-sm text-foreground">Invert signal</span>
                <span className="text-xs text-muted-foreground">Raw {channel.value} reads as the opposite logical state</span>
              </span>
              <input
                type="checkbox"
                checked={inverted}
                onChange={(e) => setInverted(e.target.checked)}
                className="size-4 accent-primary"
              />
            </label>
          )}

          <Field label="Assign to asset">
            {showNewAsset ? (
              <div className="flex gap-2">
                <Input
                  value={newAssetName}
                  autoFocus
                  placeholder="New asset name"
                  onChange={(e) => setNewAssetName(e.target.value)}
                />
                <Button
                  size="sm"
                  disabled={!newAssetName.trim()}
                  onClick={() => {
                    const nid = addAsset(newAssetName.trim())
                    setAssetId(nid)
                    setShowNewAsset(false)
                    setNewAssetName('')
                  }}
                >
                  Add
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowNewAsset(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <select
                  value={assetId}
                  onChange={(e) => setAssetId(e.target.value)}
                  aria-label="Asset"
                  className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
                >
                  <option value="">— Select asset —</option>
                  {assetOptions.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
                <Button variant="outline" size="sm" onClick={() => setShowNewAsset(true)}>
                  <Plus /> New
                </Button>
              </div>
            )}
          </Field>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button disabled={!canSave} onClick={handleSave}>
              <Save /> Save point
            </Button>
          </div>
        </CardContent>
      </Card>
    </Overlay>
  )
}

function CreateAssetDialog({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string) => void }) {
  const [name, setName] = useState('')
  return (
    <Overlay onClose={onClose}>
      <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="flex-row items-start justify-between">
          <CardTitle className="flex items-center gap-2">
            <Boxes className="size-4 text-primary" /> New asset
          </CardTitle>
          <Button variant="ghost" size="icon-xs" onClick={onClose} aria-label="Close">
            <X />
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field label="Asset name">
            <Input value={name} autoFocus placeholder="e.g. Ventilation Unit V2" onChange={(e) => setName(e.target.value)} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button disabled={!name.trim()} onClick={() => onCreate(name.trim())}>
              Create asset
            </Button>
          </div>
        </CardContent>
      </Card>
    </Overlay>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}

function Overlay({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      {children}
    </div>
  )
}
