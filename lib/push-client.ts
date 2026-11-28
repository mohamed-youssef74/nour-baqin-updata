// Client helpers for closed-app web push (daily wird reminder).
function b64ToU8(s: string) {
  const pad = '='.repeat((4 - (s.length % 4)) % 4)
  const raw = atob((s + pad).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

export const pushSupported = () => typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

export function localDate(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

async function currentSub(create: boolean) {
  const reg = await navigator.serviceWorker.ready
  let sub = await reg.pushManager.getSubscription()
  if (!sub && create) {
    const { publicKey } = await fetch('/api/push/subscribe').then((r) => r.json())
    if (!publicKey) throw new Error('push-not-configured')
    sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToU8(publicKey) })
  }
  return sub
}

export type PushPatch = {
  wird?: { on: boolean; time?: string; done?: boolean }
  prayer?: { on: boolean }
  adhkar?: { on: boolean; time?: string }
}
const toBody = (sub: PushSubscription, p: PushPatch) => ({
  subscription: sub.toJSON(),
  tz: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Cairo',
  ...(p.wird ? { wird: { on: p.wird.on, time: p.wird.time, ...(p.wird.done === undefined ? {} : { doneDate: p.wird.done ? localDate() : '' }) } } : {}),
  ...(p.prayer ? { prayer: p.prayer } : {}),
  ...(p.adhkar ? { adhkar: p.adhkar } : {}),
})
const post = (sub: PushSubscription, p: PushPatch) => fetch('/api/push/subscribe', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(toBody(sub, p)) })

// Subscribe (if needed) and tell the server what to remind about (only the parts given change).
export async function syncPush(p: PushPatch) {
  const sub = await currentSub(true)
  if (!sub) return false
  return (await post(sub, p)).ok
}

// Only update an existing subscription (no permission prompt). Used when the app opens.
export async function refreshPush(p: PushPatch) {
  if (!pushSupported() || Notification.permission !== 'granted') return
  const sub = await currentSub(false)
  if (sub) await post(sub, p)
}

// Turn some reminders off. When the server has nothing left for this device, drop the subscription too.
export async function disablePush(p: PushPatch) {
  if (!pushSupported()) return
  const sub = await currentSub(false)
  if (!sub) return
  const j = await post(sub, p).then((r) => r.json()).catch(() => null)
  if (j && j.active === false) await sub.unsubscribe().catch(() => undefined)
}

export async function sendTestPush() {
  const sub = await currentSub(false)
  if (!sub) return false
  return (await fetch('/api/push/test', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ endpoint: sub.endpoint }) })).ok
}
