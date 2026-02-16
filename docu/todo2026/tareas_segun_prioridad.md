# BITETRACK - Plan de Mejoras 2026

> **Documento de Tareas Priorizadas**
> Generado: Febrero 2026
> Versión: 1.0

---

## VISIÓN DEL PRODUCTO

**BiteTrack** es un software 360° que automatiza toda la gestión de los profesionales de nutrición. Diseñado **por nutricionistas, para nutricionistas y coaches deportivos**.

### Propuesta de Valor
- Consultas más personalizadas y enfocadas
- Pautas alimentarias generadas en la misma consulta
- Automatización de tareas administrativas
- Análisis inteligente con IA
- Gestión integral del paciente

---

## QUICK WINS - LANDING PAGE

### Cambios Inmediatos de Alto Impacto

#### 1. Rebranding: MadLab/ZenLab → BiteTrack
| Ubicación | Cambio |
|-----------|--------|
| Header/Logo | "BiteTrack" |
| Título principal | "BiteTrack - Software 360° para Nutricionistas" |
| Footer | "© 2026 BiteTrack. Todos los derechos reservados." |
| Meta tags | Actualizar title y description |
| Favicon | Nuevo icono BiteTrack |

#### 2. Reestructuración del Hero Section

**ANTES:**
```
Hero 1: Batidos Inteligentes Personalizados
Hero 2: Software para Nutricionistas
```

**DESPUÉS:**
```
Hero Principal: Software 360° para Nutricionistas
  └── "Automatiza tu consulta. Potencia tus resultados."
  └── "Por nutricionistas, para nutricionistas y coaches deportivos"
  └── CTA: "Comenzar Gratis" | "Ver Demo"

Sección Secundaria (más abajo): Generador de Recetas Inteligentes
  └── Batidos y recetas personalizadas con IA
```

#### 3. Nuevo Copy del Hero

```markdown
# BiteTrack
## Software 360° para Profesionales de la Nutrición

Automatiza toda la gestión de tu consulta nutricional.
Fichas de pacientes, análisis con IA, pautas personalizadas
y seguimiento integral en una sola plataforma.

**Diseñado por nutricionistas, para nutricionistas y coaches deportivos.**

[Comenzar Gratis]  [Solicitar Demo]

✓ Fichas inteligentes    ✓ Análisis con IA    ✓ Pautas en minutos
✓ R24hrs automatizado    ✓ Seguimiento 360°   ✓ Multi-paciente
```

#### 4. Secciones Propuestas del Landing

```
1. Hero - Software 360° (PRINCIPAL)
2. Problema/Solución - "Los nutricionistas pierden hasta 60% de su tiempo..."
3. Características principales (4-6 features)
4. Cómo funciona (3 pasos)
5. Generador de Recetas Inteligentes (BATIDOS AQUÍ)
6. Testimonios
7. Planes y Precios
8. FAQ
9. CTA Final
10. Footer
```

#### 5. Correcciones de Encoding y Ortografía

| Error Actual | Corrección |
|--------------|------------|
| `Â¡Bienvenido` | `¡Bienvenido` |
| `Íšnete` | `Únete` |
| `documentacion` | `documentación` |
| `calculos` | `cálculos` |
| `dias` | `días` |
| `menus` | `menús` |
| `antropometricos` | `antropométricos` |
| `clinico` | `clínico` |
| `automaticos` | `automáticos` |
| `caloricos` | `calóricos` |
| `instantanea` | `instantánea` |
| `reduccion` | `reducción` |
| `deteccion` | `detección` |

---

## LISTA COMPLETA DE TAREAS POR PRIORIDAD

### PRIORIDAD CRÍTICA
> Afectan imagen profesional y funcionalidad core. Resolver inmediatamente.

| # | Tarea | Archivo(s) | Descripción | Estado |
|---|-------|-----------|-------------|--------|
| C1 | Corregir encoding UTF-8 | `templates/*.html` | "Â¡Bienvenido" → "¡Bienvenido", "Íšnete" → "Únete" | ⬜ Pendiente |
| C2 | Corregir tildes en landing | `templates/index.html` | documentación, cálculos, días, menús, etc. | ⬜ Pendiente |
| C3 | Fix botón tenedor genera pauta | `js/recipe-generator.js`, `nutritionist_dashboard.html` | No genera pauta, layout confuso | ⬜ Pendiente |
| C4 | Rebranding a BiteTrack | `templates/*.html`, `css/*` | Cambiar nombre en toda la plataforma | ⬜ Pendiente |
| C5 | Reestructurar Hero | `templates/index.html` | Software nutri primero, batidos abajo | ⬜ Pendiente |

---

