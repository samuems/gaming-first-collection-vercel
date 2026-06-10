'use client'

import { useState, useEffect } from 'react'
import {
  Wind, Mountain, Zap, Waves, Flame, Snowflake, Leaf, Sun, Moon,
  Sword, Timer, Trophy, X, ChevronLeft, ChevronRight, Swords,
} from 'lucide-react'
import type { BattleRound, BattleResult, Affinity, Rarity } from '@/types/database'
import type { UnitMeta } from './actions'
type AffinityLabels = Partial<Record<Affinity, string>>
import { cn } from '@/lib/utils'

// ── Configs ───────────────────────────────────────────────────────────────────

const AFF: Record<Affinity, { icon: React.ElementType; color: string; bg: string }> = {
  Air:       { icon: Wind,      color: 'text-sky-200',    bg: 'bg-sky-500/25 border-sky-500/30' },
  Earth:     { icon: Mountain,  color: 'text-lime-200',   bg: 'bg-lime-600/25 border-lime-500/30' },
  Lightning: { icon: Zap,       color: 'text-yellow-200', bg: 'bg-yellow-500/25 border-yellow-400/30' },
  Water:     { icon: Waves,     color: 'text-blue-200',   bg: 'bg-blue-500/25 border-blue-400/30' },
  Fire:      { icon: Flame,     color: 'text-red-200',    bg: 'bg-red-600/25 border-red-500/30' },
  Ice:       { icon: Snowflake, color: 'text-cyan-200',   bg: 'bg-cyan-500/25 border-cyan-400/30' },
  Nature:    { icon: Leaf,      color: 'text-green-200',  bg: 'bg-green-600/25 border-green-500/30' },
  Light:     { icon: Sun,       color: 'text-orange-100', bg: 'bg-orange-400/25 border-orange-300/30' },
  Shadow:    { icon: Moon,      color: 'text-violet-200', bg: 'bg-violet-600/25 border-violet-500/30' },
}

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

const RARITY_LABEL: Record<Rarity, string> = {
  Common: 'COMMON', Rare: '✦ RARE ✦', Epic: '✦ EPIC ✦', Legendary: '✦ LEGENDARY ✦',
}

// ── Full TCG Arena Card ───────────────────────────────────────────────────────

function ArenaCard({
  unit,
  meta,
  won,
  lost,
  affinityLabels = {},
}: {
  unit: BattleRound['player_unit']
  meta: UnitMeta | undefined
  won: boolean
  lost: boolean
  affinityLabels?: AffinityLabels
}) {
  const rarity: Rarity = meta?.rarity ?? 'Common'
  const r = RARITY_CFG[rarity]
  const aff = AFF[unit.affinity]
  const AffinityIcon = aff.icon
  const affLabel = affinityLabels[unit.affinity] ?? unit.affinity

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-2xl overflow-hidden w-36 transition-all duration-700',
        r.cardBg, r.outerBorder,
        won
          ? cn(r.glowClass, 'scale-105 ring-2 ring-emerald-400 shadow-[0_0_40px_rgba(52,211,153,0.35)]')
          : lost
          ? 'scale-95 opacity-40 grayscale'
          : r.glowClass,
      )}
    >
      {/* Affinity pill */}
      <div className="flex items-center justify-between px-2 pt-1.5 pb-1">
        <span className={cn('inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold border', aff.bg)}>
          <AffinityIcon className={cn('size-2.5', aff.color)} />
          <span className={aff.color}>{affLabel}</span>
        </span>
        <span className="text-[9px] font-bold text-zinc-500">Lv{unit.level}</span>
      </div>

      {/* Artwork */}
      <div className={cn('relative mx-1.5 rounded-xl overflow-hidden bg-zinc-900', 'aspect-[3/4]', r.outerBorder)}>
        {meta?.image ? (
          <img src={meta.image} alt={unit.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <AffinityIcon className={cn('size-12', aff.color, 'opacity-40')} />
          </div>
        )}
        {/* Rarity ribbon */}
        <div className={cn('absolute bottom-0 inset-x-0 text-center text-[7px] font-black tracking-widest py-0.5', r.ribbonBg, r.ribbonText)}>
          {RARITY_LABEL[rarity]}
        </div>
        {/* Winner glow overlay */}
        {won && (
          <div className="absolute inset-0 bg-emerald-400/10 animate-pulse" />
        )}
      </div>

      {/* Name */}
      <p className={cn('text-center text-[11px] font-black px-1 pt-1 pb-0.5 truncate', r.nameColor)}>
        {meta?.name ?? unit.name}
      </p>

      {/* Stats */}
      <div className={cn('flex items-center justify-center gap-2 mx-1.5 mb-1.5 rounded-lg px-2 py-1 text-[10px] font-bold', r.statsBg)}>
        <span className="flex items-center gap-0.5 text-red-300">
          <Sword className="size-2.5 text-red-400" />{unit.power}
        </span>
        <span className="text-zinc-600">·</span>
        <span className="flex items-center gap-0.5 text-emerald-300">
          <Timer className="size-2.5 text-emerald-400" />{unit.speed}
        </span>
      </div>
    </div>
  )
}

