# Nour Baqin (نورٌ باقٍ)

Quran and adhkar web app, built as an ongoing charity (صدقة جارية) in memory of my grandmother. Arabic RTL interface.

Live demo: https://nour-baqin-updata.vercel.app/

## Features

- Read the full Quran in Uthmani script (loaded from the AlQuran Cloud API)
- Listen to recitation with several reciters, playback speed control
- Reading settings: font size and line height
- Bookmarks for ayahs and surahs
- Morning and evening adhkar, with a daily dhikr counter
- Duaa collection with favorites
- Personal library: saved favorites and bookmarks in one place
- Khatma tracker: save your last page and follow progress out of 604 pages
- Daily activity stats
- Prayer times (AlAdhan API)
- Search in the Quran text
- Installable as a PWA (add to home screen, standalone display)

## Tech stack

- Next.js 16, React 19, TypeScript
- Tailwind CSS 4, shadcn/ui, lucide-react icons
- SWR for data fetching
- AlQuran Cloud API (Quran text), QuranicAudio / mp3quran (recitation audio), AlAdhan API (prayer times)
- Progress, bookmarks, favorites and settings stored in the browser's Local Storage

## Getting started

```bash
pnpm install
pnpm dev
```

Then open http://localhost:3000

## Notes and limitations

- Quran text, recitation audio and prayer times come from external APIs and need an internet connection.
- The service worker caches the app shell (home page and icons) so the app opens faster, but full offline Quran reading is not supported.
- Progress and bookmarks are stored per browser; they do not sync between devices.
