import type { ReactNode } from 'react'
import { add, dir, lerp, lerpV, scale, type Skeleton, type Vec } from './rig'

/**
 * Rider body drawing. Every part is a tapered capsule with cylindrical shading
 * (light from the upper left), a crisp outline and clothing details that move
 * with the limb (seams, patches, cuffs), so nothing "swims" as the rig animates.
 */

interface Pal {
  base: string
  light: string
  shade: string
  line: string
}

export const PAL = {
  jacket: { base: '#FF7A3D', light: '#FFA670', shade: '#D4561E', line: '#9E3F17' },
  jacketFar: { base: '#D85E28', light: '#EA7A44', shade: '#AE4516', line: '#7E3110' },
  pants: { base: '#1E8C82', light: '#3AB3A6', shade: '#136860', line: '#0B4842' },
  pantsFar: { base: '#166B63', light: '#24897F', shade: '#0E4F49', line: '#083733' },
  skin: { base: '#F2C29B', light: '#FBDABB', shade: '#D9A47C', line: '#A9734F' },
  skinFar: { base: '#D9A67F', light: '#E8BC97', shade: '#BD8A63', line: '#946243' },
  dark: { base: '#232D3F', light: '#4A586E', shade: '#141A26', line: '#090C12' },
  gaiter: { base: '#2E3B55', light: '#51617F', shade: '#1D263A', line: '#0E131D' },
  beanie: { base: '#3FA9E0', light: '#74C8F0', shade: '#2783B8', line: '#1A628C' },
} satisfies Record<string, Pal>

const LENS_A = '#FFB347'
const LENS_B = '#9B5DE5'
const SOLE = '#0D121B'
const STITCH = 'rgba(255,255,255,0.55)'

// ───────────── Geometry ─────────────

const sub = (p: Vec, q: Vec): Vec => [p[0] - q[0], p[1] - q[1]]
const dot = (p: Vec, q: Vec) => p[0] * q[0] + p[1] * q[1]
const norm = (v: Vec, fallback: Vec = [0, 1]): Vec => {
  const l = Math.hypot(v[0], v[1])
  return l < 1e-6 ? fallback : [v[0] / l, v[1] / l]
}
const perpL = (v: Vec): Vec => [-v[1], v[0]]
const deg = (v: Vec) => (Math.atan2(v[1], v[0]) * 180) / Math.PI
const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const LIGHT = norm([-0.55, 0.85])
const P = (p: Vec) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`
const RAD = Math.PI / 180

/** How square the chest is to the camera (0 = profile, 1 = facing) and which way a profile chest points. */
export function chestFacing(sk: Skeleton) {
  const yaw = ((sk.view === 'front' ? 90 : 0) + sk.twist) * RAD
  return { square: Math.abs(Math.sin(yaw)), flip: Math.cos(yaw) < -1e-6 ? -1 : 1, yaw }
}

/** Outline of a capsule from a (radius ra) to b (radius rb). */
function capsule(a: Vec, b: Vec, ra: number, rb: number, steps = 6) {
  const d = norm(sub(b, a))
  const n = perpL(d)
  const pts: Vec[] = []
  for (let i = 0; i <= steps; i++) {
    const t = (Math.PI * i) / steps
    pts.push(add(b, add(scale(n, rb * Math.cos(t)), scale(d, rb * Math.sin(t)))))
  }
  for (let i = 0; i <= steps; i++) {
    const t = (Math.PI * i) / steps
    pts.push(add(a, add(scale(n, -ra * Math.cos(t)), scale(d, -ra * Math.sin(t)))))
  }
  return pts.map(P).join(' ')
}

/** Normal of segment a→b that faces the light. */
function litNormal(a: Vec, b: Vec): Vec {
  const n = perpL(norm(sub(b, a)))
  return dot(n, LIGHT) < 0 ? scale(n, -1) : n
}

/** Cylindrical shading across a segment: highlight on the lit edge, core shadow on the far edge. */
function Shade({ id, a, b, r, pal }: { id: string; a: Vec; b: Vec; r: number; pal: Pal }) {
  const n = litNormal(a, b)
  const m = lerpV(a, b, 0.5)
  const g1 = add(m, scale(n, r))
  const g2 = add(m, scale(n, -r))
  return (
    <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={g1[0]} y1={g1[1]} x2={g2[0]} y2={g2[1]}>
      <stop offset="0" stopColor={pal.light} />
      <stop offset="0.42" stopColor={pal.base} />
      <stop offset="1" stopColor={pal.shade} />
    </linearGradient>
  )
}

function Part({ id, a, b, ra, rb, pal, children }: { id: string; a: Vec; b: Vec; ra: number; rb: number; pal: Pal; children?: ReactNode }) {
  return (
    <>
      <Shade id={id} a={a} b={b} r={Math.max(ra, rb)} pal={pal} />
      <polygon points={capsule(a, b, ra, rb)} fill={`url(#${id})`} stroke={pal.line} strokeWidth={0.8} strokeLinejoin="round" />
      {children}
    </>
  )
}

