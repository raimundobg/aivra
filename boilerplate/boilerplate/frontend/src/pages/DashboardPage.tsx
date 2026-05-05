import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Button, Container, Flex, Grid, Heading, Stack, Text, Badge } from '@chakra-ui/react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../providers/AuthProvider'
import { useHabits } from '../hooks/useHabits'
import AppLayout from '../app/AppLayout'
import PatientNav from '../organisms/PatientNav'
import type { PautaGenerada } from '../services/groq'

const C = {
  green: '#5F6F52',
  greenDark: '#4a5740',
  greenLight: '#eef2ea',
  cream: '#F9F4EF',
  beige: '#E9DFD3',
  rose: '#C6A28F',
  border: 'rgba(95,111,82,0.15)',
  text: '#2D3319',
  muted: '#7a7264',
  warning: '#d97706',
  amber: '#fbbf24',
}

const MEAL_EMOJIS: Record<string, string> = {
  desayuno: '🥣',
  'colación am': '🍎',
  'colacion am': '🍎',
  almuerzo: '🥗',
  'colación pm': '🥜',
  'colacion pm': '🥜',
  cena: '🍲',
  snack: '🍓',
}

function getMealEmoji(name: string): string {
  const key = name.toLowerCase().trim()
  return MEAL_EMOJIS[key] ?? '🍽️'
}

function formatDate(): string {
  const d = new Date()
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
  return `${days[d.getDay()]} ${d.getDate()} de ${months[d.getMonth()]}`
}

// Map 1-10 habit value → label
function valueToLabel(value: number, type: 'positive' | 'negative' = 'positive'): string {
  if (value === 0) return '—'
  if (type === 'positive') {
    if (value >= 7) return 'Alta'
    if (value >= 4) return 'Media'
    return 'Baja'
  }
  if (value >= 7) return 'Bajo'
  if (value >= 4) return 'Medio'
  return 'Alto'
}

function valueToColor(value: number, type: 'positive' | 'negative' = 'positive'): string {
  if (value === 0) return C.muted
  if (type === 'positive') {
    if (value >= 7) return C.green
    if (value >= 4) return C.amber
    return C.warning
  }
  if (value >= 7) return C.green
  if (value >= 4) return C.amber
  return C.warning
}

// Map sleep value (1-10) → approximate hours
function sleepToHours(value: number): string {
  if (value === 0) return '—'
  const hours = 4 + (value / 10) * 5 // 1→4.5h, 10→9h
  return `${hours.toFixed(1)}h`
}

interface CircularProgressProps {
  value: number // 0-100
  size?: number
}

function CircularProgress({ value, size = 100 }: CircularProgressProps) {
  const stroke = 10
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  return (
    <Box position="relative" w={`${size}px`} h={`${size}px`}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke={C.greenLight} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={radius} stroke={C.green} strokeWidth={stroke} fill="none"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <Flex position="absolute" inset={0} align="center" justify="center" direction="column">
        <Text fontFamily="heading" fontWeight="800" fontSize="2xl" color={C.green} lineHeight="1">{value}%</Text>
      </Flex>
    </Box>
  )
}

interface MealCardProps {
  name: string
  description: string
  kcal?: number
  onClick: () => void
}

function MealCard({ name, description, kcal, onClick }: MealCardProps) {
  return (
    <Flex
      onClick={onClick}
      align="center"
      gap={3}
      p={3}
      borderRadius="xl"
      bg="white"
      borderWidth="1px"
      borderColor={C.border}
      cursor="pointer"
      _hover={{ borderColor: C.green, shadow: 'sm' }}
      transition="all 0.15s"
    >
      <Box
        w={12} h={12} borderRadius="lg" bg={C.greenLight}
        display="flex" alignItems="center" justifyContent="center" flexShrink={0}
      >
        <Text fontSize="2xl">{getMealEmoji(name)}</Text>
      </Box>
      <Box flex={1} minW={0}>
        <Text fontSize="xs" fontWeight="700" color={C.green} textTransform="uppercase" letterSpacing="0.03em">{name}</Text>
        <Text fontSize="sm" color={C.text} fontWeight="500" truncate>{description}</Text>
        {kcal && <Text fontSize="xs" color={C.muted}>{kcal} kcal</Text>}
      </Box>
      <Text color={C.muted} fontSize="xl" lineHeight="1">›</Text>
    </Flex>
  )
}

