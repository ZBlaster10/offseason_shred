import { useMemo } from 'react'
import type { Profile, WeekPlan } from '@/domain/types'
import { weekKeyOf } from '@/engine/dates'
import { generateWeek } from '@/engine/generatePlan'
import { computeStreak } from '@/engine/streak'
import { useAppStore } from '@/store/useAppStore'

export const useCurrentWeekKey = () => weekKeyOf(new Date())

export function useWeekPlan(weekKey: string): WeekPlan | null {
  const profile = useAppStore((s) => s.profile)
  const intensityAdjust = useAppStore((s) => s.intensityAdjust)
  const swaps = useAppStore((s) => s.swaps)
  return useMemo(
    () => (profile ? generateWeek(profile, weekKey, { intensityAdjust, swaps }) : null),
    [profile, weekKey, intensityAdjust, swaps],
  )
}

export function useSession(weekKey: string, sessionId: string) {
  const plan = useWeekPlan(weekKey)
  return { plan, session: plan?.sessions.find((s) => s.id === sessionId) ?? null }
}

export function useStreak() {
  const profile = useAppStore((s) => s.profile)
  const history = useAppStore((s) => s.history)
  const weekTargets = useAppStore((s) => s.weekTargets)
  return useMemo(() => {
    if (!profile) return null
    return computeStreak({
      history,
      weekTargets,
      defaultTarget: profile.daysPerWeek,
      firstWeekKey: profile.planStart,
      today: new Date(),
    })
  }, [profile, history, weekTargets])
}

/** Session ids completed (counting toward the streak) in a given week. */
export function useCompletedIds(weekKey: string) {
  const history = useAppStore((s) => s.history)
  return useMemo(() => new Set(history.filter((h) => h.weekKey === weekKey && h.completion >= 0.8).map((h) => h.sessionId)), [history, weekKey])
}

export function useProfile(): Profile {
  const profile = useAppStore((s) => s.profile)
  if (!profile) throw new Error('Profile required')
  return profile
}
