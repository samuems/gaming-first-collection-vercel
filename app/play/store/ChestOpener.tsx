'use client'

import { useState, useTransition } from 'react'
import {
  Package, Sparkles, Star, Gem, Zap, Wind, Mountain, Waves, Flame,
  Snowflake, Leaf, Sun, Moon, Sword, Timer, X, RotateCcw, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { openChests, type OpenedCard } from './actions'
import type { Rarity, Affinity } from '@/types/database'

const PACKS = [
  {
    id: 'standard' as const,
    count: 1 as const,
    name: 'Mystery Box',
    subtitle: 'Standard odds',
    icon: Package,
    label: '1 Card',
    gradient: 'from-zinc-800 to-zinc-900',
    border: 'border-zinc-600/40',
    glowColor: 'shadow-zinc-500/10',
    headerBg: 'bg-zinc-700/30',
    accentColor: 'text-zinc-300',
    btnClass: 'from-zinc-600 to-zinc-700 hover:from-zinc-500 hover:to-zinc-600',
    odds: [
      { label: 'Common', pct: '74%', color: 'text-zinc-400' },
      { label: 'Rare', pct: '23%', color: 'text-blue-400' },
      { label: 'Epic', pct: '2%', color: 'text-purple-400' },
      { label: 'Legendary', pct: '1%', color: 'text-amber-400' },
    ],
  },
  {
    id: 'rare' as const,
    count: 3 as const,
    name: 'Rare Pack',
    subtitle: 'Guaranteed Rare+ 1st card',
    icon: Star,
    label: '3 Cards',
    gradient: 'from-blue-950 to-zinc-900',
    border: 'border-blue-400/30',
    glowColor: 'shadow-blue-500/15',
    headerBg: 'bg-blue-900/20',
    accentColor: 'text-blue-400',
    btnClass: 'from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600',
    odds: [
      { label: 'Common', pct: '0%', color: 'text-zinc-500 line-through' },
      { label: 'Rare', pct: '75%', color: 'text-blue-400' },
      { label: 'Epic', pct: '20%', color: 'text-purple-400' },
      { label: 'Legendary', pct: '5%', color: 'text-amber-400' },
    ],
  },
  {
    id: 'epic' as const,
    count: 5 as const,
    name: 'Epic Hunt',
    subtitle: 'Guaranteed Epic+ 1st card',
    icon: Gem,
    label: '5 Cards',
    gradient: 'from-purple-950 to-zinc-900',
    border: 'border-purple-400/35',
    glowColor: 'shadow-purple-500/20',
    headerBg: 'bg-purple-900/20',
    accentColor: 'text-purple-400',
    btnClass: 'from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600',
    odds: [
      { label: 'Common', pct: '0%', color: 'text-zinc-500 line-through' },
      { label: 'Rare', pct: '0%', color: 'text-zinc-500 line-through' },
      { label: 'Epic', pct: '75%', color: 'text-purple-400' },
      { label: 'Legendary', pct: '25%', color: 'text-amber-400' },
    ],
  },
]

const AFF_ICON: Record<Affinity, React.ElementType> = {
  Air: Wind, Earth: Mountain, Lightning: Zap, Water: Waves, Fire: Flame,
  Ice: Snowflake, Nature: Leaf, Light: Sun, Shadow: Moon,
}

const RARITY_CFG: Record<Rarity, {
  ring: string; bg: string; ribbon: string; ribbonText: string; glow: string; label: string
}> = {
  Common:    { ring: 'ring-1 ring-zinc-500/50', bg: 'bg-zinc-900', ribbon: 'bg-zinc-700', ribbonText: 'text-zinc-200', glow: '', label: 'COMMON' },
  Rare:      { ring: 'ring-2 ring-blue-400/70', bg: 'bg-gradient-to-b from-blue-950 to-zinc-900', ribbon: 'bg-blue-700', ribbonText: 'text-blue-100', glow: 'shadow-blue-500/25 shadow-lg', label: '✦ RARE ✦' },
  Epic:      { ring: 'ring-2 ring-purple-400/80', bg: 'bg-gradient-to-b from-purple-950 to-zinc-900', ribbon: 'bg-purple-700', ribbonText: 'text-purple-100', glow: 'shadow-purple-500/30 shadow-xl', label: '✦ EPIC ✦' },
  Legendary: { ring: 'ring-2 ring-amber-400', bg: 'bg-gradient-to-b from-amber-950 to-zinc-900', ribbon: 'bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-500', ribbonText: 'text-amber-950', glow: 'shadow-amber-400/40 shadow-xl', label: '✦ LEGENDARY ✦' },
}

function RevealCard({ card, visible }: { card: OpenedCard; visible: boolean }) {
  const r = RARITY_CFG[card.rarity]
  const AffinityIcon = AFF_ICON[card.affinity]

  return (
    <div className={cn(
      'flex flex-col rounded-2xl overflow-hidden w-32 shrink-0 transition-all duration-500',
      r.ring, r.bg, r.glow,
      visible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-75 translate-y-8',
    )}>
      {/* Affinity bar */}
      <div className="px-2 pt-2 pb-1 flex items-center justify-between">
        <AffinityIcon className="size-3.5 text-zinc-400" />
        {card.isNew ? (
          <span className="text-[8px] font-black text-emerald-400 bg-emerald-500/15 border border-emerald-500/20 rounded-full px-1.5 py-0.5">NEW!</span>
        ) : card.leveledUp ? (
          <span className="text-[8px] font-black text-amber-400 bg-amber-500/15 border border-amber-500/20 rounded-full px-1.5 py-0.5">LVL UP!</span>
        ) : (
          <span className="text-[8px] text-zinc-600">+1 copy</span>
        )}
      </div>

      {/* Artwork */}
      <div className="relative mx-1.5 rounded-xl overflow-hidden aspect-[3/4] bg-zinc-800">
        {card.image ? (
          <img src={card.image} alt={card.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <AffinityIcon className="size-12 text-zinc-600" />
          </div>
        )}
        <div className={cn('absolute bottom-0 inset-x-0 text-center text-[6px] font-black tracking-widest py-0.5', r.ribbon, r.ribbonText)}>
          {r.label}
        </div>
        {/* Legendary glow overlay */}
        {card.rarity === 'Legendary' && (
          <div className="absolute inset-0 bg-gradient-to-t from-amber-500/20 to-transparent animate-pulse" />
        )}
      </div>

      {/* Info */}
      <div className="px-2 pt-1.5 pb-2">
        <p className="text-[10px] font-black text-white truncate">{card.name}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="flex items-center gap-0.5 text-[9px] text-red-300 font-bold">
            <Sword className="size-2" />{card.power}
          </span>
          <span className="text-zinc-700 text-[8px]">·</span>
          <span className="flex items-center gap-0.5 text-[9px] text-emerald-300 font-bold">
            <Timer className="size-2" />{card.speed}
          </span>
          <span className="ml-auto text-[8px] text-zinc-600">Lv{card.level}</span>
        </div>
      </div>
    </div>
  )
}

export function ChestOpener() {
  const [selectedPack, setSelectedPack] = useState<(typeof PACKS)[number]>(PACKS[0])
  const [isPending, startTransition] = useTransition()
  const [results, setResults] = useState<OpenedCard[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [visibleCards, setVisibleCards] = useState<boolean[]>([])

  function handleOpen() {
    setError(null)
    setResults(null)
    setVisibleCards([])
    startTransition(async () => {
      const res = await openChests(selectedPack.count, selectedPack.id)
      if (!res.ok) {
        setError(res.error)
        return
      }
      setResults(res.cards)
      // Reveal cards one by one
      const visible = new Array(res.cards.length).fill(false)
      setVisibleCards([...visible])
      res.cards.forEach((_, i) => {
        setTimeout(() => {
          setVisibleCards((prev) => {
            const next = [...prev]
            next[i] = true
            return next
          })
        }, i * 300 + 100)
      })
    })
  }

  function handleReset() {
    setResults(null)
    setVisibleCards([])
    setError(null)
  }

  return (
    <div className="flex flex-col gap-8">

      {/* ── Pack selection ─────────────────────────────────────────────── */}
      {!results && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PACKS.map((pack) => {
              const isSelected = selectedPack.id === pack.id
              const Icon = pack.icon
              return (
                <button
                  key={pack.id}
                  onClick={() => setSelectedPack(pack)}
                  className={cn(
                    'flex flex-col rounded-2xl overflow-hidden border-2 transition-all duration-200 text-left',
                    `bg-gradient-to-b ${pack.gradient}`,
                    pack.border,
                    isSelected
                      ? cn('ring-2 ring-offset-2 ring-offset-[#080810] scale-[1.02]', pack.glowColor)
                      : 'opacity-70 hover:opacity-90',
                  )}
                >
                  {/* Header */}
                  <div className={cn('flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.06]', pack.headerBg)}>
                    <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl border border-white/10', pack.headerBg)}>
                      <Icon className={cn('size-5', pack.accentColor)} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white">{pack.name}</p>
                      <p className={cn('text-[10px] font-medium', pack.accentColor)}>{pack.subtitle}</p>
                    </div>
                    <div className="ml-auto">
                      <span className={cn('text-[10px] font-black px-2 py-0.5 rounded-full border', pack.accentColor, pack.border)}>
                        {pack.label}
                      </span>
                    </div>
                  </div>

                  {/* Chest visual */}
                  <div className="relative flex items-center justify-center py-7">
                    {/* Glow */}
                    <div className={cn('absolute inset-0 opacity-30', `bg-[radial-gradient(ellipse_at_50%_50%,${pack.id === 'epic' ? 'rgba(139,92,246,0.4)' : pack.id === 'rare' ? 'rgba(96,165,250,0.4)' : 'rgba(113,113,122,0.3)'},transparent_70%)]`)} />
                    {/* Chest icons */}
                    <div className="relative flex items-end gap-1">
                      {[...Array(pack.count)].map((_, i) => (
                        <div
                          key={i}
                          style={{ transform: `translateY(${i === Math.floor(pack.count / 2) ? -6 : 0}px)` }}
                          className={cn(
                            'flex h-12 w-12 items-center justify-center rounded-xl border border-white/10',
                            pack.id === 'epic' ? 'bg-purple-900/60' : pack.id === 'rare' ? 'bg-blue-900/60' : 'bg-zinc-800/80',
                          )}
                        >
                          <Icon className={cn('size-6', pack.accentColor)} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Drop rates */}
                  <div className="px-4 pb-4 flex flex-col gap-1.5">
                    {pack.odds.map(({ label, pct, color }) => (
                      <div key={label} className="flex items-center justify-between text-[11px]">
                        <span className={color}>{label}</span>
                        <span className={cn('font-bold', color)}>{pct}</span>
                      </div>
                    ))}
                  </div>

                  {/* Selected indicator */}
                  {isSelected && (
                    <div className={cn('h-1 w-full bg-gradient-to-r', pack.btnClass.split(' ').slice(0, 2).join(' '))} />
                  )}
                </button>
              )
            })}
          </div>

          {/* Open button */}
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={handleOpen}
              disabled={isPending}
              className={cn(
                'flex items-center gap-3 px-10 py-4 rounded-2xl text-base font-black text-white transition-all',
                `bg-gradient-to-r ${selectedPack.btnClass}`,
                'shadow-lg disabled:opacity-50 disabled:scale-100',
                !isPending && 'hover:scale-105 active:scale-95',
              )}
            >
              {isPending ? (
                <>
                  <Sparkles className="size-5 animate-spin" />
                  Opening…
                </>
              ) : (
                <>
                  <selectedPack.icon className="size-5" />
                  Open {selectedPack.name}
                </>
              )}
            </button>
            <p className="text-xs text-zinc-600">Free in demo mode · {selectedPack.count} card{selectedPack.count > 1 ? 's' : ''} per open</p>
          </div>

          {error && (
            <div className="mx-auto max-w-sm flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              <X className="size-4 shrink-0" />
              {error}
            </div>
          )}
        </>
      )}

      {/* ── Results ────────────────────────────────────────────────────── */}
      {results && (
        <div className="flex flex-col items-center gap-8">
          {/* Header */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Sparkles className="size-5 text-amber-400" />
              <h2 className="text-2xl font-black text-white tracking-wide">
                {results.some((c) => c.rarity === 'Legendary')
                  ? '✦ LEGENDARY DROP! ✦'
                  : results.some((c) => c.rarity === 'Epic')
                  ? '✦ EPIC PULL! ✦'
                  : results.some((c) => c.rarity === 'Rare')
                  ? 'RARE PULL!'
                  : 'CARDS RECEIVED'}
              </h2>
              <Sparkles className="size-5 text-amber-400" />
            </div>
            <p className="text-sm text-zinc-500">{results.filter((c) => c.isNew).length} new · {results.filter((c) => !c.isNew).length} duplicates</p>
          </div>

          {/* Cards */}
          <div className="flex flex-wrap items-start justify-center gap-4">
            {results.map((card, i) => (
              <RevealCard key={i} card={card} visible={visibleCards[i] ?? false} />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleOpen}
              disabled={isPending}
              className={cn(
                'flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all',
                `bg-gradient-to-r ${selectedPack.btnClass}`,
                'disabled:opacity-50',
              )}
            >
              {isPending ? <Sparkles className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
              Open Again
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/[0.07] hover:bg-white/[0.12] border border-white/[0.08] text-sm font-semibold text-zinc-300 transition-colors"
            >
              Change Pack
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