// ── Deck thumb card (bottom bar) ──────────────────────────────────────────────

function DeckThumb({
  unit,
  meta,
  active,
  won,
  lost,
  onClick,
}: {
  unit: BattleRound['player_unit']
  meta: UnitMeta | undefined
  active: boolean
  won: boolean | null
  lost: boolean | null
  onClick: () => void
}) {
  const rarity: Rarity = meta?.rarity ?? 'Common'
  const r = RARITY_CFG[rarity]
  const aff = AFF[unit.affinity]
  const AffinityIcon = aff.icon

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex flex-col rounded-xl overflow-hidden w-14 transition-all duration-300 border-2',
        active
          ? 'border-white scale-110 shadow-lg'
          : won === true
          ? 'border-emerald-500/70'
          : won === false
          ? 'border-red-500/50 opacity-60'
          : 'border-zinc-700 opacity-50',
      )}
    >
      <div className="aspect-[3/4] bg-zinc-900 relative">
        {meta?.image ? (
          <img src={meta.image} alt={unit.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-800">
            <AffinityIcon className={cn('size-4', aff.color)} />
          </div>
        )}
        <div className={cn('absolute bottom-0 inset-x-0 text-center text-[6px] font-black py-px', r.ribbonBg, r.ribbonText)}>
          {rarity.toUpperCase()}
        </div>
      </div>
      <div className={cn('px-1 py-0.5', r.cardBg)}>
        <p className="text-[8px] font-bold text-white truncate text-center">{meta?.name ?? unit.name}</p>
      </div>
    </button>
  )
}

// ── Round Scene ───────────────────────────────────────────────────────────────

