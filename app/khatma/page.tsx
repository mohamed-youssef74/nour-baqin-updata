'use client'

import { useEffect, useState } from 'react'
import { BookOpen, Minus, Plus, RotateCcw } from 'lucide-react'
import { PageShell } from '@/components/site-header'
import { KhatmaStats } from '@/components/khatma-stats'
import { useNourStorage } from '@/lib/use-nour-storage'
import { disablePush, localDate, pushSupported, refreshPush, sendTestPush, syncPush } from '@/lib/push-client'

export default function KhatmaPage() {
  const { khatmaPage, setKhatmaPage, ready } = useNourStorage()
  const [wird, setWird] = useState({ date: '', start: 1, goal: 5 })
  const [wirdReady, setWirdReady] = useState(false)
  const todayKey = localDate()
  // Wait for the saved page to load first, otherwise a new day's wird would start at page 1 and look finished.
  useEffect(() => {
    if (!ready || wirdReady) return
    try {
      const saved = JSON.parse(localStorage.getItem('nour-wird') || 'null')
      setWird(saved && saved.date === todayKey ? saved : { date: todayKey, start: khatmaPage, goal: saved?.goal || 5 })
    } catch { setWird({ date: todayKey, start: khatmaPage, goal: 5 }) }
    setWirdReady(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])
  useEffect(() => { if (wirdReady) localStorage.setItem('nour-wird', JSON.stringify(wird)) }, [wird, wirdReady])
  const [rem, setRem] = useState({ enabled: false, time: '20:00', notified: '' })
  useEffect(() => { try { const r = JSON.parse(localStorage.getItem('nour-wird-reminder') || 'null'); if (r) setRem(r) } catch {} }, [])
  const [pushState, setPushState] = useState('')
  const doneNow = wirdReady && wird.date === todayKey && Math.max(0, khatmaPage - wird.start) >= wird.goal
  // Keep the server in sync (time, and whether today's wird is finished) whenever the app is open.
  useEffect(() => { if (wirdReady && rem.enabled) refreshPush({ wird: { on: true, time: rem.time, done: doneNow } }).catch(() => undefined) }, [wirdReady, rem.enabled, rem.time, doneNow])
  const saveRem = async (next: typeof rem) => {
    if (next.enabled && !rem.enabled && typeof Notification !== 'undefined' && Notification.permission === 'default') await Notification.requestPermission().catch(() => undefined)
    setRem(next); localStorage.setItem('nour-wird-reminder', JSON.stringify(next))
    if (!next.enabled) { disablePush({ wird: { on: false } }).catch(() => undefined); setPushState(''); return }
    if (!pushSupported() || Notification.permission !== 'granted') { setPushState(Notification.permission === 'denied' ? 'denied' : 'unsupported'); return }
    try { setPushState((await syncPush({ wird: { on: true, time: next.time, done: doneNow } })) ? 'on' : 'error') } catch { setPushState('error') }
  }
  const done = Math.max(0, khatmaPage - wird.start)
  const wirdPct = Math.min(100, Math.round((done / wird.goal) * 100))
  const daysLeft = Math.ceil((604 - khatmaPage) / wird.goal)
  const progress = Math.min(100, Math.round((khatmaPage / 604) * 100))
  return <PageShell title="ختمة القرآن">
    <section className="mx-auto max-w-2xl px-5 py-10">
      <div className="rounded-[2rem] bg-[#183d35] p-6 text-center text-[#f7f4ed] shadow-sm sm:p-10">
        <BookOpen className="mx-auto size-12 text-[#e8c878]" />
        <h2 className="mt-5 font-serif text-3xl font-bold">تابع ختمتك</h2>
        <p className="mt-3 text-[#c5d3c7]">احفظ آخر صفحة وصلت إليها.</p>
        <div className="mt-8 h-3 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-[#d8b66c] transition-all" style={{ width: `${progress}%` }} /></div>
        <p className="mt-3 text-sm text-[#c5d3c7]">صفحة {khatmaPage} من 604 — {progress}%</p>
        <div className="mt-7 flex items-center justify-center gap-3"><button aria-label="إنقاص الصفحة" onClick={() => setKhatmaPage(Math.max(1, khatmaPage - 1))} className="rounded-full border border-white/20 p-3"><Minus /></button><span className="min-w-24 rounded-2xl bg-white/10 px-5 py-3 font-bold">صفحة {khatmaPage}</span><button aria-label="زيادة الصفحة" onClick={() => setKhatmaPage(Math.min(604, khatmaPage + 1))} className="rounded-full bg-[#d8b66c] p-3 text-[#183d35]"><Plus /></button></div>
        <button onClick={() => setKhatmaPage(1)} className="mt-6 inline-flex items-center gap-2 text-sm text-[#c5d3c7] hover:text-white"><RotateCcw /> بدء ختمة جديدة</button>
      </div>
      <div className="mt-6 rounded-[2rem] border border-[#d8b66c] bg-[#fffdf8] p-6 text-center text-[#183d35] sm:p-8">
        <h2 className="font-serif text-2xl font-bold">وردك اليومي</h2>
        <p className="mt-2 text-sm text-[#557165]">اختر عدد الصفحات التي تقرؤها كل يوم.</p>
        <div className="mt-4 flex items-center justify-center gap-3"><button aria-label="إنقاص الورد" onClick={() => setWird({ ...wird, goal: Math.max(1, wird.goal - 1) })} className="rounded-full border border-[#d8b66c] p-2"><Minus /></button><span className="min-w-28 font-bold">{wird.goal} صفحات يوميًا</span><button aria-label="زيادة الورد" onClick={() => setWird({ ...wird, goal: Math.min(60, wird.goal + 1) })} className="rounded-full bg-[#d8b66c] p-2 text-[#183d35]"><Plus /></button></div>
        <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#dce8dc]"><div className="h-full rounded-full bg-[#183d35] transition-all" style={{ width: `${wirdPct}%` }} /></div>
        <p className="mt-3 text-sm text-[#557165]">قرأت اليوم {done} من {wird.goal} صفحات {done >= wird.goal ? '— ما شاء الله، أتممت وردك' : ''}</p>
        <p className="mt-1 text-sm text-[#557165]">بهذا الورد تختم القرآن خلال {daysLeft} يومًا تقريبًا.</p>
        <div className="mt-6 border-t border-[#d8b66c]/40 pt-5"><label className="flex cursor-pointer items-center justify-center gap-3 font-bold"><input type="checkbox" checked={rem.enabled} onChange={(e) => saveRem({ ...rem, enabled: e.target.checked })} className="size-5 accent-[#183d35]" />تذكير بالورد اليومي</label>{rem.enabled && <label className="mt-3 block text-sm">وقت التذكير <input type="time" value={rem.time} onChange={(e) => saveRem({ ...rem, time: e.target.value })} className="mr-2 rounded-xl border border-[#d8b66c] px-3 py-1" /></label>}<p className="mt-2 text-xs text-[#718878]">{pushState === 'on' ? 'التذكير يصل حتى والتطبيق مغلق، إن لم تكن قرأت وردك بعد.' : pushState === 'denied' ? 'الإشعارات محظورة من إعدادات المتصفح، فعّلها ثم أعد المحاولة.' : pushState === 'unsupported' ? 'هذا المتصفح لا يدعم التنبيهات خارج التطبيق، سيظهر التذكير والتطبيق مفتوح.' : pushState === 'error' ? 'تعذر تفعيل التنبيه خارج التطبيق الآن، سيظهر التذكير والتطبيق مفتوح.' : 'يظهر التذكير والتطبيق مفتوح، إن لم تكن قرأت وردك بعد.'}</p>{rem.enabled && pushState === 'on' && <button onClick={async () => setPushState((await sendTestPush()) ? 'on' : 'error')} className="mt-2 rounded-full border border-[#d8b66c] px-4 py-1 text-xs font-bold">جرّب التنبيه الآن</button>}</div>
      </div>
      <KhatmaStats page={khatmaPage} goal={wird.goal} />
    </section>
  </PageShell>
}
