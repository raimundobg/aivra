# BiteTrack - Documentacion Funcional de Calculos y Funcionalidades
## Version: Produccion - Abril 2026

---

## 1. CALCULO DE IMC (Indice de Masa Corporal)

**Formula:** `IMC = Peso (kg) / Talla (m)^2`

**Clasificacion:**
| Rango IMC | Categoria |
|-----------|-----------|
| < 18.5 | Bajo peso |
| 18.5 - 24.9 | Normal |
| 25.0 - 29.9 | Sobrepeso |
| 30.0 - 34.9 | Obesidad I |
| 35.0 - 39.9 | Obesidad II |
| >= 40.0 | Obesidad III |

**Ejemplo:** Peso=77kg, Talla=1.85m -> IMC = 77 / 1.85^2 = **22.5 (Normal)**

**Archivo:** `models.py` metodo `calcular_imc()`

---

## 2. PORCENTAJE DE GRASA CORPORAL

### Metodo Durnin-Womersley (4 pliegues cutaneos)

**Pliegues utilizados:** Bicipital, Tricipital, Subescapular, Supracrestideo (mm)

**Paso 1: Densidad corporal**
```
Log10(suma_pliegues) -> lookup coeficientes por sexo y edad
Densidad = C - (M x log10(suma))
```

**Coeficientes (Femenino):**
| Edad | C | M |
|------|-------|--------|
| < 17 | 1.1369 | 0.0598 |
| 17-19 | 1.1549 | 0.0678 |
| 20-29 | 1.1599 | 0.0717 |
| 30-39 | 1.1423 | 0.0632 |
| 40-49 | 1.1333 | 0.0612 |
| 50+ | 1.1339 | 0.0645 |

**Coeficientes (Masculino):**
| Edad | C | M |
|------|-------|--------|
| < 17 | 1.1533 | 0.0643 |
| 17-19 | 1.1620 | 0.0630 |
| 20-29 | 1.1631 | 0.0632 |
| 30-39 | 1.1422 | 0.0544 |
| 40-49 | 1.1620 | 0.0700 |
| 50+ | 1.1715 | 0.0779 |

**Paso 2: Ecuacion de Siri**
```
% Grasa = (495 / Densidad) - 450
Masa Grasa (kg) = Peso x (% Grasa / 100)
Masa Libre de Grasa (kg) = Peso - Masa Grasa
```

**Ejemplo:** Pliegues=4+4+4+4=16, Femenino 33a -> D=1.0662, %Grasa=**14.3%**

**Archivo:** `models.py` metodos `calcular_densidad_corporal()`, `calcular_porcentaje_grasa()`

---

## 3. GASTO ENERGETICO BASAL (GEB) - Harris-Benedict Revisada

**Masculino:**
```
GEB = 88.362 + (13.397 x Peso) + (4.799 x Altura_cm) - (5.677 x Edad)
```

**Femenino:**
```
GEB = 447.593 + (9.247 x Peso) + (3.098 x Altura_cm) - (4.330 x Edad)
```

**Ejemplo:** Femenino, 77kg, 185cm, 33a -> GEB = **1590 kcal**

**Archivo:** `models.py` metodo `calcular_geb()`

---

## 4. GASTO ENERGETICO TOTAL (GET)

**Metodo Harris-Benedict (por defecto):**
```
GET = GEB x Factor de Actividad x Factor de Estres
```

**Factores de Actividad:**
| Nivel | Factor |
|-------|--------|
| Sedentario | 1.200 |
| Ligero | 1.375 |
| Moderado | 1.550 |
| Activo | 1.725 |
| Muy activo | 1.900 |

**Metodo Factorial (ADA):**
```
GET = kcal/kg x Peso
- Bajar peso: 25 kcal/kg
- Mantener: 30 kcal/kg
- Subir peso: 35 kcal/kg
```

**Metodo Calorimetria:** Valor medido directamente (manual)

**Ajuste Calorico:**
```
GET Final = GET + Ajuste (deficit negativo, superavit positivo)
```

**Ejemplo:** GEB=1590, FA=1.375 -> GET = **2186 kcal**

**Archivo:** `models.py` metodo `calcular_get()`

---

## 5. DISTRIBUCION DE MACRONUTRIENTES

**Formulas:**
```
Proteinas (g) = GET x %Proteinas / 100 / 4    (4 kcal/g)
Carbohidratos (g) = GET x %Carbohidratos / 100 / 4  (4 kcal/g)
Grasas (g) = GET x %Grasas / 100 / 9          (9 kcal/g)
Fibra (g) = GET x 14 / 1000                   (14g por cada 1000 kcal)
```

**Distribucion por defecto:** 20% Prot / 50% Carbs / 30% Grasas

**Ejemplo (GET=2186):**
- Proteinas: 2186 x 0.20 / 4 = **109g** (1.42 gr/kg)
- Carbohidratos: 2186 x 0.50 / 4 = **273g** (3.55 gr/kg)
- Grasas: 2186 x 0.30 / 9 = **73g** (0.95 gr/kg)
- Fibra: 2186 x 14 / 1000 = **31g**

**Archivo:** `models.py` metodo `calcular_macronutrientes()`

---

## 6. INDICE CINTURA-CADERA (ICC)

**Formula:** `ICC = Perimetro Cintura / Perimetro Cadera`

**Riesgo Cardiovascular:**
| Sexo | Bajo | Moderado | Alto |
|------|------|----------|------|
| Masculino | < 0.95 | 0.95-0.99 | >= 1.00 |
| Femenino | < 0.80 | 0.80-0.84 | >= 0.85 |