### PRIORIDAD ALTA
> Funcionalidad core del producto. Resolver en sprint actual.

| # | Tarea | Archivo(s) | Descripción | Estado |
|---|-------|-----------|-------------|--------|
| A1 | Campo Menstruación/Menopausia | `models.py`, `patient_intake_form.html` | Nuevo campo en PatientFile | ⬜ Pendiente |
| A2 | Casilla "NO come" | `models.py`, `patient_intake_form.html` | Restricciones: vegetariano, vegano, etc. | ⬜ Pendiente |
| A3 | Filtro alergias en generador | `recipe_generator_v2.py` | Excluir alérgenos de la planificación | ⬜ Pendiente |
| A4 | Múltiples actividades físicas | `models.py`, `patient_intake_form.html`, `patient-intake.js` | Array de ejercicios + frecuencia semanal | ⬜ Pendiente |
| A5 | Opción "cóctel" en alcohol | `patient_intake_form.html` | Agregar al select de tipo_alcohol | ⬜ Pendiente |
| A6 | Deseleccionar opciones | `patient-intake.js` | Toggle en checkboxes/pills | ⬜ Pendiente |
| A7 | Validación campos faltantes | `patient-intake.js` | Mostrar qué campos faltan al submit | ⬜ Pendiente |
| A8 | Nuevo copy landing | `templates/index.html` | Messaging 360°, por nutricionistas | ⬜ Pendiente |

---

### PRIORIDAD MEDIA
> Mejoras de UX y usabilidad. Resolver en próximo sprint.

| # | Tarea | Archivo(s) | Descripción | Estado |
|---|-------|-----------|-------------|--------|
| M1 | Autocompletar R24hrs | `patient-intake.js` | Escribir "pollo" → auto-selecciona grupo/subgrupo | ⬜ Pendiente |
| M2 | Agua en litros | `patient_intake_form.html` | Mínimo recomendado: 2L (8 vasos) | ⬜ Pendiente |
| M3 | Café/Té en tazas/día | `patient_intake_form.html` | Cambiar unidad de medida | ⬜ Pendiente |
| M4 | Delivery/Restaurante en EFC | `patient_intake_form.html`, `models.py` | Nuevo ítem en frecuencia consumo | ⬜ Pendiente |
| M5 | Corregir "AzúCares" | `base_alimentos_porciones.xlsx` o JS | Ortografía correcta: "Azúcares" | ⬜ Pendiente |
| M6 | Clarificar números porciones | UI + documentación | Explicar qué son 4, 1.8, 4 antes de porciones | ⬜ Pendiente |
| M7 | Lógica pan+palta | `recipe_generator_v2.py` | No dejar pan solo si quita palta | ⬜ Pendiente |
| M8 | Restricción Natur en almuerzo | `recipe_generator_v2.py` | Reglas por tiempo de comida | ⬜ Pendiente |
| M9 | Líquidos aparte del GET | `models.py` calcular_macronutrientes() | 1ml por kcal del GET | ⬜ Pendiente |
| M10 | Definir % cumplimiento | UI + documentación | Qué representa este número en resumen | ⬜ Pendiente |
| M11 | Percepción esfuerzo físico | `patient_intake_form.html` | Escala de esfuerzo percibido | ⬜ Pendiente |
| M12 | Cuadro texto en cada sección | `patient_intake_form.html` | Notas adicionales por sección | ⬜ Pendiente |

---

### PRIORIDAD BAJA
> Nice to have. Resolver cuando haya tiempo.

| # | Tarea | Archivo(s) | Descripción | Estado |
|---|-------|-----------|-------------|--------|
| B1 | Toggle ver contraseña | `register.html`, `login.html` | Icono ojo para mostrar/ocultar | ⬜ Pendiente |
| B2 | Fix "Ver DEMO" | `index.html` | Agregar video real o cambiar texto | ⬜ Pendiente |
| B3 | Página Contacto | Nuevo template | Formulario de contacto + email soporte | ⬜ Pendiente |
| B4 | Página FAQ | Nuevo template | Preguntas frecuentes | ⬜ Pendiente |
| B5 | Página Centro de Ayuda | Nuevo template | Tutoriales y guías | ⬜ Pendiente |
| B6 | Términos de Uso | Nuevo template | Legal y privacidad | ⬜ Pendiente |
| B7 | Expandir a LATAM | Textos marketing | No solo "alimentos chilenos" | ⬜ Pendiente |
| B8 | Plan Professional gratis 1 mes | `auth.py`, lógica suscripción | Trial para nuevos usuarios | ⬜ Pendiente |

---

### FUTURO (Fase 2)
> Requieren diseño y arquitectura. Planificar para Q2-Q3 2026.

