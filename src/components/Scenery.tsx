import type { ReactNode } from 'react'
import { Snowfall } from './Snowfall'

export { Snowfall }

/** Layered mountain ridgelines that stretch to fill their box. */
export function Ridges({ className = '', far = 'var(--stage-ridge-2)', near = 'var(--stage-ridge)', snow = 'var(--stage-snow)' }: { className?: string; far?: string; near?: string; snow?: string }) {
  return (
    <svg className={className} viewBox="0 0 400 120" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 78 L38 48 L62 62 L98 26 L128 52 L156 40 L196 70 L232 34 L262 56 L300 22 L338 58 L370 44 L400 60 L400 120 L0 120 Z" fill={far} />
      <path d="M98 26 L88 35 L96 33 L104 38 L110 33 Z M300 22 L290 32 L299 30 L307 35 L313 30 Z M232 34 L224 42 L232 40 L240 44 Z" fill={snow} opacity="0.8" />
      <path d="M0 96 L44 70 L80 86 L122 58 L166 88 L208 66 L250 92 L292 64 L334 90 L370 74 L400 86 L400 120 L0 120 Z" fill={near} />
      <path d="M0 108 Q100 96 200 106 T400 102 L400 120 L0 120 Z" fill={snow} />
    </svg>
  )
}

/** Sky + mountains + snow floor backdrop for the animated rider. */
export function Stage({ children, className = '', snow = true }: { children: ReactNode; className?: string; snow?: boolean }) {
  return (
    <div
      className={`relative isolate overflow-hidden ${className}`}
      style={{ background: 'linear-gradient(180deg, var(--stage-top) 0%, var(--stage-bottom) 100%)' }}
    >
      <Ridges className="absolute inset-x-0 bottom-0 h-[46%] w-full" />
      {snow && <Snowfall density={0.7} />}
      <div className="relative z-10 h-full w-full">{children}</div>
    </div>
  )
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
        <rect width="34" height="34" rx="10" fill="var(--accent)" />
        <path d="M5 25 L13 13 L17 18 L21 11 L29 25 Z" fill="#fff" />
        <path d="M21 11 L18.6 14.6 L21 13.8 L23.2 15 Z M13 13 L11 16 L13 15.4 L14.8 16.4 Z" fill="var(--accent)" opacity="0.55" />
      </svg>
      {!compact && (
        <div className="font-display text-[22px] leading-none tracking-wide">
          Offseason <span className="text-accent">Shred</span>
        </div>
      )}
    </div>
  )
}
