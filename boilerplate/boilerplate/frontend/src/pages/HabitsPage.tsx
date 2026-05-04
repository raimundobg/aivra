import { useState } from 'react'
import { Box, Container, Flex, Grid, Stack, Text, Button } from '@chakra-ui/react'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts'
import AppLayout from '../app/AppLayout'
import PatientNav from '../organisms/PatientNav'
import { useAuth } from '../providers/AuthProvider'
import { useHabits, type HabitLog } from '../hooks/useHabits'

const C = { green: '#3d5a3e', greenLight: '#f0f4f0', cream: '#faf9f7', border: '#e8e4df', text: '#1a1a1a', muted: '#6b6b6b' }

const labels: Record<keyof HabitLog, string> = {
  agua: 'Hidratación', sueno: 'Sueño', estres: 'Calma',
  actividad: 'Actividad', frutasVerduras: 'Frutas/Verd.', digestion: 'Digestión',
}

const ITEMS = [
  { key: 'agua' as keyof HabitLog, icon: '💧', label: 'Hidratación', hint: '10 = 2L o más' },
  { key: 'sueno' as keyof HabitLog, icon: '😴', label: 'Calidad del sueño', hint: '10 = excelente descanso' },
  { key: 'estres' as keyof HabitLog, icon: '🧘', label: 'Nivel de calma', hint: '10 = muy tranquilo' },
  { key: 'actividad' as keyof HabitLog, icon: '🏃', label: 'Actividad física', hint: '10 = muy activo' },
  { key: 'frutasVerduras' as keyof HabitLog, icon: '🥦', label: 'Frutas y verduras', hint: '10 = 5 porciones o más' },
  { key: 'digestion' as keyof HabitLog, icon: '🌿', label: 'Digestión', hint: '10 = sin molestias' },
]

import type { WeekDay } from '../hooks/useHabits'

function BarWeek({ data, habitKey }: { data: WeekDay[]; habitKey: keyof HabitLog }) {
  return (
    <Flex gap={1} align="flex-end" h={10}>
      {data.map(d => {
        const val = d[habitKey]
        const pct = (val / 10) * 100
        const color = val >= 7 ? C.green : val >= 5 ? '#d97706' : '#dc2626'
        return (
          <Box key={d.day} flex={1} display="flex" flexDirection="column" alignItems="center" gap={0.5}>
            <Box w="full" borderRadius="sm"
              style={{ height: `${pct}%`, background: color, minHeight: 4, transition: 'height 0.3s' }} />
            <Text fontSize="9px" color={C.muted}>{d.day}</Text>
          </Box>
        )
      })}
    </Flex>
  )
}

export default function HabitsPage() {
  const { user } = useAuth()
  const { habits, update, save, saving, weekHistory } = useHabits(user?.uid)
  const [saved, setSaved] = useState(false)

  const radarData = (Object.keys(habits) as Array<keyof HabitLog>).map(k => ({
    axis: labels[k], value: habits[k],
  }))
  const allFilled = Object.values(habits).every(v => v > 0)

  async function handleSave() {
    await save()
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <AppLayout>
      <PatientNav />
      <Box bg={C.cream} minH="calc(100dvh - 56px)">
        <Container maxW="2xl" py={8}>
          <Text fontFamily="heading" fontWeight="800" fontSize="2xl" color={C.text} mb={1}>
            Mis Hábitos
          </Text>
          <Text fontSize="sm" color={C.green} mb={6}>
            {new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>

          {/* Today log */}
          <Box bg="white" borderRadius="2xl" p={6} borderWidth="1px" borderColor={C.border} mb={5}>
            <Stack gap={6}>
              {ITEMS.map(item => (
                <Box key={item.key}>
                  <Flex justify="space-between" align="center" mb={3}>
                    <Flex align="center" gap={2}>
                      <Text fontSize="xl">{item.icon}</Text>
                      <Box>
                        <Text fontSize="sm" fontWeight="600" color={C.text}>{item.label}</Text>
                        <Text fontSize="xs" color={C.muted}>{item.hint}</Text>
                      </Box>
                    </Flex>
                    <Text fontFamily="heading" fontWeight="800" fontSize="xl"
                      color={habits[item.key] > 0 ? C.green : C.border}>
                      {habits[item.key] > 0 ? habits[item.key] : '—'}
                      <Text as="span" fontSize="xs" color={C.muted} fontWeight="400">/10</Text>
                    </Text>
                  </Flex>
                  <Flex gap={1.5}>
                    {[1,2,3,4,5,6,7,8,9,10].map(n => (
                      <Box
                        key={n} flex={1} h={2.5} borderRadius="full" cursor="pointer"
                        bg={n <= habits[item.key] ? C.green : C.border}
                        onClick={() => { update(item.key, n); setSaved(false) }}
                        transition="background 0.1s"
                        _hover={{ opacity: 0.75 }}
                      />
                    ))}
                  </Flex>
                </Box>
              ))}
            </Stack>

            <Button
              mt={6} w="full" borderRadius="full" size="lg" fontWeight="700"
              bg={saved ? '#22c55e' : allFilled ? C.green : C.border}
              color={allFilled || saved ? 'white' : C.muted}
              _hover={{ opacity: 0.9 }}
              onClick={handleSave}
              disabled={!allFilled || saving}
              transition="all 0.2s"
            >
              {saving ? 'Guardando...' : saved ? '✓ Registro guardado' : allFilled ? 'Guardar registro de hoy' : 'Completa todos los hábitos'}
            </Button>
          </Box>

          {/* Radar */}
          {allFilled && (
            <Box bg="white" borderRadius="2xl" p={6} borderWidth="1px" borderColor={C.border} mb={5}>
              <Text fontFamily="heading" fontWeight="700" color={C.text} mb={4}>Radar de hoy</Text>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                  <PolarGrid stroke={C.border} />
                  <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11, fill: C.muted }} />
                  <Tooltip
                    formatter={(v: unknown) => [`${v}/10`]}
                    contentStyle={{ borderRadius: 12, fontSize: 12, border: `1px solid ${C.border}` }}
                  />
                  <Radar dataKey="value" stroke={C.green} fill={C.green} fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </Box>
          )}

          {/* Weekly history */}
          <Box bg="white" borderRadius="2xl" p={6} borderWidth="1px" borderColor={C.border}>
            <Text fontFamily="heading" fontWeight="700" color={C.text} mb={5}>Historial semanal</Text>
            <Grid templateColumns="repeat(2, 1fr)" gap={4}>
              {ITEMS.map(item => (
                <Box key={item.key} p={3} bg={C.cream} borderRadius="xl">
                  <Flex align="center" gap={1.5} mb={2}>
                    <Text fontSize="md">{item.icon}</Text>
                    <Text fontSize="xs" fontWeight="600" color={C.text}>{item.label}</Text>
                  </Flex>
                  <BarWeek data={weekHistory} habitKey={item.key} />
                </Box>
              ))}
            </Grid>
          </Box>
        </Container>
      </Box>
    </AppLayout>
  )
}
