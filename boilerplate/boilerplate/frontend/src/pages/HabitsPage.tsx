import { useState } from 'react'
import { Box, Container, Flex, Grid, Stack, Text, Button } from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../app/AppLayout'
import PatientNav from '../organisms/PatientNav'
import { useAuth } from '../providers/AuthProvider'
import { useHabits, type HabitLog, type WeekDay } from '../hooks/useHabits'

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
  red: '#dc2626',
}

interface HabitDef {
  key: keyof HabitLog
  icon: string
  label: string
  unit: 'vasos' | 'horas' | 'porciones' | 'level'
  meta?: number
  invertedScore?: boolean // estrés: lower is better
  hint: string
}

const HABITS: HabitDef[] = [
  { key: 'agua', icon: '💧', label: 'Agua', unit: 'vasos', meta: 8, hint: 'Cuántos vasos hoy' },
  { key: 'sueno', icon: '😴', label: 'Sueño', unit: 'horas', meta: 8, hint: 'Horas dormidas' },
  { key: 'actividad', icon: '🏃', label: 'Actividad', unit: 'level', hint: 'Nivel de actividad' },
  { key: 'frutasVerduras', icon: '🥦', label: 'Frutas/Verd.', unit: 'porciones', meta: 5, hint: 'Porciones consumidas' },
  { key: 'digestion', icon: '🌿', label: 'Digestión', unit: 'level', hint: 'Cómo te sentiste' },
  { key: 'estres', icon: '🧘', label: 'Estrés', unit: 'level', invertedScore: true, hint: 'Nivel de estrés' },
]

type FilterType = 'todos' | 'activos' | 'inactivos'

function valueToDisplay(value: number, def: HabitDef): { primary: string; secondary?: string } {
  if (value === 0) return { primary: '—' }
  if (def.unit === 'vasos' && def.meta) {
    const cur = Math.round((value / 10) * def.meta)
    return { primary: `${cur}`, secondary: `/ ${def.meta}` }
  }
  if (def.unit === 'horas' && def.meta) {
    const hours = (4 + (value / 10) * 5).toFixed(1)
    return { primary: `${hours}`, secondary: 'h' }
  }
  if (def.unit === 'porciones' && def.meta) {
    const cur = Math.round((value / 10) * def.meta)
    return { primary: `${cur}`, secondary: `/ ${def.meta}` }
  }
  // level
  if (def.invertedScore) {
    if (value >= 7) return { primary: 'Bajo' }
    if (value >= 4) return { primary: 'Medio' }
    return { primary: 'Alto' }
  }
  if (value >= 7) return { primary: 'Alta' }
  if (value >= 4) return { primary: 'Media' }
  return { primary: 'Baja' }
}

function valueToColor(value: number, def: HabitDef): string {
  if (value === 0) return C.muted
  const isGood = def.invertedScore ? value >= 7 : value >= 7
  const isMid = def.invertedScore ? value >= 4 : value >= 4
  if (isGood) return C.green
  if (isMid) return C.amber
  return C.warning
}

interface HabitCardProps {
  def: HabitDef
  value: number
  active: boolean
  onClick: () => void
}

function HabitCard({ def, value, active, onClick }: HabitCardProps) {
  const display = valueToDisplay(value, def)
  const valueColor = valueToColor(value, def)

  return (
    <Box
      onClick={onClick}
      bg="white"
      borderRadius="2xl"
      p={4}
      borderWidth="1.5px"
      borderColor={active ? C.green : C.border}
      cursor="pointer"
      _hover={{ borderColor: C.green, transform: 'translateY(-1px)' }}
      transition="all 0.15s"
      position="relative"
    >
      <Flex align="center" gap={2} mb={3}>
        <Text fontSize="xl">{def.icon}</Text>
        <Text fontSize="xs" fontWeight="700" color={C.text} truncate>{def.label}</Text>
      </Flex>
      <Flex align="baseline" gap={1}>
        <Text fontFamily="heading" fontWeight="800" fontSize="xl" color={valueColor} lineHeight="1">
          {display.primary}
        </Text>
        {display.secondary && (
          <Text fontSize="xs" color={C.muted} fontWeight="500">{display.secondary}</Text>
        )}
      </Flex>
      {value > 0 && (
        <Text fontSize="9px" color={C.muted} mt={0.5}>
          {value === 10 ? '✓ completado' : 'Tocá para editar'}
        </Text>
      )}
      {value === 0 && (
        <Text fontSize="9px" color={C.muted} mt={0.5}>Tocá para registrar</Text>
      )}
    </Box>
  )
}

