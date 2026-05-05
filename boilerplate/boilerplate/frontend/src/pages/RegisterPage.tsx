import { useState } from 'react'
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom'
import { Box, Button, Field, Flex, Grid, Heading, Input, Stack, Text, Separator } from '@chakra-ui/react'
import { useAuth } from '../providers/AuthProvider'
import GoogleIcon from '../atoms/GoogleIcon'

const C = { green: '#3d5a3e', greenLight: '#f0f4f0', border: '#e8e4df', muted: '#6b6b6b' }

const ESPECIALIDADES = [
  'Nutrición clínica', 'Nutrición deportiva', 'Nutrición funcional',
  'Obesidad y sobrepeso', 'Diabetes', 'Enfermedades renales',
  'Vegetariano/Vegano', 'Celiaquía', 'Pediatría', 'Oncología',
]

function ToggleChip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <Box px={3} py={1.5} borderRadius="full" cursor="pointer" fontSize="xs"
      fontWeight="500" borderWidth="1px" userSelect="none"
      bg={selected ? C.green : 'white'} color={selected ? 'white' : C.muted}
      borderColor={selected ? C.green : C.border}
      onClick={onClick} transition="all 0.15s">
      {selected ? '✓ ' : ''}{label}
    </Box>
  )
}

export default function RegisterPage() {
  const [params] = useSearchParams()
  const initialRole = params.get('role') === 'nutritionist' ? 'nutritionist' : 'patient'

  const { register, loginWithGoogle } = useAuth()
  const navigate = useNavigate()

  const [role, setRole] = useState<'patient' | 'nutritionist'>(initialRole)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [phone, setPhone] = useState('')
  const [birthdate, setBirthdate] = useState('')
  const [country, setCountry] = useState('Chile')
  const [especialidades, setEspecialidades] = useState<string[]>([])
  const [modalidad, setModalidad] = useState('')
  const [registro, setRegistro] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  function toggleEsp(e: string) {
    setEspecialidades(p => p.includes(e) ? p.filter(x => x !== e) : [...p, e])
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    setError('')
    if (password !== confirm) return setError('Las contraseñas no coinciden.')
    if (password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.')
    setLoading(true)
    try {
      await register(email, password, name, role, {
        phone, birthdate, country, especialidades, modalidad, registro,
      })
      navigate(role === 'patient' ? '/dashboard' : '/nutricionista')
    } catch (err: unknown) {
      const code = (err as { code?: string }).code
      if (code === 'auth/email-already-in-use') setError('Este correo ya está registrado.')
      else setError('No se pudo crear la cuenta. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setError('')
    setGoogleLoading(true)
    try {
      await loginWithGoogle(role)
      navigate(role === 'patient' ? '/dashboard' : '/nutricionista')
    } catch {
      setError('No se pudo registrar con Google.')
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <Flex minH="100dvh" bg="#faf9f7">
      {/* Left panel — branding */}
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
          {role === 'patient'
            ? 'Tu transformación comienza aquí'
            : 'La plataforma que tus pacientes merecen'}
        </Heading>
        <Text color="whiteAlpha.800" fontSize="md" lineHeight="1.7">
          {role === 'patient'
            ? 'Crea tu cuenta y recibe una pauta nutricional personalizada en menos de 24 horas.'
            : 'Gestiona pacientes, genera pautas con IA y haz seguimiento en tiempo real.'}
        </Text>

        <Stack gap={4} mt={10}>
          {(role === 'patient'
            ? ['Pauta personalizada en 24 hrs', 'Seguimiento de macros y adherencia', 'Chat con tu nutricionista o IA']
            : ['Fichas clínicas completas', 'Generación de pautas con IA', 'Alertas de adherencia automáticas']
          ).map(f => (
            <Flex key={f} align="center" gap={3}>
              <Box w={5} h={5} bg="whiteAlpha.200" borderRadius="full"
                display="flex" alignItems="center" justifyContent="center" flexShrink={0}>
                <Text fontSize="xs" color="white">✓</Text>
              </Box>
              <Text color="whiteAlpha.900" fontSize="sm">{f}</Text>
            </Flex>
          ))}
        </Stack>
      </Box>

      {/* Right panel — form */}
      <Flex flex={1} align="center" justify="center" p={6} overflowY="auto">
        <Box w="full" maxW="480px" py={8}>
          {/* Logo mobile */}
          <Flex align="center" gap={2} mb={8} display={{ base: 'flex', lg: 'none' }} justify="center">
            <Box w={8} h={8} bg={C.green} borderRadius="full"
              display="flex" alignItems="center" justifyContent="center">
              <Text color="white" fontWeight="800" fontSize="xs">AI</Text>
            </Box>
            <Text fontFamily="heading" fontWeight="700" fontSize="lg">Aivra</Text>
          </Flex>

          {/* Role selector */}
          <Box mb={8} p={1.5} bg="white" borderRadius="full" borderWidth="1px" borderColor={C.border}>
            <Grid templateColumns="1fr 1fr" gap={1}>
              {([['patient', '🧑 Soy Paciente'], ['nutritionist', '👩‍⚕️ Soy Nutricionista']] as const).map(([r, label]) => (
                <Box key={r} py={2.5} textAlign="center" borderRadius="full" cursor="pointer"
                  bg={role === r ? C.green : 'transparent'}
                  color={role === r ? 'white' : C.muted}
                  fontWeight={role === r ? '700' : '500'}
                  fontSize="sm" onClick={() => setRole(r)} transition="all 0.2s">
                  {label}
                </Box>
              ))}
            </Grid>
          </Box>

          <Heading fontFamily="heading" fontSize="2xl" fontWeight="800" mb={1} color="#1a1a1a">
            {role === 'patient' ? 'Crear cuenta' : 'Registro profesional'}
          </Heading>
          <Text color={C.muted} fontSize="sm" mb={6}>
            {role === 'patient' ? 'Comienza tu journey nutricional hoy' : 'Accede al dashboard profesional'}
          </Text>

          {error && (
            <Box bg="red.50" borderRadius="xl" p={3} mb={4} borderWidth="1px" borderColor="red.200">
              <Text color="red.600" fontSize="sm">{error}</Text>
            </Box>
          )}

          <form onSubmit={handleSubmit}>
            <Stack gap={4}>
              <Grid templateColumns="1fr 1fr" gap={3}>
                <Field.Root>
                  <Field.Label fontSize="sm" fontWeight="500">Nombre completo</Field.Label>
                  <Input value={name} onChange={e => setName(e.target.value)}
                    placeholder="Tu nombre" required size="lg" borderRadius="xl" borderColor={C.border} />
                </Field.Root>
                <Field.Root>
                  <Field.Label fontSize="sm" fontWeight="500">Teléfono</Field.Label>
                  <Input value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="+56 9 XXXX" size="lg" borderRadius="xl" borderColor={C.border} />
                </Field.Root>
              </Grid>

              <Field.Root>
                <Field.Label fontSize="sm" fontWeight="500">Correo electrónico</Field.Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="tu@correo.com" required size="lg" borderRadius="xl" borderColor={C.border} />
              </Field.Root>

              {role === 'patient' && (
                <Grid templateColumns="1fr 1fr" gap={3}>
                  <Field.Root>
                    <Field.Label fontSize="sm" fontWeight="500">Fecha de nacimiento</Field.Label>
                    <Input type="date" value={birthdate} onChange={e => setBirthdate(e.target.value)}
                      size="lg" borderRadius="xl" borderColor={C.border} />
                  </Field.Root>
                  <Field.Root>
                    <Field.Label fontSize="sm" fontWeight="500">País</Field.Label>
                    <Input value={country} onChange={e => setCountry(e.target.value)}
                      placeholder="Chile" size="lg" borderRadius="xl" borderColor={C.border} />
                  </Field.Root>
                </Grid>
              )}

              {role === 'nutritionist' && (
                <>
                  <Box>
                    <Text fontSize="sm" fontWeight="500" mb={2}>Especialidades</Text>
                    <Flex gap={2} flexWrap="wrap">
                      {ESPECIALIDADES.map(e => (
                        <ToggleChip key={e} label={e}
                          selected={especialidades.includes(e)}
                          onClick={() => toggleEsp(e)} />
                      ))}
                    </Flex>
                  </Box>

                  <Box>
                    <Text fontSize="sm" fontWeight="500" mb={2}>Modalidad de atención</Text>
                    <Flex gap={2}>
                      {['Presencial', 'Online', 'Híbrido'].map(m => (
                        <ToggleChip key={m} label={m}
                          selected={modalidad === m}
                          onClick={() => setModalidad(m)} />
                      ))}
                    </Flex>
                  </Box>

                  <Field.Root>
                    <Field.Label fontSize="sm" fontWeight="500">
                      N° Registro profesional <Text as="span" color={C.muted}>(opcional)</Text>
                    </Field.Label>
                    <Input value={registro} onChange={e => setRegistro(e.target.value)}
                      placeholder="Ej: 12345" size="lg" borderRadius="xl" borderColor={C.border} />
                  </Field.Root>
                </>
              )}

              <Grid templateColumns="1fr 1fr" gap={3}>
                <Field.Root>
                  <Field.Label fontSize="sm" fontWeight="500">Contraseña</Field.Label>
                  <Input type="password" value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Mín. 6 caracteres" required size="lg" borderRadius="xl" borderColor={C.border} />
                </Field.Root>
                <Field.Root>
                  <Field.Label fontSize="sm" fontWeight="500">Confirmar</Field.Label>
                  <Input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                    placeholder="Repite" required size="lg" borderRadius="xl" borderColor={C.border} />
                </Field.Root>
              </Grid>

              <Button type="submit" bg={C.green} color="white" size="lg"
                borderRadius="full" loading={loading}
                loadingText="Creando cuenta..." _hover={{ opacity: 0.9 }} fontWeight="600">
                {role === 'patient' ? 'Crear cuenta' : 'Registrarme como profesional'}
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
            ¿Ya tienes cuenta?{' '}
            <RouterLink to="/login" style={{ color: C.green, fontWeight: 600, textDecoration: 'none' }}>
              Inicia sesión
            </RouterLink>
          </Text>
        </Box>
      </Flex>
    </Flex>
  )
}
