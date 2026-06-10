import { notFound, redirect } from 'next/navigation'
import { getSession } from '@/app/play/lib/session'
import { createServiceClient } from '@/lib/supabase/service'
import type { BattleLog, OperatorUnitOverride, Rarity } from '@/types/database'
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

  const [{ data: unitRows }, { data: overrideRows }] = await Promise.all([
    allUnitIds.length > 0
      ? supabase.from('units').select('id, image, rarity').in('id', allUnitIds)
      : Promise.resolve({ data: [] }),
    allUnitIds.length > 0
      ? supabase.from('operator_unit_overrides').select('unit_id, image_override').eq('operator_id', session.operatorId).in('unit_id', allUnitIds)
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

  const playerRoundsWon = log.rounds.filter((r) => r.winner === 'player').length
  const opponentRoundsWon = log.rounds.filter((r) => r.winner === 'opponent').length

  return (
    <WatchClient
      playerName={session.playerId}
      opponentName={log.opponent_name}
      result={log.result}
      rounds={log.rounds}
      unitMeta={unitMeta}
      playerRoundsWon={playerRoundsWon}
      opponentRoundsWon={opponentRoundsWon}
    />
  )
}
