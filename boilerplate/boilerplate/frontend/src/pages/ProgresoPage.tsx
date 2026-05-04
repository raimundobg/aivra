import { useState, useEffect, useRef } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Box, Button, Container, Flex, Grid, Heading, Input, Stack, Text } from '@chakra-ui/react'
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore'
import { ref as storageRef, uploadBytesResumable, getDownloadURL, listAll } from 'firebase/storage'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { db, storage } from '../config/firebase'
import { useAuth } from '../providers/AuthProvider'
import AppLayout from '../app/AppLayout'
import PatientNav from '../organisms/PatientNav'

const C = { green: '#3d5a3e', greenLight: '#f0f4f0', tan: '#8b6914', cream: '#faf9f7', border: '#e8e4df', text: '#1a1a1a', muted: '#6b6b6b' }

interface Medicion {
  id: string
  fecha: string
  peso: number
  cintura: number
  cadera: number
  pecho: number
  brazo: number
  muslo: number
  timestamp: Date | null
}

const KEYS = ['peso', 'cintura', 'cadera', 'pecho', 'brazo', 'muslo'] as const
const LABELS: Record<string, string> = { peso: 'Peso', cintura: 'Cintura', cadera: 'Cadera', pecho: 'Pecho', brazo: 'Brazo', muslo: 'Muslo' }
const UNITS: Record<string, string> = { peso: 'kg', cintura: 'cm', cadera: 'cm', pecho: 'cm', brazo: 'cm', muslo: 'cm' }

function formatFecha(d: Date) {
  return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' }).replace('.', '')
}

interface FotoProgreso {
  url: string
  name: string
  weekLabel: string
  uploadedAt: number
}

