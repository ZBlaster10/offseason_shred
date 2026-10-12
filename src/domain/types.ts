export type Level = 1 | 2 | 3
export type Goal = 'strength' | 'aerobic' | 'mobility'
export type DaysPerWeek = 1 | 2 | 3
export type SessionMinutes = 20 | 30 | 45

/** Owned equipment. Bodyweight and a sturdy chair/step are always assumed. */
export type EquipmentId =
  | 'kettlebell'
  | 'dumbbells'
  | 'straps'
  | 'bands'
  | 'balanceBoard'
  | 'jumpRope'
  | 'foamRoller'

export interface Profile {
  daysPerWeek: DaysPerWeek
  equipment: EquipmentId[]
  level: Level
  goals: Goal[]
  sessionMinutes: SessionMinutes
  /** ISO date (yyyy-MM-dd) of the first riding day, or null for "not sure". */
  seasonStart: string | null
  /** ISO date of the Monday of the week the plan started. */
  planStart: string
}

export type Phase = 'foundation' | 'strength' | 'power' | 'maintenance'

/** Generator slots an exercise can fill. */
export type Slot =
  | 'warmup'
  | 'cooldown'
  | 'mobility'
  | 'squat'
  | 'hinge'
  | 'lunge'
  | 'singleLeg'
  | 'calf'
  | 'push'
  | 'pull'
  | 'coreAntiExt'
  | 'coreAntiRot'
  | 'coreRot'
  | 'posterior'
  | 'balance'
  | 'cardio'
  | 'plyo'

export type Category =
  | 'warmup'
  | 'mobility'
  | 'core'
  | 'strength'
  | 'upper'
  | 'balance'
  | 'plyo'
  | 'cardio'
  | 'cooldown'

export type Source = 'SA' | 'MD-HIIT' | 'MD-30' | 'BUR' | 'R'

export interface Exercise {
  id: string
  name: string
  category: Category
  slots: Slot[]
  /** Empty = bodyweight. Otherwise the user needs at least one of these. */
  equipment: EquipmentId[]
  /** Household items needed, shown as info only. */
  needs?: ('chair' | 'wall' | 'mat' | 'space')[]
  difficulty: Level
  mode: 'time' | 'reps'
  perSide?: boolean
  /** Planning estimate of seconds per rep (default 3). */
  secPerRep?: number
  /** Rep multiplier for alternating moves counted across both sides (default 1). */
  repScale?: number
  /** Impact moves are trimmed for beginners and favored in the power phase. */
  impact?: boolean
  cues: string[]
  whyForRiding: string
  clip: string
  easier?: string
  harder?: string
  source: Source
}

export type BlockType = 'warmup' | 'strength' | 'aerobic' | 'mobility' | 'cooldown'

export interface SessionItem {
  /** Stable id within the session, used for swaps. */
  key: string
  exerciseId: string
  /** Slot the generator filled — swaps stay within it. */
  slot: Slot
  mode: 'time' | 'reps'
  /** Short coaching note, e.g. tempo. */
  note?: string
  /** Set when the user swapped this item; the generator's original pick. */
  swappedFrom?: string
  workSec?: number
  reps?: number
  perSide: boolean
  /** Seconds per rep used for planning and animation pace. */
  secPerRep: number
}

export interface Block {
  type: BlockType
  title: string
  rounds: number
  /** Rest after each exercise inside a round. */
  restSec: number
  /** Extra rest between rounds. */
  roundRestSec: number
  items: SessionItem[]
}

export type Focus =
  | 'strength-legs'
  | 'strength-singleLeg'
  | 'strength-full'
  | 'aerobic-intervals'
  | 'aerobic-plyo'
  | 'aerobic-mixed'
  | 'mobility-hips'
  | 'mobility-core'
  | 'mobility-flow'

export interface Session {
  /** 'A' | 'B' | 'C' */
  id: string
  title: string
  subtitle: string
  focus: Focus
  blocks: Block[]
  estimatedSec: number
  equipmentUsed: EquipmentId[]
}

export interface WeekPlan {
  weekKey: string
  weekIndex: number
  phase: Phase
  phaseWeek: number
  isDeload: boolean
  weeksToSeason: number | null
  sessions: Session[]
}

/**
 * Swaps keyed by `${weekKey}|${sessionId}|${itemKey}`. Applied only while the
 * generator still picks `from` for that item, so profile edits don't misapply them.
 */
export type SwapMap = Record<string, { from: string; to: string }>

export interface CompletedSession {
  id: string
  weekKey: string
  sessionId: string
  title: string
  /** ISO timestamp of completion. */
  completedAt: string
  durationSec: number
  /** 0..1 share of exercises completed (not skipped). */
  completion: number
  feedback?: -1 | 0 | 1
}

export type PlayerStepKind = 'prepare' | 'work' | 'rest' | 'switch'

export interface PlayerStep {
  kind: PlayerStepKind
  blockIndex: number
  itemIndex: number
  round: number
  exerciseId: string
  side?: 'L' | 'R'
  /** Seconds for timed steps (work in time mode, rests, prepare). */
  durationSec?: number
  /** Rep target for reps-mode work steps. */
  reps?: number
  secPerRep: number
  /** For rests/prepare: the exercise that comes next. */
  nextExerciseId?: string
}
