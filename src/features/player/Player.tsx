import { Pause, Play, Plus, SkipBack, SkipForward, Volume2, VolumeX, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Character } from '@/animation/Character'
import { Stage } from '@/components/Scenery'
import { Button } from '@/components/ui/Button'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { Sheet } from '@/components/ui/Sheet'
import { EXERCISE_MAP } from '@/data/exercises'
import type { PlayerStep } from '@/domain/types'
import { equipmentFor } from '@/engine/generatePlan'
import { buildTimeline, countWorkSteps } from '@/engine/timeline'
import { useAudioCues } from '@/hooks/useAudioCues'
import { useProfile, useSession } from '@/hooks/usePlan'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useWakeLock } from '@/hooks/useWakeLock'
import { useWorkoutPlayer } from '@/hooks/useWorkoutPlayer'
import { formatClock } from '@/lib/format'
import { tap } from '@/lib/native'
import { useAppStore } from '@/store/useAppStore'

const KIND_LABEL: Record<PlayerStep['kind'], string> = {
  prepare: 'Get ready',
  work: 'Go',
  rest: 'Rest',
  switch: 'Switch sides',
}

export default function Player() {
  const { weekKey = '', sessionId = '' } = useParams()
  const { session } = useSession(weekKey, sessionId)
  if (!session) return <div className="p-10 text-center text-muted">Session not found.</div>
  return <PlayerInner key={`${weekKey}-${sessionId}`} weekKey={weekKey} sessionId={sessionId} session={session} />
}

