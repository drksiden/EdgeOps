import { UserPlus } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { users } from '@/lib/mock-data'

const statusVariant = {
  active: 'success',
  invited: 'info',
  disabled: 'default',
} as const

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function UsersPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Users & access"
        description="Role-based access scoped to organizations, sites, and assets"
        actions={
          <Button>
            <UserPlus /> Invite user
          </Button>
        }
      />

      <Card className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Scoped access</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <span className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                      {initials(u.name)}
                    </span>
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{u.name}</span>
                      <span className="text-xs text-muted-foreground">{u.email}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant[u.status]} className="capitalize">
                    {u.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {u.scopes.map((s, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <Badge variant="outline">{s.role}</Badge>
                        <span className="text-muted-foreground">{s.scope}</span>
                      </div>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="xs">
                    Manage
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
