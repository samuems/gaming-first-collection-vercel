import Link from 'next/link'
import { requireSession } from '../lib/session'
import { createServiceClient } from '@/lib/supabase/service'
import { buildOverrideMap, buildAffinityLabelMap } from '@/lib/game/resolveOverrides'
import type { Unit, PlayerUnit, Rarity, Affinity } from '@/types/database'
import { COPIES_FOR_LEVEL } from '@/lib/game/progression'
import { CollectionGrid, type CollectionUnit } from './CollectionGrid'
import { Badge } from '@/components/ui/badge'
import { Swords, Layers, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

export const revalidate = 0

type SortKey = 'power' | 'speed' | 'name' | 'rarity'

const RARITY_ORDER: Record<Rarity, number> = { Legendary: 0, Epic: 1, Rare: 2, Common: 3 }

export default async function CollectionPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; filter?: string }>
}) {
  const session = await requireSession()
  const { sort = 'rarity', filter = 'all' } = await searchParams

  const supabase = createServiceClient()

  const { data: operatorRaw } = await supabase
    .from('operators').select('theme_id').eq('id', session.operatorId).single()
  const themeId = (operatorRaw as { theme_id: string | null } | null)?.theme_id ?? null

  const [
    { data: unitsRaw },
    { data: puRaw },
    overrideMap,
    affinityLabelMap,
  ] = await Promise.all([
    supabase.from('units').select('*').order('name'),
    supabase
      .from('player_units')
      .select('*')
      .eq('operator_id', session.operatorId)
      .eq('player_id', session.playerId),
    buildOverrideMap(supabase, session.operatorId, themeId),
    buildAffinityLabelMap(supabase, themeId),
  ])

  const affinityLabels = Object.fromEntries(affinityLabelMap) as Partial<Record<Affinity, string>>

  const units = (unitsRaw ?? []) as Unit[]
  const playerUnits = (puRaw ?? []) as PlayerUnit[]

  const puMap = new Map<string, PlayerUnit>()
  for (const pu of playerUnits) puMap.set(pu.unit_id, pu)

  let collectionUnits: CollectionUnit[] = units.map((unit) => {
    const pu = puMap.get(unit.id)
    const ov = overrideMap.get(unit.id)
    const level = pu?.level ?? 1
    return {
      unitId: unit.id,
      name: ov?.name ?? unit.name,
      image: ov?.image ?? unit.image,
      rarity: unit.rarity,
      affinity: unit.affinity,
      season: unit.season,
      owned: !!pu,
      level,
      copiesOwned: pu?.copies_owned ?? 0,
      copiesForNextLevel: COPIES_FOR_LEVEL[level] ?? null,
      power: pu?.current_power ?? unit.base_power,
      speed: pu?.current_speed ?? unit.base_speed,
    }
  })

  // Filter
  if (filter === 'owned') collectionUnits = collectionUnits.filter((u) => u.owned)
  else if (filter === 'legendary') collectionUnits = collectionUnits.filter((u) => u.rarity === 'Legendary')
  else if (filter === 'epic') collectionUnits = collectionUnits.filter((u) => u.rarity === 'Epic')

  // Sort
  const sortKey = sort as SortKey
  collectionUnits.sort((a, b) => {
    if (sortKey === 'power') return b.power - a.power
    if (sortKey === 'speed') return b.speed - a.speed
    if (sortKey === 'name') return a.name.localeCompare(b.name)
    // default: rarity (owned first, then by rarity tier)
    if (a.owned !== b.owned) return a.owned ? -1 : 1
    return RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity]
  })

  const ownedCount = playerUnits.length
  const totalCount = units.length

  const sortLinks: { key: SortKey; label: string }[] = [
    { key: 'rarity', label: 'By Rarity' },
    { key: 'power', label: 'By Power' },
    { key: 'speed', label: 'By Speed' },
    { key: 'name', label: 'By Name' },
  ]

  const filterLinks: { key: string; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'owned', label: 'Owned' },
    { key: 'legendary', label: 'Legendary' },
    { key: 'epic', label: 'Epic' },
  ]

  return (
    <div className="flex flex-col min-h-[calc(100vh-56px)]">
      <div className="flex-1 px-4 py-6 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <Layers className="size-5 text-indigo-400" />
              My Cards
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              {session.playerId} · {session.operatorName}
            </p>
          </div>

          {/* Tabs: Collection / Build Deck */}
          <div className="flex items-center bg-zinc-900 rounded-lg p-0.5 gap-0.5">
            <Link
              href="/play/collection"
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-semibold transition-colors',
                'bg-zinc-700 text-white',
              )}
            >
              Collection
            </Link>
            <Link
              href="/play/lineup"
              className="px-3 py-1.5 rounded-md text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Build Deck
            </Link>
          </div>
        </div>

        {/* Filters + Sort */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          {filterLinks.map(({ key, label }) => (
            <Link
              key={key}
              href={`?filter=${key}&sort=${sort}`}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
                filter === key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200',
              )}
            >
              {label}
            </Link>
          ))}

          <div className="ml-auto flex items-center gap-1.5">
            <span className="text-xs text-zinc-600">Sort:</span>
            {sortLinks.map(({ key, label }) => (
              <Link
                key={key}
                href={`?filter=${filter}&sort=${key}`}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
                  sort === key
                    ? 'bg-zinc-700 text-white'
                    : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300',
                )}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 mb-6">
          <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-400 bg-zinc-900">
            {ownedCount} owned
          </Badge>
          <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-400 bg-zinc-900">
            {totalCount} total
          </Badge>
          <Badge variant="outline" className="text-xs border-amber-700/50 text-amber-400 bg-amber-950/30">
            <Sparkles className="size-3 mr-1" />
            {Math.round((ownedCount / Math.max(totalCount, 1)) * 100)}% complete
          </Badge>
        </div>

        {/* Collection grid */}
        <CollectionGrid
          units={collectionUnits}
          ownedCount={ownedCount}
          totalCount={totalCount}
          affinityLabels={affinityLabels}
        />
      </div>

      {/* Bottom CTA banner */}
      <div className="sticky bottom-0 border-t border-zinc-800/60 bg-zinc-950/90 backdrop-blur-sm px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
              <Swords className="size-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">1v1 Battle Arena</p>
              <p className="text-[10px] text-zinc-500">Build your deck and fight</p>
            </div>
          </div>
          <Link
            href="/play/arena"
            className={cn(
              buttonVariants({ size: 'sm' }),
              'bg-indigo-600 hover:bg-indigo-500 text-white text-xs',
            )}
          >
            Enter Arena
          </Link>
        </div>
      </div>
    </div>
  )
}