| # | Tarea | Impacto | Descripción | Estado |
|---|-------|---------|-------------|--------|
| F1 | Formulario previo paciente | 🔴 ALTO | Nueva vista pública que paciente llena pre-consulta | ⬜ Pendiente |
| F2 | Recordatorios 48h/24h | 🔴 ALTO | Email automático antes de consulta | ⬜ Pendiente |
| F3 | IA genera insights | 🔴 ALTO | Alertas automáticas: "duerme <7hrs", "estrés >7" | ⬜ Pendiente |
| F4 | Gráfico de araña | 🟡 MEDIO | Visualización salud integral (5-6 parámetros) | ⬜ Pendiente |
| F5 | Paciente como "carpeta" | 🔴 ALTO | Separar: Ficha, R24hrs, Análisis, Pautas, Historial | ⬜ Pendiente |
| F6 | Análisis R24hrs con IA | 🟡 MEDIO | Comparar consumo vs objetivos automáticamente | ⬜ Pendiente |
| F7 | Micronutrientes | 🟡 MEDIO | Agregar vitaminas y minerales al análisis | ⬜ Pendiente |

---

## DETALLE TÉCNICO POR ARCHIVO

### models.py (6 cambios)
```python
# AGREGAR campos:
menstruacion = db.Column(db.String(50))  # regular/irregular/menopausia/no_aplica
restricciones_alimentarias = db.Column(db.JSON)  # ["vegetariano", "sin_gluten", ...]
percepcion_esfuerzo = db.Column(db.Integer)  # 1-10 escala Borg

# MODIFICAR:
actividad_fisica = db.Column(db.JSON)  # Array de múltiples actividades
# Estructura: [{"tipo": "pesas", "frecuencia": 3, "duracion": 60}, ...]

# AGREGAR en frecuencia_consumo:
delivery_restaurante = db.Column(db.Integer)  # 0-7 veces/semana

# MODIFICAR calcular_macronutrientes():
# Agregar: liquidos_ml = get_kcal * 1  # 1ml por kcal
```

### patient_intake_form.html (12 cambios)
```html
<!-- AGREGAR sección Menstruación -->
<div class="form-group">
  <label>Ciclo Menstrual</label>
  <select name="menstruacion">
    <option value="regular">Regular</option>
    <option value="irregular">Irregular</option>
    <option value="menopausia">Menopausia</option>
    <option value="no_aplica">No aplica</option>
  </select>
</div>

<!-- AGREGAR restricciones alimentarias -->
<div class="form-group">
  <label>Restricciones Alimentarias</label>
  <div class="checkbox-group">
    <input type="checkbox" name="restricciones[]" value="vegetariano"> Vegetariano
    <input type="checkbox" name="restricciones[]" value="vegano"> Vegano
    <input type="checkbox" name="restricciones[]" value="sin_gluten"> Sin Gluten
    <input type="checkbox" name="restricciones[]" value="sin_lactosa"> Sin Lactosa
    <input type="checkbox" name="restricciones[]" value="kosher"> Kosher
    <input type="checkbox" name="restricciones[]" value="halal"> Halal
  </div>
</div>

<!-- AGREGAR cóctel en alcohol -->
<option value="coctel">Cóctel</option>

<!-- MODIFICAR actividad física para múltiples -->
<!-- Botón "+ Agregar otra actividad" -->

<!-- AGREGAR en EFC -->
<div class="frequency-item">
  <label>Delivery/Restaurante</label>
  <div class="frequency-buttons">0 1 2 3 4 5 6 7</div>
</div>
```

### patient-intake.js (5 cambios)
```javascript
// 1. Autocompletar R24hrs
function searchAlimento(query) {
  // Buscar en base de datos
  // Auto-seleccionar grupo y subgrupo
}

// 2. Toggle deselección
function toggleSelection(element) {
  if (element.classList.contains('selected')) {
    element.classList.remove('selected');
  } else {
    element.classList.add('selected');
  }
}

// 3. Validación visual de campos faltantes
function validateForm() {
  const required = ['nombre', 'fecha_nacimiento', 'sexo', 'motivo_consulta'];
  const missing = [];
  required.forEach(field => {
    if (!document.querySelector(`[name="${field}"]`).value) {
      missing.push(field);
      // Agregar clase error visual
    }
  });
  if (missing.length > 0) {
    showError(`Campos faltantes: ${missing.join(', ')}`);
    return false;
  }
  return true;
}

// 4. Múltiples actividades físicas
function addActivityRow() {
  // Clonar template de actividad
  // Agregar al contenedor
}

// 5. Cálculo líquidos
function calcularLiquidos(getKcal) {
  return getKcal * 1; // 1ml por kcal
}
```

