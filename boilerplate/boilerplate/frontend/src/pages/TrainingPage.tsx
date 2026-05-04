import { useState } from 'react'
import { Box, Container, Flex, Grid, Heading, Stack, Text } from '@chakra-ui/react'
import AppLayout from '../app/AppLayout'
import PatientNav from '../organisms/PatientNav'

const C = { green: '#5F6F52', greenLight: '#eef2ea', cream: '#F9F4EF', beige: '#E9DFD3', border: 'rgba(95,111,82,0.15)', text: '#2D3319', muted: '#7a7264', rose: '#C6A28F' }

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

const PLAN: Record<string, { tipo: string; emoji: string; ejercicios: Array<{ nombre: string; series: string; notas: string }> }> = {
  Lunes:    { tipo: 'Tren superior A', emoji: '💪', ejercicios: [
    { nombre: 'Press de banca', series: '4×10', notas: 'Agarre medio, pausa 1s abajo' },
    { nombre: 'Remo con barra', series: '4×10', notas: 'Espalda neutra, codos pegados al cuerpo' },
    { nombre: 'Press militar', series: '3×12', notas: 'De pie o sentado' },
    { nombre: 'Curl de bíceps', series: '3×12', notas: 'Supinación completa' },
    { nombre: 'Tríceps en polea', series: '3×15', notas: 'Codos fijos' },
  ]},
  Martes:   { tipo: 'Tren inferior A', emoji: '🦵', ejercicios: [
    { nombre: 'Sentadilla trasera', series: '4×8', notas: 'Profundidad paralela o más' },
    { nombre: 'Peso muerto rumano', series: '3×10', notas: 'Ligera flexión de rodillas' },
    { nombre: 'Prensa de piernas', series: '3×12', notas: 'Pies a ancho de hombros' },
    { nombre: 'Extensión de cuádriceps', series: '3×15', notas: 'Control en la bajada' },
    { nombre: 'Elevación de gemelos', series: '4×20', notas: 'Pausa arriba 1s' },
  ]},
  Miércoles:{ tipo: 'Cardio y core', emoji: '🏃', ejercicios: [
    { nombre: 'Cardio moderado', series: '30 min', notas: 'Zona 2: 60-70% FCmáx' },
    { nombre: 'Plancha frontal', series: '3×45s', notas: 'Core activo, glúteos apretados' },
    { nombre: 'Plancha lateral', series: '3×30s', notas: 'Cada lado' },
    { nombre: 'Crunch de bicicleta', series: '3×20', notas: 'Rotación controlada' },
    { nombre: 'Extensión lumbar', series: '3×15', notas: 'Sin hiperextensión' },
  ]},
  Jueves:   { tipo: 'Tren superior B', emoji: '💪', ejercicios: [
    { nombre: 'Press inclinado mancuernas', series: '4×10', notas: '30-45° de inclinación' },
    { nombre: 'Dominadas / Jalón', series: '4×8', notas: 'Agarre prono, ancho de hombros' },
    { nombre: 'Elevaciones laterales', series: '3×15', notas: 'Codos levemente flexionados' },
    { nombre: 'Curl martillo', series: '3×12', notas: 'Agarre neutro' },
    { nombre: 'Press francés', series: '3×12', notas: 'Codos apuntando al techo' },
  ]},
  Viernes:  { tipo: 'Tren inferior B', emoji: '🦵', ejercicios: [
    { nombre: 'Hip thrust', series: '4×12', notas: 'Pausa 1s arriba, máxima contracción glúteo' },
    { nombre: 'Zancadas caminando', series: '3×12', notas: 'Cada pierna, mancuernas' },
    { nombre: 'Sentadilla goblet', series: '3×15', notas: 'Kettlebell o mancuerna' },
    { nombre: 'Curl femoral tumbado', series: '3×12', notas: 'Control en la bajada' },
    { nombre: 'Abducción de cadera', series: '3×20', notas: 'Máquina o banda elástica' },
  ]},
  Sábado:   { tipo: 'Actividad libre', emoji: '🚴', ejercicios: [
    { nombre: 'Caminata o senderismo', series: '45-60 min', notas: 'Ritmo cómodo' },
    { nombre: 'Natación o ciclismo', series: '30-45 min', notas: 'Intensidad baja-moderada' },
    { nombre: 'Yoga / movilidad', series: '20 min', notas: 'Opcional — foco en flexibilidad' },
  ]},
  Domingo:  { tipo: 'Descanso activo', emoji: '😴', ejercicios: [
    { nombre: 'Stretching global', series: '15-20 min', notas: 'Todo el cuerpo' },
    { nombre: 'Foam roller', series: '10 min', notas: 'Zonas con tensión' },
    { nombre: 'Caminata suave', series: '20-30 min', notas: 'Opcional' },
  ]},
}

