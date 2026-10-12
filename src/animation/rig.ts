/**
 * 2D rider rig. World space is y-up with the floor at y = 0 and the character
 * centered on x = 0. Angles are degrees measured from straight down, positive
 * toward +x (the direction the rider faces in side view, or the viewer's right
 * in front view): 0 = down, 90 = forward, 180 = up, -90 = back.
 */

export type Vec = [number, number]
export type View = 'side' | 'front'

export const DIM = {
  shin: 36,
  thigh: 36,
  ankleH: 4,
  torso: 50,
  neck: 7,
  headR: 11,
  upperArm: 27,
  forearm: 25,
  foot: 15,
  footFront: 8,
  shoulderHalf: 13,
  hipHalf: 7,
}

/** Standing hip height with straight legs. */
export const STAND_H = DIM.ankleH + DIM.shin + DIM.thigh

export interface IKLimb {
  /** Wrist / ankle target. */
  to: Vec
  bend?: 1 | -1
  /** Absolute foot angle (legs) or hand angle (arms). */
  end?: number
  /** Hand angle relative to the forearm. Set by the sampler; wins over `end`. */
  wrist?: number
  /** Let a planted hand/foot drag along the floor instead of stepping. */
  slide?: boolean
}

/** Either absolute segment angles [upper, lower, end?] or an IK target for the wrist/ankle. */
export type Limb = [number, number, number?] | IKLimb

export type LimbName = 'armF' | 'armB' | 'legF' | 'legB'
export const LIMBS: LimbName[] = ['armF', 'armB', 'legF', 'legB']

export interface Pose {
  hip: Vec
  torso: number
  head?: number
  armF: Limb
  armB: Limb
  legF: Limb
  legB: Limb
  /**
   * Chest rotation over the pelvis in degrees. Side view: + turns the chest
   * toward the viewer (near shoulder back, far shoulder forward). Front view:
   * + turns the chest toward the viewer's left.
   */
  twist?: number
  /** Head yaw relative to the view's default facing (defaults to `twist`). */
  look?: number
  /** Projected length 0..1 of a limb pointing toward or away from the camera. */
  reach?: Partial<Record<LimbName, number>>
  /** 0..1 spin around the vertical axis (rendered as horizontal squash). */
  turn?: number
  /** Balance board / snowboard tilt in degrees. */
  tilt?: number
  /** Jump-rope phase 0..1. */
  rope?: number
  /** Foam roller center in world space. */
  roll?: Vec
}

export interface Skeleton {
  view: View
  hip: Vec
  neck: Vec
  head: Vec
  headAngle: number
  torsoAngle: number
  hipF: Vec
  hipB: Vec
  shoulderF: Vec
  shoulderB: Vec
  elbowF: Vec
  elbowB: Vec
  handF: Vec
  handB: Vec
  /** Hand (mitt) angle; equals the forearm angle unless the wrist is bent. */
  handAngF: number
  handAngB: number
  kneeF: Vec
  kneeB: Vec
  ankleF: Vec
  ankleB: Vec
  toeF: Vec
  toeB: Vec
  /** Chest twist in degrees (see Pose.twist). */
  twist: number
  /** Head yaw: 0 = profile facing +x, 90 = facing the viewer, 180 = profile facing -x. */
  yaw: number
  turn: number
  tilt: number
  rope: number
  roll?: Vec
}

const RAD = Math.PI / 180

export const dir = (a: number): Vec => [Math.sin(a * RAD), -Math.cos(a * RAD)]
export const add = (p: Vec, q: Vec): Vec => [p[0] + q[0], p[1] + q[1]]
export const scale = (p: Vec, s: number): Vec => [p[0] * s, p[1] * s]
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const lerpV = (a: Vec, b: Vec, t: number): Vec => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)]
/** Angle (from down, + toward +x) of the vector from p to q. */
export const angleTo = (p: Vec, q: Vec) => Math.atan2(q[0] - p[0], -(q[1] - p[1])) / RAD
/** Wrap an angle into (-180, 180]. */
const wrap = (a: number) => a - 360 * Math.ceil((a - 180) / 360)
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x))
const smooth = (x: number) => x * x * (3 - 2 * x)

