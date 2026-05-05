import { useState } from 'react'
import { Box, Container, Flex, Text } from '@chakra-ui/react'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import { CheckInModal } from '../molecules/CheckInModal'

const C = { green: '#5F6F52', greenLight: '#eef2ea', cream: '#F9F4EF', border: 'rgba(95,111,82,0.15)', text: '#2D3319', muted: '#7a7264' }

const NAV_LINKS = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Mi Pauta', path: '/pauta' },
  { label: 'Hábitos', path: '/habitos' },
  { label: 'Progreso', path: '/progreso' },
  { label: 'Recetario', path: '/recetas' },
  { label: 'Chat', path: '/chat' },
] as const

const BOTTOM_NAV = [
  { label: 'Inicio', path: '/dashboard', icon: '🏠' },
  { label: 'Hábitos', path: '/habitos', icon: '✨' },
  { label: 'Plan', path: '/pauta', icon: '📋' },
  { label: 'Progreso', path: '/progreso', icon: '📊' },
] as const

export default function PatientNav() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [checkIn, setCheckIn] = useState(false)
  const [fabOpen, setFabOpen] = useState(false)
  const initials = (user?.displayName ?? user?.email ?? 'P').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  function handleFabAction(action: 'checkin' | 'r24') {
    setFabOpen(false)
    if (action === 'checkin') setCheckIn(true)
    else navigate('/r24')
  }

  return (
    <>
      {checkIn && user && <CheckInModal user={user} onClose={() => setCheckIn(false)} />}

      {/* Backdrop when FAB menu open */}
      {fabOpen && (
        <Box position="fixed" inset={0} zIndex={99} onClick={() => setFabOpen(false)} />
      )}

      {/* Desktop top nav */}
      <Box bg="white" borderBottomWidth="1px" borderColor={C.border} display={{ base: 'none', md: 'block' }}>
        <Container maxW="7xl">
          <Flex h={14} align="center" justify="space-between">
            <Flex align="center" gap={3}>
              <Box w={8} h={8} bg={C.green} borderRadius="lg"
                display="flex" alignItems="center" justifyContent="center">
                <Text color="white" fontWeight="800" fontSize="xs">N</Text>
              </Box>
              <Text color={C.text} fontFamily="heading" fontWeight="700">NuAI</Text>
            </Flex>

            <Flex gap={5} align="center">
              {NAV_LINKS.map(({ label, path }) => {
                const active = location.pathname === path
                return (
                  <RouterLink key={path} to={path} style={{
                    color: active ? C.green : C.muted,
                    fontSize: '13px', fontWeight: active ? 700 : 400,
                    textDecoration: 'none', transition: 'color 0.15s', whiteSpace: 'nowrap',
                  }}>
                    {label}
                  </RouterLink>
                )
              })}
              <RouterLink to="/r24" style={{ textDecoration: 'none' }}>
                <Box px={3} py={1.5} bg={C.greenLight} color={C.green} borderRadius="full"
                  fontSize="xs" fontWeight="600" cursor="pointer" transition="all 0.15s">
                  🍽️ R24
                </Box>
              </RouterLink>
              <Box
                px={3} py={1.5} bg={C.green} color="white" borderRadius="full"
                fontSize="xs" fontWeight="600" cursor="pointer"
                onClick={() => setCheckIn(true)} transition="all 0.15s"
              >
                + Check-in
              </Box>
            </Flex>

            <Box w={8} h={8} bg={C.green} borderRadius="full"
              display="flex" alignItems="center" justifyContent="center"
              cursor="pointer" onClick={() => navigate('/perfil')}>
              <Text fontSize="xs" fontWeight="700" color="white">{initials}</Text>
            </Box>
          </Flex>
        </Container>
      </Box>

      {/* Mobile top bar */}
      <Box bg="white" borderBottomWidth="1px" borderColor={C.border}
        display={{ base: 'flex', md: 'none' }}
        h={14} alignItems="center" px={4} justifyContent="space-between">
        <Flex align="center" gap={2}>
          <Box w={7} h={7} bg={C.green} borderRadius="lg"
            display="flex" alignItems="center" justifyContent="center">
            <Text color="white" fontWeight="800" fontSize="9px">N</Text>
          </Box>
          <Text color={C.text} fontFamily="heading" fontWeight="700" fontSize="sm">NuAI</Text>
        </Flex>
        <Flex align="center" gap={3}>
          <Box px={3} py={1} bg={C.greenLight} color={C.green} borderRadius="full"
            fontSize="10px" fontWeight="700">
            PREMIUM
          </Box>
          <Box w={7} h={7} bg={C.green} borderRadius="full"
            display="flex" alignItems="center" justifyContent="center"
            cursor="pointer" onClick={() => navigate('/perfil')}>
            <Text fontSize="9px" fontWeight="700" color="white">{initials}</Text>
          </Box>
        </Flex>
      </Box>

      {/* Mobile bottom nav */}
      <Box
        display={{ base: 'flex', md: 'none' }}
        position="fixed" bottom={0} left={0} right={0} zIndex={100}
        bg="white" borderTopWidth="1px" borderColor={C.border}
        pb="env(safe-area-inset-bottom)"
      >
        {/* FAB popup menu */}
        {fabOpen && (
          <Box position="absolute" bottom="70px" left="50%" transform="translateX(-50%)" zIndex={101}>
            <Flex direction="column" gap={2} align="center">
              <Box
                bg="white" borderRadius="xl" px={5} py={3} shadow="lg"
                borderWidth="1px" borderColor={C.border} cursor="pointer" whiteSpace="nowrap"
                onClick={() => handleFabAction('checkin')}
                _hover={{ bg: C.cream }}
                transition="all 0.15s"
              >
                <Flex align="center" gap={2}>
                  <Text fontSize="lg">😊</Text>
                  <Text fontSize="sm" fontWeight="600" color={C.text}>Cómo me siento hoy</Text>
                </Flex>
              </Box>
              <Box
                bg="white" borderRadius="xl" px={5} py={3} shadow="lg"
                borderWidth="1px" borderColor={C.border} cursor="pointer" whiteSpace="nowrap"
                onClick={() => handleFabAction('r24')}
                _hover={{ bg: C.cream }}
                transition="all 0.15s"
              >
                <Flex align="center" gap={2}>
                  <Text fontSize="lg">🍽️</Text>
                  <Text fontSize="sm" fontWeight="600" color={C.text}>Registro 24h</Text>
                </Flex>
              </Box>
            </Flex>
          </Box>
        )}

        <Flex w="full" align="center" justify="space-around" px={2} h={16}>
          {/* Left 2 */}
          {BOTTOM_NAV.slice(0, 2).map(({ label, path, icon }) => {
            const active = location.pathname === path
            return (
              <RouterLink key={path} to={path} style={{ textDecoration: 'none', flex: 1 }}>
                <Flex direction="column" align="center" py={1} gap={0.5}>
                  <Text fontSize="xl" lineHeight={1}>{icon}</Text>
                  <Text fontSize="9px" fontWeight={active ? 700 : 400}
                    color={active ? C.green : C.muted}>
                    {label}
                  </Text>
                </Flex>
              </RouterLink>
            )
          })}

          {/* Center FAB */}
          <Box flex={1} display="flex" justifyContent="center">
            <Box
              w={14} h={14} bg={fabOpen ? '#4a5740' : C.green} borderRadius="full"
              display="flex" alignItems="center" justifyContent="center"
              cursor="pointer" shadow="lg"
              onClick={() => setFabOpen(o => !o)}
              mt="-24px"
              borderWidth="3px" borderColor="white"
              transition="all 0.2s"
            >
              <Text fontSize="2xl" color="white" lineHeight={1}
                style={{ transform: fabOpen ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }}>
                +
              </Text>
            </Box>
          </Box>

          {/* Right 2 */}
          {BOTTOM_NAV.slice(2).map(({ label, path, icon }) => {
            const active = location.pathname === path
            return (
              <RouterLink key={path} to={path} style={{ textDecoration: 'none', flex: 1 }}>
                <Flex direction="column" align="center" py={1} gap={0.5}>
                  <Text fontSize="xl" lineHeight={1}>{icon}</Text>
                  <Text fontSize="9px" fontWeight={active ? 700 : 400}
                    color={active ? C.green : C.muted}>
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
