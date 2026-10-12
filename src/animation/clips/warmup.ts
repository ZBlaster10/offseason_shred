import { buildSkeleton, lerp, STAND_H, type IKLimb, type Keyframe, type Pose, type Vec } from '../rig'
import type { Clip } from '../types'
import { A, fstand, halfKneel, ik, k, mirror, onToes, quadruped, seq, stand, toesBehind, w } from './base'

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))

/** Low lunge with both hands planted inside the front foot, back leg long on its toes. */
const LUNGE_HIP: Vec = [-10, 30]
const lowLunge: Pose = {
  hip: LUNGE_HIP,
  torso: 114,
  head: 112,
  armF: ik(40, 3),
  armB: ik(36, 3),
  legF: ik(30, A),
  legB: toesBehind(LUNGE_HIP, 71),
}

// ───────────── Inchworm ─────────────

/** Feet together: the far ankle sits just behind the near one so both legs can lock straight. */
const WORM_FEET = { F: 0.4, B: 0 }

/**
 * Inchworm body hinged over straight legs, `f` of the way from hands-down (0)
 * to plank (1). The hips swing down on an arc around the ankles so the knees
 * never bend, and over the second half the heels peel up and the feet roll
 * onto the front of the sole.
 */
function worm(f: number): Pose {
  const rise = clamp01((f - 0.4) / 0.6)
  const e = lerp(90, 28, rise)
  const foot = (x: number) => (rise > 0 ? onToes(x + 16.8, e) : ik(x, A))
  const legF = foot(WORM_FEET.F)
  const legB = foot(WORM_FEET.B)
  const ankle = (legF as IKLimb).to
  const phi = (lerp(-8, 73, f) * Math.PI) / 180
  const len = 71.5
  const hip: Vec = [ankle[0] + len * Math.sin(phi), ankle[1] + len * Math.cos(phi)]
  // Tip the chest down just enough to keep the shoulders low enough for straight-ish arms to reach the mat.
  const shoulderY = lerp(49.5, 55, f)
  const torso = (Math.acos(Math.max(-1, Math.min(1, (hip[1] - shoulderY) / 45))) * 180) / Math.PI
  return {
    hip,
    torso,
    head: torso - lerp(16, 4, f),
    legF,
    legB,
    armF: ik(0, 3),
    armB: ik(0, 3),
  }
}

/**
 * Walk the hands out from hands-down to plank in alternating steps (near hand
 * first) while the body lowers, then hold, walk them back in and roll up.
 */
function inchwormKeys(): Keyframe[] {
  const STEPS = 6
  const body = Array.from({ length: STEPS + 1 }, (_, i) => worm(i / STEPS))
  const sh = body.map((p) => {
    const sk = buildSkeleton(p, 'side')
    return [sk.shoulderF[0], sk.shoulderB[0]]
  })
  // Near hand moves on odd steps, far hand on even steps (three steps each). Each hand lands under
  // where its shoulder will be halfway through its stance, so it stays in reach while the body
  // travels over it, and both finish under the shoulders in the plank.
  const final = [sh[STEPS][0] + 1, sh[STEPS][1] - 2]
  const land = (side: 0 | 1, k: number) => {
    if (k >= STEPS - 1 + side) return final[side]
    const x = sh[Math.min(STEPS, k + 1)][side]
    // Leave a real last step into the plank rather than a shuffle.
    return k + 2 >= STEPS - 1 + side ? Math.min(x, final[side] - 10) : x
  }
  const hand = (side: 0 | 1, i: number) => {
    // Last step this hand took at or before key i (odd keys for the near hand, even keys for the far hand).
    let k = i
    while (k > 0 && k % 2 !== (side === 0 ? 1 : 0)) k--
    return k === 0 ? sh[side === 0 ? 0 : 1][side] + (side === 0 ? 6 : 0) : land(side, k)
  }
  const walk = body.map((p, i) => w(p, { armF: ik(hand(0, i), 3), armB: ik(hand(1, i), 3) }))

  const standUp = stand({ legF: ik(WORM_FEET.F, A), legB: ik(WORM_FEET.B, A) })
  const hinge = w(standUp, { hip: [-13, STAND_H - 2], torso: 112, head: 100, armF: [14, 18], armB: [10, 14] })
  const rollUp = w(standUp, { hip: [-12, STAND_H - 2], torso: 132, head: 84, armF: [18, 22], armB: [14, 18] })

  const out0 = 0.16
  const out1 = 0.44
  const back0 = 0.54
  const back1 = 0.82
  return [
    k(0, standUp),
    k(0.08, hinge),
    ...walk.map((p, i) => k(out0 + ((out1 - out0) * i) / STEPS, p)),
    k(back0, walk[STEPS]),
    ...walk
      .slice(0, STEPS)
      .reverse()
      .map((p, i) => k(back0 + ((back1 - back0) * (i + 1)) / STEPS, p)),
    k(0.91, rollUp),
  ]
}

