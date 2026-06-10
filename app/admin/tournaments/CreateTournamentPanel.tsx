'use client'

import * as React from 'react'
import { useActionState } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Operator } from '@/types/database'
import { createTournament } from './actions'

interface CreateTournamentPanelProps {
  operators: Pick<Operator, 'id' | 'name'>[]
}

const initialState = { error: null as string | null }

export function CreateTournamentPanel({ operators }: CreateTournamentPanelProps) {
  const [open, setOpen] = React.useState(false)
  const [state, formAction, pending] = useActionState(createTournament, initialState)
  const [submitted, setSubmitted] = React.useState(false)

  React.useEffect(() => {
    if (!pending && submitted && state.error === null) {
      setOpen(false)
      setSubmitted(false)
    }
  }, [pending, submitted, state.error])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button className="gap-2 shrink-0" />}>
        <Plus className="size-4" />
        New Tournament
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <SheetTitle>New Tournament</SheetTitle>
        </SheetHeader>

        <form
          action={formAction}
          onSubmit={() => setSubmitted(true)}
          className="flex flex-col gap-5 px-6 py-6"
        >
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="t-name" className="text-sm font-medium">
              Tournament name
            </label>
            <Input
              id="t-name"
              name="name"
              placeholder="e.g. Summer Showdown"
              required
              autoComplete="off"
            />
          </div>

          {/* Operator */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="t-operator" className="text-sm font-medium">
              Operator
            </label>
            <Select name="operator_id">
              <SelectTrigger id="t-operator" className="w-full">
                <SelectValue placeholder="Select operator" />
              </SelectTrigger>
              <SelectContent>
                {operators.length === 0 ? (
                  <SelectItem value="__none__" disabled>
                    No operators available
                  </SelectItem>
                ) : (
                  operators.map((op) => (
                    <SelectItem key={op.id} value={op.id}>
                      {op.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="t-status" className="text-sm font-medium">
              Initial status
            </label>
            <Select name="status" defaultValue="pending">
              <SelectTrigger id="t-status" className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Error */}
          {state.error && (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          )}

          {/* Submit */}
          <Button
            type="submit"
            disabled={pending || operators.length === 0}
            className="gap-2 mt-1"
          >
            {pending && <Loader2 className="size-4 animate-spin" />}
            {pending ? 'Creating…' : 'Create Tournament'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
