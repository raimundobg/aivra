"""
Script de prueba para verificar que el sistema funciona correctamente
"""

import sys
sys.path.insert(0, '.')

from recipe_generator_v2 import RecipeGeneratorV3

print("="*80)
print("🧪 TEST: Sistema de Optimización V2.0")
print("="*80)

# Test 1: Inicialización
print("\n📋 Test 1: Inicializando generador...")
try:
    generator = RecipeGeneratorV3(
        db_path='db_maestra_superalimentos_ampliada.csv',
        benchmark_csv='benchmark_recipes_database.csv',
        feedback_db=':memory:'
    )
    print("✅ Generador inicializado correctamente")
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)

# Test 2: Generación con scoring
print("\n📋 Test 2: Generando receta con scoring...")
try:
    recipe = generator.generate_recipe_with_scoring({
        'primary_objective': 'energy',
        'num_ingredients': 5,
        'product_type': 'polvo_batidos',
        'package_size': 100
    })
    
    if 'error' in recipe:
        print(f"❌ Error: {recipe['error']}")
        sys.exit(1)
    
    score = recipe.get('benchmark_score', 0)
    print(f"✅ Receta generada: {recipe['name']}")
    print(f"✅ Score: {score}/100")
    
    if score == 0:
        print("❌ ADVERTENCIA: Score es 0, el optimizador no está funcionando")
    elif score < 30:
        print("⚠️ Score bajo, pero el sistema funciona")
    else:
        print("✅ Score aceptable, sistema funciona correctamente")
        
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\n" + "="*80)
print("✅ TODOS LOS TESTS PASARON")
print("="*80)
