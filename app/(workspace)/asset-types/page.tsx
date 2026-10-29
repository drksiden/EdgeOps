import Link from 'next/link'
import { ArrowRight, Plus } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { AbstractionTrail } from '@/components/abstraction-trail'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AssetTypeIcon, roleBadgeVariant } from '@/components/asset-type-visuals'
import { assetTypes, assetsOfType } from '@/lib/mock-data'

export default function AssetTypesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Asset Types"
        description="Reusable templates that declare the logical points a class of equipment exposes — the semantic contract every asset of that kind inherits."
        actions={
          <Button size="sm">
            <Plus className="size-4" /> New asset type
          </Button>
        }
      />

      <AbstractionTrail active={['point', 'asset']} />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {assetTypes.map((t) => {
          const inUse = assetsOfType(t.id).length
          const requiredCount = t.points.filter((p) => p.required).length
          return (
            <Link key={t.id} href={`/asset-types/${t.id}`} className="group">
              <Card className="h-full transition-colors group-hover:border-primary/50">
                <CardContent className="flex h-full flex-col gap-4 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex items-center gap-3">
                      <span className="flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                        <AssetTypeIcon icon={t.icon} className="size-5" />
                      </span>
                      <span className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">{t.name}</span>
                        <span className="text-xs text-muted-foreground">{t.category}</span>
                      </span>
                    </span>
                    <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                  </div>

                  <p className="text-sm text-muted-foreground text-pretty">{t.description}</p>

                  <div className="mt-auto flex flex-col gap-2">
                    <div className="flex flex-wrap gap-1">
                      {t.points.slice(0, 5).map((p) => (
                        <Badge key={p.key} variant={roleBadgeVariant[p.role]} className="gap-1">
                          {p.name}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between border-t border-border pt-2 text-xs text-muted-foreground">
                      <span>
                        {t.points.length} points · {requiredCount} required
                      </span>
                      <span className="tabular-nums">
                        {inUse} asset{inUse === 1 ? '' : 's'}
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
