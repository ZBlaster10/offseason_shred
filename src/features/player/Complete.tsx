import { motion } from 'motion/react'
import { ChevronRight, Clock, CloudUpload, Flame, Frown, Meh, Smile, Target } from 'lucide-react'
import { useParams } from 'react-router'
import { Snowfall } from '@/components/Scenery'
import { LinkButton } from '@/components/ui/Button'
import { COUNT_THRESHOLD } from '@/engine/streak'
import { useStreak } from '@/hooks/usePlan'
import { formatClock } from '@/lib/format'
import { PHOTOS } from '@/lib/photos'
import { useAppStore } from '@/store/useAppStore'
import { useAuthStore } from '@/store/useAuthStore'
import { cloudEnabled } from '@/sync/config'

const FEEDBACK = [
  { value: 1 as const, label: 'Too easy', icon: Smile, hint: 'We’ll turn it up' },
  { value: 0 as const, label: 'Just right', icon: Meh, hint: 'Keep it here' },
  { value: -1 as const, label: 'Too hard', icon: Frown, hint: 'We’ll ease off' },
]

export default function Complete() {
  const { id = '' } = useParams()
  const entry = useAppStore((s) => s.history.find((h) => h.id === id))
  const setFeedback = useAppStore((s) => s.setFeedback)
  const streak = useStreak()
  const signedOut = useAuthStore((s) => s.status === 'signedOut')
  const openSignIn = useAuthStore((s) => s.openSignIn)
  if (!entry || !streak) return <div className="p-10 text-center text-muted">Workout not found.</div>

  const counted = entry.completion >= COUNT_THRESHOLD
  const { done, target, complete } = streak.thisWeek

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#06111f] text-white">
      <img src={PHOTOS.air} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#06111f] via-[#06111f]/80 to-[#06111f]/30" />
      <Snowfall />
      <div className="relative z-10 mx-auto flex min-h-dvh max-w-xl flex-col px-5 pt-safe pb-safe">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mt-auto pt-16 pb-8">
          <div className="text-xs font-bold tracking-[0.2em] text-primary uppercase">Session complete</div>
          <h1 className="mt-2 font-display text-7xl leading-[0.9]">
            {counted ? 'Sent it!' : 'Nice effort'}
          </h1>
          <p className="mt-2 text-white/75">{entry.title}</p>

          <div className="mt-6 grid grid-cols-3 gap-2">
            <Stat icon={Clock} label="Time" value={formatClock(entry.durationSec)} />
            <Stat icon={Target} label="Completed" value={`${Math.round(entry.completion * 100)}%`} />
            <Stat icon={Flame} label="Streak" value={`${streak.current} wk`} accent />
          </div>

          <div className="mt-4 rounded-2xl bg-white/10 p-4 backdrop-blur">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold">This week</span>
              <span>
                {Math.min(done, target)} / {target} sessions
              </span>
            </div>
            <div className="mt-2 flex gap-1.5">
              {Array.from({ length: target }, (_, i) => (
                <motion.div
                  key={i}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.2 + i * 0.12 }}
                  className={`h-2 flex-1 origin-left rounded-full ${i < done ? 'bg-accent' : 'bg-white/20'}`}
                />
              ))}
            </div>
            <p className="mt-2 text-sm text-white/75">
              {!counted
                ? `Complete at least ${Math.round(COUNT_THRESHOLD * 100)}% of a session for it to count toward your streak.`
                : complete
                  ? 'Week complete. Your streak is safe! 🔥'
                  : `${target - done} more to lock in this week.`}
            </p>
          </div>

          {cloudEnabled && signedOut && (
            <button
              type="button"
              onClick={openSignIn}
              className="mt-3 flex w-full items-center gap-3 rounded-2xl bg-white/10 p-4 text-left backdrop-blur transition hover:bg-white/15"
            >
              <CloudUpload size={20} className="shrink-0 text-primary" />
              <span className="flex-1 text-sm">
                <span className="font-semibold">Keep your streak safe.</span>{' '}
                <span className="text-white/75">Sign in to back it up and train on any device.</span>
              </span>
              <ChevronRight size={18} className="shrink-0 text-white/60" />
            </button>
          )}

          <div className="mt-6">
            <div className="text-sm font-semibold">How did that feel?</div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {FEEDBACK.map(({ value, label, icon: Icon, hint }) => {
                const on = entry.feedback === value
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setFeedback(entry.id, value)}
                    className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-3 transition ${on ? 'border-primary bg-primary/20' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                  >
                    <Icon size={24} />
                    <span className="text-sm font-semibold">{label}</span>
                    <span className="text-[11px] text-white/60">{hint}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <LinkButton to="/" replace size="lg" className="mt-8 w-full">
            Done
          </LinkButton>
        </motion.div>
      </div>
    </div>
  )
}

function Stat({ icon: Icon, label, value, accent }: { icon: typeof Clock; label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
      <Icon size={18} className={accent ? 'text-accent' : 'text-white/70'} />
      <div className="mt-1 font-display text-3xl leading-none">{value}</div>
      <div className="text-xs text-white/60">{label}</div>
    </div>
  )
}
