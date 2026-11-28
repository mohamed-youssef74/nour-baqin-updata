// Draws a verse card on a canvas and shares or downloads it as PNG.
export async function shareVerseImage(opts: { text: string; surahName: string; ayah: number; light?: boolean }) {
  const W = 1080, H = 1080
  const c = document.createElement('canvas'); c.width = W; c.height = H
  const ctx = c.getContext('2d')!
  const bg = ctx.createLinearGradient(0, 0, W, H)
  const L = !!opts.light
  const col = L ? { a: '#fffdf8', b: '#f1ead8', line: '#d8b66c', text: '#183d35', accent: '#a5823d', sub: '#557165' } : { a: '#183d35', b: '#0f2a23', line: '#d8b66c', text: '#f7f4ed', accent: '#e8c878', sub: '#c5d3c7' }
  bg.addColorStop(0, col.a); bg.addColorStop(1, col.b)
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = col.line; ctx.lineWidth = 4; ctx.strokeRect(40, 40, W - 80, H - 80)
  ctx.strokeStyle = 'rgba(216,182,108,.55)'; ctx.lineWidth = 1.5; ctx.strokeRect(58, 58, W - 116, H - 116)
  ctx.direction = 'rtl'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  // The app's Quran font is loaded by Next under a generated name; read it from the CSS variable.
  const css = getComputedStyle(document.documentElement).getPropertyValue('--font-quran').trim()
  const family = `${css ? css + ',' : ''}"Amiri Quran","Amiri",serif`
  try { await document.fonts.load(`40px ${family}`, opts.text) } catch {}
  const words = opts.text.split(/\s+/)
  let size = 64, lines: string[] = []
  const maxW = W - 220
  for (; size >= 30; size -= 4) {
    ctx.font = `${size}px ${family}`
    lines = []; let cur = ''
    for (const w of words) { const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w } else cur = t }
    if (cur) lines.push(cur)
    if (lines.length * size * 1.9 < H - 460) break
  }
  const lh = size * 1.9, top = H / 2 - (lines.length * lh) / 2 + lh / 2 - 20
  ctx.fillStyle = col.text
  lines.forEach((l, i) => ctx.fillText(l, W / 2, top + i * lh))
  ctx.fillStyle = col.accent; ctx.font = `38px ${family}`
  ctx.fillText(`﴿ ${opts.surahName} — الآية ${opts.ayah} ﴾`, W / 2, H - 210)
  ctx.fillStyle = col.sub; ctx.font = `30px ${family}`
  ctx.fillText('نورٌ باقٍ | صدقة جارية', W / 2, H - 140)
  const blob: Blob = await new Promise((res) => c.toBlob((b) => res(b!), 'image/png'))
  const file = new File([blob], `ayah-${opts.surahName}-${opts.ayah}.png`, { type: 'image/png' })
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file] }); return 'shared' } catch { return 'cancelled' }
  }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name; a.click()
  return 'downloaded'
}
