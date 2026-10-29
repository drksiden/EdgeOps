import Link from 'next/link'
import { ArrowRight, Cable, Cpu, FileCog, Plus } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { AbstractionTrail } from '@/components/abstraction-trail'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { deviceProfiles, devicesForProfile } from '@/lib/mock-data'

export default function DeviceProfilesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Device Profiles"
        description="Reusable hardware templates that declare the raw channels a class of device exposes on the bus — applied to every device of that model so channels are discovered, not hand-entered."
        actions={
          <Button size="sm">
            <Plus className="size-4" /> New profile
          </Button>
        }
      />

      <AbstractionTrail active={['hardware', 'channel']} />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {deviceProfiles.map((p) => {
          const applied = devicesForProfile(p.id).length
          return (
            <Link key={p.id} href={`/device-profiles/${p.id}`} className="group">
              <Card className="h-full transition-colors group-hover:border-primary/50">
                <CardContent className="flex h-full flex-col gap-4 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex items-center gap-3">
                      <span className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <FileCog className="size-5" />
                      </span>
                      <span className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">{p.name}</span>
                        <span className="text-xs text-muted-foreground">{p.vendor}</span>
                      </span>
                    </span>
                    <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                  </div>

                  <p className="text-sm text-muted-foreground text-pretty">{p.description}</p>

                  <div className="mt-auto flex flex-col gap-2">
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="gap-1">
                        {p.transport}
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        <Cable className="size-3" /> {p.channels.length} channels
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between border-t border-border pt-2 text-xs text-muted-foreground">
                      <span>{p.protocol}</span>
                      <span className="flex items-center gap-1 tabular-nums">
                        <Cpu className="size-3" /> {applied} device{applied === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
