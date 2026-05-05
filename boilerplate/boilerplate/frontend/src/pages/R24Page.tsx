import { useState, useEffect } from 'react'
import { Box, Container } from '@chakra-ui/react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import AppLayout from '../app/AppLayout'
import PatientNav from '../organisms/PatientNav'
import { R24Editor } from '../organisms/R24Editor'
import { useAuth } from '../providers/AuthProvider'
import type { PautaGenerada } from '../services/groq'

const C = { cream: '#F9F4EF', border: 'rgba(95,111,82,0.15)' }

export default function R24Page() {
  const { user } = useAuth()
  const [targetKcal, setTargetKcal] = useState<number | undefined>(undefined)

  useEffect(() => {
    if (!user) return
    getDoc(doc(db, 'users', user.uid, 'pauta', 'current')).then(snap => {
      if (snap.exists()) {
        const p = snap.data() as PautaGenerada
        setTargetKcal(p.macros?.calorias)
      }
    })
  }, [user])

  if (!user) return null

  return (
    <AppLayout>
      <PatientNav />
      <Box bg={C.cream} minH="calc(100dvh - 56px)" pb={24}>
        <Container maxW="4xl" py={8}>
          <R24Editor patientId={user.uid} targetGet={targetKcal} />
        </Container>
      </Box>
    </AppLayout>
  )
}
