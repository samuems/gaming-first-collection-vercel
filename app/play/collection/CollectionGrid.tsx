'use client'

import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Wind, Mountain, Zap, Waves, Flame, Snowflake, Leaf, Sun, Moon,
  Sword, Timer, Star, Lock,
} from 'lucide-react'
import type { Affinity, Rarity } from '@/types/database'
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CollectionUnit {
  unitId: string
  name: string
  image: string | null
  rarity: Rarity
  affinity: Affinity
  season: number
  owned: boolean
  level: number
  copiesOwned: number
  copiesForNextLevel: number | null
  power: number
  speed: number
}

// ── Rarity config ─────────────────────────────────────────────────────────────

const RARITY_CFG: Record<Rarity, {
  outerBorder: string; cardBg: string; nameColor: string
  glowClass: string; ribbonBg: string; ribbonText: string; statsBg: string
}> = {
  Common: {
    outerBorder: 'ring-1 ring-zinc-500/60',
    cardBg: 'bg-gradient-to-b from-zinc-800 via-zinc-850 to-zinc-900',
    nameColor: 'text-zinc-100',
    glowClass: '',
    ribbonBg: 'bg-zinc-600',
    ribbonText: 'text-zinc-200',
    statsBg: 'bg-zinc-800/60',
  },
  Rare: {
    outerBorder: 'ring-2 ring-blue-400/70',
    cardBg: 'bg-gradient-to-b from-blue-950 via-zinc-900 to-zinc-900',
    nameColor: 'text-blue-200',
    glowClass: 'shadow-blue-500/20 shadow-lg',
    ribbonBg: 'bg-blue-600',
    ribbonText: 'text-blue-100',
    statsBg: 'bg-blue-950/50',
  },
  Epic: {
    outerBorder: 'ring-2 ring-purple-400/80',
    cardBg: 'bg-gradient-to-b from-purple-950 via-zinc-900 to-zinc-900',
    nameColor: 'text-purple-200',
    glowClass: 'shadow-purple-500/25 shadow-xl',
    ribbonBg: 'bg-gradient-to-r from-purple-700 to-purple-500',
    ribbonText: 'text-purple-100',
    statsBg: 'bg-purple-950/50',
  },
  Legendary: {
    outerBorder: 'ring-2 ring-amber-400',
    cardBg: 'bg-gradient-to-b from-amber-950 via-zinc-900 to-zinc-900',
    nameColor: 'text-amber-300',
    glowClass: 'shadow-amber-400/30 shadow-xl',
    ribbonBg: 'bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-500',
    ribbonText: 'text-amber-900',
    statsBg: 'bg-amber-950/40',
  },
}

const AFFINITY_CFG: Record<Affinity, { icon: React.ElementType; color: string; bg: string }> = {
  Air:       { icon: Wind,      color: 'text-sky-200',    bg: 'bg-sky-500/25 border border-sky-500/30' },
  Earth:     { icon: Mountain,  color: 'text-lime-200',   bg: 'bg-lime-600/25 border border-lime-500/30' },
  Lightning: { icon: Zap,       color: 'text-yellow-200', bg: 'bg-yellow-500/25 border border-yellow-400/30' },
  Water:     { icon: Waves,     color: 'text-blue-200',   bg: 'bg-blue-500/25 border border-blue-400/30' },
  Fire:      { icon: Flame,     color: 'text-red-200',    bg: 'bg-red-600/25 border border-red-500/30' },
  Ice:       { icon: Snowflake, color: 'text-cyan-200',   bg: 'bg-cyan-500/25 border border-cyan-400/30' },
  Nature:    { icon: Leaf,      color: 'text-green-200',  bg: 'bg-green-600/25 border border-green-500/30' },
  Light:     { icon: Sun,       color: 'text-orange-100', bg: 'bg-orange-400/25 border border-orange-300/30' },
  Shadow:    { icon: Moon,      color: 'text-violet-200', bg: 'bg-violet-600/25 border border-violet-500/30' },
}

