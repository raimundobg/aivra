import { useState, useEffect } from 'react'
import { Box, Button, Container, Flex, Heading, Stack, Text } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../providers/AuthProvider'
import AppLayout from '../app/AppLayout'
import PatientNav from '../organisms/PatientNav'
import type { MenuDia } from '../services/groq'

const C = { green: '#5F6F52', greenLight: '#eef2ea', cream: '#F9F4EF', beige: '#E9DFD3', border: 'rgba(95,111,82,0.15)', text: '#2D3319', muted: '#7a7264' }

// ── Category classification ────────────────────────────────────────────────
const CATEGORIES: Record<string, { label: string; emoji: string; keywords: string[] }> = {
  proteinas:  { label: 'Carnes y proteínas', emoji: '🥩', keywords: ['pollo', 'carne', 'salmón', 'atún', 'huevo', 'pavo', 'cerdo', 'tofu', 'legumbre', 'lenteja', 'garbanzo', 'poroto', 'proteína'] },
  lacteos:    { label: 'Lácteos', emoji: '🥛', keywords: ['leche', 'yogurt', 'queso', 'requesón', 'kéfir', 'crema'] },
  verduras:   { label: 'Verduras y frutas', emoji: '🥦', keywords: ['lechuga', 'tomate', 'pepino', 'zanahoria', 'brócoli', 'espinaca', 'manzana', 'plátano', 'naranja', 'fruta', 'verdura', 'ensalada', 'camote', 'papa', 'cebolla', 'ajo', 'palta', 'pimiento'] },
  cereales:   { label: 'Cereales y legumbres', emoji: '🌾', keywords: ['arroz', 'pan', 'avena', 'fideos', 'pasta', 'quinoa', 'maíz', 'tortilla', 'galleta', 'cereal', 'harina', 'granola'] },
  grasas:     { label: 'Grasas y aceites', emoji: '🫒', keywords: ['aceite', 'mantequilla', 'margarina', 'nuez', 'almendra', 'maní', 'chía', 'linaza', 'coco'] },
  condimentos:{ label: 'Condimentos y otros', emoji: '🧂', keywords: ['sal', 'pimienta', 'limón', 'vinagre', 'mostaza', 'miel', 'mermelada', 'salsa', 'caldo', 'canela'] },
}

function classifyItem(item: string): string {
  const lower = item.toLowerCase()
  for (const [cat, { keywords }] of Object.entries(CATEGORIES)) {
    if (keywords.some(k => lower.includes(k))) return cat
  }
  return 'condimentos'
}

function extractItemName(raw: string): string {
  // Remove quantities like "150g de ", "2 ", "1 taza de ", etc.
  return raw
    .replace(/^\d+(\.\d+)?\s*(g|kg|ml|l|taza[s]?|cucharad[a-z]*|unidad[es]*)\s+de\s+/i, '')
    .replace(/^\d+(\.\d+)?\s*(g|kg|ml|l)\s+/i, '')
    .replace(/^\d+\s+/i, '')
    .trim()
}

interface ListItem {
  raw: string
  name: string
  checked: boolean
  category: string
}

