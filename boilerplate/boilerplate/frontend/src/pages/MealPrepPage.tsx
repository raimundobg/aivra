import { useState, useEffect } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Box, Button, Container, Flex, Grid, Heading, Stack, Text } from '@chakra-ui/react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../providers/AuthProvider'
import AppLayout from '../app/AppLayout'
import PatientNav from '../organisms/PatientNav'
import type { MenuDia } from '../services/groq'

const C = { green: '#5F6F52', greenLight: '#eef2ea', cream: '#F9F4EF', beige: '#E9DFD3', border: 'rgba(95,111,82,0.15)', text: '#2D3319', muted: '#7a7264' }

const MEAL_ICONS: Record<string, string> = {
  desayuno: '🥣', 'colación am': '🍎', 'colacion am': '🍎',
  almuerzo: '🥗', 'colación pm': '🥜', 'colacion pm': '🥜', cena: '🍲',
}

function getMealIcon(nombre: string) {
  return MEAL_ICONS[nombre.toLowerCase().trim()] ?? '🍽️'
}

const PREP_TIPS = [
  { icon: '🍗', tip: 'Cocina proteínas (pollo, carne) en tandas grandes el domingo. Duran 4 días en refrigerador.' },
  { icon: '🍚', tip: 'Prepara arroz integral o quinoa para 3-4 días. Guarda en porciones en tuppers.' },
  { icon: '🥦', tip: 'Lava y corta las verduras el domingo. Guárdalas con paños húmedos para mantener frescura.' },
  { icon: '🥚', tip: 'Hierve 6-8 huevos el domingo. Son snack proteico rápido para toda la semana.' },
  { icon: '🌾', tip: 'Remoja legumbres la noche anterior para reducir el tiempo de cocción a la mitad.' },
  { icon: '🥣', tip: 'Prepara porciones de avena en frascos la noche anterior (overnight oats) para desayunos rápidos.' },
]