function Ellipse({ c, rx, ry, along, ...rest }: { c: Vec; rx: number; ry: number; along: Vec } & React.SVGProps<SVGEllipseElement>) {
  return <ellipse cx={0} cy={0} rx={rx} ry={ry} transform={`translate(${c[0].toFixed(2)} ${c[1].toFixed(2)}) rotate(${deg(along).toFixed(1)})`} {...rest} />
}

const Line = ({ a, b, ...rest }: { a: Vec; b: Vec } & React.SVGProps<SVGLineElement>) => (
  <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} strokeLinecap="round" {...rest} />
)

/** Outward direction of a bent joint (kneecap / elbow point). */
function jointOut(upperDir: Vec, lowerDir: Vec, fallback: Vec): Vec {
  return norm(sub(upperDir, lowerDir), fallback)
}

// ───────────── Legs ─────────────

export function Leg({ sk, side, far, u }: { sk: Skeleton; side: 'F' | 'B'; far?: boolean; u: string }) {
  const id = `${u}l${side}`
  const hip = side === 'F' ? sk.hipF : sk.hipB
  const knee = side === 'F' ? sk.kneeF : sk.kneeB
  const ankle = side === 'F' ? sk.ankleF : sk.ankleB
  const toe = side === 'F' ? sk.toeF : sk.toeB
  const pal = far ? PAL.pantsFar : PAL.pants
  const front = sk.view === 'front'

  const thighD = norm(sub(knee, hip))
  const shinD = norm(sub(ankle, knee))
  const sidePerp = (v: Vec): Vec => {
    const n = perpL(v)
    return n[0] < 0 ? scale(n, -1) : n
  }
  const kneeOut = jointOut(thighD, shinD, sidePerp(shinD))
  const calfSide = scale(kneeOut, -1)
  const cuffTop = add(ankle, scale(shinD, -10))
  const cuffBottom = add(ankle, scale(shinD, -6))

  return (
    <g>
      <Boot sk={sk} ankle={ankle} toe={toe} knee={knee} far={far} u={id} />
      {!front && (
        <>
          <Shade id={`${id}c`} a={knee} b={ankle} r={7} pal={pal} />
          <Ellipse c={add(lerpV(knee, ankle, 0.34), scale(calfSide, 1.6))} rx={9} ry={4.6} along={shinD} fill={`url(#${id}c)`} stroke={pal.line} strokeWidth={0.8} />
        </>
      )}
      <Part id={`${id}s`} a={knee} b={cuffTop} ra={6} rb={5.2} pal={pal} />
      {/* boot cuff gaiter: pants flare over the boot */}
      <Part id={`${id}f`} a={cuffTop} b={cuffBottom} ra={5.4} rb={6.1} pal={pal}>
        <Line a={add(cuffBottom, scale(perpL(shinD), 5.2))} b={add(cuffBottom, scale(perpL(shinD), -5.2))} stroke={pal.shade} strokeWidth={1.2} />
      </Part>
      <Part id={`${id}t`} a={hip} b={knee} ra={8} rb={6.2} pal={pal}>
        {/* outseam */}
        {!front && <Line a={lerpV(hip, knee, 0.12)} b={lerpV(hip, knee, 0.9)} stroke={pal.shade} strokeWidth={0.7} opacity={0.8} />}
        {/* cargo pocket on the visible thigh */}
        {!front && !far && (
          <g transform={`translate(${P(lerpV(hip, knee, 0.55)).replace(',', ' ')}) rotate(${deg(thighD).toFixed(1)})`}>
            <rect x={-5} y={-4} width={10} height={8} rx={1.6} fill={pal.shade} opacity={0.55} stroke={pal.line} strokeWidth={0.5} />
            <line x1={-4.6} y1={-4} x2={-4.6} y2={4} stroke={pal.light} strokeWidth={1.2} opacity={0.7} />
          </g>
        )}
      </Part>
      {/* knee joint + reinforced knee patch */}
      <circle cx={knee[0]} cy={knee[1]} r={6.1} fill={`url(#${id}t)`} />
      {front ? (
        <Ellipse c={add(knee, scale(thighD, 0.5))} rx={5.2} ry={4.2} along={thighD} fill={pal.shade} opacity={0.75} stroke={STITCH} strokeWidth={0.5} strokeDasharray="1.2 1" />
      ) : (
        <Ellipse c={add(knee, scale(kneeOut, 2.4))} rx={5} ry={3.4} along={norm(add(thighD, shinD), shinD)} fill={pal.shade} opacity={0.75} stroke={STITCH} strokeWidth={0.5} strokeDasharray="1.2 1" />
      )}
    </g>
  )
}

