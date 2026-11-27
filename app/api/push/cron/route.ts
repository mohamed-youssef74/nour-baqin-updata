import { NextResponse } from 'next/server'
import { listSubs, markSent, removeSub } from '@/lib/push-store'
import { localNow, pushConfigured, sendReminder } from '@/lib/push-send'

export const dynamic = 'force-dynamic'
const WINDOW_MIN = 120 // do not send a reminder more than 2h late

// Called every ~5 minutes by a free external cron (cron-job.org) with ?secret=CRON_SECRET.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  const given = new URL(req.url).searchParams.get('secret') || req.headers.get('authorization')?.replace('Bearer ', '')
  if (!secret || given !== secret) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!pushConfigured()) return NextResponse.json({ error: 'not configured' }, { status: 400 })
  const subs = await listSubs()
  let sent = 0, removed = 0, skipped = 0
  for (const s of subs) {
    const { date, minutes } = localNow(s.tz)
    const [h, m] = s.time.split(':').map(Number)
    const due = minutes >= h * 60 + m && minutes < h * 60 + m + WINDOW_MIN
    if (!due || s.lastSent === date || s.doneDate === date) { skipped++; continue }
    try { await sendReminder(s); await markSent(s.endpoint, date); sent++ } catch (e: any) {
      if (e?.statusCode === 404 || e?.statusCode === 410) { await removeSub(s.endpoint); removed++ }
    }
  }
  return NextResponse.json({ total: subs.length, sent, removed, skipped })
}
