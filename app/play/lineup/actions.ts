'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/service'

export async function saveLineup(slots: (string | null)[]): Promise<{ error?: string }> {
  const cookieStore = await cookies()
  const operatorId = cookieStore.get('gfc-operator-id')?.value
  const playerId = cookieStore.get('gfc-player-id')?.value

  if (!operatorId || !playerId) return { error: 'Not authenticated.' }
  if (slots.length !== 5) return { error: 'Must have exactly 5 slots.' }

  const filledSlots = slots.filter(Boolean) as string[]
  const uniqueIds = new Set(filledSlots)
  if (uniqueIds.size !== filledSlots.length) return { error: 'Duplicate units in lineup.' }

  const supabase = createServiceClient()

  const row = {
    operator_id: operatorId,
    player_id: playerId,
    slot1: slots[0] ?? null,
    slot2: slots[1] ?? null,
    slot3: slots[2] ?? null,
    slot4: slots[3] ?? null,
    slot5: slots[4] ?? null,
    locked: false,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('lineups')
    .upsert(row, { onConflict: 'operator_id,player_id' })

  if (error) return { error: 'Failed to save lineup.' }

  revalidatePath('/play/lineup')
  return {}
}
