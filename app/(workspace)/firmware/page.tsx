import { Package, UploadCloud } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { firmware } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

const statusVariant = {
  stable: 'success',
  beta: 'info',
  deprecated: 'default',
} as const

export default function FirmwarePage() {
  const products = Array.from(new Set(firmware.map((f) => f.product)))

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Firmware"
        description="Signed build catalog and staged over-the-air rollouts"
        actions={
          <Button>
            <UploadCloud /> Upload build
          </Button>
        }
      />

      {products.map((product) => {
        const builds = firmware.filter((f) => f.product === product)
        return (
          <Card key={product} className="p-0">
            <CardHeader className="flex-row items-center gap-3 px-4 py-3.5">
              <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Package className="size-4" />
              </span>
              <CardTitle>{product}</CardTitle>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Version</TableHead>
                  <TableHead>Build</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Released</TableHead>
                  <TableHead>Compatible hardware</TableHead>
                  <TableHead className="min-w-40">Adoption</TableHead>
                  <TableHead className="w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {builds.map((b) => (
                  <TableRow key={b.build}>
                    <TableCell className="font-mono text-xs font-medium text-foreground">{b.version}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{b.build}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[b.status]} className="capitalize">
                        {b.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{b.released}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {b.compatible.map((c) => (
                          <Badge key={c} variant="outline">
                            {c}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn('h-full rounded-full', b.status === 'deprecated' ? 'bg-muted-foreground' : 'bg-primary')}
                            style={{ width: `${b.adoption}%` }}
                          />
                        </div>
                        <span className="font-mono text-xs tabular-nums text-muted-foreground">{b.adoption}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="xs" disabled={b.status === 'deprecated'}>
                        Deploy
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )
      })}
    </div>
  )
}
