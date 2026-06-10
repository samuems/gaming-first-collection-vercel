import { createServiceClient } from '@/lib/supabase/service'
import type { Operator, OperatorStatus } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Building2, ShieldCheck, ShieldOff, FilePen } from 'lucide-react'
import { CreateOperatorPanel } from './CreateOperatorPanel'
import { CopyButton } from './CopyButton'
import { setOperatorStatus } from './actions'

export const revalidate = 0

// ── Status badge ────────────────────────────────────────────────────────────

const statusBadgeClass: Record<OperatorStatus, string> = {
  active:    'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  suspended: 'bg-red-500/10 text-red-400 border-red-500/30',
  draft:     'bg-zinc-500/10 text-zinc-400 border-zinc-500/30',
}

// ── Status toggle form ───────────────────────────────────────────────────────

function StatusToggleButtons({ operator }: { operator: Operator }) {
  const { id, status } = operator

  if (status === 'active') {
    const suspendWithId = setOperatorStatus.bind(null, id, 'suspended')
    return (
      <form action={suspendWithId}>
        <Button
          type="submit"
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1.5 text-red-400 border-red-500/30 hover:bg-red-500/10"
        >
          <ShieldOff className="size-3" />
          Suspend
        </Button>
      </form>
    )
  }

  if (status === 'suspended' || status === 'draft') {
    const activateWithId = setOperatorStatus.bind(null, id, 'active')
    return (
      <form action={activateWithId}>
        <Button
          type="submit"
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1.5 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
        >
          <ShieldCheck className="size-3" />
          Activate
        </Button>
      </form>
    )
  }

  return null
}

// ── Page ────────────────────────────────────────────────────────────────────

export default async function OperatorsPage() {
  const supabase = createServiceClient()
  const { data: operators } = await supabase
    .from('operators')
    .select('*')
    .order('created_at', { ascending: false })

  const rows = (operators ?? []) as Operator[]

  const totalCount    = rows.length
  const activeCount   = rows.filter((o) => o.status === 'active').length
  const suspendedCount = rows.filter((o) => o.status === 'suspended').length
  const draftCount    = rows.filter((o) => o.status === 'draft').length

  const stats = [
    { label: 'Total',     value: totalCount,     sub: 'registered' },
    { label: 'Active',    value: activeCount,    sub: 'live now' },
    { label: 'Suspended', value: suspendedCount, sub: 'blocked' },
    { label: 'Draft',     value: draftCount,     sub: 'not yet live' },
  ]

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Operators
            {totalCount > 0 && (
              <span className="ml-2 text-base font-normal text-muted-foreground">
                ({totalCount})
              </span>
            )}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Each operator is a casino client with a scoped game instance, API
            key, and optional theme override.
          </p>
        </div>
        <CreateOperatorPanel />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map(({ label, value, sub }) => (
          <Card key={label}>
            <CardContent className="pt-5 pb-4">
              <p className="text-3xl font-bold">{value}</p>
              <p className="text-sm font-medium mt-0.5">{label}</p>
              <p className="text-xs text-muted-foreground">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="size-4 text-muted-foreground" />
            <CardTitle className="text-sm">Registered Operators</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>API Key</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground py-12 text-sm"
                  >
                    No operators yet — click &quot;New Operator&quot; to add one.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((operator) => (
                  <TableRow key={operator.id}>
                    {/* Name */}
                    <TableCell className="font-medium">{operator.name}</TableCell>

                    {/* Status badge */}
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs capitalize ${statusBadgeClass[operator.status]}`}
                      >
                        {operator.status}
                      </Badge>
                    </TableCell>

                    {/* API Key */}
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs text-muted-foreground">
                          {operator.api_key.slice(0, 20)}…
                        </span>
                        <CopyButton text={operator.api_key} />
                      </div>
                    </TableCell>

                    {/* Created */}
                    <TableCell className="text-xs text-muted-foreground tabular-nums">
                      {new Date(operator.created_at).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <StatusToggleButtons operator={operator} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Status legend */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>Status:</span>
        <Badge variant="outline" className={`text-xs capitalize ${statusBadgeClass.active}`}>
          Active
        </Badge>
        <Badge variant="outline" className={`text-xs capitalize ${statusBadgeClass.suspended}`}>
          Suspended
        </Badge>
        <Badge variant="outline" className={`text-xs capitalize ${statusBadgeClass.draft}`}>
          <FilePen className="size-3 mr-1" />
          Draft
        </Badge>
      </div>
    </div>
  )
}