### recipe_generator_v2.py (4 cambios)
```python
# 1. Filtro de alergias/intolerancias
def filter_by_allergies(ingredients, patient_allergies):
    return [i for i in ingredients if i['name'] not in patient_allergies]

# 2. Restricciones por tiempo de comida
MEAL_RESTRICTIONS = {
    'almuerzo': ['cereales_desayuno', 'natur', 'granola'],
    'cena': ['cereales_desayuno', 'natur'],
}

# 3. Lógica de combinaciones
def validate_combination(ingredients):
    # Si hay pan, debe haber proteína o grasa
    has_bread = any('pan' in i['name'].lower() for i in ingredients)
    has_protein_fat = any(i['category'] in ['proteinas', 'grasas'] for i in ingredients)
    if has_bread and not has_protein_fat:
        # Agregar proteína/grasa sugerida
        pass

# 4. Exclusión de restricciones alimentarias
def apply_dietary_restrictions(ingredients, restrictions):
    if 'vegano' in restrictions:
        # Excluir todos los productos animales
    if 'sin_gluten' in restrictions:
        # Excluir trigo, cebada, centeno
```

### templates/index.html (Landing - Estructura Nueva)
```html
<!-- HERO PRINCIPAL -->
<section class="hero-software">
  <h1>BiteTrack</h1>
  <h2>Software 360° para Profesionales de la Nutrición</h2>
  <p>Automatiza toda la gestión de tu consulta nutricional...</p>
  <p class="tagline">Por nutricionistas, para nutricionistas y coaches deportivos</p>
  <div class="cta-buttons">
    <a href="/register" class="btn-primary">Comenzar Gratis</a>
    <a href="#demo" class="btn-secondary">Solicitar Demo</a>
  </div>
</section>

<!-- FEATURES -->
<section class="features">
  <h2>Todo lo que necesitas en una plataforma</h2>
  <!-- 6 feature cards -->
</section>

<!-- CÓMO FUNCIONA -->
<section class="how-it-works">
  <h2>3 pasos para transformar tu consulta</h2>
  <!-- 3 steps -->
</section>

<!-- GENERADOR DE RECETAS (antes era hero) -->
<section class="recipe-generator">
  <h2>Generador de Recetas Inteligentes</h2>
  <p>Crea batidos y recetas personalizadas con IA...</p>
</section>

<!-- PLANES -->
<section class="pricing">
  <!-- Starter, Professional, Enterprise -->
</section>
```

---

## FLUJO NUEVO PROPUESTO (Fase 2)

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO BITETRACK 2.0                          │
└─────────────────────────────────────────────────────────────────┘

1. AGENDAMIENTO
   └── Paciente agenda cita (nombre, RUT, fecha nac, sexo, tel, email)
   └── Sistema crea registro básico

2. FORMULARIO PREVIO (48h antes)
   └── Email automático al paciente
   └── Paciente completa: motivo, antecedentes, EFC, síntomas GI, etc.
   └── Recordatorio 24h si no completa

3. PRE-CONSULTA (Nutricionista)
   └── IA genera resumen con insights
   └── Alertas: "duerme <7hrs", "estrés alto", "bajo consumo pescado"
   └── Gráfico de araña: salud integral

4. CONSULTA
   └── Completar datos faltantes
   └── R24hrs con autocompletado
   └── Análisis IA del consumo
   └── Cálculo de requerimientos

5. PLANIFICACIÓN
   └── Generador de pauta con filtros (alergias, restricciones)
   └── Trabajar sobre R24hrs como base
   └── Ajustes en tiempo real con paciente

6. SEGUIMIENTO
   └── Historial de pautas
   └── Comparativa entre consultas
   └── Métricas de progreso
```

---

## MÉTRICAS DE ÉXITO

### KPIs a Medir Post-Implementación

| Métrica | Objetivo | Cómo Medir |
|---------|----------|------------|
| Tiempo creación ficha | -40% | Analytics en formulario |
| Tasa de error formulario | <5% | Logs de validación |
| Uso formulario previo | >70% | Completados vs enviados |
| Satisfacción UX | >4.5/5 | Encuesta usuarios |
| Retención mensual | >80% | Usuarios activos |

---

## CHANGELOG

| Fecha | Versión | Cambios |
|-------|---------|---------|
| Feb 2026 | 1.0 | Documento inicial con análisis completo |

---

## CONTACTO

**Equipo BiteTrack**
- Desarrollo: [pendiente]
- Producto: [pendiente]
- Soporte: soporte@bitetrack.com

---

*Documento generado a partir del análisis de: BUGS.pdf, Meet Meeting Resumen.txt, Flujograma pacientes.pdf, notas de reunión Alice (WhatsApp), y revisión completa del codebase.*
