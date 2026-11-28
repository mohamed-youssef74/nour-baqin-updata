'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { Bell, Check, RefreshCw } from 'lucide-react'
import { PageShell } from '@/components/site-header'
import { useNourStorage } from '@/lib/use-nour-storage'
import { disablePush, pushSupported, refreshPush, syncPush } from '@/lib/push-client'

const fallbackPrayers = [['الفجر', '05:12'], ['الشروق', '06:38'], ['الظهر', '12:04'], ['العصر', '15:18'], ['المغرب', '17:31'], ['العشاء', '18:50']]
const prayerKeys = [['الفجر', 'Fajr'], ['الشروق', 'Sunrise'], ['الظهر', 'Dhuhr'], ['العصر', 'Asr'], ['المغرب', 'Maghrib'], ['العشاء', 'Isha']]
const fetcher = (url: string) => fetch(url).then((response) => response.json())

export default function PrayerPage() {
  const { reminders, setReminders, ready } = useNourStorage()
  const [pushState, setPushState] = useState('')
  const patch = (r: typeof reminders) => ({ prayer: { on: r.prayer }, adhkar: { on: r.adhkar, time: r.time } })
  // Keep the server in sync when the page opens (only if this device already allowed notifications).
  useEffect(() => { if (ready) refreshPush(patch(reminders)).catch(() => undefined) }, [ready, reminders.prayer, reminders.adhkar, reminders.time]) // eslint-disable-line react-hooks/exhaustive-deps
  const update = async (next: typeof reminders) => {
    setReminders(next)
    if (!next.prayer && !next.adhkar) { disablePush(patch(next)).catch(() => undefined); setPushState(''); return }
    if (!pushSupported()) { setPushState('unsupported'); return }
    if (Notification.permission === 'default') await Notification.requestPermission().catch(() => undefined)
    if (Notification.permission !== 'granted') { setPushState('denied'); return }
    try { setPushState((await syncPush(patch(next))) ? 'on' : 'error') } catch { setPushState('error') }
  }
  const { data, isLoading, error, mutate } = useSWR('https://api.aladhan.com/v1/timingsByCity?city=Cairo&country=Egypt&method=5', fetcher, { refreshInterval: 21600000, revalidateOnFocus: true })
  const timings = data?.data?.timings
  const prayers = prayerKeys.map(([name, key], index) => [name, timings?.[key]?.slice(0, 5) ?? fallbackPrayers[index][1]])

  return <PageShell title="مواقيت الصلاة والتنبيهات">
    <section className="mx-auto grid max-w-5xl gap-6 px-5 py-10 lg:grid-cols-[1.3fr_.7fr]">
      <div className="rounded-[2rem] bg-white p-6 shadow-sm sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-sm text-[#557165]">مواقيت اليوم — القاهرة</p><h2 className="mt-2 font-serif text-3xl font-bold text-[#183d35]">أوقات تذكّر وطمأنينة</h2></div><button type="button" onClick={() => mutate()} className="rounded-full p-2 text-[#557165] hover:bg-[#eef4ed]" aria-label="تحديث المواقيت" title="تحديث المواقيت"><RefreshCw className={`size-5 ${isLoading ? 'animate-spin' : ''}`} /></button></div><div className="mt-6 grid gap-3 sm:grid-cols-2">{prayers.map(([name, time], index) => <div key={name} className={`flex items-center justify-between rounded-2xl px-4 py-4 ${index === 0 ? 'bg-[#183d35] text-white' : 'bg-[#eef4ed] text-[#183d35]'}`}><span>{name}</span><strong dir="ltr">{time}</strong></div>)}</div><p className="mt-4 text-xs text-[#557165]">{error ? 'تعذر التحديث، نعرض آخر مواقيت متاحة.' : 'تتحدث المواقيت تلقائيًا كل يوم عند فتح الموقع.'}</p></div>
      <div className="rounded-[2rem] bg-[#dce8dc] p-6 text-[#183d35] sm:p-8"><Bell className="size-10 text-[#a5823d]" /><h2 className="mt-5 font-serif text-2xl font-bold">تنبيهات يومية</h2><p className="mt-3 text-sm leading-7 text-[#557165]">اختر مواعيد قربك من الله.. وأدم لسانك بذكره.</p><label className="mt-6 flex cursor-pointer items-center justify-between rounded-2xl bg-white/60 p-4"><span>تذكير الأذكار</span><input type="checkbox" checked={reminders.adhkar} onChange={(event) => update({ ...reminders, adhkar: event.target.checked })} className="size-5 accent-[#183d35]" /></label><label className="mt-3 flex cursor-pointer items-center justify-between rounded-2xl bg-white/60 p-4"><span>تذكير الصلاة</span><input type="checkbox" checked={reminders.prayer} onChange={(event) => update({ ...reminders, prayer: event.target.checked })} className="size-5 accent-[#183d35]" /></label><label className="mt-3 block rounded-2xl bg-white/60 p-4"><span className="text-sm">وقت أذكار الصباح</span><input type="time" value={reminders.time} onChange={(event) => update({ ...reminders, time: event.target.value })} className="mt-2 block w-full rounded-xl border-0 bg-white px-3 py-2 text-[#183d35]" /></label><p className="mt-3 text-xs leading-6 text-[#557165]">أذكار المساء تصلك وقت العصر، وتنبيه كل صلاة يصلك عند موعدها، حتى والتطبيق مغلق.</p>{pushState && <p className="mt-2 text-xs text-[#a5823d]">{pushState === 'on' ? 'تم تفعيل التنبيهات على هذا الجهاز.' : pushState === 'denied' ? 'الإشعارات محظورة من إعدادات المتصفح، فعّلها ثم أعد المحاولة.' : pushState === 'unsupported' ? 'هذا المتصفح لا يدعم التنبيهات خارج التطبيق.' : 'تعذر تفعيل التنبيه الآن.'}</p>}<p className="mt-5 flex items-center gap-2 text-sm text-[#557165]"><Check className="size-4" /> الإعدادات محفوظة تلقائيًا</p></div>
    </section>
  </PageShell>
}
