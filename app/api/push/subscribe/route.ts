import { NextResponse } from 'next/server'
import { removeSub, saveSub } from '@/lib/push-store'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ publicKey: process.env.VAPID_PUBLIC_KEY || null })
}

export async function POST(req: Request) {
  const b = await req.json().catch(() => null)
  const sub = b?.subscription
  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth || !/^\d\d:\d\d$/.test(b?.time || '')) return NextResponse.json({ error: 'bad request' }, { status: 400 })
  let tz = String(b.tz || 'Africa/Cairo')
  try { new Intl.DateTimeFormat('en', { timeZone: tz }) } catch { tz = 'Africa/Cairo' }
  await saveSub({ endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth, time: b.time, tz, doneDate: String(b.doneDate || ''), lastSent: '' })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  const b = await req.json().catch(() => null)
  if (b?.endpoint) await removeSub(b.endpoint)
  return NextResponse.json({ ok: true })
}
