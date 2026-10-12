import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { CompletedSession, Profile, SwapMap } from '@/domain/types'
import { daysLeftInWeek, weekKeyOf } from '@/engine/dates'

export type ThemePref = 'system' | 'dark' | 'light'

export interface Settings {
  theme: ThemePref
  sound: boolean
  voice: boolean
  haptics: boolean
}

export interface ActiveWorkout {
  weekKey: string
  sessionId: string
  stepIndex: number
  /** Indices of work steps the user skipped. */
  skipped: number[]
  elapsedSec: number
  startedAt: string
}

export type ProfileAnswers = Omit<Profile, 'planStart'>

interface AppState {
  profile: Profile | null
  intensityAdjust: number
  swaps: SwapMap
  history: CompletedSession[]
  weekTargets: Record<string, number>
  settings: Settings
  active: ActiveWorkout | null

  completeOnboarding: (answers: ProfileAnswers) => void
  updateProfile: (answers: ProfileAnswers) => void
  setSwap: (weekKey: string, sessionId: string, itemKey: string, from: string, to: string | null) => void
  startWorkout: (weekKey: string, sessionId: string) => void
  saveProgress: (stepIndex: number, skipped: number[], elapsedSec: number) => void
  abandonWorkout: () => void
  finishWorkout: (session: Omit<CompletedSession, 'id' | 'completedAt'>) => string
  setFeedback: (id: string, feedback: -1 | 0 | 1) => void
  updateSettings: (patch: Partial<Settings>) => void
  resetAll: () => void
}

const DEFAULT_SETTINGS: Settings = { theme: 'system', sound: true, voice: false, haptics: true }

const initial = {
  profile: null,
  intensityAdjust: 0,
  swaps: {},
  history: [],
  weekTargets: {},
  settings: DEFAULT_SETTINGS,
  active: null,
}

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36)

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initial,

      completeOnboarding: (answers) => {
        const today = new Date()
        const week = weekKeyOf(today)
        // Signing up late in the week shouldn't make the first week impossible.
        const firstTarget = Math.min(answers.daysPerWeek, daysLeftInWeek(today))
        set({
          profile: { ...answers, planStart: week },
          weekTargets: { ...get().weekTargets, [week]: firstTarget },
          swaps: {},
          intensityAdjust: 0,
        })
      },

      updateProfile: (answers) => {
        const current = get().profile
        if (!current) return
        const week = weekKeyOf(new Date())
        const prevTarget = get().weekTargets[week]
        set({
          profile: { ...current, ...answers },
          // Lowering the target applies now; raising it waits until next week.
          weekTargets: { ...get().weekTargets, [week]: Math.min(prevTarget ?? answers.daysPerWeek, answers.daysPerWeek) },
        })
      },

      setSwap: (weekKey, sessionId, itemKey, from, to) => {
        const key = `${weekKey}|${sessionId}|${itemKey}`
        const swaps = { ...get().swaps }
        if (to === null || to === from) delete swaps[key]
        else swaps[key] = { from, to }
        set({ swaps })
      },

      startWorkout: (weekKey, sessionId) => {
        const active = get().active
        if (active && active.weekKey === weekKey && active.sessionId === sessionId) return
        set({ active: { weekKey, sessionId, stepIndex: 0, skipped: [], elapsedSec: 0, startedAt: new Date().toISOString() } })
      },

      saveProgress: (stepIndex, skipped, elapsedSec) => {
        const active = get().active
        if (active) set({ active: { ...active, stepIndex, skipped, elapsedSec } })
      },

      abandonWorkout: () => set({ active: null }),

      finishWorkout: (session) => {
        const id = uid()
        const entry: CompletedSession = { ...session, id, completedAt: new Date().toISOString() }
        set({ history: [...get().history, entry], active: null })
        return id
      },

      setFeedback: (id, feedback) => {
        const history = get().history
        const entry = history.find((h) => h.id === id)
        if (!entry) return
        const previous = entry.feedback ?? 0
        const adjust = Math.max(-2, Math.min(2, get().intensityAdjust - previous + feedback))
        set({
          history: history.map((h) => (h.id === id ? { ...h, feedback } : h)),
          intensityAdjust: adjust,
        })
      },

      updateSettings: (patch) => set({ settings: { ...get().settings, ...patch } }),

      resetAll: () => set({ ...initial, settings: get().settings }),
    }),
    {
      name: 'offseason-shred',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        profile: s.profile,
        intensityAdjust: s.intensityAdjust,
        swaps: s.swaps,
        history: s.history,
        weekTargets: s.weekTargets,
        settings: s.settings,
        active: s.active,
      }),
      migrate: (persisted) => persisted as AppState,
    },
  ),
)
