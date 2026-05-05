import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Button, Container, Flex, Stack, Text, Switch } from '@chakra-ui/react'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../providers/AuthProvider'
import AppLayout from '../app/AppLayout'
import PatientNav from '../organisms/PatientNav'
import type { HabitLog } from '../hooks/useHabits'

const C = {
  green: '#5F6F52',
  greenDark: '#4a5740',
  greenLight: '#eef2ea',
  cream: '#F9F4EF',
  beige: '#E9DFD3',
  border: 'rgba(95,111,82,0.15)',
  text: '#2D3319',
  muted: '#7a7264',
}

interface HabitDef {
  key: keyof HabitLog
  icon: string
  label: string
  description: string
}

const ALL_HABITS: HabitDef[] = [
  { key: 'agua', icon: '💧', label: 'Agua', description: 'Vasos de agua al día' },
  { key: 'sueno', icon: '😴', label: 'Sueño', description: 'Calidad y horas de descanso' },
  { key: 'actividad', icon: '🏃', label: 'Actividad física', description: 'Movimiento y ejercicio' },
  { key: 'frutasVerduras', icon: '🥦', label: 'Frutas y verduras', description: 'Porciones consumidas' },
  { key: 'digestion', icon: '🌿', label: 'Digestión', description: 'Cómo te sentís después de comer' },
  { key: 'estres', icon: '🧘', label: 'Estrés', description: 'Nivel de tensión emocional' },
]

interface HabitsConfig {
  enabled: Array<keyof HabitLog>
  order: Array<keyof HabitLog>
}

const DEFAULT_CONFIG: HabitsConfig = {
  enabled: ALL_HABITS.map(h => h.key),
  order: ALL_HABITS.map(h => h.key),
}

