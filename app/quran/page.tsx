'use client'
import { useEffect, useState } from 'react'
import { BookOpen, LoaderCircle, Settings2 } from 'lucide-react'
import { PageShell } from '@/components/site-header'
type Ayah={numberInSurah:number;text:string;audio?:string}
type Surah={number:number;name:string;ayahs:Ayah[]}

type QuranSettings={fontSize:number;lineHeight:number;reciter:string}
const defaultSettings: QuranSettings={fontSize:22,lineHeight:2.5,reciter:'mishaari_raashid_al_3afaasee'}
const reciters=[{value:'mishaari_raashid_al_3afaasee',label:'مشاري راشد العفاسي'},{value:'abdul_basit_murattal',label:'عبد الباسط عبد الصمد'}]

export default function QuranPage(){
  const [surahs,setSurahs]=useState<Surah[]>([])
  const [selected,setSelected]=useState(1)
  const [loading,setLoading]=useState(false)
  const [audioLoading,setAudioLoading]=useState(false)
  const [audioSrc,setAudioSrc]=useState('')
  const [showSettings,setShowSettings]=useState(false)
  const [settings,setSettings]=useState<QuranSettings>(defaultSettings)
  const [settingsReady,setSettingsReady]=useState(false)

  useEffect(()=>{
    try{
      const saved=localStorage.getItem('nour-quran-settings')
      if(saved)setSettings({...defaultSettings,...JSON.parse(saved)})
    }catch{}
    setSettingsReady(true)
  },[])
  useEffect(()=>{
    if(settingsReady)localStorage.setItem('nour-quran-settings',JSON.stringify(settings))
  },[settings,settingsReady])
  const updateSettings=(patch:Partial<QuranSettings>)=>setSettings(current=>({...current,...patch}))
  const load=async()=>{
    if(surahs.length)return
    setLoading(true)
    try{
      const r=await fetch('https://api.alquran.cloud/v1/quran/quran-uthmani')
      const j=await r.json()
      setSurahs(j.data.surahs)
    }finally{setLoading(false)}
  }
  const surah=surahs[selected-1]
  const loadRecitation=()=>{
    if(!surah)return
    setAudioLoading(true)
    setAudioSrc(`https://download.quranicaudio.com/quran/${settings.reciter}/${String(selected).padStart(3,'0')}.mp3`)
    setAudioLoading(false)
  }
  return <PageShell title="القرآن الكريم"><section className="mx-auto max-w-4xl px-6 py-16 text-center"><BookOpen className="mx-auto text-[#a5823d]"/><p className="mt-3 text-[#557165]">اقرأ واستمع واهدِ الثواب لروح جدتي الغالية</p><div className="mt-6 flex justify-center"><button onClick={()=>setShowSettings(value=>!value)} className="inline-flex items-center gap-2 rounded-full border border-[#a5823d] px-4 py-2 font-bold text-[#557165]" aria-expanded={showSettings}><Settings2/>إعدادات القراءة</button></div>{showSettings&&<div className="mx-auto mt-4 grid max-w-2xl gap-4 rounded-2xl border border-[#d8b66c] bg-[#f7f4ed] p-5 text-right"><label className="grid gap-2 font-bold text-[#183d35]">حجم الخط: {settings.fontSize}px<input type="range" min="18" max="34" step="1" value={settings.fontSize} onChange={e=>updateSettings({fontSize:Number(e.target.value)})} /></label><label className="grid gap-2 font-bold text-[#183d35]">تباعد الأسطر: {settings.lineHeight}<input type="range" min="1.8" max="3.5" step="0.1" value={settings.lineHeight} onChange={e=>updateSettings({lineHeight:Number(e.target.value)})} /></label><label className="grid gap-2 font-bold text-[#183d35]">القارئ<select value={settings.reciter} onChange={e=>updateSettings({reciter:e.target.value})} className="rounded-xl border border-[#d8b66c] bg-white p-2">{reciters.map(reciter=><option key={reciter.value} value={reciter.value}>{reciter.label}</option>)}</select></label><button onClick={()=>setSettings(defaultSettings)} className="justify-self-start text-sm font-bold text-[#a5823d]">إعادة الإعدادات الافتراضية</button></div>}<button onClick={load} disabled={loading} className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#d8b66c] px-6 py-3 font-bold text-[#183d35]">{loading?<LoaderCircle className="animate-spin"/>:<BookOpen/>}{loading?'جاري تحميل المصحف...':surahs.length?'المصحف مفتوح':'فتح المصحف كاملًا'}</button>{surahs.length>0&&<><select value={selected} onChange={e=>{setSelected(Number(e.target.value));setAudioSrc('')}} className="mt-8 w-full rounded-2xl border bg-[#214b40] p-4 font-serif text-lg text-white">{surahs.map(s=><option key={s.number} value={s.number}>{s.number}. {s.name}</option>)}</select>{surah&&<><button onClick={loadRecitation} disabled={audioLoading} className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#a5823d] px-5 py-2 font-bold text-[#557165]">{audioLoading?<LoaderCircle className="animate-spin"/>:<span aria-hidden="true">▶</span>}{audioLoading?'جاري تجهيز التلاوة...':'تشغيل تلاوة السورة كاملة'}</button>{audioSrc&&<div className="mx-auto mt-5 max-w-2xl rounded-2xl bg-[#e9dfc8] p-4"><p className="mb-3 font-bold text-[#183d35]">تلاوة سورة {surah.name} كاملة</p><audio className="h-10 w-full" controls preload="metadata" src={audioSrc} aria-label={`تلاوة سورة ${surah.name} كاملة`}/></div>}<div className="mt-6 grid gap-3 text-right">{surah.ayahs.map(a=><article key={a.numberInSurah} className="rounded-2xl bg-[#183d35] p-5 text-[#f7f4ed]"><p className="font-serif" style={{fontSize:`${settings.fontSize}px`,lineHeight:settings.lineHeight}}>{a.text} <span className="text-sm text-[#e8c878]">({a.numberInSurah})</span></p></article>)}</div></>}</>}</section></PageShell>}
