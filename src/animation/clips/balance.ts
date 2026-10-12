import { STAND_H, type Pose } from '../rig'
import type { Clip } from '../types'
import { A, fsquat, ik, onToes, seq, stand } from './base'

const BOARD_ANKLE = 25
const FEET = 28

/** Front-view balance-board pose with the feet following the board tilt. */
const onBoard = (h: number, tilt: number, o: Partial<Pose> = {}): Pose => {
  const dy = FEET * Math.sin((tilt * Math.PI) / 180)
  return fsquat(h, FEET, {
    tilt,
    hip: [tilt * 0.4, h],
    torso: 180 + tilt * 0.4,
    legF: ik(FEET, BOARD_ANKLE - dy, 90),
    legB: ik(-FEET, BOARD_ANKLE + dy, -90),
    ...o,
  })
}

export const balanceClips: Record<string, Clip> = {
  slBalance: {
    view: 'side',
    ms: 3200,
    keys: seq(
      stand({ legF: ik(1, A), legB: [44, -14, 100], armF: [28, 36], armB: [-26, -18] }),
      stand({ hip: [1.5, STAND_H], torso: 178, legF: ik(1, A), legB: [46, -12, 100], armF: [32, 40], armB: [-22, -14] }),
      stand({ legF: ik(1, A), legB: [44, -14, 100], armF: [28, 36], armB: [-26, -18] }),
      stand({ hip: [-1.5, STAND_H], torso: 182, legF: ik(1, A), legB: [42, -16, 100], armF: [24, 32], armB: [-30, -22] }),
    ),
  },

  slReach: {
    view: 'side',
    ms: 5000,
    reps: 1,
    keys: seq(
      stand({ hip: [0, 72], legF: ik(2, A), legB: [30, -20, 100], armF: [30, 40], armB: [-24, -16] }),
      stand({ hip: [-4, 66], torso: 172, legF: ik(2, A), legB: ik(46, A + 2, 100), armF: [40, 50], armB: [20, 30] }),
      stand({ hip: [0, 72], legF: ik(2, A), legB: [30, -20, 100], armF: [30, 40], armB: [-24, -16] }),
      stand({ hip: [2, 66], torso: 160, legF: ik(2, A), legB: onToes(-40, 40), armF: [60, 70], armB: [50, 60] }),
    ),
  },

  rdlHighKnee: {
    view: 'side',
    ms: 3500,
    reps: 1,
    keys: seq(
      { hip: [-6, 70], torso: 98, head: 104, armF: [-20, -10], armB: [30, 20], legF: ik(1, A), legB: [-86, -86, -10] },
      // Drive up onto the toes of the standing foot as the knee comes through.
      stand({ hip: [4, 82], legF: onToes(17.8, 62), legB: [92, 2, 100], armF: [-30, 60], armB: [40, 140] }),
    ),
  },

  boardStance: {
    view: 'front',
    ms: 3200,
    props: { board: true },
    keys: seq(
      onBoard(88, -6, { armF: [70, 80], armB: [-70, -60] }),
      onBoard(87, 0, { armF: [74, 84], armB: [-74, -84] }),
      onBoard(88, 6, { armF: [60, 70], armB: [-80, -90] }),
      onBoard(87, 0, { armF: [74, 84], armB: [-74, -84] }),
    ),
  },

  boardSquat: {
    view: 'front',
    ms: 3500,
    reps: 1,
    props: { board: true },
    keys: seq(onBoard(90, 2, { armF: [40, 50], armB: [-40, -50] }), onBoard(62, -2, { armF: [80, 90], armB: [-80, -90] })),
  },
}

