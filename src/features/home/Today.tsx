import { differenceInCalendarDays, format, parseISO } from 'date-fns'
import { AlertTriangle, ChevronRight, Lightbulb, PartyPopper, PlayCircle, Snowflake } from 'lucide-react'
import { Link } from 'react-router'
import { Page } from '@/components/AppShell'
import { SessionCard } from '@/components/SessionCard'
import { StreakBadge, WeekStrip } from '@/components/Streak'
import { LinkButton } from '@/components/ui/Button'
import { EXERCISE_MAP } from '@/data/exercises'
import { phaseFor, PHASE_META } from '@/engine/phases'
import { useCompletedIds, useCurrentWeekKey, useProfile, useStreak, useWeekPlan } from '@/hooks/usePlan'
import { PHOTOS } from '@/lib/photos'
import { useAppStore } from '@/store/useAppStore'

function greeting() {
  const h = new Date().getHours()
  if (h < 5) return 'Late session?'
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function Today() {
  const profile = useProfile()
  const weekKey = useCurrentWeekKey()
  const plan = useWeekPlan(weekKey)
  const streak = useStreak()
  const done = useCompletedIds(weekKey)
  const history = useAppStore((s) => s.history)
  const active = useAppStore((s) => s.active)
  if (!plan || !streak) return null

  const next = plan.sessions.find((s) => !done.has(s.id))
  const info = phaseFor(profile, weekKey)
  const tipItem = (next ?? plan.sessions[0]).blocks.find((b) => b.type !== 'warmup')?.items[0]
  const tip = tipItem ? EXERCISE_MAP[tipItem.exerciseId] : null
  const daysToSeason = profile.seasonStart ? differenceInCalendarDays(parseISO(profile.seasonStart), new Date()) : null
  const remaining = Math.max(0, streak.thisWeek.target - streak.thisWeek.done)

  return (
    <Page className="pb-6">
      <header className="flex items-center justify-between gap-4 pt-6 pb-5 lg:pt-10">
        <div>
          <div className="text-sm text-muted">{format(new Date(), 'EEEE, MMM d')}</div>
          <h1 className="font-display text-5xl leading-none">{greeting()}</h1>
        </div>
        <StreakBadge weeks={streak.current} className="lg:hidden" />
      </header>

      {active && (
        <Link
          to={`/workout/${active.weekKey}/${active.sessionId}`}
          className="mb-5 flex items-center gap-3 rounded-2xl bg-primary-soft p-4 text-primary transition hover:brightness-110"
        >
          <PlayCircle size={26} />
          <div className="flex-1">
            <div className="font-semibold">Workout in progress</div>
            <div className="text-sm opacity-80">Pick up where you left off</div>
          </div>
          <ChevronRight size={20} />
        </Link>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <section className="min-w-0">
          <h2 className="mb-3 text-sm font-semibold tracking-wide text-muted uppercase">{next ? 'Up next' : 'Week complete'}</h2>
          {next ? (
            <SessionCard variant="hero" session={next} weekKey={weekKey} />
          ) : (
            <div className="relative overflow-hidden rounded-3xl shadow-card">
              <img src={PHOTOS.air} alt="" className="h-64 w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#06111f] via-[#06111f]/50 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <PartyPopper size={28} className="text-accent" />
                <div className="mt-2 font-display text-5xl leading-none">All sessions done!</div>
                <div className="mt-1 text-sm text-white/80">Streak secured for this week. Extra sessions still count toward your totals.</div>
              </div>
            </div>
          )}

          <h2 className="mt-8 mb-3 text-sm font-semibold tracking-wide text-muted uppercase">This week’s sessions</h2>
          <div className="grid grid-cols-1 gap-3">
            {plan.sessions.map((s) => (
              <SessionCard key={s.id} session={s} weekKey={weekKey} done={done.has(s.id)} />
            ))}
          </div>
        </section>

        <aside className="grid content-start gap-4 md:grid-cols-2 lg:grid-cols-1">
          <div className="rounded-3xl bg-elev p-5 shadow-card">
            <WeekStrip weekKey={weekKey} history={history} done={streak.thisWeek.done} target={streak.thisWeek.target} />
            <div className="mt-4 text-sm">
              {streak.thisWeek.complete ? (
                <span className="font-semibold text-success">Week done. Your streak is now {streak.current} 🔥</span>
              ) : streak.thisWeek.atRisk ? (
                <span className="inline-flex items-start gap-2 font-medium text-accent">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  {remaining} session{remaining > 1 ? 's' : ''} left and {streak.thisWeek.daysLeft} day{streak.thisWeek.daysLeft > 1 ? 's' : ''} to go. Protect your
                  streak!
                </span>
              ) : (
                <span className="text-muted">
                  {remaining} more session{remaining > 1 ? 's' : ''} this week to extend your streak.
                </span>
              )}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl shadow-card">
            <img src={PHOTOS.peaks} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#06111f]/90 via-[#06111f]/60 to-[#06111f]/20" />
            <div className="relative p-5 text-white">
              {daysToSeason !== null && daysToSeason > 0 ? (
                <>
                  <div className="font-display text-6xl leading-none">{daysToSeason}</div>
                  <div className="text-sm font-semibold tracking-wide uppercase">days to first chair</div>
                  <div className="mt-2 text-sm text-white/75">{format(parseISO(profile.seasonStart!), 'EEEE, MMMM d')}</div>
                </>
              ) : daysToSeason !== null ? (
                <>
                  <Snowflake size={26} />
                  <div className="mt-1 font-display text-4xl leading-none">It’s season time</div>
                  <div className="mt-1 text-sm text-white/75">Keep sessions light to stay strong and injury-free.</div>
                </>
              ) : (
                <>
                  <div className="font-display text-4xl leading-none">When’s day one?</div>
                  <div className="mt-1 text-sm text-white/75">Set your season start to peak at the right time.</div>
                  <Link to="/profile/edit" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                    Add date <ChevronRight size={16} />
                  </Link>
                </>
              )}
            </div>
          </div>

          <Link to="/plan" className="group rounded-3xl bg-elev p-5 shadow-card transition hover:bg-elev-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold tracking-wide text-muted uppercase">
                Phase · week {info.phaseWeek}
                {info.isDeload && ' · lighter week'}
              </div>
              <ChevronRight size={18} className="text-muted transition group-hover:translate-x-0.5" />
            </div>
            <div className="mt-1 font-display text-4xl leading-none">{PHASE_META[info.phase].name}</div>
            <p className="mt-2 text-sm text-muted">{PHASE_META[info.phase].blurb}</p>
          </Link>

          {tip && (
            <div className="rounded-3xl border border-line p-5">
              <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-primary uppercase">
                <Lightbulb size={15} /> Why it matters on the hill
              </div>
              <div className="mt-2 font-semibold">{tip.name}</div>
              <p className="mt-1 text-sm text-muted">{tip.whyForRiding}</p>
            </div>
          )}

          {!next && (
            <LinkButton to="/plan" variant="secondary">
              Browse next week
            </LinkButton>
          )}
        </aside>
      </div>
    </Page>
  )
}
