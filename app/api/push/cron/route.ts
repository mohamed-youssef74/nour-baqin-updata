import { NextResponse } from 'next/server'
import { listSubs, markSent, removeSub, type PushSub } from '@/lib/push-store'
import { localNow, prayerTimes, PRAYER_LIST, pushConfigured, sendPush, toMin, WIRD_MSG, type PushMsg } from '@/lib/push-send'

export const dynamic = 'force-dynamic'

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
    const due = (hhmm: string, windowMin: number) => minutes >= toMin(hhmm) && minutes < toMin(hhmm) + windowMin
    const jobs: { key: string; msg: PushMsg }[] = []
    if (s.wirdOn && due(s.time, 120) && s.lastSent !== date && s.doneDate !== date) jobs.push({ key: 'wird', msg: WIRD_MSG })
    if (s.prayerOn || s.adhkarOn) {
      const t = await prayerTimes(date)
      if (s.adhkarOn && due(s.adhkarTime, 120) && s.sent.am !== date) jobs.push({ key: 'am', msg: { body: 'حان وقت أذكار الصباح', url: '/adhkar', tag: 'nour-adhkar-am' } })
      if (t) {
        if (s.adhkarOn && due(t.Asr, 120) && s.sent.pm !== date) jobs.push({ key: 'pm', msg: { body: 'حان وقت أذكار المساء', url: '/adhkar', tag: 'nour-adhkar-pm' } })
        if (s.prayerOn) for (const [key, api, ar] of PRAYER_LIST) if (due(t[api], 30) && s.sent[key] !== date) jobs.push({ key, msg: { body: `حان الآن موعد صلاة ${ar}`, url: '/prayer', tag: `nour-${key}` } })
      }
    }
    if (!jobs.length) { skipped++; continue }
    for (const j of jobs) {
      try { await sendPush(s, j.msg); await markSent(s, j.key, date); sent++ } catch (e: any) {
        if (e?.statusCode === 404 || e?.statusCode === 410) { await removeSub(s.endpoint); removed++; break }
      }
    }
  }
  return NextResponse.json({ total: subs.length, sent, removed, skipped })
}
