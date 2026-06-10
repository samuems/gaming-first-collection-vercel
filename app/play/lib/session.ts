import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export interface PlaySession {
  operatorKey: string
  operatorId: string
  operatorName: string
  playerId: string
}

export async function getSession(): Promise<PlaySession | null> {
  const cookieStore = await cookies()
  const operatorKey = cookieStore.get('gfc-operator-key')?.value
  const operatorId = cookieStore.get('gfc-operator-id')?.value
  const operatorName = cookieStore.get('gfc-operator-name')?.value
  const playerId = cookieStore.get('gfc-player-id')?.value

  if (!operatorKey || !operatorId || !operatorName || !playerId) return null
  return { operatorKey, operatorId, operatorName, playerId }
}

export async function requireSession(): Promise<PlaySession> {
  const session = await getSession()
  if (!session) redirect('/play/setup')
  return session
}
