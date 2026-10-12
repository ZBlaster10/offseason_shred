import { STAND_H, type Pose } from '../rig'
import type { Clip } from '../types'
import { A, fsquat, fstand, ik, k, lunge, mirror, onToes, seq, squat, stand, swapSides, w } from './base'

const deep = squat(40)
// Reverse lunges: the front foot stays planted where it stood and the other foot steps back onto its toes.
const stepBack = lunge(42, 3, -40)
const stepBack2 = swapSides(lunge(42, -3, -46))
const tallArms = { armF: [20, 40], armB: [14, 34] } as Partial<Pose>

/** Standing on the near (F) leg, far leg lifted slightly. */
const oneLeg = (o: Partial<Pose> = {}) => stand({ legF: ik(1, A), legB: [24, -14, 100], ...o })

const rdlBottom = (o: Partial<Pose> = {}): Pose => ({
  hip: [-6, 70],
  torso: 98,
  head: 104,
  armF: [6, 4],
  armB: [2, 0],
  legF: ik(1, A),
  legB: [-86, -86, -10],
  ...o,
})

export const lowerClips: Record<string, Clip> = {
  stand: { view: 'side', ms: 3000, keys: seq(stand(), stand({ hip: [0, STAND_H - 1] })) },

  squat: { view: 'side', ms: 3000, reps: 1, props: { weight: 'goblet' }, keys: [k(0, w(stand(), tallArms)), k(0.5, deep)] },

  squatSlow: {
    view: 'side',
    ms: 6500,
    reps: 1,
    keys: [k(0, w(stand(), tallArms), 'linear'), k(0.75, deep)],
  },

  stanceSquat: {
    view: 'front',
    ms: 3000,
    reps: 1,
    props: { ghostBoard: true },
    keys: [
      k(0, fstand({ hip: [0, 72], legF: ik(26, A, 70), legB: ik(-26, A, -70), armF: [40, 30], armB: [-40, -30] })),
      k(0.5, fsquat(52, 26, { armF: [70, 80], armB: [-70, -80] })),
    ],
  },

  reverseLunge: { view: 'side', ms: 6000, reps: 2, thumb: 0.25, keys: seq(stand(), stepBack, stand(), stepBack2) },

  squatReverseLunge: {
    view: 'side',
    ms: 9000,
    reps: 2,
    thumb: 0.375,
    keys: seq(stand(), deep, stand(), stepBack, stand(), deep, stand(), stepBack2),
  },

  lateralLunge: {
    view: 'front',
    ms: 6000,
    reps: 2,
    props: { weight: 'goblet' },
    thumb: 0.25,
    keys: (() => {
      // Step wide with the far foot and sit into that hip; the near leg stays planted and straightens.
      const side: Pose = { hip: [-50, 44], torso: 166, head: 172, armF: ik(-38, 74), armB: ik(-48, 74), legF: ik(11, A, 100), legB: ik(-62, A, -90) }
      const s = fstand({ armF: ik(8, 96), armB: ik(-8, 96) })
      return seq(s, side, s, mirror(side))
    })(),
  },

  wallSit: {
    view: 'side',
    ms: 2500,
    props: { wall: -30 },
    keys: seq(
      { hip: [-20, 40], torso: 178, armF: [86, 88], armB: [80, 84], legF: ik(16, A), legB: ik(12, A) },
      { hip: [-20, 39.5], torso: 178, armF: [84, 86], armB: [78, 82], legF: ik(16, A), legB: ik(12, A) },
    ),
  },

  slSquatChair: {
    view: 'side',
    ms: 3500,
    reps: 1,
    props: { chair: { x: -30, facing: 1 } },
    keys: seq(
      oneLeg({ legF: ik(6, A), legB: [40, 20, 110], armF: [60, 70], armB: [50, 60] }),
      { hip: [-24, 50], torso: 140, armF: [90, 92], armB: [86, 88], legF: ik(6, A), legB: [86, 60, 120] },
    ),
  },

  pistol: {
    view: 'side',
    ms: 4000,
    reps: 1,
    keys: seq(
      oneLeg({ legF: ik(4, A), legB: [30, 28, 110], armF: [70, 80], armB: [64, 74] }),
      { hip: [-16, 30], torso: 140, armF: [92, 94], armB: [88, 90], legF: ik(4, A), legB: [84, 84, 130] },
    ),
  },

  strapPistol: {
    view: 'side',
    ms: 4000,
    reps: 1,
    props: { straps: { anchor: [72, 188], to: 'hands' } },
    keys: seq(
      oneLeg({ legF: ik(4, A), legB: [30, 28, 110], armF: ik(40, 118), armB: ik(38, 116) }),
      { hip: [-16, 30], torso: 146, armF: ik(34, 84), armB: ik(32, 82), legF: ik(4, A), legB: [84, 84, 130] },
    ),
  },

  bulgarian: {
    view: 'side',
    ms: 3500,
    reps: 1,
    props: { chair: { x: -56, facing: -1 }, weight: 'goblet' },
    keys: seq(
      { hip: [-10, 70], torso: 180, armF: [14, 30], armB: [-10, 10], legF: ik(20, A), legB: ik(-48, 50, -95) },
      { hip: [-12, 40], torso: 172, armF: [30, 50], armB: [-6, 30], legF: ik(20, A), legB: ik(-48, 50, -95) },
    ),
  },

  slRdl: {
    view: 'side',
    ms: 3500,
    reps: 1,
    props: { weight: 'handF' },
    keys: seq(oneLeg({ armF: [4, 4], armB: [-6, -4] }), rdlBottom()),
  },

  calfRaiseRdl: {
    view: 'side',
    ms: 5000,
    reps: 1,
    thumb: 0.66,
    keys: seq(
      oneLeg({ hip: [0, STAND_H - 0.5], armF: [10, 20], armB: [-10, -4] }),
      oneLeg({ hip: [5, STAND_H + 7], legF: onToes(17.8, 58), armF: [20, 30], armB: [-20, -10] }),
      oneLeg({ hip: [0, STAND_H - 0.5], armF: [10, 20], armB: [-10, -4] }),
      rdlBottom(),
    ),
  },

  soleusRaise: {
    view: 'side',
    ms: 2400,
    reps: 1,
    keys: seq(
      stand({ hip: [-6, 64], torso: 172, legF: ik(5, A), legB: ik(1, A), armF: [30, 50], armB: [20, 40] }),
      stand({ hip: [-1, 72], torso: 172, legF: onToes(21.8, 58), legB: onToes(17.8, 58), armF: [30, 50], armB: [20, 40] }),
    ),
  },

  calfRaise: {
    view: 'side',
    ms: 2400,
    reps: 1,
    keys: seq(
      stand({ legF: ik(1, A), legB: [-4, -100, -10], armF: [14, 20], armB: [-14, -8] }),
      stand({ hip: [5, STAND_H + 7], legF: onToes(17.8, 58), legB: [-4, -100, -10], armF: [14, 20], armB: [-14, -8] }),
    ),
  },

  thruster: {
    view: 'front',
    ms: 3500,
    reps: 1,
    props: { weight: 'rackF' },
    thumb: 0.25,
    keys: (() => {
      const rack = { armF: ik(16, 128, undefined, 1), armB: [-30, -20] as [number, number] }
      const lowRack = { armF: ik(16, 100, undefined, 1) }
      return seq(
        fstand({ ...rack, legF: ik(16, A, 90), legB: ik(-16, A, -90) }),
        fsquat(48, 16, { ...lowRack, armB: [-50, -60] }),
        fstand({ ...rack, legF: ik(16, A, 90), legB: ik(-16, A, -90) }),
        fstand({ armF: [178, 180], armB: [-40, -30], legF: ik(16, A, 90), legB: ik(-16, A, -90) }),
      )
    })(),
  },

  goodMorning: {
    view: 'side',
    ms: 3000,
    reps: 1,
    props: { weight: 'goblet' },
    keys: seq(
      stand({ armF: ik(12, 112), armB: ik(10, 112), legF: ik(5, A), legB: ik(-5, A) }),
      { hip: [-12, 72], torso: 100, head: 106, armF: ik(28, 72), armB: ik(26, 72), legF: ik(5, A), legB: ik(-5, A) },
    ),
  },

  kbSwing: {
    view: 'side',
    ms: 2000,
    reps: 1,
    props: { weight: 'hands' },
    keys: [
      k(0, { hip: [-14, 64], torso: 122, head: 140, armF: [-18, -22], armB: [-20, -24], legF: ik(6, A), legB: ik(2, A) }, 'out'),
      k(0.45, stand({ armF: [94, 94], armB: [92, 92], legF: ik(6, A), legB: ik(2, A) }), 'in'),
    ],
  },

  bandWalk: {
    view: 'front',
    ms: 2400,
    props: { band: { kind: 'knees' } },
    keys: (() => {
      const base = fsquat(64, 14, { armF: ik(16, 76), armB: ik(-16, 76) })
      return seq(
        base,
        w(base, { hip: [6, 64], legF: ik(30, A, 90) }),
        w(base, { hip: [12, 64], legF: ik(30, A, 90), legB: ik(-2, A, -90) }),
        w(base, { hip: [6, 64], legF: ik(30, A, 90), legB: ik(-14, A, -90) }),
      )
    })(),
  },

  strapHamCurl: {
    view: 'side',
    ms: 3000,
    reps: 1,
    props: { straps: { anchor: [92, 170], to: 'feet' }, mat: true },
    keys: seq(
      { hip: [10, 26], torso: -82, head: -90, armF: ik(10, 3), armB: ik(8, 3), legF: ik(80, 28, 170), legB: ik(82, 29, 170) },
      { hip: [12, 44], torso: -60, head: -84, armF: ik(10, 3), armB: ik(8, 3), legF: ik(50, 32, 150), legB: ik(52, 33, 150) },
    ),
  },

  stepUp: {
    view: 'side',
    ms: 3200,
    reps: 1,
    props: { chair: { x: 32, facing: -1 } },
    keys: seq(
      { hip: [6, 66], torso: 168, armF: [20, 30], armB: [-20, -10], legF: ik(28, 48), legB: ik(-6, A) },
      { hip: [26, 118], torso: 180, armF: [-20, -10], armB: [30, 40], legF: ik(28, 48), legB: [84, 0, 90] },
    ),
  },

  skaterSquat: {
    view: 'side',
    ms: 3500,
    reps: 1,
    keys: seq(
      oneLeg({ legB: [-20, -60, 30], armF: [40, 50], armB: [30, 40] }),
      { hip: [-12, 40], torso: 136, armF: [96, 96], armB: [92, 92], legF: ik(1, A), legB: ik(-36, 16, 25) },
    ),
  },
}