export default function HabitsPersonalizePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [config, setConfig] = useState<HabitsConfig>(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!user) return
    getDoc(doc(db, 'users', user.uid, 'habitsConfig', 'preferences')).then(snap => {
      if (snap.exists()) {
        const data = snap.data() as Partial<HabitsConfig>
        setConfig({
          enabled: data.enabled ?? DEFAULT_CONFIG.enabled,
          order: data.order ?? DEFAULT_CONFIG.order,
        })
      }
      setLoading(false)
    })
  }, [user])

  function toggle(key: keyof HabitLog) {
    setSaved(false)
    setConfig(prev => ({
      ...prev,
      enabled: prev.enabled.includes(key)
        ? prev.enabled.filter(k => k !== key)
        : [...prev.enabled, key],
    }))
  }

  function move(key: keyof HabitLog, direction: 'up' | 'down') {
    setSaved(false)
    setConfig(prev => {
      const idx = prev.order.indexOf(key)
      if (idx === -1) return prev
      const newOrder = [...prev.order]
      const target = direction === 'up' ? idx - 1 : idx + 1
      if (target < 0 || target >= newOrder.length) return prev
      ;[newOrder[idx], newOrder[target]] = [newOrder[target], newOrder[idx]]
      return { ...prev, order: newOrder }
    })
  }

  async function handleSave() {
    if (!user) return
    setSaving(true)
    try {
      await setDoc(
        doc(db, 'users', user.uid, 'habitsConfig', 'preferences'),
        { ...config, updatedAt: serverTimestamp() },
        { merge: true }
      )
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  // Render in current order
  const orderedHabits = config.order
    .map(key => ALL_HABITS.find(h => h.key === key))
    .filter((h): h is HabitDef => !!h)
  // Add any habits that aren't in order yet (forward-compat)
  const missing = ALL_HABITS.filter(h => !config.order.includes(h.key))
  const displayHabits = [...orderedHabits, ...missing]

  return (
    <AppLayout>
      <PatientNav />
      <Box bg={C.cream} minH="calc(100dvh - 56px)">
        <Container maxW="container.md" pt={6} pb={28}>
          {/* Header */}
          <Flex align="center" gap={3} mb={1}>
            <Box
              onClick={() => navigate('/habitos')}
              cursor="pointer" w={9} h={9} borderRadius="full"
              display="flex" alignItems="center" justifyContent="center"
              bg="white" borderWidth="1px" borderColor={C.border}
              _hover={{ borderColor: C.green }}
            >
              <Text fontSize="md" color={C.text}>‹</Text>
            </Box>
            <Text fontFamily="heading" fontWeight="800" fontSize="xl" color={C.text}>
              Personalizar hábitos
            </Text>
          </Flex>
          <Text fontSize="sm" color={C.muted} mb={5} ml="48px">
            Activá los hábitos que querés ver en tu dashboard. Cambiá el orden con las flechas.
          </Text>

          {loading ? (
            <Box bg="white" borderRadius="2xl" p={6} textAlign="center" borderWidth="1px" borderColor={C.border}>
              <Text fontSize="sm" color={C.muted}>Cargando...</Text>
            </Box>
          ) : (
            <>
              {/* Habits list */}
              <Box bg="white" borderRadius="2xl" borderWidth="1px" borderColor={C.border} mb={5} overflow="hidden">
                <Stack gap={0}>
                  {displayHabits.map((def, idx) => {
                    const isEnabled = config.enabled.includes(def.key)
                    return (
                      <Flex
                        key={def.key}
                        align="center" gap={3} p={4}
                        borderTopWidth={idx === 0 ? 0 : '1px'}
                        borderColor={C.border}
                      >
                        {/* Reorder arrows */}
                        <Stack gap={0.5}>
                          <Box
                            onClick={() => move(def.key, 'up')}
                            cursor={idx === 0 ? 'not-allowed' : 'pointer'}
                            opacity={idx === 0 ? 0.3 : 1}
                            color={C.muted} fontSize="sm" lineHeight="1"
                            _hover={{ color: idx === 0 ? C.muted : C.green }}
                          >
                            ▲
                          </Box>
                          <Box
                            onClick={() => move(def.key, 'down')}
                            cursor={idx === displayHabits.length - 1 ? 'not-allowed' : 'pointer'}
                            opacity={idx === displayHabits.length - 1 ? 0.3 : 1}
                            color={C.muted} fontSize="sm" lineHeight="1"
                            _hover={{ color: idx === displayHabits.length - 1 ? C.muted : C.green }}
                          >
                            ▼
                          </Box>
                        </Stack>

                        {/* Icon */}
                        <Box
                          w={10} h={10} borderRadius="lg"
                          bg={isEnabled ? C.greenLight : C.cream}
                          display="flex" alignItems="center" justifyContent="center"
                          flexShrink={0} opacity={isEnabled ? 1 : 0.5}
                        >
                          <Text fontSize="lg">{def.icon}</Text>
                        </Box>

                        {/* Label + description */}
                        <Box flex={1} minW={0}>
                          <Text
                            fontSize="sm" fontWeight="700"
                            color={isEnabled ? C.text : C.muted}
                          >
                            {def.label}
                          </Text>
                          <Text fontSize="xs" color={C.muted} truncate>{def.description}</Text>
                        </Box>

                        {/* Toggle */}
                        <Switch.Root
                          checked={isEnabled}
                          onCheckedChange={() => toggle(def.key)}
                          colorPalette="green"
                        >
                          <Switch.HiddenInput />
                          <Switch.Control bg={isEnabled ? C.green : C.border}>
                            <Switch.Thumb />
                          </Switch.Control>
                        </Switch.Root>
                      </Flex>
                    )
                  })}
                </Stack>
              </Box>

              {/* Custom habit teaser */}
              <Box
                bg={C.beige} borderRadius="2xl" p={4} mb={5}
                borderWidth="1.5px" borderColor={C.border} borderStyle="dashed"
              >
                <Flex align="center" gap={3}>
                  <Text fontSize="2xl">✨</Text>
                  <Box flex={1}>
                    <Text fontSize="sm" fontWeight="700" color={C.text}>Crear hábito personalizado</Text>
                    <Text fontSize="xs" color={C.muted}>Próximamente — definí tu propio nombre, icono y meta</Text>
                  </Box>
                </Flex>
              </Box>

              {/* Save button */}
              <Button
                onClick={handleSave}
                w="full" bg={saved ? '#22c55e' : C.green} color="white"
                borderRadius="full" fontWeight="700" size="lg"
                _hover={{ opacity: 0.9 }}
                loading={saving}
                disabled={saving}
              >
                {saved ? '✓ Guardado' : 'Guardar cambios'}
              </Button>

              <Text fontSize="xs" color={C.muted} textAlign="center" mt={3}>
                {config.enabled.length} de {ALL_HABITS.length} hábitos activos
              </Text>
            </>
          )}
        </Container>
      </Box>
    </AppLayout>
  )
}