**Archivo:** `models.py` metodo `calcular_icc()`

---

## 7. RADAR CHART - EVALUACION DE HABITOS (6 ejes, escala 0-10)

### Hidratacion
```
Score = min(10, consumo_agua_litros / 2 x 10)
2L de agua = 10/10 (maximo)
```

### Sueno
```
Score = calidad_sueno (directo, escala 1-10)
```

### Estres
```
Score = 10 - nivel_estres (invertido: bajo estres = puntaje alto)
```

### Actividad Fisica
```
sedentario=2, ligero=4, moderado=6, activo=8, muy_activo=10
```

### Frutas y Verduras
```
freqScore: nunca=0, 1-3/mes=1, 1/sem=2, 2-4/sem=4, 5-6/sem=6, diario=7, 2+/dia=10
Score = (frutasScore + verdurasScore) / 2, maximo 10
```

### Digestion
```
Base = 7
- Si tiene sintomas GI: -2
- Bristol 3-4 (ideal): +1
- Bristol 1-2 o 6-7: -1
Rango: 0-10
```

**Archivo:** `templates/patient_file.html` funcion `initRadarServerSide()`

---

## 8. SISTEMA DE RESTRICCIONES ALIMENTARIAS (Data-Driven)

### Restricciones soportadas:
| Clave | Alimentos bloqueados | Grupos bloqueados | Sustitucion |
|-------|---------------------|-------------------|-------------|
| vegano | Carnes, pescados, lacteos, huevos, miel | lacteos, carnes, pescados, mariscos, huevos | lacteos->frutas, proteina->legumbres |
| vegetariano | Carnes, pescados, mariscos | carnes, pescados, mariscos | proteina->legumbres |
| sin_lactosa | Leche, queso, yogur, crema, etc. (20+ keywords) | lacteos | lacteos->frutas |
| sin_gluten | Trigo, pan, pasta, harina, avena, etc. | cereales | cereales->papas_tuberculos |
| sin_mariscos | Camarones, langosta, pulpo, etc. | mariscos | - |
| sin_huevo | Huevo, mayonesa, merengue | huevos | - |
| sin_frutos_secos | Nuez, almendra, mani, etc. | frutos_secos | - |
| sin_soya | Soya, tofu, tempeh | - | - |
| sin_pescado | Salmon, atun, merluza, etc. | pescados | - |

**Archivo:** `pauta_generator.py` dicts `RESTRICTION_KEYWORDS`, `RESTRICTION_BLOCKED_GROUPS`, `RESTRICTION_GROUP_SUBSTITUTIONS`

---

## 9. FLUJO DE DATOS: FORMULARIO INTAKE -> FICHA

### Campos guardados desde el formulario publico:
- Datos personales: nombre, fecha_nacimiento, sexo, ocupacion, direccion, rut
- Historial medico: diagnosticos, medicamentos, suplementos, cirugias, antecedentes_familiares
- Alergias/intolerancias: alergias, intolerancias, alimentos_no_consume, restricciones_alimentarias
- Estilo de vida: horas_sueno, calidad_sueno, nivel_estres, actividad_fisica, consumo_alcohol, fuma
- Consumo: consumo_agua_litros, comidas_al_dia
- Objetivos: motivo_consulta, objetivos
- Sintomas GI: sintomas_gi, gatillantes_gi, consistencia_heces (Bristol)
- R24h: registro_24h (JSON por tiempo de comida)
- Frecuencia consumo: frecuencia_consumo (JSON con keys normalizados)

### Regla de 5 lugares para nuevos campos:
1. `models.py` - Column definition
2. `app.py` migration list - ALTER TABLE
3. `app.py` Path A - PUT handler campos_*
4. `app.py` Path B - save-draft handler campos_*
5. `models.py` to_dict() method

---

## 10. PAUTA ALIMENTARIA - FLUJO BIDIRECCIONAL

### Generacion con IA:
1. Frontend llama GET `/api/generar-pauta/{patient_id}`
2. Backend construye patient_data con todos los datos del paciente
3. PautaInteligente genera pauta respetando restricciones
4. Items tagueados con `source: "ia"`
5. Modal muestra resultado con opcion de editar/eliminar

### Creacion Manual:
1. Nutricionista agrega alimentos por comida con busqueda en DB
2. Items tagueados con `source: "manual"`
3. Opcion "Complementar con IA" fusiona items manuales con sugerencias IA

### Merge bidireccional:
- Manual -> IA: Items manuales preservados, IA complementa sin duplicar
- IA -> Manual: Items IA editables, nutricionista agrega/elimina libremente
- Ambos guardan en `plan_alimentario` (JSON)

---

## 11. TOOLTIPS E INFO BUTTONS

### Secciones con info button:
1. Antecedentes Generales - Datos personales e historial
2. Evaluacion Antropometrica - Mediciones corporales
3. Evaluacion Bioquimica - Examenes de laboratorio
4. Conducta y Entorno - Entorno alimentario
5. R24h y Frecuencia Consumo - Registro dietetico
6. Diagnostico y Plan - Objetivos e intervencion
7. Resumen Visual de Habitos - Grafico radar

### Quick Nav tooltips:
- 11 botones con CSS tooltips (::after pseudo-element)
- Se muestran al hacer hover a la izquierda del icono

### Tooltips en botones de accion:
- Generar Pauta IA, Pauta Manual, Alertas IA, Editar, Guardar, Imprimir
- Ver Ficha, Eliminar Paciente (en lista pacientes)
- Ajuste (kcal), Metodo de Calculo

---

*Generado automaticamente por BiteTrack QA System - Abril 2026*