const RARITY_LABEL: Record<Rarity, string> = {
  Common: 'COMMON',
  Rare: '✦ RARE ✦',
  Epic: '✦ EPIC ✦',
  Legendary: '✦ LEGENDARY ✦',
}

// ── Card component ────────────────────────────────────────────────────────────

function UnitCardThumb({
  unit,
  onClick,
}: {
  unit: CollectionUnit
  onClick: () => void
}) {
  const r = RARITY_CFG[unit.rarity]
  const a = AFFINITY_CFG[unit.affinity]
  const AffinityIcon = a.icon

  return (
    <article
      onClick={onClick}
      className={cn(
        'flex flex-col rounded-xl overflow-hidden cursor-pointer select-none',
        r.cardBg, r.outerBorder, r.glowClass,
        'transition-all duration-200 hover:-translate-y-1.5 hover:scale-[1.02]',
        !unit.owned && 'opacity-40 grayscale',
      )}
    >
      {/* Affinity pill */}
      <div className="flex items-center justify-between px-2 pt-1.5 pb-1">
        <span className={cn('inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold', a.bg)}>
          <AffinityIcon className={cn('size-2.5', a.color)} />
          <span className={a.color}>{unit.affinity}</span>
        </span>
        {unit.owned && unit.level > 1 && (
          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-400">
            <Star className="size-2.5 fill-amber-400" />
            {unit.level}
          </span>
        )}
      </div>

      {/* Artwork */}
      <div className={cn('relative mx-2 rounded-lg overflow-hidden ring-1', r.outerBorder, 'aspect-[3/4] bg-zinc-900')}>
        {unit.image ? (
          <img
            src={unit.image}
            alt={unit.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Sword className="size-8 text-zinc-600" />
          </div>
        )}
        {!unit.owned && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <Lock className="size-5 text-zinc-400" />
          </div>
        )}
        {/* Rarity ribbon */}
        <div className={cn('absolute bottom-0 inset-x-0 py-0.5 text-center text-[8px] font-black tracking-widest', r.ribbonBg, r.ribbonText)}>
          {RARITY_LABEL[unit.rarity]}
        </div>
      </div>

      {/* Name */}
      <p className={cn('text-center text-[11px] font-bold px-1 pt-1 pb-0.5 truncate', r.nameColor)}>
        {unit.name}
      </p>

      {/* Stats */}
      <div className={cn('flex items-center justify-center gap-2 mx-2 mb-1.5 rounded-md px-2 py-1 text-[10px] font-bold', r.statsBg)}>
        <span className="flex items-center gap-0.5 text-red-400">
          <Sword className="size-2.5" />{unit.power}
        </span>
        <span className="text-zinc-600">·</span>
        <span className="flex items-center gap-0.5 text-emerald-400">
          <Timer className="size-2.5" />{unit.speed}
        </span>
      </div>
    </article>
  )
}

// ── Card Detail Sheet ─────────────────────────────────────────────────────────

