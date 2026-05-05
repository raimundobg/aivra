import { useState, useEffect } from 'react'
import { Box, Button, Container, Flex, Grid, Heading, Input, Stack, Text } from '@chakra-ui/react'
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../providers/AuthProvider'
import AppLayout from '../app/AppLayout'
import PatientNav from '../organisms/PatientNav'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../config/firebase'
import type { PautaGenerada } from '../services/groq'

const C = {
  green: '#5F6F52', greenLight: '#eef2ea', cream: '#F9F4EF',
  beige: '#E9DFD3', border: 'rgba(95,111,82,0.15)', text: '#2D3319', muted: '#7a7264',
}

const MEAL_FILTERS = ['Todas', 'Desayuno', 'Colación', 'Almuerzo', 'Cena'] as const
type MealFilter = typeof MEAL_FILTERS[number]

interface Receta {
  id: string
  nombre: string
  tipo: string
  emoji?: string
  tiempo?: string
  kcal: number
  proteinas: number
  carbos: number
  grasas: number
  ingredientes: string[]
  preparacion: string
  fuente: 'base' | 'ia'
  createdAt?: Date | null
}

interface GroqCallData { messages: Array<{ role: string; content: string }>; maxTokens?: number; temperature?: number; jsonMode?: boolean }
interface GroqCallResult { content: string }
const _proxy = httpsCallable<GroqCallData, GroqCallResult>(functions, 'groqProxy')

async function generarReceta(pauta: PautaGenerada, tipo: string, restricciones: string[]): Promise<Omit<Receta, 'id' | 'createdAt' | 'fuente'>> {
  const prompt = `Eres una nutricionista clínica. Genera una receta saludable en español chileno.

Tipo de comida: ${tipo}
Macros de referencia: ${pauta.macros.calorias} kcal/día, ${pauta.macros.proteinas}g proteína, ${pauta.macros.carbos}g carbos, ${pauta.macros.grasas}g grasas.
Restricciones alimentarias: ${restricciones.length ? restricciones.join(', ') : 'ninguna'}

Genera una receta con ingredientes típicos chilenos que encaje en el plan nutricional.

Responde ÚNICAMENTE con JSON válido:
{
  "nombre": "Nombre de la receta",
  "tipo": "${tipo}",
  "emoji": "un emoji representativo",
  "tiempo": "X min",
  "kcal": número,
  "proteinas": número,
  "carbos": número,
  "grasas": número,
  "ingredientes": ["ingrediente con cantidad exacta", "ingrediente 2"],
  "preparacion": "Instrucciones en 4-5 pasos numerados"
}`

  const IS_DEV = import.meta.env.DEV === true
  let content: string
  if (IS_DEV) {
    const key = import.meta.env.VITE_GROQ_API_KEY as string
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }], temperature: 0.6, max_tokens: 800, response_format: { type: 'json_object' } }),
    })
    const json = await res.json() as { choices: Array<{ message: { content: string } }> }
    content = json.choices[0]?.message?.content ?? '{}'
  } else {
    const result = await _proxy({ messages: [{ role: 'user', content: prompt }], maxTokens: 800, temperature: 0.6, jsonMode: true })
    content = result.data.content
  }
  return JSON.parse(content) as Omit<Receta, 'id' | 'createdAt' | 'fuente'>
}

const TIPO_COLORS: Record<string, { bg: string; color: string }> = {
  Desayuno: { bg: '#fef3c7', color: '#92400e' },
  Colación: { bg: '#f5ede7', color: '#9a7059' },
  Almuerzo: { bg: '#eef2ea', color: '#5F6F52' },
  Cena: { bg: '#ede9fe', color: '#5b21b6' },
}

