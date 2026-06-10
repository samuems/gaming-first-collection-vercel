import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/service'
import type { Theme } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Layers, Plus, Pencil } from 'lucide-react'
import { createTheme } from './actions'

export const revalidate = 0

export default async function ThemesPage() {
  const supabase = createServiceClient()

  const { data: themesRaw } = await supabase
    .from('themes')
    .select('*')
    .order('created_at', { ascending: true })

  const themes = (themesRaw ?? []) as Theme[]

  // Count unit overrides per theme
  const { data: countRaw } = await supabase
    .from('theme_unit_overrides')
    .select('theme_id')

  const overrideCounts = new Map<string, number>()
  for (const row of (countRaw ?? []) as { theme_id: string }[]) {
    overrideCounts.set(row.theme_id, (overrideCounts.get(row.theme_id) ?? 0) + 1)
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Themes</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Create reusable theme templates. Assign a theme to an operator in{' '}
            <Link href="/admin/theme" className="underline underline-offset-2">
              Theme Configuration
            </Link>
            .
          </p>
        </div>
      </div>

      {/* Theme list */}
      {themes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No themes yet — create one below.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {themes.map((theme) => (
            <Card key={theme.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Layers className="size-4 text-muted-foreground shrink-0" />
                    <CardTitle className="text-sm">{theme.name}</CardTitle>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {overrideCounts.get(theme.id) ?? 0} units
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 flex-1">
                {theme.description && (
                  <p className="text-xs text-muted-foreground">{theme.description}</p>
                )}
                <div className="mt-auto">
                  <Link href={`/admin/themes/${theme.id}`}>
                    <Button variant="outline" size="sm" className="w-full h-7 text-xs gap-1.5">
                      <Pencil className="size-3" /> Edit Unit Overrides
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create new theme */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Plus className="size-4 text-muted-foreground" />
            <CardTitle className="text-sm">New Theme</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form action={createTheme} className="flex flex-col gap-3 max-w-sm">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Name *</label>
              <Input name="name" placeholder="e.g. Football Stars, Fantasy Dragons…" className="h-8 text-sm" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Description</label>
              <Input name="description" placeholder="Optional description…" className="h-8 text-sm" />
            </div>
            <Button type="submit" size="sm" className="w-fit">
              Create & Edit Units
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