function CardDetailSheet({
  unit,
  open,
  onClose,
}: {
  unit: CollectionUnit | null
  open: boolean
  onClose: () => void
}) {
  if (!unit) return null

  const r = RARITY_CFG[unit.rarity]
  const a = AFFINITY_CFG[unit.affinity]
  const AffinityIcon = a.icon

  const copiesNeeded = unit.copiesForNextLevel
  const copyPct = copiesNeeded ? Math.round((unit.copiesOwned / copiesNeeded) * 100) : 100

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-80 bg-zinc-950 border-zinc-800 p-0 overflow-y-auto">
        <div className={cn('flex flex-col gap-0', r.cardBg, 'min-h-full')}>
          {/* Header */}
          <SheetHeader className="px-5 pt-5 pb-3">
            <SheetTitle className={cn('text-lg font-black', r.nameColor)}>{unit.name}</SheetTitle>
          </SheetHeader>

          {/* Artwork */}
          <div className="px-5">
            <div className={cn('relative rounded-xl overflow-hidden aspect-[3/4]', r.outerBorder, 'bg-zinc-900')}>
              {unit.image ? (
                <img src={unit.image} alt={unit.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Sword className="size-16 text-zinc-600" />
                </div>
              )}
              <div className={cn('absolute bottom-0 inset-x-0 py-1 text-center text-xs font-black tracking-widest', r.ribbonBg, r.ribbonText)}>
                {RARITY_LABEL[unit.rarity]}
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="px-5 pt-4 flex flex-col gap-3">
            {/* Affinity + Season */}
            <div className="flex items-center gap-2">
              <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold', a.bg)}>
                <AffinityIcon className={cn('size-3', a.color)} />
                <span className={a.color}>{unit.affinity}</span>
              </span>
              <Badge variant="outline" className="text-xs text-zinc-400 border-zinc-700">
                Season {unit.season}
              </Badge>
            </div>

            {/* Stats */}
            <div className={cn('flex items-center justify-around rounded-xl px-4 py-3', r.statsBg)}>
              <div className="flex flex-col items-center gap-1">
                <Sword className="size-4 text-red-400" />
                <span className="text-xl font-black text-red-300">{unit.power}</span>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wide">Power</span>
              </div>
              <div className="w-px h-10 bg-zinc-700" />
              <div className="flex flex-col items-center gap-1">
                <Timer className="size-4 text-emerald-400" />
                <span className="text-xl font-black text-emerald-300">{unit.speed}</span>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wide">Speed</span>
              </div>
              <div className="w-px h-10 bg-zinc-700" />
              <div className="flex flex-col items-center gap-1">
                <Star className="size-4 text-amber-400 fill-amber-400" />
                <span className="text-xl font-black text-amber-300">{unit.level}</span>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wide">Level</span>
              </div>
            </div>

            {/* Copies + next level */}
            {unit.owned && (
              <div className="flex flex-col gap-2 bg-zinc-900/60 rounded-xl px-4 py-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 font-medium">Card Count</span>
                  <span className="font-bold text-white">{unit.copiesOwned}</span>
                </div>

                {copiesNeeded !== null ? (
                  <>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400 font-medium">Next Card Level</span>
                      <span className="text-zinc-300">{unit.copiesOwned} / {copiesNeeded}</span>
                    </div>
                    <Progress value={copyPct} className="h-1.5" />
                  </>
                ) : (
                  <p className="text-xs text-amber-400 font-semibold">Max Level Reached</p>
                )}
              </div>
            )}

            {!unit.owned && (
              <div className="bg-zinc-900/60 rounded-xl px-4 py-3 text-center">
                <Lock className="size-5 text-zinc-500 mx-auto mb-1" />
                <p className="text-xs text-zinc-400">Not in your collection yet</p>
                <p className="text-xs text-zinc-600 mt-0.5">Open chests to unlock this card</p>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ── Main grid component ───────────────────────────────────────────────────────

export function CollectionGrid({
  units,
  ownedCount,
  totalCount,
}: {
  units: CollectionUnit[]
  ownedCount: number
  totalCount: number
}) {
  const [selected, setSelected] = useState<CollectionUnit | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  function handleCardClick(unit: CollectionUnit) {
    setSelected(unit)
    setSheetOpen(true)
  }

  return (
    <>
      {/* Count */}
      <p className="text-xs text-zinc-500 mb-4">
        <span className="text-white font-semibold">{ownedCount}</span> / {totalCount} cards found
      </p>

      {/* Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
        {units.map((unit) => (
          <UnitCardThumb
            key={unit.unitId}
            unit={unit}
            onClick={() => handleCardClick(unit)}
          />
        ))}
      </div>

      {/* Detail sheet */}
      <CardDetailSheet
        unit={selected}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </>
  )
}
