'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home, Shield, LayoutGrid, Swords, ScrollText, Trophy,
  TrendingUp, Gamepad2, Bell, Gift, Users, Menu,
  MessageCircle, HelpCircle, Star, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ArenaModal } from './ArenaModal'

const MAIN_NAV = [
  { href: '/play',            label: 'Lobby',         icon: Home,       exact: true },
  { href: '/play/lineup',     label: 'Battle Deck',   icon: Shield },
  { href: '/play/collection', label: 'My Collection', icon: LayoutGrid },
]

const BATTLE_NAV = [
  { href: '#',         label: 'Battle Arena', icon: Swords,     hot: true,  isArena: true },
  { href: '/play/log', label: 'Battle Log',   icon: ScrollText },
  { href: '#',         label: 'Tournaments',  icon: Trophy,     soon: true },
  { href: '#',         label: 'Leaderboard',  icon: TrendingUp, soon: true },
]

const CASINO_NAV = [
  { href: '#', label: 'Slot Games',   icon: Gamepad2, soon: true },
  { href: '#', label: 'Live Tables',  icon: Star,     soon: true },
]

const BOTTOM_NAV = [
  { href: '#', label: 'Promotions',    icon: Gift,          badge: 3 },
  { href: '#', label: 'Notifications', icon: Bell,          badge: 5 },
  { href: '#', label: 'Loyalty Club',  icon: Users },
  { href: '#', label: 'Live Chat',     icon: MessageCircle },
  { href: '#', label: 'Help Center',   icon: HelpCircle },
]

type NavItem = {
  href: string; label: string; icon: React.ElementType
  hot?: boolean; soon?: boolean; badge?: number; exact?: boolean; isArena?: boolean
}

function NavLink({ item, onClick, onArena }: { item: NavItem; onClick?: () => void; onArena?: () => void }) {
  const pathname = usePathname()
  const active = item.exact
    ? pathname === item.href
    : pathname.startsWith(item.href) && item.href !== '#'

  if (item.soon) {
    return (
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-zinc-700 select-none cursor-default">
        <item.icon className="size-4 shrink-0 opacity-40" />
        <span className="flex-1">{item.label}</span>
        <span className="text-[9px] font-bold text-zinc-800 tracking-wider">SOON</span>
      </div>
    )
  }

  if (item.isArena) {
    return (
      <button
        onClick={() => { onArena?.(); onClick?.() }}
        className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 select-none group text-amber-400 hover:bg-amber-500/8 hover:text-amber-300"
      >
        <item.icon className="size-4 shrink-0 text-amber-400" />
        <span className="flex-1 text-left">{item.label}</span>
        <span className="text-[8px] font-black tracking-wider text-amber-500 bg-amber-500/15 border border-amber-500/25 px-1.5 py-0.5 rounded">HOT</span>
      </button>
    )
  }

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 select-none group',
        active
          ? 'bg-amber-500/10 text-amber-300 font-semibold'
          : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200',
      )}
    >
      {active && <div className="absolute left-0 w-0.5 h-5 bg-amber-400 rounded-r-full" />}
      <item.icon className={cn('size-4 shrink-0', active ? 'text-amber-400' : 'text-zinc-600 group-hover:text-zinc-400')} />
      <span className="flex-1">{item.label}</span>
      {item.badge != null && (
        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white px-1">
          {item.badge}
        </span>
      )}
    </Link>
  )
}

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 px-3 pt-4 pb-1">
      <span className="text-[9.5px] font-black tracking-[0.2em] text-zinc-700 uppercase">{label}</span>
      <div className="flex-1 h-px bg-zinc-800" />
    </div>
  )
}