export default function MealPrepPage() {
  const { user } = useAuth()
  const [menu, setMenu] = useState<MenuDia[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState(0)

  useEffect(() => {
    if (!user) return
    getDoc(doc(db, 'users', user.uid, 'menu', 'current'))
      .then(snap => {
        if (snap.exists()) setMenu((snap.data().dias ?? []) as MenuDia[])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [user])

  if (loading) return (
    <AppLayout><PatientNav />
      <Box bg={C.cream} minH="calc(100dvh - 56px)">
        <Container maxW="3xl" py={12}><Text color={C.muted} textAlign="center">Cargando...</Text></Container>
      </Box>
    </AppLayout>
  )

  return (
    <AppLayout>
      <PatientNav />
      <Box bg={C.cream} minH="calc(100dvh - 56px)" pb={24}>
        <Container maxW="3xl" py={8}>
          <RouterLink to="/pauta" style={{ fontSize: '14px', color: C.green, fontWeight: 500, display: 'block', marginBottom: '16px', textDecoration: 'none' }}>
            ← Volver a Mi Pauta
          </RouterLink>

          <Flex justify="space-between" align="flex-start" mb={6} gap={3} flexWrap="wrap">
            <Box>
              <Heading fontFamily="heading" fontWeight="800" color={C.text} fontSize="2xl" mb={1}>
                Prep semanal 🥘
              </Heading>
              <Text color={C.muted} fontSize="sm">Planifica y prepara con anticipación</Text>
            </Box>
            <RouterLink to="/lista-compras" style={{ textDecoration: 'none' }}>
              <Box px={4} py={2} bg={C.green} borderRadius="full">
                <Text fontSize="xs" color="white" fontWeight="700">🛒 Lista de compras</Text>
              </Box>
            </RouterLink>
          </Flex>

          {!menu ? (
            <Box bg="white" borderRadius="2xl" p={10} borderWidth="1px" borderColor={C.border} textAlign="center" mb={5}>
              <Text fontSize="3xl" mb={3}>📅</Text>
              <Heading fontFamily="heading" fontSize="lg" fontWeight="700" color={C.text} mb={2}>Sin menú semanal</Heading>
              <Text fontSize="sm" color={C.muted} mb={4}>
                Genera tu menú desde Mi Pauta para ver el plan de preparación semanal.
              </Text>
              <RouterLink to="/pauta">
                <Button bg={C.green} color="white" borderRadius="full" size="sm" fontWeight="700" _hover={{ opacity: 0.9 }}>
                  Ir a Mi Pauta →
                </Button>
              </RouterLink>
            </Box>
          ) : (
            <>
              {/* Day tabs */}
              <Flex gap={2} mb={4} flexWrap="wrap">
                {menu.map((dia, i) => (
                  <Box
                    key={dia.dia} px={3} py={1.5} borderRadius="full" cursor="pointer"
                    bg={selectedDay === i ? C.green : 'white'}
                    borderWidth="1px" borderColor={selectedDay === i ? C.green : C.border}
                    onClick={() => setSelectedDay(i)} transition="all 0.15s"
                  >
                    <Text fontSize="xs" fontWeight={selectedDay === i ? 700 : 500}
                      color={selectedDay === i ? 'white' : C.muted}>
                      {dia.dia.slice(0, 3)}
                    </Text>
                  </Box>
                ))}
              </Flex>

              {/* Selected day meals */}
              <Box bg="white" borderRadius="2xl" borderWidth="1px" borderColor={C.border} overflow="hidden" mb={4}>
                <Box px={5} py={3} bg={C.greenLight} borderBottomWidth="1px" borderColor={C.border}>
                  <Text fontFamily="heading" fontWeight="700" color={C.text} fontSize="sm">
                    {menu[selectedDay]?.dia ?? ''}
                  </Text>
                </Box>
                <Stack gap={0} p={3}>
                  {(menu[selectedDay]?.comidas ?? []).map((comida, i, arr) => (
                    <Box
                      key={i} px={3} py={3}
                      borderBottomWidth={i < arr.length - 1 ? '1px' : '0'}
                      borderColor={C.border}
                    >
                      <Flex align="center" gap={3} mb={1.5}>
                        <Text fontSize="lg" lineHeight={1}>{getMealIcon(comida.nombre)}</Text>
                        <Text fontFamily="heading" fontWeight="700" color={C.text} fontSize="sm" textTransform="capitalize">
                          {comida.nombre}
                        </Text>
                      </Flex>
                      <Stack gap={0.5} pl={8}>
                        {comida.items.map((item, j) => (
                          <Flex key={j} align="flex-start" gap={2}>
                            <Box w={1} h={1} borderRadius="full" bg={C.green} mt={2} flexShrink={0} />
                            <Text fontSize="xs" color={C.muted} lineHeight="1.5">{item}</Text>
                          </Flex>
                        ))}
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </Box>

              {/* Weekly overview grid */}
              <Box bg="white" borderRadius="2xl" p={4} borderWidth="1px" borderColor={C.border} mb={5}>
                <Text fontFamily="heading" fontWeight="700" color={C.text} mb={3} fontSize="sm">Vista semanal</Text>
                <Grid templateColumns={{ base: 'repeat(4, 1fr)', md: 'repeat(7, 1fr)' }} gap={2}>
                  {menu.map((dia, i) => (
                    <Box
                      key={dia.dia} p={2} borderRadius="xl" cursor="pointer" textAlign="center"
                      bg={selectedDay === i ? C.green : C.greenLight}
                      onClick={() => setSelectedDay(i)} transition="all 0.15s"
                    >
                      <Text fontSize="xs" fontWeight="700" color={selectedDay === i ? 'white' : C.green}>
                        {dia.dia.slice(0, 3)}
                      </Text>
                      <Text fontSize="9px" color={selectedDay === i ? 'whiteAlpha.800' : C.muted} mt={0.5}>
                        {dia.comidas.length} comidas
                      </Text>
                    </Box>
                  ))}
                </Grid>
              </Box>
            </>
          )}

          {/* Prep tips */}
          <Box bg="white" borderRadius="2xl" p={5} borderWidth="1px" borderColor={C.border}>
            <Text fontFamily="heading" fontWeight="700" color={C.text} mb={4} fontSize="sm">
              💡 Tips de preparación
            </Text>
            <Stack gap={3}>
              {PREP_TIPS.map((tip, i) => (
                <Flex key={i} align="flex-start" gap={3}>
                  <Text fontSize="xl" lineHeight={1} mt={0.5}>{tip.icon}</Text>
                  <Text fontSize="xs" color={C.text} lineHeight="1.6">{tip.tip}</Text>
                </Flex>
              ))}
            </Stack>
          </Box>
        </Container>
      </Box>
    </AppLayout>
  )
}
