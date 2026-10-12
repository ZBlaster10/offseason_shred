import type { Clip } from '../types'
import { balanceClips } from './balance'
import { cardioClips } from './cardio'
import { coreClips } from './core'
import { lowerClips } from './lower'
import { mobilityClips } from './mobility'
import { plyoClips } from './plyo'
import { upperClips } from './upper'
import { warmupClips } from './warmup'

export const CLIPS: Record<string, Clip> = {
  ...warmupClips,
  ...mobilityClips,
  ...coreClips,
  ...lowerClips,
  ...upperClips,
  ...balanceClips,
  ...plyoClips,
  ...cardioClips,
}
