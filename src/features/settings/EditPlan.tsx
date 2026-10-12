import { ArrowLeft } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/Button'
import { DaysQuestion, DurationQuestion, EquipmentQuestion, GoalsQuestion, LevelQuestion, SeasonQuestion } from '@/features/onboarding/questions'
import { useProfile } from '@/hooks/usePlan'
import { useAppStore, type ProfileAnswers } from '@/store/useAppStore'

export default function EditPlan() {
  const navigate = useNavigate()
  const profile = useProfile()
  const updateProfile = useAppStore((s) => s.updateProfile)
  const [a, setA] = useState<ProfileAnswers>({
    daysPerWeek: profile.daysPerWeek,
    equipment: profile.equipment,
    level: profile.level,
    goals: profile.goals,
    sessionMinutes: profile.sessionMinutes,
    seasonStart: profile.seasonStart,
  })
  const valid = a.goals.length > 0

  const save = () => {
    updateProfile(a)
    navigate('/plan', { replace: true })
  }

  return (
    <div className="min-h-dvh pb-28">
      <header className="sticky top-0 z-20 border-b border-line bg-bg/90 pt-safe backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 sm:px-6">
          <button type="button" onClick={() => navigate(-1)} aria-label="Back" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-elev-2">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-display text-3xl">Edit training plan</h1>
        </div>
      </header>

      <div className="mx-auto grid max-w-3xl gap-10 px-4 pt-6 sm:px-6">
        <p className="text-muted">
          Change anything and your plan rebuilds from this week. Your history and streak stay exactly as they are.
        </p>
        <Section title="Sessions per week">
          <DaysQuestion value={a.daysPerWeek} onChange={(daysPerWeek) => setA({ ...a, daysPerWeek })} />
        </Section>
        <Section title="Equipment">
          <EquipmentQuestion value={a.equipment} onChange={(equipment) => setA({ ...a, equipment })} />
        </Section>
        <Section title="Fitness level">
          <LevelQuestion value={a.level} onChange={(level) => setA({ ...a, level })} />
        </Section>
        <Section title="Focus">
          <GoalsQuestion value={a.goals} onChange={(goals) => setA({ ...a, goals })} />
          {!valid && <p className="mt-2 text-sm text-danger">Pick at least one focus.</p>}
        </Section>
        <Section title="Session length">
          <DurationQuestion value={a.sessionMinutes} onChange={(sessionMinutes) => setA({ ...a, sessionMinutes })} />
        </Section>
        <Section title="Season start">
          <SeasonQuestion value={a.seasonStart} onChange={(seasonStart) => setA({ ...a, seasonStart })} />
        </Section>
      </div>

      <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-bg/90 pb-safe backdrop-blur">
        <div className="mx-auto flex max-w-3xl gap-3 px-4 py-3 sm:px-6">
          <Button variant="secondary" size="lg" onClick={() => navigate(-1)} className="w-32">
            Cancel
          </Button>
          <Button size="lg" className="flex-1" disabled={!valid} onClick={save}>
            Save & rebuild plan
          </Button>
        </div>
      </footer>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 font-display text-3xl">{title}</h2>
      {children}
    </section>
  )
}
