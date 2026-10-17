'use client'

import Link from 'next/link'
import { BookOpen, ChartNoAxesColumn, Heart, Home, Menu, Sparkles, X } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const links = [
  ['/', 'الرئيسية'], ['/memory', 'أثرٌ لا يغيب'], ['/quran', 'القرآن'], ['/adhkar', 'الأذكار'], ['/duaa', 'الدعاء'], ['/library', 'مكتبتي'], ['/stats', 'الإحصائيات'], ['/search', 'بحث'],
]

const mobileLinks = [
  ['/', 'الرئيسية', Home], ['/quran', 'القرآن', BookOpen], ['/adhkar', 'الأذكار', Heart], ['/duaa', 'الدعاء', Sparkles], ['/stats', 'إحصائيات', ChartNoAxesColumn],
] as const

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function SiteHeader() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const closeMenu = () => setOpen(false)

  useEffect(() => {
    navigator.serviceWorker?.register('/sw.js').catch(() => undefined)
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
      'standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
    setIsInstalled(standalone)

    const handleBeforeInstall = (event: Event) => {
      event.preventDefault()
      setInstallEvent(event as BeforeInstallPromptEvent)
    }
    const handleInstalled = () => {
      setInstallEvent(null)
      setIsInstalled(true)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  const installApp = async () => {
    if (!installEvent) {
      setShowGuide(true)
      return
    }
    await installEvent.prompt()
    await installEvent.userChoice
    setInstallEvent(null)
  }

  const canInstall = !isInstalled
  return <header className="bg-[#183d35] text-[#f7f4ed]">
    <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 sm:py-5 lg:px-10">
      <Link href="/" className="flex items-center gap-2.5 sm:gap-3" onClick={closeMenu}>
        <span className="flex size-9 items-center justify-center rounded-full border border-[#d8b66c]/60 bg-[#d8b66c]/10 text-[#e8c878] sm:size-10"><Sparkles aria-hidden="true" /></span>
        <span><strong className="block font-serif text-base sm:text-lg">نورٌ باقٍ</strong><small className="hidden text-xs text-[#c5d3c7] sm:block">صدقة جارية لروح جدتي</small></span>
      </Link>
      <nav className="hidden items-center gap-5 text-sm md:flex" aria-label="التنقل الرئيسي">{links.map(([href, label]) => <Link key={href} href={href} aria-current={pathname === href ? 'page' : undefined} className={`rounded-full px-3 py-2 transition hover:text-[#e8c878] ${pathname === href ? 'bg-white/10 text-[#e8c878]' : ''}`}>{label}</Link>)}</nav>
      <div className="flex items-center gap-2">
        {canInstall && <button onClick={installApp} className="hidden rounded-full border border-[#d8b66c]/50 px-3 py-2 text-xs text-[#e8c878] transition hover:bg-white/10 sm:block">تثبيت التطبيق</button>}
        <button className="rounded-full p-2 md:hidden" aria-label={open ? 'إغلاق القائمة' : 'فتح القائمة'} aria-expanded={open} onClick={() => setOpen(value => !value)}>{open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}</button>
      </div>
    </div>

    {canInstall && <button onClick={installApp} className="fixed bottom-[4.6rem] left-3 z-30 rounded-full border border-[#d8b66c]/50 bg-[#183d35] px-3 py-2 text-xs text-[#e8c878] shadow-lg sm:hidden">تثبيت التطبيق</button>}
    {showGuide && <div role="dialog" aria-modal="true" aria-labelledby="install-guide-title" className="fixed inset-x-4 bottom-24 z-50 rounded-3xl border border-[#d8b66c]/60 bg-[#f7f4ed] p-5 text-[#183d35] shadow-2xl sm:bottom-6 sm:left-auto sm:right-6 sm:max-w-sm"><div className="flex items-start justify-between gap-4"><div><h2 id="install-guide-title" className="font-serif text-lg font-bold">تثبيت نورٌ باقٍ</h2><p className="mt-2 text-sm leading-7 text-[#557165]">اختار الطريقة المناسبة لجهازك:</p></div><button onClick={() => setShowGuide(false)} className="rounded-full px-2 text-xl text-[#557165]" aria-label="إغلاق إرشاد التثبيت">×</button></div><div className="mt-4 grid gap-3 text-sm leading-7"><p><strong>Android وChrome:</strong> افتح قائمة المتصفح ثم اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».</p><p><strong>iPhone وiPad:</strong> اضغط «مشاركة» ثم «إضافة إلى الشاشة الرئيسية».</p><p><strong>الكمبيوتر:</strong> اضغط رمز التثبيت بجوار شريط العنوان ثم اختر «تثبيت».</p></div></div>}
    {open && <nav className="border-t border-white/10 px-4 pb-4 pt-3 text-sm md:hidden" aria-label="المزيد من الصفحات"><div className="grid grid-cols-3 gap-2">{links.slice(1, 2).concat(links.slice(5)).map(([href, label]) => <Link key={href} href={href} onClick={closeMenu} aria-current={pathname === href ? 'page' : undefined} className={`rounded-xl px-2 py-3 text-center hover:bg-white/10 ${pathname === href ? 'bg-white/10 text-[#e8c878]' : ''}`}>{label}</Link>)}</div></nav>}
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#d8b66c]/20 bg-[#183d35]/[.98] px-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-8px_24px_rgba(24,61,53,.16)] md:hidden" aria-label="التنقل السريع"><div className="mx-auto grid max-w-lg grid-cols-5">{mobileLinks.map(([href, label, Icon]) => { const active = pathname === href; return <Link key={href} href={href} aria-current={active ? 'page' : undefined} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[10px] transition ${active ? 'text-[#e8c878]' : 'text-[#c5d3c7] hover:text-[#f7f4ed]'}`}><Icon aria-hidden="true" className={active ? 'size-5' : 'size-[18px]'} /><span>{label}</span></Link> })}</div></nav>
  </header>
}

export function PageShell({ children, title }: { children: React.ReactNode; title?: string }) { return <main dir="rtl" className="min-h-screen bg-[#f7f4ed] pb-20 text-[#243a32] md:pb-0"><SiteHeader />{title && <div className="bg-[#214b40] px-6 py-10 text-center text-[#f7f4ed] sm:py-12"><h1 className="font-serif text-3xl font-bold sm:text-4xl">{title}</h1></div>}{children}</main> }