/** Two-bone IK. Returns absolute angles for both segments. */
export function solveIK(root: Vec, target: Vec, l1: number, l2: number, bend: 1 | -1): [number, number] {
  const dx = target[0] - root[0]
  const dy = target[1] - root[1]
  const d = Math.min(l1 + l2 - 0.001, Math.max(Math.abs(l1 - l2) + 0.001, Math.hypot(dx, dy)))
  const base = Math.atan2(dx, -dy) / RAD
  const cosA = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)
  const A = Math.acos(Math.min(1, Math.max(-1, cosA))) / RAD
  const a1 = base + bend * A
  const joint = add(root, scale(dir(a1), l1))
  return [a1, angleTo(joint, target)]
}

function limbAngles(limb: Limb, root: Vec, l1: number, l2: number, defBend: 1 | -1, defEnd: number): [number, number, number] {
  if (Array.isArray(limb)) return [limb[0], limb[1], limb[2] ?? defEnd]
  const [a1, a2] = solveIK(root, limb.to, l1, l2, limb.bend ?? defBend)
  return [a1, a2, limb.end ?? defEnd]
}

// ───────────── Contacts ─────────────

/** Hand targets at or below this height rest on the floor. */
export const HAND_PLANT_Y = 6
/** Front-view ankles at or below this height stand on the floor. */
export const FOOT_PLANT_Y = DIM.ankleH + 2
/** Planted contacts that move at least this far take a step instead of sliding. */
export const STEP_MIN = 8

// Side-view boot sole, in foot coords (along the foot, toward the instep) from the ankle.
const BALL = 16.8
const SOLE = 4.4
const HEEL = 6.2

/** Unit vectors along a side-view foot (toward the toes) and out of its top (instep). */
export function footFrame(end: number): { f: Vec; up: Vec } {
  const f = dir(end)
  return { f, up: [-f[1], f[0]] }
}

/** Front and back corners of the sole of a side-view boot: what touches the floor. */
export function footContacts(ankle: Vec, end: number) {
  const { f, up } = footFrame(end)
  return {
    ball: add(ankle, add(scale(f, BALL), scale(up, -SOLE))),
    heel: add(ankle, add(scale(f, -HEEL), scale(up, -SOLE))),
  }
}

/**
 * Whether an IK hand/foot target rests on the floor: hands by height, side-view
 * feet when an edge of the sole touches down (flat or up on the toes).
 */
export function isPlanted(limb: LimbName, to: Vec, end: number, view: View) {
  if (limb[0] === 'a') return to[1] <= HAND_PLANT_Y
  if (view === 'front') return to[1] <= FOOT_PLANT_Y
  const c = footContacts(to, end)
  return Math.min(c.ball[1], c.heel[1]) <= 2
}

/** Ankle position that puts the front of the sole (or the heel) at `p` with foot angle `end`. */
export function ankleFrom(p: Vec, end: number, pivot: 'ball' | 'heel' = 'ball'): Vec {
  const { f, up } = footFrame(end)
  return add(p, add(scale(f, pivot === 'ball' ? -BALL : HEEL), scale(up, SOLE)))
}

// ───────────── Skeleton ─────────────

/**
 * Shoulder-girdle motion: the shoulder rides up the ribcage as the arm rises
 * past horizontal, and slides forward/back as the arm reaches.
 */
function girdle(upper: number, torso: number, d: Vec, perp: Vec, front: boolean, tw: number): Vec {
  const rel = wrap(upper - torso + 180)
  const lift = clamp((Math.abs(rel) - 75) / 95, 0, 1)
  const reach = front ? 0 : 1.8 * Math.sin(rel * RAD) * Math.cos(tw)
  return add(scale(d, 3.5 * smooth(lift)), scale(perp, reach))
}

