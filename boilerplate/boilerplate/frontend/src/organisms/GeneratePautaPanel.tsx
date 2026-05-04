import { useState, useEffect } from 'react'
import { Box, Button, Flex, Stack, Text, Textarea } from '@chakra-ui/react'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../config/firebase'
import { generarPauta } from '../services/groq'
import type { PautaGenerada } from '../services/groq'
import type { R24Document, IntakeData } from '../types/nutrition'
import { MacroSummary } from '../molecules/MacroBar'

const C = { green: '#5F6F52', greenLight: '#eef2ea', border: 'rgba(95,111,82,0.15)', muted: '#7a7264', text: '#2D3319' }

interface GeneratePautaPanelProps { patientId: string }

export function GeneratePautaPanel({ patientId }: GeneratePautaPanelProps) {
  const [instrucciones, setInstrucciones] = useState('')
  const [generating, setGenerating] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [intake, setIntake] = useState<IntakeData | null>(null)
  const [r24Today, setR24Today] = useState<R24Document | null>(null)
  const [generatedPauta, setGeneratedPauta] = useState<PautaGenerada | null>(null)

  useEffect(() => {
    setIntake(null); setR24Today(null); setDone(false); setError(null)
    // Load intake form
    getDoc(doc(db, 'users', patientId, 'intake', 'form'))
      .then(snap => { if (snap.exists()) setIntake(snap.data() as IntakeData) })
      .catch(console.error)

    // Load R24 for today
    const today = new Date().toISOString().split('T')[0]
    getDoc(doc(db, 'users', patientId, 'r24', today))
      .then(snap => { if (snap.exists()) setR24Today(snap.data() as R24Document) })
      .catch(() => { /* R24 may not exist yet */ })
  }, [patientId])

  async function generate() {
    if (generating || !intake) return
    setGenerating(true); setError(null)
    try {
      // Merge intake with R24 data if available
      const intakeData = {
        ...intake,
        // If R24 exists, use its meals; otherwise use intake meals
        ...(r24Today?.meals && {
          desayuno: r24Today.meals.desayuno || intake.desayuno,
          colacion_am: r24Today.meals.colacion_am || intake.colacion_am,
          almuerzo: r24Today.meals.almuerzo || intake.almuerzo,
          colacion_pm: r24Today.meals.colacion_pm || intake.colacion_pm,
          cena: r24Today.meals.cena || intake.cena,
        }),
      }

      const pauta = await generarPauta(intakeData as Parameters<typeof generarPauta>[0], instrucciones.trim() || undefined)
      await setDoc(doc(db, 'users', patientId, 'pauta', 'current'), {
        ...pauta, generadoPor: 'nutricionista', generadoAt: serverTimestamp(),
      })
      setGeneratedPauta(pauta); setDone(true); setInstrucciones('')
    } catch (e) {
      console.error(e); setError('Error generando la pauta. Inténtalo de nuevo.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Box bg="white" borderRadius="2xl" p={5} borderWidth="1px" borderColor={C.border}>
      <Flex align="center" gap={2} mb={4}>
        <Text fontSize="xl">✨</Text>
        <Text fontFamily="heading" fontWeight="700" color={C.text} fontSize="md">Generar pauta con IA</Text>
      </Flex>

      {!intake && !generating && (
        <Box bg="#fffbeb" borderRadius="xl" p={4} borderWidth="1px" borderColor="#fbd38d" mb={4}>
          <Text fontSize="sm" color="orange.700">El paciente no ha completado el onboarding aún.</Text>
        </Box>
      )}

      {intake && r24Today && (
        <Box bg={C.greenLight} borderRadius="xl" p={4} borderWidth="1px" borderColor={C.border} mb={4}>
          <Text fontSize="sm" color={C.green} fontWeight="600">✓ R24 de hoy cargado</Text>
          <Text fontSize="xs" color={C.muted}>Se usarán los alimentos reales registrados en el R24 para personalizar la pauta.</Text>
        </Box>
      )}

      {error && (
        <Box bg="#fff5f5" borderRadius="xl" p={4} borderWidth="1px" borderColor="#feb2b2" mb={4}>
          <Text fontSize="sm" color="red.600">{error}</Text>
        </Box>
      )}

      {done && generatedPauta ? (
        <Stack gap={3}>
          <Box bg={C.greenLight} borderRadius="xl" p={4} borderWidth="1px" borderColor={C.border}>
            <Text fontSize="sm" color={C.green} fontWeight="700" mb={1}>Pauta generada</Text>
            <Text fontSize="xs" color={C.muted} mb={3}>{generatedPauta.titulo}</Text>
            <MacroSummary
              calorias={generatedPauta.macros.calorias}
              proteinas={generatedPauta.macros.proteinas}
              carbos={generatedPauta.macros.carbos}
              grasas={generatedPauta.macros.grasas}
            />
            <Text fontSize="xs" color={C.muted} mt={3}>Guardada y visible para el paciente.</Text>
          </Box>
          <Button size="sm" variant="outline" borderRadius="full" borderColor={C.border}
            color={C.green} onClick={() => { setDone(false); setGeneratedPauta(null) }}>
            Generar otra versión
          </Button>
        </Stack>
      ) : (
        <Stack gap={3}>
          <Textarea
            placeholder="Instrucciones para esta pauta (opcional). Ej: énfasis en desayunos altos en proteína, sin legumbres..."
            value={instrucciones}
            onChange={e => setInstrucciones(e.target.value)}
            rows={4}
            borderColor={C.border}
            borderRadius="xl"
            _focus={{ borderColor: C.green, boxShadow: 'none' }}
            fontSize="sm"
            resize="none"
          />
          <Button
            w="full" bg={intake ? C.green : C.border} color="white" borderRadius="full" fontWeight="700"
            _hover={{ opacity: intake ? 0.9 : 1 }} onClick={generate}
            loading={generating} loadingText="Generando..." disabled={!intake}>
            ✨ Generar pauta personalizada
          </Button>
        </Stack>
      )}
    </Box>
  )
}
