import { useState, useRef, useEffect } from 'react'
import { Box, Button, Container, Flex, Input, Stack, Text } from '@chakra-ui/react'
import { collection, doc, addDoc, getDoc, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../providers/AuthProvider'
import { responderChat, type ChatContext } from '../services/groq'
import AppLayout from '../app/AppLayout'
import PatientNav from '../organisms/PatientNav'

const C = { green: '#3d5a3e', greenLight: '#f0f4f0', tan: '#8b6914', cream: '#faf9f7', border: '#e8e4df', text: '#1a1a1a', muted: '#6b6b6b' }

interface Message {
  id: string
  sender: 'patient' | 'ai' | 'nutritionist'
  content: string
  timestamp: Date | null
}

const WELCOME: Message = {
  id: 'welcome',
  sender: 'ai',
  content: 'Bienvenida al chat. Tu nutricionista responde en 24-48 hrs. Mientras tanto, puedo ayudarte con dudas sobre tu pauta.',
  timestamp: new Date(),
}

function MessageBubble({ msg, userName }: { msg: Message; userName: string }) {
  const isMe = msg.sender === 'patient'
  const isAI = msg.sender === 'ai'
  const time = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : ''

  return (
    <Flex justify={isMe ? 'flex-end' : 'flex-start'} gap={2} align="flex-end">
      {!isMe && (
        <Box w={8} h={8} borderRadius="full" bg={isAI ? '#e8e4df' : C.green}
          display="flex" alignItems="center" justifyContent="center" flexShrink={0} mb={4}>
          <Text fontSize="xs" fontWeight="700" color={isAI ? C.muted : 'white'}>
            {isAI ? 'IA' : 'N'}
          </Text>
        </Box>
      )}
      <Box maxW={{ base: '80%', md: '65%' }}>
        {!isMe && (
          <Flex align="center" gap={2} mb={1}>
            <Text fontSize="xs" fontWeight="600" color={C.text}>
              {isAI ? 'Asistente IA' : 'Tu nutricionista'}
            </Text>
            {!isAI && (
              <Box px={2} py={0.5} bg={C.greenLight} borderRadius="full">
                <Text fontSize="9px" color={C.green} fontWeight="700">Profesional</Text>
              </Box>
            )}
          </Flex>
        )}
        <Box px={4} py={3} borderRadius={isMe ? '20px 20px 4px 20px' : '20px 20px 20px 4px'}
          bg={isMe ? C.green : 'white'} borderWidth={isMe ? '0' : '1px'} borderColor={C.border}>
          <Text fontSize="sm" color={isMe ? 'white' : C.text} lineHeight="1.6">{msg.content}</Text>
        </Box>
        <Text fontSize="10px" color={C.muted} mt={1} textAlign={isMe ? 'right' : 'left'}>{time}</Text>
      </Box>
      {isMe && (
        <Box w={8} h={8} borderRadius="full" bg={C.green}
          display="flex" alignItems="center" justifyContent="center" flexShrink={0} mb={4}>
          <Text fontSize="xs" fontWeight="700" color="white">
            {userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </Text>
        </Box>
      )}
    </Flex>
  )
}

export default function ChatPage() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([WELCOME])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [aiCtx, setAiCtx] = useState<ChatContext | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const displayName = user?.displayName ?? user?.email ?? 'Paciente'

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load pauta + intake for AI context
  useEffect(() => {
    if (!user) return
    Promise.all([
      getDoc(doc(db, 'users', user.uid, 'pauta', 'current')),
      getDoc(doc(db, 'users', user.uid, 'intake', 'form')),
    ]).then(([pautaSnap, intakeSnap]) => {
      const pauta = pautaSnap.data()
      const intake = intakeSnap.data()
      setAiCtx({
        patientName: user.displayName ?? 'paciente',
        objetivo: pauta?.objetivo ?? intake?.objetivo,
        macros: pauta?.macros,
        restricciones: intake?.restricciones,
        diagnosticos: intake?.diagnosticos,
      })
    })
  }, [user])

  // Listen to Firestore messages
  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'conversations', user.uid, 'messages'), orderBy('timestamp', 'asc'))
    return onSnapshot(q, snap => {
      if (snap.empty) return
      const msgs = snap.docs.map(d => ({
        id: d.id,
        sender: d.data().sender as Message['sender'],
        content: d.data().content,
        timestamp: d.data().timestamp?.toDate() ?? null,
      }))
      setMessages([WELCOME, ...msgs])
    })
  }, [user])

  async function send() {
    if (!input.trim() || !user || sending) return
    const text = input.trim()
    setInput('')
    setSending(true)

    const optimistic: Message = { id: Date.now().toString(), sender: 'patient', content: text, timestamp: new Date() }
    setMessages(p => [...p, optimistic])

    try {
      await addDoc(collection(db, 'conversations', user.uid, 'messages'), {
        sender: 'patient', content: text, timestamp: serverTimestamp(),
      })

      // AI reply
      const historial = messages.filter(m => m.id !== 'welcome').map(m => ({ sender: m.sender, content: m.content }))
      const aiReply = await responderChat(text, historial, aiCtx ?? { patientName: displayName })

      await addDoc(collection(db, 'conversations', user.uid, 'messages'), {
        sender: 'ai', content: aiReply, timestamp: serverTimestamp(),
      })
    } catch (e) {
      console.error(e)
    } finally {
      setSending(false)
    }
  }

  return (
    <AppLayout>
      <PatientNav />
      <Flex direction="column" h="calc(100dvh - 56px)" bg={C.cream}>
        {/* Header */}
        <Box bg="white" borderBottomWidth="1px" borderColor={C.border} px={6} py={4}>
          <Container maxW="3xl" px={0}>
            <Flex justify="space-between" align="center">
              <Box>
                <Text fontFamily="heading" fontWeight="700" fontSize="lg" color={C.text}>Chat con tu nutricionista</Text>
                <Flex align="center" gap={2} mt={0.5}>
                  <Box w={2} h={2} borderRadius="full" bg="green.400" />
                  <Text fontSize="xs" color={C.muted}>Asistente IA disponible ahora · Nutricionista responde en 24-48 hrs</Text>
                </Flex>
              </Box>
              <Box px={3} py={1} bg={C.greenLight} borderRadius="full">
                <Text fontSize="xs" color={C.green} fontWeight="600">Plan con Seguimiento</Text>
              </Box>
            </Flex>
          </Container>
        </Box>

        {/* Messages */}
        <Box flex={1} overflowY="auto" px={4} py={4}
          css={{ scrollbarWidth: 'thin', scrollbarColor: `${C.border} transparent` }}>
          <Container maxW="3xl" px={0}>
            <Stack gap={4}>
              {messages.map(msg => <MessageBubble key={msg.id} msg={msg} userName={displayName} />)}
              {sending && (
                <Flex justify="flex-start" gap={2} align="flex-end">
                  <Box w={8} h={8} borderRadius="full" bg="#e8e4df"
                    display="flex" alignItems="center" justifyContent="center" flexShrink={0} mb={4}>
                    <Text fontSize="xs" fontWeight="700" color={C.muted}>IA</Text>
                  </Box>
                  <Box px={4} py={3} borderRadius="20px 20px 20px 4px" bg="white" borderWidth="1px" borderColor={C.border}>
                    <Flex gap={1} align="center">
                      {[0, 1, 2].map(i => (
                        <Box key={i} w={1.5} h={1.5} borderRadius="full" bg={C.muted}
                          style={{ animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                      ))}
                    </Flex>
                  </Box>
                </Flex>
              )}
              <div ref={bottomRef} />
            </Stack>
          </Container>
        </Box>

        {/* Quick replies */}
        <Box bg="white" borderTopWidth="1px" borderColor={C.border} px={4} py={2}>
          <Container maxW="3xl" px={0}>
            <Flex gap={2} overflowX="auto" pb={1} css={{ scrollbarWidth: 'none' }}>
              {['¿Puedo cambiar el almuerzo?', '¿Cuánta agua debo tomar?', 'Tengo hambre entre comidas', 'Quiero ajustar mi plan'].map(s => (
                <Box key={s} px={3} py={1.5} borderRadius="full" borderWidth="1px" borderColor={C.border}
                  cursor="pointer" flexShrink={0} onClick={() => setInput(s)}
                  _hover={{ borderColor: C.green }} transition="all 0.15s">
                  <Text fontSize="xs" color={C.muted} whiteSpace="nowrap">{s}</Text>
                </Box>
              ))}
            </Flex>
          </Container>
        </Box>

        {/* Input */}
        <Box bg="white" borderTopWidth="1px" borderColor={C.border} px={4} py={3}
          pb={`calc(12px + env(safe-area-inset-bottom))`}>
          <Container maxW="3xl" px={0}>
            <Flex gap={3} align="center">
              <Input flex={1} placeholder="Escribe tu mensaje..." value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                borderRadius="full" borderColor={C.border} bg={C.cream}
                _focus={{ borderColor: C.green, boxShadow: 'none' }} fontSize="sm" />
              <Button w={10} h={10} borderRadius="full" bg={input.trim() ? C.green : C.border}
                color="white" onClick={send} loading={sending} minW={10}
                _hover={{ opacity: 0.9 }} transition="all 0.2s" p={0}>
                ➤
              </Button>
            </Flex>
            <Text fontSize="10px" color={C.muted} textAlign="center" mt={2}>
              Respuestas IA instantáneas · Tu nutricionista revisa el historial completo
            </Text>
          </Container>
        </Box>
      </Flex>
    </AppLayout>
  )
}
