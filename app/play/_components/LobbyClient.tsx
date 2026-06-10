'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import {
  Swords, Sparkles, Play, X,
  Wind, Mountain, Zap, Waves, Flame, Snowflake, Leaf, Sun, Moon,
  ChevronLeft, ChevronRight, Shield,
} from 'lucide-react'
import { cn, parseAffinityLabel } from '@/lib/utils'
import type { Rarity, Affinity } from '@/types/database'
import { ArenaModal } from './ArenaModal'

// ── Types ──────────────────────────────────────────────────────────────────────

type OwnedCard = {
  unitId: string; name: string; image: string | null
  rarity: Rarity; affinity: Affinity; power: number; speed: number; level: number
}

// ── Configs ────────────────────────────────────────────────────────────────────

const AFF_ICON: Record<Affinity, React.ElementType> = {
  Air: Wind, Earth: Mountain, Lightning: Zap, Water: Waves, Fire: Flame,
  Ice: Snowflake, Nature: Leaf, Light: Sun, Shadow: Moon,
}

const AFF_COLOR: Record<Affinity, string> = {
  Air: 'text-sky-300', Earth: 'text-lime-400', Lightning: 'text-yellow-300',
  Water: 'text-blue-300', Fire: 'text-orange-400', Ice: 'text-cyan-300',
  Nature: 'text-emerald-400', Light: 'text-amber-200', Shadow: 'text-violet-400',
}

const RARITY_CFG: Record<Rarity, {
  ring: string; glow: string; ribbon: string; ribbonText: string; label: string
  modalBorder: string; modalGlow: string; badgeBg: string
}> = {
  Common:    { ring: 'ring-1 ring-zinc-600/40',   glow: '',                     ribbon: 'bg-zinc-700',  ribbonText: 'text-zinc-200',  label: 'COMMON',        modalBorder: 'border-zinc-600/40',   modalGlow: '',                         badgeBg: 'bg-zinc-700 text-zinc-200' },
  Rare:      { ring: 'ring-2 ring-blue-400/50',   glow: 'shadow-blue-500/20',   ribbon: 'bg-blue-700',  ribbonText: 'text-blue-100',  label: '✦ RARE ✦',     modalBorder: 'border-blue-400/40',   modalGlow: 'shadow-blue-500/15',       badgeBg: 'bg-blue-700 text-blue-100' },
  Epic:      { ring: 'ring-2 ring-purple-400/60', glow: 'shadow-purple-500/20', ribbon: 'bg-purple-700',ribbonText: 'text-purple-100',label: '✦ EPIC ✦',     modalBorder: 'border-purple-400/50', modalGlow: 'shadow-purple-500/20',     badgeBg: 'bg-purple-700 text-purple-100' },
  Legendary: { ring: 'ring-2 ring-amber-400/80',  glow: 'shadow-amber-400/30',  ribbon: 'bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-500', ribbonText: 'text-amber-950 font-black', label: '✦ LEGENDARY ✦', modalBorder: 'border-amber-400/60', modalGlow: 'shadow-amber-400/25', badgeBg: 'bg-gradient-to-r from-amber-600 to-amber-400 text-amber-950' },
}

// ── Category tabs ──────────────────────────────────────────────────────────────

const TABS = ['All', 'Hold & Win', 'Megaways', 'Classic Slots', 'New', 'For You']

// ── Slot Games ─────────────────────────────────────────────────────────────────

type SlotGame = { name: string; src: string; provider: string; isNew?: boolean; isHot?: boolean }

