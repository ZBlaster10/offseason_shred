import { STAND_H } from '../rig'
import type { Clip } from '../types'
import { A, fstand, ik, onToes, seq, stand, toesBehind } from './base'

// Incline push-up: the body pivots around planted toes; palms flat on the chair seat.
const INCLINE_HIP: [number, number] = [-4, 47]
const inclineFeet = { legF: toesBehind(INCLINE_HIP, 69.5), legB: toesBehind(INCLINE_HIP, 70.5) }

export const upperClips: Record<string, Clip> = {
  inclinePushUp: {
    view: 'side',
    ms: 2600,
    reps: 1,
    props: { chair: { x: 74, facing: 1 } },
    keys: seq(
      { hip: INCLINE_HIP, torso: 126, head: 122, armF: ik(70, 47, 90), armB: ik(67, 47, 90), ...inclineFeet },
      { hip: [2, 33], torso: 113, head: 110, armF: ik(70, 47, 90), armB: ik(67, 47, 90), ...inclineFeet },
    ),
  },

  pikePushUp: {
    view: 'side',
    ms: 2800,
    reps: 1,
    props: { mat: true },
    keys: seq(
      { hip: [-10, 80], torso: 48, head: 30, armF: ik(30, 3), armB: ik(27, 3), legF: onToes(-33, 25), legB: onToes(-36, 25) },
      { hip: [-4, 72], torso: 36, head: 16, armF: ik(30, 3), armB: ik(27, 3), legF: onToes(-33, 25), legB: onToes(-36, 25) },
    ),
  },

  chairDip: {
    view: 'side',
    ms: 2600,
    reps: 1,
    props: { chair: { x: -32, facing: 1 } },
    keys: seq(
      { hip: [-12, 44], torso: 178, armF: ik(-22, 47, 90), armB: ik(-25, 47, 90), legF: ik(48, A, 100), legB: ik(46, A, 100) },
      { hip: [-13, 24], torso: 174, armF: ik(-22, 47, 90), armB: ik(-25, 47, 90), legF: ik(48, A, 100), legB: ik(46, A, 100) },
    ),
  },

  strapRow: {
    view: 'side',
    ms: 2600,
    reps: 1,
    props: { straps: { anchor: [96, 196], to: 'hands' } },
    keys: seq(
      { hip: [-6, 66], torso: 210, head: 200, armF: ik(14, 135), armB: ik(12, 133), legF: ik(30, A), legB: ik(26, A) },
      { hip: [8, 73], torso: 196, head: 190, armF: ik(14, 116), armB: ik(12, 114), legF: ik(30, A), legB: ik(26, A) },
    ),
  },

  bandRow: {
    view: 'side',
    ms: 2400,
    reps: 1,
    props: { band: { kind: 'anchor', anchor: [86, 104] } },
    keys: seq(
      stand({ hip: [-4, STAND_H - 6], torso: 176, armF: ik(48, 104), armB: ik(46, 104), legF: ik(6, A), legB: ik(-8, A) }),
      stand({ hip: [-4, STAND_H - 6], torso: 180, armF: ik(14, 102), armB: ik(12, 102), legF: ik(6, A), legB: ik(-8, A) }),
    ),
  },

  kbRow: {
    view: 'side',
    ms: 2600,
    reps: 1,
    props: { weight: 'handF' },
    keys: seq(
      { hip: [-12, 66], torso: 112, head: 118, armF: [4, 2], armB: ik(26, 50), legF: ik(14, A), legB: ik(-20, A) },
      { hip: [-12, 66], torso: 112, head: 118, armF: ik(14, 72, undefined, -1), armB: ik(26, 50), legF: ik(14, A), legB: ik(-20, A) },
    ),
  },

  pullApart: {
    view: 'front',
    ms: 2200,
    reps: 1,
    props: { band: { kind: 'hands' } },
    keys: seq(fstand({ armF: ik(9, 112), armB: ik(-9, 112) }), fstand({ armF: [90, 92], armB: [-90, -92] })),
  },
}