function Boot({ sk, ankle, toe, knee, far, u }: { sk: Skeleton; ankle: Vec; toe: Vec; knee: Vec; far?: boolean; u: string }) {
  const f = norm(sub(toe, ankle), [1, 0])
  let up = perpL(f)
  if (dot(up, sub(knee, ankle)) < 0) up = scale(up, -1)
  const pt = (fa: number, ua: number) => add(ankle, add(scale(f, fa), scale(up, ua)))
  const pal = PAL.dark
  const id = `${u}b`
  const fill = far ? pal.shade : `url(#${id})`

  if (sk.view === 'front') {
    return (
      <g>
        <Part id={id} a={ankle} b={add(ankle, scale(up, 9))} ra={5.6} rb={5.4} pal={pal} />
        <Part id={`${id}2`} a={ankle} b={add(toe, scale(f, 1))} ra={5} rb={4.4} pal={pal} />
        <Line a={pt(-4, -4.4)} b={pt(9, -4.4)} stroke={SOLE} strokeWidth={2.2} />
        <Line a={pt(-3, 3)} b={pt(3, 3)} stroke={pal.light} strokeWidth={0.8} opacity={0.8} />
        <Line a={pt(-3, 5.5)} b={pt(3, 5.5)} stroke={pal.light} strokeWidth={0.8} opacity={0.8} />
      </g>
    )
  }

  const outline = [pt(-6, -4), pt(16.5, -4), pt(18.5, -1.5), pt(17.5, 1.8), pt(9, 4.6), pt(4.8, 12.5), pt(-5.6, 12.5), pt(-6.8, 1)]
  const laceA = pt(4.4, 10.6)
  const laceB = pt(10.5, 4.2)
  return (
    <g>
      <Shade id={id} a={pt(0, -4)} b={pt(0, 12)} r={10} pal={pal} />
      <polygon points={outline.map(P).join(' ')} fill={fill} stroke={pal.line} strokeWidth={1.4} strokeLinejoin="round" />
      {/* sole + tread */}
      <polygon points={[pt(-6.2, -4.4), pt(16.8, -4.4), pt(17.6, -2.4), pt(-6.6, -2.4)].map(P).join(' ')} fill={SOLE} />
      {[0, 1, 2, 3, 4].map((i) => (
        <Line key={i} a={pt(-3.5 + i * 4.6, -4.6)} b={pt(-3.5 + i * 4.6, -3.2)} stroke={pal.light} strokeWidth={0.6} opacity={0.5} />
      ))}
      {/* laces */}
      {[0, 1, 2].map((i) => {
        const c = lerpV(laceA, laceB, i / 2.4)
        return <Line key={i} a={add(c, scale(f, -1.8))} b={add(c, scale(f, 1.8))} stroke="#C9D3DF" strokeWidth={0.9} opacity={0.85} />
      })}
      {/* toe cap highlight + heel counter */}
      <path d={`M ${P(pt(12, 3.2))} Q ${P(pt(17, 2))} ${P(pt(17.8, -0.6))}`} stroke={pal.light} strokeWidth={1} fill="none" opacity={0.7} strokeLinecap="round" />
      <Line a={pt(-5.6, 2)} b={pt(-4.8, 9.5)} stroke={pal.light} strokeWidth={0.8} opacity={0.5} />
    </g>
  )
}

