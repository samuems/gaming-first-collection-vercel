'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import {
  Trophy, X, Zap, ChevronDown, ChevronUp, Sword, Bot,
  Wind, Mountain, Waves, Flame, Snowflake, Leaf, Sun, Moon,
} from 'lucide-react'
import type { BattleRound, BattleResult, Affinity, Rarity } from '@/types/database'
import type { UnitMeta } from '../arena/actions'
import { cn } from '@/lib/utils'

const AFF: Record<Affinity, { icon: React.ElementType; color: string }> = {
  Air:       { icon: Wind,      color: 'text-sky-400' },
  Earth:     { icon: Mountain,  color: 'text-lime-400' },
  Lightning: { icon: Zap,       color: 'text-yellow-400' },
  Water:     { icon: Waves,     color: 'text-blue-400' },
  Fire:      { icon: Flame,     color: 'text-red-400' },
  Ice:       { icon: Snowflake, color: 'text-cyan-400' },
  Nature:    { icon: Leaf,      color: 'text-green-400' },
  Light:     { icon: Sun,       color: 'text-orange-300' },
  Shadow:    { icon: Moon,      color: 'text-violet-400' },
}

const RARITY_RING: Record<Rarity, string> = {
  Common:    'ring-1 ring-zinc-500/50',
  Rare:      'ring-2 ring-blue-400/70',
  Epic:      'ring-2 ring-purple-400/80',
  Legendary: 'ring-2 ring-amber-400',
}

const RARITY_RIBBON: Record<Rarity, string> = {
  Common:    'bg-zinc-600 text-zinc-200',
  Rare:      'bg-blue-600 text-blue-100',
  Epic:      'bg-purple-600 text-purple-100',
  Legendary: 'bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-500 text-amber-900',
}

