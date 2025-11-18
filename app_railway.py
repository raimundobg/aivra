from flask import Flask, render_template, request, jsonify, send_from_directory
import sys
import os
import traceback
import json

# Agregar el directorio actual al path para importar el generador
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

app = Flask(__name__)

# Intentar habilitar CORS si está disponible
try:
    from flask_cors import CORS
    CORS(app)
    print("✅ CORS habilitado")
except ImportError:
    print("⚠️ CORS no disponible (flask-cors no instalado)")
    # Agregar headers CORS manualmente
    @app.after_request
    def after_request(response):
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response

# Variable global para almacenar logs
debug_logs = []

def log_debug(message):
    """Función para agregar logs que se pueden ver en la web."""
    print(message)  # También imprimir en consola
    debug_logs.append(message)
    # Mantener solo los últimos 50 logs
    if len(debug_logs) > 50:
        debug_logs.pop(0)

@app.route('/')
def index():
    """Sirve la página principal."""
    return send_from_directory('.', 'index.html')

@app.route('/debug_logs')
def get_debug_logs():
    """Endpoint para obtener los logs de debug."""
    return jsonify({'logs': debug_logs})

@app.route('/test_data')
def test_data():
    """Endpoint para verificar que los datos estén cargados correctamente."""
    try:
        import pandas as pd
        
        log_debug("🔍 TESTING: Verificando archivos de datos...")
        
        # Verificar que existan los archivos
        data_files = [
            'data/db_maestra_superalimentos_ampliada.csv'
        ]
        
        results = {}
        
        for file_path in data_files:
            if os.path.exists(file_path):
                try:
                    df = pd.read_csv(file_path)
                    results[file_path] = {
                        'exists': True,
                        'rows': len(df),
                        'columns': list(df.columns)
                    }
                    log_debug(f"✅ {file_path}: {len(df)} filas, columnas: {list(df.columns)}")
                except Exception as e:
                    results[file_path] = {
                        'exists': True,
                        'error': str(e)
                    }
                    log_debug(f"❌ Error leyendo {file_path}: {str(e)}")
            else:
                results[file_path] = {'exists': False}
                log_debug(f"❌ Archivo no encontrado: {file_path}")
        
        return jsonify(results)
        
    except Exception as e:
        error_msg = f"Error en test_data: {str(e)}"
        log_debug(f"❌ {error_msg}")
        return jsonify({'error': error_msg}), 500

@app.route('/generate_recipe', methods=['POST'])
def generate_recipe():
    """Endpoint para generar recetas personalizadas."""
    try:
        log_debug("🚀 === INICIANDO GENERACIÓN DE RECETA ===")
        
        data = request.get_json()
        
        if not data:
            error_msg = 'No se recibieron datos'
            log_debug(f"❌ {error_msg}")
            return jsonify({'error': error_msg}), 400
        
        log_debug(f"📥 Datos recibidos: {json.dumps(data, indent=2)}")
        
        # Validar que se proporcione al menos el objetivo principal
        if not data.get('primary_objective'):
            error_msg = 'El objetivo principal es requerido'
            log_debug(f"❌ {error_msg}")
            return jsonify({'error': error_msg}), 400
        
        # Intentar importar el generador de recetas V3
        try:
            log_debug("📦 Importando recipe_generator V3...")
            from recipe_generator_v2 import RecipeGeneratorV3
            
            # Inicializar generador V3 (con scoring y feedback)
            generator = RecipeGeneratorV3(
                db_path='data/db_maestra_superalimentos_ampliada.csv',
                benchmark_csv='benchmark_recipes_database.csv',
                feedback_db='user_feedback.db'
            )
            log_debug("✅ RecipeGeneratorV3 inicializado")
        except ImportError as e:
            error_msg = f"Error importando RecipeGeneratorV3: {str(e)}"
            log_debug(f"❌ {error_msg}")
            return jsonify({'error': error_msg}), 500
        
        # Generar la receta con scoring
        log_debug("🔧 Generando receta con scoring...")
        recipe = generator.generate_recipe_with_scoring(data)
        
        log_debug(f"📊 Receta generada exitosamente")
        
        return jsonify(recipe)
        
    except Exception as e:
        error_msg = f'Error interno del servidor: {str(e)}'
        log_debug(f"❌ {error_msg}")
        log_debug(f"❌ Traceback: {traceback.format_exc()}")
        return jsonify({'error': error_msg}), 500

@app.route('/css/<path:filename>')
def serve_css(filename):
    """Sirve archivos CSS."""
    return send_from_directory('css', filename)

