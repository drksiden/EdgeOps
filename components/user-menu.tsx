'use client'

import { useState } from 'react'
import { LogOut, Settings, UserCog, LifeBuoy } from 'lucide-react'

export function UserMenu() {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-md p-0.5 pr-1.5 transition-colors hover:bg-muted"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="flex size-7 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
          DN
        </span>
        <span className="hidden text-left sm:flex sm:flex-col">
          <span className="text-xs font-medium leading-tight">Danil</span>
          <span className="text-[10px] leading-tight text-muted-foreground">Engineer</span>
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div
            role="menu"
            className="absolute right-0 top-[calc(100%+6px)] z-50 w-52 overflow-hidden rounded-md border border-border bg-popover p-1 shadow-lg"
          >
            <div className="border-b border-border px-2.5 py-2">
              <p className="text-sm font-medium">Danil</p>
              <p className="truncate text-xs text-muted-foreground">danil@antb.io</p>
            </div>
            {[
              { label: 'Account settings', icon: UserCog },
              { label: 'Preferences', icon: Settings },
              { label: 'Help & support', icon: LifeBuoy },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2.5 rounded px-2.5 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <item.icon className="size-4" aria-hidden />
                {item.label}
              </button>
            ))}
            <div className="mt-1 border-t border-border pt-1">
              <button
                type="button"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2.5 rounded px-2.5 py-1.5 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
              >
                <LogOut className="size-4" aria-hidden />
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
