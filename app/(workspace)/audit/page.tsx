import { Download } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { auditLog } from '@/lib/mock-data'

export default function AuditPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Audit log"
        description="Immutable record of commands, configuration changes, and access events"
        actions={
          <Button variant="outline">
            <Download /> Export CSV
          </Button>
        }
      />

      <Card className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Site</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Result</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auditLog.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">{e.time}</TableCell>
                <TableCell className="font-medium text-foreground">{e.actor}</TableCell>
                <TableCell className="text-foreground">{e.action}</TableCell>
                <TableCell className="text-muted-foreground">{e.target}</TableCell>
                <TableCell className="text-muted-foreground">{e.site}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{e.source}</TableCell>
                <TableCell>
                  <Badge variant={e.result === 'success' ? 'success' : 'critical'} className="capitalize">
                    {e.result}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
