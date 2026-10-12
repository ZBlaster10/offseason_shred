import { STAND_H, type Pose } from '../rig'
import type { Clip } from '../types'
import { A, fsquat, fstand, ik, k, mirror, onToes, seq, squat, stand } from './base'

const airborne = (h: number, o: Partial<Pose> = {}): Pose =>
  stand({ hip: [0, h], legF: [4, 2, 30], legB: [-4, -2, 30], armF: [170, 176], armB: [166, 172], ...o })

export const plyoClips: Record<string, Clip> = {
  dropSquat: {
    view: 'front',
    ms: 2500,
    reps: 1,
    thumb: 0.4,
    keys: [
      k(0, fstand({ hip: [0, STAND_H + 6], armF: [160, 170], armB: [-160, -170], legF: ik(10, A + 7, 50), legB: ik(-10, A + 7, -50) }), 'in'),
      k(0.18, fsquat(54, 20, { armF: [40, 70], armB: [-40, -70] })),
      k(0.6, fsquat(54, 20, { armF: [40, 70], armB: [-40, -70] })),
    ],
  },

  lineHops: {
    view: 'front',
    ms: 1000,
    keys: (() => {
      const land: Pose = fstand({ hip: [-14, 68], torso: 184, legF: ik(-6, A, 90), legB: ik(-20, A, -90), armF: [40, 60], armB: [-30, -50] })
      const air: Pose = fstand({ hip: [0, 84], legF: ik(5, 14, 90), legB: ik(-5, 14, -90), armF: [50, 70], armB: [-50, -70] })
      return seq(land, air, mirror(land), air)
    })(),
  },

  jumpSquat: {
    view: 'side',
    ms: 2500,
    reps: 1,
    keys: (() => {
      // Triple extension: hips and knees drive up and the feet roll onto their toes before leaving the floor.
      const push = stand({ hip: [-2, 84], torso: 176, armF: [150, 160], armB: [146, 156], legF: onToes(19.8, 45), legB: onToes(13.8, 45) })
      return [k(0, squat(46)), k(0.14, push, 'out'), k(0.35, airborne(100)), k(0.6, squat(52)), k(0.8, squat(46))]
    })(),
  },

  ollie: {
    view: 'side',
    ms: 2500,
    reps: 1,
    thumb: 0.45,
    keys: [
      k(0, squat(54)),
      k(0.22, { hip: [-14, 66], torso: 196, head: 186, armF: [60, 80], armB: [-40, -20], legF: [70, -10, 100], legB: ik(-3, A) }, 'out'),
      k(0.45, { hip: [0, 102], torso: 172, armF: [70, 90], armB: [-50, -30], legF: [110, -10, 100], legB: [80, -40, 90] }),
      k(0.7, squat(52)),
    ],
  },

  jump180: {
    view: 'front',
    ms: 5000,
    reps: 2,
    thumb: 0.06,
    keys: (() => {
      const crouch = (turn: number): Pose => fsquat(54, 24, { turn, armF: [60, 70], armB: [-60, -70] })
      const air = (turn: number): Pose =>
        fstand({ turn, hip: [0, 100], armF: [150, 160], armB: [-150, -160], legF: ik(14, 26, 60), legB: ik(-14, 26, -60) })
      return [k(0, crouch(0), 'out'), k(0.2, air(0.5)), k(0.4, crouch(1)), k(0.5, crouch(1), 'out'), k(0.7, air(1.5)), k(0.9, crouch(2)), k(0.999, crouch(2))]
    })(),
  },

  slHops: {
    view: 'side',
    ms: 700,
    keys: [
      k(0, stand({ hip: [0, 70], torso: 172, legF: ik(4, A), legB: [-10, -95, -20], armF: [30, 40], armB: [-20, -10] })),
      // Push off through the toes before leaving the floor.
      k(0.12, stand({ hip: [4, 78], torso: 174, legF: onToes(20.8, 50), legB: [-10, -95, -20], armF: [26, 36], armB: [-24, -14] }), 'out'),
      k(0.5, stand({ hip: [0, 88], legF: [2, 0, 55], legB: [-10, -95, -20], armF: [20, 30], armB: [-30, -20] }), 'in'),
    ],
  },

  broadJumpSL: {
    view: 'side',
    ms: 4000,
    reps: 1,
    thumb: 0.3,
    keys: [
      k(0, { hip: [-30, 60], torso: 128, head: 140, armF: [-40, -30], armB: [-44, -34], legF: ik(-20, A), legB: [-40, -100, -20] }, 'out'),
      k(0.3, { hip: [10, 92], torso: 160, armF: [140, 150], armB: [136, 146], legF: [30, -20, 60], legB: [-30, -110, -20] }),
      k(0.5, { hip: [28, 58], torso: 140, armF: [90, 100], armB: [84, 96], legF: ik(44, A), legB: [-30, -100, -20] }),
      k(0.75, { hip: [28, 58], torso: 140, armF: [90, 100], armB: [84, 96], legF: ik(44, A), legB: [-30, -100, -20] }),
    ],
  },

  skaterBound: {
    view: 'front',
    ms: 1600,
    keys: (() => {
      const land: Pose = { hip: [26, 58], torso: 166, armF: [-30, -40], armB: [-80, -100], legF: ik(34, A, 90), legB: ik(8, 12, -60) }
      const air: Pose = fstand({ hip: [0, 90], legF: ik(10, 22, 90), legB: ik(-10, 22, -90), armF: [30, 20], armB: [-30, -20] })
      return seq(land, air, mirror(land), air)
    })(),
  },

  skaterStep: {
    view: 'front',
    ms: 2400,
    keys: (() => {
      const side: Pose = { hip: [22, 62], torso: 168, armF: [-30, -40], armB: [-80, -100], legF: ik(30, A, 90), legB: ik(4, 10, -60) }
      const mid: Pose = fsquat(66, 10, { armF: [20, 20], armB: [-20, -20] })
      return seq(side, mid, mirror(side), mid)
    })(),
  },

  tuckJump: {
    view: 'side',
    ms: 2400,
    reps: 1,
    thumb: 0.35,
    keys: [
      k(0, squat(52), 'out'),
      k(0.35, { hip: [0, 104], torso: 172, armF: [80, 160], armB: [78, 158], legF: [128, -20, 80], legB: [122, -26, 80] }),
      k(0.65, squat(54)),
    ],
  },
}

