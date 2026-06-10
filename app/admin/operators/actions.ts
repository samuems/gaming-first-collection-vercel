'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'
import type { OperatorStatus } from '@/types/database'

export async function createOperator(
  _prevState: { error: string | null },
  formData: FormData,
): Promise<{ error: string | null }> {
  const name = (formData.get('name') as string | null)?.trim()
  const status = (formData.get('status') as OperatorStatus | null) ?? 'draft'

  if (!name) {
    return { error: 'Name is required.' }
  }

  const supabase = createServiceClient()
  const { error } = await (supabase as any)
    .from('operators')
    .insert({ name, status })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/operators')
  return { error: null }
}

export async function setOperatorStatus(
  id: string,
  status: OperatorStatus,
): Promise<void> {
  const supabase = createServiceClient()
  await (supabase as any)
    .from('operators')
    .update({ status })
    .eq('id', id)

  revalidatePath('/admin/operators')
}
