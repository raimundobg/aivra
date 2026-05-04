import { Box, Container, Flex, Text } from '@chakra-ui/react'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'

const C = { green: '#5F6F52', greenLight: '#eef2ea', cream: '#F9F4EF', border: 'rgba(95,111,82,0.15)', text: '#2D3319', muted: '#7a7264' }

const NAV_LINKS = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Mi Pauta', path: '/pauta' },
  { label: 'Registro 24h', path: '/r24' },
  { label: 'Progreso', path: '/progreso' },
  { label: 'Recetario', path: '/recetas' },
  { label: 'Chat', path: '/chat' },
] as const

const BOTTOM_NAV = [
  { label: 'Home', path: '/dashboard', emoji: '🏠' },
  { label: 'Pauta', path: '/pauta', emoji: '📋' },
  { label: 'R24', path: '/r24', emoji: '🍽️' },
  { label: 'Progreso', path: '/progreso', emoji: '📊' },
  { label: 'Compras', path: '/lista-compras', emoji: '🛒' },
  { label: 'Chat', path: '/chat', emoji: '💬' },
] as const

export default function PatientNav() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const initials = (user?.displayName ?? 'P').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <>
      {/* Desktop top nav */}
      <Box bg="white" borderBottomWidth="1px" borderColor={C.border} display={{ base: 'none', md: 'block' }}>
        <Container maxW="7xl">
          <Flex h={14} align="center" justify="space-between">
            <Flex align="center" gap={3}>
              <Box w={8} h={8} bg={C.green} borderRadius="full"
                display="flex" alignItems="center" justifyContent="center">
                <Text color="white" fontWeight="800" fontSize="xs">AI</Text>
              </Box>
              <Text color={C.text} fontFamily="heading" fontWeight="700">Aivra</Text>
            </Flex>

            <Flex gap={5} align="center">
              {NAV_LINKS.map(({ label, path }) => {
                const active = location.pathname === path
                return (
                  <RouterLink
                    key={path}
                    to={path}
                    style={{
                      color: active ? C.green : C.muted,
                      fontSize: '13px',
                      fontWeight: active ? 700 : 400,
                      textDecoration: 'none',
                      transition: 'color 0.15s',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {label}
                  </RouterLink>
                )
              })}
            </Flex>

            <Box
              w={8} h={8} bg={C.green} borderRadius="full"
              display="flex" alignItems="center" justifyContent="center"
              cursor="pointer" onClick={() => navigate('/perfil')}
            >
              <Text fontSize="xs" fontWeight="700" color="white">{initials}</Text>
            </Box>
          </Flex>
        </Container>
      </Box>

      {/* Mobile top bar */}
      <Box bg="white" borderBottomWidth="1px" borderColor={C.border} display={{ base: 'flex', md: 'none' }}
        h={14} alignItems="center" px={4} justifyContent="space-between">
        <Flex align="center" gap={2}>
          <Box w={7} h={7} bg={C.green} borderRadius="full"
            display="flex" alignItems="center" justifyContent="center">
            <Text color="white" fontWeight="800" fontSize="9px">AI</Text>
          </Box>
          <Text color={C.text} fontFamily="heading" fontWeight="700" fontSize="sm">Aivra</Text>
        </Flex>
        <Box w={7} h={7} bg={C.green} borderRadius="full"
          display="flex" alignItems="center" justifyContent="center"
          cursor="pointer" onClick={() => navigate('/perfil')}>
          <Text fontSize="9px" fontWeight="700" color="white">{initials}</Text>
        </Box>
      </Box>

      {/* Mobile bottom nav */}
      <Box
        display={{ base: 'flex', md: 'none' }}
        position="fixed" bottom={0} left={0} right={0} zIndex={100}
        bg="white" borderTopWidth="1px" borderColor={C.border}
        pb="env(safe-area-inset-bottom)"
        overflowX="auto"
      >
        <Flex w="full" justify="space-around" px={1}>
          {BOTTOM_NAV.map(({ label, path, emoji }) => {
            const active = location.pathname === path
            return (
              <RouterLink key={path} to={path} style={{ textDecoration: 'none', flex: '0 0 auto' }}>
                <Flex direction="column" align="center" py={2} px={3} gap={0.5}>
                  <Text fontSize="lg" lineHeight={1}>{emoji}</Text>
                  <Text fontSize="9px" fontWeight={active ? 700 : 400}
                    color={active ? C.green : C.muted} whiteSpace="nowrap">
                    {label}
                  </Text>
                </Flex>
              </RouterLink>
            )
          })}
        </Flex>
      </Box>
    </>
  )
}
