'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { navItems, sectionLabels } from '@/lib/nav'
import { OrganizationSwitcher } from '@/components/organization-switcher'
import { alarms } from '@/lib/mock-data'
import { Activity } from 'lucide-react'

const sections = ['operate', 'infrastructure', 'admin'] as const

export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const activeAlarms = alarms.filter((a) => a.state === 'active').length

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href))

  return (
    <div className="flex h-full flex-col gap-4 bg-sidebar p-3">
      <div className="flex items-center gap-2 px-1 pt-1">
        <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Activity className="size-4" aria-hidden />
        </span>
        <span className="text-sm font-semibold tracking-tight">EdgeOps</span>
        <span className="ml-auto font-mono text-[10px] text-muted-foreground">v0.9</span>
      </div>

      <OrganizationSwitcher />

      <nav className="flex flex-1 flex-col gap-5 overflow-y-auto scrollbar-thin">
        {sections.map((section) => (
          <div key={section} className="flex flex-col gap-0.5">
            <p className="px-2 pb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
              {sectionLabels[section]}
            </p>
            {navItems
              .filter((item) => item.section === section)
              .map((item) => {
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      'group flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors',
                      active
                        ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                        : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground',
                    )}
                  >
                    <item.icon
                      className={cn('size-4 shrink-0', active ? 'text-primary' : 'text-muted-foreground')}
                      aria-hidden
                    />
                    <span className="flex-1">{item.label}</span>
                    {item.href === '/alarms' && activeAlarms > 0 && (
                      <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground tabular-nums">
                        {activeAlarms}
                      </span>
                    )}
                  </Link>
                )
              })}
          </div>
        ))}
      </nav>

      <div className="rounded-md border border-border bg-card/50 p-2.5 text-xs">
        <p className="font-medium text-foreground">Telemetry pipeline</p>
        <p className="mt-0.5 text-muted-foreground">3.4k pts/s · 99.94% uptime</p>
      </div>
    </div>
  )
}
