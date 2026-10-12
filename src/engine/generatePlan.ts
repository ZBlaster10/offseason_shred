import { EXERCISES, EXERCISE_MAP } from '@/data/exercises'
import type {
  Block,
  BlockType,
  EquipmentId,
  Exercise,
  Focus,
  Goal,
  Level,
  Phase,
  Profile,
  Session,
  SessionItem,
  Slot,
  SwapMap,
  WeekPlan,
} from '@/domain/types'
import { baseDose, blockSec, doseItem, itemWorkSec, MAX_REPS, type Dose } from './dosage'
import { phaseFor, type PhaseInfo } from './phases'
import { seededRng } from './random'

export const PREPARE_SEC = 10
export const BLOCK_TRANSITION_SEC = 20
export const WARMUP_SHARE = 0.12
export const COOLDOWN_SHARE = 0.1
const TRANSITION_SEC = 5
/** Main blocks longer than this are split into two circuits. */
const SPLIT_BLOCK_SEC = 16 * 60

export interface GenerateOptions {
  intensityAdjust?: number
  swaps?: SwapMap
}

type MainType = Exclude<BlockType, 'warmup' | 'cooldown'>

interface BlockSpec {
  type: MainType
  focus: Focus
  weight: number
}

export const FOCUS_META: Record<Focus, { title: string; blurb: string }> = {
  'strength-legs': { title: 'Quad Burner', blurb: 'Leg strength for long runs and solid landings.' },
  'strength-singleLeg': { title: 'Edge Control', blurb: 'Single-leg strength and balance for edge-to-edge control.' },
  'strength-full': { title: 'Full-Body Shred', blurb: 'Total-body strength, from legs to fall-proof shoulders.' },
  'aerobic-intervals': { title: 'Lap Day', blurb: 'Cardio intervals so your legs last until last chair.' },
  'aerobic-plyo': { title: 'Park Laps', blurb: 'Jumps, pops and landings for park and side hits.' },
  'aerobic-mixed': { title: 'Powder Day Engine', blurb: 'Mixed conditioning for deep days and long hikes.' },
  'mobility-hips': { title: 'Hip Flow', blurb: 'Open the hips and build a stable core.' },
  'mobility-core': { title: 'Core & Balance', blurb: 'A rock-solid trunk for balance on a moving board.' },
  'mobility-flow': { title: 'Recovery Flow', blurb: 'Mobility and core work to move well and recover.' },
}

export const BLOCK_LABEL: Record<BlockType, string> = {
  warmup: 'Warm-up',
  strength: 'Strength',
  aerobic: 'Conditioning',
  mobility: 'Core & Mobility',
  cooldown: 'Cool-down',
}

const FOCI: Record<MainType, Focus[]> = {
  strength: ['strength-legs', 'strength-singleLeg', 'strength-full'],
  aerobic: ['aerobic-intervals', 'aerobic-plyo', 'aerobic-mixed'],
  mobility: ['mobility-hips', 'mobility-core', 'mobility-flow'],
}

const GOAL_ORDER: Goal[] = ['strength', 'aerobic', 'mobility']

// ───────────── Slot templates ─────────────

function strengthSlots(focus: Focus, phase: Phase): Slot[] {
  const power = phase === 'power'
  switch (focus) {
    case 'strength-legs':
      return power
        ? ['squat', 'plyo', 'hinge', 'lunge', 'plyo', 'calf', 'singleLeg', 'coreAntiRot', 'pull', 'balance']
        : ['squat', 'hinge', 'lunge', 'calf', 'singleLeg', 'coreAntiRot', 'push', 'squat', 'pull', 'balance']
    case 'strength-singleLeg':
      return power
        ? ['singleLeg', 'plyo', 'hinge', 'lunge', 'balance', 'pull', 'push', 'calf', 'coreAntiRot', 'singleLeg']
        : ['singleLeg', 'hinge', 'lunge', 'pull', 'balance', 'push', 'calf', 'singleLeg', 'coreAntiRot', 'squat']
    default:
      return power
        ? ['squat', 'push', 'plyo', 'pull', 'singleLeg', 'hinge', 'coreAntiRot', 'lunge', 'calf', 'balance']
        : ['squat', 'pull', 'singleLeg', 'push', 'hinge', 'coreAntiRot', 'lunge', 'calf', 'balance', 'pull']
  }
}

