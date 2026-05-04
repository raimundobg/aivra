import { useState, useEffect } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase'

export interface PautaItem {
  tiempo: string
  descripcion: string
  completado: boolean
}

const DEFAULT_PAUTA: PautaItem[] = [
  { tiempo: 'Desayuno', descripcion: 'Completa tu onboarding para recibir tu pauta personalizada', completado: false },
]

export function usePauta(uid: string | undefined) {
  const [pauta, setPauta] = useState<PautaItem[]>(DEFAULT_PAUTA)
  const [macros, setMacros] = useState({ calorias: 0, proteina: 0, carbs: 0, grasas: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) return
    getDoc(doc(db, 'users', uid, 'pauta', 'current')).then(snap => {
      if (snap.exists()) {
        const data = snap.data()
        if (data.items) setPauta(data.items)
        if (data.macros) setMacros(data.macros)
      }
      setLoading(false)
    })
  }, [uid])

  function toggle(index: number) {
    setPauta(prev => prev.map((p, i) => i === index ? { ...p, completado: !p.completado } : p))
  }

  return { pauta, toggle, macros, loading }
}
