import { addDays, endOfMonth, format, isSameDay, isSameMonth, parseISO, startOfMonth, startOfWeek } from 'date-fns'
import { CalendarDays, Clock, Flame, Snowflake, Trophy } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Page } from '@/components/AppShell'
import { LinkButton } from '@/components/ui/Button'
import { addWeeksKey } from '@/engine/dates'
import { countedByWeek, MAX_FREEZES, sessionCounts, WEEKS_PER_FREEZE, type WeekStatus } from '@/engine/streak'
import { useCurrentWeekKey, useProfile, useStreak } from '@/hooks/usePlan'
import { formatClock } from '@/lib/format'
import { useAppStore } from '@/store/useAppStore'

const STATUS_STYLE: Record<WeekStatus | 'none', string> = {
  complete: 'bg-accent text-white',
  frozen: 'bg-primary/70 text-primary-ink',
  missed: 'bg-elev-2 text-muted',
  inProgress: 'border-2 border-dashed border-accent text-ink',
  none: 'bg-elev-2/50 text-muted/50',
}

export default function Progress() {
  const profile = useProfile()
  const streak = useStreak()
  const history = useAppStore((s) => s.history)
  const weekTargets = useAppStore((s) => s.weekTargets)
  const currentWeek = useCurrentWeekKey()
  const [month, setMonth] = useState(() => startOfMonth(new Date()))

  const totals = useMemo(() => {
    const counted = history.filter(sessionCounts)
    return { workouts: counted.length, minutes: Math.round(history.reduce((s, h) => s + h.durationSec, 0) / 60) }
  }, [history])

  const perWeek = useMemo(() => countedByWeek(history), [history])
  const weeks = Array.from({ length: 12 }, (_, i) => addWeeksKey(currentWeek, i - 11))

  if (!streak) return null

  const monthStart = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
  const days = Array.from({ length: 42 }, (_, i) => addDays(monthStart, i)).filter((d, i) => i < 35 || d <= endOfMonth(month))
  const trainedOn = (d: Date) => history.filter((h) => sessionCounts(h) && isSameDay(parseISO(h.completedAt), d)).length

  return (
    <Page className="pb-10">
      <header className="pt-6 pb-5 lg:pt-10">
        <div className="text-sm text-muted">Keep the fire going</div>
        <h1 className="font-display text-5xl leading-none">Progress</h1>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Flame} tone="accent" value={`${streak.current}`} unit={streak.current === 1 ? "week" : "weeks"} label="Current streak" />
        <StatCard icon={Trophy} tone="primary" value={`${streak.best}`} unit={streak.best === 1 ? "week" : "weeks"} label="Best streak" />
        <StatCard icon={CalendarDays} tone="success" value={`${totals.workouts}`} unit={totals.workouts === 1 ? "session" : "sessions"} label="Completed" />
        <StatCard icon={Clock} tone="primary" value={`${totals.minutes}`} unit="min" label="Time trained" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl bg-elev p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-3xl">Weekly streak</h2>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-sm font-semibold text-primary" title="Earn a freeze every 4 completed weeks. A freeze is used automatically if you miss a week.">
              <Snowflake size={15} /> {streak.freezes}/{MAX_FREEZES} freezes
            </div>
          </div>
          <p className="mt-1 text-sm text-muted">
            Hit your weekly target to grow the streak. Every {WEEKS_PER_FREEZE} completed weeks earns a freeze that saves a missed week.
          </p>
          <div className="mt-4 grid grid-cols-6 gap-2 sm:grid-cols-12 lg:grid-cols-6 xl:grid-cols-12">
            {weeks.map((k) => {
              const status: WeekStatus | 'none' = k < profile.planStart ? 'none' : (streak.weeks[k] ?? 'none')
              const target = weekTargets[k] ?? profile.daysPerWeek
              return (
                <div key={k} className="flex flex-col items-center gap-1">
                  <div className={`flex aspect-square w-full items-center justify-center rounded-xl text-xs font-bold ${STATUS_STYLE[status]}`} title={`Week of ${format(parseISO(k), 'MMM d')}`}>
                    {status === 'none' ? '' : status === 'frozen' ? <Snowflake size={14} /> : `${Math.min(perWeek[k] ?? 0, target)}/${target}`}
                  </div>
                  <div className="text-[10px] text-muted">{format(parseISO(k), 'M/d')}</div>
                </div>
              )
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted">
            <Legend className="bg-accent" label="Complete" />
            <Legend className="bg-primary/70" label="Frozen" />
            <Legend className="bg-elev-2" label="Missed" />
            <Legend className="border-2 border-dashed border-accent" label="This week" />
          </div>
        </section>

        <section className="rounded-3xl bg-elev p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-3xl">{format(month, 'MMMM yyyy')}</h2>
            <div className="flex gap-1">
              <button type="button" className="rounded-lg px-2 py-1 text-sm text-muted hover:bg-elev-2" onClick={() => setMonth(startOfMonth(addDays(month, -1)))}>
                ‹
              </button>
              <button type="button" className="rounded-lg px-2 py-1 text-sm text-muted hover:bg-elev-2" onClick={() => setMonth(startOfMonth(addDays(endOfMonth(month), 1)))}>
                ›
              </button>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-7 gap-1.5 text-center text-[11px] font-semibold text-muted uppercase">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <div key={i}>{d}</div>
            ))}
          </div>
          <div className="mt-1.5 grid grid-cols-7 gap-1.5">
            {days.map((d) => {
              const n = trainedOn(d)
              const inMonth = isSameMonth(d, month)
              const today = isSameDay(d, new Date())
              return (
                <div
                  key={d.toISOString()}
                  className={`flex aspect-square items-center justify-center rounded-lg text-sm ${
                    n ? 'bg-accent font-bold text-white' : today ? 'border-2 border-primary' : inMonth ? 'bg-elev-2' : 'opacity-30'
                  }`}
                >
                  {format(d, 'd')}
                </div>
              )
            })}
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-3xl bg-elev p-5 shadow-card">
        <h2 className="font-display text-3xl">Recent sessions</h2>
        {history.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-muted">No sessions yet. Your first one is waiting.</p>
            <LinkButton to="/" className="mt-4">
              Go to today
            </LinkButton>
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {[...history]
              .reverse()
              .slice(0, 20)
              .map((h) => (
                <li key={h.id} className="flex items-center gap-3 py-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${sessionCounts(h) ? 'bg-accent-soft text-accent' : 'bg-elev-2 text-muted'}`}>
                    <Flame size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">
                      {h.title} <span className="text-sm font-normal text-muted">· Session {h.sessionId}</span>
                    </div>
                    <div className="text-sm text-muted">{format(parseISO(h.completedAt), 'EEE, MMM d · HH:mm')}</div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-semibold">{formatClock(h.durationSec)}</div>
                    <div className="text-muted">{Math.round(h.completion * 100)}%</div>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </section>
    </Page>
  )
}

function StatCard({ icon: Icon, value, unit, label, tone }: { icon: typeof Flame; value: string; unit: string; label: string; tone: 'accent' | 'primary' | 'success' }) {
  const toneClass = { accent: 'bg-accent-soft text-accent', primary: 'bg-primary-soft text-primary', success: 'bg-success-soft text-success' }[tone]
  return (
    <div className="rounded-3xl bg-elev p-4 shadow-card">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneClass}`}>
        <Icon size={20} />
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="font-display text-5xl leading-none">{value}</span>
        <span className="text-sm text-muted">{unit}</span>
      </div>
      <div className="text-sm text-muted">{label}</div>
    </div>
  )
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-3 w-3 rounded ${className}`} /> {label}
    </span>
  )
}
