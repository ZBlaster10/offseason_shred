import { describe, expect, it } from 'vitest'
import { EXERCISES, EXERCISE_MAP } from '@/data/exercises'
import type { DaysPerWeek, EquipmentId, Goal, Level, Profile, SessionMinutes } from '@/domain/types'
import { generateWeek, hasEquipment, swapOptions } from '../generatePlan'
import { buildTimeline, stepPlannedSec } from '../timeline'

const WEEK = '2026-10-12'
const base: Profile = {
  daysPerWeek: 2,
  equipment: [],
  level: 2,
  goals: ['strength', 'aerobic', 'mobility'],
  sessionMinutes: 30,
  seasonStart: '2026-12-20',
  planStart: WEEK,
}

const GOAL_SETS: Goal[][] = [
  ['strength'],
  ['aerobic'],
  ['mobility'],
  ['strength', 'aerobic'],
  ['strength', 'mobility'],
  ['aerobic', 'mobility'],
  ['strength', 'aerobic', 'mobility'],
]
const EQUIPMENT_SETS: EquipmentId[][] = [
  [],
  ['kettlebell'],
  ['straps', 'bands'],
  ['dumbbells', 'jumpRope', 'foamRoller'],
  ['kettlebell', 'dumbbells', 'straps', 'bands', 'balanceBoard', 'jumpRope', 'foamRoller'],
]
const SEASONS = ['2027-03-01', '2026-12-20', '2026-11-01', null]

function* profiles(): Generator<Profile> {
  let i = 0
  for (const level of [1, 2, 3] as Level[])
    for (const sessionMinutes of [20, 30, 45] as SessionMinutes[])
      for (const goals of GOAL_SETS)
        for (const equipment of EQUIPMENT_SETS)
          for (const daysPerWeek of [1, 2, 3] as DaysPerWeek[]) {
            yield { ...base, level, sessionMinutes, goals, equipment, daysPerWeek, seasonStart: SEASONS[i++ % SEASONS.length] }
          }
}

describe('exercise library', () => {
  it('has unique ids and valid easier/harder links', () => {
    const ids = new Set(EXERCISES.map((e) => e.id))
    expect(ids.size).toBe(EXERCISES.length)
    for (const e of EXERCISES) {
      if (e.easier) expect(EXERCISE_MAP[e.easier], `${e.id}.easier`).toBeDefined()
      if (e.harder) expect(EXERCISE_MAP[e.harder], `${e.id}.harder`).toBeDefined()
    }
  })

  it('every slot has a bodyweight option at beginner level', () => {
    const slots = new Set(EXERCISES.flatMap((e) => e.slots))
    for (const slot of slots) {
      const ok = EXERCISES.some((e) => e.slots.includes(slot) && e.equipment.length === 0 && e.difficulty === 1)
      expect(ok, slot).toBe(true)
    }
  })
})