@app.route('/js/<path:filename>')
def serve_js(filename):
    """Sirve archivos JavaScript."""
    return send_from_directory('js', filename)

@app.route('/images/<path:filename>')
def serve_images(filename):
    """Sirve archivos de imágenes."""
    return send_from_directory('images', filename)

@app.route('/images/products/<path:filename>')
def serve_product_images(filename):
    """Sirve archivos de imágenes de productos."""
    return send_from_directory('images/products', filename)

@app.route('/<path:filename>')
def serve_static(filename):
    """Sirve archivos estáticos."""
    return send_from_directory('.', filename)

@app.route('/health')
def health_check():
    """Endpoint de salud para verificar que la aplicación funciona."""
    log_debug("💚 Health check solicitado")
    return jsonify({
        'status': 'healthy',
        'message': 'Generador de Recetas de Superalimentos API funcionando correctamente',
        'version': 'v2.0 - Railway Production',
        'working_directory': os.getcwd(),
        'python_path': sys.path
    })

@app.errorhandler(404)
def not_found(error):
    log_debug(f"❌ 404 Error: {request.url}")
    return jsonify({'error': 'Endpoint no encontrado'}), 404

@app.errorhandler(500)
def internal_error(error):
    log_debug(f"❌ 500 Error: {str(error)}")
    return jsonify({'error': 'Error interno del servidor'}), 500

@app.route('/submit_feedback', methods=['POST'])
def submit_feedback():
    """Endpoint para enviar feedback de una receta."""
    try:
        data = request.get_json()
        
        recipe_id = data.get('recipe_id')
        user_id = data.get('user_id', 'anonymous')
        rating = data.get('rating')
        comment = data.get('comment', '')
        
        if not recipe_id or not rating:
            return jsonify({'error': 'recipe_id y rating son requeridos'}), 400
        
        if rating < 1 or rating > 5:
            return jsonify({'error': 'rating debe estar entre 1 y 5'}), 400
        
        # Importar generador
        from recipe_generator_v2 import RecipeGeneratorV3
        generator = RecipeGeneratorV3()
        
        # Guardar feedback
        success = generator.submit_feedback(recipe_id, user_id, rating, comment)
        
        if success:
            return jsonify({'success': True, 'message': 'Feedback guardado'})
        else:
            return jsonify({'error': 'Error guardando feedback'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/get_feedback/<recipe_id>')
def get_feedback(recipe_id):
    """Endpoint para obtener feedback de una receta."""
    try:
        from recipe_generator_v2 import RecipeGeneratorV3
        generator = RecipeGeneratorV3()
        
        feedback = generator.get_recipe_feedback(recipe_id)
        return jsonify(feedback)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/regenerate_optimized', methods=['POST'])
def regenerate_optimized_endpoint():
    """✅ NUEVO: Endpoint para regenerar receta optimizada."""
    try:
        log_debug("🔄 === INICIANDO REGENERACIÓN OPTIMIZADA ===")
        
        data = request.get_json()
        log_debug(f"📋 Parámetros recibidos: {data.keys()}")
        
        # Importar regenerate_optimized
        from regenerate_optimized import regenerate_optimized
        
        # Llamar función de regeneración
        result = regenerate_optimized(
            original_recipe_data=data,
            target_score=float(data.get('target_score', 80)),
            max_iterations=int(data.get('max_iterations', 3))
        )
        
        log_debug(f"✅ Regeneración completada: Score {result.get('final_score', 0)}/100")
        
        return jsonify(result)
        
    except Exception as e:
        error_msg = f'Error en regeneración: {str(e)}'
        log_debug(f"❌ {error_msg}")
        log_debug(f"❌ Traceback: {traceback.format_exc()}")
        return jsonify({'error': error_msg}), 500

# ✅ CONFIGURACIÓN PARA RAILWAY (PRODUCCIÓN)
if __name__ == '__main__':
    # Obtener puerto de Railway (variable de entorno $PORT)
    port = int(os.environ.get('PORT', 5000))
    
    print("=" * 80)
    print("🚀 GENERADOR DE RECETAS V3.0 - RAILWAY PRODUCTION")
    print("=" * 80)
    print(f"🌐 Puerto: {port}")
    print(f"📂 Directorio: {os.getcwd()}")
    print(f"🐍 Python: {sys.version}")
    print("=" * 80)
    print("✅ Sistema de priorización de nutrientes")
    print("✅ Sistema de scoring con benchmarks")
    print("✅ Sistema de feedback de usuarios")
    print("=" * 80)
    print("")
    
    # ⚠️ IMPORTANTE: debug=False en producción
    app.run(debug=False, host='0.0.0.0', port=port)
