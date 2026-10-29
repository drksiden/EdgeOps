import { use } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, Cable, Cpu, FileCog, Radio } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { AbstractionTrail } from '@/components/abstraction-trail'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MetricCard } from '@/components/metric-card'
import { PropertyList } from '@/components/property-list'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getProfile, devicesForProfile, siteName } from '@/lib/mock-data'

export default function DeviceProfileDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const profile = getProfile(id)
  if (!profile) notFound()

  const applied = devicesForProfile(profile.id)
  const writable = profile.channels.filter((c) => c.writable).length

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/device-profiles"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Device Profiles
      </Link>

      <PageHeader
        title={profile.name}
        description={profile.description}
        actions={
          <Badge variant="outline" className="gap-1.5">
            <FileCog className="size-3" /> Hardware template
          </Badge>
        }
      />

      <AbstractionTrail active={['hardware', 'channel']} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Protocol" value={profile.protocol} icon={Radio} />
        <MetricCard label="Transport" value={profile.transport} icon={Cable} />
        <MetricCard label="Channels" value={profile.channels.length} icon={Cable} tone="primary" />
        <MetricCard label="Applied to" value={applied.length} icon={Cpu} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <h2 className="mb-3 text-sm font-medium text-foreground">Profile</h2>
          <PropertyList
            items={[
              { label: 'Vendor', value: profile.vendor },
              { label: 'Protocol', value: profile.protocol },
              { label: 'Transport', value: profile.transport },
              { label: 'Channels', value: `${profile.channels.length} (${writable} writable)` },
            ]}
          />
        </Card>

        <Card className="p-0 lg:col-span-2">
          <div className="flex flex-col gap-1 border-b border-border p-4">
            <h2 className="text-sm font-medium text-foreground">Channel template</h2>
            <p className="text-xs text-muted-foreground text-pretty">
              The raw signals declared by this profile. Every device that uses the profile inherits these channels
              automatically — no per-device data entry.
            </p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bus address</TableHead>
                <TableHead>Interface</TableHead>
                <TableHead className="text-center">Direction</TableHead>
                <TableHead>Unit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profile.channels.map((c, i) => (
                <TableRow key={`${c.ref}-${i}`}>
                  <TableCell className="font-mono text-xs text-foreground">{c.ref}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.interface}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={c.writable ? 'primary' : 'outline'}>{c.writable ? 'Write' : 'Read'}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{c.unit ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      <Card className="p-0">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-sm font-medium text-foreground">Devices using this profile</h2>
          <span className="text-xs text-muted-foreground">{applied.length} devices</span>
        </div>
        {applied.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">No devices use this profile yet.</div>
        ) : (
          <div className="divide-y divide-border">
            {applied.map((d) => (
              <Link
                key={d.id}
                href={`/devices/${d.id}`}
                className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-muted/50"
              >
                <span className="flex items-center gap-3">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Cpu className="size-4" />
                  </span>
                  <span className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">{d.name}</span>
                    <span className="text-xs text-muted-foreground">{siteName(d.siteId)}</span>
                  </span>
                </span>
                <ArrowRight className="size-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
