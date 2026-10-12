import { useCallback, useEffect, useRef } from 'react'

/** Beeps via Web Audio and optional voice announcements via Web Speech. */
export function useAudioCues(sound: boolean, voice: boolean) {
  const ctxRef = useRef<AudioContext | null>(null)

  const ctx = useCallback(() => {
    if (!ctxRef.current) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AC) return null
      ctxRef.current = new AC()
    }
    if (ctxRef.current.state === 'suspended') void ctxRef.current.resume()
    return ctxRef.current
  }, [])

  useEffect(() => () => void ctxRef.current?.close(), [])

  const beep = useCallback(
    (freq = 880, ms = 120, volume = 0.18) => {
      if (!sound) return
      const ac = ctx()
      if (!ac) return
      const osc = ac.createOscillator()
      const gain = ac.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      const t = ac.currentTime
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(volume, t + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000)
      osc.connect(gain).connect(ac.destination)
      osc.start(t)
      osc.stop(t + ms / 1000 + 0.02)
    },
    [ctx, sound],
  )

  const say = useCallback(
    (text: string) => {
      if (!voice || !('speechSynthesis' in window)) return
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.rate = 1.05
      window.speechSynthesis.speak(u)
    },
    [voice],
  )

  useEffect(() => () => window.speechSynthesis?.cancel(), [])

  return {
    /** Unlock audio on the first user gesture (iOS requires this). */
    unlock: () => void ctx(),
    tick: () => beep(660, 110),
    go: () => beep(1046, 260, 0.22),
    rest: () => beep(523, 320, 0.16),
    done: () => {
      beep(784, 150)
      setTimeout(() => beep(1046, 300), 160)
    },
    say,
  }
}
