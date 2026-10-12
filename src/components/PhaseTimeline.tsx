import type { Phase, Profile } from '@/domain/types'
import { PHASE_META, type PhaseInfo } from '@/engine/phases'

const COLORS: Record<Phase, string> = {
  foundation: 'var(--primary)',
  strength: '#8b7bf0',
  power: 'var(--accent)',
  maintenance: 'var(--success)',
}

interface Props {
  profile: Profile
  info: Pick<PhaseInfo, 'phase' | 'weekIndex' | 'weeksToSeason'>
}

/** Proportional bar of the training phases with a "you are here" marker. */
export function PhaseTimeline({ profile, info }: Props) {
  let segments: { phase: Phase; weeks: number }[]
  let position: number

  if (profile.seasonStart && info.weeksToSeason !== null) {
    const totalToSeason = info.weekIndex + Math.max(0, info.weeksToSeason)
    const foundation = Math.max(0, totalToSeason - 8)
    const strength = Math.min(4, Math.max(0, totalToSeason - 4))
    const power = Math.min(4, totalToSeason)
    segments = [
      { phase: 'foundation' as Phase, weeks: foundation },
      { phase: 'strength' as Phase, weeks: strength },
      { phase: 'power' as Phase, weeks: power },
      { phase: 'maintenance' as Phase, weeks: 2 },
    ].filter((s) => s.weeks > 0)
    const total = segments.reduce((a, s) => a + s.weeks, 0)
    position = Math.min(total - 0.5, info.weekIndex + 0.5) / total
  } else {
    segments = [
      { phase: 'foundation', weeks: 4 },
      { phase: 'strength', weeks: 4 },
      { phase: 'power', weeks: 4 },
    ]
    position = ((info.weekIndex % 12) + 0.5) / 12
  }

  return (
    <div>
      <div className="relative pt-7">
        <div
          className="absolute top-0 -translate-x-1/2 rounded-full bg-ink px-2 py-0.5 text-[11px] font-bold whitespace-nowrap text-bg"
          style={{ left: `${position * 100}%` }}
        >
          You are here
        </div>
        <div className="absolute top-[22px] h-2 w-0.5 -translate-x-1/2 bg-ink" style={{ left: `${position * 100}%` }} />
        <div className="flex h-3 gap-1 overflow-hidden rounded-full">
          {segments.map((s) => (
            <div key={s.phase} style={{ flex: s.weeks, background: COLORS[s.phase], opacity: s.phase === info.phase ? 1 : 0.35 }} />
          ))}
        </div>
      </div>
      <div className="mt-2 flex gap-1">
        {segments.map((s) => (
          <div key={s.phase} style={{ flex: s.weeks }} className="min-w-0">
            <div className={`truncate text-xs font-semibold ${s.phase === info.phase ? 'text-ink' : 'text-muted'}`}>{PHASE_META[s.phase].name}</div>
            <div className="truncate text-[11px] text-muted">{s.phase === 'maintenance' ? 'Season' : `${s.weeks} wk`}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export const PHASE_COLORS = COLORS
