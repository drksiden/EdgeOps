import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, MapPin, Pencil, Cpu, Router, Boxes, TriangleAlert } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MetricCard } from '@/components/metric-card'
import { getSite } from '@/lib/edgeops-api'

export default async function SiteDetailPage({ params, searchParams }: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ organizationId?: string }>
}) {
  const [{ id }, query] = await Promise.all([params, searchParams])
  if (!query.organizationId) notFound()
  const site = await getSite(query.organizationId, id).catch(() => null)
  if (!site) notFound()

  return <div className="flex flex-col gap-6">
    <Link href="/sites" className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground"><ArrowLeft className="size-3.5" /> Sites</Link>
    <PageHeader title={site.name} description={site.organizationName}
      actions={<Link className={buttonVariants({ size: 'sm', variant: 'outline' })} href={`/sites/${site.id}/edit?organizationId=${site.organizationId}`}><Pencil className="size-4" />Edit</Link>}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" />{site.addressText || 'No address'}</span>
        <span>{site.timezone}</span><Badge variant="outline">{site.status}</Badge>
      </div>
    </PageHeader>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <MetricCard label="Devices online" value="0/0" icon={Cpu} />
      <MetricCard label="Gateways" value="0/0" icon={Router} />
      <MetricCard label="Assets" value={0} icon={Boxes} />
      <MetricCard label="Active alarms" value={0} icon={TriangleAlert} tone="success" />
    </div>
    <Card><CardHeader><CardTitle>Infrastructure</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Gateway, device, asset, and alarm data will appear here as the next vertical slices are connected. No mock operational data is shown for this persisted site.</CardContent></Card>
  </div>
}
