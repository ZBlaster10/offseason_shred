import { describe, expect, it } from 'vitest'
import type { CompletedSession } from '@/domain/types'
import { computeStreak } from '../streak'

let n = 0
const done = (weekKey: string, completion = 1): CompletedSession => ({
  id: String(n++),
  weekKey,
  sessionId: 'A',
  title: 'Test',
  completedAt: `${weekKey}T10:00:00.000Z`,
  durationSec: 1800,
  completion,
})

const first = '2026-09-07'
// Wednesday of the week starting 2026-10-12
const today = new Date(2026, 9, 14, 12)

describe('computeStreak', () => {
  it('counts consecutive completed weeks and keeps the in-progress week neutral', () => {
    const history = ['2026-09-21', '2026-09-28', '2026-10-05'].flatMap((w) => [done(w), done(w)])
    const r = computeStreak({ history, weekTargets: {}, defaultTarget: 2, firstWeekKey: '2026-09-21', today })
    expect(r.current).toBe(3)
    expect(r.weeks['2026-10-12']).toBe('inProgress')
    expect(r.thisWeek).toMatchObject({ done: 0, target: 2, daysLeft: 5, complete: false })
  })

  it('a missed week resets the streak', () => {
    const history = [done('2026-09-07'), done('2026-09-21'), done('2026-10-05')]
    const r = computeStreak({ history, weekTargets: {}, defaultTarget: 1, firstWeekKey: first, today })
    expect(r.weeks['2026-09-14']).toBe('missed')
    expect(r.weeks['2026-09-28']).toBe('missed')
    expect(r.current).toBe(1)
    expect(r.best).toBe(1)
  })

  it('only sessions with at least 80% completion count', () => {
    const history = [done('2026-10-05', 0.79), done('2026-10-05', 0.8)]
    const r = computeStreak({ history, weekTargets: {}, defaultTarget: 2, firstWeekKey: '2026-10-05', today })
    expect(r.weeks['2026-10-05']).toBe('missed')
  })

  it('uses per-week target snapshots so editing the plan never rewrites history', () => {
    const history = [done('2026-09-28'), done('2026-10-05')]
    const r = computeStreak({
      history,
      weekTargets: { '2026-09-28': 1, '2026-10-05': 1 },
      defaultTarget: 3,
      firstWeekKey: '2026-09-28',
      today,
    })
    expect(r.current).toBe(2)
    expect(r.thisWeek.target).toBe(3)
  })

  it('completing this week extends the streak immediately', () => {
    const history = [done('2026-10-05'), done('2026-10-12')]
    const r = computeStreak({ history, weekTargets: {}, defaultTarget: 1, firstWeekKey: '2026-10-05', today })
    expect(r.current).toBe(2)
    expect(r.thisWeek.complete).toBe(true)
  })

  it('earns a freeze every 4 completed weeks and spends it on a missed week', () => {
    const weeks = ['2026-08-10', '2026-08-17', '2026-08-24', '2026-08-31'] // 4 complete → 1 freeze
    const history = [...weeks.map((w) => done(w)), done('2026-09-14')] // 2026-09-07 missed → frozen
    const r = computeStreak({
      history,
      weekTargets: {},
      defaultTarget: 1,
      firstWeekKey: '2026-08-10',
      today: new Date(2026, 8, 16),
    })
    expect(r.weeks['2026-09-07']).toBe('frozen')
    expect(r.current).toBe(5)
    expect(r.freezes).toBe(0)
  })

  it('flags the week as at risk when there is little slack left', () => {
    const sunday = new Date(2026, 9, 18, 9)
    const r = computeStreak({ history: [], weekTargets: {}, defaultTarget: 1, firstWeekKey: '2026-10-12', today: sunday })
    expect(r.thisWeek.daysLeft).toBe(1)
    expect(r.thisWeek.atRisk).toBe(true)
    const monday = computeStreak({ history: [], weekTargets: {}, defaultTarget: 2, firstWeekKey: '2026-10-12', today: new Date(2026, 9, 12) })
    expect(monday.thisWeek.atRisk).toBe(false)
  })
})
