import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Button, Container, Flex, Grid, Heading, Stack, Text } from '@chakra-ui/react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../providers/AuthProvider'
import AppLayout from '../app/AppLayout'
import PatientNav from '../organisms/PatientNav'

const C = { green: '#3d5a3e', greenLight: '#f0f4f0', tan: '#8b6914', cream: '#faf9f7', border: '#e8e4df', text: '#1a1a1a', muted: '#6b6b6b' }

interface Macro { label: string; value: string; unit: string }
interface Comida { icon?: string; nombre: string; horario: string; kcal: number; items: string[] }
interface Sustitucion { grupo: string; items: string[] }
interface Consejo { icon?: string; title: string; desc: string }

interface Pauta {
  titulo?: string
  objetivo?: string
  macros?: { calorias?: number; proteinas?: number; carbos?: number; grasas?: number }
  comidas?: Comida[]
  sustituciones?: Sustitucion[]
  consejos?: Consejo[]
}

const MEAL_ICONS: Record<string, string> = {
  desayuno: '🍎', 'colación am': '🍪', 'colación': '🍪', almuerzo: '🥗', cena: '🐟', merienda: '🍪', once: '🫖',
}

function getMealIcon(nombre: string) {
  return MEAL_ICONS[nombre.toLowerCase()] ?? '🍽'
}

