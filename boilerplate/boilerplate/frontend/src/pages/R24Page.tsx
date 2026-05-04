import { Box, Container } from '@chakra-ui/react'
import AppLayout from '../app/AppLayout'
import PatientNav from '../organisms/PatientNav'
import { R24Editor } from '../organisms/R24Editor'
import { useAuth } from '../providers/AuthProvider'

const C = { cream: '#F9F4EF', border: 'rgba(95,111,82,0.15)' }

export default function R24Page() {
  const { user } = useAuth()
  if (!user) return null

  return (
    <AppLayout>
      <PatientNav />
      <Box bg={C.cream} minH="calc(100dvh - 56px)" pb={24}>
        <Container maxW="4xl" py={8}>
          <R24Editor patientId={user.uid} />
        </Container>
      </Box>
    </AppLayout>
  )
}