describe('generateWeek', () => {
  it('respects days, goals, equipment, level and duration for every profile combination', () => {
    let count = 0
    let repeatFree = 0
    let sessionsSeen = 0
    for (const p of profiles()) {
      const week = generateWeek(p, WEEK)
      const label = JSON.stringify({ ...p, planStart: undefined })
      expect(week.sessions.length, label).toBe(p.daysPerWeek)

      const types = new Set(week.sessions.flatMap((s) => s.blocks.map((b) => b.type)))
      for (const g of p.goals) expect(types.has(g), `${label} missing ${g}`).toBe(true)

      for (const s of week.sessions) {
        expect(s.blocks[0].type).toBe('warmup')
        expect(s.blocks.at(-1)!.type).toBe('cooldown')
        const target = p.sessionMinutes * 60
        expect(Math.abs(s.estimatedSec - target) / target, `${label} ${s.id} ${s.estimatedSec}s`).toBeLessThanOrEqual(0.1)

        for (const b of s.blocks) {
          const blockIds = b.items.map((i) => i.exerciseId)
          expect(new Set(blockIds).size, `${label} duplicate in ${b.title}`).toBe(blockIds.length)
        }
        const ids = s.blocks.flatMap((b) => b.items.map((i) => i.exerciseId))
        expect(ids.length - new Set(ids).size, `${label} too many repeats`).toBeLessThanOrEqual(3)
        if (p.level > 1 || p.equipment.length) {
          sessionsSeen++
          if (ids.length === new Set(ids).size) repeatFree++
        }
        for (const id of ids) {
          const ex = EXERCISE_MAP[id]
          expect(hasEquipment(ex, p.equipment), `${label} ${id} needs equipment`).toBe(true)
        }
        for (const b of s.blocks) {
          if (b.type === 'warmup' || b.type === 'cooldown') continue
          for (const it of b.items) expect(EXERCISE_MAP[it.exerciseId].difficulty, `${label} ${it.exerciseId}`).toBeLessThanOrEqual(p.level)
        }
      }
      count++
    }
    expect(count).toBe(3 * 3 * 7 * 5 * 3)
    // Repeats are a rare fallback, not the norm.
    expect(repeatFree / sessionsSeen).toBeGreaterThan(0.75)
  })

  it('is deterministic for the same profile and week', () => {
    const a = generateWeek(base, WEEK)
    const b = generateWeek(base, WEEK)
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })

  it('varies exercises from week to week', () => {
    const ids = (k: string) => generateWeek(base, k).sessions.flatMap((s) => s.blocks.flatMap((b) => b.items.map((i) => i.exerciseId))).join()
    expect(ids(WEEK)).not.toBe(ids('2026-10-19'))
  })

  it('uses owned equipment when available', () => {
    const p: Profile = { ...base, equipment: ['kettlebell'], goals: ['strength'], daysPerWeek: 2 }
    const week = generateWeek(p, WEEK)
    expect(week.sessions.every((s) => s.equipmentUsed.includes('kettlebell'))).toBe(true)
  })

  it('gives advanced riders more volume than beginners', () => {
    const work = (level: Level) => {
      const s = generateWeek({ ...base, level, goals: ['strength'] }, WEEK).sessions[0]
      const main = s.blocks.find((b) => b.type === 'strength')!
      return main.items.reduce((sum, it) => sum + (it.reps ?? 0) + (it.workSec ?? 0), 0) / main.items.length
    }
    expect(work(3)).toBeGreaterThan(work(1))
  })

  it('applies intensity feedback', () => {
    const reps = (adj: number) =>
      generateWeek({ ...base, goals: ['strength'] }, WEEK, { intensityAdjust: adj }).sessions[0].blocks[1].items.find((i) => i.mode === 'reps')?.reps ?? 0
    expect(reps(1)).toBeGreaterThan(reps(-1))
  })

  it('applies swaps only while the original pick is unchanged', () => {
    const week = generateWeek(base, WEEK)
    const session = week.sessions[0]
    const item = session.blocks[1].items[0]
    const alt = swapOptions(item, session, base)[0]
    expect(alt).toBeDefined()
    expect(alt.slots).toContain(item.slot)
    const key = `${WEEK}|${session.id}|${item.key}`
    const swapped = generateWeek(base, WEEK, { swaps: { [key]: { from: item.exerciseId, to: alt.id } } })
    const it2 = swapped.sessions[0].blocks[1].items[0]
    expect(it2.exerciseId).toBe(alt.id)
    expect(it2.swappedFrom).toBe(item.exerciseId)

    const stale = generateWeek(base, WEEK, { swaps: { [key]: { from: 'not-the-original', to: alt.id } } })
    expect(stale.sessions[0].blocks[1].items[0].exerciseId).toBe(item.exerciseId)
  })
})

describe('buildTimeline', () => {
  it('covers every item, side and round, and matches the session estimate', () => {
    const p: Profile = { ...base, daysPerWeek: 3, equipment: ['straps'] }
    for (const s of generateWeek(p, WEEK).sessions) {
      const steps = buildTimeline(s)
      const expectedWork = s.blocks.reduce((sum, b) => sum + b.rounds * b.items.reduce((n, it) => n + (it.perSide ? 2 : 1), 0), 0)
      expect(steps.filter((x) => x.kind === 'work').length).toBe(expectedWork)
      expect(steps[0].kind).toBe('prepare')
      const total = steps.reduce((sum, x) => sum + stepPlannedSec(x), 0)
      expect(Math.abs(total - s.estimatedSec)).toBeLessThanOrEqual(1)
    }
  })
})
