import { useState, useEffect } from 'react'
import { Box, Button, Container, Flex, Input, Stack, Text } from '@chakra-ui/react'
import AppLayout from '../app/AppLayout'
import PatientNav from '../organisms/PatientNav'
import { useAuth } from '../providers/AuthProvider'
import { useNavigate } from 'react-router-dom'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db, auth } from '../config/firebase'
import { updateProfile } from 'firebase/auth'
import { useHabits } from '../hooks/useHabits'
import { generarPautaBasica } from '../services/groq'

const C = { green: '#3d5a3e', greenLight: '#f0f4f0', cream: '#faf9f7', border: '#e8e4df', text: '#1a1a1a', muted: '#6b6b6b' }

const MENU_ITEMS = [
  { icon: '👤', label: 'Mis datos personales', sub: 'Nombre, RUT, contacto', path: '#', editable: true },
  { icon: '🥗', label: 'Restricciones alimentarias', sub: 'Alergias e intolerancias', path: '#', editable: false },
  { icon: '🏃', label: 'Hábitos y estilo de vida', sub: 'Actividad, sueño, estrés', path: '/habitos', editable: false },
  { icon: '🎯', label: 'Mis objetivos', sub: 'Meta nutricional y plan', path: '#', editable: false },
  { icon: '🔔', label: 'Notificaciones', sub: 'Recordatorios y alertas', path: '#', editable: false },
  { icon: '🔒', label: 'Seguridad', sub: 'Cambiar contraseña', path: '#', editable: false },
]