function aerobicSlots(focus: Focus, phase: Phase): Slot[] {
  if (focus === 'aerobic-plyo') {
    return phase === 'foundation'
      ? ['plyo', 'cardio', 'cardio', 'plyo', 'cardio', 'balance', 'cardio', 'plyo', 'cardio', 'cardio']
      : ['plyo', 'cardio', 'plyo', 'plyo', 'cardio', 'plyo', 'balance', 'cardio', 'plyo', 'cardio']
  }
  if (focus === 'aerobic-mixed') {
    return ['cardio', 'plyo', 'cardio', 'balance', 'cardio', 'plyo', 'cardio', 'coreAntiExt', 'cardio', 'plyo']
  }
  if (phase === 'power') return ['plyo', 'cardio', 'plyo', 'cardio', 'plyo', 'cardio', 'cardio', 'plyo', 'cardio', 'plyo']
  if (phase === 'strength') return ['cardio', 'plyo', 'cardio', 'cardio', 'plyo', 'cardio', 'cardio', 'plyo', 'cardio', 'cardio']
  return ['cardio', 'cardio', 'plyo', 'cardio', 'cardio', 'cardio', 'plyo', 'cardio', 'cardio', 'cardio']
}

function mobilitySlots(focus: Focus): Slot[] {
  switch (focus) {
    case 'mobility-hips':
      return ['mobility', 'coreAntiExt', 'mobility', 'coreAntiRot', 'posterior', 'mobility', 'coreRot', 'balance', 'mobility', 'coreAntiExt']
    case 'mobility-core':
      return ['coreAntiExt', 'coreAntiRot', 'posterior', 'mobility', 'coreRot', 'coreAntiExt', 'balance', 'mobility', 'coreAntiRot', 'posterior']
    default:
      return ['mobility', 'mobility', 'coreAntiRot', 'posterior', 'mobility', 'coreAntiExt', 'balance', 'coreRot', 'mobility', 'posterior']
  }
}

const slotsFor = (spec: BlockSpec, phase: Phase) =>
  spec.type === 'strength'
    ? strengthSlots(spec.focus, phase)
    : spec.type === 'aerobic'
      ? aerobicSlots(spec.focus, phase)
      : mobilitySlots(spec.focus)

// ───────────── Session layouts ─────────────

function sessionLayouts(days: number, goalsIn: Goal[], weekIndex: number, phase: Phase): BlockSpec[][] {
  const goals = GOAL_ORDER.filter((g) => goalsIn.includes(g))
  const f = (g: MainType, v: number) => FOCI[g][v % 3]
  const plyoOrIntervals: Focus = phase === 'power' || phase === 'strength' ? 'aerobic-plyo' : 'aerobic-intervals'

  if (days === 1) {
    const w: Record<MainType, number> = { strength: 1, aerobic: 0.8, mobility: 0.7 }
    return [
      goals.map((g) => ({
        type: g,
        focus: g === 'strength' ? 'strength-full' : f(g, weekIndex),
        weight: w[g],
      })),
    ]
  }

  if (goals.length === 3) {
    if (days === 2) {
      return [
        [
          { type: 'strength', focus: 'strength-legs', weight: 0.65 },
          { type: 'mobility', focus: 'mobility-core', weight: 0.35 },
        ],
        [
          { type: 'aerobic', focus: plyoOrIntervals, weight: 0.55 },
          { type: 'strength', focus: 'strength-singleLeg', weight: 0.25 },
          { type: 'mobility', focus: 'mobility-hips', weight: 0.2 },
        ],
      ]
    }
    return [
      [
        { type: 'strength', focus: 'strength-legs', weight: 0.75 },
        { type: 'mobility', focus: 'mobility-core', weight: 0.25 },
      ],
      [
        { type: 'aerobic', focus: plyoOrIntervals, weight: 0.7 },
        { type: 'strength', focus: 'strength-singleLeg', weight: 0.3 },
      ],
      [
        { type: 'mobility', focus: 'mobility-flow', weight: 0.75 },
        { type: 'aerobic', focus: 'aerobic-mixed', weight: 0.25 },
      ],
    ]
  }

  if (goals.length === 2) {
    const [x, y] = goals as MainType[]
    const sessions: BlockSpec[][] = [
      [
        { type: x, focus: f(x, 0), weight: 0.65 },
        { type: y, focus: f(y, 0), weight: 0.35 },
      ],
      [
        { type: y, focus: f(y, 1), weight: 0.65 },
        { type: x, focus: f(x, 1), weight: 0.35 },
      ],
    ]
    if (days === 3) {
      sessions.push([
        { type: x, focus: f(x, 2), weight: 0.5 },
        { type: y, focus: f(y, 2), weight: 0.5 },
      ])
    }
    return sessions
  }

  const g = goals[0] as MainType
  return Array.from({ length: days }, (_, i) => [{ type: g, focus: f(g, i), weight: 1 }])
}

