import { STAND_H, type Pose } from '../rig'
import type { Clip } from '../types'
import { A, fsquat, fstand, ik, k, onToes, plank, seq, squat, stand, w } from './base'

/** Crouched with the hands planted where they'll be in the plank and the feet where they stood. */
const handsDown: Pose = { hip: [-14, 40], torso: 104, head: 115, armF: ik(28, 3), armB: ik(25, 3), legF: ik(3, A), legB: ik(-3, A) }

export const cardioClips: Record<string, Clip> = {
  jumpingJacks: {
    view: 'front',
    ms: 1000,
    keys: seq(
      fstand({ hip: [0, STAND_H - 2], armF: [15, 10], armB: [-15, -10], legF: ik(9, A), legB: ik(-9, A) }),
      fstand({ hip: [0, STAND_H + 6], armF: [150, 165], armB: [-150, -165], legF: ik(26, A + 8, 100), legB: ik(-26, A + 8, -100) }),
    ),
  },

  mountainClimber: {
    view: 'side',
    ms: 900,
    props: { mat: true },
    keys: seq(plank(0, { legF: ik(-30, 22, 30) }), plank(0, { legB: ik(-33, 22, 30) })),
  },

  burpee: {
    view: 'side',
    ms: 4000,
    thumb: 0.35,
    keys: [
      k(0, stand()),
      k(0.15, handsDown),
      k(0.3, plank()),
      k(0.45, plank(16)),
      k(0.58, handsDown),
      // Drive up through the toes into the jump.
      k(0.65, { hip: [-6, 72], torso: 160, head: 165, armF: [120, 130], armB: [116, 126], legF: onToes(19.8, 45), legB: onToes(13.8, 45) }, 'out'),
      k(0.75, stand({ hip: [0, STAND_H + 18], legF: [4, 2, 55], legB: [-4, -2, 55], armF: [172, 176], armB: [168, 172] })),
      k(0.9, squat(64)),
    ],
  },

  burpeeStep: {
    view: 'side',
    ms: 5000,
    thumb: 0.45,
    keys: [
      k(0, stand()),
      k(0.15, handsDown),
      k(0.3, w(handsDown, { hip: [-24, 40], torso: 104, legB: plank().legB })),
      k(0.45, plank()),
      k(0.6, w(handsDown, { hip: [-24, 40], torso: 104, legB: plank().legB })),
      k(0.75, handsDown),
    ],
  },

  highKnees: {
    view: 'side',
    ms: 700,
    keys: seq(
      // Drive knees while bouncing on the toes of the support foot.
      stand({ hip: [0, STAND_H + 3], legF: [92, 4, 100], legB: onToes(14.8, 60), armF: [-30, 60], armB: [40, 140] }),
      stand({ hip: [0, STAND_H + 3], legB: [92, 4, 100], legF: onToes(18.8, 60), armB: [-30, 60], armF: [40, 140] }),
    ),
  },

  buttKicks: {
    view: 'side',
    ms: 700,
    keys: seq(
      stand({ hip: [0, STAND_H + 2], legF: [-12, -168, -140], legB: onToes(15.8, 50), armF: [-30, 60], armB: [40, 140] }),
      stand({ hip: [0, STAND_H + 2], legB: [-12, -168, -140], legF: onToes(17.8, 50), armB: [-30, 60], armF: [40, 140] }),
    ),
  },

  squatJacks: {
    view: 'front',
    ms: 1100,
    keys: seq(fsquat(56, 10, { armF: [60, 80], armB: [-60, -80] }), fsquat(60, 30, { armF: [70, 90], armB: [-70, -90] })),
  },

  jumpRope: {
    view: 'front',
    ms: 700,
    props: { rope: true },
    keys: [
      k(0, fstand({ hip: [0, STAND_H], rope: 0, armF: ik(26, 76), armB: ik(-26, 76), legF: ik(7, A), legB: ik(-7, A) }), 'linear'),
      k(0.5, fstand({ hip: [0, STAND_H + 7], rope: 0.5, armF: ik(26, 82), armB: ik(-26, 82), legF: ik(7, A + 7, 50), legB: ik(-7, A + 7, -50) }), 'linear'),
      k(0.999, fstand({ hip: [0, STAND_H], rope: 0.999, armF: ik(26, 76), armB: ik(-26, 76), legF: ik(7, A), legB: ik(-7, A) }), 'linear'),
    ],
  },

  fastFeet: {
    view: 'front',
    ms: 340,
    keys: seq(
      fsquat(66, 18, { armF: [30, 70], armB: [-34, -74], legF: ik(18, A + 8, 90) }),
      fsquat(66, 18, { armF: [34, 74], armB: [-30, -70], legB: ik(-18, A + 8, -90) }),
    ),
  },

  shadowCarve: {
    view: 'side',
    ms: 2600,
    props: { ghostBoard: true },
    keys: seq(
      { hip: [2, 58], torso: 150, head: 160, tilt: -14, armF: [60, 80], armB: [40, 60], legF: ik(8, A + 2), legB: ik(5, A + 2) },
      { hip: [-16, 58], torso: 172, head: 178, tilt: 14, armF: [80, 100], armB: [70, 90], legF: ik(-2, A + 2), legB: ik(-5, A + 2) },
    ),
  },
}
