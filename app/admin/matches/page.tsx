import { createServiceClient } from '@/lib/supabase/service'
import type { Operator, BattleLog, BattleResult } from '@/types/database'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Swords, Trophy, X, Zap, Bot } from 'lucide-react'

export const revalidate = 0

const RESULT_CFG: Record<BattleResult, { label: string; className: string; icon: React.ElementType }> = {
  win:  { label: 'Win',  className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: Trophy },
  loss: { label: 'Loss', className: 'bg-red-500/10 text-red-400 border-red-500/20',             icon: X },
  draw: { label: 'Draw', className: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',          icon: Zap },
}

const AI_NAMES = new Set(['Shadow Bot', 'Iron Titan', 'Storm Runner', 'Frost Reaper', 'Ember Knight', 'ai-bot'])

export default async function MatchesPage() {
  const supabase = createServiceClient()

  const [{ data: operatorsRaw }, { data: logsRaw, count }] = await Promise.all([
    supabase.from('operators').select('id, name').order('name'),
    supabase
      .from('battle_logs')
      .select('*', { count: 'exact' })
      .is('tournament_id', null)
      .order('created_at', { ascending: false })
      .limit(100),
  ])

  const operators = (operatorsRaw ?? []) as Pick<Operator, 'id' | 'name'>[]
  const logs = (logsRaw ?? []) as BattleLog[]

  const operatorMap = new Map<string, string>()
  for (const op of operators) operatorMap.set(op.id, op.name)

  // Aggregate stats per operator
  const opStats: Record<string, { wins: number; losses: number; draws: number; total: number }> = {}
  for (const log of logs) {
    const id = log.operator_id
    if (!opStats[id]) opStats[id] = { wins: 0, losses: 0, draws: 0, total: 0 }
    opStats[id].total++
    if (log.result === 'win') opStats[id].wins++
    else if (log.result === 'loss') opStats[id].losses++
    else opStats[id].draws++
  }

  const totalWins = logs.filter((l) => l.result === 'win').length
  const totalLosses = logs.filter((l) => l.result === 'loss').length
  const totalDraws = logs.filter((l) => l.result === 'draw').length
  const aiMatches = logs.filter((l) => AI_NAMES.has(l.opponent_name)).length

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Swords className="size-5 text-muted-foreground" />
          1v1 Matches
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          All instant 1v1 battle results across operators (tournament_id = null).
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Matches', value: count ?? 0, sub: 'all time' },
          { label: 'Player Wins', value: totalWins, sub: `${count ? Math.round((totalWins / count) * 100) : 0}% win rate` },
          { label: 'Player Losses', value: totalLosses, sub: '' },
          { label: 'vs AI', value: aiMatches, sub: 'AI fallback battles' },
        ].map(({ label, value, sub }) => (
          <Card key={label}>
            <CardContent className="pt-5 pb-4">
              <p className="text-3xl font-bold">{value}</p>
              <p className="text-sm font-medium mt-0.5">{label}</p>
              {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Per-operator breakdown */}
      {Object.keys(opStats).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">By Operator</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Operator</TableHead>
                  <TableHead className="text-right">Matches</TableHead>
                  <TableHead className="text-right">Wins</TableHead>
                  <TableHead className="text-right">Losses</TableHead>
                  <TableHead className="text-right">Draws</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(opStats).map(([opId, stats]) => (
                  <TableRow key={opId}>
                    <TableCell className="font-medium text-sm">
                      {operatorMap.get(opId) ?? opId}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm">{stats.total}</TableCell>
                    <TableCell className="text-right tabular-nums text-sm text-emerald-400">{stats.wins}</TableCell>
                    <TableCell className="text-right tabular-nums text-sm text-red-400">{stats.losses}</TableCell>
                    <TableCell className="text-right tabular-nums text-sm text-zinc-400">{stats.draws}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Recent matches table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm">Recent Matches</CardTitle>
              <CardDescription className="text-xs mt-0.5">Latest 100 battles</CardDescription>
            </div>
            <Badge variant="outline" className="text-xs">
              {count ?? 0} total
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <p className="text-center text-muted-foreground py-10 text-sm">
              No 1v1 matches yet. Players need to enter the Arena.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Operator</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead>Opponent</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead className="text-right">Rounds</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => {
                  const cfg = RESULT_CFG[log.result]
                  const ResultIcon = cfg.icon
                  const rounds = (log.rounds ?? []) as BattleLog['rounds']
                  const playerRounds = rounds.filter((r) => r.winner === 'player').length
                  const oppRounds = rounds.filter((r) => r.winner === 'opponent').length
                  const isAI = AI_NAMES.has(log.opponent_name)

                  return (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs text-muted-foreground">
                        {operatorMap.get(log.operator_id) ?? log.operator_id.slice(0, 8)}
                      </TableCell>
                      <TableCell className="text-sm font-medium">{log.player_id}</TableCell>
                      <TableCell className="text-sm">
                        <span className="flex items-center gap-1">
                          {isAI && <Bot className="size-3 text-zinc-500" />}
                          {log.opponent_name}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs flex items-center gap-1 w-fit ${cfg.className}`}
                        >
                          <ResultIcon className="size-3" />
                          {cfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                        {playerRounds}–{oppRounds}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
