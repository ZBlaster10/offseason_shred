import { ankleFrom, DIM, STAND_H, type Ease, type IKLimb, type Keyframe, type Limb, type Pose, type Vec } from '../rig'

export const A = DIM.ankleH

export const k = (at: number, pose: Pose, ease?: Ease): Keyframe => ({ at, pose, ease })

/** Evenly spaced keyframes over one loop. */
export const seq = (...poses: Pose[]): Keyframe[] => poses.map((pose, i) => ({ at: i / poses.length, pose }))

type IKOpts = Omit<IKLimb, 'to' | 'wrist'>

/** IK target for a wrist/ankle: `ik(x, y, end?, bend?)` or `ik(x, y, { end, bend, slide })`. */
export const ik = (x: number, y: number, end?: number | IKOpts, bend?: 1 | -1): Limb =>
  typeof end === 'object' ? { to: [x, y], ...end } : { to: [x, y], end, bend }

/**
 * A side-view foot up on its toes with the ball of the foot at x (on the
 * floor). A flat foot at ankle x0 has its ball at x0 + 10, so `onToes(x0 + 10, e)`
 * rises from that flat foot by pivoting around the ball.
 */
export const onToes = (ballX: number, end: number, o: IKOpts = {}): Limb => {
  const [x, y] = ankleFrom([ballX, -0.4], end)
  return { to: [x, y], end, ...o }
}

// ───────────── Side view (facing +x) ─────────────

export const STAND: Pose = {
  hip: [0, STAND_H],
  torso: 180,
  armF: [6, 14],
  armB: [-6, -2],
  legF: ik(3, A),
  legB: ik(-3, A),
}

export const stand = (o: Partial<Pose> = {}): Pose => ({ ...STAND, ...o })

/** Squat with hips at height h (lower = deeper). Feet stay where they stood. */
export const squat = (h: number, o: Partial<Pose> = {}): Pose => {
  const depth = (STAND_H - h) / (STAND_H - 38)
  return {
    hip: [-6 - 14 * depth, h],
    torso: 180 - 38 * depth,
    armF: [20 + 62 * depth, 30 + 58 * depth],
    armB: [10 + 62 * depth, 20 + 58 * depth],
    legF: ik(3, A),
    legB: ik(-3, A),
    ...o,
  }
}

/**
 * A side-view foot up on its toes behind the hip, with the leg reaching `len`
 * (72 = locked straight). Used for planks and anything on the toes.
 */
export const toesBehind = (hip: Vec, len = 70.6, end = 25, o: IKOpts = {}): Limb => {
  const [, y] = ankleFrom([0, -0.4], end)
  const dy = hip[1] - y
  return { to: [hip[0] - Math.sqrt(Math.max(0, len * len - dy * dy)), y], end, ...o }
}

const PLANK_HIP: Vec = [-10, 36]

/** High plank, body in a straight line. `drop` lowers the chest (push-up); the feet stay planted. */
export const plank = (drop = 0, o: Partial<Pose> = {}): Pose => ({
  hip: [PLANK_HIP[0], PLANK_HIP[1] - drop * 0.55],
  torso: 112 - drop * 0.25,
  head: 108,
  armF: ik(28, 3, undefined, -1),
  armB: ik(25, 3, undefined, -1),
  legF: toesBehind(PLANK_HIP, 70.2),
  legB: toesBehind(PLANK_HIP, 71.4),
  ...o,
})

const FOREARM_HIP: Vec = [-14, 24]

/** Forearm plank. */
export const forearmPlank = (o: Partial<Pose> = {}): Pose => ({
  hip: FOREARM_HIP,
  torso: 100,
  head: 100,
  armF: [0, 90],
  armB: [-2, 88],
  legF: toesBehind(FOREARM_HIP, 70.2),
  legB: toesBehind(FOREARM_HIP, 71.4),
  ...o,
})

/** All fours. */
export const quadruped = (o: Partial<Pose> = {}): Pose => ({
  hip: [-22, 42],
  torso: 100,
  head: 100,
  armF: ik(24, 3),
  armB: ik(20, 3),
  legF: ik(-56, 6, -95),
  legB: ik(-58, 6, -95),
  ...o,
})

