export type QAyah = { numberInSurah: number; text: string; page: number }
export type QSurah = { number: number; name: string; ayahs: QAyah[] }

let cache: Promise<QSurah[]> | null = null

// Quran text is bundled with the app (/quran.json) so it works offline.
export function loadQuran(): Promise<QSurah[]> {
  if (!cache) {
    cache = fetch('/quran.json')
      .then((r) => { if (!r.ok) throw new Error('quran.json'); return r.json() })
      .then((data: { n: number; name: string; a: [number, string, number][] }[]) =>
        data.map((s) => ({ number: s.n, name: s.name, ayahs: s.a.map(([numberInSurah, text, page]) => ({
          numberInSurah,
          // the basmala is shown as a heading, not as part of the first verse
          text: numberInSurah === 1 && s.n !== 1 && s.n !== 9 && text.startsWith('بِسْمِ') ? text.split(' ').slice(4).join(' ') : text.replace(/^\uFEFF/, ''),
          page,
        })) })))
      .catch((e) => { cache = null; throw e })
  }
  return cache
}

export const AUDIO_CACHE = 'nour-audio-v1'

export type Reciter = { value: string; label: string; source: 'quranicaudio' | 'mp3quran' }

export function audioUrl(reciter: Reciter, surah: number) {
  const file = String(surah).padStart(3, '0')
  return reciter.source === 'mp3quran'
    ? `https://server8.mp3quran.net/${reciter.value}/${file}.mp3`
    : `https://download.quranicaudio.com/quran/${reciter.value}/${file}.mp3`
}

export async function isAudioSaved(url: string) {
  if (typeof caches === 'undefined') return false
  return Boolean(await (await caches.open(AUDIO_CACHE)).match(url))
}
export async function saveAudio(url: string, onProgress?: (p: number) => void) {
  const res = await fetch(url, { mode: 'cors' })
  if (!res.ok || !res.body) throw new Error('download failed')
  const total = Number(res.headers.get('content-length')) || 0
  const reader = res.body.getReader()
  const chunks: Uint8Array[] = []
  let got = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value); got += value.length
    if (total) onProgress?.(got / total)
  }
  const blob = new Blob(chunks as BlobPart[], { type: 'audio/mpeg' })
  await (await caches.open(AUDIO_CACHE)).put(url, new Response(blob, { headers: { 'Content-Type': 'audio/mpeg' } }))
}
export async function removeAudio(url: string) {
  await (await caches.open(AUDIO_CACHE)).delete(url)
}
export async function savedAudioBlobUrl(url: string) {
  const hit = await (await caches.open(AUDIO_CACHE)).match(url)
  return hit ? URL.createObjectURL(await hit.blob()) : null
}

let tafsirCache: Promise<string[][]> | null = null
// Tafsir al-Muyassar (King Fahd Complex), bundled for offline use.
export function loadTafsir(): Promise<string[][]> {
  if (!tafsirCache) tafsirCache = fetch('/tafsir.json').then((r) => { if (!r.ok) throw new Error('tafsir'); return r.json() }).catch((e) => { tafsirCache = null; throw e })
  return tafsirCache
}
