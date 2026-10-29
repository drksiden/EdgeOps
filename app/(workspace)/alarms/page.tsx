'use client'

import { useState } from 'react'
import { Check, BellOff, Filter } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SeverityBadge, AlarmStateBadge } from '@/components/status-badge'
import { EmptyState } from '@/components/empty-state'
import { alarms as seedAlarms, type Alarm, type AlarmState } from '@/lib/mock-data'

type Tab = 'active' | 'acknowledged' | 'resolved' | 'all'

const tabs: { id: Tab; label: string }[] = [
  { id: 'active', label: 'Active' },
  { id: 'acknowledged', label: 'Acknowledged' },
  { id: 'resolved', label: 'Resolved' },
  { id: 'all', label: 'All' },
]

const severityAccent: Record<Alarm['severity'], string> = {
  critical: 'border-l-destructive',
  warning: 'border-l-[var(--warning)]',
  info: 'border-l-[var(--info)]',
}

export default function AlarmsPage() {
  const [list, setList] = useState<Alarm[]>(seedAlarms)
  const [tab, setTab] = useState<Tab>('active')

  const filtered = list.filter((a) => (tab === 'all' ? true : a.state === tab))

  function update(id: string, state: AlarmState, actor: string | null) {
    setList((prev) => prev.map((a) => (a.id === id ? { ...a, state, acknowledgedBy: actor } : a)))
  }

  const counts = {
    active: list.filter((a) => a.state === 'active').length,
    acknowledged: list.filter((a) => a.state === 'acknowledged').length,
    resolved: list.filter((a) => a.state === 'resolved').length,
    all: list.length,
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Alarms"
        description="Rule-driven events across the fleet. Acknowledge to silence, resolve to close."
        actions={
          <Button variant="outline" size="sm">
            <Filter className="size-4" />
            Filters
          </Button>
        }
      />

      <div className="flex items-center gap-0.5 overflow-x-auto border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
            <span className="rounded bg-muted px-1.5 text-xs tabular-nums text-muted-foreground">
              {counts[t.id]}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={BellOff}
          title="Nothing here"
          description={`No ${tab === 'all' ? '' : tab} alarms to show right now.`}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((a) => (
            <Card key={a.id} className={`border-l-2 ${severityAccent[a.severity]}`}>
              <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <SeverityBadge severity={a.severity} />
                    <AlarmStateBadge state={a.state} />
                    <span className="font-mono text-xs text-muted-foreground">{a.id}</span>
                  </div>
                  <p className="text-sm font-medium text-pretty">{a.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.assetName} · {a.siteName} · rule: {a.rule}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    started {a.started} · {a.duration}
                    {a.acknowledgedBy && ` · ack by ${a.acknowledgedBy}`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {a.state === 'active' && (
                    <Button variant="outline" size="sm" onClick={() => update(a.id, 'acknowledged', 'Danil')}>
                      <Check className="size-4" />
                      Acknowledge
                    </Button>
                  )}
                  {a.state !== 'resolved' && (
                    <Button size="sm" onClick={() => update(a.id, 'resolved', a.acknowledgedBy ?? 'Danil')}>
                      Resolve
                    </Button>
                  )}
                  {a.state === 'resolved' && (
                    <span className="text-xs text-muted-foreground">Closed</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
