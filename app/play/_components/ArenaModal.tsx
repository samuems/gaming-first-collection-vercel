'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  X, Swords, Trophy, RotateCcw, Bot, Home,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { findMatch } from '../arena/actions'
import type { BattleResult } from '@/types/database'

// idle → searching → found (show Watch Battle + See Results) → result (show Victory/Defeat + Play Again + Back to Lobby)
type Phase = 'idle' | 'searching' | 'found' | 'result'

interface MatchData {
  matchId: string
  opponentName: string
  isAI: boolean
  result: BattleResult
  playerRoundsWon: number
  opponentRoundsWon: number
}

const RESULT_CFG: Record<BattleResult, {
  text: string; label: string; sublabel: string
  bg: string; border: string; glow: string
}> = {
  win:  { text: 'text-emerald-400', label: 'VICTORY!', sublabel: 'Great battle! You dominated.', bg: 'bg-emerald-950/60', border: 'border-emerald-500/30', glow: 'shadow-emerald-500/20' },
  loss: { text: 'text-red-400',    label: 'DEFEAT',   sublabel: 'Better luck next time.', bg: 'bg-red-950/50',    border: 'border-red-500/25',   glow: 'shadow-red-500/15' },
  draw: { text: 'text-zinc-300',   label: 'DRAW',     sublabel: 'Evenly matched!',         bg: 'bg-zinc-800/40',  border: 'border-zinc-600/30',  glow: '' },
}

const STREAK_MILESTONES = [
  { label: '50 BP',  wins: 1 },
  { label: '100 BP', wins: 3 },
  { label: '300 BP', wins: 5 },
]

