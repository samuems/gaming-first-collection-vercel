'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'
import type { TournamentStatus } from '@/types/database'

export async function createTournament(
  _prevState: { error: string | null },
  formData: FormData,
): Promise<{ error: string | null }> {
  const name        = (formData.get('name') as string | null)?.trim()
  const operator_id = (formData.get('operator_id') as string | null)?.trim()
  const status      = (formData.get('status') as TournamentStatus | null) ?? 'pending'

  if (!name) {
    return { error: 'Tournament name is required.' }
  }
  if (!operator_id) {
    return { error: 'Please select an operator.' }
  }

  const supabase = createServiceClient()
  const { error } = await (supabase as any)
    .from('tournaments')
    .insert({ name, operator_id, status })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/tournaments')
  return { error: null }
}

export async function setTournamentStatus(
  id: string,
  status: TournamentStatus,
): Promise<void> {
  const supabase = createServiceClient()
  await (supabase as any)
    .from('tournaments')
    .update({ status })
    .eq('id', id)

  revalidatePath('/admin/tournaments')
}
