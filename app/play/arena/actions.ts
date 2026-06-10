'use server'

import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/service'
import { simulateBattle, type BattleUnit } from '@/lib/game/battle'
import type { Unit, PlayerUnit, Lineup, BattleResult, BattleRound, Rarity, OperatorUnitOverride } from '@/types/database'

const AI_PLAYER_ID = 'ai-bot'
const AI_NAMES = ['Shadow Bot', 'Iron Titan', 'Storm Runner', 'Frost Reaper', 'Ember Knight']

function slotIds(lineup: Lineup): string[] {
  return [lineup.slot1, lineup.slot2, lineup.slot3, lineup.slot4, lineup.slot5].filter(Boolean) as string[]
}

async function resolveLineup(
  supabase: ReturnType<typeof createServiceClient>,
  operatorId: string,
  playerId: string,
  ids: string[],
): Promise<BattleUnit[]> {
  const [{ data: unitsRaw }, { data: puRaw }] = await Promise.all([
    supabase.from('units').select('id, name, affinity, base_power, base_speed').in('id', ids),
    supabase
      .from('player_units')
      .select('unit_id, level, current_power, current_speed')
      .eq('operator_id', operatorId)
      .eq('player_id', playerId)
      .in('unit_id', ids),
  ])

  const unitMap = new Map<string, Pick<Unit, 'id' | 'name' | 'affinity' | 'base_power' | 'base_speed'>>()
  for (const u of (unitsRaw ?? []) as Pick<Unit, 'id' | 'name' | 'affinity' | 'base_power' | 'base_speed'>[]) {
    unitMap.set(u.id, u)
  }
  const puMap = new Map<string, Pick<PlayerUnit, 'unit_id' | 'level' | 'current_power' | 'current_speed'>>()
  for (const pu of (puRaw ?? []) as Pick<PlayerUnit, 'unit_id' | 'level' | 'current_power' | 'current_speed'>[]) {
    puMap.set(pu.unit_id, pu)
  }

  return ids.map((id) => {
    const unit = unitMap.get(id)!
    const pu = puMap.get(id)
    return {
      id,
      name: unit.name,
      affinity: unit.affinity,
      power: pu?.current_power ?? unit.base_power,
      speed: pu?.current_speed ?? unit.base_speed,
      level: pu?.level ?? 1,
    }
  })
}

export type UnitMeta = { image: string | null; rarity: Rarity }

export type MatchActionResult =
  | {
      ok: true
      matchId: string
      opponent: { id: string; name: string; isAI: boolean }
      result: BattleResult
      playerRoundsWon: number
      opponentRoundsWon: number
      rounds: BattleRound[]
      unitMeta: Record<string, UnitMeta>
      summary: string
    }
  | { ok: false; error: string }

export async function findMatch(): Promise<MatchActionResult> {
  const cookieStore = await cookies()
  const operatorId = cookieStore.get('gfc-operator-id')?.value
  const playerId = cookieStore.get('gfc-player-id')?.value

  if (!operatorId || !playerId) {
    return { ok: false, error: 'Not authenticated. Go to /play/setup.' }
  }

  const supabase = createServiceClient()

  // Get player lineup
  const { data: lineupRaw } = await supabase
    .from('lineups')
    .select('*')
    .eq('operator_id', operatorId)
    .eq('player_id', playerId)
    .single()

  if (!lineupRaw) {
    return { ok: false, error: 'No lineup saved. Build and save a 5-unit deck first.' }
  }

  const lineup = lineupRaw as Lineup
  const playerSlotIds = slotIds(lineup)

  if (playerSlotIds.length !== 5) {
    return {
      ok: false,
      error: `Deck incomplete (${playerSlotIds.length}/5 slots). Fill all 5 slots first.`,
    }
  }

  const playerUnits = await resolveLineup(supabase, operatorId, playerId, playerSlotIds)

  // Find a real opponent
  const { data: candidateLineups } = await supabase
    .from('lineups')
    .select('*')
    .eq('operator_id', operatorId)
    .neq('player_id', playerId)
    .limit(20)

  const validOpponents = ((candidateLineups ?? []) as Lineup[]).filter(
    (l) => slotIds(l).length === 5,
  )

  let opponentUnits: BattleUnit[]
  let opponentId: string
  let opponentName: string
  let isAI = false

  if (validOpponents.length > 0) {
    const oLineup = validOpponents[Math.floor(Math.random() * validOpponents.length)]
    opponentId = oLineup.player_id
    opponentName = oLineup.player_id
    opponentUnits = await resolveLineup(supabase, operatorId, opponentId, slotIds(oLineup))
  } else {
    const { data: allUnits } = await supabase.from('units').select('*')
    const units = (allUnits ?? []) as Unit[]
    if (units.length < 5) return { ok: false, error: 'Not enough units in catalog for AI.' }

    const shuffled = [...units].sort(() => Math.random() - 0.5)
    opponentUnits = shuffled.slice(0, 5).map((u) => ({
      id: u.id,
      name: u.name,
      affinity: u.affinity,
      power: u.base_power,
      speed: u.base_speed,
      level: 1,
    }))
    opponentId = AI_PLAYER_ID
    opponentName = AI_NAMES[Math.floor(Math.random() * AI_NAMES.length)]
    isAI = true
  }

  const outcome = simulateBattle(playerUnits, opponentUnits)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: logRaw, error: logError } = await (supabase as any)
    .from('battle_logs')
    .insert({
      operator_id: operatorId,
      tournament_id: null,
      player_id: playerId,
      opponent_name: opponentName,
      result: outcome.result,
      rounds: outcome.rounds,
    })
    .select()
    .single()

  if (logError) return { ok: false, error: 'Failed to save match result.' }

  // Fetch image + rarity for all units in the battle (for card rendering)
  const allUnitIds = [
    ...new Set(outcome.rounds.flatMap((r) => [r.player_unit.id, r.opponent_unit.id])),
  ]

  const [{ data: unitRows }, { data: overrideRows }] = await Promise.all([
    supabase.from('units').select('id, image, rarity').in('id', allUnitIds),
    supabase
      .from('operator_unit_overrides')
      .select('unit_id, image_override')
      .eq('operator_id', operatorId)
      .in('unit_id', allUnitIds),
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

  const resultLabel =
    outcome.result === 'win' ? 'Victory!' : outcome.result === 'loss' ? 'Defeat' : 'Draw'

  return {
    ok: true,
    matchId: logRaw.id,
    opponent: { id: opponentId, name: opponentName, isAI },
    result: outcome.result,
    playerRoundsWon: outcome.playerRoundsWon,
    opponentRoundsWon: outcome.opponentRoundsWon,
    rounds: outcome.rounds,
    unitMeta,
    summary: `${resultLabel} — ${outcome.playerRoundsWon}–${outcome.opponentRoundsWon} vs ${opponentName}`,
  }
}