function PlayerInner({ weekKey, sessionId, session }: { weekKey: string; sessionId: string; session: NonNullable<ReturnType<typeof useSession>['session']> }) {
  const navigate = useNavigate()
  const profile = useProfile()
  const settings = useAppStore((s) => s.settings)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const startWorkout = useAppStore((s) => s.startWorkout)
  const saveProgress = useAppStore((s) => s.saveProgress)
  const finishWorkout = useAppStore((s) => s.finishWorkout)
  const abandonWorkout = useAppStore((s) => s.abandonWorkout)
  const [confirmExit, setConfirmExit] = useState(false)
  // Phones in landscape: compact the info panel so everything fits.
  const short = useMediaQuery('(max-height: 560px)')

  const steps = useMemo(() => buildTimeline(session), [session])
  const totalWork = countWorkSteps(steps)

  // Resume from saved progress for this exact session.
  const resume = useRef(useAppStore.getState().active)
  const canResume = resume.current?.weekKey === weekKey && resume.current.sessionId === sessionId
  useEffect(() => startWorkout(weekKey, sessionId), [startWorkout, weekKey, sessionId])

  const audio = useAudioCues(settings.sound, settings.voice)

  const player = useWorkoutPlayer({
    steps,
    initialIndex: canResume ? resume.current!.stepIndex : 0,
    initialSkipped: canResume ? resume.current!.skipped : [],
    initialElapsed: canResume ? resume.current!.elapsedSec : 0,
    onStepStart: (step) => {
      const ex = EXERCISE_MAP[step.exerciseId]
      if (step.kind === 'work') {
        audio.go()
        if (settings.haptics) void tap(true)
        const side = step.side === 'L' ? ', left side' : step.side === 'R' ? ', right side' : ''
        audio.say(step.reps ? `${ex.name}${side}. ${step.reps} reps` : `${ex.name}${side}`)
      } else if (step.kind === 'switch') {
        audio.rest()
        audio.say('Switch sides')
      } else if (step.kind === 'rest') {
        audio.rest()
        audio.say(`Rest. Next up, ${ex.name}`)
      } else {
        audio.say(`Get ready. ${ex.name}`)
      }
    },
    onCountdown: () => {
      audio.tick()
      if (settings.haptics) void tap()
    },
    onFinish: (skipped, totalElapsed) => {
      audio.done()
      const completion = totalWork ? (totalWork - skipped.length) / totalWork : 1
      const id = finishWorkout({
        weekKey,
        sessionId,
        title: session.title,
        durationSec: Math.round(totalElapsed),
        completion,
      })
      navigate(`/complete/${id}`, { replace: true })
    },
  })

  useWakeLock(!player.finished && !player.paused)

  // Persist progress so a reload can resume.
  const { index, skipped } = player
  const elapsedRef = useRef(0)
  elapsedRef.current = player.totalElapsed
  useEffect(() => {
    if (!player.finished) saveProgress(index, skipped, Math.round(elapsedRef.current))
  }, [index, skipped, player.finished, saveProgress])

  // Keyboard shortcuts on desktop.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (confirmExit) return
      if (e.code === 'Space') {
        e.preventDefault()
        player.togglePause()
      } else if (e.code === 'ArrowRight') player.next()
      else if (e.code === 'ArrowLeft') player.prev()
      else if (e.code === 'Escape') setConfirmExit(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [player, confirmExit])

  const step = player.step
  if (!step) return null
  const ex = EXERCISE_MAP[step.exerciseId]
  const showNext = step.kind === 'rest' || step.kind === 'prepare'
  const block = session.blocks[step.blockIndex]
  const workDone = steps.slice(0, player.index).filter((s, i) => s.kind === 'work' && !player.skipped.includes(i)).length
  const progress = player.index / steps.length
  const timed = player.remaining !== undefined && player.duration !== undefined
  const isWork = step.kind === 'work'

  // Segment widths per block for the top progress bar.
  const blockSpans = session.blocks.map((_, bi) => steps.filter((s) => s.blockIndex === bi).length)
  const before = (bi: number) => blockSpans.slice(0, bi).reduce((a, b) => a + b, 0)

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg" onPointerDown={audio.unlock}>
      {/* Top bar */}
      <div className="pt-safe">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-3 py-2 sm:px-6">
          <button type="button" onClick={() => setConfirmExit(true)} aria-label="Exit workout" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-elev-2">
            <X size={22} />
          </button>
          <div className="flex flex-1 gap-1">
            {session.blocks.map((b, bi) => {
              const start = before(bi)
              const span = blockSpans[bi]
              const fill = Math.max(0, Math.min(1, (player.index - start) / span))
              return (
                <div key={bi} className="h-1.5 overflow-hidden rounded-full bg-elev-2" style={{ flex: span }} title={b.title}>
                  <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${fill * 100}%` }} />
                </div>
              )
            })}
          </div>
          <button
            type="button"
            onClick={() => updateSettings({ sound: !settings.sound })}
            aria-label={settings.sound ? 'Mute' : 'Unmute'}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-elev-2"
          >
            {settings.sound ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
        </div>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 pb-1 text-xs font-semibold tracking-wide text-muted uppercase sm:px-8">
          <span>
            {block.title}
            {block.rounds > 1 && ` · Round ${Math.min(step.round, block.rounds)}/${block.rounds}`}
          </span>
          <span>
            {formatClock(player.totalElapsed)} · {Math.round(progress * 100)}%
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto grid min-h-0 w-full max-w-6xl flex-1 grid-rows-[minmax(0,1fr)_auto] gap-3 px-3 pb-safe sm:px-6 landscape:grid-cols-2 landscape:grid-rows-1 landscape:items-center landscape:gap-8 lg:pb-6">
        <Stage className="relative h-full min-h-0 w-full rounded-3xl landscape:mx-auto landscape:aspect-square landscape:w-auto landscape:max-w-full">
          <Character
            clip={ex.clip}
            equipment={equipmentFor(ex, profile.equipment)}
            mirror={step.side === 'L'}
            paused={player.paused}
            secPerRep={step.secPerRep}
            className="h-full w-full"
          />
          {showNext && (
            <div className="absolute top-3 left-3 rounded-full bg-black/45 px-3 py-1 text-xs font-bold tracking-wider text-white uppercase backdrop-blur">
              Up next
            </div>
          )}
          {step.side && (
            <div className="absolute top-3 right-3 rounded-full bg-accent px-3 py-1 text-xs font-bold tracking-wider text-white uppercase">
              {step.side === 'L' ? 'Left side' : 'Right side'}
            </div>
          )}
        </Stage>

        <div className="flex max-h-full flex-col items-center overflow-y-auto py-2 text-center landscape:items-start landscape:text-left">
          <div
            className={`rounded-full px-3 py-1 text-xs font-bold tracking-[0.16em] uppercase ${
              isWork ? 'bg-accent-soft text-accent' : step.kind === 'rest' ? 'bg-success-soft text-success' : 'bg-primary-soft text-primary'
            }`}
          >
            {KIND_LABEL[step.kind]}
          </div>
          <h1 className={`mt-2 font-display leading-none ${short ? 'text-3xl' : 'text-4xl sm:text-5xl lg:text-6xl'}`}>{ex.name}</h1>
          <p className={`mt-1.5 line-clamp-2 max-w-md text-sm text-muted ${short ? 'hidden' : ''}`}>{isWork || showNext ? ex.cues[0] : 'Shake it out and reset your stance.'}</p>

          <div className={`flex w-full items-center justify-center gap-6 landscape:justify-start ${short ? 'mt-2' : 'mt-4'}`}>
            {timed ? (
              <ProgressRing
                value={player.duration ? player.remaining! / player.duration : 0}
                size={short ? 92 : 136}
                stroke={short ? 9 : 11}
                color={isWork ? 'var(--accent)' : step.kind === 'rest' ? 'var(--success)' : 'var(--primary)'}
              >
                <span className={`font-display tabular-nums ${short ? 'text-4xl' : 'text-5xl'}`}>{Math.ceil(player.remaining!)}</span>
                <span className="text-xs font-semibold text-muted uppercase">sec</span>
              </ProgressRing>
            ) : (
              <div className="flex flex-col items-center landscape:items-start">
                <div className={`font-display leading-none text-accent ${short ? 'text-5xl' : 'text-7xl'}`}>
                  {step.reps}
                  <span className="ml-2 text-3xl text-ink">reps</span>
                </div>
                <div className="mt-1 text-sm text-muted">{formatClock(player.stepElapsed)} · tap Done when finished</div>
              </div>
            )}
          </div>

          <div className={`flex w-full items-center justify-center gap-4 landscape:justify-start ${short ? 'mt-3' : 'mt-5'}`}>
            <button type="button" onClick={player.prev} aria-label="Previous" className="flex h-12 w-12 items-center justify-center rounded-full bg-elev-2 text-ink active:scale-95">
              <SkipBack size={20} />
            </button>
            {isWork && !timed ? (
              <Button size="lg" className="min-w-40" onClick={player.next}>
                Done
              </Button>
            ) : (
              <button
                type="button"
                onClick={player.togglePause}
                aria-label={player.paused ? 'Resume' : 'Pause'}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-white shadow-lg active:scale-95"
              >
                {player.paused ? <Play size={26} fill="currentColor" /> : <Pause size={26} fill="currentColor" />}
              </button>
            )}
            <button type="button" onClick={player.next} aria-label="Next" className="flex h-12 w-12 items-center justify-center rounded-full bg-elev-2 text-ink active:scale-95">
              <SkipForward size={20} />
            </button>
          </div>

          <div className="mt-3 flex h-9 items-center gap-2">
            {(step.kind === 'rest' || step.kind === 'prepare') && (
              <>
                <button type="button" onClick={() => player.addTime(15)} className="inline-flex items-center gap-1 rounded-full bg-elev-2 px-3 py-1.5 text-sm font-semibold">
                  <Plus size={14} /> 15s
                </button>
                <button type="button" onClick={player.next} className="rounded-full px-3 py-1.5 text-sm font-semibold text-primary">
                  Skip rest
                </button>
              </>
            )}
            {isWork && !timed && (
              <button type="button" onClick={player.togglePause} className="rounded-full bg-elev-2 px-3 py-1.5 text-sm font-semibold">
                {player.paused ? 'Resume' : 'Pause'}
              </button>
            )}
            {isWork && (
              <button type="button" onClick={player.skip} className="rounded-full px-3 py-1.5 text-sm font-semibold text-muted">
                Skip exercise
              </button>
            )}
          </div>
          <div className="mt-1 hidden text-xs text-muted lg:block">
            {workDone}/{totalWork} sets done · Space to pause · ←/→ to navigate
          </div>
        </div>
      </div>

      <Sheet open={confirmExit} onClose={() => setConfirmExit(false)} title="Leave workout?">
        <p className="text-muted">Your progress is saved. You can resume this session any time from the Today screen.</p>
        <div className="mt-5 grid gap-2">
          <Button size="lg" onClick={() => setConfirmExit(false)}>
            Keep going
          </Button>
          <Button variant="secondary" size="lg" onClick={() => navigate(`/plan/${weekKey}/${sessionId}`, { replace: true })}>
            Save & exit
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="text-danger"
            onClick={() => {
              abandonWorkout()
              navigate(`/plan/${weekKey}/${sessionId}`, { replace: true })
            }}
          >
            End & discard
          </Button>
        </div>
      </Sheet>
    </div>
  )
}

