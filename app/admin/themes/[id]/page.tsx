import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import type { Theme, Unit, ThemeUnitOverride, ThemeAffinityOverride, Affinity } from '@/types/database'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Layers, Save, Tag } from 'lucide-react'
import { upsertThemeOverride, updateThemeMeta, deleteTheme, upsertAffinityLabel } from '../actions'

export const revalidate = 0

const ALL_AFFINITIES: Affinity[] = ['Lightning', 'Air', 'Earth', 'Water', 'Fire', 'Ice', 'Nature', 'Light', 'Shadow']

export default async function ThemeEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = createServiceClient()

  const [{ data: themeRaw }, { data: unitsRaw }, { data: overridesRaw }, { data: affRaw }] = await Promise.all([
    supabase.from('themes').select('*').eq('id', id).single(),
    supabase.from('units').select('*').order('rarity').order('name'),
    supabase.from('theme_unit_overrides').select('*').eq('theme_id', id),
    supabase.from('theme_affinity_overrides').select('*').eq('theme_id', id),
  ])

  if (!themeRaw) notFound()

  const theme    = themeRaw as Theme
  const units    = (unitsRaw    ?? []) as Unit[]
  const overrides = (overridesRaw ?? []) as ThemeUnitOverride[]
  const affOverrides = (affRaw ?? []) as ThemeAffinityOverride[]

  const overrideMap = new Map<string, ThemeUnitOverride>()
  for (const o of overrides) overrideMap.set(o.unit_id, o)

  const affLabelMap = new Map<string, string>()
  for (const a of affOverrides) affLabelMap.set(a.affinity, a.label)

  const deleteWithId = deleteTheme.bind(null, id)

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Theme</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Set the name and image overrides for each unit in this theme.
          </p>
        </div>
        <form action={deleteWithId}>
          <Button type="submit" variant="destructive" size="sm" className="h-7 text-xs">
            Delete Theme
          </Button>
        </form>
      </div>

      {/* Theme meta */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Theme Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateThemeMeta} className="flex items-end gap-3">
            <input type="hidden" name="themeId" value={id} />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Name</label>
              <Input name="name" defaultValue={theme.name} className="h-8 text-sm w-52" required />
            </div>
            <div className="flex flex-col gap-1.5 flex-1 max-w-xs">
              <label className="text-xs font-medium text-muted-foreground">Description</label>
              <Input name="description" defaultValue={theme.description ?? ''} placeholder="Optional…" className="h-8 text-sm" />
            </div>
            <Button type="submit" size="sm" className="h-8 gap-1.5 shrink-0">
              <Save className="size-3.5" /> Save
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Affinity label overrides */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Tag className="size-4 text-muted-foreground" />
            <CardTitle className="text-sm">Affinity Labels</CardTitle>
            <Badge variant="outline" className="ml-auto text-xs">
              {affOverrides.length} of {ALL_AFFINITIES.length} renamed
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Rename affinities for this theme (e.g. Lightning → Quarterback). Leave blank to keep the original.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Original</TableHead>
                <TableHead>Label in this theme</TableHead>
                <TableHead className="text-right w-20">Save</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ALL_AFFINITIES.map((aff) => (
                <TableRow key={aff}>
                  <TableCell className="font-medium text-sm">{aff}</TableCell>
                  <TableCell>
                    <form id={`aff-form-${aff}`} action={upsertAffinityLabel} className="hidden">
                      <input type="hidden" name="themeId"  value={id} />
                      <input type="hidden" name="affinity" value={aff} />
                    </form>
                    <Input
                      form={`aff-form-${aff}`}
                      name="label"
                      defaultValue={affLabelMap.get(aff) ?? ''}
                      placeholder={`e.g. ${aff}…`}
                      className="h-7 text-xs w-40"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button form={`aff-form-${aff}`} type="submit" variant="outline" size="sm" className="h-7 text-xs">
                      Save
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Unit overrides */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-muted-foreground" />
            <CardTitle className="text-sm">Unit Overrides</CardTitle>
            <Badge variant="outline" className="ml-auto text-xs">
              {overrides.length} of {units.length} overridden
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Leave both fields empty and save to remove the override for that unit.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14">Image</TableHead>
                <TableHead>Global Name</TableHead>
                <TableHead>Override Name</TableHead>
                <TableHead>Override Image URL</TableHead>
                <TableHead className="text-right w-20">Save</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {units.map((unit) => {
                const override = overrideMap.get(unit.id)
                const displayImage = override?.image_override ?? unit.image
                return (
                  <TableRow key={unit.id}>
                    <TableCell>
                      <img
                        src={displayImage ?? ''}
                        alt={unit.name}
                        className="w-10 h-10 rounded object-cover bg-zinc-800"
                      />
                    </TableCell>
                    <TableCell className="font-medium text-sm">{unit.name}</TableCell>

                    {/* Hidden form fields */}
                    <TableCell>
                      <form id={`tf-${unit.id}`} action={upsertThemeOverride} className="hidden">
                        <input type="hidden" name="themeId" value={id} />
                        <input type="hidden" name="unitId"  value={unit.id} />
                      </form>
                      <Input
                        form={`tf-${unit.id}`}
                        name="nameOverride"
                        defaultValue={override?.name_override ?? ''}
                        placeholder="Override name…"
                        className="h-7 text-xs w-36"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        form={`tf-${unit.id}`}
                        name="imageOverride"
                        defaultValue={override?.image_override ?? ''}
                        placeholder="Override image URL…"
                        className="h-7 text-xs w-52"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button form={`tf-${unit.id}`} type="submit" variant="outline" size="sm" className="h-7 text-xs">
                        Save
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
