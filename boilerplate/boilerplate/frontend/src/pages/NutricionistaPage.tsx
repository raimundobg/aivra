import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box, Button, Container, Flex, Grid, Heading, Input, Stack, Text,
} from '@chakra-ui/react'
import {
  collection, query, where, doc, getDoc, addDoc, serverTimestamp,
  onSnapshot, orderBy,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../providers/AuthProvider'
import { MetricCard } from '../atoms/MetricCard'
import { PlanBadge, OnboardingBadge } from '../atoms/StatusBadge'
import { PatientCardRow } from '../molecules/PatientCardRow'
import { PatientFichaForm } from '../organisms/PatientFichaForm'
import { GeneratePautaPanel } from '../organisms/GeneratePautaPanel'
import { R24Editor } from '../organisms/R24Editor'
import { calcGET } from '../services/nutritionCalculations'

// ── Design tokens ──────────────────────────────────────────────────────────
const C = {
  green: '#5F6F52',
  greenLight: '#eef2ea',
  cream: '#F9F4EF',
  beige: '#E9DFD3',
  border: 'rgba(95,111,82,0.15)',
  text: '#2D3319',
  muted: '#7a7264',
  white: '#ffffff',
}

// ── Types ──────────────────────────────────────────────────────────────────
interface Patient {
  uid: string
  displayName: string
  email: string
  createdAt: Date | null
  onboardingCompleted: boolean
  phone?: string
  birthDate?: string
  plan?: string
}

interface Message {
  id: string
  sender: 'patient' | 'ai' | 'nutritionist'
  content: string
  timestamp: Date | null
}

// ── Chat component ─────────────────────────────────────────────────────────
function PatientChat({ patientId, nutriId }: { patientId: string; nutriId: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const q = query(collection(db, 'conversations', patientId, 'messages'), orderBy('timestamp', 'asc'))
    return onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({
        id: d.id,
        sender: d.data().sender as Message['sender'],
        content: d.data().content,
        timestamp: d.data().timestamp?.toDate() ?? null,
      })))
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    })
  }, [patientId])

  async function send() {
    if (!input.trim() || sending) return
    const text = input.trim(); setInput(''); setSending(true)
    try {
      await addDoc(collection(db, 'conversations', patientId, 'messages'), {
        sender: 'nutritionist', senderId: nutriId, content: text, timestamp: serverTimestamp(),
      })
    } catch (e) { console.error(e) } finally { setSending(false) }
  }

  return (
    <Box bg="white" borderRadius="2xl" overflow="hidden" borderWidth="1px" borderColor={C.border}>
      <Box bg={C.greenLight} px={4} py={3} borderBottomWidth="1px" borderColor={C.border}>
        <Text fontFamily="heading" fontWeight="700" color={C.text} fontSize="sm">💬 Chat con paciente</Text>
      </Box>
      <Box h="420px" overflowY="auto" px={4} py={4} css={{ scrollbarWidth: 'thin' }}>
        <Stack gap={3}>
          {messages.length === 0 && (
            <Text fontSize="sm" color={C.muted} textAlign="center" mt={10}>
              Sin mensajes aún. Sé el primero en escribir.
            </Text>
          )}
          {messages.map(msg => {
            const isNutri = msg.sender === 'nutritionist'
            const time = msg.timestamp
              ? new Date(msg.timestamp).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
              : ''
            return (
              <Flex key={msg.id} justify={isNutri ? 'flex-end' : 'flex-start'} gap={2} align="flex-end">
                {!isNutri && (
                  <Box w={7} h={7} borderRadius="full" bg={msg.sender === 'ai' ? C.beige : C.green}
                    display="flex" alignItems="center" justifyContent="center" flexShrink={0} mb={4}>
                    <Text fontSize="9px" fontWeight="700" color={msg.sender === 'ai' ? C.muted : 'white'}>
                      {msg.sender === 'ai' ? 'IA' : 'P'}
                    </Text>
                  </Box>
                )}
                <Box maxW="70%">
                  {!isNutri && (
                    <Text fontSize="xs" fontWeight="600" color={C.text} mb={1}>
                      {msg.sender === 'ai' ? 'Asistente IA' : 'Paciente'}
                    </Text>
                  )}
                  <Box px={3} py={2.5}
                    borderRadius={isNutri ? '16px 16px 4px 16px' : '16px 16px 16px 4px'}
                    bg={isNutri ? C.green : C.white}
                    borderWidth={isNutri ? 0 : '1px'} borderColor={C.border}>
                    <Text fontSize="sm" color={isNutri ? 'white' : C.text} lineHeight="1.6">{msg.content}</Text>
                  </Box>
                  <Text fontSize="10px" color={C.muted} mt={1} textAlign={isNutri ? 'right' : 'left'}>{time}</Text>
                </Box>
                {isNutri && (
                  <Box w={7} h={7} borderRadius="full" bg={C.green}
                    display="flex" alignItems="center" justifyContent="center" flexShrink={0} mb={4}>
                    <Text fontSize="9px" fontWeight="700" color="white">N</Text>
                  </Box>
                )}
              </Flex>
            )
          })}
          <div ref={bottomRef} />
        </Stack>
      </Box>
      <Box bg={C.cream} px={4} py={3} borderTopWidth="1px" borderColor={C.border}>
        <Flex gap={2}>
          <Input
            flex={1} placeholder="Escribe tu respuesta..." value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            borderRadius="full" borderColor={C.border} bg={C.white}
            _focus={{ borderColor: C.green, boxShadow: 'none' }} fontSize="sm"
          />
          <Button
            px={5} borderRadius="full" bg={input.trim() ? C.green : C.beige}
            color={input.trim() ? 'white' : C.muted}
            onClick={send} loading={sending}
            _hover={{ opacity: 0.9 }} transition="all 0.2s" fontSize="sm">
            Enviar
          </Button>
        </Flex>
      </Box>
    </Box>
  )
}

