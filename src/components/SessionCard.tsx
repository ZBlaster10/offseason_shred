import { CheckCircle2, ChevronRight, Clock, Dumbbell, Play } from 'lucide-react'
import { Link } from 'react-router'
import type { Session } from '@/domain/types'
import { formatMinutes } from '@/lib/format'
import { FOCUS_PHOTO, PHOTOS } from '@/lib/photos'
import { EquipmentIcon } from './EquipmentIcon'

export const exerciseCount = (s: Session) => s.blocks.reduce((n, b) => n + b.items.length, 0)

interface Props {
  session: Session
  weekKey: string
  done?: boolean
  variant?: 'hero' | 'row'
}

export function SessionCard({ session, weekKey, done, variant = 'row' }: Props) {
  const photo = PHOTOS[FOCUS_PHOTO[session.focus]]
  const to = `/plan/${weekKey}/${session.id}`

  if (variant === 'hero') {
    return (
      <Link to={to} className="group relative block overflow-hidden rounded-3xl shadow-card">
        <img src={photo} alt="" className="h-64 w-full object-cover transition duration-500 group-hover:scale-[1.03] sm:h-72" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#06111f] via-[#06111f]/55 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5 text-white">
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold tracking-wider text-white/80 uppercase">
            Session {session.id}
            {done && (
              <span className="inline-flex items-center gap-1 rounded-full bg-success px-2 py-0.5 text-[11px] text-white normal-case">
                <CheckCircle2 size={12} /> Done
              </span>
            )}
          </div>
          <div className="font-display text-5xl leading-none">{session.title}</div>
          <div className="mt-1 text-sm text-white/80">{session.subtitle}</div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/90">
              <span className="inline-flex items-center gap-1.5">
                <Clock size={15} /> {formatMinutes(session.estimatedSec)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Dumbbell size={15} /> {exerciseCount(session)} exercises
              </span>
              {session.equipmentUsed.length > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  {session.equipmentUsed.map((e) => (
                    <EquipmentIcon key={e} id={e} size={17} />
                  ))}
                </span>
              )}
            </div>
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-white shadow-lg transition group-hover:scale-105">
              <Play size={20} fill="currentColor" />
            </span>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link to={to} className="group flex items-center gap-4 rounded-2xl bg-elev p-3 shadow-card transition hover:bg-elev-2">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl sm:h-24 sm:w-28">
        <img src={photo} alt="" className="h-full w-full object-cover" />
        {done && (
          <div className="absolute inset-0 flex items-center justify-center bg-success/70 text-white">
            <CheckCircle2 size={28} />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold tracking-wider text-muted uppercase">Session {session.id}</div>
        <div className="truncate font-display text-2xl leading-tight">{session.title}</div>
        <div className="truncate text-sm text-muted">
          {formatMinutes(session.estimatedSec)} · {session.subtitle}
        </div>
      </div>
      <ChevronRight className="shrink-0 text-muted transition group-hover:translate-x-0.5" size={20} />
    </Link>
  )
}
