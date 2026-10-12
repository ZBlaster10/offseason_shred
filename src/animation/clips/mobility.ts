import { STAND_H, type Pose } from '../rig'
import type { Clip } from '../types'
import { A, fstand, halfKneel, ik, k, mirror, quadruped, seq, squat, stand } from './base'

export const mobilityClips: Record<string, Clip> = {
  ninetyNinety: {
    view: 'front',
    ms: 5000,
    props: { mat: true },
    thumb: 0.25,
    keys: (() => {
      const seat = { hip: [0, 13] as [number, number], torso: 180, armF: ik(29, 9), armB: ik(-29, 9) }
      const up: Pose = { ...seat, legF: [145, 20, 90], legB: [-145, -20, -90] }
      const right: Pose = { ...seat, torso: 174, head: 172, legF: [92, -95, -120], legB: [118, 35, 70] }
      return seq(up, right, up, mirror(right))
    })(),
  },

  hipFlexorStretch: {
    view: 'side',
    ms: 5000,
    props: { mat: true },
    thumb: 0.5,
    keys: [
      k(0, halfKneel({ armB: [-8, -4] })),
      k(0.35, halfKneel({ hip: [0, 39], torso: 188, head: 184, armB: [168, 172], armF: ik(28, 42) })),
      k(0.75, halfKneel({ hip: [0, 39], torso: 188, head: 184, armB: [168, 172], armF: ik(28, 42) })),
    ],
  },

  cossack: {
    view: 'front',
    ms: 7000,
    reps: 2,
    thumb: 0.25,
    keys: (() => {
      const center = fstand({ hip: [0, 67], legF: ik(40, A, 90), legB: ik(-40, A, -90), armF: ik(8, 104), armB: ik(-8, 104) })
      const left = {
        hip: [-30, 30] as [number, number],
        torso: 172,
        armF: ik(-12, 72),
        armB: ik(-24, 72),
        // The straight leg pivots onto its heel, toes up; the heel itself stays put.
        legF: ik(40, A + 2, 170),
        legB: ik(-40, A, -90),
      }
      return seq(center, left, center, mirror(left))
    })(),
  },

  deepSquatHold: {
    view: 'side',
    ms: 3500,
    keys: seq(
      squat(38, { armF: ik(14, 76), armB: ik(11, 76), hip: [-18, 38] }),
      squat(36, { armF: ik(14, 74), armB: ik(11, 74), hip: [-15, 36], torso: 146 }),
    ),
  },

  threadNeedle: {
    view: 'side',
    ms: 5000,
    props: { mat: true },
    thumb: 0.25,
    keys: (() => {
      // Open the chest to the viewer with the arm to the ceiling, then thread it under along the mat,
      // rotating the chest the other way. The supporting hand never moves.
      const base = quadruped()
      const open = quadruped({ twist: 70, look: 110, head: 150, armF: [170, 175] })
      const thread = quadruped({ hip: [-22, 40], torso: 94, head: 76, twist: -40, look: -35, armF: ik(-12, 5, { slide: true }) })
      return seq(base, open, base, thread)
    })(),
  },

  pigeon: {
    view: 'side',
    ms: 6000,
    props: { mat: true },
    thumb: 0.6,
    keys: [
      // Tall over the front shin with hands planted, then the hands slide forward on the mat into the fold.
      k(0, { hip: [0, 16], torso: 140, head: 150, armF: ik(36, 3, { slide: true }), armB: ik(32, 3, { slide: true }), legF: ik(-4, 6, 110), legB: ik(-70, 6, -95) }),
      k(0.35, { hip: [0, 16], torso: 92, head: 80, armF: ik(64, 3, { slide: true }), armB: ik(60, 3, { slide: true }), legF: ik(-4, 6, 110), legB: ik(-70, 6, -95) }),
      k(0.8, { hip: [0, 16], torso: 90, head: 78, armF: ik(64, 3, { slide: true }), armB: ik(60, 3, { slide: true }), legF: ik(-4, 6, 110), legB: ik(-70, 6, -95) }),
    ],
  },

  childPose: {
    view: 'side',
    ms: 5000,
    props: { mat: true },
    keys: seq(
      { hip: [-20, 20], torso: 82, head: 70, armF: ik(76, 5), armB: ik(72, 5), legF: ik(-24, 6, -95), legB: ik(-26, 6, -95) },
      { hip: [-21, 21], torso: 86, head: 74, armF: ik(76, 5), armB: ik(72, 5), legF: ik(-24, 6, -95), legB: ik(-26, 6, -95) },
    ),
  },

  quadStretch: {
    view: 'side',
    ms: 4000,
    thumb: 0.5,
    keys: seq(
      stand({ legF: [-16, -156, -120], legB: ik(-1, A), armF: ik(-25, 74), armB: [60, 70] }),
      stand({ hip: [1, STAND_H], torso: 182, legF: [-18, -158, -120], legB: ik(-1, A), armF: ik(-27, 74), armB: [64, 74] }),
    ),
  },

  forwardFold: {
    view: 'side',
    ms: 4000,
    keys: seq(
      { hip: [-12, STAND_H - 2], torso: 48, head: 30, armF: ik(26, 10), armB: ik(22, 10), legF: ik(3, A), legB: ik(-2, A) },
      { hip: [-13, STAND_H - 2], torso: 42, head: 24, armF: ik(22, 8), armB: ik(18, 8), legF: ik(3, A), legB: ik(-2, A) },
    ),
  },

  foamRollQuads: {
    view: 'side',
    ms: 3000,
    props: { roller: true, mat: true },
    keys: seq(
      // The forearms pull the body over the roller; the toes trail along the mat.
      { hip: [-12, 23], torso: 96, head: 96, roll: [-30, 8], armF: [0, 90], armB: [-2, 88], legF: ik(-80, 10, { end: -60, slide: true }), legB: ik(-82, 10, { end: -60, slide: true }) },
      { hip: [6, 23], torso: 96, head: 96, roll: [-30, 8], armF: [0, 90], armB: [-2, 88], legF: ik(-62, 10, { end: -60, slide: true }), legB: ik(-64, 10, { end: -60, slide: true }) },
    ),
  },

  foamRollCalves: {
    view: 'side',
    ms: 3000,
    props: { roller: true, mat: true },
    keys: seq(
      // Seated, leaning back on planted hands; the hips rock and the calves roll over the roller.
      { hip: [-14, 22], torso: 230, head: 200, roll: [36, 8], armF: ik(-46, 3), armB: ik(-50, 3), legF: ik(56, 17, 160), legB: ik(58, 18, 160) },
      { hip: [-4, 22], torso: 230, head: 200, roll: [36, 8], armF: ik(-46, 3), armB: ik(-50, 3), legF: ik(66, 17, 160), legB: ik(68, 18, 160) },
    ),
  },
}

