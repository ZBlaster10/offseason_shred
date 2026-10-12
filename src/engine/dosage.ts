import type { BlockType, Exercise, Level, SessionItem, Slot } from '@/domain/types'
import type { PhaseInfo } from './phases'

// Intensity ladder. Level 1/2/3 map to index 2/3/4; feedback shifts it by up to ±2.
const WORK = [20, 25, 30, 40, 45, 50, 55]
const REST = [40, 35, 30, 20, 15, 15, 10]
const REPS = [5, 6, 8, 12, 15, 17, 20]
const REPS_SIDE = [4, 5, 6, 9, 11, 12, 14]
const HOLD = [25, 30, 30, 40, 45, 45, 50]
const WARM = [30, 30, 30, 35, 40, 40, 40]

export const SWITCH_SEC = 5
export const MAX_REPS = 20

export interface Dose {
  workSec: number
  restSec: number
  reps: number
  repsSide: number
  holdSec: number
  warmSec: number
}

const round5 = (n: number) => Math.max(5, Math.round(n / 5) * 5)
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

export function intensityIndex(level: Level, adjust: number) {
  return clamp(level + 1 + Math.round(adjust), 0, WORK.length - 1)
}

export function baseDose(level: Level, adjust: number, info: PhaseInfo): Dose {
  const i = intensityIndex(level, adjust)
  const step = Math.min(info.progression, 2)
  let workSec = WORK[i] + 5 * step
  let restSec = REST[i]
  let reps = REPS[i] + 2 * step
  let repsSide = REPS_SIDE[i] + step
  let holdSec = HOLD[i]

  if (info.phase === 'foundation') holdSec += 5
  if (info.phase === 'strength') restSec += 5
  if (info.phase === 'maintenance') {
    reps = Math.round(reps * 0.85)
    repsSide = Math.round(repsSide * 0.85)
  }
  if (info.isDeload) {
    workSec = round5(workSec * 0.8)
    restSec += 10
    reps = Math.round(reps * 0.75)
    repsSide = Math.round(repsSide * 0.75)
  }
  return { workSec, restSec, reps, repsSide, holdSec, warmSec: WARM[i] }
}

export const isPlyo = (ex: Exercise) => ex.category === 'plyo'

/** Build a dosed session item for an exercise placed in a given block. */
export function doseItem(
  ex: Exercise,
  blockType: BlockType,
  slot: Slot,
  dose: Dose,
  info: PhaseInfo,
  key: string,
): SessionItem {
  const perSide = !!ex.perSide
  let secPerRep = ex.secPerRep ?? 3
  const base = { key, exerciseId: ex.id, perSide, slot }

  if (ex.mode === 'time') {
    let sec: number
    if (blockType === 'warmup') sec = dose.warmSec
    else if (blockType === 'cooldown' || ex.category === 'mobility' || ex.category === 'cooldown') sec = dose.holdSec
    else if (isPlyo(ex) && info.phase === 'power') sec = Math.max(15, dose.workSec - 10)
    else sec = dose.workSec
    if (perSide) sec = Math.max(15, round5(sec * (blockType === 'warmup' ? 0.7 : 0.75)))
    return { ...base, mode: 'time', workSec: sec, secPerRep }
  }

  let note: string | undefined
  let reps = perSide ? dose.repsSide : Math.round(dose.reps * (ex.repScale ?? 1))
  if (isPlyo(ex)) reps = Math.round(reps * 0.7)
  if (ex.category === 'mobility') reps = Math.round(reps * 0.75)
  if (
    info.phase === 'foundation' &&
    blockType === 'strength' &&
    (ex.category === 'strength' || ex.category === 'upper') &&
    !ex.secPerRep
  ) {
    secPerRep += 1
    note = '3s lowering'
  }
  return { ...base, mode: 'reps', reps: Math.min(MAX_REPS, Math.max(4, reps)), secPerRep, note }
}

/** Seconds one pass through an item takes (both sides, no rest). */
export function itemWorkSec(item: SessionItem) {
  const sides = item.perSide ? 2 : 1
  const one = item.mode === 'time' ? (item.workSec ?? 30) : (item.reps ?? 8) * item.secPerRep
  return one * sides + (item.perSide ? SWITCH_SEC : 0)
}

export function blockSec(items: SessionItem[], rounds: number, restSec: number, roundRestSec: number) {
  if (!items.length) return 0
  const pass = items.reduce((s, it) => s + itemWorkSec(it), 0) + (items.length - 1) * restSec
  return rounds * pass + (rounds - 1) * roundRestSec
}
