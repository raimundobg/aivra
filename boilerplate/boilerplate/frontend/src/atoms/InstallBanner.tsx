import { useState, useEffect } from 'react'
import { Box, Button, Flex, Text } from '@chakra-ui/react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallBanner() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|Mobile/i.test(navigator.userAgent)
    setIsMobile(mobile)

    const handler = (e: Event) => {
      e.preventDefault()
      setPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!prompt || dismissed || !isMobile) return null

  async function install() {
    if (!prompt) return
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') setPrompt(null)
    else setDismissed(true)
  }

  return (
    <Box
      position="fixed" bottom={20} left={4} right={4} zIndex={1000}
      bg="white" borderRadius="2xl" p={4}
      boxShadow="0 8px 32px rgba(95,111,82,0.2)"
      borderWidth="1px" borderColor="rgba(95,111,82,0.2)"
    >
      <Flex align="center" justify="space-between" gap={3}>
        <Flex align="center" gap={3} flex={1}>
          <Box w={10} h={10} bg="#5F6F52" borderRadius="xl" display="flex" alignItems="center" justifyContent="center" flexShrink={0}>
            <Text color="white" fontWeight="800" fontSize="sm">A</Text>
          </Box>
          <Box>
            <Text fontSize="sm" fontWeight="700" color="#2D3319">Instalar Aivra</Text>
            <Text fontSize="xs" color="#7a7264">Agrégala a tu pantalla de inicio</Text>
          </Box>
        </Flex>
        <Flex gap={2}>
          <Button size="sm" variant="ghost" color="#7a7264" onClick={() => setDismissed(true)}
            _hover={{ bg: '#f5f5f5' }} borderRadius="full" fontSize="xs">
            No ahora
          </Button>
          <Button size="sm" bg="#5F6F52" color="white" onClick={install}
            _hover={{ bg: '#4a5740' }} borderRadius="full" fontSize="xs" fontWeight="700">
            Instalar
          </Button>
        </Flex>
      </Flex>
    </Box>
  )
}
