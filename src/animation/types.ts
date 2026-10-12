import type { Keyframe, Vec, View } from './rig'

export interface PropSpec {
  /** Where a kettlebell/dumbbell is held when the exercise uses one. */
  weight?: 'goblet' | 'handF' | 'handB' | 'hands' | 'rackF'
  straps?: { anchor: Vec; to: 'hands' | 'feet' }
  band?: { kind: 'hands' } | { kind: 'anchor'; anchor: Vec } | { kind: 'knees' }
  chair?: { x: number; facing: 1 | -1 }
  wall?: number
  /** Balance board under the feet (uses pose.tilt). */
  board?: boolean
  /** Jump rope (uses pose.rope). */
  rope?: boolean
  /** Foam roller (uses pose.roll). */
  roller?: boolean
  /** Dashed snowboard outline under the feet. */
  ghostBoard?: boolean
  /** Exercise mat on the floor. */
  mat?: boolean
}

export interface Clip {
  view: View
  /** Loop length in ms for holds/continuous moves (and the default rep pace). */
  ms: number
  /**
   * Reps per loop: 1 = one rep per loop, 2 = alternating (left + right) per loop.
   * Omit for holds and continuous moves, which loop at `ms`.
   */
  reps?: 1 | 2
  keys: Keyframe[]
  props?: PropSpec
  /** Loop phase used for static thumbnails (default 0.5). */
  thumb?: number
  /** Joints whose motion path is drawn, overriding the automatic pick. */
  trace?: TraceJoint[]
}

export type TraceJoint = 'hip' | 'head' | 'handF' | 'handB' | 'ankleF' | 'ankleB' | 'kneeF' | 'kneeB'