export const warmupClips: Record<string, Clip> = {
  worldsGreatest: {
    view: 'side',
    ms: 7000,
    props: { mat: true },
    thumb: 0.7,
    keys: (() => {
      // Near elbow drops toward the front instep, then the chest opens to the viewer and the near arm reaches up.
      const elbowDrop = w(lowLunge, { hip: [-10, 26], torso: 104, head: 102 })
      const open = w(lowLunge, { twist: 72, look: 115, head: 158, armF: [180, 182] })
      return [k(0, lowLunge), k(0.2, elbowDrop), k(0.38, lowLunge), k(0.6, open), k(0.82, open)]
    })(),
  },

  inchworm: {
    view: 'side',
    ms: 10000,
    props: { mat: true },
    thumb: 0.49,
    trace: ['hip', 'head'],
    keys: inchwormKeys(),
  },

  tspineRotation: {
    view: 'side',
    ms: 5000,
    props: { mat: true },
    thumb: 0.5,
    keys: (() => {
      // Hips stay square while the chest opens toward the viewer. The near arm sweeps back around
      // (foreshortened as it points at the camera) and the eyes follow the hand.
      // Seen from the side, the arm shortens as it swings toward the camera, flips while it points
      // straight at us (just the fist over the shoulder), then lengthens out behind.
      const closed = halfKneel({ armF: [90, 90], armB: [88, 88] })
      const toward = halfKneel({ twist: 30, look: 45, armF: [92, 92], armB: [88, 88], reach: { armF: 0.1 } })
      const past = halfKneel({ twist: 50, look: 90, armF: [268, 268], armB: [88, 88], reach: { armF: 0.1 } })
      const open = halfKneel({ twist: 84, look: 150, head: 186, armF: [268, 268], armB: [90, 90] })
      return [k(0, closed), k(0.16, toward), k(0.24, past), k(0.38, open), k(0.62, open), k(0.76, past), k(0.84, toward)]
    })(),
  },

  legSwings: {
    view: 'side',
    ms: 1800,
    keys: seq(
      stand({ torso: 176, armF: [40, 55], armB: [-30, -20], legF: [68, 62, 130], legB: ik(-2, A) }),
      stand({ torso: 184, armF: [30, 45], armB: [-40, -30], legF: [-38, -32, 70], legB: ik(-2, A) }),
    ),
  },

  hipCircles: {
    view: 'front',
    ms: 3200,
    keys: (() => {
      const hands = { armF: ik(16, 72), armB: ik(-16, 72) }
      return seq(
        fstand({ ...hands, hip: [7, STAND_H - 2], torso: 186 }),
        fstand({ ...hands, hip: [0, STAND_H - 4], torso: 180 }),
        fstand({ ...hands, hip: [-7, STAND_H - 2], torso: 174 }),
        fstand({ ...hands, hip: [0, STAND_H], torso: 180 }),
      )
    })(),
  },

  ankleRocks: {
    view: 'side',
    ms: 2200,
    props: { mat: true },
    keys: seq(
      halfKneel({ hip: [-12, 41], armF: ik(28, 44), armB: ik(25, 44) }),
      halfKneel({ hip: [0, 38], armF: ik(38, 42), armB: ik(35, 42) }),
    ),
  },

  armCircles: {
    view: 'front',
    ms: 1400,
    keys: seq(
      fstand({ armF: [78, 78], armB: [-78, -78] }),
      fstand({ armF: [92, 98], armB: [-92, -98] }),
      fstand({ armF: [104, 104], armB: [-104, -104] }),
      fstand({ armF: [90, 84], armB: [-90, -84] }),
    ),
  },

  wristRocks: {
    view: 'side',
    ms: 2600,
    props: { mat: true },
    keys: seq(quadruped({ hip: [-26, 42], armF: ik(24, 3), armB: ik(20, 3) }), quadruped({ hip: [-12, 40], torso: 98, armF: ik(24, 3), armB: ik(20, 3), legF: ik(-56, 6, -95), legB: ik(-58, 6, -95) })),
  },

  stepJacks: {
    view: 'front',
    ms: 2000,
    keys: (() => {
      const out = fstand({ hip: [5, STAND_H - 2.5], armF: [150, 165], armB: [-150, -165], legF: ik(30, A, 100), legB: ik(-9, A, -90) })
      const home = fstand({ armF: [18, 12], armB: [-18, -12], legF: ik(9, A), legB: ik(-9, A) })
      return seq(home, out, home, mirror(out))
    })(),
  },
}