export default function ShoppingListPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<ListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [noMenu, setNoMenu] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!user) return
    getDoc(doc(db, 'users', user.uid, 'menu', 'current'))
      .then(snap => {
        if (!snap.exists()) { setNoMenu(true); setLoading(false); return }
        const dias = snap.data().dias as MenuDia[]
        // Aggregate all items across the week
        const all: string[] = []
        dias.forEach(dia => dia.comidas.forEach(c => c.items.forEach(i => all.push(i))))
        // Deduplicate by normalized name
        const seen = new Set<string>()
        const unique: ListItem[] = []
        all.forEach(raw => {
          const name = extractItemName(raw)
          const key = name.toLowerCase().slice(0, 20)
          if (!seen.has(key)) {
            seen.add(key)
            unique.push({ raw, name, checked: false, category: classifyItem(name) })
          }
        })
        setItems(unique)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [user])

  function toggle(idx: number) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, checked: !item.checked } : item))
  }

  function copyList() {
    const text = Object.entries(CATEGORIES)
      .map(([cat, { label, emoji }]) => {
        const catItems = items.filter(i => i.category === cat && !i.checked)
        if (!catItems.length) return null
        return `${emoji} ${label}\n${catItems.map(i => `• ${i.raw}`).join('\n')}`
      })
      .filter(Boolean)
      .join('\n\n')
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  const pending = items.filter(i => !i.checked).length
  const total = items.length

  if (loading) return (
    <AppLayout><PatientNav />
      <Box bg={C.cream} minH="calc(100dvh - 56px)">
        <Container maxW="3xl" py={12}><Text color={C.muted} textAlign="center">Generando lista...</Text></Container>
      </Box>
    </AppLayout>
  )

  return (
    <AppLayout>
      <PatientNav />
      <Box bg={C.cream} minH="calc(100dvh - 56px)" pb={24}>
        <Container maxW="3xl" py={8}>
          <Flex align="flex-start" justify="space-between" mb={6} flexWrap="wrap" gap={3}>
            <Box>
              <Heading fontFamily="heading" fontWeight="800" color={C.text} fontSize={{ base: '2xl', md: '3xl' }} mb={1}>
                Lista de compras 🛒
              </Heading>
              <Text color={C.muted} fontSize="sm">Basada en tu menú semanal</Text>
            </Box>
            {!noMenu && (
              <Button onClick={copyList} borderRadius="full" size="sm" variant="outline"
                borderColor={C.border} color={C.green} fontWeight="600">
                {copied ? '✅ Copiado' : '📋 Copiar lista'}
              </Button>
            )}
          </Flex>

          {noMenu ? (
            <Box bg="white" borderRadius="2xl" p={12} borderWidth="1px" borderColor={C.border} textAlign="center">
              <Text fontSize="3xl" mb={3}>📋</Text>
              <Heading fontFamily="heading" fontSize="lg" fontWeight="700" color={C.text} mb={2}>Sin menú semanal</Heading>
              <Text fontSize="sm" color={C.muted} mb={4}>Genera tu menú semanal desde el dashboard para ver tu lista de compras.</Text>
              <RouterLink to="/dashboard">
                <Button bg={C.green} color="white" borderRadius="full" size="sm" fontWeight="700">
                  Ir al Dashboard
                </Button>
              </RouterLink>
            </Box>
          ) : (
            <>
              {/* Progress bar */}
              <Box bg="white" borderRadius="2xl" p={4} borderWidth="1px" borderColor={C.border} mb={5}>
                <Flex justify="space-between" align="center" mb={2}>
                  <Text fontSize="sm" color={C.muted}>Progreso de compras</Text>
                  <Text fontSize="sm" fontWeight="700" color={C.green}>{total - pending}/{total} items</Text>
                </Flex>
                <Box h={2} bg={C.beige} borderRadius="full">
                  <Box h="full" borderRadius="full" bg={C.green} style={{ width: `${total > 0 ? ((total - pending) / total) * 100 : 0}%`, transition: 'width 0.4s' }} />
                </Box>
                {pending === 0 && total > 0 && (
                  <Text fontSize="xs" color={C.green} fontWeight="600" mt={2} textAlign="center">✅ ¡Lista completa!</Text>
                )}
              </Box>

              {/* Categories */}
              <Stack gap={4}>
                {Object.entries(CATEGORIES).map(([cat, { label, emoji }]) => {
                  const catItems = items.filter(i => i.category === cat)
                  if (catItems.length === 0) return null
                  const allChecked = catItems.every(i => i.checked)
                  return (
                    <Box key={cat} bg="white" borderRadius="2xl" borderWidth="1px" borderColor={C.border} overflow="hidden"
                      opacity={allChecked ? 0.6 : 1} transition="opacity 0.2s">
                      <Flex align="center" gap={2} px={5} py={3} bg={allChecked ? C.cream : C.greenLight}
                        borderBottomWidth="1px" borderColor={C.border}>
                        <Text fontSize="lg">{emoji}</Text>
                        <Text fontFamily="heading" fontWeight="700" color={C.text} fontSize="sm">{label}</Text>
                        <Box ml="auto" px={2} py={0.5} borderRadius="full" bg={allChecked ? '#d1fae5' : C.beige}>
                          <Text fontSize="xs" color={allChecked ? '#065f46' : C.muted} fontWeight="600">
                            {catItems.filter(i => i.checked).length}/{catItems.length}
                          </Text>
                        </Box>
                      </Flex>
                      <Stack gap={0} px={2} py={2}>
                        {catItems.map((item, globalIdx) => {
                          const idx = items.indexOf(item)
                          return (
                            <Flex key={globalIdx} align="center" gap={3} px={3} py={2.5}
                              borderRadius="xl" cursor="pointer" _hover={{ bg: C.cream }}
                              onClick={() => toggle(idx)} transition="all 0.15s">
                              <Box w={5} h={5} borderRadius="md" flexShrink={0}
                                bg={item.checked ? C.green : 'white'}
                                borderWidth="2px" borderColor={item.checked ? C.green : C.beige}
                                display="flex" alignItems="center" justifyContent="center">
                                {item.checked && <Text color="white" fontSize="10px" fontWeight="800">✓</Text>}
                              </Box>
                              <Text fontSize="sm" color={item.checked ? C.muted : C.text}
                                textDecoration={item.checked ? 'line-through' : 'none'}
                                flex={1}>{item.raw}</Text>
                            </Flex>
                          )
                        })}
                      </Stack>
                    </Box>
                  )
                })}
              </Stack>
            </>
          )}
        </Container>
      </Box>
    </AppLayout>
  )
}