// ───────────── Selection ─────────────

export const hasEquipment = (ex: Exercise, owned: EquipmentId[]) =>
  ex.equipment.length === 0 || ex.equipment.some((e) => owned.includes(e))

/** The owned item an exercise would use (kettlebell preferred over dumbbells). */
export const equipmentFor = (ex: Exercise, owned: EquipmentId[]): EquipmentId | undefined =>
  ex.equipment.find((e) => owned.includes(e))

interface PickCtx {
  rng: () => number
  owned: EquipmentId[]
  level: Level
  phase: Phase
  usedSession: Set<string>
  usedClips: Set<string>
  usedWeek: Map<string, number>
}

const FLOW_WARMUPS = ['cat-cow', 'worlds-greatest-stretch', 'inchworm']

function scoreExercise(ex: Exercise, slot: Slot, ctx: PickCtx) {
  let s = ctx.rng() * 2.5
  if (ex.slots[0] === slot) s += 1
  if (ex.difficulty === ctx.level) s += 2
  else if (ex.difficulty === ctx.level - 1) s += 1
  if (ex.equipment.length) s += 2.5
  s -= 6 * (ctx.usedWeek.get(ex.id) ?? 0)
  if (ctx.usedClips.has(ex.clip)) s -= 4
  if (ctx.phase === 'power' && ex.impact) s += 1.5
  if (ctx.phase === 'strength' && (slot === 'singleLeg' || ex.equipment.length)) s += 0.5
  if (ctx.phase === 'foundation' && ex.difficulty < ctx.level) s += 0.5
  if (ctx.phase === 'maintenance' && ex.impact) s -= 1
  return s
}

function pick(
  slot: Slot,
  ctx: PickCtx,
  exclude: Set<string>,
  bonus?: (ex: Exercise) => number,
  allowSessionRepeat = false,
): Exercise | null {
  const maxDiff = slot === 'warmup' || slot === 'cooldown' ? Math.min(3, ctx.level + 1) : ctx.level
  let best: Exercise | null = null
  let bestScore = -Infinity
  for (const ex of EXERCISES) {
    if (!ex.slots.includes(slot)) continue
    if (ex.difficulty > maxDiff) continue
    if (exclude.has(ex.id)) continue
    const repeat = ctx.usedSession.has(ex.id)
    if (repeat && !allowSessionRepeat) continue
    if (!hasEquipment(ex, ctx.owned)) continue
    const s = scoreExercise(ex, slot, ctx) + (bonus ? bonus(ex) : 0) - (repeat ? 20 : 0)
    if (s > bestScore) {
      bestScore = s
      best = ex
    }
  }
  return best
}

function commit(ex: Exercise, ctx: PickCtx) {
  ctx.usedSession.add(ex.id)
  ctx.usedClips.add(ex.clip)
  ctx.usedWeek.set(ex.id, (ctx.usedWeek.get(ex.id) ?? 0) + 1)
}

// ───────────── Block builders ─────────────