function ExerciseRow({ ej }: { ej: { nombre: string; series: string; notas: string } }) {
  const [done, setDone] = useState(false)
  return (
    <Flex align="center" gap={3} px={4} py={3} borderRadius="xl" _hover={{ bg: C.cream }}
      cursor="pointer" onClick={() => setDone(!done)} transition="all 0.15s"
      opacity={done ? 0.5 : 1}>
      <Box w={5} h={5} borderRadius="md" flexShrink={0} borderWidth="2px"
        bg={done ? C.green : 'white'} borderColor={done ? C.green : C.beige}
        display="flex" alignItems="center" justifyContent="center">
        {done && <Text color="white" fontSize="10px" fontWeight="800">✓</Text>}
      </Box>
      <Box flex={1}>
        <Flex align="center" gap={2}>
          <Text fontSize="sm" fontWeight="600" color={C.text} textDecoration={done ? 'line-through' : 'none'}>{ej.nombre}</Text>
          <Box px={2} py={0.5} borderRadius="full" bg={C.greenLight}>
            <Text fontSize="10px" fontWeight="700" color={C.green}>{ej.series}</Text>
          </Box>
        </Flex>
        <Text fontSize="xs" color={C.muted}>{ej.notas}</Text>
      </Box>
    </Flex>
  )
}

export default function TrainingPage() {
  const today = DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]
  const [activeDay, setActiveDay] = useState(today)
  const plan = PLAN[activeDay]

  return (
    <AppLayout>
      <PatientNav />
      <Box bg={C.cream} minH="calc(100dvh - 56px)" pb={24}>
        <Container maxW="3xl" py={8}>
          <Heading fontFamily="heading" fontWeight="800" color={C.text} fontSize={{ base: '2xl', md: '3xl' }} mb={1}>
            Plan de entrenamiento 🏋️
          </Heading>
          <Text color={C.muted} fontSize="sm" mb={6}>Incluido en tu Plan Full — 5 días/semana</Text>

          {/* Day selector */}
          <Box overflowX="auto" mb={6}>
            <Flex gap={2} pb={1} minW="max-content">
              {DAYS.map(day => (
                <Box key={day} px={4} py={2.5} borderRadius="xl" cursor="pointer"
                  bg={activeDay === day ? C.green : 'white'}
                  borderWidth="1px" borderColor={activeDay === day ? C.green : C.border}
                  onClick={() => setActiveDay(day)} flexShrink={0}
                  transition="all 0.2s">
                  <Text fontSize="xs" fontWeight="700" color={activeDay === day ? 'white' : C.muted}
                    whiteSpace="nowrap">
                    {day === today ? `${day} (hoy)` : day}
                  </Text>
                </Box>
              ))}
            </Flex>
          </Box>

          {/* Day card */}
          <Box bg="white" borderRadius="2xl" borderWidth="1px" borderColor={C.border} overflow="hidden">
            <Box px={5} py={4} bg={C.greenLight} borderBottomWidth="1px" borderColor={C.border}>
              <Flex align="center" gap={3}>
                <Text fontSize="2xl">{plan.emoji}</Text>
                <Box>
                  <Text fontFamily="heading" fontWeight="800" color={C.text} fontSize="lg">{activeDay}</Text>
                  <Text fontSize="sm" color={C.green} fontWeight="600">{plan.tipo}</Text>
                </Box>
                <Box ml="auto" px={3} py={1} borderRadius="full" bg="white" borderWidth="1px" borderColor={C.border}>
                  <Text fontSize="xs" color={C.muted} fontWeight="500">{plan.ejercicios.length} ejercicios</Text>
                </Box>
              </Flex>
            </Box>

            <Stack gap={0} px={2} py={3}>
              {plan.ejercicios.map((ej, i) => <ExerciseRow key={i} ej={ej} />)}
            </Stack>

            <Box px={5} py={4} borderTopWidth="1px" borderColor={C.border}>
              <Text fontSize="xs" color={C.muted}>
                💡 Descansa 90s–2min entre series para fuerza, 45s–60s para hipertrofia.
              </Text>
            </Box>
          </Box>

          {/* Weekly overview */}
          <Box bg="white" borderRadius="2xl" p={5} borderWidth="1px" borderColor={C.border} mt={5}>
            <Text fontFamily="heading" fontWeight="700" color={C.text} mb={4}>Resumen semanal</Text>
            <Grid templateColumns={{ base: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }} gap={3}>
              {[
                { icon: '💪', label: 'Sesiones fuerza', value: '4/sem' },
                { icon: '🏃', label: 'Cardio', value: '1/sem' },
                { icon: '🚴', label: 'Actividad libre', value: '1/sem' },
                { icon: '😴', label: 'Descanso', value: '1/sem' },
              ].map(s => (
                <Box key={s.label} p={3} bg={C.cream} borderRadius="xl" textAlign="center">
                  <Text fontSize="xl" mb={1}>{s.icon}</Text>
                  <Text fontWeight="800" color={C.green} fontSize="lg">{s.value}</Text>
                  <Text fontSize="xs" color={C.muted}>{s.label}</Text>
                </Box>
              ))}
            </Grid>
          </Box>
        </Container>
      </Box>
    </AppLayout>
  )
}
