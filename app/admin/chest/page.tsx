import { createServiceClient } from '@/lib/supabase/service'
import type { Rarity } from '@/types/database'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Gift, Layers, BarChart2, Info } from 'lucide-react'
import { COPIES_FOR_LEVEL, MAX_LEVEL } from '@/lib/game/progression'

export const revalidate = 0

// ── Drop rate config ──────────────────────────────────────────────────────────

const DROP_RATES: {
  rarity: Rarity
  pct: number
  barClass: string
  badgeClass: string
  description: string
}[] = [
  {
    rarity: 'Common',
    pct: 74,
    barClass: 'bg-zinc-500',
    badgeClass: 'bg-zinc-500/10 text-zinc-300 border-zinc-500/20',
    description: 'Starter unit, always collectable',
  },
  {
    rarity: 'Rare',
    pct: 23,
    barClass: 'bg-blue-500',
    badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    description: 'Solid unit with better base stats',
  },
  {
    rarity: 'Epic',
    pct: 2,
    barClass: 'bg-purple-500',
    badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    description: 'High-impact unit, rare pull',
  },
  {
    rarity: 'Legendary',
    pct: 1,
    barClass: 'bg-amber-400',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    description: 'Top-tier unit, max stats',
  },
]

export default async function ChestPage() {
  const supabase = createServiceClient()

  // ── Fetch pool sizes from units table ───────────────────────────────────────
  const { data: unitsData } = await supabase.from('units').select('rarity')
  const unitRows = (unitsData ?? []) as { rarity: Rarity }[]

  const poolSizes: Record<Rarity, number> = {
    Common: 0,
    Rare: 0,
    Epic: 0,
    Legendary: 0,
  }
  for (const u of unitRows) {
    poolSizes[u.rarity] = (poolSizes[u.rarity] ?? 0) + 1
  }

  // ── Fetch player_units stats ─────────────────────────────────────────────────
  const { count: totalPlayerUnits } = await supabase
    .from('player_units')
    .select('*', { count: 'exact', head: true })

  const { data: levelData } = await supabase
    .from('player_units')
    .select('level')

  const levelRows = (levelData ?? []) as { level: number }[]

  const levelCounts: Record<number, number> = {}
  for (let lv = 1; lv <= MAX_LEVEL; lv++) {
    levelCounts[lv] = 0
  }
  for (const row of levelRows) {
    if (row.level >= 1 && row.level <= MAX_LEVEL) {
      levelCounts[row.level] = (levelCounts[row.level] ?? 0) + 1
    }
  }

  const totalLevelRows = levelRows.length
  const maxLevelCount = Math.max(...Object.values(levelCounts), 1)

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Chest Rewards</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Drop-rate tables per rarity. Duplicates power the level-up progression
          system. Stats below are live from the database.
        </p>
      </div>

      {/* Drop Rate Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Gift className="size-4 text-muted-foreground" />
            <CardTitle className="text-sm">Drop Rates</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Sums to 100%. Each rarity shows its drop chance and pool size.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {/* Stacked bar */}
          <div className="flex h-5 w-full overflow-hidden rounded-lg gap-px">
            {DROP_RATES.map(({ rarity, pct, barClass }) => (
              <div
                key={rarity}
                className={`${barClass} h-full transition-all`}
                style={{ width: `${pct}%` }}
                title={`${rarity}: ${pct}%`}
              />
            ))}
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rarity</TableHead>
                <TableHead>Odds</TableHead>
                <TableHead>Visual</TableHead>
                <TableHead className="text-right">Pool Size</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DROP_RATES.map(({ rarity, pct, badgeClass, description }) => (
                <TableRow key={rarity}>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <Badge
                        variant="outline"
                        className={`text-xs w-fit ${badgeClass}`}
                      >
                        {rarity}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {description}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono font-semibold text-sm">
                    {pct}%
                  </TableCell>
                  <TableCell className="w-40">
                    <Progress value={pct} className="h-2" />
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    {poolSizes[rarity]} unit{poolSizes[rarity] !== 1 ? 's' : ''}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Collection Stats */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-muted-foreground" />
            <CardTitle className="text-sm">Collection Stats</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Total player_units rows — a proxy for all items collected across all
            operators.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <p className="text-4xl font-black tabular-nums">
              {(totalPlayerUnits ?? 0).toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground mb-1">
              total items collected
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Level Distribution */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <BarChart2 className="size-4 text-muted-foreground" />
            <CardTitle className="text-sm">Level Distribution</CardTitle>
          </div>
          <CardDescription className="text-xs">
            How many player-owned units are at each level.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {Array.from({ length: MAX_LEVEL }, (_, i) => i + 1).map((lv) => {
            const count = levelCounts[lv] ?? 0
            const pct =
              totalLevelRows > 0
                ? Math.round((count / totalLevelRows) * 100)
                : 0

            return (
              <div key={lv} className="flex items-center gap-3">
                <span className="text-xs font-semibold w-8 shrink-0 text-muted-foreground">
                  Lv {lv}
                </span>
                <Progress
                  value={maxLevelCount > 0 ? (count / maxLevelCount) * 100 : 0}
                  className="h-2 flex-1"
                />
                <span className="text-xs tabular-nums text-muted-foreground w-20 text-right shrink-0">
                  {count.toLocaleString()} ({pct}%)
                </span>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* How copies work */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Info className="size-4 text-muted-foreground" />
            <CardTitle className="text-sm">How copies work</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Collecting duplicate units powers the level-up system. Copies owned
            are cumulative.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            {Array.from({ length: MAX_LEVEL - 1 }, (_, i) => {
              const fromLevel = i + 1
              const copies = COPIES_FOR_LEVEL[fromLevel]
              if (copies === null) return null
              return (
                <div
                  key={fromLevel}
                  className="flex items-center gap-3 text-sm"
                >
                  <Badge variant="outline" className="text-xs tabular-nums w-16 justify-center">
                    Lv {fromLevel} → {fromLevel + 1}
                  </Badge>
                  <span className="text-muted-foreground text-xs">
                    Requires{' '}
                    <span className="font-semibold text-foreground">
                      {copies} cop{copies === 1 ? 'y' : 'ies'}
                    </span>{' '}
                    owned
                  </span>
                </div>
              )
            })}
            <p className="text-xs text-muted-foreground mt-2">
              Max level is{' '}
              <span className="font-semibold text-foreground">
                Lv {MAX_LEVEL}
              </span>
              . No further upgrades beyond that.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
