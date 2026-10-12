import { differenceInCalendarDays, parseISO } from 'date-fns'
import type { Phase, Profile } from '@/domain/types'
import { weeksBetween } from './dates'

export interface PhaseInfo {
  phase: Phase
  /** 1-based week within the phase. */
  phaseWeek: number
  /** Week number since the plan started (0-based). */
  weekIndex: number
  isDeload: boolean
  weeksToSeason: number | null
  /** 0..4 progression steps used to nudge volume up week over week. */
  progression: number
}

const CYCLE: Phase[] = ['foundation', 'strength', 'power']

export function phaseFor(profile: Pick<Profile, 'planStart' | 'seasonStart'>, weekKey: string): PhaseInfo {
  const weekIndex = Math.max(0, weeksBetween(profile.planStart, weekKey))

  let phase: Phase
  let phaseWeek: number
  let blockBump: number
  let weeksToSeason: number | null = null

  if (profile.seasonStart) {
    weeksToSeason = Math.ceil(differenceInCalendarDays(parseISO(profile.seasonStart), parseISO(weekKey)) / 7)
    if (weeksToSeason <= 0) {
      phase = 'maintenance'
      phaseWeek = 1 - weeksToSeason
    } else if (weeksToSeason <= 4) {
      phase = 'power'
      phaseWeek = 5 - weeksToSeason
    } else if (weeksToSeason <= 8) {
      phase = 'strength'
      phaseWeek = 9 - weeksToSeason
    } else {
      phase = 'foundation'
      phaseWeek = weekIndex + 1
    }
    blockBump = Math.min(Math.floor((phaseWeek - 1) / 4), 2)
  } else {
    const cycleWeek = weekIndex % 12
    phase = CYCLE[Math.floor(cycleWeek / 4)]
    phaseWeek = (cycleWeek % 4) + 1
    blockBump = Math.min(Math.floor(weekIndex / 12), 2)
  }

  const mesoWeek = ((phaseWeek - 1) % 4) + 1
  const isDeload = phase !== 'maintenance' && mesoWeek === 4
  const progression = isDeload ? 0 : Math.min(mesoWeek - 1, 2) + blockBump

  return { phase, phaseWeek, weekIndex, isDeload, weeksToSeason, progression }
}

export const PHASE_META: Record<Phase, { name: string; blurb: string }> = {
  foundation: {
    name: 'Foundation',
    blurb: 'Build the base: controlled tempo strength, mobility and an aerobic engine.',
  },
  strength: {
    name: 'Strength',
    blurb: 'Load it up: single-leg strength, eccentrics and harder variations.',
  },
  power: {
    name: 'Power',
    blurb: 'Pre-season: plyometrics, landings and spins so you peak for day one.',
  },
  maintenance: {
    name: 'In-Season',
    blurb: 'You’re riding! Shorter, lighter sessions to stay strong and injury-free.',
  },
}
