import type { CompletedSession } from '@/domain/types'
import { addWeeksKey, daysLeftInWeek, weekKeyOf, weeksBetween } from './dates'

/** Share of a session's exercises that must be completed for it to count. */
export const COUNT_THRESHOLD = 0.8
export const MAX_FREEZES = 2
/** Completed weeks needed to earn one streak freeze. */
export const WEEKS_PER_FREEZE = 4

export type WeekStatus = 'complete' | 'frozen' | 'missed' | 'inProgress'

export interface StreakInput {
  history: CompletedSession[]
  /** Weekly target snapshots, keyed by week. */
  weekTargets: Record<string, number>
  /** Fallback target (the profile's current days per week). */
  defaultTarget: number
  /** Week the plan started; earlier weeks are ignored. */
  firstWeekKey: string
  today: Date
}

export interface ThisWeek {
  key: string
  done: number
  target: number
  daysLeft: number
  complete: boolean
  atRisk: boolean
}

export interface StreakResult {
  current: number
  best: number
  freezes: number
  weeks: Record<string, WeekStatus>
  thisWeek: ThisWeek
}

export const sessionCounts = (s: Pick<CompletedSession, 'completion'>) => s.completion >= COUNT_THRESHOLD

export function countedByWeek(history: CompletedSession[]) {
  const map: Record<string, number> = {}
  for (const s of history) if (sessionCounts(s)) map[s.weekKey] = (map[s.weekKey] ?? 0) + 1
  return map
}

export function computeStreak(input: StreakInput): StreakResult {
  const { history, weekTargets, defaultTarget, firstWeekKey, today } = input
  const currentKey = weekKeyOf(today)
  const done = countedByWeek(history)
  const targetFor = (k: string) => Math.max(1, weekTargets[k] ?? defaultTarget)

  let current = 0
  let best = 0
  let freezes = 0
  let completedWeeks = 0
  const weeks: Record<string, WeekStatus> = {}

  const complete = (k: string) => {
    weeks[k] = 'complete'
    current++
    completedWeeks++
    if (completedWeeks % WEEKS_PER_FREEZE === 0) freezes = Math.min(MAX_FREEZES, freezes + 1)
    best = Math.max(best, current)
  }

  const span = weeksBetween(firstWeekKey, currentKey)
  for (let i = 0; i < span; i++) {
    const k = addWeeksKey(firstWeekKey, i)
    if ((done[k] ?? 0) >= targetFor(k)) complete(k)
    else if (freezes > 0) {
      freezes--
      weeks[k] = 'frozen'
    } else {
      weeks[k] = 'missed'
      current = 0
    }
  }

  const target = targetFor(currentKey)
  const doneNow = done[currentKey] ?? 0
  const isComplete = doneNow >= target
  if (isComplete) complete(currentKey)
  else weeks[currentKey] = 'inProgress'

  const daysLeft = daysLeftInWeek(today)
  const remaining = Math.max(0, target - doneNow)

  return {
    current,
    best,
    freezes,
    weeks,
    thisWeek: {
      key: currentKey,
      done: doneNow,
      target,
      daysLeft,
      complete: isComplete,
      atRisk: remaining > 0 && daysLeft - remaining <= 1,
    },
  }
}
