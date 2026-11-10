import Link from 'next/link'
import { Plus, Search, ChevronRight } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Card } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { listOrganizations, listSites } from '@/lib/edgeops-api'

export default async function SitesPage() {
  const organizations = await listOrganizations()
  const organization = organizations[0]
  const sites = organization ? await listSites(organization.id) : []

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Sites" description="Physical locations where gateways and devices are deployed."
        actions={<Link href="/sites/new" className={buttonVariants({ size: 'sm' })}><Plus className="size-4" />Add site</Link>} />
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input placeholder="Filter sites..." className="pl-8" />
        </div>
        {organization && <Badge variant="outline">{organization.name}</Badge>}
      </div>
      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Site</TableHead><TableHead>Status</TableHead><TableHead>Timezone</TableHead><TableHead>Organization</TableHead><TableHead className="w-8" /></TableRow></TableHeader>
          <TableBody>
            {sites.map((site) => (
              <TableRow key={site.id}>
                <TableCell><Link href={`/sites/${site.id}?organizationId=${site.organizationId}`} className="flex flex-col"><span className="font-medium text-foreground">{site.name}</span><span className="text-xs text-muted-foreground">{site.addressText || 'No address'}</span></Link></TableCell>
                <TableCell><Badge variant="outline">{site.status}</Badge></TableCell>
                <TableCell className="text-muted-foreground">{site.timezone}</TableCell>
                <TableCell className="text-muted-foreground">{site.organizationName}</TableCell>
                <TableCell><Link href={`/sites/${site.id}?organizationId=${site.organizationId}`} className="flex text-muted-foreground hover:text-foreground"><ChevronRight className="size-4" /></Link></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {sites.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">No sites yet. Create the first physical location.</p>}
      </Card>
    </div>
  )
}
