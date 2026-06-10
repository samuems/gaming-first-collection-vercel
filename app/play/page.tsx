import { redirect } from 'next/navigation'
import { getSession } from './lib/session'
import { createServiceClient } from '@/lib/supabase/service'
import { buildOverrideMap, buildAffinityLabelMap } from '@/lib/game/resolveOverrides'
import type { Unit, PlayerUnit, Lineup, BattleLog, Rarity, Affinity, Operator } from '@/types/database'
import { LobbyClient } from './_components/LobbyClient'

export const revalidate = 0

export default async function LobbyPage() {
  const session = await getSession()
  if (!session) redirect('/play/setup')

  const supabase = createServiceClient()

  const [
    { data: puRaw },
    { data: lineupRaw },
    { data: logsRaw },
    { data: unitsRaw },
    { data: operatorRaw },
  ] = await Promise.all([
    supabase.from('player_units').select('*').eq('operator_id', session.operatorId).eq('player_id', session.playerId),
    supabase.from('lineups').select('*').eq('operator_id', session.operatorId).eq('player_id', session.playerId).single(),
    supabase.from('battle_logs').select('result').eq('operator_id', session.operatorId).eq('player_id', session.playerId).is('tournament_id', null),
    supabase.from('units').select('*').order('name'),
    supabase.from('operators').select('theme_id').eq('id', session.operatorId).single(),
  ])

  const playerUnits = (puRaw ?? []) as PlayerUnit[]
  const lineup = lineupRaw as Lineup | null
  const logs = (logsRaw ?? []) as Pick<BattleLog, 'result'>[]
  const allUnits = (unitsRaw ?? []) as Unit[]
  const themeId = (operatorRaw as { theme_id: string | null } | null)?.theme_id ?? null

  const [overrideMap, affinityLabels] = await Promise.all([
    buildOverrideMap(supabase, session.operatorId, themeId),
    buildAffinityLabelMap(supabase, themeId),
  ])

  const unitMap = new Map<string, Unit>()
  for (const u of allUnits) unitMap.set(u.id, u)

  const puMap = new Map<string, PlayerUnit>()
  for (const pu of playerUnits) puMap.set(pu.unit_id, pu)

  const wins = logs.filter((l) => l.result === 'win').length
  const losses = logs.filter((l) => l.result === 'loss').length

  const deckSlots = lineup
    ? [lineup.slot1, lineup.slot2, lineup.slot3, lineup.slot4, lineup.slot5]
    : [null, null, null, null, null]
  const filledDeck = deckSlots.filter(Boolean).length
  const lineupReady = filledDeck === 5

  // Owned cards sorted by power (for My Cards section)
  const ownedCards = playerUnits
    .map((pu) => {
      const unit = unitMap.get(pu.unit_id)
      if (!unit) return null
      const ov = overrideMap.get(unit.id)
      return {
        unitId: unit.id,
        name: ov?.name ?? unit.name,
        image: ov?.image ?? unit.image,
        rarity: unit.rarity as Rarity,
        affinity: unit.affinity as Affinity,
        power: pu.current_power,
        speed: pu.current_speed,
        level: pu.level,
      }
    })
    .filter(Boolean) as {
      unitId: string; name: string; image: string | null
      rarity: Rarity; affinity: Affinity; power: number; speed: number; level: number
    }[]
  ownedCards.sort((a, b) => b.power - a.power)

  return (
    <LobbyClient
      playerName={session.playerId}
      wins={wins}
      losses={losses}
      lineupReady={lineupReady}
      ownedCards={ownedCards}
      ownedCount={playerUnits.length}
      totalCount={allUnits.length}
      affinityLabels={Object.fromEntries(affinityLabels) as Partial<Record<Affinity, string>>}
    />
  )
}