// ───────────── Arms ─────────────

export function Arm({ sk, side, far, u }: { sk: Skeleton; side: 'F' | 'B'; far?: boolean; u: string }) {
  const id = `${u}a${side}`
  const sh = side === 'F' ? sk.shoulderF : sk.shoulderB
  const el = side === 'F' ? sk.elbowF : sk.elbowB
  const hand = side === 'F' ? sk.handF : sk.handB
  const pal = far ? PAL.jacketFar : PAL.jacket
  const upD = norm(sub(el, sh))
  const foreD = norm(sub(hand, el))
  const wrist = add(hand, scale(foreD, -2.4))
  const elbowOut = jointOut(upD, foreD, perpL(foreD))
  // The mitt follows the hand angle: in line with the forearm, or bent flat when the palm is on the mat.
  const handD = dir(side === 'F' ? sk.handAngF : sk.handAngB)
  const flat = clamp01(1 - dot(handD, foreD))
  let thumb = perpL(handD)
  if (sk.view === 'side' ? thumb[0] < 0 : dot(thumb, sub(sk.hip, hand)) > 0) thumb = scale(thumb, -1)
  const mitt = add(hand, scale(handD, 1.4 + 1.8 * flat))

  return (
    <g>
      <Part id={`${id}u`} a={sh} b={el} ra={6.4} rb={5.3} pal={pal}>
        {/* sleeve seam */}
        <Line a={add(lerpV(sh, el, 0.15), scale(litNormal(sh, el), -2.4))} b={add(lerpV(sh, el, 0.85), scale(litNormal(sh, el), -2))} stroke={pal.shade} strokeWidth={0.7} opacity={0.9} />
      </Part>
      <Part id={`${id}f`} a={el} b={wrist} ra={5.3} rb={4.6} pal={pal}>
        {/* puffer quilting */}
        <Line a={add(lerpV(el, wrist, 0.5), scale(perpL(foreD), 4.6))} b={add(lerpV(el, wrist, 0.5), scale(perpL(foreD), -4.6))} stroke={pal.shade} strokeWidth={0.7} />
      </Part>
      <circle cx={el[0]} cy={el[1]} r={5.4} fill={`url(#${id}f)`} />
      <Ellipse c={add(el, scale(elbowOut, 1.6))} rx={3.6} ry={2.8} along={upD} fill={pal.shade} opacity={0.6} />
      {/* glove gauntlet with stripe */}
      <Part id={`${id}g`} a={add(wrist, scale(foreD, -3))} b={add(wrist, scale(foreD, 0.8))} ra={5.2} rb={4.8} pal={PAL.dark}>
        <Line a={add(add(wrist, scale(foreD, -1.4)), scale(thumb, 5))} b={add(add(wrist, scale(foreD, -1.4)), scale(thumb, -5))} stroke={PAL.beanie.base} strokeWidth={1} />
      </Part>
      {/* mitt + thumb */}
      {flat < 0.6 && (
        <Part id={`${id}t`} a={add(hand, scale(thumb, 2.4))} b={add(add(hand, scale(thumb, 3.6 - 2 * flat)), scale(handD, 3.2 + 2 * flat))} ra={2} rb={1.7} pal={PAL.dark} />
      )}
      <Shade id={`${id}h`} a={hand} b={add(hand, handD)} r={4.4} pal={PAL.dark} />
      <Ellipse c={mitt} rx={5 + 1.6 * flat} ry={4.3 - 1.1 * flat} along={handD} fill={`url(#${id}h)`} stroke={PAL.dark.line} strokeWidth={0.8} />
      <path
        d={`M ${P(add(add(mitt, scale(handD, 2.8 + 1.6 * flat)), scale(thumb, 2.4 - 0.8 * flat)))} Q ${P(add(mitt, scale(handD, 4.2 + 1.6 * flat)))} ${P(add(add(mitt, scale(handD, 2.8 + 1.6 * flat)), scale(thumb, -2.4 + 0.8 * flat)))}`}
        stroke={PAL.dark.light}
        strokeWidth={0.8}
        fill="none"
        opacity={0.8}
      />
    </g>
  )
}

