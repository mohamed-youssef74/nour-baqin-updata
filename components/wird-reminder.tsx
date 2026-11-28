'use client'

import Link from 'next/link'
import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { localDate } from '@/lib/push-client'

// In-app daily wird reminder. Works while the app is open (web apps cannot ring when fully closed without a push server).
export function WirdReminder() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const check = () => {
      try {
        const r = JSON.parse(localStorage.getItem('nour-wird-reminder') || 'null')
        if (!r?.enabled) return setShow(false)
        const now = new Date(), today = localDate(now)
        if (localStorage.getItem('nour-wird-dismissed') === today) return setShow(false)
        const [h, m] = String(r.time || '20:00').split(':').map(Number)
        if (now.getHours() * 60 + now.getMinutes() < h * 60 + m) return setShow(false)
        const w = JSON.parse(localStorage.getItem('nour-wird') || 'null')
        const page = Number(JSON.parse(localStorage.getItem('nour-khatma-page') || '1'))
        const done = w && w.date === today ? page - w.start >= w.goal : false
        if (done) return setShow(false)
        setShow(true)
        if (r.notified !== today && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification('نورٌ باقٍ', { body: 'حان وقت وردك اليومي من القرآن', icon: '/icon-light-32x32.png' })
          localStorage.setItem('nour-wird-reminder', JSON.stringify({ ...r, notified: today }))
        }
      } catch {}
    }
    check(); const t = setInterval(check, 30000); return () => clearInterval(t)
  }, [])
  if (!show) return null
  const dismiss = () => { try { localStorage.setItem('nour-wird-dismissed', localDate()) } catch {} setShow(false) }
  return <div role="status" className="fixed inset-x-3 top-3 z-50 mx-auto flex max-w-md items-center gap-2 rounded-2xl border border-[#d8b66c] bg-[#fffdf8] p-3 text-center text-sm text-[#183d35] shadow-xl"><span className="flex-1">حان وقت وردك اليومي من القرآن. <Link href="/quran" className="font-bold text-[#a5823d]">افتح المصحف</Link></span><button type="button" onClick={dismiss} aria-label="إغلاق التنبيه" className="rounded-full p-1 text-[#557165] hover:bg-[#eef4ed]"><X className="size-4" /></button></div>
}
