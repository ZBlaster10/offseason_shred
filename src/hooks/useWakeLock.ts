import { useEffect } from 'react'
import { isNative } from '@/lib/native'

/** Keep the screen awake while `active` (Screen Wake Lock on web, KeepAwake on native). */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active) return
    let sentinel: WakeLockSentinel | null = null
    let cancelled = false

    const acquire = async () => {
      try {
        if (isNative()) {
          const { KeepAwake } = await import('@capacitor-community/keep-awake')
          await KeepAwake.keepAwake()
        } else if ('wakeLock' in navigator && document.visibilityState === 'visible') {
          sentinel = await navigator.wakeLock.request('screen')
          if (cancelled) void sentinel.release()
        }
      } catch {
        // Not supported or denied; the workout still works.
      }
    }
    const onVisible = () => document.visibilityState === 'visible' && void acquire()

    void acquire()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
      void sentinel?.release()
      if (isNative()) void import('@capacitor-community/keep-awake').then(({ KeepAwake }) => KeepAwake.allowSleep()).catch(() => {})
    }
  }, [active])
}
