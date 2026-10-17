'use client'
import { PageShell } from '@/components/site-header'
import { useNourStorage } from '@/lib/use-nour-storage'

export default function StatsPage(){
  const {stats, ready} = useNourStorage()
  const today = new Date().toISOString().slice(0,10)
  const todayCount = stats.find((item) => item.date === today)?.count || 0
  const total = stats.reduce((sum, item) => sum + item.count, 0)
  const goal = 100
  const progress = Math.min(100, Math.round((todayCount / goal) * 100))
  const days = new Set(stats.map((item) => item.date))
  const streak = Array.from({ length: stats.length + 1 }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - index)
    return days.has(date.toISOString().slice(0,10))
  }).findIndex((hasDay) => !hasDay)
  const currentStreak = streak === -1 ? stats.length : streak

  return <PageShell title="إحصائياتك"><section className="mx-auto max-w-5xl px-6 py-16">
    {!ready ? <p className="text-center text-[#557165]">جاري تحميل تقدمك المحفوظ...</p> : <>
      <div className="grid gap-4 sm:grid-cols-4">{[['اليوم',todayCount],['الأيام المحفوظة',stats.length],['الإجمالي',total],['الأيام المتتالية',currentStreak]].map(([label,value])=><article key={label} className="rounded-3xl border bg-white p-6"><p className="text-sm text-[#718878]">{label}</p><p className="mt-2 text-4xl font-bold text-[#183d35]">{value}</p></article>)}</div>
      <article className="mt-6 rounded-3xl bg-white p-6"><div className="flex items-center justify-between gap-4"><h2 className="font-serif text-2xl font-bold text-[#183d35]">تقدمك اليوم</h2><span className="font-bold text-[#a5823d]">{todayCount} / {goal}</span></div><div className="mt-4 h-4 overflow-hidden rounded-full bg-[#edf2eb]" role="progressbar" aria-label="التقدم اليومي" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><div className="h-full rounded-full bg-[#d8b66c] transition-all" style={{width: `${progress}%`}} /></div><p className="mt-3 text-sm text-[#557165]">اجعل ذكر الله نورًا لقلبك.</p></article>
      <p className="mt-8 rounded-2xl bg-[#edf2eb] p-5 text-sm text-[#557165]">بكل تسبيحة، يطمئن قلبك..</p>
    </>}
  </section></PageShell>
}