function MiniCard({
  unit,
  meta,
  won,
}: {
  unit: BattleRound['player_unit']
  meta: UnitMeta | undefined
  won: boolean
}) {
  const rarity: Rarity = meta?.rarity ?? 'Common'
  const aff = AFF[unit.affinity]
  const AffinityIcon = aff.icon

  return (
    <div className={cn(
      'relative flex flex-col rounded-lg overflow-hidden w-12 shrink-0 transition-all',
      RARITY_RING[rarity],
      !won && 'opacity-50 grayscale',
    )}>
      <div className="aspect-[3/4] bg-zinc-900 relative">
        {meta?.image ? (
          <img src={meta.image} alt={unit.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-800">
            <AffinityIcon className={cn('size-3', aff.color)} />
          </div>
        )}
        <div className={cn('absolute bottom-0 inset-x-0 h-2 flex items-center justify-center text-[5px] font-black', RARITY_RIBBON[rarity])}>
          {rarity[0]}
        </div>
      </div>
    </div>
  )
}

export interface MatchEntry {
  matchId: string
  opponentName: string
  result: BattleResult
  playerRoundsWon: number
  opponentRoundsWon: number
  rounds: BattleRound[]
  createdAt: string
  isAI: boolean
}

export type { UnitMeta }

const RESULT_CFG: Record<BattleResult, {
  icon: React.ElementType
  bg: string
  border: string
  text: string
  label: string
}> = {
  win:  { icon: Trophy, bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', label: 'Victory' },
  loss: { icon: X,      bg: 'bg-red-500/10',     border: 'border-red-500/20',     text: 'text-red-400',    label: 'Defeat' },
  draw: { icon: Zap,    bg: 'bg-zinc-500/10',    border: 'border-zinc-500/20',    text: 'text-zinc-400',   label: 'Draw' },
}

function RoundRow({
  round, idx, unitMeta,
}: {
  round: BattleRound
  idx: number
  unitMeta: Record<string, UnitMeta>
}) {
  const playerWon = round.winner === 'player'
  const opponentWon = round.winner === 'opponent'
  const PlayerAffIcon = AFF[round.player_unit.affinity].icon
  const OppAffIcon = AFF[round.opponent_unit.affinity].icon

  return (
    <div className="flex flex-col gap-1 py-2 px-3 rounded-lg bg-zinc-900/60">
      {/* Round label + winner */}
      <div className="flex items-center gap-2 text-[9px] text-zinc-600">
        <span className="font-mono">ROUND {idx + 1}</span>
        <span className="ml-auto font-black">
          {round.winner === 'draw' ? (
            <span className="text-zinc-500">DRAW</span>
          ) : playerWon ? (
            <span className="text-emerald-400">YOU WIN</span>
          ) : (
            <span className="text-red-500">OPPONENT WINS</span>
          )}
        </span>
      </div>

      {/* Cards row */}
      <div className="flex items-center gap-2 text-xs">
        {/* Player unit */}
        <div className={cn('flex-1 flex items-center gap-1.5 rounded-lg px-2 py-1.5 border',
          playerWon ? 'bg-emerald-950/40 border-emerald-700/40' : 'bg-zinc-800/60 border-zinc-700/40 opacity-60'
        )}>
          <MiniCard unit={round.player_unit} meta={unitMeta[round.player_unit.id]} won={playerWon} />
          <div className="flex-1 min-w-0">
            <p className={cn('font-bold truncate text-[10px]', playerWon ? 'text-white' : 'text-zinc-400')}>
              {round.player_unit.name}
            </p>
            <p className="text-[9px] text-zinc-500 flex items-center gap-0.5">
              <PlayerAffIcon className={cn('size-2.5', AFF[round.player_unit.affinity].color)} />
              <Sword className="size-2 text-red-400 ml-0.5" />
              {round.player_unit.power}
              {round.player_affinity_bonus > 0 && (
                <span className="text-amber-400 font-semibold ml-0.5">+{round.player_affinity_bonus}</span>
              )}
              <span className="mx-0.5 text-zinc-600">=</span>
              <span className={cn('font-black', playerWon ? 'text-emerald-400' : 'text-zinc-400')}>
                {round.player_battle_score}
              </span>
            </p>
          </div>
        </div>

        <span className="text-zinc-700 text-[10px] font-black shrink-0">vs</span>

        {/* Opponent unit */}
        <div className={cn('flex-1 flex items-center gap-1.5 rounded-lg px-2 py-1.5 border',
          opponentWon ? 'bg-red-950/40 border-red-700/40' : 'bg-zinc-800/60 border-zinc-700/40 opacity-60'
        )}>
          <MiniCard unit={round.opponent_unit} meta={unitMeta[round.opponent_unit.id]} won={opponentWon} />
          <div className="flex-1 min-w-0">
            <p className={cn('font-bold truncate text-[10px]', opponentWon ? 'text-white' : 'text-zinc-400')}>
              {round.opponent_unit.name}
            </p>
            <p className="text-[9px] text-zinc-500 flex items-center gap-0.5">
              <OppAffIcon className={cn('size-2.5', AFF[round.opponent_unit.affinity].color)} />
              <Sword className="size-2 text-red-400 ml-0.5" />
              {round.opponent_unit.power}
              {round.opponent_affinity_bonus > 0 && (
                <span className="text-amber-400 font-semibold ml-0.5">+{round.opponent_affinity_bonus}</span>
              )}
              <span className="mx-0.5 text-zinc-600">=</span>
              <span className={cn('font-black', opponentWon ? 'text-red-400' : 'text-zinc-400')}>
                {round.opponent_battle_score}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Affinity bonus explanation */}
      {(round.player_affinity_bonus > 0 || round.opponent_affinity_bonus > 0) && (
        <p className="text-[9px] text-amber-500/70 px-1">
          {round.player_affinity_bonus > 0
            ? `${round.player_unit.affinity} has affinity advantage over ${round.opponent_unit.affinity}`
            : `${round.opponent_unit.affinity} has affinity advantage over ${round.player_unit.affinity}`}
        </p>
      )}
    </div>
  )
}

function MatchRow({ entry, unitMeta }: { entry: MatchEntry; unitMeta: Record<string, UnitMeta> }) {
  const [expanded, setExpanded] = useState(false)
  const cfg = RESULT_CFG[entry.result]
  const ResultIcon = cfg.icon

  const date = new Date(entry.createdAt)
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' })

  return (
    <div className={cn('rounded-xl border overflow-hidden', cfg.border, cfg.bg)}>
      {/* Summary row */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Result icon */}
        <ResultIcon className={cn('size-5 shrink-0', cfg.text)} />

        {/* VS */}
        <div className="flex-1 flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-white">You</span>
            <span className="text-xs text-zinc-600">vs</span>
            <div className="flex items-center gap-1">
              {entry.isAI && <Bot className="size-3 text-zinc-500" />}
              <span className="text-xs font-bold text-zinc-300 truncate max-w-[120px]">
                {entry.opponentName}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn('text-[10px] px-1.5 py-0 h-4', cfg.text, cfg.border, 'bg-transparent')}
            >
              {cfg.label}
            </Badge>
            <span className="text-[10px] text-zinc-600">
              {entry.playerRoundsWon}–{entry.opponentRoundsWon} rounds
            </span>
            <span className="text-[10px] text-zinc-700">
              {dateStr} {timeStr}
            </span>
          </div>
        </div>

        {/* Replay toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800/60 hover:bg-zinc-700/60 text-xs text-zinc-400 hover:text-zinc-200 transition-colors shrink-0"
        >
          {expanded ? (
            <>Hide <ChevronUp className="size-3" /></>
          ) : (
            <>Replay <ChevronDown className="size-3" /></>
          )}
        </button>
      </div>

      {/* Round details */}
      {expanded && (
        <div className="px-4 pb-3 flex flex-col gap-1">
          <div className="flex items-center justify-between text-[10px] text-zinc-600 px-3 mb-0.5">
            <span>YOUR UNIT</span>
            <span>RND</span>
            <span>OPPONENT</span>
          </div>
          {entry.rounds.map((r, i) => (
            <RoundRow key={i} round={r} idx={i} unitMeta={unitMeta} />
          ))}
        </div>
      )}
    </div>
  )
}

export function BattleLogList({
  entries,
  unitMeta,
}: {
  entries: MatchEntry[]
  unitMeta: Record<string, UnitMeta>
}) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-16">
        <Sword className="size-12 mx-auto mb-3 text-zinc-700" />
        <p className="text-zinc-400 font-semibold">No battles yet</p>
        <p className="text-sm text-zinc-600 mt-1">Head to the Arena and start fighting!</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {entries.map((entry) => (
        <MatchRow key={entry.matchId} entry={entry} unitMeta={unitMeta} />
      ))}
    </div>
  )
}
