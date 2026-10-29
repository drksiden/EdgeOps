'use client'

import { useState } from 'react'
import { Check, ChevronsUpDown, Building } from 'lucide-react'
import { cn } from '@/lib/utils'
import { organizations } from '@/lib/mock-data'
import { StatusDot } from '@/components/status-badge'

export function OrganizationSwitcher() {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(organizations[0])

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2.5 rounded-md border border-border bg-card px-2.5 py-2 text-left transition-colors hover:bg-muted/60"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded bg-primary/15 text-primary">
          <Building className="size-4" aria-hidden />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium leading-tight">{selected.name}</span>
          <span className="text-xs text-muted-foreground">{selected.plan} plan</span>
        </span>
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <ul
            role="listbox"
            className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 overflow-hidden rounded-md border border-border bg-popover p-1 shadow-lg"
          >
            {organizations.map((org) => (
              <li key={org.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={org.id === selected.id}
                  onClick={() => {
                    setSelected(org)
                    setOpen(false)
                  }}
                  className="flex w-full items-center gap-2.5 rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted"
                >
                  <StatusDot status={org.health} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate leading-tight">{org.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {org.sites} sites · {org.devices} devices
                    </span>
                  </span>
                  <Check
                    className={cn('size-4 text-primary', org.id === selected.id ? 'opacity-100' : 'opacity-0')}
                    aria-hidden
                  />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