export function buildSkeleton(pose: Pose, view: View): Skeleton {
  const front = view === 'front'
  const t = pose.torso
  const d = dir(t)
  const perp: Vec = [d[1], -d[0]]
  const hip = pose.hip
  const twist = pose.twist ?? 0
  const tw = twist * RAD
  const neck = add(hip, scale(d, DIM.torso))
  const shoulderBase = add(hip, scale(d, DIM.torso - 5))
  const sh = DIM.shoulderHalf
  const hh = front ? DIM.hipHalf : 0
  // Side view: the near shoulder swings back and the far one forward as the chest opens to the viewer.
  const [offF, offB] = front ? [sh * Math.cos(tw), -sh * Math.cos(tw)] : [-sh * Math.sin(tw), sh * Math.sin(tw) - 1.5 * Math.abs(Math.cos(tw))]
  const hipF = add(hip, scale(perp, hh))
  const hipB = add(hip, scale(perp, front ? -hh : -1))
  const headAngle = pose.head ?? t
  const head = add(neck, scale(dir(headAngle), DIM.neck + DIM.headR - 3))

  const r = pose.reach ?? {}
  const rAF = r.armF ?? 1
  const rAB = r.armB ?? 1
  const rLF = r.legF ?? 1
  const rLB = r.legB ?? 1
  const uaF = DIM.upperArm * rAF
  const faF = DIM.forearm * rAF
  const uaB = DIM.upperArm * rAB
  const faB = DIM.forearm * rAB

  let shoulderF = add(shoulderBase, scale(perp, offF))
  let shoulderB = add(shoulderBase, scale(perp, offB))
  const bendAF: 1 | -1 = front ? 1 : -1
  shoulderF = add(shoulderF, girdle(limbAngles(pose.armF, shoulderF, uaF, faF, bendAF, 0)[0], t, d, perp, front, tw))
  shoulderB = add(shoulderB, girdle(limbAngles(pose.armB, shoulderB, uaB, faB, -1, 0)[0], t, d, perp, front, tw))

  const footLen = front ? DIM.footFront : DIM.foot
  const [aF1, aF2] = limbAngles(pose.armF, shoulderF, uaF, faF, bendAF, 0)
  const [aB1, aB2] = limbAngles(pose.armB, shoulderB, uaB, faB, -1, 0)
  const [lF1, lF2, lF3] = limbAngles(pose.legF, hipF, DIM.thigh * rLF, DIM.shin * rLF, 1, 90)
  const [lB1, lB2, lB3] = limbAngles(pose.legB, hipB, DIM.thigh * rLB, DIM.shin * rLB, front ? -1 : 1, front ? -90 : 90)

  const elbowF = add(shoulderF, scale(dir(aF1), uaF))
  const elbowB = add(shoulderB, scale(dir(aB1), uaB))
  const kneeF = add(hipF, scale(dir(lF1), DIM.thigh * rLF))
  const kneeB = add(hipB, scale(dir(lB1), DIM.thigh * rLB))
  const ankleF = add(kneeF, scale(dir(lF2), DIM.shin * rLF))
  const ankleB = add(kneeB, scale(dir(lB2), DIM.shin * rLB))

  /** Planted side-view hands lie flat (fingers forward); otherwise the hand follows the forearm. */
  const handAng = (limb: Limb, a2: number) => {
    if (Array.isArray(limb)) return limb[2] ?? a2
    if (limb.wrist !== undefined) return a2 + limb.wrist
    if (limb.end !== undefined) return limb.end
    return !front && limb.to[1] <= HAND_PLANT_Y ? 90 : a2
  }

  return {
    view,
    hip,
    neck,
    head,
    headAngle,
    torsoAngle: t,
    hipF,
    hipB,
    shoulderF,
    shoulderB,
    elbowF,
    elbowB,
    handF: add(elbowF, scale(dir(aF2), faF)),
    handB: add(elbowB, scale(dir(aB2), faB)),
    handAngF: handAng(pose.armF, aF2),
    handAngB: handAng(pose.armB, aB2),
    kneeF,
    kneeB,
    ankleF,
    ankleB,
    toeF: add(ankleF, scale(dir(lF3), footLen)),
    toeB: add(ankleB, scale(dir(lB3), footLen)),
    twist,
    yaw: (front ? 90 : 0) + (pose.look ?? twist),
    turn: pose.turn ?? 0,
    tilt: pose.tilt ?? 0,
    rope: pose.rope ?? 0,
    roll: pose.roll,
  }
}

