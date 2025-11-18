"""
Función de Regeneración Optimizada
Itera hasta lograr score 80-90/100 aplicando recomendaciones del benchmark
"""

from typing import Dict, List
from recipe_generator_v2 import RecipeGeneratorV3
from recipe_optimizer import RecipeOptimizer

def regenerate_optimized(original_recipe_data: Dict,
                        max_iterations: int = 3,
                        target_score: float = 80.0) -> Dict:
    """
    Regenerar receta optimizada iterativamente hasta alcanzar target_score.
    
    Args:
        original_recipe_data: Parámetros originales de la receta
        max_iterations: Número máximo de iteraciones
        target_score: Score objetivo (default: 80/100)
        
    Returns:
        Dict con receta optimizada y historial de iteraciones
    """
    generator = RecipeGeneratorV3(
        db_path='data/db_maestra_superalimentos_ampliada.csv',
        benchmark_csv='benchmark_recipes_database.csv',
        feedback_db=':memory:'
    )
    
    optimizer = RecipeOptimizer('benchmark_recipes_database.csv')
    
    iteration_history = []
    current_data = original_recipe_data.copy()
    best_recipe = None
    best_score = 0
    
    print(f"🔄 REGENERACIÓN OPTIMIZADA")
    print(f"🎯 Objetivo: {target_score}/100")
    print(f"🔁 Máximo {max_iterations} iteraciones")
    print("="*80)
    
    for iteration in range(1, max_iterations + 1):
        print(f"\n📍 ITERACIÓN {iteration}/{max_iterations}")
        print("-"*80)
        
        # Generar receta
        recipe = generator.generate_recipe_with_scoring(current_data)
        
        if 'error' in recipe:
            print(f"❌ Error en iteración {iteration}: {recipe['error']}")
            break
        
        # Obtener score
        benchmark_analysis = recipe.get('benchmark_analysis', {})
        current_score = benchmark_analysis.get('overall_score', 0)
        recommendations = benchmark_analysis.get('recommendations', [])
        
        print(f"📊 Score actual: {current_score}/100")
        print(f"📝 Receta: {recipe.get('name', 'N/A')}")
        print(f"🥗 Ingredientes: {len(recipe.get('ingredients', []))}")
        
        # Guardar en historial
        iteration_history.append({
            'iteration': iteration,
            'score': current_score,
            'recipe_name': recipe.get('name'),
            'ingredients_count': len(recipe.get('ingredients', [])),
            'recommendations': recommendations
        })
        
        # Actualizar mejor receta
        if current_score > best_score:
            best_score = current_score
            best_recipe = recipe
            print(f"✅ Nuevo mejor score: {best_score}/100")
        
        # Verificar si alcanzamos el objetivo
        if current_score >= target_score:
            print(f"\n🎉 ¡OBJETIVO ALCANZADO! Score: {current_score}/100")
            break
        
        # Si no es la última iteración, aplicar optimizaciones
        if iteration < max_iterations:
            print(f"\n💡 Aplicando optimizaciones para siguiente iteración:")
            
            # Mostrar recomendaciones
            for i, rec in enumerate(recommendations[:3], 1):
                print(f"   {i}. {rec}")
            
            # Preparar datos para siguiente iteración
            current_data = _apply_optimizations(
                current_data,
                benchmark_analysis,
                iteration
            )
    
    # Resultado final
    print("\n" + "="*80)
    print(f"📊 RESULTADO FINAL")
    print(f"✅ Mejor score: {best_score}/100")
    print(f"🔁 Iteraciones: {len(iteration_history)}")
    print(f"📈 Mejora: {best_score - iteration_history[0]['score']:.1f} puntos")
    
    return {
        'optimized_recipe': best_recipe,
        'final_score': best_score,
        'iterations': len(iteration_history),
        'iteration_history': iteration_history,
        'target_reached': best_score >= target_score
    }


def _apply_optimizations(recipe_data: Dict,
                        benchmark_analysis: Dict,
                        iteration: int) -> Dict:
    """
    Aplicar optimizaciones basadas en recomendaciones del benchmark.
    
    Args:
        recipe_data: Datos actuales de la receta
        benchmark_analysis: Análisis de benchmark
        iteration: Número de iteración actual
        
    Returns:
        Datos optimizados para siguiente iteración
    """
    optimized_data = recipe_data.copy()
    
    # Extraer deficiencias nutricionales
    nutrient_details = benchmark_analysis.get('nutrient_details', {})
    recommendations = benchmark_analysis.get('recommendations', [])
    
    # Identificar nutrientes que necesitan mejora
    low_score_nutrients = []
    for nutrient, details in nutrient_details.items():
        if details.get('score', 100) < 70:  # Solo nutrientes con score < 70
            low_score_nutrients.append({
                'nutrient': nutrient,
                'score': details['score'],
                'recipe_value': details['recipe_value'],
                'benchmark_value': details['benchmark_value']
            })
    
    # Ordenar por score (peor primero)
    low_score_nutrients.sort(key=lambda x: x['score'])
    
    # Estrategias de optimización por nutriente
    optimization_strategies = {
        'proteina_g': ['cáñamo', 'espirulina', 'leucina', 'glutamina'],
        'vitamina_c_mg': ['camu camu', 'acerola', 'vitamina c'],
        'omega_3_mg': ['chia', 'linaza', 'omega 3'],
        'fibra_g': ['psyllium', 'inulina', 'chia'],
        'antioxidantes_score': ['acai', 'goji', 'cacao', 'matcha'],
        'magnesio_mg': ['magnesio', 'espinaca', 'almendras'],
        'calcio_mg': ['calcio', 'almendras', 'chia'],
        'vitamina_b12_mcg': ['vitamina b12', 'espirulina'],
        'hierro_mg': ['hierro', 'espirulina', 'espinaca'],
        'zinc_mg': ['zinc', 'semillas calabaza']
    }
    
    # ✅ FASE 2: Generar optimization_hints para el generador
    boost_sources = []
    target_nutrients = []
    
    # Tomar los 2 nutrientes con peor score
    for nutrient_info in low_score_nutrients[:2]:
        nutrient = nutrient_info['nutrient']
        target_nutrients.append(nutrient)
        
        # Agregar fuentes de ese nutriente
        if nutrient in optimization_strategies:
            boost_sources.extend(optimization_strategies[nutrient])
    
    # Crear hints de optimización
    optimized_data['optimization_hints'] = {
        'target_nutrients': target_nutrients,
        'boost_sources': boost_sources,
        'iteration': iteration
    }
    
    print(f"💡 DEBUG: Optimization hints generados:")
    print(f"   - Target nutrients: {target_nutrients}")
    print(f"   - Boost sources: {boost_sources}")
    
    return optimized_data


# Función de conveniencia para uso desde API/UI
def regenerate_from_recipe_id(recipe_id: str,
                              max_iterations: int = 3,
                              target_score: float = 80.0) -> Dict:
    """
    Regenerar receta optimizada a partir de un recipe_id existente.
    
    Args:
        recipe_id: ID de la receta original
        max_iterations: Número máximo de iteraciones
        target_score: Score objetivo
        
    Returns:
        Dict con receta optimizada
    """
    # TODO: Implementar carga de receta desde DB
    # Por ahora, retornar error
    return {
        'error': 'Función no implementada aún. Use regenerate_optimized() con datos originales.'
    }
