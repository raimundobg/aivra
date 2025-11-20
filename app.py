"""
app.py - Flask App con Generador de Recetas + Sistema de Autenticación
Versión: 3.4 - Fixed Duplicate Routes
"""
from flask import Flask, render_template, request, jsonify, send_from_directory, redirect, url_for, flash
from flask_login import LoginManager, login_required, current_user
import sys
import os
import traceback
import json

# Agregar el directorio actual al path para importar el generador
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

app = Flask(__name__)

# ============================================
# CONFIGURACIÓN
# ============================================

# Secret key para sesiones
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-cambiar-en-produccion')

# Configuración de base de datos
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///local.db')

# Fix para Railway PostgreSQL
if app.config['SQLALCHEMY_DATABASE_URI'].startswith('postgres://'):
    app.config['SQLALCHEMY_DATABASE_URI'] = app.config['SQLALCHEMY_DATABASE_URI'].replace('postgres://', 'postgresql://', 1)

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_size': 10,
    'pool_recycle': 3600,
}

# ============================================
# INICIALIZAR EXTENSIONES
# ============================================

# CORS
try:
    from flask_cors import CORS
    CORS(app)
    print("✅ CORS habilitado")
except ImportError:
    print("⚠️ CORS no disponible (flask-cors no instalado)")
    @app.after_request
    def after_request(response):
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response

# Base de datos y autenticación
try:
    from models import db, User, UserRecipe, Review, UserType, SubscriptionPlan, PatientFile
    from auth import auth_bp
    import pandas as pd
    
    
    db.init_app(app)
    
    # Configurar Flask-Login
    login_manager = LoginManager()
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'
    login_manager.login_message = 'Por favor inicia sesión para acceder'
    login_manager.login_message_category = 'info'
    
    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))
    
    # Registrar blueprints
    app.register_blueprint(auth_bp, url_prefix='/auth')
    
    print("✅ Sistema de autenticación habilitado")
    AUTH_ENABLED = True
except ImportError as e:
    print(f"⚠️ Sistema de autenticación no disponible: {e}")
    AUTH_ENABLED = False

# ============================================
# VARIABLES GLOBALES
# ============================================

debug_logs = []

def log_debug(message):
    """Función para agregar logs que se pueden ver en la web."""
    print(message)
    debug_logs.append(message)
    if len(debug_logs) > 50:
        debug_logs.pop(0)

# ============================================
# RUTAS PRINCIPALES
# ============================================

@app.route('/')
def index():
    
    """Sirve la página principal."""
    return send_from_directory('.', 'index.html')

# ============================================
# RUTAS DE DASHBOARDS
# ============================================

@app.route('/dashboard')
@app.route('/dashboard/')
@login_required
def dashboard():
    """Redirige al dashboard específico según el rol del usuario"""
    # Usar strings directos en lugar de UserType
    if current_user.user_type == 'nutricionista':
        return redirect('/dashboard/nutritionist')
    elif current_user.user_type == 'empresa':
        return redirect('/dashboard/enterprise')
    elif current_user.user_type == 'cliente':
        return redirect('/dashboard/client')
    else:
        return redirect('/dashboard/client')

@app.route('/dashboard/client')
@login_required
def client_dashboard():
    """Dashboard para clientes (plan FREE)"""
    if AUTH_ENABLED:
        try:
            recipes = UserRecipe.query.filter_by(user_id=current_user.id)\
                                     .order_by(UserRecipe.created_at.desc())\
                                     .limit(10)\
                                     .all()
            total_recipes = UserRecipe.query.filter_by(user_id=current_user.id).count()
        except:
            recipes = []
            total_recipes = 0
    else:
        recipes = []
        total_recipes = 0
    
    recipes_remaining = current_user.get_recipes_remaining() if AUTH_ENABLED else 0
    
    # ✅ IMPORTANTE: Agregar user=current_user
    return render_template('client_dashboard.html',
                         user=current_user,  # ← AGREGAR ESTA LÍNEA
                        current_user=current_user,  # Por si acaso usa current_user en el template
                         recipes=recipes,
                         recipes_remaining=recipes_remaining,
                         total_recipes=total_recipes)

