import { notFound, redirect } from 'next/navigation'
import { getSession } from '@/app/play/lib/session'
import { createServiceClient } from '@/lib/supabase/service'
import { buildOverrideMap, buildAffinityLabelMap } from '@/lib/game/resolveOverrides'
import type { BattleLog, Rarity, Affinity } from '@/types/database'
import type { UnitMeta } from '@/app/play/arena/actions'
import { WatchClient } from './WatchClient'

export const revalidate = 0

export default async function WatchPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await getSession()
  if (!session) redirect('/play/setup')

  const supabase = createServiceClient()

  const { data: logRaw } = await supabase
    .from('battle_logs')
    .select('*')
    .eq('id', id)
    .single()

  if (!logRaw) notFound()

  const log = logRaw as BattleLog

  // Collect all unit IDs in rounds
  const allUnitIds = [
    ...new Set(log.rounds.flatMap((r) => [r.player_unit.id, r.opponent_unit.id])),
  ]

  const { data: operatorRaw } = await supabase
    .from('operators').select('theme_id').eq('id', session.operatorId).single()
  const themeId = (operatorRaw as { theme_id: string | null } | null)?.theme_id ?? null

  const [{ data: unitRows }, overrideMap, affinityLabelMap] = await Promise.all([
    allUnitIds.length > 0
      ? supabase.from('units').select('id, image, rarity').in('id', allUnitIds)
      : Promise.resolve({ data: [] }),
    buildOverrideMap(supabase, session.operatorId, themeId),
    buildAffinityLabelMap(supabase, themeId),
  ])

  const unitMeta: Record<string, UnitMeta> = {}
  for (const u of (unitRows ?? []) as { id: string; image: string | null; rarity: Rarity }[]) {
    const ov = overrideMap.get(u.id)
    unitMeta[u.id] = {
      image: ov?.image ?? u.image,
      rarity: u.rarity,
      name: ov?.name ?? null,
    }
  }

  const playerRoundsWon = log.rounds.filter((r) => r.winner === 'player').length
  const opponentRoundsWon = log.rounds.filter((r) => r.winner === 'opponent').length

  return (
    <WatchClient
      playerName={session.playerId}
      opponentName={log.opponent_name}
      result={log.result}
      rounds={log.rounds}
      unitMeta={unitMeta}
      affinityLabels={Object.fromEntries(affinityLabelMap) as Partial<Record<Affinity, string>>}
      playerRoundsWon={playerRoundsWon}
      opponentRoundsWon={opponentRoundsWon}
    />
  )
}
