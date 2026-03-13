"""
GEMINI AI SERVICE - BiteTrack
==============================
Servicio de IA para alertas nutricionales y chatbot asistente.
Usa Google Gemini API (gratis y confiable).

Configuracion:
    export GEMINI_API_KEY="tu_api_key_aqui"

Obtener API key gratis: https://aistudio.google.com/apikey
"""

import os
import json
from typing import Dict, List, Optional
from datetime import datetime

# Intentar importar google-generativeai
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    print("[WARNING] google-generativeai no instalado. Ejecuta: pip install google-generativeai")


class GeminiService:
    """Servicio de IA con Google Gemini para BiteTrack"""

    def __init__(self):
        self.api_key = os.environ.get("GEMINI_API_KEY")
        self.model = None
        self.model_name = "gemini-2.0-flash"  # Modelo rapido y gratis

        if GEMINI_AVAILABLE and self.api_key:
            try:
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel(self.model_name)
                print(f"[OK] Gemini AI Service inicializado ({self.model_name})")
            except Exception as e:
                print(f"[ERROR] Error inicializando Gemini: {e}")
                self.model = None
        else:
            if not GEMINI_AVAILABLE:
                print("[WARNING] google-generativeai no instalado.")
            elif not self.api_key:
                print("[WARNING] GEMINI_API_KEY no configurada. Alertas IA deshabilitadas.")

    def is_available(self) -> bool:
        """Verifica si el servicio esta disponible"""
        return self.model is not None

    # ============================================
    # ALERTAS NUTRICIONALES
    # ============================================

    def generar_alertas(self, patient_data: Dict) -> List[Dict]:
        """
        Analiza datos del paciente y genera alertas nutricionales.

        Args:
            patient_data: Diccionario con datos del paciente

        Returns:
            Lista de alertas con formato:
            [{"tipo": "warning|danger|info|success", "titulo": "...", "mensaje": "...", "icono": "..."}]
        """
        if not self.is_available():
            return self._alertas_fallback(patient_data)

        try:
            # Preparar datos relevantes para el analisis
            datos_relevantes = self._extraer_datos_relevantes(patient_data)

            prompt = f"""Eres un nutricionista experto analizando datos de un paciente.
Genera entre 3 y 5 alertas nutricionales basadas en estos datos:

DATOS DEL PACIENTE:
{json.dumps(datos_relevantes, indent=2, ensure_ascii=False)}

INSTRUCCIONES:
1. Identifica problemas nutricionales o de salud
2. Prioriza alertas por urgencia (danger > warning > info)
3. Se especifico y accionable en los mensajes
4. Considera interacciones (ej: poco sueno + alto estres = problema)

RESPONDE SOLO EN JSON con este formato exacto:
{{
    "alertas": [
        {{
            "tipo": "danger|warning|info|success",
            "titulo": "Titulo corto (max 6 palabras)",
            "mensaje": "Explicacion y recomendacion (max 2 oraciones)",
            "icono": "nombre-icono-fontawesome"
        }}
    ]
}}

Iconos sugeridos: exclamation-triangle, tint, bed, brain, apple-alt, running, weight, heart, utensils, clock"""

            response = self.model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.3,
                    max_output_tokens=1000,
                )
            )

            # Parsear respuesta
            content = response.text
            # Limpiar markdown si existe
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]

            result = json.loads(content.strip())
            return result.get("alertas", [])

        except Exception as e:
            print(f"[ERROR] Gemini alertas: {e}")
            return self._alertas_fallback(patient_data)

    def _extraer_datos_relevantes(self, patient_data: Dict) -> Dict:
        """Extrae solo los datos relevantes para el analisis"""
        return {
            "nombre": patient_data.get("nombre", "Paciente"),
            "edad": patient_data.get("edad"),
            "sexo": patient_data.get("sexo"),
            "imc": patient_data.get("imc"),
            "categoria_imc": patient_data.get("categoria_imc"),
            "peso_kg": patient_data.get("peso") or patient_data.get("peso_kg"),
            "talla_m": patient_data.get("talla") or patient_data.get("talla_m"),
            "porcentaje_grasa": patient_data.get("porcentaje_grasa"),
            "perimetro_cintura_cm": patient_data.get("perimetro_cintura"),
            "actividad_fisica": patient_data.get("actividad_fisica"),
            "agua_litros_dia": patient_data.get("consumo_agua_litros"),
            "calidad_sueno_1_10": patient_data.get("calidad_sueno"),
            "nivel_estres_1_10": patient_data.get("nivel_estres"),
            "horas_sueno": patient_data.get("horas_sueno"),
            "frecuencia_frutas_semana": patient_data.get("freq_frutas"),
            "frecuencia_verduras_semana": patient_data.get("freq_verduras"),
            "frecuencia_alcohol_semana": patient_data.get("freq_alcohol"),
            "fuma": patient_data.get("fuma"),
            "diagnosticos": patient_data.get("diagnosticos"),
            "alergias": patient_data.get("alergias"),
            "intolerancias": patient_data.get("intolerancias"),
            "restricciones_alimentarias": patient_data.get("restricciones_alimentarias"),
            "objetivo": patient_data.get("objetivos") or patient_data.get("motivo_consulta"),
            "reflujo": patient_data.get("reflujo"),
            "hinchazon": patient_data.get("hinchazon"),
            "consistencia_heces_bristol": patient_data.get("consistencia_heces"),
        }

    def _alertas_fallback(self, patient_data: Dict) -> List[Dict]:
        """Genera alertas basicas sin IA cuando Gemini no esta disponible"""
        alertas = []

        # IMC
        imc = patient_data.get("imc")
        if imc:
            try:
                imc_val = float(imc)
                if imc_val < 18.5:
                    alertas.append({
                        "tipo": "warning",
                        "titulo": "Bajo peso detectado",
                        "mensaje": f"IMC de {imc_val:.1f} indica bajo peso. Evaluar causas y considerar plan hipercalorico.",
                        "icono": "weight"
                    })
                elif imc_val >= 30:
                    alertas.append({
                        "tipo": "danger",
                        "titulo": "Obesidad detectada",
                        "mensaje": f"IMC de {imc_val:.1f} indica obesidad. Priorizar plan de reduccion de peso.",
                        "icono": "weight"
                    })
                elif imc_val >= 25:
                    alertas.append({
                        "tipo": "warning",
                        "titulo": "Sobrepeso",
                        "mensaje": f"IMC de {imc_val:.1f}. Considerar ajustes en alimentacion y actividad fisica.",
                        "icono": "weight"
                    })
            except:
                pass

        # Hidratacion
        agua = patient_data.get("consumo_agua_litros")
        if agua:
            try:
                agua_val = float(agua)
                if agua_val < 1.5:
                    alertas.append({
                        "tipo": "warning",
                        "titulo": "Hidratacion insuficiente",
                        "mensaje": f"Consumo de {agua_val}L/dia. Aumentar a minimo 2L diarios.",
                        "icono": "tint"
                    })
            except:
                pass

        # Sueno
        sueno = patient_data.get("calidad_sueno")
        if sueno:
            try:
                sueno_val = int(sueno)
                if sueno_val <= 4:
                    alertas.append({
                        "tipo": "warning",
                        "titulo": "Mala calidad de sueno",
                        "mensaje": "El sueno deficiente afecta metabolismo y apetito. Evaluar higiene del sueno.",
                        "icono": "bed"
                    })
            except:
                pass

        # Estres
        estres = patient_data.get("nivel_estres")
        if estres:
            try:
                estres_val = int(estres)
                if estres_val >= 7:
                    alertas.append({
                        "tipo": "warning",
                        "titulo": "Alto nivel de estres",
                        "mensaje": "El estres cronico afecta elecciones alimentarias. Considerar tecnicas de manejo.",
                        "icono": "brain"
                    })
            except:
                pass

        if not alertas:
            alertas.append({
                "tipo": "success",
                "titulo": "Sin alertas criticas",
                "mensaje": "No se detectaron problemas urgentes. Continuar con plan actual.",
                "icono": "check-circle"
            })

        return alertas

    # ============================================
    # CHATBOT ASISTENTE
    # ============================================

    def chat(self, mensaje: str, contexto_paciente: Optional[Dict] = None,
             historial: Optional[List[Dict]] = None) -> str:
        """
        Responde mensajes del chatbot asistente.

        Args:
            mensaje: Mensaje del usuario
            contexto_paciente: Datos del paciente actual (opcional)
            historial: Historial de conversacion [{role, content}, ...]

        Returns:
            Respuesta del asistente
        """
        if not self.is_available():
            return "Lo siento, el asistente IA no esta disponible en este momento. Verifica la configuracion de GEMINI_API_KEY."

        try:
            # Construir contexto del sistema
            system_prompt = """Eres BiteBot, un asistente de nutricion para profesionales.

TU ROL:
- Ayudar a nutricionistas con consultas sobre pacientes
- Responder preguntas sobre nutricion clinica
- Sugerir estrategias de tratamiento
- Calcular requerimientos si se piden

REGLAS:
- Se conciso pero informativo (max 3-4 parrafos)
- Usa terminologia profesional pero clara
- Si no sabes algo, dilo honestamente
- No des diagnosticos medicos, solo orientacion nutricional
- Responde en espanol"""

            if contexto_paciente:
                datos = self._extraer_datos_relevantes(contexto_paciente)
                system_prompt += f"""

PACIENTE ACTUAL:
{json.dumps(datos, indent=2, ensure_ascii=False)}

Puedes referenciar estos datos al responder."""

            # Construir el prompt completo
            full_prompt = system_prompt + "\n\n"

            # Agregar historial si existe
            if historial:
                for msg in historial[-10:]:  # Ultimos 10 mensajes
                    role = "Usuario" if msg.get("role") == "user" else "Asistente"
                    full_prompt += f"{role}: {msg.get('content', '')}\n"

            full_prompt += f"Usuario: {mensaje}\nAsistente:"

            response = self.model.generate_content(
                full_prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.7,
                    max_output_tokens=800,
                )
            )

            return response.text

        except Exception as e:
            print(f"[ERROR] Gemini chat: {e}")
            return f"Error al procesar tu mensaje. Por favor intenta de nuevo. ({str(e)[:50]})"

    # ============================================
    # MODIFICAR PAUTA CON IA
    # ============================================

    def modificar_pauta(self, pauta_actual: Optional[Dict], instruccion: str,
                        patient_data: Optional[Dict] = None) -> Dict:
        """
        Modifica o genera una pauta alimentaria usando IA.

        Args:
            pauta_actual: Pauta existente a modificar (None = generar desde cero)
            instruccion: Instruccion en lenguaje natural del nutricionista
            patient_data: Datos del paciente

        Returns:
            Pauta modificada/generada en formato JSON
        """
        if not self.is_available():
            raise RuntimeError("Gemini AI no disponible. Verifica GEMINI_API_KEY.")

        # Extract patient context
        restricciones = []
        get_kcal = 2000
        if patient_data:
            restricciones = patient_data.get('restricciones_alimentarias', [])
            if isinstance(restricciones, str):
                restricciones = [r.strip() for r in restricciones.split(',') if r.strip()]
            get_kcal = patient_data.get('get_kcal') or 2000

        paciente_info = ""
        if patient_data:
            paciente_info = f"""
DATOS DEL PACIENTE:
- Nombre: {patient_data.get('nombre', 'Paciente')}
- Sexo: {patient_data.get('sexo', '')}
- Edad: {patient_data.get('edad', '')}
- Peso: {patient_data.get('peso_kg', '')} kg
- Talla: {patient_data.get('talla_m', '')} m
- GET objetivo: {get_kcal} kcal/dia
- Proteinas objetivo: {patient_data.get('proteinas_g', '')}g
- Carbohidratos objetivo: {patient_data.get('carbohidratos_g', '')}g
- Grasas objetivo: {patient_data.get('grasas_g', '')}g
- Restricciones: {', '.join(restricciones) if restricciones else 'Ninguna'}
- Alergias: {patient_data.get('alergias', 'Ninguna')}
- Intolerancias: {patient_data.get('intolerancias', 'Ninguna')}
- Objetivos: {patient_data.get('objetivos', '')}"""

        schema_example = '''{
  "tipo": "semanal",
  "version": "4.1-ia",
  "generado_en": "2026-03-13T...",
  "paciente": {"id": 1, "nombre": "...", "objetivos": "..."},
  "requerimientos": {"get_kcal": 2000, "proteinas_g": 100, "carbohidratos_g": 250, "grasas_g": 67},
  "dias": {
    "lunes": {
      "tiempos": {
        "desayuno": {
          "nombre": "Desayuno", "hora": "08:00",
          "alimentos": [
            {"nombre": "Pan integral", "cantidad": 2, "medida_casera": "rebanadas", "gramos": 60, "kcal": 140, "proteinas": 5, "carbohidratos": 26, "lipidos": 1.5}
          ],
          "totales": {"kcal": 400, "proteinas": 15, "carbohidratos": 50, "lipidos": 12}
        },
        "colacion_am": {"nombre": "Colación AM", "hora": "10:30", "alimentos": [...], "totales": {...}},
        "almuerzo": {"nombre": "Almuerzo", "hora": "13:00", "alimentos": [...], "totales": {...}},
        "colacion_pm": {"nombre": "Colación PM", "hora": "16:00", "alimentos": [...], "totales": {...}},
        "cena": {"nombre": "Cena", "hora": "20:00", "alimentos": [...], "totales": {...}}
      },
      "totales": {"kcal": 2000, "proteinas": 100, "carbohidratos": 250, "lipidos": 67},
      "cumplimiento_kcal": 100.0
    },
    "martes": {...}, "miercoles": {...}, "jueves": {...}, "viernes": {...}, "sabado": {...}, "domingo": {...}
  },
  "resumen_semanal": {
    "promedio_diario": {"kcal": 2000, "proteinas": 100, "carbohidratos": 250, "lipidos": 67},
    "total_semanal": {"kcal": 14000},
    "cumplimiento_promedio": 100.0
  }
}'''

        if pauta_actual:
            # MODIFY existing pauta
            prompt = f"""Eres un nutricionista clinico experto. Debes MODIFICAR la pauta alimentaria semanal segun la instruccion del profesional.

{paciente_info}

INSTRUCCION DEL NUTRICIONISTA:
{instruccion}

PAUTA ACTUAL A MODIFICAR:
{json.dumps(pauta_actual, ensure_ascii=False)}

REGLAS CRITICAS:
1. Modifica SOLO lo necesario para cumplir la instruccion
2. Mantiene la estructura JSON exacta (mismas keys en todos los niveles)
3. Recalcula los totales de kcal/proteinas/carbohidratos/lipidos en cada tiempo y dia afectado
4. Recalcula resumen_semanal.promedio_diario y cumplimiento_promedio
5. Respeta restricciones y alergias del paciente
6. Mantiene el GET objetivo de {get_kcal} kcal/dia (a menos que la instruccion indique lo contrario)
7. Usa alimentos reales chilenos/latinoamericanos con valores nutricionales realistas
8. Cada alimento DEBE tener: nombre, cantidad, medida_casera, gramos, kcal, proteinas, carbohidratos, lipidos
9. cumplimiento_kcal = (total_kcal_dia / {get_kcal}) * 100

RESPONDE SOLO CON EL JSON COMPLETO DE LA PAUTA MODIFICADA. Sin texto adicional."""
        else:
            # GENERATE from scratch
            prompt = f"""Eres un nutricionista clinico experto. Genera una pauta alimentaria semanal completa basandote en la instruccion del profesional.

{paciente_info}

INSTRUCCION DEL NUTRICIONISTA:
{instruccion}

ESTRUCTURA JSON REQUERIDA (sigue este esquema EXACTAMENTE):
{schema_example}

REGLAS CRITICAS:
1. Genera 7 dias completos (lunes a domingo) con 5 tiempos de comida cada uno
2. Cada alimento DEBE tener: nombre, cantidad, medida_casera, gramos, kcal, proteinas, carbohidratos, lipidos
3. Los valores nutricionales deben ser REALISTAS (no inventados)
4. Usa alimentos reales chilenos/latinoamericanos
5. Respeta el GET de {get_kcal} kcal/dia
6. Respeta restricciones y alergias del paciente
7. Calcula correctamente todos los totales por tiempo, dia y semana
8. cumplimiento_kcal = (total_kcal_dia / {get_kcal}) * 100
9. Varia los alimentos entre dias (no repetir exactamente)

RESPONDE SOLO CON EL JSON COMPLETO. Sin texto adicional."""

        response = self.model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.2,
                max_output_tokens=8000,
            )
        )

        # Parse response
        content = response.text
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]

        result = json.loads(content.strip())

        # Validate required keys
        required_keys = {'tipo', 'dias', 'requerimientos', 'resumen_semanal'}
        missing = required_keys - set(result.keys())
        if missing:
            raise ValueError(f"Respuesta IA incompleta: faltan keys {missing}")

        expected_dias = {'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'}
        if not expected_dias.issubset(set(result.get('dias', {}).keys())):
            raise ValueError("Respuesta IA: dias incompletos")

        # Safety: preserve non-AI fields from original pauta
        if pauta_actual:
            for field in ['configuracion_dieta', 'tiempos_comida', 'paciente', 'version']:
                if field in pauta_actual:
                    result[field] = pauta_actual[field]
            result['version'] = '4.1-ia-mod'
        else:
            result['version'] = '4.1-ia-gen'

        result['generado_en'] = datetime.now().isoformat()

        return result

    def sugerir_preguntas(self, contexto_paciente: Optional[Dict] = None) -> List[str]:
        """Genera preguntas sugeridas basadas en el contexto"""
        preguntas_base = [
            "Que estrategias recomiendas para este paciente?",
            "Como puedo mejorar la adherencia al plan?",
            "Que suplementos podrian beneficiar a este paciente?",
        ]

        if contexto_paciente:
            imc = contexto_paciente.get("imc")
            if imc and float(imc) >= 25:
                preguntas_base.insert(0, "Estrategias para reduccion de peso?")

            agua = contexto_paciente.get("consumo_agua_litros")
            if agua and float(agua) < 1.5:
                preguntas_base.insert(0, "Como aumentar la ingesta de liquidos?")

        return preguntas_base[:4]


# Instancia global del servicio
gemini_service = GeminiService()


# ============================================
# FUNCIONES HELPER (misma interfaz que groq_service)
# ============================================

def generar_alertas_paciente(patient_data: Dict) -> List[Dict]:
    """Wrapper para generar alertas de paciente"""
    return gemini_service.generar_alertas(patient_data)


def chat_con_asistente(mensaje: str, contexto_paciente: Optional[Dict] = None,
                       historial: Optional[List[Dict]] = None) -> str:
    """Wrapper para chatbot"""
    return gemini_service.chat(mensaje, contexto_paciente, historial)


def obtener_sugerencias_chat(contexto_paciente: Optional[Dict] = None) -> List[str]:
    """Wrapper para sugerencias de preguntas"""
    return gemini_service.sugerir_preguntas(contexto_paciente)


def modificar_pauta_ia(pauta_actual, instruccion, patient_data=None):
    """Wrapper para modificar/generar pauta con IA"""
    return gemini_service.modificar_pauta(pauta_actual, instruccion, patient_data)


def ia_disponible() -> bool:
    """Verifica si la IA esta disponible"""
    return gemini_service.is_available()
