import { describe, expect, it } from 'vitest'
import { CLIPS } from '../clips'
import { buildSkeleton, footContacts, isPlanted, samplePose, STEP_MIN, type IKLimb, type Limb, type LimbName, type Skeleton, type Vec } from '../rig'
import type { Clip } from '../types'

const N = 480
const JOINTS = ['hip', 'head', 'handF', 'handB', 'ankleF', 'ankleB', 'kneeF', 'kneeB'] as const
const TIP: Record<LimbName, 'handF' | 'handB' | 'ankleF' | 'ankleB'> = { armF: 'handF', armB: 'handB', legF: 'ankleF', legB: 'ankleB' }
const LIMBS: LimbName[] = ['armF', 'armB', 'legF', 'legB']

const isIK = (l: Limb): l is IKLimb => !Array.isArray(l)
const at = (clip: Clip, p: number): Skeleton => buildSkeleton(samplePose(clip.keys, p, clip.view), clip.view)
const d = (a: Vec, b: Vec) => Math.hypot(a[0] - b[0], a[1] - b[1])
const endOf = (l: IKLimb, limb: LimbName, clip: Clip) => l.end ?? (limb === 'legB' && clip.view === 'front' ? -90 : 90)

/** Hand/foot resting on the floor at both ends of a keyframe segment. */
function plantedSegments(clip: Clip) {
  const out: { i: number; limb: LimbName; a: IKLimb; b: IKLimb; t0: number; t1: number }[] = []
  clip.keys.forEach((key, i) => {
    const next = clip.keys[i + 1] ?? { ...clip.keys[0], at: 1 }
    for (const limb of LIMBS) {
      const a = key.pose[limb]
      const b = next.pose[limb]
      if (!isIK(a) || !isIK(b) || a.slide || b.slide) continue
      if (isPlanted(limb, a.to, endOf(a, limb, clip), clip.view) && isPlanted(limb, b.to, endOf(b, limb, clip), clip.view)) out.push({ i, limb, a, b, t0: key.at, t1: next.at })
    }
  })
  return out
}

/** Side-view boot outline points that could touch the floor (matches body.tsx Boot). */
function bootPoints(sk: Skeleton, s: 'F' | 'B'): Vec[] {
  const ankle = s === 'F' ? sk.ankleF : sk.ankleB
  const toe = s === 'F' ? sk.toeF : sk.toeB
  const knee = s === 'F' ? sk.kneeF : sk.kneeB
  const l = d(toe, ankle) || 1
  const f: Vec = [(toe[0] - ankle[0]) / l, (toe[1] - ankle[1]) / l]
  let up: Vec = [-f[1], f[0]]
  if (up[0] * (knee[0] - ankle[0]) + up[1] * (knee[1] - ankle[1]) < 0) up = [-up[0], -up[1]]
  return [[-6.2, -4.4], [16.8, -4.4], [18.5, -1.5], [17.5, 1.8], [-6.8, 1]].map(([a, u]) => [ankle[0] + f[0] * a + up[0] * u, ankle[1] + f[1] * a + up[1] * u])
}

describe.each(Object.entries(CLIPS))('%s', (_id, clip) => {
  it('flows through keyframes without kinks', () => {
    const kinks: string[] = []
    const h = 0.002
    // Typical distance each joint covers per h, to tell real motion from a smooth turnaround.
    const pace: Record<string, number> = {}
    for (const j of JOINTS) {
      let len = 0
      for (let i = 0; i < 120; i++) len += d(at(clip, i / 120)[j], at(clip, (i + 1) / 120)[j])
      pace[j] = len * h
    }
    clip.keys.forEach((key, i) => {
      const prev = clip.keys[i - 1] ?? clip.keys[clip.keys.length - 1]
      if (key.ease || prev.ease || clip.keys.length < 3) return
      const s0 = at(clip, key.at - h)
      const s1 = at(clip, key.at)
      const s2 = at(clip, key.at + h)
      for (const j of JOINTS) {
        const vin: Vec = [s1[j][0] - s0[j][0], s1[j][1] - s0[j][1]]
        const vout: Vec = [s2[j][0] - s1[j][0], s2[j][1] - s1[j][1]]
        const a = Math.hypot(...vin)
        const b = Math.hypot(...vout)
        // Only judge joints that are moving through the key at a decent fraction of their usual pace.
        if (Math.min(a, b) < Math.max(0.05, 0.3 * pace[j])) continue
        const cos = (vin[0] * vout[0] + vin[1] * vout[1]) / (a * b)
        if (cos < Math.cos((35 * Math.PI) / 180)) kinks.push(`${j} at key ${i} (${((Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI).toFixed(0)}°)`)
      }
    })
    expect(kinks.join('; ')).toBe('')
  })

  it('plants hands and feet: they hold still, pivot on the sole, or take a real step', () => {
    const slides = plantedSegments(clip)
      .filter(({ limb, a, b }) => {
        const dx = Math.abs(b.to[0] - a.to[0])
        if (dx <= 0.5 || dx >= STEP_MIN) return false
        if (limb[0] === 'l' && clip.view === 'side') {
          // Rising onto the toes or rocking onto the heel keeps one edge of the sole in place.
          const ca = footContacts(a.to, endOf(a, limb, clip))
          const cb = footContacts(b.to, endOf(b, limb, clip))
          if (d(ca.ball, cb.ball) < 1.5 || d(ca.heel, cb.heel) < 1.5) return false
        }
        return true
      })
      .map(({ i, limb, a, b }) => `${limb} key ${i}: ${a.to[0]} -> ${b.to[0]}`)
    expect(slides.join('; ')).toBe('')
  })

  it('keeps planted hands and feet on their targets (within reach)', () => {
    const misses: string[] = []
    for (const seg of plantedSegments(clip)) {
      for (let p = seg.t0; p < seg.t1; p += 1 / N) {
        const pose = samplePose(clip.keys, p, clip.view)
        const target = (pose[seg.limb] as IKLimb).to
        const miss = d(buildSkeleton(pose, clip.view)[TIP[seg.limb]], target)
        if (miss > 1) {
          misses.push(`${seg.limb} key ${seg.i} @${p.toFixed(3)}: off by ${miss.toFixed(1)}`)
          break
        }
      }
    }
    expect(misses.join('; ')).toBe('')
  })

  it('never pushes a foot or hand through the floor', () => {
    const below: string[] = []
    for (let i = 0; i < N && below.length < 4; i++) {
      const sk = at(clip, i / N)
      const pts: [string, Vec][] = [
        ['handF', sk.handF],
        ['handB', sk.handB],
      ]
      if (clip.view === 'side') for (const s of ['F', 'B'] as const) for (const p of bootPoints(sk, s)) pts.push([`boot${s}`, p])
      for (const [name, p] of pts) if (p[1] < -2.5) below.push(`${name} @${(i / N).toFixed(3)}: y=${p[1].toFixed(1)}`)
    }
    expect(below.join('; ')).toBe('')
  })

  it('holds identical keyframes perfectly still', () => {
    clip.keys.forEach((key, i) => {
      const next = clip.keys[i + 1]
      if (!next || JSON.stringify(key.pose) !== JSON.stringify(next.pose)) return
      const a = at(clip, key.at)
      const m = at(clip, (key.at + next.at) / 2)
      for (const j of JOINTS) expect(d(a[j], m[j])).toBeLessThan(0.01)
    })
  })
})
