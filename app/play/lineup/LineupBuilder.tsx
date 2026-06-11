'use client'

import { useState, useTransition } from 'react'
import { saveLineup } from './actions'
import { Button } from '@/components/ui/button'
import {
  Wind, Mountain, Zap, Waves, Flame, Snowflake, Leaf, Sun, Moon,
  Sword, Timer, Star, Plus, X, CheckCircle2, AlertCircle,
} from 'lucide-react'
import type { Affinity, Rarity } from '@/types/database'
import { cn } from '@/lib/utils'

export interface LineupUnit {
  unitId: string
  name: string
  image: string | null
  rarity: Rarity
  affinity: Affinity
  level: number
  power: number
  speed: number
}

const RARITY_CFG: Record<Rarity, { border: string; bg: string; glow: string }> = {
  Common:    { border: 'border-zinc-500/50',  bg: 'bg-zinc-800',   glow: '' },
  Rare:      { border: 'border-blue-400/60',  bg: 'bg-blue-950',   glow: 'shadow-blue-500/20 shadow-md' },
  Epic:      { border: 'border-purple-400/70',bg: 'bg-purple-950', glow: 'shadow-purple-500/25 shadow-md' },
  Legendary: { border: 'border-amber-400',    bg: 'bg-amber-950',  glow: 'shadow-amber-400/30 shadow-lg' },
}

const AFFINITY_CFG: Record<Affinity, { icon: React.ElementType; color: string }> = {
  Air:       { icon: Wind,      color: 'text-sky-300' },
  Earth:     { icon: Mountain,  color: 'text-lime-300' },
  Lightning: { icon: Zap,       color: 'text-yellow-300' },
  Water:     { icon: Waves,     color: 'text-blue-300' },
  Fire:      { icon: Flame,     color: 'text-red-300' },
  Ice:       { icon: Snowflake, color: 'text-cyan-300' },
  Nature:    { icon: Leaf,      color: 'text-green-300' },
  Light:     { icon: Sun,       color: 'text-orange-200' },
  Shadow:    { icon: Moon,      color: 'text-violet-300' },
}

export function LineupBuilder({
  ownedUnits,
  initialSlots,
}: {
  ownedUnits: LineupUnit[]
  initialSlots: (string | null)[]
}) {
  const [slots, setSlots] = useState<(string | null)[]>(initialSlots)
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const slotUnits = slots.map((id) =>
    id ? ownedUnits.find((u) => u.unitId === id) ?? null : null
  )
  const filledCount = slots.filter(Boolean).length
  const deckIds = new Set(slots.filter(Boolean) as string[])

  function addUnit(unit: LineupUnit) {
    if (deckIds.has(unit.unitId)) return
    const emptyIdx = slots.findIndex((s) => s === null)
    if (emptyIdx === -1) return
    const next = [...slots]
    next[emptyIdx] = unit.unitId
    setSlots(next)
    setMessage(null)
  }

  function removeSlot(idx: number) {
    const next = [...slots]
    next[idx] = null
    setSlots(next)
    setMessage(null)
  }

  function handleSave() {
    startTransition(async () => {
      const result = await saveLineup(slots)
      if (result.error) {
        setMessage({ type: 'error', text: result.error })
      } else {
        setMessage({ type: 'ok', text: 'Deck saved! You can now enter the Arena.' })
      }
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Deck slots */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">
            Your Deck
          </h2>
          <span className="text-xs text-zinc-500">{filledCount} / 5</span>
        </div>

        <div className="grid grid-cols-5 gap-1.5">
          {Array.from({ length: 5 }).map((_, i) => {
            const unit = slotUnits[i]
            return (
              <div key={i} className="flex flex-col gap-1">
                <span className="text-[10px] text-center text-zinc-600 font-medium">
                  #{i + 1}
                </span>
                {unit ? (
                  <div
                    className={cn(
                      'relative rounded-xl overflow-hidden border-2',
                      RARITY_CFG[unit.rarity].border,
                      RARITY_CFG[unit.rarity].bg,
                      RARITY_CFG[unit.rarity].glow,
                      'aspect-[3/4]',
                    )}
                  >
                    {unit.image ? (
                      <img src={unit.image} alt={unit.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Sword className="size-6 text-zinc-600" />
                      </div>
                    )}
                    {/* Remove button */}
                    <button
                      onClick={() => removeSlot(i)}
                      className="absolute top-0.5 right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 hover:bg-red-600/80 transition-colors"
                    >
                      <X className="size-3 text-white" />
                    </button>
                    {/* Name + level */}
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 px-1 py-0.5">
                      <p className="text-[9px] font-bold text-white truncate">{unit.name}</p>
                      <p className="text-[8px] text-zinc-400 flex items-center gap-0.5">
                        <Sword className="size-2 text-red-400" />{unit.power}
                        <span className="ml-0.5"><Timer className="size-2 text-emerald-400 inline" />{unit.speed}</span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-[3/4] rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-900/50 flex flex-col items-center justify-center gap-1">
                    <Plus className="size-5 text-zinc-700" />
                    <span className="text-[9px] text-zinc-700">Empty</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Save button */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handleSave}
          disabled={isPending || filledCount === 0}
          className={cn(
            'flex-1 h-10 font-bold text-sm',
            filledCount === 5
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
              : 'bg-zinc-800 text-zinc-400',
          )}
        >
          {isPending ? 'Saving…' : filledCount === 5 ? 'Save Deck' : `Save Deck (${filledCount}/5)`}
        </Button>
      </div>

      {message && (
        <div
          className={cn(
            'flex items-center gap-2 rounded-lg px-3 py-2 text-sm',
            message.type === 'ok'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400',
          )}
        >
          {message.type === 'ok' ? (
            <CheckCircle2 className="size-4 shrink-0" />
          ) : (
            <AlertCircle className="size-4 shrink-0" />
          )}
          {message.text}
        </div>
      )}

      {/* Available units */}
      <div>
        <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-wider mb-3">
          Available Cards ({ownedUnits.length})
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
          {ownedUnits.map((unit) => {
            const inDeck = deckIds.has(unit.unitId)
            const AffinityIcon = AFFINITY_CFG[unit.affinity].icon
            return (
              <button
                key={unit.unitId}
                onClick={() => addUnit(unit)}
                disabled={inDeck || filledCount >= 5}
                className={cn(
                  'relative flex flex-col rounded-xl overflow-hidden border-2 aspect-[3/4] transition-all',
                  RARITY_CFG[unit.rarity].border,
                  RARITY_CFG[unit.rarity].bg,
                  inDeck
                    ? 'opacity-40 cursor-not-allowed'
                    : 'hover:scale-[1.04] hover:-translate-y-1 cursor-pointer',
                  filledCount >= 5 && !inDeck && 'opacity-50 cursor-not-allowed',
                )}
              >
                {unit.image ? (
                  <img src={unit.image} alt={unit.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                    <Sword className="size-5 text-zinc-600" />
                  </div>
                )}

                {/* In-deck overlay */}
                {inDeck && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <CheckCircle2 className="size-5 text-indigo-400" />
                  </div>
                )}

                {/* Footer */}
                <div className="absolute bottom-0 inset-x-0 bg-black/70 px-1 py-0.5">
                  <p className="text-[8px] font-bold text-white truncate">{unit.name}</p>
                  <div className="flex items-center gap-0.5">
                    <AffinityIcon className={cn('size-2', AFFINITY_CFG[unit.affinity].color)} />
                    {unit.level > 1 && (
                      <span className="text-[7px] text-amber-400 font-bold">
                        <Star className="size-2 fill-amber-400 inline" />{unit.level}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