@app.route('/dashboard/nutritionist')
@login_required
def nutritionist_dashboard():
    """Dashboard para nutricionistas"""
    if current_user.user_type != 'nutricionista':
        flash('No tienes permisos para acceder a esta página', 'danger')
        return redirect(url_for('dashboard'))
    
    if AUTH_ENABLED:
        try:
            recipes = UserRecipe.query.filter_by(user_id=current_user.id)\
                                     .order_by(UserRecipe.created_at.desc())\
                                     .limit(10)\
                                     .all()
            total_recipes = UserRecipe.query.filter_by(user_id=current_user.id).count()
            log_debug(f"✅ Dashboard nutricionista: {total_recipes} recetas encontradas")
        except Exception as e:
            log_debug(f"⚠️ Error obteniendo recetas: {e}")
            recipes = []
            total_recipes = 0
    else:
        recipes = []
        total_recipes = 0
    
    # ✅ IMPORTANTE: Agregar user=current_user
    return render_template('nutritionist_dashboard.html',
                         user=current_user,  # ← AGREGAR ESTA LÍNEA
                         recipes=recipes,
                         total_recipes=total_recipes)

@app.route('/dashboard/enterprise')
@login_required
def enterprise_dashboard():
    """Dashboard para empresas con explorador de ingredientes"""
    # Cambiar UserType.EMPRESA por el string directo
    if current_user.user_type != 'empresa':
        flash('No tienes permisos para acceder a esta página', 'danger')
        return redirect(url_for('dashboard'))
    
    if AUTH_ENABLED:
        try:
            recipes = UserRecipe.query.filter_by(user_id=current_user.id)\
                                     .order_by(UserRecipe.created_at.desc())\
                                     .limit(20)\
                                     .all()
            total_recipes = UserRecipe.query.filter_by(user_id=current_user.id).count()
            
            # Calcular estadísticas
            recipes_remaining = current_user.get_recipes_remaining()
            if recipes_remaining == float('inf'):
                recipes_remaining = 'Ilimitadas'
                
        except Exception as e:
            print(f"Error en enterprise_dashboard: {e}")
            recipes = []
            total_recipes = 0
            recipes_remaining = 0
    else:
        recipes = []
        total_recipes = 0
        recipes_remaining = 0
    
    # ✅ IMPORTANTE: Pasar 'user' explícitamente
    return render_template('enterprise_dashboard.html',
                         user=current_user,  # ← ESTA LÍNEA ES CRÍTICA
                         recipes=recipes,
                         total_recipes=total_recipes,
                         recipes_remaining=recipes_remaining)

@app.route('/explore-ingredients')
@login_required
def explore_ingredients():
    """Explorador de superalimentos e ingredientes"""
    if current_user.user_type != 'empresa':
        flash('Acceso denegado. Esta función es solo para empresas.', 'danger')
        return redirect(url_for('dashboard'))
    
    return render_template('explore_ingredients.html', user=current_user)

@app.route('/my-recipes')
@login_required
def my_recipes():
    """Ver todas mis recetas"""
    if AUTH_ENABLED:
        try:
            recipes = UserRecipe.query.filter_by(user_id=current_user.id)\
                                      .order_by(UserRecipe.created_at.desc())\
                                      .all()
        except:
            recipes = []
    else:
        recipes = []
    
    return render_template('my_recipes.html', recipes=recipes)
