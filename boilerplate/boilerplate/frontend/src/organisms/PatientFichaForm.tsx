import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import {
  Box, Button, Flex, Grid, Input, Stack, Text, Textarea,
} from '@chakra-ui/react'
import type { Timestamp, FieldValue } from 'firebase/firestore'
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../config/firebase'
import { FieldRow } from '../molecules/FieldRow'
import { ChipGroup } from '../molecules/Chip'
import { RedFlagsAlert } from '../molecules/RedFlagsAlert'
import { evaluarRedFlags } from '../services/groq'
import { calcGET } from '../services/nutritionCalculations'
import { mealToString, medicamentsToString } from '../types/nutrition'

const C = { green: '#5F6F52', greenLight: '#eef2ea', border: 'rgba(95,111,82,0.15)', muted: '#7a7264', text: '#2D3319', cream: '#F9F4EF' }

// ── Shared sub-components ──────────────────────────────────────────────────

function SectionCard({ title, icon, children, editing, onEdit, onSave, saving }: {
  title: string; icon: string; children: ReactNode
  editing?: boolean; onEdit?: () => void; onSave?: () => void; saving?: boolean
}) {
  return (
    <Box bg="white" borderRadius="2xl" p={5} borderWidth="1px" borderColor={C.border}>
      <Flex align="center" justify="space-between" mb={4}>
        <Flex align="center" gap={2}>
          <Text fontSize="lg">{icon}</Text>
          <Text fontFamily="heading" fontWeight="700" color={C.text} fontSize="sm">{title}</Text>
        </Flex>
        {onEdit && !editing && (
          <Button size="xs" variant="outline" borderColor={C.border} color={C.green}
            borderRadius="full" onClick={onEdit} fontSize="xs">
            Editar
          </Button>
        )}
        {onSave && editing && (
          <Flex gap={2}>
            <Button size="xs" variant="ghost" color={C.muted} onClick={onEdit} fontSize="xs">Cancelar</Button>
            <Button size="xs" bg={C.green} color="white" borderRadius="full"
              onClick={onSave} loading={saving} fontSize="xs">
              Guardar
            </Button>
          </Flex>
        )}
      </Flex>
      {children}
    </Box>
  )
}

function FormGrid({ children }: { children: ReactNode }) {
  return <Grid templateColumns={{ base: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }} gap={3}>{children}</Grid>
}

function LabeledInput({ label, value, onChange, type = 'text', unit }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; unit?: string
}) {
  return (
    <Box>
      <Text fontSize="xs" color={C.muted} mb={1} fontWeight="500">{label}{unit && ` (${unit})`}</Text>
      <Input
        size="sm" value={value} type={type}
        onChange={e => onChange(e.target.value)}
        borderColor={C.border} borderRadius="xl"
        _focus={{ borderColor: C.green, boxShadow: 'none' }}
        bg="white"
      />
    </Box>
  )
}

// ── Clinical data types ───────────────────────────────────────────────────

export interface ClinicalFicha {
  // Antecedentes
  motivo?: string; pesoIdeal?: string; cirugias?: string; antFamiliar?: string
  quienCocina?: string; dondeAlmuerza?: string

  // Antropometría
  pliegues?: { bicipital?: string; tricipital?: string; subescapular?: string; suprailiac?: string; abdominal?: string; muslo?: string; pantorrilla?: string }
  perimetros?: { brazo?: string; brazoCont?: string; cintura?: string; cadera?: string; muslo?: string; pantorrilla?: string; muneca?: string }
  diametros?: { humero?: string; femur?: string; muneca?: string }
  // Auto-calculated (stored for reference)
  densidadCorporal?: string; porcGrasa?: string; masaGrasa?: string; masaMagra?: string; icc?: string; riesgoCV?: string

  // Bioquímica
  bioquimica?: {
    glucosa?: string; hba1c?: string; colTotal?: string; hdl?: string; ldl?: string; trigliceridos?: string
    hemoglobina?: string; hematocrito?: string; ferritina?: string; vitD?: string; vitB12?: string
    acidoUrico?: string; creatinina?: string; albumina?: string; tsh?: string; fechaExamen?: string
  }

  // Clínica
  paSistolica?: string; paDiastolica?: string; fc?: string
  signosClinicos?: { cabello?: string; unas?: string; piel?: string }
  reflujoCausa?: string; meteorismoCausa?: string; alergiaCausa?: string

  // Estilo de vida
  calidadSueno?: string; estresDesencadenantes?: string; estresManejo?: string
  tabaquismo?: string; cigarrillosDia?: string; drogas?: string

  // Diagnóstico nutricional
  diagnosticoNutricional?: string; objetivosSMART?: string; planDietario?: string; indicadoresClinica?: string
  metasCortoP?: string; metasMedianoP?: string; metasLargoP?: string; notasSeguimiento?: string

  // Próxima cita
  proximaCitaFecha?: string; proximaCitaHora?: string; proximaCitaNotas?: string

  updatedAt?: Timestamp | FieldValue
}

// ── Section 1: Datos Generales (read-only from intake, editable extra fields) ─

