import { requireSession } from '../lib/session'
import { createServiceClient } from '@/lib/supabase/service'
import type { Unit, PlayerUnit, Rarity } from '@/types/database'
import { ChestOpener } from './ChestOpener'
import { Package, Layers, Star, Trophy, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export const revalidate = 0

export default async function StorePage() {
  await requireSession()
  const supabase = createServiceClient()

  const [{ data: unitsRaw }, { data: puRaw }] = await Promise.all([
    supabase.from('units').select('id, rarity'),
    supabase.from('player_units').select('unit_id'),
  ])

  const units = (unitsRaw ?? []) as Pick<Unit, 'id' | 'rarity'>[]
  const playerUnits = (puRaw ?? []) as Pick<PlayerUnit, 'unit_id'>[]

  const ownedIds = new Set(playerUnits.map((pu) => pu.unit_id))

  const rarityStats = (['Legendary', 'Epic', 'Rare', 'Common'] as Rarity[]).map((r) => {
    const total = units.filter((u) => u.rarity === r).length
    const owned = units.filter((u) => u.rarity === r && ownedIds.has(u.id)).length
    return { rarity: r, total, owned }
  })

  const RARITY_COLORS: Record<Rarity, { text: string; bg: string; border: string }> = {
    Legendary: { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    Epic:      { text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    Rare:      { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    Common:    { text: 'text-zinc-400', bg: 'bg-zinc-500/10', border: 'border-zinc-500/20' },
  }

  return (
    <div className="max-w-4xl mx-auto w-full px-4 py-6 flex flex-col gap-8">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Package className="size-5 text-violet-400" />
            <h1 className="text-2xl font-black text-white tracking-tight">Mystery Chests</h1>
          </div>
          <p className="text-sm text-zinc-500">
            Open chests to discover new cards for your collection
          </p>
        </div>
        <Link
          href="/play/collection"
          className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
        >
          <Layers className="size-3.5" />
          My Collection
          <ChevronRight className="size-3" />
        </Link>
      </div>

      {/* ── Collection progress banner ───────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {rarityStats.map(({ rarity, total, owned }) => {
          const pct = total > 0 ? Math.round((owned / total) * 100) : 0
          const c = RARITY_COLORS[rarity]
          return (
            <div key={rarity} className={cn('rounded-xl p-3 border', c.bg, c.border)}>
              <p className={cn('text-[11px] font-black uppercase tracking-widest mb-1', c.text)}>{rarity}</p>
              <p className="text-lg font-black text-white tabular-nums">{owned}<span className="text-zinc-600 text-xs font-normal">/{total}</span></p>
              <div className="h-1 rounded-full bg-black/30 mt-1.5 overflow-hidden">
                <div className={cn('h-full rounded-full transition-all', rarity === 'Legendary' ? 'bg-amber-400' : rarity === 'Epic' ? 'bg-purple-500' : rarity === 'Rare' ? 'bg-blue-500' : 'bg-zinc-500')} style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Hero: special offer banner ───────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-2xl border border-amber-400/15 p-6 flex items-center gap-5"
        style={{ background: 'linear-gradient(135deg, #1a1505 0%, #1f1008 60%, #150e1e 100%)' }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(251,191,36,0.12)_0%,transparent_60%)] pointer-events-none" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-600/30 to-orange-600/20 border border-amber-400/20">
          <Star className="size-8 text-amber-400" />
        </div>
        <div className="relative flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] font-black tracking-widest text-amber-400 px-2 py-0.5 rounded-full border border-amber-400/30 bg-amber-400/10">DEMO SPECIAL</span>
          </div>
          <p className="text-lg font-black text-white mb-0.5">All Chests — Free!</p>
          <p className="text-xs text-zinc-400">Experience the full chest opening system. Try all pack types for free during this demo.</p>
        </div>
        <div className="relative shrink-0 hidden md:flex flex-col items-center gap-1">
          <span className="text-3xl font-black text-amber-400">FREE</span>
          <span className="text-[10px] text-zinc-500">demo mode</span>
        </div>
      </div>

      {/* ── Chest Opener widget ──────────────────────────────────────────── */}
      <ChestOpener />

      {/* ── Tips ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            icon: Package,
            title: 'Duplicates Level Up',
            desc: 'Getting a card you already own adds a copy. Enough copies automatically level up your card — boosting Power and Speed.',
            color: 'text-indigo-400',
            bg: 'bg-indigo-500/5 border-indigo-500/15',
          },
          {
            icon: Star,
            title: 'Rarity Matters',
            desc: 'Legendary and Epic cards have higher base stats. Build a deck with high-rarity cards to dominate the arena.',
            color: 'text-amber-400',
            bg: 'bg-amber-500/5 border-amber-500/15',
          },
          {
            icon: Trophy,
            title: 'Win More Battles',
            desc: 'A diverse deck with multiple affinities gives you an advantage. Affinity bonuses can turn the tide of any round.',
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/5 border-emerald-500/15',
          },
        ].map(({ icon: Icon, title, desc, color, bg }) => (
          <div key={title} className={cn('rounded-2xl p-4 border', bg)}>
            <div className={cn('flex items-center gap-2 mb-2', color)}>
              <Icon className="size-4" />
              <span className="text-xs font-black">{title}</span>
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
