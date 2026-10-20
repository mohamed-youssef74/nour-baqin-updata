'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { BookOpen, Bookmark, ChevronLeft, ChevronRight, LoaderCircle, Settings2, Star } from 'lucide-react'
import { PageShell } from '@/components/site-header'

type Ayah = { numberInSurah: number; text: string; page?: number }
type Surah = { number: number; name: string; ayahs: Ayah[] }
type QuranSettings = { fontSize: number; lineHeight: number; reciter: string; playbackRate: number }
type BookmarkItem = { key: string; type: 'ayah' | 'surah'; surah: number; surahName: string; ayah?: number; text?: string }

const defaultSettings: QuranSettings = { fontSize: 22, lineHeight: 2.5, reciter: 'mishaari_raashid_al_3afaasee', playbackRate: 1 }
const reciters = [
  { value: 'mishaari_raashid_al_3afaasee', label: 'مشاري راشد العفاسي' },
  { value: 'abdul_basit_murattal', label: 'عبد الباسط عبد الصمد' },
  { value: 'yasser_ad-dussary', label: 'ياسر الدوسري' },
]

export default function QuranPage() {
  const [surahs, setSurahs] = useState<Surah[]>([])
  const [selected, setSelected] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [audioSrc, setAudioSrc] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState(defaultSettings)
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([])
  const [showBookmarks, setShowBookmarks] = useState(false)
  const [ready, setReady] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('nour-quran-settings') || '{}')
      const savedBookmarks = JSON.parse(localStorage.getItem('nour-quran-bookmarks') || '[]')
      const savedPage = Number(localStorage.getItem('nour-quran-page'))
      setSettings({ ...defaultSettings, ...saved })
      setBookmarks(Array.isArray(savedBookmarks) ? savedBookmarks : [])
      if (savedPage > 0) setPage(savedPage)
    } catch {}
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    localStorage.setItem('nour-quran-settings', JSON.stringify(settings))
    localStorage.setItem('nour-quran-page', String(page))
    localStorage.setItem('nour-quran-bookmarks', JSON.stringify(bookmarks))
  }, [settings, page, bookmarks, ready])

  const load = async () => {
    if (surahs.length) return
    setLoading(true)
    try {
      const response = await fetch('https://api.alquran.cloud/v1/quran/quran-uthmani')
      const json = await response.json()
      setSurahs(json.data.surahs)
    } finally { setLoading(false) }
  }

  const surah = surahs[selected - 1]
  const pages = useMemo(() => {
    const grouped = new Map<number, { surah: Surah; ayah: Ayah }[]>()
    surah?.ayahs.forEach((ayah) => {
      const pageNumber = ayah.page || 1
      grouped.set(pageNumber, [...(grouped.get(pageNumber) || []), { surah, ayah }])
    })
    return Array.from(grouped.entries()).sort(([a], [b]) => a - b)
  }, [surah])
  const currentPage = pages.find(([number]) => number === page)?.[1] || pages[0]?.[1] || []
  const pageNumber = pages.findIndex(([number]) => number === page) >= 0 ? page : pages[0]?.[0] || 1
  const updateSettings = (patch: Partial<QuranSettings>) => setSettings((current) => ({ ...current, ...patch }))
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = settings.playbackRate
  }, [settings.playbackRate, audioSrc])

  const playSurah = () => { if (surah) setAudioSrc(`https://download.quranicaudio.com/quran/${settings.reciter}/${String(selected).padStart(3, '0')}.mp3`) }
  const isBookmarked = (key: string) => bookmarks.some((item) => item.key === key)
  const toggleBookmark = (item: BookmarkItem) => setBookmarks((current) => isBookmarked(item.key) ? current.filter((saved) => saved.key !== item.key) : [...current, item])
  const selectSurah = (number: number) => { setSelected(number); setPage(0); setAudioSrc('') }

  return (
    <PageShell title="القرآن الكريم">
      <main className="mx-auto max-w-4xl px-4 py-10 text-center sm:px-6 sm:py-16">
        <BookOpen className="mx-auto text-[#a5823d]" aria-hidden="true" />
        <p className="mt-3 text-[#557165]">اقرأ واستمع واهدِ الثواب لروح جدتي الغالية</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button onClick={() => setShowSettings((value) => !value)} className="inline-flex items-center gap-2 rounded-full border border-[#a5823d] px-4 py-2 font-bold text-[#557165]" aria-expanded={showSettings}><Settings2 aria-hidden="true" />إعدادات القراءة</button>
          <button onClick={() => setShowBookmarks((value) => !value)} className="inline-flex items-center gap-2 rounded-full border border-[#a5823d] px-4 py-2 font-bold text-[#557165]" aria-expanded={showBookmarks}><Bookmark aria-hidden="true" />العلامات ({bookmarks.length})</button>
          <button onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-full bg-[#d8b66c] px-6 py-3 font-bold text-[#183d35]">{loading ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <BookOpen aria-hidden="true" />}{loading ? 'جاري تحميل المصحف...' : surahs.length ? 'المصحف مفتوح' : 'فتح المصحف كاملًا'}</button>
        </div>
        {showSettings && <div className="mx-auto mt-4 grid max-w-2xl gap-4 rounded-2xl border border-[#d8b66c] bg-[#f7f4ed] p-5 text-right"><label className="grid gap-2 font-bold text-[#183d35]">حجم الخط: {settings.fontSize}px<input type="range" min="18" max="34" value={settings.fontSize} onChange={(event) => updateSettings({ fontSize: Number(event.target.value) })} /></label><label className="grid gap-2 font-bold text-[#183d35]">تباعد الأسطر: {settings.lineHeight}<input type="range" min="1.8" max="3.5" step="0.1" value={settings.lineHeight} onChange={(event) => updateSettings({ lineHeight: Number(event.target.value) })} /></label><label className="grid gap-2 font-bold text-[#183d35]">سرعة التلاوة: {settings.playbackRate}x<input type="range" min="0.5" max="1.5" step="0.25" value={settings.playbackRate} onChange={(event) => updateSettings({ playbackRate: Number(event.target.value) })} /></label><label className="grid gap-2 font-bold text-[#183d35]">القارئ<select value={settings.reciter} onChange={(event) => updateSettings({ reciter: event.target.value })} className="rounded-xl border border-[#d8b66c] bg-white p-2">{reciters.map((reciter) => <option key={reciter.value} value={reciter.value}>{reciter.label}</option>)}</select></label></div>}
        {showBookmarks && <section className="mx-auto mt-4 max-w-2xl rounded-2xl border border-[#d8b66c] bg-[#fffdf8] p-4 text-right"><h2 className="font-bold text-[#183d35]">علاماتك المحفوظة</h2>{bookmarks.length === 0 ? <p className="mt-3 text-sm text-[#557165]">اضغط على النجمة بجانب السورة أو الآية لإضافتها.</p> : <div className="mt-3 grid gap-2">{bookmarks.map((item) => <button key={item.key} onClick={() => { selectSurah(item.surah); setShowBookmarks(false) }} className="rounded-xl border border-[#d8b66c]/50 p-3 text-right text-sm hover:bg-[#f7f4ed]"><strong>{item.surahName}</strong>{item.ayah ? ` — الآية ${item.ayah}` : ' — السورة كاملة'}{item.text && <span className="mt-1 block truncate text-[#557165]">{item.text}</span>}</button>)}</div>}</section>}
        {surahs.length > 0 && <section className="mt-8"><div className="flex flex-wrap items-center justify-center gap-3"><label className="font-bold text-[#183d35]">السورة<select value={selected} onChange={(event) => selectSurah(Number(event.target.value))} className="mr-2 rounded-xl border border-[#d8b66c] bg-white p-2">{surahs.map((item) => <option key={item.number} value={item.number}>{item.number}. {item.name}</option>)}</select></label><button onClick={() => toggleBookmark({ key: `surah-${selected}`, type: 'surah', surah: selected, surahName: surah.name })} className="rounded-full border border-[#a5823d] px-4 py-2 font-bold text-[#557165]" aria-label="حفظ السورة"><Star fill={isBookmarked(`surah-${selected}`) ? 'currentColor' : 'none'} aria-hidden="true" /> {isBookmarked(`surah-${selected}`) ? 'محفوظة' : 'حفظ السورة'}</button><button onClick={playSurah} className="rounded-full border border-[#a5823d] px-4 py-2 font-bold text-[#557165]">استماع للسورة كاملة</button></div><div className="mx-auto mt-6 max-w-3xl rounded-3xl border border-[#d8b66c]/60 bg-[#fffdf8] p-5 shadow-sm sm:p-10"><div className="mb-6 flex items-center justify-between gap-3"><button disabled={!pages.length || pageNumber <= pages[0]?.[0]} onClick={() => setPage(Math.max(pages[0]?.[0] || 1, pageNumber - 1))} className="rounded-full border border-[#d8b66c] p-2 disabled:opacity-40" aria-label="الصفحة السابقة"><ChevronRight aria-hidden="true" /></button><span className="font-bold text-[#557165]">صفحة {pages.findIndex(([number]) => number === pageNumber) + 1} من {pages.length}</span><button disabled={!pages.length || pageNumber >= (pages[pages.length - 1]?.[0] || 1)} onClick={() => setPage(pages[pages.findIndex(([number]) => number === pageNumber) + 1]?.[0] || pageNumber)} className="rounded-full border border-[#d8b66c] p-2 disabled:opacity-40" aria-label="الصفحة التالية"><ChevronLeft aria-hidden="true" /></button></div><div className="text-right text-[#183d35]" style={{ fontSize: settings.fontSize, lineHeight: settings.lineHeight }}>{currentPage.map(({ surah: item, ayah }) => { const key = `ayah-${item.number}-${ayah.numberInSurah}`; return <p key={key} className="mb-4 flex items-start gap-2"><span className="flex-1">{ayah.text} <span className="text-sm text-[#a5823d]">﴿{ayah.numberInSurah}﴾</span></span><button onClick={() => toggleBookmark({ key, type: 'ayah', surah: item.number, surahName: item.name, ayah: ayah.numberInSurah, text: ayah.text })} className="mt-1 shrink-0 text-[#a5823d]" aria-label={isBookmarked(key) ? 'إزالة علامة الآية' : 'حفظ الآية'}><Star fill={isBookmarked(key) ? 'currentColor' : 'none'} aria-hidden="true" /></button></p> })}</div></div></section>}
        {audioSrc && <audio ref={audioRef} className="mx-auto mt-5 w-full max-w-2xl" controls autoPlay src={audioSrc}>متصفحك لا يدعم تشغيل الصوت.</audio>}
      </main>
    </PageShell>
  )
}
