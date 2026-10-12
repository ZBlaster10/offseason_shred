import type { SessionItem } from '@/domain/types'

export function formatClock(totalSec: number) {
  const s = Math.max(0, Math.round(totalSec))
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

export const formatMinutes = (sec: number) => `${Math.max(1, Math.round(sec / 60))} min`

export function dosageLabel(item: Pick<SessionItem, 'mode' | 'workSec' | 'reps' | 'perSide'>) {
  const side = item.perSide ? ' / side' : ''
  return item.mode === 'time' ? `${item.workSec}s${side}` : `${item.reps} reps${side}`
}

export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`
