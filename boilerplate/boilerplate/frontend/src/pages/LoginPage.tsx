import { useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { Box, Button, Field, Flex, Heading, Input, Stack, Text, Separator } from '@chakra-ui/react'
import { useAuth } from '../providers/AuthProvider'
import GoogleIcon from '../atoms/GoogleIcon'

const C = { green: '#3d5a3e', greenLight: '#f0f4f0', border: '#e8e4df', muted: '#6b6b6b' }

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  function redirectAfterLogin(role: string, onboardingCompleted: boolean) {
    if (role === 'nutritionist') { navigate('/nutricionista'); return }
    navigate(onboardingCompleted ? '/dashboard' : '/onboarding')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { role, onboardingCompleted } = await login(email, password)
      redirectAfterLogin(role, onboardingCompleted)
    } catch {
      setError('Correo o contraseña incorrectos.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setError('')
    setGoogleLoading(true)
    try {
      const { role, onboardingCompleted } = await loginWithGoogle()
      redirectAfterLogin(role, onboardingCompleted)
    } catch {
      setError('No se pudo iniciar sesión con Google.')
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <Flex minH="100dvh" bg="#faf9f7">
      {/* Left panel */}
      <Box display={{ base: 'none', lg: 'flex' }} w="40%" bg={C.green}
        flexDirection="column" justifyContent="center" p={12}>
        <Flex align="center" gap={3} mb={12}>
          <Box w={10} h={10} bg="whiteAlpha.200" borderRadius="full"
            display="flex" alignItems="center" justifyContent="center">
            <Text color="white" fontWeight="800" fontSize="sm">AI</Text>
          </Box>
          <Text color="white" fontFamily="heading" fontWeight="700" fontSize="xl">Aivra</Text>
        </Flex>
        <Heading color="white" fontFamily="heading" fontSize="3xl" fontWeight="800" mb={4} lineHeight="1.2">
          Bienvenido de vuelta
        </Heading>
        <Text color="whiteAlpha.800" fontSize="md" lineHeight="1.7">
          Ingresa para ver tu pauta, registrar tus hábitos y conectarte con tu nutricionista.
        </Text>
      </Box>

      {/* Right panel */}
      <Flex flex={1} align="center" justify="center" p={6}>
        <Box w="full" maxW="420px">
          <Flex align="center" gap={2} mb={8} display={{ base: 'flex', lg: 'none' }} justify="center">
            <Box w={8} h={8} bg={C.green} borderRadius="full"
              display="flex" alignItems="center" justifyContent="center">
              <Text color="white" fontWeight="800" fontSize="xs">AI</Text>
            </Box>
            <Text fontFamily="heading" fontWeight="700" fontSize="lg">Aivra</Text>
          </Flex>

          <Heading fontFamily="heading" fontSize="2xl" fontWeight="800" mb={1} color="#1a1a1a">
            Iniciar sesión
          </Heading>
          <Text color={C.muted} fontSize="sm" mb={6}>
            Pacientes y nutricionistas — mismo acceso
          </Text>

          {error && (
            <Box bg="red.50" borderRadius="xl" p={3} mb={4} borderWidth="1px" borderColor="red.200">
              <Text color="red.600" fontSize="sm">{error}</Text>
            </Box>
          )}

          <form onSubmit={handleSubmit}>
            <Stack gap={4}>
              <Field.Root>
                <Field.Label fontSize="sm" fontWeight="500">Correo electrónico</Field.Label>
                <Input type="email" placeholder="tu@correo.com" value={email}
                  onChange={e => setEmail(e.target.value)} required size="lg"
                  borderRadius="xl" borderColor={C.border} />
              </Field.Root>

              <Field.Root>
                <Flex justify="space-between" align="center" mb={1}>
                  <Field.Label fontSize="sm" fontWeight="500" mb={0}>Contraseña</Field.Label>
                  <RouterLink to="/forgot-password" style={{ fontSize: '12px', color: C.green, textDecoration: 'none' }}>
                    ¿Olvidaste tu contraseña?
                  </RouterLink>
                </Flex>
                <Input type="password" placeholder="••••••••" value={password}
                  onChange={e => setPassword(e.target.value)} required size="lg"
                  borderRadius="xl" borderColor={C.border} />
              </Field.Root>

              <Button type="submit" bg={C.green} color="white" size="lg"
                borderRadius="full" loading={loading}
                loadingText="Ingresando..." _hover={{ opacity: 0.9 }} fontWeight="600">
                Ingresar
              </Button>
            </Stack>
          </form>

          <Flex align="center" gap={3} my={5}>
            <Separator flex="1" />
            <Text fontSize="xs" color={C.muted}>o continúa con</Text>
            <Separator flex="1" />
          </Flex>

          <Button variant="outline" w="full" size="lg" borderRadius="full"
            onClick={handleGoogle} loading={googleLoading}
            loadingText="Conectando..." gap={2} borderColor={C.border}>
            <GoogleIcon />
            Google
          </Button>

          <Text textAlign="center" mt={6} fontSize="sm" color={C.muted}>
            ¿No tienes cuenta?{' '}
            <RouterLink to="/register" style={{ color: C.green, fontWeight: 600, textDecoration: 'none' }}>
              Regístrate gratis
            </RouterLink>
          </Text>
        </Box>
      </Flex>
    </Flex>
  )
}
