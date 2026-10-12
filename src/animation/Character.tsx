import { memo, useEffect, useId, useMemo, useRef, useState } from 'react'
import type { EquipmentId } from '@/domain/types'
import { Arm, Head, Leg, Pelvis, Silhouette, Torso } from './body'
import { CLIPS } from './clips'
import { buildSkeleton, lerpV, samplePose, type Skeleton, type Vec } from './rig'
import type { Clip, PropSpec, TraceJoint } from './types'
import { subscribeFrame } from './ticker'

const C = {
  shadow: 'rgba(11, 26, 46, 0.18)',
  prop: '#3A4658',
  propLight: '#8A97A8',
  band: '#E84D8A',
  chair: '#A0714F',
  chairDark: '#7A5238',
  board: '#C98B4E',
  boardDark: '#9E6A37',
  beanie: '#3FA9E0',
  strap: '#1A2230',
  mat: 'rgba(63, 169, 224, 0.22)',
}

const VB_W = 220
const VB_H = 214
const FLOOR_Y = 198

export interface CharacterProps {
  clip: string
  /** Equipment the rider uses for this exercise (selects kettlebell vs dumbbell prop). */
  equipment?: EquipmentId
  mirror?: boolean
  paused?: boolean
  /** Seconds per rep; paces rep-based clips. */
  secPerRep?: number
  /** Render a single frame (thumbnails). */
  still?: boolean
  /** Loop phase for the single still frame (defaults to the clip's thumbnail phase). */
  at?: number
  /** Motion path, direction arrow and next-pose ghost. Defaults to on for animated characters. */
  guides?: boolean
  className?: string
  title?: string
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const centerCache = new Map<string, number>()

/** Horizontal center of a clip's motion, so each exercise sits centered in frame. */
function clipCenter(id: string, clip: Clip) {
  const cached = centerCache.get(id)
  if (cached !== undefined) return cached
  let lo = Infinity
  let hi = -Infinity
  for (let i = 0; i < 16; i++) {
    const s = buildSkeleton(samplePose(clip.keys, i / 16, clip.view), clip.view)
    for (const p of [s.head, s.handF, s.handB, s.toeF, s.toeB, s.kneeF, s.kneeB, s.hip]) {
      lo = Math.min(lo, p[0])
      hi = Math.max(hi, p[0])
    }
  }
  let c = (lo + hi) / 2
  if (clip.props?.chair) c = (Math.min(lo, clip.props.chair.x - 16) + Math.max(hi, clip.props.chair.x + 16)) / 2
  centerCache.set(id, c)
  return c
}

export function loopMs(clip: Clip, secPerRep?: number) {
  if (clip.reps && secPerRep) return clip.reps * secPerRep * 1000
  return clip.ms
}

function usePhase(clip: Clip, paused: boolean, still: boolean, secPerRep?: number, at?: number) {
  const [phase, setPhase] = useState(at ?? clip.thumb ?? 0.5)
  const state = useRef({ phase: 0, last: 0 })
  const ms = loopMs(clip, secPerRep)

  useEffect(() => {
    if (still) {
      setPhase(at ?? clip.thumb ?? 0.5)
      return
    }
    if (paused) return
    const reduced = prefersReducedMotion()
    state.current.last = 0
    return subscribeFrame((now) => {
      const s = state.current
      if (!s.last) s.last = now
      const dt = now - s.last
      s.last = now
      s.phase = (s.phase + dt / ms) % 1
      if (reduced) {
        // Step through keyframes instead of smooth motion.
        const keys = clip.keys
        const idx = Math.floor(s.phase * keys.length)
        setPhase(keys[idx]?.at ?? 0)
      } else setPhase(s.phase)
    })
  }, [clip, ms, paused, still, at])

  return phase
}

// ───────────── Motion guides ─────────────

type Joint = TraceJoint
const JOINTS: Joint[] = ['handF', 'handB', 'ankleF', 'ankleB', 'kneeF', 'kneeB', 'hip', 'head']
const SAMPLES = 192

interface Track {
  joint: Joint
  /** Joint position at SAMPLES evenly spaced phases. */
  pts: Vec[]
  /** Smooth closed path through the loop. */
  d: string
}

const trackCache = new Map<string, Track[]>()

const mod = (k: number, n: number) => ((k % n) + n) % n
const dist = (a: Vec, b: Vec) => Math.hypot(b[0] - a[0], b[1] - a[1])
const F = (p: Vec) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`

/** Points spaced evenly by arc length around a closed loop. */
function resampleLoop(pts: Vec[], spacing: number): Vec[] {
  const n = pts.length
  const cum = [0]
  for (let i = 1; i <= n; i++) cum.push(cum[i - 1] + dist(pts[i - 1], pts[i % n]))
  const total = cum[n]
  const m = Math.max(8, Math.round(total / spacing))
  const out: Vec[] = []
  let j = 0
  for (let k = 0; k < m; k++) {
    const target = (k / m) * total
    while (j < n - 1 && cum[j + 1] < target) j++
    const seg = cum[j + 1] - cum[j]
    out.push(lerpV(pts[j], pts[(j + 1) % n], seg > 1e-6 ? (target - cum[j]) / seg : 0))
  }
  return out
}

/** Catmull-Rom spline through the points as cubic Bézier commands (no leading M). */
function curveThrough(pts: Vec[], closed: boolean) {
  const n = pts.length
  const at = (i: number) => (closed ? pts[mod(i, n)] : pts[Math.min(n - 1, Math.max(0, i))])
  let d = ''
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = at(i - 1)
    const p1 = at(i)
    const p2 = at(i + 1)
    const p3 = at(i + 2)
    const c1: Vec = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2: Vec = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C ${F(c1)} ${F(c2)} ${F(p2)}`
  }
  return d
}