function RecetaCard({ receta }: { receta: Receta }) {
  const [expanded, setExpanded] = useState(false)
  const tc = TIPO_COLORS[receta.tipo] ?? { bg: C.beige, color: C.muted }

  return (
    <Box bg="white" borderRadius="2xl" borderWidth="1px" borderColor={C.border} overflow="hidden">
      <Box p={5}>
        <Flex align="center" justify="space-between" mb={2}>
          <Flex align="center" gap={2}>
            <Text fontSize="xl">{receta.emoji ?? '🍽️'}</Text>
            <Box px={2} py={0.5} borderRadius="full" bg={tc.bg}>
              <Text fontSize="xs" fontWeight="600" color={tc.color}>{receta.tipo}</Text>
            </Box>
          </Flex>
          <Flex align="center" gap={2}>
            {receta.tiempo && (
              <Text fontSize="xs" color={C.muted}>⏱ {receta.tiempo}</Text>
            )}
            {receta.fuente === 'ia' && (
              <Box px={2} py={0.5} bg={C.greenLight} borderRadius="full">
                <Text fontSize="9px" fontWeight="700" color={C.green}>IA</Text>
              </Box>
            )}
          </Flex>
        </Flex>

        <Text fontFamily="heading" fontWeight="700" color={C.text} fontSize="md" mb={3}>
          {receta.nombre}
        </Text>

        <Grid templateColumns="repeat(4, 1fr)" gap={2} mb={4}>
          {[
            { l: 'Kcal', v: receta.kcal, c: C.green },
            { l: 'Prot', v: `${receta.proteinas}g`, c: C.green },
            { l: 'Carbos', v: `${receta.carbos}g`, c: '#C6A28F' },
            { l: 'Grasas', v: `${receta.grasas}g`, c: '#b88a74' },
          ].map(m => (
            <Box key={m.l} p={2} bg={C.cream} borderRadius="xl" textAlign="center">
              <Text fontWeight="800" fontSize="sm" color={m.c}>{m.v}</Text>
              <Text fontSize="9px" color={C.muted}>{m.l}</Text>
            </Box>
          ))}
        </Grid>

        <Box mb={3}>
          <Text fontSize="xs" color={C.muted} fontWeight="600" mb={2}>INGREDIENTES</Text>
          <Stack gap={1}>
            {receta.ingredientes.slice(0, expanded ? undefined : 4).map((ing, i) => (
              <Flex key={i} align="flex-start" gap={2}>
                <Box w={1.5} h={1.5} borderRadius="full" bg={C.green} flexShrink={0} mt={1.5} />
                <Text fontSize="sm" color={C.text}>{ing}</Text>
              </Flex>
            ))}
            {!expanded && receta.ingredientes.length > 4 && (
              <Text fontSize="xs" color={C.green} cursor="pointer" onClick={() => setExpanded(true)}>
                +{receta.ingredientes.length - 4} más...
              </Text>
            )}
          </Stack>
        </Box>

        {expanded && (
          <Box mb={3}>
            <Text fontSize="xs" color={C.muted} fontWeight="600" mb={2}>PREPARACIÓN</Text>
            <Text fontSize="sm" color={C.text} lineHeight="1.7" whiteSpace="pre-line">
              {receta.preparacion}
            </Text>
          </Box>
        )}

        <Button mt={1} size="sm" variant="ghost" color={C.green} borderRadius="full"
          onClick={() => setExpanded(!expanded)} fontSize="xs">
          {expanded ? '▲ Menos' : '▼ Ver preparación'}
        </Button>
      </Box>
    </Box>
  )
}