function buildWarmup(budget: number, ctx: PickCtx, dose: Dose, info: PhaseInfo, hasCardio: boolean): Block {
  const items: SessionItem[] = []
  let total = 0
  const tmp = new Set<string>()
  while (total < budget - 12 && items.length < 9) {
    const i = items.length
    const ex = pick('warmup', ctx, tmp, (e) => {
      let b = 0
      if (i === 0 && FLOW_WARMUPS.includes(e.id)) b += 4
      if (e.id === 'jumping-jacks') b += hasCardio && total > budget * 0.6 ? 4 : -3
      if (e.category === 'core') b -= 2
      return b
    })
    if (!ex) break
    const item = doseItem(ex, 'warmup', 'warmup', dose, info, `0-${i}`)
    const t = blockSec([item], 1, 0, 0) + (i ? TRANSITION_SEC : 0)
    if (items.length >= 3 && total + t > budget + t / 2) break
    commit(ex, ctx)
    items.push(item)
    total += t
  }
  return { type: 'warmup', title: 'Warm-up', rounds: 1, restSec: TRANSITION_SEC, roundRestSec: 0, items }
}

function buildCooldown(budget: number, ctx: PickCtx, dose: Dose, info: PhaseInfo, blockIndex: number): Block {
  const items: SessionItem[] = []
  let total = 0
  const tmp = new Set<string>()
  while (total < budget - 12 && items.length < 7) {
    const i = items.length
    const ex = pick('cooldown', ctx, tmp, (e) => (e.category === 'cooldown' ? 2 : 0) + (e.equipment.length ? 1 : 0))
    if (!ex) break
    const item = doseItem(ex, 'cooldown', 'cooldown', dose, info, `${blockIndex}-${i}`)
    const t = blockSec([item], 1, 0, 0) + (i ? TRANSITION_SEC : 0)
    if (items.length >= 2 && total + t > budget + t / 2) break
    commit(ex, ctx)
    items.push(item)
    total += t
  }
  return { type: 'cooldown', title: 'Cool-down', rounds: 1, restSec: TRANSITION_SEC, roundRestSec: 0, items }
}

interface FitResult {
  block: Block
  nextSlot: number
}

function buildMain(
  spec: BlockSpec,
  slots: Slot[],
  startSlot: number,
  budget: number,
  ctx: PickCtx,
  dose: Dose,
  info: PhaseInfo,
  blockIndex: number,
  title: string,
  secondary: boolean,
  maxKCap = Infinity,
): FitResult {
  // Tentatively pick an exercise for every remaining slot.
  const picks: { ex: Exercise; slot: Slot; idx: number }[] = []
  const tmp = new Set<string>()
  const tmpClips = new Set<string>()
  const fill = (allowRepeat: boolean) => {
    for (let s = startSlot; s < slots.length; s++) {
      if (picks.some((p) => p.idx === s)) continue
      const ex = pick(slots[s], { ...ctx, usedClips: new Set([...ctx.usedClips, ...tmpClips]) }, tmp, undefined, allowRepeat)
      if (!ex) continue
      tmp.add(ex.id)
      tmpClips.add(ex.clip)
      picks.push({ ex, slot: slots[s], idx: s })
    }
  }
  fill(false)
  // Small pools (e.g. beginner, no equipment, long cardio session): reuse moves from
  // earlier blocks rather than running a circuit with only one or two exercises.
  if (picks.length < (secondary ? 2 : 4)) {
    fill(true)
    picks.sort((a, b) => a.idx - b.idx)
  }

  const type = spec.type
  const plyoHeavy = picks.filter((p) => p.ex.category === 'plyo').length >= 2
  let restSec = type === 'mobility' ? 10 : dose.restSec + (type === 'aerobic' && plyoHeavy && info.phase === 'power' ? 10 : 0)
  let roundRestSec = (type === 'mobility' ? 15 : type === 'aerobic' ? 40 : 45) + (info.isDeload ? 15 : 0)
  const [prefMin, prefMax] = type === 'mobility' ? [1, 2] : type === 'aerobic' ? [2, 4] : [2, 3]
  const maxRounds = type === 'mobility' ? 3 : 5
  const minK = secondary ? 2 : 3
  const maxK = Math.min(picks.length, maxKCap, type === 'mobility' ? 8 : 6)

  const dosed = picks.map((p, i) => doseItem(p.ex, type, p.slot, dose, info, `${blockIndex}-${i}`))

  let best = { k: Math.min(minK, dosed.length), rounds: 1, score: Infinity, dur: 0 }
  for (let k = Math.min(minK, dosed.length); k <= maxK; k++) {
    for (let r = 1; r <= maxRounds; r++) {
      const dur = blockSec(dosed.slice(0, k), r, restSec, roundRestSec)
      let score = Math.abs(dur - budget)
      if (r < prefMin || r > prefMax) score += 90
      if (k < 3) score += 45
      if (score < best.score) best = { k, rounds: r, score, dur }
    }
  }

  const items = dosed.slice(0, best.k)
  const rounds = best.rounds

  // Absorb the remaining difference into rests so the session lands on time.
  let diff = budget - blockSec(items, rounds, restSec, roundRestSec)
  if (rounds > 1) {
    const adj = Math.max(-25, Math.min(45, Math.round(diff / (rounds - 1) / 5) * 5))
    roundRestSec = Math.max(15, roundRestSec + adj)
    diff = budget - blockSec(items, rounds, restSec, roundRestSec)
  }
  const gaps = (items.length - 1) * rounds
  if (gaps > 0 && Math.abs(diff) > 20) {
    const adj = Math.max(-10, Math.min(15, Math.round(diff / gaps / 5) * 5))
    restSec = Math.max(type === 'mobility' ? 5 : 10, restSec + adj)
    diff = budget - blockSec(items, rounds, restSec, roundRestSec)
  }
  // Last resort: stretch or trim the work itself (±30%).
  if (Math.abs(diff) > budget * 0.05) {
    const work = rounds * items.reduce((s, it) => s + itemWorkSec(it), 0)
    const f = Math.max(0.7, Math.min(1.3, (work + diff) / work))
    for (const it of items) {
      if (it.mode === 'time') it.workSec = Math.max(15, Math.round(((it.workSec ?? 30) * f) / 5) * 5)
      else it.reps = Math.min(MAX_REPS, Math.max(4, Math.round((it.reps ?? 8) * f)))
    }
  }

  for (const p of picks.slice(0, best.k)) commit(p.ex, ctx)

  // Next circuit continues after the last slot actually used.
  const lastUsed = picks[best.k - 1]
  return {
    block: { type, title, rounds, restSec, roundRestSec, items },
    nextSlot: lastUsed ? lastUsed.idx + 1 : startSlot,
  }
}

