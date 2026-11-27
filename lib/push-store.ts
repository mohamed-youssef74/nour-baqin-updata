import { neon } from '@neondatabase/serverless'
import { promises as fs } from 'fs'

export type PushSub = {
  endpoint: string
  p256dh: string
  auth: string
  time: string // HH:MM local
  tz: string // IANA timezone
  doneDate: string // local date (YYYY-MM-DD) the wird was finished, or ''
  lastSent: string // local date (YYYY-MM-DD) last reminder was sent
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
  ready = true
}

async function readFile(): Promise<PushSub[]> {
  try { return JSON.parse(await fs.readFile(FILE, 'utf8')) } catch { return [] }
}

export async function listSubs(): Promise<PushSub[]> {
  if (!sql) return readFile()
  await init()
  const rows = await sql`SELECT * FROM push_subs`
  return rows.map((r: any) => ({ endpoint: r.endpoint, p256dh: r.p256dh, auth: r.auth, time: r.time, tz: r.tz, doneDate: r.done_date, lastSent: r.last_sent }))
}

export async function getSub(endpoint: string): Promise<PushSub | undefined> {
  return (await listSubs()).find((s) => s.endpoint === endpoint)
}

export async function saveSub(s: PushSub) {
  if (!sql) {
    const all = (await readFile()).filter((x) => x.endpoint !== s.endpoint)
    const old = (await readFile()).find((x) => x.endpoint === s.endpoint)
    all.push({ ...s, lastSent: old?.lastSent ?? s.lastSent })
    return fs.writeFile(FILE, JSON.stringify(all))
  }
  await init()
  await sql`INSERT INTO push_subs (endpoint, p256dh, auth, time, tz, done_date, last_sent)
    VALUES (${s.endpoint}, ${s.p256dh}, ${s.auth}, ${s.time}, ${s.tz}, ${s.doneDate}, ${s.lastSent})
    ON CONFLICT (endpoint) DO UPDATE SET p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth, time = EXCLUDED.time, tz = EXCLUDED.tz, done_date = EXCLUDED.done_date`
}

export async function markSent(endpoint: string, date: string) {
  if (!sql) {
    const all = await readFile()
    for (const x of all) if (x.endpoint === endpoint) x.lastSent = date
    return fs.writeFile(FILE, JSON.stringify(all))
  }
  await init()
  await sql`UPDATE push_subs SET last_sent = ${date} WHERE endpoint = ${endpoint}`
}

export async function removeSub(endpoint: string) {
  if (!sql) return fs.writeFile(FILE, JSON.stringify((await readFile()).filter((x) => x.endpoint !== endpoint)))
  await init()
  await sql`DELETE FROM push_subs WHERE endpoint = ${endpoint}`
}
