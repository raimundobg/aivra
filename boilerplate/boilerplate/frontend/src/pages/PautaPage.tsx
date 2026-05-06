import { useState, useEffect } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { Box, Button, Container, Flex, Grid, Heading, Stack, Text } from '@chakra-ui/react'
import { doc, onSnapshot, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../providers/AuthProvider'
import AppLayout from '../app/AppLayout'
import PatientNav from '../organisms/PatientNav'
import type { MealKey } from '../types/nutrition'
import { generarMenuSemanal, type MenuDia } from '../services/groq'

interface Alimento {
  grupo: string
  subgrupo: string
  alimento: string
  gramos_porcion: number
  medida_casera: string
  kcal_porcion: number
  proteinas_g: number
  lipidos_g: number
  carbohidratos_g: number
}

const MEAL_GROUPS: Record<string, string[]> = {
  desayuno: ['Panes y cereales', 'Lácteos', 'Frutas'],
  'colación am': ['Frutas', 'Lácteos', 'Panes y cereales'],
  'colacion am': ['Frutas', 'Lácteos', 'Panes y cereales'],
  colación: ['Frutas', 'Lácteos', 'Panes y cereales'],
  colacion: ['Frutas', 'Lácteos', 'Panes y cereales'],
  almuerzo: ['Cárneos y derivados', 'Alternativas proteicas vegetales', 'Legumbres secas', 'Panes y cereales', 'Verduras'],
  'colación pm': ['Frutas', 'Lácteos', 'Panes y cereales'],
  'colacion pm': ['Frutas', 'Lácteos', 'Panes y cereales'],
  cena: ['Cárneos y derivados', 'Alternativas proteicas vegetales', 'Legumbres secas', 'Panes y cereales', 'Verduras'],
  once: ['Panes y cereales', 'Lácteos', 'Frutas'],
  merienda: ['Panes y cereales', 'Lácteos', 'Frutas'],
}

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
  amber: '#fbbf24',
}

interface Comida { icon?: string; nombre: string; horario: string; kcal: number; items: string[] }
interface Consejo { icon?: string; title: string; desc: string }

interface Pauta {
  titulo?: string
  objetivo?: string
  macros?: { calorias?: number; proteinas?: number; carbos?: number; grasas?: number }
  comidas?: Comida[]
  consejos?: Consejo[]
}

const MEAL_ICONS: Record<string, string> = {
  desayuno: '🥣',
  'colación am': '🍎', 'colacion am': '🍎', colación: '🍎',
  almuerzo: '🥗',
  'colación pm': '🥜', 'colacion pm': '🥜',
  cena: '🍲',
  merienda: '🍪',
  once: '🫖',
  snack: '🍓',
}

function getMealIcon(nombre: string) {
  return MEAL_ICONS[nombre.toLowerCase().trim()] ?? '🍽️'
}

function nombreToMealKey(nombre: string): MealKey | null {
  const key = nombre.toLowerCase().trim()
  if (key.includes('desayuno')) return 'desayuno'
  if (key.includes('colación am') || key.includes('colacion am')) return 'colacion_am'
  if (key.includes('almuerzo')) return 'almuerzo'
  if (key.includes('colación pm') || key.includes('colacion pm')) return 'colacion_pm'
  if (key.includes('cena')) return 'cena'
  return null
}

