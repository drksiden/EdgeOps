import Link from 'next/link'
import { ArrowRight, Cable, FileCog } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { AbstractionTrail } from '@/components/abstraction-trail'
import { Card,CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { listDeviceProfiles } from '@/lib/physical-api'

export default async function DeviceProfilesPage(){const profiles=await listDeviceProfiles();return <div className="flex flex-col gap-6">
  <PageHeader title="Device Profiles" description="Versioned physical contracts that declare the channels exposed by reusable hardware families." />
  <AbstractionTrail active={['hardware','channel']} />
  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">{profiles.map(p=>{const published=p.versions?.find(v=>v.status==='published');return <Link key={p.id} href={`/device-profiles/${p.id}`} className="group"><Card className="h-full transition-colors group-hover:border-primary/50"><CardContent className="flex h-full flex-col gap-4 p-4">
    <div className="flex items-start justify-between"><span className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-lg bg-muted"><FileCog className="size-5" /></span><span><span className="block text-sm font-medium">{p.name}</span><span className="text-xs text-muted-foreground">{p.manufacturer} · {p.model}</span></span></span><ArrowRight className="size-4 text-muted-foreground" /></div>
    <p className="text-sm text-muted-foreground">{p.description}</p><div className="mt-auto flex gap-1"><Badge variant="outline">{p.status}</Badge><Badge variant="outline"><Cable className="size-3" /> {published?.channels.length??0} channels</Badge>{published&&<Badge variant="primary">v{published.version}</Badge>}</div>
  </CardContent></Card></Link>})}</div>
</div>}
