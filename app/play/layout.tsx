import { cookies } from 'next/headers'
import { PlayShell } from './_components/PlayShell'
import { createServiceClient } from '@/lib/supabase/service'
import type { ReactNode } from 'react'

export default async function PlayLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies()
  const playerId   = cookieStore.get('gfc-player-id')?.value    ?? null
  const operatorId = cookieStore.get('gfc-operator-id')?.value  ?? null
  const operatorName = cookieStore.get('gfc-operator-name')?.value ?? null

  let lineupReady = false
  let wins = 0
  let losses = 0

  if (playerId && operatorId) {
    const supabase = createServiceClient()
    const [{ data: lineupRaw }, { data: logsRaw }] = await Promise.all([
      supabase
        .from('lineups')
        .select('slot1,slot2,slot3,slot4,slot5')
        .eq('operator_id', operatorId)
        .eq('player_id', playerId)
        .single(),
      supabase
        .from('battle_logs')
        .select('result')
        .eq('operator_id', operatorId)
        .eq('player_id', playerId)
        .is('tournament_id', null),
    ])
    if (lineupRaw) {
      const lu = lineupRaw as { slot1: unknown; slot2: unknown; slot3: unknown; slot4: unknown; slot5: unknown }
      const filled = [lu.slot1, lu.slot2, lu.slot3, lu.slot4, lu.slot5].filter(Boolean).length
      lineupReady = filled === 5
    }
    const logs = (logsRaw ?? []) as { result: string }[]
    wins   = logs.filter((l) => l.result === 'win').length
    losses = logs.filter((l) => l.result === 'loss').length
  }

  return (
    <PlayShell
      playerId={playerId}
      operatorName={operatorName}
      lineupReady={lineupReady}
      wins={wins}
      losses={losses}
    >
      {children}
    </PlayShell>
  )
}
