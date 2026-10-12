import { motion } from 'motion/react'
import { CheckCircle2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Character } from '@/animation/Character'
import { PhaseTimeline } from '@/components/PhaseTimeline'
import { SessionCard } from '@/components/SessionCard'
import { Stage } from '@/components/Scenery'
import { LinkButton } from '@/components/ui/Button'
import { useCurrentWeekKey, useProfile, useWeekPlan } from '@/hooks/usePlan'
import { phaseFor, PHASE_META } from '@/engine/phases'

const MESSAGES = ['Reading your answers…', 'Picking moves for your gear…', 'Dialing in reps and timers…', 'Mapping your phases to the season…']

export default function PlanReveal() {
  const profile = useProfile()
  const weekKey = useCurrentWeekKey()
  const plan = useWeekPlan(weekKey)
  const [step, setStep] = useState(0)
  const done = step >= MESSAGES.length

  useEffect(() => {
    if (done) return
    const t = setTimeout(() => setStep((s) => s + 1), 750)
    return () => clearTimeout(t)
  }, [step, done])

  const info = phaseFor(profile, weekKey)

  if (!done || !plan) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-6">
        <Stage className="aspect-square w-full max-w-sm rounded-[2rem] shadow-card">
          <Character clip="shadowCarve" guides={false} className="h-full w-full" />
        </Stage>
        <div className="mt-8 h-8 text-center font-display text-3xl">{MESSAGES[Math.min(step, MESSAGES.length - 1)]}</div>
        <div className="mt-4 h-1.5 w-56 overflow-hidden rounded-full bg-elev-2">
          <div className="h-full rounded-full bg-accent transition-all duration-700" style={{ width: `${((step + 1) / MESSAGES.length) * 100}%` }} />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto min-h-dvh max-w-3xl px-4 pt-safe pb-16 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="pt-10">
        <div className="flex items-center gap-2 text-success">
          <CheckCircle2 size={20} />
          <span className="text-sm font-semibold">Your plan is ready</span>
        </div>
        <h1 className="mt-3 font-display text-6xl leading-[0.92]">
          {profile.daysPerWeek}× a week. <span className="text-accent">{profile.sessionMinutes} min.</span>
        </h1>
        <p className="mt-3 text-muted">
          You’re starting in the <strong className="text-ink">{PHASE_META[info.phase].name}</strong> phase.{' '}
          {PHASE_META[info.phase].blurb}
        </p>

        <div className="mt-8 rounded-3xl bg-elev p-5 shadow-card">
          <PhaseTimeline profile={profile} info={info} />
        </div>

        <h2 className="mt-10 mb-3 font-display text-3xl">This week</h2>
        <div className="grid grid-cols-1 gap-3">
          {plan.sessions.map((s) => (
            <SessionCard key={s.id} session={s} weekKey={weekKey} />
          ))}
        </div>

        <LinkButton to="/" replace size="lg" className="mt-10 w-full">
          Let’s ride
        </LinkButton>
      </motion.div>
    </div>
  )
}