export default function ProgresoPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'mediciones' | 'fotos'>('mediciones')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [historial, setHistorial] = useState<Medicion[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ peso: '', cintura: '', cadera: '', pecho: '', brazo: '', muslo: '' })

  // Fotos state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fotos, setFotos] = useState<FotoProgreso[]>([])
  const [fotosLoading, setFotosLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [compareMode, setCompareMode] = useState(false)
  const [compareA, setCompareA] = useState<string | null>(null)
  const [compareB, setCompareB] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'users', user.uid, 'mediciones'),
      orderBy('timestamp', 'asc')
    )
    return onSnapshot(q, snap => {
      setHistorial(snap.docs.map(d => {
        const data = d.data()
        const ts: Date = data.timestamp?.toDate() ?? new Date()
        return {
          id: d.id,
          fecha: formatFecha(ts),
          timestamp: ts,
          peso: data.peso ?? 0,
          cintura: data.cintura ?? 0,
          cadera: data.cadera ?? 0,
          pecho: data.pecho ?? 0,
          brazo: data.brazo ?? 0,
          muslo: data.muslo ?? 0,
        }
      }))
      setLoading(false)
    })
  }, [user])

  async function guardar() {
    if (!user) return
    const vals = Object.fromEntries(KEYS.map(k => [k, parseFloat(form[k])]))
    if (KEYS.some(k => isNaN(vals[k] as number))) return
    setSaving(true)
    try {
      await addDoc(collection(db, 'users', user.uid, 'mediciones'), {
        ...vals,
        timestamp: serverTimestamp(),
      })
      setForm({ peso: '', cintura: '', cadera: '', pecho: '', brazo: '', muslo: '' })
      setShowForm(false)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  // Load photos from Firebase Storage
  useEffect(() => {
    if (!user) return
    const photosRef = storageRef(storage, `users/${user.uid}/fotos`)
    listAll(photosRef)
      .then(async res => {
        const items = await Promise.all(
          res.items.map(async item => {
            const url = await getDownloadURL(item)
            const meta = item.name
            // name format: {timestamp}_{weekLabel}.jpg
            const parts = meta.replace(/\.[^.]+$/, '').split('_')
            const ts = parseInt(parts[0]) || 0
            const weekLabel = parts.slice(1).join(' ') || new Date(ts).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
            return { url, name: item.name, weekLabel, uploadedAt: ts }
          })
        )
        setFotos(items.sort((a, b) => a.uploadedAt - b.uploadedAt))
        setFotosLoading(false)
      })
      .catch(() => setFotosLoading(false))
  }, [user])

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploading(true)
    setUploadProgress(0)
    const weekNum = fotos.length + 1
    const ts = Date.now()
    const weekLabel = `Semana ${weekNum}`
    const fileName = `${ts}_${weekLabel}.jpg`
    const photoRef = storageRef(storage, `users/${user.uid}/fotos/${fileName}`)
    const task = uploadBytesResumable(photoRef, file)
    task.on('state_changed',
      snap => setUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      () => setUploading(false),
      async () => {
        const url = await getDownloadURL(task.snapshot.ref)
        setFotos(prev => [...prev, { url, name: fileName, weekLabel, uploadedAt: ts }])
        setUploading(false)
        setUploadProgress(0)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    )
  }

  function toggleCompare(url: string) {
    if (compareA === url) { setCompareA(null); return }
    if (compareB === url) { setCompareB(null); return }
    if (!compareA) { setCompareA(url); return }
    if (!compareB) { setCompareB(url); return }
    setCompareA(url); setCompareB(null)
  }

  const ultima = historial[historial.length - 1]
  const primera = historial[0]

  const medidas = ultima ? KEYS.map(k => ({
    key: k,
    label: LABELS[k],
    unit: UNITS[k],
    value: ultima[k],
    delta: primera ? ultima[k] - primera[k] : 0,
  })) : []

  return (
    <AppLayout>
      <PatientNav />
      <Box bg={C.cream} minH="calc(100dvh - 56px)">
        <Container maxW="4xl" py={8}>
          <RouterLink to="/dashboard" style={{ fontSize: '14px', color: C.green, fontWeight: 500, display: 'block', marginBottom: '16px', textDecoration: 'none' }}>
            ← Volver al Dashboard
          </RouterLink>

          <Heading fontFamily="heading" fontSize="2xl" fontWeight="800" color={C.text} mb={1}>
            Seguimiento de Progreso
          </Heading>
          <Text fontSize="sm" color={C.green} mb={6}>
            Registra tus mediciones y fotos para visualizar tu transformación
          </Text>

          {/* Tabs */}
          <Box bg="white" borderRadius="full" p={1} borderWidth="1px" borderColor={C.border} mb={6} maxW="300px">
            <Grid templateColumns="1fr 1fr">
              {([['mediciones', 'Mediciones'], ['fotos', 'Fotos de Progreso']] as const).map(([t, l]) => (
                <Box key={t} py={2} textAlign="center" borderRadius="full" cursor="pointer"
                  bg={activeTab === t ? C.green : 'transparent'} color={activeTab === t ? 'white' : C.muted}
                  fontWeight={activeTab === t ? '700' : '400'} fontSize="sm"
                  onClick={() => setActiveTab(t)} transition="all 0.2s">
                  {l}
                </Box>
              ))}
            </Grid>
          </Box>

          {activeTab === 'mediciones' && (
            <Stack gap={5}>
              {loading ? (
                <Box bg="white" borderRadius="2xl" p={8} textAlign="center" borderWidth="1px" borderColor={C.border}>
                  <Text color={C.muted} fontSize="sm">Cargando mediciones...</Text>
                </Box>
              ) : historial.length === 0 ? (
                <Box bg="white" borderRadius="2xl" p={8} textAlign="center" borderWidth="1px" borderColor={C.border}>
                  <Text fontSize="3xl" mb={3}>📏</Text>
                  <Text fontFamily="heading" fontWeight="700" color={C.text} mb={2}>Sin mediciones aún</Text>
                  <Text fontSize="sm" color={C.muted}>Registra tu primera medición para comenzar a ver tu progreso.</Text>
                </Box>
              ) : (
                <>
                  <Grid templateColumns={{ base: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(6, 1fr)' }} gap={3}>
                    {medidas.map(m => (
                      <Box key={m.key} bg="white" borderRadius="2xl" p={4} borderWidth="1px" borderColor={C.border}>
                        <Text fontSize="xs" color={C.muted} mb={1}>{m.label}</Text>
                        <Flex align="baseline" gap={1} mb={1}>
                          <Text fontFamily="heading" fontWeight="800" fontSize="xl" color={C.text}>{m.value}</Text>
                          <Text fontSize="xs" color={C.muted}>{m.unit}</Text>
                        </Flex>
                        {primera && primera.id !== ultima.id && (
                          <Text fontSize="xs" color={m.delta < 0 ? C.green : 'red.400'} fontWeight="500">
                            {m.delta < 0 ? '↘' : '↗'} {m.delta > 0 ? '+' : ''}{m.delta.toFixed(1)} {m.unit}
                          </Text>
                        )}
                      </Box>
                    ))}
                  </Grid>

                  <Box bg="white" borderRadius="2xl" p={6} borderWidth="1px" borderColor={C.border}>
                    <Text fontFamily="heading" fontWeight="700" color={C.text} mb={5}>Evolución de Mediciones</Text>

                    <Text fontSize="xs" color={C.muted} mb={2}>Peso (kg)</Text>
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart data={historial} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0ece6" vertical={false} />
                        <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                        <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: `1px solid ${C.border}` }} />
                        <Line type="monotone" dataKey="peso" stroke={C.green} strokeWidth={2} dot={{ fill: C.green, r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>

                    <Text fontSize="xs" color={C.muted} mt={5} mb={2}>Circunferencias (cm)</Text>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={historial} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0ece6" vertical={false} />
                        <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                        <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: `1px solid ${C.border}` }} />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                        {['cintura', 'cadera', 'pecho', 'brazo', 'muslo'].map((k, i) => (
                          <Line key={k} type="monotone" dataKey={k} strokeWidth={2}
                            stroke={['#3d5a3e', '#8b6914', '#c2852a', '#6b8f6c', '#a07850'][i]}
                            dot={{ r: 3 }} />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </>
              )}

              {!showForm ? (
                <Button bg={C.green} color="white" borderRadius="full" size="lg"
                  fontWeight="700" _hover={{ opacity: 0.9 }} onClick={() => setShowForm(true)} gap={2}>
                  + Registrar Nueva Medición
                </Button>
              ) : (
                <Box bg="white" borderRadius="2xl" p={6} borderWidth="1px" borderColor={C.border}>
                  <Flex justify="space-between" align="center" mb={5}>
                    <Text fontFamily="heading" fontWeight="700" color={C.text}>Nueva Medición</Text>
                    <Text fontSize="sm" color={C.green} cursor="pointer" fontWeight="500" onClick={() => setShowForm(false)}>Cancelar</Text>
                  </Flex>
                  <Grid templateColumns="repeat(2, 1fr)" gap={4} mb={4}>
                    {KEYS.map(k => (
                      <Box key={k}>
                        <Text fontSize="xs" color={C.green} fontWeight="500" mb={1}>
                          {LABELS[k]} ({UNITS[k]})
                        </Text>
                        <Input size="lg" borderRadius="xl" borderColor={C.border}
                          placeholder={ultima ? String(ultima[k]) : '0'}
                          type="number" step="0.1"
                          value={form[k]}
                          onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))} />
                      </Box>
                    ))}
                  </Grid>
                  <Button w="full" bg={C.green} color="white" borderRadius="full"
                    fontWeight="700" _hover={{ opacity: 0.9 }} onClick={guardar} loading={saving}
                    loadingText="Guardando...">
                    Guardar Medición
                  </Button>
                </Box>
              )}
            </Stack>
          )}

          {activeTab === 'fotos' && (
            <Stack gap={5}>
              {/* Upload + compare header */}
              <Flex gap={3} flexWrap="wrap">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
                <Button
                  bg={C.green} color="white" borderRadius="full" fontWeight="700"
                  _hover={{ opacity: 0.9 }} size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  loading={uploading}
                  loadingText={`Subiendo ${uploadProgress}%`}
                >
                  📸 Subir foto
                </Button>
                {fotos.length >= 2 && (
                  <Button
                    size="sm" borderRadius="full" variant="outline"
                    borderColor={C.border} color={compareMode ? C.green : C.muted}
                    fontWeight="600"
                    onClick={() => { setCompareMode(!compareMode); setCompareA(null); setCompareB(null) }}
                  >
                    {compareMode ? '✕ Cancelar comparación' : '⚖️ Comparar fotos'}
                  </Button>
                )}
              </Flex>

              {/* Compare mode instruction */}
              {compareMode && (
                <Box bg={C.greenLight} borderRadius="xl" px={4} py={3} borderWidth="1px" borderColor={C.border}>
                  <Text fontSize="sm" color={C.green} fontWeight="500">
                    {!compareA ? 'Selecciona la primera foto' : !compareB ? 'Selecciona la segunda foto' : ''}
                  </Text>
                </Box>
              )}

              {/* Side-by-side compare */}
              {compareMode && compareA && compareB && (
                <Box bg="white" borderRadius="2xl" p={4} borderWidth="1px" borderColor={C.border}>
                  <Text fontFamily="heading" fontWeight="700" color={C.text} mb={3}>Comparación</Text>
                  <Grid templateColumns="1fr 1fr" gap={3}>
                    {[compareA, compareB].map((url, i) => {
                      const foto = fotos.find(f => f.url === url)
                      return (
                        <Box key={i}>
                          <Box borderRadius="xl" overflow="hidden" mb={2}>
                            <img src={url} style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover' }} />
                          </Box>
                          <Text fontSize="xs" color={C.green} fontWeight="600" textAlign="center">{foto?.weekLabel}</Text>
                        </Box>
                      )
                    })}
                  </Grid>
                </Box>
              )}

              {/* Photo grid */}
              {fotosLoading ? (
                <Box bg="white" borderRadius="2xl" p={8} textAlign="center" borderWidth="1px" borderColor={C.border}>
                  <Text color={C.muted} fontSize="sm">Cargando fotos...</Text>
                </Box>
              ) : fotos.length === 0 ? (
                <Box bg="white" borderRadius="2xl" p={10} borderWidth="1px" borderColor={C.border} textAlign="center">
                  <Text fontSize="3xl" mb={3}>📸</Text>
                  <Text fontFamily="heading" fontWeight="700" color={C.text} mb={2}>Sin fotos aún</Text>
                  <Text fontSize="sm" color={C.muted} mb={4}>
                    Sube tu primera foto de progreso. Solo tú y tu nutricionista pueden verlas.
                  </Text>
                  <Button bg={C.green} color="white" borderRadius="full" fontWeight="700" size="sm"
                    _hover={{ opacity: 0.9 }} onClick={() => fileInputRef.current?.click()}>
                    + Subir primera foto
                  </Button>
                </Box>
              ) : (
                <Grid templateColumns={{ base: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)' }} gap={3}>
                  {fotos.map((foto) => {
                    const isSelected = compareA === foto.url || compareB === foto.url
                    return (
                      <Box
                        key={foto.name}
                        borderRadius="xl" overflow="hidden"
                        borderWidth="2px"
                        borderColor={isSelected ? C.green : 'transparent'}
                        cursor={compareMode ? 'pointer' : 'default'}
                        onClick={() => compareMode && toggleCompare(foto.url)}
                        transition="border-color 0.15s"
                        position="relative"
                      >
                        <img src={foto.url} style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', display: 'block' }} />
                        <Box
                          position="absolute" bottom={0} left={0} right={0}
                          bg="linear-gradient(transparent, rgba(0,0,0,0.5))"
                          px={2} py={2}
                        >
                          <Text fontSize="10px" color="white" fontWeight="700">{foto.weekLabel}</Text>
                        </Box>
                        {isSelected && (
                          <Box position="absolute" top={2} right={2} w={5} h={5} bg={C.green}
                            borderRadius="full" display="flex" alignItems="center" justifyContent="center">
                            <Text color="white" fontSize="10px" fontWeight="800">✓</Text>
                          </Box>
                        )}
                      </Box>
                    )
                  })}
                </Grid>
              )}

              <Box bg="white" borderRadius="xl" px={4} py={3} borderWidth="1px" borderColor={C.border}>
                <Text fontSize="xs" color={C.muted}>
                  🔒 Tus fotos son privadas — solo las puedes ver tú y tu nutricionista.
                </Text>
              </Box>
            </Stack>
          )}
        </Container>
      </Box>
    </AppLayout>
  )
}
