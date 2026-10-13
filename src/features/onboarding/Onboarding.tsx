import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, CalendarCheck, Flame, LoaderCircle, Smartphone } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { Button } from '@/components/ui/Button'
import type { DaysPerWeek, EquipmentId, Goal, Level, SessionMinutes } from '@/domain/types'
import { useAppStore } from '@/store/useAppStore'
import { useAuthStore } from '@/store/useAuthStore'
import { cloudEnabled } from '@/sync/config'
import { DaysQuestion, DurationQuestion, EquipmentQuestion, GoalsQuestion, LevelQuestion, QuestionHeader, SeasonQuestion } from './questions'

interface Draft {
  daysPerWeek: DaysPerWeek | null
  equipment: EquipmentId[]
  level: Level | null
  goals: Goal[]
  sessionMinutes: SessionMinutes | null
  seasonStart: string | null | undefined
}

const QUESTIONS = ['days', 'equipment', 'level', 'goals', 'duration', 'season'] as const
type Step = (typeof QUESTIONS)[number] | 'save'

export default function Onboarding() {
  const navigate = useNavigate()
  const completeOnboarding = useAppStore((s) => s.completeOnboarding)
  // Guard on mount only, so finishing onboarding can navigate to the reveal screen.
  const alreadyOnboarded = useRef(useAppStore.getState().profile !== null).current
  // Offer an account before building the plan, unless they already signed in on the welcome screen.
  const STEPS = useRef<readonly Step[]>(
    cloudEnabled && !['signedIn', 'connecting'].includes(useAuthStore.getState().status) ? [...QUESTIONS, 'save'] : QUESTIONS,
  ).current
  const authStatus = useAuthStore((s) => s.status)
  const openSignUp = useAuthStore((s) => s.openSignUp)
  const openSignIn = useAuthStore((s) => s.openSignIn)
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1)
  const [d, setD] = useState<Draft>({
    daysPerWeek: null,
    equipment: [],
    level: null,
    goals: [],
    sessionMinutes: null,
    seasonStart: undefined,
  })
  const key = STEPS[step]

  const buildPlan = () => {
    completeOnboarding({
      daysPerWeek: d.daysPerWeek!,
      equipment: d.equipment,
      level: d.level!,
      goals: d.goals,
      sessionMinutes: d.sessionMinutes!,
      seasonStart: d.seasonStart ?? null,
    })
    navigate('/building', { replace: true })
  }

  // Signed up or in from the save step: their account is ready, so build the plan into it.
  const signedInOnSave = key === 'save' && authStatus === 'signedIn'
  useEffect(() => {
    if (signedInOnSave) buildPlan()
  }, [signedInOnSave])

  if (alreadyOnboarded) return <Navigate to="/" replace />

  const valid = {
    days: d.daysPerWeek !== null,
    equipment: true,
    level: d.level !== null,
    goals: d.goals.length > 0,
    duration: d.sessionMinutes !== null,
    season: d.seasonStart !== undefined,
    save: true,
  }[key]

  const go = (delta: number) => {
    setDir(delta)
    if (step + delta < 0) return navigate('/welcome')
    if (step + delta >= STEPS.length) return buildPlan()
    setStep(step + delta)
    window.scrollTo({ top: 0 })
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 bg-bg/90 pt-safe backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 sm:px-6">
          <button type="button" onClick={() => go(-1)} aria-label="Back" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-elev-2">
            <ArrowLeft size={20} />
          </button>
          <div className="flex flex-1 gap-1.5" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
            {STEPS.map((s, i) => (
              <div key={s} className="h-1.5 flex-1 overflow-hidden rounded-full bg-elev-2">
                <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: i <= step ? '100%' : '0%' }} />
              </div>
            ))}
          </div>
          <span className="w-10 text-right text-sm text-muted">
            {step + 1}/{STEPS.length}
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-4 pb-32 sm:px-6 sm:pt-8">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={key}
            custom={dir}
            initial={{ opacity: 0, x: 28 * dir }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -28 * dir }}
            transition={{ duration: 0.22 }}
          >
            {key === 'days' && (
              <>
                <QuestionHeader eyebrow="Your schedule" title="How often can you train?" subtitle="Pick what you can stick to. Consistency beats intensity, and your streak counts weeks, not days." />
                <DaysQuestion value={d.daysPerWeek} onChange={(v) => setD({ ...d, daysPerWeek: v })} />
              </>
            )}
            {key === 'equipment' && (
              <>
                <QuestionHeader eyebrow="Your gear" title="What do you have at home?" subtitle="Select everything that applies. We'll swap in exercises that use it." />
                <EquipmentQuestion value={d.equipment} onChange={(v) => setD({ ...d, equipment: v })} />
              </>
            )}
            {key === 'level' && (
              <>
                <QuestionHeader eyebrow="Your fitness" title="How fit are you right now?" subtitle="This sets reps, timers and which variations you get. The plan adapts as you give feedback." />
                <LevelQuestion value={d.level} onChange={(v) => setD({ ...d, level: v })} />
              </>
            )}
            {key === 'goals' && (
              <>
                <QuestionHeader eyebrow="Your focus" title="What do you want to train?" subtitle="Choose one or more. We'll balance them across your week." />
                <GoalsQuestion value={d.goals} onChange={(v) => setD({ ...d, goals: v })} />
              </>
            )}
            {key === 'duration' && (
              <>
                <QuestionHeader eyebrow="Your time" title="How long per session?" subtitle="Includes warm-up and cool-down." />
                <DurationQuestion value={d.sessionMinutes} onChange={(v) => setD({ ...d, sessionMinutes: v })} />
              </>
            )}
            {key === 'season' && (
              <>
                <QuestionHeader eyebrow="Your season" title="When's your first day on snow?" subtitle="We'll build through Foundation, Strength and Power so you peak right before it." />
                <SeasonQuestion value={d.seasonStart} onChange={(v) => setD({ ...d, seasonStart: v })} />
              </>
            )}
            {key === 'save' && (
              <>
                <QuestionHeader
                  eyebrow="Save your progress"
                  title="Keep your plan safe"
                  subtitle="Create a free account so your plan, workouts and streak aren’t stuck on this device."
                />
                <SaveStep connecting={authStatus === 'connecting'} onSignUp={openSignUp} onSignIn={openSignIn} />
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-bg/90 pb-safe backdrop-blur">
        <div className="mx-auto flex max-w-3xl gap-3 px-4 py-3 sm:px-6">
          {step > 0 && (
            <Button variant="secondary" size="lg" onClick={() => go(-1)} className="w-28">
              Back
            </Button>
          )}
          {key === 'save' ? (
            <Button variant="secondary" size="lg" className="flex-1" disabled={authStatus === 'connecting'} onClick={() => go(1)}>
              Skip for now
            </Button>
          ) : (
            <Button size="lg" className="flex-1" disabled={!valid} onClick={() => go(1)}>
              {key === 'season' ? 'Build my plan' : 'Continue'}
            </Button>
          )}
        </div>
      </footer>
    </div>
  )
}

const SAVE_PERKS = [
  { icon: CalendarCheck, text: 'Your personalized plan, saved to your account' },
  { icon: Flame, text: 'Workout history and weekly streak backed up' },
  { icon: Smartphone, text: 'Train on any phone, tablet or laptop' },
]

function SaveStep({ connecting, onSignUp, onSignIn }: { connecting: boolean; onSignUp: () => void; onSignIn: () => void }) {
  return (
    <div className="grid gap-6">
      <ul className="grid gap-3 rounded-3xl bg-elev p-5 shadow-card">
        {SAVE_PERKS.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <Icon size={20} />
            </span>
            {text}
          </li>
        ))}
      </ul>
      {connecting ? (
        <div className="flex items-center gap-3 text-muted">
          <LoaderCircle size={20} className="animate-spin text-primary" /> Connecting your account…
        </div>
      ) : (
        <div className="grid gap-3 sm:max-w-sm">
          <Button size="lg" onClick={onSignUp}>
            Create free account
          </Button>
          <Button size="lg" variant="outline" onClick={onSignIn}>
            I already have an account
          </Button>
        </div>
      )}
    </div>
  )
}