const DAYS = ['Hoy', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export default function PautaPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState<'plan' | 'consejos'>('plan')
  const [pauta, setPauta] = useState<Pauta | null>(null)
  const [loading, setLoading] = useState(true)
  const [completed, setCompleted] = useState<Set<MealKey>>(new Set())
  const [selectedDay, setSelectedDay] = useState(0)
  const [menu, setMenu] = useState<MenuDia[] | null>(null)
  const [menuLoading, setMenuLoading] = useState(true)
  const [generatingMenu, setGeneratingMenu] = useState(false)
  const [alimentos, setAlimentos] = useState<Alimento[]>([])
  const [exchangeTarget, setExchangeTarget] = useState<{ dayIdx: number; mealIdx: number; itemIdx: number } | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) return
    return onSnapshot(doc(db, 'users', user.uid, 'pauta', 'current'), snap => {
      setPauta(snap.exists() ? (snap.data() as Pauta) : null)
      setLoading(false)
    })
  }, [user])

  useEffect(() => {
    if (!user) return
    const today = new Date().toISOString().split('T')[0]
    return onSnapshot(doc(db, 'users', user.uid, 'r24', today), snap => {
      if (!snap.exists()) { setCompleted(new Set()); return }
      const meals = snap.data().meals as Record<string, unknown[]> | undefined
      if (!meals) return
      const done = new Set<MealKey>()
      Object.entries(meals).forEach(([k, arr]) => {
        if (Array.isArray(arr) && arr.length > 0) done.add(k as MealKey)
      })
      setCompleted(done)
    })
  }, [user])

  useEffect(() => {
    if (!user) return
    getDoc(doc(db, 'users', user.uid, 'menu', 'current'))
      .then(snap => {
        if (snap.exists()) setMenu((snap.data().dias ?? []) as MenuDia[])
        setMenuLoading(false)
      })
      .catch(() => setMenuLoading(false))
  }, [user])

  useEffect(() => {
    fetch('/alimentos.json').then(r => r.json()).then((data: Alimento[]) => setAlimentos(data)).catch(() => {})
  }, [])

  function getAlternatives(mealNombre: string, kcalTarget: number): Alimento[] {
    const key = mealNombre.toLowerCase().trim()
    const groups = MEAL_GROUPS[key] ?? ['Panes y cereales', 'Cárneos y derivados', 'Frutas', 'Lácteos']
    return alimentos
      .filter(a => groups.includes(a.grupo))
      .sort((a, b) => Math.abs(a.kcal_porcion - kcalTarget) - Math.abs(b.kcal_porcion - kcalTarget))
      .slice(0, 8)
  }

  async function applyExchange(alimento: Alimento) {
    if (!exchangeTarget || !user || !menu) return
    const { dayIdx, mealIdx, itemIdx } = exchangeTarget
    const newMenu = menu.map((dia, di) => {
      if (di !== dayIdx) return dia
      return {
        ...dia,
        comidas: dia.comidas.map((comida, ci) => {
          if (ci !== mealIdx) return comida
          const newItems = [...comida.items]
          newItems[itemIdx] = `${alimento.alimento} (${alimento.medida_casera})`
          return { ...comida, items: newItems }
        }),
      }
    })
    setMenu(newMenu)
    setExchangeTarget(null)
    await setDoc(doc(db, 'users', user.uid, 'menu', 'current'), { dias: newMenu, updatedAt: serverTimestamp() }, { merge: true })
  }

  async function toggleComida(comida: Comida) {
    if (!user) return
    const mealKey = nombreToMealKey(comida.nombre)
    if (!mealKey) return

    const today = new Date().toISOString().split('T')[0]
    const r24Ref = doc(db, 'users', user.uid, 'r24', today)
    const snap = await getDoc(r24Ref)
    const existing = snap.exists() ? snap.data().meals ?? {} : {}

    const newCompleted = new Set(completed)
    const newMeals = { ...existing }

    if (completed.has(mealKey)) {
      newCompleted.delete(mealKey)
      newMeals[mealKey] = []
    } else {
      newCompleted.add(mealKey)
      newMeals[mealKey] = comida.items.map((item, i) => ({
        alimento: item,
        grupo: 'pauta',
        subgrupo: '',
        gramos_porcion: 0,
        medida_casera: 'según pauta',
        kcal_porcion: i === 0 ? Math.round(comida.kcal / comida.items.length) : 0,
        proteinas_g: 0, lipidos_g: 0, carbohidratos_g: 0,
        porciones: 1,
        kcal_total: i === 0 ? Math.round(comida.kcal / comida.items.length) : 0,
        proteinas_total: 0, lipidos_total: 0, carbohidratos_total: 0,
      }))
    }

    setCompleted(newCompleted)
    await setDoc(r24Ref, { meals: newMeals, savedAt: serverTimestamp() }, { merge: true })
  }

  async function generarMenu() {
    if (!user || !pauta) return
    setGeneratingMenu(true)
    try {
      const dias = await generarMenuSemanal(pauta as Parameters<typeof generarMenuSemanal>[0], [])
      await setDoc(doc(db, 'users', user.uid, 'menu', 'current'), { dias, generadoAt: serverTimestamp() })
      setMenu(dias)
    } catch (e) {
      console.error(e)
    } finally {
      setGeneratingMenu(false)
    }
  }

  const totalComidas = pauta?.comidas?.length ?? 0
  const completedCount = completed.size
  const progressPct = totalComidas > 0 ? Math.round((completedCount / totalComidas) * 100) : 0

  return (
    <AppLayout>
      <PatientNav />
      <Box bg={C.cream} minH="calc(100dvh - 56px)">
        <Container maxW="container.md" pt={6} pb={28}>
          {/* Header */}
          <Flex justify="space-between" align="flex-start" mb={4}>
            <Box>
              <Heading fontFamily="heading" fontSize="2xl" fontWeight="800" color={C.text} lineHeight="1.1">
                Mi pauta
              </Heading>
              <Text fontSize="sm" color={C.muted} mt={1}>
                {pauta?.objetivo ?? 'Plan personalizado'}
              </Text>
            </Box>
            {pauta && (
              <Box px={3} py={1.5} bg={C.greenLight} borderRadius="full">
                <Text fontSize="xs" color={C.green} fontWeight="700">{progressPct}% hoy</Text>
              </Box>
            )}
          </Flex>

          {loading ? (
            <Box bg="white" borderRadius="2xl" p={8} textAlign="center" borderWidth="1px" borderColor={C.border}>
              <Text color={C.muted} fontSize="sm">Cargando tu pauta...</Text>
            </Box>
          ) : !pauta ? (
            <Box bg="white" borderRadius="2xl" p={10} textAlign="center" borderWidth="1px" borderColor={C.border}>
              <Text fontSize="4xl" mb={4}>🥗</Text>
              <Text fontFamily="heading" fontWeight="700" fontSize="xl" color={C.text} mb={2}>
                Tu pauta aún no está lista
              </Text>
              <Text fontSize="sm" color={C.muted} mb={6} maxW="360px" mx="auto" lineHeight="1.7">
                Tu nutricionista está preparando tu plan personalizado. Te avisaremos cuando esté disponible.
              </Text>
              <Button onClick={() => navigate('/chat')} bg={C.green} color="white"
                borderRadius="full" fontWeight="700" _hover={{ opacity: 0.9 }}>
                💬 Consultar a mi nutricionista
              </Button>
            </Box>
          ) : (
            <>
              {/* Macros card */}
              {pauta.macros && (
                <Box bg="white" borderRadius="2xl" p={5} borderWidth="1px" borderColor={C.border} mb={4}>
                  <Text fontSize="xs" color={C.muted} fontWeight="600" mb={3} textTransform="uppercase" letterSpacing="0.05em">
                    Tus metas diarias
                  </Text>
                  <Grid templateColumns="repeat(4, 1fr)" gap={3}>
                    {[
                      { label: 'Kcal', value: pauta.macros.calorias ?? 0, color: C.green },
                      { label: 'Prot.', value: pauta.macros.proteinas ?? 0, color: C.rose, unit: 'g' },
                      { label: 'Carbs', value: pauta.macros.carbos ?? 0, color: C.amber, unit: 'g' },
                      { label: 'Grasas', value: pauta.macros.grasas ?? 0, color: '#c2852a', unit: 'g' },
                    ].map(m => (
                      <Box key={m.label} textAlign="center">
                        <Text fontFamily="heading" fontWeight="800" fontSize="lg" color={m.color} lineHeight="1">
                          {m.value}{m.unit ?? ''}
                        </Text>
                        <Text fontSize="9px" color={C.muted} fontWeight="600" textTransform="uppercase" mt={0.5}>{m.label}</Text>
                      </Box>
                    ))}
                  </Grid>
                </Box>
              )}

              {/* Tabs */}
              <Box bg="white" borderRadius="full" p={1} borderWidth="1px" borderColor={C.border} mb={4}>
                <Grid templateColumns="1fr 1fr" gap={1}>
                  {([
                    ['plan', 'Comidas'],
                    ['consejos', 'Consejos'],
                  ] as const).map(([t, l]) => (
                    <Box
                      key={t} py={2} textAlign="center" borderRadius="full" cursor="pointer"
                      bg={tab === t ? C.green : 'transparent'} color={tab === t ? 'white' : C.muted}
                      fontWeight={tab === t ? '700' : '500'} fontSize="xs"
                      onClick={() => setTab(t)} transition="all 0.2s"
                    >
                      {l}
                    </Box>
                  ))}
                </Grid>
              </Box>

              {/* Plan de comidas */}
              {tab === 'plan' && (
                <Stack gap={3}>
                  {/* Day selector: Hoy + Lun-Dom */}
                  <Flex gap={1.5} flexWrap="wrap">
                    {DAYS.map((day, i) => (
                      <Box
                        key={day} px={3} py={1.5} borderRadius="full" cursor="pointer"
                        bg={selectedDay === i ? C.green : 'white'}
                        borderWidth="1px" borderColor={selectedDay === i ? C.green : C.border}
                        onClick={() => setSelectedDay(i)} transition="all 0.15s"
                      >
                        <Text fontSize="xs" fontWeight={selectedDay === i ? 700 : 500}
                          color={selectedDay === i ? 'white' : C.muted}>{day}</Text>
                      </Box>
                    ))}
                  </Flex>

                  {selectedDay === 0 ? (
                    <>
                      {(pauta.comidas ?? []).map((c, idx) => {
                        const mealKey = nombreToMealKey(c.nombre)
                        const isDone = mealKey ? completed.has(mealKey) : false
                        return (
                          <Box
                            key={idx}
                            bg="white" borderRadius="2xl" p={4} borderWidth="1.5px"
                            borderColor={isDone ? C.green : C.border}
                            opacity={isDone ? 0.8 : 1}
                            transition="all 0.15s"
                          >
                            <Flex align="center" justify="space-between" mb={3}>
                              <Flex align="center" gap={3} flex={1} minW={0}>
                                <Box
                                  w={11} h={11} borderRadius="xl"
                                  bg={isDone ? C.green : C.greenLight}
                                  display="flex" alignItems="center" justifyContent="center" flexShrink={0}
                                >
                                  <Text fontSize="xl">{getMealIcon(c.nombre)}</Text>
                                </Box>
                                <Box flex={1} minW={0}>
                                  <Text fontFamily="heading" fontWeight="700" color={C.text} fontSize="sm" textTransform="capitalize">
                                    {c.nombre}
                                  </Text>
                                  <Text fontSize="xs" color={C.muted}>{c.horario} · {c.kcal} kcal</Text>
                                </Box>
                              </Flex>
                              <Box
                                onClick={() => toggleComida(c)}
                                w={7} h={7} borderRadius="full" cursor="pointer" flexShrink={0}
                                bg={isDone ? C.green : 'white'}
                                borderWidth="2px" borderColor={isDone ? C.green : C.border}
                                display="flex" alignItems="center" justifyContent="center"
                                _hover={{ borderColor: C.green }}
                                transition="all 0.15s"
                              >
                                {isDone && <Text color="white" fontSize="sm" fontWeight="700">✓</Text>}
                              </Box>
                            </Flex>
                            <Stack gap={1} pl={1}>
                              {c.items.map((item, i) => (
                                <Flex key={i} align="flex-start" gap={2}>
                                  <Box w={1} h={1} borderRadius="full" bg={C.green} mt={2} flexShrink={0} />
                                  <Text fontSize="xs" color={C.text} lineHeight="1.5">{item}</Text>
                                </Flex>
                              ))}
                            </Stack>
                          </Box>
                        )
                      })}

                      <Box bg={C.beige} borderRadius="2xl" p={4}>
                        <Flex align="flex-start" gap={2}>
                          <Text fontSize="md">💡</Text>
                          <Text fontSize="xs" color={C.text} lineHeight="1.6">
                            Tocá el círculo para marcar una comida como hecha. Registra automáticamente en tu R24.
                          </Text>
                        </Flex>
                      </Box>

                      <Button
                        onClick={() => navigate('/r24')}
                        variant="outline" borderRadius="full" borderColor={C.green} color={C.green}
                        fontWeight="600" fontSize="sm"
                        _hover={{ bg: C.greenLight }}
                      >
                        Editar registro 24h en detalle →
                      </Button>
                    </>
                  ) : (
                    menuLoading ? (
                      <Box py={6} textAlign="center">
                        <Text fontSize="sm" color={C.muted}>Cargando menú...</Text>
                      </Box>
                    ) : !menu ? (
                      <Box bg="white" borderRadius="2xl" p={8} textAlign="center" borderWidth="1px" borderColor={C.border}>
                        <Text fontSize="3xl" mb={3}>📅</Text>
                        <Text fontFamily="heading" fontWeight="700" color={C.text} mb={2}>Sin menú semanal</Text>
                        <Text fontSize="sm" color={C.muted} mb={5} lineHeight="1.6">
                          Genera tu menú de 7 días con opciones variadas basadas en tu pauta.
                        </Text>
                        <Button
                          bg={C.green} color="white" borderRadius="full" fontWeight="700"
                          loading={generatingMenu} loadingText="Generando menú..."
                          onClick={generarMenu} _hover={{ opacity: 0.9 }}
                        >
                          ✨ Generar menú semanal
                        </Button>
                      </Box>
                    ) : (
                      <Stack gap={3}>
                        {(menu[selectedDay - 1]?.comidas ?? []).map((comida, mealIdx) => {
                          const dayIdx = selectedDay - 1
                          const mealKcal = (comida as { kcal?: number }).kcal ?? 400
                          const mealKcalPerItem = comida.items.length > 0 ? Math.round(mealKcal / comida.items.length) : 100
                          return (
                          <Box key={mealIdx} bg="white" borderRadius="2xl" p={4} borderWidth="1px" borderColor={C.border}>
                            <Flex align="center" gap={3} mb={2}>
                              <Box w={10} h={10} bg={C.greenLight} borderRadius="xl"
                                display="flex" alignItems="center" justifyContent="center" flexShrink={0}>
                                <Text fontSize="lg">{getMealIcon(comida.nombre)}</Text>
                              </Box>
                              <Text fontFamily="heading" fontWeight="700" color={C.text} fontSize="sm" textTransform="capitalize">
                                {comida.nombre}
                              </Text>
                            </Flex>
                            <Stack gap={1} pl={1}>
                              {comida.items.map((item, itemIdx) => {
                                const isTarget = exchangeTarget?.dayIdx === dayIdx && exchangeTarget?.mealIdx === mealIdx && exchangeTarget?.itemIdx === itemIdx
                                const alternatives = isTarget ? getAlternatives(comida.nombre, mealKcalPerItem) : []
                                return (
                                  <Box key={itemIdx}>
                                    <Flex
                                      align="flex-start" gap={2} cursor="pointer"
                                      onClick={() => setExchangeTarget(isTarget ? null : { dayIdx, mealIdx, itemIdx })}
                                      _hover={{ opacity: 0.75 }} transition="opacity 0.15s"
                                      borderRadius="md" p={1} mx={-1}
                                      bg={isTarget ? C.greenLight : 'transparent'}
                                    >
                                      <Box w={1} h={1} borderRadius="full" bg={C.green} mt={2} flexShrink={0} />
                                      <Text fontSize="xs" color={C.text} lineHeight="1.5" flex={1}>{item}</Text>
                                      <Box
                                        flexShrink={0} px={2} py={0.5} borderRadius="full"
                                        bg={isTarget ? C.green : C.greenLight}
                                        borderWidth="1px" borderColor={isTarget ? C.green : C.border}
                                      >
                                        <Text fontSize="xs" color={isTarget ? 'white' : C.green} fontWeight="700" lineHeight="1.4">
                                          {isTarget ? 'cerrar' : '⇄ cambiar'}
                                        </Text>
                                      </Box>
                                    </Flex>
                                    {isTarget && (
                                      <Box mt={2} mb={1} pl={3}>
                                        <Text fontSize="10px" color={C.muted} fontWeight="600" mb={2} textTransform="uppercase" letterSpacing="0.05em">
                                          Intercambiar por:
                                        </Text>
                                        <Flex gap={1.5} flexWrap="wrap">
                                          {alternatives.map((alt, ai) => (
                                            <Box
                                              key={ai}
                                              px={2.5} py={1} borderRadius="full" cursor="pointer"
                                              bg="white" borderWidth="1.5px" borderColor={C.border}
                                              _hover={{ borderColor: C.green, bg: C.greenLight }}
                                              transition="all 0.15s"
                                              onClick={(e) => { e.stopPropagation(); applyExchange(alt) }}
                                            >
                                              <Text fontSize="10px" color={C.text} fontWeight="600">{alt.alimento}</Text>
                                              <Text fontSize="9px" color={C.muted}>{alt.medida_casera} · {alt.kcal_porcion} kcal</Text>
                                            </Box>
                                          ))}
                                        </Flex>
                                      </Box>
                                    )}
                                  </Box>
                                )
                              })}
                            </Stack>
                          </Box>
                          )
                        })}
                        <Flex gap={2} flexWrap="wrap">
                          <Button
                            size="sm" variant="outline" borderRadius="full"
                            borderColor={C.border} color={C.muted} fontWeight="600"
                            loading={generatingMenu} loadingText="Regenerando..."
                            onClick={generarMenu}
                          >
                            🔄 Regenerar menú
                          </Button>
                          <RouterLink to="/meal-prep" style={{ textDecoration: 'none' }}>
                            <Button size="sm" bg={C.greenLight} color={C.green} borderRadius="full" fontWeight="600"
                              _hover={{ bg: C.beige }}>
                              🥘 Ver prep semanal
                            </Button>
                          </RouterLink>
                        </Flex>
                      </Stack>
                    )
                  )}
                </Stack>
              )}

              {/* Consejos */}
              {tab === 'consejos' && (
                <Stack gap={3}>
                  {(pauta.consejos ?? []).length === 0 ? (
                    <Box bg="white" borderRadius="2xl" p={6} textAlign="center" borderWidth="1px" borderColor={C.border}>
                      <Text fontSize="sm" color={C.muted}>Tu pauta aún no incluye consejos.</Text>
                    </Box>
                  ) : (
                    (pauta.consejos ?? []).map((c, i) => (
                      <Box key={i} bg="white" borderRadius="2xl" p={4} borderWidth="1px" borderColor={C.border}>
                        <Flex align="flex-start" gap={3}>
                          <Box w={10} h={10} bg={C.greenLight} borderRadius="xl"
                            display="flex" alignItems="center" justifyContent="center" flexShrink={0}>
                            <Text fontSize="lg">{c.icon ?? '💡'}</Text>
                          </Box>
                          <Box flex={1} minW={0}>
                            <Text fontFamily="heading" fontWeight="700" color={C.text} mb={0.5} fontSize="sm">{c.title}</Text>
                            <Text fontSize="xs" color={C.muted} lineHeight="1.6">{c.desc}</Text>
                          </Box>
                        </Flex>
                      </Box>
                    ))
                  )}
                </Stack>
              )}

              {/* CTA chat */}
              <Box mt={6} bg={C.green} borderRadius="2xl" p={5}
                backgroundImage={`linear-gradient(135deg, ${C.green} 0%, ${C.greenDark} 100%)`}>
                <Flex align="center" justify="space-between" gap={3}>
                  <Box flex={1}>
                    <Text fontFamily="heading" fontWeight="700" color="white" fontSize="md" mb={0.5}>
                      ¿Dudas con tu plan?
                    </Text>
                    <Text fontSize="xs" color="whiteAlpha.800">
                      Chateá con tu nutricionista o el asistente IA.
                    </Text>
                  </Box>
                  <Button onClick={() => navigate('/chat')} bg="white" color={C.green}
                    borderRadius="full" size="sm" fontWeight="700" _hover={{ bg: C.greenLight }}>
                    💬 Chatear
                  </Button>
                </Flex>
              </Box>
            </>
          )}
        </Container>
      </Box>
    </AppLayout>
  )
}
