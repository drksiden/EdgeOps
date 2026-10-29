'use client'

import { use, useMemo, useState } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  Boxes,
  Cable,
  Cpu,
  Play,
  Square,
  TriangleAlert,
  Terminal,
  ShieldAlert,
  X,
  Tag,
} from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { AbstractionTrail } from '@/components/abstraction-trail'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { HealthIndicator } from '@/components/health-indicator'
import { SeverityBadge, AlarmStateBadge } from '@/components/status-badge'
import { TelemetryChart } from '@/components/telemetry-chart'
import { ActivityTimeline } from '@/components/activity-timeline'
import {
  getAsset,
  alarms,
  series,
  siteName,
  pointsForAsset,
  devicesForAsset,
  boolActive,
  type ActivityEvent,
  type Point,
} from '@/lib/mock-data'
import { cn } from '@/lib/utils'

export default function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const asset = getAsset(id)
  if (!asset) notFound()

  const points = useMemo(() => pointsForAsset(asset.id), [asset.id])
  const sourceDevices = useMemo(() => devicesForAsset(asset.id), [asset.id])
  const assetAlarms = alarms.filter((a) => a.assetId === asset.id)

  const commandPoints = points.filter((p) => p.direction === 'command')
  const feedbackPoints = points.filter((p) => p.direction === 'feedback')
  const measurementPoints = points.filter((p) => p.direction === 'measurement')

  const [pending, setPending] = useState<{ point: Point; action: string; danger: boolean } | null>(null)
  const [commandState, setCommandState] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(commandPoints.map((p) => [p.id, boolActive(p.rawValue, p.inverted)])),
  )
  const [log, setLog] = useState<ActivityEvent[]>([
    { id: 'seed-1', time: '2s ago', kind: 'status', text: `${asset.name} reported state: ${asset.state}` },
  ])

  function confirmCommand() {
    if (!pending) return
    setCommandState((prev) => ({ ...prev, [pending.point.id]: pending.action === 'Start' }))
    setLog((prev) => [
      {
        id: `cmd-${Date.now()}`,
        time: 'just now',
        kind: 'command',
        text: `Command "${pending.action}" written to ${pending.point.channelRef} on ${pending.point.deviceName} — awaiting edge acknowledgement`,
      },
      ...prev,
    ])
    setPending(null)
  }

  const primaryMeasurement = measurementPoints[0]

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/assets"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Assets
      </Link>

      <PageHeader
        title={asset.name}
        description={`${asset.type} · ${siteName(asset.siteId)}`}
        actions={
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-1.5">
              <Boxes className="size-3" /> Logical asset
            </Badge>
            <Badge variant={asset.stateTone === 'default' ? 'outline' : asset.stateTone}>{asset.state}</Badge>
            <HealthIndicator status={asset.health} pulse />
          </div>
        }
      />

      <AbstractionTrail active={['asset', 'customer']} />

      {/* ================= CUSTOMER-FACING VIEW ================= */}
      {points.length > 0 ? (
        <div className="grid gap-3 lg:grid-cols-3">
          {/* Status */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              {feedbackPoints.length === 0 && measurementPoints.length === 0 ? (
                <p className="text-sm text-muted-foreground">No status points mapped.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {feedbackPoints.map((p) => {
                    const active = boolActive(p.rawValue, p.inverted)
                    const isFault = /fault|alarm|trip|error/i.test(p.name)
                    const tone = isFault
                      ? active
                        ? 'critical'
                        : 'success'
                      : active
                        ? 'success'
                        : 'default'
                    const label = isFault ? (active ? 'Fault' : 'Normal') : active ? 'Running' : 'Stopped'
                    return <StatusTile key={p.id} label={p.name} value={label} tone={tone} />
                  })}
                  {measurementPoints.map((p) => (
                    <StatusTile
                      key={p.id}
                      label={p.name}
                      value={`${p.rawValue}${p.unit ? ` ${p.unit}` : ''}`}
                      tone="default"
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="size-4 text-primary" /> Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {commandPoints.length === 0 ? (
                <p className="text-sm text-muted-foreground">This asset is monitoring-only — no control points mapped.</p>
              ) : (
                commandPoints.map((p) => {
                  const running = commandState[p.id]
                  return (
                    <div key={p.id} className="flex flex-col gap-2 rounded-lg border border-border p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">{p.name}</span>
                        <Badge variant={running ? 'success' : 'outline'}>{running ? 'ON' : 'OFF'}</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          disabled={running}
                          onClick={() => setPending({ point: p, action: 'Start', danger: false })}
                        >
                          <Play /> Start
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="flex-1"
                          disabled={!running}
                          onClick={() => setPending({ point: p, action: 'Stop', danger: true })}
                        >
                          <Square /> Stop
                        </Button>
                      </div>
                    </div>
                  )
                })
              )}
              <p className="mt-1 text-xs text-muted-foreground text-pretty">
                Controls write to field hardware and require delivery confirmation from the edge.
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <Tag className="size-6 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">No points mapped yet</p>
            <p className="max-w-sm text-sm text-muted-foreground text-pretty">
              This asset has no logical points. Map hardware channels to points on a device to bring it to life.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Telemetry + measurement summary */}
      {primaryMeasurement && (
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>
              {primaryMeasurement.name} · last 4h
            </CardTitle>
            <span className="font-mono text-sm tabular-nums text-foreground">
              {primaryMeasurement.rawValue}
              {primaryMeasurement.unit ? ` ${primaryMeasurement.unit}` : ''}
            </span>
          </CardHeader>
          <CardContent>
            <TelemetryChart
              data={series(asset.name.length + 12, 48, Number(primaryMeasurement.rawValue) || 24, 6)}
              color={1}
              unit={primaryMeasurement.unit ?? undefined}
            />
          </CardContent>
        </Card>
      )}

      {/* ================= ENGINEER PROVENANCE ================= */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cable className="size-4 text-muted-foreground" /> How this asset is built
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-xs text-muted-foreground text-pretty">
            Every point above is a raw hardware channel an engineer mapped and named. This is the chain behind the
            simple customer view.
          </p>

          {points.length > 0 ? (
            <div className="flex flex-col divide-y divide-border overflow-hidden rounded-lg border border-border">
              {points.map((p) => (
                <div key={p.id} className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                  <div className="flex items-center gap-2">
                    <span className="flex size-7 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <Cable className="size-3.5" />
                    </span>
                    <div className="flex flex-col">
                      <Link
                        href={`/devices/${p.deviceId}`}
                        className="font-mono text-xs text-foreground transition-colors hover:text-primary"
                      >
                        {p.channelRef}
                      </Link>
                      <span className="text-xs text-muted-foreground">{p.deviceName}</span>
                    </div>
                  </div>
                  <span className="hidden text-muted-foreground/50 sm:inline">→</span>
                  <div className="flex items-center gap-2">
                    <span className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Tag className="size-3.5" />
                    </span>
                    <div className="flex flex-col">
                      <span className="text-sm text-foreground">{p.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {p.direction === 'command'
                          ? 'Command'
                          : p.direction === 'feedback'
                            ? 'Feedback'
                            : 'Measurement'}
                        {p.inverted ? ' · inverted' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No mapped channels.</p>
          )}

          {sourceDevices.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {sourceDevices.map((d) => (
                <Link
                  key={d.id}
                  href={`/devices/${d.id}`}
                  className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:border-primary/40 hover:bg-muted/50"
                >
                  <Cpu className="size-3.5 text-muted-foreground" /> {d.name}
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Command / activity log */}
      <Card>
        <CardHeader>
          <CardTitle>Command & event log</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityTimeline events={log} />
        </CardContent>
      </Card>

      {/* Alarms */}
      {assetAlarms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TriangleAlert className="size-4 text-destructive" /> Active alarms ({assetAlarms.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {assetAlarms.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3">
                <SeverityBadge severity={a.severity} />
                <span className="text-sm text-foreground">{a.title}</span>
                <span className="font-mono text-xs text-muted-foreground">{a.duration}</span>
                <AlarmStateBadge state={a.state} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Command confirmation modal */}
      {pending && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setPending(null)}
        >
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="flex-row items-start justify-between">
              <CardTitle className="flex items-center gap-2">
                {pending.danger ? (
                  <ShieldAlert className="size-4 text-destructive" />
                ) : (
                  <Terminal className="size-4 text-primary" />
                )}
                Confirm command
              </CardTitle>
              <Button variant="ghost" size="icon-xs" onClick={() => setPending(null)} aria-label="Cancel">
                <X />
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground text-pretty">
                Dispatch <span className="font-medium text-foreground">{pending.action}</span> to{' '}
                <span className="font-medium text-foreground">{asset.name}</span>. This writes to{' '}
                <span className="font-mono text-foreground">{pending.point.channelRef}</span> on{' '}
                <span className="font-medium text-foreground">{pending.point.deviceName}</span> — a real control
                command to field hardware.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setPending(null)}>
                  Cancel
                </Button>
                <Button variant={pending.danger ? 'destructive' : 'default'} onClick={confirmCommand}>
                  {pending.action === 'Start' ? <Play /> : <Square />} Dispatch {pending.action}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function StatusTile({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'default' | 'success' | 'warning' | 'critical'
}) {
  const toneClass = {
    default: 'text-foreground',
    success: 'text-[var(--success)]',
    warning: 'text-[var(--warning)]',
    critical: 'text-destructive',
  }[tone]
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border p-3">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className={cn('flex items-center gap-1.5 text-lg font-semibold tabular-nums', toneClass)}>
        {tone !== 'default' && <span className={cn('size-2 rounded-full', dotClass(tone))} />}
        {value}
      </span>
    </div>
  )
}

function dotClass(tone: 'success' | 'warning' | 'critical' | 'default') {
  return {
    default: 'bg-muted-foreground',
    success: 'bg-[var(--success)]',
    warning: 'bg-[var(--warning)]',
    critical: 'bg-destructive',
  }[tone]
}
