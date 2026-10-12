import air from '@/assets/photos/air.webp'
import carve from '@/assets/photos/carve.webp'
import chill from '@/assets/photos/chill.webp'
import hero from '@/assets/photos/hero.webp'
import jump from '@/assets/photos/jump.webp'
import peaks from '@/assets/photos/peaks.webp'
import powder from '@/assets/photos/powder.webp'
import sunset from '@/assets/photos/sunset.webp'
import type { Focus, Goal } from '@/domain/types'

export const PHOTOS = { air, carve, chill, hero, jump, peaks, powder, sunset }
export type PhotoKey = keyof typeof PHOTOS

export const FOCUS_PHOTO: Record<Focus, PhotoKey> = {
  'strength-legs': 'carve',
  'strength-singleLeg': 'carve',
  'strength-full': 'sunset',
  'aerobic-intervals': 'powder',
  'aerobic-plyo': 'jump',
  'aerobic-mixed': 'powder',
  'mobility-hips': 'chill',
  'mobility-core': 'chill',
  'mobility-flow': 'peaks',
}

export const GOAL_PHOTO: Record<Goal, PhotoKey> = {
  strength: 'carve',
  aerobic: 'powder',
  mobility: 'chill',
}

export const PHOTO_CREDITS: { key: PhotoKey; by: string; url: string }[] = [
  { key: 'hero', by: 'Johannes Waibel', url: 'https://unsplash.com/photos/WdBQHcIiSIw' },
  { key: 'carve', by: 'Bradley Dunn', url: 'https://unsplash.com/photos/9SGGun3iIig' },
  { key: 'powder', by: 'Joshua Reddekopp', url: 'https://unsplash.com/photos/9BpTTLoTv9w' },
  { key: 'jump', by: 'Timon Fiedler', url: 'https://unsplash.com/photos/8G7neKSVN8A' },
  { key: 'chill', by: 'Tyler Domingue', url: 'https://unsplash.com/photos/cRoR_NXKw4E' },
  { key: 'sunset', by: 'Mads Schmidt Rasmussen', url: 'https://unsplash.com/photos/tSp5_w9h5TQ' },
  { key: 'peaks', by: 'Lucian', url: 'https://unsplash.com/photos/qxO2PBn7eKU' },
  { key: 'air', by: 'Alessandro Maculotti', url: 'https://unsplash.com/photos/f1U_gskGxxo' },
]