/**
 * The one or two joints that travel furthest over a loop. Their paths are what
 * the eye should follow to read the exercise (the hips in a squat, the hands in
 * a press, the knee in a high knee).
 */
function motionTracks(id: string, clip: Clip): Track[] {
  const cached = trackCache.get(id)
  if (cached) return cached
  const sks = Array.from({ length: SAMPLES }, (_, i) => buildSkeleton(samplePose(clip.keys, i / SAMPLES, clip.view), clip.view))
  const scored = JOINTS.map((joint) => {
    const pts = sks.map((s) => s[joint] as Vec)
    let lo: Vec = [Infinity, Infinity]
    let hi: Vec = [-Infinity, -Infinity]
    for (const p of pts) {
      lo = [Math.min(lo[0], p[0]), Math.min(lo[1], p[1])]
      hi = [Math.max(hi[0], p[0]), Math.max(hi[1], p[1])]
    }
    // Slight bias toward the hips/hands so ties go to the most readable joint.
    const bias = joint === 'hip' ? 1.12 : joint.startsWith('hand') ? 1.05 : joint === 'head' ? 0.8 : 1
    return { joint, pts, score: Math.hypot(hi[0] - lo[0], hi[1] - lo[1]) * bias }
  }).sort((a, b) => b.score - a.score)

  let picked: typeof scored = []
  if (clip.trace) picked = clip.trace.map((j) => scored.find((s) => s.joint === j)!)
  else {
    const top = scored[0]
    if (top && top.score > 16) {
      picked.push(top)
      const meanGap = (a: Vec[], b: Vec[]) => a.reduce((sum, p, i) => sum + Math.hypot(p[0] - b[i][0], p[1] - b[i][1]), 0) / a.length
      const second = scored.slice(1).find((s) => s.score > top.score * 0.6 && s.score > 16 && meanGap(s.pts, top.pts) > 18)
      if (second) picked.push(second)
    }
  }
  const out = picked.map(({ joint, pts }) => {
    const even = resampleLoop(pts, 5)
    return { joint, pts, d: `M ${F(even[0])}${curveThrough(even, true)} Z` }
  })
  trackCache.set(id, out)
  return out
}

/** Joint position on a track at any phase. */
function trackAt(t: Track, phase: number): Vec {
  const f = mod(phase, 1) * SAMPLES
  const i = Math.floor(f)
  return lerpV(t.pts[i % SAMPLES], t.pts[(i + 1) % SAMPLES], f - i)
}

