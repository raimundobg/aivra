import { useState } from 'react'
import { Box, Button, Flex, Input, Text, Stack } from '@chakra-ui/react'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { updateProfile } from 'firebase/auth'
import { db, auth } from '../config/firebase'
import type { User } from 'firebase/auth'
import { generarPautaBasica } from '../services/groq'

const C = { green: '#5F6F52', greenLight: '#eef2ea', cream: '#F9F4EF', border: 'rgba(95,111,82,0.18)', muted: '#7a7264', text: '#2D3319' }

const OBJETIVOS = [
  { v: 'bajar_peso', label: '⬇️ Bajar de peso' },
  { v: 'ganar_masa', label: '💪 Ganar músculo' },
  { v: 'mantener', label: '⚖️ Mantener peso' },
  { v: 'salud', label: '❤️ Mejorar salud general' },
  { v: 'rendimiento', label: '🏃 Rendimiento deportivo' },
]

interface Props {
  user: User
  onClose: () => void
}

export function WelcomeModal({ user, onClose: _onClose }: Props) {
  function onClose() {
    setDoc(doc(db, 'users', user.uid), { basicProfileSeen: true }, { merge: true }).catch(() => {})
    _onClose()
  }

  const defaultName = user.displayName || user.email?.split('@')[0] || ''
  const [nombre, setNombre] = useState(defaultName)
  const [objetivo, setObjetivo] = useState('')
  const [peso, setPeso] = useState('')
  const [talla, setTalla] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave(skip = false) {
    setSaving(true)
    try {
      if (!skip && auth.currentUser && nombre && nombre !== user.displayName) {
        await updateProfile(auth.currentUser, { displayName: nombre })
      }
      await setDoc(doc(db, 'users', user.uid), {
        ...(nombre && { displayName: nombre }),
        ...(objetivo && { objetivo }),
        ...(peso && { peso }),
        ...(talla && { talla }),
        basicProfileCompleted: !skip,
        basicProfileSeen: true,
      }, { merge: true })
      if (!skip && peso && talla) {
        const uid = user.uid
        generarPautaBasica({
          nombre: nombre || 'Paciente',
          objetivo: objetivo || 'salud',
          peso: parseFloat(peso),
          talla: parseFloat(talla),
        }).then(p =>
          setDoc(doc(db, 'users', uid, 'pauta', 'current'), {
            ...p,
            generadoPor: 'ia',
            generadoAt: serverTimestamp(),
          })
        ).catch(console.error)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
      onClose()
    }
  }

  const greeting = nombre ? `Hola ${nombre.split(' ')[0]} 👋` : 'Hola 👋'

  return (
    <Box
      position="fixed" inset={0} zIndex={1000}
      bg="rgba(0,0,0,0.45)" display="flex" alignItems="center" justifyContent="center"
      p={4}
    >
      <Box
        bg="white" borderRadius="2xl" p={6} maxW="420px" w="full"
        shadow="2xl" borderWidth="1px" borderColor={C.border}
      >
        {/* Header */}
        <Flex align="center" gap={3} mb={4}>
          <Box w={10} h={10} bg={C.green} borderRadius="xl" display="flex" alignItems="center" justifyContent="center" flexShrink={0}>
            <Text color="white" fontWeight="800" fontSize="sm">N</Text>
          </Box>
          <Box>
            <Text fontWeight="700" fontSize="lg" color={C.text}>{greeting}</Text>
            <Text fontSize="xs" color={C.muted}>Soy NuAI, tu coach personalizado 🌿</Text>
          </Box>
        </Flex>

        <Text fontSize="sm" color={C.muted} mb={5}>
          Saca el máximo provecho a NuAI. Cuéntanos un poco sobre ti para personalizar tu experiencia:
        </Text>

        <Stack gap={3}>
          {/* Nombre */}
          <Box>
            <Text fontSize="xs" fontWeight="600" color={C.text} mb={1}>¿Cómo te llamamos?</Text>
            <Input
              value={nombre} onChange={e => setNombre(e.target.value)}
              placeholder="Tu nombre" size="sm" borderRadius="lg" borderColor={C.border}
              _focus={{ borderColor: C.green, boxShadow: 'none' }}
            />
          </Box>

          {/* Objetivo */}
          <Box>
            <Text fontSize="xs" fontWeight="600" color={C.text} mb={2}>¿Cuál es tu objetivo principal?</Text>
            <Flex gap={2} flexWrap="wrap">
              {OBJETIVOS.map(o => (
                <Box
                  key={o.v} px={3} py={1.5} borderRadius="full" cursor="pointer"
                  fontSize="xs" fontWeight="500" borderWidth="1px"
                  bg={objetivo === o.v ? C.green : 'white'}
                  color={objetivo === o.v ? 'white' : C.muted}
                  borderColor={objetivo === o.v ? C.green : C.border}
                  onClick={() => setObjetivo(o.v)}
                  transition="all 0.15s"
                >
                  {o.label}
                </Box>
              ))}
            </Flex>
          </Box>

          {/* Peso + Talla */}
          <Flex gap={3}>
            <Box flex={1}>
              <Text fontSize="xs" fontWeight="600" color={C.text} mb={1}>Peso (kg)</Text>
              <Input
                value={peso} onChange={e => setPeso(e.target.value)}
                placeholder="Ej: 68" type="number" size="sm" borderRadius="lg" borderColor={C.border}
                _focus={{ borderColor: C.green, boxShadow: 'none' }}
              />
            </Box>
            <Box flex={1}>
              <Text fontSize="xs" fontWeight="600" color={C.text} mb={1}>Talla (cm)</Text>
              <Input
                value={talla} onChange={e => setTalla(e.target.value)}
                placeholder="Ej: 165" type="number" size="sm" borderRadius="lg" borderColor={C.border}
                _focus={{ borderColor: C.green, boxShadow: 'none' }}
              />
            </Box>
          </Flex>
        </Stack>

        {/* Actions */}
        <Flex gap={3} mt={6}>
          <Button
            size="sm" variant="ghost" color={C.muted} borderRadius="lg"
            onClick={() => handleSave(true)}
            flex={1} fontSize="xs"
          >
            Lo hago después
          </Button>
          <Button
            size="sm" bg={C.green} color="white" borderRadius="lg"
            _hover={{ opacity: 0.9 }} flex={2}
            onClick={() => handleSave(false)}
            loading={saving}
          >
            Guardar y continuar →
          </Button>
        </Flex>
      </Box>
    </Box>
  )
}
