type FrameFn = (now: number) => void

const subscribers = new Set<FrameFn>()
let raf = 0

function loop(now: number) {
  for (const fn of subscribers) fn(now)
  raf = subscribers.size ? requestAnimationFrame(loop) : 0
}

/** One shared requestAnimationFrame loop for every animated character on screen. */
export function subscribeFrame(fn: FrameFn) {
  subscribers.add(fn)
  if (!raf) raf = requestAnimationFrame(loop)
  return () => {
    subscribers.delete(fn)
  }
}