export function PlayShell({
  playerId,
  operatorName,
  lineupReady,
  wins,
  losses,
  children,
}: {
  playerId: string | null
  operatorName: string | null
  lineupReady: boolean
  wins: number
  losses: number
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [arenaOpen, setArenaOpen] = useState(false)

  if (pathname === '/play/setup') return <>{children}</>

  const initial = playerId ? playerId[0].toUpperCase() : '?'

  return (
    <>
    <ArenaModal
      isOpen={arenaOpen}
      onClose={() => setArenaOpen(false)}
      playerName={playerId ?? 'Player'}
      initialWins={wins}
      initialLosses={losses}
      lineupReady={lineupReady}
    />
    <div className="min-h-screen flex bg-[#0d0d18]">
      {/* ── Sidebar ────────────────────────────────────────────────── */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-[220px] flex flex-col',
          'border-r border-white/[0.05]',
          'transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
        style={{ background: 'linear-gradient(180deg, #0b0b15 0%, #080810 100%)' }}
      >
        {/* Logo */}
        <div className="flex items-center justify-center px-3 py-3 border-b border-white/[0.05]">
          <img src="/Logo/logo.png" alt="Gaming First Collection" className="h-[72px] w-full object-contain object-center" />
        </div>

        {/* Balance */}
        <div className="px-3.5 pt-3.5 pb-3 border-b border-white/[0.05] space-y-2.5">
          {/* MC chip */}
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(232,184,75,0.08)', border: '1px solid rgba(232,184,75,0.2)' }}
            >
              <div className="h-3 w-3 rounded-full bg-emerald-400" />
              <span className="text-[11px] font-black" style={{ color: '#e8b84b' }}>MC</span>
              <span className="text-[13px] font-black text-white">2.00</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-1.5">
            <Link
              href="/play/store"
              className="flex-1 py-2 rounded-xl text-[11.5px] font-black text-white text-center transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(90deg, #e8b84b 0%, #e8701e 100%)', boxShadow: '0 2px 12px rgba(232,184,75,0.2)' }}
            >
              Store
            </Link>
            <button className="flex-1 py-2 rounded-xl text-[11.5px] font-semibold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/60 transition-colors">
              Withdrawal
            </button>
          </div>

          {/* Rank bar */}
          <div className="rounded-xl bg-[#111125] border border-white/[0.05] p-2.5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-zinc-500 to-zinc-700 flex items-center justify-center text-[8px] text-zinc-200">
                  ⬡
                </div>
                <span className="text-[11px] font-black text-zinc-300">IRON</span>
              </div>
              <div className="text-right">
                <p className="text-[8.5px] text-zinc-600">Earn CP 200 for</p>
                <p className="text-[9px] font-black" style={{ color: '#e8a030' }}>BRONZE</p>
              </div>
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full w-[28%] rounded-full bg-gradient-to-r from-zinc-400 to-zinc-300" />
            </div>
          </div>

          {/* Referral */}
          <button
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all hover:opacity-90"
            style={{
              background: 'linear-gradient(90deg, rgba(34,120,40,0.4) 0%, rgba(20,80,25,0.3) 100%)',
              border: '1px solid rgba(34,160,40,0.2)',
            }}
          >
            <div>
              <p className="text-[10px] font-bold text-white text-left">Refer A Friend</p>
              <p className="text-[9px] text-left" style={{ color: 'rgba(100,220,110,0.7)' }}>for up to MC 120</p>
            </div>
            <div className="text-emerald-400 opacity-80">
              <Gift className="size-4" />
            </div>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-2 relative">
          {MAIN_NAV.map((item) => (
            <NavLink key={item.href} item={item} onClick={() => setOpen(false)} />
          ))}

          <Divider label="Card Battle" />
          {BATTLE_NAV.map((item) => (
            <NavLink key={item.label} item={item} onClick={() => setOpen(false)} onArena={() => setArenaOpen(true)} />
          ))}

          <Divider label="Casino" />
          {CASINO_NAV.map((item) => (
            <NavLink key={item.label} item={item} onClick={() => setOpen(false)} />
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-2 py-2 border-t border-white/[0.05]">
          {BOTTOM_NAV.map((item) => (
            <NavLink key={item.label} item={item} onClick={() => setOpen(false)} />
          ))}

          {/* Profile */}
          <div className="flex items-center gap-2.5 px-3 py-2.5 mt-1 rounded-xl border border-white/[0.04] bg-white/[0.02]">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-[11px] font-black text-white shrink-0">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-zinc-300 truncate">{playerId ?? 'Guest'}</p>
              <p className="text-[8.5px] text-zinc-600">{operatorName ?? 'Demo Mode'} · <span className="text-emerald-500">● Online</span></p>
            </div>
            <ChevronRight className="size-3.5 text-zinc-700 shrink-0 ml-auto" />
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 lg:ml-[220px] flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-20 flex items-center gap-3 px-4 h-12 bg-[#0b0b15]/95 border-b border-white/[0.05] backdrop-blur-md">
          <button onClick={() => setOpen(true)} className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 hover:text-white hover:bg-white/10">
            <Menu className="size-4" />
          </button>
          <img src="/Logo/logo.png" alt="Gaming First Collection" className="h-7 object-contain object-left" />
          {playerId && (
            <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/[0.08]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] font-semibold text-zinc-300">{playerId}</span>
            </div>
          )}
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
    </>
  )
}
