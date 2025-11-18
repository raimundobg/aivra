"""
Módulo de Optimización de Recetas Basado en Benchmarks
Versión 1.0 - Sistema de scoring mejorado y regeneración optimizada
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Optional

class RecipeOptimizer:
    """
    Optimizador de recetas que compara con benchmarks del mercado
    y genera recomendaciones específicas para mejorar el score.
    """
    
    def __init__(self, benchmark_csv: str):
        """
        Inicializar optimizador con base de datos de benchmarks.
        
        Args:
            benchmark_csv: Ruta al archivo CSV con productos de referencia
        """
        self.benchmark_df = pd.read_csv(benchmark_csv)
        
        # Nutrientes a comparar (con sus pesos de importancia)
        self.nutrient_weights = {
            'proteina_g': 0.20,
            'carbohidratos_g': 0.10,
            'grasa_g': 0.05,
            'calorias_porcion': 0.10,
            'vitamina_c_mg': 0.10,
            'vitamina_b12_mcg': 0.10,
            'calcio_mg': 0.08,
            'magnesio_mg': 0.08,
            'omega_3_mg': 0.07,
            'cafeina_mg': 0.05,
            'fibra_g': 0.05,
            'antioxidantes_score': 0.02
        }
        
        # Mapeo de objetivos del generador a objetivos del benchmark
        self.objective_mapping = {
            'energy': ['aumentar_energia', 'nutricion_fundacional'],
            'muscle': ['aumentar_masa_muscular', 'recuperacion_muscular'],
            'sleep': ['mejorar_sueño', 'bienestar_general'],
            'focus': ['aumentar_energia', 'nutricion_fundacional'],
            'immunity': ['salud_general', 'nutricion_fundacional'],
            'digestion': ['salud_general', 'bienestar_general'],
            'skin': ['mejorar_piel', 'bienestar_general'],
            'weight_loss': ['control_peso', 'salud_general'],
            'hydration': ['hidratacion', 'hidratacion_energia']
        }
        
        # Mapeo de tipos de producto a categorías de benchmark
        self.product_type_mapping = {
            'polvo_batidos': ['proteina', 'proteina_vegetal', 'batido_reemplazo_comida'],
            'polvo_hidratacion': ['hidratacion', 'hidratacion_energia', 'energia'],
            'capsulas': ['multivitaminico', 'aminoacidos'],
            'infusion': ['adaptogenos', 'sueño_relajacion'],
            'bebida_funcional': ['energia', 'hidratacion_energia'],
            'snack': ['proteina', 'batido_reemplazo_comida']
        }
    
    def find_similar_benchmarks(self, 
                                objective: str, 
                                product_type: Optional[str] = None,
                                top_n: int = 3) -> pd.DataFrame:
        """
        Encontrar productos similares en el benchmark.
        
        Args:
            objective: Objetivo principal (energy, muscle, etc.)
            product_type: Tipo de producto (opcional)
            top_n: Número de productos similares a retornar
            
        Returns:
            DataFrame con productos similares
        """
        # Mapear objetivo
        target_objectives = self.objective_mapping.get(objective, [objective])
        
        # Filtrar por objetivo
        similar = self.benchmark_df[
            self.benchmark_df['objetivo'].isin(target_objectives)
        ]
        
        # Si hay tipo de producto, filtrar también por categoría
        if product_type and product_type in self.product_type_mapping:
            target_categories = self.product_type_mapping[product_type]
            similar = similar[similar['categoria'].isin(target_categories)]
        
        # Si no hay resultados, ampliar búsqueda
        if len(similar) == 0:
            print(f"⚠️ No se encontraron benchmarks para {objective}, usando todos")
            similar = self.benchmark_df
        
        return similar.head(top_n)
    
    def calculate_similarity_score(self, 
                                   recipe_metrics: Dict[str, float],
                                   benchmark: pd.Series) -> Tuple[float, Dict]:
        """
        Calcular score de similitud entre receta y benchmark (0-100).
        
        Args:
            recipe_metrics: Métricas nutricionales de la receta
            benchmark: Producto de referencia del benchmark
            
        Returns:
            Tuple de (score, detalles_por_nutriente)
        """
        # Mapeo de nombres de métricas de receta a columnas de benchmark
        metric_mapping = {
            'protein': 'proteina_g',
            'calories': 'calorias_porcion',
            'vitamin_c': 'vitamina_c_mg',
            'omega_3': 'omega_3_mg',
            'fiber': 'fibra_g',
            'antioxidants': 'antioxidantes_score'
        }
        
        scores = {}
        total_score = 0
        total_weight = 0
        
        for recipe_key, benchmark_key in metric_mapping.items():
            if recipe_key not in recipe_metrics:
                continue
                
            recipe_value = float(recipe_metrics[recipe_key])
            benchmark_value = float(benchmark.get(benchmark_key, 0) or 0)
            
            if benchmark_value == 0:
                # Si benchmark es 0, cualquier valor positivo es bueno
                nutrient_score = 100 if recipe_value > 0 else 100
            else:
                # Calcular diferencia porcentual
                diff_pct = abs(recipe_value - benchmark_value) / benchmark_value * 100
                
                # Score inverso: 0% diff = 100 score, 100% diff = 0 score
                # Usar función exponencial para penalizar grandes diferencias
                nutrient_score = max(0, 100 * np.exp(-diff_pct / 50))
            
            weight = self.nutrient_weights.get(benchmark_key, 0.05)
            scores[benchmark_key] = {
                'recipe_value': recipe_value,
                'benchmark_value': benchmark_value,
                'score': nutrient_score,
                'weight': weight
            }
            
            total_score += nutrient_score * weight
            total_weight += weight
        
        # Normalizar score final
        final_score = total_score / total_weight if total_weight > 0 else 50
        
        return final_score, scores
    
    def analyze_recipe(self, 
                      recipe_data: Dict,
                      recipe_metrics: Dict[str, float]) -> Dict:
        """
        Analizar receta completa y generar reporte de competitividad.
        
        Args:
            recipe_data: Datos de la receta (objetivo, tipo, etc.)
            recipe_metrics: Métricas nutricionales calculadas
            
        Returns:
            Dict con score, benchmarks similares y recomendaciones
        """
        objective = recipe_data.get('primary_objective', 'energy')
        product_type = recipe_data.get('product_type')
        
        # Encontrar benchmarks similares
        similar_benchmarks = self.find_similar_benchmarks(objective, product_type, top_n=3)
        
        if len(similar_benchmarks) == 0:
            return {
                'score': 50,
                'status': 'no_benchmarks',
                'message': 'No hay benchmarks disponibles',
                'recommendations': [
                    'Ajusta las proporciones de macronutrientes',
                    'Considera fortificar con vitaminas clave',
                    'Optimiza la biodisponibilidad de nutrientes',
                    'Balancea el perfil de aminoácidos'
                ]
            }
        
        # Calcular scores contra cada benchmark
        benchmark_scores = []
        for _, benchmark in similar_benchmarks.iterrows():
            score, details = self.calculate_similarity_score(recipe_metrics, benchmark)
            benchmark_scores.append({
                'producto': benchmark['producto'],
                'marca': benchmark['marca'],
                'categoria': benchmark['categoria'],
                'score': score,
                'details': details
            })
        
        # Usar el mejor score
        best_match = max(benchmark_scores, key=lambda x: x['score'])
        avg_score = np.mean([b['score'] for b in benchmark_scores])
        
        # Generar recomendaciones basadas en deficiencias
        recommendations = self._generate_recommendations(
            best_match['details'],
            objective
        )
        
        # Determinar status
        if avg_score >= 80:
            status = 'excellent'
            message = 'Excelente - Composición competitiva en el mercado'
        elif avg_score >= 60:
            status = 'good'
            message = 'Bueno - Composición aceptable, con margen de mejora'
        elif avg_score >= 40:
            status = 'fair'
            message = 'Mejorable - Composición diferente al mercado'
        else:
            status = 'poor'
            message = 'Mejorable - Composición muy diferente al mercado'
        
        return {
            'score': round(avg_score, 1),
            'status': status,
            'message': message,
            'best_match': {
                'producto': best_match['producto'],
                'marca': best_match['marca'],
                'categoria': best_match['categoria'],
                'similarity': round(best_match['score'], 1)
            },
            'top_3_similar': [
                {
                    'producto': b['producto'],
                    'marca': b['marca'],
                    'similarity': round(b['score'], 1)
                }
                for b in sorted(benchmark_scores, key=lambda x: x['score'], reverse=True)[:3]
            ],
            'recommendations': recommendations,
            'nutrient_details': best_match['details']
        }
    
    def _generate_recommendations(self, 
                                 nutrient_details: Dict,
                                 objective: str) -> List[str]:
        """
        Generar recomendaciones específicas basadas en deficiencias.
        
        Args:
            nutrient_details: Detalles de comparación por nutriente
            objective: Objetivo principal
            
        Returns:
            Lista de recomendaciones específicas
        """
        recommendations = []
        
        # Identificar nutrientes con score bajo (<60)
        low_score_nutrients = [
            (name, details) 
            for name, details in nutrient_details.items() 
            if details['score'] < 60
        ]
        
        # Ordenar por importancia (peso)
        low_score_nutrients.sort(key=lambda x: x[1]['weight'], reverse=True)
        
        # Generar recomendaciones por nutriente
        nutrient_recommendations = {
            'proteina_g': 'Aumenta el contenido de proteína agregando más fuentes proteicas (hemp, spirulina, aminoácidos)',
            'vitamina_c_mg': 'Fortifica con vitamina C usando camu camu, acerola o ácido ascórbico',
            'omega_3_mg': 'Agrega fuentes de omega-3 como chia, linaza o aceite de pescado',
            'fibra_g': 'Incrementa la fibra con psyllium, inulina o semillas de chia',
            'antioxidantes_score': 'Mejora el perfil antioxidante con berries, cacao o té verde',
            'magnesio_mg': 'Fortifica con magnesio (citrato, glicinato o bisglicinato)',
            'calcio_mg': 'Agrega calcio mediante citrato de calcio o leche de almendras',
            'cafeina_mg': 'Considera agregar cafeína natural (guaraná, té verde) para energía',
            'vitamina_b12_mcg': 'Fortifica con vitamina B12 (metilcobalamina o cianocobalamina)',
            'calorias_porcion': 'Ajusta las calorías modificando las proporciones de macronutrientes'
        }
        
        # Agregar recomendaciones para los 3 nutrientes más deficientes
        for nutrient_name, details in low_score_nutrients[:3]:
            if nutrient_name in nutrient_recommendations:
                recipe_val = details['recipe_value']
                bench_val = details['benchmark_value']
                
                if recipe_val < bench_val:
                    diff_pct = ((bench_val - recipe_val) / bench_val * 100) if bench_val > 0 else 0
                    rec = nutrient_recommendations[nutrient_name]
                    recommendations.append(f"{rec} (actual: {recipe_val:.1f}, objetivo: {bench_val:.1f}, diff: {diff_pct:.0f}%)")
        
        # Agregar recomendaciones generales si no hay suficientes específicas
        if len(recommendations) < 3:
            general_recommendations = [
                'Optimiza la biodisponibilidad agregando pimienta negra o jengibre',
                'Balancea el perfil de aminoácidos con fuentes complementarias',
                'Considera agregar adaptógenos para mejorar el perfil funcional'
            ]
            recommendations.extend(general_recommendations[:3 - len(recommendations)])
        
        return recommendations[:4]  # Máximo 4 recomendaciones
    
    def generate_optimized_recipe(self,
                                 original_recipe_data: Dict,
                                 original_metrics: Dict,
                                 analysis_result: Dict) -> Dict:
        """
        Generar parámetros optimizados para regenerar la receta.
        
        Args:
            original_recipe_data: Datos originales de la receta
            original_metrics: Métricas nutricionales originales
            analysis_result: Resultado del análisis de competitividad
            
        Returns:
            Dict con parámetros optimizados para regeneración
        """
        # Extraer nutrientes deficientes
        nutrient_details = analysis_result.get('nutrient_details', {})
        
        # Identificar qué nutrientes necesitan mejora
        nutrients_to_boost = []
        for nutrient, details in nutrient_details.items():
            if details['score'] < 70 and details['recipe_value'] < details['benchmark_value']:
                nutrients_to_boost.append(nutrient)
        
        # Crear parámetros optimizados
        optimized_params = original_recipe_data.copy()
        
        # Agregar hints de optimización
        optimized_params['optimization_hints'] = {
            'boost_nutrients': nutrients_to_boost,
            'target_score': 80,
            'benchmark_reference': analysis_result.get('best_match', {}).get('producto'),
            'iteration': optimized_params.get('iteration', 0) + 1
        }
        
        return optimized_params


# Función de conveniencia para integración con el generador
def analyze_and_optimize(recipe_data: Dict, 
                        recipe_metrics: Dict,
                        benchmark_csv: str = 'benchmark_recipes_database.csv') -> Dict:
    """
    Analizar receta y generar análisis de competitividad.
    
    Args:
        recipe_data: Datos de la receta
        recipe_metrics: Métricas nutricionales
        benchmark_csv: Ruta al archivo de benchmarks
        
    Returns:
        Dict con análisis completo
    """
    optimizer = RecipeOptimizer(benchmark_csv)
    return optimizer.analyze_recipe(recipe_data, recipe_metrics)
