import type { PlayerStep, Session } from '@/domain/types'
import { SWITCH_SEC } from './dosage'
import { BLOCK_TRANSITION_SEC, PREPARE_SEC } from './generatePlan'

/** Flatten a session into the linear list of steps the workout player walks through. */
export function buildTimeline(session: Session): PlayerStep[] {
  const steps: PlayerStep[] = []
  const first = session.blocks[0]?.items[0]
  if (!first) return steps

  steps.push({
    kind: 'prepare',
    blockIndex: 0,
    itemIndex: 0,
    round: 1,
    exerciseId: first.exerciseId,
    nextExerciseId: first.exerciseId,
    durationSec: PREPARE_SEC,
    secPerRep: first.secPerRep,
  })

  session.blocks.forEach((block, bi) => {
    if (bi > 0 && block.items.length) {
      const it = block.items[0]
      steps.push({
        kind: 'rest',
        blockIndex: bi,
        itemIndex: 0,
        round: 1,
        exerciseId: it.exerciseId,
        nextExerciseId: it.exerciseId,
        durationSec: BLOCK_TRANSITION_SEC,
        secPerRep: it.secPerRep,
      })
    }
    for (let round = 1; round <= block.rounds; round++) {
      block.items.forEach((item, ii) => {
        const sides: ('R' | 'L' | undefined)[] = item.perSide ? ['R', 'L'] : [undefined]
        sides.forEach((side, si) => {
          if (si === 1) {
            steps.push({
              kind: 'switch',
              blockIndex: bi,
              itemIndex: ii,
              round,
              exerciseId: item.exerciseId,
              side,
              durationSec: SWITCH_SEC,
              secPerRep: item.secPerRep,
            })
          }
          steps.push({
            kind: 'work',
            blockIndex: bi,
            itemIndex: ii,
            round,
            exerciseId: item.exerciseId,
            side,
            durationSec: item.mode === 'time' ? item.workSec : undefined,
            reps: item.mode === 'reps' ? item.reps : undefined,
            secPerRep: item.secPerRep,
          })
        })

        const lastInRound = ii === block.items.length - 1
        const next = lastInRound ? block.items[0] : block.items[ii + 1]
        const restSec = lastInRound ? (round < block.rounds ? block.roundRestSec : 0) : block.restSec
        if (restSec > 0) {
          steps.push({
            kind: 'rest',
            blockIndex: bi,
            itemIndex: lastInRound ? 0 : ii + 1,
            round: lastInRound ? round + 1 : round,
            exerciseId: next.exerciseId,
            nextExerciseId: next.exerciseId,
            durationSec: restSec,
            secPerRep: next.secPerRep,
          })
        }
      })
    }
  })
  return steps
}

/** Planned seconds for a step (reps estimated from pace). */
export const stepPlannedSec = (s: PlayerStep) => s.durationSec ?? (s.reps ?? 0) * s.secPerRep

export const countWorkSteps = (steps: PlayerStep[]) => steps.filter((s) => s.kind === 'work').length
