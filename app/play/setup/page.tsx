'use client'

import { useActionState } from 'react'
import { saveCredentials } from './actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Swords, KeyRound, User } from 'lucide-react'

export default function SetupPage() {
  const [state, action, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      return saveCredentials(formData)
    },
    null,
  )

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.15)_0%,transparent_70%)] pointer-events-none" />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-500/30">
            <Swords className="size-8 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black tracking-tight text-white">
              Battle Arena
            </h1>
            <p className="text-sm text-zinc-400 mt-1">Enter your credentials to play</p>
          </div>
        </div>

        {/* Form */}
        <form action={action} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Operator API Key
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
              <Input
                name="operatorKey"
                placeholder="x-operator-key"
                className="pl-9 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 h-10"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Player ID
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
              <Input
                name="playerId"
                placeholder="your-player-id"
                className="pl-9 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 h-10"
                autoComplete="off"
              />
            </div>
          </div>

          {state?.error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {state.error}
            </p>
          )}

          <Button
            type="submit"
            disabled={pending}
            className="h-11 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold mt-2"
          >
            {pending ? 'Connecting…' : 'Enter Arena'}
          </Button>
        </form>

        <p className="text-center text-xs text-zinc-600 mt-6">
          Get your operator key from the Back Office → Operators page
        </p>
      </div>
    </div>
  )
}
