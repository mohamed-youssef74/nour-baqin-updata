'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { PageShell } from '@/components/site-header'
import { loadQuran, loadTafsir, type QSurah } from '@/lib/quran-data'

// Each story is shown only through its Quran passages and Tafsir al-Muyassar.
// Passage references: [surah number, first verse, last verse].
const prophets: { name: string; ref: [number, number, number][] }[] = [
  { name: 'آدم عليه السلام', ref: [[2, 30, 39]] },
  { name: 'إدريس عليه السلام', ref: [[19, 56, 57]] },
  { name: 'نوح عليه السلام', ref: [[11, 25, 49]] },
  { name: 'هود عليه السلام', ref: [[7, 65, 72]] },
  { name: 'صالح عليه السلام', ref: [[7, 73, 79]] },
  { name: 'إبراهيم عليه السلام', ref: [[21, 51, 70]] },
  { name: 'لوط عليه السلام', ref: [[7, 80, 84]] },
  { name: 'شعيب عليه السلام', ref: [[7, 85, 93]] },
  { name: 'يوسف عليه السلام', ref: [[12, 4, 101]] },
  { name: 'موسى عليه السلام', ref: [[28, 3, 43]] },
  { name: 'داود عليه السلام', ref: [[38, 17, 26]] },
  { name: 'سليمان عليه السلام', ref: [[27, 15, 44]] },
  { name: 'أيوب عليه السلام', ref: [[38, 41, 44]] },
  { name: 'يونس عليه السلام', ref: [[37, 139, 148]] },
  { name: 'زكريا عليه السلام', ref: [[19, 2, 15]] },
  { name: 'عيسى عليه السلام', ref: [[19, 16, 36]] },
]
const toIndic = (n: number) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)])

export default function StoriesPage() {
  const [surahs, setSurahs] = useState<QSurah[]>([])
  const [tafsir, setTafsir] = useState<string[][] | null>(null)
  const [open, setOpen] = useState<number | null>(null)
  const [withTafsir, setWithTafsir] = useState(false)
  useEffect(() => { loadQuran().then(setSurahs).catch(() => undefined) }, [])
  useEffect(() => { if (withTafsir && !tafsir) loadTafsir().then(setTafsir).catch(() => setWithTafsir(false)) }, [withTafsir, tafsir])

  return <PageShell title="قصص الأنبياء">
    <section className="mx-auto max-w-3xl px-5 py-10">
      <p className="text-center leading-8 text-[#557165]">قصص الأنبياء كما وردت في كتاب الله تعالى، مع التفسير الميسر. اختر نبيًا لقراءة الآيات.</p>
      <label className="mt-4 flex items-center justify-center gap-2 text-sm font-bold text-[#183d35]"><input type="checkbox" checked={withTafsir} onChange={(e) => setWithTafsir(e.target.checked)} className="size-4 accent-[#183d35]" />عرض التفسير تحت كل آية</label>
      <div className="mt-6 grid gap-3">
        {prophets.map((p, i) => <div key={p.name} className="rounded-2xl border border-[#d8b66c]/60 bg-white shadow-sm">
          <button onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i} className="flex w-full items-center justify-between p-4 text-right"><span><strong className="block font-serif text-xl text-[#183d35]">{p.name}</strong><span className="text-xs text-[#718878]">{p.ref.map(([s, a, b]) => `${surahs[s - 1]?.name.replace('سُورَةُ ', 'سورة ') ?? ''} ${toIndic(a)}-${toIndic(b)}`).join('، ')}</span></span><ChevronDown className={`transition ${open === i ? 'rotate-180' : ''}`} aria-hidden="true" /></button>
          {open === i && <div className="border-t border-[#d8b66c]/30 p-4 text-[#183d35]">
            {p.ref.map(([s, a, b]) => <div key={`${s}-${a}`}>{surahs[s - 1]?.ayahs.filter((x) => x.numberInSurah >= a && x.numberInSurah <= b).map((x) => <div key={x.numberInSurah} className="mb-4">
              <p className="text-justify" style={{ fontFamily: 'var(--font-quran), "Amiri", serif', fontSize: 26, lineHeight: 2.3 }}>{x.text} <span className="text-sm text-[#a5823d]">﴿{toIndic(x.numberInSurah)}﴾</span></p>
              {withTafsir && <p className="mt-1 rounded-xl bg-[#eef4ed] p-3 text-sm leading-7 text-[#385447]">{tafsir ? tafsir[s - 1][x.numberInSurah - 1] : 'جاري تحميل التفسير...'}</p>}
            </div>)}
              <Link href={`/quran?surah=${s}&ayah=${a}`} className="text-sm font-bold text-[#a5823d]">افتح في المصحف</Link></div>)}
          </div>}
        </div>)}
      </div>
      <p className="mt-8 text-center text-xs leading-6 text-[#718878]">النص القرآني: المصحف العثماني. التفسير: التفسير الميسر، مجمع الملك فهد لطباعة المصحف الشريف. يمكن إضافة مزيد من القصص لاحقًا.</p>
    </section>
  </PageShell>
}