/**
 * Comet tail: a tapered ribbon that follows the path the joint just travelled,
 * from `head` back along the track for up to `maxLen` units.
 */
function tailRibbon(t: Track, phase: number, head: Vec, maxLen: number) {
  const pts: Vec[] = [head]
  const lens = [0]
  let len = 0
  let k = Math.floor(mod(phase, 1) * SAMPLES)
  for (let steps = 0; steps < SAMPLES / 2 && len < maxLen; steps++, k--) {
    const p = t.pts[mod(k, SAMPLES)]
    const prev = pts[pts.length - 1]
    const dl = dist(prev, p)
    if (dl < 0.4) continue
    if (len + dl > maxLen) {
      pts.push(lerpV(prev, p, (maxLen - len) / dl))
      lens.push(maxLen)
      len = maxLen
      break
    }
    pts.push(p)
    len += dl
    lens.push(len)
  }
  if (len < 3 || pts.length < 3) return null
  const left: Vec[] = []
  const right: Vec[] = []
  pts.forEach((p, i) => {
    // Tangent points from older to newer (direction of travel).
    const a = pts[Math.min(pts.length - 1, i + 1)]
    const b = pts[Math.max(0, i - 1)]
    const l = dist(a, b) || 1
    const n: Vec = [-(b[1] - a[1]) / l, (b[0] - a[0]) / l]
    const w = (0.4 + 3.2 * (1 - lens[i] / len)) / 2
    left.push([p[0] + n[0] * w, p[1] + n[1] * w])
    right.push([p[0] - n[0] * w, p[1] - n[1] * w])
  })
  const r0 = (0.4 + 3.2) / 2
  const back = right.slice().reverse()
  const d = `M ${F(left[0])}${curveThrough(left, false)} L ${F(back[0])}${curveThrough(back, false)} A ${r0} ${r0} 0 0 1 ${F(left[0])} Z`
  return { d, from: pts[pts.length - 1], to: head }
}

/** Pose the rider is currently moving toward, and how much of the loop that move takes. */
function upcomingKey(clip: Clip, phase: number) {
  const keys = clip.keys
  if (keys.length < 2) return null
  for (let i = 0; i < keys.length; i++) {
    const next = keys[i + 1] ?? { ...keys[0], at: 1 }
    if (phase >= keys[i].at && phase < next.at) return { pose: (keys[i + 1] ?? keys[0]).pose, span: next.at - keys[i].at, local: (phase - keys[i].at) / (next.at - keys[i].at) }
  }
  return null
}

function poseDistance(a: Skeleton, b: Skeleton) {
  let sum = 0
  for (const j of JOINTS) sum += Math.hypot(a[j][0] - b[j][0], a[j][1] - b[j][1])
  return sum / JOINTS.length
}

function Guides({ id, clip, sk, phase, ms, animated, u }: { id: string; clip: Clip; sk: Skeleton; phase: number; ms: number; animated: boolean; u: string }) {
  const tracks = motionTracks(id, clip)
  const target = animated ? upcomingKey(clip, phase) : null
  let ghost: { sk: Skeleton; opacity: number } | null = null
  // Only ghost slower, deliberate moves — fast cyclic ones (jacks, skips) would just flicker.
  if (target && target.span * ms > 450) {
    const tsk = buildSkeleton(target.pose, clip.view)
    const dist = poseDistance(sk, tsk)
    const fadeIn = Math.min(1, target.local * 6)
    const opacity = Math.min(1, Math.max(0, (dist - 4) / 22)) * fadeIn * 0.2
    if (opacity > 0.01) ghost = { sk: tsk, opacity }
  }

  return (
    <g style={{ color: 'var(--primary)' }} pointerEvents="none">
      {ghost && (
        <g opacity={ghost.opacity}>
          <Silhouette sk={ghost.sk} />
        </g>
      )}
      {tracks.map((t) => {
        if (!animated) return <path key={t.joint} d={t.d} fill="none" stroke="currentColor" strokeWidth={1.4} strokeDasharray="2.5 3" opacity={0.45} />
        const tail = tailRibbon(t, phase, sk[t.joint] as Vec, 70)
        const gid = `${u}tail${t.joint}`
        return (
          <g key={t.joint}>
            <path d={t.d} fill="none" stroke="currentColor" strokeWidth={1.3} strokeDasharray="2.5 3" strokeLinecap="round" opacity={0.35} />
            {tail && (
              <>
                <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1={tail.from[0]} y1={tail.from[1]} x2={tail.to[0]} y2={tail.to[1]}>
                  <stop offset="0" stopColor="currentColor" stopOpacity={0} />
                  <stop offset="1" stopColor="currentColor" stopOpacity={0.85} />
                </linearGradient>
                <path d={tail.d} fill={`url(#${gid})`} />
              </>
            )}
          </g>
        )
      })}
    </g>
  )
}

