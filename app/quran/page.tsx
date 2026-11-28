'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { BookOpen, Bookmark, ChevronLeft, ChevronRight, Download, Image as ImageIcon, LoaderCircle, MessageSquareText, Play, Settings2, Star, Trash2 } from 'lucide-react'
import { PageShell } from '@/components/site-header'
import { useNourStorage } from '@/lib/use-nour-storage'
import { audioUrl, isAudioSaved, loadQuran, loadTafsir, removeAudio, saveAudio, savedAudioBlobUrl, type QSurah, type Reciter } from '@/lib/quran-data'
import { shareVerseImage } from '@/lib/share-image'

type QuranSettings = { fontSize: number; lineHeight: number; reciter: string; playbackRate: number }
type BookmarkItem = { key: string; type: 'ayah' | 'surah'; surah: number; surahName: string; ayah?: number; text?: string; page?: number }
type Entry = { surah: QSurah; ayah: QSurah['ayahs'][number] }

const defaultSettings: QuranSettings = { fontSize: 28, lineHeight: 2.4, reciter: 'mishaari_raashid_al_3afaasee', playbackRate: 1 }
const reciters: Reciter[] & { label: string }[] = [
  { value: 'mishaari_raashid_al_3afaasee', label: 'مشاري راشد العفاسي', source: 'quranicaudio' },
  { value: 'abdul_basit_murattal', label: 'عبد الباسط عبد الصمد', source: 'quranicaudio' },
  { value: 'yasser_ad-dussary', label: 'ياسر الدوسري', source: 'quranicaudio' },
  { value: 'minshawi', label: 'محمد صديق المنشاوي', source: 'mp3quran' },
  { value: 'husr', label: 'محمود خليل الحصري', source: 'mp3quran' },
] as (Reciter & { label: string })[]
const BASMALA = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ'
const toIndic = (n: number) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)])
const normAr = (t: string) => t.replace(/[\u064B-\u065F\u0670\u0640\u06D6-\u06ED]/g, '').replace(/[\u0622\u0623\u0625\u0671]/g, '\u0627').replace(/\u0629/g, '\u0647').replace(/\u0649/g, '\u064A')
const btn = 'inline-flex items-center gap-2 rounded-full border border-[#a5823d] px-4 py-2 text-sm font-bold text-[#557165] disabled:opacity-50'

