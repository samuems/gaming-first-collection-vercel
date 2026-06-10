import { createServiceClient } from '@/lib/supabase/service'
import type { Tournament, TournamentStatus, Operator } from '@/types/database'
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
import { Trophy, Play, CheckCircle2 } from 'lucide-react'
import { CreateTournamentPanel } from './CreateTournamentPanel'
import { setTournamentStatus } from './actions'

export const revalidate = 0

// ── Status badge ────────────────────────────────────────────────────────────

const statusBadgeClass: Record<TournamentStatus, string> = {
  pending:   'bg-zinc-500/10 text-zinc-400 border-zinc-500/30',
  active:    'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  completed: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
}

// ── Row type (joined) ────────────────────────────────────────────────────────

interface TournamentRow extends Tournament {
  operatorName: string
  participantCount: number
}

// ── Status action buttons ────────────────────────────────────────────────────

function StatusActionButtons({ tournament }: { tournament: TournamentRow }) {
  const { id, status } = tournament

  if (status === 'pending') {
    const activateWithId = setTournamentStatus.bind(null, id, 'active')
    return (
      <form action={activateWithId}>
        <Button
          type="submit"
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1.5 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
        >
          <Play className="size-3" />
          Activate
        </Button>
      </form>
    )
  }

  if (status === 'active') {
    const completeWithId = setTournamentStatus.bind(null, id, 'completed')
    return (
      <form action={completeWithId}>
        <Button
          type="submit"
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1.5 text-blue-400 border-blue-500/30 hover:bg-blue-500/10"
        >
          <CheckCircle2 className="size-3" />
          Complete
        </Button>
      </form>
    )
  }

  return <span className="text-xs text-muted-foreground">—</span>
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function TournamentsPage() {
  const supabase = createServiceClient()

  const [
    { data: tournamentsRaw },
    { data: operatorsRaw },
    { data: battleLogsRaw },
  ] = await Promise.all([
    supabase
      .from('tournaments')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('operators')
      .select('id, name')
      .order('name', { ascending: true }),
    supabase
      .from('battle_logs')
      .select('tournament_id, player_id'),
  ])

  const tournaments = (tournamentsRaw ?? []) as Tournament[]
  const operators   = (operatorsRaw ?? []) as Pick<Operator, 'id' | 'name'>[]

  // Build operator name lookup
  const operatorMap = new Map<string, string>(
    operators.map((op) => [op.id, op.name]),
  )

  // Build participant count per tournament (distinct player_id)
  const participantMap = new Map<string, Set<string>>()
  for (const log of battleLogsRaw ?? []) {
    const tid = (log as { tournament_id: string | null; player_id: string }).tournament_id
    const pid = (log as { tournament_id: string | null; player_id: string }).player_id
    if (!tid) continue
    if (!participantMap.has(tid)) participantMap.set(tid, new Set())
    participantMap.get(tid)!.add(pid)
  }

  const rows: TournamentRow[] = tournaments.map((t) => ({
    ...t,
    operatorName:     operatorMap.get(t.operator_id) ?? '—',
    participantCount: participantMap.get(t.id)?.size ?? 0,
  }))

  const totalCount     = rows.length
  const pendingCount   = rows.filter((t) => t.status === 'pending').length
  const activeCount    = rows.filter((t) => t.status === 'active').length
  const completedCount = rows.filter((t) => t.status === 'completed').length

  const stats = [
    { label: 'Total',     value: totalCount,     sub: 'tournaments' },
    { label: 'Pending',   value: pendingCount,   sub: 'not started' },
    { label: 'Active',    value: activeCount,    sub: 'running now' },
    { label: 'Completed', value: completedCount, sub: 'finished' },
  ]

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Tournaments
            {totalCount > 0 && (
              <span className="ml-2 text-base font-normal text-muted-foreground">
                ({totalCount})
              </span>
            )}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Create tournament templates. Operators activate them for their
            players. All battles are simulated — no live PvP.
          </p>
        </div>
        <CreateTournamentPanel operators={operators} />
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
            <Trophy className="size-4 text-muted-foreground" />
            <CardTitle className="text-sm">All Tournaments</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Operator</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Participants</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-12 text-sm"
                  >
                    No tournaments yet — click &quot;New Tournament&quot; to add one.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((t) => (
                  <TableRow key={t.id}>
                    {/* Name */}
                    <TableCell className="font-medium">{t.name}</TableCell>

                    {/* Operator */}
                    <TableCell className="text-sm text-muted-foreground">
                      {t.operatorName}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs capitalize ${statusBadgeClass[t.status]}`}
                      >
                        {t.status}
                      </Badge>
                    </TableCell>

                    {/* Participants */}
                    <TableCell className="text-right tabular-nums text-sm">
                      {t.participantCount}
                    </TableCell>

                    {/* Created */}
                    <TableCell className="text-xs text-muted-foreground tabular-nums">
                      {new Date(t.created_at).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <StatusActionButtons tournament={t} />
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
        {(Object.entries(statusBadgeClass) as [TournamentStatus, string][]).map(
          ([s, cls]) => (
            <Badge key={s} variant="outline" className={`text-xs capitalize ${cls}`}>
              {s}
            </Badge>
          ),
        )}
      </div>
    </div>
  )
}
