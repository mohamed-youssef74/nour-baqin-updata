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

// Subscribe (if needed) and tell the server the reminder time and whether today's wird is done.
export async function syncPush(time: string, done: boolean) {
  const sub = await currentSub(true)
  if (!sub) return false
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Cairo'
  const r = await fetch('/api/push/subscribe', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ subscription: sub.toJSON(), time, tz, doneDate: done ? localDate() : '' }) })
  return r.ok
}

// Only update an existing subscription (no permission prompt). Used when the app opens.
export async function refreshPush(time: string, done: boolean) {
  if (!pushSupported() || Notification.permission !== 'granted') return
  const sub = await currentSub(false)
  if (sub) await syncPush(time, done)
}

export async function stopPush() {
  if (!pushSupported()) return
  const sub = await currentSub(false)
  if (!sub) return
  await fetch('/api/push/subscribe', { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ endpoint: sub.endpoint }) }).catch(() => undefined)
  await sub.unsubscribe().catch(() => undefined)
}

export async function sendTestPush() {
  const sub = await currentSub(false)
  if (!sub) return false
  return (await fetch('/api/push/test', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ endpoint: sub.endpoint }) })).ok
}
