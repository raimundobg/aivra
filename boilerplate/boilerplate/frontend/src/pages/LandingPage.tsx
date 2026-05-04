import { Box, Button, Container, Flex, Grid, Heading, Stack, Text, Badge } from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'

// ─── Theme tokens (matching Amalia reference) ─────────────────────────────────
const C = {
  green: '#3d5a3e',
  greenLight: '#f0f4f0',
  greenMid: '#6b8f6c',
  tan: '#8b6914',
  cream: '#faf9f7',
  border: '#e8e4df',
  text: '#1a1a1a',
  muted: '#6b6b6b',
  cardBg: '#ffffff',
}

// ─── Plans ────────────────────────────────────────────────────────────────────
const PLANS = [
  {
    badge: 'Automático',
    badgeColor: C.green,
    name: 'Low Cost',
    desc: 'Pauta nutricional automática generada con IA. Sin contacto directo con la nutricionista.',
    price: '$19.990',
    period: '/único',
    highlight: false,
    features: [
      'Encuesta de evaluación inicial',
      'Pauta nutricional personalizada por IA',
      'Cálculo de macros y calorías',
      'Plan de alimentación semanal',
      'Sin seguimiento personalizado',
      'Entrega en 24 hrs',
    ],
    cta: 'Comenzar ahora',
    ctaTo: '/register?plan=lowcost',
  },
  {
    badge: null,
    badgeColor: '',
    name: '1 o 3 Meses con Seguimiento',
    desc: 'Consulta personal + seguimiento completo + acceso a toda la plataforma. Elige 1 o 3 meses.',
    price: 'Desde $79.990',
    period: '/mes',
    highlight: true,
    features: [
      'Encuesta previa a consulta',
      'Consulta online 1:1 (60 min)',
      'Pauta nutricional 100% personalizada',
      'Acceso completo a la plataforma',
      'Recetarios y listas de supermercado',
      'Grupo WhatsApp motivacional',
      'Seguimiento semanal por WhatsApp',
      'Recomendaciones semanales',
      '1 mes: $79.990 | 3 meses: $199.990',
    ],
    cta: 'Comenzar ahora',
    ctaTo: '/register?plan=seguimiento',
  },
  {
    badge: 'Premium',
    badgeColor: C.tan,
    name: 'Full: Nutrición + Entrenamiento',
    desc: 'Programa integral con nutrición personalizada + plan de entrenamiento adaptado a tu equipamiento. Opción 1 o 3 meses.',
    price: 'Desde $149.990',
    period: '/mes',
    highlight: false,
    features: [
      'Todo lo del plan con acompañamiento',
      'Plan de entrenamiento personalizado',
      'Distribución por días y grupos musculares',
      'Adaptado a tu equipamiento disponible',
      'Sistema de seguimiento de ejercicios',
      'Registro de pesos y repeticiones',
      'Gráficos de progreso automáticos',
      'Acceso al blog de nutrición y entrenamiento',
      '1 mes: $149.990 | 3 meses: $379.990',
    ],
    cta: 'Comenzar ahora',
    ctaTo: '/register?plan=full',
  },
]

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar() {
  const navigate = useNavigate()
  return (
    <Box position="sticky" top={0} zIndex={100} bg="black" borderBottomWidth="1px" borderColor="gray.800">
      <Container maxW="7xl">
        <Flex h={14} align="center" justify="space-between">
          <Flex align="center" gap={3}>
            <Box w={8} h={8} bg={C.green} borderRadius="full"
              display="flex" alignItems="center" justifyContent="center">
              <Text color="white" fontWeight="800" fontSize="xs" fontFamily="heading">AI</Text>
            </Box>
            <Text color="white" fontFamily="heading" fontWeight="700" fontSize="md">Aivra</Text>
          </Flex>

          <Flex gap={8} display={{ base: 'none', md: 'flex' }}>
            {['Inicio', 'Planes', 'Sobre Aivra', 'Contacto'].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`}
                style={{ color: '#d1d5db', fontSize: '14px', fontWeight: 400, cursor: 'pointer', textDecoration: 'none' }}>
                {item}
              </a>
            ))}
          </Flex>

          <Button onClick={() => navigate('/register')}
            bg={C.green} color="white" size="sm" borderRadius="full" px={5}
            _hover={{ opacity: 0.9 }} fontWeight="600" fontSize="sm">
            Comenzar
          </Button>
        </Flex>
      </Container>
    </Box>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  const navigate = useNavigate()
  return (
    <Box bg={C.cream} pt={{ base: 16, md: 24 }} pb={{ base: 16, md: 20 }} id="inicio">
      <Container maxW="3xl" textAlign="center">
        <Badge px={4} py={1.5} borderRadius="full" bg={C.greenLight}
          color={C.green} fontSize="sm" fontWeight="500" mb={6}
          display="inline-flex" alignItems="center" gap={2}>
          ✦ Nutrición inteligente y personalizada
        </Badge>

        <Heading fontFamily="heading" fontSize={{ base: '3xl', md: '5xl' }}
          fontWeight="800" lineHeight="1.15" color={C.text} mb={6}>
          Transforma tu composición corporal con un plan{' '}
          <Box as="span" color={C.green}>inteligente, personalizado</Box>
          {' '}y flexible.
        </Heading>

        <Text fontSize={{ base: 'md', md: 'lg' }} color={C.muted} mb={10} maxW="2xl" mx="auto">
          Aivra combina inteligencia artificial y nutrición clínica para crear
          el plan exacto que tu cuerpo necesita, con seguimiento real de tu progreso.
        </Text>

        <Flex gap={4} justify="center" flexWrap="wrap">
          <Button onClick={() => navigate('/register')}
            bg={C.green} color="white" size="lg" borderRadius="full" px={8}
            _hover={{ opacity: 0.9 }} fontWeight="600">
            Ver planes →
          </Button>
          <Button onClick={() => navigate('/login')}
            variant="outline" size="lg" borderRadius="full" px={8}
            fontWeight="600" color={C.text} borderColor={C.border}>
            Ingresar
          </Button>
        </Flex>
      </Container>
    </Box>
  )
}

// ─── Plans ────────────────────────────────────────────────────────────────────
function Plans() {
  const navigate = useNavigate()
  return (
    <Box py={{ base: 16, md: 24 }} bg="white" id="planes">
      <Container maxW="7xl">
        <Text textAlign="center" color={C.green} fontWeight="600" fontSize="sm"
          mb={3} textTransform="uppercase" letterSpacing="wider">
          Planes
        </Text>
        <Heading textAlign="center" fontFamily="heading" fontSize={{ base: '2xl', md: '3xl' }}
          mb={3} color={C.text}>
          Elige tu camino
        </Heading>
        <Text textAlign="center" color={C.muted} mb={12} fontSize="md">
          Todos los planes incluyen acceso a la plataforma y seguimiento de progreso.
        </Text>

        <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={6} alignItems="start">
          {PLANS.map(plan => (
            <Box key={plan.name} position="relative"
              borderWidth={plan.highlight ? '2px' : '1px'}
              borderColor={plan.highlight ? C.green : C.border}
              borderRadius="2xl" bg={C.cardBg} overflow="hidden"
              shadow={plan.highlight ? 'lg' : 'sm'}>

              {plan.badge && (
                <Box px={5} py={2} bg={plan.badgeColor}>
                  <Text color="white" fontSize="xs" fontWeight="700" textTransform="uppercase" letterSpacing="wider">
                    {plan.badge}
                  </Text>
                </Box>
              )}

              <Box p={6}>
                <Flex align="center" justify="center" w={12} h={12}
                  bg={C.greenLight} borderRadius="full" mb={4}>
                  <Text fontSize="xl">{plan.highlight ? '⭐' : plan.badge === 'Premium' ? '⚙️' : '⚡'}</Text>
                </Flex>

                <Text fontFamily="heading" fontWeight="700" fontSize="xl" color={C.text} mb={2}>
                  {plan.name}
                </Text>
                <Text fontSize="sm" color={C.muted} mb={5} lineHeight="1.6">{plan.desc}</Text>

                <Flex align="baseline" gap={1} mb={6}>
                  <Text fontFamily="heading" fontWeight="800" fontSize="2xl" color={C.text}>
                    {plan.price}
                  </Text>
                  <Text fontSize="sm" color={C.muted}>{plan.period}</Text>
                </Flex>

                <Stack gap={2.5} mb={7}>
                  {plan.features.map(f => (
                    <Flex key={f} align="flex-start" gap={2.5}>
                      <Text color={C.green} fontSize="sm" mt={0.5} flexShrink={0}>✓</Text>
                      <Text fontSize="sm" color={C.muted} lineHeight="1.5">{f}</Text>
                    </Flex>
                  ))}
                </Stack>

                <Button onClick={() => navigate(plan.ctaTo)} w="full" size="md"
                  borderRadius="full" bg={plan.highlight ? C.green : 'transparent'}
                  color={plan.highlight ? 'white' : C.text}
                  borderWidth={plan.highlight ? '0' : '1px'} borderColor={C.border}
                  _hover={{ bg: plan.highlight ? C.greenMid : C.greenLight, borderColor: C.green }}
                  fontWeight="600" transition="all 0.2s">
                  {plan.cta}
                </Button>
              </Box>
            </Box>
          ))}
        </Grid>
      </Container>
    </Box>
  )
}

// ─── For Nutritionists ────────────────────────────────────────────────────────
function ForProfessionals() {
  const navigate = useNavigate()
  return (
    <Box py={{ base: 14, md: 20 }} bg={C.green}>
      <Container maxW="5xl">
        <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={10} alignItems="center">
          <Box>
            <Text color="whiteAlpha.700" fontWeight="600" fontSize="sm"
              textTransform="uppercase" letterSpacing="wider" mb={3}>
              Para profesionales
            </Text>
            <Heading fontFamily="heading" fontSize={{ base: '2xl', md: '3xl' }}
              color="white" mb={4} lineHeight="1.2">
              ¿Eres nutricionista o profesional de la salud?
            </Heading>
            <Text color="whiteAlpha.800" fontSize="md" lineHeight="1.7" mb={6}>
              Gestiona tus pacientes, genera pautas con IA, monitorea adherencia
              y mantén comunicación directa — todo en una sola plataforma diseñada
              para profesionales de la nutrición.
            </Text>
            <Flex gap={3} flexWrap="wrap">
              <Button onClick={() => navigate('/register?role=nutritionist')}
                bg="white" color={C.green} size="lg" borderRadius="full" px={8}
                fontWeight="700" _hover={{ opacity: 0.9 }}>
                Accede aquí →
              </Button>
              <Button variant="outline" size="lg" borderRadius="full" px={8}
                color="white" borderColor="whiteAlpha.500"
                _hover={{ bg: 'whiteAlpha.100' }} fontWeight="500">
                Ver demo
              </Button>
            </Flex>
          </Box>

          <Grid templateColumns="1fr 1fr" gap={4}>
            {[
              { icon: '👥', title: 'Gestión de pacientes', desc: 'Fichas clínicas completas con historial' },
              { icon: '🤖', title: 'Pautas con IA', desc: 'Genera planes en segundos con Gemini' },
              { icon: '📊', title: 'Adherencia en tiempo real', desc: 'Alertas automáticas de baja adherencia' },
              { icon: '💬', title: 'Chat directo', desc: 'Comunicación integrada con tus pacientes' },
            ].map(item => (
              <Box key={item.title} p={4} bg="whiteAlpha.100" borderRadius="xl"
                borderWidth="1px" borderColor="whiteAlpha.200">
                <Text fontSize="xl" mb={2}>{item.icon}</Text>
                <Text color="white" fontWeight="600" fontSize="sm" mb={1}>{item.title}</Text>
                <Text color="whiteAlpha.700" fontSize="xs" lineHeight="1.5">{item.desc}</Text>
              </Box>
            ))}
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}

// ─── Social proof ─────────────────────────────────────────────────────────────
function SocialProof() {
  return (
    <Box py={{ base: 14, md: 18 }} bg={C.cream}>
      <Container maxW="6xl">
        <Text textAlign="center" color={C.green} fontWeight="600" fontSize="sm"
          mb={8} textTransform="uppercase" letterSpacing="wider">
          Lo que dicen nuestros usuarios
        </Text>
        <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={6}>
          {[
            { name: 'María G.', plan: 'Plan con Seguimiento', text: 'Bajé 6kg en 2 meses siguiendo la pauta. El seguimiento semanal marcó la diferencia.' },
            { name: 'Catalina M.', plan: 'Low Cost', text: 'La pauta IA fue sorprendentemente buena. Los macros calculados me ayudaron a entender qué comer.' },
            { name: 'Felipe R.', plan: 'Plan Full', text: 'Combiné la nutrición con el entrenamiento y los resultados fueron increíbles. 100% recomendado.' },
          ].map(r => (
            <Box key={r.name} p={6} bg="white" borderRadius="2xl"
              borderWidth="1px" borderColor={C.border} shadow="sm">
              <Text color={C.green} fontSize="xl" mb={3}>★★★★★</Text>
              <Text color={C.text} fontSize="sm" lineHeight="1.7" mb={4}>"{r.text}"</Text>
              <Flex align="center" gap={3}>
                <Box w={9} h={9} bg={C.greenLight} borderRadius="full"
                  display="flex" alignItems="center" justifyContent="center">
                  <Text fontSize="xs" fontWeight="700" color={C.green}>
                    {r.name.split(' ').map(n => n[0]).join('')}
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="600" color={C.text}>{r.name}</Text>
                  <Text fontSize="xs" color={C.muted}>{r.plan}</Text>
                </Box>
              </Flex>
            </Box>
          ))}
        </Grid>
      </Container>
    </Box>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <Box bg="black" py={10}>
      <Container maxW="7xl">
        <Grid templateColumns={{ base: '1fr', md: '2fr 1fr 1fr 1fr' }} gap={8} mb={8}>
          <Box>
            <Flex align="center" gap={3} mb={4}>
              <Box w={8} h={8} bg={C.green} borderRadius="full"
                display="flex" alignItems="center" justifyContent="center">
                <Text color="white" fontWeight="800" fontSize="xs">AI</Text>
              </Box>
              <Text color="white" fontFamily="heading" fontWeight="700">Aivra</Text>
            </Flex>
            <Text color="gray.500" fontSize="sm" lineHeight="1.7">
              Nutrición inteligente y personalizada para transformar tu composición corporal.
            </Text>
          </Box>
          {[
            { title: 'Plataforma', links: ['Planes', 'Cómo funciona', 'Blog', 'Chat IA'] },
            { title: 'Profesionales', links: ['Acceso nutricionistas', 'Demo', 'Soporte'] },
            { title: 'Contacto', links: ['hola@aivra.app', 'Instagram', 'WhatsApp'] },
          ].map(col => (
            <Box key={col.title}>
              <Text color="white" fontWeight="600" fontSize="sm" mb={3}>{col.title}</Text>
              <Stack gap={2}>
                {col.links.map(l => (
                  <Text key={l} color="gray.500" fontSize="sm" cursor="pointer"
                    _hover={{ color: 'gray.300' }} transition="color 0.2s">{l}</Text>
                ))}
              </Stack>
            </Box>
          ))}
        </Grid>
        <Box borderTopWidth="1px" borderColor="gray.800" pt={6}>
          <Text color="gray.600" fontSize="xs" textAlign="center">
            © 2026 Aivra. Todos los derechos reservados.
          </Text>
        </Box>
      </Container>
    </Box>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <Box>
      <Navbar />
      <Hero />
      <Plans />
      <ForProfessionals />
      <SocialProof />
      <Footer />
    </Box>
  )
}
