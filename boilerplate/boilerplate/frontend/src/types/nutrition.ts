// ─── Food Database & Meal Types ───────────────────────────────────────────

export interface Alimento {
  alimento: string
  grupo: string
  subgrupo: string
  gramos_porcion: number
  medida_casera: string
  kcal_porcion: number
  proteinas_g: number
  lipidos_g: number
  carbohidratos_g: number
  comentario?: string
}

export interface AlimentoSeleccionado extends Alimento {
  porciones: number
  kcal_total: number
  proteinas_total: number
  lipidos_total: number
  carbohidratos_total: number
}

export type MealKey = 'desayuno' | 'colacion_am' | 'almuerzo' | 'colacion_pm' | 'cena'

export const MEAL_KEYS: Record<MealKey, string> = {
  desayuno: 'Desayuno',
  colacion_am: 'Colación AM',
  almuerzo: 'Almuerzo',
  colacion_pm: 'Colación PM',
  cena: 'Cena',
}

export const MEAL_DISTRIBUTION: Record<MealKey, number> = {
  desayuno: 0.25,
  colacion_am: 0.10,
  almuerzo: 0.30,
  colacion_pm: 0.10,
  cena: 0.25,
}

// ─── Intake Form Data (Unified) ───────────────────────────────────────────

export interface IntakeData {
  // Step 1: Personal
  nombre: string
  fechaNacimiento: string
  sexo: string
  rut: string
  ocupacion: string
  telefono: string
  peso: string
  talla: string

  // Step 2: Medical History (NEW: arrays, not strings)
  diagnosticos: string[]
  diagnosticosOtros: string[]
  medicamentos: string[]
  suplementos: string[]
  cirugias: string[]
  antecedenteFamiliar: string[]

  // Step 3: Restrictions (arrays)
  restricciones: string[]
  alergias: string[]

  // Step 4: Habits
  horasSueno: string
  calidadSueno: string
  nivelEstres: string
  actividadFisicas: string[]
  frecuenciaActividad: string
  litrosAgua: string

  // Step 5: Digestion
  sintomasGI: string[]
  bristolScale: string

  // Step 6: Dietary Recall (NEW: structured food objects, not strings)
  desayuno: AlimentoSeleccionado[]
  colacion_am: AlimentoSeleccionado[]
  almuerzo: AlimentoSeleccionado[]
  colacion_pm: AlimentoSeleccionado[]
  cena: AlimentoSeleccionado[]

  // Frequency of consumption
  efc: Record<string, string>

  // Step 7: Goals
  objetivos: string[]
  compromiso: string

  // Metadata
  completedAt?: any // Firestore Timestamp
  updatedAt?: any // Firestore Timestamp
}

// ─── Helper Types ───────────────────────────────────────────────────────

export interface MealStats {
  mealKey: MealKey
  kcal: number
  protein: number
  carbs: number
  fat: number
  target: number
  count: number
}

export interface DailyTotals {
  kcal: number
  protein: number
  carbs: number
  fat: number
}

export interface R24Document {
  meals: Record<MealKey, AlimentoSeleccionado[]>
  savedAt?: any // Firestore Timestamp
}

// ─── Helper Functions ───────────────────────────────────────────────────

export function calculateAlimentoTotals(alimento: Alimento, porciones: number): Omit<AlimentoSeleccionado, keyof Alimento> {
  return {
    porciones,
    kcal_total: alimento.kcal_porcion * porciones,
    proteinas_total: alimento.proteinas_g * porciones,
    lipidos_total: alimento.lipidos_g * porciones,
    carbohidratos_total: alimento.carbohidratos_g * porciones,
  }
}

export function mealToString(meals: AlimentoSeleccionado[]): string {
  if (meals.length === 0) return '(sin datos)'
  return meals.map(m => `${m.alimento} (${m.medida_casera})`).join('; ')
}

export function medicamentsToString(meds: string[]): string {
  if (meds.length === 0) return '(ninguno)'
  return meds.join('; ')
}

export function getMealsObject(data: { desayuno: AlimentoSeleccionado[]; colacion_am: AlimentoSeleccionado[]; almuerzo: AlimentoSeleccionado[]; colacion_pm: AlimentoSeleccionado[]; cena: AlimentoSeleccionado[] }): Record<MealKey, AlimentoSeleccionado[]> {
  return {
    desayuno: data.desayuno,
    colacion_am: data.colacion_am,
    almuerzo: data.almuerzo,
    colacion_pm: data.colacion_pm,
    cena: data.cena,
  }
}
