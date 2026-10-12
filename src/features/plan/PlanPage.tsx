import { format, parseISO } from 'date-fns'
import { ChevronLeft, ChevronRight, Feather } from 'lucide-react'
import { useState } from 'react'
import { Page } from '@/components/AppShell'
import { PHASE_COLORS, PhaseTimeline } from '@/components/PhaseTimeline'
import { SessionCard } from '@/components/SessionCard'
import { addWeeksKey } from '@/engine/dates'
import { phaseFor, PHASE_META } from '@/engine/phases'
import { useCompletedIds, useCurrentWeekKey, useProfile, useWeekPlan } from '@/hooks/usePlan'

export default function PlanPage() {
  const profile = useProfile()
  const current = useCurrentWeekKey()
  const [weekKey, setWeekKey] = useState(current)
  const plan = useWeekPlan(weekKey)
  const done = useCompletedIds(weekKey)
  const info = phaseFor(profile, weekKey)
  const currentInfo = phaseFor(profile, current)
  const canGoBack = weekKey > profile.planStart
  const offset = Math.round((parseISO(weekKey).getTime() - parseISO(current).getTime()) / (7 * 864e5))

  if (!plan) return null
  return (
    <Page className="pb-8">
      <header className="pt-6 pb-5 lg:pt-10">
        <div className="text-sm text-muted">Your program</div>
        <h1 className="font-display text-5xl leading-none">Training Plan</h1>
      </header>

      <section className="rounded-3xl bg-elev p-5 shadow-card sm:p-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
          <div>
            <div className="text-xs font-semibold tracking-wide text-muted uppercase">Current phase</div>
            <div className="font-display text-4xl leading-none" style={{ color: PHASE_COLORS[currentInfo.phase] }}>
              {PHASE_META[currentInfo.phase].name}
            </div>
          </div>
          <div className="text-sm text-muted">
            {profile.seasonStart ? `Season starts ${format(parseISO(profile.seasonStart), 'MMM d, yyyy')}` : 'Rolling 12-week cycle'}
          </div>
        </div>
        <PhaseTimeline profile={profile} info={currentInfo} />
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={!canGoBack}
            onClick={() => setWeekKey(addWeeksKey(weekKey, -1))}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-elev shadow-card disabled:opacity-30"
            aria-label="Previous week"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="text-center">
            <div className="font-display text-3xl leading-none">
              {offset === 0 ? 'This week' : offset === 1 ? 'Next week' : offset === -1 ? 'Last week' : `Week of ${format(parseISO(weekKey), 'MMM d')}`}
            </div>
            <div className="mt-1 text-sm text-muted">
              {PHASE_META[info.phase].name} · week {info.phaseWeek}
              {info.isDeload && (
                <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-xs font-semibold text-success">
                  <Feather size={11} /> Lighter week
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setWeekKey(addWeeksKey(weekKey, 1))}
            disabled={offset >= 8}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-elev shadow-card disabled:opacity-30"
            aria-label="Next week"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        <p className="mx-auto mb-5 max-w-xl text-center text-sm text-muted">{PHASE_META[info.phase].blurb}</p>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plan.sessions.map((s) => (
            <SessionCard key={s.id} variant="hero" session={s} weekKey={weekKey} done={done.has(s.id)} />
          ))}
        </div>
      </section>
    </Page>
  )
}
