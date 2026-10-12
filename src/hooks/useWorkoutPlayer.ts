import { useCallback, useEffect, useRef, useState } from 'react'
import type { PlayerStep } from '@/domain/types'

export interface PlayerState {
  index: number
  step: PlayerStep | undefined
  paused: boolean
  /** Seconds left in a timed step (undefined for rep-based work). */
  remaining: number | undefined
  /** Seconds spent in the current step. */
  stepElapsed: number
  totalElapsed: number
  skipped: number[]
  finished: boolean
}

interface Options {
  steps: PlayerStep[]
  initialIndex?: number
  initialSkipped?: number[]
  initialElapsed?: number
  onStepStart?: (step: PlayerStep, index: number) => void
  onCountdown?: (secondsLeft: number, step: PlayerStep) => void
  onFinish?: (skipped: number[], totalElapsed: number) => void
}

const now = () => performance.now()

/**
 * Drift-free workout timer. Time is derived from timestamps rather than counted
 * ticks, so it stays correct when the tab is backgrounded or the device sleeps.
 */
export function useWorkoutPlayer({ steps, initialIndex = 0, initialSkipped = [], initialElapsed = 0, onStepStart, onCountdown, onFinish }: Options) {
  const [index, setIndex] = useState(Math.min(initialIndex, Math.max(0, steps.length - 1)))
  const [paused, setPaused] = useState(false)
  const [skipped, setSkipped] = useState<number[]>(initialSkipped)
  const [finished, setFinished] = useState(false)
  const [, force] = useState(0)

  // Timing refs: when the current step started (adjusted for pauses) and extra time added.
  const stepStart = useRef(now())
  const pausedAt = useRef<number | null>(null)
  const extraSec = useRef(0)
  const elapsedBase = useRef(initialElapsed)
  const lastCountdown = useRef<number | null>(null)
  const cbs = useRef({ onStepStart, onCountdown, onFinish })
  cbs.current = { onStepStart, onCountdown, onFinish }

  const step = steps[index]
  const duration = step ? (step.kind === 'work' && step.durationSec === undefined ? undefined : (step.durationSec ?? 0) + extraSec.current) : undefined

  const stepElapsedSec = () => {
    const end = pausedAt.current ?? now()
    return Math.max(0, (end - stepStart.current) / 1000)
  }

  const finish = useCallback(
    (skippedNow: number[]) => {
      setFinished(true)
      cbs.current.onFinish?.(skippedNow, elapsedBase.current)
    },
    [],
  )

  const goTo = useCallback(
    (next: number, skippedNow: number[]) => {
      elapsedBase.current += stepElapsedSec()
      if (next >= steps.length) {
        finish(skippedNow)
        return
      }
      stepStart.current = now()
      if (pausedAt.current !== null) pausedAt.current = now()
      extraSec.current = 0
      lastCountdown.current = null
      setIndex(Math.max(0, next))
    },
    [steps.length, finish],
  )

  // Announce each step as it begins.
  useEffect(() => {
    if (step && !finished) cbs.current.onStepStart?.(step, index)
  }, [index, step, finished])

  // Tick: update the display and auto-advance timed steps.
  useEffect(() => {
    if (paused || finished || !step) return
    const id = window.setInterval(() => {
      const el = stepElapsedSec()
      if (duration !== undefined) {
        const left = duration - el
        const whole = Math.ceil(left)
        if (whole <= 3 && whole >= 1 && lastCountdown.current !== whole) {
          lastCountdown.current = whole
          cbs.current.onCountdown?.(whole, step)
        }
        if (left <= 0) {
          goTo(index + 1, skipped)
          return
        }
      }
      force((n) => n + 1)
    }, 100)
    return () => clearInterval(id)
  }, [paused, finished, step, duration, index, skipped, goTo])

  const togglePause = useCallback(() => {
    if (pausedAt.current === null) {
      pausedAt.current = now()
      setPaused(true)
    } else {
      stepStart.current += now() - pausedAt.current
      pausedAt.current = null
      setPaused(false)
    }
  }, [])

  /** Advance. On work steps this counts as done unless most of a timed step remains. */
  const next = useCallback(() => {
    if (!step) return
    let s = skipped
    if (step.kind === 'work' && duration !== undefined && stepElapsedSec() < duration * 0.5 && !skipped.includes(index)) {
      s = [...skipped, index]
      setSkipped(s)
    }
    goTo(index + 1, s)
  }, [step, duration, skipped, index, goTo])

  /** Mark the current work step skipped and move on. */
  const skip = useCallback(() => {
    if (!step) return
    const s = step.kind === 'work' && !skipped.includes(index) ? [...skipped, index] : skipped
    setSkipped(s)
    goTo(index + 1, s)
  }, [step, skipped, index, goTo])

  /** Restart the current step, or jump back to the previous exercise. */
  const prev = useCallback(() => {
    if (stepElapsedSec() > 3 || index === 0) {
      stepStart.current = now()
      if (pausedAt.current !== null) pausedAt.current = now()
      lastCountdown.current = null
      force((n) => n + 1)
      return
    }
    let i = index - 1
    while (i > 0 && steps[i].kind !== 'work') i--
    setSkipped((s) => s.filter((x) => x < i))
    goTo(i, skipped.filter((x) => x < i))
  }, [index, steps, skipped, goTo])

  const addTime = useCallback((sec: number) => {
    extraSec.current += sec
    lastCountdown.current = null
    force((n) => n + 1)
  }, [])

  const el = stepElapsedSec()
  const state: PlayerState = {
    index,
    step,
    paused,
    remaining: duration === undefined ? undefined : Math.max(0, duration - el),
    stepElapsed: el,
    totalElapsed: elapsedBase.current + el,
    skipped,
    finished,
  }
  return { ...state, duration, togglePause, next, skip, prev, addTime }
}
