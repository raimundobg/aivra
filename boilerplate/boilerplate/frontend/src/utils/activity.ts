import { doc, updateDoc, arrayUnion } from 'firebase/firestore'
import { db } from '../config/firebase'

export function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

export async function markActiveToday(uid: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', uid), {
      activityDays: arrayUnion(todayStr()),
    })
  } catch {
    // non-blocking
  }
}

export function calcRacha(activityDays: string[]): number {
  if (!activityDays?.length) return 0
  const set = new Set(activityDays)
  const today = todayStr()
  const yesterday = (() => {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    return d.toISOString().split('T')[0]
  })()

  if (!set.has(today) && !set.has(yesterday)) return 0

  let racha = 0
  const cursor = new Date()
  if (!set.has(today)) cursor.setDate(cursor.getDate() - 1)

  while (racha < 366) {
    const dateStr = cursor.toISOString().split('T')[0]
    if (set.has(dateStr)) {
      racha++
      cursor.setDate(cursor.getDate() - 1)
    } else {
      break
    }
  }
  return racha
}
