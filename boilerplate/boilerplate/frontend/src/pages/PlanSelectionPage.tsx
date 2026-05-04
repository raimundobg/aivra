import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../providers/AuthProvider'
import { Box, Button, Container, Flex, Stack, Text } from '@chakra-ui/react'

const C = {
  green: '#3d5a3e', greenMid: '#6b8f6c', greenLight: '#f0f4f0',
  tan: '#8b6914', cream: '#faf9f7', border: '#e8e4df',
  text: '#1a1a1a', muted: '#6b6b6b',
}

type PlanId = 'freemium' | 'ia' | 'full'

interface Plan {
  id: PlanId
  nombre: string
  precio: string
  subtitulo: string
  features: string[]
  locked: string[]
  cta: string
  highlight: boolean
  badge?: string
}

const PLANES: Plan[] = [
  {
    id: 'freemium',
    nombre: 'Freemium',
    precio: 'Gratis',
    subtitulo: 'Explora la plataforma',
    features: [
      'Acceso al dashboard básico',
      'Contenido educativo general',
      'Vista demo de tu pauta IA',
      'Registro de hábitos diarios',
    ],
    locked: [
      'Pauta nutricional real personalizada',
      'Menú semanal con IA',
      'Seguimiento de progreso',
      'Chat con nutricionista',
    ],
    cta: 'Continuar gratis',
    highlight: false,
  },
  {
    id: 'ia',
    nombre: 'Plan 100% IA',
    precio: '$11.990/mes',
    subtitulo: 'Personalización inteligente',
    badge: 'Recomendado',
    features: [
      'Pauta nutricional generada con IA',
      'Macros calculados con Harris-Benedict',
      'Menú semanal adaptado a tus gustos',
      'Lista de compras automática',
      'Chat IA disponible 24/7',
      'Seguimiento de progreso y mediciones',
      'Registro de hábitos con análisis semanal',
      'Ajustes dinámicos según adherencia',
    ],
    locked: [
      'Consultas con nutricionista',
    ],
    cta: 'Elegir Plan IA',
    highlight: true,
  },
  {
    id: 'full',
    nombre: 'Plan Full',
    precio: '$39.990/mes',
    subtitulo: 'Máximo acompañamiento',
    features: [
      'Todo lo del Plan IA',
      'Consulta inicial con nutricionista',
      'Pauta revisada y ajustada por profesional',
      'Canal directo con tu nutricionista',
      'Seguimiento profesional continuo',
      'Interpretación clínica personalizada',
      'Agendamiento de consultas de control',
    ],
    locked: [],
    cta: 'Elegir Plan Full',
    highlight: false,
  },
]

export default function PlanSelectionPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [saving, setSaving] = useState<PlanId | null>(null)

  async function elegirPlan(planId: PlanId) {
    if (!user || saving) return
    setSaving(planId)
    try {
      await setDoc(doc(db, 'users', user.uid), {
        plan: planId,
        planActivadoAt: serverTimestamp(),
      }, { merge: true })
      navigate('/dashboard')
    } catch (e) {
      console.error(e)
      setSaving(null)
    }
  }

  return (
    <Box minH="100dvh" bg={C.cream} py={{ base: 8, md: 12 }}>
      <Container maxW="900px">
        {/* Header */}
        <Flex align="center" gap={3} mb={10}>
          <Box w={8} h={8} bg={C.green} borderRadius="lg" display="flex" alignItems="center" justifyContent="center">
            <Text color="white" fontWeight="800" fontSize="sm" fontFamily="heading">A</Text>
          </Box>
          <Text fontFamily="heading" fontWeight="700" color={C.text}>Aivra</Text>
        </Flex>

        {/* Hero */}
        <Box textAlign="center" mb={10}>
          <Box
            display="inline-flex" alignItems="center" gap={2}
            bg={C.greenLight} px={4} py={1.5} borderRadius="full" mb={4}
          >
            <Text fontSize="sm" color={C.green} fontWeight="600">✨ Tu pauta nutricional ya está lista</Text>
          </Box>
          <Text fontFamily="heading" fontWeight="800" fontSize={{ base: '2xl', md: '3xl' }} color={C.text} mb={3}>
            Elige tu plan para desbloquearla
          </Text>
          <Text fontSize="sm" color={C.muted} maxW="480px" mx="auto">
            Generamos tu pauta personalizada con IA basada en tu perfil. Elige el nivel de acompañamiento que necesitas.
          </Text>
        </Box>

        {/* Cards */}
        <Flex direction={{ base: 'column', md: 'row' }} gap={4} align={{ base: 'stretch', md: 'flex-start' }}>
          {PLANES.map(plan => (
            <Box
              key={plan.id}
              flex={plan.highlight ? '1.1' : '1'}
              bg="white"
              borderRadius="2xl"
              borderWidth={plan.highlight ? '2px' : '1px'}
              borderColor={plan.highlight ? C.green : C.border}
              p={6}
              position="relative"
              boxShadow={plan.highlight ? '0 4px 24px rgba(61,90,62,0.12)' : 'none'}
              mt={plan.highlight ? { base: 0, md: '-8px' } : 0}
            >
              {plan.badge && (
                <Box
                  position="absolute" top="-12px" left="50%" transform="translateX(-50%)"
                  bg={C.green} color="white" px={4} py={1} borderRadius="full"
                  fontSize="xs" fontWeight="700" whiteSpace="nowrap"
                >
                  {plan.badge}
                </Box>
              )}

              <Stack gap={4}>
                <Box>
                  <Text fontFamily="heading" fontWeight="800" fontSize="lg" color={C.text}>{plan.nombre}</Text>
                  <Text fontSize="xs" color={C.muted} mt={0.5}>{plan.subtitulo}</Text>
                </Box>

                <Box>
                  <Text fontFamily="heading" fontWeight="800" fontSize="2xl" color={plan.highlight ? C.green : C.text}>
                    {plan.precio}
                  </Text>
                  {plan.id !== 'freemium' && (
                    <Text fontSize="xs" color={C.muted}>por persona · cancela cuando quieras</Text>
                  )}
                </Box>

                <Box h="1px" bg={C.border} />

                <Stack gap={2}>
                  {plan.features.map(f => (
                    <Flex key={f} align="flex-start" gap={2}>
                      <Text color={C.green} fontWeight="700" fontSize="sm" flexShrink={0}>✓</Text>
                      <Text fontSize="sm" color={C.text}>{f}</Text>
                    </Flex>
                  ))}
                  {plan.locked.map(f => (
                    <Flex key={f} align="flex-start" gap={2} opacity={0.4}>
                      <Text color={C.muted} fontSize="sm" flexShrink={0}>✗</Text>
                      <Text fontSize="sm" color={C.muted}>{f}</Text>
                    </Flex>
                  ))}
                </Stack>

                <Button
                  w="full"
                  bg={plan.highlight ? C.green : 'transparent'}
                  color={plan.highlight ? 'white' : C.green}
                  borderWidth={plan.highlight ? '0' : '1.5px'}
                  borderColor={C.green}
                  borderRadius="full"
                  fontWeight="700"
                  size="lg"
                  _hover={{ opacity: 0.9 }}
                  loading={saving === plan.id}
                  onClick={() => elegirPlan(plan.id)}
                  mt={2}
                >
                  {plan.cta}
                </Button>
              </Stack>
            </Box>
          ))}
        </Flex>

        <Text textAlign="center" mt={8} fontSize="xs" color={C.muted}>
          Puedes cambiar de plan en cualquier momento desde tu perfil · Los pagos se procesarán próximamente
        </Text>
      </Container>
    </Box>
  )
}
