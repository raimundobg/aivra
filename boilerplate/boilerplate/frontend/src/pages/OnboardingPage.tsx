import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../providers/AuthProvider'
import { generarPauta, evaluarRedFlags } from '../services/groq'
import {
  Box, Button, Container, Flex, Input, Text, Stack,
  Grid, Badge, Field, Separator,
} from '@chakra-ui/react'
import { MedicineSelector } from '../molecules/MedicineSelector'
import { MultiSelectDropdown } from '../molecules/MultiSelectDropdown'
import { MealPicker } from '../molecules/MealPicker'
import { COMMON_SUPPLEMENTS, COMMON_SURGERIES, COMMON_ALLERGIES, COMMON_FAMILY_HISTORY, COMMON_OTHER_DIAGNOSES } from '../data/commonLists'
import type { IntakeData, AlimentoSeleccionado } from '../types/nutrition'

// ─── Types ───────────────────────────────────────────────────────────────────

const empty: IntakeData = {
  nombre: '', fechaNacimiento: '', sexo: '', rut: '', ocupacion: '', telefono: '',
  peso: '', talla: '',
  diagnosticos: [], diagnosticosOtros: [], medicamentos: [], suplementos: [], cirugias: [], antecedenteFamiliar: [],
  restricciones: [], alergias: [],
  horasSueno: '', calidadSueno: '', nivelEstres: '', actividadFisicas: [], frecuenciaActividad: '', litrosAgua: '',
  sintomasGI: [], bristolScale: '',
  desayuno: [], colacion_am: [], almuerzo: [], colacion_pm: [], cena: [],
  efc: {},
  objetivos: [], compromiso: '',
}

// ─── Step indicator ──────────────────────────────────────────────────────────

const STEPS = [
  'Datos personales',
  'Historial médico',
  'Restricciones',
  'Hábitos',
  'Digestión',
  'Recuerdo 24h',
  'Objetivos',
]

function ProgressBar({ step }: { step: number }) {
  const pct = Math.round(((step + 1) / STEPS.length) * 100)
  return (
    <Box mb={8}>
      <Flex justify="space-between" align="center" mb={2}>
        <Text fontSize="xs" color="fg.muted" fontWeight="500">Paso {step + 1} de {STEPS.length}</Text>
        <Text fontSize="xs" color="brand.solid" fontWeight="600">{pct}% completado</Text>
      </Flex>
      <Box h={2} bg="bg.muted" borderRadius="full" overflow="hidden">
        <Box h="full" bg="brand.solid" borderRadius="full" w={`${pct}%`} transition="width 0.4s ease" />
      </Box>
      <Text mt={3} fontFamily="heading" fontWeight="700" fontSize="lg" color="gray.800">
        {STEPS[step]}
      </Text>
    </Box>
  )
}

// ─── Reusable helpers ─────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <Text fontSize="sm" fontWeight="500" color="gray.700" mb={1}>{children}</Text>
}

function ScaleSelector({ value, onChange, min = 1, max = 10 }: {
  value: string; onChange: (v: string) => void; min?: number; max?: number
}) {
  return (
    <Flex gap={2} flexWrap="wrap">
      {Array.from({ length: max - min + 1 }, (_, i) => String(i + min)).map(n => (
        <Box
          key={n} w={10} h={10} borderRadius="lg"
          bg={value === n ? 'brand.solid' : 'bg.muted'}
          color={value === n ? 'white' : 'gray.600'}
          display="flex" alignItems="center" justifyContent="center"
          cursor="pointer" fontWeight="600" fontSize="sm"
          onClick={() => onChange(n)} transition="all 0.15s"
          borderWidth="1px" borderColor={value === n ? 'brand.solid' : 'gray.200'}
          _hover={{ borderColor: 'brand.solid' }}
        >{n}</Box>
      ))}
    </Flex>
  )
}

