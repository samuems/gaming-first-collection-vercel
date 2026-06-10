import Link from 'next/link'
import { requireSession } from '../lib/session'
import { createServiceClient } from '@/lib/supabase/service'
import { buildOverrideMap } from '@/lib/game/resolveOverrides'
import type { Unit, PlayerUnit, Lineup } from '@/types/database'
import { LineupBuilder, type LineupUnit } from './LineupBuilder'
import { Shield, Swords } from 'lucide-react'
import { cn } from '@/lib/utils'

export const revalidate = 0

export default async function LineupPage() {
  const session = await requireSession()
  const supabase = createServiceClient()

  const { data: operatorRaw } = await supabase
    .from('operators').select('theme_id').eq('id', session.operatorId).single()
  const themeId = (operatorRaw as { theme_id: string | null } | null)?.theme_id ?? null

  const [
    { data: puRaw },
    { data: lineupRaw },
    { data: unitsRaw },
    overrideMap,
  ] = await Promise.all([
    supabase
      .from('player_units')
      .select('*')
      .eq('operator_id', session.operatorId)
      .eq('player_id', session.playerId),
    supabase
      .from('lineups')
      .select('*')
      .eq('operator_id', session.operatorId)
      .eq('player_id', session.playerId)
      .single(),
    supabase.from('units').select('*'),
    buildOverrideMap(supabase, session.operatorId, themeId),
  ])

  const playerUnits = (puRaw ?? []) as PlayerUnit[]
  const lineup = lineupRaw as Lineup | null
  const allUnits = (unitsRaw ?? []) as Unit[]

  const unitMap = new Map<string, Unit>()
  for (const u of allUnits) unitMap.set(u.id, u)

  const ownedUnits: LineupUnit[] = playerUnits
    .map((pu) => {
      const unit = unitMap.get(pu.unit_id)
      if (!unit) return null
      const ov = overrideMap.get(unit.id)
      return {
        unitId: unit.id,
        name: ov?.name ?? unit.name,
        image: ov?.image ?? unit.image,
        rarity: unit.rarity,
        affinity: unit.affinity,
        level: pu.level,
        power: pu.current_power,
        speed: pu.current_speed,
      } satisfies LineupUnit
    })
    .filter(Boolean) as LineupUnit[]

  // Sort: by power descending
  ownedUnits.sort((a, b) => b.power - a.power)

  const initialSlots: (string | null)[] = lineup
    ? [lineup.slot1, lineup.slot2, lineup.slot3, lineup.slot4, lineup.slot5]
    : [null, null, null, null, null]

  return (
    <div className="flex flex-col min-h-[calc(100vh-56px)]">
      <div className="flex-1 px-4 py-6 max-w-4xl mx-auto w-full">
        {/* Header with tab navigation */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <Shield className="size-5 text-indigo-400" />
              Build Your Deck
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Pick 5 cards for your battle lineup
              {lineup?.locked && (
                <span className="ml-2 text-amber-400 font-semibold">⚠ Deck is locked (in tournament)</span>
              )}
            </p>
          </div>

          <div className="flex items-center bg-zinc-900 rounded-lg p-0.5 gap-0.5">
            <Link
              href="/play/collection"
              className="px-3 py-1.5 rounded-md text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Collection
            </Link>
            <Link
              href="/play/lineup"
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-semibold transition-colors',
                'bg-zinc-700 text-white',
              )}
            >
              Build Deck
            </Link>
          </div>
        </div>

        {ownedUnits.length === 0 ? (
          <div className="text-center py-16 text-zinc-500">
            <Shield className="size-12 mx-auto mb-3 opacity-30" />
            <p className="font-semibold text-zinc-400">No cards yet</p>
            <p className="text-sm mt-1">Open some chests to get cards first.</p>
          </div>
        ) : (
          <LineupBuilder ownedUnits={ownedUnits} initialSlots={initialSlots} />
        )}
      </div>

      {/* Bottom CTA */}
      <div className="sticky bottom-0 border-t border-zinc-800/60 bg-zinc-950/90 backdrop-blur-sm px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <p className="text-xs text-zinc-500">
            Save your deck, then enter the Arena to battle
          </p>
          <Link
            href="/play/arena"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
          >
            <Swords className="size-3.5" />
            Go to Arena
          </Link>
        </div>
      </div>
    </div>
  )
}