interface HabitEditorProps {
  def: HabitDef
  value: number
  onChange: (v: number) => void
  onClose: () => void
  onSave: () => Promise<void>
  saving: boolean
}

function HabitEditor({ def, value, onChange, onClose, onSave, saving }: HabitEditorProps) {
  const display = valueToDisplay(value, def)
  return (
    <Box
      position="fixed" inset={0} bg="blackAlpha.500" zIndex={1000}
      display="flex" alignItems="flex-end" justifyContent="center"
      onClick={onClose}
    >
      <Box
        bg="white" w="full" maxW="md" borderTopRadius="2xl" p={6}
        onClick={e => e.stopPropagation()}
        style={{ animation: 'slideUp 0.2s ease-out' }}
      >
        <Box w={10} h={1} bg={C.border} borderRadius="full" mx="auto" mb={4} />

        <Flex align="center" gap={3} mb={1}>
          <Text fontSize="3xl">{def.icon}</Text>
          <Box flex={1}>
            <Text fontFamily="heading" fontWeight="700" fontSize="lg" color={C.text}>{def.label}</Text>
            <Text fontSize="xs" color={C.muted}>{def.hint}</Text>
          </Box>
        </Flex>

        <Box textAlign="center" my={5}>
          <Flex align="baseline" justify="center" gap={1}>
            <Text fontFamily="heading" fontWeight="800" fontSize="4xl" color={valueToColor(value, def)} lineHeight="1">
              {display.primary}
            </Text>
            {display.secondary && (
              <Text fontSize="md" color={C.muted} fontWeight="600">{display.secondary}</Text>
            )}
          </Flex>
        </Box>

        {/* 1-10 selector */}
        <Flex gap={1.5} mb={5}>
          {[1,2,3,4,5,6,7,8,9,10].map(n => (
            <Box
              key={n} flex={1} h={3} borderRadius="full" cursor="pointer"
              bg={n <= value ? C.green : C.greenLight}
              onClick={() => onChange(n)}
              _hover={{ opacity: 0.8 }}
              transition="all 0.1s"
            />
          ))}
        </Flex>

        <Flex gap={2}>
          <Button
            onClick={onClose}
            flex={1} variant="outline" borderRadius="full"
            borderColor={C.border} color={C.muted} fontWeight="600"
          >
            Cancelar
          </Button>
          <Button
            onClick={async () => { await onSave(); onClose() }}
            flex={1} bg={C.green} color="white" borderRadius="full" fontWeight="700"
            _hover={{ opacity: 0.9 }} loading={saving}
          >
            Guardar
          </Button>
        </Flex>
      </Box>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </Box>
  )
}

function MiniBars({ data, habitKey }: { data: WeekDay[]; habitKey: keyof HabitLog }) {
  return (
    <Flex gap={1} align="flex-end" h={6}>
      {data.map(d => {
        const val = d[habitKey]
        const pct = (val / 10) * 100
        const color = val >= 7 ? C.green : val >= 4 ? C.amber : val > 0 ? C.warning : C.border
        return (
          <Box key={d.day} flex={1} h="full" display="flex" flexDirection="column" justifyContent="flex-end">
            <Box w="full" borderRadius="sm" style={{ height: `${pct || 8}%`, background: color, transition: 'height 0.3s' }} />
          </Box>
        )
      })}
    </Flex>
  )
}

