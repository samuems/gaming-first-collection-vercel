import { createServiceClient } from '@/lib/supabase/service'
import type { Affinity } from '@/types/database'

export type OverrideEntry = { name: string | null; image: string | null }
export type OverrideMap   = Map<string, OverrideEntry>

/** Maps original affinity name → theme-specific label. Missing = use original. */
export type AffinityLabelMap = Map<Affinity, string>

type Row = { unit_id: string; name_override: string | null; image_override: string | null }

/**
 * Builds the effective name/image override map for an operator.
 * Priority: manual operator_unit_overrides > theme_unit_overrides > unit default
 */
export async function buildOverrideMap(
  supabase: ReturnType<typeof createServiceClient>,
  operatorId: string,
  themeId: string | null | undefined,
): Promise<OverrideMap> {
  const map = new Map<string, OverrideEntry>()

  // 1. Theme overrides (lower priority — applied first)
  if (themeId) {
    const { data } = await supabase
      .from('theme_unit_overrides')
      .select('unit_id, name_override, image_override')
      .eq('theme_id', themeId)
    for (const o of (data ?? []) as Row[]) {
      map.set(o.unit_id, { name: o.name_override, image: o.image_override })
    }
  }

  // 2. Manual overrides (higher priority — overwrite theme values per field)
  const { data } = await supabase
    .from('operator_unit_overrides')
    .select('unit_id, name_override, image_override')
    .eq('operator_id', operatorId)
  for (const o of (data ?? []) as Row[]) {
    const existing = map.get(o.unit_id)
    map.set(o.unit_id, {
      name:  o.name_override  ?? existing?.name  ?? null,
      image: o.image_override ?? existing?.image ?? null,
    })
  }

  return map
}

/**
 * Returns a map from original affinity name to theme label.
 * If a theme has no label for an affinity, it won't be in the map (caller falls back to original).
 */
export async function buildAffinityLabelMap(
  supabase: ReturnType<typeof createServiceClient>,
  themeId: string | null | undefined,
): Promise<AffinityLabelMap> {
  const map = new Map<Affinity, string>()
  if (!themeId) return map

  const { data } = await supabase
    .from('theme_affinity_overrides')
    .select('affinity, label')
    .eq('theme_id', themeId)

  for (const row of (data ?? []) as { affinity: string; label: string }[]) {
    map.set(row.affinity as Affinity, row.label)
  }

  return map
}
