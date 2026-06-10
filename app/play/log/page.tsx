import { requireSession } from '../lib/session'
import { createServiceClient } from '@/lib/supabase/service'
import type { BattleLog, OperatorUnitOverride, Rarity } from '@/types/database'
import { BattleLogList, type MatchEntry } from './BattleLogList'
import type { UnitMeta } from '../arena/actions'
import { Badge } from '@/components/ui/badge'
import { ScrollText, Trophy, X, Zap } from 'lucide-react'

export const revalidate = 0

const AI_NAMES = new Set(['Shadow Bot', 'Iron Titan', 'Storm Runner', 'Frost Reaper', 'Ember Knight'])

export default async function LogPage() {
  const session = await requireSession()
  const supabase = createServiceClient()

  const { data: logsRaw } = await supabase
    .from('battle_logs')
    .select('*')
    .eq('operator_id', session.operatorId)
    .eq('player_id', session.playerId)
    .is('tournament_id', null)
    .order('created_at', { ascending: false })
    .limit(50)

  const logs = (logsRaw ?? []) as BattleLog[]

  // Collect all unit IDs across all rounds
  const allUnitIds = [...new Set(
    logs.flatMap((log) =>
      (log.rounds ?? []).flatMap((r) => [r.player_unit.id, r.opponent_unit.id]),
    ),
  )]

  // Fetch unit image + rarity + overrides in parallel
  const [{ data: unitRows }, { data: overrideRows }] = await Promise.all([
    allUnitIds.length > 0
      ? supabase.from('units').select('id, image, rarity').in('id', allUnitIds)
      : Promise.resolve({ data: [] }),
    allUnitIds.length > 0
      ? supabase
          .from('operator_unit_overrides')
          .select('unit_id, image_override')
          .eq('operator_id', session.operatorId)
          .in('unit_id', allUnitIds)
      : Promise.resolve({ data: [] }),
  ])

  const overrideImgMap = new Map<string, string | null>()
  for (const ov of (overrideRows ?? []) as Pick<OperatorUnitOverride, 'unit_id' | 'image_override'>[]) {
    overrideImgMap.set(ov.unit_id, ov.image_override)
  }

  const unitMeta: Record<string, UnitMeta> = {}
  for (const u of (unitRows ?? []) as { id: string; image: string | null; rarity: Rarity }[]) {
    unitMeta[u.id] = {
      image: overrideImgMap.get(u.id) ?? u.image,
      rarity: u.rarity,
    }
  }

  const entries: MatchEntry[] = logs.map((log) => {
    const rounds = (log.rounds ?? []) as BattleLog['rounds']
    const playerRoundsWon = rounds.filter((r) => r.winner === 'player').length
    const opponentRoundsWon = rounds.filter((r) => r.winner === 'opponent').length
    return {
      matchId: log.id,
      opponentName: log.opponent_name,
      result: log.result,
      playerRoundsWon,
      opponentRoundsWon,
      rounds: log.rounds,
      createdAt: log.created_at,
      isAI: AI_NAMES.has(log.opponent_name) || log.opponent_name === 'ai-bot',
    }
  })

  const wins = entries.filter((e) => e.result === 'win').length
  const losses = entries.filter((e) => e.result === 'loss').length
  const draws = entries.filter((e) => e.result === 'draw').length

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <ScrollText className="size-5 text-indigo-400" />
        <div>
          <h1 className="text-xl font-black text-white tracking-tight">Battle Log</h1>
          <p className="text-xs text-zinc-500">Track your victories & defeats, recent battles</p>
        </div>
      </div>

      {/* Stats */}
      {entries.length > 0 && (
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <Trophy className="size-3.5 text-emerald-400" />
            <span className="text-sm font-bold text-emerald-400">{wins}</span>
            <span className="text-xs text-zinc-600">wins</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
            <X className="size-3.5 text-red-400" />
            <span className="text-sm font-bold text-red-400">{losses}</span>
            <span className="text-xs text-zinc-600">losses</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700">
            <Zap className="size-3.5 text-zinc-400" />
            <span className="text-sm font-bold text-zinc-300">{draws}</span>
            <span className="text-xs text-zinc-600">draws</span>
          </div>
          <Badge variant="outline" className="ml-auto text-xs border-zinc-700 text-zinc-400">
            {entries.length} battles
          </Badge>
        </div>
      )}

      <BattleLogList entries={entries} unitMeta={unitMeta} />
    </div>
  )
}