/** Lying on the back, head toward -x, legs toward +x. */
export const supine = (o: Partial<Pose> = {}): Pose => ({
  hip: [10, 11],
  torso: -90,
  head: -90,
  armF: [-80, -80],
  armB: [-82, -82],
  legF: ik(78, A + 2, 175),
  legB: ik(80, A + 2, 175),
  ...o,
})

/** Lying face down, head toward +x. */
export const prone = (o: Partial<Pose> = {}): Pose => ({
  hip: [-18, 11],
  torso: 92,
  head: 95,
  armF: [-80, -80],
  armB: [-82, -82],
  legF: ik(-88, A + 3, -100),
  legB: ik(-90, A + 3, -100),
  ...o,
})

/** Lunge: front ankle at fx (flat), back foot up on its toes with the sole's front at bx, hips at height h. */
export const lunge = (h: number, fx = 24, bx = -40, o: Partial<Pose> = {}): Pose => ({
  hip: [(fx + bx) / 2 - 2, h],
  torso: 180,
  armF: [10, 20],
  armB: [-10, 0],
  legF: ik(fx, A),
  legB: onToes(bx, 30),
  ...o,
})

/** Swap near and far limbs (side view alternation). */
export const swapSides = (p: Pose): Pose => ({ ...p, armF: p.armB, armB: p.armF, legF: p.legB, legB: p.legF })

// ───────────── Front view (facing the viewer) ─────────────

export const FSTAND: Pose = {
  hip: [0, STAND_H],
  torso: 180,
  armF: [14, 8],
  armB: [-14, -8],
  legF: ik(11, A, 90),
  legB: ik(-11, A, -90),
}

export const fstand = (o: Partial<Pose> = {}): Pose => ({ ...FSTAND, ...o })

/** Front-view wide/athletic squat with hips at height h and feet at ±w. */
export const fsquat = (h: number, w = 22, o: Partial<Pose> = {}): Pose => ({
  hip: [0, h],
  torso: 180,
  armF: [40, 60],
  armB: [-40, -60],
  legF: ik(w, A, 90),
  legB: ik(-w, A, -90),
  ...o,
})

const mirrorAngle = (a: number) => (a > 135 ? 360 - a : a < -135 ? -360 - a : -a)
const mirrorLimb = (l: Limb): Limb =>
  Array.isArray(l)
    ? [mirrorAngle(l[0]), mirrorAngle(l[1]), l[2] === undefined ? undefined : mirrorAngle(l[2])]
    : { to: [-l.to[0], l.to[1]], bend: l.bend === undefined ? undefined : ((-l.bend) as 1 | -1), end: l.end === undefined ? undefined : mirrorAngle(l.end) }

/** Mirror a front-view pose left/right. */
export const mirror = (p: Pose): Pose => ({
  ...p,
  hip: [-p.hip[0], p.hip[1]] as Vec,
  torso: 360 - p.torso,
  head: p.head === undefined ? undefined : 360 - p.head,
  armF: mirrorLimb(p.armB),
  armB: mirrorLimb(p.armF),
  legF: mirrorLimb(p.legB),
  legB: mirrorLimb(p.legF),
  tilt: p.tilt === undefined ? undefined : -p.tilt,
})

/** Override helper that keeps a base pose readable. */
export const w = (p: Pose, o: Partial<Pose>): Pose => ({ ...p, ...o })

const shiftLimb = (l: Limb, dx: number, dy: number): Limb =>
  Array.isArray(l) ? l : { ...l, to: [l.to[0] + dx, l.to[1] + dy] }

/** Translate a whole pose (hip and IK targets). */
export const shift = (p: Pose, dx: number, dy = 0): Pose => ({
  ...p,
  hip: [p.hip[0] + dx, p.hip[1] + dy],
  armF: shiftLimb(p.armF, dx, dy),
  armB: shiftLimb(p.armB, dx, dy),
  legF: shiftLimb(p.legF, dx, dy),
  legB: shiftLimb(p.legB, dx, dy),
  roll: p.roll ? [p.roll[0] + dx, p.roll[1] + dy] : undefined,
})

/** Half-kneeling: front (F) foot planted at fx, back (B) knee down. */
export const halfKneel = (o: Partial<Pose> = {}): Pose => ({
  hip: [-10, 41],
  torso: 180,
  armF: [8, 10],
  armB: [-8, -4],
  legF: ik(26, A),
  legB: ik(-50, 6, -95),
  ...o,
})