function SeccionDatosGenerales({ intake, clinical, onSave }: {
  intake: Record<string, unknown> | null
  clinical: ClinicalFicha
  onSave: (data: Partial<ClinicalFicha>) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ motivo: clinical.motivo ?? '', quienCocina: clinical.quienCocina ?? '', dondeAlmuerza: clinical.dondeAlmuerza ?? '' })

  async function save() {
    setSaving(true); await onSave(form); setSaving(false); setEditing(false)
  }

  const age = intake?.fechaNacimiento
    ? Math.floor((Date.now() - new Date(intake.fechaNacimiento as string).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null

  return (
    <SectionCard title="Antecedentes generales" icon="📋" editing={editing} onEdit={() => setEditing(!editing)} onSave={save} saving={saving}>
      {!editing ? (
        <Grid templateColumns={{ base: '1fr 1fr', md: '1fr 1fr 1fr' }} gap={3}>
          <FieldRow label="Sexo" value={intake?.sexo as string} />
          <FieldRow label="Edad" value={age ? `${age} años` : undefined} />
          <FieldRow label="Ocupación" value={intake?.ocupacion as string} />
          <FieldRow label="Motivo consulta" value={clinical.motivo} />
          <FieldRow label="Quién cocina" value={clinical.quienCocina} />
          <FieldRow label="Dónde almuerza" value={clinical.dondeAlmuerza} />
          <FieldRow label="Medicamentos" value={medicamentsToString(intake?.medicamentos as string[])} />
          <FieldRow label="Suplementos" value={(intake?.suplementos as string[] ?? []).join('; ') || undefined} />
          <FieldRow label="Cirugías previas" value={(intake?.cirugias as string[] ?? []).join('; ') || undefined} />
          <FieldRow label="Antecedentes familiares" value={(intake?.antecedenteFamiliar as string[] ?? []).join('; ') || undefined} />
          <FieldRow label="Alergias" value={(intake?.alergias as string[] ?? []).join('; ') || undefined} />
        </Grid>
      ) : (
        <Stack gap={3}>
          <Grid templateColumns={{ base: '1fr', sm: '1fr 1fr' }} gap={3}>
            <LabeledInput label="Motivo de consulta" value={form.motivo} onChange={v => setForm(f => ({ ...f, motivo: v }))} />
            <LabeledInput label="Quién cocina en casa" value={form.quienCocina} onChange={v => setForm(f => ({ ...f, quienCocina: v }))} />
            <LabeledInput label="Dónde almuerza habitualmente" value={form.dondeAlmuerza} onChange={v => setForm(f => ({ ...f, dondeAlmuerza: v }))} />
          </Grid>
          <Text fontSize="xs" color={C.muted}>Los datos del paciente (sexo, edad, medicamentos, etc.) se editan desde el onboarding.</Text>
        </Stack>
      )}
    </SectionCard>
  )
}

// ── Section 2: Evaluación Antropométrica ──────────────────────────────────

function calcDurninWomersley(pliegues: ClinicalFicha['pliegues'], sexo: string, age: number): number | null {
  if (!pliegues?.bicipital || !pliegues?.tricipital || !pliegues?.subescapular || !pliegues?.suprailiac) return null
  const bi = parseFloat(pliegues.bicipital), tri = parseFloat(pliegues.tricipital)
  const sub = parseFloat(pliegues.subescapular), sup = parseFloat(pliegues.suprailiac)
  if (isNaN(bi + tri + sub + sup)) return null
  const sum = bi + tri + sub + sup
  const logSum = Math.log10(sum)
  const isMale = sexo?.toLowerCase().includes('masc') || sexo?.toLowerCase() === 'm'
  let C1: number, C2: number
  if (isMale) {
    if (age < 17) { C1 = 1.1533; C2 = 0.0643 }
    else if (age < 20) { C1 = 1.1620; C2 = 0.0630 }
    else if (age < 30) { C1 = 1.1631; C2 = 0.0632 }
    else if (age < 40) { C1 = 1.1422; C2 = 0.0544 }
    else if (age < 50) { C1 = 1.1620; C2 = 0.0700 }
    else { C1 = 1.1715; C2 = 0.0779 }
  } else {
    if (age < 17) { C1 = 1.1369; C2 = 0.0598 }
    else if (age < 20) { C1 = 1.1549; C2 = 0.0678 }
    else if (age < 30) { C1 = 1.1599; C2 = 0.0717 }
    else if (age < 40) { C1 = 1.1423; C2 = 0.0632 }
    else if (age < 50) { C1 = 1.1333; C2 = 0.0612 }
    else { C1 = 1.1339; C2 = 0.0645 }
  }
  return C1 - C2 * logSum
}

function SeccionAntropometria({ intake, clinical, onSave }: {
  intake: Record<string, unknown> | null
  clinical: ClinicalFicha
  onSave: (data: Partial<ClinicalFicha>) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pliegues, setPliegues] = useState<NonNullable<ClinicalFicha['pliegues']>>(clinical.pliegues ?? {})
  const [perimetros, setPerimetros] = useState<NonNullable<ClinicalFicha['perimetros']>>(clinical.perimetros ?? {})
  const [diametros, setDiametros] = useState<NonNullable<ClinicalFicha['diametros']>>(clinical.diametros ?? {})

  const peso = parseFloat(intake?.peso as string ?? '')
  const talla = parseFloat(intake?.talla as string ?? '')
  const imc = (peso && talla) ? (peso / (talla * talla) * 10000).toFixed(1) : null
  const age = intake?.fechaNacimiento
    ? Math.floor((Date.now() - new Date(intake.fechaNacimiento as string).getTime()) / (365.25 * 24 * 3600 * 1000))
    : 30
  const sexo = (intake?.sexo as string) ?? ''

  const density = calcDurninWomersley(pliegues, sexo, age)
  const porcGrasa = density ? ((4.95 / density - 4.5) * 100).toFixed(1) : null
  const masaGrasa = (porcGrasa && peso) ? (peso * parseFloat(porcGrasa) / 100).toFixed(1) : null
  const masaMagra = (masaGrasa && peso) ? (peso - parseFloat(masaGrasa)).toFixed(1) : null
  const icc = (perimetros?.cintura && perimetros?.cadera)
    ? (parseFloat(perimetros.cintura) / parseFloat(perimetros.cadera)).toFixed(2) : null

  async function save() {
    setSaving(true)
    await onSave({
      pliegues, perimetros, diametros,
      densidadCorporal: density?.toFixed(4) ?? undefined,
      porcGrasa: porcGrasa ?? undefined,
      masaGrasa: masaGrasa ?? undefined,
      masaMagra: masaMagra ?? undefined,
      icc: icc ?? undefined,
    })
    setSaving(false); setEditing(false)
  }

  const pl = (k: keyof NonNullable<ClinicalFicha['pliegues']>) => (v: string) => setPliegues(p => ({ ...p, [k]: v }))
  const pe = (k: keyof NonNullable<ClinicalFicha['perimetros']>) => (v: string) => setPerimetros(p => ({ ...p, [k]: v }))
  const di = (k: keyof NonNullable<ClinicalFicha['diametros']>) => (v: string) => setDiametros(p => ({ ...p, [k]: v }))

  return (
    <SectionCard title="Evaluación antropométrica" icon="📏" editing={editing} onEdit={() => setEditing(!editing)} onSave={save} saving={saving}>
      {/* Always-visible calcs */}
      <Box bg={C.cream} borderRadius="xl" p={3} mb={4}>
        <Grid templateColumns="repeat(3, 1fr)" gap={3}>
          <FieldRow label="Peso" value={peso || undefined} unit="kg" />
          <FieldRow label="Talla" value={talla || undefined} unit="cm" />
          <FieldRow label="IMC" value={imc ?? undefined} />
          {porcGrasa && <FieldRow label="% Grasa" value={`${porcGrasa}%`} />}
          {masaGrasa && <FieldRow label="Masa grasa" value={masaGrasa} unit="kg" />}
          {masaMagra && <FieldRow label="Masa magra" value={masaMagra} unit="kg" />}
          {icc && <FieldRow label="ICC" value={icc} />}
        </Grid>
      </Box>

      {!editing ? (
        <Stack gap={4}>
          {clinical.pliegues && Object.values(clinical.pliegues).some(v => v) && (
            <Box>
              <Text fontSize="xs" color={C.muted} fontWeight="600" mb={2}>PLIEGUES (mm)</Text>
              <Grid templateColumns={{ base: '1fr 1fr', md: 'repeat(4, 1fr)' }} gap={2}>
                {Object.entries(clinical.pliegues).map(([k, v]) => (
                  <FieldRow key={k} label={k.charAt(0).toUpperCase() + k.slice(1)} value={v} unit="mm" />
                ))}
              </Grid>
            </Box>
          )}
          {clinical.perimetros && Object.values(clinical.perimetros).some(v => v) && (
            <Box>
              <Text fontSize="xs" color={C.muted} fontWeight="600" mb={2}>PERÍMETROS (cm)</Text>
              <Grid templateColumns={{ base: '1fr 1fr', md: 'repeat(4, 1fr)' }} gap={2}>
                {Object.entries(clinical.perimetros).map(([k, v]) => (
                  <FieldRow key={k} label={k.charAt(0).toUpperCase() + k.slice(1)} value={v} unit="cm" />
                ))}
              </Grid>
            </Box>
          )}
        </Stack>
      ) : (
        <Stack gap={5}>
          <Box>
            <Text fontSize="xs" color={C.muted} fontWeight="600" mb={2}>PLIEGUES CUTÁNEOS (mm)</Text>
            <FormGrid>
              <LabeledInput label="Bicipital" value={pliegues.bicipital ?? ''} onChange={pl('bicipital')} type="number" unit="mm" />
              <LabeledInput label="Tricipital" value={pliegues.tricipital ?? ''} onChange={pl('tricipital')} type="number" unit="mm" />
              <LabeledInput label="Subescapular" value={pliegues.subescapular ?? ''} onChange={pl('subescapular')} type="number" unit="mm" />
              <LabeledInput label="Suprailíaco" value={pliegues.suprailiac ?? ''} onChange={pl('suprailiac')} type="number" unit="mm" />
              <LabeledInput label="Abdominal" value={pliegues.abdominal ?? ''} onChange={pl('abdominal')} type="number" unit="mm" />
              <LabeledInput label="Muslo" value={pliegues.muslo ?? ''} onChange={pl('muslo')} type="number" unit="mm" />
              <LabeledInput label="Pantorrilla" value={pliegues.pantorrilla ?? ''} onChange={pl('pantorrilla')} type="number" unit="mm" />
            </FormGrid>
            {density && (
              <Box mt={2} p={2} bg={C.greenLight} borderRadius="lg">
                <Text fontSize="xs" color={C.green} fontWeight="600">
                  Densidad corporal: {density.toFixed(4)} | % Grasa: {porcGrasa}% | Masa grasa: {masaGrasa} kg | Masa magra: {masaMagra} kg
                </Text>
              </Box>
            )}
          </Box>

          <Box>
            <Text fontSize="xs" color={C.muted} fontWeight="600" mb={2}>PERÍMETROS (cm)</Text>
            <FormGrid>
              <LabeledInput label="Brazo relajado" value={perimetros.brazo ?? ''} onChange={pe('brazo')} type="number" unit="cm" />
              <LabeledInput label="Brazo contraído" value={perimetros.brazoCont ?? ''} onChange={pe('brazoCont')} type="number" unit="cm" />
              <LabeledInput label="Cintura" value={perimetros.cintura ?? ''} onChange={pe('cintura')} type="number" unit="cm" />
              <LabeledInput label="Cadera" value={perimetros.cadera ?? ''} onChange={pe('cadera')} type="number" unit="cm" />
              <LabeledInput label="Muslo" value={perimetros.muslo ?? ''} onChange={pe('muslo')} type="number" unit="cm" />
              <LabeledInput label="Pantorrilla" value={perimetros.pantorrilla ?? ''} onChange={pe('pantorrilla')} type="number" unit="cm" />
              <LabeledInput label="Muñeca" value={perimetros.muneca ?? ''} onChange={pe('muneca')} type="number" unit="cm" />
            </FormGrid>
            {icc && (
              <Box mt={2} p={2} bg={C.greenLight} borderRadius="lg">
                <Text fontSize="xs" color={C.green} fontWeight="600">ICC calculado: {icc}</Text>
              </Box>
            )}
          </Box>

          <Box>
            <Text fontSize="xs" color={C.muted} fontWeight="600" mb={2}>DIÁMETROS ÓSEOS (cm)</Text>
            <FormGrid>
              <LabeledInput label="Húmero" value={diametros.humero ?? ''} onChange={di('humero')} type="number" unit="cm" />
              <LabeledInput label="Fémur" value={diametros.femur ?? ''} onChange={di('femur')} type="number" unit="cm" />
              <LabeledInput label="Muñeca" value={diametros.muneca ?? ''} onChange={di('muneca')} type="number" unit="cm" />
            </FormGrid>
          </Box>
        </Stack>
      )}
    </SectionCard>
  )
}

// ── Section 3: Evaluación Bioquímica ─────────────────────────────────────

function SeccionBioquimica({ clinical, onSave }: {
  clinical: ClinicalFicha
  onSave: (data: Partial<ClinicalFicha>) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<NonNullable<ClinicalFicha['bioquimica']>>(clinical.bioquimica ?? {})
  const f = (k: keyof typeof form) => (v: string) => setForm(p => ({ ...p, [k]: v }))

  async function save() { setSaving(true); await onSave({ bioquimica: form }); setSaving(false); setEditing(false) }

  const bq = clinical.bioquimica ?? {}
  const hasData = Object.values(bq).some(v => v)

  return (
    <SectionCard title="Evaluación bioquímica" icon="🧪" editing={editing} onEdit={() => setEditing(!editing)} onSave={save} saving={saving}>
      {!editing ? (
        hasData ? (
          <Stack gap={3}>
            <Grid templateColumns={{ base: '1fr 1fr', md: 'repeat(3, 1fr)' }} gap={3}>
              <FieldRow label="Glucosa" value={bq.glucosa} unit="mg/dL" />
              <FieldRow label="HbA1c" value={bq.hba1c} unit="%" />
              <FieldRow label="Col. Total" value={bq.colTotal} unit="mg/dL" />
              <FieldRow label="HDL" value={bq.hdl} unit="mg/dL" />
              <FieldRow label="LDL" value={bq.ldl} unit="mg/dL" />
              <FieldRow label="Triglicéridos" value={bq.trigliceridos} unit="mg/dL" />
              <FieldRow label="Hemoglobina" value={bq.hemoglobina} unit="g/dL" />
              <FieldRow label="Hematocrito" value={bq.hematocrito} unit="%" />
              <FieldRow label="Ferritina" value={bq.ferritina} unit="ng/mL" />
              <FieldRow label="Vitamina D" value={bq.vitD} unit="ng/mL" />
              <FieldRow label="Vitamina B12" value={bq.vitB12} unit="pg/mL" />
              <FieldRow label="Ácido úrico" value={bq.acidoUrico} unit="mg/dL" />
              <FieldRow label="Creatinina" value={bq.creatinina} unit="mg/dL" />
              <FieldRow label="Albúmina" value={bq.albumina} unit="g/dL" />
              <FieldRow label="TSH" value={bq.tsh} unit="mUI/L" />
            </Grid>
            {bq.fechaExamen && <FieldRow label="Fecha del examen" value={bq.fechaExamen} />}
          </Stack>
        ) : (
          <Text fontSize="sm" color={C.muted}>Sin exámenes registrados. Haz click en Editar para ingresar resultados.</Text>
        )
      ) : (
        <Stack gap={4}>
          <Box>
            <Text fontSize="xs" color={C.muted} fontWeight="600" mb={2}>GLICEMIA Y PERFIL LIPÍDICO</Text>
            <FormGrid>
              <LabeledInput label="Glucosa" value={form.glucosa ?? ''} onChange={f('glucosa')} type="number" unit="mg/dL" />
              <LabeledInput label="HbA1c" value={form.hba1c ?? ''} onChange={f('hba1c')} type="number" unit="%" />
              <LabeledInput label="Col. Total" value={form.colTotal ?? ''} onChange={f('colTotal')} type="number" unit="mg/dL" />
              <LabeledInput label="HDL" value={form.hdl ?? ''} onChange={f('hdl')} type="number" unit="mg/dL" />
              <LabeledInput label="LDL" value={form.ldl ?? ''} onChange={f('ldl')} type="number" unit="mg/dL" />
              <LabeledInput label="Triglicéridos" value={form.trigliceridos ?? ''} onChange={f('trigliceridos')} type="number" unit="mg/dL" />
            </FormGrid>
          </Box>
          <Box>
            <Text fontSize="xs" color={C.muted} fontWeight="600" mb={2}>HEMATOLOGÍA Y MICRONUTRIENTES</Text>
            <FormGrid>
              <LabeledInput label="Hemoglobina" value={form.hemoglobina ?? ''} onChange={f('hemoglobina')} type="number" unit="g/dL" />
              <LabeledInput label="Hematocrito" value={form.hematocrito ?? ''} onChange={f('hematocrito')} type="number" unit="%" />
              <LabeledInput label="Ferritina" value={form.ferritina ?? ''} onChange={f('ferritina')} type="number" unit="ng/mL" />
              <LabeledInput label="Vitamina D" value={form.vitD ?? ''} onChange={f('vitD')} type="number" unit="ng/mL" />
              <LabeledInput label="Vitamina B12" value={form.vitB12 ?? ''} onChange={f('vitB12')} type="number" unit="pg/mL" />
              <LabeledInput label="Ácido úrico" value={form.acidoUrico ?? ''} onChange={f('acidoUrico')} type="number" unit="mg/dL" />
              <LabeledInput label="Creatinina" value={form.creatinina ?? ''} onChange={f('creatinina')} type="number" unit="mg/dL" />
              <LabeledInput label="Albúmina" value={form.albumina ?? ''} onChange={f('albumina')} type="number" unit="g/dL" />
              <LabeledInput label="TSH" value={form.tsh ?? ''} onChange={f('tsh')} type="number" unit="mUI/L" />
              <LabeledInput label="Fecha del examen" value={form.fechaExamen ?? ''} onChange={f('fechaExamen')} type="date" />
            </FormGrid>
          </Box>
        </Stack>
      )}
    </SectionCard>
  )
}

// ── Section 4: Evaluación Clínica ─────────────────────────────────────────

function SeccionClinica({ intake, clinical, onSave }: {
  intake: Record<string, unknown> | null
  clinical: ClinicalFicha
  onSave: (data: Partial<ClinicalFicha>) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    paSistolica: clinical.paSistolica ?? '',
    paDiastolica: clinical.paDiastolica ?? '',
    fc: clinical.fc ?? '',
    cabello: clinical.signosClinicos?.cabello ?? '',
    unas: clinical.signosClinicos?.unas ?? '',
    piel: clinical.signosClinicos?.piel ?? '',
    reflujoCausa: clinical.reflujoCausa ?? '',
    meteorismoCausa: clinical.meteorismoCausa ?? '',
    alergiaCausa: clinical.alergiaCausa ?? '',
  })
  const f = (k: keyof typeof form) => (v: string) => setForm(p => ({ ...p, [k]: v }))

  async function save() {
    setSaving(true)
    await onSave({
      paSistolica: form.paSistolica, paDiastolica: form.paDiastolica, fc: form.fc,
      signosClinicos: { cabello: form.cabello, unas: form.unas, piel: form.piel },
      reflujoCausa: form.reflujoCausa, meteorismoCausa: form.meteorismoCausa, alergiaCausa: form.alergiaCausa,
    })
    setSaving(false); setEditing(false)
  }

  const sintomasGI = intake?.sintomasGI as string[] ?? []

  return (
    <SectionCard title="Evaluación clínica" icon="🩺" editing={editing} onEdit={() => setEditing(!editing)} onSave={save} saving={saving}>
      {!editing ? (
        <Stack gap={4}>
          <Grid templateColumns={{ base: '1fr 1fr', md: 'repeat(3, 1fr)' }} gap={3}>
            <FieldRow label="PA Sistólica" value={clinical.paSistolica} unit="mmHg" />
            <FieldRow label="PA Diastólica" value={clinical.paDiastolica} unit="mmHg" />
            <FieldRow label="FC" value={clinical.fc} unit="lpm" />
          </Grid>
          {clinical.signosClinicos && (
            <Grid templateColumns={{ base: '1fr 1fr', md: 'repeat(3, 1fr)' }} gap={3}>
              <FieldRow label="Cabello" value={clinical.signosClinicos.cabello} />
              <FieldRow label="Uñas" value={clinical.signosClinicos.unas} />
              <FieldRow label="Piel" value={clinical.signosClinicos.piel} />
            </Grid>
          )}
          {sintomasGI.length > 0 && (
            <Box>
              <Text fontSize="xs" color={C.muted} mb={2} fontWeight="500">Síntomas GI (reportados por paciente)</Text>
              <ChipGroup items={sintomasGI} variant="orange" />
            </Box>
          )}
          <FieldRow label="Bristol" value={intake?.bristolScale ? `Tipo ${intake.bristolScale}` : undefined} />
        </Stack>
      ) : (
        <Stack gap={4}>
          <Box>
            <Text fontSize="xs" color={C.muted} fontWeight="600" mb={2}>SIGNOS VITALES</Text>
            <FormGrid>
              <LabeledInput label="PA Sistólica" value={form.paSistolica} onChange={f('paSistolica')} type="number" unit="mmHg" />
              <LabeledInput label="PA Diastólica" value={form.paDiastolica} onChange={f('paDiastolica')} type="number" unit="mmHg" />
              <LabeledInput label="FC" value={form.fc} onChange={f('fc')} type="number" unit="lpm" />
            </FormGrid>
          </Box>
          <Box>
            <Text fontSize="xs" color={C.muted} fontWeight="600" mb={2}>SIGNOS CLÍNICOS</Text>
            <FormGrid>
              <LabeledInput label="Cabello" value={form.cabello} onChange={f('cabello')} />
              <LabeledInput label="Uñas" value={form.unas} onChange={f('unas')} />
              <LabeledInput label="Piel" value={form.piel} onChange={f('piel')} />
            </FormGrid>
          </Box>
          <Box>
            <Text fontSize="xs" color={C.muted} fontWeight="600" mb={2}>SÍNTOMAS GASTROINTESTINALES</Text>
            <FormGrid>
              <LabeledInput label="Causa reflujo" value={form.reflujoCausa} onChange={f('reflujoCausa')} />
              <LabeledInput label="Causa meteorismo" value={form.meteorismoCausa} onChange={f('meteorismoCausa')} />
              <LabeledInput label="Causa alergia" value={form.alergiaCausa} onChange={f('alergiaCausa')} />
            </FormGrid>
          </Box>
        </Stack>
      )}
    </SectionCard>
  )
}

// ── Section 5: Evaluación Dietética ──────────────────────────────────────

function SeccionDietetica({ intake }: { intake: Record<string, unknown> | null }) {
  const meals = [
    { label: 'Desayuno', emoji: '☀️', value: intake?.desayuno as any[], kcal: 0 },
    { label: 'Colación mañana', emoji: '🍎', value: intake?.colacion_am as any[], kcal: 0 },
    { label: 'Almuerzo', emoji: '🍽️', value: intake?.almuerzo as any[], kcal: 0 },
    { label: 'Colación tarde', emoji: '🥑', value: intake?.colacion_pm as any[], kcal: 0 },
    { label: 'Cena', emoji: '🌙', value: intake?.cena as any[], kcal: 0 },
  ].map(m => ({
    ...m,
    kcal: (m.value || []).reduce((sum: number, f: any) => sum + (f.kcal_total || 0), 0),
  }))
  const efc = intake?.efc as Record<string, string> | undefined

  return (
    <SectionCard title="Evaluación dietética" icon="🍽️">
      <Stack gap={5}>
        <Box>
          <Text fontSize="xs" color={C.muted} fontWeight="600" mb={3}>RECUERDO 24 HORAS</Text>
          <Stack gap={3}>
            {meals.map(({ label, emoji, value, kcal }) => (
              <Box key={label} p={3} bg={C.cream} borderRadius="xl">
                <Flex justify="space-between" align="center" mb={1}>
                  <Text fontSize="xs" color={C.green} fontWeight="600">{emoji} {label}</Text>
                  {kcal > 0 && <Text fontSize="xs" fontWeight="600" color={C.green}>{kcal.toFixed(0)} kcal</Text>}
                </Flex>
                <Text fontSize="sm" color={C.muted} lineHeight="1.5">
                  {mealToString(value || [])}
                </Text>
              </Box>
            ))}
          </Stack>
        </Box>
        {efc && Object.keys(efc).length > 0 && (
          <Box>
            <Text fontSize="xs" color={C.muted} fontWeight="600" mb={3}>FRECUENCIA DE CONSUMO</Text>
            <Grid templateColumns={{ base: '1fr', sm: '1fr 1fr' }} gap={2}>
              {Object.entries(efc).map(([grupo, frec]) => (
                <Flex key={grupo} align="center" justify="space-between" p={2} bg={C.cream} borderRadius="lg">
                  <Text fontSize="xs" color={C.text} fontWeight="500">{grupo}</Text>
                  <Box px={2} py={0.5} bg={C.greenLight} borderRadius="full">
                    <Text fontSize="xs" color={C.green} fontWeight="600">{frec}</Text>
                  </Box>
                </Flex>
              ))}
            </Grid>
          </Box>
        )}
        <Box>
          <Text fontSize="xs" color={C.muted} fontWeight="600" mb={2}>HÁBITOS ALIMENTARIOS</Text>
          <Grid templateColumns={{ base: '1fr 1fr', md: 'repeat(3, 1fr)' }} gap={3}>
            <FieldRow label="Litros de agua" value={intake?.litrosAgua as string} unit="L/día" />
            <FieldRow label="Restricciones" value={(intake?.restricciones as string[] ?? []).join(', ')} />
            <FieldRow label="Alergias" value={intake?.alergias as string} />
          </Grid>
        </Box>
      </Stack>
    </SectionCard>
  )
}

// ── Section 6: Estilo de vida ─────────────────────────────────────────────

function SeccionEstiloVida({ intake, clinical, onSave }: {
  intake: Record<string, unknown> | null
  clinical: ClinicalFicha
  onSave: (data: Partial<ClinicalFicha>) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    calidadSueno: clinical.calidadSueno ?? '',
    estresDesencadenantes: clinical.estresDesencadenantes ?? '',
    estresManejo: clinical.estresManejo ?? '',
    tabaquismo: clinical.tabaquismo ?? '',
    cigarrillosDia: clinical.cigarrillosDia ?? '',
    drogas: clinical.drogas ?? '',
  })
  const f = (k: keyof typeof form) => (v: string) => setForm(p => ({ ...p, [k]: v }))

  async function save() { setSaving(true); await onSave(form); setSaving(false); setEditing(false) }

  return (
    <SectionCard title="Estilo de vida" icon="🏃" editing={editing} onEdit={() => setEditing(!editing)} onSave={save} saving={saving}>
      {!editing ? (
        <Grid templateColumns={{ base: '1fr 1fr', md: 'repeat(3, 1fr)' }} gap={3}>
          <FieldRow label="Horas de sueño" value={intake?.horasSueno as string} unit="hrs" />
          <FieldRow label="Calidad del sueño" value={clinical.calidadSueno ?? intake?.calidadSueno as string} unit="/10" />
          <FieldRow label="Nivel de estrés" value={intake?.nivelEstres as string} unit="/10" />
          <FieldRow label="Desencadenantes estrés" value={clinical.estresDesencadenantes} />
          <FieldRow label="Manejo del estrés" value={clinical.estresManejo} />
          <FieldRow label="Tabaquismo" value={clinical.tabaquismo} />
          {clinical.cigarrillosDia && <FieldRow label="Cigarrillos/día" value={clinical.cigarrillosDia} />}
          <FieldRow label="Actividad física" value={(intake?.actividadFisicas as string[] ?? []).join(', ')} />
          <FieldRow label="Frecuencia" value={intake?.frecuenciaActividad as string} />
        </Grid>
      ) : (
        <FormGrid>
          <LabeledInput label="Calidad del sueño" value={form.calidadSueno} onChange={f('calidadSueno')} unit="/10" />
          <LabeledInput label="Desencadenantes de estrés" value={form.estresDesencadenantes} onChange={f('estresDesencadenantes')} />
          <LabeledInput label="Manejo del estrés" value={form.estresManejo} onChange={f('estresManejo')} />
          <LabeledInput label="Tabaquismo" value={form.tabaquismo} onChange={f('tabaquismo')} />
          <LabeledInput label="Cigarrillos/día" value={form.cigarrillosDia} onChange={f('cigarrillosDia')} type="number" />
          <LabeledInput label="Drogas / sustancias" value={form.drogas} onChange={f('drogas')} />
        </FormGrid>
      )}
    </SectionCard>
  )
}

