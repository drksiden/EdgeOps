import { use } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, Boxes, Plus, Tag } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { AbstractionTrail } from '@/components/abstraction-trail'
import { Card } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MetricCard } from '@/components/metric-card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { assetTypeIcon, roleBadgeVariant } from '@/components/asset-type-visuals'
import {
  getAssetType,
  assetsOfType,
  siteName,
  pointRoleLabels,
  pointDataTypeLabels,
  pointAccessLabels,
} from '@/lib/mock-data'
import { cn } from '@/lib/utils'

export default function AssetTypeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const type = getAssetType(id)
  if (!type) notFound()

  const instances = assetsOfType(type.id)
  const requiredCount = type.points.filter((p) => p.required).length

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/asset-types"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Asset Types
      </Link>

      <PageHeader
        title={type.name}
        description={type.description}
        actions={
          <>
            <Badge variant="outline" className="mr-1 gap-1.5">
              <Tag className="size-3" /> Template
            </Badge>
            <Link
              href={`/assets/new?type=${type.id}`}
              className={cn(buttonVariants({ size: 'sm' }))}
            >
              <Plus className="size-4" /> Create asset
            </Link>
          </>
        }
      />

      <AbstractionTrail active={['point', 'asset']} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          label="Category"
          value={type.category}
          icon={assetTypeIcon(type.icon)}
        />
        <MetricCard label="Logical points" value={type.points.length} icon={Tag} tone="primary" />
        <MetricCard label="Required" value={`${requiredCount}/${type.points.length}`} icon={Tag} />
        <MetricCard label="Assets of type" value={instances.length} icon={Boxes} />
      </div>

      <Card className="p-0">
        <div className="flex flex-col gap-1 border-b border-border p-4">
          <h2 className="text-sm font-medium text-foreground">Point contract</h2>
          <p className="text-xs text-muted-foreground text-pretty">
            The logical signals every asset of this type must expose. When creating an asset, each point is bound to a
            physical channel — required points must be mapped before the asset can go live.
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Point</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Data type</TableHead>
              <TableHead className="text-center">Access</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead className="text-center">Required</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {type.points.map((p) => (
              <TableRow key={p.key}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">{p.name}</span>
                    <span className="font-mono text-xs text-muted-foreground">{p.key}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={roleBadgeVariant[p.role]}>{pointRoleLabels[p.role]}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{pointDataTypeLabels[p.dataType]}</TableCell>
                <TableCell className="text-center font-mono text-xs text-muted-foreground">
                  {pointAccessLabels[p.access]}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{p.unit ?? '—'}</TableCell>
                <TableCell className="text-center">
                  {p.required ? (
                    <Badge variant="info">Required</Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">Optional</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card className="p-0">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-sm font-medium text-foreground">Assets of this type</h2>
          <span className="text-xs text-muted-foreground">{instances.length} deployed</span>
        </div>
        {instances.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">No assets of this type yet.</div>
        ) : (
          <div className="divide-y divide-border">
            {instances.map((a) => (
              <Link
                key={a.id}
                href={`/assets/${a.id}`}
                className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-muted/50"
              >
                <span className="flex items-center gap-3">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Boxes className="size-4" />
                  </span>
                  <span className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">{a.name}</span>
                    <span className="text-xs text-muted-foreground">{siteName(a.siteId)}</span>
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