const SLOT_GAMES: SlotGame[] = [
  { name: '3 Magic Lamps',       src: '/SlotTiles/3-magic-lamps-hold-and-win.png',            provider: 'PLAYSON',  isNew: true },
  { name: '3 Pots Riches',       src: '/SlotTiles/3-pots-riches-hold-and-win.png',            provider: 'EGT' },
  { name: '5 Fortunator',        src: '/SlotTiles/5-fortunator.png',                          provider: 'PLAYSON' },
  { name: '777 Sizzling Wins',   src: '/SlotTiles/777-sizzling-wins-5wins.png',               provider: 'EGT' },
  { name: 'Arizona Heist',       src: '/SlotTiles/arizona-heist-hold-and-win.png',            provider: 'BGaming',  isHot: true },
  { name: 'Blazing Wins',        src: '/SlotTiles/blazing-wins-5-lines.png',                  provider: 'Novomatic' },
  { name: 'Buffalo Power 2',     src: '/SlotTiles/buffalo-power-2-hold-and-win.png',          provider: 'Novomatic', isHot: true },
  { name: 'Buffalo Xmas',        src: '/SlotTiles/buffalo-power-christmas.png',               provider: 'Novomatic' },
  { name: 'Buffalo Power',       src: '/SlotTiles/buffalo-power-hold-and-win.png',            provider: 'Novomatic' },
  { name: 'Buffalo Megaways',    src: '/SlotTiles/buffalo-power-megaways-tm.png',             provider: 'Novomatic', isNew: true },
  { name: 'Burning Fortunator',  src: '/SlotTiles/burning-fortunator.png',                   provider: 'PLAYSON' },
  { name: 'Clover Charm',        src: '/SlotTiles/clover-charm-hit-the-bonus.png',            provider: 'Fugaso' },
  { name: 'Coin Strike',         src: '/SlotTiles/coin-strike-hold-and-win.png',              provider: 'EGT' },
  { name: 'Crown & Diamonds',    src: '/SlotTiles/crown-and-diamonds-hold-and-win.png',       provider: 'EGT',      isHot: true },
  { name: 'Crystal Land 2',      src: '/SlotTiles/crystal-land-2.png',                        provider: 'BGaming',  isNew: true },
  { name: 'Diamond Fortunator',  src: '/SlotTiles/diamond-fortunator-hold-and-win.png',       provider: 'PLAYSON' },
  { name: 'Diamonds Power',      src: '/SlotTiles/diamonds-power-hold-and-win.png',           provider: 'EGT' },
  { name: 'Diamond Wins',        src: '/SlotTiles/diamond-wins-hold-and-win.png',             provider: 'EGT' },
  { name: 'Divine Dragon',       src: '/SlotTiles/divine-dragon-hold-and-win.png',            provider: 'BGaming',  isHot: true },
  { name: 'Eagle Power',         src: '/SlotTiles/eagle-power-hold-and-win.png',              provider: 'Novomatic' },
  { name: 'Empire Gold',         src: '/SlotTiles/empire-gold-hold-and-win.png',              provider: 'EGT' },
  { name: 'Energy Coins',        src: '/SlotTiles/energy-coins-hold-and-win.png',             provider: 'Fugaso' },
  { name: 'Fire Coins',          src: '/SlotTiles/fire-coins-hold-and-win.png',               provider: 'BGaming' },
  { name: 'Fire Temple',         src: '/SlotTiles/fire-temple-hold-and-win.png',              provider: 'BGaming',  isHot: true },
  { name: 'Giza Nights',         src: '/SlotTiles/giza-nights-hold-and-win.png',              provider: 'Pragmatic' },
  { name: 'Hit the Bank',        src: '/SlotTiles/hit-the-bank-hold-and-win.png',             provider: 'Pragmatic' },
  { name: 'Hot Coins',           src: '/SlotTiles/hot-coins-hold-and-win.png',                provider: 'EGT' },
  { name: 'Jelly Valley',        src: '/SlotTiles/jelly-valley.png',                          provider: 'BGaming',  isNew: true },
  { name: "Joker's Coins",       src: "/SlotTiles/joker's-coins-hold-and-win.png",            provider: 'Novomatic' },
  { name: 'Legend of Cleopatra', src: '/SlotTiles/legend-of-cleopatra-megaways-tm.png',       provider: 'Pragmatic', isNew: true },
  { name: 'Lion Gems',           src: '/SlotTiles/lion-gems-hold-and-win.png',                provider: 'EGT' },
  { name: 'Luxor Gold',          src: '/SlotTiles/luxor-gold-hold-and-win.png',               provider: 'Pragmatic', isHot: true },
  { name: 'Mammoth Peak',        src: '/SlotTiles/mammoth-peak-hold-and-win.png',             provider: 'BGaming' },
  { name: 'Pearl Ocean',         src: '/SlotTiles/pearl-ocean-hold-and-win.png',              provider: 'Fugaso' },
  { name: 'Pirate Chest',        src: '/SlotTiles/pirate-chest-hold-and-win.png',             provider: 'BGaming',  isNew: true },
  { name: 'Power Crown',         src: '/SlotTiles/power-crown-hold-and-win.png',              provider: 'EGT' },
  { name: 'Rich Diamonds',       src: '/SlotTiles/rich-diamonds-hold-and-win.png',            provider: 'Novomatic' },
  { name: 'Royal Coins 2',       src: '/SlotTiles/royal-coins-2-hold-and-win.png',            provider: 'EGT' },
  { name: 'Royal Coins',         src: '/SlotTiles/royal-coins-hold-and-win.png',              provider: 'EGT' },
  { name: 'Royal Fortunator',    src: '/SlotTiles/royal-fortunator-hold-and-win.png',         provider: 'PLAYSON' },
  { name: 'Royal Joker',         src: '/SlotTiles/royal-joker-hold-and-win.png',              provider: 'Novomatic' },
  { name: 'Ruby Hit',            src: '/SlotTiles/ruby-hit-hold-and-win.png',                 provider: 'Fugaso' },
  { name: 'Sherwood Coins',      src: '/SlotTiles/sherwood-coins-hold-and-win.png',           provider: 'BGaming',  isNew: true },
  { name: 'Solar Queen',         src: '/SlotTiles/solar-queen.png',                           provider: 'Pragmatic', isHot: true },
  { name: 'Spirit of Egypt',     src: '/SlotTiles/spirit-of-egypt-hold-and-win.png',          provider: 'Pragmatic' },
  { name: 'Sunny Fruits 2',      src: '/SlotTiles/sunny-fruits-2-hold-and-win.png',           provider: 'Fugaso' },
  { name: 'Treasures of Fire',   src: '/SlotTiles/treasures-of-fire-scatter-pays.png',        provider: 'BGaming',  isHot: true },
  { name: 'Ultra Fortunator',    src: '/SlotTiles/ultra-fortunator-hold-and-win.png',         provider: 'PLAYSON' },
  { name: 'Wolf Land',           src: '/SlotTiles/wolf-land-hold-and-win.png',                provider: 'Novomatic' },
  { name: 'Wolf Power',          src: '/SlotTiles/wolf-power-hold-and-win.png',               provider: 'Novomatic' },
  { name: 'Wolf Megaways',       src: '/SlotTiles/wolf-power-megaways-tm.png',                provider: 'Novomatic', isNew: true },
]

