'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { LoaderCircle, Search as SearchIcon } from 'lucide-react'
import { PageShell } from '@/components/site-header'
import { loadQuran } from '@/lib/quran-data'
import { dhikrItems, morningAdhkar, eveningAdhkar, duaaItems } from '@/lib/content'

const norm = (t: string) => t.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, '').replace(/[\u0622\u0623\u0625\u0671]/g, '\u0627').replace(/\u0649/g, '\u064A').replace(/\u0629/g, '\u0647')

type SearchResult = { text: string; category: string; href: string }
type QuranResult = { text: string; surah: string; surahNumber: number; ayah: number }

const localResults: SearchResult[] = [
  ...dhikrItems.map((text) => ({ text, category: 'أذكار', href: '/adhkar' })),
  ...morningAdhkar.map((text) => ({ text, category: 'أذكار الصباح', href: '/adhkar' })),
  ...eveningAdhkar.map((text) => ({ text, category: 'أذكار المساء', href: '/adhkar' })),
  ...duaaItems.map((text) => ({ text, category: 'أدعية', href: '/duaa' })),
]

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [quranResults, setQuranResults] = useState<QuranResult[]>([])
  const [loading, setLoading] = useState(false)
  const normalizedQuery = query.trim()
  const results = useMemo(
    () => localResults.filter((item) => item.text.includes(normalizedQuery)).slice(0, 20),
    [normalizedQuery],
  )

  const searchQuran = async () => {
    if (!normalizedQuery) return
    setLoading(true)
    try {
      const surahs = await loadQuran()
      const matches = surahs.flatMap((surah) =>
        surah.ayahs
          .filter((ayah) => norm(ayah.text).includes(norm(normalizedQuery)))
          .map((ayah) => ({ text: ayah.text, surah: surah.name, surahNumber: surah.number, ayah: ayah.numberInSurah })),
      )
      setQuranResults(matches.slice(0, 20))
    } catch {
      setQuranResults([])
    } finally {
      setLoading(false)
    }
  }

  const hasQuery = normalizedQuery.length > 0
  return <PageShell title="بحث شامل">
    <section className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
      <div className="rounded-3xl border border-[#d8b66c]/50 bg-white p-5 shadow-sm sm:p-7">
        <label htmlFor="site-search" className="mb-3 block font-bold text-[#183d35]">ابحث في نورٌ باقٍ</label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input id="site-search" value={query} onChange={(event) => { setQuery(event.target.value); setQuranResults([]) }} onKeyDown={(event) => { if (event.key === 'Enter' && !event.nativeEvent.isComposing && event.keyCode !== 229) searchQuran() }} placeholder="ابحث في الأذكار والأدعية والقرآن..." aria-label="البحث في المحتوى" className="min-w-0 flex-1 rounded-2xl border border-[#c8d8c9] bg-[#f7f4ed] px-5 py-4 outline-none focus:ring-2 focus:ring-[#c39c4e]" />
          <button type="button" onClick={searchQuran} disabled={!hasQuery || loading} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#d8b66c] px-6 py-4 font-bold text-[#183d35] disabled:cursor-not-allowed disabled:opacity-50"><SearchIcon aria-hidden="true" />{loading ? <><LoaderCircle className="animate-spin" aria-hidden="true" />جاري البحث</> : 'بحث في القرآن'}</button>
        </div>
        <p className="mt-3 text-sm text-[#718878]">تصفّح الآيات بسهولة، وابحث في القرآن الكريم كاملًا.</p>
      </div>
      {hasQuery && <div className="mt-8 grid gap-8 md:grid-cols-2">
        <ResultGroup title="الأذكار والأدعية" count={results.length}>
          {results.map((item) => <Link key={`${item.category}-${item.text}`} href={item.href} className="block rounded-2xl border border-[#e2e9df] bg-white p-4 transition hover:border-[#d8b66c] hover:shadow-sm"><span className="text-xs font-bold text-[#a5823d]">{item.category}</span><p className="mt-2 leading-7">{item.text}</p></Link>)}
          {!results.length && <p className="rounded-2xl bg-white p-5 text-sm text-[#718878]">لا توجد نتائج مطابقة.</p>}
        </ResultGroup>
        <ResultGroup title="القرآن الكريم" count={quranResults.length}>
          {quranResults.map((item) => <Link key={`${item.surah}-${item.ayah}`} href={`/quran?surah=${item.surahNumber}&ayah=${item.ayah}`} className="block rounded-2xl border border-[#e2e9df] bg-white p-4 transition hover:border-[#d8b66c] hover:shadow-sm"><span className="text-xs font-bold text-[#a5823d]">{item.surah} — آية {item.ayah}</span><p className="mt-2 font-serif text-lg leading-9">{item.text}</p></Link>)}
          {!quranResults.length && <p className="rounded-2xl bg-white p-5 text-sm text-[#718878]">اضغط «بحث في القرآن» لعرض النتائج.</p>}
        </ResultGroup>
      </div>}
    </section>
  </PageShell>
}

function ResultGroup({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return <section className="flex flex-col gap-3" aria-labelledby={`results-${title}`}><div className="flex items-center justify-between"><h2 id={`results-${title}`} className="font-serif text-xl font-bold text-[#183d35]">{title}</h2><span className="text-sm text-[#718878]">{count} نتيجة</span></div><div className="grid gap-3">{children}</div></section>
}