// ───────────── Public API ─────────────

export function profileSignature(p: Profile) {
  return [p.daysPerWeek, [...p.equipment].sort().join(','), p.level, [...p.goals].sort().join(','), p.sessionMinutes].join('|')
}

export function sessionSec(blocks: Block[]) {
  const body = blocks.reduce((s, b) => s + blockSec(b.items, b.rounds, b.restSec, b.roundRestSec), 0)
  return PREPARE_SEC + body + Math.max(0, blocks.length - 1) * BLOCK_TRANSITION_SEC
}

const mainTitle = (type: MainType, phase: Phase, part: number | null) => {
  const base = type === 'strength' ? (phase === 'power' ? 'Strength & Power' : 'Strength Circuit') : type === 'aerobic' ? 'Conditioning' : 'Core & Mobility'
  return part ? `${base} ${part}` : base
}

export function generateWeek(profile: Profile, weekKey: string, opts: GenerateOptions = {}): WeekPlan {
  const info = phaseFor(profile, weekKey)
  const adjust = opts.intensityAdjust ?? 0
  const dose = baseDose(profile.level, adjust, info)
  const layouts = sessionLayouts(profile.daysPerWeek, profile.goals.length ? profile.goals : ['strength'], info.weekIndex, info.phase)
  const usedWeek = new Map<string, number>()
  const sig = profileSignature(profile)
  const target = profile.sessionMinutes * 60
  const sessionIds = ['A', 'B', 'C']

  const sessions: Session[] = layouts.map((specs, si) => {
    const ctx: PickCtx = {
      rng: seededRng(`${weekKey}|${sig}|${si}`),
      owned: profile.equipment,
      level: profile.level,
      phase: info.phase,
      usedSession: new Set(),
      usedClips: new Set(),
      usedWeek,
    }
    const ordered = [...specs].sort((a, b) => b.weight - a.weight)
    const hasCardio = ordered.some((s) => s.type === 'aerobic')

    const warm = buildWarmup(target * WARMUP_SHARE, ctx, dose, info, hasCardio)
    const coolPlaceholderIndex = 99
    const cool = buildCooldown(target * COOLDOWN_SHARE, ctx, dose, info, coolPlaceholderIndex)
    const warmSec = blockSec(warm.items, 1, warm.restSec, 0)
    const coolSec = blockSec(cool.items, 1, cool.restSec, 0)

    // Decide which main specs need splitting into two circuits.
    const totalWeight = ordered.reduce((s, b) => s + b.weight, 0)
    const roughMain = target - warmSec - coolSec - PREPARE_SEC
    const parts = ordered.map((spec) => (roughMain * (spec.weight / totalWeight) > SPLIT_BLOCK_SEC ? 2 : 1))
    const blockCount = 2 + parts.reduce((a, b) => a + b, 0)
    const mainBudget = target - warmSec - coolSec - PREPARE_SEC - (blockCount - 1) * BLOCK_TRANSITION_SEC

    const blocks: Block[] = [warm]
    ordered.forEach((spec, i) => {
      const slots = slotsFor(spec, info.phase)
      const budget = mainBudget * (spec.weight / totalWeight)
      const secondary = spec.weight < 0.4
      let startSlot = 0
      for (let p = 0; p < parts[i]; p++) {
        const title = mainTitle(spec.type, info.phase, parts[i] > 1 ? p + 1 : null)
        // When splitting, leave half the template for the second circuit.
        const cap = parts[i] > 1 && p === 0 ? Math.floor(slots.length / 2) : Infinity
        const res = buildMain(spec, slots, startSlot, budget / parts[i], ctx, dose, info, blocks.length, title, secondary, cap)
        startSlot = res.nextSlot
        if (res.block.items.length) blocks.push(res.block)
      }
    })
    const coolIndex = blocks.length
    blocks.push({ ...cool, items: cool.items.map((it, j) => ({ ...it, key: `${coolIndex}-${j}` })) })

    const id = sessionIds[si]
    applySwaps(blocks, opts.swaps, `${weekKey}|${id}|`, dose, info)

    const primary = ordered[0]
    const equipmentUsed = new Set<EquipmentId>()
    for (const b of blocks)
      for (const it of b.items) {
        const e = equipmentFor(EXERCISE_MAP[it.exerciseId], profile.equipment)
        if (e) equipmentUsed.add(e)
      }

    return {
      id,
      title: FOCUS_META[primary.focus].title,
      subtitle: ordered.map((s) => BLOCK_LABEL[s.type]).join(' + '),
      focus: primary.focus,
      blocks,
      estimatedSec: sessionSec(blocks),
      equipmentUsed: [...equipmentUsed],
    }
  })

  return {
    weekKey,
    weekIndex: info.weekIndex,
    phase: info.phase,
    phaseWeek: info.phaseWeek,
    isDeload: info.isDeload,
    weeksToSeason: info.weeksToSeason,
    sessions,
  }
}