interface SummaryItemProps {
  icon: string
  label: string
  value: string
  color: string
}

function SummaryItem({ icon, label, value, color }: SummaryItemProps) {
  return (
    <Flex direction="column" align="center" gap={1} p={3} borderRadius="xl" bg={C.cream}>
      <Text fontSize="xl">{icon}</Text>
      <Text fontSize="xs" color={C.muted} fontWeight="500">{label}</Text>
      <Text fontFamily="heading" fontSize="sm" fontWeight="700" color={color}>{value}</Text>
    </Flex>
  )
}

interface StatRowProps {
  label: string
  value: string
  emphasized?: boolean
}

function StatRow({ label, value, emphasized }: StatRowProps) {
  return (
    <Flex justify="space-between" align="center">
      <Text fontSize="sm" color={C.muted}>{label}</Text>
      <Text fontSize="sm" fontWeight={emphasized ? '700' : '600'} color={emphasized ? C.green : C.text}>{value}</Text>
    </Flex>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const firstName = (user?.displayName ?? user?.email ?? 'Paciente').split(' ')[0]

  const [pauta, setPauta] = useState<PautaGenerada | null>(null)
  const [r24Today, setR24Today] = useState<Record<string, unknown> | null>(null)
  const { habits, adherence } = useHabits(user?.uid)

  useEffect(() => {
    if (!user) return
    getDoc(doc(db, 'users', user.uid, 'pauta', 'current')).then(snap => {
      if (snap.exists()) setPauta(snap.data() as PautaGenerada)
    })
  }, [user])

  useEffect(() => {
    if (!user) return
    const today = new Date().toISOString().split('T')[0]
    getDoc(doc(db, 'users', user.uid, 'r24', today)).then(snap => {
      if (snap.exists()) setR24Today(snap.data())
    })
  }, [user])

  // Calculate compliance metrics
  const totalMeals = pauta?.comidas.length ?? 4
  const completedMeals = r24Today?.meals
    ? Object.values(r24Today.meals as Record<string, unknown[]>).filter(arr => Array.isArray(arr) && arr.length > 0).length
    : 0
  const aguaVasos = habits.agua > 0 ? Math.round((habits.agua / 10) * 8) : 0
  const aguaMeta = 8

  const cumplimientoPct = Math.round(
    ((completedMeals / totalMeals) * 0.6 + (aguaVasos / aguaMeta) * 0.2 + (adherence / 100) * 0.2) * 100
  )

  return (
    <AppLayout>
      <PatientNav />

      <Box bg={C.cream} minH="calc(100dvh - 56px)">
        <Container maxW="container.md" pt={6} pb={28}>
          {/* Header: greeting + date */}
          <Flex justify="space-between" align="flex-start" mb={5}>
            <Box>
              <Heading fontFamily="heading" fontSize={{ base: '2xl', md: '3xl' }} fontWeight="800" color={C.text} lineHeight="1.1">
                ¡Hola, {firstName}! 👋
              </Heading>
              <Text fontSize="sm" color={C.muted} mt={1} textTransform="capitalize">{formatDate()}</Text>
            </Box>
            <Flex
              align="center" justify="center" w={11} h={11} borderRadius="full"
              bg={C.green} color="white" fontFamily="heading" fontWeight="700" fontSize="md"
              cursor="pointer" onClick={() => navigate('/perfil')}
              _hover={{ bg: C.greenDark }} transition="all 0.15s"
            >
              {firstName.charAt(0).toUpperCase()}
            </Flex>
          </Flex>

          {/* Plan de hoy */}
          <Box bg="white" borderRadius="2xl" p={5} borderWidth="1px" borderColor={C.border} mb={4}>
            <Flex justify="space-between" align="center" mb={4}>
              <Text fontFamily="heading" fontWeight="700" color={C.text} fontSize="md">Tu plan de hoy</Text>
              <Badge bg={C.green} color="white" px={2.5} py={0.5} borderRadius="full" fontSize="9px" fontWeight="700">
                PREMIUM
              </Badge>
            </Flex>

            {pauta?.comidas && pauta.comidas.length > 0 ? (
              <Stack gap={2}>
                {pauta.comidas.map((comida, i) => (
                  <MealCard
                    key={i}
                    name={comida.nombre}
                    description={comida.items[0] ?? 'Sin definir'}
                    kcal={comida.kcal}
                    onClick={() => navigate('/pauta')}
                  />
                ))}
                <Button
                  onClick={() => navigate('/pauta')}
                  variant="ghost" size="sm" mt={1}
                  color={C.green} fontWeight="600"
                  _hover={{ bg: C.greenLight }}
                >
                  Ver plan completo →
                </Button>
              </Stack>
            ) : (
              <Box textAlign="center" py={6}>
                <Text fontSize="sm" color={C.muted} mb={3}>Aún no tienes una pauta activa.</Text>
                <Button
                  onClick={() => navigate('/onboarding')}
                  bg={C.green} color="white" borderRadius="full" size="sm" fontWeight="700"
                  _hover={{ opacity: 0.9 }}
                >
                  Generar mi primera pauta
                </Button>
              </Box>
            )}
          </Box>

          {/* Cumplimiento del plan */}
          <Box bg="white" borderRadius="2xl" p={5} borderWidth="1px" borderColor={C.border} mb={4}>
            <Text fontFamily="heading" fontWeight="700" color={C.text} fontSize="md" mb={4}>
              Cumplimiento del plan
            </Text>
            <Flex align="center" gap={5}>
              <CircularProgress value={cumplimientoPct} size={100} />
              <Stack gap={3} flex={1}>
                <StatRow label="Comidas completadas" value={`${completedMeals} / ${totalMeals}`} />
                <StatRow label="Adherencia hábitos" value={`${adherence}%`} />
                <StatRow label="Agua" value={`${aguaVasos} / ${aguaMeta} vasos`} />
              </Stack>
            </Flex>
          </Box>

          {/* Resumen diario */}
          <Box bg="white" borderRadius="2xl" p={5} borderWidth="1px" borderColor={C.border} mb={4}>
            <Text fontFamily="heading" fontWeight="700" color={C.text} fontSize="md" mb={4}>
              Resumen diario
            </Text>
            <Grid templateColumns="repeat(4, 1fr)" gap={2.5}>
              <SummaryItem
                icon="🔥"
                label="Energía"
                value={valueToLabel(habits.actividad, 'positive')}
                color={valueToColor(habits.actividad, 'positive')}
              />
              <SummaryItem
                icon="🫧"
                label="Digestión"
                value={valueToLabel(habits.digestion, 'positive')}
                color={valueToColor(habits.digestion, 'positive')}
              />
              <SummaryItem
                icon="🧘"
                label="Estrés"
                value={valueToLabel(habits.estres, 'negative')}
                color={valueToColor(habits.estres, 'negative')}
              />
              <SummaryItem
                icon="😴"
                label="Sueño"
                value={sleepToHours(habits.sueno)}
                color={valueToColor(habits.sueno, 'positive')}
              />
            </Grid>
            <Button
              onClick={() => navigate('/habitos')}
              variant="ghost" size="sm" mt={3} w="full"
              color={C.green} fontWeight="600"
              _hover={{ bg: C.greenLight }}
            >
              Registrar hábitos de hoy →
            </Button>
          </Box>

          {/* CTA Chat */}
          <Box
            bg={C.green} borderRadius="2xl" p={5}
            backgroundImage={`linear-gradient(135deg, ${C.green} 0%, ${C.greenDark} 100%)`}
          >
            <Flex align="center" justify="space-between" gap={3}>
              <Box flex={1}>
                <Text fontFamily="heading" fontWeight="700" color="white" fontSize="md" mb={1}>
                  ¿Tienes una duda?
                </Text>
                <Text fontSize="xs" color="whiteAlpha.800">
                  Tu nutricionista o el asistente IA te responden.
                </Text>
              </Box>
              <Button
                onClick={() => navigate('/chat')}
                bg="white" color={C.green}
                borderRadius="full" size="sm" fontWeight="700"
                _hover={{ bg: C.greenLight }}
              >
                💬 Chatear
              </Button>
            </Flex>
          </Box>
        </Container>
      </Box>
    </AppLayout>
  )
}
