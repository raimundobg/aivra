import { useState } from 'react'
import { Box, Button, Flex, Text, Stack } from '@chakra-ui/react'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../config/firebase'
import { markActiveToday } from '../utils/activity'
import type { User } from 'firebase/auth'

const C = { green: '#5F6F52', greenLight: '#eef2ea', cream: '#F9F4EF', border: 'rgba(95,111,82,0.18)', muted: '#7a7264', text: '#2D3319' }

interface CheckInData {
  animo: number
  energia: number
  hinchazon: number
  sueno: number
  motivacion: number
}

const FIELDS: { key: keyof CheckInData; label: string; emoji: string; lowLabel: string; highLabel: string }[] = [
  { key: 'animo', label: 'Ánimo', emoji: '😊', lowLabel: 'Muy bajo', highLabel: 'Excelente' },
  { key: 'energia', label: 'Energía', emoji: '⚡', lowLabel: 'Sin energía', highLabel: 'Lleno de energía' },
  { key: 'hinchazon', label: 'Hinchazón', emoji: '🫢', lowLabel: 'Sin hinchazón', highLabel: 'Muy hinchado' },
  { key: 'sueno', label: 'Sueño', emoji: '😴', lowLabel: 'Mal sueño', highLabel: 'Dormí muy bien' },
  { key: 'motivacion', label: 'Motivación', emoji: '🎯', lowLabel: 'Sin motivación', highLabel: 'Super motivado' },
]

function ScaleRow({ field, value, onChange }: {
  field: typeof FIELDS[0]; value: number; onChange: (v: number) => void
}) {
  return (
    <Box>
      <Flex justify="space-between" align="center" mb={1.5}>
        <Text fontSize="sm" fontWeight="600" color={C.text}>{field.emoji} {field.label}</Text>
        <Text fontSize="xs" color={value > 0 ? C.green : C.muted} fontWeight="600">
          {value > 0 ? `${value}/10` : '—'}
        </Text>
      </Flex>
      <Flex gap={1}>
        {[1,2,3,4,5,6,7,8,9,10].map(n => (
          <Box
            key={n} flex={1} h={6} borderRadius="md" cursor="pointer"
            bg={value >= n ? C.green : C.greenLight}
            transition="all 0.1s"
            onClick={() => onChange(n)}
            _hover={{ bg: value >= n ? C.green : '#d4e0cc' }}
          />
        ))}
      </Flex>
      <Flex justify="space-between" mt={0.5}>
        <Text fontSize="9px" color={C.muted}>{field.lowLabel}</Text>
        <Text fontSize="9px" color={C.muted}>{field.highLabel}</Text>
      </Flex>
    </Box>
  )
}

interface Props { user: User; onClose: () => void }

export function CheckInModal({ user, onClose }: Props) {
  const [data, setData] = useState<CheckInData>({ animo: 0, energia: 0, hinchazon: 0, sueno: 0, motivacion: 0 })
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  function set(k: keyof CheckInData, v: number) {
    setData(prev => ({ ...prev, [k]: v }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      await setDoc(doc(db, 'users', user.uid, 'checkins', today), {
        ...data,
        date: today,
        savedAt: serverTimestamp(),
      })
      markActiveToday(user.uid)
      setDone(true)
      setTimeout(onClose, 1200)
    } catch (e) {
      console.error(e)
      setSaving(false)
    }
  }

  const filled = Object.values(data).filter(v => v > 0).length

  return (
    <Box position="fixed" inset={0} zIndex={1000} bg="rgba(0,0,0,0.5)"
      display="flex" alignItems="flex-end" justifyContent="center" onClick={onClose}>
      <Box
        bg="white" borderTopRadius="2xl" p={6} w="full" maxW="480px"
        shadow="2xl" onClick={e => e.stopPropagation()}
        maxH="90dvh" overflowY="auto"
      >
        {done ? (
          <Flex direction="column" align="center" py={8} gap={3}>
            <Text fontSize="4xl">✅</Text>
            <Text fontWeight="700" fontSize="lg" color={C.text}>¡Check-in registrado!</Text>
            <Text fontSize="sm" color={C.muted}>Tu bienestar de hoy fue guardado</Text>
          </Flex>
        ) : (
          <>
            <Flex justify="space-between" align="center" mb={5}>
              <Box>
                <Text fontWeight="700" fontSize="lg" color={C.text}>Check-in diario</Text>
                <Text fontSize="xs" color={C.muted}>¿Cómo te sientes hoy?</Text>
              </Box>
              <Box onClick={onClose} cursor="pointer" color={C.muted} fontSize="xl" px={2}>✕</Box>
            </Flex>

            <Stack gap={5} mb={6}>
              {FIELDS.map(f => (
                <ScaleRow key={f.key} field={f} value={data[f.key]} onChange={v => set(f.key, v)} />
              ))}
            </Stack>

            <Flex gap={3}>
              <Button variant="ghost" color={C.muted} borderRadius="xl" size="sm" onClick={onClose} flex={1}>
                Cancelar
              </Button>
              <Button
                bg={C.green} color="white" borderRadius="xl" flex={2}
                _hover={{ opacity: 0.9 }} loading={saving}
                onClick={handleSave}
                disabled={filled === 0}
              >
                Guardar check-in {filled > 0 && `(${filled}/5)`}
              </Button>
            </Flex>
          </>
        )}
      </Box>
    </Box>
  )
}
