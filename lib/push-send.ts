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

export async function sendReminder(s: { endpoint: string; p256dh: string; auth: string }) {
  configure()
  const payload = JSON.stringify({ title: 'نورٌ باقٍ', body: 'حان وقت وردك اليومي من القرآن', url: '/quran' })
  return webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 6 * 3600, urgency: 'normal' })
}

// Local date and minutes-since-midnight in a timezone.
export function localNow(tz: string, now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now)
  const g = (t: string) => parts.find((p) => p.type === t)!.value
  return { date: `${g('year')}-${g('month')}-${g('day')}`, minutes: Number(g('hour')) * 60 + Number(g('minute')) }
}