// ── Patient header card ────────────────────────────────────────────────────
function PatientHeader({ patient }: { patient: Patient }) {
  const initials = patient.displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const age = patient.birthDate
    ? Math.floor((Date.now() - new Date(patient.birthDate).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null

  return (
    <Box
      bg="white" borderRadius="2xl" p={5} borderWidth="1px" borderColor={C.border}
      bgGradient="to-r" gradientFrom="white" gradientTo={C.cream}
    >
      <Flex align={{ base: 'flex-start', sm: 'center' }} gap={4} direction={{ base: 'column', sm: 'row' }}>
        <Box
          w={14} h={14} borderRadius="2xl" bg={C.green} flexShrink={0}
          display="flex" alignItems="center" justifyContent="center"
          boxShadow="0 4px 12px rgba(95,111,82,0.25)"
        >
          <Text fontWeight="800" color="white" fontSize="md">{initials}</Text>
        </Box>
        <Box flex={1}>
          <Flex align="center" gap={2} mb={1} flexWrap="wrap">
            <Heading fontFamily="heading" fontSize="lg" fontWeight="800" color={C.text}>
              {patient.displayName}
            </Heading>
            <PlanBadge plan={patient.plan} />
          </Flex>
          <Flex align="center" gap={3} flexWrap="wrap">
            <Text fontSize="sm" color={C.muted}>{patient.email}</Text>
            {patient.phone && <Text fontSize="sm" color={C.muted}>{patient.phone}</Text>}
            {age && <Text fontSize="sm" color={C.muted}>{age} años</Text>}
          </Flex>
        </Box>
        <OnboardingBadge completed={patient.onboardingCompleted} />
      </Flex>
    </Box>
  )
}

// ── Tab selector ───────────────────────────────────────────────────────────
type Tab = 'ficha' | 'chat' | 'pauta' | 'r24'
const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'ficha', icon: '📋', label: 'Ficha clínica' },
  { id: 'r24',   icon: '🍽️', label: 'Registro 24h' },
  { id: 'chat',  icon: '💬', label: 'Chat' },
  { id: 'pauta', icon: '✨', label: 'Generar pauta' },
]

function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <Box bg="white" borderRadius="2xl" p={1.5} borderWidth="1px" borderColor={C.border}>
      <Grid templateColumns="1fr 1fr 1fr" gap={1}>
        {TABS.map(t => (
          <Box
            key={t.id}
            py={2.5} textAlign="center" borderRadius="xl" cursor="pointer"
            bg={active === t.id ? C.green : 'transparent'}
            color={active === t.id ? 'white' : C.muted}
            fontWeight={active === t.id ? '700' : '500'}
            fontSize="sm"
            onClick={() => onChange(t.id)}
            transition="all 0.2s"
            _hover={{ bg: active === t.id ? C.green : C.greenLight }}
          >
            <Text display={{ base: 'none', sm: 'block' }}>{t.icon} {t.label}</Text>
            <Text display={{ base: 'block', sm: 'none' }} fontSize="xl">{t.icon}</Text>
          </Box>
        ))}
      </Grid>
    </Box>
  )
}