export function ArenaModal({
  isOpen,
  onClose,
  playerName,
  initialWins,
  initialLosses,
  lineupReady,
}: {
  isOpen: boolean
  onClose: () => void
  playerName: string
  initialWins: number
  initialLosses: number
  lineupReady: boolean
}) {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('idle')
  const [match, setMatch] = useState<MatchData | null>(null)
  const [wins, setWins] = useState(initialWins)
  const [losses, setLosses] = useState(initialLosses)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (isOpen) { setPhase('idle'); setMatch(null); setError(null) }
  }, [isOpen])

  function handleSearch() {
    setError(null)
    setPhase('searching')
    startTransition(async () => {
      const res = await findMatch()
      if (!res.ok) {
        setError(res.error)
        setPhase('idle')
        return
      }
      setMatch({
        matchId: res.matchId,
        opponentName: res.opponent.name,
        isAI: res.opponent.isAI,
        result: res.result,
        playerRoundsWon: res.playerRoundsWon,
        opponentRoundsWon: res.opponentRoundsWon,
      })
      if (res.result === 'win') setWins((w) => w + 1)
      else if (res.result === 'loss') setLosses((l) => l + 1)
      // STOP here — don't auto-advance. Let the player choose.
      setPhase('found')
    })
  }

  function handleWatchBattle() {
    if (!match) return
    onClose()
    router.push(`/play/arena/watch/${match.matchId}`)
  }

  function handleSeeResults() {
    setPhase('result')
  }

  function handlePlayAgain() {
    setPhase('idle')
    setMatch(null)
    setError(null)
  }

  function handleBackToLobby() {
    onClose()
    router.push('/play')
  }

  if (!isOpen) return null

  const initial = playerName[0]?.toUpperCase() ?? '?'
  const streakProgress = Math.min(wins, 5)
  const cfg = match ? RESULT_CFG[match.result] : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-[420px] rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl"
        style={{ background: 'linear-gradient(180deg, #13122a 0%, #0f0e1e 100%)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
        >
          <X className="size-3.5" />
        </button>

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div
          className="flex flex-col items-center pt-5 pb-3 px-6"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(232,184,75,0.14) 0%, transparent 65%)' }}
        >
          <div className="flex items-center gap-2 mb-0.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#e8b84b] to-orange-500 flex items-center justify-center shadow-md shadow-amber-500/25">
              <Swords className="size-4 text-white" />
            </div>
            <span className="text-[11px] font-black text-[#e8b84b] tracking-widest">1V1</span>
          </div>
          <h2 className="text-xl font-black text-white tracking-widest">BATTLE ARENA</h2>
          <p className="text-[11px] text-zinc-500 mt-0.5 text-center">
            Bring your best deck · Find opponents · Win Battle Points
          </p>
        </div>

        {/* ── VS Avatars ─────────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-center gap-10 py-5 px-6"
          style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(99,102,241,0.1) 0%, transparent 70%)' }}
        >
          {/* Player */}
          <div className="flex flex-col items-center gap-1.5">
            <div
              className="h-[60px] w-[60px] rounded-full border-2 border-indigo-400/50 flex items-center justify-center shadow-lg"
              style={{ background: 'radial-gradient(circle, #2d3065, #1a1b35)', boxShadow: '0 0 18px rgba(99,102,241,0.35)' }}
            >
              <span className="text-xl font-black text-white">{initial}</span>
            </div>
            <span className="text-[10px] font-semibold text-zinc-400 truncate max-w-[70px] text-center">{playerName}</span>
          </div>

          <span className="text-xl font-black text-zinc-600">VS</span>

          {/* Opponent */}
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={cn(
                'h-[60px] w-[60px] rounded-full border-2 flex items-center justify-center shadow-lg transition-all duration-500',
                (phase === 'found' || phase === 'result') ? 'border-red-500/50' : 'border-zinc-700/50',
              )}
              style={{
                background: (phase === 'found' || phase === 'result')
                  ? 'radial-gradient(circle, #3d1515, #1a0a0a)'
                  : 'radial-gradient(circle, #1c1c2e, #111)',
                boxShadow: (phase === 'found' || phase === 'result') ? '0 0 18px rgba(239,68,68,0.3)' : 'none',
              }}
            >
              {phase === 'searching' ? (
                <div className="flex gap-0.5">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-zinc-500 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              ) : match ? (
                match.isAI
                  ? <Bot className="size-6 text-zinc-500" />
                  : <span className="text-xl font-black text-red-400">{match.opponentName[0].toUpperCase()}</span>
              ) : (
                <span className="text-xl font-bold text-zinc-700">?</span>
              )}
            </div>
            <span className="text-[10px] font-semibold text-zinc-500 truncate max-w-[70px] text-center">
              {phase === 'searching' ? 'Searching…' : match?.opponentName ?? 'Opponent'}
            </span>
          </div>
        </div>

        {/* ── Phase: found — show Watch Battle + See Results ─────────────── */}
        {phase === 'found' && match && (
          <div className="px-4 pb-2 flex flex-col gap-2">
            <div className="flex items-center justify-center gap-2 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-xs font-black text-emerald-400">⚡ Opponent Found! Take your Battle Deck into battle now!</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleWatchBattle}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-[#e8b84b] to-orange-500 hover:from-amber-400 hover:to-orange-400 text-sm font-black text-white shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02]"
              >
                <Swords className="size-4" /> Watch Battle
              </button>
              <button
                onClick={handleSeeResults}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/50 text-sm font-black text-zinc-200 transition-colors"
              >
                See Results
              </button>
            </div>
          </div>
        )}

        {/* ── Phase: result — Victory/Defeat + Play Again + Back to Lobby ── */}
        {phase === 'result' && match && cfg && (
          <div className="px-4 pb-2">
            <div className={cn('flex flex-col items-center gap-2 py-4 rounded-xl border shadow-lg', cfg.bg, cfg.border, cfg.glow)}>
              <p className={cn('text-2xl font-black tracking-widest', cfg.text)}>{cfg.label}</p>
              <p className="text-xs text-zinc-400">{cfg.sublabel}</p>
              <div className="flex items-center gap-2 text-sm mt-0.5">
                <span className="font-black text-white text-lg">{match.playerRoundsWon}</span>
                <span className="text-zinc-600">–</span>
                <span className="font-black text-zinc-400 text-lg">{match.opponentRoundsWon}</span>
                <span className="text-xs text-zinc-600 ml-1">rounds</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={handlePlayAgain}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-gradient-to-r from-[#e8b84b] to-orange-500 hover:from-amber-400 hover:to-orange-400 text-xs font-black text-white transition-all hover:scale-[1.02]"
                >
                  <RotateCcw className="size-3.5" /> Play Again
                </button>
                <button
                  onClick={handleBackToLobby}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/50 text-xs font-bold text-zinc-300 transition-colors"
                >
                  <Home className="size-3.5" /> Back to Lobby
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Phase: idle — Search Opponent button ───────────────────────── */}
        {(phase === 'idle') && (
          <div className="px-4 pb-2">
            {error && (
              <div className="mb-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                {error}
                {error.includes('deck') && (
                  <a href="/play/lineup" className="block mt-1 text-indigo-400 underline" onClick={onClose}>Build your deck →</a>
                )}
              </div>
            )}
            {lineupReady ? (
              <button
                onClick={handleSearch}
                disabled={isPending}
                className={cn(
                  'w-full py-3 rounded-xl font-black text-sm text-white',
                  'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500',
                  'shadow-lg shadow-indigo-500/20 transition-all',
                  isPending && 'opacity-50 cursor-not-allowed',
                )}
              >
                {isPending
                  ? <span className="flex items-center justify-center gap-2"><span className="animate-pulse">⚔</span> Searching Opponent…</span>
                  : 'Search Opponent'}
              </button>
            ) : (
              <a
                href="/play/lineup"
                onClick={onClose}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-black text-sm text-white bg-gradient-to-r from-indigo-600 to-violet-600"
              >
                Build Your Deck First
              </a>
            )}
          </div>
        )}

        {/* ── Win Streak (always visible) ────────────────────────────────── */}
        <div className="px-4 pb-4 pt-2">
          <div className="p-3 rounded-xl bg-[#0c0c1e] border border-white/[0.05]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Win Streak</span>
              <span className="text-[9px] text-zinc-600">Win daily 1v1 Battles to build your streak!</span>
            </div>
            <div className="relative h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-1.5">
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-[#e8b84b] to-orange-500 transition-all duration-700"
                style={{ width: `${(streakProgress / 5) * 100}%` }}
              />
            </div>
            <div className="flex items-center justify-between px-1">
              {STREAK_MILESTONES.map((m) => (
                <div key={m.label} className="flex flex-col items-center gap-0.5">
                  <span className={cn('text-[9px] font-bold', wins >= m.wins ? 'text-[#e8b84b]' : 'text-zinc-700')}>
                    {m.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-white/[0.04]">
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-zinc-500">
                  Battles Won: <span className="font-bold text-white">{wins}</span>
                </span>
                <span className="text-[10px] text-zinc-500">
                  Battles Lost: <span className="font-bold text-zinc-400">{losses}</span>
                </span>
              </div>
              <button className="flex items-center gap-1 text-[10px] font-bold text-[#e8b84b] hover:text-amber-300 transition-colors">
                <Trophy className="size-3" /> Leaderboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
