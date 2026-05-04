import { Box, Button, Container, Flex, Text } from '@chakra-ui/react'

interface Props {
  name: string
  onLogout: () => void
}

export default function DashboardNav({ name, onLogout }: Props) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  return (
    <Box bg="white" borderBottomWidth="1px" borderColor="gray.100" shadow="sm">
      <Container maxW="6xl">
        <Flex h={14} align="center" justify="space-between">
          <Flex align="center" gap={2}>
            <Box w={7} h={7} bg="brand.solid" borderRadius="md" display="flex" alignItems="center" justifyContent="center">
              <Text color="white" fontWeight="800" fontSize="xs" fontFamily="heading">A</Text>
            </Box>
            <Text fontFamily="heading" fontWeight="700" fontSize="md" color="gray.800">Aivra</Text>
          </Flex>
          <Flex align="center" gap={3}>
            <Box w={8} h={8} bg="brand.muted" borderRadius="full" display="flex" alignItems="center" justifyContent="center">
              <Text fontSize="xs" fontWeight="700" color="brand.solid">{initials}</Text>
            </Box>
            <Text fontSize="sm" color="gray.600" display={{ base: 'none', sm: 'block' }}>{name}</Text>
            <Button size="xs" variant="ghost" color="gray.400" borderRadius="lg" onClick={onLogout}>Salir</Button>
          </Flex>
        </Flex>
      </Container>
    </Box>
  )
}