// ── Section 7: Requerimientos nutricionales (auto-calculated) ─────────────

function SeccionRequerimientos({ intake }: { intake: Record<string, unknown> | null }) {
  const reqs = calcGET(intake)

  return (
    <SectionCard title="Requerimientos nutricionales" icon="🔥">
      {reqs ? (
        <Stack gap={4}>
          <Box bg={C.greenLight} borderRadius="xl" p={4}>
            <Text fontSize="xs" color={C.green} fontWeight="600" mb={1}>Calculado con Harris-Benedict + factor de actividad</Text>
            <Text fontSize="xs" color={C.muted}>Basado en datos del paciente. Ajusta según evolución clínica.</Text>
          </Box>
          <Grid templateColumns={{ base: '1fr 1fr', md: 'repeat(3, 1fr)' }} gap={3}>
            <Box>
              <Text fontSize="xs" color={C.muted} mb={0.5} fontWeight="500">GEB (Basal)</Text>
              <Text fontSize="lg" fontWeight="800" color={C.text}>{reqs.geb} <Text as="span" fontSize="xs" fontWeight="400" color={C.muted}>kcal</Text></Text>
            </Box>
            <Box>
              <Text fontSize="xs" color={C.muted} mb={0.5} fontWeight="500">GET (Total)</Text>
              <Text fontSize="lg" fontWeight="800" color={C.text}>{reqs.get} <Text as="span" fontSize="xs" fontWeight="400" color={C.muted}>kcal</Text></Text>
            </Box>
            <Box>
              <Text fontSize="xs" color={C.muted} mb={0.5} fontWeight="500">Objetivo</Text>
              <Text fontSize="lg" fontWeight="800" color={C.green}>{reqs.objetivo} <Text as="span" fontSize="xs" fontWeight="400" color={C.muted}>kcal</Text></Text>
            </Box>
          </Grid>
          <Grid templateColumns="repeat(3, 1fr)" gap={3}>
            <Box p={3} bg={C.cream} borderRadius="xl" textAlign="center">
              <Text fontSize="xl" fontWeight="800" color={C.green}>{reqs.proteinas}g</Text>
              <Text fontSize="xs" color={C.muted}>Proteínas</Text>
              <Text fontSize="xs" color={C.muted}>{Math.round(reqs.proteinas * 4 / reqs.objetivo * 100)}%</Text>
            </Box>
            <Box p={3} bg={C.cream} borderRadius="xl" textAlign="center">
              <Text fontSize="xl" fontWeight="800" color="#C6A28F">{reqs.carbos}g</Text>
              <Text fontSize="xs" color={C.muted}>Carbohidratos</Text>
              <Text fontSize="xs" color={C.muted}>{Math.round(reqs.carbos * 4 / reqs.objetivo * 100)}%</Text>
            </Box>
            <Box p={3} bg={C.cream} borderRadius="xl" textAlign="center">
              <Text fontSize="xl" fontWeight="800" color="#b88a74">{reqs.grasas}g</Text>
              <Text fontSize="xs" color={C.muted}>Grasas</Text>
              <Text fontSize="xs" color={C.muted}>{Math.round(reqs.grasas * 9 / reqs.objetivo * 100)}%</Text>
            </Box>
          </Grid>
        </Stack>
      ) : (
        <Text fontSize="sm" color={C.muted}>
          Sin datos suficientes para calcular (requiere peso, talla y fecha de nacimiento del paciente).
        </Text>
      )}
    </SectionCard>
  )
}