const FOR_YOU      = SLOT_GAMES.filter((g) => g.isHot || g.isNew).slice(0, 6)
const HOLD_AND_WIN = SLOT_GAMES.filter((g) => g.src.includes('hold-and-win')).slice(0, 6)
const MEGAWAYS     = SLOT_GAMES.filter((g) => g.src.includes('megaways'))
const NEW_RELEASES = SLOT_GAMES.filter((g) => g.isNew).slice(0, 6)
const CLASSIC      = SLOT_GAMES.filter((g) => !g.src.includes('hold-and-win') && !g.src.includes('megaways')).slice(0, 6)

// ── Card Detail Modal ──────────────────────────────────────────────────────────

function CardDetailModal({
  card, onClose, affinityLabels,
}: {
  card: OwnedCard; onClose: () => void; affinityLabels: Partial<Record<Affinity, string>>
}) {
  const r = RARITY_CFG[card.rarity]
  const Icon = AFF_ICON[card.affinity]
  const affColor = AFF_COLOR[card.affinity]
  const rawLabel = affinityLabels[card.affinity] ?? card.affinity
  const { emoji, text: affText } = parseAffinityLabel(rawLabel)

  const maxStat = 100
  const powerPct = Math.min(100, Math.round((card.power / maxStat) * 100))
  const speedPct = Math.min(100, Math.round((card.speed / maxStat) * 100))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      {/* Card */}
      <div
        className={cn(
          'relative z-10 w-full max-w-[480px] rounded-3xl overflow-hidden border shadow-2xl',
          r.modalBorder, r.modalGlow && `shadow-2xl ${r.modalGlow}`,
        )}
        style={{ background: 'linear-gradient(160deg, #14131f 0%, #0d0c18 100%)' }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
        >
          <X className="size-4" />
        </button>

        <div className="flex flex-col sm:flex-row">
          {/* Left — card art */}
          <div className="sm:w-[200px] shrink-0 relative">
            <div className={cn('relative', r.ring)}>
              {card.image ? (
                <img
                  src={card.image}
                  alt={card.name}
                  className="w-full aspect-[3/4] object-cover object-top sm:rounded-none"
                />
              ) : (
                <div className="w-full aspect-[3/4] flex items-center justify-center bg-zinc-900">
                  <Icon className={cn('size-16', affColor)} />
                </div>
              )}
              {/* Rarity ribbon */}
              <div className={cn('absolute bottom-0 inset-x-0 text-center py-1 text-[8px] tracking-widest font-black', r.ribbon, r.ribbonText)}>
                {r.label}
              </div>
              {/* Level badge */}
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm">
                <span className="text-[10px] font-black text-amber-300">Lv {card.level}</span>
              </div>
            </div>
          </div>

          {/* Right — info */}
          <div className="flex-1 p-5 flex flex-col gap-3">
            {/* Name + rarity badge */}
            <div>
              <h2 className="text-lg font-black text-white leading-tight">{card.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={cn('text-[9px] font-black px-2 py-0.5 rounded-md tracking-wider', r.badgeBg)}>
                  {card.rarity.toUpperCase()}
                </span>
                <div className={cn('flex items-center gap-1 text-[11px] font-semibold', affColor)}>
                  {emoji
                    ? <span className="text-sm leading-none">{emoji}</span>
                    : <Icon className="size-3.5" />
                  }
                  {affText}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-col gap-2.5">
              {/* Power */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                    ⚔ Power
                  </span>
                  <span className="text-[12px] font-black text-rose-300">{card.power}</span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-rose-500 to-rose-400 transition-all duration-500"
                    style={{ width: `${powerPct}%` }}
                  />
                </div>
              </div>

              {/* Speed */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                    ◈ Speed
                  </span>
                  <span className="text-[12px] font-black text-emerald-300">{card.speed}</span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                    style={{ width: `${speedPct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Quick stats row */}
            <div className="grid grid-cols-3 gap-2 mt-1">
              {[
                { label: 'Power',  value: card.power,  color: 'text-rose-300' },
                { label: 'Speed',  value: card.speed,  color: 'text-emerald-300' },
                { label: 'Level',  value: card.level,  color: 'text-amber-300' },
              ].map((s) => (
                <div key={s.label} className="flex flex-col items-center gap-0.5 rounded-xl bg-zinc-800/60 py-2">
                  <span className={cn('text-base font-black', s.color)}>{s.value}</span>
                  <span className="text-[8.5px] text-zinc-500 uppercase tracking-wider">{s.label}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-auto pt-1">
              <Link
                href="/play/lineup"
                onClick={onClose}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-black text-xs text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(90deg, #e8b84b, #e8601e)', boxShadow: '0 2px 12px rgba(232,184,75,0.2)' }}
              >
                <Shield className="size-3.5" /> Add to Deck
              </Link>
              <Link
                href="/play/collection"
                onClick={onClose}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-xs text-zinc-300 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/50 transition-colors"
              >
                View Collection
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Card Thumb ─────────────────────────────────────────────────────────────────

function CardThumb({ card, onClick }: { card: OwnedCard; onClick: () => void }) {
  const r = RARITY_CFG[card.rarity]
  const Icon = AFF_ICON[card.affinity]
  return (
    <div
      className={cn('w-[145px] shrink-0 flex flex-col rounded-2xl overflow-hidden bg-zinc-900 shadow-md cursor-pointer group transition-transform hover:scale-[1.03]', r.ring, r.glow && `shadow-md ${r.glow}`)}
      onClick={onClick}
    >
      {/* Fixed-height image area — 145×194px keeps all cards identical */}
      <div className="relative h-[194px] w-full">
        {card.image ? (
          <img src={card.image} alt={card.name} className="absolute inset-0 w-full h-full object-cover object-top" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
            <Icon className="size-8 text-zinc-600" />
          </div>
        )}
        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors" />
        <div className="absolute top-1 left-1 h-4 px-1 rounded bg-black/70 flex items-center">
          <span className="text-[8px] font-black text-amber-300">Lv{card.level}</span>
        </div>
        <div className={cn('absolute bottom-0 inset-x-0 text-center py-0.5 text-[6.5px] tracking-widest font-black', r.ribbon, r.ribbonText)}>
          {r.label}
        </div>
      </div>
      {/* Fixed-height info area */}
      <div className="px-2 py-1.5 h-[42px] flex flex-col justify-center">
        <p className="text-[9.5px] font-black text-white truncate">{card.name}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-[8px] text-rose-300 font-bold">⚔ {card.power}</span>
          <span className="text-zinc-700 text-[8px]">·</span>
          <span className="text-[8px] text-emerald-300 font-bold">◈ {card.speed}</span>
        </div>
      </div>
    </div>
  )
}

// ── Game Thumb ─────────────────────────────────────────────────────────────────

function GameThumb({ game }: { game: SlotGame }) {
  return (
    <div className="group relative rounded-xl overflow-hidden cursor-pointer">
      <div className="relative bg-zinc-900 overflow-hidden" style={{ aspectRatio: '3/4' }}>
        <img
          src={game.src}
          alt={game.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {game.isNew && (
          <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-emerald-500 text-[7.5px] font-black text-white uppercase">New</div>
        )}
        {game.isHot && (
          <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-orange-500 text-[7.5px] font-black text-white uppercase">Hot</div>
        )}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pt-8 pb-2 px-2">
          <p className="text-[10px] font-black text-white line-clamp-1 drop-shadow">{game.name}</p>
          <p className="text-[7.5px] text-zinc-400 uppercase tracking-wider">{game.provider}</p>
        </div>
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="h-9 w-9 rounded-full bg-white/90 flex items-center justify-center">
            <Play className="size-4 text-zinc-900 ml-0.5" />
          </div>
        </div>
      </div>
    </div>
  )
}

function GameSection({ title, icon, games, viewAllHref }: {
  title: string; icon?: React.ReactNode; games: SlotGame[]; viewAllHref?: string
}) {
  if (games.length === 0) return null
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[13px] font-black text-white flex items-center gap-2">{icon}{title}</h2>
        {viewAllHref && (
          <Link href={viewAllHref} className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold transition-colors">
            View all →
          </Link>
        )}
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {games.map((g) => <GameThumb key={g.src} game={g} />)}
      </div>
    </section>
  )
}

// ── Main Lobby ────────────────────────────────────────────────────────────────

export function LobbyClient({
  playerName, wins, losses, lineupReady, ownedCards, ownedCount, totalCount, affinityLabels = {},
}: {
  playerName: string; wins: number; losses: number; lineupReady: boolean
  ownedCards: OwnedCard[]; ownedCount: number; totalCount: number
  affinityLabels?: Partial<Record<Affinity, string>>
}) {
  const [arenaOpen, setArenaOpen] = useState(false)
  const [selectedCard, setSelectedCard] = useState<OwnedCard | null>(null)
  const [activeTab, setActiveTab] = useState('All')
  const cardsScrollRef = useRef<HTMLDivElement>(null)

  function scrollCards(dir: 'left' | 'right') {
    cardsScrollRef.current?.scrollBy({ left: dir === 'right' ? 360 : -360, behavior: 'smooth' })
  }

  return (
    <>
      <ArenaModal
        isOpen={arenaOpen}
        onClose={() => setArenaOpen(false)}
        playerName={playerName}
        initialWins={wins}
        initialLosses={losses}
        lineupReady={lineupReady}
      />

      {selectedCard && (
        <CardDetailModal card={selectedCard} onClose={() => setSelectedCard(null)} affinityLabels={affinityLabels} />
      )}

      {/* ── Max-width container ─────────────────────────────────────── */}
      <div className="px-4 flex flex-col gap-0 max-w-5xl mx-auto w-full">

        {/* ── 1. Hero Banner ───────────────────────────────────────── */}
        <div className="pt-4">
          <img
            src="/Logo/BannerLobby.png"
            alt="Gaming First Collection"
            className="w-full h-auto block rounded-2xl"
          />
        </div>

        {/* ── 2. Category Tabs (sticky) ─────────────────────────────── */}
        <div
          className="sticky top-0 z-10 -mx-4 px-4 py-2 mt-3"
          style={{ background: 'rgba(13,13,24,0.97)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'flex items-center px-3.5 py-1.5 rounded-full text-[11.5px] font-semibold whitespace-nowrap shrink-0 transition-all',
                  activeTab === tab ? 'bg-white text-[#0d0d18] font-black' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06]',
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-5 pt-4">

          {/* ── 3. My Cards slider ─────────────────────────────────── */}
          {ownedCards.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-[13px] font-black text-white">My Cards</h2>
                  <p className="text-[9.5px] text-zinc-600">{ownedCount} of {totalCount} collected</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => scrollCards('left')}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition-colors"
                  >
                    <ChevronLeft className="size-3.5" />
                  </button>
                  <button
                    onClick={() => scrollCards('right')}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition-colors"
                  >
                    <ChevronRight className="size-3.5" />
                  </button>
                  <Link href="/play/collection" className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold transition-colors ml-1">
                    View all →
                  </Link>
                </div>
              </div>
              <div
                ref={cardsScrollRef}
                className="flex gap-2.5 overflow-x-auto scrollbar-none pb-3 -mx-4 px-4"
                style={{ scrollSnapType: 'x mandatory' }}
              >
                {ownedCards.map((card) => (
                  <div key={card.unitId} style={{ scrollSnapAlign: 'start' }}>
                    <CardThumb card={card} onClick={() => setSelectedCard(card)} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── 4. PVP Banner ────────────────────────────────────────── */}
          <div
            className="w-full rounded-2xl overflow-hidden cursor-pointer"
            style={{ background: 'transparent' }}
            onClick={() => setArenaOpen(true)}
          >
            <img
              src="/Logo/pvpBanner.png"
              alt="1v1 Battle Arena"
              className="w-full h-auto block hover:opacity-95 transition-opacity"
            />
          </div>

          {/* ── 5. Tournament Banner (with styled container) ─────────── */}
          <div
            className="w-full rounded-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #0d0800 0%, #1a1000 50%, #0d0800 100%)',
              border: '1px solid rgba(232,184,75,0.12)',
              boxShadow: '0 4px 32px rgba(0,0,0,0.5)',
            }}
          >
            <img
              src="/Logo/Tournamentbanner.png"
              alt="Card Battle Tournament"
              className="w-full h-auto block"
            />
          </div>

          {/* ── 6. Casino Game Sections ───────────────────────────────── */}
          <GameSection
            title="For You"
            icon={<Sparkles className="size-3.5" style={{ color: '#e8b84b' }} />}
            games={FOR_YOU}
            viewAllHref="/play/collection"
          />
          <GameSection
            title="Hold & Win"
            icon={<span className="text-[13px]">🪙</span>}
            games={HOLD_AND_WIN}
            viewAllHref="/play/collection"
          />
          <GameSection
            title="Megaways"
            icon={<Zap className="size-3.5 text-amber-400" />}
            games={MEGAWAYS}
            viewAllHref="/play/collection"
          />
          <GameSection
            title="New Releases"
            icon={<span className="text-emerald-400 text-[11px] font-black border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 rounded">NEW</span>}
            games={NEW_RELEASES}
            viewAllHref="/play/collection"
          />
          <GameSection
            title="Classic Slots"
            icon={<span className="text-[13px]">🎰</span>}
            games={CLASSIC}
            viewAllHref="/play/collection"
          />

          <div className="h-4" />
        </div>
      </div>
    </>
  )
}
