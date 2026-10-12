import type { CompletedSession, Profile, SwapMap } from '@/domain/types'
import type { Settings } from '@/store/useAppStore'

/**
 * Pure helpers for syncing the app store with the `users/{uid}` Firestore doc. No Firebase imports, so
 * they run in unit tests.
 *
 * Remote `history` is a map keyed by session id, and each entry is written at its own field path, so two
 * devices finishing workouts at the same time can't overwrite each other.
 */

/** The synced slice of the app store. The in-progress workout stays on the device. */
export interface LocalData {
  profile: Profile | null
  intensityAdjust: number
  swaps: SwapMap
  weekTargets: Record<string, number>
  settings: Settings
  history: CompletedSession[]
}

export interface RemoteData extends Omit<LocalData, 'history'> {
  history: Record<string, CompletedSession>
}

/** Fields written whole. `history` is handled per entry. */
export const FIELD_KEYS = ['profile', 'intensityAdjust', 'swaps', 'weekTargets', 'settings'] as const

/** One field write: a top-level field, or a single history entry. */
export interface FieldWrite {
  path: [string] | ['history', string]
  value: unknown
}

const byCompletedAt = (a: CompletedSession, b: CompletedSession) => a.completedAt.localeCompare(b.completedAt)

const historyMap = (history: CompletedSession[]) => Object.fromEntries(history.map((h) => [h.id, h]))

export function pickLocal(s: LocalData): LocalData {
  const { profile, intensityAdjust, swaps, weekTargets, settings, history } = s
  return { profile, intensityAdjust, swaps, weekTargets, settings, history }
}

export function toRemote(s: LocalData): RemoteData {
  const { history, ...fields } = pickLocal(s)
  return { ...fields, history: historyMap(history) }
}

/** Reads a remote doc, falling back to `fallback` for anything it's missing. */
export function fromRemote(doc: Partial<RemoteData>, fallback: LocalData): LocalData {
  return {
    profile: doc.profile !== undefined ? doc.profile : fallback.profile,
    intensityAdjust: doc.intensityAdjust ?? fallback.intensityAdjust,
    swaps: doc.swaps ?? fallback.swaps,
    weekTargets: doc.weekTargets ?? fallback.weekTargets,
    // Settings added in later versions keep their defaults.
    settings: { ...fallback.settings, ...doc.settings },
    history: doc.history ? Object.values(doc.history).sort(byCompletedAt) : fallback.history,
  }
}

/**
 * First sync after signing in on this device.
 * - No account data yet: this device's data becomes the account's.
 * - The account was created but never onboarded, and this device has a plan: this device's fields win.
 * - Otherwise the account's fields win.
 * History is always the union, so workouts done before signing in are kept.
 */
export function mergeOnSignIn(local: LocalData, remote: Partial<RemoteData> | null): { merged: LocalData; writes: FieldWrite[] } {
  if (!remote) {
    const full = toRemote(local)
    return { merged: pickLocal(local), writes: Object.entries(full).map(([k, value]) => ({ path: [k], value })) }
  }

  const localWins = !remote.profile && local.profile !== null
  const writes: FieldWrite[] = []
  const base = localWins ? pickLocal(local) : fromRemote(remote, local)
  if (localWins) for (const k of FIELD_KEYS) writes.push({ path: [k], value: local[k] })

  const remoteHistory = remote.history ?? {}
  const localOnly = local.history.filter((h) => !remoteHistory[h.id])
  const history = [...Object.values(remoteHistory), ...localOnly]
  // Firestore rejects an update that sets both `history` and `history.<id>`.
  if (!remote.history) writes.push({ path: ['history'], value: historyMap(history) })
  else for (const h of localOnly) writes.push({ path: ['history', h.id], value: h })

  return { merged: { ...base, history: history.sort(byCompletedAt) }, writes }
}

/**
 * Field writes for a local store change. Zustand replaces only the slices that changed, so reference
 * checks are enough. A history entry that disappears (reset) rewrites the whole map.
 */
export function diffForWrite(prev: LocalData, next: LocalData): FieldWrite[] {
  const writes: FieldWrite[] = []
  for (const k of FIELD_KEYS) if (prev[k] !== next[k]) writes.push({ path: [k], value: next[k] })

  if (prev.history !== next.history) {
    const nextIds = new Set(next.history.map((h) => h.id))
    if (prev.history.some((h) => !nextIds.has(h.id))) {
      writes.push({ path: ['history'], value: historyMap(next.history) })
    } else {
      const prevById = new Map(prev.history.map((h) => [h.id, h]))
      for (const h of next.history) if (prevById.get(h.id) !== h) writes.push({ path: ['history', h.id], value: h })
    }
  }
  return writes
}

/**
 * The store patch that brings `current` in line with a remote snapshot, or null when they already match.
 * Unchanged fields are left out so their references stay stable and nothing re-renders.
 */
export function remotePatch(current: LocalData, doc: Partial<RemoteData>): Partial<LocalData> | null {
  const next = fromRemote(doc, current)
  const patch: Partial<LocalData> = {}
  let changed = false
  for (const k of [...FIELD_KEYS, 'history'] as const) {
    if (!deepEqual(current[k], next[k])) {
      Object.assign(patch, { [k]: next[k] })
      changed = true
    }
  }
  return changed ? patch : null
}

/** Structural equality for JSON-like data. Key order is ignored, since Firestore returns map keys sorted. */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false
  if (Array.isArray(a) !== Array.isArray(b)) return false
  const ka = Object.keys(a).filter((k) => (a as Record<string, unknown>)[k] !== undefined)
  const kb = Object.keys(b).filter((k) => (b as Record<string, unknown>)[k] !== undefined)
  if (ka.length !== kb.length) return false
  return ka.every((k) => deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]))
}