// ── Section 8: Diagnóstico y Plan Nutricional ─────────────────────────────

function SeccionDiagnostico({ clinical, onSave }: {
  clinical: ClinicalFicha
  onSave: (data: Partial<ClinicalFicha>) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    diagnosticoNutricional: clinical.diagnosticoNutricional ?? '',
    objetivosSMART: clinical.objetivosSMART ?? '',
    planDietario: clinical.planDietario ?? '',
    indicadoresClinica: clinical.indicadoresClinica ?? '',
    metasCortoP: clinical.metasCortoP ?? '',
    metasMedianoP: clinical.metasMedianoP ?? '',
    metasLargoP: clinical.metasLargoP ?? '',
    notasSeguimiento: clinical.notasSeguimiento ?? '',
  })
  const f = (k: keyof typeof form) => (v: string) => setForm(p => ({ ...p, [k]: v }))

  async function save() { setSaving(true); await onSave(form); setSaving(false); setEditing(false) }

  return (
    <SectionCard title="Diagnóstico y plan nutricional" icon="📝" editing={editing} onEdit={() => setEditing(!editing)} onSave={save} saving={saving}>
      {!editing ? (
        <Stack gap={3}>
          <FieldRow label="Diagnóstico nutricional" value={clinical.diagnosticoNutricional} />
          <FieldRow label="Objetivos SMART" value={clinical.objetivosSMART} />
          <FieldRow label="Plan dietario" value={clinical.planDietario} />
          <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={3} mt={1}>
            <FieldRow label="Metas corto plazo" value={clinical.metasCortoP} />
            <FieldRow label="Metas mediano plazo" value={clinical.metasMedianoP} />
            <FieldRow label="Metas largo plazo" value={clinical.metasLargoP} />
          </Grid>
          <FieldRow label="Notas de seguimiento" value={clinical.notasSeguimiento} />
        </Stack>
      ) : (
        <Stack gap={3}>
          {([
            ['diagnosticoNutricional', 'Diagnóstico nutricional'],
            ['objetivosSMART', 'Objetivos SMART'],
            ['planDietario', 'Plan dietario'],
            ['indicadoresClinica', 'Indicadores clínicos'],
            ['metasCortoP', 'Metas a corto plazo'],
            ['metasMedianoP', 'Metas a mediano plazo'],
            ['metasLargoP', 'Metas a largo plazo'],
            ['notasSeguimiento', 'Notas de seguimiento'],
          ] as const).map(([key, label]) => (
            <Box key={key}>
              <Text fontSize="xs" color={C.muted} mb={1} fontWeight="500">{label}</Text>
              <Textarea
                value={form[key]} rows={2} resize="none"
                onChange={e => f(key)(e.target.value)}
                borderColor={C.border} borderRadius="xl" fontSize="sm"
                _focus={{ borderColor: C.green, boxShadow: 'none' }}
              />
            </Box>
          ))}
        </Stack>
      )}
    </SectionCard>
  )
}