// ───────────── Interpolation ─────────────

export type Ease = 'inOut' | 'linear' | 'in' | 'out'

const EASE: Record<Ease, (t: number) => number> = {
  linear: (t) => t,
  inOut: (t) => 0.5 - 0.5 * Math.cos(Math.PI * t),
  in: (t) => 1 - Math.cos((Math.PI * t) / 2),
  out: (t) => Math.sin((Math.PI * t) / 2),
}

export type Keyframe = { at: number; pose: Pose; ease?: Ease }

const reachOf = (p: Pose, l: LimbName) => p.reach?.[l] ?? 1

/** Straight blend of two poses (IK targets in world space, angles in angle space). For authoring helpers. */
export function lerpPose(a: Pose, b: Pose, t: number, view: View): Pose {
  const sa = buildSkeleton(a, view)
  const sb = buildSkeleton(b, view)
  const front = view === 'front'
  const optional = (x?: number, y?: number) => (x === undefined && y === undefined ? undefined : lerp(x ?? 0, y ?? 0, t))
  const limb = (name: LimbName, rootA: Vec, rootB: Vec, l1: number, l2: number, bend: 1 | -1, end: number): Limb => {
    const la = a[name]
    const lb = b[name]
    if (!Array.isArray(la) && !Array.isArray(lb)) {
      return { to: lerpV(la.to, lb.to, t), bend: la.bend ?? lb.bend, end: la.end === undefined && lb.end === undefined ? undefined : lerp(la.end ?? end, lb.end ?? end, t) }
    }
    const pa = limbAngles(la, rootA, l1 * reachOf(a, name), l2 * reachOf(a, name), bend, end)
    const pb = limbAngles(lb, rootB, l1 * reachOf(b, name), l2 * reachOf(b, name), bend, end)
    return [lerp(pa[0], pb[0], t), lerp(pa[1], pb[1], t), lerp(pa[2], pb[2], t)]
  }
  const reach = a.reach || b.reach ? Object.fromEntries(LIMBS.map((l) => [l, lerp(reachOf(a, l), reachOf(b, l), t)])) : undefined
  return {
    hip: lerpV(a.hip, b.hip, t),
    torso: lerp(a.torso, b.torso, t),
    head: lerp(a.head ?? a.torso, b.head ?? b.torso, t),
    armF: limb('armF', sa.shoulderF, sb.shoulderF, DIM.upperArm, DIM.forearm, front ? 1 : -1, 0),
    armB: limb('armB', sa.shoulderB, sb.shoulderB, DIM.upperArm, DIM.forearm, -1, 0),
    legF: limb('legF', sa.hipF, sb.hipF, DIM.thigh, DIM.shin, 1, 90),
    legB: limb('legB', sa.hipB, sb.hipB, DIM.thigh, DIM.shin, front ? -1 : 1, front ? -90 : 90),
    twist: optional(a.twist, b.twist),
    look: a.look === undefined && b.look === undefined ? undefined : lerp(a.look ?? a.twist ?? 0, b.look ?? b.twist ?? 0, t),
    reach,
    turn: optional(a.turn, b.turn),
    tilt: optional(a.tilt, b.tilt),
    rope: optional(a.rope, b.rope),
    roll: a.roll && b.roll ? lerpV(a.roll, b.roll, t) : a.roll,
  }
}

/** One limb of a keyframe, resolved into both IK space and angle space. */
interface LimbKey {
  ik: boolean
  /** IK target, or the forward-kinematics wrist/ankle for angle limbs. */
  to: Vec
  ang: [number, number]
  /** Legs: absolute foot angle. Arms: hand angle relative to the forearm. */
  end: number
  bend?: 1 | -1
  slide: boolean
  /** IK target resting on the floor (see isPlanted). */
  planted: boolean
}

interface KeyData {
  at: number
  ease?: Ease
  pose: Pose
  /** hipX, hipY, torso, head, twist, look, turn, tilt, rope, reach(armF, armB, legF, legB) */
  s: number[]
  limbs: Record<LimbName, LimbKey>
}

