'use client'

import { Suspense, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleCheck,
  CircleAlert,
  Cpu,
  Link2,
  Plus,
  RotateCcw,
} from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { AbstractionTrail } from '@/components/abstraction-trail'
import { Card } from '@/components/ui/card'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { AssetTypeIcon, roleBadgeVariant } from '@/components/asset-type-visuals'
import {
  assetTypes,
  getAssetType,
  sites,
  devicesForSite,
  devices as allDevices,
  pointRoleLabels,
  boolActive,
  type PointSpec,
  type Channel,
} from '@/lib/mock-data'
import { cn } from '@/lib/utils'

type Binding = { deviceId: string; channelId: string; inverted: boolean }

const STEPS = ['Asset type', 'Details', 'Bind points', 'Review'] as const

// A physical channel is a candidate for a spec when its writability matches the
// point's intent: command/setpoint points need a writable channel, read points
// prefer read channels but any channel is allowed.
function channelSuitable(spec: PointSpec, ch: Channel): boolean {
  const needsWrite = spec.access === 'write' || spec.access === 'read_write'
  if (needsWrite) return ch.writable
  return true
}

export default function NewAssetPage() {
  return (
    <Suspense fallback={null}>
      <NewAssetWizard />
    </Suspense>
  )
}

function NewAssetWizard() {
  const searchParams = useSearchParams()
  const initialType = searchParams.get('type') ?? ''

  const [step, setStep] = useState(initialType ? 1 : 0)
  const [typeId, setTypeId] = useState(initialType)
  const [name, setName] = useState('')
  const [siteId, setSiteId] = useState(sites[0]?.id ?? '')
  const [bindings, setBindings] = useState<Record<string, Binding | null>>({})
  const [created, setCreated] = useState(false)

  const type = getAssetType(typeId)

  const siteDevices = useMemo(
    () => (siteId ? devicesForSite(siteId) : allDevices),
    [siteId],
  )

  // Flat, grouped-by-device list of channels available at the chosen site.
  const channelIndex = useMemo(() => {
    const map = new Map<string, { deviceId: string; deviceName: string; channel: Channel }>()
    for (const d of siteDevices) {
      for (const ch of d.channels) {
        map.set(`${d.id}:${ch.id}`, { deviceId: d.id, deviceName: d.name, channel: ch })
      }
    }
    return map
  }, [siteDevices])

  const requiredSpecs = type?.points.filter((p) => p.required) ?? []
  const requiredBound = requiredSpecs.every((p) => bindings[p.key])
  const boundCount = type ? type.points.filter((p) => bindings[p.key]).length : 0

  function setBinding(key: string, value: string) {
    if (!value) {
      setBindings((b) => ({ ...b, [key]: null }))
      return
    }
    const [deviceId, channelId] = value.split(':')
    setBindings((b) => ({ ...b, [key]: { deviceId, channelId, inverted: b[key]?.inverted ?? false } }))
  }

  function toggleInvert(key: string) {
    setBindings((b) => {
      const cur = b[key]
      if (!cur) return b
      return { ...b, [key]: { ...cur, inverted: !cur.inverted } }
    })
  }

  const canAdvance =
    (step === 0 && !!typeId) ||
    (step === 1 && name.trim().length > 0 && !!siteId) ||
    (step === 2 && requiredBound) ||
    step === 3

  function reset() {
    setStep(0)
    setTypeId('')
    setName('')
    setSiteId(sites[0]?.id ?? '')
    setBindings({})
    setCreated(false)
  }

  if (created && type) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Asset created" description="Prototype — the asset and its point mappings would now be persisted." />
        <Card className="flex flex-col items-center gap-5 py-12 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-[var(--success)]/15 text-[var(--success)]">
            <CircleCheck className="size-7" />
          </span>
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-medium text-foreground text-balance">{name}</h2>
            <p className="text-sm text-muted-foreground">
              {type.name} · {sites.find((s) => s.id === siteId)?.name} · {boundCount} points bound
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Link href="/assets" className={cn(buttonVariants({ size: 'sm' }))}>
              View assets
            </Link>
            <Button variant="outline" size="sm" onClick={reset}>
              <RotateCcw className="size-4" /> Create another
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/assets"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Assets
      </Link>

      <PageHeader
        title="Create asset"
        description="Instantiate a real piece of equipment from an asset type, then bind each logical point to a physical channel."
      />

      <AbstractionTrail active={['channel', 'point', 'asset']} />

      {/* Stepper */}
      <div className="flex flex-wrap items-center gap-2">
        {STEPS.map((label, i) => {
          const state = i < step ? 'done' : i === step ? 'current' : 'todo'
          return (
            <div key={label} className="flex items-center gap-2">
              <div
                className={cn(
                  'flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors',
                  state === 'current' && 'border-primary/60 bg-primary/10 text-foreground',
                  state === 'done' && 'border-border bg-muted/40 text-muted-foreground',
                  state === 'todo' && 'border-border text-muted-foreground',
                )}
              >
                <span
                  className={cn(
                    'flex size-5 items-center justify-center rounded-full text-xs tabular-nums',
                    state === 'current' && 'bg-primary text-primary-foreground',
                    state === 'done' && 'bg-[var(--success)] text-background',
                    state === 'todo' && 'bg-muted text-muted-foreground',
                  )}
                >
                  {state === 'done' ? <Check className="size-3" /> : i + 1}
                </span>
                {label}
              </div>
              {i < STEPS.length - 1 && <ArrowRight className="size-3.5 text-muted-foreground" />}
            </div>
          )
        })}
      </div>

      {/* Step 0 — choose asset type */}
      {step === 0 && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {assetTypes.map((t) => {
            const selected = t.id === typeId
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTypeId(t.id)}
                className={cn(
                  'flex flex-col gap-3 rounded-lg border p-4 text-left transition-colors',
                  selected ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-3">
                    <span
                      className={cn(
                        'flex size-10 items-center justify-center rounded-lg',
                        selected ? 'bg-primary text-primary-foreground' : 'bg-primary/15 text-primary',
                      )}
                    >
                      <AssetTypeIcon icon={t.icon} className="size-5" />
                    </span>
                    <span className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">{t.name}</span>
                      <span className="text-xs text-muted-foreground">{t.category}</span>
                    </span>
                  </span>
                  {selected && <CircleCheck className="size-5 text-primary" />}
                </div>
                <p className="text-sm text-muted-foreground text-pretty">{t.description}</p>
                <div className="flex flex-wrap gap-1">
                  {t.points.map((p) => (
                    <Badge key={p.key} variant={roleBadgeVariant[p.role]}>
                      {p.name}
                    </Badge>
                  ))}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Step 1 — details */}
      {step === 1 && type && (
        <Card className="flex flex-col gap-5">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <AssetTypeIcon icon={type.icon} className="size-5" />
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">{type.name}</span>
              <span className="text-xs text-muted-foreground">
                {type.points.length} points · {requiredSpecs.length} required
              </span>
            </div>
            <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setStep(0)}>
              Change type
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-foreground">Asset name</span>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ventilation Unit V2" autoFocus />
              <span className="text-xs text-muted-foreground">The name customers will see on the asset.</span>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-foreground">Site</span>
              <select
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <span className="text-xs text-muted-foreground">
                Points can only bind to channels on devices at this site.
              </span>
            </label>
          </div>
        </Card>
      )}

      {/* Step 2 — bind points to channels */}
      {step === 2 && type && (
        <Card className="p-0">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-sm font-medium text-foreground">Bind logical points to physical channels</h2>
              <p className="text-xs text-muted-foreground text-pretty">
                Each point below is declared by the <span className="text-foreground">{type.name}</span> type. Bind it to a
                raw channel — points may come from different devices.
              </p>
            </div>
            <Badge variant={requiredBound ? 'success' : 'warning'} className="gap-1">
              {requiredBound ? <CircleCheck className="size-3" /> : <CircleAlert className="size-3" />}
              {requiredSpecs.filter((p) => bindings[p.key]).length}/{requiredSpecs.length} required bound
            </Badge>
          </div>

          <div className="divide-y divide-border">
            {type.points.map((spec) => {
              const binding = bindings[spec.key]
              const options = siteDevices
                .map((d) => ({
                  device: d,
                  channels: d.channels.filter((ch) => channelSuitable(spec, ch)),
                }))
                .filter((g) => g.channels.length > 0)
              const isBoolean = spec.dataType === 'boolean'

              return (
                <div key={spec.key} className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{spec.name}</span>
                      <Badge variant={roleBadgeVariant[spec.role]}>{pointRoleLabels[spec.role]}</Badge>
                      {spec.required ? (
                        <Badge variant="info">Required</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Optional</span>
                      )}
                      {spec.unit && <span className="font-mono text-xs text-muted-foreground">{spec.unit}</span>}
                    </div>
                    <span className="font-mono text-xs text-muted-foreground">{spec.key}</span>
                  </div>

                  <div className="flex flex-col gap-2 md:w-96">
                    <select
                      value={binding ? `${binding.deviceId}:${binding.channelId}` : ''}
                      onChange={(e) => setBinding(spec.key, e.target.value)}
                      className={cn(
                        'h-9 rounded-md border bg-transparent px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40',
                        binding ? 'border-input' : spec.required ? 'border-[var(--warning)]/50' : 'border-input',
                      )}
                    >
                      <option value="">{spec.required ? 'Select a channel…' : 'Not bound (optional)'}</option>
                      {options.map((g) => (
                        <optgroup key={g.device.id} label={g.device.name}>
                          {g.channels.map((ch) => (
                            <option key={ch.id} value={`${g.device.id}:${ch.id}`}>
                              {ch.ref} · {ch.interface}
                              {ch.value ? ` (= ${ch.value})` : ''}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>

                    {binding && isBoolean && (
                      <label className="flex items-center gap-2 text-xs text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={binding.inverted}
                          onChange={() => toggleInvert(spec.key)}
                          className="size-3.5 accent-[var(--primary)]"
                        />
                        Invert raw signal (contact is wired normally-closed)
                      </label>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Step 3 — review */}
      {step === 3 && type && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <h2 className="mb-3 text-sm font-medium text-foreground">Summary</h2>
            <dl className="flex flex-col gap-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">Name</dt>
                <dd className="font-medium text-foreground">{name}</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">Type</dt>
                <dd className="font-medium text-foreground">{type.name}</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">Site</dt>
                <dd className="font-medium text-foreground">{sites.find((s) => s.id === siteId)?.name}</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">Points bound</dt>
                <dd className="font-medium text-foreground">
                  {boundCount}/{type.points.length}
                </dd>
              </div>
            </dl>
          </Card>

          <Card className="p-0 lg:col-span-2">
            <div className="border-b border-border p-4">
              <h2 className="text-sm font-medium text-foreground">Resulting asset</h2>
              <p className="text-xs text-muted-foreground text-pretty">
                How the bound points resolve into the customer-facing asset, with full provenance back to the hardware.
              </p>
            </div>
            <div className="divide-y divide-border">
              {type.points.map((spec) => {
                const binding = bindings[spec.key]
                const entry = binding ? channelIndex.get(`${binding.deviceId}:${binding.channelId}`) : null
                const ch = entry?.channel
                let resolved = '—'
                if (ch) {
                  if (spec.dataType === 'boolean') {
                    resolved = boolActive(ch.value, binding!.inverted) ? 'ACTIVE' : 'INACTIVE'
                  } else {
                    resolved = ch.unit ? `${ch.value} ${ch.unit}` : ch.value
                  }
                }
                return (
                  <div key={spec.key} className="flex flex-wrap items-center gap-3 p-4">
                    <div className="flex min-w-40 flex-1 flex-col gap-0.5">
                      <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                        {spec.name}
                        <Badge variant={roleBadgeVariant[spec.role]}>{pointRoleLabels[spec.role]}</Badge>
                      </span>
                      {entry ? (
                        <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                          <Cpu className="size-3" /> {entry.deviceName}
                          <Link2 className="size-3" /> {ch!.ref}
                          {binding!.inverted && <span className="text-[var(--warning)]">· inverted</span>}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not bound</span>
                      )}
                    </div>
                    <span
                      className={cn(
                        'font-mono text-sm',
                        resolved === '—' ? 'text-muted-foreground' : 'text-foreground',
                      )}
                    >
                      {resolved}
                    </span>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Footer nav */}
      <div className="flex items-center justify-between border-t border-border pt-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          <ArrowLeft className="size-4" /> Back
        </Button>

        {step < 3 ? (
          <Button size="sm" onClick={() => setStep((s) => s + 1)} disabled={!canAdvance}>
            Continue <ArrowRight className="size-4" />
          </Button>
        ) : (
          <Button size="sm" onClick={() => setCreated(true)}>
            <Plus className="size-4" /> Create asset
          </Button>
        )}
      </div>
    </div>
  )
}
