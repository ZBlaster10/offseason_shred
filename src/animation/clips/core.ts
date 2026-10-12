import { STAND_H, type Pose } from '../rig'
import type { Clip } from '../types'
import { A, forearmPlank, fstand, ik, k, onToes, plank, prone, quadruped, seq, stand, supine, w } from './base'

const sidePlankBase = {
  hip: [-8, 31] as [number, number],
  torso: 108,
  head: 116,
  armF: [8, 82] as [number, number],
  armB: ik(-14, 48),
  legF: ik(-74, A, -60),
  legB: ik(-77, A + 8, -60),
}

// Palms stay flat on the mat beside the hips while the hips lift.
const bridgeBottom: Pose = {
  hip: [10, 12],
  torso: -90,
  head: -90,
  armF: ik(14, 3),
  armB: ik(12, 3),
  legF: ik(46, A, 95),
  legB: ik(44, A, 95),
}
const bridgeTop: Pose = { ...bridgeBottom, hip: [10, 40], torso: -58, head: -80 }

export const coreClips: Record<string, Clip> = {
  plank: {
    view: 'side',
    ms: 3000,
    props: { mat: true },
    keys: seq(forearmPlank(), forearmPlank({ hip: [-14, 25] })),
  },

  pushUp: { view: 'side', ms: 2500, reps: 1, props: { mat: true }, keys: [k(0, plank()), k(0.5, plank(18))] },

  catCow: {
    view: 'side',
    ms: 5000,
    props: { mat: true },
    // Shoulders stay stacked over the hands while the back arches and rounds.
    keys: seq(quadruped({ torso: 96, head: 125, hip: [-22, 40] }), quadruped({ torso: 104, head: 70, hip: [-22, 42] })),
  },

  deadBug: {
    view: 'side',
    ms: 4000,
    reps: 2,
    props: { mat: true },
    keys: (() => {
      const table = supine({ armF: [178, 180], armB: [180, 182], legF: ik(42, 48, 100), legB: ik(44, 48, 100) })
      // Arms reach back overhead (not down through the floor) as the opposite leg extends.
      return seq(table, w(table, { armF: [260, 260], legF: ik(74, 13, 150) }), table, w(table, { armB: [260, 260], legB: ik(76, 13, 150) }))
    })(),
  },

  sidePlank: { view: 'front', ms: 3000, props: { mat: true }, keys: seq(sidePlankBase, w(sidePlankBase, { hip: [-8, 32] })) },

  sidePlankDips: {
    view: 'front',
    ms: 2500,
    reps: 1,
    props: { mat: true },
    // The hips dip while the supporting shoulder stays stacked over the elbow.
    keys: seq(sidePlankBase, w(sidePlankBase, { hip: [-6.7, 21], torso: 120, head: 126 })),
  },

  sidePlankReach: {
    view: 'front',
    ms: 3000,
    reps: 1,
    props: { mat: true },
    thumb: 0.25,
    keys: seq(w(sidePlankBase, { armB: [160, 172] }), w(sidePlankBase, { hip: [-8, 34], torso: 112, head: 70, armB: [20, -10] })),
  },

  plankTaps: {
    view: 'side',
    ms: 2000,
    props: { mat: true },
    keys: seq(plank(0, { armF: ik(30, 44, undefined, 1) }), plank(), plank(0, { armB: ik(27, 44, undefined, 1) }), plank()),
  },

  hollowHold: {
    view: 'side',
    ms: 3000,
    props: { mat: true },
    keys: seq(
      supine({ hip: [10, 9], torso: -100, head: -112, armF: [-104, -104], armB: [-106, -106], legF: ik(80, 26, 160), legB: ik(82, 27, 160) }),
      supine({ hip: [10, 9], torso: -101, head: -112, armF: [-108, -108], armB: [-110, -110], legF: ik(80, 22, 160), legB: ik(82, 23, 160) }),
    ),
  },

  birdDog: {
    view: 'side',
    ms: 4400,
    reps: 2,
    props: { mat: true },
    keys: (() => {
      const base = quadruped()
      // Opposite arm and leg; the supporting hand and knee never move.
      return seq(base, quadruped({ armF: [94, 94], legB: [-86, -88, -110] }), base, quadruped({ armB: [94, 94], legF: [-86, -88, -110] }))
    })(),
  },

  bearCrawl: {
    view: 'side',
    ms: 1600,
    props: { mat: true },
    keys: (() => {
      // Contralateral crawl two steps forward and back: near hand with far foot, then far hand with near foot.
      const crawl = (hip: number, hF: number, hB: number, fF: number, fB: number): Pose => ({
        hip: [hip, 42],
        torso: 102,
        head: 110,
        armF: ik(hF, 3),
        armB: ik(hB, 3),
        legF: onToes(fF, 30),
        legB: onToes(fB, 30),
      })
      const s0 = crawl(-22, 26, 22, -35, -39)
      const s1 = crawl(-15, 40, 22, -35, -25)
      const s2 = crawl(-8, 40, 36, -21, -25)
      return seq(s0, s1, s2, s1)
    })(),
  },

  gluteBridge: { view: 'side', ms: 2800, reps: 1, props: { mat: true }, keys: seq(bridgeBottom, bridgeTop) },

  bridgeArmPress: {
    view: 'side',
    ms: 3200,
    reps: 1,
    props: { mat: true },
    keys: seq(w(bridgeBottom, { armF: [110, 175], armB: [108, 173] }), w(bridgeTop, { armF: [150, 150], armB: [148, 148] })),
  },

  slBridge: {
    view: 'side',
    ms: 2800,
    reps: 1,
    props: { mat: true },
    keys: seq(w(bridgeBottom, { legF: [150, 110, 120] }), w(bridgeTop, { legF: [118, 118, 140] })),
  },

  snowAngels: {
    view: 'side',
    ms: 3200,
    reps: 1,
    props: { mat: true },
    keys: seq(prone({ torso: 98, head: 104, armF: [-95, -95], armB: [-97, -97] }), prone({ torso: 98, head: 104, armF: [-262, -262], armB: [-264, -264] })),
  },

  supermanPull: {
    view: 'side',
    ms: 2800,
    reps: 1,
    props: { mat: true },
    keys: seq(prone({ torso: 98, head: 104, armF: [-262, -262], armB: [-264, -264] }), prone({ torso: 100, head: 106, armF: [-150, -240], armB: [-152, -242] })),
  },

  pallofPress: {
    view: 'side',
    ms: 2600,
    reps: 1,
    props: { band: { kind: 'anchor', anchor: [-10, 104] } },
    keys: seq(
      stand({ hip: [-4, STAND_H - 6], legF: ik(8, A), legB: ik(-8, A), armF: ik(18, 104), armB: ik(16, 104) }),
      stand({ hip: [-4, STAND_H - 6], legF: ik(8, A), legB: ik(-8, A), armF: ik(48, 108), armB: ik(46, 108) }),
    ),
  },

  russianTwist: {
    view: 'front',
    ms: 2000,
    props: { weight: 'goblet', mat: true },
    keys: (() => {
      // The chest (not just the arms) rotates side to side and the eyes follow the weight.
      const base = { hip: [0, 13] as [number, number], torso: 180, legF: ik(30, 16, 90), legB: ik(-30, 16, -90) }
      return seq(
        { ...base, torso: 174, head: 170, twist: 40, look: 50, armF: ik(-20, 42), armB: ik(-32, 42) },
        { ...base, torso: 186, head: 190, twist: -40, look: -50, armF: ik(32, 42), armB: ik(20, 42) },
      )
    })(),
  },

  windshieldWipers: {
    view: 'side',
    ms: 3200,
    props: { mat: true },
    keys: seq(
      supine({ armF: [88, 90], armB: [86, 88], legF: ik(30, 48, 120), legB: ik(33, 47, 120) }),
      supine({ armF: [88, 90], armB: [86, 88], legF: ik(44, 22, 140), legB: ik(48, 20, 140) }),
      supine({ armF: [88, 90], armB: [86, 88], legF: ik(30, 48, 120), legB: ik(33, 47, 120) }),
      supine({ armF: [88, 90], armB: [86, 88], legF: ik(4, 52, 110), legB: ik(6, 50, 110) }),
    ),
  },

  halo: {
    view: 'front',
    ms: 2800,
    props: { weight: 'hands' },
    keys: seq(
      fstand({ armF: ik(4, 112), armB: ik(-4, 112) }),
      fstand({ armF: ik(22, 148), armB: ik(14, 150) }),
      fstand({ armF: ik(4, 168), armB: ik(-4, 168) }),
      fstand({ armF: ik(-14, 150), armB: ik(-22, 148) }),
    ),
  },

  suitcaseMarch: {
    view: 'side',
    ms: 2000,
    props: { weight: 'handF' },
    keys: seq(
      stand({ armF: [2, 2], armB: [-20, 40], legF: [82, 2, 90] }),
      stand({ armF: [2, 2], armB: [-8, -4] }),
      stand({ armF: [2, 2], armB: [20, 40], legB: [82, 2, 90] }),
      stand({ armF: [2, 2], armB: [-8, -4] }),
    ),
  },

  strapKneeTuck: {
    view: 'side',
    ms: 2400,
    reps: 1,
    props: { straps: { anchor: [-98, 192], to: 'feet' }, mat: true },
    keys: seq(
      plank(0, { hip: [-10, 40], torso: 108, legF: ik(-80, 24, 40), legB: ik(-82, 24, 40) }),
      // Knees drive to the chest; the shoulders stay over the hands.
      plank(0, { hip: [-14, 50], torso: 94, head: 98, legF: ik(-36, 30, 40), legB: ik(-38, 30, 40) }),
    ),
  },

  copenhagen: {
    view: 'front',
    ms: 3000,
    props: { chair: { x: -82, facing: -1 } },
    keys: seq(
      { hip: [-10, 40], torso: 104, head: 114, armF: [6, 84], armB: ik(-14, 58), legF: ik(-58, 18, -60), legB: ik(-80, 50, -80) },
      { hip: [-10, 41], torso: 104, head: 114, armF: [6, 84], armB: ik(-14, 59), legF: ik(-58, 20, -60), legB: ik(-80, 50, -80) },
    ),
  },
}
