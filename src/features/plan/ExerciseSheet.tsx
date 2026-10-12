import { ArrowDownRight, ArrowUpRight, Repeat, RotateCcw, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Character } from '@/animation/Character'
import { ExerciseThumb } from '@/components/ExerciseRow'
import { EquipmentIcon } from '@/components/EquipmentIcon'
import { Stage } from '@/components/Scenery'
import { Sheet } from '@/components/ui/Sheet'
import { EXERCISE_MAP } from '@/data/exercises'
import { equipmentName } from '@/data/equipment'
import type { Profile, Session, SessionItem } from '@/domain/types'
import { equipmentFor, swapOptions } from '@/engine/generatePlan'
import { dosageLabel } from '@/lib/format'

const SOURCE_LABEL: Record<string, string> = {
  SA: 'Snowboard Addiction × Jeremy Watkins',
  'MD-HIIT': 'Mobility Duo (DPT) leg HIIT',
  'MD-30': 'Mobility Duo (DPT) 30-min workout',
  BUR: 'Burton injury-prevention series',
  R: 'Snowboard conditioning research',
}

interface Props {
  item: SessionItem | null
  session: Session
  profile: Profile
  onClose: () => void
  onSwap?: (item: SessionItem, to: string | null) => void
}

export function ExerciseSheet({ item, session, profile, onClose, onSwap }: Props) {
  const [swapping, setSwapping] = useState(false)
  const ex = item ? EXERCISE_MAP[item.exerciseId] : null
  const close = () => {
    setSwapping(false)
    onClose()
  }

  return (
    <Sheet open={!!item} onClose={close} title={ex?.name} wide>
      {item && ex && (
        <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <Stage className="aspect-square w-full rounded-3xl">
              <Character clip={ex.clip} equipment={equipmentFor(ex, profile.equipment)} secPerRep={item.secPerRep} className="h-full w-full" />
            </Stage>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-accent-soft px-3 py-1 text-sm font-semibold text-accent">{dosageLabel(item)}</span>
              {item.note && <span className="rounded-full bg-elev-2 px-3 py-1 text-sm">{item.note}</span>}
              {ex.equipment.length > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-elev-2 px-3 py-1 text-sm">
                  <EquipmentIcon id={equipmentFor(ex, profile.equipment) ?? ex.equipment[0]} size={15} />
                  {equipmentName(equipmentFor(ex, profile.equipment) ?? ex.equipment[0])}
                </span>
              )}
              {ex.needs?.map((n) => (
                <span key={n} className="rounded-full bg-elev-2 px-3 py-1 text-sm capitalize">
                  {n}
                </span>
              ))}
            </div>
          </div>

          <div className="min-w-0">
            {!swapping ? (
              <>
                <h3 className="text-xs font-semibold tracking-wide text-muted uppercase">How to</h3>
                <ol className="mt-2 grid gap-2">
                  {ex.cues.map((c, i) => (
                    <li key={c} className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary">{i + 1}</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ol>

                <div className="mt-5 rounded-2xl bg-primary-soft p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-primary uppercase">
                    <Sparkles size={14} /> Why it helps your riding
                  </div>
                  <p className="mt-1.5 text-sm">{ex.whyForRiding}</p>
                </div>

                {(ex.easier || ex.harder) && (
                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                    {ex.easier && (
                      <div className="rounded-xl bg-elev-2 p-3">
                        <div className="flex items-center gap-1 text-xs text-muted">
                          <ArrowDownRight size={13} /> Easier
                        </div>
                        <div className="font-medium">{EXERCISE_MAP[ex.easier].name}</div>
                      </div>
                    )}
                    {ex.harder && (
                      <div className="rounded-xl bg-elev-2 p-3">
                        <div className="flex items-center gap-1 text-xs text-muted">
                          <ArrowUpRight size={13} /> Harder
                        </div>
                        <div className="font-medium">{EXERCISE_MAP[ex.harder].name}</div>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-4 text-xs text-muted">Source: {SOURCE_LABEL[ex.source]}</div>

                {onSwap && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setSwapping(true)}
                      className="inline-flex items-center gap-2 rounded-xl bg-elev-2 px-4 py-2.5 text-sm font-semibold hover:brightness-110"
                    >
                      <Repeat size={16} /> Swap exercise
                    </button>
                    {item.swappedFrom && (
                      <button
                        type="button"
                        onClick={() => {
                          onSwap(item, null)
                          close()
                        }}
                        className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-muted hover:bg-elev-2"
                      >
                        <RotateCcw size={16} /> Restore {EXERCISE_MAP[item.swappedFrom].name}
                      </button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <SwapList
                item={item}
                session={session}
                profile={profile}
                onCancel={() => setSwapping(false)}
                onPick={(id) => {
                  onSwap?.(item, id)
                  close()
                }}
              />
            )}
          </div>
        </div>
      )}
    </Sheet>
  )
}

function SwapList({
  item,
  session,
  profile,
  onPick,
  onCancel,
}: {
  item: SessionItem
  session: Session
  profile: Profile
  onPick: (id: string) => void
  onCancel: () => void
}) {
  const options = swapOptions(item, session, profile)
  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold tracking-wide text-muted uppercase">Swap for…</h3>
        <button type="button" onClick={onCancel} className="text-sm font-semibold text-primary">
          Cancel
        </button>
      </div>
      {options.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No alternatives match your equipment for this slot.</p>
      ) : (
        <div className="mt-2 grid grid-cols-1 gap-1">
          {options.map((o) => (
            <button key={o.id} type="button" onClick={() => onPick(o.id)} className="flex items-center gap-3 rounded-2xl p-2 text-left hover:bg-elev-2">
              <ExerciseThumb clip={o.clip} equipment={equipmentFor(o, profile.equipment)} className="h-14 w-14 shrink-0" />
              <div className="min-w-0">
                <div className="truncate font-semibold">{o.name}</div>
                <div className="truncate text-xs text-muted">{o.whyForRiding}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
