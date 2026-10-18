'use client'

import { useEffect, useState } from 'react'
import type { DailyStat, SavedBookmark, SavedFavorite } from './content'

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) as T : fallback
  } catch {
    return fallback
  }
}

export function useNourStorage() {
  const today = new Date().toISOString().slice(0, 10)
  const [ready, setReady] = useState(false)
  const [counts, setCounts] = useState<number[]>([])
  const [favorites, setFavorites] = useState<SavedFavorite[]>([])
  const [bookmarks, setBookmarks] = useState<SavedBookmark[]>([])
  const [stats, setStats] = useState<DailyStat[]>([])
  const [khatmaPage, setKhatmaPage] = useState(1)
  const [reminders, setReminders] = useState({ adhkar: true, prayer: true, time: '08:00' })

  useEffect(() => {
    setCounts(readJson('nour-counts', []))
    setFavorites(readJson('nour-favorites', []))
    setBookmarks(readJson('nour-bookmarks', []))
    setStats(readJson('nour-daily-stats', []))
    setKhatmaPage(readJson('nour-khatma-page', 1))
    setReminders(readJson('nour-reminders', { adhkar: true, prayer: true, time: '08:00' }))
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    localStorage.setItem('nour-counts', JSON.stringify(counts))
    localStorage.setItem('nour-favorites', JSON.stringify(favorites))
    localStorage.setItem('nour-bookmarks', JSON.stringify(bookmarks))
    localStorage.setItem('nour-daily-stats', JSON.stringify(stats))
    localStorage.setItem('nour-daily-count', String(stats.find((item) => item.date === today)?.count || 0))
    localStorage.setItem('nour-khatma-page', JSON.stringify(khatmaPage))
    localStorage.setItem('nour-reminders', JSON.stringify(reminders))
  }, [ready, counts, favorites, bookmarks, stats, khatmaPage, reminders, today])

  const increment = (index: number) => {
    setCounts((current) => {
      const next = [...current]
      next[index] = (next[index] || 0) + 1
      return next
    })
    setStats((current) => current.some((item) => item.date === today)
      ? current.map((item) => item.date === today ? { ...item, count: item.count + 1 } : item)
      : [...current, { date: today, count: 1 }])
  }

  return { counts, favorites, setFavorites, bookmarks, setBookmarks, stats, increment, today, ready, khatmaPage, setKhatmaPage, reminders, setReminders }
}
