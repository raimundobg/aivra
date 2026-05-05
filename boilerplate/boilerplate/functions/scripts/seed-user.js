const admin = require('firebase-admin')

admin.initializeApp({ projectId: 'aivra-370c4' })

const db = admin.firestore()
const auth = admin.auth()

async function main() {
  const email = 'rburchardtg@gmail.com'

  // Find UID by email
  const userRecord = await auth.getUserByEmail(email)
  const uid = userRecord.uid
  console.log(`UID: ${uid}`)

  // Write profile data
  await db.collection('users').doc(uid).set({
    displayName: 'Rai',
    email,
    peso: 120,
    talla: 184,
    objetivo: 'bajar_peso',
    plan: 'ia',
    rol: 'patient',
    basicProfileSeen: true,
    basicProfileCompleted: true,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true })

  console.log('Perfil guardado.')

  // Generate pauta via groqProxy logic (direct call)
  const key = process.env.GROQ_API_KEY
  const bmr = 88.36 + (13.4 * 120) + (4.8 * 184) - (5.7 * 30)
  const tdee = Math.round(bmr * 1.375)
  const kcal = tdee - 300
  const prot = Math.round(120 * 1.8)
  const grasas = Math.round((kcal * 0.30) / 9)
  const carbos = Math.round((kcal - prot * 4 - grasas * 9) / 4)

  const prompt = `Eres una nutricionista clínica. Genera una pauta nutricional personalizada en español chileno para:
- Nombre: Rai
- Objetivo: bajar de peso
- Peso: 120 kg, Talla: 184 cm
- Calorías objetivo: ${kcal} kcal/día
- Proteínas: ${prot}g, Carbos: ${carbos}g, Grasas: ${grasas}g

Responde ÚNICAMENTE con JSON:
{
  "titulo": "Plan ...",
  "objetivo": "descripción clínica breve",
  "macros": { "calorias": ${kcal}, "proteinas": ${prot}, "carbos": ${carbos}, "grasas": ${grasas} },
  "comidas": [
    { "nombre": "Desayuno", "horario": "08:00", "kcal": número, "items": ["item1","item2","item3"] },
    { "nombre": "Colación AM", "horario": "10:30", "kcal": número, "items": ["item1","item2"] },
    { "nombre": "Almuerzo", "horario": "13:00", "kcal": número, "items": ["item1","item2","item3"] },
    { "nombre": "Colación PM", "horario": "16:30", "kcal": número, "items": ["item1","item2"] },
    { "nombre": "Cena", "horario": "20:00", "kcal": número, "items": ["item1","item2","item3"] }
  ],
  "sustituciones": [
    { "grupo": "Proteínas", "items": ["pollo","pavo","atún","huevo","legumbres"] },
    { "grupo": "Carbohidratos", "items": ["arroz integral","quinoa","avena","camote","pan integral"] },
    { "grupo": "Grasas saludables", "items": ["palta","aceite de oliva","nueces","almendras"] },
    { "grupo": "Verduras libres", "items": ["lechuga","espinaca","pepino","apio","tomate"] }
  ],
  "consejos": [
    { "icon": "💧", "title": "Hidratación", "desc": "Bebe 3L de agua al día, especialmente antes de cada comida." },
    { "icon": "🕐", "title": "Horarios", "desc": "Respeta los horarios para mantener el metabolismo activo." },
    { "icon": "🚶", "title": "Actividad", "desc": "Suma 8.000 pasos diarios como mínimo." }
  ]
}`

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    }),
  })

  const json = await res.json()
  const pauta = JSON.parse(json.choices[0].message.content)

  await db.collection('users').doc(uid).collection('pauta').doc('current').set({
    ...pauta,
    generadoPor: 'ia',
    generadoAt: admin.firestore.FieldValue.serverTimestamp(),
  })

  console.log('Pauta generada:', pauta.titulo)
  console.log('Macros:', pauta.macros)
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
