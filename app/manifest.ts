import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'نورٌ باقٍ | صدقة جارية',
    short_name: 'نورٌ باقٍ',
    description: 'مساحة محبة وذكر ودعاء .',
    start_url: '/',
    display: 'standalone',
    background_color: '#f7f4ed',
    theme_color: '#183d35',
    lang: 'ar',
    dir: 'rtl',
    icons: [
      { src: '/icon-light-32x32.png', sizes: '32x32', type: 'image/png' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  }
}
