'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, CornerDownLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { navItems } from '@/lib/nav'
import { sites, assets, devices, gateways, alarms } from '@/lib/mock-data'

interface Entry {
  id: string
  label: string
  hint: string
  group: string
  href: string
}

function buildEntries(): Entry[] {
  return [
    ...navItems.map((n) => ({ id: `nav-${n.href}`, label: n.label, hint: 'Navigate', group: 'Pages', href: n.href })),
    ...sites.map((s) => ({ id: s.id, label: s.name, hint: s.location, group: 'Sites', href: `/sites/${s.id}` })),
    ...assets.map((a) => ({ id: a.id, label: a.name, hint: a.type, group: 'Assets', href: `/assets/${a.id}` })),
    ...devices.map((d) => ({ id: d.id, label: d.name, hint: d.type, group: 'Devices', href: `/devices/${d.id}` })),
    ...gateways.map((g) => ({ id: g.id, label: g.name, hint: g.hardware, group: 'Gateways', href: `/gateways` })),
    ...alarms.map((a) => ({ id: a.id, label: a.title, hint: a.siteName, group: 'Alarms', href: `/alarms` })),
  ]
}

export function CommandPalette({ onOpenChange }: { onOpenChange: (v: boolean) => void }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const entries = useMemo(() => buildEntries(), [])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return entries.slice(0, 8)
    return entries
      .filter((e) => e.label.toLowerCase().includes(q) || e.hint.toLowerCase().includes(q) || e.group.toLowerCase().includes(q))
      .slice(0, 12)
  }, [query, entries])

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 30)
    return () => clearTimeout(t)
  }, [])

  function go(href: string) {
    onOpenChange(false)
    router.push(href)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results[active]) go(results[active].href)
    } else if (e.key === 'Escape') {
      onOpenChange(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[12vh]">
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={() => onOpenChange(false)} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="relative z-10 flex w-full max-w-xl flex-col overflow-hidden rounded-lg border border-border bg-popover shadow-2xl"
      >
        <div className="flex items-center gap-2.5 border-b border-border px-3">
          <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActive(0)
            }}
            onKeyDown={onKeyDown}
            placeholder="Search sites, assets, devices, alarms…"
            className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
          />
          <kbd className="hidden rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">
            ESC
          </kbd>
        </div>

        <ul className="max-h-80 overflow-y-auto scrollbar-thin p-1.5">
          {results.length === 0 && (
            <li className="px-3 py-8 text-center text-sm text-muted-foreground">No matches found</li>
          )}
          {results.map((entry, i) => (
            <li key={entry.id}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => go(entry.href)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left text-sm transition-colors',
                  i === active ? 'bg-muted' : 'hover:bg-muted/60',
                )}
              >
                <span className="w-16 shrink-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  {entry.group}
                </span>
                <span className="flex-1 truncate text-foreground">{entry.label}</span>
                <span className="truncate text-xs text-muted-foreground">{entry.hint}</span>
                {i === active && <CornerDownLeft className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