export default function PautaPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState<'plan' | 'sustituciones' | 'consejos'>('plan')
  const [pauta, setPauta] = useState<Pauta | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) return
    return onSnapshot(doc(db, 'users', user.uid, 'pauta', 'current'), snap => {
      setPauta(snap.exists() ? (snap.data() as Pauta) : null)
      setLoading(false)
    })
  }, [user])

  const macroCards: Macro[] = pauta?.macros ? [
    { label: 'Calorías', value: String(pauta.macros.calorias ?? '—'), unit: 'kcal/día' },
    { label: 'Proteínas', value: `${pauta.macros.proteinas ?? '—'}g`, unit: `${pauta.macros.proteinas && pauta.macros.calorias ? Math.round((pauta.macros.proteinas * 4 / pauta.macros.calorias) * 100) : '—'}%` },
    { label: 'Carbohidratos', value: `${pauta.macros.carbos ?? '—'}g`, unit: `${pauta.macros.carbos && pauta.macros.calorias ? Math.round((pauta.macros.carbos * 4 / pauta.macros.calorias) * 100) : '—'}%` },
    { label: 'Grasas', value: `${pauta.macros.grasas ?? '—'}g`, unit: `${pauta.macros.grasas && pauta.macros.calorias ? Math.round((pauta.macros.grasas * 9 / pauta.macros.calorias) * 100) : '—'}%` },
  ] : []

  return (
    <AppLayout>
      <PatientNav />
      <Box bg={C.cream} minH="calc(100dvh - 56px)">
        <Container maxW="4xl" py={8}>
          <Flex justify="space-between" align="flex-start" mb={6} flexWrap="wrap" gap={3}>
            <Box>
              <Heading fontFamily="heading" fontSize="2xl" fontWeight="800" color={C.text} mb={1}>
                Tu pauta nutricional
              </Heading>
              <Text fontSize="sm" color={C.green}>
                {pauta?.objetivo ?? 'Plan personalizado de tu nutricionista'}
              </Text>
            </Box>
            {pauta && (
              <Button size="sm" variant="outline" borderRadius="full" borderColor={C.border}
                color={C.muted} gap={2} _hover={{ borderColor: C.green, color: C.green }}>
                ⬇ Descargar PDF
              </Button>
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
              {/* Macros summary */}
              {macroCards.length > 0 && (
                <Box bg="white" borderRadius="2xl" p={5} borderWidth="1px" borderColor={C.border} mb={5}>
                  <Grid templateColumns="repeat(4, 1fr)" gap={4}>
                    {macroCards.map(m => (
                      <Box key={m.label} textAlign="center">
                        <Text fontSize="xs" color={C.muted} mb={1}>{m.label}</Text>
                        <Text fontFamily="heading" fontWeight="800" fontSize="xl" color={C.text}>{m.value}</Text>
                        <Text fontSize="xs" color={C.muted}>{m.unit}</Text>
                      </Box>
                    ))}
                  </Grid>
                </Box>
              )}

              {/* Tabs */}
              <Box bg="white" borderRadius="full" p={1} borderWidth="1px" borderColor={C.border} mb={6}>
                <Grid templateColumns="1fr 1fr 1fr">
                  {([['plan', 'Plan de comidas'], ['sustituciones', 'Sustituciones'], ['consejos', 'Consejos']] as const).map(([t, l]) => (
                    <Box key={t} py={2.5} textAlign="center" borderRadius="full" cursor="pointer"
                      bg={tab === t ? C.green : 'transparent'} color={tab === t ? 'white' : C.muted}
                      fontWeight={tab === t ? '700' : '400'} fontSize="sm"
                      onClick={() => setTab(t)} transition="all 0.2s">
                      {l}
                    </Box>
                  ))}
                </Grid>
              </Box>

              {/* Plan de comidas */}
              {tab === 'plan' && (
                <Stack gap={3}>
                  {(pauta.comidas ?? []).map(c => (
                    <Box key={c.nombre} bg="white" borderRadius="2xl" p={5} borderWidth="1px" borderColor={C.border}>
                      <Flex align="center" justify="space-between" mb={3}>
                        <Flex align="center" gap={3}>
                          <Box w={10} h={10} bg={C.greenLight} borderRadius="full"
                            display="flex" alignItems="center" justifyContent="center">
                            <Text fontSize="lg">{c.icon ?? getMealIcon(c.nombre)}</Text>
                          </Box>
                          <Box>
                            <Text fontFamily="heading" fontWeight="700" color={C.text}>{c.nombre}</Text>
                            <Text fontSize="xs" color={C.muted}>{c.horario}</Text>
                          </Box>
                        </Flex>
                        <Box px={3} py={1} bg={C.greenLight} borderRadius="full">
                          <Text fontSize="xs" color={C.green} fontWeight="600">{c.kcal} kcal</Text>
                        </Box>
                      </Flex>
                      <Stack gap={1.5} pl={13}>
                        {c.items.map(item => (
                          <Flex key={item} align="flex-start" gap={2}>
                            <Box w={1} h={1} borderRadius="full" bg={C.green} mt={1.5} flexShrink={0} />
                            <Text fontSize="sm" color={C.muted}>{item}</Text>
                          </Flex>
                        ))}
                      </Stack>
                    </Box>
                  ))}

                  <Box bg="#f5f0ea" borderRadius="2xl" p={4} borderWidth="1px" borderColor={C.border}>
                    <Flex align="flex-start" gap={3}>
                      <Text color={C.tan}>ℹ</Text>
                      <Text fontSize="sm" color={C.muted} lineHeight="1.6">
                        Puedes intercambiar alimentos usando la tabla de sustituciones mientras mantengas las porciones y macros similares.{' '}
                        <Text as="span" color={C.green}>Recuerda beber al menos 2-3 litros de agua al día.</Text>
                      </Text>
                    </Flex>
                  </Box>

                  <Box bg={C.green} borderRadius="2xl" p={6} textAlign="center">
                    <Text fontFamily="heading" fontWeight="700" color="white" fontSize="lg" mb={2}>
                      ¿Tienes dudas sobre tu plan?
                    </Text>
                    <Text color="whiteAlpha.800" fontSize="sm" mb={4}>
                      Estoy aquí para ayudarte a hacer ajustes y resolver cualquier pregunta
                    </Text>
                    <Button onClick={() => navigate('/chat')} bg="white" color={C.green}
                      borderRadius="full" fontWeight="700" _hover={{ opacity: 0.9 }}>
                      Chatear con tu nutricionista
                    </Button>
                  </Box>
                </Stack>
              )}

              {/* Sustituciones */}
              {tab === 'sustituciones' && (
                <Stack gap={4}>
                  {(pauta.sustituciones ?? []).map(s => (
                    <Box key={s.grupo} bg="white" borderRadius="2xl" p={5} borderWidth="1px" borderColor={C.border}>
                      <Text fontFamily="heading" fontWeight="700" color={C.text} mb={3}>{s.grupo}</Text>
                      <Flex gap={2} flexWrap="wrap">
                        {s.items.map(item => (
                          <Box key={item} px={3} py={2} bg={C.greenLight} borderRadius="xl">
                            <Text fontSize="sm" color={C.green} fontWeight="500">{item}</Text>
                          </Box>
                        ))}
                      </Flex>
                    </Box>
                  ))}
                  <Box bg="#f5f0ea" borderRadius="2xl" p={4}>
                    <Text fontSize="sm" color={C.muted}>
                      💡 Puedes intercambiar alimentos dentro del mismo grupo manteniendo porciones similares para respetar tus macros.
                    </Text>
                  </Box>
                </Stack>
              )}

              {/* Consejos */}
              {tab === 'consejos' && (
                <Stack gap={3}>
                  {(pauta.consejos ?? []).map(c => (
                    <Box key={c.title} bg="white" borderRadius="2xl" p={5} borderWidth="1px" borderColor={C.border}>
                      <Flex align="flex-start" gap={4}>
                        <Box w={10} h={10} bg={C.greenLight} borderRadius="full"
                          display="flex" alignItems="center" justifyContent="center" flexShrink={0}>
                          <Text fontSize="lg">{c.icon ?? '💡'}</Text>
                        </Box>
                        <Box>
                          <Text fontFamily="heading" fontWeight="700" color={C.text} mb={1}>{c.title}</Text>
                          <Text fontSize="sm" color={C.muted} lineHeight="1.6">{c.desc}</Text>
                        </Box>
                      </Flex>
                    </Box>
                  ))}
                </Stack>
              )}
            </>
          )}
        </Container>
      </Box>
    </AppLayout>
  )
}