// ── Content status panel ───────────────────────────────────────────────────
function ContentStatus({ patientId }: { patientId: string }) {
  const [status, setStatus] = useState({ pauta: false, menu: false, mediciones: false, recetas: false })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getDoc(doc(db, 'users', patientId, 'pauta', 'current')),
      getDoc(doc(db, 'users', patientId, 'menu', 'current')),
    ]).then(([pautaSnap, menuSnap]) => {
      setStatus(prev => ({ ...prev, pauta: pautaSnap.exists(), menu: menuSnap.exists() }))
      setLoading(false)
    }).catch(() => setLoading(false))

    const unsubMed = onSnapshot(
      query(collection(db, 'users', patientId, 'mediciones'), orderBy('timestamp', 'asc')),
      snap => setStatus(prev => ({ ...prev, mediciones: snap.size > 0 })),
      () => {}
    )
    const unsubRec = onSnapshot(
      collection(db, 'users', patientId, 'recetas'),
      snap => setStatus(prev => ({ ...prev, recetas: snap.size > 0 })),
      () => {}
    )
    return () => { unsubMed(); unsubRec() }
  }, [patientId])

  const items = [
    { label: 'Pauta', ok: status.pauta, icon: '📋' },
    { label: 'Menú', ok: status.menu, icon: '🥗' },
    { label: 'Mediciones', ok: status.mediciones, icon: '📏' },
    { label: 'Recetas', ok: status.recetas, icon: '🍽️' },
  ]

  return (
    <Box bg="white" borderRadius="2xl" px={5} py={4} borderWidth="1px" borderColor={C.border}>
      <Text fontSize="xs" fontWeight="600" color={C.muted} mb={3}>ESTADO DEL CONTENIDO</Text>
      {loading ? (
        <Text fontSize="xs" color={C.muted}>Cargando...</Text>
      ) : (
        <Grid templateColumns="repeat(4, 1fr)" gap={2}>
          {items.map(item => (
            <Box key={item.label} textAlign="center" p={2} borderRadius="xl"
              bg={item.ok ? C.greenLight : C.cream}>
              <Text fontSize="lg" mb={1}>{item.icon}</Text>
              <Text fontSize="10px" fontWeight="700" color={item.ok ? C.green : C.muted}>{item.label}</Text>
              <Text fontSize="9px" color={item.ok ? C.green : '#d97706'} fontWeight="600">
                {item.ok ? '✓ Listo' : '✗ Pendiente'}
              </Text>
            </Box>
          ))}
        </Grid>
      )}
    </Box>
  )
}

