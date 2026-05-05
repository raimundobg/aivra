import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../config/firebase'
import { markActiveToday } from '../utils/activity'

export interface HabitLog {
  agua: number
  sueno: number
  estres: number
  actividad: number
  frutasVerduras: number
  digestion: number
}

export interface WeekDay {
  day: string
  date: string
  agua: number
  sueno: number
  estres: number
  actividad: number
  frutasVerduras: number
  digestion: number
  logged: boolean
}

const EMPTY: HabitLog = { agua: 0, sueno: 0, estres: 0, actividad: 0, frutasVerduras: 0, digestion: 0 }
const DAY_LABELS = ['D', 'L', 'M', 'X', 'J', 'V', 'S']

function dateKey(offset = 0): string {
  const d = new Date()
  d.setDate(d.getDate() - offset)
  return d.toISOString().split('T')[0]
}

function last7Keys(): Array<{ date: string; day: string }> {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return { date: d.toISOString().split('T')[0], day: DAY_LABELS[d.getDay()] }
  })
}

export function useHabits(uid: string | undefined) {
  const [habits, setHabits] = useState<HabitLog>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [weekHistory, setWeekHistory] = useState<WeekDay[]>([])
  const [adherence, setAdherence] = useState(0)
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    if (!uid) return
    getDoc(doc(db, 'users', uid, 'habits', dateKey(0))).then(snap => {
      if (snap.exists()) setHabits(snap.data() as HabitLog)
      setLoading(false)
    })
  }, [uid])

  useEffect(() => {
    if (!uid) return
    const keys = last7Keys()
    Promise.all(keys.map(({ date }) => getDoc(doc(db, 'users', uid, 'habits', date)))).then(snaps => {
      const history: WeekDay[] = snaps.map((snap, i) => {
        const data = snap.exists() ? (snap.data() as HabitLog) : EMPTY
        return { ...keys[i], ...data, logged: snap.exists() }
      })
      setWeekHistory(history)

      const loggedDays = history.filter(d => d.logged)
      if (loggedDays.length > 0) {
        const avg = loggedDays.reduce((sum, d) => {
          const dayScore = (d.agua + d.sueno + d.estres + d.actividad + d.frutasVerduras + d.digestion) / 6
          return sum + dayScore
        }, 0) / loggedDays.length
        setAdherence(Math.round((avg / 10) * 100))
      }

      let s = 0
      for (let i = history.length - 1; i >= 0; i--) {
        if (history[i].logged) s++
        else break
      }
      setStreak(s)
    })
  }, [uid])

  function update(k: keyof HabitLog, v: number) {
    setHabits(prev => ({ ...prev, [k]: v }))
  }

  async function save() {
    if (!uid) return
    setSaving(true)
    await setDoc(doc(db, 'users', uid, 'habits', dateKey(0)), {
      ...habits,
      savedAt: serverTimestamp(),
    })
    await markActiveToday(uid)
    setSaving(false)
  }

  return { habits, update, save, saving, loading, weekHistory, adherence, streak }
}
