import { neon } from '@neondatabase/serverless'
import { promises as fs } from 'fs'

export type PushSub = {
  endpoint: string
  p256dh: string
  auth: string
  time: string // HH:MM local
  tz: string // IANA timezone
  doneDate: string // local date (YYYY-MM-DD) the wird was finished, or ''
  lastSent: string // local date (YYYY-MM-DD) last wird reminder was sent
  wirdOn: boolean
  prayerOn: boolean
  adhkarOn: boolean
  adhkarTime: string // HH:MM morning adhkar time
  sent: Record<string, string> // other reminders: key -> local date last sent
}

const FILE = '/tmp/nour-push-dev.json'
const url = process.env.DATABASE_URL
const sql = url ? neon(url) : null
let ready = false

async function init() {
  if (!sql || ready) return
  await sql`CREATE TABLE IF NOT EXISTS push_subs (
    endpoint text PRIMARY KEY, p256dh text NOT NULL, auth text NOT NULL,
    time text NOT NULL, tz text NOT NULL, done_date text NOT NULL DEFAULT '', last_sent text NOT NULL DEFAULT ''
  )`
  for (const [col, def] of [['wird_on', "'1'"], ['prayer_on', "'0'"], ['adhkar_on', "'0'"], ['adhkar_time', "'08:00'"], ['sent_json', "'{}'"]]) {
    await sql.query(`ALTER TABLE push_subs ADD COLUMN IF NOT EXISTS ${col} text NOT NULL DEFAULT ${def}`)
  }
  ready = true
}

function parseSent(v: unknown): Record<string, string> {
  try { const o = JSON.parse(String(v || '{}')); return o && typeof o === 'object' ? o : {} } catch { return {} }
}
const fromRow = (r: any): PushSub => ({ endpoint: r.endpoint, p256dh: r.p256dh, auth: r.auth, time: r.time, tz: r.tz, doneDate: r.done_date, lastSent: r.last_sent, wirdOn: r.wird_on !== '0', prayerOn: r.prayer_on === '1', adhkarOn: r.adhkar_on === '1', adhkarTime: r.adhkar_time || '08:00', sent: parseSent(r.sent_json) })
const withDefaults = (x: any): PushSub => ({ wirdOn: true, prayerOn: false, adhkarOn: false, adhkarTime: '08:00', sent: {}, ...x })

async function readFile(): Promise<PushSub[]> {
  try { return (JSON.parse(await fs.readFile(FILE, 'utf8')) as any[]).map(withDefaults) } catch { return [] }
}

export async function listSubs(): Promise<PushSub[]> {
  if (!sql) return readFile()
  await init()
  const rows = await sql`SELECT * FROM push_subs`
  return rows.map(fromRow)
}

export async function getSub(endpoint: string): Promise<PushSub | undefined> {
  return (await listSubs()).find((s) => s.endpoint === endpoint)
}

export async function saveSub(s: PushSub) {
  if (!sql) {
    const all = (await readFile()).filter((x) => x.endpoint !== s.endpoint)
    all.push(s)
    return fs.writeFile(FILE, JSON.stringify(all))
  }
  await init()
  await sql`INSERT INTO push_subs (endpoint, p256dh, auth, time, tz, done_date, last_sent, wird_on, prayer_on, adhkar_on, adhkar_time, sent_json)
    VALUES (${s.endpoint}, ${s.p256dh}, ${s.auth}, ${s.time}, ${s.tz}, ${s.doneDate}, ${s.lastSent}, ${s.wirdOn ? '1' : '0'}, ${s.prayerOn ? '1' : '0'}, ${s.adhkarOn ? '1' : '0'}, ${s.adhkarTime}, ${JSON.stringify(s.sent)})
    ON CONFLICT (endpoint) DO UPDATE SET p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth, time = EXCLUDED.time, tz = EXCLUDED.tz, done_date = EXCLUDED.done_date,
      wird_on = EXCLUDED.wird_on, prayer_on = EXCLUDED.prayer_on, adhkar_on = EXCLUDED.adhkar_on, adhkar_time = EXCLUDED.adhkar_time`
}

// key 'wird' uses last_sent; other keys live in sent_json.
export async function markSent(s: PushSub, key: string, date: string) {
  if (key === 'wird') s.lastSent = date
  else s.sent = { ...s.sent, [key]: date }
  if (!sql) {
    const all = await readFile()
    for (const x of all) if (x.endpoint === s.endpoint) { x.lastSent = s.lastSent; x.sent = s.sent }
    return fs.writeFile(FILE, JSON.stringify(all))
  }
  await init()
  await sql`UPDATE push_subs SET last_sent = ${s.lastSent}, sent_json = ${JSON.stringify(s.sent)} WHERE endpoint = ${s.endpoint}`
}

export async function removeSub(endpoint: string) {
  if (!sql) return fs.writeFile(FILE, JSON.stringify((await readFile()).filter((x) => x.endpoint !== endpoint)))
  await init()
  await sql`DELETE FROM push_subs WHERE endpoint = ${endpoint}`
}
