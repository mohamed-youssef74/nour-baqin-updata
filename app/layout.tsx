import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Amiri_Quran } from 'next/font/google'
import './globals.css'

const quranFont = Amiri_Quran({ subsets: ['arabic'], weight: '400', variable: '--font-quran', display: 'swap' })

export const metadata: Metadata = {
  title: 'نورٌ باقٍ | صدقة جارية',
  description: 'اقرأ واستمع للقرآن الكريم والأذكار اليومية',
  generator: 'M.yossef74',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: "try{if(localStorage.getItem('nour-theme')==='dark')document.documentElement.classList.add('dark')}catch(e){}" }} /></head>
      <body className={`antialiased ${quranFont.variable}`}>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