function RoundScene({
  round,
  unitMeta,
  isLast,
  onNext,
  affinityLabels = {},
}: {
  round: BattleRound
  unitMeta: Record<string, UnitMeta>
  isLast: boolean
  onNext: () => void
  affinityLabels?: AffinityLabels
}) {
  const [showCards, setShowCards] = useState(false)
  const [showScore, setShowScore] = useState(false)
  const [showWinner, setShowWinner] = useState(false)
  const [showBtn, setShowBtn] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setShowCards(true), 60)
    const t2 = setTimeout(() => setShowScore(true), 800)
    const t3 = setTimeout(() => setShowWinner(true), 1400)
    const t4 = setTimeout(() => setShowBtn(true), 1800)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
  }, [])

  const playerWon = round.winner === 'player'
  const opponentWon = round.winner === 'opponent'
  const isDraw = round.winner === 'draw'
  const PlayerAffIcon = AFF[round.player_unit.affinity].icon
  const OppAffIcon = AFF[round.opponent_unit.affinity].icon

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Cards */}
      <div className="flex items-end gap-4">
        <div className={cn('transition-all duration-500', showCards ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-24')}>
          <ArenaCard unit={round.player_unit} meta={unitMeta[round.player_unit.id]} won={playerWon} lost={opponentWon} affinityLabels={affinityLabels} />
        </div>

        <div className="flex flex-col items-center gap-2 pb-4">
          <div className="w-9 h-9 rounded-full border border-zinc-700 bg-zinc-900/80 flex items-center justify-center shadow">
            <span className="text-[10px] font-black text-zinc-500">VS</span>
          </div>
        </div>

        <div className={cn('transition-all duration-500', showCards ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-24')}>
          <ArenaCard unit={round.opponent_unit} meta={unitMeta[round.opponent_unit.id]} won={opponentWon} lost={playerWon} affinityLabels={affinityLabels} />
        </div>
      </div>

      {/* Score formula */}
      <div className={cn('transition-all duration-500', showScore ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4')}>
        <div className="flex items-center gap-2 bg-zinc-900/90 border border-zinc-700 rounded-2xl px-5 py-2.5">
          {/* Player score */}
          <span className="flex items-center gap-1 font-black text-white text-sm">
            <Sword className="size-3.5 text-red-400" />{round.player_unit.power}
          </span>
          {round.player_affinity_bonus > 0 && (
            <>
              <span className="text-zinc-600 text-xs">+</span>
              <span className="flex items-center gap-0.5 font-black text-amber-400 text-sm">
                <PlayerAffIcon className="size-3.5" />{round.player_affinity_bonus}
              </span>
            </>
          )}

          {/* Arrow */}
          <span className={cn('font-black text-xl mx-1', isDraw ? 'text-zinc-500' : playerWon ? 'text-emerald-400' : 'text-red-400')}>
            {isDraw ? '=' : playerWon ? '›' : '‹'}
          </span>

          {/* Opponent score */}
          <span className="flex items-center gap-1 font-black text-zinc-300 text-sm">
            <Sword className="size-3.5 text-red-400" />{round.opponent_unit.power}
          </span>
          {round.opponent_affinity_bonus > 0 && (
            <>
              <span className="text-zinc-600 text-xs">+</span>
              <span className="flex items-center gap-0.5 font-black text-amber-400 text-sm">
                <OppAffIcon className="size-3.5" />{round.opponent_affinity_bonus}
              </span>
            </>
          )}
        </div>

        {/* Affinity explanation */}
        {(round.player_affinity_bonus > 0 || round.opponent_affinity_bonus > 0) && (
          <p className="text-center text-[10px] text-amber-500/70 mt-1.5">
            {round.player_affinity_bonus > 0
              ? `${affinityLabels[round.player_unit.affinity] ?? round.player_unit.affinity} has advantage over ${affinityLabels[round.opponent_unit.affinity] ?? round.opponent_unit.affinity}`
              : `${affinityLabels[round.opponent_unit.affinity] ?? round.opponent_unit.affinity} has advantage over ${affinityLabels[round.player_unit.affinity] ?? round.player_unit.affinity}`}
          </p>
        )}
      </div>

      {/* Round winner */}
      <div className={cn('transition-all duration-500', showWinner ? 'opacity-100 scale-100' : 'opacity-0 scale-90')}>
        {isDraw ? (
          <p className="text-xl font-black text-zinc-400 tracking-widest">DRAW</p>
        ) : playerWon ? (
          <div className="flex items-center gap-2">
            <Trophy className="size-7 text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.7)]" />
            <p className="text-2xl font-black text-amber-400 tracking-widest drop-shadow-[0_0_16px_rgba(251,191,36,0.5)]">YOU WIN!</p>
            <Trophy className="size-7 text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.7)]" />
          </div>
        ) : (
          <p className="text-2xl font-black text-red-400 tracking-widest drop-shadow-[0_0_12px_rgba(239,68,68,0.45)]">OPPONENT WINS</p>
        )}
      </div>

      {/* Next button */}
      <div className={cn('transition-all duration-300', showBtn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3')}>
        <button
          onClick={onNext}
          className="px-8 py-2 rounded-xl border border-zinc-600 bg-zinc-800 hover:bg-zinc-700 text-sm font-bold text-zinc-200 transition-colors tracking-wide"
        >
          {isLast ? 'SEE RESULTS' : 'NEXT ROUND'}
        </button>
      </div>
    </div>
  )
}

// ── Main BattleReplay ─────────────────────────────────────────────────────────

export interface ReplayProps {
  playerName: string
  opponentName: string
  result: BattleResult
  rounds: BattleRound[]
  unitMeta: Record<string, UnitMeta>
  affinityLabels?: AffinityLabels
  playerRoundsWon: number
  opponentRoundsWon: number
  onClose: () => void
  /** When true: fills a layout content area (sidebar stays visible). When false (default): fixed fullscreen overlay */
  inPage?: boolean
}

export function BattleReplay({
  playerName, opponentName, result, rounds, unitMeta,
  affinityLabels = {},
  playerRoundsWon, opponentRoundsWon, onClose, inPage = false,
}: ReplayProps) {
  const [roundIdx, setRoundIdx] = useState(0)
  const [phase, setPhase] = useState<'starting' | 'round' | 'done'>('starting')

  useEffect(() => {
    if (phase !== 'starting') return
    const t = setTimeout(() => setPhase('round'), 2200)
    return () => clearTimeout(t)
  }, [phase])

  function handleNext() {
    if (roundIdx < rounds.length - 1) setRoundIdx((i) => i + 1)
    else setPhase('done')
  }

  function goToRound(idx: number) {
    setRoundIdx(idx)
    if (phase !== 'round') setPhase('round')
  }

  const playerDeck = rounds.map((r) => r.player_unit)

  const RC = {
    win:  { text: 'text-amber-400', shadow: 'drop-shadow-[0_0_24px_rgba(251,191,36,0.6)]', label: 'VICTORY!' },
    loss: { text: 'text-red-400',   shadow: 'drop-shadow-[0_0_24px_rgba(239,68,68,0.5)]',  label: 'DEFEAT' },
    draw: { text: 'text-zinc-400',  shadow: '',                                              label: 'DRAW' },
  }[result]

  return (
    <div className={cn(inPage ? 'flex flex-col min-h-[calc(100vh-48px)] bg-[#06060d]' : 'fixed inset-0 z-50 flex flex-col overflow-hidden bg-[#06060d]')}>
      {/* Ambient glows */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_75%,rgba(120,53,15,0.2)_0%,transparent_55%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_15%,rgba(67,56,202,0.09)_0%,transparent_50%)] pointer-events-none" />

      {/* Sparkle particles */}
      {[...Array(10)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-amber-400/30 animate-pulse pointer-events-none"
          style={{
            width: i % 3 === 0 ? '3px' : '2px',
            height: i % 3 === 0 ? '3px' : '2px',
            left: `${8 + i * 9}%`,
            top: `${15 + (i % 4) * 18}%`,
            animationDelay: `${i * 0.25}s`,
            animationDuration: `${1.8 + i * 0.3}s`,
          }}
        />
      ))}

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-zinc-800/60 bg-zinc-950/40 backdrop-blur-sm">
        <p className="text-sm font-bold text-zinc-300">
          <span className="text-white">{playerName}</span>
          <span className="text-zinc-600 mx-2">vs</span>
          <span className="text-zinc-400">{opponentName}</span>
        </p>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
        >
          <X className="size-4" />
        </button>
      </header>

      {/* Round navigator */}
      <div className="relative z-10 flex items-center justify-center gap-3 py-2.5 border-b border-zinc-800/40">
        <button
          onClick={() => roundIdx > 0 && phase === 'round' && goToRound(roundIdx - 1)}
          disabled={roundIdx === 0 || phase !== 'round'}
          className="text-zinc-600 hover:text-zinc-300 disabled:opacity-20 transition-colors"
        >
          <ChevronLeft className="size-4" />
        </button>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1">
            <Swords className="size-3 text-zinc-500" />
            <span className="text-xs font-bold text-zinc-200 tracking-wider">ROUND {roundIdx + 1}</span>
          </div>

          <div className="flex items-center gap-1">
            {rounds.map((r, i) => (
              <button
                key={i}
                onClick={() => phase === 'round' && goToRound(i)}
                className={cn(
                  'w-3 h-3 rounded-full transition-all border',
                  i === roundIdx && phase === 'round'
                    ? 'border-white bg-white scale-125'
                    : phase === 'starting' || i > roundIdx
                    ? 'border-zinc-700 bg-zinc-800'
                    : r.winner === 'player'
                    ? 'border-emerald-500 bg-emerald-500'
                    : r.winner === 'opponent'
                    ? 'border-red-500 bg-red-500'
                    : 'border-zinc-500 bg-zinc-500',
                )}
              />
            ))}
          </div>
        </div>

        <button
          onClick={() => roundIdx < rounds.length - 1 && phase === 'round' && goToRound(roundIdx + 1)}
          disabled={roundIdx === rounds.length - 1 || phase !== 'round'}
          className="text-zinc-600 hover:text-zinc-300 disabled:opacity-20 transition-colors"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      {/* Arena */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-4 overflow-hidden">
        {/* Platform glow */}
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-80 h-16 rounded-full bg-amber-900/25 blur-2xl pointer-events-none" />
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-64 h-2.5 rounded-full bg-gradient-to-r from-transparent via-amber-800/70 to-transparent pointer-events-none" />
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full border border-amber-700/10 pointer-events-none" />

        {/* BATTLE STARTS! */}
        {phase === 'starting' && (
          <div className="flex flex-col items-center gap-5 animate-pulse">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-amber-900/30 border-2 border-amber-700/40 shadow-[0_0_50px_rgba(180,83,9,0.45)]">
              <Swords className="size-12 text-amber-400" />
            </div>
            <div className="text-center">
              <p className="text-5xl font-black tracking-widest text-amber-400 drop-shadow-[0_0_24px_rgba(251,191,36,0.7)]">BATTLE</p>
              <p className="text-5xl font-black tracking-widest text-amber-300 drop-shadow-[0_0_24px_rgba(251,191,36,0.6)] -mt-1">STARTS!</p>
            </div>
          </div>
        )}

        {/* Round */}
        {phase === 'round' && (
          <RoundScene
            key={roundIdx}
            round={rounds[roundIdx]}
            unitMeta={unitMeta}
            isLast={roundIdx === rounds.length - 1}
            onNext={handleNext}
            affinityLabels={affinityLabels}
          />
        )}

        {/* Final result */}
        {phase === 'done' && (
          <div className="flex flex-col items-center gap-5">
            {result === 'win' && (
              <Trophy className="size-20 text-amber-400 drop-shadow-[0_0_36px_rgba(251,191,36,0.7)]" />
            )}
            <div className="text-center">
              <p className={cn('text-5xl font-black tracking-widest', RC.text, RC.shadow)}>{RC.label}</p>
              <p className="text-zinc-400 mt-2 text-lg">
                <span className="font-black text-white">{playerRoundsWon}</span>
                <span className="mx-2 text-zinc-600">–</span>
                <span className="font-black text-zinc-400">{opponentRoundsWon}</span>
                <span className="text-zinc-600 text-sm ml-2">rounds</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="mt-2 px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-colors"
            >
              Back to Arena
            </button>
          </div>
        )}
      </div>

      {/* Player deck (bottom) */}
      <div className="relative z-10 border-t border-zinc-800/60 px-4 py-3 bg-zinc-950/70 backdrop-blur-sm">
        <div className="flex items-end justify-center gap-2">
          {playerDeck.map((unit, i) => {
            const played = phase !== 'starting' && i <= roundIdx
            const r = played ? rounds[i] : null
            const won = r ? r.winner === 'player' : null
            return (
              <DeckThumb
                key={i}
                unit={unit}
                meta={unitMeta[unit.id]}
                active={i === roundIdx && phase === 'round'}
                won={won}
                lost={won === false ? true : null}
                onClick={() => phase === 'round' && goToRound(i)}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
