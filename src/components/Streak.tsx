import { addDays, format, isSameDay, parseISO } from 'date-fns'
import { Check, Flame } from 'lucide-react'
import type { CompletedSession } from '@/domain/types'
import { sessionCounts } from '@/engine/streak'

export function StreakBadge({ weeks, className = '' }: { weeks: number; className?: string }) {
  const lit = weeks > 0
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold ${lit ? 'bg-accent-soft text-accent' : 'bg-elev-2 text-muted'} ${className}`}
      title={`${weeks}-week streak`}
    >
      <Flame size={17} fill={lit ? 'currentColor' : 'none'} />
      <span>{weeks}</span>
      <span className="font-medium opacity-80">wk</span>
    </div>
  )
}

interface WeekStripProps {
  weekKey: string
  history: CompletedSession[]
  done: number
  target: number
}

/** Mon–Sun strip showing which days had a counted session. */
export function WeekStrip({ weekKey, history, done, target }: WeekStripProps) {
  const monday = parseISO(weekKey)
  const today = new Date()
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i))
  const trainedOn = (d: Date) => history.some((h) => h.weekKey === weekKey && sessionCounts(h) && isSameDay(parseISO(h.completedAt), d))

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <div className="text-sm font-semibold">This week</div>
        <div className="text-sm text-muted">
          <span className={done >= target ? 'font-bold text-success' : 'font-bold text-ink'}>{Math.min(done, target)}</span> / {target} sessions
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((d) => {
          const isToday = isSameDay(d, today)
          const trained = trainedOn(d)
          return (
            <div key={d.toISOString()} className="flex flex-col items-center gap-1.5">
              <div className={`text-[11px] font-medium uppercase ${isToday ? 'text-ink' : 'text-muted'}`}>{format(d, 'EEEEE')}</div>
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition ${
                  trained ? 'bg-accent text-white' : isToday ? 'border-2 border-primary text-ink' : 'bg-elev-2 text-muted'
                }`}
              >
                {trained ? <Check size={17} strokeWidth={3} /> : format(d, 'd')}
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-3 flex gap-1.5">
        {Array.from({ length: target }, (_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i < done ? 'bg-accent' : 'bg-elev-2'}`} />
        ))}
      </div>
    </div>
  )
}
