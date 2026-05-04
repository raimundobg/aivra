import { Box, Flex, Text } from '@chakra-ui/react'

interface Patient {
  uid: string
  displayName: string
  email: string
  onboardingCompleted: boolean
  plan?: string
}

interface PatientCardRowProps {
  patient: Patient
  active: boolean
  onClick: () => void
}

export function PatientCardRow({ patient, active, onClick }: PatientCardRowProps) {
  const initials = patient.displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  return (
    <Box
      px={4} py={3} cursor="pointer" borderRadius="xl"
      bg={active ? '#eef2ea' : 'transparent'}
      _hover={{ bg: '#eef2ea' }}
      onClick={onClick}
      transition="all 0.15s"
    >
      <Flex align="center" gap={3}>
        <Box
          w={9} h={9} borderRadius="full" flexShrink={0}
          bg={active ? '#5F6F52' : '#E9DFD3'}
          display="flex" alignItems="center" justifyContent="center"
        >
          <Text fontSize="xs" fontWeight="700" color={active ? 'white' : '#7a7264'}>{initials}</Text>
        </Box>
        <Box flex={1} minW={0}>
          <Text fontSize="sm" fontWeight="600" color="#2D3319" truncate>{patient.displayName}</Text>
          <Text fontSize="xs" color="#7a7264" truncate>{patient.email}</Text>
        </Box>
        <Box w={2} h={2} borderRadius="full" bg={patient.onboardingCompleted ? '#5F6F52' : '#f59e0b'} flexShrink={0} />
      </Flex>
    </Box>
  )
}
