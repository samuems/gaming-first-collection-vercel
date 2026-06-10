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
import { createOperator } from './actions'

const initialState = { error: null as string | null }

export function CreateOperatorPanel() {
  const [open, setOpen] = React.useState(false)
  const [state, formAction, pending] = useActionState(createOperator, initialState)

  // Close the sheet on successful creation
  const prevError = React.useRef<string | null>(null)
  React.useEffect(() => {
    if (!pending && state.error === null && prevError.current !== null) {
      setOpen(false)
    }
    prevError.current = state.error
  }, [pending, state.error])

  // Track first submission so we know when to close
  const [submitted, setSubmitted] = React.useState(false)
  React.useEffect(() => {
    if (!pending && submitted && state.error === null) {
      setOpen(false)
      setSubmitted(false)
    }
  }, [pending, submitted, state.error])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button className="gap-2 shrink-0" />}
      >
        <Plus className="size-4" />
        New Operator
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <SheetTitle>New Operator</SheetTitle>
        </SheetHeader>

        <form
          action={formAction}
          onSubmit={() => setSubmitted(true)}
          className="flex flex-col gap-5 px-6 py-6"
        >
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="op-name" className="text-sm font-medium">
              Name
            </label>
            <Input
              id="op-name"
              name="name"
              placeholder="e.g. Acme Casino"
              required
              autoComplete="off"
            />
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="op-status" className="text-sm font-medium">
              Initial status
            </label>
            <Select name="status" defaultValue="draft">
              <SelectTrigger id="op-status" className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Error message */}
          {state.error && (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          )}

          {/* Submit */}
          <Button type="submit" disabled={pending} className="gap-2 mt-1">
            {pending && <Loader2 className="size-4 animate-spin" />}
            {pending ? 'Creating…' : 'Create Operator'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