function applySwaps(blocks: Block[], swaps: SwapMap | undefined, prefix: string, dose: Dose, info: PhaseInfo) {
  if (!swaps) return
  for (const b of blocks) {
    b.items = b.items.map((it) => {
      const sw = swaps[prefix + it.key]
      const to = sw && EXERCISE_MAP[sw.to]
      if (!sw || !to || sw.from !== it.exerciseId) return it
      return { ...doseItem(to, b.type, it.slot, dose, info, it.key), swappedFrom: it.exerciseId }
    })
  }
}

/** Alternatives for an item: same slot, owned equipment, not already in the session. */
export function swapOptions(item: SessionItem, session: Session, profile: Profile): Exercise[] {
  const inSession = new Set(session.blocks.flatMap((b) => b.items.map((i) => i.exerciseId)))
  const current = EXERCISE_MAP[item.exerciseId]
  return EXERCISES.filter(
    (ex) =>
      ex.slots.includes(item.slot) &&
      hasEquipment(ex, profile.equipment) &&
      ex.difficulty <= Math.max(profile.level, current.difficulty) &&
      !inSession.has(ex.id),
  ).sort((a, b) => {
    const ca = a.category === current.category ? 0 : 1
    const cb = b.category === current.category ? 0 : 1
    return ca - cb || Math.abs(a.difficulty - current.difficulty) - Math.abs(b.difficulty - current.difficulty)
  })
}
