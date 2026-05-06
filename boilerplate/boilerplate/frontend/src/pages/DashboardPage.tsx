import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Button, Container, Flex, Grid, Heading, Input, Stack, Text, Badge } from '@chakra-ui/react'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../providers/AuthProvider'
import { useHabits } from '../hooks/useHabits'
import { calcRacha } from '../utils/activity'
import { generarPautaBasica } from '../services/groq'
import AppLayout from '../app/AppLayout'
import PatientNav from '../organisms/PatientNav'
import { WelcomeModal } from '../molecules/WelcomeModal'
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

const OBJETIVOS = [
  { v: 'bajar_peso', label: '⬇️ Bajar peso' },
  { v: 'ganar_masa', label: '💪 Músculo' },
  { v: 'mantener', label: '⚖️ Mantener' },
  { v: 'salud', label: '❤️ Salud' },
  { v: 'rendimiento', label: '🏃 Rendimiento' },
]

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

function sleepToHours(value: number): string {
  if (value === 0) return '—'
  const hours = 4 + (value / 10) * 5
  return `${hours.toFixed(1)}h`
}

function CircularProgress({ value, size = 100 }: { value: number; size?: number }) {
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

function MealCard({ name, description, kcal, onClick }: { name: string; description: string; kcal?: number; onClick: () => void }) {
  return (
    <Flex onClick={onClick} align="center" gap={3} p={3} borderRadius="xl" bg="white"
      borderWidth="1px" borderColor={C.border} cursor="pointer"
      _hover={{ borderColor: C.green, shadow: 'sm' }} transition="all 0.15s">
      <Box w={12} h={12} borderRadius="lg" bg={C.greenLight}
        display="flex" alignItems="center" justifyContent="center" flexShrink={0}>
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

function SummaryItem({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <Flex direction="column" align="center" gap={1} p={3} borderRadius="xl" bg={C.cream}>
      <Text fontSize="xl">{icon}</Text>
      <Text fontSize="xs" color={C.muted} fontWeight="500">{label}</Text>
      <Text fontFamily="heading" fontSize="sm" fontWeight="700" color={color}>{value}</Text>
    </Flex>
  )
}

function StatRow({ label, value, emphasized }: { label: string; value: string; emphasized?: boolean }) {
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
  const rawName = user?.displayName || user?.email?.split('@')[0] || 'Paciente'
  const firstName = rawName.split(' ')[0]

  const [pauta, setPauta] = useState<PautaGenerada | null>(null)
  const [r24Today, setR24Today] = useState<Record<string, unknown> | null>(null)
  const { habits, adherence } = useHabits(user?.uid)
  const [showWelcome, setShowWelcome] = useState(false)
  const [profileIncomplete, setProfileIncomplete] = useState(false)
  const [showDetailedCTA, setShowDetailedCTA] = useState(false)
  const [activityDays, setActivityDays] = useState<string[]>([])
  const [checkInDone, setCheckInDone] = useState(false)
  const [generatingPauta, setGeneratingPauta] = useState(false)
  const [pautaObjeto, setPautaObjeto] = useState('salud')
  const [pautaPeso, setPautaPeso] = useState('')
  const [pautaTalla, setPautaTalla] = useState('')

  useEffect(() => {
    if (!user) return
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      const data = snap.data()
      const seen = data?.basicProfileSeen ?? false
      const complete = data?.basicProfileCompleted ?? false
      if (!seen) setShowWelcome(true)
      if (!complete) setProfileIncomplete(true)
      if (data?.activityDays) setActivityDays(data.activityDays as string[])
      if (!data?.detailedProfileCompleted) setShowDetailedCTA(true)
    })
  }, [user])

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

  useEffect(() => {
    if (!user) return
    const today = new Date().toISOString().split('T')[0]
    getDoc(doc(db, 'users', user.uid, 'checkins', today)).then(snap => {
      setCheckInDone(snap.exists())
    })
  }, [user])

  const totalMeals = pauta?.comidas.length ?? 5
  const completedMeals = r24Today?.meals
    ? Object.values(r24Today.meals as Record<string, unknown[]>).filter(arr => Array.isArray(arr) && arr.length > 0).length
    : 0
  const todayKcal = r24Today?.meals
    ? Math.round(
        Object.values(r24Today.meals as Record<string, Array<{ kcal_total: number }>>)
          .flat()
          .reduce((sum, f) => sum + (f.kcal_total ?? 0), 0)
      )
    : 0
  const targetKcal = pauta?.macros?.calorias ?? 2000
  const kcalPct = Math.min(Math.round((todayKcal / targetKcal) * 100), 100)
  const aguaVasos = habits.agua > 0 ? Math.round((habits.agua / 10) * 8) : 0
  const racha = calcRacha(activityDays)

  const adherenceColor = adherence >= 70 ? C.green : adherence >= 40 ? C.amber : C.warning

  async function handleGenerarPauta() {
    if (!user || generatingPauta || !pautaPeso || !pautaTalla) return
    setGeneratingPauta(true)
    try {
      const p = await generarPautaBasica({
        nombre: firstName,
        objetivo: pautaObjeto,
        peso: parseFloat(pautaPeso),
        talla: parseFloat(pautaTalla),
      })
      await setDoc(doc(db, 'users', user.uid, 'pauta', 'current'), {
        ...p, generadoPor: 'ia', generadoAt: serverTimestamp(),
      })
      setPauta(p)
    } catch (e) {
      console.error(e)
    } finally {
      setGeneratingPauta(false)
    }
  }

  return (
    <AppLayout>
      <PatientNav />

      {showWelcome && user && (
        <WelcomeModal user={user} onClose={() => { setShowWelcome(false); setProfileIncomplete(false) }} />
      )}

      <Box bg={C.cream} minH="calc(100dvh - 56px)">
        <Container maxW="container.md" pt={6} pb={28}>

          {!showWelcome && profileIncomplete && (
            <Box mb={4} p={4} borderRadius="xl" bg="white"
              borderWidth="1px" borderColor={C.border}
              borderLeftWidth="3px" borderLeftColor={C.green}>
              <Flex justify="space-between" align="center" gap={3}>
                <Box>
                  <Text fontSize="sm" fontWeight="700" color={C.text}>Completa tu perfil 🌿</Text>
                  <Text fontSize="xs" color={C.muted}>Ayúdanos a personalizar tu experiencia — nombre, objetivo, peso y talla</Text>
                </Box>
                <Button size="xs" bg={C.green} color="white" borderRadius="lg"
                  _hover={{ opacity: 0.9 }} flexShrink={0}
                  onClick={() => setShowWelcome(true)}>
                  Completar
                </Button>
              </Flex>
            </Box>
          )}

          <Flex justify="space-between" align="flex-start" mb={5}>
            <Box>
              <Heading fontFamily="heading" fontSize={{ base: '2xl', md: '3xl' }} fontWeight="800" color={C.text} lineHeight="1.1">
                ¡Hola, {firstName}! 👋
              </Heading>
              <Text fontSize="sm" color={C.muted} mt={1} textTransform="capitalize">{formatDate()}</Text>
            </Box>
            <Flex align="center" justify="center" w={11} h={11} borderRadius="full"
              bg={C.green} color="white" fontFamily="heading" fontWeight="700" fontSize="md"
              cursor="pointer" onClick={() => navigate('/perfil')}
              _hover={{ bg: C.greenDark }} transition="all 0.15s">
              {firstName.charAt(0).toUpperCase()}
            </Flex>
          </Flex>

          {/* CTA formulario detallado */}
          {showDetailedCTA && (
            <Box
              mb={4} p={4} borderRadius="2xl" cursor="pointer"
              background={`linear-gradient(135deg, ${C.green} 0%, ${C.greenDark} 100%)`}
              onClick={() => navigate('/onboarding')}
              _hover={{ opacity: 0.95 }} transition="opacity 0.15s"
              position="relative" overflow="hidden"
            >
              <Box position="absolute" top="-20px" right="-20px" w="100px" h="100px"
                borderRadius="full" bg="whiteAlpha.100" />
              <Flex align="center" justify="space-between" gap={3}>
                <Box flex={1}>
                  <Text fontFamily="heading" fontWeight="800" color="white" fontSize="md" mb={0.5}>
                    Saca el máximo provecho de NuAI ✨
                  </Text>
                  <Text fontSize="xs" color="whiteAlpha.800" lineHeight="1.5">
                    Completa tu perfil clínico — NuAI generará una pauta 10x más precisa para ti
                  </Text>
                </Box>
                <Box px={3} py={2} bg="white" borderRadius="xl" flexShrink={0}>
                  <Text fontSize="xs" fontWeight="700" color={C.green}>Empezar →</Text>
                </Box>
              </Flex>
            </Box>
          )}

          {/* Plan de hoy */}
          <Box bg="white" borderRadius="2xl" p={5} borderWidth="1px" borderColor={C.border} mb={4}>
            <Flex justify="space-between" align="center" mb={4}>
              <Text fontFamily="heading" fontWeight="700" color={C.text} fontSize="md">Tu plan de hoy</Text>
              <Badge bg={C.green} color="white" px={2.5} py={0.5} borderRadius="full" fontSize="9px" fontWeight="700">PREMIUM</Badge>
            </Flex>

            {pauta?.comidas && pauta.comidas.length > 0 ? (
              <Stack gap={2}>
                {pauta.comidas.map((comida, i) => (
                  <MealCard key={i} name={comida.nombre} description={comida.items[0] ?? 'Sin definir'}
                    kcal={comida.kcal} onClick={() => navigate('/pauta')} />
                ))}
                <Button onClick={() => navigate('/pauta')} variant="ghost" size="sm" mt={1}
                  color={C.green} fontWeight="600" _hover={{ bg: C.greenLight }}>
                  Ver plan completo →
                </Button>
              </Stack>
            ) : (
              <Stack gap={3}>
                <Text fontSize="sm" color={C.muted} textAlign="center">Genera tu pauta personalizada con IA</Text>
                <Flex gap={2} flexWrap="wrap">
                  {OBJETIVOS.map(o => (
                    <Box key={o.v} px={3} py={1.5} borderRadius="full" cursor="pointer"
                      fontSize="xs" fontWeight="500" borderWidth="1px"
                      bg={pautaObjeto === o.v ? C.green : 'white'}
                      color={pautaObjeto === o.v ? 'white' : C.muted}
                      borderColor={pautaObjeto === o.v ? C.green : C.border}
                      onClick={() => setPautaObjeto(o.v)} transition="all 0.15s">
                      {o.label}
                    </Box>
                  ))}
                </Flex>
                <Flex gap={2}>
                  <Input value={pautaPeso} onChange={e => setPautaPeso(e.target.value)}
                    placeholder="Peso (kg)" type="number" borderRadius="xl"
                    borderColor={C.border} _focus={{ borderColor: C.green, boxShadow: 'none' }} />
                  <Input value={pautaTalla} onChange={e => setPautaTalla(e.target.value)}
                    placeholder="Talla (cm)" type="number" borderRadius="xl"
                    borderColor={C.border} _focus={{ borderColor: C.green, boxShadow: 'none' }} />
                </Flex>
                <Button bg={C.green} color="white" borderRadius="full" size="sm" fontWeight="700"
                  _hover={{ opacity: 0.9 }} loading={generatingPauta}
                  disabled={!pautaPeso || !pautaTalla} onClick={handleGenerarPauta}>
                  🤖 Generar mi pauta
                </Button>
              </Stack>
            )}
          </Box>

          {/* Calorías de hoy */}
          <Box bg="white" borderRadius="2xl" p={5} borderWidth="1px" borderColor={C.border} mb={4}>
            <Text fontFamily="heading" fontWeight="700" color={C.text} fontSize="md" mb={4}>
              Calorías de hoy
            </Text>
            <Flex align="center" gap={5} mb={4}>
              <CircularProgress value={kcalPct} size={100} />
              <Stack gap={2.5} flex={1}>
                <StatRow label="Consumidas" value={`${todayKcal} kcal`} emphasized />
                <StatRow label="Meta" value={`${targetKcal} kcal`} />
                <StatRow label="Agua" value={`${aguaVasos} / 8 vasos`} />
              </Stack>
            </Flex>
            <Grid templateColumns="repeat(4, 1fr)" gap={2}>
              <SummaryItem icon="🔥" label="Racha" value={racha > 0 ? `${racha}d` : '—'} color={racha > 0 ? C.green : C.muted} />
              <SummaryItem icon="🍽️" label="Comidas" value={`${completedMeals}/${totalMeals}`} color={C.text} />
              <SummaryItem icon="😊" label="Check-in" value={checkInDone ? '✓' : '—'} color={checkInDone ? C.green : C.muted} />
              <SummaryItem icon="📊" label="Adherencia" value={adherence > 0 ? `${adherence}%` : '—'} color={adherence > 0 ? adherenceColor : C.muted} />
            </Grid>
          </Box>

          {/* Resumen diario */}
          <Box bg="white" borderRadius="2xl" p={5} borderWidth="1px" borderColor={C.border} mb={4}>
            <Text fontFamily="heading" fontWeight="700" color={C.text} fontSize="md" mb={4}>
              Resumen diario
            </Text>
            <Grid templateColumns="repeat(4, 1fr)" gap={2.5}>
              <SummaryItem icon="🔥" label="Energía"
                value={valueToLabel(habits.actividad)} color={valueToColor(habits.actividad)} />
              <SummaryItem icon="🫧" label="Digestión"
                value={valueToLabel(habits.digestion)} color={valueToColor(habits.digestion)} />
              <SummaryItem icon="🧘" label="Estrés"
                value={valueToLabel(habits.estres, 'negative')} color={valueToColor(habits.estres, 'negative')} />
              <SummaryItem icon="😴" label="Sueño"
                value={sleepToHours(habits.sueno)} color={valueToColor(habits.sueno)} />
            </Grid>
            <Button onClick={() => navigate('/habitos')} variant="ghost" size="sm" mt={3} w="full"
              color={C.green} fontWeight="600" _hover={{ bg: C.greenLight }}>
              Registrar hábitos de hoy →
            </Button>
          </Box>

          {/* CTA Chat */}
          <Box bg={C.green} borderRadius="2xl" p={5}
            backgroundImage={`linear-gradient(135deg, ${C.green} 0%, ${C.greenDark} 100%)`}>
            <Flex align="center" justify="space-between" gap={3}>
              <Box flex={1}>
                <Text fontFamily="heading" fontWeight="700" color="white" fontSize="md" mb={1}>¿Tienes una duda?</Text>
                <Text fontSize="xs" color="whiteAlpha.800">Tu nutricionista o el asistente IA te responden.</Text>
              </Box>
              <Button onClick={() => navigate('/chat')} bg="white" color={C.green}
                borderRadius="full" size="sm" fontWeight="700" _hover={{ bg: C.greenLight }}>
                💬 Chatear
              </Button>
            </Flex>
          </Box>

        </Container>
      </Box>
    </AppLayout>
  )
}
