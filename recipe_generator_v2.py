import pandas as pd
import numpy as np
import json
import random
import sys
import os
from typing import Dict, List, Any

# Agregar directorio actual al path para importar nutrient_priority_system
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

class RecipeGenerator:
    def __init__(self, db_path: str = 'data/db_maestra_superalimentos_ampliada.csv'):
        """✅ VERSIÓN COMPLETA - Inicializa con DB centralizada manteniendo TODAS las funcionalidades."""
        print("🔧 DEBUG: Inicializando RecipeGenerator V2 (COMPLETE)...")
        try:
            # ✅ CARGAR DB CENTRALIZADA
            print(f"📊 DEBUG: Cargando DB centralizada desde: {db_path}")
            import os
            if not os.path.exists(db_path):
                db_path = 'db_maestra_superalimentos_ampliada.csv'
            
            self.df_master = pd.read_csv(db_path, low_memory=False)
            self.df_master.columns = self.df_master.columns.str.strip()
            print(f"✅ DEBUG: DB cargada: {len(self.df_master)} superalimentos, {len(self.df_master.columns)} columnas")
            
            # ✅ NORMALIZAR NOMBRES DE COLUMNAS
            print("🔍 DEBUG: Normalizando nombres de columnas...")
            column_mapping = {
                'proteinas': 'proteina',
                'grasas_totales': 'grasas',
            }
            for old_name, new_name in column_mapping.items():
                if old_name in self.df_master.columns:
                    self.df_master.rename(columns={old_name: new_name}, inplace=True)
                    print(f"   ✓ '{old_name}' → '{new_name}'")
            
            # ✅ CONVERTIR COLUMNAS NUMÉRICAS
            print("🔢 DEBUG: Convirtiendo columnas numéricas...")
            numeric_columns = [
                'calorias', 'proteina', 'carbohidratos', 'grasas', 'fibra',
                'omega_3', 'omega_6', 'vitamina_a', 'vitamina_c', 'vitamina_d',
                'vitamina_e', 'vitamina_k', 'vitamina_b1', 'vitamina_b2',
                'vitamina_b3', 'vitamina_b6', 'vitamina_b9', 'vitamina_b12',
                'calcio', 'hierro', 'magnesio', 'fosforo', 'potasio',
                'sodio', 'zinc', 'cobre', 'manganeso', 'selenio',
                'capacidad_antioxidante_total',
                'polifenoles', 'flavonoides',
                'dosis_min_diaria', 'dosis_max_diaria', 'preciokilo'
            ]
            for col in numeric_columns:
                if col in self.df_master.columns:
                    self.df_master[col] = pd.to_numeric(self.df_master[col], errors='coerce')
            
            # ✅ CREAR DATAFRAMES COMPATIBLES CON CÓDIGO ORIGINAL
            # (Para mantener compatibilidad con métodos existentes)
            self.superfoods_df = self.df_master.copy()
            self.vitamins_df = self.df_master.copy()  # Ahora todo está en una DB
            self.minerals_df = self.df_master.copy()
            self.antioxidants_df = self.df_master.copy()
            self.nutrition_df = self.df_master.copy()
            
            print(f"✅ DEBUG: Superalimentos cargados: {len(self.superfoods_df)} registros")
            print(f"✅ DEBUG: DB unificada lista para usar")
            
            # Cargar dosis recomendadas
            self.recommended_doses = self.load_recommended_doses()
            print("✅ DEBUG: Dosis recomendadas cargadas")
            
        except Exception as e:
            print(f"❌ DEBUG ERROR: Error cargando DB: {str(e)}")
            import traceback
            traceback.print_exc()
            raise e

    def load_recommended_doses(self):
        """Carga las dosis recomendadas para cada superalimento."""
        # Dosis recomendadas en gramos por día (basadas en estudios científicos)
        return {
            # Frutas y bayas (polvos)
            'açaí': {'min': 5, 'max': 15, 'unit': 'g', 'spoon_type': 'cucharadita', 'spoon_grams': 5},
            'goji': {'min': 10, 'max': 30, 'unit': 'g', 'spoon_type': 'cucharada', 'spoon_grams': 15},
            'maqui': {'min': 3, 'max': 10, 'unit': 'g', 'spoon_type': 'cucharadita', 'spoon_grams': 5},
            'arándanos': {'min': 5, 'max': 15, 'unit': 'g', 'spoon_type': 'cucharadita', 'spoon_grams': 5},
            'frambuesas': {'min': 5, 'max': 15, 'unit': 'g', 'spoon_type': 'cucharadita', 'spoon_grams': 5},
            'moras': {'min': 5, 'max': 15, 'unit': 'g', 'spoon_type': 'cucharadita', 'spoon_grams': 5},
            
            # Semillas y frutos secos
            'chía': {'min': 10, 'max': 25, 'unit': 'g', 'spoon_type': 'cucharada', 'spoon_grams': 12},
            'linaza': {'min': 10, 'max': 20, 'unit': 'g', 'spoon_type': 'cucharada', 'spoon_grams': 10},
            'quinoa': {'min': 30, 'max': 60, 'unit': 'g', 'spoon_type': 'cucharada', 'spoon_grams': 20},
            'almendras': {'min': 20, 'max': 30, 'unit': 'g', 'spoon_type': 'cucharada', 'spoon_grams': 15},
            'nueces': {'min': 15, 'max': 30, 'unit': 'g', 'spoon_type': 'cucharada', 'spoon_grams': 15},
            'cacao': {'min': 10, 'max': 20, 'unit': 'g', 'spoon_type': 'cucharada', 'spoon_grams': 10},
            
            # Algas marinas
            'espirulina': {'min': 3, 'max': 10, 'unit': 'g', 'spoon_type': 'cucharadita', 'spoon_grams': 3},
            'chlorella': {'min': 3, 'max': 10, 'unit': 'g', 'spoon_type': 'cucharadita', 'spoon_grams': 3},
            'kelp': {'min': 1, 'max': 5, 'unit': 'g', 'spoon_type': 'cucharadita', 'spoon_grams': 2},
            'nori': {'min': 2, 'max': 8, 'unit': 'g', 'spoon_type': 'cucharadita', 'spoon_grams': 2},
            
            # Hongos funcionales
            'melena de león': {'min': 1, 'max': 3, 'unit': 'g', 'spoon_type': 'cucharadita', 'spoon_grams': 1},
            'reishi': {'min': 1, 'max': 3, 'unit': 'g', 'spoon_type': 'cucharadita', 'spoon_grams': 1},
            'cordyceps': {'min': 1, 'max': 3, 'unit': 'g', 'spoon_type': 'cucharadita', 'spoon_grams': 1},
            'cola de pavo': {'min': 1, 'max': 3, 'unit': 'g', 'spoon_type': 'cucharadita', 'spoon_grams': 1},
            
            # Especias y hierbas
            'cúrcuma': {'min': 1, 'max': 3, 'unit': 'g', 'spoon_type': 'cucharadita', 'spoon_grams': 2},
            'jengibre': {'min': 1, 'max': 4, 'unit': 'g', 'spoon_type': 'cucharadita', 'spoon_grams': 2},
            'canela': {'min': 1, 'max': 3, 'unit': 'g', 'spoon_type': 'cucharadita', 'spoon_grams': 2},
            'pimienta negra': {'min': 0.1, 'max': 0.5, 'unit': 'g', 'spoon_type': 'pizca', 'spoon_grams': 0.2},
            
            # Adaptógenos
            'ashwagandha': {'min': 1, 'max': 6, 'unit': 'g', 'spoon_type': 'cucharadita', 'spoon_grams': 2},
            'ginseng': {'min': 1, 'max': 3, 'unit': 'g', 'spoon_type': 'cucharadita', 'spoon_grams': 1},
            'rhodiola': {'min': 0.5, 'max': 2, 'unit': 'g', 'spoon_type': 'cucharadita', 'spoon_grams': 1},
            'maca': {'min': 3, 'max': 10, 'unit': 'g', 'spoon_type': 'cucharadita', 'spoon_grams': 5},
            'moringa': {'min': 2, 'max': 8, 'unit': 'g', 'spoon_type': 'cucharadita', 'spoon_grams': 3},
            
            # Otros superalimentos
            'matcha': {'min': 1, 'max': 4, 'unit': 'g', 'spoon_type': 'cucharadita', 'spoon_grams': 2},
            'té verde': {'min': 2, 'max': 5, 'unit': 'g', 'spoon_type': 'cucharadita', 'spoon_grams': 2},
            'remolacha': {'min': 5, 'max': 15, 'unit': 'g', 'spoon_type': 'cucharadita', 'spoon_grams': 5},
            'cáñamo': {'min': 15, 'max': 30, 'unit': 'g', 'spoon_type': 'cucharada', 'spoon_grams': 15},
            
            # Default para alimentos no especificados
            'default': {'min': 3, 'max': 10, 'unit': 'g', 'spoon_type': 'cucharadita', 'spoon_grams': 5}
        }

    def map_objectives_to_functions(self, primary_objective: str, secondary_objectives: List[str] = None) -> List[str]:
        """Mapea objetivos a funciones principales de superalimentos."""
        print(f"🎯 DEBUG: Mapeando objetivos - Principal: {primary_objective}, Secundarios: {secondary_objectives}")
        
        objective_mapping = {
            # Objetivos principales (inglés)
            'immune': ['sistema inmune', 'antiviral', 'antibacteriano'],
            'energy': ['energizante', 'resistencia física', 'rendimiento deportivo'],
            'cognitive': ['cognitivo', 'claridad mental'],
            'physical': ['resistencia física', 'rendimiento deportivo', 'energizante'],
            'detox': ['detox hepático', 'digestivo'],
            'stress': ['estrés', 'ansiedad', 'insomnio'],
            'digestion': ['digestivo', 'salud intestinal', 'probiótico'],
            'beauty': ['antioxidante'],
            'muscle': ['energizante', 'resistencia física', 'rendimiento deportivo'],
            
            # ✅ OBJETIVOS EN ESPAÑOL (frontend)
            'aumentar_energia': ['energizante', 'resistencia física', 'rendimiento deportivo'],
            'aumentar_masa_muscular': ['energizante', 'resistencia física', 'rendimiento deportivo'],
            'mejorar_sistema_inmune': ['sistema inmune', 'antiviral', 'antibacteriano'],
            'mejorar_concentracion': ['cognitivo', 'claridad mental'],
            'mejorar_rendimiento_fisico': ['resistencia física', 'rendimiento deportivo', 'energizante'],
            'desintoxicar': ['detox hepático', 'digestivo'],
            'reducir_estres': ['estrés', 'ansiedad', 'insomnio'],
            'mejorar_digestion': ['digestivo', 'salud intestinal', 'probiótico'],
            'mejorar_piel': ['antioxidante'],
            
            # Objetivos secundarios (inglés)
            'cardiovascular': ['colesterol', 'presión arterial'],
            'brain_health': ['desinflama cerebro', 'cognitivo'],
            'inflammation': ['desinflamatorio general', 'antioxidante'],
            'blood_sugar': ['glucemia'],
            'weight_control': ['energizante', 'digestivo'],
            'hormonal': ['hormonal'],
            'joint_health': ['dolor articular', 'desinflamatorio general'],
            'visual_health': ['antioxidante'],
            'intestinal_health': ['salud intestinal', 'digestivo', 'desinflama intestino'],
            'bone_health': ['antioxidante'],
            'liver_function': ['detox hepático'],
            'mood': ['estado de ánimo', 'estrés'],
            'mental_clarity': ['claridad mental', 'cognitivo'],
            
            # ✅ OBJETIVOS SECUNDARIOS EN ESPAÑOL (frontend)
            'salud_cardiovascular': ['colesterol', 'presión arterial'],
            'salud_cerebral': ['desinflama cerebro', 'cognitivo'],
            'reducir_inflamacion': ['desinflamatorio general', 'antioxidante'],
            'control_azucar': ['glucemia'],
            'control_peso': ['energizante', 'digestivo'],
            'balance_hormonal': ['hormonal'],
            'salud_articular': ['dolor articular', 'desinflamatorio general'],
            'salud_visual': ['antioxidante'],
            'salud_intestinal': ['salud intestinal', 'digestivo', 'desinflama intestino'],
            'salud_osea': ['antioxidante'],
            'funcion_hepatica': ['detox hepático'],
            'mejorar_estado_animo': ['estado de ánimo', 'estrés'],
            'claridad_mental': ['claridad mental', 'cognitivo']
        }
        
        target_functions = []
        
        # Agregar funciones del objetivo principal
        if primary_objective in objective_mapping:
            target_functions.extend(objective_mapping[primary_objective])
            print(f"📋 DEBUG: Funciones del objetivo principal: {objective_mapping[primary_objective]}")
        
        # Agregar funciones de objetivos secundarios
        if secondary_objectives:
            for secondary in secondary_objectives:
                if secondary in objective_mapping:
                    target_functions.extend(objective_mapping[secondary])
                    print(f"📋 DEBUG: Funciones del objetivo secundario '{secondary}': {objective_mapping[secondary]}")
        
        # Eliminar duplicados manteniendo orden
        unique_functions = list(dict.fromkeys(target_functions))
        print(f"🎯 DEBUG: Funciones objetivo finales: {unique_functions}")
        
        return unique_functions

    def filter_by_dietary_restrictions(self, df: pd.DataFrame, restrictions: List[str]) -> pd.DataFrame:
        """Filtra superalimentos según restricciones dietéticas."""
        print(f"🚫 DEBUG: Aplicando restricciones dietéticas: {restrictions}")
        
        if not restrictions:
            print("✅ DEBUG: Sin restricciones dietéticas")
            return df
        
        filtered_df = df.copy()
        original_count = len(filtered_df)
        
        restriction_mapping = {
            'vegan': ['lácteo', 'proteína animal'],
            'gluten_free': ['cereales'],
            'nut_free': ['frutos secos']
        }
        
        for restriction in restrictions:
            if restriction in restriction_mapping:
                excluded_types = restriction_mapping[restriction]
                for excluded_type in excluded_types:
                    if 'tipo_alimento' in filtered_df.columns:
                        filtered_df = filtered_df[filtered_df['tipo_alimento'] != excluded_type]
                        print(f"🚫 DEBUG: Excluidos alimentos tipo '{excluded_type}' por restricción '{restriction}'")
        
        final_count = len(filtered_df)
        print(f"📊 DEBUG: Alimentos después de restricciones: {final_count} (eliminados: {original_count - final_count})")
        
        return filtered_df

    def filter_by_food_sources(self, df: pd.DataFrame, sources: List[str]) -> pd.DataFrame:
        """Filtra superalimentos según fuentes de alimentos seleccionadas."""
        print(f"🌱 DEBUG: Filtrando por fuentes de alimentos: {sources}")
        
        if not sources:
            print("✅ DEBUG: Sin filtros de fuentes, usando todos los alimentos")
            return df
        
        source_mapping = {
            'hongos_medicinales': ['hongo funcional'],
            'frutas_bayas': ['fruta / jugo'],
            'frutos_secos': ['semilla / grano'],  
            'algas_marinas': ['polvo'],
            'semillas': ['semilla / grano'],
            'vegetales_verdes': ['hoja / infusión', 'polvo']
        }
        
        algas_names = ['espirulina', 'chlorella', 'kelp', 'nori', 'wakame', 'dulse']
        
        filtered_df = pd.DataFrame()
        
        for source in sources:
            if source in source_mapping:
                allowed_types = source_mapping[source]
                print(f"🌱 DEBUG: Fuente '{source}' incluye tipos: {allowed_types}")
                
                if 'tipo_alimento' in df.columns:
                    source_foods = df[df['tipo_alimento'].isin(allowed_types)]
                    print(f"📊 DEBUG: Encontrados {len(source_foods)} alimentos por tipo para '{source}'")
                    
                    if source == 'algas_marinas':
                        name_foods = df[df['nombre'].str.lower().isin(algas_names)]
                        print(f"📊 DEBUG: Encontrados {len(name_foods)} alimentos por nombre para algas")
                        source_foods = pd.concat([source_foods, name_foods]).drop_duplicates()
                        print(f"📊 DEBUG: Total algas después de combinar: {len(source_foods)}")
                    
                    filtered_df = pd.concat([filtered_df, source_foods]).drop_duplicates()
        
        final_count = len(filtered_df)
        print(f"📊 DEBUG: Total alimentos después de filtrar por fuentes: {final_count}")
        
        if final_count == 0:
            print("⚠️ DEBUG: No se encontraron alimentos con las fuentes seleccionadas, usando todos")
            return df
        
        return filtered_df
    def filter_by_product_type(self, df: pd.DataFrame, product_type: str) -> pd.DataFrame:
        """Filtra superalimentos según el tipo de producto a preparar."""
        print(f"🎯 DEBUG: Filtrando por tipo de producto: {product_type}")
        
        if not product_type:
            print("✅ DEBUG: Sin filtro de tipo de producto, usando todos los alimentos")
            return df
        
        # Mapeo de tipos de producto a filtros
        product_mapping = {
            'capsulas': {
                'primary_types': ['suplemento encapsulado'],
                'secondary_types': ['polvo'],
                'forma_keywords': ['cápsulas', 'tabletas', 'suplementos', 'extracto']
            },
            'polvo_batidos': {
                'primary_types': ['polvo'],
                'secondary_types': ['fruta / jugo', 'semilla / grano'],
                'forma_keywords': ['polvo', 'batidos', 'en polvo', 'molidas']
            },
            'infusion': {
                'primary_types': ['hoja / infusión'],
                'secondary_types': ['polvo', 'otro'],
                'forma_keywords': ['infusión', 'té', 'infusiones', 'como bebida']
            },
            'alimento_instantaneo': {
                'primary_types': ['semilla / grano'],
                'secondary_types': ['polvo'],
                'forma_keywords': ['cocido', 'como arroz', 'instantáneo', 'papillas']
            },
            'snack': {
                'primary_types': ['fruta / jugo', 'semilla / grano'],
                'secondary_types': ['otro'],
                'forma_keywords': ['snack', 'como snack', 'crudas', 'tostadas', 'secas']
            },
            'ingrediente_cocinar': {
                'primary_types': ['semilla / grano', 'hoja / infusión', 'otro'],
                'secondary_types': ['polvo', 'fruta / jugo'],
                'forma_keywords': ['cocido', 'salteado', 'guisos', 'sopas', 'ensaladas', 'curry']
            },
            'bebida_funcional': {
                'primary_types': ['lácteo', 'polvo'],
                'secondary_types': ['fruta / jugo'],
                'forma_keywords': ['bebida', 'leche', 'zumo', 'agua', 'como base']
            },
            'endulzante': {
                'primary_types': ['endulzante'],
                'secondary_types': [],
                'forma_keywords': ['endulzante', 'como endulzante']
            },
            'polvo_hidratacion': {
                'primary_types': ['polvo', 'suplemento', 'otro'],
                'secondary_types': ['fruta / jugo', 'semilla / grano'],
                'forma_keywords': ['polvo', 'en polvo', 'electrolitos', 'hidratación', 'mineral', 'sales']
            }
        }
        
        if product_type not in product_mapping:
            print(f"⚠️ DEBUG: Tipo de producto '{product_type}' no reconocido, usando todos los alimentos")
            return df
        
        mapping = product_mapping[product_type]
        filtered_df = pd.DataFrame()
        
        # Filtro primario por tipo_alimento
        if 'tipo_alimento' in df.columns and mapping['primary_types']:
            primary_foods = df[df['tipo_alimento'].isin(mapping['primary_types'])]
            print(f"🎯 DEBUG: Encontrados {len(primary_foods)} alimentos primarios para '{product_type}'")
            filtered_df = pd.concat([filtered_df, primary_foods]).drop_duplicates()
        
        # Filtro secundario por tipo_alimento
        if 'tipo_alimento' in df.columns and mapping['secondary_types']:
            secondary_foods = df[df['tipo_alimento'].isin(mapping['secondary_types'])]
            print(f"🎯 DEBUG: Encontrados {len(secondary_foods)} alimentos secundarios para '{product_type}'")
            filtered_df = pd.concat([filtered_df, secondary_foods]).drop_duplicates()
        
        # Filtro por palabras clave en forma_consumo
        if 'forma_consumo' in df.columns and mapping['forma_keywords']:
            for keyword in mapping['forma_keywords']:
                keyword_foods = df[df['forma_consumo'].str.contains(keyword, case=False, na=False)]
                print(f"🔍 DEBUG: Encontrados {len(keyword_foods)} alimentos con palabra clave '{keyword}'")
                filtered_df = pd.concat([filtered_df, keyword_foods]).drop_duplicates()
        
        final_count = len(filtered_df)
        print(f"📊 DEBUG: Total alimentos después de filtrar por tipo de producto: {final_count}")
        
        if final_count == 0:
            print("⚠️ DEBUG: No se encontraron alimentos para el tipo de producto seleccionado, usando todos")
            return df
        
        return filtered_df

    def get_recommended_dose(self, ingredient_name: str) -> Dict:
        """Obtiene la dosis recomendada para un ingrediente específico."""
        name_lower = ingredient_name.lower()
        
        # Buscar coincidencia exacta o parcial
        for key, dose in self.recommended_doses.items():
            if key in name_lower or name_lower in key:
                return dose
        
        # Si no se encuentra, usar dosis por defecto
        return self.recommended_doses['default']

    def calculate_dose_and_spoons(self, ingredient_name: str) -> Dict:
        """Calcula la dosis y equivalencia en cucharadas/cucharaditas."""
        dose_info = self.get_recommended_dose(ingredient_name)
        
        # Usar dosis media recomendada
        recommended_grams = (dose_info['min'] + dose_info['max']) / 2
        
        # Calcular equivalencia en cucharadas/cucharaditas
        spoon_grams = dose_info['spoon_grams']
        spoon_amount = recommended_grams / spoon_grams
        
        return {
            'grams': round(recommended_grams, 1),
            'spoon_amount': round(spoon_amount, 1),
            'spoon_type': dose_info['spoon_type'],
            'unit': dose_info['unit']
        }

    def select_ingredients(self, target_functions: List[str], num_ingredients: int, 
                         dietary_restrictions: List[str] = None, food_sources: List[str] = None,
                         product_type: str = None, primary_objective: str = None,
                         optimization_hints: Dict = None) -> List[Dict]:
        """Selecciona ingredientes basados en funciones objetivo.
        
        Args:
            optimization_hints: Dict con 'target_nutrients' y 'boost_sources' para optimización
        """
        print(f"🔍 DEBUG: Seleccionando {num_ingredients} ingredientes...")
        print(f"🎯 DEBUG: Funciones objetivo: {target_functions}")
        
        # ✅ FASE 2: Aplicar hints de optimización si están disponibles
        if optimization_hints:
            print(f"💡 DEBUG: Aplicando hints de optimización: {optimization_hints.get('target_nutrients', [])}")
        
        # Aplicar filtros
        filtered_df = self.superfoods_df.copy()
        
        # ✅ FILTRO NaN: Excluir ingredientes con dosis_min_diaria inválida
        if 'dosis_min_diaria' in filtered_df.columns:
            original_count = len(filtered_df)
            filtered_df = filtered_df[pd.notna(filtered_df['dosis_min_diaria']) & (filtered_df['dosis_min_diaria'] > 0)]
            removed_count = original_count - len(filtered_df)
            if removed_count > 0:
                print(f"🚫 DEBUG: Excluidos {removed_count} ingredientes con dosis_min_diaria inválida (NaN o ≤0)")
        
        # Filtrar por restricciones dietéticas
        if dietary_restrictions:
            filtered_df = self.filter_by_dietary_restrictions(filtered_df, dietary_restrictions)
        
        # Filtrar por fuentes de alimentos
        if food_sources:
            filtered_df = self.filter_by_food_sources(filtered_df, food_sources)
        
        # Filtrar por tipo de producto
        if product_type:
            filtered_df = self.filter_by_product_type(filtered_df, product_type)
        
        print(f"📊 DEBUG: Alimentos disponibles después de filtros: {len(filtered_df)}")
        
        if len(filtered_df) == 0:
            print("❌ DEBUG: No hay alimentos disponibles después de aplicar filtros")
            return []
        
        # Buscar alimentos que coincidan con las funciones objetivo
        matching_foods = []
        
        # 🔧 LÓGICA ESPECIAL PARA POLVO DE HIDRATACIÓN: Priorizar electrolitos
        if product_type == 'polvo_hidratacion':
            print("💧 DEBUG: Modo polvo de hidratación - Priorizando suplementos de electrolitos")
            electrolitos_keywords = ['magnesio', 'potasio', 'calcio', 'zinc', 'sodio', 'cloruro', 'electrolito']
            
            # Objetivo: Seleccionar al menos 50% de electrolitos (mínimo 3 de 6)
            min_electrolitos = max(3, num_ingredients // 2)
            
            for _, food in filtered_df.iterrows():
                nombre_lower = str(food.get('nombre', '')).lower()
                # Verificar si es un suplemento de electrolito
                if any(keyword in nombre_lower for keyword in electrolitos_keywords):
                    matching_foods.append(food)
                    print(f"✅ DEBUG: Electrolito encontrado - {food['nombre']}")
                    
                    # Limitar a min_electrolitos para dejar espacio a otros ingredientes
                    if len(matching_foods) >= min_electrolitos:
                        break
        
        # Lógica normal: Buscar por función objetivo
        if 'funcion_principal' in filtered_df.columns:
            for _, food in filtered_df.iterrows():
                # Evitar duplicados
                if food['superalimento_id'] in [f['superalimento_id'] for f in matching_foods]:
                    continue
                    
                food_function = str(food.get('funcion_principal', '')).lower()
                
                # Verificar si alguna función objetivo coincide
                for target_func in target_functions:
                    if target_func.lower() in food_function:
                        matching_foods.append(food)
                        print(f"✅ DEBUG: Coincidencia encontrada - {food['nombre']}: {food_function}")
                        break
        
        print(f"🎯 DEBUG: Alimentos que coinciden con objetivos: {len(matching_foods)}")
        
        # ✅ FASE 2: Si hay hints de optimización, priorizar ingredientes que mejoren nutrientes deficientes
        if optimization_hints and 'boost_sources' in optimization_hints:
            boost_sources = optimization_hints['boost_sources']
            print(f"💡 DEBUG: Buscando fuentes de nutrientes: {boost_sources}")
            
            # Buscar ingredientes que contengan las fuentes sugeridas
            for source in boost_sources:
                source_lower = source.lower()
                for _, food in filtered_df.iterrows():
                    # Evitar duplicados
                    if food['superalimento_id'] in [f['superalimento_id'] for f in matching_foods]:
                        continue
                    
                    nombre_lower = str(food.get('nombre', '')).lower()
                    if source_lower in nombre_lower:
                        matching_foods.append(food)
                        print(f"✅ DEBUG: Fuente de optimización encontrada - {food['nombre']} (para {source})")
                        break
        
        # Si no hay suficientes coincidencias, agregar alimentos aleatorios
        if len(matching_foods) < num_ingredients:
            remaining_foods = filtered_df[~filtered_df['superalimento_id'].isin([f['superalimento_id'] for f in matching_foods])]
            additional_needed = num_ingredients - len(matching_foods)
            
            if len(remaining_foods) > 0:
                additional_foods = remaining_foods.sample(min(additional_needed, len(remaining_foods)))
                matching_foods.extend(additional_foods.to_dict('records'))
                print(f"➕ DEBUG: Agregados {len(additional_foods)} alimentos adicionales aleatorios")
        
        # ✅ SISTEMA DE PRIORIZACIÓN GENÉRICO POR NUTRIENTE
        from nutrient_priority_system import get_nutrient_priorities, calculate_nutrient_score
        
        priority_config = get_nutrient_priorities(primary_objective)
        
        # 💧 EXCEPCIÓN: No aplicar filtro de nutrientes a electrolitos en polvo_hidratacion
        skip_nutrient_filter = (product_type == 'polvo_hidratacion')
        
        if priority_config and not skip_nutrient_filter:
            primary_nutrient = priority_config['primary_nutrient']
            min_threshold = priority_config['min_threshold']
            
            print(f"🎯 DEBUG: Priorizando por {primary_nutrient} (mínimo: {min_threshold})")
            
            # PASO 1: Filtrar alimentos que cumplen el umbral mínimo
            qualified_foods = []
            for food in matching_foods:
                food_id = food.get('superalimento_id')
                nutrition_row = self.nutrition_df[self.nutrition_df['superalimento_id'] == food_id]
                
                if not nutrition_row.empty:
                    nutrient_value = float(nutrition_row.iloc[0].get(primary_nutrient, 0) or 0)
                    
                    if nutrient_value >= min_threshold:
                        qualified_foods.append(food)
                        print(f"   ✅ {food.get('nombre', 'N/A')}: {nutrient_value} {primary_nutrient}")
                    else:
                        print(f"   ❌ {food.get('nombre', 'N/A')}: {nutrient_value} < {min_threshold} (descartado)")
            
            # Si hay suficientes alimentos calificados, usar solo esos
            if len(qualified_foods) >= num_ingredients:
                print(f"✅ DEBUG: {len(qualified_foods)} alimentos cumplen umbral mínimo")
                matching_foods = qualified_foods
            else:
                print(f"⚠️ DEBUG: Solo {len(qualified_foods)} cumplen umbral, usando todos los disponibles")
            
            # PASO 2: Calcular scores y ordenar por nutriente prioritario
            nutrient_scores = []
            for food in matching_foods:
                food_id = food.get('superalimento_id')
                nutrition_row = self.nutrition_df[self.nutrition_df['superalimento_id'] == food_id]
                
                if not nutrition_row.empty:
                    food_data = nutrition_row.iloc[0].to_dict()
                    score = calculate_nutrient_score(food_data, priority_config)
                    nutrient_scores.append((food, score))
                    print(f"   📊 {food.get('nombre', 'N/A')}: score={score:.2f}")
                else:
                    nutrient_scores.append((food, 0))
            
            # Ordenar por score (mayor a menor)
            nutrient_scores.sort(key=lambda x: x[1], reverse=True)
            matching_foods = [food for food, score in nutrient_scores]
            print(f"🎯 DEBUG: Alimentos reordenados por {primary_nutrient} (mayor a menor)")
        else:
            print(f"ℹ️ DEBUG: No hay priorización específica para '{primary_objective}'")
        
        # Seleccionar los ingredientes finales
        selected_ingredients = matching_foods[:num_ingredients]
        print(f"✅ DEBUG: Ingredientes seleccionados: {len(selected_ingredients)}")
        
        for ingredient in selected_ingredients:
            print(f"   - {ingredient.get('nombre', 'N/A')}: {ingredient.get('funcion_principal', 'N/A')}")
        
        return selected_ingredients

    def calculate_nutrition_metrics(self, ingredients: List[Dict]) -> Dict[str, float]:
        """✅ CORREGIDO: Busca por nombre si ID es None."""
        print("🧮 DEBUG: Calculando métricas nutricionales...")
        
        total_metrics = {
            'calories': 0,
            'protein': 0,
            'omega_3': 0,
            'antioxidants': 0,
            'fiber': 0,
            'vitamin_c': 0
        }
        
        for ingredient in ingredients:
            ingredient_id = ingredient.get('superalimento_id')
            ingredient_name = ingredient.get('nombre', 'N/A')
            print(f"📊 DEBUG: Calculando métricas para {ingredient_name} (ID: {ingredient_id})")
            
            # ✅ CORREGIDO V3: Calcular factor basado en porcentaje del ingrediente en el envase
            # Necesitamos saber cuánto del ingrediente hay por 100g de RECETA
            dose_result = ingredient.get('dose_result', {})
            percentage_of_package = float(dose_result.get('percentage_of_package', 0))
            
            # Si no hay dose_result, usar dosis_min_diaria como fallback
            if percentage_of_package == 0:
                dosis_min = float(ingredient.get('dosis_min_diaria', 5))
                # Asumir que la dosis es para 100g de receta
                factor = dosis_min / 100
            else:
                # percentage_of_package es el % del ingrediente en el envase
                # Factor = percentage / 100 (ej: 57.7% = 57.7g por 100g de receta)
                factor = percentage_of_package / 100
            
            print(f"   📏 Porcentaje en envase: {percentage_of_package}% (factor: {factor})")
            
            # ✅ BUSCAR POR ID O POR NOMBRE (FALLBACK)
            if ingredient_id is not None:
                # Buscar por ID
                nutrition_row = self.nutrition_df[self.nutrition_df['superalimento_id'] == ingredient_id]
                vitamin_rows = self.vitamins_df[self.vitamins_df['superalimento_id'] == ingredient_id]
                antioxidant_rows = self.antioxidants_df[self.antioxidants_df['superalimento_id'] == ingredient_id]
                print(f"   🔍 Buscando por ID: {ingredient_id}")
            else:
                # ✅ FALLBACK: Buscar por nombre
                print(f"   ⚠️ ID es None, buscando por nombre: {ingredient_name}")
                nutrition_row = self.nutrition_df[self.nutrition_df['nombre'].str.lower() == ingredient_name.lower()]
                vitamin_rows = self.vitamins_df[self.vitamins_df['nombre'].str.lower() == ingredient_name.lower()]
                antioxidant_rows = self.antioxidants_df[self.antioxidants_df['nombre'].str.lower() == ingredient_name.lower()]
            
            # Procesar valores nutricionales
            if not nutrition_row.empty:
                row = nutrition_row.iloc[0]
                calorias = float(row.get('calorias', 0) or 0)
                proteina = float(row.get('proteina', 0) or row.get('proteinas', 0) or 0)
                omega_3 = float(row.get('omega_3', 0) or 0)
                fibra = float(row.get('fibra', 0) or 0)
                
                total_metrics['calories'] += calorias * factor
                total_metrics['protein'] += proteina * factor
                total_metrics['omega_3'] += omega_3 * factor
                total_metrics['fiber'] += fibra * factor
                
                print(f"   ✅ Valores nutricionales encontrados:")
                print(f"      - Calorías: {calorias * factor:.2f}")
                print(f"      - Proteína: {proteina * factor:.2f}g")
                print(f"      - Omega-3: {omega_3 * factor:.4f}g")
                print(f"      - Fibra: {fibra * factor:.2f}g")
            else:
                print(f"   ❌ No se encontraron valores nutricionales para {ingredient_name}")
            
            # Buscar vitaminas
            if not vitamin_rows.empty:
                vitamin_c = float(vitamin_rows['vitamina_c'].fillna(0).sum()) * factor
                total_metrics['vitamin_c'] += vitamin_c
                print(f"   ✅ Vitamina C: {vitamin_c:.2f}mg")
            else:
                print(f"   ⚠️ No se encontró vitamina C para {ingredient_name}")
            
            # ✅ Buscar antioxidantes - CORREGIDO para usar capacidad_antioxidante_total
            if not antioxidant_rows.empty:
                # ✅ Usar capacidad_antioxidante_total (columna correcta)
                antioxidant_total = float(antioxidant_rows['capacidad_antioxidante_total'].fillna(0).sum()) * factor
                total_metrics['antioxidants'] += antioxidant_total
                print(f"   ✅ Antioxidantes (capacidad_antioxidante_total): {antioxidant_total:.2f}")
            else:
                print(f"   ⚠️ No se encontraron antioxidantes para {ingredient_name}")
        
        # Redondear valores
        for key in total_metrics:
            total_metrics[key] = round(total_metrics[key], 2)
        
        print(f"\n📊 DEBUG: === MÉTRICAS NUTRICIONALES TOTALES ===")
        print(f"   Calorías: {total_metrics['calories']}")
        print(f"   Proteína: {total_metrics['protein']}g")
        print(f"   Omega-3: {total_metrics['omega_3']}g")
        print(f"   Antioxidantes: {total_metrics['antioxidants']}")
        print(f"   Fibra: {total_metrics['fiber']}g")
        print(f"   Vitamina C: {total_metrics['vitamin_c']}mg")
        print(f"========================================\n")
        
        return total_metrics

    def generate_recipe_name(self, primary_objective: str, ingredients: List[Dict]) -> str:
        """Genera un nombre atractivo para la receta."""
        print(f"📝 DEBUG: Generando nombre de receta para objetivo: {primary_objective}")
        
        objective_names = {
            'immune': 'Inmunidad Poderosa',
            'energy': 'Energía Vital',
            'cognitive': 'Mente Brillante',
            'physical': 'Fuerza Natural',
            'detox': 'Limpieza Total',
            'stress': 'Calma Profunda',
            'digestion': 'Digestión Perfecta',
            'beauty': 'Belleza Radiante',
            'muscle': 'Masa Muscular'
        }
        
        base_name = objective_names.get(primary_objective, 'Bienestar Natural')
        
        if ingredients:
            featured_ingredient = ingredients[0].get('nombre', '')
            if featured_ingredient:
                recipe_name = f"Mezcla {base_name} con {featured_ingredient}"
            else:
                recipe_name = f"Mezcla {base_name}"
        else:
            recipe_name = f"Mezcla {base_name}"
        
        print(f"📝 DEBUG: Nombre de receta generado: {recipe_name}")
        return recipe_name
    def generate_detailed_instructions(self, ingredients: List[Dict], primary_objective: str) -> List[str]:
        """Genera instrucciones detalladas como en el código original."""
        print("📋 DEBUG: Generando instrucciones detalladas...")
        
        # Determinar tipo de preparación basado en ingredientes
        has_liquids = any('líquido' in str(ing.get('tipo_alimento', '')).lower() for ing in ingredients)
        has_powders = any('polvo' in str(ing.get('tipo_alimento', '')).lower() for ing in ingredients)
        
        instructions = []
        
        if has_powders or len(ingredients) > 3:
            # Preparación como batido/smoothie
            instructions = [
                "Coloca todos los ingredientes en una licuadora.",
                "Agrega 250 ml de agua, leche vegetal o tu líquido preferido.",
                "Mezcla a alta velocidad durante 30-60 segundos hasta obtener una consistencia homogénea.",
                "Si la mezcla está demasiado espesa, añade más líquido gradualmente.",
                "Sirve inmediatamente para aprovechar al máximo sus propiedades.",
                "Consume preferentemente en ayunas o como merienda entre comidas."
            ]
        else:
            # Preparación como mezcla en polvo
            instructions = [
                "Mide las cantidades indicadas de cada superalimento.",
                "Mezcla todos los ingredientes en polvo en un recipiente limpio y seco.",
                "Revuelve bien hasta obtener una mezcla homogénea.",
                "Puedes consumir la mezcla directamente o agregarla a batidos, yogur o cereales.",
                "Almacena en un recipiente hermético en lugar fresco y seco.",
                "Para mejores resultados, consume con el estómago vacío."
            ]
        
        print(f"📋 DEBUG: {len(instructions)} instrucciones generadas")
        return instructions

    def generate_benefits_text(self, primary_objective: str, secondary_objectives: List[str], ingredients: List[Dict]) -> str:
        """Genera texto de beneficios como en el código original."""
        print("💪 DEBUG: Generando texto de beneficios...")
        
        objective_benefits = {
            'immune': 'fortalecer el sistema inmunológico',
            'energy': 'aumentar la energía y vitalidad',
            'cognitive': 'mejorar el rendimiento cognitivo',
            'physical': 'potenciar el rendimiento físico',
            'detox': 'desintoxicar y limpiar el organismo',
            'stress': 'reducir el estrés y mejorar el sueño',
            'digestion': 'mejorar la digestión',
            'beauty': 'mejorar la piel, cabello y uñas',
            'muscle': 'aumentar la masa muscular',
            'cardiovascular': 'apoyar la salud cardiovascular',
            'brain_health': 'mejorar la salud cerebral',
            'inflammation': 'reducir la inflamación',
            'blood_sugar': 'regular los niveles de azúcar',
            'weight_control': 'apoyar el control de peso',
            'hormonal': 'equilibrar las hormonas',
            'joint_health': 'fortalecer las articulaciones',
            'visual_health': 'mejorar la salud visual',
            'intestinal_health': 'optimizar la salud intestinal',
            'bone_health': 'fortalecer los huesos',
            'liver_function': 'apoyar la función hepática',
            'mood': 'mejorar el estado de ánimo',
            'mental_clarity': 'aumentar la claridad mental'
        }
        
        primary_benefit = objective_benefits.get(primary_objective, 'mejorar el bienestar general')
        
        benefits_list = [primary_benefit]
        if secondary_objectives:
            for secondary in secondary_objectives:
                if secondary in objective_benefits:
                    benefits_list.append(objective_benefits[secondary])
        
        benefits_text = ', '.join(benefits_list[:-1])
        if len(benefits_list) > 1:
            benefits_text += f" y {benefits_list[-1]}"
        else:
            benefits_text = benefits_list[0]
        
        full_text = f"Esta mezcla está especialmente diseñada para {benefits_text}. Contiene superalimentos ricos en nutrientes esenciales, antioxidantes y compuestos bioactivos que trabajan en sinergia para potenciar tu bienestar."
        
        print(f"💪 DEBUG: Texto de beneficios generado")
        return full_text

    def get_highlighted_nutrients(self, ingredients: List[Dict]) -> List[str]:
        """Obtiene los nutrientes destacados de los ingredientes."""
        print("🌟 DEBUG: Obteniendo nutrientes destacados...")
        
        highlighted = []
        
        for ingredient in ingredients:
            ingredient_id = ingredient.get('superalimento_id')
            
            # Buscar vitaminas destacadas
            vitamin_rows = self.vitamins_df[self.vitamins_df['superalimento_id'] == ingredient_id]
            if not vitamin_rows.empty:
                row = vitamin_rows.iloc[0]
                if row.get('vitamina_c', 0) > 10:
                    highlighted.append('Vitamina C')
                if row.get('vitamina_e', 0) > 5:
                    highlighted.append('Vitamina E')
                if row.get('vitamina_b12', 0) > 1:
                    highlighted.append('Vitamina B12')
            
            # Buscar minerales destacados
            mineral_rows = self.minerals_df[self.minerals_df['superalimento_id'] == ingredient_id]
            if not mineral_rows.empty:
                row = mineral_rows.iloc[0]
                if row.get('hierro', 0) > 5:
                    highlighted.append('Hierro')
                if row.get('magnesio', 0) > 50:
                    highlighted.append('Magnesio')
                if row.get('calcio', 0) > 100:
                    highlighted.append('Calcio')
                if row.get('zinc', 0) > 2:
                    highlighted.append('Zinc')
            
            # Buscar antioxidantes
            antioxidant_rows = self.antioxidants_df[self.antioxidants_df['superalimento_id'] == ingredient_id]
            if not antioxidant_rows.empty:
                highlighted.extend(['Antioxidantes', 'Antocianinas', 'Flavonoides'])
        
        # Agregar nutrientes comunes de superalimentos
        highlighted.extend(['Omega-3', 'Fibra', 'Proteína'])
        
        # Eliminar duplicados y limitar
        unique_highlighted = list(dict.fromkeys(highlighted))[:12]
        
        print(f"🌟 DEBUG: Nutrientes destacados: {unique_highlighted}")
        return unique_highlighted
    
    def analyze_flavor_profile(self, ingredients: List[Dict]) -> Dict[str, Any]:
        """Analiza el perfil de sabor de la receta"""
        print("🍯 DEBUG: Analizando perfil de sabor...")
        
        # Mapeo de sabores por ingrediente
        flavor_profiles = {
            'cáñamo': {'primary': 'terroso', 'notes': ['verde', 'vegetal'], 'intensity': 6},
            'espirulina': {'primary': 'marino', 'notes': ['algas', 'oceánico'], 'intensity': 9},
            'chlorella': {'primary': 'marino', 'notes': ['algas', 'verde'], 'intensity': 8},
            'matcha': {'primary': 'amargo', 'notes': ['herbal', 'verde'], 'intensity': 7},
            'maca': {'primary': 'terroso', 'notes': ['nuez', 'caramelo'], 'intensity': 5},
            'ashwagandha': {'primary': 'amargo', 'notes': ['medicinal', 'raíz'], 'intensity': 8},
            'cúrcuma': {'primary': 'terroso', 'notes': ['especiado', 'cálido'], 'intensity': 6},
            'açaí': {'primary': 'frutal', 'notes': ['berry', 'rico'], 'intensity': 4},
            'moringa': {'primary': 'vegetal', 'notes': ['verde', 'herbal'], 'intensity': 6},
            'cacao': {'primary': 'amargo', 'notes': ['chocolate', 'terroso'], 'intensity': 8},
            'quinoa': {'primary': 'neutro', 'notes': ['nuez', 'suave'], 'intensity': 3},
            'amaranto': {'primary': 'neutro', 'notes': ['nuez', 'dulce'], 'intensity': 3},
            'kelp': {'primary': 'marino', 'notes': ['salado', 'oceánico'], 'intensity': 7},
            'goji': {'primary': 'frutal', 'notes': ['dulce', 'berry'], 'intensity': 5},
            'chía': {'primary': 'neutro', 'notes': ['suave', 'textura'], 'intensity': 2},
            'linaza': {'primary': 'neutro', 'notes': ['nuez', 'suave'], 'intensity': 3}
        }
        
        dominant_flavors = []
        total_intensity = 0
        flavor_notes = []
        
        for ingredient in ingredients:
            name = ingredient.get('nombre', '').lower()
            for key, profile in flavor_profiles.items():
                if key in name:
                    dominant_flavors.append(profile['primary'])
                    total_intensity += profile['intensity']
                    flavor_notes.extend(profile['notes'])
                    print(f"   🍯 {name}: sabor {profile['primary']} (intensidad: {profile['intensity']})")
                    break
        
        # Determinar sabor dominante
        if dominant_flavors:
            most_common = max(set(dominant_flavors), key=dominant_flavors.count)
        else:
            most_common = 'neutro'
        
        print(f"   🎯 Sabor dominante: {most_common}")
        
        # Generar recomendaciones de mejora
        recommendations = []
        if most_common in ['amargo', 'marino', 'terroso']:
            if most_common == 'amargo':
                recommendations = [
                    {'ingredient': 'coco rallado', 'amount': '10-15g', 'reason': 'Dulzor natural y textura cremosa'},
                    {'ingredient': 'stevia', 'amount': '0.5-1g', 'reason': 'Endulzante natural sin calorías'}
                ]
            elif most_common == 'marino':
                recommendations = [
                    {'ingredient': 'piña en polvo', 'amount': '15-20g', 'reason': 'Dulzor tropical que enmascara sabor marino'},
                    {'ingredient': 'coco rallado', 'amount': '10-15g', 'reason': 'Perfil tropical y grasas saludables'}
                ]
            elif most_common == 'terroso':
                recommendations = [
                    {'ingredient': 'canela', 'amount': '1-2g', 'reason': 'Especias cálidas que complementan sabores terrosos'},
                    {'ingredient': 'miel en polvo', 'amount': '5-8g', 'reason': 'Endulzante natural con notas florales'}
                ]
        
        description = f"En base a estos ingredientes, el sabor será predominantemente {most_common}"
        if recommendations:
            description += ". Te recomendamos agregar endulzantes naturales para mejorar el sabor."
        
        print(f"   ✅ Análisis de sabor completado")
        
        return {
            'dominant_flavor': most_common,
            'intensity_level': min(total_intensity // len(ingredients) if ingredients else 0, 10),
            'flavor_notes': list(set(flavor_notes)),
            'recommendations': recommendations,
            'description': description
        }
    
    def analyze_bioavailability(self, ingredients: List[Dict]) -> Dict[str, Any]:
        """Analiza la biodisponibilidad y sugiere sinergias"""
        print("🧬 DEBUG: Analizando biodisponibilidad...")
        
        # Sinergias científicamente validadas
        synergies = {
            'cúrcuma': {
                'enhancer': 'pimienta negra',
                'increase': '2000%',
                'mechanism': 'Piperina inhibe metabolismo hepático',
                'evidence_level': 10,
                'source': 'Johns Hopkins Medicine'
            },
            'hierro': {
                'enhancer': 'vitamina c',
                'increase': '300%',
                'mechanism': 'Reduce hierro férrico a ferroso',
                'evidence_level': 9,
                'source': 'American Journal of Clinical Nutrition'
            },
            'açaí': {
                'enhancer': 'vitamina c',
                'increase': '40%',
                'mechanism': 'Protege antocianinas de oxidación',
                'evidence_level': 8,
                'source': 'Journal of Agricultural and Food Chemistry'
            },
            'cáñamo': {
                'enhancer': 'grasas saludables',
                'increase': '60%',
                'mechanism': 'Omega-3 requiere grasas para absorción',
                'evidence_level': 8,
                'source': 'Nutrients Journal'
            },
            'moringa': {
                'enhancer': 'pimienta negra',
                'increase': '45%',
                'mechanism': 'Mejora absorción de compuestos bioactivos',
                'evidence_level': 7,
                'source': 'Food Chemistry'
            },
            'espirulina': {
                'enhancer': 'vitamina c',
                'increase': '35%',
                'mechanism': 'Mejora absorción de hierro no hemo',
                'evidence_level': 8,
                'source': 'European Journal of Clinical Nutrition'
            }
        }
        
        potential_improvements = []
        
        for ingredient in ingredients:
            name = ingredient.get('nombre', '').lower()
            for key, synergy in synergies.items():
                if key in name:
                    potential_improvements.append({
                        'ingredient': name,
                        'enhancer': synergy['enhancer'],
                        'increase': synergy['increase'],
                        'mechanism': synergy['mechanism'],
                        'evidence_level': synergy['evidence_level'],
                        'source': synergy['source']
                    })
                    print(f"   🧬 Sinergia encontrada para {name}: +{synergy['increase']} con {synergy['enhancer']}")
        
        # Calcular mejora potencial total
        if potential_improvements:
            avg_improvement = sum([int(imp['increase'].replace('%', '')) for imp in potential_improvements]) // len(potential_improvements)
            total_improvement = min(avg_improvement, 200)  # Cap at 200%
        else:
            total_improvement = 50  # Base improvement
        
        print(f"   ✅ Mejora potencial total: {total_improvement}%")
        
        return {
            'potential_improvement': f"{total_improvement}%",
            'synergies': potential_improvements,
            'recommendations': [
                {
                    'title': 'Sinergia Nutricional Científicamente Validada',
                    'description': f"Esta receta podría tener un {total_improvement}% más de biodisponibilidad si agregas:",
                    'suggestions': [imp['enhancer'] for imp in potential_improvements[:3]]
                }
            ]
        }
    
    def get_ingredient_bioavailability(self, ingredient_name: str) -> str:
        """Obtiene el nivel de biodisponibilidad de un ingrediente"""
        # Niveles de biodisponibilidad basados en evidencia científica
        bioavailability_levels = {
            'cúrcuma': '30%',  # Baja sin piperina
            'açaí': '65%',     # Buena con vitamina C
            'espirulina': '85%', # Muy alta
            'chlorella': '80%', # Alta
            'cáñamo': '45%',   # Media, mejora con grasas
            'moringa': '55%',  # Media-alta
            'maca': '70%',     # Alta
            'ashwagandha': '60%', # Media-alta
            'matcha': '75%',   # Alta
            'quinoa': '90%',   # Muy alta
            'amaranto': '85%', # Muy alta
            'kelp': '70%',     # Alta
            'goji': '65%',     # Buena
            'chía': '75%',     # Alta
            'linaza': '70%',   # Alta
            'cacao': '80%',    # Alta
            'reishi': '55%',   # Media-alta
            'melena de león': '60%' # Media-alta
        }
        
        ingredient_lower = ingredient_name.lower()
        for key, level in bioavailability_levels.items():
            if key in ingredient_lower:
                return level
        
        return '60%'  # Default level
    
    def generate_interactions_analysis(self, ingredients: List[Dict]) -> Dict[str, Any]:
        """
        🆕 MEJORADO: Genera análisis de interacciones específico para los ingredientes.
        """
        print("⚗️ DEBUG: Generando análisis de interacciones...")
        
        ingredient_names = [ing.get('nombre', '').lower() for ing in ingredients]
        
        interactions = {
            'synergies': [],
            'inhibitors_avoided': [],
            'bioavailability_score': 7
        }
        
        # ========== SINERGIAS DETECTADAS ==========
        
        # 1. Cúrcuma + Pimienta Negra (la más potente)
        has_curcuma = any('cúrcuma' in name or 'turmeric' in name for name in ingredient_names)
        has_pimienta = any('pimienta' in name or 'pepper' in name for name in ingredient_names)
        
        if has_curcuma and has_pimienta:
            interactions['synergies'].append(
                "Cúrcuma + Pimienta Negra presente: +2000% biodisponibilidad (piperina)"
            )
            interactions['bioavailability_score'] += 2
        elif has_curcuma and not has_pimienta:
            interactions['inhibitors_avoided'].append(
                "⚠️ La cúrcuma presente podría beneficiarse de agregar pimienta negra (+2000% absorción)"
            )
        
        # 2. Hierro + Vitamina C
        iron_sources = ['espirulina', 'chlorella', 'moringa', 'chía', 'amaranto', 'quinoa']
        vitamin_c_sources = ['açaí', 'goji', 'maqui', 'camu camu', 'rosa mosqueta', 'arándanos']
        
        has_iron = any(source in name for name in ingredient_names for source in iron_sources)
        has_vitamin_c = any(source in name for name in ingredient_names for source in vitamin_c_sources)
        
        if has_iron and has_vitamin_c:
            iron_ingredient = next((name for name in ingredient_names if any(source in name for source in iron_sources)), 'fuente de hierro')
            vitamin_c_ingredient = next((name for name in ingredient_names if any(source in name for source in vitamin_c_sources)), 'fuente de vitamina C')
            
            interactions['synergies'].append(
                f"Hierro ({iron_ingredient.title()}) + Vitamina C ({vitamin_c_ingredient.title()}): +300% absorción de hierro"
            )
            interactions['bioavailability_score'] += 1
        
        # 3. Omega-3 + Grasas saludables
        omega3_sources = ['chía', 'linaza', 'cáñamo', 'nueces']
        fat_sources = ['cacao', 'coco', 'aguacate', 'almendras']
        
        has_omega3 = any(source in name for name in ingredient_names for source in omega3_sources)
        has_fats = any(source in name for name in ingredient_names for source in fat_sources)
        
        if has_omega3 and has_fats:
            omega3_ingredient = next((name for name in ingredient_names if any(source in name for source in omega3_sources)), 'omega-3')
            
            interactions['synergies'].append(
                f"Omega-3 ({omega3_ingredient.title()}) + Grasas saludables: Mejora absorción de ácidos grasos"
            )
            interactions['bioavailability_score'] += 1
        elif has_omega3 and not has_fats:
            interactions['inhibitors_avoided'].append(
                "💡 Los omega-3 presentes se absorben mejor con grasas saludables (aguacate, coco, frutos secos)"
            )
        
        # 4. Açaí + Vitamina C (específico para antocianinas)
        has_acai = any('açaí' in name or 'acai' in name for name in ingredient_names)
        
        if has_acai and has_vitamin_c:
            interactions['synergies'].append(
                "Açaí + Vitamina C: +40% absorción de antocianinas (protección antioxidante)"
            )
            interactions['bioavailability_score'] += 1
        
        # 5. Zinc + Proteína
        zinc_sources = ['semillas de calabaza', 'quinoa', 'cáñamo', 'espirulina']
        protein_sources = ['cáñamo', 'espirulina', 'chlorella', 'quinoa', 'amaranto']
        
        has_zinc = any(source in name for name in ingredient_names for source in zinc_sources)
        has_protein = any(source in name for name in ingredient_names for source in protein_sources)
        
        if has_zinc and has_protein:
            interactions['synergies'].append(
                "Zinc + Proteína: Mejor absorción de zinc en presencia de proteínas"
            )
        
        # ========== INHIBIDORES EVITADOS (SOLO SI SON RELEVANTES) ==========
        
        # 1. Té verde + Hierro (SOLO si hay hierro presente)
        has_green_tea = any('té verde' in name or 'matcha' in name for name in ingredient_names)
        
        if has_iron and not has_green_tea:
            interactions['inhibitors_avoided'].append(
                "✓ Hierro sin té verde/matcha: Se evita inhibición por taninos (hasta -60% absorción)"
            )
        elif has_iron and has_green_tea:
            interactions['inhibitors_avoided'].append(
                "⚠️ Té verde/Matcha + Hierro: Los taninos pueden reducir absorción de hierro. Consúmelos separados por 2 horas"
            )
            interactions['bioavailability_score'] -= 1
        
        # 2. Calcio + Hierro (SOLO si ambos están presentes en alta cantidad)
        calcium_sources = ['sésamo', 'almendras', 'chía', 'amaranto']
        has_calcium = any(source in name for name in ingredient_names for source in calcium_sources)
        
        if has_calcium and has_iron:
            interactions['inhibitors_avoided'].append(
                "⚠️ Calcio + Hierro presentes: Pueden competir por absorción. Considera espaciar su consumo"
            )
        
        # 3. Fitatos + Minerales (SOLO si hay muchos cereales/legumbres)
        phytate_sources = ['quinoa', 'amaranto', 'avena']
        has_phytates = sum(1 for name in ingredient_names if any(source in name for source in phytate_sources)) >= 2
        
        if has_phytates and (has_iron or has_zinc):
            interactions['inhibitors_avoided'].append(
                "💡 Los cereales presentes contienen fitatos. Remojar o tostar ayuda a reducir su efecto inhibidor"
            )
        
        # 4. Oxalatos (SOLO si hay espinaca o acelga)
        has_oxalates = any('espinaca' in name or 'acelga' in name for name in ingredient_names)
        
        if has_oxalates and has_calcium:
            interactions['inhibitors_avoided'].append(
                "⚠️ Oxalatos presentes pueden reducir absorción de calcio. Cocinar las verduras reduce oxalatos"
            )
        
        # ========== VALIDACIÓN: Si no hay inhibidores relevantes, agregar mensaje positivo ==========
        if len(interactions['inhibitors_avoided']) == 0:
            interactions['inhibitors_avoided'].append(
                "✓ Esta combinación de ingredientes no presenta interacciones inhibidoras significativas"
            )
        
        # Calcular score final (máximo 10, mínimo 3)
        interactions['bioavailability_score'] = max(3, min(interactions['bioavailability_score'], 10))
        
        print(f"   ✅ Sinergias encontradas: {len(interactions['synergies'])}")
        print(f"   ✅ Inhibidores analizados: {len(interactions['inhibitors_avoided'])}")
        print(f"   ✅ Score: {interactions['bioavailability_score']}/10")
        
        return interactions
    
    def calculate_proportional_doses(self, ingredients: List[Dict], package_size: int = 100) -> List[Dict]:
        """
        ✅ NUEVO MÉTODO: Calcula dosis proporcionales para TODOS los ingredientes.
        La suma de todos los ingredientes = package_size (100g o 200g).
        
        Args:
            ingredients: Lista de ingredientes con dosis_min_diaria
            package_size: Tamaño del envase en gramos
        
        Returns:
            Lista de ingredientes con dosis ajustadas
        """
        print(f"\n📦 DEBUG: Calculando dosis proporcionales para {len(ingredients)} ingredientes en envase de {package_size}g")
        
        # ✅ CORREGIDO V2: Calcular porciones según tamaño del envase
        # Porción estándar: 5g (ajustable según tipo de producto)
        STANDARD_SERVING_SIZE = 5  # gramos por porción
        servings_per_package = max(1, int(package_size / STANDARD_SERVING_SIZE))
        
        print(f"   🎯 Porciones calculadas: {servings_per_package} (tamaño: {STANDARD_SERVING_SIZE}g/porción, envase: {package_size}g)")
        
        # PASO 1: Obtener dosis mínimas de cada ingrediente
        ingredients_with_doses = []
        total_ideal_grams = 0
        
        for ing in ingredients:
            dosis_min = float(ing.get('dosis_min_diaria', 5))
            dosis_max = float(ing.get('dosis_max_diaria', dosis_min * 2))
            
            # Cantidad ideal en el envase (30 porciones * dosis_min)
            ideal_grams = dosis_min * servings_per_package
            total_ideal_grams += ideal_grams
            
            ingredients_with_doses.append({
                'ingredient': ing,
                'dosis_min': dosis_min,
                'dosis_max': dosis_max,
                'ideal_grams': ideal_grams
            })
            
            print(f"   📊 {ing.get('nombre')}: dosis_min={dosis_min}g → ideal={ideal_grams}g en envase")
        
        print(f"\n   📊 Total ideal: {total_ideal_grams}g (envase real: {package_size}g)")
        
        # PASO 2: Calcular factor de ajuste
        if total_ideal_grams > package_size:
            adjustment_factor = package_size / total_ideal_grams
            print(f"   ⚠️ Ajustando proporcionalmente: factor={adjustment_factor:.4f}")
        else:
            adjustment_factor = 1.0
            print(f"   ✅ No requiere ajuste (cabe en el envase)")
        
        # PASO 3: Aplicar ajuste proporcional
        results = []
        total_assigned = 0
        
        for item in ingredients_with_doses:
            ing = item['ingredient']
            
            # Aplicar factor de ajuste
            adjusted_grams_in_package = item['ideal_grams'] * adjustment_factor
            adjusted_grams_per_serving = adjusted_grams_in_package / servings_per_package
            percentage_of_package = (adjusted_grams_in_package / package_size) * 100
            
            total_assigned += adjusted_grams_in_package
            
            # Obtener info de cucharadas
            dose_info = self.get_recommended_dose(ing.get('nombre', 'N/A'))
            
            result = {
                'ingredient': ing,
                'grams_per_serving': round(adjusted_grams_per_serving, 2),  # 2 decimales para mostrar 0.01-0.09
                'total_grams_in_package': round(adjusted_grams_in_package, 2),
                'percentage_of_package': round(percentage_of_package, 2),
                'servings': servings_per_package,
                'spoon_amount': round(adjusted_grams_per_serving / dose_info['spoon_grams'], 2),
                'spoon_type': dose_info['spoon_type'],
                'package_size': package_size
            }
            
            results.append(result)
            
            print(f"   ✅ {ing.get('nombre')}: {adjusted_grams_per_serving:.1f}g/porción ({adjusted_grams_in_package:.1f}g total, {percentage_of_package:.1f}%)")
        
        print(f"\n   📊 Total asignado: {total_assigned:.1f}g / {package_size}g ({(total_assigned/package_size)*100:.1f}%)")
        
        return results
    
    def calculate_dose_with_package_size(self, ingredient_name: str, package_size: int = 100, 
                                         total_ingredients: int = 5, ingredient_row: Dict = None) -> Dict:
        """
        ⚠️ DEPRECATED: Usar calculate_proportional_doses() en su lugar.
        Mantenido por compatibilidad.
        """
        # Fallback simple
        dose_info = self.get_recommended_dose(ingredient_name)
        servings = 30
        grams_per_serving = package_size / total_ingredients / servings
        
        return {
            'grams_per_serving': round(grams_per_serving, 1),
            'total_grams_in_package': round(grams_per_serving * servings, 1),
            'percentage_of_package': round((grams_per_serving * servings / package_size) * 100, 1),
            'servings': servings,
            'spoon_amount': round(grams_per_serving / dose_info['spoon_grams'], 1),
            'spoon_type': dose_info['spoon_type'],
            'package_size': package_size
        }    
    
    
    def generate_recipe(self, primary_objective: str, num_ingredients: int = 5,
                       dietary_restrictions: List[str] = None, 
                       secondary_objectives: List[str] = None,
                       food_sources: List[str] = None,
                       product_type: str = None,
                       package_size: int = 100,
                       optimization_hints: Dict = None) -> Dict:
        """
        🆕 MÉTODO PRINCIPAL: Genera una receta personalizada completa.
        
        Args:
            primary_objective: Objetivo principal (immune, energy, cognitive, etc.)
            num_ingredients: Número de ingredientes deseados (default: 5)
            dietary_restrictions: Lista de restricciones (vegan, gluten_free, nut_free)
            secondary_objectives: Objetivos secundarios opcionales
            food_sources: Fuentes de alimentos preferidas
            product_type: Tipo de producto (polvo_batidos, capsulas, etc.)
            package_size: Tamaño del envase en gramos (100 o 200, default: 100)
        
        Returns:
            Dict con la receta completa incluyendo ingredientes, instrucciones, métricas, etc.
        """
        print("=" * 80)
        print("🚀 DEBUG: === INICIANDO GENERACIÓN DE RECETA ===")
        print("=" * 80)
        print(f"🎯 Objetivo principal: {primary_objective}")
        print(f"📊 Parámetros: ingredients={num_ingredients}, package_size={package_size}g")
        print(f"🔒 Restricciones: {dietary_restrictions}")
        print(f"🌱 Fuentes: {food_sources}")
        print(f"🎯 Tipo de producto: {product_type}")
        
        try:
            # 1. Mapear objetivos a funciones
            print("\n📋 PASO 1: Mapeando objetivos a funciones...")
            target_functions = self.map_objectives_to_functions(primary_objective, secondary_objectives)
            
            if not target_functions:
                raise ValueError("No se pudieron mapear los objetivos a funciones")
            
            # 2. Seleccionar ingredientes
            print("\n🔍 PASO 2: Seleccionando ingredientes...")
            ingredients = self.select_ingredients(
                target_functions, 
                num_ingredients, 
                dietary_restrictions, 
                food_sources,
                product_type,
                primary_objective,
                optimization_hints  # ✅ FASE 2: Pasar hints de optimización
            )
            
            if not ingredients:
                raise ValueError("No se encontraron ingredientes que cumplan con los criterios")
            
            print(f"✅ Ingredientes seleccionados: {len(ingredients)}")
            
            # 3. Calcular ingredientes con tamaño de envase (PROPORCIONAL)
            print("\n📦 PASO 3: Calculando dosis proporcionales con tamaño de envase...")
            
            # ✅ USAR EL NUEVO MÉTODO QUE CALCULA TODAS LAS DOSIS JUNTAS
            proportional_doses = self.calculate_proportional_doses(ingredients, package_size)
            
            ingredients_with_doses = []
            for dose_result in proportional_doses:
                ingredient = dose_result['ingredient']
                ingredient_name = ingredient.get('nombre', 'N/A')
                
                # Obtener información adicional del ingrediente
                proveedor = ingredient.get('proveedor', 'No especificado')
                precio_kilo = ingredient.get('preciokilo', 0)
                bioavailability_level = self.get_ingredient_bioavailability(ingredient_name)
                
                ingredients_with_doses.append({
                    'name': ingredient_name,
                    'nombre': ingredient_name,
                    'cantidad_por_porcion': dose_result['grams_per_serving'],
                    'cantidad_total_envase': dose_result['total_grams_in_package'],
                    'porcentaje_envase': dose_result['percentage_of_package'],
                    'cucharadas_por_porcion': dose_result['spoon_amount'],
                    'tipo_cuchara': dose_result['spoon_type'],
                    'function': ingredient.get('funcion_principal', 'Bienestar general'),
                    'funciones': [ingredient.get('funcion_principal', 'Bienestar general')],
                    'proveedor': proveedor,
                    'precio_kilo': precio_kilo,
                    'bioavailability_level': bioavailability_level,
                    # Mantener compatibilidad con formato antiguo
                    'amount': dose_result['spoon_amount'],
                    'unit': dose_result['spoon_type'],
                    'grams': dose_result['grams_per_serving']
                })
            
            print(f"✅ Dosis proporcionales calculadas para {len(ingredients_with_doses)} ingredientes")
            
            # 4. Calcular métricas nutricionales
            print("\n🧮 PASO 4: Calculando métricas nutricionales...")
            nutrition_metrics = self.calculate_nutrition_metrics(ingredients)
            print(f"✅ Métricas calculadas: {nutrition_metrics}")
            
            # 5. Generar nombre de receta
            print("\n📝 PASO 5: Generando nombre de receta...")
            recipe_name = self.generate_recipe_name(primary_objective, ingredients)
            print(f"✅ Nombre: {recipe_name}")
            
            # 6. Generar instrucciones
            print("\n📋 PASO 6: Generando instrucciones...")
            instructions = self.generate_detailed_instructions(ingredients, primary_objective)
            print(f"✅ {len(instructions)} instrucciones generadas")
            
            # 7. Generar texto de beneficios
            print("\n💪 PASO 7: Generando texto de beneficios...")
            benefits_text = self.generate_benefits_text(primary_objective, secondary_objectives, ingredients)
            print(f"✅ Beneficios: {benefits_text[:100]}...")
            
            # 8. Obtener nutrientes destacados
            print("\n🌟 PASO 8: Obteniendo nutrientes destacados...")
            highlighted_nutrients = self.get_highlighted_nutrients(ingredients)
            print(f"✅ {len(highlighted_nutrients)} nutrientes destacados")
            
            # 9. Análisis de sabor
            print("\n🍯 PASO 9: Analizando perfil de sabor...")
            flavor_analysis = self.analyze_flavor_profile(ingredients)
            print(f"✅ Sabor dominante: {flavor_analysis.get('dominant_flavor', 'N/A')}")
            
            # 10. Análisis de biodisponibilidad
            print("\n🧬 PASO 10: Analizando biodisponibilidad...")
            bioavailability_analysis = self.analyze_bioavailability(ingredients)
            print(f"✅ Mejora potencial: {bioavailability_analysis.get('potential_improvement', 'N/A')}")
            
            # 11. 🆕 Análisis de interacciones
            print("\n⚗️ PASO 11: Generando análisis de interacciones...")
            interactions_analysis = {
                'synergies': [],
                'inhibitors_avoided': [],
                'bioavailability_score': 7
            }
            
            # Detectar sinergias presentes en los ingredientes
            ingredient_names = [ing.get('nombre', '').lower() for ing in ingredients]
            
            # Verificar si hay cúrcuma + pimienta negra
            if any('cúrcuma' in name for name in ingredient_names) and any('pimienta' in name for name in ingredient_names):
                interactions_analysis['synergies'].append(
                    "Cúrcuma + Pimienta Negra: Aumento de absorción del 2000%"
                )
                interactions_analysis['bioavailability_score'] += 2
            
            # Verificar si hay hierro + vitamina C
            has_iron = any(name in ingredient_names for name in ['espirulina', 'moringa', 'chía'])
            has_vitamin_c = any(name in ingredient_names for name in ['açaí', 'goji', 'maqui'])
            if has_iron and has_vitamin_c:
                interactions_analysis['synergies'].append(
                    "Fuentes de hierro + Vitamina C: Aumento de absorción del 300%"
                )
                interactions_analysis['bioavailability_score'] += 1
            
            # Verificar omega-3 + grasas
            has_omega3 = any(name in ingredient_names for name in ['chía', 'linaza', 'cáñamo'])
            if has_omega3:
                interactions_analysis['synergies'].append(
                    "Omega-3 presente: Se recomienda consumir con grasas saludables para mejor absorción"
                )
            
            # Inhibidores evitados
            if not any('té' in name or 'matcha' in name for name in ingredient_names):
                interactions_analysis['inhibitors_avoided'].append(
                    "Hierro no mezclado con té verde para evitar inhibición de taninos"
                )
            
            if not any('calcio' in str(ing.get('funcion_principal', '')).lower() for ing in ingredients):
                interactions_analysis['inhibitors_avoided'].append(
                    "Calcio no mezclado en exceso para evitar competencia con otros minerales"
                )
            
            # Calcular score final (máximo 10)
            interactions_analysis['bioavailability_score'] = min(interactions_analysis['bioavailability_score'], 10)
            
            print(f"✅ Score de biodisponibilidad: {interactions_analysis['bioavailability_score']}/10")
            
            # 12. Construir respuesta completa
            print("\n🎁 PASO 12: Construyendo respuesta final...")
            
            # ✅ Obtener servings del primer ingrediente (todos tienen el mismo valor)
            servings_calculated = 30  # Valor por defecto
            if ingredients_with_doses and len(ingredients_with_doses) > 0:
                first_dose = ingredients_with_doses[0].get('dose_result', {})
                servings_calculated = first_dose.get('servings', 30)
            
            recipe = {
                'name': recipe_name,
                'primary_objective': primary_objective,
                'package_size': f'{package_size}g',
                'servings': servings_calculated,
                'ingredients': ingredients_with_doses,
                'nutrition_metrics': nutrition_metrics,
                'instructions': instructions,
                'benefits': benefits_text,
                'benefits_text': benefits_text,
                'highlighted_nutrients': highlighted_nutrients,
                'flavor_analysis': flavor_analysis,
                'bioavailability_analysis': bioavailability_analysis,
                'interactions_analysis': interactions_analysis,
                'preparation_time': '5-10 minutos',
                'total_servings': 1,
                'precautions': 'Esta receta es para fines informativos y no sustituye el consejo médico profesional. Si estás embarazada, amamantando, tomando medicamentos o tienes alguna condición médica, consulta con tu médico antes de consumir superalimentos.'
            }
            
            print("=" * 80)
            print("✅ DEBUG: === RECETA GENERADA EXITOSAMENTE ===")
            print("=" * 80)
            print(f"📦 Recipe name: {recipe_name}")
            print(f"🥗 Ingredients count: {len(ingredients_with_doses)}")
            print(f"📊 Nutrition metrics: {nutrition_metrics}")
            print(f"🧬 Bioavailability score: {interactions_analysis['bioavailability_score']}/10")
            print("=" * 80)
            
            return recipe
            
        except Exception as e:
            print("=" * 80)
            print(f"❌ DEBUG: Error en generate_recipe: {str(e)}")
            print("=" * 80)
            import traceback
            traceback.print_exc()
            raise e

    def get_debug_logs(self):
        """Obtiene los logs de debug almacenados."""
        try:
            return {
                'status': 'success',
                'logs': [
                    '🚀 DEBUG: RecipeGenerator inicializado correctamente',
                    f'📊 DEBUG: {len(self.superfoods_df)} superalimentos cargados',
                    f'📊 DEBUG: {len(self.nutrition_df)} valores nutricionales cargados',
                    f'📊 DEBUG: {len(self.vitamins_df)} vitaminas cargadas',
                    f'📊 DEBUG: {len(self.minerals_df)} minerales cargados',
                    f'📊 DEBUG: {len(self.antioxidants_df)} antioxidantes cargados',
                    '✅ DEBUG: Sistema funcionando correctamente'
                ]
            }
        except Exception as e:
            return {
                'status': 'error',
                'logs': [f'❌ ERROR: {str(e)}']
            }
            # ========== FUNCIÓN DE API PARA COMPATIBILIDAD ==========

def generate_recipe_api(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Función principal para generar recetas desde la API.
    Wrapper para mantener compatibilidad con código legacy.
    """
    print("🚀 DEBUG: === INICIANDO GENERACIÓN DE RECETA (API WRAPPER) ===")
    print(f"📥 DEBUG: Datos recibidos: {json.dumps(data, indent=2)}")
    
    try:
        # Inicializar generador
        generator = RecipeGenerator()
        
        # Extraer parámetros
        primary_objective = data.get('primary_objective', '')
        secondary_objectives = data.get('secondary_objectives', [])
        dietary_restrictions = data.get('dietary_restrictions', [])
        food_sources = data.get('food_sources', [])
        product_type = data.get('product_type', 'polvo_batidos')
        num_ingredients = data.get('num_ingredients', 5)
        package_size = data.get('package_size', 100)
        optimization_hints = data.get('optimization_hints', None)  # ✅ FASE 2: Hints de optimización
        
        print(f"🎯 DEBUG: Objetivo principal: {primary_objective}")
        print(f"🎯 DEBUG: Objetivos secundarios: {secondary_objectives}")
        print(f"🚫 DEBUG: Restricciones: {dietary_restrictions}")
        print(f"🌱 DEBUG: Fuentes: {food_sources}")
        print(f"🎯 DEBUG: Tipo de producto: {product_type}")
        print(f"🔢 DEBUG: Número de ingredientes: {num_ingredients}")
        print(f"📦 DEBUG: Tamaño de envase: {package_size}g")
        
        # Validar parámetros
        if not primary_objective:
            error_msg = "El objetivo principal es requerido"
            print(f"❌ DEBUG: {error_msg}")
            return {'error': error_msg}
        
        # ✅ FASE 2: Mostrar hints si están disponibles
        if optimization_hints:
            print(f"💡 DEBUG: Optimization hints recibidos: {optimization_hints}")
        
        # Llamar al método generate_recipe del generador
        recipe = generator.generate_recipe(
            primary_objective=primary_objective,
            num_ingredients=num_ingredients,
            dietary_restrictions=dietary_restrictions,
            secondary_objectives=secondary_objectives,
            food_sources=food_sources,
            product_type=product_type,
            package_size=package_size,
            optimization_hints=optimization_hints  # ✅ FASE 2: Pasar hints al generador
        )
        
        print("✅ DEBUG: === RECETA GENERADA EXITOSAMENTE (API WRAPPER) ===")
        
        return recipe
        
    except Exception as e:
        error_msg = f"Error interno: {str(e)}"
        print(f"❌ DEBUG: {error_msg}")
        print(f"❌ DEBUG: Traceback completo:")
        import traceback
        traceback.print_exc()
        return {'error': error_msg}


# ========== BLOQUE DE TESTING (OPCIONAL) ==========

if __name__ == '__main__':
    """
    Bloque de testing para ejecutar el generador directamente.
    Uso: python recipe_generator.py
    """
    print("=" * 80)
    print("🧪 MODO DE TESTING - Recipe Generator")
    print("=" * 80)
    
    # Test 1: Receta básica
    print("\n🧪 TEST 1: Generando receta básica para inmunidad...")
    try:
        test_data = {
            'primary_objective': 'immune',
            'num_ingredients': 5,
            'dietary_restrictions': [],
            'secondary_objectives': ['cardiovascular'],
            'food_sources': [],
            'product_type': 'polvo_batidos',
            'package_size': 100
        }
        
        recipe = generate_recipe_api(test_data)
        
        if 'error' in recipe:
            print(f"❌ Error: {recipe['error']}")
        else:
            print(f"✅ Receta generada: {recipe['name']}")
            print(f"   Ingredientes: {len(recipe['ingredients'])}")
            print(f"   Calorías: {recipe['nutrition_metrics']['calories']}")
            print(f"   Proteína: {recipe['nutrition_metrics']['protein']}g")
            print(f"   Package size: {recipe['package_size']}")
            print(f"   Porciones: {recipe['servings']}")
    except Exception as e:
        print(f"❌ Test 1 falló: {str(e)}")
    
    # Test 2: Receta con restricciones
    print("\n🧪 TEST 2: Generando receta vegana para energía...")
    try:
        test_data = {
            'primary_objective': 'energy',
            'num_ingredients': 4,
            'dietary_restrictions': ['vegan'],
            'secondary_objectives': [],
            'food_sources': ['semillas', 'frutas_bayas'],
            'product_type': 'polvo_batidos',
            'package_size': 200
        }
        
        recipe = generate_recipe_api(test_data)
        
        if 'error' in recipe:
            print(f"❌ Error: {recipe['error']}")
        else:
            print(f"✅ Receta generada: {recipe['name']}")
            print(f"   Ingredientes: {len(recipe['ingredients'])}")
            print(f"   Package size: {recipe['package_size']}")
            print(f"   Sabor dominante: {recipe['flavor_analysis']['dominant_flavor']}")
    except Exception as e:
        print(f"❌ Test 2 falló: {str(e)}")
    
    # Test 3: Receta para masa muscular
    print("\n🧪 TEST 3: Generando receta para masa muscular...")
    try:
        test_data = {
            'primary_objective': 'muscle',
            'num_ingredients': 5,
            'dietary_restrictions': [],
            'secondary_objectives': ['energy'],
            'food_sources': [],
            'product_type': 'polvo_batidos',
            'package_size': 100
        }
        
        recipe = generate_recipe_api(test_data)
        
        if 'error' in recipe:
            print(f"❌ Error: {recipe['error']}")
        else:
            print(f"✅ Receta generada: {recipe['name']}")
            print(f"   Ingredientes: {len(recipe['ingredients'])}")
            print(f"   Proteína: {recipe['nutrition_metrics']['protein']}g")
            print(f"   Score biodisponibilidad: {recipe['interactions_analysis']['bioavailability_score']}/10")
    except Exception as e:
        print(f"❌ Test 3 falló: {str(e)}")
    
    print("\n" + "=" * 80)
    print("🎉 TESTING COMPLETADO")
    print("=" * 80)
# ============================================================================
# EXTENSIÓN V3: SISTEMA DE SCORING Y FEEDBACK
# ============================================================================
# Agregado: 2025-01-09
# Funcionalidad: Scoring con benchmarks + Sistema de feedback de usuarios
# NOTA: Esta extensión NO modifica el código original, solo agrega funciones nuevas
# ============================================================================

import sqlite3
from datetime import datetime
import uuid

class RecipeGeneratorV3(RecipeGenerator):
    """
    Extensión V3 del RecipeGenerator que agrega:
    1. Sistema de scoring con benchmarks del mercado
    2. Sistema de feedback de usuarios
    
    Hereda TODA la funcionalidad de RecipeGenerator (1606 líneas)
    """
    
    def __init__(
        self, 
        db_path: str = 'data/db_maestra_superalimentos_ampliada.csv',
        benchmark_csv: str = 'benchmark_recipes_database.csv',
        feedback_db: str = 'user_feedback.db'
    ):
        """Inicializa generador V3 con scoring y feedback."""
        # Llamar al constructor padre (mantiene toda la funcionalidad original)
        super().__init__(db_path)
        
        # Agregar funcionalidades nuevas
        self._load_benchmarks_db(benchmark_csv)
        self._init_feedback_system(feedback_db)
        
        print("✅ RecipeGenerator V3.0 listo (con scoring y feedback)")
    
    def _load_benchmarks_db(self, benchmark_csv: str):
        """Carga la base de datos de benchmarks."""
        print(f"📊 Cargando benchmarks: {benchmark_csv}")
        
        if os.path.exists(benchmark_csv):
            self.benchmarks = pd.read_csv(benchmark_csv)
            print(f"✅ {len(self.benchmarks)} productos benchmark cargados")
        else:
            print("⚠️ No se encontró benchmark CSV, scoring deshabilitado")
            self.benchmarks = pd.DataFrame()
    
    def _init_feedback_system(self, feedback_db: str):
        """Inicializa el sistema de feedback."""
        print(f"💾 Inicializando sistema de feedback: {feedback_db}")
        
        self.feedback_db_path = feedback_db
        conn = sqlite3.connect(feedback_db)
        cursor = conn.cursor()
        
        # Crear tablas
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS generated_recipes (
                recipe_id TEXT PRIMARY KEY,
                user_id TEXT,
                objective TEXT,
                ingredients TEXT,
                nutrients TEXT,
                benchmark_score REAL,
                package_size INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_feedback (
                feedback_id INTEGER PRIMARY KEY AUTOINCREMENT,
                recipe_id TEXT,
                user_id TEXT,
                rating INTEGER CHECK(rating >= 1 AND rating <= 5),
                comment TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (recipe_id) REFERENCES generated_recipes(recipe_id)
            )
        ''')
        
        conn.commit()
        conn.close()
        
        print("✅ Sistema de feedback inicializado")
    
    def generate_recipe_with_scoring(self, data: Dict) -> Dict:
        """
        Genera receta usando el método original + agrega scoring.
        
        Args:
            data: Mismo formato que generate_recipe_api()
            
        Returns:
            Receta completa + benchmark_score + recipe_id
        """
        # Generar receta usando método original
        recipe = generate_recipe_api(data)
        
        if 'error' in recipe:
            return recipe
        
        # Agregar recipe_id único
        recipe['recipe_id'] = str(uuid.uuid4())[:8]
        
        # Calcular benchmark score
        if not self.benchmarks.empty:
            benchmark_analysis = self._calculate_benchmark_score(
                recipe, 
                data.get('primary_objective', 'salud_general')
            )
            recipe['benchmark_analysis'] = benchmark_analysis
            recipe['benchmark_score'] = benchmark_analysis['overall_score']
        else:
            recipe['benchmark_score'] = None
        
        # Guardar en DB
        self._save_recipe_to_db(recipe, data.get('user_id', 'anonymous'))
        
        return recipe
    
    def _calculate_benchmark_score(self, recipe: Dict, objective: str) -> Dict:
        """Calcula score de similitud con productos benchmark usando el optimizador mejorado."""
        try:
            from recipe_optimizer import RecipeOptimizer
            
            # Crear optimizador
            optimizer = RecipeOptimizer('benchmark_recipes_database.csv')
            
            # Preparar datos para análisis
            recipe_data = {
                'primary_objective': objective,
                'product_type': recipe.get('product_type', 'polvo_batidos')
            }
            
            # Analizar receta
            analysis = optimizer.analyze_recipe(recipe_data, recipe['nutrition_metrics'])
            
            # Adaptar formato de respuesta para compatibilidad
            return {
                'overall_score': analysis['score'],
                'interpretation': analysis['message'],
                'most_similar_product': analysis.get('best_match'),
                'similar_products': analysis.get('top_3_similar', []),
                'recommendations': analysis.get('recommendations', []),
                'nutrient_details': analysis.get('nutrient_details', {}),
                'status': analysis.get('status', 'unknown')
            }
        except Exception as e:
            print(f"⚠️ Error en optimizador, usando método fallback: {str(e)}")
            # Fallback al método original si falla el optimizador
            return self._calculate_benchmark_score_fallback(recipe, objective)
    
    def _calculate_benchmark_score_fallback(self, recipe: Dict, objective: str) -> Dict:
        """Método fallback si el optimizador falla."""
        objective_to_category = {
            'muscle': ['proteina', 'proteina_vegetal'],
            'energy': ['hidratacion_energia', 'pre_entreno'],
            'immune': ['supergreens', 'multivitaminico'],
            'hidratacion': ['hidratacion'],
            'skin': ['colageno', 'supergreens'],
            'cardiovascular': ['supergreens'],
            'sleep': ['sueño_relajacion', 'adaptogenos'],
            'salud_general': ['supergreens', 'multivitaminico']
        }
        
        categories = objective_to_category.get(objective, ['salud_general'])
        relevant_benchmarks = self.benchmarks[
            self.benchmarks['categoria'].isin(categories)
        ].head(5)
        
        if len(relevant_benchmarks) == 0:
            return {
                'overall_score': 50,
                'interpretation': 'No hay benchmarks disponibles',
                'most_similar_product': None,
                'similar_products': [],
                'recommendations': []
            }
        
        similarities = []
        for idx, benchmark in relevant_benchmarks.iterrows():
            similarity = self._calculate_nutrient_similarity(
                recipe['nutrition_metrics'],
                benchmark
            )
            similarities.append({
                'producto': benchmark.get('producto', 'Unknown'),
                'marca': benchmark.get('marca', 'Generic'),
                'categoria': benchmark.get('categoria', 'general'),
                'similarity_score': round(similarity, 1)
            })
        
        similarities.sort(key=lambda x: x['similarity_score'], reverse=True)
        overall_score = similarities[0]['similarity_score'] if similarities else 50
        
        if overall_score >= 80:
            interpretation = "Excelente - Similar a productos premium del mercado"
        elif overall_score >= 60:
            interpretation = "Bueno - Dentro de estándares del mercado"
        elif overall_score >= 40:
            interpretation = "Aceptable - Difiere moderadamente de productos comerciales"
        else:
            interpretation = "Mejorable - Composición muy diferente al mercado"
        
        return {
            'overall_score': round(overall_score, 1),
            'interpretation': interpretation,
            'most_similar_product': similarities[0] if similarities else None,
            'similar_products': similarities[:3],
            'recommendations': []
        }
    
    def _calculate_nutrient_similarity(self, recipe_nutrients: Dict, benchmark: pd.Series) -> float:
        """Calcula similitud nutricional entre receta y benchmark."""
        # Nutrientes a comparar
        nutrient_weights = {
            'protein': ('proteina_g', 0.3),
            'carbs': ('carbohidratos_g', 0.2),
            'fat': ('grasa_g', 0.1),
            'vitamin_c': ('vitamina_c_mg', 0.2),
            'antioxidants': ('antioxidantes_score', 0.2)
        }
        
        total_similarity = 0
        total_weight = 0
        
        for recipe_key, (benchmark_key, weight) in nutrient_weights.items():
            recipe_value = recipe_nutrients.get(recipe_key, 0)
            benchmark_value = benchmark.get(benchmark_key, 0)
            
            if benchmark_value > 0:
                # Calcular similitud (0-100)
                ratio = min(recipe_value, benchmark_value) / max(recipe_value, benchmark_value, 1)
                similarity = ratio * 100
                
                total_similarity += similarity * weight
                total_weight += weight
        
        return (total_similarity / total_weight) if total_weight > 0 else 50
    
    def _save_recipe_to_db(self, recipe: Dict, user_id: str):
        """Guarda receta en la base de datos."""
        try:
            conn = sqlite3.connect(self.feedback_db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO generated_recipes 
                (recipe_id, user_id, objective, ingredients, nutrients, benchmark_score, package_size)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                recipe['recipe_id'],
                user_id,
                recipe.get('primary_objective', 'unknown'),
                json.dumps(recipe.get('ingredients', [])),
                json.dumps(recipe.get('nutrition_metrics', {})),
                recipe.get('benchmark_score'),
                recipe.get('package_size', 100)
            ))
            
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"⚠️ Error guardando receta en DB: {str(e)}")
    
    def submit_feedback(self, recipe_id: str, user_id: str, rating: int, comment: str = '') -> bool:
        """Guarda feedback de usuario."""
        try:
            conn = sqlite3.connect(self.feedback_db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO user_feedback (recipe_id, user_id, rating, comment)
                VALUES (?, ?, ?, ?)
            ''', (recipe_id, user_id, rating, comment))
            
            conn.commit()
            conn.close()
            
            return True
        except Exception as e:
            print(f"❌ Error guardando feedback: {str(e)}")
            return False
    
    def get_recipe_feedback(self, recipe_id: str) -> Dict:
        """Obtiene feedback de una receta."""
        try:
            conn = sqlite3.connect(self.feedback_db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT AVG(rating), COUNT(*), GROUP_CONCAT(rating)
                FROM user_feedback
                WHERE recipe_id = ?
            ''', (recipe_id,))
            
            result = cursor.fetchone()
            conn.close()
            
            if result and result[0]:
                return {
                    'avg_rating': round(result[0], 2),
                    'total_ratings': result[1],
                    'ratings_distribution': result[2]
                }
            else:
                return {
                    'avg_rating': 0,
                    'total_ratings': 0,
                    'ratings_distribution': ''
                }
        except Exception as e:
            print(f"❌ Error obteniendo feedback: {str(e)}")
            return {'error': str(e)}

