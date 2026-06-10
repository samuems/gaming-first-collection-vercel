'use server'

import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/service'
import { COPIES_FOR_LEVEL, MAX_LEVEL, powerAtLevel, speedAtLevel } from '@/lib/game/progression'
import type { Unit, PlayerUnit, OperatorUnitOverride, Rarity, Affinity } from '@/types/database'

const DROP_ODDS: Record<Rarity, number> = {
  Common: 74, Rare: 23, Epic: 2, Legendary: 1,
}

const BOOSTED_ODDS: Record<Rarity, Record<Rarity, number>> = {
  Rare:      { Common: 0,  Rare: 75, Epic: 20, Legendary: 5 },
  Epic:      { Common: 0,  Rare: 0,  Epic: 75, Legendary: 25 },
  Legendary: { Common: 0,  Rare: 0,  Epic: 0,  Legendary: 100 },
  Common:    { Common: 74, Rare: 23, Epic: 2,  Legendary: 1 },
}

function drawRarity(minRarity?: Rarity): Rarity {
  const table = minRarity ? BOOSTED_ODDS[minRarity] : DROP_ODDS
  const roll = Math.random() * 100
  let cumulative = 0
  for (const rarity of ['Legendary', 'Epic', 'Rare', 'Common'] as Rarity[]) {
    cumulative += table[rarity]
    if (roll < cumulative) return rarity
  }
  return 'Common'
}

export type OpenedCard = {
  unitId: string
  name: string
  image: string | null
  rarity: Rarity
  affinity: Affinity
  isNew: boolean
  level: number
  copiesOwned: number
  power: number
  speed: number
  leveledUp: boolean
  levelsGained: number
}

export type OpenChestsResult =
  | { ok: true; cards: OpenedCard[] }
  | { ok: false; error: string }

export async function openChests(count: 1 | 3 | 5, packType: 'standard' | 'rare' | 'epic' | 'legendary' = 'standard'): Promise<OpenChestsResult> {
  const cookieStore = await cookies()
  const operatorId = cookieStore.get('gfc-operator-id')?.value
  const operatorKey = cookieStore.get('gfc-operator-key')?.value
  const playerId = cookieStore.get('gfc-player-id')?.value

  if (!operatorId || !playerId || !operatorKey) {
    return { ok: false, error: 'Not authenticated.' }
  }

  const supabase = createServiceClient()

  // Verify operator
  const { data: opRaw } = await supabase.from('operators').select('id, status').eq('api_key', operatorKey).single()
  if (!opRaw || (opRaw as { status: string }).status !== 'active') {
    return { ok: false, error: 'Invalid operator credentials.' }
  }

  const { data: allUnitsRaw } = await supabase.from('units').select('*')
  const allUnits = (allUnitsRaw ?? []) as Unit[]
  if (allUnits.length === 0) return { ok: false, error: 'No units in catalog.' }

  const unitsByRarity = new Map<Rarity, Unit[]>()
  for (const u of allUnits) {
    if (!unitsByRarity.has(u.rarity)) unitsByRarity.set(u.rarity, [])
    unitsByRarity.get(u.rarity)!.push(u)
  }

  const minRarity: Rarity | undefined = packType === 'rare'
    ? 'Rare'
    : packType === 'epic'
    ? 'Epic'
    : packType === 'legendary'
    ? 'Legendary'
    : undefined

  const cards: OpenedCard[] = []

  for (let i = 0; i < count; i++) {
    // First card gets guaranteed min rarity, rest are standard
    const thisMinRarity = i === 0 ? minRarity : undefined
    const rarity = drawRarity(thisMinRarity)

    const pool = unitsByRarity.get(rarity) ?? unitsByRarity.get('Common') ?? allUnits
    const unit = pool[Math.floor(Math.random() * pool.length)]

    const [{ data: overrideRaw }, { data: existingRaw }] = await Promise.all([
      supabase.from('operator_unit_overrides').select('*').eq('operator_id', operatorId).eq('unit_id', unit.id).single(),
      supabase.from('player_units').select('*').eq('operator_id', operatorId).eq('player_id', playerId).eq('unit_id', unit.id).single(),
    ])

    const override = overrideRaw as OperatorUnitOverride | null
    const existing = existingRaw as PlayerUnit | null

    if (!existing) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: insertedRaw } = await (supabase as any)
        .from('player_units')
        .insert({
          operator_id: operatorId, player_id: playerId, unit_id: unit.id,
          copies_owned: 1, level: 1,
          current_power: unit.base_power, current_speed: unit.base_speed,
        })
        .select().single()
      const inserted = (insertedRaw ?? {}) as PlayerUnit
      cards.push({
        unitId: unit.id,
        name: override?.name_override ?? unit.name,
        image: override?.image_override ?? unit.image,
        rarity: unit.rarity, affinity: unit.affinity,
        isNew: true, level: 1, copiesOwned: 1,
        power: unit.base_power, speed: unit.base_speed,
        leveledUp: false, levelsGained: 0,
      })
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: updatedRaw } = await (supabase as any)
        .from('player_units')
        .update({ copies_owned: existing.copies_owned + 1 })
        .eq('id', existing.id)
        .select().single()
      const afterCopies = (updatedRaw ?? { ...existing, copies_owned: existing.copies_owned + 1 }) as PlayerUnit

      // Auto level-up
      const previousLevel = afterCopies.level
      let level = afterCopies.level
      let copies = afterCopies.copies_owned
      while (level < MAX_LEVEL) {
        const needed = COPIES_FOR_LEVEL[level]
        if (needed === null || copies < needed) break
        level++
      }
      if (level > previousLevel) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from('player_units').update({
          level, current_power: powerAtLevel(unit.base_power, level),
          current_speed: speedAtLevel(unit.base_speed, level),
        }).eq('id', afterCopies.id)
      }
      cards.push({
        unitId: unit.id,
        name: override?.name_override ?? unit.name,
        image: override?.image_override ?? unit.image,
        rarity: unit.rarity, affinity: unit.affinity,
        isNew: false, level, copiesOwned: afterCopies.copies_owned,
        power: powerAtLevel(unit.base_power, level),
        speed: speedAtLevel(unit.base_speed, level),
        leveledUp: level > previousLevel,
        levelsGained: level - previousLevel,
      })
    }
  }

  return { ok: true, cards }
}
