'use client'
import { useState } from 'react'
import { Heart } from 'lucide-react'
import { PageShell } from '@/components/site-header'
import { duaaItems } from '@/lib/content'
import { useNourStorage } from '@/lib/use-nour-storage'
export default function DuaaPage(){const [index,setIndex]=useState(0);const {favorites,setFavorites}=useNourStorage();const id=`duaa-${index}`;const saved=favorites.some(x=>x.id===id);return <PageShell title="الأدعية"><section className="mx-auto max-w-4xl px-6 py-16 text-center"><p className="text-[#557165]">اختر دعاءً عامًا وشاركه مع من تحب</p><article className="mt-8 rounded-[2rem] border border-[#dce5dc] bg-white p-8 shadow-sm sm:p-12"><p className="font-serif text-2xl font-bold leading-[2] text-[#385447]">{duaaItems[index]}</p><div className="mt-8 flex flex-wrap justify-center gap-3"><button onClick={()=>setIndex((index+1)%duaaItems.length)} className="rounded-full border px-5 py-3 font-bold">دعاء آخر</button><button onClick={()=>setFavorites(x=>saved?x.filter(y=>y.id!==id):[...x,{id,type:'duaa',text:duaaItems[index]}])} className="inline-flex items-center gap-2 rounded-full border px-5 py-3 font-bold"><Heart fill={saved?'currentColor':'none'}/> {saved?'محفوظ':'حفظ الدعاء'}</button></div></article></section></PageShell>}
