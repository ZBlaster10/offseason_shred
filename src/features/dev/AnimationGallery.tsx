import { useMemo, useState } from 'react'
import { Character } from '@/animation/Character'
import { CLIPS } from '@/animation/clips'
import { EXERCISES } from '@/data/exercises'
import type { EquipmentId } from '@/domain/types'

/** Dev-only grid of every animation clip, used to QA poses at a glance. */
export default function AnimationGallery() {
  const params = new URLSearchParams(window.location.search)
  const cols = Number(params.get('cols')) || 0
  const [filter, setFilter] = useState(params.get('q') ?? '')
  const [equipment, setEquipment] = useState<EquipmentId>('kettlebell')
  const [still, setStill] = useState(params.has('still') || params.has('phase'))
  // ?phase=0.3 freezes every clip at that loop phase; ?guides shows motion paths on stills;
  // ?strip=0,0.25,0.5 renders each clip as a filmstrip of frames at those phases.
  const at = params.has('phase') ? Number(params.get('phase')) : undefined
  const guides = params.has('guides') || undefined
  const strip = params.get('strip')?.split(',').map(Number).filter((n) => !Number.isNaN(n))
  const ids = useMemo(() => {
    const terms = filter.toLowerCase().split(',').map((t) => t.trim()).filter(Boolean)
    return Object.keys(CLIPS).filter((id) => !terms.length || terms.some((t) => id.toLowerCase().includes(t)))
  }, [filter])
  const missing = useMemo(() => [...new Set(EXERCISES.map((e) => e.clip))].filter((c) => !CLIPS[c]), [])

  if (strip?.length) {
    return (
      <div className="min-h-screen bg-bg p-4 text-ink">
        {ids.map((id) => (
          <figure key={id} className="mb-4">
            <figcaption className="mb-1 text-xs text-muted">
              {id} · {CLIPS[id].view} · {strip.join(' / ')}
            </figcaption>
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${strip.length}, minmax(0, 1fr))` }}>
              {strip.map((p) => (
                <div key={p} className="overflow-hidden rounded-lg" style={{ background: 'linear-gradient(var(--stage-top), var(--stage-bottom))' }}>
                  <Character clip={id} equipment={equipment} still at={p} guides={guides} className="block w-full" />
                </div>
              ))}
            </div>
          </figure>
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg p-4 text-ink">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl">Animation gallery · {ids.length}</h1>
        <input
          className="rounded-lg border border-line bg-elev px-3 py-1.5"
          placeholder="Filter…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <select className="rounded-lg border border-line bg-elev px-3 py-1.5" value={equipment} onChange={(e) => setEquipment(e.target.value as EquipmentId)}>
          <option value="kettlebell">Kettlebell</option>
          <option value="dumbbells">Dumbbells</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={still} onChange={(e) => setStill(e.target.checked)} /> Still
        </label>
      </div>
      {missing.length > 0 && <p className="mb-4 text-sm text-danger">Missing clips: {missing.join(', ')}</p>}
      <div
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6"
        style={cols ? { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` } : undefined}
      >
        {ids.map((id) => (
          <figure key={id} className="overflow-hidden rounded-xl border border-line bg-elev">
            <div style={{ background: 'linear-gradient(var(--stage-top), var(--stage-bottom))' }}>
              <Character clip={id} equipment={equipment} still={still} at={at} guides={guides} className="block w-full" />
            </div>
            <figcaption className="px-2 py-1 text-xs text-muted">
              {id} · {CLIPS[id].view}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}