@app.route('/api/superfoods', methods=['GET'])
@login_required
def get_superfoods():
    """API para obtener datos de superalimentos desde el CSV"""
    try:
        # Leer CSV de superalimentos
        df = pd.read_csv('data/db_maestra_superalimentos_ampliada.csv')
        
        # Parámetros de filtro
        category = request.args.get('category', 'all')
        search = request.args.get('search', '').lower()
        
        # Filtrar por categoría
        if category != 'all':
            df = df[df['categoria_id'] == category]
        
        # Filtrar por búsqueda
        if search:
            mask = (
                df['nombre'].str.lower().str.contains(search, na=False) |
                df['descripcion'].str.lower().str.contains(search, na=False) |
                df['nombre_cientifico'].str.lower().str.contains(search, na=False)
            )
            df = df[mask]
        
        # Seleccionar columnas relevantes para mostrar
        columns_to_show = [
            'superalimento_id', 'nombre', 'nombre_cientifico', 'categoria_id',
            'descripcion', 'origen', 'forma_consumo', 'precio_relativo',
            'calorias', 'proteinas', 'carbohidratos', 'grasas_totales',
            'omega_3', 'fibra', 'vitamina_c', 'vitamina_a', 'calcio',
            'hierro', 'magnesio', 'capacidad_antioxidante_total',
            'funcion_principal', 'biodisponibilidad_porcentaje'
        ]
        
        # Filtrar solo columnas que existan
        available_columns = [col for col in columns_to_show if col in df.columns]
        df_filtered = df[available_columns]
        
        # Convertir a lista de diccionarios
        superfoods = df_filtered.fillna('').to_dict('records')
        
        log_debug(f"✅ API Superfoods: {len(superfoods)} resultados (categoria: {category}, búsqueda: '{search}')")
        
        return jsonify({
            'success': True,
            'data': superfoods,
            'total': len(superfoods)
        })
    
    except Exception as e:
        log_debug(f"❌ Error en API Superfoods: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
        
@app.route('/api/check-recipe-limit', methods=['GET'])
@login_required
def check_recipe_limit():
    """Verifica si el usuario puede generar más recetas"""
    can_generate = current_user.can_generate_recipe()
    remaining = current_user.get_recipes_remaining()
    
    # Convertir infinity a string
    if remaining == float('inf'):
        remaining_display = 'unlimited'
        limit_display = 'unlimited'
    else:
        remaining_display = remaining
        limit_display = current_user.subscription_plan
    
    return jsonify({
        'success': True,
        'can_generate': can_generate,
        'remaining': remaining_display,
        'limit': limit_display,
        'plan_type': current_user.subscription_plan
    })
@app.route('/api/recipe-history', methods=['GET'])
@login_required
def recipe_history():
    """Obtiene el historial de recetas generadas del usuario"""
    try:
        recipes = UserRecipe.query.filter_by(user_id=current_user.id)\
            .order_by(UserRecipe.created_at.desc())\
            .all()
        
        recipes_data = []
        for recipe in recipes:
            recipes_data.append({
                'id': recipe.id,
                'name': recipe.recipe_name,
                'data': recipe.recipe_data,
                'created_at': recipe.created_at.strftime('%Y-%m-%d %H:%M'),
                'view_count': recipe.view_count
            })
        
        return jsonify({
            'success': True,
            'recipes': recipes_data
        })
    
    except Exception as e:
        log_debug(f"❌ Error en recipe_history: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
        
@app.route('/profile')
@login_required
def profile():
    """Ver perfil de usuario"""
    if AUTH_ENABLED:
        try:
            total_recipes = UserRecipe.query.filter_by(user_id=current_user.id).count()
            total_reviews = Review.query.filter_by(user_id=current_user.id).count()
        except:
            total_recipes = 0
            total_reviews = 0
    else:
        total_recipes = 0
        total_reviews = 0
    
    return render_template('profile.html',
                         total_recipes=total_recipes,
                         total_reviews=total_reviews)

# ============================================
# RUTAS DE API
# ============================================

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
                    log_debug(f"✅ {file_path}: {len(df)} filas")
                except Exception as e:
                    results[file_path] = {'exists': True, 'error': str(e)}
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
        
        if not data.get('primary_objective'):
            error_msg = 'El objetivo principal es requerido'
            log_debug(f"❌ {error_msg}")
            return jsonify({'error': error_msg}), 400
        
        # Verificar límites si el usuario está autenticado
        if AUTH_ENABLED and current_user.is_authenticated:
            if not current_user.can_generate_recipe():
                return jsonify({
                    'error': 'Has alcanzado el límite de recetas de tu plan',
                    'recipes_remaining': 0,
                    'upgrade_required': True
                }), 403
        
        # Generar receta
        try:
            from recipe_generator_v2 import RecipeGeneratorV3
            
            generator = RecipeGeneratorV3(
                db_path='data/db_maestra_superalimentos_ampliada.csv',
                benchmark_csv='benchmark_recipes_database.csv',
                feedback_db='user_feedback.db'
            )
        except ImportError as e:
            error_msg = f"Error importando RecipeGeneratorV3: {str(e)}"
            log_debug(f"❌ {error_msg}")
            return jsonify({'error': error_msg}), 500
        
        recipe = generator.generate_recipe_with_scoring(data)
        
        # 🔧 FIX: Limpiar valores Infinity antes de enviar JSON
        def clean_infinity(obj):
            """Reemplaza Infinity con un valor muy grande"""
            if isinstance(obj, dict):
                return {k: clean_infinity(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [clean_infinity(item) for item in obj]
            elif isinstance(obj, float):
                if obj == float('inf'):
                    return 999999
                elif obj == float('-inf'):
                    return -999999
                elif obj != obj:  # NaN check
                    return 0
            return obj
        
        recipe = clean_infinity(recipe)
        
        # Guardar receta si usuario está autenticado
        if AUTH_ENABLED and current_user.is_authenticated:
            try:
                user_recipe = UserRecipe(
                    user_id=current_user.id,
                    recipe_name=recipe.get('name', 'Mi Receta'),
                    recipe_data=recipe
                )
                db.session.add(user_recipe)
                current_user.increment_recipe_count()
                db.session.commit()
                
                recipe['recipe_id'] = user_recipe.id
                
                # 🔧 FIX: Calcular recipes_remaining de forma segura
                recipes_remaining = current_user.get_recipes_remaining()
                if recipes_remaining == float('inf'):
                    recipe['recipes_remaining'] = 'unlimited'
                else:
                    recipe['recipes_remaining'] = recipes_remaining
                    
                log_debug(f"✅ Receta guardada para {current_user.email}")
            except Exception as e:
                log_debug(f"⚠️ Error guardando receta: {e}")
        else:
            # Usuario no autenticado (desde landing)
            recipe['recipes_remaining'] = 'unlimited'
        
        return jsonify(recipe)
        
    except Exception as e:
        error_msg = f'Error interno del servidor: {str(e)}'
        log_debug(f"❌ {error_msg}")
        return jsonify({'error': error_msg}), 500
    
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
            
            # Si hay autenticación y usuario logueado, guardar en BD
            if AUTH_ENABLED and current_user.is_authenticated:
                try:
                    new_review = Review(
                        user_id=current_user.id,
                        recipe_id=recipe_id,
                        rating=rating,
                        comment=comment
                    )
                    db.session.add(new_review)
                    db.session.commit()
                    log_debug(f"✅ Review guardado para usuario {current_user.email}")
                except Exception as e:
                    log_debug(f"⚠️ Error guardando review: {e}")
            
            # Mantener funcionalidad existente
            from recipe_generator_v2 import RecipeGeneratorV3
            generator = RecipeGeneratorV3()
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
    """Endpoint para regenerar receta optimizada."""
    try:
        log_debug("🔄 === INICIANDO REGENERACIÓN OPTIMIZADA ===")
        
        data = request.get_json()
        
        from regenerate_optimized import regenerate_optimized
        
        result = regenerate_optimized(
            original_recipe_data=data,
            target_score=float(data.get('target_score', 80)),
            max_iterations=int(data.get('max_iterations', 3))
        )
        
        log_debug(f"✅ Regeneración completada")
        
        return jsonify(result)
        
    except Exception as e:
        error_msg = f'Error en regeneración: {str(e)}'
        log_debug(f"❌ {error_msg}")
        return jsonify({'error': error_msg}), 500

# ============================================
# RUTAS ESTÁTICAS ESPECÍFICAS
# ============================================

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

# ============================================
# RUTA ESTÁTICA GENÉRICA (SOLO UNA VEZ, AL FINAL)
# ============================================

@app.route('/<path:filename>')
def serve_static(filename):
    """Sirve archivos estáticos (solo archivos que existen)."""
    
    # Lista de extensiones permitidas
    allowed_extensions = ['.html', '.css', '.js', '.png', '.jpg', '.jpeg', '.gif', 
                         '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.map',
                         '.json', '.xml', '.txt', '.pdf']
    
    # Verificar extensión
    file_ext = os.path.splitext(filename)[1].lower()
    
    # Si no tiene extensión permitida, rechazar
    if file_ext and file_ext not in allowed_extensions:
        log_debug(f"🚫 Extensión no permitida: {filename}")
        return jsonify({'error': 'Tipo de archivo no permitido'}), 403
    
    # BLOQUEAR acceso a carpeta templates
    if filename.startswith('templates/') or '/templates/' in filename:
        log_debug(f"🚫 Bloqueado acceso a template: {filename}")
        return jsonify({'error': 'Acceso denegado'}), 403
    
    # BLOQUEAR archivos Python
    if filename.endswith('.py') or filename.endswith('.pyc'):
        return jsonify({'error': 'Acceso denegado'}), 403
    
    # BLOQUEAR archivos sensibles
    if filename in ['app.py', 'models.py', 'auth.py', 'requirements.txt', '.env']:
        return jsonify({'error': 'Acceso denegado'}), 403
    
    # Verificar que el archivo existe
    if os.path.exists(filename) and os.path.isfile(filename):
        log_debug(f"✅ Sirviendo archivo: {filename}")
        return send_from_directory('.', filename)
    
    # Si no existe, devolver 404
    log_debug(f"❌ Archivo no encontrado: {filename}")
    return jsonify({'error': 'Endpoint no encontrado'}), 404

# ============================================
# HEALTH CHECK Y ERROR HANDLERS
# ============================================

@app.route('/health')
def health_check():
    """Endpoint de salud para verificar que la aplicación funciona."""
    log_debug("💚 Health check solicitado")
    
    db_status = 'not_configured'
    if AUTH_ENABLED:
        try:
            db.session.execute('SELECT 1')
            db_status = 'connected'
        except:
            db_status = 'disconnected'
    
    return jsonify({
        'status': 'healthy',
        'message': 'Generador de Recetas API funcionando correctamente',
        'version': 'v3.4 - Fixed Duplicate Routes',
        'auth_enabled': AUTH_ENABLED,
        'database': db_status,
        'working_directory': os.getcwd()
    })

@app.errorhandler(404)
def not_found(error):
    log_debug(f"❌ 404 Error: {request.url}")
    return jsonify({'error': 'Endpoint no encontrado'}), 404

@app.errorhandler(500)
def internal_error(error):
    log_debug(f"❌ 500 Error: {str(error)}")
    return jsonify({'error': 'Error interno del servidor'}), 500

# ============================================
# INICIALIZACIÓN
# ============================================

if AUTH_ENABLED:
    with app.app_context():
        try:
            db.create_all()
            print("✅ Tablas de base de datos creadas/verificadas")
        except Exception as e:
            print(f"❌ Error creando tablas: {e}")

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print("=" * 80)
    print("🚀 GENERADOR DE RECETAS V3.4 - FIXED")
    print("=" * 80)
    print(f"🌐 Puerto: {port}")
    print(f"📂 Directorio: {os.getcwd()}")
    print(f"🔐 Autenticación: {'✅ Habilitada' if AUTH_ENABLED else '❌ Deshabilitada'}")
    print("=" * 80)
    
    app.run(debug=False, host='0.0.0.0', port=port)