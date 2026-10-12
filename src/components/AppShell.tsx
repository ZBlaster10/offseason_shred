import { CalendarDays, Home, TrendingUp, User } from 'lucide-react'
import { NavLink, Outlet } from 'react-router'
import { useStreak } from '@/hooks/usePlan'
import { Logo } from './Scenery'
import { StreakBadge } from './Streak'

const NAV = [
  { to: '/', label: 'Today', icon: Home, end: true },
  { to: '/plan', label: 'Plan', icon: CalendarDays, end: false },
  { to: '/progress', label: 'Progress', icon: TrendingUp, end: false },
  { to: '/profile', label: 'Profile', icon: User, end: false },
]

export function AppShell() {
  const streak = useStreak()
  return (
    <div className="min-h-dvh lg:flex">
      {/* Side rail (tablet landscape / desktop) */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-elev/60 px-4 py-6 backdrop-blur lg:flex">
        <div className="px-2">
          <Logo />
        </div>
        <nav className="mt-8 flex flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium transition ${isActive ? 'bg-primary-soft text-primary' : 'text-muted hover:bg-elev-2 hover:text-ink'}`
              }
            >
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
        </nav>
        {streak && (
          <div className="mt-auto rounded-2xl bg-elev-2 p-4">
            <div className="text-xs font-semibold tracking-wide text-muted uppercase">Weekly streak</div>
            <div className="mt-2 flex items-center justify-between">
              <StreakBadge weeks={streak.current} />
              <span className="text-sm text-muted">
                {streak.thisWeek.done}/{streak.thisWeek.target} this week
              </span>
            </div>
          </div>
        )}
      </aside>

      <main className="min-w-0 flex-1 pb-[calc(76px+env(safe-area-inset-bottom))] lg:pb-10">
        <Outlet />
      </main>

      {/* Bottom tab bar (phones / tablet portrait) */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-elev/85 pb-safe backdrop-blur-lg lg:hidden">
        <div className="mx-auto grid max-w-xl grid-cols-4">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition ${isActive ? 'text-primary' : 'text-muted'}`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`flex h-8 w-14 items-center justify-center rounded-full transition ${isActive ? 'bg-primary-soft' : ''}`}>
                    <Icon size={21} />
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}

/** Standard page container with consistent gutters. */
export function Page({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-4 pt-safe sm:px-6 lg:px-10 ${className}`}>{children}</div>
}
