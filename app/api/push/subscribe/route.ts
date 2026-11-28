import { NextResponse } from 'next/server'
import { getSub, removeSub, saveSub, type PushSub } from '@/lib/push-store'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ publicKey: process.env.VAPID_PUBLIC_KEY || null })
}

const isTime = (v: unknown) => /^\d\d:\d\d$/.test(String(v || ''))

// Body: { subscription, tz, wird?: {on, time, doneDate}, prayer?: {on}, adhkar?: {on, time} }. Only the sent parts change.
// Old clients send { subscription, time, doneDate } which means wird on.
export async function POST(req: Request) {
  const b = await req.json().catch(() => null)
  const sub = b?.subscription
  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) return NextResponse.json({ error: 'bad request' }, { status: 400 })
  let tz = String(b.tz || 'Africa/Cairo')
  try { new Intl.DateTimeFormat('en', { timeZone: tz }) } catch { tz = 'Africa/Cairo' }
  const wird = b.wird ?? (isTime(b.time) ? { on: true, time: b.time, doneDate: b.doneDate } : null)
  const old = await getSub(sub.endpoint)
  const next: PushSub = old ?? { endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth, time: '20:00', tz, doneDate: '', lastSent: '', wirdOn: false, prayerOn: false, adhkarOn: false, adhkarTime: '08:00', sent: {} }
  next.p256dh = sub.keys.p256dh; next.auth = sub.keys.auth; next.tz = tz
  if (wird) {
    next.wirdOn = !!wird.on
    if (isTime(wird.time)) next.time = wird.time
    if ('doneDate' in wird) next.doneDate = String(wird.doneDate || '')
  }
  if (b.prayer) next.prayerOn = !!b.prayer.on
  if (b.adhkar) { next.adhkarOn = !!b.adhkar.on; if (isTime(b.adhkar.time)) next.adhkarTime = b.adhkar.time }
  const active = next.wirdOn || next.prayerOn || next.adhkarOn
  if (!active) { await removeSub(next.endpoint); return NextResponse.json({ ok: true, active: false }) }
  await saveSub(next)
  return NextResponse.json({ ok: true, active: true })
}

export async function DELETE(req: Request) {
  const b = await req.json().catch(() => null)
  if (b?.endpoint) await removeSub(b.endpoint)
  return NextResponse.json({ ok: true })
}
