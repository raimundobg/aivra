"""
PAUTA ALIMENTARIA SEMANAL - ALGORITMO INTELIGENTE v4.0
======================================================
Genera planes de alimentación personalizados basados en:
1. Registro 24 Horas (alimentos que el paciente consume)
2. Frecuencia de Consumo Semanal (preferencias)
3. Requerimientos Calóricos y de Macronutrientes
4. Ayuno Intermitente (tiempos de comida activos)

Autor: Sistema MadLab Nutrition
Fecha: Diciembre 2024
"""

import json
import random
from typing import Dict, List, Optional, Set, Tuple
from dataclasses import dataclass, field
from collections import defaultdict
from datetime import datetime

# ============================================
# CONFIGURACIÓN GLOBAL
# ============================================

DIAS_SEMANA = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
DIAS_NOMBRES = {
    'lunes': 'Lunes', 'martes': 'Martes', 'miercoles': 'Miércoles',
    'jueves': 'Jueves', 'viernes': 'Viernes', 'sabado': 'Sábado', 'domingo': 'Domingo'
}

# Distribución calórica por tiempo de comida (por defecto)
DISTRIBUCION_BASE = {
    'desayuno': {'pct': 0.25, 'nombre': 'Desayuno', 'hora': '07:30 - 08:30'},
    'colacion_am': {'pct': 0.10, 'nombre': 'Colación AM', 'hora': '10:30 - 11:00'},
    'almuerzo': {'pct': 0.30, 'nombre': 'Almuerzo', 'hora': '13:00 - 14:00'},
    'colacion_pm': {'pct': 0.10, 'nombre': 'Colación PM', 'hora': '16:30 - 17:00'},
    'cena': {'pct': 0.25, 'nombre': 'Cena', 'hora': '20:00 - 21:00'}
}

# Mapeo de tiempos en registro_24h a tiempos estándar
MAPEO_TIEMPOS = {
    'desayuno': 'desayuno',
    'colacion1': 'colacion_am',
    'colacion_am': 'colacion_am',
    'almuerzo': 'almuerzo',
    'colacion2': 'colacion_pm',
    'colacion_pm': 'colacion_pm',
    'cena': 'cena'
}

# Estructura de comidas por tiempo
ESTRUCTURA_COMIDAS = {
    'desayuno': {
        'grupos_requeridos': ['cereales', 'lacteos'],
        'grupos_opcionales': ['frutas'],
        'descripcion': 'Carbohidratos + Proteína láctea'
    },
    'colacion_am': {
        'grupos_requeridos': ['frutas'],
        'grupos_opcionales': ['frutos_secos'],
        'descripcion': 'Fruta o snack saludable'
    },
    'almuerzo': {
        'grupos_requeridos': ['proteina', 'cereales', 'verduras'],
        'grupos_opcionales': ['grasas'],
        'descripcion': 'Proteína + Carbohidrato + Vegetales'
    },
    'colacion_pm': {
        'grupos_requeridos': ['lacteos'],
        'grupos_opcionales': ['frutas', 'frutos_secos'],
        'descripcion': 'Lácteo o snack'
    },
    'cena': {
        'grupos_requeridos': ['proteina', 'verduras'],
        'grupos_opcionales': ['cereales'],
        'descripcion': 'Proteína + Vegetales (bajo en carbohidratos)'
    }
}

# Rotación de proteínas semanal para variedad
ROTACION_PROTEINAS = {
    'lunes': {'almuerzo': 'pollo', 'cena': 'pescado'},
    'martes': {'almuerzo': 'vacuno', 'cena': 'pollo'},
    'miercoles': {'almuerzo': 'pescado', 'cena': 'huevo'},
    'jueves': {'almuerzo': 'pollo', 'cena': 'vacuno'},
    'viernes': {'almuerzo': 'pescado', 'cena': 'pollo'},
    'sabado': {'almuerzo': 'vacuno', 'cena': 'pescado'},
    'domingo': {'almuerzo': 'pollo', 'cena': 'huevo'}
}


# ============================================
# CLASES DE DATOS
# ============================================

@dataclass
class AlimentoSeleccionado:
    """Representa un alimento seleccionado para la pauta"""
    nombre: str
    grupo: str
    subgrupo: str
    cantidad: float
    medida_casera: str
    kcal: float
    proteinas: float
    carbohidratos: float
    lipidos: float
    es_preferido: bool = False
    
    def to_dict(self) -> Dict:
        return {
            'nombre': self.nombre,
            'grupo': self.grupo,
            'subgrupo': self.subgrupo,
            'cantidad': round(self.cantidad, 1),
            'medida_casera': self.medida_casera,
            'kcal': round(self.kcal, 0),
            'proteinas': round(self.proteinas, 1),
            'carbohidratos': round(self.carbohidratos, 1),
            'lipidos': round(self.lipidos, 1),
            'es_preferido': self.es_preferido
        }


