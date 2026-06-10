'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'

export async function createTheme(formData: FormData): Promise<void> {
  const name        = (formData.get('name') as string | null)?.trim()
  const description = (formData.get('description') as string | null)?.trim() || null
  if (!name) return

  const supabase = createServiceClient()
  const { data } = await (supabase as any)
    .from('themes')
    .insert({ name, description })
    .select('id')
    .single()

  revalidatePath('/admin/themes')
  if (data?.id) redirect(`/admin/themes/${data.id}`)
}

export async function updateThemeMeta(formData: FormData): Promise<void> {
  const themeId     = (formData.get('themeId') as string | null)?.trim()
  const name        = (formData.get('name') as string | null)?.trim()
  const description = (formData.get('description') as string | null)?.trim() || null
  if (!themeId || !name) return

  const supabase = createServiceClient()
  await (supabase as any)
    .from('themes')
    .update({ name, description })
    .eq('id', themeId)

  revalidatePath('/admin/themes')
  revalidatePath(`/admin/themes/${themeId}`)
}

export async function deleteTheme(themeId: string): Promise<void> {
  const supabase = createServiceClient()
  await (supabase as any).from('themes').delete().eq('id', themeId)
  revalidatePath('/admin/themes')
  redirect('/admin/themes')
}

export async function upsertAffinityLabel(formData: FormData): Promise<void> {
  const themeId  = (formData.get('themeId')  as string | null)?.trim()
  const affinity = (formData.get('affinity') as string | null)?.trim()
  const label    = (formData.get('label')    as string | null)?.trim() ?? ''
  if (!themeId || !affinity) return

  const supabase = createServiceClient()

  if (label === '') {
    await (supabase as any)
      .from('theme_affinity_overrides')
      .delete()
      .eq('theme_id', themeId)
      .eq('affinity', affinity)
  } else {
    await (supabase as any)
      .from('theme_affinity_overrides')
      .upsert({ theme_id: themeId, affinity, label }, { onConflict: 'theme_id,affinity' })
  }

  revalidatePath(`/admin/themes/${themeId}`)
}

export async function upsertThemeOverride(formData: FormData): Promise<void> {
  const themeId      = (formData.get('themeId') as string | null)?.trim()
  const unitId       = (formData.get('unitId') as string | null)?.trim()
  const nameOverride  = (formData.get('nameOverride') as string | null)?.trim() ?? ''
  const imageOverride = (formData.get('imageOverride') as string | null)?.trim() ?? ''
  if (!themeId || !unitId) return

  const supabase = createServiceClient()

  if (nameOverride === '' && imageOverride === '') {
    await (supabase as any)
      .from('theme_unit_overrides')
      .delete()
      .eq('theme_id', themeId)
      .eq('unit_id', unitId)
  } else {
    await (supabase as any)
      .from('theme_unit_overrides')
      .upsert(
        {
          theme_id:       themeId,
          unit_id:        unitId,
          name_override:  nameOverride  || null,
          image_override: imageOverride || null,
        },
        { onConflict: 'theme_id,unit_id' },
      )
  }

  revalidatePath(`/admin/themes/${themeId}`)
}