interface Track {
  keys: KeyData[]
  side: boolean
  has: { twist: boolean; look: boolean; reach: boolean; turn: boolean; tilt: boolean; rope: boolean; roll: boolean }
}

function resolveKey(k: Keyframe, view: View): KeyData {
  const pose = k.pose
  const sk = buildSkeleton(pose, view)
  const front = view === 'front'
  const resolve = (name: LimbName, root: Vec, mid: Vec, tip: Vec, defEnd: number, handAng?: number): LimbKey => {
    const l = pose[name]
    const a2 = angleTo(mid, tip)
    const end = handAng !== undefined ? wrap(handAng - a2) : Array.isArray(l) ? (l[2] ?? defEnd) : (l.end ?? defEnd)
    if (Array.isArray(l)) return { ik: false, to: tip, ang: [l[0], l[1]], end: handAng !== undefined ? (l[2] ?? l[1]) - l[1] : end, slide: false, planted: false }
    return { ik: true, to: l.to, ang: [angleTo(root, mid), a2], end, bend: l.bend, slide: !!l.slide, planted: isPlanted(name, l.to, end, view) }
  }
  const r = pose.reach ?? {}
  return {
    at: k.at,
    ease: k.ease,
    pose,
    s: [pose.hip[0], pose.hip[1], pose.torso, pose.head ?? pose.torso, pose.twist ?? 0, pose.look ?? pose.twist ?? 0, pose.turn ?? 0, pose.tilt ?? 0, pose.rope ?? 0, r.armF ?? 1, r.armB ?? 1, r.legF ?? 1, r.legB ?? 1],
    limbs: {
      armF: resolve('armF', sk.shoulderF, sk.elbowF, sk.handF, 0, sk.handAngF),
      armB: resolve('armB', sk.shoulderB, sk.elbowB, sk.handB, 0, sk.handAngB),
      legF: resolve('legF', sk.hipF, sk.kneeF, sk.ankleF, 90),
      legB: resolve('legB', sk.hipB, sk.kneeB, sk.ankleB, front ? -90 : 90),
    },
  }
}

const trackCache = new WeakMap<Keyframe[], { side?: Track; front?: Track }>()

function compileTrack(keys: Keyframe[], view: View): Track {
  let entry = trackCache.get(keys)
  if (!entry) trackCache.set(keys, (entry = {}))
  const hit = entry[view]
  if (hit) return hit
  const any = (f: (p: Pose) => unknown) => keys.some((k) => f(k.pose) !== undefined)
  const track: Track = {
    keys: keys.map((k) => resolveKey(k, view)),
    side: view === 'side',
    has: {
      twist: any((p) => p.twist),
      look: any((p) => p.look ?? p.twist),
      reach: any((p) => p.reach),
      turn: any((p) => p.turn),
      tilt: any((p) => p.tilt),
      rope: any((p) => p.rope),
      roll: keys.every((k) => k.pose.roll),
    },
  }
  entry[view] = track
  return track
}

/** Steffen's monotone slope: no overshoot, zero at turnarounds and next to holds. */
function slope(y0: number, y1: number, y2: number, h0: number, h1: number) {
  const d0 = (y1 - y0) / h0
  const d1 = (y2 - y1) / h1
  if (d0 * d1 <= 0) return 0
  const p = (d0 * h1 + d1 * h0) / (h0 + h1)
  return (Math.sign(d0) + Math.sign(d1)) * Math.min(Math.abs(d0), Math.abs(d1), 0.5 * Math.abs(p))
}

const mod = (k: number, n: number) => ((k % n) + n) % n
const near = (v: number, ref: number) => v + 360 * Math.round((ref - v) / 360)

/**
 * Sample a looping keyframe track at phase p in [0, 1).
 *
 * Every channel follows a monotone cubic through the keys, so joints flow
 * through keyframes instead of stopping at each one. A key with an explicit
 * `ease` keeps a straight eased blend to the next key (jumps, rope turns).
 * Hands and feet resting on the floor stay put; when they move they lift and
 * step, and a foot rising onto its toes pivots around the ball of the foot.
 */
