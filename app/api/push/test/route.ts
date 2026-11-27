import { NextResponse } from 'next/server'
import { getSub, removeSub } from '@/lib/push-store'
import { pushConfigured, sendReminder } from '@/lib/push-send'

export const dynamic = 'force-dynamic'

// Sends one reminder right now to the caller's own subscription (button "جرّب التنبيه").
export async function POST(req: Request) {
  const b = await req.json().catch(() => null)
  if (!pushConfigured() || !b?.endpoint) return NextResponse.json({ error: 'not configured' }, { status: 400 })
  const s = await getSub(b.endpoint)
  if (!s) return NextResponse.json({ error: 'not subscribed' }, { status: 404 })
  try { await sendReminder(s); return NextResponse.json({ ok: true }) } catch (e: any) {
    if (e?.statusCode === 404 || e?.statusCode === 410) await removeSub(s.endpoint)
    return NextResponse.json({ error: 'send failed' }, { status: 502 })
  }
}
