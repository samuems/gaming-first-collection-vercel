'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'

export async function upsertOverride(formData: FormData): Promise<void> {
  const operatorId = (formData.get('operatorId') as string | null)?.trim()
  const unitId = (formData.get('unitId') as string | null)?.trim()
  const nameOverride = (formData.get('nameOverride') as string | null)?.trim() ?? ''
  const imageOverride = (formData.get('imageOverride') as string | null)?.trim() ?? ''

  if (!operatorId || !unitId) return

  const supabase = createServiceClient()

  // If both overrides are empty, delete any existing override
  if (nameOverride === '' && imageOverride === '') {
    await (supabase as any)
      .from('operator_unit_overrides')
      .delete()
      .eq('operator_id', operatorId)
      .eq('unit_id', unitId)

    revalidatePath('/admin/theme')
    return
  }

  // Upsert: use onConflict on (operator_id, unit_id)
  await (supabase as any)
    .from('operator_unit_overrides')
    .upsert(
      {
        operator_id: operatorId,
        unit_id: unitId,
        name_override: nameOverride || null,
        image_override: imageOverride || null,
      },
      { onConflict: 'operator_id,unit_id' },
    )

  revalidatePath('/admin/theme')
}