// ───────────── Torso ─────────────

export function Pelvis({ sk, u }: { sk: Skeleton; u: string }) {
  const front = sk.view === 'front'
  return front ? (
    <Part id={`${u}pv`} a={sk.hipB} b={sk.hipF} ra={8.6} rb={8.6} pal={PAL.pants} />
  ) : (
    <Part id={`${u}pv`} a={sk.hipB} b={sk.hipF} ra={7.8} rb={7.8} pal={PAL.pants} />
  )
}

// Torso outlines in local (s along the spine, v across) coords. Same point count so a twisting chest can blend between them.
const TORSO_FRONT: [number, number][] = [[-3, 12], [14, 12.6], [30, 15.2], [41, 15.4], [46, 11.5], [46, -11.5], [41, -15.4], [30, -15.2], [14, -12.6], [-3, -12]]
const TORSO_SIDE: [number, number][] = [[-3, 9.8], [16, 10.8], [31, 12.4], [41, 10.8], [46, 6.5], [46, -8.5], [39, -11], [30, -10.72], [20, -10.4], [-3, -10.4]]

export function Torso({ sk, back, u }: { sk: Skeleton; back: boolean; u: string }) {
  const id = `${u}tor`
  const d = dir(sk.torsoAngle)
  const perp: Vec = [d[1], -d[0]]
  const pal = PAL.jacket
  /** Local torso coords: s along the spine from the hip, v across (+ = chest in side view). */
  const L = (s: number, v: number): Vec => add(sk.hip, add(scale(d, s), scale(perp, v)))
  // fw: 0 = chest in profile, 1 = chest square to the camera. A profile chest pointing toward -x mirrors the side outline.
  const { square: fw, flip, yaw } = chestFacing(sk)
  const fa = clamp01((fw - 0.45) / 0.4)

  // Blend in the chest-forward frame, then mirror when the chest points toward -x (the front outline is symmetric).
  const pts = TORSO_FRONT.map(([s, v], i) => P(L(lerp(TORSO_SIDE[i][0], s, fw), flip * lerp(TORSO_SIDE[i][1], v, fw)))).join(' ')
  const wAt = (s: number) => lerp(10.4, s < 20 ? 12.4 : 15, fw)
  const quilt = (s: number) => {
    const a = L(s, -wAt(s) + 0.6)
    const b = L(s, wAt(s) - 0.6)
    return `M ${P(a)} Q ${P(L(s - 2.2, 0))} ${P(b)}`
  }
  // Center front (zip line): on the chest edge in profile, centered when facing the camera.
  const vz = 8.6 * Math.cos(yaw) + 0.6 * Math.sin(yaw)
  const chest = (s: number, v: number) => L(s, vz - 0.6 + v * fw)

  const hood = lerpV(L(43.5, -8.5 * flip), L(46, 0), fw)
  return (
    <g>
      <linearGradient id={id} gradientUnits="userSpaceOnUse" {...gradAcross(L(22, 15), L(22, -15))}>
        <stop offset="0" stopColor={pal.light} />
        <stop offset="0.45" stopColor={pal.base} />
        <stop offset="1" stopColor={pal.shade} />
      </linearGradient>
      {/* hood rolled behind the neck */}
      {!back && <Ellipse c={hood} rx={lerp(5.6, 11, fw)} ry={lerp(6.5, 4.6, fw)} along={perp} fill={pal.shade} stroke={pal.line} strokeWidth={0.8} />}
      <polygon points={pts} fill={pal.line} stroke={pal.line} strokeWidth={6.6} strokeLinejoin="round" />
      <polygon points={pts} fill={`url(#${id})`} stroke={`url(#${id})`} strokeWidth={5} strokeLinejoin="round" />
      {/* puffer quilting */}
      <path d={quilt(17)} stroke={pal.shade} strokeWidth={0.9} fill="none" opacity={0.85} />
      <path d={quilt(30)} stroke={pal.shade} strokeWidth={0.9} fill="none" opacity={0.85} />
      {/* hem band */}
      <Line a={L(0, -wAt(0) - 1)} b={L(0, wAt(0) + 1)} stroke={pal.shade} strokeWidth={4.2} />
      <Line a={L(1.6, -wAt(0))} b={L(1.6, wAt(0))} stroke={pal.light} strokeWidth={0.6} opacity={0.7} />
      {!back && (
        <>
          {/* center zip (the front edge seam in profile), pull, chest pocket, logo patch */}
          <Line a={L(lerp(2, -1, fw), vz)} b={L(lerp(44, 46, fw), vz - 0.2 * (1 - fw))} stroke={pal.line} strokeWidth={lerp(0.9, 1.2, fw)} opacity={lerp(0.7, 1, fw)} />
          {fa > 0 && (
            <g opacity={fa}>
              <rect x={-1} y={-2.2} width={2} height={4.4} rx={0.8} fill="#C9D3DF" transform={`translate(${P(chest(40, 1.8)).replace(',', ' ')}) rotate(${deg(d).toFixed(1)})`} />
              <Line a={chest(36, -12)} b={chest(33.5, -5)} stroke={pal.line} strokeWidth={1.1} />
              <circle cx={chest(34, 8)[0]} cy={chest(34, 8)[1]} r={2.4} fill={PAL.beanie.base} stroke="#fff" strokeWidth={0.6} />
            </g>
          )}
          {fw < 0.9 && <Line a={L(4, -9 * flip)} b={L(40, -9.4 * flip)} stroke={pal.light} strokeWidth={0.6} opacity={0.5 * (1 - fw)} />}
        </>
      )}
      {back && (
        <>
          <Line a={L(2, 0)} b={L(44, 0)} stroke={pal.shade} strokeWidth={0.8} />
          <Ellipse c={L(45, 0)} rx={11} ry={5.2} along={perp} fill={pal.shade} stroke={pal.line} strokeWidth={0.8} />
        </>
      )}
      {/* neck gaiter */}
      <Part id={`${u}gt`} a={L(45.5, 0)} b={L(48.5, 0)} ra={lerp(6, 7.4, fw)} rb={lerp(5.4, 6.8, fw)} pal={PAL.gaiter}>
        <Line a={L(46.6, -6.4)} b={L(46.6, 6.4)} stroke={PAL.beanie.base} strokeWidth={0.9} opacity={0.9} />
        <Line a={L(49.2, -6)} b={L(49.2, 6)} stroke={PAL.gaiter.light} strokeWidth={0.6} opacity={0.8} />
      </Part>
    </g>
  )
}

