// Local reading log for the khatma statistics (stored on the device only).
const LOG = 'nour-khatma-log'
const DONE = 'nour-khatma-done'
export type KhatmaLog = Record<string, number[]> // local date -> unique pages reached that day

export const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export function readLog(): KhatmaLog {
  try { const v = JSON.parse(localStorage.getItem(LOG) || '{}'); return v && typeof v === 'object' ? v : {} } catch { return {} }
}
export const readDone = () => Number(localStorage.getItem(DONE)) || 0

// Called when the khatma page changes. Turning forward 1-3 pages counts as reading; jumps and going back do not.
export function recordMove(from: number, to: number) {
  try {
    if (to <= from || to - from > 3) return
    const log = readLog(), today = dayKey()
    const pages = new Set(log[today] || [])
    for (let p = from + 1; p <= to; p++) pages.add(p)
    log[today] = [...pages]
    const keep = Object.keys(log).sort().slice(-60)
    localStorage.setItem(LOG, JSON.stringify(Object.fromEntries(keep.map((k) => [k, log[k]]))))
    if (to === 604 && from < 604) localStorage.setItem(DONE, String(readDone() + 1))
  } catch {}
}

export const juzOf = (page: number) => (page < 2 ? 1 : Math.min(30, Math.floor((page - 2) / 20) + 1))
