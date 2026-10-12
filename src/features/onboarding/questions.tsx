import { addMonths, format } from 'date-fns'
import { Check, HelpCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import { EquipmentIcon } from '@/components/EquipmentIcon'
import { EQUIPMENT } from '@/data/equipment'
import type { DaysPerWeek, EquipmentId, Goal, Level, SessionMinutes } from '@/domain/types'
import { GOAL_PHOTO, PHOTOS } from '@/lib/photos'

export function OptionCard({
  selected,
  onClick,
  title,
  description,
  visual,
  multi,
  className = '',
}: {
  selected: boolean
  onClick: () => void
  title: ReactNode
  description?: ReactNode
  visual?: ReactNode
  multi?: boolean
  className?: string
}) {
  return (
    <button
      type="button"
      role={multi ? 'checkbox' : 'radio'}
      aria-checked={selected}
      onClick={onClick}
      className={`group relative flex w-full items-center gap-4 rounded-2xl border-2 bg-elev p-4 text-left transition active:scale-[0.99] ${
        selected ? 'border-primary bg-primary-soft' : 'border-transparent shadow-card hover:border-line'
      } ${className}`}
    >
      {visual}
      <div className="min-w-0 flex-1">
        <div className="font-semibold">{title}</div>
        {description && <div className="mt-0.5 text-sm text-muted">{description}</div>}
      </div>
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center ${multi ? 'rounded-md' : 'rounded-full'} border-2 transition ${
          selected ? 'border-primary bg-primary text-primary-ink' : 'border-line'
        }`}
      >
        {selected && <Check size={15} strokeWidth={3} />}
      </span>
    </button>
  )
}

export function QuestionHeader({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      {eyebrow && <div className="mb-2 text-xs font-bold tracking-[0.18em] text-primary uppercase">{eyebrow}</div>}
      <h1 className="font-display text-5xl leading-[0.95] sm:text-6xl">{title}</h1>
      {subtitle && <p className="mt-3 max-w-lg text-muted">{subtitle}</p>}
    </div>
  )
}

const DAYS: { value: DaysPerWeek; title: string; description: string }[] = [
  { value: 1, title: 'Once a week', description: 'One full-body session that covers everything you picked.' },
  { value: 2, title: 'Twice a week', description: 'Two complementary sessions. The sweet spot for most riders.' },
  { value: 3, title: '3 times a week', description: 'Dedicated strength, power and mobility days.' },
]

export function DaysQuestion({ value, onChange }: { value: DaysPerWeek | null; onChange: (v: DaysPerWeek) => void }) {
  return (
    <div role="radiogroup" className="grid grid-cols-1 gap-3">
      {DAYS.map((d) => (
        <OptionCard
          key={d.value}
          selected={value === d.value}
          onClick={() => onChange(d.value)}
          title={d.title}
          description={d.description}
          visual={
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-elev-2 font-display text-3xl text-primary">{d.value}×</div>
          }
        />
      ))}
    </div>
  )
}

export function EquipmentQuestion({ value, onChange }: { value: EquipmentId[]; onChange: (v: EquipmentId[]) => void }) {
  const toggle = (id: EquipmentId) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id])
  return (
    <div>
      <OptionCard
        multi
        selected={value.length === 0}
        onClick={() => onChange([])}
        title="No equipment"
        description="Bodyweight only. You just need a little floor space and a sturdy chair."
        visual={
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-elev-2 text-primary">
            <EquipmentIcon id="bodyweight" size={26} />
          </div>
        }
        className="mb-3"
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {EQUIPMENT.map((e) => {
          const on = value.includes(e.id)
          return (
            <button
              key={e.id}
              type="button"
              role="checkbox"
              aria-checked={on}
              onClick={() => toggle(e.id)}
              className={`relative flex flex-col items-start gap-3 rounded-2xl border-2 bg-elev p-4 text-left transition active:scale-[0.98] ${
                on ? 'border-primary bg-primary-soft' : 'border-transparent shadow-card hover:border-line'
              }`}
            >
              <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${on ? 'bg-primary text-primary-ink' : 'bg-elev-2 text-primary'}`}>
                <EquipmentIcon id={e.id} size={24} />
              </span>
              <span>
                <span className="block font-semibold">{e.name}</span>
                <span className="block text-xs text-muted">{e.hint}</span>
              </span>
              {on && (
                <span className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-md bg-primary text-primary-ink">
                  <Check size={13} strokeWidth={3} />
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const LEVELS: { value: Level; title: string; description: string; bars: number }[] = [
  { value: 1, title: 'Getting started', description: 'Not training regularly. 10 push-ups would be tough.', bars: 1 },
  { value: 2, title: 'Pretty active', description: 'Work out or play sports 1–3× a week.', bars: 2 },
  { value: 3, title: 'Athlete mode', description: 'Train hard most weeks. Bring on jumps and single-leg work.', bars: 3 },
]

export function LevelQuestion({ value, onChange }: { value: Level | null; onChange: (v: Level) => void }) {
  return (
    <div role="radiogroup" className="grid grid-cols-1 gap-3">
      {LEVELS.map((l) => (
        <OptionCard
          key={l.value}
          selected={value === l.value}
          onClick={() => onChange(l.value)}
          title={l.title}
          description={l.description}
          visual={
            <div className="flex h-12 w-12 shrink-0 items-end justify-center gap-1 rounded-xl bg-elev-2 p-2.5">
              {[1, 2, 3].map((b) => (
                <span key={b} className={`w-2 rounded-sm ${b <= l.bars ? 'bg-accent' : 'bg-line'}`} style={{ height: 6 + b * 7 }} />
              ))}
            </div>
          }
        />
      ))}
    </div>
  )
}

const GOALS: { value: Goal; title: string; description: string }[] = [
  { value: 'strength', title: 'Strength', description: 'Legs that last top-to-bottom, solid landings, fall-proof upper body.' },
  { value: 'aerobic', title: 'Aerobic & Power', description: 'Cardio engine, jumps and pops for long days and park laps.' },
  { value: 'mobility', title: 'Mobility & Core', description: 'Loose hips, strong trunk and balance on a moving board.' },
]

export function GoalsQuestion({ value, onChange }: { value: Goal[]; onChange: (v: Goal[]) => void }) {
  const toggle = (g: Goal) => onChange(value.includes(g) ? value.filter((v) => v !== g) : [...value, g])
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {GOALS.map((g) => {
        const on = value.includes(g.value)
        return (
          <button
            key={g.value}
            type="button"
            role="checkbox"
            aria-checked={on}
            onClick={() => toggle(g.value)}
            className={`group relative overflow-hidden rounded-2xl border-2 text-left transition active:scale-[0.99] ${on ? 'border-primary' : 'border-transparent'}`}
          >
            <img src={PHOTOS[GOAL_PHOTO[g.value]]} alt="" className="h-36 w-full object-cover sm:h-44" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#06111f] via-[#06111f]/60 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4 text-white">
              <div className="font-display text-3xl leading-none">{g.title}</div>
              <div className="mt-1 text-xs text-white/80">{g.description}</div>
            </div>
            <span
              className={`absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-lg border-2 transition ${
                on ? 'border-primary bg-primary text-primary-ink' : 'border-white/70 bg-black/20'
              }`}
            >
              {on && <Check size={16} strokeWidth={3} />}
            </span>
          </button>
        )
      })}
    </div>
  )
}

const DURATIONS: { value: SessionMinutes; title: string; description: string }[] = [
  { value: 20, title: '20 min', description: 'Quick and focused. Great for busy weeks.' },
  { value: 30, title: '30 min', description: 'The classic. Room for every block.' },
  { value: 45, title: '45 min', description: 'Full session with extra circuits.' },
]

export function DurationQuestion({ value, onChange }: { value: SessionMinutes | null; onChange: (v: SessionMinutes) => void }) {
  return (
    <div role="radiogroup" className="grid gap-3 sm:grid-cols-3">
      {DURATIONS.map((d) => (
        <button
          key={d.value}
          type="button"
          role="radio"
          aria-checked={value === d.value}
          onClick={() => onChange(d.value)}
          className={`flex flex-col items-start rounded-2xl border-2 bg-elev p-5 text-left transition active:scale-[0.99] ${
            value === d.value ? 'border-primary bg-primary-soft' : 'border-transparent shadow-card hover:border-line'
          }`}
        >
          <span className="font-display text-5xl leading-none text-primary">{d.value}</span>
          <span className="mt-1 font-semibold">minutes</span>
          <span className="mt-1 text-sm text-muted">{d.description}</span>
        </button>
      ))}
    </div>
  )
}

export function SeasonQuestion({ value, onChange }: { value: string | null | undefined; onChange: (v: string | null) => void }) {
  const today = new Date()
  const quick = [1, 2, 3, 4, 6].map((m) => {
    const d = addMonths(today, m)
    return { label: m === 1 ? 'In a month' : `In ${m} months`, value: format(d, 'yyyy-MM-dd'), sub: format(d, 'MMM d') }
  })
  return (
    <div className="grid grid-cols-1 gap-4">
      <label className="block rounded-2xl bg-elev p-4 shadow-card">
        <span className="text-sm font-semibold">First day on snow</span>
        <input
          type="date"
          min={format(today, 'yyyy-MM-dd')}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value || null)}
          className="mt-2 block w-full rounded-xl border border-line bg-bg px-3 py-3 text-lg text-ink"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        {quick.map((q) => (
          <button
            key={q.label}
            type="button"
            onClick={() => onChange(q.value)}
            className={`rounded-full border px-3.5 py-2 text-sm font-medium transition ${
              value === q.value ? 'border-primary bg-primary-soft text-primary' : 'border-line hover:bg-elev-2'
            }`}
          >
            {q.label} <span className="text-muted">· {q.sub}</span>
          </button>
        ))}
      </div>
      <OptionCard
        selected={value === null}
        onClick={() => onChange(null)}
        title="Not sure yet"
        description="We’ll cycle Foundation → Strength → Power in 4-week blocks."
        visual={
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-elev-2 text-primary">
            <HelpCircle size={24} />
          </div>
        }
      />
    </div>
  )
}
