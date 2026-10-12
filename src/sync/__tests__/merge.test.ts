import { describe, expect, it } from 'vitest'
import type { CompletedSession, Profile } from '@/domain/types'
import { deepEqual, diffForWrite, fromRemote, mergeOnSignIn, remotePatch, toRemote, type LocalData } from '../merge'

const session = (id: string, day: number, extra: Partial<CompletedSession> = {}): CompletedSession => ({
  id,
  weekKey: '2026-10-05',
  sessionId: 'A',
  title: 'Legs',
  completedAt: `2026-10-${String(day).padStart(2, '0')}T10:00:00.000Z`,
  durationSec: 1800,
  completion: 1,
  ...extra,
})

const profile = (daysPerWeek: 1 | 2 | 3): Profile => ({
  daysPerWeek,
  equipment: [],
  level: 2,
  goals: ['strength'],
  sessionMinutes: 30,
  seasonStart: null,
  planStart: '2026-09-07',
})

const state = (over: Partial<LocalData> = {}): LocalData => ({
  profile: profile(2),
  intensityAdjust: 0,
  swaps: {},
  weekTargets: { '2026-09-07': 2 },
  settings: { theme: 'system', sound: true, voice: false, haptics: true },
  history: [],
  ...over,
})

describe('mergeOnSignIn', () => {
  it('uploads everything when the account has no data yet', () => {
    const local = state({ history: [session('a', 6)] })
    const { merged, writes } = mergeOnSignIn(local, null)
    expect(merged).toEqual(local)
    const written = Object.fromEntries(writes.map((w) => [w.path.join('.'), w.value]))
    expect(written).toEqual(toRemote(local))
  })

  it('keeps the account fields and adds sessions done before signing in', () => {
    const remote = toRemote(state({ profile: profile(3), intensityAdjust: 1, history: [session('r1', 5)] }))
    const local = state({ profile: profile(1), history: [session('g1', 7), session('r1', 5, { feedback: 1 })] })
    const { merged, writes } = mergeOnSignIn(local, remote)
    expect(merged.profile?.daysPerWeek).toBe(3)
    expect(merged.intensityAdjust).toBe(1)
    expect(merged.history.map((h) => h.id)).toEqual(['r1', 'g1'])
    // The account's copy of a shared session wins.
    expect(merged.history[0].feedback).toBeUndefined()
    expect(writes).toEqual([{ path: ['history', 'g1'], value: local.history[0] }])
  })

  it('lets this device win when the account was never onboarded', () => {
    const remote = toRemote(state({ profile: null, history: [session('r1', 5)] }))
    const local = state({ profile: profile(1), history: [session('g1', 7)] })
    const { merged, writes } = mergeOnSignIn(local, remote)
    expect(merged.profile?.daysPerWeek).toBe(1)
    expect(merged.history.map((h) => h.id)).toEqual(['r1', 'g1'])
    expect(writes.map((w) => w.path.join('.'))).toEqual(['profile', 'intensityAdjust', 'swaps', 'weekTargets', 'settings', 'history.g1'])
  })

  it('writes the whole history map when the doc has none, never alongside per-entry paths', () => {
    const { profile: p, settings } = state()
    const { writes } = mergeOnSignIn(state({ history: [session('g1', 7)] }), { profile: p, settings })
    const paths = writes.map((w) => w.path.join('.'))
    expect(paths).toEqual(['history'])
  })
})

describe('diffForWrite', () => {
  it('writes only fields whose reference changed', () => {
    const prev = state()
    const next = { ...prev, settings: { ...prev.settings, voice: true } }
    expect(diffForWrite(prev, next)).toEqual([{ path: ['settings'], value: next.settings }])
    expect(diffForWrite(prev, { ...prev })).toEqual([])
  })

  it('writes new and changed history entries by id', () => {
    const a = session('a', 5)
    const prev = state({ history: [a] })
    const b = session('b', 6)
    const added = { ...prev, history: [a, b] }
    expect(diffForWrite(prev, added)).toEqual([{ path: ['history', 'b'], value: b }])

    const rated = { ...a, feedback: -1 as const }
    const withFeedback = { ...added, history: [rated, b], intensityAdjust: -1 }
    expect(diffForWrite(added, withFeedback)).toEqual([
      { path: ['intensityAdjust'], value: -1 },
      { path: ['history', 'a'], value: rated },
    ])
  })

  it('replaces the whole history map on reset', () => {
    const prev = state({ history: [session('a', 5), session('b', 6)] })
    const next = { ...prev, profile: null, history: [] }
    expect(diffForWrite(prev, next)).toEqual([
      { path: ['profile'], value: null },
      { path: ['history'], value: {} },
    ])
  })
})

describe('remotePatch', () => {
  it('returns null when the snapshot matches the store, regardless of key order', () => {
    const local = state({ history: [session('a', 5)], swaps: { 'w|A|1': { from: 'x', to: 'y' } } })
    const remote = JSON.parse(JSON.stringify(toRemote(local)))
    remote.settings = { haptics: true, voice: false, sound: true, theme: 'system' }
    expect(remotePatch(local, remote)).toBeNull()
  })

  it('patches only the fields another device changed', () => {
    const local = state({ history: [session('a', 5)] })
    const remote = toRemote({ ...local, history: [...local.history, session('b', 6)], settings: { ...local.settings, theme: 'dark' } })
    const patch = remotePatch(local, remote)
    expect(Object.keys(patch ?? {})).toEqual(['settings', 'history'])
    expect(patch?.history?.map((h) => h.id)).toEqual(['a', 'b'])
  })
})

describe('fromRemote', () => {
  it('fills settings added in later versions with defaults', () => {
    const fallback = state()
    const doc = { ...toRemote(fallback), settings: { theme: 'dark' } } as never
    expect(fromRemote(doc, fallback).settings).toEqual({ ...fallback.settings, theme: 'dark' })
  })
})

describe('deepEqual', () => {
  it('treats undefined fields as missing, like Firestore does', () => {
    expect(deepEqual({ a: 1, b: undefined }, { a: 1 })).toBe(true)
    expect(deepEqual([1, 2], [2, 1])).toBe(false)
    expect(deepEqual({ a: [1] }, { a: { 0: 1 } })).toBe(false)
  })
})