function ToggleChip({ label, selected, onClick }: {
  label: string; selected: boolean; onClick: () => void
}) {
  return (
    <Box
      px={4} py={2} borderRadius="full" cursor="pointer" fontSize="sm" fontWeight="500"
      borderWidth="1px"
      bg={selected ? 'brand.solid' : 'white'}
      color={selected ? 'white' : 'gray.600'}
      borderColor={selected ? 'brand.solid' : 'gray.200'}
      onClick={onClick} transition="all 0.15s"
      _hover={{ borderColor: 'brand.solid' }}
      userSelect="none"
    >
      {selected ? '✓ ' : ''}{label}
    </Box>
  )
}

// ─── Steps ───────────────────────────────────────────────────────────────────

function Step1({ data, set }: { data: IntakeData; set: (k: keyof IntakeData, v: string) => void }) {
  return (
    <Stack gap={5}>
      <Grid templateColumns={{ base: '1fr', sm: '1fr 1fr' }} gap={4}>
        <Field.Root>
          <Label>Nombre completo</Label>
          <Input value={data.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Tu nombre completo" borderRadius="xl" size="lg" />
        </Field.Root>
        <Field.Root>
          <Label>RUT</Label>
          <Input value={data.rut} onChange={e => set('rut', e.target.value)} placeholder="12.345.678-9" borderRadius="xl" size="lg" />
        </Field.Root>
      </Grid>
      <Grid templateColumns={{ base: '1fr', sm: '1fr 1fr' }} gap={4}>
        <Field.Root>
          <Label>Fecha de nacimiento</Label>
          <Input type="date" value={data.fechaNacimiento} onChange={e => set('fechaNacimiento', e.target.value)} borderRadius="xl" size="lg" />
        </Field.Root>
        <Field.Root>
          <Label>Sexo biológico</Label>
          <Flex gap={3} mt={1}>
            {['Femenino', 'Masculino', 'Otro'].map(s => (
              <ToggleChip key={s} label={s} selected={data.sexo === s} onClick={() => set('sexo', s)} />
            ))}
          </Flex>
        </Field.Root>
      </Grid>
      <Grid templateColumns="1fr 1fr" gap={4}>
        <Field.Root>
          <Label>Peso actual (kg)</Label>
          <Input
            value={data.peso} onChange={e => set('peso', e.target.value)}
            placeholder="Ej: 68" type="number" borderRadius="xl" size="lg"
          />
        </Field.Root>
        <Field.Root>
          <Label>Talla (cm)</Label>
          <Input
            value={data.talla} onChange={e => set('talla', e.target.value)}
            placeholder="Ej: 165" type="number" borderRadius="xl" size="lg"
          />
        </Field.Root>
      </Grid>
      <Grid templateColumns={{ base: '1fr', sm: '1fr 1fr' }} gap={4}>
        <Field.Root>
          <Label>Ocupación</Label>
          <Input value={data.ocupacion} onChange={e => set('ocupacion', e.target.value)} placeholder="Ej: Estudiante, Oficina, etc." borderRadius="xl" size="lg" />
        </Field.Root>
        <Field.Root>
          <Label>Teléfono</Label>
          <Input value={data.telefono} onChange={e => set('telefono', e.target.value)} placeholder="+56 9 XXXX XXXX" borderRadius="xl" size="lg" />
        </Field.Root>
      </Grid>
    </Stack>
  )
}

const DIAGNOSTICOS_COMUNES = [
  'Hipertensión arterial', 'Diabetes tipo 2', 'Resistencia a la insulina',
  'Hipotiroidismo', 'Hipertiroidismo', 'Dislipidemia',
  'SOP', 'Colon irritable (SII)', 'Gastritis', 'Reflujo (ERGE)',
  'Enfermedad celíaca', 'Intolerancia a la lactosa', 'Anemia',
  'Depresión / Ansiedad', 'Artritis reumatoide', 'Ninguno',
]

function Step2({ data, toggle, setArray }: {
  data: IntakeData
  toggle: (k: ArrayKey, v: string) => void
  setArray: (k: ArrayKey, v: string[]) => void
}) {
  return (
    <Stack gap={5}>
      <Box>
        <Label>Diagnósticos médicos actuales</Label>
        <Text fontSize="xs" color="gray.400" mb={3}>Selecciona todos los que apliquen</Text>
        <Flex gap={2} flexWrap="wrap" mb={3}>
          {DIAGNOSTICOS_COMUNES.map(d => (
            <ToggleChip
              key={d} label={d}
              selected={data.diagnosticos.includes(d)}
              onClick={() => {
                if (d === 'Ninguno') {
                  if (data.diagnosticos.includes('Ninguno')) toggle('diagnosticos', 'Ninguno')
                  else {
                    data.diagnosticos.filter(x => x !== 'Ninguno').forEach(x => toggle('diagnosticos', x))
                    toggle('diagnosticos', 'Ninguno')
                  }
                } else {
                  if (data.diagnosticos.includes('Ninguno')) toggle('diagnosticos', 'Ninguno')
                  toggle('diagnosticos', d)
                }
              }}
            />
          ))}
        </Flex>
      </Box>

      <Field.Root>
        <Label>Otros diagnósticos no listados arriba</Label>
        <MultiSelectDropdown
          value={data.diagnosticosOtros}
          onChange={v => setArray('diagnosticosOtros', v)}
          options={COMMON_OTHER_DIAGNOSES}
          allowCustom
          placeholder="Busca u otro diagnóstico..."
        />
      </Field.Root>

      <Field.Root>
        <Label>Medicamentos actuales</Label>
        <Text fontSize="xs" color="gray.400" mb={2}>Las sugerencias aparecerán según tus diagnósticos</Text>
        <MedicineSelector
          value={data.medicamentos}
          onChange={v => setArray('medicamentos', v)}
          diagnoses={data.diagnosticos}
        />
      </Field.Root>

      <Field.Root>
        <Label>Suplementos que tomas</Label>
        <MultiSelectDropdown
          value={data.suplementos}
          onChange={v => setArray('suplementos', v)}
          options={COMMON_SUPPLEMENTS}
          allowCustom
          placeholder="Busca suplementos..."
        />
      </Field.Root>

      <Field.Root>
        <Label>Cirugías previas</Label>
        <MultiSelectDropdown
          value={data.cirugias}
          onChange={v => setArray('cirugias', v)}
          options={COMMON_SURGERIES}
          allowCustom
          placeholder="Busca o selecciona cirugías..."
        />
      </Field.Root>

      <Field.Root>
        <Label>Antecedentes familiares</Label>
        <Text fontSize="xs" color="gray.400" mb={2}>¿Hay enfermedades en tu familia?</Text>
        <MultiSelectDropdown
          value={data.antecedenteFamiliar}
          onChange={v => setArray('antecedenteFamiliar', v)}
          options={COMMON_FAMILY_HISTORY}
          allowCustom
          placeholder="Busca antecedentes..."
        />
      </Field.Root>
    </Stack>
  )
}

const RESTRICCIONES = [
  'Vegano', 'Vegetariano', 'Sin lactosa', 'Sin gluten',
  'Sin mariscos', 'Sin huevo', 'Sin frutos secos', 'Sin soya', 'Sin pescado',
]

function Step3({ data, toggle, setArray }: {
  data: IntakeData
  toggle: (k: ArrayKey, v: string) => void
  setArray: (k: ArrayKey, v: string[]) => void
}) {
  return (
    <Stack gap={6}>
      <Box>
        <Label>Restricciones y preferencias alimentarias</Label>
        <Text fontSize="xs" color="gray.400" mb={3}>Selecciona todas las que apliquen</Text>
        <Flex gap={2} flexWrap="wrap">
          {RESTRICCIONES.map(r => (
            <ToggleChip key={r} label={r} selected={data.restricciones.includes(r)} onClick={() => toggle('restricciones', r)} />
          ))}
        </Flex>
      </Box>
      <Separator />
      <Field.Root>
        <Label>Alergias alimentarias</Label>
        <MultiSelectDropdown
          value={data.alergias}
          onChange={v => setArray('alergias', v)}
          options={COMMON_ALLERGIES}
          allowCustom
          placeholder="Busca tus alergias..."
          label="Selecciona las alergias que tienes"
        />
      </Field.Root>
    </Stack>
  )
}

const ACTIVIDADES = ['Sedentario', 'Caminata', 'Ciclismo', 'Gym / Pesas', 'Running', 'Yoga / Pilates', 'Natación', 'Deportes de equipo', 'Artes marciales', 'Otro']

function Step4({ data, toggle, set }: {
  data: IntakeData
  toggle: (k: ArrayKey, v: string) => void
  set: (k: keyof IntakeData, v: string) => void
}) {
  return (
    <Stack gap={6}>
      <Box>
        <Label>Horas de sueño promedio por noche</Label>
        <ScaleSelector value={data.horasSueno} onChange={v => set('horasSueno', v)} min={4} max={12} />
      </Box>
      <Box>
        <Label>Calidad del sueño (1 = muy malo, 10 = excelente)</Label>
        <ScaleSelector value={data.calidadSueno} onChange={v => set('calidadSueno', v)} />
      </Box>
      <Box>
        <Label>Nivel de estrés actual (1 = sin estrés, 10 = muy estresado)</Label>
        <ScaleSelector value={data.nivelEstres} onChange={v => set('nivelEstres', v)} />
      </Box>
      <Separator />
      <Box>
        <Label>Tipo de actividad física</Label>
        <Text fontSize="xs" color="gray.400" mb={2}>Puedes seleccionar más de una</Text>
        <Flex gap={2} flexWrap="wrap" mt={1}>
          {ACTIVIDADES.map(a => (
            <ToggleChip key={a} label={a} selected={data.actividadFisicas.includes(a)} onClick={() => toggle('actividadFisicas', a)} />
          ))}
        </Flex>
      </Box>
      <Box>
        <Label>Frecuencia de actividad física</Label>
        <Flex gap={2} flexWrap="wrap" mt={1}>
          {['Nunca', '1-2 veces/sem', '3-4 veces/sem', '5+ veces/sem', 'Todos los días'].map(f => (
            <ToggleChip key={f} label={f} selected={data.frecuenciaActividad === f} onClick={() => set('frecuenciaActividad', f)} />
          ))}
        </Flex>
      </Box>
      <Box>
        <Label>Litros de agua al día</Label>
        <Flex gap={2} flexWrap="wrap" mt={1}>
          {['< 1L', '1-1.5L', '1.5-2L', '2-2.5L', '> 2.5L'].map(l => (
            <ToggleChip key={l} label={l} selected={data.litrosAgua === l} onClick={() => set('litrosAgua', l)} />
          ))}
        </Flex>
      </Box>
    </Stack>
  )
}

const SINTOMAS = [
  'Distensión abdominal', 'Gases frecuentes', 'Estreñimiento', 'Diarrea',
  'Reflujo / acidez', 'Náuseas', 'Dolor abdominal', 'Ninguno',
]

const BRISTOL = [
  { n: '1', emoji: '🪨', label: 'Trozos duros y separados (como nueces)', tag: 'Estreñimiento severo' },
  { n: '2', emoji: '🌑', label: 'Con forma pero grumoso y difícil de expulsar', tag: 'Estreñimiento leve' },
  { n: '3', emoji: '🌭', label: 'Con grietas en la superficie', tag: 'Normal (algo seco)' },
  { n: '4', emoji: '🍌', label: 'Suave, liso, fácil de expulsar', tag: '✓ Ideal' },
  { n: '5', emoji: '🫐', label: 'Blando con bordes bien definidos', tag: 'Falta fibra' },
  { n: '6', emoji: '💧', label: 'Esponjoso, con bordes irregulares', tag: 'Diarrea leve' },
  { n: '7', emoji: '🌊', label: 'Completamente líquido, sin partes sólidas', tag: 'Diarrea severa' },
]

function Step5({ data, toggle, set }: {
  data: IntakeData
  toggle: (k: ArrayKey, v: string) => void
  set: (k: keyof IntakeData, v: string) => void
}) {
  return (
    <Stack gap={6}>
      <Box>
        <Label>Síntomas gastrointestinales frecuentes</Label>
        <Flex gap={2} flexWrap="wrap" mt={2}>
          {SINTOMAS.map(s => (
            <ToggleChip key={s} label={s} selected={data.sintomasGI.includes(s)} onClick={() => toggle('sintomasGI', s)} />
          ))}
        </Flex>
      </Box>
      <Separator />
      <Box>
        <Box p={3} borderRadius="xl" bg="blue.50" borderWidth="1px" borderColor="blue.100" mb={4}>
          <Text fontSize="xs" fontWeight="600" color="blue.700" mb={1}>¿Qué es la Escala de Bristol?</Text>
          <Text fontSize="xs" color="blue.600">
            Es una herramienta médica que clasifica las heces en 7 tipos según su forma y consistencia.
            Nos ayuda a entender tu función digestiva y personalizar tu pauta. El tipo 3-4 es lo ideal.
          </Text>
        </Box>
        <Label>¿Cómo es tu evacuación habitual?</Label>
        <Stack gap={2}>
          {BRISTOL.map(b => (
            <Box
              key={b.n} px={4} py={3} borderRadius="xl" borderWidth="1px"
              borderColor={data.bristolScale === b.n ? 'brand.solid' : 'gray.200'}
              bg={data.bristolScale === b.n ? 'brand.muted' : 'white'}
              cursor="pointer" onClick={() => set('bristolScale', b.n)} transition="all 0.15s"
            >
              <Flex align="center" gap={3}>
                <Text fontSize="lg" w={6}>{b.emoji}</Text>
                <Box flex={1}>
                  <Flex align="center" gap={2} mb={0.5}>
                    <Badge
                      bg={data.bristolScale === b.n ? 'brand.solid' : 'gray.100'}
                      color={data.bristolScale === b.n ? 'white' : 'gray.600'}
                      borderRadius="full" px={2} py={0.5} fontSize="xs" fontWeight="700"
                    >Tipo {b.n}</Badge>
                    <Text fontSize="xs" color={b.n === '4' ? 'green.600' : 'gray.400'} fontWeight={b.n === '4' ? '600' : '400'}>{b.tag}</Text>
                  </Flex>
                  <Text fontSize="sm" color="gray.700">{b.label}</Text>
                </Box>
              </Flex>
            </Box>
          ))}
        </Stack>
      </Box>
    </Stack>
  )
}


const EFC_GROUPS = [
  'Frutas',
  'Verduras y ensaladas',
  'Legumbres',
  'Arroz/fideos/pan integral',
  'Carnes rojas',
  'Pollo/pavo',
  'Pescado/mariscos',
  'Huevo',
  'Lácteos',
  'Comida rápida/ultraprocesados',
  'Bebidas azucaradas',
]

const EFC_FREQUENCIES = ['Nunca', '1-3x/mes', '1-2x/sem', '3-5x/sem', 'Diario']

function Step6({ data, setArray, setData }: {
  data: IntakeData
  setArray: (k: ArrayKey, v: AlimentoSeleccionado[]) => void
  setData: React.Dispatch<React.SetStateAction<IntakeData>>
}) {
  return (
    <Stack gap={6}>
      <Box p={4} borderRadius="xl" bg="brand.muted" borderWidth="1px" borderColor="brand.200">
        <Text fontSize="sm" color="brand.solid" fontWeight="500">
          📅 Selecciona qué comiste <strong>ayer</strong> — esto nos ayuda a personalizar tu pauta
        </Text>
        <Text fontSize="xs" color="brand.solid" mt={2} opacity={0.8}>
          Busca en la base de datos de alimentos. Los kcal se calculan automáticamente.
        </Text>
      </Box>

      <MealPicker
        mealName="Desayuno"
        emoji="☀️"
        value={data.desayuno}
        onChange={v => setArray('desayuno', v)}
        placeholder="Busca alimentos del desayuno..."
      />
      <MealPicker
        mealName="Colación mañana"
        emoji="🍎"
        value={data.colacion_am}
        onChange={v => setArray('colacion_am', v)}
        placeholder="Busca (opcional)..."
      />
      <MealPicker
        mealName="Almuerzo"
        emoji="🍽️"
        value={data.almuerzo}
        onChange={v => setArray('almuerzo', v)}
        placeholder="Busca alimentos del almuerzo..."
      />
      <MealPicker
        mealName="Colación tarde"
        emoji="🥑"
        value={data.colacion_pm}
        onChange={v => setArray('colacion_pm', v)}
        placeholder="Busca (opcional)..."
      />
      <MealPicker
        mealName="Cena"
        emoji="🌙"
        value={data.cena}
        onChange={v => setArray('cena', v)}
        placeholder="Busca alimentos de la cena..."
      />

      <Separator />

      <Box>
        <Text fontSize="sm" fontWeight="700" color="gray.800" mb={1}>Frecuencia de consumo habitual</Text>
        <Text fontSize="xs" color="gray.400" mb={4}>¿Con qué frecuencia consumes estos grupos?</Text>
        <Stack gap={3}>
          {EFC_GROUPS.map(group => (
            <Box key={group}>
              <Text fontSize="xs" fontWeight="600" color="gray.700" mb={2}>{group}</Text>
              <Flex gap={2} flexWrap="wrap">
                {EFC_FREQUENCIES.map(freq => {
                  const selected = data.efc[group] === freq
                  return (
                    <Box
                      key={freq}
                      px={3} py={1.5} borderRadius="full" cursor="pointer" fontSize="xs" fontWeight="500"
                      borderWidth="1px"
                      bg={selected ? 'brand.solid' : 'white'}
                      color={selected ? 'white' : 'gray.600'}
                      borderColor={selected ? 'brand.solid' : 'gray.200'}
                      onClick={() => setData(prev => ({ ...prev, efc: { ...prev.efc, [group]: freq } }))}
                      transition="all 0.15s"
                      _hover={{ borderColor: 'brand.solid' }}
                      userSelect="none"
                    >
                      {freq}
                    </Box>
                  )
                })}
              </Flex>
            </Box>
          ))}
        </Stack>
      </Box>
    </Stack>
  )
}

const OBJETIVOS = [
  { v: 'perder_peso', label: '⬇️ Bajar de peso', desc: 'Reducir grasa corporal y mejorar composición' },
  { v: 'ganar_masa', label: '💪 Ganar masa muscular', desc: 'Aumentar músculo con nutrición estratégica' },
  { v: 'mantener', label: '⚖️ Mantener peso', desc: 'Mejorar hábitos sin cambiar peso' },
  { v: 'rendimiento', label: '🏃 Rendimiento deportivo', desc: 'Optimizar energía y recuperación' },
  { v: 'salud', label: '❤️ Mejorar salud general', desc: 'Controlar condiciones médicas o mejorar bienestar' },
]

function Step7({ data, toggle, set }: {
  data: IntakeData
  toggle: (k: ArrayKey, v: string) => void
  set: (k: keyof IntakeData, v: string) => void
}) {
  return (
    <Stack gap={6}>
      <Box>
        <Label>¿Cuáles son tus objetivos?</Label>
        <Text fontSize="xs" color="gray.400" mb={3}>Puedes seleccionar más de uno</Text>
        <Stack gap={3}>
          {OBJETIVOS.map(o => {
            const selected = data.objetivos.includes(o.v)
            return (
              <Box
                key={o.v} p={4} borderRadius="xl" borderWidth="1px"
                borderColor={selected ? 'brand.solid' : 'gray.200'}
                bg={selected ? 'brand.muted' : 'white'}
                cursor="pointer" onClick={() => toggle('objetivos', o.v)} transition="all 0.15s"
              >
                <Flex align="center" gap={3}>
                  <Box flex={1}>
                    <Text fontWeight="600" fontSize="sm" color={selected ? 'brand.solid' : 'gray.800'}>{o.label}</Text>
                    <Text fontSize="xs" color="gray.500" mt={0.5}>{o.desc}</Text>
                  </Box>
                  {selected && (
                    <Box w={5} h={5} borderRadius="full" bg="brand.solid" display="flex" alignItems="center" justifyContent="center">
                      <Text fontSize="xs" color="white" fontWeight="bold">✓</Text>
                    </Box>
                  )}
                </Flex>
              </Box>
            )
          })}
        </Stack>
      </Box>

      <Box>
        <Label>Nivel de compromiso</Label>
        <Flex gap={2} flexWrap="wrap" mt={1}>
          {['Explorando', 'Moderado', 'Comprometido', 'Muy comprometido'].map(c => (
            <ToggleChip key={c} label={c} selected={data.compromiso === c} onClick={() => set('compromiso', c)} />
          ))}
        </Flex>
      </Box>
    </Stack>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type ArrayKey = 'restricciones' | 'sintomasGI' | 'actividadFisicas' | 'objetivos' | 'diagnosticos' | 'diagnosticosOtros' | 'medicamentos' | 'suplementos' | 'cirugias' | 'antecedenteFamiliar' | 'alergias' | 'desayuno' | 'colacion_am' | 'almuerzo' | 'colacion_pm' | 'cena'

export default function OnboardingPage() {
  const { user, markOnboardingDone } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [data, setData] = useState<IntakeData>(empty)
  const [saving, setSaving] = useState(false)
  const [savingMsg, setSavingMsg] = useState('')

  // Load partial on mount — pre-fill from intake/form or fallback to user profile
  useEffect(() => {
    if (!user) return
    const arrayKeys: ArrayKey[] = [
      'diagnosticos', 'diagnosticosOtros', 'medicamentos', 'suplementos', 'cirugias',
      'antecedenteFamiliar', 'restricciones', 'alergias', 'actividadFisicas', 'sintomasGI',
      'desayuno', 'colacion_am', 'almuerzo', 'colacion_pm', 'cena', 'objetivos',
    ]
    Promise.all([
      getDoc(doc(db, 'users', user.uid, 'intake', 'form')),
      getDoc(doc(db, 'users', user.uid)),
    ]).then(([intakeSnap, profileSnap]) => {
      const profile = profileSnap.data() ?? {}
      const prefill: Partial<IntakeData> = {
        nombre: profile.displayName ?? user.displayName ?? '',
        peso: profile.peso ? String(profile.peso) : '',
        talla: profile.talla ? String(profile.talla) : '',
      }
      if (intakeSnap.exists()) {
        const saved = intakeSnap.data() as Partial<IntakeData> & { lastStep?: number }
        const lastStep = saved.lastStep ?? 0
        if (lastStep < STEPS.length - 1) {
          const sanitized: Partial<IntakeData> = { ...saved }
          for (const k of arrayKeys) {
            const v = (sanitized as Record<string, unknown>)[k]
            if (!Array.isArray(v)) (sanitized as Record<string, unknown>)[k] = []
          }
          setData({ ...empty, ...prefill, ...sanitized, efc: saved.efc ?? {} })
          setStep(lastStep)
        }
      } else {
        setData(prev => ({ ...prev, ...prefill }))
      }
    }).catch(() => { /* silent */ })
  }, [user])

  function set(k: keyof IntakeData, v: string) {
    setData(prev => ({ ...prev, [k]: v }))
  }

  function toggle(k: ArrayKey, v: string) {
    setData(prev => {
      const arr = prev[k] as string[]
      if (!Array.isArray(arr)) return prev
      return { ...prev, [k]: arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v] }
    })
  }

  function setArray(k: ArrayKey, v: string[] | AlimentoSeleccionado[]) {
    setData(prev => ({ ...prev, [k]: v }))
  }

  async function savePartial() {
    if (!user) return
    try {
      await setDoc(doc(db, 'users', user.uid, 'intake', 'form'), {
        ...data,
        lastStep: step,
        updatedAt: serverTimestamp(),
      }, { merge: true })
    } catch { /* silent */ }
  }

  async function finish() {
    if (!user) return
    setSaving(true)
    try {
      setSavingMsg('Guardando tu información...')
      await setDoc(doc(db, 'users', user.uid, 'intake', 'form'), {
        ...data,
        completedAt: serverTimestamp(),
      }, { merge: true })

      // Red flags check — block automated plan if critico
      const redFlags = evaluarRedFlags(data)
      await setDoc(doc(db, 'users', user.uid), {
        onboardingCompleted: true,
        detailedProfileCompleted: true,
        redFlagsNivel: redFlags.nivel,
        redFlags: redFlags.flags,
      }, { merge: true })

      if (redFlags.nivel === 'critico') {
        setSavingMsg('⚠️ Detectamos situaciones que requieren atención profesional. Te recomendamos el Plan Full con nutricionista.')
        await new Promise(r => setTimeout(r, 3000))
        markOnboardingDone()
        navigate('/dashboard')
        return
      }

      setSavingMsg('Generando tu pauta nutricional con IA...')
      const pauta = await generarPauta(data)
      await setDoc(doc(db, 'users', user.uid, 'pauta', 'current'), {
        ...pauta,
        generadoPor: 'ia',
        generadoAt: serverTimestamp(),
      })

      markOnboardingDone()
      navigate('/dashboard')
    } catch (e) {
      console.error(e)
      setSavingMsg('Error generando la pauta. Inténtalo de nuevo.')
      setSaving(false)
    }
  }

  const stepProps = { data, set, toggle, setArray }

  return (
    <Box minH="100dvh" bg="bg.canvas" py={{ base: 8, md: 12 }}>
      <Container maxW="600px">
        <Flex align="center" gap={3} mb={10}>
          <Box w={8} h={8} bg="brand.solid" borderRadius="lg" display="flex" alignItems="center" justifyContent="center">
            <Text color="white" fontWeight="800" fontSize="sm" fontFamily="heading">A</Text>
          </Box>
          <Text fontFamily="heading" fontWeight="700" color="gray.800">Aivra</Text>
        </Flex>

        <Box bg="bg.surface" borderRadius="2xl" p={{ base: 6, md: 8 }} shadow="sm" borderWidth="1px" borderColor="border.subtle">
          <ProgressBar step={step} />

          {step === 0 && <Step1 {...stepProps} />}
          {step === 1 && <Step2 {...stepProps} setArray={setArray} />}
          {step === 2 && <Step3 {...stepProps} setArray={setArray} />}
          {step === 3 && <Step4 {...stepProps} />}
          {step === 4 && <Step5 {...stepProps} />}
          {step === 5 && <Step6 data={data} setArray={setArray} setData={setData} />}
          {step === 6 && <Step7 {...stepProps} />}

          <Flex mt={8} gap={3} justify="space-between">
            <Button
              variant="ghost" borderRadius="xl"
              onClick={() => setStep(s => s - 1)}
              visibility={step === 0 ? 'hidden' : 'visible'}
            >
              ← Anterior
            </Button>

            {step < STEPS.length - 1 ? (
              <Button
                bg="brand.solid" color="white" borderRadius="xl" px={8}
                _hover={{ opacity: 0.9 }}
                onClick={async () => { await savePartial(); setStep(s => s + 1) }}
              >
                Continuar →
              </Button>
            ) : (
              <Button
                bg="brand.solid" color="white" borderRadius="xl" px={8}
                _hover={{ opacity: 0.9 }} loading={saving}
                loadingText={savingMsg || 'Procesando...'}
                onClick={finish}
              >
                Finalizar ✓
              </Button>
            )}
          </Flex>
        </Box>

        <Text textAlign="center" mt={4} fontSize="xs" color="fg.subtle">
          Puedes actualizar esta información en cualquier momento desde tu perfil
        </Text>
      </Container>
    </Box>
  )
}
