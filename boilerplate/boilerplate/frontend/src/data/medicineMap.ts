// Maps diagnoses to commonly prescribed medicines for that condition
export const medicinesByDiagnosis: Record<string, string[]> = {
  'Diabetes tipo 2': [
    'Metformina',
    'Glibenclamida',
    'Sitagliptina',
    'Insulina',
    'GLP-1',
  ],
  'Hipertensión arterial': [
    'Enalapril',
    'Losartán',
    'Amlodipino',
    'Atenolol',
    'Hidroclorotiazida',
  ],
  'Dislipidemia': [
    'Atorvastatina',
    'Simvastatina',
    'Gemfibrozil',
    'Ezetimiba',
  ],
  'Hipotiroidismo': [
    'Levotiroxina',
  ],
  'Hipertiroidismo': [
    'Propiltiouracilo',
    'Metimazol',
    'Yodo radiactivo',
  ],
  'Colon irritable (SII)': [
    'Trimebutina',
    'Espasmolíticos',
    'Psyllium (fibra)',
    'Probióticos',
  ],
  'Gastritis': [
    'Omeprazol',
    'Ranitidina',
    'Sucralfato',
    'Amoxicilina + Claritromicina',
  ],
  'Reflujo (ERGE)': [
    'Omeprazol',
    'Ranitidina',
    'Omeprazol + Domperidona',
    'Metoclopramida',
  ],
  'Enfermedad celíaca': [
    'Dieta sin gluten',
    'Complejo B',
    'Hierro',
    'Vitamina D',
  ],
  'Intolerancia a la lactosa': [
    'Lactasa (enzima)',
    'Calcio (suplemento)',
    'Vitamina D',
  ],
  'Anemia': [
    'Hierro',
    'Ácido fólico',
    'Vitamina B12',
    'Vitamina C',
  ],
  'Depresión / Ansiedad': [
    'Sertalina',
    'Fluoxetina',
    'Escitalopram',
    'Amitriptilina',
    'Citalopram',
    'Paroxetina',
  ],
  'Artritis reumatoide': [
    'Metotrexato',
    'Adalimumab',
    'Infliximab',
    'Ibuprofeno',
    'Prednisona',
  ],
  'Resistencia a la insulina': [
    'Metformina',
    'Inositol',
    'N-acetilcisteína',
  ],
  'SOP': [
    'Anticonceptivos orales',
    'Metformina',
    'Espironolactona',
    'Inositol',
  ],
}

// Get medicines suggested for a given diagnosis
export function getMedicinesForDiagnosis(diagnosis: string): string[] {
  return medicinesByDiagnosis[diagnosis] ?? []
}
