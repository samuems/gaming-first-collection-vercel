'use client'

import { useRouter } from 'next/navigation'
import { BattleReplay } from '@/app/play/arena/BattleReplay'
import type { BattleRound, BattleResult } from '@/types/database'
import type { UnitMeta } from '@/app/play/arena/actions'

export function WatchClient({
  playerName,
  opponentName,
  result,
  rounds,
  unitMeta,
  playerRoundsWon,
  opponentRoundsWon,
}: {
  playerName: string
  opponentName: string
  result: BattleResult
  rounds: BattleRound[]
  unitMeta: Record<string, UnitMeta>
  playerRoundsWon: number
  opponentRoundsWon: number
}) {
  const router = useRouter()

  return (
    <BattleReplay
      playerName={playerName}
      opponentName={opponentName}
      result={result}
      rounds={rounds}
      unitMeta={unitMeta}
      playerRoundsWon={playerRoundsWon}
      opponentRoundsWon={opponentRoundsWon}
      onClose={() => router.push('/play')}
      inPage
    />
  )
}