function planLabel(plan?: string): string {
  if (plan === 'ia') return 'Plan 100% IA'
  if (plan === 'full') return 'Plan Full con nutricionista'
  if (plan === 'freemium') return 'Plan Freemium'
  return 'Sin plan activo'
}

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { adherence, streak } = useHabits(user?.uid)

  const displayName = user?.displayName ?? user?.email ?? 'Paciente'
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  const [plan, setPlan] = useState<string | undefined>(undefined)
  const [daysActive, setDaysActive] = useState(1)
  const [editingPersonal, setEditingPersonal] = useState(false)
  const [nombre, setNombre] = useState(user?.displayName ?? user?.email?.split('@')[0] ?? '')
  const [telefono, setTelefono] = useState('')
  const [peso, setPeso] = useState('')
  const [talla, setTalla] = useState('')
  const [objetivo, setObjetivo] = useState('')
  const [saving, setSaving] = useState(false)
  const [regenerando, setRegenerando] = useState(false)

  const OBJETIVOS = [
    { v: 'bajar_peso', label: '⬇️ Bajar de peso' },
    { v: 'ganar_masa', label: '💪 Ganar músculo' },
    { v: 'mantener', label: '⚖️ Mantener peso' },
    { v: 'salud', label: '❤️ Mejorar salud' },
    { v: 'rendimiento', label: '🏃 Rendimiento' },
  ]

  useEffect(() => {
    if (!user) return
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      const data = snap.data()
      if (!data) return
      setPlan(data.plan)
      if (data.phone) setTelefono(data.phone)
      if (data.peso) setPeso(String(data.peso))
      if (data.talla) setTalla(String(data.talla))
      if (data.objetivo) setObjetivo(data.objetivo)
      const createdAt = data.createdAt?.toDate() as Date | undefined
      if (createdAt) {
        const days = Math.min(Math.max(Math.floor((Date.now() - createdAt.getTime()) / 86400000) + 1, 1), 30)
        setDaysActive(days)
      }
    })
  }, [user])

  async function handleSavePersonal() {
    if (!user || saving) return
    setSaving(true)
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: nombre })
      }
      await setDoc(doc(db, 'users', user.uid), {
        displayName: nombre, phone: telefono,
        ...(peso && { peso }), ...(talla && { talla }), ...(objetivo && { objetivo }),
        basicProfileCompleted: !!(nombre && objetivo && peso && talla),
      }, { merge: true })
      setEditingPersonal(false)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  async function handleRegenerarPauta() {
    if (!user || regenerando || !peso || !talla) return
    setRegenerando(true)
    try {
      const p = await generarPautaBasica({
        nombre: nombre || 'Paciente',
        objetivo: objetivo || 'salud',
        peso: parseFloat(peso),
        talla: parseFloat(talla),
      })
      await setDoc(doc(db, 'users', user.uid, 'pauta', 'current'), {
        ...p, generadoPor: 'ia', generadoAt: serverTimestamp(),
      })
    } catch (e) {
      console.error(e)
    } finally {
      setRegenerando(false)
    }
  }

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <AppLayout>
      <PatientNav />
      <Box bg={C.cream} minH="calc(100dvh - 56px)">
        <Container maxW="lg" py={8}>

          {/* Avatar card */}
          <Box bg="white" borderRadius="2xl" p={6} borderWidth="1px" borderColor={C.border} mb={4} textAlign="center">
            <Box
              w={20} h={20} borderRadius="full" bg={C.green} mx="auto"
              display="flex" alignItems="center" justifyContent="center" mb={3}
            >
              <Text fontSize="2xl" fontWeight="800" color="white" fontFamily="heading">{initials}</Text>
            </Box>
            <Text fontFamily="heading" fontWeight="700" fontSize="xl" color={C.text}>{displayName}</Text>
            <Text fontSize="sm" color={C.muted} mt={0.5}>{user?.email}</Text>
            <Box mt={3} display="inline-block" px={4} py={1} bg={C.greenLight} borderRadius="full">
              <Text fontSize="xs" color={C.green} fontWeight="600">{planLabel(plan)}</Text>
            </Box>
          </Box>

          {/* Edit personal data form */}
          {editingPersonal && (
            <Box bg="white" borderRadius="2xl" p={6} borderWidth="1px" borderColor={C.border} mb={4}>
              <Text fontFamily="heading" fontWeight="700" fontSize="md" color={C.text} mb={4}>Editar datos personales</Text>
              <Stack gap={4}>
                <Box>
                  <Text fontSize="sm" fontWeight="500" color={C.text} mb={1}>Nombre completo</Text>
                  <Input
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    placeholder="Tu nombre completo"
                    borderRadius="xl"
                    borderColor={C.border}
                    _focus={{ borderColor: C.green, boxShadow: 'none' }}
                  />
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="500" color={C.text} mb={1}>Teléfono</Text>
                  <Input
                    value={telefono}
                    onChange={e => setTelefono(e.target.value)}
                    placeholder="+56 9 XXXX XXXX"
                    borderRadius="xl"
                    borderColor={C.border}
                    _focus={{ borderColor: C.green, boxShadow: 'none' }}
                  />
                </Box>
                <Flex gap={3}>
                  <Box flex={1}>
                    <Text fontSize="sm" fontWeight="500" color={C.text} mb={1}>Peso (kg)</Text>
                    <Input value={peso} onChange={e => setPeso(e.target.value)} placeholder="Ej: 68" type="number"
                      borderRadius="xl" borderColor={C.border} _focus={{ borderColor: C.green, boxShadow: 'none' }} />
                  </Box>
                  <Box flex={1}>
                    <Text fontSize="sm" fontWeight="500" color={C.text} mb={1}>Talla (cm)</Text>
                    <Input value={talla} onChange={e => setTalla(e.target.value)} placeholder="Ej: 165" type="number"
                      borderRadius="xl" borderColor={C.border} _focus={{ borderColor: C.green, boxShadow: 'none' }} />
                  </Box>
                </Flex>
                <Box>
                  <Text fontSize="sm" fontWeight="500" color={C.text} mb={2}>Objetivo principal</Text>
                  <Flex gap={2} flexWrap="wrap">
                    {OBJETIVOS.map(o => (
                      <Box key={o.v} px={3} py={1.5} borderRadius="full" cursor="pointer"
                        fontSize="xs" fontWeight="500" borderWidth="1px"
                        bg={objetivo === o.v ? C.green : 'white'}
                        color={objetivo === o.v ? 'white' : C.muted}
                        borderColor={objetivo === o.v ? C.green : C.border}
                        onClick={() => setObjetivo(o.v)} transition="all 0.15s">
                        {o.label}
                      </Box>
                    ))}
                  </Flex>
                </Box>
                <Flex gap={3}>
                  <Button
                    flex={1} bg={C.green} color="white" borderRadius="full"
                    fontWeight="600" size="sm" _hover={{ opacity: 0.9 }}
                    loading={saving} onClick={handleSavePersonal}>
                    Guardar
                  </Button>
                  <Button
                    flex={1} variant="outline" borderRadius="full" borderColor={C.border}
                    color={C.muted} size="sm" _hover={{ borderColor: C.green, color: C.green }}
                    onClick={() => setEditingPersonal(false)}>
                    Cancelar
                  </Button>
                </Flex>
                <Button
                  w="full" variant="outline" borderRadius="full" size="sm"
                  borderColor={C.green} color={C.green} fontWeight="600"
                  _hover={{ bg: C.greenLight }}
                  loading={regenerando} disabled={!peso || !talla}
                  onClick={handleRegenerarPauta}>
                  🤖 Regenerar pauta con IA
                </Button>
              </Stack>
            </Box>
          )}

          {/* Stats */}
          <Flex gap={3} mb={4}>
            {[
              { label: 'Días activo', value: String(daysActive) },
              { label: 'Adherencia', value: adherence > 0 ? `${adherence}%` : '—' },
              { label: 'Racha', value: streak > 0 ? `${streak} días 🔥` : '—' },
            ].map(s => (
              <Box key={s.label} flex={1} bg="white" borderRadius="2xl" p={4}
                textAlign="center" borderWidth="1px" borderColor={C.border}>
                <Text fontFamily="heading" fontWeight="800" fontSize="lg" color={C.text}>{s.value}</Text>
                <Text fontSize="xs" color={C.muted} mt={0.5}>{s.label}</Text>
              </Box>
            ))}
          </Flex>

          {/* Quick links */}
          <Box bg="white" borderRadius="2xl" borderWidth="1px" borderColor={C.border} overflow="hidden" mb={4}>
            {MENU_ITEMS.map((item, i) => (
              <Box key={item.label}>
                {i > 0 && <Box h="1px" bg={C.border} />}
                <Flex
                  onClick={() => {
                    if (item.editable) {
                      setEditingPersonal(prev => !prev)
                    } else if (item.path !== '#') {
                      navigate(item.path)
                    }
                  }}
                  px={5} py={4} align="center" gap={4}
                  cursor="pointer" transition="bg 0.15s"
                  _hover={{ bg: C.greenLight }}
                >
                  <Box w={9} h={9} bg={C.greenLight} borderRadius="full"
                    display="flex" alignItems="center" justifyContent="center" flexShrink={0}>
                    <Text fontSize="md">{item.icon}</Text>
                  </Box>
                  <Box flex={1}>
                    <Text fontSize="sm" fontWeight="600" color={C.text}>{item.label}</Text>
                    <Text fontSize="xs" color={C.muted}>{item.sub}</Text>
                  </Box>
                  <Text color={C.border} fontSize="lg">›</Text>
                </Flex>
              </Box>
            ))}
          </Box>

          {/* App info */}
          <Box bg="white" borderRadius="2xl" p={5} borderWidth="1px" borderColor={C.border} mb={4}>
            <Flex justify="space-between" align="center">
              <Box>
                <Text fontSize="sm" fontWeight="600" color={C.text}>Aivra</Text>
                <Text fontSize="xs" color={C.muted}>Versión 1.0.0</Text>
              </Box>
              <Box px={3} py={1} bg={C.greenLight} borderRadius="full">
                <Text fontSize="xs" color={C.green} fontWeight="600">Activo</Text>
              </Box>
            </Flex>
          </Box>

          <Button
            w="full" variant="outline" borderRadius="full" size="lg"
            color="red.500" borderColor="red.200"
            _hover={{ bg: 'red.50' }}
            onClick={handleLogout}
            fontWeight="600"
          >
            Cerrar sesión
          </Button>
        </Container>
      </Box>
    </AppLayout>
  )
}