export default function HabitsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { habits, update, save, saving, weekHistory } = useHabits(user?.uid)
  const [filter, setFilter] = useState<FilterType>('todos')
  const [editing, setEditing] = useState<HabitDef | null>(null)
  const [tempValue, setTempValue] = useState(0)

  // Active = has been logged at least once today (value > 0)
  const visibleHabits = HABITS.filter(h => {
    if (filter === 'activos') return habits[h.key] > 0
    if (filter === 'inactivos') return habits[h.key] === 0
    return true
  })

  const activeCount = HABITS.filter(h => habits[h.key] > 0).length

  function openEditor(def: HabitDef) {
    setTempValue(habits[def.key] || 5)
    setEditing(def)
  }

  async function handleSave() {
    if (editing) update(editing.key, tempValue)
    await save()
  }

  return (
    <AppLayout>
      <PatientNav />
      <Box bg={C.cream} minH="calc(100dvh - 56px)">
        <Container maxW="container.md" pt={6} pb={28}>
          {/* Header */}
          <Flex justify="space-between" align="flex-start" mb={4}>
            <Box>
              <Text fontFamily="heading" fontWeight="800" fontSize="2xl" color={C.text} lineHeight="1.1">
                Mis hábitos
              </Text>
              <Text fontSize="sm" color={C.muted} mt={1}>
                {activeCount} de {HABITS.length} registrados hoy
              </Text>
            </Box>
            <Button
              onClick={() => navigate('/habitos/personalizar')}
              size="sm" variant="outline" borderRadius="full"
              borderColor={C.border} color={C.green} fontWeight="600"
              _hover={{ borderColor: C.green, bg: C.greenLight }}
            >
              ⚙️ Personalizar
            </Button>
          </Flex>

          {/* Filter tabs */}
          <Flex gap={2} mb={5}>
            {(['todos', 'activos', 'inactivos'] as FilterType[]).map(f => (
              <Box
                key={f}
                onClick={() => setFilter(f)}
                px={4} py={1.5} borderRadius="full" cursor="pointer"
                bg={filter === f ? C.green : 'white'}
                borderWidth="1px"
                borderColor={filter === f ? C.green : C.border}
                transition="all 0.15s"
              >
                <Text
                  fontSize="xs" fontWeight="700"
                  color={filter === f ? 'white' : C.muted}
                  textTransform="capitalize"
                >
                  {f}
                  {f === 'activos' && ` (${activeCount})`}
                  {f === 'inactivos' && ` (${HABITS.length - activeCount})`}
                </Text>
              </Box>
            ))}
          </Flex>

          {/* Grid de hábitos */}
          {visibleHabits.length > 0 ? (
            <Grid templateColumns={{ base: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' }} gap={3} mb={6}>
              {visibleHabits.map(def => (
                <HabitCard
                  key={def.key}
                  def={def}
                  value={habits[def.key]}
                  active={habits[def.key] > 0}
                  onClick={() => openEditor(def)}
                />
              ))}
              {filter === 'todos' && (
                <Box
                  onClick={() => navigate('/habitos/personalizar')}
                  bg={C.greenLight} borderRadius="2xl" p={4}
                  borderWidth="1.5px" borderColor={C.border} borderStyle="dashed"
                  cursor="pointer" minH="100px"
                  display="flex" flexDirection="column" alignItems="center" justifyContent="center" gap={1}
                  _hover={{ borderColor: C.green }}
                  transition="all 0.15s"
                >
                  <Text fontSize="2xl">+</Text>
                  <Text fontSize="xs" color={C.green} fontWeight="600" textAlign="center">Crear hábito</Text>
                </Box>
              )}
            </Grid>
          ) : (
            <Box bg="white" borderRadius="2xl" p={8} textAlign="center" mb={6}>
              <Text fontSize="3xl" mb={2}>📋</Text>
              <Text fontSize="sm" color={C.muted}>
                {filter === 'activos' ? 'Aún no has registrado hábitos hoy.' : 'Todos los hábitos están registrados.'}
              </Text>
            </Box>
          )}

          {/* Historial semanal */}
          <Box bg="white" borderRadius="2xl" p={5} borderWidth="1px" borderColor={C.border}>
            <Flex justify="space-between" align="center" mb={4}>
              <Text fontFamily="heading" fontWeight="700" color={C.text}>Últimos 7 días</Text>
              <Button
                onClick={() => navigate('/progreso')}
                variant="ghost" size="xs" color={C.green} fontWeight="600"
                _hover={{ bg: C.greenLight }}
              >
                Ver detalle →
              </Button>
            </Flex>
            <Stack gap={3}>
              {HABITS.map(def => (
                <Flex key={def.key} align="center" gap={3}>
                  <Text fontSize="md" w={6} textAlign="center">{def.icon}</Text>
                  <Text fontSize="xs" color={C.text} fontWeight="600" w="80px" truncate>{def.label}</Text>
                  <Box flex={1}>
                    <MiniBars data={weekHistory} habitKey={def.key} />
                  </Box>
                </Flex>
              ))}
            </Stack>
          </Box>
        </Container>
      </Box>

      {editing && (
        <HabitEditor
          def={editing}
          value={tempValue}
          onChange={setTempValue}
          onClose={() => setEditing(null)}
          onSave={handleSave}
          saving={saving}
        />
      )}
    </AppLayout>
  )
}
