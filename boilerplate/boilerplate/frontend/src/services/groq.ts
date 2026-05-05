import { httpsCallable } from 'firebase/functions'
import { functions } from '../config/firebase'

const DEV_KEY = import.meta.env.VITE_GROQ_API_KEY as string | undefined
// Use direct API call when key is available; proxy as fallback
const USE_DIRECT = !!DEV_KEY

interface GroqCallData   { messages: Array<{ role: string; content: string }>; maxTokens?: number; temperature?: number; jsonMode?: boolean }
interface GroqCallResult { content: string }

const _proxy = httpsCallable<GroqCallData, GroqCallResult>(functions, 'groqProxy')

async function groqChat(
  messages: Array<{ role: string; content: string }>,
  maxTokens = 600,
  temperature = 0.5,
  jsonMode = false,
): Promise<string> {
  // Use proxy when no key available
  if (!USE_DIRECT) {
    const result = await _proxy({ messages, maxTokens, temperature, jsonMode })
    return result.data.content
  }

  if (!DEV_KEY) throw new Error('VITE_GROQ_API_KEY not set in .env')
  const body: Record<string, unknown> = {
    model: 'llama-3.3-70b-versatile',
    messages,
    temperature,
    max_tokens: maxTokens,
  }
  if (jsonMode) body.response_format = { type: 'json_object' }
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${DEV_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Groq error: ${res.status}`)
  const json = await res.json() as { choices: Array<{ message: { content: string } }> }
  return json.choices[0]?.message?.content ?? ''
}

export interface ChatContext {
  patientName: string
  objetivo?: string
  macros?: { calorias?: number; proteinas?: number; carbos?: number; grasas?: number }
  restricciones?: string[]
  diagnosticos?: string
}

export async function responderChat(
  mensajeUsuario: string,
  historial: Array<{ sender: string; content: string }>,
  ctx: ChatContext
): Promise<string> {
  const system = `Eres el asistente de nutrición de Aivra. Ayudas a ${ctx.patientName} con dudas sobre su plan nutricional.
${ctx.objetivo ? `Objetivo del paciente: ${ctx.objetivo}.` : ''}
${ctx.macros ? `Sus macros diarios: ${ctx.macros.calorias} kcal, ${ctx.macros.proteinas}g proteína, ${ctx.macros.carbos}g carbos, ${ctx.macros.grasas}g grasas.` : ''}
${ctx.restricciones?.length ? `Restricciones alimentarias: ${ctx.restricciones.join(', ')}.` : ''}
${ctx.diagnosticos ? `Antecedentes médicos relevantes: ${ctx.diagnosticos}.` : ''}
Responde en español, de forma concisa, cálida y profesional. Máximo 3 oraciones. No inventes información médica. Si la pregunta es médica compleja, recomienda consultar directamente con la nutricionista.`

  const messages = [
    { role: 'system', content: system },
    ...historial.slice(-6).map(m => ({
      role: m.sender === 'patient' ? 'user' : 'assistant',
      content: m.content,
    })),
    { role: 'user', content: mensajeUsuario },
  ]

  return groqChat(messages)
}

import type { IntakeData } from '../types/nutrition'

export interface PautaGenerada {
  titulo: string
  objetivo: string
  macros: { calorias: number; proteinas: number; carbos: number; grasas: number }
  comidas: Array<{ nombre: string; horario: string; kcal: number; items: string[] }>
  sustituciones: Array<{ grupo: string; items: string[] }>
  consejos: Array<{ icon: string; title: string; desc: string }>
}

function calcularEdad(fechaNacimiento: string): number {
  if (!fechaNacimiento) return 30
  const hoy = new Date()
  const nac = new Date(fechaNacimiento)
  let edad = hoy.getFullYear() - nac.getFullYear()
  const m = hoy.getMonth() - nac.getMonth()
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--
  return edad
}

interface MacrosCalculados {
  get: number        // Gasto Energético Total
  objetivo: number   // kcal target (GET ± déficit/superávit)
  proteinas: number  // gramos
  grasas: number     // gramos
  carbos: number     // gramos
}

function calcularMacros(intake: IntakeData): MacrosCalculados {
  const edad = calcularEdad(intake.fechaNacimiento)
  const peso = parseFloat(intake.peso) || 70
  const talla = parseFloat(intake.talla) || 165
  const esFemenino = intake.sexo === 'Femenino'

  // Harris-Benedict revisado
  const tmb = esFemenino
    ? 447.593 + (9.247 * peso) + (3.098 * talla) - (4.330 * edad)
    : 88.362 + (13.397 * peso) + (4.799 * talla) - (5.677 * edad)

  // Factor de actividad basado en frecuencia
  const freq = intake.frecuenciaActividad
  const actividades = intake.actividadFisicas
  const esSedentario = actividades.includes('Sedentario') || actividades.length === 0
  let factorActividad = 1.2
  if (!esSedentario) {
    if (freq === 'Todos los días' || freq === '5+ veces/sem') factorActividad = 1.725
    else if (freq === '3-4 veces/sem') factorActividad = 1.55
    else if (freq === '1-2 veces/sem') factorActividad = 1.375
    else factorActividad = 1.2
  }

  const get = Math.round(tmb * factorActividad)

  // Déficit/superávit según objetivo principal
  const objetivos = intake.objetivos
  let ajuste = 0
  if (objetivos.includes('perder_peso')) ajuste = -300
  else if (objetivos.includes('ganar_masa')) ajuste = +250
  // mantener, rendimiento, salud → sin ajuste

  const kcalObjetivo = Math.max(1200, get + ajuste)

  // Proteína: 1.8g/kg (preservación muscular en déficit) o 2.0g/kg (ganancia)
  const gProtein = objetivos.includes('ganar_masa')
    ? Math.round(peso * 2.0)
    : Math.round(peso * 1.8)

  // Grasas: 30% de las kcal objetivo
  const gGrasas = Math.round((kcalObjetivo * 0.30) / 9)

  // Carbos: el resto
  const kcalProtein = gProtein * 4
  const kcalGrasas = gGrasas * 9
  const gCarbos = Math.max(50, Math.round((kcalObjetivo - kcalProtein - kcalGrasas) / 4))

  return {
    get,
    objetivo: kcalObjetivo,
    proteinas: gProtein,
    grasas: gGrasas,
    carbos: gCarbos,
  }
}

// Helper: format AlimentoSeleccionado[] to readable string
function formatMeal(alimentos: any[]): string {
  if (!alimentos || alimentos.length === 0) return 'no especificado'
  return alimentos.map(a => `${a.alimento} (${a.medida_casera})`).join(', ')
}

export async function generarPauta(intake: IntakeData, instruccionesNutricionista?: string): Promise<PautaGenerada> {
  const edad = calcularEdad(intake.fechaNacimiento)
  const macros = calcularMacros(intake)

  const diagnosticosList = [
    ...(intake.diagnosticos || []),
    ...(intake.diagnosticosOtros || []),
  ].filter(d => d && d !== 'Ninguno').join(', ') || 'ninguno'

  const efcText = Object.entries(intake.efc ?? {}).map(([g, f]) => `${g}: ${f}`).join(', ') || 'no especificado'

  let prompt = `Eres una nutricionista clínica experta. Genera una pauta nutricional personalizada en español chileno para este paciente.

DATOS DEL PACIENTE:
- Nombre: ${intake.nombre}
- Edad: ${edad} años | Sexo: ${intake.sexo} | Ocupación: ${intake.ocupacion}
- Peso: ${intake.peso} kg | Talla: ${intake.talla} cm
- Objetivos: ${intake.objetivos.join(', ') || 'mejorar salud general'}
- Actividades físicas: ${intake.actividadFisicas.join(', ') || 'sedentario'} (${intake.frecuenciaActividad || 'nunca'})
- Sueño: ${intake.horasSueno} hrs | Estrés: ${intake.nivelEstres}/10 | Agua: ${intake.litrosAgua}
- Diagnósticos: ${diagnosticosList}
- Medicamentos: ${(intake.medicamentos || []).join(', ') || 'ninguno'}
- Suplementos: ${(intake.suplementos || []).join(', ') || 'ninguno'}
- Restricciones alimentarias: ${intake.restricciones.join(', ') || 'ninguna'}
- Alergias: ${(intake.alergias || []).join(', ') || 'ninguna'}
- Síntomas digestivos: ${intake.sintomasGI.join(', ') || 'ninguno'}
- Recuerdo 24h: Desayuno: ${formatMeal(intake.desayuno)} | Colación AM: ${formatMeal(intake.colacion_am)} | Almuerzo: ${formatMeal(intake.almuerzo)} | Colación PM: ${formatMeal(intake.colacion_pm)} | Cena: ${formatMeal(intake.cena)}
- Frecuencia de consumo: ${efcText}

REQUERIMIENTOS CALCULADOS (Harris-Benedict + factor actividad):
- GET (Gasto Energético Total): ${macros.get} kcal/día
- Meta calórica: ${macros.objetivo} kcal/día
- Proteínas: ${macros.proteinas}g (${Math.round(macros.proteinas * 4)} kcal)
- Grasas: ${macros.grasas}g (${Math.round(macros.grasas * 9)} kcal)
- Carbohidratos: ${macros.carbos}g (${Math.round(macros.carbos * 4)} kcal)
USA EXACTAMENTE ESTOS VALORES DE MACROS — no los cambies.

INSTRUCCIONES ESTRICTAS:
1. El array "comidas" debe tener EXACTAMENTE 5 elementos: "Desayuno", "Colación AM", "Almuerzo", "Colación PM", "Cena"
2. El array "sustituciones" debe tener EXACTAMENTE 4 elementos con grupos: "Proteínas", "Carbohidratos", "Grasas", "Lácteos"
3. El array "consejos" debe tener EXACTAMENTE 5 elementos personalizados para este paciente
4. Cada comida: mínimo 3 items con porciones específicas (gramos, tazas, unidades)
5. Cada grupo de sustituciones: mínimo 4 opciones
6. Respeta ABSOLUTAMENTE restricciones y alergias — NUNCA incluyas alimentos prohibidos
7. Usa alimentos típicos chilenos y latinoamericanos
8. Distribuye las kcal de forma coherente: desayuno ~25%, colación AM ~10%, almuerzo ~35%, colación PM ~10%, cena ~20%

Responde ÚNICAMENTE con JSON válido, sin texto adicional:
{
  "titulo": "Pauta nutricional personalizada",
  "objetivo": "descripción clínica del objetivo basada en los datos del paciente",
  "macros": { "calorias": ${macros.objetivo}, "proteinas": ${macros.proteinas}, "carbos": ${macros.carbos}, "grasas": ${macros.grasas} },
  "comidas": [
    { "nombre": "Desayuno", "horario": "8:00 - 9:00", "kcal": ${Math.round(macros.objetivo * 0.25)}, "items": ["alimento con porción exacta", "alimento 2", "alimento 3"] },
    { "nombre": "Colación AM", "horario": "11:00", "kcal": ${Math.round(macros.objetivo * 0.10)}, "items": ["alimento 1", "alimento 2", "alimento 3"] },
    { "nombre": "Almuerzo", "horario": "13:00 - 14:00", "kcal": ${Math.round(macros.objetivo * 0.35)}, "items": ["alimento 1", "alimento 2", "alimento 3", "alimento 4"] },
    { "nombre": "Colación PM", "horario": "17:00", "kcal": ${Math.round(macros.objetivo * 0.10)}, "items": ["alimento 1", "alimento 2", "alimento 3"] },
    { "nombre": "Cena", "horario": "20:00 - 21:00", "kcal": ${Math.round(macros.objetivo * 0.20)}, "items": ["alimento 1", "alimento 2", "alimento 3", "alimento 4"] }
  ],
  "sustituciones": [
    { "grupo": "Proteínas", "items": ["opción 1 con porción", "opción 2", "opción 3", "opción 4"] },
    { "grupo": "Carbohidratos", "items": ["opción 1", "opción 2", "opción 3", "opción 4"] },
    { "grupo": "Grasas", "items": ["opción 1", "opción 2", "opción 3", "opción 4"] },
    { "grupo": "Lácteos", "items": ["opción 1", "opción 2", "opción 3", "opción 4"] }
  ],
  "consejos": [
    { "icon": "💧", "title": "Hidratación", "desc": "consejo personalizado" },
    { "icon": "🕐", "title": "Horarios", "desc": "consejo personalizado" },
    { "icon": "🥦", "title": "Verduras", "desc": "consejo personalizado" },
    { "icon": "🧂", "title": "Sodio", "desc": "consejo personalizado" },
    { "icon": "📏", "title": "Porciones", "desc": "consejo personalizado" }
  ]
}`

  if (instruccionesNutricionista) {
    prompt += `\n\nINSTRUCCIONES ADICIONALES DEL NUTRICIONISTA:\n${instruccionesNutricionista}`
  }

  const content = await groqChat([{ role: 'user', content: prompt }], 2500, 0.4, true)
  return JSON.parse(content) as PautaGenerada
}

// ─── Red Flags ────────────────────────────────────────────────────────────────

export interface RedFlagsResult {
  nivel: 'ok' | 'moderado' | 'critico'
  flags: string[]
}

export function evaluarRedFlags(intake: Partial<IntakeData>): RedFlagsResult {
  const flags: string[] = []
  const criticalFlags: string[] = []

  const diagText = [
    ...(intake.diagnosticos ?? []),
    ...(intake.diagnosticosOtros ?? []),
  ].join(' ').toLowerCase()

  // Critical flags
  if (diagText.includes('anorexia') || diagText.includes('bulimia') || diagText.includes('tca')) {
    criticalFlags.push('Posible TCA — requiere atención profesional')
  }
  if (diagText.includes('diabetes tipo 1') || diagText.includes('insulina')) {
    criticalFlags.push('Diabetes tipo 1/insulinoterapia')
  }
  if (diagText.includes('renal') || diagText.includes('hepática')) {
    criticalFlags.push('Enfermedad renal/hepática')
  }
  if (diagText.includes('cáncer') || diagText.includes('cancer')) {
    criticalFlags.push('Cáncer activo')
  }

  if (criticalFlags.length > 0) {
    return { nivel: 'critico', flags: criticalFlags }
  }

  // Moderate flags
  const estres = parseInt(intake.nivelEstres ?? '0', 10)
  const sueno = parseInt(intake.horasSueno ?? '8', 10)
  if (estres >= 8 && sueno <= 5) {
    flags.push('Estrés alto + sueño insuficiente')
  }

  const sintomasActivos = (intake.sintomasGI ?? []).filter(s => s !== 'Ninguno')
  if (sintomasActivos.length >= 3) {
    flags.push('Múltiples síntomas digestivos')
  }

  const medicamentosCount = Array.isArray(intake.medicamentos) ? intake.medicamentos.length : 0
  if (medicamentosCount >= 3) {
    flags.push(`Polimedicación (${medicamentosCount} medicamentos)`)
  }

  if (flags.length > 0) {
    return { nivel: 'moderado', flags }
  }

  return { nivel: 'ok', flags: [] }
}

// ─── Weekly Menu ──────────────────────────────────────────────────────────────

export interface MenuDia {
  dia: string
  comidas: Array<{ nombre: string; items: string[] }>
}

export async function generarMenuSemanal(
  pauta: PautaGenerada,
  restricciones: string[]
): Promise<MenuDia[]> {
  const comidasTemplate = pauta.comidas.map(c => c.nombre).join(', ')
  const restriccionesText = restricciones.length > 0 ? restricciones.join(', ') : 'ninguna'

  const prompt = `Eres una nutricionista clínica. Genera un menú semanal de 7 días en español chileno.

PAUTA BASE (usa la misma estructura de comidas): ${comidasTemplate}
Restricciones alimentarias a respetar SIEMPRE: ${restriccionesText}
Macros de referencia: ${pauta.macros.calorias} kcal/día, ${pauta.macros.proteinas}g proteína, ${pauta.macros.carbos}g carbos, ${pauta.macros.grasas}g grasas.

INSTRUCCIONES:
1. Genera exactamente 7 días: Lunes, Martes, Miércoles, Jueves, Viernes, Sábado, Domingo
2. Cada día tiene exactamente 5 comidas: Desayuno, Colación AM, Almuerzo, Colación PM, Cena
3. Varía las comidas entre los días — no repitas el mismo plato dos días seguidos
4. Usa alimentos chilenos y latinoamericanos típicos
5. Cada comida tiene 2-4 items con porciones específicas
6. Respeta ABSOLUTAMENTE las restricciones: ${restriccionesText}

Responde ÚNICAMENTE con JSON válido:
{ "menu": [{ "dia": "Lunes", "comidas": [{ "nombre": "Desayuno", "items": ["item1", "item2"] }, { "nombre": "Colación AM", "items": ["item1"] }, { "nombre": "Almuerzo", "items": ["item1", "item2", "item3"] }, { "nombre": "Colación PM", "items": ["item1"] }, { "nombre": "Cena", "items": ["item1", "item2", "item3"] }] }, ...7 días total] }`

  const content = await groqChat([{ role: 'user', content: prompt }], 3000, 0.6, true)
  const parsed = JSON.parse(content) as { menu: MenuDia[] }
  return parsed.menu
}

// ─── Basic Pauta (from WelcomeModal minimal data) ────────────────────────────

export async function generarPautaBasica(params: {
  nombre: string
  objetivo: string
  peso: number
  talla: number
}): Promise<PautaGenerada> {
  const peso = params.peso || 70
  const talla = params.talla || 165
  const tmb = 447.593 + (9.247 * peso) + (3.098 * talla) - (4.330 * 30)
  const get = Math.round(tmb * 1.375)
  const ajuste = params.objetivo === 'bajar_peso' ? -300 : params.objetivo === 'ganar_masa' ? 250 : 0
  const kcal = Math.max(1200, get + ajuste)
  const prot = Math.round(peso * 1.8)
  const grasas = Math.round((kcal * 0.30) / 9)
  const carbos = Math.max(50, Math.round((kcal - prot * 4 - grasas * 9) / 4))
  const OBJ_DESC: Record<string, string> = {
    bajar_peso: 'pérdida de peso saludable',
    ganar_masa: 'aumento de masa muscular',
    mantener: 'mantenimiento de peso',
    salud: 'mejora de salud general',
    rendimiento: 'rendimiento deportivo',
  }
  const objDesc = OBJ_DESC[params.objetivo] ?? 'bienestar general'
  const d25 = Math.round(kcal * 0.25)
  const d10 = Math.round(kcal * 0.10)
  const d35 = Math.round(kcal * 0.35)
  const d20 = Math.round(kcal * 0.20)

  const prompt = `Genera pauta nutricional en español chileno para ${params.nombre}. Objetivo: ${objDesc}. Peso: ${peso}kg, Talla: ${talla}cm. Meta: ${kcal} kcal/día, ${prot}g proteína, ${grasas}g grasas, ${carbos}g carbos. Alimentos chilenos típicos, porciones exactas.

Responde ÚNICAMENTE con JSON válido:
{"titulo":"Pauta nutricional personalizada","objetivo":"${objDesc} — ${kcal} kcal/día","macros":{"calorias":${kcal},"proteinas":${prot},"carbos":${carbos},"grasas":${grasas}},"comidas":[{"nombre":"Desayuno","horario":"8:00","kcal":${d25},"items":["item1","item2","item3"]},{"nombre":"Colación AM","horario":"11:00","kcal":${d10},"items":["item1","item2"]},{"nombre":"Almuerzo","horario":"13:00","kcal":${d35},"items":["item1","item2","item3","item4"]},{"nombre":"Colación PM","horario":"17:00","kcal":${d10},"items":["item1","item2"]},{"nombre":"Cena","horario":"20:00","kcal":${d20},"items":["item1","item2","item3"]}],"sustituciones":[{"grupo":"Proteínas","items":["pollo 100g","atún en lata","huevo 2 unidades","tofu 100g"]},{"grupo":"Carbohidratos","items":["arroz integral 1/2 taza","papa mediana","avena 1/2 taza","pan integral 2 rebanadas"]},{"grupo":"Grasas","items":["palta 1/4","aceite oliva 1 cdita","nueces 30g","almendras 20g"]},{"grupo":"Lácteos","items":["yogurt griego","leche semidescremada 1 taza","quesillo 50g","leche vegetal"]}],"consejos":[{"icon":"💧","title":"Hidratación","desc":"Toma al menos 2 litros de agua al día, especialmente entre comidas."},{"icon":"🕐","title":"Horarios","desc":"Mantén intervalos de 3-4 horas entre comidas para regular el hambre."},{"icon":"🥦","title":"Verduras","desc":"Incluye verduras coloridas en almuerzo y cena para cubrir micronutrientes."},{"icon":"🧂","title":"Sodio","desc":"Prefiere hierbas aromáticas sobre la sal para condimentar."},{"icon":"📏","title":"Porciones","desc":"Usa la mano como referencia: palma para proteínas, puño para carbos."}]}`

  const content = await groqChat([{ role: 'user', content: prompt }], 2000, 0.4, true)
  return JSON.parse(content) as PautaGenerada
}
