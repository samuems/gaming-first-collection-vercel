import { cookies } from 'next/headers'
import { PlayShell } from './_components/PlayShell'
import type { ReactNode } from 'react'

export default async function PlayLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies()
  const playerId = cookieStore.get('gfc-player-id')?.value ?? null
  const operatorName = cookieStore.get('gfc-operator-name')?.value ?? null

  return (
    <PlayShell playerId={playerId} operatorName={operatorName}>
      {children}
    </PlayShell>
  )
}