function Reader() {
  const params = useSearchParams()
  const [surahs, setSurahs] = useState<QSurah[]>([])
  const [error, setError] = useState(false)
  const [page, setPage] = useState(1)
  const [settings, setSettings] = useState(defaultSettings)
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([])
  const [showSettings, setShowSettings] = useState(false)
  const [showBookmarks, setShowBookmarks] = useState(false)
  const [ready, setReady] = useState(false)
  const [active, setActive] = useState<string | null>(null)
  const [tafsir, setTafsir] = useState<string[][] | null>(null)
  const [showTafsir, setShowTafsir] = useState(false)
  const [audioSrc, setAudioSrc] = useState('')
  const [saved, setSaved] = useState(false)
  const [dl, setDl] = useState<number | null>(null)
  const [msg, setMsg] = useState('')
  const [jump, setJump] = useState('')
  const [showIndex, setShowIndex] = useState(false)
  const [filter, setFilter] = useState('')
  const audioRef = useRef<HTMLAudioElement>(null)
  const touch = useRef<number | null>(null)
  const { ready: storageReady, setKhatmaPage } = useNourStorage()

  useEffect(() => { loadQuran().then(setSurahs).catch(() => setError(true)) }, [])

  const byPage = useMemo(() => {
    const m = new Map<number, Entry[]>()
    surahs.forEach((surah) => surah.ayahs.forEach((ayah) => { const l = m.get(ayah.page) || []; l.push({ surah, ayah }); m.set(ayah.page, l) }))
    return m
  }, [surahs])

  // restore settings, bookmarks and last page; links can override the page
  useEffect(() => {
    if (!surahs.length) return
    try {
      setSettings({ ...defaultSettings, ...JSON.parse(localStorage.getItem('nour-quran-settings') || '{}') })
      const b = JSON.parse(localStorage.getItem('nour-quran-bookmarks') || '[]'); setBookmarks(Array.isArray(b) ? b : [])
    } catch {}
    let start = Number(localStorage.getItem('nour-quran-page')) || 1
    const qp = Number(params.get('page')), qs = Number(params.get('surah')), qa = Number(params.get('ayah'))
    if (qp >= 1 && qp <= 604) start = qp
    if (qs >= 1 && qs <= 114) {
      const s = surahs[qs - 1]; const a = s.ayahs.find((x) => x.numberInSurah === (qa || 1)) || s.ayahs[0]
      start = a.page; if (qa) setActive(`${qs}-${a.numberInSurah}`)
    }
    setPage(Math.min(604, Math.max(1, start))); setReady(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surahs])

  useEffect(() => {
    if (!ready) return
    localStorage.setItem('nour-quran-settings', JSON.stringify(settings))
    localStorage.setItem('nour-quran-bookmarks', JSON.stringify(bookmarks))
  }, [settings, bookmarks, ready])
  useEffect(() => {
    if (!ready) return
    localStorage.setItem('nour-quran-page', String(page))
    if (storageReady) setKhatmaPage(page)
  }, [page, ready, storageReady, setKhatmaPage])

  const go = useCallback((n: number) => { setPage(Math.min(604, Math.max(1, n))); setActive(null); setShowTafsir(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }, [])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.matches?.('input,select,textarea')) return
      if (e.key === 'ArrowLeft') go(page + 1)
      if (e.key === 'ArrowRight') go(page - 1)
    }
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey)
  }, [go, page])

  const entries = byPage.get(page) || []
  const mainSurah = entries[0]?.surah
  const reciter = reciters.find((r) => r.value === settings.reciter) || reciters[0]
  const url = mainSurah ? audioUrl(reciter, mainSurah.number) : ''
  useEffect(() => { if (url) isAudioSaved(url).then(setSaved).catch(() => setSaved(false)) }, [url])
  useEffect(() => { if (audioRef.current) audioRef.current.playbackRate = settings.playbackRate }, [settings.playbackRate, audioSrc])
  useEffect(() => { setAudioSrc('') }, [mainSurah?.number])

  const upd = (patch: Partial<QuranSettings>) => setSettings((c) => ({ ...c, ...patch }))
  const isBm = (key: string) => bookmarks.some((b) => b.key === key)
  const toggleBm = (b: BookmarkItem) => setBookmarks((c) => isBm(b.key) ? c.filter((x) => x.key !== b.key) : [...c, b])
  const activeEntry = entries.find((e) => `${e.surah.number}-${e.ayah.numberInSurah}` === active)

  const play = async () => { setMsg(''); setAudioSrc((await savedAudioBlobUrl(url).catch(() => null)) || url) }
  const download = async () => {
    setDl(0); setMsg('')
    try { await saveAudio(url, setDl); setSaved(true); setMsg('تم حفظ السورة للاستماع بدون إنترنت') } catch { setMsg('تعذر التحميل، تأكد من الاتصال وحاول مرة أخرى') }
    setDl(null)
  }
  const openTafsir = async () => {
    setShowTafsir((v) => !v)
    if (!tafsir) { try { setTafsir(await loadTafsir()) } catch { setMsg('التفسير غير متاح الآن') } }
  }
  const share = async (light = false) => {
    if (!activeEntry) return
    const r = await shareVerseImage({ text: `${activeEntry.ayah.text}`, surahName: activeEntry.surah.name.replace('سُورَةُ ', ''), ayah: activeEntry.ayah.numberInSurah, light })
    setMsg(r === 'downloaded' ? 'تم تحميل صورة الآية' : '')
  }
  const surahStartPage = (n: number) => surahs[n - 1]?.ayahs[0].page || 1

  if (error) return <p className="py-20 text-center text-red-700">تعذر فتح المصحف. أعد تحميل الصفحة.</p>
  if (!surahs.length || !ready) return <p className="flex items-center justify-center gap-2 py-20 text-[#557165]"><LoaderCircle className="animate-spin" aria-hidden="true" />جاري فتح المصحف...</p>

  return (
    <main className="mx-auto max-w-3xl px-3 py-6 sm:px-6 sm:py-10"
      onTouchStart={(e) => { touch.current = e.touches[0].clientX }}
      onTouchEnd={(e) => { if (touch.current === null) return; const dx = e.changedTouches[0].clientX - touch.current; touch.current = null; if (Math.abs(dx) > 70) go(page + (dx > 0 ? 1 : -1)) }}>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button onClick={() => setShowIndex((v) => !v)} className="inline-flex items-center gap-2 rounded-full bg-[#183d35] px-5 py-2 text-sm font-bold text-[#f7f4ed]" aria-expanded={showIndex}><BookOpen className="size-4" aria-hidden="true" />تصفح السور</button>
        <form onSubmit={(e) => { e.preventDefault(); const n = Number(jump); if (n >= 1 && n <= 604) go(n); setJump('') }} className="flex items-center gap-1"><input value={jump} onChange={(e) => setJump(e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="صفحة" aria-label="الانتقال إلى صفحة" className="w-20 rounded-full border border-[#d8b66c] bg-white px-3 py-2 text-center text-sm" /><button className={btn}>اذهب</button></form>
        <button onClick={() => setShowSettings((v) => !v)} className={btn} aria-expanded={showSettings}><Settings2 className="size-4" aria-hidden="true" />القراءة</button>
        <button onClick={() => setShowBookmarks((v) => !v)} className={btn} aria-expanded={showBookmarks}><Bookmark className="size-4" aria-hidden="true" />العلامات ({bookmarks.length})</button>
      </div>

      {showIndex && <section className="mx-auto mt-4 max-w-2xl rounded-2xl border border-[#d8b66c] bg-[#fffdf8] p-4 text-right" aria-label="فهرس السور">
        <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="ابحث باسم السورة أو رقمها" aria-label="بحث في السور" className="w-full rounded-xl border border-[#d8b66c] bg-white px-3 py-2 text-sm" />
        <div className="mt-3 grid max-h-80 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
          {surahs.filter((s) => !filter.trim() || String(s.number) === filter.trim() || normAr(s.name).includes(normAr(filter.trim()))).map((s) => <button key={s.number} onClick={() => { go(surahStartPage(s.number)); setShowIndex(false) }} className={`rounded-xl border p-2 text-right text-sm ${mainSurah?.number === s.number ? 'border-[#183d35] bg-[#dce8dc]' : 'border-[#d8b66c]/50'}`}><strong className="block" style={{ fontFamily: 'var(--font-quran), serif' }}>{toIndic(s.number)}. {s.name.replace('سُورَةُ ', '')}</strong><span className="text-xs text-[#557165]">{toIndic(s.ayahs.length)} آية — ص {toIndic(s.ayahs[0].page)}</span></button>)}
        </div>
      </section>}
      {showSettings && <div className="mx-auto mt-4 grid max-w-2xl gap-4 rounded-2xl border border-[#d8b66c] bg-[#f7f4ed] p-5 text-right">
        <label className="grid gap-2 font-bold text-[#183d35]">حجم الخط: {settings.fontSize}px<input type="range" min="20" max="44" value={settings.fontSize} onChange={(e) => upd({ fontSize: Number(e.target.value) })} /></label>
        <label className="grid gap-2 font-bold text-[#183d35]">تباعد الأسطر: {settings.lineHeight}<input type="range" min="1.8" max="3.4" step="0.1" value={settings.lineHeight} onChange={(e) => upd({ lineHeight: Number(e.target.value) })} /></label>
        <label className="grid gap-2 font-bold text-[#183d35]">سرعة التلاوة: {settings.playbackRate}x<input type="range" min="0.5" max="1.5" step="0.25" value={settings.playbackRate} onChange={(e) => upd({ playbackRate: Number(e.target.value) })} /></label>
        <label className="grid gap-2 font-bold text-[#183d35]">القارئ<select value={settings.reciter} onChange={(e) => upd({ reciter: e.target.value })} className="rounded-xl border border-[#d8b66c] bg-white p-2">{reciters.map((r) => <option key={r.value} value={r.value}>{(r as Reciter & { label: string }).label}</option>)}</select></label>
      </div>}
      {showBookmarks && <section className="mx-auto mt-4 max-w-2xl rounded-2xl border border-[#d8b66c] bg-[#fffdf8] p-4 text-right"><h2 className="font-bold text-[#183d35]">علاماتك المحفوظة</h2>{bookmarks.length === 0 ? <p className="mt-3 text-sm text-[#557165]">اضغط على أي آية ثم «حفظ علامة».</p> : <div className="mt-3 grid gap-2">{bookmarks.map((b) => <button key={b.key} onClick={() => { go(b.page || (b.ayah ? surahs[b.surah - 1].ayahs[b.ayah - 1].page : surahStartPage(b.surah))); setShowBookmarks(false) }} className="rounded-xl border border-[#d8b66c]/50 p-3 text-right text-sm"><strong>{b.surahName}</strong>{b.ayah ? ` — الآية ${b.ayah}` : ' — السورة كاملة'}{b.text && <span className="mt-1 block truncate text-[#557165]">{b.text}</span>}</button>)}</div>}</section>}

      <div className="mt-5 flex items-center justify-between px-1 text-sm text-[#557165]"><span className="font-bold">{mainSurah?.name}</span><span>صفحة {toIndic(page)} من ٦٠٤</span></div>
      <article className="relative mt-2 rounded-3xl border-2 border-[#d8b66c]/70 bg-[#fffdf8] p-5 shadow-md ring-1 ring-[#d8b66c]/30 ring-offset-4 ring-offset-[#f7f4ed] sm:p-10" dir="rtl">
        <div className="text-justify text-[#183d35]" style={{ fontFamily: 'var(--font-quran), "Amiri", serif', fontSize: settings.fontSize, lineHeight: settings.lineHeight }}>
          {entries.map(({ surah, ayah }) => {
            const key = `${surah.number}-${ayah.numberInSurah}`
            return <span key={key}>
              {ayah.numberInSurah === 1 && <span className="my-3 block text-center"><span className="block rounded-xl border border-[#d8b66c] bg-[#f7f4ed] py-1 text-[0.8em] font-bold">{surah.name}</span>{surah.number !== 1 && surah.number !== 9 && <span className="mt-2 block text-[0.9em]">{BASMALA}</span>}</span>}
              <span role="button" tabIndex={0} onClick={() => { setActive(active === key ? null : key); setShowTafsir(false) }} onKeyDown={(e) => { if (e.key === 'Enter') setActive(key) }} className={`cursor-pointer rounded px-0.5 transition ${active === key ? 'bg-[#d8b66c]/40' : 'hover:bg-[#d8b66c]/15'}`}>{ayah.text} <span className="text-[0.62em] text-[#a5823d]">﴿{toIndic(ayah.numberInSurah)}﴾</span>{isBm(`ayah-${key}`) && <Star className="inline size-4 text-[#a5823d]" fill="currentColor" aria-label="علامة" />}</span>{' '}
            </span>
          })}
        </div>
      </article>

      {activeEntry && <section className="mt-4 rounded-2xl border border-[#d8b66c] bg-[#f7f4ed] p-4 text-right" aria-live="polite">
        <p className="text-sm font-bold text-[#183d35]">{activeEntry.surah.name} — الآية {toIndic(activeEntry.ayah.numberInSurah)}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={openTafsir} className={btn}><MessageSquareText className="size-4" aria-hidden="true" />{showTafsir ? 'إخفاء التفسير' : 'التفسير'}</button>
          <button onClick={() => toggleBm({ key: `ayah-${active}`, type: 'ayah', surah: activeEntry.surah.number, surahName: activeEntry.surah.name, ayah: activeEntry.ayah.numberInSurah, text: activeEntry.ayah.text, page })} className={btn}><Star className="size-4" fill={isBm(`ayah-${active}`) ? 'currentColor' : 'none'} aria-hidden="true" />{isBm(`ayah-${active}`) ? 'إزالة العلامة' : 'حفظ علامة'}</button>
          <button onClick={() => share(false)} className={btn}><ImageIcon className="size-4" aria-hidden="true" />مشاركة كصورة</button>
          <button onClick={() => share(true)} className={btn}><ImageIcon className="size-4" aria-hidden="true" />صورة فاتحة</button>
        </div>
        {showTafsir && <p className="mt-3 leading-8 text-[#243a32]">{tafsir ? tafsir[activeEntry.surah.number - 1][activeEntry.ayah.numberInSurah - 1] : 'جاري تحميل التفسير...'}<span className="mt-2 block text-xs text-[#718878]">التفسير الميسر، مجمع الملك فهد لطباعة المصحف الشريف</span></p>}
      </section>}

      <div className="mt-5 flex items-center justify-between gap-3">
        <button onClick={() => go(page - 1)} disabled={page <= 1} className="rounded-full border border-[#d8b66c] p-3 disabled:opacity-40" aria-label="الصفحة السابقة"><ChevronRight aria-hidden="true" /></button>
        <div className="flex flex-wrap justify-center gap-2">
          <button onClick={play} className={btn}><Play className="size-4" aria-hidden="true" />استماع للسورة</button>
          {saved ? <button onClick={async () => { await removeAudio(url); setSaved(false); setMsg('تم حذف التلاوة المحفوظة') }} className={btn}><Trash2 className="size-4" aria-hidden="true" />حذف المحفوظ</button> : <button onClick={download} disabled={dl !== null} className={btn}><Download className="size-4" aria-hidden="true" />{dl !== null ? `جاري التحميل ${Math.round(dl * 100)}%` : 'تحميل بدون إنترنت'}</button>}
        </div>
        <button onClick={() => go(page + 1)} disabled={page >= 604} className="rounded-full border border-[#d8b66c] p-3 disabled:opacity-40" aria-label="الصفحة التالية"><ChevronLeft aria-hidden="true" /></button>
      </div>
      {msg && <p className="mt-3 text-center text-sm text-[#557165]" role="status">{msg}</p>}
      {audioSrc && <audio ref={audioRef} className="mx-auto mt-4 w-full max-w-2xl" controls autoPlay src={audioSrc}>متصفحك لا يدعم تشغيل الصوت.</audio>}
      <p className="mt-4 text-center text-xs text-[#718878]"><BookOpen className="mr-1 inline size-3" aria-hidden="true" />اسحب يمينًا أو يسارًا لتقليب الصفحات. المصحف والتفسير يعملان بدون إنترنت.</p>
    </main>
  )
}

export default function QuranPage() {
  return <PageShell title="القرآن الكريم"><Suspense fallback={null}><Reader /></Suspense></PageShell>
}
