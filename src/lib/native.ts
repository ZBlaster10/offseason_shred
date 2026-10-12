import { Capacitor } from '@capacitor/core'

export const isNative = () => Capacitor.isNativePlatform()

/** Light haptic tap on native builds; a short vibration on supporting browsers. */
export async function tap(strong = false) {
  try {
    if (isNative()) {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics')
      await Haptics.impact({ style: strong ? ImpactStyle.Heavy : ImpactStyle.Light })
    } else if ('vibrate' in navigator && navigator.userActivation?.hasBeenActive !== false) {
      navigator.vibrate(strong ? 40 : 15)
    }
  } catch {
    // Haptics are a nice-to-have.
  }
}