// ── Section 9: Próxima cita ───────────────────────────────────────────────

function SeccionProximaCita({ clinical, onSave }: {
  clinical: ClinicalFicha
  onSave: (data: Partial<ClinicalFicha>) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    proximaCitaFecha: clinical.proximaCitaFecha ?? '',
    proximaCitaHora: clinical.proximaCitaHora ?? '',
    proximaCitaNotas: clinical.proximaCitaNotas ?? '',
  })
  const f = (k: keyof typeof form) => (v: string) => setForm(p => ({ ...p, [k]: v }))

  async function save() { setSaving(true); await onSave(form); setSaving(false); setEditing(false) }

  return (
    <SectionCard title="Próxima cita" icon="📅" editing={editing} onEdit={() => setEditing(!editing)} onSave={save} saving={saving}>
      {!editing ? (
        <Grid templateColumns={{ base: '1fr', sm: 'repeat(3, 1fr)' }} gap={3}>
          <FieldRow label="Fecha" value={clinical.proximaCitaFecha} />
          <FieldRow label="Hora" value={clinical.proximaCitaHora} />
          <FieldRow label="Notas" value={clinical.proximaCitaNotas} />
        </Grid>
      ) : (
        <Grid templateColumns={{ base: '1fr', sm: 'repeat(3, 1fr)' }} gap={3}>
          <LabeledInput label="Fecha" value={form.proximaCitaFecha} onChange={f('proximaCitaFecha')} type="date" />
          <LabeledInput label="Hora" value={form.proximaCitaHora} onChange={f('proximaCitaHora')} type="time" />
          <Box>
            <Text fontSize="xs" color={C.muted} mb={1} fontWeight="500">Notas</Text>
            <Textarea
              value={form.proximaCitaNotas} rows={2} resize="none"
              onChange={e => f('proximaCitaNotas')(e.target.value)}
              borderColor={C.border} borderRadius="xl" fontSize="sm"
              _focus={{ borderColor: C.green, boxShadow: 'none' }}
            />
          </Box>
        </Grid>
      )}
    </SectionCard>
  )
}

