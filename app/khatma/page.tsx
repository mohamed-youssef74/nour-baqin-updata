'use client'

import { BookOpen, Minus, Plus, RotateCcw } from 'lucide-react'
import { PageShell } from '@/components/site-header'
import { useNourStorage } from '@/lib/use-nour-storage'

export default function KhatmaPage() {
  const { khatmaPage, setKhatmaPage } = useNourStorage()
  const progress = Math.min(100, Math.round((khatmaPage / 604) * 100))
  return <PageShell title="ختمة القرآن">
    <section className="mx-auto max-w-2xl px-5 py-10">
      <div className="rounded-[2rem] bg-[#183d35] p-6 text-center text-[#f7f4ed] shadow-sm sm:p-10">
        <BookOpen className="mx-auto size-12 text-[#e8c878]" />
        <h2 className="mt-5 font-serif text-3xl font-bold">تابع ختمتك</h2>
        <p className="mt-3 text-[#c5d3c7]">احفظ آخر صفحة وصلت إليها وتابع من أي جهاز على نفس المتصفح.</p>
        <div className="mt-8 h-3 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-[#d8b66c] transition-all" style={{ width: `${progress}%` }} /></div>
        <p className="mt-3 text-sm text-[#c5d3c7]">صفحة {khatmaPage} من 604 — {progress}%</p>
        <div className="mt-7 flex items-center justify-center gap-3"><button aria-label="إنقاص الصفحة" onClick={() => setKhatmaPage(Math.max(1, khatmaPage - 1))} className="rounded-full border border-white/20 p-3"><Minus /></button><span className="min-w-24 rounded-2xl bg-white/10 px-5 py-3 font-bold">صفحة {khatmaPage}</span><button aria-label="زيادة الصفحة" onClick={() => setKhatmaPage(Math.min(604, khatmaPage + 1))} className="rounded-full bg-[#d8b66c] p-3 text-[#183d35]"><Plus /></button></div>
        <button onClick={() => setKhatmaPage(1)} className="mt-6 inline-flex items-center gap-2 text-sm text-[#c5d3c7] hover:text-white"><RotateCcw /> بدء ختمة جديدة</button>
      </div>
    </section>
  </PageShell>
}