export default function RecipesPage() {
  const { user } = useAuth()
  const [baseRecetas, setBaseRecetas] = useState<Receta[]>([])
  const [iaRecetas, setIaRecetas] = useState<Receta[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)
  const [filter, setFilter] = useState<MealFilter>('Todas')
  const [search, setSearch] = useState('')
  const [tipoGen, setTipoGen] = useState('Almuerzo')
  const [pauta, setPauta] = useState<PautaGenerada | null>(null)
  const [restricciones, setRestricciones] = useState<string[]>([])

  useEffect(() => {
    fetch('/recetas_base.json')
      .then(r => r.json())
      .then((data: Omit<Receta, 'fuente'>[]) => {
        setBaseRecetas(data.map(r => ({ ...r, fuente: 'base' as const })))
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (!user) return
    getDoc(doc(db, 'users', user.uid, 'pauta', 'current')).then(s => {
      if (s.exists()) setPauta(s.data() as PautaGenerada)
    })
    getDoc(doc(db, 'users', user.uid, 'intake', 'form')).then(s => {
      if (s.exists()) setRestricciones(s.data()?.restricciones ?? [])
    })
    const q = query(collection(db, 'users', user.uid, 'recetas'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, snap => {
      setIaRecetas(snap.docs.map(d => ({
        id: d.id, ...d.data(),
        fuente: 'ia' as const,
        createdAt: d.data().createdAt?.toDate() ?? null,
      } as Receta)))
      setLoading(false)
    }, () => setLoading(false))
    return unsub
  }, [user])

  async function generar() {
    if (!user || !pauta || generating) return
    setGenerating(true); setGenError(null)
    try {
      const receta = await generarReceta(pauta, tipoGen, restricciones)
      await addDoc(collection(db, 'users', user.uid, 'recetas'), { ...receta, createdAt: serverTimestamp() })
    } catch (e) {
      console.error(e)
      setGenError('Error generando la receta. Inténtalo de nuevo.')
    } finally {
      setGenerating(false)
    }
  }

  const allRecetas = [...iaRecetas, ...baseRecetas]

  const filtered = allRecetas.filter(r => {
    const matchTipo = filter === 'Todas' || r.tipo === filter
    const matchSearch = search.trim() === '' ||
      r.nombre.toLowerCase().includes(search.toLowerCase()) ||
      r.ingredientes.some(i => i.toLowerCase().includes(search.toLowerCase()))
    return matchTipo && matchSearch
  })

  return (
    <AppLayout>
      <PatientNav />
      <Box bg={C.cream} minH="calc(100dvh - 56px)" pb={24}>
        <Container maxW="7xl" py={8}>
          <Heading fontFamily="heading" fontWeight="800" color={C.text}
            fontSize={{ base: '2xl', md: '3xl' }} mb={1}>
            Recetario 🍽️
          </Heading>
          <Text color={C.muted} fontSize="sm" mb={6}>
            {baseRecetas.length} recetas base · Genera nuevas con IA según tu pauta
          </Text>

          {/* Generador */}
          <Box bg="white" borderRadius="2xl" p={5} borderWidth="1px" borderColor={C.border} mb={5}>
            <Text fontFamily="heading" fontWeight="700" color={C.text} mb={4}>✨ Generar receta personalizada</Text>
            {!pauta && (
              <Box bg="#fffbeb" borderRadius="xl" p={3} borderWidth="1px" borderColor="#fbd38d" mb={4}>
                <Text fontSize="sm" color="orange.700">Necesitas una pauta activa para generar recetas personalizadas.</Text>
              </Box>
            )}
            {genError && (
              <Box bg="#fff5f5" borderRadius="xl" p={3} borderWidth="1px" borderColor="#feb2b2" mb={4}>
                <Text fontSize="sm" color="red.600">{genError}</Text>
              </Box>
            )}
            <Flex gap={3} align="center" flexWrap="wrap">
              <Text fontSize="sm" color={C.muted} fontWeight="500">Tipo:</Text>
              <Flex gap={2} flexWrap="wrap">
                {['Desayuno', 'Colación', 'Almuerzo', 'Cena'].map(t => (
                  <Box key={t} px={3} py={1.5} borderRadius="full" cursor="pointer"
                    bg={tipoGen === t ? C.green : C.cream}
                    borderWidth="1px" borderColor={tipoGen === t ? C.green : C.border}
                    onClick={() => setTipoGen(t)}>
                    <Text fontSize="sm" fontWeight="600" color={tipoGen === t ? 'white' : C.muted}>{t}</Text>
                  </Box>
                ))}
              </Flex>
              <Button
                bg={pauta ? C.green : C.beige} color={pauta ? 'white' : C.muted}
                borderRadius="full" size="sm" fontWeight="700"
                _hover={{ opacity: pauta ? 0.9 : 1 }}
                onClick={generar} loading={generating} loadingText="Generando..."
                disabled={!pauta} ml={{ base: 0, sm: 'auto' }}>
                ✨ Generar
              </Button>
            </Flex>
          </Box>

          {/* Búsqueda */}
          <Input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o ingrediente..."
            borderRadius="xl" borderColor={C.border} bg="white" mb={4}
            _focus={{ borderColor: C.green, boxShadow: 'none' }}
          />

          {/* Filtros por tipo */}
          <Flex gap={2} mb={5} flexWrap="wrap" align="center">
            {MEAL_FILTERS.map(f => (
              <Box key={f} px={4} py={1.5} borderRadius="full" cursor="pointer"
                bg={filter === f ? C.green : 'white'}
                borderWidth="1px" borderColor={filter === f ? C.green : C.border}
                onClick={() => setFilter(f)}>
                <Text fontSize="sm" fontWeight="600" color={filter === f ? 'white' : C.muted}>{f}</Text>
              </Box>
            ))}
            <Text fontSize="sm" color={C.muted} ml="auto">
              {filtered.length} receta{filtered.length !== 1 ? 's' : ''}
            </Text>
          </Flex>

          {loading ? (
            <Text color={C.muted} textAlign="center" py={12}>Cargando recetas...</Text>
          ) : filtered.length === 0 ? (
            <Box bg="white" borderRadius="2xl" p={12} borderWidth="1px" borderColor={C.border} textAlign="center">
              <Text fontSize="3xl" mb={3}>🥗</Text>
              <Text fontFamily="heading" fontWeight="700" color={C.text} mb={2}>Sin resultados</Text>
              <Text fontSize="sm" color={C.muted}>Prueba otro filtro o genera una receta nueva con IA.</Text>
            </Box>
          ) : (
            <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={5}>
              {filtered.map(r => <RecetaCard key={r.id} receta={r} />)}
            </Grid>
          )}
        </Container>
      </Box>
    </AppLayout>
  )
}