export function samplePose(keys: Keyframe[], p: number, view: View): Pose {
  if (keys.length === 1) return keys[0].pose
  const tr = compileTrack(keys, view)
  const K = tr.keys
  const n = K.length
  let phase = p - Math.floor(p)
  if (phase < K[0].at) phase += 1
  let i = n - 1
  for (let k = 0; k < n - 1; k++) {
    if (phase >= K[k].at && phase < K[k + 1].at) {
      i = k
      break
    }
  }
  const T = (k: number) => K[mod(k, n)].at + Math.floor(k / n)
  const t0 = T(i)
  const h1 = Math.max(1e-4, T(i + 1) - t0)
  const h0 = Math.max(1e-4, t0 - T(i - 1))
  const h2 = Math.max(1e-4, T(i + 2) - T(i + 1))
  const u = clamp((phase - t0) / h1, 0, 1)
  const P = K[mod(i - 1, n)]
  const A = K[i]
  const B = K[mod(i + 1, n)]
  const N = K[mod(i + 2, n)]
  const ease = A.ease
  const ue = ease ? EASE[ease](u) : u
  const u2 = u * u
  const u3 = u2 * u
  /** Channel value; `rest0`/`rest1` pin the tangent to zero at a key (a hand or foot lifting off or landing). */
  const I = (yp: number, y0: number, y1: number, yn: number, rest0 = false, rest1 = false) => {
    if (ease) return lerp(y0, y1, ue)
    const m0 = rest0 ? 0 : slope(yp, y0, y1, h0, h1)
    const m1 = rest1 ? 0 : slope(y0, y1, yn, h1, h2)
    return (2 * u3 - 3 * u2 + 1) * y0 + (u3 - 2 * u2 + u) * h1 * m0 + (-2 * u3 + 3 * u2) * y1 + (u3 - u2) * h1 * m1
  }
  const S = (c: number) => I(P.s[c], A.s[c], B.s[c], N.s[c])

  const limb = (name: LimbName): Limb => {
    const a = A.limbs[name]
    const b = B.limbs[name]
    const pa = P.limbs[name]
    const nb = N.limbs[name]
    const arm = name[0] === 'a'
    const bend = a.bend ?? b.bend
    if (a.ik && b.ik) {
      const out = (to: Vec, end: number): Limb => (arm ? { to, bend, wrist: end } : { to, bend, end })
      const planted = !a.slide && !b.slide && a.planted && b.planted
      const dx = b.to[0] - a.to[0]
      if (planted && !arm && tr.side && Math.abs(a.end - b.end) > 4) {
        // Rising onto the toes / rocking onto the heel: pivot around the edge of the sole that stays down.
        const ca = footContacts(a.to, a.end)
        const cb = footContacts(b.to, b.end)
        const pick = (['ball', 'heel'] as const)
          .map((c) => ({ c, d: Math.hypot(ca[c][0] - cb[c][0], ca[c][1] - cb[c][1]), y: Math.max(ca[c][1], cb[c][1]) }))
          .filter((c) => c.y < 2.5 && c.d < 6)
          .sort((x, y) => x.d - y.d)[0]
        if (pick) {
          const end = I(pa.end, a.end, b.end, nb.end)
          const at = lerpV(ca[pick.c], cb[pick.c], ease ? ue : smooth(u))
          return out(ankleFrom(at, end, pick.c), end)
        }
      }
      if (planted && Math.abs(dx) >= STEP_MIN) {
        // Step: stay planted, lift and arc to the new spot, land and settle.
        const s = smooth(clamp((ue - 0.12) / 0.76, 0, 1))
        const bump = Math.sin(Math.PI * s)
        const dist = Math.hypot(dx, b.to[1] - a.to[1])
        const lift = arm ? clamp(0.3 * dist, 2.5, 9) : clamp(0.3 * dist, 3, 12)
        const to: Vec = [lerp(a.to[0], b.to[0], s), lerp(a.to[1], b.to[1], s) + lift * bump]
        let end = lerp(a.end, b.end, s)
        if (tr.side) {
          if (arm) end -= 22 * bump
          else end += dx > 0 ? -34 * bump * (1 - s) + 20 * bump * s : -22 * bump
        }
        return out(to, end)
      }
      const r0 = a.planted && !a.slide
      const r1 = b.planted && !b.slide
      return out(
        [I(pa.to[0], a.to[0], b.to[0], nb.to[0], r0, r1), I(pa.to[1], a.to[1], b.to[1], nb.to[1], r0, r1)],
        I(pa.end, a.end, b.end, nb.end, r0, r1),
      )
    }
    // Angle space. Authored angles pick the rotation direction; IK-derived angles are unwrapped next to
    // their neighbours so a limb never spins the long way round.
    const ch = (c: 0 | 1) => {
      let y0 = a.ang[c]
      let y1 = b.ang[c]
      if (a.ik && !b.ik) y0 = near(y0, y1)
      else if (b.ik) y1 = near(y1, y0)
      const yp = pa.ik ? near(pa.ang[c], y0) : pa.ang[c]
      const yn = nb.ik ? near(nb.ang[c], y1) : nb.ang[c]
      return I(yp, y0, y1, yn, a.planted, b.planted)
    }
    let a1 = ch(0)
    let a2 = ch(1)
    // Lifting off / touching down: the hand or foot stays exactly on its spot (IK against the moving
    // body) at the contact end of the segment and blends into the free swing away from it.
    const end = I(pa.end, a.end, b.end, nb.end, a.planted, b.planted)
    const contact = a.planted ? a : b.planted ? b : null
    if (contact) {
      let to = contact.to
      if (!arm && tr.side && Math.abs(end - contact.end) > 0.5) {
        // A foot rolling toward its toes pivots on the front of the sole, toward its heel on the back.
        const pivot = end < contact.end ? 'ball' : 'heel'
        to = ankleFrom(footContacts(contact.to, contact.end)[pivot], end, pivot)
      }
      const hold = holdAngles(name, to, contact.bend)
      const w = a.planted ? 1 - smooth(Math.min(1, u / 0.6)) : smooth(Math.max(0, (u - 0.4) / 0.6))
      a1 = lerp(a1, near(hold[0], a1), w)
      a2 = lerp(a2, near(hold[1], a2), w)
    }
    return [a1, a2, arm ? a2 + end : end]
  }

  const has = tr.has
  const pose: Pose = { hip: [S(0), S(1)], torso: S(2), head: S(3), armF: [0, 0], armB: [0, 0], legF: [0, 0], legB: [0, 0] }
  if (has.twist) pose.twist = S(4)
  if (has.look) pose.look = S(5)
  if (has.turn) pose.turn = S(6)
  if (has.tilt) pose.tilt = S(7)
  if (has.rope) pose.rope = S(8)
  if (has.reach) pose.reach = { armF: S(9), armB: S(10), legF: S(11), legB: S(12) }
  /** Segment angles that keep a limb on a planted target with the body where it is now. */
  function holdAngles(name: LimbName, to: Vec, bend?: 1 | -1): [number, number] {
    const sk = buildSkeleton({ ...pose, [name]: { to, bend } }, view)
    const [root, mid, tip] =
      name === 'armF' ? [sk.shoulderF, sk.elbowF, sk.handF] : name === 'armB' ? [sk.shoulderB, sk.elbowB, sk.handB] : name === 'legF' ? [sk.hipF, sk.kneeF, sk.ankleF] : [sk.hipB, sk.kneeB, sk.ankleB]
    return [angleTo(root, mid), angleTo(mid, tip)]
  }
  pose.armF = limb('armF')
  pose.armB = limb('armB')
  pose.legF = limb('legF')
  pose.legB = limb('legB')
  if (has.roll) {
    const r = (c: 0 | 1) => I(P.pose.roll![c], A.pose.roll![c], B.pose.roll![c], N.pose.roll![c])
    pose.roll = [r(0), r(1)]
  } else pose.roll = A.pose.roll
  return pose
}
