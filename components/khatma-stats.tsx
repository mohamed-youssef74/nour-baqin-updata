'use client'

import { useEffect, useState } from 'react'
import { dayKey, juzOf, readDone, readLog } from '@/lib/khatma-log'

const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']

// Statistics card for the khatma page: today, last 7 days, average, streak and expected finish date.
export function KhatmaStats({ page, goal }: { page: number; goal: number }) {
  const [log, setLog] = useState<Record<string, number[]>>({})
  const [done, setDone] = useState(0)
  useEffect(() => { setLog(readLog()); setDone(readDone()) }, [page])
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    return { label: DAYS[d.getDay()], n: (log[dayKey(d)] || []).length }
  })
  const today = week[6].n
  const total7 = week.reduce((a, b) => a + b.n, 0)
  const avg = total7 / 7
  let streak = 0
  for (let i = week[6].n > 0 ? 6 : 5; i >= 0 && week[i].n > 0; i--) streak++
  const left = Math.max(0, 604 - page)
  const perDay = avg >= 1 ? avg : goal
  const daysLeft = Math.ceil(left / perDay)
  const finish = new Date(); finish.setDate(finish.getDate() + daysLeft)
  const max = Math.max(1, ...week.map((w) => w.n))
  const cards: [string, string | number][] = [['قرأت اليوم', `${today} صفحة`], ['متوسط آخر ٧ أيام', `${avg.toFixed(1)} صفحة`], ['أيام متتالية', streak], ['الجزء الحالي', juzOf(page)], ['صفحات متبقية', left], ['ختمات مكتملة', done]]
  return <div className="mt-6 rounded-[2rem] border border-[#d8b66c] bg-[#fffdf8] p-6 text-center text-[#183d35] sm:p-8" aria-label="إحصائيات الختمة">
    <h2 className="font-serif text-2xl font-bold">إحصائيات ختمتك</h2>
    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">{cards.map(([label, value]) => <div key={label} className="rounded-2xl bg-[#eef4ed] p-3"><p className="text-xs text-[#557165]">{label}</p><p className="mt-1 text-xl font-bold">{value}</p></div>)}</div>
    <div className="mt-6 flex h-28 items-end justify-between gap-2" role="img" aria-label="الصفحات المقروءة في آخر سبعة أيام">{week.map((w, i) => <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1"><span className="text-xs font-bold text-[#a5823d]">{w.n || ''}</span><div className={`w-full rounded-t-lg ${i === 6 ? 'bg-[#183d35]' : 'bg-[#d8b66c]'}`} style={{ height: `${Math.max(w.n ? 8 : 3, (w.n / max) * 70)}%` }} /><span className="text-[10px] text-[#718878]">{w.label}</span></div>)}</div>
    <p className="mt-5 text-sm text-[#557165]">{left === 0 ? 'ما شاء الله، وصلت إلى آخر المصحف.' : `بمعدلك ${avg >= 1 ? 'الحالي' : 'المختار (الورد اليومي)'} تختم تقريبًا في ${finish.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })} (بعد ${daysLeft} يومًا).`}</p>
    <p className="mt-1 text-xs text-[#718878]">الإحصائيات محفوظة على جهازك فقط، وتُحسب من تقليب الصفحات بالترتيب.</p>
  </div>
}
