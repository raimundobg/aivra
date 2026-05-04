import { Box, Flex, Text } from '@chakra-ui/react'
import { useLocation, useNavigate } from 'react-router-dom'

const C_GREEN = '#3d5a3e'
const C_GRAY = '#9ca3af'

const TABS = [
  { path: '/dashboard', label: 'Inicio', Icon: HomeIcon },
  { path: '/pauta', label: 'Pauta', Icon: PautaIcon },
  { path: '/progreso', label: 'Progreso', Icon: ProgresoIcon },
  { path: '/chat', label: 'Chat', Icon: ChatIcon },
  { path: '/perfil', label: 'Perfil', Icon: ProfileIcon },
]

function HomeIcon({ active }: { active: boolean }) {
  const c = active ? C_GREEN : C_GRAY
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? c : 'none'} stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function PautaIcon({ active }: { active: boolean }) {
  const c = active ? C_GREEN : C_GRAY
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  )
}

function ProgresoIcon({ active }: { active: boolean }) {
  const c = active ? C_GREEN : C_GRAY
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  )
}

function ChatIcon({ active }: { active: boolean }) {
  const c = active ? C_GREEN : C_GRAY
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function ProfileIcon({ active }: { active: boolean }) {
  const c = active ? C_GREEN : C_GRAY
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <Box
      position="fixed" bottom={0} left={0} right={0} zIndex={200}
      display={{ base: 'block', md: 'none' }}
      bg="white" borderTopWidth="1px" borderColor="gray.100"
      shadow="0 -4px 20px rgba(0,0,0,0.06)"
      pb="env(safe-area-inset-bottom)"
    >
      <Flex>
        {TABS.map(({ path, label, Icon }) => {
          const active = location.pathname === path
          return (
            <Box
              key={path} flex={1} py={2.5}
              display="flex" flexDirection="column" alignItems="center" gap={0.5}
              cursor="pointer" onClick={() => navigate(path)}
              transition="all 0.15s" _active={{ bg: 'gray.50' }}
            >
              <Icon active={active} />
              <Text
                fontSize="9px" fontWeight={active ? '700' : '400'}
                color={active ? C_GREEN : C_GRAY} lineHeight="1"
              >
                {label}
              </Text>
            </Box>
          )
        })}
      </Flex>
    </Box>
  )
}
