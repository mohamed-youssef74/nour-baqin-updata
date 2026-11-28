import * as webpush from 'web-push'

let configured = false
export function pushConfigured() {
  return !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY)
}
export function configure() {
  if (configured) return
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:noreply@example.com', process.env.VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!)
  configured = true
}

export type PushMsg = { body: string; url: string; tag: string }
export async function sendPush(s: { endpoint: string; p256dh: string; auth: string }, m: PushMsg) {
  configure()
  const payload = JSON.stringify({ title: 'نورٌ باقٍ', ...m })
  return webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 6 * 3600, urgency: 'normal' })
}
export const WIRD_MSG: PushMsg = { body: 'حان وقت وردك اليومي من القرآن', url: '/quran', tag: 'nour-wird' }
export const sendReminder = (s: { endpoint: string; p256dh: string; auth: string }) => sendPush(s, WIRD_MSG)

const PRAYERS: [string, string, string][] = [['fajr', 'Fajr', 'الفجر'], ['dhuhr', 'Dhuhr', 'الظهر'], ['asr', 'Asr', 'العصر'], ['maghrib', 'Maghrib', 'المغرب'], ['isha', 'Isha', 'العشاء']]
export const PRAYER_LIST = PRAYERS
const cache = new Map<string, Record<string, string>>()
// Prayer times for Cairo (same source and method as the prayer page), cached per date.
export async function prayerTimes(date: string): Promise<Record<string, string> | null> {
  if (cache.has(date)) return cache.get(date)!
  try {
    const [y, m, d] = date.split('-')
    const r = await fetch(`https://api.aladhan.com/v1/timingsByCity/${d}-${m}-${y}?city=Cairo&country=Egypt&method=5`, { cache: 'no-store' })
    const t = (await r.json())?.data?.timings
    if (!t?.Fajr) return null
    const out: Record<string, string> = {}
    for (const [, k] of PRAYERS) out[k] = String(t[k]).slice(0, 5)
    cache.set(date, out)
    return out
  } catch { return null }
}
export const toMin = (hhmm: string) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m }

// Local date and minutes-since-midnight in a timezone.
export function localNow(tz: string, now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now)
  const g = (t: string) => parts.find((p) => p.type === t)!.value
  return { date: `${g('year')}-${g('month')}-${g('day')}`, minutes: Number(g('hour')) * 60 + Number(g('minute')) }
}