// ── Empty state ────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <Box
      bg="white" borderRadius="2xl" p={12} borderWidth="1px" borderColor={C.border}
      textAlign="center"
    >
      <Text fontSize="4xl" mb={4}>👈</Text>
      <Heading fontFamily="heading" fontWeight="700" color={C.text} fontSize="lg" mb={2}>
        Selecciona un paciente
      </Heading>
      <Text fontSize="sm" color={C.muted}>
        Elige un paciente de la lista para ver su ficha clínica completa, chatear o generar una pauta personalizada.
      </Text>
    </Box>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function NutricionistaPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { patientId: routePatientId } = useParams()

  const [patients, setPatients] = useState<Patient[]>([])
  const [loadingPatients, setLoadingPatients] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(routePatientId ?? null)
  const [intake, setIntake] = useState<Record<string, unknown> | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('ficha')
  const [search, setSearch] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteSent, setInviteSent] = useState(false)

  const nutriName = (user?.displayName ?? 'Nutricionista').split(' ')[0]
  const initials = (user?.displayName ?? 'N').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'patient'))
    const unsub = onSnapshot(q, snap => {
      const list = snap.docs.map(d => ({
        uid: d.id,
        displayName: d.data().displayName ?? 'Sin nombre',
        email: d.data().email ?? '',
        createdAt: d.data().createdAt?.toDate() ?? null,
        onboardingCompleted: d.data().onboardingCompleted ?? false,
        phone: d.data().phone,
        birthDate: d.data().birthDate,
        plan: d.data().plan,
      })) as Patient[]
      setPatients(list)
      setLoadingPatients(false)
      setSelectedId(prev => prev ?? (list.length > 0 ? list[0].uid : null))
    }, e => { console.error(e); setLoadingPatients(false) })
    return unsub
  }, [])

  useEffect(() => {
    if (!selectedId) return
    setIntake(null)
    getDoc(doc(db, 'users', selectedId, 'intake', 'form'))
      .then(snap => { if (snap.exists()) setIntake(snap.data()) })
      .catch(console.error)
  }, [selectedId])

  const selectedPatient = patients.find(p => p.uid === selectedId)
  const filtered = patients.filter(p =>
    p.displayName.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    total: patients.length,
    active: patients.filter(p => p.onboardingCompleted).length,
    pending: patients.filter(p => !p.onboardingCompleted).length,
  }

  function selectPatient(uid: string) {
    setSelectedId(uid)
    setActiveTab('ficha')
    setSidebarOpen(false)
  }

  function sendInvite() {
    if (!inviteEmail.trim()) return
    const subject = encodeURIComponent('Te invito a Aivra — Tu plan nutricional personalizado')
    const body = encodeURIComponent(
      `Hola,\n\nTe invito a unirte a Aivra, la plataforma donde vamos a trabajar juntos tu plan nutricional.\n\nRegistrate en: https://aivra.cl/register\n\nHasta pronto,\n${nutriName}`
    )
    window.open(`mailto:${inviteEmail}?subject=${subject}&body=${body}`)
    setInviteSent(true)
    setTimeout(() => { setInviteSent(false); setInviteEmail('') }, 3000)
  }

  // ── Sidebar (patient list) ─────────────────────────────────────────────
  const sidebarContent = (
    <Stack gap={3} h="100%">
      <Box bg="white" borderRadius="2xl" borderWidth="1px" borderColor={C.border} overflow="hidden">
        <Box px={4} py={3} borderBottomWidth="1px" borderColor={C.border}>
          <Text fontFamily="heading" fontWeight="700" color={C.text} fontSize="sm" mb={3}>
            Pacientes ({filtered.length})
          </Text>
          <Input
            placeholder="Buscar paciente..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            size="sm" borderRadius="full" borderColor={C.border} bg={C.cream}
            _focus={{ borderColor: C.green, boxShadow: 'none' }} fontSize="sm"
          />
        </Box>
        <Box maxH={{ base: '300px', lg: 'calc(100vh - 420px)' }} overflowY="auto" p={2}>
          {loadingPatients ? (
            <Text fontSize="sm" color={C.muted} textAlign="center" py={8}>Cargando...</Text>
          ) : filtered.length === 0 ? (
            <Text fontSize="sm" color={C.muted} textAlign="center" py={8}>
              {patients.length === 0 ? 'Sin pacientes registrados.' : 'Sin resultados.'}
            </Text>
          ) : (
            <Stack gap={0.5}>
              {filtered.map(p => (
                <PatientCardRow
                  key={p.uid} patient={p}
                  active={p.uid === selectedId}
                  onClick={() => selectPatient(p.uid)}
                />
              ))}
            </Stack>
          )}
        </Box>
      </Box>

      {/* Invite patient panel */}
      <Box bg="white" borderRadius="2xl" p={4} borderWidth="1px" borderColor={C.border}>
        <Text fontFamily="heading" fontWeight="700" color={C.text} fontSize="sm" mb={3}>
          ✉️ Invitar paciente
        </Text>
        <Stack gap={2}>
          <Input
            placeholder="email@paciente.com"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendInvite()}
            size="sm" borderRadius="full" borderColor={C.border} bg={C.cream}
            _focus={{ borderColor: C.green, boxShadow: 'none' }} fontSize="sm"
            type="email"
          />
          <Button
            size="sm" borderRadius="full" fontWeight="700"
            bg={inviteSent ? C.greenLight : C.green}
            color={inviteSent ? C.green : 'white'}
            _hover={{ opacity: 0.9 }}
            onClick={sendInvite}
            disabled={!inviteEmail.trim()}
          >
            {inviteSent ? '✓ Invitación enviada' : 'Enviar invitación'}
          </Button>
        </Stack>
      </Box>
    </Stack>
  )

  return (
    <Box minH="100dvh" bg={C.cream}>

      {/* ── Navbar ── */}
      <Box
        bg="white" borderBottomWidth="1px" borderColor={C.border}
        position="sticky" top={0} zIndex={100}
        boxShadow="0 1px 8px rgba(95,111,82,0.08)"
      >
        <Container maxW="8xl">
          <Flex h={14} align="center" justify="space-between">
            <Flex align="center" gap={3}>
              {/* Mobile hamburger */}
              <Button
                display={{ base: 'flex', lg: 'none' }}
                variant="ghost" size="sm" color={C.muted}
                onClick={() => setSidebarOpen(!sidebarOpen)}
                px={2}
              >
                ☰
              </Button>
              <Box w={8} h={8} bg={C.green} borderRadius="lg" display="flex" alignItems="center" justifyContent="center">
                <Text color="white" fontWeight="800" fontSize="xs">A</Text>
              </Box>
              <Text color={C.text} fontFamily="heading" fontWeight="700" fontSize="md">Aivra</Text>
              <Box px={2} py={0.5} bg={C.greenLight} borderRadius="full">
                <Text fontSize="xs" color={C.green} fontWeight="600">Nutricionista</Text>
              </Box>
            </Flex>
            <Flex align="center" gap={3}>
              <Box w={8} h={8} bg={C.green} borderRadius="full"
                display="flex" alignItems="center" justifyContent="center">
                <Text fontSize="xs" fontWeight="700" color="white">{initials}</Text>
              </Box>
              <Text color={C.muted} fontSize="sm" display={{ base: 'none', sm: 'block' }}>{nutriName}</Text>
              <Button size="sm" variant="ghost" color={C.muted}
                onClick={async () => { await logout(); navigate('/login') }}
                _hover={{ color: C.text }} fontSize="xs">
                Salir
              </Button>
            </Flex>
          </Flex>
        </Container>
      </Box>

      <Container maxW="8xl" py={6} px={{ base: 4, md: 6 }}>

        {/* ── Page header + stats ── */}
        <Flex justify="space-between" align="flex-start" mb={6} direction={{ base: 'column', sm: 'row' }} gap={3}>
          <Box>
            <Heading fontFamily="heading" fontSize={{ base: 'xl', md: '2xl' }} fontWeight="800" color={C.text}>
              Dashboard nutricionista
            </Heading>
            <Text fontSize="sm" color={C.muted}>Gestiona tus pacientes y sus planes nutricionales</Text>
          </Box>
        </Flex>

        <Grid templateColumns={{ base: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }} gap={4} mb={6}>
          <MetricCard icon="👥" label="Total pacientes" value={stats.total} />
          <MetricCard icon="✅" label="Con onboarding" value={stats.active} valueColor={C.green} />
          <MetricCard icon="⏳" label="Pendientes" value={stats.pending} valueColor="#b45309" />
        </Grid>

        {/* ── Mobile sidebar overlay ── */}
        {sidebarOpen && (
          <Box
            position="fixed" inset={0} zIndex={200} bg="rgba(0,0,0,0.4)"
            display={{ lg: 'none' }}
            onClick={() => setSidebarOpen(false)}
          >
            <Box
              position="absolute" left={0} top={0} bottom={0} w="300px"
              bg={C.cream} p={4} overflowY="auto"
              onClick={e => e.stopPropagation()}
            >
              <Flex justify="space-between" align="center" mb={4}>
                <Text fontFamily="heading" fontWeight="700" color={C.text}>Pacientes</Text>
                <Button size="sm" variant="ghost" onClick={() => setSidebarOpen(false)}>✕</Button>
              </Flex>
              {sidebarContent}
            </Box>
          </Box>
        )}

        {/* ── Main 2-col layout: sidebar + content ── */}
        <Grid
          templateColumns={{ base: '1fr', lg: '280px 1fr' }}
          gap={5}
          alignItems="flex-start"
        >
          {/* Sidebar — hidden on mobile (shown as overlay instead) */}
          <Box display={{ base: 'none', lg: 'block' }} position="sticky" top="80px">
            {sidebarContent}
          </Box>

          {/* Main content */}
          {selectedPatient ? (
            <Stack gap={4}>
              <PatientHeader patient={selectedPatient} />
              <ContentStatus patientId={selectedPatient.uid} />
              <TabBar active={activeTab} onChange={setActiveTab} />

              {activeTab === 'ficha' && (
                <PatientFichaForm patientId={selectedPatient.uid} intake={intake} />
              )}
              {activeTab === 'r24' && (
                <R24Editor patientId={selectedPatient.uid} targetGet={calcGET(intake)?.objetivo} />
              )}
              {activeTab === 'chat' && user && (
                <PatientChat patientId={selectedPatient.uid} nutriId={user.uid} />
              )}
              {activeTab === 'pauta' && (
                <GeneratePautaPanel patientId={selectedPatient.uid} />
              )}
            </Stack>
          ) : (
            <EmptyState />
          )}
        </Grid>
      </Container>
    </Box>
  )
}
