import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/service'
import type { Operator, Unit, OperatorUnitOverride } from '@/types/database'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CheckCircle2, Palette } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { upsertOverride } from './actions'

export const revalidate = 0

const invariants = [
  '5-unit lineups',
  '9 affinities + matrix bonuses',
  'Duplicate-based level-up',
  '5-round deterministic battles',
  'Win-3-of-5 condition',
  'Chest drop-rate tables',
]

export default async function ThemePage({
  searchParams,
}: {
  searchParams: Promise<{ operatorId?: string }>
}) {
  const { operatorId } = await searchParams

  const supabase = createServiceClient()

  // Fetch all operators
  const { data: operatorsData } = await supabase
    .from('operators')
    .select('*')
    .order('created_at', { ascending: true })

  const operators = (operatorsData ?? []) as Operator[]

  // Resolve selected operator — default to first
  const selectedOperator =
    operators.find((o) => o.id === operatorId) ?? operators[0] ?? null

  // Fetch all units
  const { data: unitsData } = await supabase
    .from('units')
    .select('*')
    .order('rarity')
    .order('name')

  const units = (unitsData ?? []) as Unit[]

  // Fetch overrides for selected operator
  let overrides: OperatorUnitOverride[] = []
  if (selectedOperator) {
    const { data: overridesData } = await supabase
      .from('operator_unit_overrides')
      .select('*')
      .eq('operator_id', selectedOperator.id)

    overrides = (overridesData ?? []) as OperatorUnitOverride[]
  }

  const overrideMap = new Map<string, OperatorUnitOverride>(
    overrides.map((o) => [o.unit_id, o]),
  )

  const overrideCount = overrides.length

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Theme Configuration
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Override unit names and images per operator. Core mechanics never
          change. Both fields empty and save = remove override.
        </p>
      </div>

      {/* Operator selector */}
      {operators.length > 0 ? (
        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Select Operator
          </h2>
          <div className="flex flex-wrap gap-2">
            {operators.map((op) => {
              const isActive = op.id === selectedOperator?.id
              return (
                <Link
                  key={op.id}
                  href={`/admin/theme?operatorId=${op.id}`}
                  className={cn(
                    buttonVariants({ variant: isActive ? 'default' : 'outline', size: 'sm' }),
                    'h-8 text-xs',
                  )}
                >
                  {op.name}
                </Link>
              )
            })}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No operators found. Create an operator first.
        </p>
      )}

      {/* What never changes */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-primary" />
            <CardTitle className="text-sm">
              What never changes (invariants)
            </CardTitle>
          </div>
          <CardDescription className="text-xs">
            These mechanics are the same regardless of operator theme.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {invariants.map((inv) => (
              <Badge key={inv} variant="outline" className="text-xs font-normal">
                {inv}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Override table */}
      {selectedOperator ? (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Palette className="size-4 text-muted-foreground" />
              <CardTitle className="text-sm">
                Unit Overrides — {selectedOperator.name}
              </CardTitle>
              <Badge variant="outline" className="ml-auto text-xs">
                {overrideCount} override{overrideCount !== 1 ? 's' : ''} active
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Leave both fields empty and save to remove an override. Changes
              take effect immediately.
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
                {units.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground py-10 text-sm"
                    >
                      No units found.
                    </TableCell>
                  </TableRow>
                ) : (
                  units.map((unit) => {
                    const override = overrideMap.get(unit.id)
                    const displayImage = override?.image_override ?? unit.image

                    // Each row is its own form — valid HTML, one form per row
                    return (
                      <TableRow key={unit.id}>
                        {/* Image preview */}
                        <TableCell>
                          <img
                            src={displayImage ?? ''}
                            alt={unit.name}
                            className="w-10 h-10 rounded object-cover bg-zinc-800"
                          />
                        </TableCell>

                        {/* Global name */}
                        <TableCell className="font-medium text-sm">
                          {unit.name}
                        </TableCell>

                        {/* Override name input — form wraps all 3 remaining cells via form= attribute pattern */}
                        <TableCell>
                          <form
                            id={`override-form-${unit.id}`}
                            action={upsertOverride}
                            className="hidden"
                          >
                            <input
                              type="hidden"
                              name="operatorId"
                              value={selectedOperator.id}
                            />
                            <input
                              type="hidden"
                              name="unitId"
                              value={unit.id}
                            />
                          </form>
                          <Input
                            form={`override-form-${unit.id}`}
                            name="nameOverride"
                            defaultValue={override?.name_override ?? ''}
                            placeholder="Override name..."
                            className="h-7 text-xs w-36"
                          />
                        </TableCell>

                        {/* Override image URL input */}
                        <TableCell>
                          <Input
                            form={`override-form-${unit.id}`}
                            name="imageOverride"
                            defaultValue={override?.image_override ?? ''}
                            placeholder="Override image URL..."
                            className="h-7 text-xs w-52"
                          />
                        </TableCell>

                        {/* Submit button */}
                        <TableCell className="text-right">
                          <Button
                            form={`override-form-${unit.id}`}
                            type="submit"
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                          >
                            Save
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
