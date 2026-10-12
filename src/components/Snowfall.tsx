import { useEffect, useRef } from 'react'
import { subscribeFrame } from '@/animation/ticker'

/** Depth layers, far → near. Near flakes are bigger, faster, softer (out of focus) and rarer. */
const LAYERS = [
  { share: 0.5, size: [0.6, 1.4], speed: [14, 26], alpha: [0.25, 0.5], sway: 6, sprite: 0 },
  { share: 0.32, size: [1.4, 2.8], speed: [28, 50], alpha: [0.45, 0.8], sway: 12, sprite: 1 },
  { share: 0.13, size: [2.6, 4.6], speed: [50, 80], alpha: [0.6, 0.95], sway: 20, sprite: 2 },
  { share: 0.05, size: [6, 13], speed: [85, 130], alpha: [0.12, 0.3], sway: 30, sprite: 3 },
] as const

interface Flake {
  x: number
  y: number
  r: number
  vy: number
  alpha: number
  sway: number
  freq: number
  phase: number
  sprite: number
  /** Parallax factor for wind. */
  depth: number
}

const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo)

/** Soft round sprites: crisp speck, soft flake, clumped flake, out-of-focus bokeh. */
function makeSprites(): HTMLCanvasElement[] {
  const S = 64
  const make = (draw: (g: CanvasRenderingContext2D) => void) => {
    const c = document.createElement('canvas')
    c.width = c.height = S
    const g = c.getContext('2d')!
    draw(g)
    return c
  }
  const radial = (g: CanvasRenderingContext2D, x: number, y: number, r: number, stops: [number, number][]) => {
    const grad = g.createRadialGradient(x, y, 0, x, y, r)
    for (const [o, a] of stops) grad.addColorStop(o, `rgba(255,255,255,${a})`)
    g.fillStyle = grad
    g.beginPath()
    g.arc(x, y, r, 0, Math.PI * 2)
    g.fill()
  }
  return [
    make((g) => radial(g, 32, 32, 32, [[0, 1], [0.55, 0.95], [1, 0]])),
    make((g) => radial(g, 32, 32, 32, [[0, 1], [0.35, 0.8], [1, 0]])),
    // Irregular clump: a few overlapping lobes so bigger flakes are not perfect discs.
    make((g) => {
      for (const [x, y, r] of [[32, 32, 20], [22, 27, 13], [42, 25, 12], [38, 42, 13], [24, 40, 11]] as const)
        radial(g, x, y, r, [[0, 0.95], [0.5, 0.7], [1, 0]])
    }),
    make((g) => radial(g, 32, 32, 32, [[0, 0.55], [0.6, 0.4], [0.85, 0.25], [1, 0]])),
  ]
}

const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * Canvas snowfall with depth layers, gusting wind and per-flake drift.
 * `density` is flakes per 10,000 css px². Renders a single still frame for reduced motion.
 */
export function Snowfall({ density = 0.9, className = '' }: { density?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const sprites = makeSprites()
    let flakes: Flake[] = []
    let w = 0
    let h = 0

    const spawn = (anyY: boolean): Flake => {
      let pick = Math.random()
      let li = 0
      while (li < LAYERS.length - 1 && pick > LAYERS[li].share) pick -= LAYERS[li++].share
      const L = LAYERS[li]
      const r = rand(L.size[0], L.size[1])
      return {
        x: rand(-20, w + 20),
        y: anyY ? rand(-20, h) : rand(-40, -r * 2),
        r,
        vy: rand(L.speed[0], L.speed[1]),
        alpha: rand(L.alpha[0], L.alpha[1]),
        sway: L.sway * rand(0.4, 1),
        freq: rand(0.25, 0.9),
        phase: rand(0, Math.PI * 2),
        sprite: L.sprite === 2 && Math.random() < 0.5 ? 1 : L.sprite,
        depth: (li + 1) / LAYERS.length,
      }
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = rect.width
      h = rect.height
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const target = Math.round(((w * h) / 10000) * density)
      if (flakes.length > target) flakes.length = target
      while (flakes.length < target) flakes.push(spawn(true))
    }

    let t = 0
    const draw = (dt: number) => {
      t += dt
      // Slow, layered gusts so the whole field drifts together but never in lockstep.
      const wind = 10 * Math.sin(t * 0.13) + 6 * Math.sin(t * 0.37 + 1.3) + 4
      ctx.clearRect(0, 0, w, h)
      for (const f of flakes) {
        f.y += f.vy * dt
        f.x += (wind * f.depth + Math.cos(t * f.freq + f.phase) * f.sway) * dt
        if (f.y - f.r * 2 > h) Object.assign(f, spawn(false))
        if (f.x > w + 30) f.x -= w + 60
        else if (f.x < -30) f.x += w + 60
        const d = f.r * 2
        ctx.globalAlpha = f.alpha
        ctx.drawImage(sprites[f.sprite], f.x - f.r, f.y - f.r, d, d)
      }
      ctx.globalAlpha = 1
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    if (prefersReducedMotion()) {
      draw(0)
      return () => ro.disconnect()
    }

    let last = 0
    const unsub = subscribeFrame((now) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0
      last = now
      draw(dt)
    })
    return () => {
      unsub()
      ro.disconnect()
    }
  }, [density])

  return <canvas ref={ref} className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} aria-hidden="true" />
}