/** Direction arrows drawn over the rider so they're never hidden by a limb. */
function Arrows({ id, clip, sk, phase }: { id: string; clip: Clip; sk: Skeleton; phase: number }) {
  return (
    <g style={{ color: 'var(--primary)' }} pointerEvents="none">
      {motionTracks(id, clip).map((t) => {
        const p = sk[t.joint] as Vec
        const speed = dist(p, trackAt(t, phase + 0.025))
        // Fade the arrow out at turnarounds where the direction flips.
        const opacity = Math.min(1, Math.max(0, (speed - 0.4) / 1.6))
        if (opacity <= 0) return null
        // Ride the path a little ahead of the joint, pointing along it.
        const offset = t.joint.startsWith('hand') ? 9 : t.joint === 'hip' ? 16 : 11
        let prev = p
        let len = 0
        let tip = p
        let tan: Vec = [0, 0]
        for (let k = Math.floor(mod(phase, 1) * SAMPLES) + 1, steps = 0; steps < SAMPLES / 2; k++, steps++) {
          const s = t.pts[mod(k, SAMPLES)]
          const dl = dist(prev, s)
          if (dl < 1e-6) continue
          tan = [s[0] - prev[0], s[1] - prev[1]]
          if (len + dl >= offset) {
            tip = lerpV(prev, s, (offset - len) / dl)
            break
          }
          len += dl
          tip = s
          prev = s
        }
        if (!tan[0] && !tan[1]) return null
        const ang = (Math.atan2(tan[1], tan[0]) * 180) / Math.PI
        return (
          <g key={t.joint} opacity={opacity} transform={`translate(${tip[0].toFixed(1)} ${tip[1].toFixed(1)}) rotate(${ang.toFixed(1)})`}>
            <path d="M 5 0 L -4 5.2 L -1.6 0 L -4 -5.2 Z" fill="currentColor" stroke="#fff" strokeWidth={1.2} strokeLinejoin="round" />
          </g>
        )
      })}
    </g>
  )
}