@dataclass
class AlimentoBase:
    """Alimento de la base de datos normalizado"""
    nombre: str
    grupo_original: str
    subgrupo_original: str
    grupo_normalizado: str
    kcal: float
    proteinas: float
    carbohidratos: float
    lipidos: float
    medida_casera: str
    gramos_porcion: float
    keywords: Set[str] = field(default_factory=set)
    
    def __post_init__(self):
        self.keywords = set(
            word.lower() for word in self.nombre.replace(',', ' ').replace('(', ' ').replace(')', ' ').split()
            if len(word) > 2
        )


# ============================================
# CLASE PRINCIPAL: GENERADOR DE PAUTA
# ============================================

class PautaInteligente:
    """Generador de Pauta Alimentaria Semanal Inteligente"""
    
    def __init__(self, patient_data: Dict, alimentos_database: Dict):
        self.patient = patient_data
        self.raw_db = alimentos_database
        
        print(f"\n🗄️ BASE DE DATOS RECIBIDA:")
        print(f"   Grupos: {list(self.raw_db.keys())}")
        
        # 1. Normalizar base de datos
        self.alimentos_db = self._normalizar_database()
        print(f"📦 Base de datos normalizada: {len(self.alimentos_db)} alimentos")
        
        # 2. Extraer TODOS los alimentos del Registro 24h (PRIORIDAD MÁXIMA)
        self.alimentos_paciente = self._extraer_alimentos_registro24h()
        print(f"🎯 Alimentos del paciente: {len(self.alimentos_paciente)}")
        
        # 3. Detectar tiempos activos (ayuno intermitente)
        self.tiempos_activos = self._detectar_tiempos_activos()
        print(f"🍽️ Tiempos activos: {list(self.tiempos_activos['activos'])}")
        
        # 4. Analizar frecuencia de consumo
        self.frecuencia = self._analizar_frecuencia()
        
        # 5. Control de uso diario/semanal
        self.usados_dia = set()
        self.usados_semana = defaultdict(int)
    
    def _normalizar_database(self) -> List[AlimentoBase]:
        """Convierte la base de datos a formato normalizado"""
        
        # Mapeo de grupos originales a grupos simplificados
        # IMPORTANTE: Las claves deben estar normalizadas (sin acentos, con espacios)
        grupo_map = {
            'panes y cereales': 'cereales',
            'panes_y_cereales': 'cereales',
            'cereales': 'cereales',
            'frutas': 'frutas',
            'verduras': 'verduras',
            'carneos y derivados': 'proteina',
            'carneos_y_derivados': 'proteina',
            'cárneos y derivados': 'proteina',
            'cárneos_y_derivados': 'proteina',
            'carnes': 'proteina',
            'pescados': 'proteina',
            'huevos': 'proteina',
            'alternativas proteicas vegetales': 'proteina',
            'alternativas_proteicas_vegetales': 'proteina',
            'legumbres secas': 'legumbres',
            'legumbres_secas': 'legumbres',
            'leguminosas': 'legumbres',
            'lacteos': 'lacteos',
            'lácteos': 'lacteos',
            'grasas': 'grasas',
            'azucares': 'azucares',
            'azúcares': 'azucares',
            'frutos secos': 'frutos_secos',
            'frutos_secos': 'frutos_secos',
        }
        
        alimentos = []
        
        for grupo_original, subgrupos in self.raw_db.items():
            grupo_lower = grupo_original.lower().strip()
            
            # Intentar match directo primero
            grupo_norm = grupo_map.get(grupo_lower)
            
            # Si no hay match, intentar con guiones bajos reemplazados por espacios
            if not grupo_norm:
                grupo_espacios = grupo_lower.replace('_', ' ')
                grupo_norm = grupo_map.get(grupo_espacios)
            
            # Si aún no hay match, usar el original
            if not grupo_norm:
                grupo_norm = grupo_lower
            
            print(f"   📂 Grupo: '{grupo_original}' → '{grupo_norm}'")
            
            if isinstance(subgrupos, dict):
                for subgrupo, items in subgrupos.items():
                    if isinstance(items, list):
                        for item in items:
                            if isinstance(item, dict):
                                alimentos.append(AlimentoBase(
                                    nombre=item.get('nombre', 'Sin nombre'),
                                    grupo_original=grupo_original,
                                    subgrupo_original=subgrupo,
                                    grupo_normalizado=grupo_norm,
                                    kcal=float(item.get('kcal', 0)),
                                    proteinas=float(item.get('proteinas', 0)),
                                    carbohidratos=float(item.get('carbohidratos', 0)),
                                    lipidos=float(item.get('lipidos', 0)),
                                    medida_casera=item.get('medida_casera', '1 porción'),
                                    gramos_porcion=float(item.get('gramos_porcion', 100))
                                ))
        
        return alimentos
    
    def _extraer_alimentos_registro24h(self) -> Dict[str, List[Dict]]:
        """Extrae TODOS los alimentos del registro 24h del paciente"""
        resultado = defaultdict(list)
        
        registro = self.patient.get('registro_24h')
        print(f"\n📋 REGISTRO 24H - Tipo: {type(registro)}")
        
        if not registro:
            print("⚠️ Sin registro 24h")
            return resultado
        
        if isinstance(registro, str):
            print(f"📋 REGISTRO 24H es string, parseando...")
            try:
                registro = json.loads(registro)
                print(f"✅ Parseado correctamente")
            except Exception as e:
                print(f"❌ Error parseando registro 24h: {e}")
                print(f"   Contenido (primeros 500 chars): {registro[:500] if registro else 'vacío'}")
                return resultado
        
        print(f"📋 Keys en registro: {list(registro.keys()) if isinstance(registro, dict) else 'no es dict'}")
        
        print("\n📋 ANALIZANDO REGISTRO 24 HORAS:")
        
        for tiempo_key in ['desayuno', 'colacion1', 'almuerzo', 'colacion2', 'cena']:
            tiempo_norm = MAPEO_TIEMPOS.get(tiempo_key, tiempo_key)
            items = registro.get(tiempo_key, [])
            
            print(f"\n   ⏰ {tiempo_key} → {tiempo_norm}: {len(items) if isinstance(items, list) else 'no es lista'} items")
            
            if not isinstance(items, list):
                print(f"      ⚠️ items no es lista: {type(items)}")
                continue
            
            for i, item in enumerate(items):
                if not isinstance(item, dict):
                    print(f"      ⚠️ item[{i}] no es dict: {type(item)}")
                    continue
                
                grupo = item.get('grupo', '')
                subgrupo = item.get('subgrupo', '')
                # El frontend puede guardar como 'alimento_idx' O como 'alimento'
                alimento_idx = item.get('alimento_idx') or item.get('alimento')
                
                print(f"      📦 Item {i}: grupo='{grupo}', subgrupo='{subgrupo}', alimento={alimento_idx}")
                
                if not grupo:
                    print(f"      ⚠️ Sin grupo, saltando")
                    continue
                
                alimento_encontrado = self._buscar_alimento_en_db(grupo, subgrupo, alimento_idx)
                
                if alimento_encontrado:
                    resultado[tiempo_norm].append({
                        'alimento': alimento_encontrado,
                        'grupo_original': grupo,
                        'subgrupo_original': subgrupo,
                        'tiempo': tiempo_norm
                    })
                    print(f"      ✅ ENCONTRADO: {alimento_encontrado.nombre} (grupo_norm: {alimento_encontrado.grupo_normalizado})")
                else:
                    print(f"      ❌ NO ENCONTRADO")
        
        print(f"\n📊 RESUMEN: {sum(len(v) for v in resultado.values())} alimentos encontrados")
        for t, als in resultado.items():
            alimentos_info = [f"{a['alimento'].nombre}({a['alimento'].grupo_normalizado})" for a in als]
            print(f"   {t}: {alimentos_info}")
        
        return resultado
    
    def _normalizar_texto(self, texto: str) -> str:
        """Normaliza texto para comparación: minúsculas, sin acentos, sin guiones bajos, sin espacios extras"""
        if not texto:
            return ''
        texto = str(texto).lower().strip()
        # Remover acentos y normalizar
        replacements = {
            'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
            'ä': 'a', 'ë': 'e', 'ï': 'i', 'ö': 'o', 'ü': 'u',
            'ñ': 'n', '_': ' ', '-': ' '
        }
        for old, new in replacements.items():
            texto = texto.replace(old, new)
        # Normalizar espacios múltiples a uno solo
        texto = ' '.join(texto.split())
        return texto
    
    def _buscar_alimento_en_db(self, grupo: str, subgrupo: str, alimento_idx) -> Optional[AlimentoBase]:
        """Busca un alimento en la base de datos con matching inteligente"""
        
        grupo_norm = self._normalizar_texto(grupo)
        subgrupo_norm = self._normalizar_texto(subgrupo) if subgrupo else ''
        
        print(f"      🔎 Buscando: grupo='{grupo_norm}', subgrupo='{subgrupo_norm}', idx={alimento_idx}")
        
        # Mapeo de palabras clave para grupos
        grupo_keywords = {
            'carneos': ['carneos', 'carnes', 'carne', 'proteina'],
            'panes': ['panes', 'cereales', 'pan', 'arroz'],
            'lacteos': ['lacteos', 'leche', 'yogurt', 'queso'],
            'verduras': ['verduras', 'verdura', 'vegetales'],
            'frutas': ['frutas', 'fruta'],
            'grasas': ['grasas', 'grasa', 'aceite'],
            'legumbres': ['legumbres', 'leguminosas', 'porotos'],
            'azucares': ['azucares', 'azucar', 'dulces'],
        }
        
        # Mapeo de palabras clave para subgrupos de carnes
        subgrupo_carnes_keywords = {
            'carnes_bajas': ['bajas', 'cbg', 'magro', 'pollo', 'pavo', 'pechuga', 'trutro'],
            'carnes_altas': ['altas', 'cag', 'grasa', 'pescado', 'salmon', 'atun', 'nugget', 'molida'],
        }
        
        for db_grupo, db_subgrupos in self.raw_db.items():
            db_grupo_norm = self._normalizar_texto(db_grupo)
            
            # Match por grupo
            grupo_match = False
            
            # Match exacto o parcial
            if grupo_norm in db_grupo_norm or db_grupo_norm in grupo_norm:
                grupo_match = True
            
            # Match por keywords
            if not grupo_match:
                for key, keywords in grupo_keywords.items():
                    if key in db_grupo_norm:
                        if any(kw in grupo_norm for kw in keywords):
                            grupo_match = True
                            break
            
            if not grupo_match:
                continue
            
            print(f"         ✓ Match grupo: {db_grupo}")
            
            if isinstance(db_subgrupos, dict):
                # Si hay subgrupo específico, buscar match
                best_subgrupo = None
                best_items = None
                
                for db_subgrupo, items in db_subgrupos.items():
                    db_subgrupo_norm = self._normalizar_texto(db_subgrupo)
                    
                    if not isinstance(items, list) or not items:
                        continue
                    
                    # Si no hay subgrupo especificado, tomar el primero válido
                    if not subgrupo_norm:
                        if best_subgrupo is None:
                            best_subgrupo = db_subgrupo
                            best_items = items
                        continue
                    
                    # Match exacto o parcial de subgrupo
                    subgrupo_match = False
                    
                    if subgrupo_norm in db_subgrupo_norm or db_subgrupo_norm in subgrupo_norm:
                        subgrupo_match = True
                    
                    # Match por keywords de carnes
                    if not subgrupo_match and 'carne' in db_grupo_norm:
                        for key, keywords in subgrupo_carnes_keywords.items():
                            if key in db_subgrupo_norm:
                                if any(kw in subgrupo_norm for kw in keywords):
                                    subgrupo_match = True
                                    break
                    
                    if subgrupo_match:
                        best_subgrupo = db_subgrupo
                        best_items = items
                        print(f"         ✓ Match subgrupo: {db_subgrupo}")
                        break
                
                # Si encontramos subgrupo, buscar alimento
                if best_items:
                    if alimento_idx is not None:
                        try:
                            idx = int(alimento_idx)
                            if 0 <= idx < len(best_items):
                                item = best_items[idx]
                                alimento = self._crear_alimento_base(item, db_grupo, best_subgrupo)
                                print(f"         ✓ Alimento encontrado: {alimento.nombre}")
                                return alimento
                        except (ValueError, IndexError):
                            pass
                    
                    # Si no hay idx o es inválido, retornar el primero
                    alimento = self._crear_alimento_base(best_items[0], db_grupo, best_subgrupo)
                    print(f"         ✓ Alimento (default): {alimento.nombre}")
                    return alimento
        
        print(f"         ✗ No encontrado")
        return None
    
    def _crear_alimento_base(self, item: Dict, grupo: str, subgrupo: str) -> AlimentoBase:
        """Crea un AlimentoBase desde un item"""
        grupo_map = {
            'panes y cereales': 'cereales',
            'panes_y_cereales': 'cereales',
            'frutas': 'frutas',
            'verduras': 'verduras',
            'carneos y derivados': 'proteina',
            'carneos_y_derivados': 'proteina',
            'cárneos y derivados': 'proteina',
            'cárneos_y_derivados': 'proteina',
            'lacteos': 'lacteos',
            'lácteos': 'lacteos',
            'grasas': 'grasas',
            'azucares': 'azucares',
            'azúcares': 'azucares',
            'legumbres secas': 'legumbres',
            'legumbres_secas': 'legumbres',
            'alternativas proteicas vegetales': 'proteina',
            'alternativas_proteicas_vegetales': 'proteina',
        }
        
        grupo_lower = grupo.lower().strip()
        grupo_norm = grupo_map.get(grupo_lower)
        if not grupo_norm:
            grupo_espacios = grupo_lower.replace('_', ' ')
            grupo_norm = grupo_map.get(grupo_espacios, grupo_lower)
        
        return AlimentoBase(
            nombre=item.get('nombre', 'Sin nombre'),
            grupo_original=grupo,
            subgrupo_original=subgrupo,
            grupo_normalizado=grupo_norm,
            kcal=float(item.get('kcal', 0)),
            proteinas=float(item.get('proteinas', 0)),
            carbohidratos=float(item.get('carbohidratos', 0)),
            lipidos=float(item.get('lipidos', 0)),
            medida_casera=item.get('medida_casera', '1 porción'),
            gramos_porcion=float(item.get('gramos_porcion', 100))
        )
    
    def _detectar_tiempos_activos(self) -> Dict:
        """Detecta qué tiempos de comida el paciente consume"""
        
        todos_tiempos = {'desayuno', 'colacion_am', 'almuerzo', 'colacion_pm', 'cena'}
        
        if self.alimentos_paciente:
            tiempos_con_alimentos = set(self.alimentos_paciente.keys())
            
            if tiempos_con_alimentos:
                print(f"\n🍽️ TIEMPOS CON ALIMENTOS: {tiempos_con_alimentos}")
                print(f"⏭️ TIEMPOS EXCLUIDOS: {todos_tiempos - tiempos_con_alimentos}")
                
                distribucion = self._redistribuir_calorias(tiempos_con_alimentos)
                
                return {
                    'activos': tiempos_con_alimentos,
                    'distribucion': distribucion
                }
        
        return {
            'activos': todos_tiempos,
            'distribucion': {t: DISTRIBUCION_BASE[t]['pct'] for t in todos_tiempos}
        }
    
    def _redistribuir_calorias(self, tiempos_activos: Set[str]) -> Dict[str, float]:
        """Redistribuye calorías proporcionalmente"""
        total_original = sum(DISTRIBUCION_BASE[t]['pct'] for t in tiempos_activos)
        
        distribucion = {}
        for tiempo in tiempos_activos:
            distribucion[tiempo] = DISTRIBUCION_BASE[tiempo]['pct'] / total_original
        
        return distribucion
    
    def _analizar_frecuencia(self) -> Dict:
        """Analiza la encuesta de frecuencia de consumo"""
        frecuencia = {'alta': [], 'media': [], 'baja': [], 'raw': {}}
        
        freq_data = self.patient.get('frecuencia_consumo')
        if not freq_data:
            return frecuencia
        
        if isinstance(freq_data, str):
            try:
                freq_data = json.loads(freq_data)
            except:
                return frecuencia
        
        frecuencia['raw'] = freq_data
        
        mapeo = {
            'freq_arroz': 'cereales', 'freq_pan': 'cereales', 'freq_pasta': 'cereales',
            'freq_cereales': 'cereales', 'freq_cereales_desayuno': 'cereales',
            'freq_frutas': 'frutas',
            'freq_verduras': 'verduras', 'freq_ensaladas': 'verduras',
            'freq_pollo': 'proteina', 'freq_carne_roja': 'proteina', 
            'freq_cerdo': 'proteina', 'freq_pescado': 'proteina',
            'freq_huevos': 'proteina',
            'freq_legumbres': 'legumbres',
            'freq_leche': 'lacteos', 'freq_yogurt': 'lacteos', 'freq_queso': 'lacteos',
            'freq_aceite': 'grasas', 'freq_frutos_secos': 'frutos_secos',
            'freq_dulces': 'azucares', 'freq_bebidas_azucaradas': 'azucares',
        }
        
        grupo_freq = defaultdict(list)
        for campo, grupo in mapeo.items():
            valor = freq_data.get(campo, 0)
            try:
                valor = int(valor)
            except:
                valor = 0
            
            if valor >= 5:
                grupo_freq['alta'].append(grupo)
            elif valor >= 3:
                grupo_freq['media'].append(grupo)
            elif valor >= 1:
                grupo_freq['baja'].append(grupo)
        
        frecuencia['alta'] = list(set(grupo_freq['alta']))
        frecuencia['media'] = list(set(grupo_freq['media']))
        frecuencia['baja'] = list(set(grupo_freq['baja']))
        
        print(f"\n📊 FRECUENCIA DE CONSUMO:")
        print(f"   Alta (>=5 días): {frecuencia['alta']}")
        print(f"   Media (3-4 días): {frecuencia['media']}")
        
        return frecuencia
    
    def _buscar_alimento_inteligente(self, grupo_requerido: str, kcal_objetivo: float,
                                      tiempo: str, dia: str, 
                                      proteina_tipo: str = None) -> Optional[AlimentoSeleccionado]:
        """
        Busca el mejor alimento usando sistema de prioridad:
        1. Alimento del registro 24h del mismo tiempo (+100)
        2. Alimento del registro 24h de otro tiempo (+50)
        3. Frecuencia alta (+20)
        4. Frecuencia media (+10)
        """
        
        candidatos = []
        
        # Obtener alimentos del paciente
        alimentos_tiempo = self.alimentos_paciente.get(tiempo, [])
        alimentos_otros = []
        for t, als in self.alimentos_paciente.items():
            if t != tiempo:
                alimentos_otros.extend(als)
        
        # Debug: mostrar alimentos del paciente disponibles
        if grupo_requerido == 'proteina':
            print(f"      🥩 Buscando proteína para {tiempo}")
            print(f"         Alimentos paciente en {tiempo}: {[a['alimento'].nombre for a in alimentos_tiempo]}")
            print(f"         Alimentos paciente otros: {[a['alimento'].nombre for a in alimentos_otros]}")
        
        # Buscar en base de datos
        for alimento in self.alimentos_db:
            if not self._match_grupo(alimento.grupo_normalizado, grupo_requerido):
                continue
            
            if proteina_tipo and grupo_requerido == 'proteina':
                if not self._match_proteina(alimento, proteina_tipo):
                    continue
            
            alimento_id = f"{alimento.nombre}_{alimento.subgrupo_original}"
            if alimento_id in self.usados_dia:
                continue
            
            score = 1
            es_preferido = False
            
            # MÁXIMA PRIORIDAD: Alimento del registro 24h mismo tiempo
            for al_pac in alimentos_tiempo:
                if self._match_alimento(alimento, al_pac['alimento']):
                    score += 100
                    es_preferido = True
                    if grupo_requerido == 'proteina':
                        print(f"         🎯 Match exacto: {alimento.nombre} con {al_pac['alimento'].nombre}")
                    break
            
            # ALTA PRIORIDAD: Alimento del registro 24h otro tiempo
            if not es_preferido:
                for al_pac in alimentos_otros:
                    if self._match_alimento(alimento, al_pac['alimento']):
                        score += 50
                        es_preferido = True
                        break
            
            # Frecuencia alta
            if alimento.grupo_normalizado in self.frecuencia.get('alta', []):
                score += 20
            
            # Frecuencia media
            if alimento.grupo_normalizado in self.frecuencia.get('media', []):
                score += 10
            
            candidatos.append({
                'alimento': alimento,
                'score': score,
                'es_preferido': es_preferido,
                'id': alimento_id
            })
        
        if not candidatos:
            print(f"      ⚠️ NO hay candidatos para {grupo_requerido}")
            return None
        
        candidatos.sort(key=lambda x: x['score'], reverse=True)
        
        # Debug
        if candidatos[0]['score'] > 1 or grupo_requerido == 'proteina':
            print(f"      🔍 Top para {grupo_requerido}: {candidatos[0]['alimento'].nombre} (score: {candidatos[0]['score']}, grupo_norm: {candidatos[0]['alimento'].grupo_normalizado})")
        
        # Seleccionar con preferencia por los de mayor score
        if candidatos[0]['score'] >= 50:
            seleccionado = candidatos[0]
        else:
            top = candidatos[:min(3, len(candidatos))]
            seleccionado = random.choice(top)
        
        self.usados_dia.add(seleccionado['id'])
        self.usados_semana[seleccionado['id']] += 1
        
        return self._crear_alimento_seleccionado(
            seleccionado['alimento'], 
            kcal_objetivo, 
            seleccionado['es_preferido']
        )
    
    def _match_grupo(self, grupo_alimento: str, grupo_requerido: str) -> bool:
        """Verifica si un grupo coincide"""
        g1 = grupo_alimento.lower().strip()
        g2 = grupo_requerido.lower().strip()
        
        # Match exacto
        if g1 == g2:
            return True
        
        # Match para proteínas (el grupo normalizado debería ser 'proteina')
        if g2 == 'proteina':
            if g1 in ['proteina', 'carnes', 'pescados', 'huevos', 'carneos', 'carneos_y_derivados']:
                return True
            # También verificar si contiene palabras clave
            if 'carne' in g1 or 'pescado' in g1 or 'huevo' in g1 or 'pollo' in g1:
                return True
        
        # Match para cereales
        if g2 == 'cereales':
            if g1 in ['cereales', 'panes', 'panes_y_cereales', 'arroz', 'pasta']:
                return True
            if 'cereal' in g1 or 'pan' in g1:
                return True
        
        # Match para lácteos
        if g2 == 'lacteos':
            if g1 in ['lacteos', 'lácteos', 'leche', 'yogurt', 'queso']:
                return True
        
        return False
    
    def _match_proteina(self, alimento: AlimentoBase, tipo: str) -> bool:
        """Verifica si es del tipo de proteína especificado"""
        nombre_lower = alimento.nombre.lower()
        subgrupo_lower = alimento.subgrupo_original.lower()
        
        if tipo == 'pollo':
            return 'pollo' in nombre_lower or 'pavo' in nombre_lower or 'ave' in subgrupo_lower or 'nugget' in nombre_lower
        elif tipo == 'vacuno':
            return 'vacuno' in nombre_lower or 'res' in nombre_lower or 'carne' in nombre_lower
        elif tipo == 'pescado':
            return 'pescado' in nombre_lower or 'salmon' in nombre_lower or 'atun' in nombre_lower
        elif tipo == 'cerdo':
            return 'cerdo' in nombre_lower
        elif tipo == 'huevo':
            return 'huevo' in nombre_lower
        
        return True
    
    def _match_alimento(self, alimento: AlimentoBase, alimento_paciente: AlimentoBase) -> bool:
        """Verifica si dos alimentos son similares"""
        if alimento.nombre.lower() == alimento_paciente.nombre.lower():
            return True
        
        common_keywords = alimento.keywords & alimento_paciente.keywords
        if len(common_keywords) >= 2:
            return True
        
        if alimento.nombre.lower() in alimento_paciente.nombre.lower():
            return True
        if alimento_paciente.nombre.lower() in alimento.nombre.lower():
            return True
        
        return False
    
    def _crear_alimento_seleccionado(self, alimento: AlimentoBase, kcal_objetivo: float, 
                                      es_preferido: bool) -> AlimentoSeleccionado:
        """Crea alimento con cantidad ajustada"""
        
        if alimento.kcal > 0:
            cantidad = kcal_objetivo / alimento.kcal
            cantidad = max(0.5, min(cantidad, 4.0))
            cantidad = round(cantidad * 4) / 4
        else:
            cantidad = 1.0
        
        return AlimentoSeleccionado(
            nombre=alimento.nombre,
            grupo=alimento.grupo_original,
            subgrupo=alimento.subgrupo_original,
            cantidad=cantidad,
            medida_casera=alimento.medida_casera,
            kcal=alimento.kcal * cantidad,
            proteinas=alimento.proteinas * cantidad,
            carbohidratos=alimento.carbohidratos * cantidad,
            lipidos=alimento.lipidos * cantidad,
            es_preferido=es_preferido
        )
    
    def _generar_tiempo_comida(self, tiempo: str, kcal_objetivo: float, dia: str) -> Dict:
        """Genera un tiempo de comida completo"""
        
        config = DISTRIBUCION_BASE[tiempo]
        estructura = ESTRUCTURA_COMIDAS.get(tiempo, {})
        
        grupos_requeridos = estructura.get('grupos_requeridos', ['cereales'])
        grupos_opcionales = estructura.get('grupos_opcionales', [])
        
        n_grupos = len(grupos_requeridos)
        kcal_por_grupo = kcal_objetivo / n_grupos if n_grupos > 0 else kcal_objetivo
        
        alimentos = []
        kcal_acumulado = 0
        
        proteina_tipo = None
        if tiempo in ['almuerzo', 'cena']:
            rotacion = ROTACION_PROTEINAS.get(dia, {})
            proteina_tipo = rotacion.get(tiempo)
        
        for grupo in grupos_requeridos:
            alimento = self._buscar_alimento_inteligente(
                grupo, kcal_por_grupo, tiempo, dia, proteina_tipo
            )
            if alimento:
                alimentos.append(alimento)
                kcal_acumulado += alimento.kcal
        
        if kcal_acumulado < kcal_objetivo * 0.8 and grupos_opcionales:
            deficit = kcal_objetivo - kcal_acumulado
            for grupo in grupos_opcionales:
                if kcal_acumulado >= kcal_objetivo * 0.95:
                    break
                alimento = self._buscar_alimento_inteligente(
                    grupo, deficit / 2, tiempo, dia
                )
                if alimento:
                    alimentos.append(alimento)
                    kcal_acumulado += alimento.kcal
        
        totales = {
            'kcal': round(sum(a.kcal for a in alimentos), 0),
            'proteinas': round(sum(a.proteinas for a in alimentos), 1),
            'carbohidratos': round(sum(a.carbohidratos for a in alimentos), 1),
            'lipidos': round(sum(a.lipidos for a in alimentos), 1)
        }
        
        return {
            'nombre': config['nombre'],
            'hora': config['hora'],
            'alimentos': [a.to_dict() for a in alimentos],
            'totales': totales,
            'alimentos_preferidos': sum(1 for a in alimentos if a.es_preferido)
        }
    
    def _generar_dia(self, dia: str, get_kcal: float) -> Dict:
        """Genera la pauta de un día completo"""
        
        self.usados_dia = set()
        tiempos = {}
        
        print(f"\n📅 Generando {DIAS_NOMBRES[dia]}:")
        
        for tiempo in self.tiempos_activos['activos']:
            pct = self.tiempos_activos['distribucion'][tiempo]
            kcal_tiempo = get_kcal * pct
            
            print(f"   {tiempo}: {kcal_tiempo:.0f} kcal ({pct*100:.0f}%)")
            
            tiempos[tiempo] = self._generar_tiempo_comida(tiempo, kcal_tiempo, dia)
        
        total_kcal = sum(t['totales']['kcal'] for t in tiempos.values())
        total_prot = sum(t['totales']['proteinas'] for t in tiempos.values())
        total_carbs = sum(t['totales']['carbohidratos'] for t in tiempos.values())
        total_lip = sum(t['totales']['lipidos'] for t in tiempos.values())
        
        return {
            'nombre': DIAS_NOMBRES[dia],
            'tiempos': tiempos,
            'totales': {
                'kcal': round(total_kcal, 0),
                'proteinas': round(total_prot, 1),
                'carbohidratos': round(total_carbs, 1),
                'lipidos': round(total_lip, 1)
            },
            'cumplimiento_kcal': round((total_kcal / get_kcal) * 100, 1) if get_kcal else 0
        }
    
    def _get_requerimientos(self) -> Dict:
        """Obtiene los requerimientos nutricionales"""
        
        get_kcal = self.patient.get('get_kcal')
        
        if not get_kcal:
            get_kcal = self._calcular_get()
        
        get_kcal = float(get_kcal or 2000)
        
        proteinas = self.patient.get('proteinas_g') or (get_kcal * 0.15) / 4
        carbohidratos = self.patient.get('carbohidratos_g') or (get_kcal * 0.55) / 4
        grasas = self.patient.get('grasas_g') or (get_kcal * 0.30) / 9
        
        return {
            'get_kcal': round(get_kcal, 0),
            'proteinas_g': round(proteinas, 1),
            'carbohidratos_g': round(carbohidratos, 1),
            'grasas_g': round(grasas, 1),
            'fibra_g': round(self.patient.get('fibra_g') or 25, 1),
            'liquido_ml': round(self.patient.get('liquido_ml') or 2000, 0)
        }
    
    def _calcular_get(self) -> float:
        """Calcula el GET usando Harris-Benedict"""
        peso = self.patient.get('peso_kg')
        talla = self.patient.get('talla_m')
        edad = self.patient.get('edad')
        sexo = self.patient.get('sexo', '').lower()
        
        if not all([peso, talla, edad]):
            return 2000
        
        talla_cm = float(talla) * 100 if float(talla) < 3 else float(talla)
        peso = float(peso)
        edad = int(edad)
        
        if sexo in ['m', 'masculino', 'hombre']:
            geb = 88.362 + (13.397 * peso) + (4.799 * talla_cm) - (5.677 * edad)
        else:
            geb = 447.593 + (9.247 * peso) + (3.098 * talla_cm) - (4.330 * edad)
        
        factor = float(self.patient.get('factor_actividad') or 1.4)
        return round(geb * factor, 0)
    
    def generar(self) -> Dict:
        """Genera la pauta semanal completa"""
        
        print("\n" + "="*60)
        print("🍽️ GENERANDO PAUTA ALIMENTARIA SEMANAL v4.0")
        print("="*60)
        
        requerimientos = self._get_requerimientos()
        print(f"\n📊 REQUERIMIENTOS:")
        print(f"   GET: {requerimientos['get_kcal']} kcal")
        print(f"   Proteínas: {requerimientos['proteinas_g']}g")
        
        dias = {}
        for dia in DIAS_SEMANA:
            dias[dia] = self._generar_dia(dia, requerimientos['get_kcal'])
        
        promedio_kcal = sum(d['totales']['kcal'] for d in dias.values()) / 7
        promedio_prot = sum(d['totales']['proteinas'] for d in dias.values()) / 7
        promedio_carbs = sum(d['totales']['carbohidratos'] for d in dias.values()) / 7
        promedio_lip = sum(d['totales']['lipidos'] for d in dias.values()) / 7
        cumplimiento = round((promedio_kcal / requerimientos['get_kcal']) * 100, 1)
        
        print(f"\n📈 RESUMEN SEMANAL:")
        print(f"   Promedio diario: {promedio_kcal:.0f} kcal")
        print(f"   Cumplimiento: {cumplimiento}%")
        
        total_preferidos = sum(
            sum(t.get('alimentos_preferidos', 0) for t in d['tiempos'].values())
            for d in dias.values()
        )
        
        return {
            'tipo': 'semanal',
            'version': '4.0',
            'generado_en': datetime.now().isoformat(),
            'paciente': {
                'id': self.patient.get('id'),
                'nombre': self.patient.get('nombre'),
                'objetivos': self.patient.get('objetivos')
            },
            'requerimientos': requerimientos,
            'tiempos_comida': {
                'activos': list(self.tiempos_activos['activos']),
                'excluidos': [t for t in DISTRIBUCION_BASE.keys() if t not in self.tiempos_activos['activos']],
                'distribucion': {k: round(v * 100, 1) for k, v in self.tiempos_activos['distribucion'].items()}
            },
            'alimentos_paciente': {
                'total_usados': total_preferidos,
                'por_tiempo': {t: len(als) for t, als in self.alimentos_paciente.items()}
            },
            'dias': dias,
            'resumen_semanal': {
                'promedio_diario': {
                    'kcal': round(promedio_kcal, 0),
                    'proteinas': round(promedio_prot, 1),
                    'carbohidratos': round(promedio_carbs, 1),
                    'lipidos': round(promedio_lip, 1)
                },
                'total_semanal': {
                    'kcal': round(promedio_kcal * 7, 0),
                    'proteinas': round(promedio_prot * 7, 1),
                    'carbohidratos': round(promedio_carbs * 7, 1),
                    'lipidos': round(promedio_lip * 7, 1)
                },
                'cumplimiento_promedio': cumplimiento
            }
        }


# ============================================
# FUNCIONES HELPER PARA COMPATIBILIDAD
# ============================================

def generar_pauta_alimentaria(patient_dict: Dict, alimentos_db: Dict) -> Dict:
    """Genera una pauta alimentaria semanal"""
    generator = PautaInteligente(patient_dict, alimentos_db)
    return generator.generar()


# Alias para compatibilidad
PautaGenerator = PautaInteligente
PautaSemanalGenerator = PautaInteligente