import { requireSession } from '../lib/session'
import { createServiceClient } from '@/lib/supabase/service'
import type { Lineup, BattleLog } from '@/types/database'
import { BattleArena } from './BattleArena'
import { Swords } from 'lucide-react'

export const revalidate = 0

function slotCount(lineup: Lineup): number {
  return [
    lineup.slot1, lineup.slot2, lineup.slot3,
    lineup.slot4, lineup.slot5,
  ].filter(Boolean).length
}

export default async function ArenaPage() {
  const session = await requireSession()
  const supabase = createServiceClient()

  const [{ data: lineupRaw }, { data: logsRaw }] = await Promise.all([
    supabase
      .from('lineups')
      .select('*')
      .eq('operator_id', session.operatorId)
      .eq('player_id', session.playerId)
      .single(),
    supabase
      .from('battle_logs')
      .select('result')
      .eq('operator_id', session.operatorId)
      .eq('player_id', session.playerId)
      .is('tournament_id', null),
  ])

  const lineup = lineupRaw as Lineup | null
  const logs = (logsRaw ?? []) as Pick<BattleLog, 'result'>[]

  // 1v1 battles don't use the lock system — locked lineups can still fight
  const lineupReady = !!lineup && slotCount(lineup) === 5

  const wins = logs.filter((l) => l.result === 'win').length
  const losses = logs.filter((l) => l.result === 'loss').length
  const draws = logs.filter((l) => l.result === 'draw').length

  return (
    <div className="min-h-[calc(100vh-56px)] flex flex-col">
      {/* Title */}
      <div className="text-center pt-8 pb-2 px-4">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-indigo-500/30 max-w-16" />
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/20 border border-indigo-500/30">
            <Swords className="size-5 text-indigo-400" />
          </div>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-indigo-500/30 max-w-16" />
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">1v1 Battle Arena</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Bring your best deck, find an opponent, and win Battle Arena!
        </p>
      </div>

      <BattleArena
        playerName={session.playerId}
        initialStats={{ wins, losses, draws, total: wins + losses + draws }}
        lineupReady={lineupReady}
      />
    </div>
  )
}