export const Character = memo(function Character({
  clip: clipId,
  equipment,
  mirror,
  paused = false,
  secPerRep,
  still = false,
  at,
  guides,
  className,
  title,
}: CharacterProps) {
  const clip = CLIPS[clipId] ?? CLIPS.stand
  const id = CLIPS[clipId] ? clipId : 'stand'
  const phase = usePhase(clip, paused, still, secPerRep, at)
  const sk = useMemo(() => buildSkeleton(samplePose(clip.keys, phase, clip.view), clip.view), [clip, phase])
  const cx = clipCenter(id, clip)
  const uid = `r${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const showGuides = guides ?? !still
  const animated = !still && !prefersReducedMotion()

  const flip = mirror ? `translate(${VB_W} 0) scale(-1 1)` : undefined
  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className={className} role="img" aria-label={title ?? 'Exercise animation'}>
      <g transform={flip}>
        <g transform={`translate(${VB_W / 2 - cx} ${FLOOR_Y}) scale(1 -1)`}>
          <Ground sk={sk} props={clip.props} />
          {showGuides && <Guides id={id} clip={clip} sk={sk} phase={phase} ms={loopMs(clip, secPerRep)} animated={animated} u={uid} />}
          <Rider sk={sk} props={clip.props} equipment={equipment} u={uid} />
          {showGuides && animated && !paused && <Arrows id={id} clip={clip} sk={sk} phase={phase} />}
        </g>
      </g>
    </svg>
  )
})

// ───────────── Drawing ─────────────

const P = (p: Vec) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`

function Ground({ sk, props }: { sk: Skeleton; props?: PropSpec }) {
  const lowest = Math.min(sk.ankleF[1], sk.ankleB[1], sk.toeF[1], sk.toeB[1], sk.handF[1], sk.handB[1], sk.hip[1] - 8)
  const air = Math.max(0, lowest - 4)
  const s = Math.max(0.45, 1 - air / 70)
  const midX = (sk.ankleF[0] + sk.ankleB[0] + sk.hip[0] * 2) / 4
  return (
    <g>
      {props?.mat && (
        <g>
          <rect x={-95} y={-3} width={190} height={4} rx={2} fill={C.mat} />
          <line x1={-92} y1={0.6} x2={92} y2={0.6} stroke="#fff" strokeWidth={0.6} opacity={0.4} />
        </g>
      )}
      {props?.wall !== undefined && (
        <g>
          <rect x={props.wall - 6} y={0} width={6} height={185} fill={C.propLight} opacity={0.35} />
          <rect x={props.wall - 1.5} y={0} width={1.5} height={185} fill="#fff" opacity={0.3} />
          <rect x={props.wall - 7} y={0} width={7} height={6} fill={C.propLight} opacity={0.45} />
        </g>
      )}
      {props?.chair && <Chair x={props.chair.x} facing={props.chair.facing} />}
      <ellipse cx={midX} cy={-1} rx={42 * s} ry={4.4 * s} fill={C.shadow} />
      <ellipse cx={midX} cy={-1} rx={24 * s} ry={2.6 * s} fill={C.shadow} />
      {props?.ghostBoard && <GhostBoard sk={sk} />}
    </g>
  )
}

function Chair({ x, facing }: { x: number; facing: 1 | -1 }) {
  const seat = 44
  const back = x - facing * 15
  return (
    <g strokeLinecap="round" fill="none" opacity={0.92}>
      <g stroke={C.chairDark} strokeWidth={4}>
        <line x1={x - 13} y1={seat} x2={x - 13} y2={0} />
        <line x1={x + 13} y1={seat} x2={x + 13} y2={0} />
        <line x1={back} y1={seat} x2={back} y2={seat + 40} />
        <line x1={x - 13} y1={14} x2={x + 13} y2={14} strokeWidth={2} />
      </g>
      <rect x={x - 18} y={seat - 2} width={36} height={6} rx={2} fill={C.chair} stroke={C.chairDark} strokeWidth={0.8} />
      <line x1={x - 16} y1={seat + 2.6} x2={x + 16} y2={seat + 2.6} stroke="#fff" strokeWidth={0.8} opacity={0.35} />
      <rect x={back - 3} y={seat + 22} width={6} height={18} rx={2} fill={C.chair} stroke={C.chairDark} strokeWidth={0.8} />
    </g>
  )
}

function GhostBoard({ sk }: { sk: Skeleton }) {
  const y = Math.min(sk.ankleF[1], sk.ankleB[1]) - 4
  const cx = (sk.ankleF[0] + sk.ankleB[0]) / 2
  const front = sk.view === 'front'
  const half = front ? 52 : 15
  return (
    <g transform={`rotate(${-sk.tilt} ${cx} ${y})`}>
      <rect x={cx - half} y={y - 3} width={half * 2} height={4} rx={2} fill="none" stroke={C.beanie} strokeWidth={1.5} strokeDasharray="4 3" />
    </g>
  )
}

function Weight({ at, kind, angle = 0 }: { at: Vec; kind: 'kettlebell' | 'dumbbell'; angle?: number }) {
  if (kind === 'dumbbell') {
    return (
      <g transform={`translate(${at[0]} ${at[1]}) rotate(${angle})`}>
        <rect x={-9} y={-2} width={18} height={4} rx={2} fill={C.propLight} />
        <line x1={-5} y1={-2} x2={-5} y2={2} stroke={C.prop} strokeWidth={0.6} />
        <line x1={5} y1={-2} x2={5} y2={2} stroke={C.prop} strokeWidth={0.6} />
        <rect x={-12.5} y={-6} width={6.5} height={12} rx={2} fill={C.prop} />
        <rect x={6} y={-6} width={6.5} height={12} rx={2} fill={C.prop} />
        <rect x={-11.5} y={1} width={1.6} height={4} rx={0.8} fill="#fff" opacity={0.3} />
        <rect x={7} y={1} width={1.6} height={4} rx={0.8} fill="#fff" opacity={0.3} />
      </g>
    )
  }
  return (
    <g transform={`translate(${at[0]} ${at[1]})`}>
      <path d="M -5 -2 Q -5 7.5 0 7.5 Q 5 7.5 5 -2" fill="none" stroke={C.prop} strokeWidth={2.8} />
      <circle cx={0} cy={-8} r={8.4} fill={C.prop} />
      <rect x={-6.5} y={-16.6} width={13} height={2.2} rx={1.1} fill="#232B38" />
      <ellipse cx={-3} cy={-5.6} rx={2.4} ry={1.6} fill={C.propLight} opacity={0.65} />
      <path d="M 4.2 -12.8 A 7 7 0 0 1 6 -6" stroke="#232B38" strokeWidth={1.2} fill="none" opacity={0.6} />
    </g>
  )
}

function Rider({ sk, props, equipment, u }: { sk: Skeleton; props?: PropSpec; equipment?: EquipmentId; u: string }) {
  const front = sk.view === 'front'
  const c = Math.cos(sk.turn * Math.PI)
  const back = front && c < 0
  const spin = sk.turn ? `translate(${sk.hip[0]} 0) scale(${Math.abs(c) < 0.08 ? 0.08 * Math.sign(c || 1) : c} 1) translate(${-sk.hip[0]} 0)` : undefined

  const weightKind = equipment === 'dumbbells' ? 'dumbbell' : equipment === 'kettlebell' ? 'kettlebell' : undefined
  const weightAt = (): Vec | null => {
    switch (props?.weight) {
      case 'goblet':
      case 'hands':
        return [(sk.handF[0] + sk.handB[0]) / 2, (sk.handF[1] + sk.handB[1]) / 2 - 2]
      case 'handF':
        return [sk.handF[0], sk.handF[1] - 2]
      case 'handB':
        return [sk.handB[0], sk.handB[1] - 2]
      case 'rackF':
        return [sk.handF[0], sk.handF[1] + 2]
      default:
        return null
    }
  }
  const wAt = weightKind ? weightAt() : null

  return (
    <g transform={spin}>
      {props?.straps && (
        <g stroke={C.strap} strokeWidth={1.6}>
          {(props.straps.to === 'hands' ? [sk.handF, sk.handB] : [sk.ankleF, sk.ankleB]).map((p, i) => (
            <line key={i} x1={props.straps!.anchor[0]} y1={props.straps!.anchor[1]} x2={p[0]} y2={p[1]} />
          ))}
          <circle cx={props.straps.anchor[0]} cy={props.straps.anchor[1]} r={2.5} fill={C.strap} />
        </g>
      )}
      {props?.board && <BalanceBoard sk={sk} />}
      {props?.roller && sk.roll && (
        <g>
          <circle cx={sk.roll[0]} cy={sk.roll[1]} r={8} fill={C.beanie} />
          {[0, 60, 120].map((a) => (
            <line
              key={a}
              x1={sk.roll![0] + 7 * Math.cos(((a + sk.roll![0] * 7) * Math.PI) / 180)}
              y1={sk.roll![1] + 7 * Math.sin(((a + sk.roll![0] * 7) * Math.PI) / 180)}
              x2={sk.roll![0] - 7 * Math.cos(((a + sk.roll![0] * 7) * Math.PI) / 180)}
              y2={sk.roll![1] - 7 * Math.sin(((a + sk.roll![0] * 7) * Math.PI) / 180)}
              stroke="#2783B8"
              strokeWidth={0.8}
            />
          ))}
          <circle cx={sk.roll[0]} cy={sk.roll[1]} r={3} fill="#fff" opacity={0.5} />
        </g>
      )}

      {front ? (
        <>
          <Leg sk={sk} side="B" u={u} />
          <Leg sk={sk} side="F" u={u} />
          <Pelvis sk={sk} u={u} />
          <Torso sk={sk} back={back} u={u} />
          {!back && <Arm sk={sk} side="B" u={u} />}
          {!back && <Arm sk={sk} side="F" u={u} />}
          <Head sk={sk} back={back} u={u} />
          {back && <Arm sk={sk} side="B" u={u} />}
          {back && <Arm sk={sk} side="F" u={u} />}
        </>
      ) : (
        <>
          <Arm sk={sk} side="B" far u={u} />
          {wAt && props?.weight === 'handB' && <Weight at={wAt} kind={weightKind!} />}
          <Leg sk={sk} side="B" far u={u} />
          <Pelvis sk={sk} u={u} />
          <Torso sk={sk} back={false} u={u} />
          <Leg sk={sk} side="F" u={u} />
          <Head sk={sk} back={false} u={u} />
          <Arm sk={sk} side="F" u={u} />
        </>
      )}

      {wAt && props?.weight !== 'handB' && <Weight at={wAt} kind={weightKind!} angle={sk.torsoAngle - 180} />}
      {props?.band && <Band sk={sk} band={props.band} />}
      {props?.rope && <Rope sk={sk} />}
    </g>
  )
}

function Band({ sk, band }: { sk: Skeleton; band: NonNullable<PropSpec['band']> }) {
  const common = { stroke: C.band, strokeWidth: 2.4, strokeLinecap: 'round' as const, fill: 'none' }
  if (band.kind === 'hands') return <line x1={sk.handF[0]} y1={sk.handF[1]} x2={sk.handB[0]} y2={sk.handB[1]} {...common} />
  if (band.kind === 'knees') {
    const a: Vec = [sk.kneeF[0], sk.kneeF[1] + 6]
    const b: Vec = [sk.kneeB[0], sk.kneeB[1] + 6]
    return <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} {...common} />
  }
  const mid: Vec = [(sk.handF[0] + sk.handB[0]) / 2, (sk.handF[1] + sk.handB[1]) / 2]
  return (
    <g>
      <line x1={band.anchor[0]} y1={band.anchor[1]} x2={mid[0]} y2={mid[1]} {...common} />
      <circle cx={band.anchor[0]} cy={band.anchor[1]} r={2.5} fill={C.band} />
    </g>
  )
}

function Rope({ sk }: { sk: Skeleton }) {
  const a = sk.handB
  const b = sk.handF
  const ang = sk.rope * Math.PI * 2
  // Rope sweeps from overhead (phase 0) down under the feet (phase 0.5).
  const cy = 90 + 92 * Math.cos(ang)
  const ctrl: Vec = [(a[0] + b[0]) / 2, cy]
  return <path d={`M ${P(a)} Q ${P(ctrl)} ${P(b)}`} stroke={C.prop} strokeWidth={1.8} fill="none" />
}

function BalanceBoard({ sk }: { sk: Skeleton }) {
  const cx = (sk.ankleF[0] + sk.ankleB[0]) / 2
  const y = 17
  return (
    <g>
      <circle cx={cx} cy={8} r={8} fill={C.prop} />
      <circle cx={cx - 2.5} cy={10.5} r={2.4} fill="#fff" opacity={0.18} />
      <g transform={`rotate(${-sk.tilt} ${cx} ${y})`}>
        <rect x={cx - 42} y={y - 1.5} width={84} height={5} rx={2.5} fill={C.board} stroke={C.boardDark} strokeWidth={0.8} />
        <line x1={cx - 39} y1={y + 2.2} x2={cx + 39} y2={y + 2.2} stroke="#fff" strokeWidth={0.7} opacity={0.35} />
        <rect x={cx - 30} y={y + 3} width={14} height={1} fill="#1A2230" opacity={0.6} />
        <rect x={cx + 16} y={y + 3} width={14} height={1} fill="#1A2230" opacity={0.6} />
      </g>
    </g>
  )
}
