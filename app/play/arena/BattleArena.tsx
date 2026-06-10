'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Swords, Trophy, X, RotateCcw, ChevronDown, ChevronUp,
  Sword, Timer, Zap, Bot,
} from 'lucide-react'
import type { BattleRound, BattleResult } from '@/types/database'
import { cn } from '@/lib/utils'
import { findMatch, type UnitMeta } from './actions'
import { BattleReplay } from './BattleReplay'

interface MatchResult {
  matchId: string
  opponent: { id: string; name: string; isAI: boolean }
  result: BattleResult
  playerRoundsWon: number
  opponentRoundsWon: number
  rounds: BattleRound[]
  unitMeta: Record<string, UnitMeta>
  summary: string
}

interface Stats {
  wins: number
  losses: number
  draws: number
  total: number
}

// ── Round detail row ──────────────────────────────────────────────────────────

function RoundRow({ round, idx }: { round: BattleRound; idx: number }) {
  const playerWon = round.winner === 'player'
  const opponentWon = round.winner === 'opponent'

  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-lg bg-zinc-900/60 text-xs">
      <span className="text-zinc-600 w-4 shrink-0 font-mono">R{idx + 1}</span>

      {/* Player side */}
      <div className={cn('flex-1 flex flex-col', playerWon ? 'text-white' : 'text-zinc-500')}>
        <span className="font-semibold truncate">{round.player_unit.name}</span>
        <span className="text-[10px] flex items-center gap-1">
          <Sword className="size-2.5 text-red-400" />{round.player_battle_score}
          {round.player_affinity_bonus > 0 && (
            <span className="text-indigo-400">+{round.player_affinity_bonus} aff</span>
          )}
        </span>
      </div>

      {/* Winner indicator */}
      <div className="shrink-0">
        {round.winner === 'draw' ? (
          <span className="text-zinc-500 text-[10px] font-bold">=</span>
        ) : playerWon ? (
          <span className="text-emerald-400 font-black text-[10px]">WIN</span>
        ) : (
          <span className="text-red-500 font-black text-[10px]">LOSE</span>
        )}
      </div>

      {/* Opponent side */}
      <div className={cn('flex-1 flex flex-col items-end', opponentWon ? 'text-white' : 'text-zinc-500')}>
        <span className="font-semibold truncate">{round.opponent_unit.name}</span>
        <span className="text-[10px] flex items-center gap-1">
          {round.opponent_affinity_bonus > 0 && (
            <span className="text-indigo-400">+{round.opponent_affinity_bonus} aff</span>
          )}
          <Sword className="size-2.5 text-red-400" />{round.opponent_battle_score}
        </span>
      </div>
    </div>
  )
}

// ── Main arena component ──────────────────────────────────────────────────────

