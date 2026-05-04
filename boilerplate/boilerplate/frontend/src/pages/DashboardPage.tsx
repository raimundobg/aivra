import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Button, Container, Flex, Grid, Heading, Stack, Text } from '@chakra-ui/react'
import { collection, doc, query, orderBy, limit, onSnapshot, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../providers/AuthProvider'
import { useHabits } from '../hooks/useHabits'
import AppLayout from '../app/AppLayout'
import PatientNav from '../organisms/PatientNav'
import { generarMenuSemanal } from '../services/groq'
import type { MenuDia, PautaGenerada } from '../services/groq'

const PROGRAM_DAYS = 30

const C = { green: '#3d5a3e', greenLight: '#f0f4f0', greenMid: '#6b8f6c', tan: '#8b6914', cream: '#faf9f7', border: '#e8e4df', text: '#1a1a1a', muted: '#6b6b6b' }

const mockTareas = [
  'Sube tus mediciones el próximo lunes',
  'Entrenamiento mañana',
  'Agenda tu consulta de control',
]

interface Medicion {
  fecha: string
  peso: string
  cintura: string
  cadera: string
  pecho: string
  brazo: string
  muslo: string
}

interface MacroTarget {
  label: string
  actual: number
  meta: number
  color: string
}

function MacroBar({ label, actual, meta, color }: MacroTarget) {
  const pct = Math.min((actual / meta) * 100, 100)
  return (
    <Box>
      <Flex justify="space-between" mb={1}>
        <Text fontSize="sm" color={color} fontWeight="500">{label}</Text>
        <Text fontSize="sm" color={C.muted}>{actual}/{meta}g</Text>
      </Flex>
      <Box h={2} bg="#f0ece6" borderRadius="full" overflow="hidden">
        <Box h="full" borderRadius="full" style={{ width: `${pct}%`, background: color, transition: 'width 0.5s' }} />
      </Box>
    </Box>
  )
}

function ProgramBar({ dia, total }: { dia: number; total: number }) {
  const pct = (dia / total) * 100
  return (
    <Box bg="white" borderRadius="2xl" p={5} borderWidth="1px" borderColor={C.border} mb={5}>
      <Flex justify="space-between" align="center" mb={3}>
        <Text fontSize="sm" color={C.muted}>Programa 1 Mes + Seguimiento</Text>
        <Text fontSize="xs" color={C.muted} bg="#f5f0ea" px={3} py={1} borderRadius="full">
          Día {dia} de {total}
        </Text>
      </Flex>
      <Box h={2.5} bg="#f0ece6" borderRadius="full" overflow="hidden" mb={3}>
        <Box h="full" borderRadius="full" style={{ width: `${pct}%`, background: C.green, transition: 'width 0.5s' }} />
      </Box>
      <Text fontSize="xs" color={C.green} fontWeight="500">{total - dia} días restantes para completar tu programa</Text>
    </Box>
  )
}

const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const firstName = (user?.displayName ?? user?.email ?? 'Paciente').split(' ')[0]

  const [mediciones, setMediciones] = useState<Medicion[]>([])
  const [macros, setMacros] = useState<MacroTarget[]>([])
  const [loadingMed, setLoadingMed] = useState(true)
  const [programDay, setProgramDay] = useState(1)
  const { adherence, streak } = useHabits(user?.uid)

  const [menu, setMenu] = useState<MenuDia[] | null>(null)
  const [menuLoading, setMenuLoading] = useState(false)
  const [menuDay, setMenuDay] = useState(0)
  const [menuError, setMenuError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      const createdAt = snap.data()?.createdAt?.toDate() as Date | undefined
      if (createdAt) {
        const msPerDay = 1000 * 60 * 60 * 24
        const day = Math.min(Math.max(Math.floor((Date.now() - createdAt.getTime()) / msPerDay) + 1, 1), PROGRAM_DAYS)
        setProgramDay(day)
      }
    })
  }, [user])

  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'users', user.uid, 'mediciones'),
      orderBy('timestamp', 'desc'),
      limit(4)
    )
    return onSnapshot(q, snap => {
      const rows = snap.docs.map(d => {
        const data = d.data()
        const ts: Date = data.timestamp?.toDate() ?? new Date()
        const fecha = ts.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' }).replace('.', '')
        return {
          fecha,
          peso: `${data.peso} kg`,
          cintura: `${data.cintura} cm`,
          cadera: `${data.cadera} cm`,
          pecho: `${data.pecho} cm`,
          brazo: `${data.brazo} cm`,
          muslo: `${data.muslo} cm`,
        }
      }).reverse()
      setMediciones(rows)
      setLoadingMed(false)
    })
  }, [user])

  useEffect(() => {
    if (!user) return
    getDoc(doc(db, 'users', user.uid, 'pauta', 'current')).then(snap => {
      if (!snap.exists()) return
      const data = snap.data()
      const m = data.macros ?? {}
      setMacros([
        { label: 'Proteína', actual: 0, meta: m.proteinas ?? 120, color: C.green },
        { label: 'Carbohidratos', actual: 0, meta: m.carbos ?? 200, color: C.tan },
        { label: 'Grasas', actual: 0, meta: m.grasas ?? 55, color: '#c2852a' },
      ])
    })
  }, [user])

  useEffect(() => {
    if (!user) return
    getDoc(doc(db, 'users', user.uid, 'menu', 'current')).then(snap => {
      if (!snap.exists()) return
      const data = snap.data()
      const generadoAt = data.generadoAt?.toDate() as Date | undefined
      if (generadoAt) {
        const msPerDay = 1000 * 60 * 60 * 24
        const daysOld = (Date.now() - generadoAt.getTime()) / msPerDay
        if (daysOld <= 7) {
          setMenu(data.dias as MenuDia[])
        }
      }
    })
  }, [user])

  async function handleGenerarMenu() {
    if (!user || menuLoading) return
    setMenuLoading(true)
    setMenuError(null)
    try {
      const pautaSnap = await getDoc(doc(db, 'users', user.uid, 'pauta', 'current'))
      if (!pautaSnap.exists()) { setMenuError('Necesitas una pauta activa para generar el menú.'); return }
      const intakeSnap = await getDoc(doc(db, 'users', user.uid, 'intake', 'form'))
      const restricciones = intakeSnap.data()?.restricciones ?? []
      const dias = await generarMenuSemanal(pautaSnap.data() as PautaGenerada, restricciones)
      await setDoc(doc(db, 'users', user.uid, 'menu', 'current'), { dias, generadoAt: serverTimestamp() })
      setMenu(dias)
    } catch (e) {
      console.error(e)
      setMenuError('Error generando el menú. Inténtalo de nuevo.')
    } finally {
      setMenuLoading(false)
    }
  }

  const defaultMacros: MacroTarget[] = [
    { label: 'Proteína', actual: 0, meta: 120, color: C.green },
    { label: 'Carbohidratos', actual: 0, meta: 200, color: C.tan },
    { label: 'Grasas', actual: 0, meta: 55, color: '#c2852a' },
  ]
  const displayMacros = macros.length > 0 ? macros : defaultMacros

  const mockRecursos = [
    { icon: '🍽️', label: 'Recetario personalizado', sub: 'Recetas IA adaptadas a tu pauta', route: '/recetas' },
    { icon: '🛒', label: 'Lista de compras semanal', sub: 'Basada en tu menú de esta semana', route: '/lista-compras' },
    { icon: '🏋️', label: 'Plan de entrenamiento', sub: '5 días/semana — Incluido en Plan Full', route: '/entrenamiento' },
    { icon: '📊', label: 'Fotos y progreso', sub: 'Registra y compara tu transformación', route: '/progreso' },
    { icon: '💬', label: 'Chat con tu nutricionista', sub: '', route: '/chat' },
  ]

  return (
    <AppLayout>
      <PatientNav />

      <Box bg={C.cream} minH="calc(100dvh - 56px)">
        <Container maxW="7xl" py={8}>
          <Heading fontFamily="heading" fontSize={{ base: '2xl', md: '3xl' }} fontWeight="800" color={C.text} mb={1}>
            Bienvenida, {firstName} 👋
          </Heading>
          <Text color={C.muted} fontSize="sm" mb={6}>Aquí está tu resumen de progreso y herramientas</Text>

          <ProgramBar dia={programDay} total={PROGRAM_DAYS} />

          <Grid templateColumns={{ base: '1fr', lg: '1fr 380px' }} gap={6}>
            {/* Left */}
            <Stack gap={5}>
              {/* Mediciones */}
              <Box bg="white" borderRadius="2xl" p={6} borderWidth="1px" borderColor={C.border}>
                <Flex justify="space-between" align="center" mb={4}>
                  <Text fontFamily="heading" fontWeight="700" fontSize="lg" color={C.text}>Tu progreso</Text>
                  <Button onClick={() => navigate('/progreso')} size="sm" variant="outline"
                    borderRadius="full" borderColor={C.border} color={C.muted} fontSize="xs" _hover={{ borderColor: C.green, color: C.green }}>
                    Ver detalles
                  </Button>
                </Flex>
                <Text fontSize="xs" color={C.green} fontWeight="500" mb={3}>Historial de mediciones</Text>

                {loadingMed ? (
                  <Text fontSize="sm" color={C.muted}>Cargando...</Text>
                ) : mediciones.length === 0 ? (
                  <Box py={4} textAlign="center">
                    <Text fontSize="sm" color={C.muted} mb={3}>Aún no tienes mediciones registradas.</Text>
                    <Button onClick={() => navigate('/progreso')} size="sm" bg={C.green} color="white"
                      borderRadius="full" fontWeight="600" _hover={{ opacity: 0.9 }}>
                      Registrar primera medición
                    </Button>
                  </Box>
                ) : (
                  <Box overflowX="auto">
                    <Box as="table" w="full" style={{ borderCollapse: 'collapse' }}>
                      <Box as="thead">
                        <Box as="tr">
                          {['Fecha', 'Peso', 'Cintura', 'Cadera', 'Pecho', 'Brazo', 'Muslo'].map(h => (
                            <Box as="th" key={h} textAlign="left" pb={2} pr={4}
                              style={{ fontSize: '12px', color: C.muted, fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</Box>
                          ))}
                        </Box>
                      </Box>
                      <Box as="tbody">
                        {mediciones.map((m, i) => (
                          <Box as="tr" key={i} borderTopWidth="1px" style={{ borderColor: '#f5f0ea' }}>
                            {[m.fecha, m.peso, m.cintura, m.cadera, m.pecho, m.brazo, m.muslo].map((v, j) => (
                              <Box as="td" key={j} py={2.5} pr={4}
                                style={{ fontSize: '13px', color: j === 0 ? C.green : C.text, fontWeight: j === 0 ? 600 : 400, whiteSpace: 'nowrap' }}>{v}</Box>
                            ))}
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  </Box>
                )}

                <Button onClick={() => navigate('/progreso')} w="full" mt={4} variant="outline"
                  borderRadius="full" borderColor={C.border} color={C.muted} size="sm"
                  _hover={{ borderColor: C.green, color: C.green }} gap={2}>
                  📊 Ver gráficos y fotos de progreso
                </Button>
              </Box>

              {/* Macros */}
              <Box bg="white" borderRadius="2xl" p={6} borderWidth="1px" borderColor={C.border}>
                <Flex justify="space-between" align="center" mb={5}>
                  <Text fontFamily="heading" fontWeight="700" fontSize="lg" color={C.text}>Macros de hoy</Text>
                  <Text fontSize="xs" color={C.muted}>metas desde tu pauta</Text>
                </Flex>
                <Stack gap={4} mb={5}>
                  {displayMacros.map(m => <MacroBar key={m.label} {...m} />)}
                </Stack>
                <Button onClick={() => navigate('/pauta')} w="full" variant="outline"
                  borderRadius="full" borderColor={C.border} color={C.muted} size="sm"
                  _hover={{ borderColor: C.green, color: C.green }}>
                  Ver mi pauta completa
                </Button>
              </Box>

              {/* Menú semanal */}
              <Box bg="white" borderRadius="2xl" p={6} borderWidth="1px" borderColor={C.border}>
                <Flex justify="space-between" align="center" mb={1}>
                  <Text fontFamily="heading" fontWeight="700" fontSize="lg" color={C.text}>Menú de la semana</Text>
                </Flex>
                <Text fontSize="xs" color={C.muted} mb={4}>Generado con IA según tu pauta</Text>

                {menuError && (
                  <Box mb={3} px={4} py={3} bg="#fff5f5" borderRadius="xl" borderWidth="1px" borderColor="#feb2b2">
                    <Text fontSize="sm" color="red.600">{menuError}</Text>
                  </Box>
                )}

                {menuLoading ? (
                  <Box py={6} textAlign="center">
                    <Text fontSize="sm" color={C.muted}>Generando tu menú con IA...</Text>
                  </Box>
                ) : menu === null ? (
                  <Box textAlign="center" py={4}>
                    <Button
                      onClick={handleGenerarMenu}
                      bg={C.green} color="white" borderRadius="full"
                      fontWeight="600" size="sm" _hover={{ opacity: 0.9 }}>
                      ✨ Generar menú semanal
                    </Button>
                  </Box>
                ) : (
                  <Box>
                    {/* Day tabs */}
                    <Flex gap={1} mb={4} flexWrap="wrap">
                      {DAY_LABELS.map((label, idx) => (
                        <Box
                          key={label}
                          px={3} py={1.5} borderRadius="full" cursor="pointer" fontSize="xs" fontWeight="600"
                          bg={menuDay === idx ? C.green : C.greenLight}
                          color={menuDay === idx ? 'white' : C.green}
                          onClick={() => setMenuDay(idx)}
                          transition="all 0.15s"
                        >
                          {label}
                        </Box>
                      ))}
                    </Flex>

                    {/* Selected day meals */}
                    {menu[menuDay] && (
                      <Stack gap={3}>
                        {menu[menuDay].comidas.map(comida => (
                          <Box key={comida.nombre}>
                            <Text fontSize="xs" fontWeight="700" color={C.green} mb={1}>{comida.nombre}</Text>
                            <Stack gap={0.5}>
                              {comida.items.map((item, i) => (
                                <Flex key={i} align="flex-start" gap={1.5}>
                                  <Box w={1} h={1} borderRadius="full" bg={C.muted} mt={1.5} flexShrink={0} />
                                  <Text fontSize="xs" color={C.text}>{item}</Text>
                                </Flex>
                              ))}
                            </Stack>
                          </Box>
                        ))}
                      </Stack>
                    )}

                    <Button
                      onClick={handleGenerarMenu}
                      mt={4} size="xs" variant="ghost" color={C.muted}
                      borderRadius="full" fontSize="xs"
                      _hover={{ color: C.green }}>
                      Regenerar
                    </Button>
                  </Box>
                )}
              </Box>

              {/* Recursos */}
              <Box bg="white" borderRadius="2xl" p={6} borderWidth="1px" borderColor={C.border}>
                <Text fontFamily="heading" fontWeight="700" fontSize="lg" color={C.text} mb={4}>
                  Recursos y herramientas
                </Text>
                <Stack gap={0}>
                  {mockRecursos.map((r, i) => (
                    <Box key={r.label}>
                      {i > 0 && <Box h="1px" bg="#f5f0ea" />}
                      <Flex onClick={() => navigate(r.route)}
                        align="center" gap={3} py={3.5} cursor="pointer"
                        _hover={{ '& .label': { color: C.green } }}>
                        <Text fontSize="lg" w={7} textAlign="center">{r.icon}</Text>
                        <Box flex={1}>
                          <Text className="label" fontSize="sm" fontWeight="500" color={C.green} transition="color 0.2s">{r.label}</Text>
                          {r.sub && <Text fontSize="xs" color={C.muted}>{r.sub}</Text>}
                        </Box>
                        <Text color={C.border} fontSize="lg">›</Text>
                      </Flex>
                    </Box>
                  ))}
                </Stack>
              </Box>
            </Stack>

            {/* Right */}
            <Stack gap={5}>
              {/* Próximas tareas */}
              <Box bg="white" borderRadius="2xl" p={5} borderWidth="1px" borderColor={C.border}>
                <Flex align="center" gap={2} mb={4}>
                  <Text fontSize="lg">📈</Text>
                  <Text fontFamily="heading" fontWeight="700" color={C.text}>Próximas tareas</Text>
                </Flex>
                <Stack gap={2.5}>
                  {mockTareas.map(t => (
                    <Flex key={t} align="flex-start" gap={2}>
                      <Box w={1.5} h={1.5} borderRadius="full" bg={C.green} mt={1.5} flexShrink={0} />
                      <Text fontSize="sm" color={C.green} fontWeight="500" lineHeight="1.5">{t}</Text>
                    </Flex>
                  ))}
                </Stack>
              </Box>

              {/* Resumen semana */}
              <Box bg="white" borderRadius="2xl" p={5} borderWidth="1px" borderColor={C.border}>
                <Text fontFamily="heading" fontWeight="700" color={C.text} mb={4}>Resumen de la semana</Text>
                <Stack gap={3}>
                  {[
                    { icon: '📊', label: 'Adherencia', value: adherence > 0 ? `${adherence}%` : '—', color: C.green },
                    { icon: '🔥', label: 'Racha activa', value: streak > 0 ? `${streak} días` : '—', color: C.tan },
                    { icon: '⚖️', label: 'Peso actual', value: mediciones.length > 0 ? mediciones[mediciones.length - 1].peso : '—', color: C.muted },
                  ].map(s => (
                    <Flex key={s.label} justify="space-between" align="center" py={2}
                      borderBottomWidth="1px" borderColor="#f5f0ea">
                      <Flex align="center" gap={2}>
                        <Text fontSize="sm">{s.icon}</Text>
                        <Text fontSize="sm" color={C.muted}>{s.label}</Text>
                      </Flex>
                      <Text fontSize="sm" fontWeight="700" color={s.color}>{s.value}</Text>
                    </Flex>
                  ))}
                </Stack>
              </Box>

              {/* CTA Chat */}
              <Box bg={C.green} borderRadius="2xl" p={5}>
                <Text fontFamily="heading" fontWeight="700" color="white" mb={1}>¿Tienes dudas?</Text>
                <Text fontSize="sm" color="whiteAlpha.800" mb={4}>
                  Tu nutricionista responde en 24-48 hrs o consulta al asistente IA ahora.
                </Text>
                <Button onClick={() => navigate('/chat')} w="full" bg="white" color={C.green}
                  borderRadius="full" fontWeight="700" size="sm" _hover={{ opacity: 0.9 }}>
                  💬 Abrir chat
                </Button>
              </Box>
            </Stack>
          </Grid>
        </Container>
      </Box>
    </AppLayout>
  )
}
