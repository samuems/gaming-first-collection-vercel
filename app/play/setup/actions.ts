'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'

export async function saveCredentials(formData: FormData): Promise<{ error?: string }> {
  const operatorKey = (formData.get('operatorKey') as string | null)?.trim()
  const playerId = (formData.get('playerId') as string | null)?.trim()

  if (!operatorKey || !playerId) {
    return { error: 'Both fields are required.' }
  }

  // Validate the operator key
  const supabase = createServiceClient()
  const { data: operatorRaw } = await supabase
    .from('operators')
    .select('*')
    .eq('api_key', operatorKey)
    .single()

  const operator = operatorRaw as { id: string; name: string; status: string } | null

  if (!operator) {
    return { error: 'Operator key not found. Check your key and try again.' }
  }

  if (operator.status !== 'active') {
    return { error: `Operator is ${operator.status}. Contact your administrator.` }
  }

  const cookieStore = await cookies()
  const sixMonths = 60 * 60 * 24 * 180

  cookieStore.set('gfc-operator-key', operatorKey, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: sixMonths,
    path: '/',
  })
  cookieStore.set('gfc-player-id', playerId, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: sixMonths,
    path: '/',
  })
  cookieStore.set('gfc-operator-name', operator.name, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: sixMonths,
    path: '/',
  })
  cookieStore.set('gfc-operator-id', operator.id, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: sixMonths,
    path: '/',
  })

  redirect('/play/collection')
}

export async function clearCredentials(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('gfc-operator-key')
  cookieStore.delete('gfc-player-id')
  cookieStore.delete('gfc-operator-name')
  cookieStore.delete('gfc-operator-id')
  redirect('/play/setup')
}