export function BattleArena({
  playerName,
  initialStats,
  lineupReady,
}: {
  playerName: string
  initialStats: Stats
  lineupReady: boolean
}) {
  const [match, setMatch] = useState<MatchResult | null>(null)
  const [showReplay, setShowReplay] = useState(false)
  const [showRounds, setShowRounds] = useState(false)
  const [stats, setStats] = useState(initialStats)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleFindMatch() {
    setError(null)
    setMatch(null)
    startTransition(async () => {
      const data = await findMatch()

      if (!data.ok) {
        setError(data.error)
        return
      }

      setMatch(data)
      setShowReplay(true)
      setStats((prev) => ({
        ...prev,
        wins: prev.wins + (data.result === 'win' ? 1 : 0),
        losses: prev.losses + (data.result === 'loss' ? 1 : 0),
        draws: prev.draws + (data.result === 'draw' ? 1 : 0),
        total: prev.total + 1,
      }))
    })
  }

  const resultColors: Record<BattleResult, { bg: string; border: string; text: string; label: string }> = {
    win:  { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', label: 'VICTORY' },
    loss: { bg: 'bg-red-500/10',     border: 'border-red-500/30',     text: 'text-red-400',     label: 'DEFEAT' },
    draw: { bg: 'bg-zinc-500/10',    border: 'border-zinc-500/30',    text: 'text-zinc-400',    label: 'DRAW' },
  }

  return (
    <>
    {/* Animated replay overlay */}
    {showReplay && match && (
      <BattleReplay
        playerName={playerName}
        opponentName={match.opponent.name}
        result={match.result}
        rounds={match.rounds}
        unitMeta={match.unitMeta}
        playerRoundsWon={match.playerRoundsWon}
        opponentRoundsWon={match.opponentRoundsWon}
        onClose={() => setShowReplay(false)}
      />
    )}

    <div className="flex flex-col items-center gap-8 py-8 px-4 max-w-md mx-auto w-full">
      {/* VS banner */}
      <div className="relative flex items-center justify-center gap-8 w-full">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.2)_0%,transparent_70%)] pointer-events-none" />

        {/* Player avatar */}
        <div className="flex flex-col items-center gap-2 relative z-10">
          <div className="w-20 h-20 rounded-full bg-indigo-900/60 border-2 border-indigo-500/60 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Swords className="size-8 text-indigo-400" />
          </div>
          <span className="text-xs font-bold text-white truncate max-w-[80px] text-center">{playerName}</span>
          <Badge variant="outline" className="text-[10px] border-indigo-500/30 text-indigo-400 bg-indigo-500/10">
            YOU
          </Badge>
        </div>

        {/* VS */}
        <div className="flex flex-col items-center gap-1 relative z-10">
          <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center">
            <span className="text-sm font-black text-zinc-300">VS</span>
          </div>
        </div>

        {/* Opponent avatar */}
        <div className="flex flex-col items-center gap-2 relative z-10">
          <div className={cn(
            'w-20 h-20 rounded-full border-2 flex items-center justify-center shadow-lg',
            match
              ? match.result === 'loss'
                ? 'bg-red-900/40 border-red-500/50 shadow-red-500/20'
                : 'bg-zinc-800/60 border-zinc-600/50'
              : 'bg-zinc-800/40 border-zinc-700/50',
          )}>
            {match?.opponent.isAI ? (
              <Bot className="size-8 text-zinc-500" />
            ) : (
              <Swords className="size-8 text-zinc-500" />
            )}
          </div>
          <span className="text-xs font-bold text-zinc-400 truncate max-w-[80px] text-center">
            {match ? match.opponent.name : '???'}
          </span>
          {match?.opponent.isAI && (
            <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-500 bg-zinc-800/50">
              AI BOT
            </Badge>
          )}
        </div>
      </div>

      {/* Result card */}
      {match && (
        <div className={cn(
          'w-full rounded-2xl border p-5 flex flex-col items-center gap-3',
          resultColors[match.result].bg,
          resultColors[match.result].border,
        )}>
          {/* Trophy / X icon */}
          {match.result === 'win' ? (
            <Trophy className="size-10 text-amber-400" />
          ) : match.result === 'loss' ? (
            <X className="size-10 text-red-400" />
          ) : (
            <Zap className="size-10 text-zinc-400" />
          )}

          <span className={cn('text-2xl font-black tracking-wide', resultColors[match.result].text)}>
            {resultColors[match.result].label}
          </span>

          <div className="flex items-center gap-3 text-sm">
            <span className="text-white font-bold text-lg">{match.playerRoundsWon}</span>
            <span className="text-zinc-600">rounds won vs</span>
            <span className="text-zinc-400 font-bold text-lg">{match.opponentRoundsWon}</span>
          </div>

          <p className="text-xs text-zinc-400">{match.summary}</p>

          {/* Watch replay */}
          <button
            onClick={() => setShowReplay(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 transition-colors"
          >
            <Swords className="size-3.5" />
            Watch Battle
          </button>

          {/* Rounds toggle */}
          <button
            onClick={() => setShowRounds(!showRounds)}
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mt-1"
          >
            {showRounds ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            {showRounds ? 'Hide' : 'Show'} round details
          </button>

          {showRounds && (
            <div className="w-full flex flex-col gap-1.5 mt-1">
              {match.rounds.map((r, i) => (
                <RoundRow key={i} round={r} idx={i} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="w-full bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
          {error}
          {error.includes('lineup') && (
            <Link href="/play/lineup" className="block mt-1 text-indigo-400 underline text-xs">
              Build your deck →
            </Link>
          )}
        </div>
      )}

      {/* CTA */}
      {!lineupReady ? (
        <div className="w-full text-center">
          <p className="text-sm text-zinc-400 mb-3">Build a 5-card deck before battling</p>
          <Link
            href="/play/lineup"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-colors"
          >
            <Swords className="size-4" />
            Build Deck
          </Link>
        </div>
      ) : (
        <Button
          onClick={handleFindMatch}
          disabled={isPending}
          className="w-full h-14 text-base font-black bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] disabled:opacity-60 disabled:scale-100"
        >
          {isPending ? (
            <span className="flex items-center gap-2">
              <span className="animate-pulse">⚔️</span>
              Searching Opponent…
            </span>
          ) : match ? (
            <span className="flex items-center gap-2">
              <RotateCcw className="size-4" />
              Battle Again
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Swords className="size-5" />
              Search Opponent
            </span>
          )}
        </Button>
      )}

      {/* Win streak / stats */}
      <div className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
        <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-3">
          Your Stats
        </p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Wins', value: stats.wins, color: 'text-emerald-400' },
            { label: 'Losses', value: stats.losses, color: 'text-red-400' },
            { label: 'Draws', value: stats.draws, color: 'text-zinc-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex flex-col items-center gap-0.5">
              <span className={cn('text-2xl font-black tabular-nums', color)}>{value}</span>
              <span className="text-[10px] text-zinc-600 uppercase tracking-wide">{label}</span>
            </div>
          ))}
        </div>

        {stats.total > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-[10px] text-zinc-600 mb-1">
              <span>Win rate</span>
              <span>{Math.round((stats.wins / stats.total) * 100)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${(stats.wins / stats.total) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  )
}
