export interface NutritionRequirements {
  geb: number
  get: number
  objetivo: number
  proteinas: number
  grasas: number
  carbos: number
}

export function calcGET(intake: Record<string, unknown> | null): NutritionRequirements | null {
  const peso = parseFloat(intake?.peso as string ?? '')
  const talla = parseFloat(intake?.talla as string ?? '')
  const fechaNac = intake?.fechaNacimiento as string
  const sexo = (intake?.sexo as string ?? '').toLowerCase()
  const freq = intake?.frecuenciaActividad as string ?? ''
  const objetivos = intake?.objetivos as string[] ?? []

  if (!peso || !talla || !fechaNac) return null

  const age = Math.floor((Date.now() - new Date(fechaNac).getTime()) / (365.25 * 24 * 3600 * 1000))
  const isMale = sexo.includes('masc') || sexo === 'm'

  const geb = isMale
    ? 88.362 + (13.397 * peso) + (4.799 * talla) - (5.677 * age)
    : 447.593 + (9.247 * peso) + (3.098 * talla) - (4.330 * age)

  const actFactor = freq.includes('5') || freq.includes('6') || freq.includes('7') ? 1.725
    : freq.includes('3') || freq.includes('4') ? 1.55
    : freq.includes('1') || freq.includes('2') ? 1.375
    : 1.2

  const get = Math.round(geb * actFactor)

  const wantsLoss = objetivos.some(o => o.toLowerCase().includes('perder') || o.toLowerCase().includes('bajar'))
  const wantsGain = objetivos.some(o => o.toLowerCase().includes('ganar') || o.toLowerCase().includes('masa'))
  const objetivo = wantsLoss ? get - 300 : wantsGain ? get + 250 : get

  const proteinas = Math.round(peso * 1.9)
  const grasas = Math.round(objetivo * 0.30 / 9)
  const carbos = Math.round((objetivo - (proteinas * 4) - (grasas * 9)) / 4)

  return { geb: Math.round(geb), get, objetivo, proteinas, grasas, carbos }
}
