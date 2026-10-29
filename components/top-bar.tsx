'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Fragment } from 'react'
import { Menu, Search, ChevronRight, Bell } from 'lucide-react'
import { navItems } from '@/lib/nav'
import { getSite, getAsset, getDevice, alarms } from '@/lib/mock-data'
import { UserMenu } from '@/components/user-menu'
import { ThemeToggle } from '@/components/theme-toggle'

function labelFor(segment: string, prev: string): string {
  const nav = navItems.find((n) => n.href === `/${segment}`)
  if (nav) return nav.label
  if (prev === 'sites') return getSite(segment)?.name ?? segment
  if (prev === 'assets') return getAsset(segment)?.name ?? segment
  if (prev === 'devices') return getDevice(segment)?.name ?? segment
  return segment.charAt(0).toUpperCase() + segment.slice(1)
}

function useCrumbs(pathname: string) {
  if (pathname === '/') return [{ label: 'Overview', href: '/' }]
  const segments = pathname.split('/').filter(Boolean)
  const crumbs: { label: string; href: string }[] = [{ label: 'Overview', href: '/' }]
  segments.forEach((seg, i) => {
    const href = '/' + segments.slice(0, i + 1).join('/')
    crumbs.push({ label: labelFor(seg, segments[i - 1] ?? ''), href })
  })
  return crumbs
}

export function TopBar({ onMenu, onSearch }: { onMenu: () => void; onSearch: () => void }) {
  const pathname = usePathname()
  const crumbs = useCrumbs(pathname)
  const activeAlarms = alarms.filter((a) => a.state === 'active').length

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md">
      <button
        type="button"
        onClick={onMenu}
        className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="size-4.5" aria-hidden />
      </button>

      <nav aria-label="Breadcrumb" className="flex min-w-0 flex-1 items-center gap-1.5 text-sm">
        {crumbs.map((crumb, i) => {
          const last = i === crumbs.length - 1
          return (
            <Fragment key={crumb.href}>
              {i > 0 && <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/50" aria-hidden />}
              {last ? (
                <span className="truncate font-medium text-foreground" aria-current="page">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="hidden truncate text-muted-foreground transition-colors hover:text-foreground sm:inline"
                >
                  {crumb.label}
                </Link>
              )}
            </Fragment>
          )
        })}
      </nav>

      <button
        type="button"
        onClick={onSearch}
        className="flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted"
        aria-label="Open command palette"
      >
        <Search className="size-4" aria-hidden />
        <span className="hidden md:inline">Search…</span>
        <kbd className="hidden rounded border border-border px-1 font-mono text-[10px] md:inline">⌘K</kbd>
      </button>

      <ThemeToggle />

      <Link
        href="/alarms"
        className="relative flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label={`${activeAlarms} active alarms`}
      >
        <Bell className="size-4.5" aria-hidden />
        {activeAlarms > 0 && (
          <span className="absolute right-1 top-1 size-2 rounded-full bg-destructive ring-2 ring-background" />
        )}
      </Link>

      <UserMenu />
    </header>
  )
}
