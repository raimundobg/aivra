"""
GROQ AI SERVICE - BiteTrack
============================
Servicio de IA para alertas nutricionales y chatbot asistente.
Usa Groq API con Llama 3.1 (gratis y rapido).

Configuracion:
    export GROQ_API_KEY="tu_api_key_aqui"

Obtener API key gratis: https://console.groq.com/keys
"""

import os
import json
from typing import Dict, List, Optional
from datetime import datetime

# Intentar importar groq, si no esta instalado, usar mock
try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False
    print("[WARNING] Groq no instalado. Ejecuta: pip install groq")


class GroqService:
    """Servicio de IA con Groq para BiteTrack"""

    def __init__(self):
        self.api_key = os.environ.get("GROQ_API_KEY")
        self.client = None
        self.model = "llama-3.1-70b-versatile"  # Modelo potente y gratis
        self.model_fast = "llama-3.1-8b-instant"  # Modelo rapido para chat

        if GROQ_AVAILABLE and self.api_key:
            self.client = Groq(api_key=self.api_key)
            print("[OK] Groq AI Service inicializado")
        else:
            print("[WARNING] Groq no configurado. Alertas IA deshabilitadas.")

    def is_available(self) -> bool:
        """Verifica si el servicio esta disponible"""
        return self.client is not None

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

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "Eres un nutricionista experto. Responde SOLO en JSON valido."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=1000
            )

            # Parsear respuesta
            content = response.choices[0].message.content
            # Limpiar markdown si existe
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]

            result = json.loads(content.strip())
            return result.get("alertas", [])

        except Exception as e:
            print(f"[ERROR] Groq alertas: {e}")
            return self._alertas_fallback(patient_data)

    def _extraer_datos_relevantes(self, patient_data: Dict) -> Dict:
        """Extrae solo los datos relevantes para el analisis"""
        return {
            "nombre": patient_data.get("nombre", "Paciente"),
            "edad": patient_data.get("edad"),
            "sexo": patient_data.get("sexo"),
            "imc": patient_data.get("imc"),
            "categoria_imc": patient_data.get("categoria_imc"),
            "peso_kg": patient_data.get("peso"),
            "talla_m": patient_data.get("talla"),
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
        """Genera alertas basicas sin IA cuando Groq no esta disponible"""
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
            return "Lo siento, el asistente IA no esta disponible en este momento. Verifica la configuracion de GROQ_API_KEY."

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

            # Construir mensajes
            messages = [{"role": "system", "content": system_prompt}]

            # Agregar historial si existe
            if historial:
                messages.extend(historial[-10:])  # Ultimos 10 mensajes

            # Agregar mensaje actual
            messages.append({"role": "user", "content": mensaje})

            response = self.client.chat.completions.create(
                model=self.model_fast,  # Modelo rapido para chat
                messages=messages,
                temperature=0.7,
                max_tokens=800
            )

            return response.choices[0].message.content

        except Exception as e:
            print(f"[ERROR] Groq chat: {e}")
            return f"Error al procesar tu mensaje. Por favor intenta de nuevo. ({str(e)[:50]})"

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
groq_service = GroqService()


# ============================================
# FUNCIONES HELPER
# ============================================

def generar_alertas_paciente(patient_data: Dict) -> List[Dict]:
    """Wrapper para generar alertas de paciente"""
    return groq_service.generar_alertas(patient_data)


def chat_con_asistente(mensaje: str, contexto_paciente: Optional[Dict] = None,
                       historial: Optional[List[Dict]] = None) -> str:
    """Wrapper para chatbot"""
    return groq_service.chat(mensaje, contexto_paciente, historial)


def obtener_sugerencias_chat(contexto_paciente: Optional[Dict] = None) -> List[str]:
    """Wrapper para sugerencias de preguntas"""
    return groq_service.sugerir_preguntas(contexto_paciente)


def ia_disponible() -> bool:
    """Verifica si la IA esta disponible"""
    return groq_service.is_available()
