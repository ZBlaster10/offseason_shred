import { ArrowLeft, CheckCircle2, Clock, Dumbbell, Play, RotateCw } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { ExerciseRow } from '@/components/ExerciseRow'
import { EquipmentIcon } from '@/components/EquipmentIcon'
import { exerciseCount } from '@/components/SessionCard'
import { Button } from '@/components/ui/Button'
import { equipmentName } from '@/data/equipment'
import type { SessionItem } from '@/domain/types'
import { BLOCK_LABEL, FOCUS_META } from '@/engine/generatePlan'
import { useCompletedIds, useProfile, useSession } from '@/hooks/usePlan'
import { formatMinutes, plural } from '@/lib/format'
import { FOCUS_PHOTO, PHOTOS } from '@/lib/photos'
import { useAppStore } from '@/store/useAppStore'
import { ExerciseSheet } from './ExerciseSheet'

export default function SessionDetail() {
  const { weekKey = '', sessionId = '' } = useParams()
  const navigate = useNavigate()
  const profile = useProfile()
  const { session } = useSession(weekKey, sessionId)
  const done = useCompletedIds(weekKey).has(sessionId)
  const setSwap = useAppStore((s) => s.setSwap)
  const active = useAppStore((s) => s.active)
  const [open, setOpen] = useState<SessionItem | null>(null)

  if (!session) {
    return (
      <div className="p-10 text-center">
        <p className="text-muted">Session not found.</p>
        <Button className="mt-4" onClick={() => navigate('/plan')}>
          Back to plan
        </Button>
      </div>
    )
  }

  const resumable = active?.weekKey === weekKey && active.sessionId === sessionId
  const start = () => navigate(`/workout/${weekKey}/${sessionId}`)

  return (
    <div className="pb-32 lg:pb-12">
      <div className="relative">
        <img src={PHOTOS[FOCUS_PHOTO[session.focus]]} alt="" className="h-72 w-full object-cover sm:h-80 lg:h-96" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-black/30" />
        <button
          type="button"
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/plan'))}
          aria-label="Back"
          className="absolute top-[max(1rem,env(safe-area-inset-top))] left-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-5xl px-4 pb-2 sm:px-6 lg:px-10">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-muted uppercase">
            Session {session.id}
            {done && (
              <span className="inline-flex items-center gap-1 rounded-full bg-success px-2 py-0.5 text-[11px] text-white normal-case">
                <CheckCircle2 size={12} /> Completed this week
              </span>
            )}
          </div>
          <h1 className="font-display text-6xl leading-none sm:text-7xl">{session.title}</h1>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-10">
        <p className="mt-2 text-muted">{FOCUS_META[session.focus].blurb}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-elev px-3 py-1.5 shadow-card">
            <Clock size={15} /> {formatMinutes(session.estimatedSec)}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-elev px-3 py-1.5 shadow-card">
            <Dumbbell size={15} /> {exerciseCount(session)} exercises
          </span>
          {session.equipmentUsed.map((e) => (
            <span key={e} className="inline-flex items-center gap-1.5 rounded-full bg-elev px-3 py-1.5 shadow-card">
              <EquipmentIcon id={e} size={15} /> {equipmentName(e)}
            </span>
          ))}
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {session.blocks.map((b, bi) => (
            <section key={bi} className="min-w-0 rounded-3xl bg-elev p-3 shadow-card sm:p-4">
              <div className="flex items-baseline justify-between px-2 pt-1 pb-2">
                <h2 className="font-display text-2xl">{b.title}</h2>
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted">
                  {b.rounds > 1 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 font-semibold text-accent">
                      <RotateCw size={11} /> {plural(b.rounds, 'round')}
                    </span>
                  )}
                  {b.type !== 'warmup' && b.type !== 'cooldown' && <span>rest {b.restSec}s</span>}
                  {(b.type === 'warmup' || b.type === 'cooldown') && <span>{BLOCK_LABEL[b.type]}</span>}
                </div>
              </div>
              <div className="grid grid-cols-1">
                {b.items.map((it) => (
                  <ExerciseRow key={it.key} item={it} owned={profile.equipment} onClick={() => setOpen(it)} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-30 px-4 pb-3 lg:static lg:mx-auto lg:mt-8 lg:max-w-5xl lg:px-10">
        <Button size="lg" className="w-full shadow-2xl lg:w-auto lg:px-12" onClick={start}>
          <Play size={18} fill="currentColor" /> {resumable ? 'Resume workout' : done ? 'Do it again' : 'Start workout'}
        </Button>
      </div>

      <ExerciseSheet
        item={open}
        session={session}
        profile={profile}
        onClose={() => setOpen(null)}
        onSwap={(item, to) => setSwap(weekKey, sessionId, item.key, item.swappedFrom ?? item.exerciseId, to)}
      />
    </div>
  )
}
