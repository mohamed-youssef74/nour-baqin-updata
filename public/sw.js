const VERSION = 'v2'
const SHELL = 'nour-shell-' + VERSION
const RUNTIME = 'nour-runtime-' + VERSION
const PAGES = ['/', '/quran', '/adhkar', '/duaa', '/khatma', '/prayer', '/library', '/stats', '/search', '/memory', '/quran.json', '/tafsir.json', '/stories', '/icon.svg', '/icon-light-32x32.png', '/apple-icon.png']

async function precache() {
  const cache = await caches.open(SHELL)
  const assets = new Set()
  await Promise.all(PAGES.map(async (u) => {
    try {
      const res = await fetch(u)
      if (!res.ok) return
      await cache.put(u, res.clone())
      if ((res.headers.get('content-type') || '').includes('text/html')) {
        const html = await res.text()
        for (const m of html.matchAll(/\/_next\/static\/[^"'\\\s)<>]+/g)) assets.add(m[0])
      }
    } catch (e) {}
  }))
  await Promise.all([...assets].map((a) => cache.add(a).catch(() => undefined)))
}

self.addEventListener('install', (event) => {
  event.waitUntil(precache())
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('nour-') && k !== SHELL && k !== RUNTIME && k !== 'nour-audio-v1').map((k) => caches.delete(k)))).then(() => self.clients.claim())
  )
})

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  try {
    const res = await fetch(request)
    if (res.ok) cache.put(request, res.clone())
    return res
  } catch (e) {
    return (await cache.match(request)) || (await caches.match(request)) || (await caches.match(request, { ignoreSearch: true })) || Response.error()
  }
}

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.hostname === 'api.aladhan.com') {
    event.respondWith(networkFirst(req, RUNTIME))
    return
  }
  if (url.origin !== self.location.origin) return // audio and other cross-origin: not intercepted
  if (req.headers.has('range')) return
  if (url.pathname === '/quran.json' || url.pathname === '/tafsir.json' || url.pathname.startsWith('/_next/static/')) {
    event.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => { if (res.ok) { const c = res.clone(); caches.open(RUNTIME).then((ca) => ca.put(req, c)) } return res })))
    return
  }
  if (req.mode === 'navigate') {
    event.respondWith(networkFirst(req, RUNTIME).then((res) => res.type === 'error' ? caches.match('/') : res))
    return
  }
  event.respondWith(networkFirst(req, RUNTIME))
})