function gradAcross(a: Vec, b: Vec) {
  const lit = dot(sub(a, b), LIGHT) >= 0
  const [p, q] = lit ? [a, b] : [b, a]
  return { x1: p[0], y1: p[1], x2: q[0], y2: q[1] }
}

// ───────────── Head ─────────────

export function Head({ sk, back, u }: { sk: Skeleton; back: boolean; u: string }) {
  const r = 11
  const h = sk.head
  const a = sk.headAngle
  const axis = dir(a)
  const across = dir(a + 90)
  const face = dir(a - 90)
  const lensId = `${u}lens`
  const skin = back ? PAL.skinFar : PAL.skin
  const at = (up: number, side: number, from: Vec = h) => add(from, add(scale(axis, up), scale(across, side)))

  // Head yaw: 0 = profile facing +x, 90 = facing the viewer, 180 = profile facing -x.
  const Y = Math.min(195, Math.max(-15, sk.yaw)) * RAD
  const cy = Math.cos(Y)
  const sy = Math.sin(Y)
  const sideA = clamp01((Math.abs(cy) - 0.35) / 0.4)
  const frontA = clamp01((sy - 0.55) / 0.35)
  /** Point on the head surface `rr` from the axis at azimuth `phi` from the nose, projected to the screen. */
  const on = (up: number, rr: number, phi = 0) => add(at(up, 0), scale(face, rr * Math.cos(Y + phi * RAD)))
  const seen = (phi: number) => Math.sin(Y + phi * RAD) > 0.05

  const dome: Vec[] = []
  for (let i = 0; i <= 14; i++) dome.push(add(h, scale(dir(a - 95 + (190 * i) / 14), r + 1.3)))
  const band1 = add(h, scale(dir(a - 96), r + 1.4))
  const band2 = add(h, scale(dir(a + 96), r + 1.4))
  const pom = add(h, scale(axis, r + 3.4))

  // Goggles ride the face: on its edge in profile, centered and full width when facing the viewer.
  const gc = on(1.6, 8.6)
  const lensOff = 8.6 * cy
  const lensW = Math.min(lerp(7, 22, sy * sy), 2 * (r + 1.8 - Math.abs(lensOff)))
  const lensH = lerp(7.6, 8.4, sy)
  const cheek = (phi: number) => on(-4.6, 8, phi)

  return (
    <g>
      <Shade id={`${u}hd`} a={h} b={add(h, across)} r={r} pal={skin} />
      <Shade id={`${u}bn`} a={h} b={add(h, across)} r={r} pal={PAL.beanie} />
      <circle cx={h[0]} cy={h[1]} r={r} fill={`url(#${u}hd)`} stroke={skin.line} strokeWidth={0.8} />
      {!back && sideA > 0 && (
        <g opacity={sideA}>
          {/* ear, nose, mouth */}
          <Ellipse c={on(-2.4, 1.6, 180)} rx={2.4} ry={3.2} along={axis} fill={skin.shade} stroke={skin.line} strokeWidth={0.6} />
          <circle cx={on(-3, 10.6)[0]} cy={on(-3, 10.6)[1]} r={2.1} fill={skin.base} stroke={skin.line} strokeWidth={0.6} />
          <Line a={on(-6.6, 7.4)} b={on(-6.2, 9.6)} stroke={skin.line} strokeWidth={0.9} />
        </g>
      )}
      {!back && frontA > 0 && (
        <g opacity={frontA}>
          <Ellipse c={on(-3.4, 3)} rx={1.6} ry={1.2} along={across} fill={skin.shade} />
          <path d={`M ${P(on(-6.4, 8, -22))} Q ${P(on(-8.4, 8))} ${P(on(-6.4, 8, 22))}`} stroke={skin.line} strokeWidth={0.9} fill="none" strokeLinecap="round" />
          {seen(50.8) && <circle cx={cheek(50.8)[0]} cy={cheek(50.8)[1]} r={2} fill="#F08A7A" opacity={0.35} />}
          {seen(-50.8) && <circle cx={cheek(-50.8)[0]} cy={cheek(-50.8)[1]} r={2} fill="#F08A7A" opacity={0.35} />}
        </g>
      )}
      {/* beanie dome with knit ribs */}
      <polygon points={dome.map(P).join(' ')} fill={`url(#${u}bn)`} stroke={PAL.beanie.line} strokeWidth={0.8} strokeLinejoin="round" />
      {[-0.72, -0.48, -0.24, 0, 0.24, 0.48, 0.72].map((s) => (
        <Line key={s} a={at(1.8, s * r)} b={at(Math.sqrt(1 - s * s) * (r + 0.4), s * r)} stroke={PAL.beanie.shade} strokeWidth={0.6} opacity={0.7} />
      ))}
      <Line a={band1} b={band2} stroke={PAL.beanie.shade} strokeWidth={4.4} />
      {Array.from({ length: 11 }, (_, i) => {
        const s = -1 + (2 * (i + 0.5)) / 11
        return <Line key={i} a={at(-1.4, s * (r + 0.8))} b={at(1.4, s * (r + 0.8))} stroke={PAL.beanie.line} strokeWidth={0.5} opacity={0.6} />
      })}
      {/* pom-pom */}
      <circle cx={pom[0]} cy={pom[1]} r={4} fill="#fff" stroke="#C9D7E4" strokeWidth={0.7} />
      <circle cx={pom[0] + 1.3} cy={pom[1] - 1.2} r={1.6} fill="#DCE6F0" />
      <circle cx={pom[0] - 1.4} cy={pom[1] + 1.1} r={1.1} fill="#DCE6F0" />
      {/* goggles */}
      {!back && (
        <>
          <linearGradient id={lensId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={LENS_A} />
            <stop offset="1" stopColor={LENS_B} />
          </linearGradient>
          {/* strap: a band around the head at eye level, hidden behind the lens on the face side */}
          <Line a={at(1.6, -r - 0.8)} b={at(1.6, r + 0.8)} stroke={PAL.dark.base} strokeWidth={lerp(2.8, 3, sy)} />
          <g transform={`translate(${gc[0].toFixed(2)} ${gc[1].toFixed(2)}) rotate(${(a - 180).toFixed(1)})`}>
            <rect
              x={-lensW / 2 + 0.3 * cy}
              y={-lensH / 2}
              width={lensW}
              height={lensH}
              rx={lerp(2.6, 3.8, sy)}
              fill={`url(#${lensId})`}
              stroke={PAL.dark.base}
              strokeWidth={lerp(1.4, 1.6, sy)}
            />
            {sy > 0.75 ? (
              <path d="M -7 -2.6 L -3 2.6 M -4.4 -2.6 L -1.4 1.2" stroke="#fff" strokeWidth={0.9} opacity={0.6} strokeLinecap="round" transform={`translate(${(lensOff * 0.3).toFixed(2)} 0)`} />
            ) : (
              <line x1={0.4 * Math.sign(cy || 1)} y1={-2.2} x2={2.2 * Math.sign(cy || 1)} y2={1.4} stroke="#fff" strokeWidth={0.8} opacity={0.6} strokeLinecap="round" />
            )}
          </g>
        </>
      )}
      {back && <Line a={at(1.6, -r - 0.8)} b={at(1.6, r + 0.8)} stroke={PAL.dark.base} strokeWidth={3} />}
    </g>
  )
}

// ───────────── Ghost silhouette ─────────────

/** Flat single-color body used to preview the pose the rider is moving into. */
export function Silhouette({ sk }: { sk: Skeleton }) {
  const d = dir(sk.torsoAngle)
  const seg = (a: Vec, b: Vec, w: number, key: string) => <line key={key} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} strokeWidth={w} strokeLinecap="round" />
  return (
    <g stroke="currentColor" fill="currentColor">
      {seg(sk.hipF, sk.kneeF, 14, 'tf')}
      {seg(sk.kneeF, sk.ankleF, 11, 'sf')}
      {seg(sk.ankleF, sk.toeF, 8, 'ff')}
      {seg(sk.hipB, sk.kneeB, 14, 'tb')}
      {seg(sk.kneeB, sk.ankleB, 11, 'sb')}
      {seg(sk.ankleB, sk.toeB, 8, 'fb')}
      {seg(add(sk.hip, scale(d, 4)), add(sk.hip, scale(d, 42)), lerp(21, 28, chestFacing(sk).square), 'to')}
      {seg(sk.shoulderF, sk.elbowF, 11, 'uf')}
      {seg(sk.elbowF, sk.handF, 9.5, 'lf')}
      {seg(sk.shoulderB, sk.elbowB, 11, 'ub')}
      {seg(sk.elbowB, sk.handB, 9.5, 'lb')}
      <circle cx={sk.head[0]} cy={sk.head[1]} r={12} stroke="none" />
    </g>
  )
}
