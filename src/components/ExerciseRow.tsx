import { ChevronRight, Repeat } from 'lucide-react'
import { Character } from '@/animation/Character'
import { EXERCISE_MAP } from '@/data/exercises'
import type { EquipmentId, SessionItem } from '@/domain/types'
import { equipmentFor } from '@/engine/generatePlan'
import { dosageLabel } from '@/lib/format'

interface Props {
  item: SessionItem
  owned: EquipmentId[]
  onClick?: () => void
}

export function ExerciseThumb({ clip, equipment, className = '' }: { clip: string; equipment?: EquipmentId; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-xl ${className}`} style={{ background: 'linear-gradient(180deg, var(--stage-top), var(--stage-bottom))' }}>
      <Character clip={clip} equipment={equipment} still className="h-full w-full" />
    </div>
  )
}

export function ExerciseRow({ item, owned, onClick }: Props) {
  const ex = EXERCISE_MAP[item.exerciseId]
  return (
    <button type="button" onClick={onClick} className="group flex w-full items-center gap-3 rounded-2xl p-2 text-left transition hover:bg-elev-2">
      <ExerciseThumb clip={ex.clip} equipment={equipmentFor(ex, owned)} className="h-16 w-16 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold">{ex.name}</div>
        <div className="flex flex-wrap items-center gap-x-2 text-sm text-muted">
          <span className="font-medium text-ink/80">{dosageLabel(item)}</span>
          {item.note && <span>· {item.note}</span>}
          {item.swappedFrom && (
            <span className="inline-flex items-center gap-1 text-primary">
              · <Repeat size={12} /> swapped
            </span>
          )}
        </div>
      </div>
      <ChevronRight size={18} className="shrink-0 text-muted transition group-hover:translate-x-0.5" />
    </button>
  )
}
