import { describe, expect, it } from 'vitest'
import { phaseFor } from '../phases'

const planStart = '2026-06-01'

describe('phaseFor', () => {
  it('counts down Foundation → Strength → Power → In-season', () => {
    const season = '2026-12-14' // a Monday
    expect(phaseFor({ planStart, seasonStart: season }, '2026-09-28').phase).toBe('foundation') // 11 weeks out
    const s1 = phaseFor({ planStart, seasonStart: season }, '2026-10-19') // 8 weeks out
    expect(s1).toMatchObject({ phase: 'strength', phaseWeek: 1, weeksToSeason: 8 })
    const p1 = phaseFor({ planStart, seasonStart: season }, '2026-11-16') // 4 weeks out
    expect(p1).toMatchObject({ phase: 'power', phaseWeek: 1 })
    const p4 = phaseFor({ planStart, seasonStart: season }, '2026-12-07') // 1 week out: taper
    expect(p4).toMatchObject({ phase: 'power', phaseWeek: 4, isDeload: true })
    expect(phaseFor({ planStart, seasonStart: season }, '2026-12-14').phase).toBe('maintenance')
  })

  it('treats a mid-week season start as part of the current week', () => {
    const info = phaseFor({ planStart, seasonStart: '2026-10-21' }, '2026-10-19')
    expect(info.weeksToSeason).toBe(1)
    expect(info.phase).toBe('power')
  })

  it('every 4th week of a phase is lighter and progression resets', () => {
    const season = '2027-06-01'
    const weeks = ['2026-06-01', '2026-06-08', '2026-06-15', '2026-06-22', '2026-06-29']
    const infos = weeks.map((w) => phaseFor({ planStart, seasonStart: season }, w))
    expect(infos.map((i) => i.isDeload)).toEqual([false, false, false, true, false])
    expect(infos.map((i) => i.progression)).toEqual([0, 1, 2, 0, 1])
  })

  it('loops 4-week blocks when the season date is unknown', () => {
    const phases = Array.from({ length: 13 }, (_, i) => {
      const d = new Date(2026, 5, 1 + i * 7)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      return phaseFor({ planStart, seasonStart: null }, key).phase
    })
    expect(phases.slice(0, 4).every((p) => p === 'foundation')).toBe(true)
    expect(phases.slice(4, 8).every((p) => p === 'strength')).toBe(true)
    expect(phases.slice(8, 12).every((p) => p === 'power')).toBe(true)
    expect(phases[12]).toBe('foundation')
  })
})
