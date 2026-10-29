'use client'

import { useState } from 'react'
import { Copy, Plus, Check } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5 sm:grid-cols-[220px_1fr] sm:items-center sm:gap-4">
      <div className="flex flex-col gap-0.5">
        <label className="text-sm font-medium text-foreground">{label}</label>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

function Toggle({ defaultOn = false }: { defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn)
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => setOn((v) => !v)}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors',
        on ? 'bg-primary' : 'bg-muted',
      )}
    >
      <span
        className={cn(
          'inline-block size-4 transform rounded-full bg-background transition-transform',
          on ? 'translate-x-4' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}

const apiKeys = [
  { name: 'Production ingest', prefix: 'eo_live_a1b2', created: '2025-08-14', lastUsed: '2s ago' },
  { name: 'Grafana read-only', prefix: 'eo_live_9f3c', created: '2025-06-02', lastUsed: '4m ago' },
  { name: 'CI deploy token', prefix: 'eo_live_77de', created: '2025-05-19', lastUsed: '3d ago' },
]

export default function SettingsPage() {
  const [copied, setCopied] = useState<string | null>(null)

  function copy(prefix: string) {
    navigator.clipboard?.writeText(`${prefix}••••••••••••`)
    setCopied(prefix)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Settings" description="Organization configuration, connectivity, and API access" />

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="connectivity">Connectivity</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="api">API keys</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Organization</CardTitle>
              <CardDescription>Basic details for the active organization.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <Field label="Organization name">
                <Input defaultValue="ANTB Engineering" />
              </Field>
              <Field label="Plan">
                <div className="flex items-center gap-2">
                  <Badge variant="primary">Business</Badge>
                  <Button variant="outline" size="sm">
                    Manage plan
                  </Button>
                </div>
              </Field>
              <Field label="Default timezone">
                <Input defaultValue="Europe/Warsaw (UTC+1)" />
              </Field>
              <Field label="Data retention" hint="Telemetry history kept in hot storage">
                <Input defaultValue="90 days" className="max-w-40" />
              </Field>
              <div className="flex justify-end border-t border-border pt-4">
                <Button>Save changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="connectivity" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>MQTT broker</CardTitle>
              <CardDescription>Gateways connect over MQTT with mutual TLS.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <Field label="Broker host">
                <Input defaultValue="mqtts://ingest.edgeops.io:8883" className="font-mono text-sm" />
              </Field>
              <Field label="Client TLS" hint="Require certificate on every gateway">
                <Toggle defaultOn />
              </Field>
              <Field label="Store-and-forward" hint="Buffer telemetry locally while offline">
                <Toggle defaultOn />
              </Field>
              <Field label="Keepalive interval">
                <Input defaultValue="30s" className="max-w-32 font-mono" />
              </Field>
              <div className="flex justify-end border-t border-border pt-4">
                <Button>Save changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Alarm notifications</CardTitle>
              <CardDescription>Where and when to escalate active alarms.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <Field label="Critical alarms" hint="Page on-call immediately">
                <Toggle defaultOn />
              </Field>
              <Field label="Warning alarms" hint="Digest every 15 minutes">
                <Toggle defaultOn />
              </Field>
              <Field label="Escalation email">
                <Input defaultValue="ops@antb.io" type="email" />
              </Field>
              <Field label="Webhook URL" hint="POST alarm events to your endpoint">
                <Input placeholder="https://" className="font-mono text-sm" />
              </Field>
              <div className="flex justify-end border-t border-border pt-4">
                <Button>Save changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="mt-4">
          <Card className="p-0">
            <CardHeader className="flex-row items-center justify-between px-4 py-3.5">
              <div className="flex flex-col gap-1">
                <CardTitle>API keys</CardTitle>
                <CardDescription>Scoped tokens for ingest and read access.</CardDescription>
              </div>
              <Button size="sm">
                <Plus /> New key
              </Button>
            </CardHeader>
            <div className="divide-y divide-border border-t border-border">
              {apiKeys.map((k) => (
                <div key={k.prefix} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className="flex min-w-40 flex-col gap-0.5">
                    <span className="text-sm font-medium text-foreground">{k.name}</span>
                    <span className="text-xs text-muted-foreground">
                      Created {k.created} · Last used {k.lastUsed}
                    </span>
                  </div>
                  <code className="rounded-md border border-border bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">
                    {k.prefix}••••••••••••
                  </code>
                  <Button variant="ghost" size="xs" className="ml-auto" onClick={() => copy(k.prefix)}>
                    {copied === k.prefix ? <Check className="text-[var(--success)]" /> : <Copy />}
                    {copied === k.prefix ? 'Copied' : 'Copy'}
                  </Button>
                  <Button variant="ghost" size="xs" className="text-destructive hover:text-destructive">
                    Revoke
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