// ── Main export ────────────────────────────────────────────────────────────

interface PatientFichaFormProps {
  patientId: string
  intake: Record<string, unknown> | null
}

export function PatientFichaForm({ patientId, intake }: PatientFichaFormProps) {
  const [clinical, setClinical] = useState<ClinicalFicha>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getDoc(doc(db, 'users', patientId, 'ficha', 'clinical'))
      .then(snap => { if (snap.exists()) setClinical(snap.data() as ClinicalFicha) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [patientId])

  async function saveSection(data: Partial<ClinicalFicha>) {
    const ref = doc(db, 'users', patientId, 'ficha', 'clinical')
    // updateDoc writes only changed keys — avoids stale-closure overwrites on concurrent saves.
    // Falls back to setDoc on first write (doc doesn't exist yet).
    try {
      await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
    } catch {
      await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true })
    }
    setClinical(prev => ({ ...prev, ...data }))
  }

  const redFlags = intake ? evaluarRedFlags(intake as Parameters<typeof evaluarRedFlags>[0]) : null

  if (loading) {
    return (
      <Box py={12} textAlign="center">
        <Text color="#7a7264" fontSize="sm">Cargando ficha clínica...</Text>
      </Box>
    )
  }

  return (
    <Stack gap={4}>
      {redFlags && redFlags.nivel !== 'ok' && <RedFlagsAlert result={redFlags} />}

      {intake && (
        <Box bg="#eef2ea" borderRadius="xl" px={4} py={2}>
          <Flex align="center" gap={2}>
            <Text fontSize="xs" color={C.green} fontWeight="600">Objetivos del paciente:</Text>
            <ChipGroup items={(intake.objetivos as string[]) ?? []} variant="green" />
          </Flex>
        </Box>
      )}

      <SeccionDatosGenerales intake={intake} clinical={clinical} onSave={saveSection} />
      <SeccionAntropometria intake={intake} clinical={clinical} onSave={saveSection} />
      <SeccionBioquimica clinical={clinical} onSave={saveSection} />
      <SeccionClinica intake={intake} clinical={clinical} onSave={saveSection} />
      <SeccionDietetica intake={intake} />
      <SeccionEstiloVida intake={intake} clinical={clinical} onSave={saveSection} />
      <SeccionRequerimientos intake={intake} />
      <SeccionDiagnostico clinical={clinical} onSave={saveSection} />
      <SeccionProximaCita clinical={clinical} onSave={saveSection} />
    </Stack>
  )
}
