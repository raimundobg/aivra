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
import io
from datetime import datetime, date

# Fix encoding for Windows console
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# Cargar variables de entorno desde .env
try:
    from dotenv import load_dotenv
    load_dotenv(override=False)
    print("[OK] Variables de entorno cargadas desde .env (sin sobreescribir)")
except ImportError:
    pass  # dotenv no instalado, usar variables de entorno del sistema

# Agregar el directorio actual al path para importar el generador
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

app = Flask(__name__)

# ============================================
# CONFIGURACIÓN
# ============================================

# Secret key para sesiones
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-cambiar-en-produccion')

# Session cookie configuration for Railway (HTTPS)
if os.environ.get('RAILWAY_ENVIRONMENT') or os.environ.get('DATABASE_URL'):
    # Production settings
    app.config['SESSION_COOKIE_SECURE'] = True
    app.config['SESSION_COOKIE_HTTPONLY'] = True
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
    app.config['REMEMBER_COOKIE_SECURE'] = True
    app.config['REMEMBER_COOKIE_HTTPONLY'] = True

# Configuración de base de datos
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///local.db')

# Fix para Railway PostgreSQL
if app.config['SQLALCHEMY_DATABASE_URI'].startswith('postgres://'):
    app.config['SQLALCHEMY_DATABASE_URI'] = app.config['SQLALCHEMY_DATABASE_URI'].replace('postgres://', 'postgresql://', 1)

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# SQLite needs special handling for concurrent access
if 'sqlite' in app.config['SQLALCHEMY_DATABASE_URI']:
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'connect_args': {'timeout': 30, 'check_same_thread': False},
        'pool_size': 1,
        'pool_recycle': 3600,
    }
else:
    # PostgreSQL settings for Railway
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'pool_size': 5,
        'max_overflow': 2,
        'pool_recycle': 300,
        'pool_pre_ping': True,  # Test connections before use
        'pool_timeout': 30,
    }

# ============================================
# INICIALIZAR EXTENSIONES
# ============================================

# CORS
try:
    from flask_cors import CORS
    CORS(app)
    print("[OK] CORS habilitado")
except ImportError:
    print("[WARN] CORS no disponible (flask-cors no instalado)")
    @app.after_request
    def after_request(response):
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response

# Base de datos y autenticación
try:
    from models import (db, User, UserRecipe, Review, UserType, SubscriptionPlan,
                        PatientFile, NutritionistSchedule, Booking, NutritionistReview,
                        BookingStatus, NUTRITIONIST_SPECIALTIES, SPECIALTIES_DICT)
    from auth import auth_bp
    import pandas as pd
    from functools import lru_cache
    from pauta_generator import PautaInteligente
    from email_service import init_mail, send_intake_email, send_booking_confirmation, send_booking_reminder, is_mail_configured


    db.init_app(app)
    init_mail(app)
    
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
    
    print("[OK] Sistema de autenticación habilitado")
    AUTH_ENABLED = True
except ImportError as e:
    print(f"[WARN] Sistema de autenticación no disponible: {e}")
    AUTH_ENABLED = False

# ============================================
# JINJA2 TEMPLATE FILTERS
# ============================================

# Label maps for JSON-stored fields
LABEL_MAPS = {
    'objetivos': {
        'bajar_peso': 'Bajar de peso', 'subir_peso': 'Subir de peso',
        'ganar_masa_muscular': 'Ganar masa muscular', 'bajar_grasa_corporal': 'Bajar grasa corporal',
        'mejorar_salud_general': 'Mejorar salud general', 'tener_mas_energia': 'Tener más energía',
        'mejorar_digestion': 'Mejorar digestión', 'mejorar_rendimiento_deportivo': 'Mejorar rendimiento deportivo',
        'mejorar_habitos_alimenticios': 'Mejorar hábitos alimenticios', 'manejar_condicion_medica': 'Manejar condición médica',
        'fraccionamiento': 'Mejorar fraccionamiento', 'agua': 'Aumentar consumo de agua',
        'consciente': 'Alimentación consciente', 'proteina': 'Aumentar proteína', 'peso': 'Control de peso',
    },
    'diagnosticos': {
        'colesterol_alto': 'Colesterol Alto', 'depresion': 'Depresión', 'diabetes': 'Diabetes',
        'estrenimiento': 'Estreñimiento Crónico', 'hipertension': 'Hipertensión',
        'hipotiroidismo': 'Hipotiroidismo', 'hipertiroidismo': 'Hipertiroidismo',
        'ingesta_emocional': 'Ingesta Emocional', 'sarcopenia': 'Sarcopenia',
        'colon_irritable': 'Colon Irritable', 'anemia': 'Anemia', 'tca': 'TCA', 'otros': 'Otros',
    },
    'medicamentos': {
        'ansiolitico': 'Ansiolítico', 'antidepresivo': 'Antidepresivo', 'diabetes': 'Diabetes',
        'dolor_cronico': 'Dolor Crónico', 'enfermedades_cronicas': 'Enfermedades Crónicas',
        'hipertension': 'Hipertensión', 'otros': 'Otros',
    },
    'suplementos': {
        'ashwaganda': 'Ashwaganda', 'betadanina': 'Betadanina', 'b12': 'Vitamina B12',
        'c': 'Vitamina C', 'cordyceps': 'Cordyceps', 'creatina': 'Creatina',
        'd': 'Vitamina D', 'e': 'Vitamina E', 'hierro': 'Hierro', 'magnesio': 'Magnesio',
        'melena_leon': 'Melena de León', 'omega3': 'Omega 3',
        'proteina_polvo': 'Proteína en Polvo', 'reishi': 'Reishi', 'zinc': 'Zinc',
    },
}

@app.template_filter('format_labels')
def format_labels_filter(value, field_name=''):
    """Convert JSON array string or comma-separated keys to human-readable labels."""
    if not value:
        return ''
    import json as _json
    # Try to parse as JSON array
    items = None
    if isinstance(value, str):
        try:
            parsed = _json.loads(value)
            if isinstance(parsed, list):
                items = parsed
        except (ValueError, TypeError):
            pass
        # If not JSON, try comma-separated
        if items is None:
            items = [v.strip() for v in value.split(',') if v.strip()]
    elif isinstance(value, list):
        items = value
    else:
        return str(value)

    label_map = LABEL_MAPS.get(field_name, {})
    return ', '.join(label_map.get(item, item.replace('_', ' ').title()) for item in items)

# ============================================
# VARIABLES GLOBALES
# ============================================

debug_logs = []

def log_debug(message):
    """Función para agregar logs que se pueden ver en la web."""
    print(message)
    debug_logs.append(message)
    if len(debug_logs) > 200:
        debug_logs.pop(0)

# ============================================
# RUTAS PRINCIPALES
# ============================================

@app.route('/')
def index():

    """Sirve la página principal."""
    log_debug(f"[INDEX] GET / - User authenticated: {current_user.is_authenticated if AUTH_ENABLED else 'N/A'}")
    return send_from_directory('.', 'index.html')

# ============================================
# RUTAS DE DASHBOARDS
# ============================================

@app.route('/dashboard')
@app.route('/dashboard/')
@login_required
def dashboard():
    """Redirige al dashboard específico según el rol del usuario"""
    log_debug(f"[DASHBOARD] Redirect - user_id={current_user.id}, user_type='{current_user.user_type}'")
    # Usar strings directos en lugar de UserType
    if current_user.user_type == 'nutricionista':
        return redirect('/dashboard/nutritionist')
    elif current_user.user_type == 'empresa':
        return redirect('/dashboard/enterprise')
    elif current_user.user_type == 'paciente':
        return redirect('/dashboard/patient')
    elif current_user.user_type == 'cliente':
        return redirect('/dashboard/client')
    else:
        return redirect('/dashboard/client')

@app.route('/dashboard/client')
@login_required
def client_dashboard():
    """Dashboard para clientes (plan FREE)"""
    log_debug(f"[DASHBOARD-CLIENT] user_id={current_user.id}, email='{current_user.email}'")
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
    
    # [OK] IMPORTANTE: Agregar user=current_user
    return render_template('client_dashboard.html',
                         user=current_user,  # ← AGREGAR ESTA LÍNEA
                        current_user=current_user,  # Por si acaso usa current_user en el template
                         recipes=recipes,
                         recipes_remaining=recipes_remaining,
                         total_recipes=total_recipes)

@app.route('/dashboard/patient')
@login_required
def patient_dashboard():
    """Dashboard para pacientes"""
    if current_user.user_type != 'paciente':
        flash('No tienes permisos para acceder a esta página', 'danger')
        return redirect(url_for('dashboard'))

    patient_file = current_user.get_patient_file()

    # Get recipes created by this patient
    try:
        recipes = UserRecipe.query.filter_by(user_id=current_user.id)\
                                  .order_by(UserRecipe.created_at.desc())\
                                  .limit(10).all()
        total_recipes = UserRecipe.query.filter_by(user_id=current_user.id).count()
    except Exception:
        recipes = []
        total_recipes = 0

    # Parse JSON fields for template
    objetivos_list = []
    pauta_data = None
    if patient_file:
        # Parse objetivos from JSON string
        if patient_file.objetivos:
            try:
                parsed = json.loads(patient_file.objetivos) if isinstance(patient_file.objetivos, str) else patient_file.objetivos
                if isinstance(parsed, list):
                    objetivos_list = parsed
            except (json.JSONDecodeError, TypeError):
                objetivos_list = [patient_file.objetivos]

        # Parse plan_alimentario (pauta semanal)
        if patient_file.plan_alimentario:
            try:
                pauta_data = json.loads(patient_file.plan_alimentario) if isinstance(patient_file.plan_alimentario, str) else patient_file.plan_alimentario
            except (json.JSONDecodeError, TypeError):
                pauta_data = None

    # Human-readable labels for objetivos keys
    obj_labels = {
        'bajar_peso': 'Bajar de peso',
        'subir_peso': 'Subir de peso',
        'mejorar_salud': 'Mejorar salud general',
        'energia': 'Aumentar energía',
        'digestion': 'Mejorar digestión',
        'habitos': 'Mejorar hábitos alimentarios',
        'rendimiento': 'Mejorar rendimiento deportivo',
        'masa_muscular': 'Aumentar masa muscular',
        'embarazo': 'Nutrición en embarazo/lactancia',
        'patologia': 'Manejo de patología',
    }

    return render_template('patient_dashboard.html',
                         patient_file=patient_file,
                         recipes=recipes,
                         total_recipes=total_recipes,
                         objetivos_list=objetivos_list,
                         obj_labels=obj_labels,
                         pauta_data=pauta_data)


@app.route('/dashboard/patient/ficha')
@login_required
def patient_ficha_view():
    """Vista read-only de la ficha del paciente"""
    if current_user.user_type != 'paciente':
        flash('No tienes permisos para acceder a esta página', 'danger')
        return redirect(url_for('dashboard'))

    patient_file = current_user.get_patient_file()
    if not patient_file:
        flash('No se encontró tu ficha clínica', 'warning')
        return redirect(url_for('patient_dashboard'))

    return render_template('patient_ficha_view.html', patient_file=patient_file)


@app.route('/api/patient/recipe-defaults')
@login_required
def patient_recipe_defaults():
    """API: Returns dietary data from patient file for recipe generator pre-fill"""
    if current_user.user_type != 'paciente':
        return jsonify({'error': 'No autorizado'}), 403

    pf = current_user.get_patient_file()
    if not pf:
        return jsonify({'error': 'Sin ficha clínica'}), 404

    # Parse restrictions
    restricciones = []
    if pf.restricciones_alimentarias:
        if isinstance(pf.restricciones_alimentarias, list):
            restricciones = pf.restricciones_alimentarias
        elif isinstance(pf.restricciones_alimentarias, str):
            try:
                restricciones = json.loads(pf.restricciones_alimentarias)
            except (json.JSONDecodeError, TypeError):
                pass

    # Parse alergias
    alergias_list = []
    if pf.alergias:
        alergias_list = [a.strip() for a in pf.alergias.split(',') if a.strip()]

    return jsonify({
        'calorias_objetivo': pf.get_kcal,
        'proteinas_g': pf.proteinas_g,
        'carbohidratos_g': pf.carbohidratos_g,
        'grasas_g': pf.grasas_g,
        'restricciones': restricciones,
        'alergias': alergias_list,
        'objetivos': pf.objetivos,
        'peso_kg': pf.peso_kg,
        'talla_m': pf.talla_m,
        'imc': pf.imc,
    })


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
            total_patients = PatientFile.query.count() # Or filter by nutritionist if needed
            log_debug(f"[OK] Dashboard nutricionista: {total_recipes} recetas, {total_patients} pacientes")
        except Exception as e:
            log_debug(f"[WARN] Error en dashboard: {e}")
            recipes = []
            total_recipes = 0
            total_patients = 0
    else:
        recipes = []
        total_recipes = 0
        total_patients = 0
    
    # [OK] IMPORTANTE: Agregar user=current_user
    return render_template('nutritionist_dashboard.html',
                         user=current_user,
                         recipes=recipes,
                         total_recipes=total_recipes,
                         total_patients=total_patients)

@app.route('/dashboard/enterprise')
@login_required
def enterprise_dashboard():
    """Dashboard para empresas con explorador de ingredientes"""
    log_debug(f"[DASHBOARD-ENTERPRISE] user_id={current_user.id}, user_type='{current_user.user_type}'")
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
    
    # [OK] IMPORTANTE: Pasar 'user' explícitamente
    return render_template('enterprise_dashboard.html',
                         user=current_user,  # ← ESTA LÍNEA ES CRÍTICA
                         recipes=recipes,
                         total_recipes=total_recipes,
                         recipes_remaining=recipes_remaining)

@app.route('/dashboard/nutritionist/patient/new')
@login_required
def patient_intake_form():
    """Formulario de ingreso de nuevo paciente"""
    log_debug(f"[PATIENT-INTAKE-FORM] user_id={current_user.id}, user_type='{current_user.user_type}'")
    if current_user.user_type != 'nutricionista':
        flash('No tienes permisos para acceder a esta página', 'danger')
        return redirect(url_for('dashboard'))
    
    return render_template('patient_intake_form.html')
"""
patient_routes.py - Rutas API para gestión de pacientes
Agregar estas rutas a app.py
"""

# ============================================
# RUTAS DE PACIENTES - AGREGAR A APP.PY
# ============================================

# Copiar y pegar estas rutas en app.py después de @app.route('/api/patients', methods=['POST'])


@app.route('/api/patients/<int:patient_id>', methods=['GET'])
@login_required
def get_patient(patient_id):
    """Obtener datos de un paciente específico"""
    log_debug(f"[GET-PATIENT] patient_id={patient_id}, user_id={current_user.id}")
    if current_user.user_type != 'nutricionista':
        log_debug(f"[GET-PATIENT] DENIED - user_type='{current_user.user_type}' no es nutricionista")
        return jsonify({'error': 'No autorizado'}), 403

    try:
        patient = PatientFile.query.filter_by(
            id=patient_id,
            nutricionista_id=current_user.id
        ).first()

        if not patient:
            log_debug(f"[GET-PATIENT] NOT FOUND - patient_id={patient_id} para nutricionista_id={current_user.id}")
            return jsonify({'error': 'Paciente no encontrado'}), 404

        log_debug(f"[GET-PATIENT] OK - '{patient.nombre}' (ID: {patient.id})")
        return jsonify({
            'success': True,
            'patient': patient.to_dict()
        })

    except Exception as e:
        log_debug(f"[GET-PATIENT] ERROR - {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/patients/<int:patient_id>', methods=['PUT'])
@login_required
def update_patient(patient_id):
    """Actualizar datos de un paciente"""
    log_debug(f"[UPDATE-PATIENT] START - patient_id={patient_id}, user_id={current_user.id}")
    if current_user.user_type != 'nutricionista':
        log_debug(f"[UPDATE-PATIENT] DENIED - user_type='{current_user.user_type}'")
        return jsonify({'error': 'No autorizado'}), 403

    try:
        patient = PatientFile.query.filter_by(
            id=patient_id,
            nutricionista_id=current_user.id
        ).first()

        if not patient:
            log_debug(f"[UPDATE-PATIENT] NOT FOUND - patient_id={patient_id}")
            return jsonify({'error': 'Paciente no encontrado'}), 404

        data = request.get_json()
        log_debug(f"[UPDATE-PATIENT] Data keys: {list(data.keys()) if data else 'None'}")
        
        # Actualizar campos básicos
        campos_texto = [
            'nombre', 'fecha_nacimiento', 'sexo', 'email', 'telefono', 
            'direccion', 'ocupacion', 'motivo_consulta', 'rut',
            'diagnosticos', 'medicamentos', 'suplementos', 'alergias',
            'intolerancias', 'alimentos_no_consume', 'antecedentes_familiares',
            'horas_sueno', 'actividad_fisica', 'tipo_ejercicio',
            'frecuencia_ejercicio', 'duracion_ejercicio',
            'diagnostico_nutricional', 'objetivos_nutricionales',
            'plan_alimentario', 'indicaciones', 'metas_corto_plazo',
            'metas_mediano_plazo', 'metas_largo_plazo', 'notas_seguimiento',
            'fecha_examenes', 'frecuencia_evacuacion', 'consistencia_heces',
            'signos_clinicos', 'sintomas_gi', 'horario_desayuno', 'horario_almuerzo', 
            'horario_cena', 'quien_cocina', 'donde_come', 'con_quien_vive',
            'teletrabajo', 'profesion', 'menstruacion', 
            'reflujo', 'reflujo_alimento', 'hinchazon', 'hinchazon_alimento',
            'tiene_alergias', 'alergias_alimento', 'gatillantes_gi',
            'consumo_bebidas_azucaradas', 'consumo_alcohol', 'tipo_alcohol',
            'observaciones_sueno', 'gatillantes_estres', 'manejo_estres',
            'tabaco', 'drogas',
            'metodo_calculo',
            'otros_antecedentes', 'red_de_apoyo', 'anticonceptivos',
            'otros_diagnosticos', 'comidas_al_dia', 'cirugias'
        ]

        for campo in campos_texto:
            if campo in data:
                setattr(patient, campo, data[campo])

        # Campos JSON Objeto (db.JSON - NO serializar manual)
        campos_json_obj = [
            'actividad_fisica', 'restricciones_alimentarias', 'registro_24h', 'frecuencia_consumo', 'sintomas_gi'
        ]

        for campo in campos_json_obj:
            if campo in data:
                setattr(patient, campo, data[campo])

        # Manejar alias para Antropometría (v3.4 compatibility)
        if 'talla' in data and data['talla']:
            patient.talla_m = float(data['talla'])
        if 'peso' in data and data['peso']:
            patient.peso_kg = float(data['peso'])

        # Campos JSON Texto (db.Text - SÍ serializar manual)
        campos_json_text = [
            'objetivos'
        ]

        for campo in campos_json_text:
            if campo in data:
                val = data[campo]
                if isinstance(val, (dict, list)):
                    setattr(patient, campo, json.dumps(val))
                else:
                    setattr(patient, campo, val)

        # Campos numéricos float
        campos_float = [
            'talla_m', 'peso_kg', 'peso_ideal',
            'pliegue_bicipital', 'pliegue_tricipital', 'pliegue_subescapular',
            'pliegue_supracrestideo', 'pliegue_abdominal', 'pliegue_muslo',
            'pliegue_pantorrilla',
            'perimetro_brazo', 'perimetro_brazo_contraido', 'perimetro_cintura',
            'perimetro_cadera', 'perimetro_muslo', 'perimetro_pantorrilla',
            'perimetro_muneca',
            'diametro_humero', 'diametro_femur', 'diametro_muneca',
            'glucosa_ayunas', 'hemoglobina_glicada', 'colesterol_total',
            'colesterol_hdl', 'colesterol_ldl', 'trigliceridos',
            'hemoglobina', 'hematocrito', 'ferritina', 'vitamina_d',
            'vitamina_b12', 'acido_urico', 'creatinina', 'albumina', 'tsh',
            'consumo_agua_litros',
            'proteinas_porcentaje', 'carbohidratos_porcentaje', 'grasas_porcentaje',
            'factor_actividad_num', 'get_kcal', 'geb_kcal', 'get_kcal_ajustado'
        ]
        
        for campo in campos_float:
            if campo in data and data[campo] is not None:
                try:
                    setattr(patient, campo, float(data[campo]))
                except (ValueError, TypeError):
                    pass
        
        # Campos numéricos int
        campos_int = [
            'calidad_sueno', 'nivel_estres',
            'presion_sistolica', 'presion_diastolica', 'frecuencia_cardiaca',
            'comidas_por_dia', 'consumo_cafe_tazas', 'consumo_te_tazas',
            'cigarrillos_dia', 'delivery_restaurante', 'percepcion_esfuerzo',
            'ajuste_calorico'
        ]
        
        for campo in campos_int:
            if campo in data and data[campo] is not None:
                try:
                    setattr(patient, campo, int(data[campo]))
                except (ValueError, TypeError):
                    pass
        
        # Campos booleanos
        campos_bool = [
            'fuma', 'pica_entre_comidas', 'come_frente_tv', 'come_rapido',
            'hambre_emocional'
        ]
        
        for campo in campos_bool:
            if campo in data:
                value = data[campo]
                if isinstance(value, bool):
                    setattr(patient, campo, value)
                elif isinstance(value, str):
                    setattr(patient, campo, value.lower() == 'true')
        
        # Fecha próxima cita
        if 'fecha_proxima_cita' in data and data['fecha_proxima_cita']:
            try:
                # Handle possible datetime formats
                fecha_str = data['fecha_proxima_cita'].replace('Z', '')
                if 'T' in fecha_str:
                    patient.fecha_proxima_cita = datetime.fromisoformat(fecha_str)
                else:
                    # Try other formats if needed
                    pass
            except Exception as e:
                log_debug(f"[WARN] Error parseando fecha cita: {e}")
                pass
        
        # Ejecutar cálculos automáticos
        patient.calcular_todo()
        
        db.session.commit()
        
        log_debug(f"[OK] Paciente actualizado: {patient.nombre} (ID: {patient.id})")
        
        return jsonify({
            'success': True,
            'message': 'Paciente actualizado exitosamente',
            'patient': patient.to_dict()
        })
    
    except Exception as e:
        db.session.rollback()
        log_debug(f"❌ Error actualizando paciente: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/patients/<int:patient_id>', methods=['DELETE'])
@login_required
def delete_patient(patient_id):
    """Eliminar un paciente (soft delete)"""
    log_debug(f"[DELETE-PATIENT] START - patient_id={patient_id}, user_id={current_user.id}")
    if current_user.user_type != 'nutricionista':
        log_debug(f"[DELETE-PATIENT] DENIED - user_type='{current_user.user_type}'")
        return jsonify({'error': 'No autorizado'}), 403

    try:
        patient = PatientFile.query.filter_by(
            id=patient_id,
            nutricionista_id=current_user.id
        ).first()

        if not patient:
            log_debug(f"[DELETE-PATIENT] NOT FOUND - patient_id={patient_id}")
            return jsonify({'error': 'Paciente no encontrado'}), 404
        
        # Soft delete
        patient.is_active = False
        db.session.commit()

        log_debug(f"[OK] Paciente eliminado (soft): {patient.nombre} (ID: {patient.id})")

        return jsonify({
            'success': True,
            'message': 'Paciente eliminado exitosamente'
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/patients/bulk', methods=['DELETE'])
@login_required
def delete_patients_bulk():
    """Eliminar múltiples pacientes"""
    log_debug(f"[BULK-DELETE] START - user_id={current_user.id}")
    if current_user.user_type != 'nutricionista':
        log_debug(f"[BULK-DELETE] DENIED - user_type='{current_user.user_type}'")
        return jsonify({'error': 'No autorizado'}), 403

    try:
        data = request.get_json()
        patient_ids = data.get('ids', [])
        log_debug(f"[BULK-DELETE] IDs to delete: {patient_ids}")

        if not patient_ids:
            return jsonify({'success': False, 'error': 'No se proporcionaron IDs'}), 400

        # Soft delete de pacientes del nutricionista actual
        deleted_count = PatientFile.query.filter(
            PatientFile.id.in_(patient_ids),
            PatientFile.nutricionista_id == current_user.id
        ).update({PatientFile.is_active: False}, synchronize_session=False)

        db.session.commit()

        log_debug(f"[OK] Eliminación masiva: {deleted_count} pacientes")

        return jsonify({
            'success': True,
            'deleted': deleted_count,
            'message': f'{deleted_count} pacientes eliminados exitosamente'
        })

    except Exception as e:
        db.session.rollback()
        log_debug(f"[ERROR] Bulk delete failed: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/patients/invite', methods=['POST'])
@login_required
def invite_patient():
    """Crear paciente e invitarlo a llenar formulario previo"""
    log_debug(f"[INVITE-PATIENT] START - user_id={current_user.id}")
    if current_user.user_type != 'nutricionista':
        log_debug(f"[INVITE-PATIENT] DENIED - user_type='{current_user.user_type}'")
        return jsonify({'error': 'No autorizado'}), 403

    try:
        data = request.get_json()
        nombre = data.get('nombre', 'Paciente')
        email = data.get('email')
        telefono = data.get('telefono', '')
        nota = data.get('nota', '')
        log_debug(f"[INVITE-PATIENT] nombre='{nombre}', email='{email}'")

        if not email:
            return jsonify({'success': False, 'error': 'Email es requerido'}), 400

        # Verificar si ya existe un paciente con este email para este nutricionista
        existing = PatientFile.query.filter_by(
            nutricionista_id=current_user.id,
            email=email,
            is_active=True
        ).first()

        if existing:
            # Si ya existe, regenerar token y reenviar
            log_debug(f"[INVITE-PATIENT] Existing patient found id={existing.id}, regenerating token")
            patient = existing
            patient.generate_intake_token()
        else:
            log_debug(f"[INVITE-PATIENT] Creating new patient")
            # Crear nuevo paciente con datos minimos
            patient = PatientFile(
                nutricionista_id=current_user.id,
                nombre=nombre,
                email=email,
                telefono=telefono,
                motivo_consulta=nota if nota else 'Formulario pre-consulta pendiente',
                is_active=True,
                intake_completed=False
            )
            patient.generate_intake_token()
            db.session.add(patient)

        db.session.flush()

        # Construir URL del formulario
        base_url = request.host_url.rstrip('/')
        intake_url = f"{base_url}/intake/{patient.intake_token}"

        # Intentar enviar email
        email_sent = False
        mail_configured = is_mail_configured()
        log_debug(f"[INVITE-PATIENT] Mail configured: {mail_configured}")
        if mail_configured:
            try:
                result = send_intake_email(
                    patient,
                    intake_url,
                    current_user.get_full_name() if hasattr(current_user, 'get_full_name') else current_user.first_name
                )
                email_sent = result.get('success', False)
                log_debug(f"[INVITE-PATIENT] Email send result: {result}")
                patient.intake_url_sent = email_sent
                if email_sent:
                    patient.intake_url_sent_at = datetime.utcnow()
            except Exception as e:
                log_debug(f"[WARNING] Error enviando email: {e}")
        else:
            log_debug(f"[INVITE-PATIENT] MAIL NOT CONFIGURED - MAIL_USERNAME or MAIL_PASSWORD missing")

        db.session.commit()

        return jsonify({
            'success': True,
            'patient_id': patient.id,
            'intake_url': intake_url,
            'email_sent': email_sent,
            'message': f'Invitacion {"enviada por email" if email_sent else "creada (copiar link manualmente)"}'
        })

    except Exception as e:
        db.session.rollback()
        log_debug(f"[ERROR] Invite patient failed: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/patients', methods=['GET'])
@login_required
def list_patients():
    """Listar todos los pacientes del nutricionista"""
    log_debug(f"[LIST-PATIENTS] START - user_id={current_user.id}")
    if current_user.user_type != 'nutricionista':
        log_debug(f"[LIST-PATIENTS] DENIED - user_type='{current_user.user_type}'")
        return jsonify({'error': 'No autorizado'}), 403

    try:
        # Parámetros de paginación y filtros
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '').strip()
        active_only = request.args.get('active', 'true').lower() == 'true'
        log_debug(f"[LIST-PATIENTS] page={page}, per_page={per_page}, search='{search}', active_only={active_only}")
        
        # Query base
        query = PatientFile.query.filter_by(nutricionista_id=current_user.id)
        
        # Filtrar por activos
        if active_only:
            query = query.filter_by(is_active=True)
        
        # Búsqueda por nombre
        if search:
            query = query.filter(PatientFile.nombre.ilike(f'%{search}%'))
        
        # Ordenar por más reciente
        query = query.order_by(PatientFile.updated_at.desc())
        
        # Paginar
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        patients = [{
            'id': p.id,
            'ficha_numero': p.ficha_numero or p.id,
            'nombre': p.nombre,
            'edad': p.calcular_edad(),
            'sexo': p.sexo,
            'email': p.email,
            'telefono': p.telefono,
            'rut': p.rut,
            'motivo_consulta': p.motivo_consulta[:100] + '...' if p.motivo_consulta and len(p.motivo_consulta) > 100 else p.motivo_consulta,
            'imc': p.imc,
            'intake_token': p.intake_token,
            'intake_completed': p.intake_completed,
            'intake_url_sent': p.intake_url_sent,
            'plan_alimentario': p.plan_alimentario if p.plan_alimentario else None,
            'fecha_proxima_cita': p.fecha_proxima_cita.strftime('%Y-%m-%d %H:%M') if p.fecha_proxima_cita else None,
            'created_at': p.created_at.strftime('%Y-%m-%d'),
            'updated_at': p.updated_at.strftime('%Y-%m-%d %H:%M') if p.updated_at else None
        } for p in pagination.items]
        
        return jsonify({
            'success': True,
            'patients': patients,
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': page,
            'has_next': pagination.has_next,
            'has_prev': pagination.has_prev
        })
    
    except Exception as e:
        log_debug(f"❌ Error listando pacientes: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


# ============================================
# RUTAS DE VISTAS HTML
# ============================================

@app.route('/dashboard/nutritionist/patients')
@login_required
def patient_list():
    """Lista de pacientes del nutricionista"""
    log_debug(f"[PATIENT-LIST-VIEW] user_id={current_user.id}")
    if current_user.user_type != 'nutricionista':
        flash('No tienes permisos para acceder a esta página', 'danger')
        return redirect(url_for('dashboard'))
    
    return render_template('patient_list.html')


@app.route('/dashboard/nutritionist/patient/<int:patient_id>')
@login_required
def patient_file_view(patient_id):
    """Ver ficha de paciente"""
    log_debug(f"[PATIENT-FILE-VIEW] patient_id={patient_id}, user_id={current_user.id}")
    if current_user.user_type != 'nutricionista':
        flash('No tienes permisos para acceder a esta página', 'danger')
        return redirect(url_for('dashboard'))
    
    patient = PatientFile.query.filter_by(
        id=patient_id,
        nutricionista_id=current_user.id
    ).first()

    if not patient:
        log_debug(f"[PATIENT-FILE-VIEW] NOT FOUND - patient_id={patient_id}")
        flash('Paciente no encontrado', 'danger')
        return redirect(url_for('patient_list'))

    log_debug(f"[PATIENT-FILE-VIEW] OK - '{patient.nombre}' (ID: {patient.id})")

    # Fix TEXT vs JSON column mismatch: ensure JSON fields are dicts, not strings
    import json as _json
    for json_field in ('registro_24h', 'frecuencia_consumo', 'sintomas_gi', 'actividad_fisica',
                       'actividades_detalladas', 'historial_antropometria', 'historial_bioquimico',
                       'archivos_examenes', 'restricciones_alimentarias'):
        val = getattr(patient, json_field, None)
        if val and isinstance(val, str):
            try:
                setattr(patient, json_field, _json.loads(val))
            except (ValueError, TypeError):
                pass

    return render_template('patient_file.html', patient=patient)



@app.route('/api/patients', methods=['POST'])
@login_required
def create_patient():
    """API para crear nuevo paciente"""
    if current_user.user_type != 'nutricionista':
        return jsonify({'error': 'No autorizado'}), 403
    
    try:
        data = request.get_json()

        # Strip non-model datetime fields that come from the form
        for _key in ['fecha_atencion', 'fecha_meta']:
            data.pop(_key, None)

        log_debug(f"[DEBUG] create_patient - keys in data: {list(data.keys())}")

        # Obtener siguiente número de ficha para este nutricionista
        last_ficha = PatientFile.query.filter_by(
            nutricionista_id=current_user.id
        ).order_by(PatientFile.ficha_numero.desc()).first()
        
        next_ficha_numero = (last_ficha.ficha_numero or 0) + 1 if last_ficha else 1

        # Helper: convert any value to Python bool safely
        def to_bool(val):
            if val is None:
                return False
            if isinstance(val, bool):
                return val
            if isinstance(val, str):
                return val.lower() in ('true', '1', 'on', 'si', 'yes')
            return bool(val)

        # Helper: safe float conversion
        def to_float(val):
            if not val:
                return None
            try:
                return float(val)
            except (ValueError, TypeError):
                return None

        # Helper: safe int conversion
        def to_int(val):
            if not val and val != 0:
                return None
            try:
                return int(val)
            except (ValueError, TypeError):
                return None

        new_patient = PatientFile(
            nutricionista_id=current_user.id,
            ficha_numero=next_ficha_numero,

            # Datos personales
            nombre=data.get('nombre'),
            fecha_nacimiento=data.get('fecha_nacimiento'),
            sexo=data.get('sexo'),
            email=data.get('email'),
            telefono=data.get('telefono'),
            rut=data.get('rut'),
            direccion=data.get('direccion'),
            alimentos_no_consume=data.get('alimentos_no_consume'),
            motivo_consulta=data.get('motivo_consulta'),
            objetivos=json.dumps(data.get('objetivos', [])) if isinstance(data.get('objetivos'), list) else data.get('objetivos', ''),

            # Diagnósticos, medicamentos, suplementos (JSON arrays)
            diagnosticos=json.dumps(data.get('diagnosticos', [])) if isinstance(data.get('diagnosticos'), list) else data.get('diagnosticos', ''),
            medicamentos=json.dumps(data.get('medicamentos', [])) if isinstance(data.get('medicamentos'), list) else data.get('medicamentos', ''),
            suplementos=json.dumps(data.get('suplementos', [])) if isinstance(data.get('suplementos'), list) else data.get('suplementos', ''),

            # Conducta y Entorno
            profesion=data.get('profesion'),
            teletrabajo=data.get('teletrabajo'),
            quien_cocina=json.dumps(data.get('quien_cocina', [])) if isinstance(data.get('quien_cocina'), list) else data.get('quien_cocina', ''),
            con_quien_vive=json.dumps(data.get('con_quien_vive', [])) if isinstance(data.get('con_quien_vive'), list) else data.get('con_quien_vive', ''),
            donde_come=json.dumps(data.get('donde_come', [])) if isinstance(data.get('donde_come'), list) else data.get('donde_come', ''),

            # Horarios y Hábitos
            horario_desayuno=data.get('horario_desayuno'),
            horario_almuerzo=data.get('horario_almuerzo'),
            horario_cena=data.get('horario_cena'),
            pica_entre_comidas=to_bool(data.get('pica_entre_comidas')),
            come_frente_tv=to_bool(data.get('come_frente_tv')),
            come_rapido=to_bool(data.get('come_rapido')),

            # Antropometría
            talla_m=to_float(data.get('talla')),
            peso_kg=to_float(data.get('peso')),
            pliegue_bicipital=to_float(data.get('pliegue_bicipital')),
            pliegue_tricipital=to_float(data.get('pliegue_tricipital')),
            pliegue_subescapular=to_float(data.get('pliegue_subescapular')),
            pliegue_supracrestideo=to_float(data.get('pliegue_supracrestideo')),
            pliegue_abdominal=to_float(data.get('pliegue_abdominal')),
            perimetro_brazo=to_float(data.get('perimetro_brazo')),
            perimetro_cintura=to_float(data.get('perimetro_cintura')),
            perimetro_cadera=to_float(data.get('perimetro_cadera')),
            perimetro_pantorrilla=to_float(data.get('perimetro_pantorrilla')),

            # Salud General
            horas_sueno=data.get('horas_sueno'),
            calidad_sueno=to_int(data.get('calidad_sueno')),
            observaciones_sueno=data.get('observaciones_sueno'),
            nivel_estres=to_int(data.get('nivel_estres')),
            gatillantes_estres=data.get('gatillantes_estres'),
            manejo_estres=data.get('manejo_estres'),
            consumo_alcohol=data.get('consumo_alcohol'),
            tipo_alcohol=json.dumps(data.get('tipo_alcohol', [])) if isinstance(data.get('tipo_alcohol'), list) else data.get('tipo_alcohol', ''),
            tabaco=data.get('tabaco'),
            fuma=to_bool(data.get('fuma')),
            cigarrillos_dia=to_int(data.get('cigarrillos_dia')),
            drogas=data.get('drogas'),
            actividad_fisica=data.get('actividad_fisica'),
            tipo_ejercicio=data.get('tipo_ejercicio'),
            duracion_ejercicio=to_int(data.get('duracion_ejercicio')),

            # Campos adicionales
            menstruacion=data.get('menstruacion') or data.get('ciclo_menstrual'),
            percepcion_esfuerzo=to_int(data.get('percepcion_esfuerzo')),
            restricciones_alimentarias=data.get('restricciones_alimentarias', []),
            delivery_restaurante=to_int(data.get('delivery_restaurante')),

            # Consumo líquidos
            consumo_agua_litros=to_float(data.get('consumo_agua_litros')),
            consumo_cafe_tazas=to_int(data.get('consumo_cafe_tazas')),
            consumo_te_tazas=to_int(data.get('consumo_te_tazas')),

            # Síntomas GI
            frecuencia_evacuacion=data.get('frecuencia_evacuacion'),
            gatillantes_gi=data.get('gatillantes_gi'),
            reflujo='si' if to_bool(data.get('reflujo')) else 'no',
            reflujo_alimento=data.get('reflujo_alimento'),
            hinchazon='si' if to_bool(data.get('hinchazon')) else 'no',
            hinchazon_alimento=data.get('hinchazon_alimento'),
            tiene_alergias=data.get('tiene_alergias'),
            alergias_alimento=data.get('alergias_alimento'),
            alergias=data.get('alergias'),
            intolerancias=data.get('intolerancias'),

            # Registro 24h y Frecuencia de Consumo (JSON)
            registro_24h=data.get('registro_24h'),
            frecuencia_consumo=data.get('frecuencia_consumo'),

            # Diagnostico y Plan Nutricional
            diagnostico_nutricional=data.get('diagnostico_nutricional'),
            objetivos_nutricionales=data.get('objetivos_nutricionales'),
            indicaciones=data.get('indicaciones'),
            notas_seguimiento=data.get('notas_seguimiento'),
            plan_alimentario=data.get('plan_alimentario'),

            # Explicit datetime values (bypass defaults to avoid SQLite issues)
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        # Handle fecha_proxima_cita separately (DateTime field)
        fecha_prox = data.get('fecha_proxima_cita')
        if fecha_prox and str(fecha_prox).strip():
            try:
                fecha_str = str(fecha_prox).replace('Z', '')
                if 'T' in fecha_str:
                    new_patient.fecha_proxima_cita = datetime.fromisoformat(fecha_str)
                elif fecha_str.strip():
                    new_patient.fecha_proxima_cita = datetime.strptime(fecha_str.strip(), '%Y-%m-%d %H:%M')
            except Exception as e:
                log_debug(f"[WARN] Error parseando fecha_proxima_cita: {e}")
                new_patient.fecha_proxima_cita = None
        else:
            new_patient.fecha_proxima_cita = None

        # Calcular valores automáticos
        new_patient.calcular_todo()

        # Debug: inspect all DateTime columns before commit
        log_debug(f"[DEBUG] DateTime fields before commit:")
        log_debug(f"  created_at={new_patient.created_at!r} (type={type(new_patient.created_at).__name__})")
        log_debug(f"  updated_at={new_patient.updated_at!r} (type={type(new_patient.updated_at).__name__})")
        log_debug(f"  fecha_proxima_cita={new_patient.fecha_proxima_cita!r} (type={type(new_patient.fecha_proxima_cita).__name__})")
        log_debug(f"  intake_completed_at={new_patient.intake_completed_at!r}")
        log_debug(f"  intake_url_sent_at={new_patient.intake_url_sent_at!r})")

        # Safeguard: ensure no string dates leaked into DateTime columns
        for dt_col in ['created_at', 'updated_at', 'fecha_proxima_cita', 'intake_completed_at', 'intake_url_sent_at']:
            val = getattr(new_patient, dt_col, None)
            if val is not None and not isinstance(val, (datetime, date)):
                log_debug(f"[FIX] {dt_col} was {type(val).__name__}: {val!r} - setting to None")
                setattr(new_patient, dt_col, None)
        
        db.session.add(new_patient)
        db.session.commit()

        log_debug(f"[OK] Paciente creado: {new_patient.nombre} (Ficha #{new_patient.ficha_numero})")

        # Generate intake token (but do NOT send email here - it blocks the response)
        intake_url = None
        if new_patient.email:
            new_patient.generate_intake_token()
            intake_url = new_patient.get_intake_url(request.host_url.rstrip('/'))
            db.session.commit()
            log_debug(f"[CREATE-PATIENT] Token generado, intake_url={intake_url}")
            log_debug(f"[CREATE-PATIENT] Email NO enviado automaticamente (usar endpoint /send-intake-email)")

        log_debug(f"[CREATE-PATIENT] Respondiendo OK al frontend")

        return jsonify({
            'success': True,
            'message': 'Paciente guardado exitosamente',
            'patient_id': new_patient.id,
            'ficha_numero': new_patient.ficha_numero,
            'redirect_url': f'/dashboard/nutritionist/patient/{new_patient.id}',
            'email_sent': False,
            'intake_url': intake_url
        }), 201
        
    except Exception as e:
        db.session.rollback()
        log_debug(f"[ERROR] Error creando paciente: {str(e)}")
        import traceback
        log_debug(f"[TRACEBACK] {traceback.format_exc()}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/patient/save-draft', methods=['POST'])
@login_required
def save_patient_draft():
    """Guarda un borrador del paciente (sin validacion completa)"""
    try:
        data = request.json
        log_debug(f"[DRAFT] Guardando borrador...")

        # Strip non-model datetime fields that come from the form
        for _key in ['fecha_atencion', 'fecha_meta']:
            data.pop(_key, None)

        patient_id = data.get('patient_id')

        if patient_id:
            # Actualizar paciente existente
            patient = PatientFile.query.get(patient_id)
            if not patient:
                return jsonify({'success': False, 'error': 'Paciente no encontrado'}), 404
        else:
            # Crear nuevo paciente como borrador
            patient = PatientFile(
                nutricionista_id=current_user.id,
                nombre=data.get('nombre', 'Borrador'),
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.session.add(patient)

        # Actualizar campos de texto/string
        campos_texto = [
            'nombre', 'fecha_nacimiento', 'sexo', 'rut', 'email', 'telefono',
            'motivo_consulta', 'profesion', 'teletrabajo',
            'horario_desayuno', 'horario_almuerzo', 'horario_cena',
            'horas_sueno', 'tipo_ejercicio',
            'frecuencia_evacuacion', 'menstruacion',
            'consumo_alcohol', 'consumo_bebidas_azucaradas',
            'diagnostico_nutricional', 'objetivos_nutricionales', 'indicaciones',
            'notas_seguimiento', 'observaciones_sueno', 'gatillantes_estres', 'manejo_estres',
            'tabaco', 'drogas', 'reflujo_alimento', 'hinchazon_alimento',
            'alergias_alimento', 'alergias', 'intolerancias',
            'reflujo', 'hinchazon', 'tiene_alergias',
            'otros_antecedentes', 'red_de_apoyo', 'anticonceptivos'
        ]

        for campo in campos_texto:
            if campo in data and data[campo] is not None:
                setattr(patient, campo, str(data[campo]) if data[campo] else None)

        # Campos JSON texto (arrays serializados como string)
        campos_json_text = ['objetivos', 'diagnosticos', 'medicamentos', 'suplementos',
                            'quien_cocina', 'donde_come', 'con_quien_vive', 'tipo_alcohol']
        for campo in campos_json_text:
            if campo in data and data[campo] is not None:
                val = data[campo]
                if isinstance(val, (dict, list)):
                    setattr(patient, campo, json.dumps(val))
                else:
                    setattr(patient, campo, val)

        # Mapear talla/peso a talla_m/peso_kg (Float)
        if data.get('talla'):
            try:
                patient.talla_m = float(data['talla'])
            except (ValueError, TypeError):
                pass
        if data.get('peso'):
            try:
                patient.peso_kg = float(data['peso'])
            except (ValueError, TypeError):
                pass

        # Campos numéricos float
        campos_float = [
            'perimetro_cintura', 'perimetro_cadera', 'perimetro_brazo',
            'perimetro_brazo_contraido', 'perimetro_muslo', 'perimetro_pantorrilla',
            'perimetro_muneca',
            'pliegue_tricipital', 'pliegue_abdominal', 'pliegue_bicipital',
            'pliegue_subescapular', 'pliegue_supracrestideo', 'pliegue_muslo',
            'pliegue_pantorrilla',
            'consumo_agua_litros'
        ]
        for campo in campos_float:
            if campo in data and data[campo] is not None and data[campo] != '':
                try:
                    setattr(patient, campo, float(data[campo]))
                except (ValueError, TypeError):
                    pass

        # Campos numéricos int
        campos_int = [
            'calidad_sueno', 'nivel_estres', 'percepcion_esfuerzo',
            'consumo_cafe_tazas', 'consumo_te_tazas', 'cigarrillos_dia',
            'delivery_restaurante', 'comidas_por_dia',
            'presion_sistolica', 'presion_diastolica', 'frecuencia_cardiaca'
        ]
        for campo in campos_int:
            if campo in data and data[campo] is not None and data[campo] != '':
                try:
                    setattr(patient, campo, int(data[campo]))
                except (ValueError, TypeError):
                    pass

        # Campos booleanos
        campos_bool = ['fuma', 'pica_entre_comidas', 'come_frente_tv', 'come_rapido', 'hambre_emocional']
        for campo in campos_bool:
            if campo in data:
                value = data[campo]
                if isinstance(value, bool):
                    setattr(patient, campo, value)
                elif isinstance(value, str):
                    setattr(patient, campo, value.lower() in ('true', '1', 'on', 'si'))
                else:
                    setattr(patient, campo, bool(value))

        # Fecha próxima cita (DateTime field - needs proper parsing)
        fecha_prox = data.get('fecha_proxima_cita')
        if fecha_prox and str(fecha_prox).strip():
            try:
                fecha_str = str(fecha_prox).replace('Z', '')
                if 'T' in fecha_str:
                    patient.fecha_proxima_cita = datetime.fromisoformat(fecha_str)
                elif fecha_str.strip():
                    patient.fecha_proxima_cita = datetime.strptime(fecha_str.strip(), '%Y-%m-%d %H:%M')
            except Exception as e:
                log_debug(f"[WARN] Error parseando fecha_proxima_cita en borrador: {e}")
                patient.fecha_proxima_cita = None

        # Campos JSON nativos (db.JSON)
        if 'registro_24h' in data:
            patient.registro_24h = data['registro_24h']
        if 'frecuencia_consumo' in data:
            patient.frecuencia_consumo = data['frecuencia_consumo']
        if 'actividad_fisica' in data:
            patient.actividad_fisica = data['actividad_fisica']
        if 'restricciones_alimentarias' in data:
            patient.restricciones_alimentarias = data['restricciones_alimentarias']

        # Explicit updated_at
        patient.updated_at = datetime.utcnow()

        # Safeguard: ensure no string dates leaked into DateTime columns
        for dt_col in ['created_at', 'updated_at', 'fecha_proxima_cita', 'intake_completed_at', 'intake_url_sent_at']:
            val = getattr(patient, dt_col, None)
            if val is not None and not isinstance(val, (datetime, date)):
                log_debug(f"[FIX-DRAFT] {dt_col} was {type(val).__name__}: {val!r} - setting to None")
                setattr(patient, dt_col, None)

        log_debug(f"[DEBUG-DRAFT] DateTime fields before commit:")
        log_debug(f"  created_at={patient.created_at!r}, updated_at={patient.updated_at!r}")
        log_debug(f"  fecha_proxima_cita={patient.fecha_proxima_cita!r}")

        db.session.commit()

        log_debug(f"[OK] Borrador guardado: {patient.nombre} (ID: {patient.id})")

        return jsonify({
            'success': True,
            'message': 'Borrador guardado',
            'patient_id': patient.id,
            'is_draft': True
        })

    except Exception as e:
        db.session.rollback()
        log_debug(f"[ERROR] Error guardando borrador: {str(e)}")
        import traceback
        log_debug(f"[TRACEBACK] {traceback.format_exc()}")
        return jsonify({'success': False, 'error': str(e)}), 500


# ============================================
# RUTAS DE INTAKE PUBLICO (SIN LOGIN)
# Sistema para que pacientes llenen datos antes de la consulta
# ============================================

@app.route('/intake/<token>')
def patient_public_intake(token):
    """Vista publica del formulario de intake para pacientes"""
    log_debug(f"[PUBLIC-INTAKE] GET /intake/{token[:8]}...")
    patient = PatientFile.get_by_intake_token(token)

    if not patient:
        log_debug(f"[PUBLIC-INTAKE] INVALID TOKEN - {token[:8]}...")
        return render_template('patient_public_intake.html',
                             error="Enlace invalido o expirado",
                             patient=None)

    if patient.intake_completed:
        log_debug(f"[PUBLIC-INTAKE] ALREADY COMPLETED - patient_id={patient.id}, '{patient.nombre}'")
        return render_template('patient_public_intake.html',
                             already_completed=True,
                             patient=patient)

    log_debug(f"[PUBLIC-INTAKE] Rendering form for patient_id={patient.id}, '{patient.nombre}'")
    # Obtener nombre del nutricionista
    nutritionist = User.query.get(patient.nutricionista_id)
    nutritionist_name = nutritionist.get_full_name() if nutritionist else "Tu nutricionista"

    return render_template('patient_public_intake.html',
                         patient=patient,
                         nutritionist_name=nutritionist_name,
                         error=None,
                         already_completed=False)


@app.route('/api/intake/<token>', methods=['POST'])
def submit_public_intake(token):
    """API para guardar datos del formulario publico de intake"""
    log_debug(f"[SUBMIT-INTAKE] POST /api/intake/{token[:8]}...")
    patient = PatientFile.get_by_intake_token(token)

    if not patient:
        log_debug(f"[SUBMIT-INTAKE] INVALID TOKEN - {token[:8]}...")
        return jsonify({'success': False, 'error': 'Token invalido'}), 404

    if patient.intake_completed:
        log_debug(f"[SUBMIT-INTAKE] ALREADY COMPLETED - patient_id={patient.id}")
        return jsonify({'success': False, 'error': 'Este formulario ya fue completado'}), 400

    try:
        data = request.get_json()
        log_debug(f"[SUBMIT-INTAKE] patient_id={patient.id}, data keys: {list(data.keys()) if data else 'None'}")

        # --- Datos personales basicos ---
        campos_texto = [
            'nombre', 'fecha_nacimiento', 'sexo', 'ocupacion', 'direccion', 'rut',
            'motivo_consulta', 'medicamentos', 'suplementos', 'cirugias',
            'alergias', 'intolerancias', 'otros_diagnosticos',
            'alimentos_no_consume',
            'horas_sueno', 'tipo_ejercicio', 'frecuencia_ejercicio',
            'actividad_fisica', 'consumo_alcohol', 'tipo_alcohol', 'tabaco',
            'horario_desayuno', 'horario_almuerzo', 'horario_cena',
            'comidas_al_dia', 'consistencia_heces',
            'gatillantes_gi',
            'observaciones_sueno', 'gatillantes_estres', 'manejo_estres'
        ]
        for campo in campos_texto:
            if campo in data and data[campo]:
                setattr(patient, campo, data[campo])

        # --- Campos numericos float ---
        if data.get('peso'):
            try:
                patient.peso_kg = float(data['peso'])
            except (ValueError, TypeError):
                pass
        if data.get('talla'):
            try:
                patient.talla_m = float(data['talla'])
            except (ValueError, TypeError):
                pass

        # --- Campos float adicionales ---
        for campo_f in ['consumo_agua_litros']:
            if campo_f in data and data[campo_f] is not None:
                try:
                    setattr(patient, campo_f, float(data[campo_f]))
                except (ValueError, TypeError):
                    pass

        # Calcular IMC automaticamente si hay peso y talla
        if patient.peso_kg and patient.talla_m and patient.talla_m > 0:
            patient.imc = round(patient.peso_kg / (patient.talla_m ** 2), 1)

        # --- Campos numericos int ---
        campos_int = ['calidad_sueno', 'nivel_estres', 'cigarrillos_dia']
        for campo in campos_int:
            if campo in data and data[campo] is not None:
                try:
                    setattr(patient, campo, int(data[campo]))
                except (ValueError, TypeError):
                    pass

        # --- Campos booleanos ---
        # Only save booleans that are explicitly true (intake JS sends false for
        # commented-out fields, which would overwrite nutritionist-set values)
        for campo_bool in ['fuma']:
            if campo_bool in data:
                val = data[campo_bool]
                if isinstance(val, bool):
                    setattr(patient, campo_bool, val)
                elif isinstance(val, str):
                    setattr(patient, campo_bool, val.lower() in ('true', '1', 'on', 'si'))
                else:
                    setattr(patient, campo_bool, bool(val))
        # pica_entre_comidas, come_frente_tv, come_rapido: only save if explicitly true
        # (these are commented out in the intake form and always send false)
        for campo_bool in ['pica_entre_comidas', 'come_frente_tv', 'come_rapido']:
            if campo_bool in data and data[campo_bool] is True:
                setattr(patient, campo_bool, True)

        # --- Campos JSON array (checkbox groups) ---
        # Usar 'in data' en vez de 'if data.get()' para que [] tambien se guarde
        campos_json_array = [
            'diagnosticos', 'antecedentes_familiares', 'objetivos', 'sintomas_gi'
        ]
        for campo in campos_json_array:
            if campo in data:
                val = data[campo]
                if isinstance(val, list):
                    setattr(patient, campo, json.dumps(val) if val else None)
                elif val:
                    setattr(patient, campo, val)
                log_debug(f"[SUBMIT-INTAKE] {campo} = {val}")

        # --- Restricciones alimentarias (JSON nativo) ---
        if 'restricciones_alimentarias' in data:
            patient.restricciones_alimentarias = data['restricciones_alimentarias']

        # --- Registro 24h (JSON nativo) ---
        if 'registro_24h' in data and data['registro_24h']:
            patient.registro_24h = data['registro_24h']
            log_debug(f"[SUBMIT-INTAKE] registro_24h saved with {len(data['registro_24h'])} meals")

        # --- Frecuencia de Consumo EFC (JSON) ---
        if 'frecuencia_consumo' in data and data['frecuencia_consumo']:
            val = data['frecuencia_consumo']
            if isinstance(val, dict):
                patient.frecuencia_consumo = val
            else:
                patient.frecuencia_consumo = val
            log_debug(f"[SUBMIT-INTAKE] frecuencia_consumo saved with {len(val) if isinstance(val, dict) else '?'} items")

        # Run all calculations (IMC, GEB, GET, macros, etc.)
        patient.calcular_todo()

        # Marcar como completado
        patient.mark_intake_completed()

        # === AUTO-CREAR CUENTA DE PACIENTE ===
        import string
        import secrets as sec

        patient_email = patient.email
        patient_password = None
        patient_user_created = False
        existing_account = False

        if patient_email:
            patient_email_clean = patient_email.strip().lower()
            existing_user = User.query.filter_by(email=patient_email_clean).first()

            if existing_user:
                patient.patient_user_id = existing_user.id
                existing_account = True
                log_debug(f"[SUBMIT-INTAKE] Linked existing user {existing_user.id} to patient {patient.id}")
            else:
                alphabet = string.ascii_letters + string.digits
                patient_password = ''.join(sec.choice(alphabet) for _ in range(8))

                name_parts = (patient.nombre or 'Paciente').strip().split()
                first_name = name_parts[0] if name_parts else 'Paciente'
                last_name = ' '.join(name_parts[1:]) if len(name_parts) > 1 else '-'

                try:
                    birth_date = datetime.strptime(str(patient.fecha_nacimiento), '%Y-%m-%d').date()
                except (ValueError, TypeError):
                    birth_date = date(2000, 1, 1)

                new_user = User(
                    email=patient_email_clean,
                    first_name=first_name,
                    last_name=last_name,
                    birth_date=birth_date,
                    country='Chile',
                    user_type=UserType.PACIENTE,
                    subscription_plan=SubscriptionPlan.PATIENT,
                    is_active=True
                )
                new_user.set_password(patient_password)
                db.session.add(new_user)
                db.session.flush()

                patient.patient_user_id = new_user.id
                patient_user_created = True
                log_debug(f"[SUBMIT-INTAKE] Created user {new_user.id} for patient {patient.nombre}")

        db.session.commit()

        log_debug(f"[SUBMIT-INTAKE] OK - Intake completado para paciente: {patient.nombre} (ID: {patient.id})")

        # Enviar email de bienvenida (fuera del commit para no bloquear)
        if patient_user_created and patient_password:
            try:
                from email_service import send_patient_welcome_email
                send_patient_welcome_email(patient_email_clean, patient.nombre, patient_password)
                log_debug(f"[SUBMIT-INTAKE] Welcome email sent to {patient_email_clean}")
            except Exception as email_err:
                log_debug(f"[SUBMIT-INTAKE] Welcome email failed: {email_err}")

        response_data = {
            'success': True,
            'message': 'Tus datos han sido guardados exitosamente. Tu nutricionista los revisara antes de tu consulta.'
        }

        if patient_user_created and patient_password:
            response_data['credentials'] = {
                'email': patient_email_clean,
                'password': patient_password,
            }
            response_data['message'] = (
                'Tus datos han sido guardados exitosamente. '
                'Hemos creado tu cuenta de paciente para que puedas ver tu ficha y generar recetas.'
            )
        elif existing_account:
            response_data['existing_account'] = {
                'email': patient_email_clean,
            }
            response_data['message'] = (
                'Tus datos han sido guardados exitosamente. '
                'Ya tienes una cuenta registrada con este email. Ingresa con tus credenciales habituales.'
            )

        return jsonify(response_data)

    except Exception as e:
        db.session.rollback()
        log_debug(f"Error en intake publico: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/patients/<int:patient_id>/generate-intake-token', methods=['POST'])
@login_required
def generate_patient_intake_token(patient_id):
    """API para generar/regenerar token de intake para un paciente"""
    log_debug(f"[GENERATE-TOKEN] START - patient_id={patient_id}, user_id={current_user.id}")
    if current_user.user_type != 'nutricionista':
        log_debug(f"[GENERATE-TOKEN] DENIED - user_type='{current_user.user_type}'")
        return jsonify({'error': 'No autorizado'}), 403

    try:
        patient = PatientFile.query.filter_by(
            id=patient_id,
            nutricionista_id=current_user.id
        ).first()

        if not patient:
            return jsonify({'error': 'Paciente no encontrado'}), 404

        # Generar nuevo token
        token = patient.generate_intake_token()
        db.session.commit()

        # Construir URL completa
        base_url = request.host_url.rstrip('/')
        intake_url = f"{base_url}/intake/{token}"

        log_debug(f"Token de intake generado para paciente: {patient.nombre}")

        return jsonify({
            'success': True,
            'token': token,
            'intake_url': intake_url,
            'message': 'Enlace de formulario generado exitosamente'
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/patients/<int:patient_id>/mark-intake-sent', methods=['POST'])
@login_required
def mark_intake_url_sent(patient_id):
    """API para marcar que el enlace de intake fue enviado al paciente"""
    log_debug(f"[MARK-INTAKE-SENT] START - patient_id={patient_id}, user_id={current_user.id}")
    if current_user.user_type != 'nutricionista':
        log_debug(f"[MARK-INTAKE-SENT] DENIED")
        return jsonify({'error': 'No autorizado'}), 403

    try:
        patient = PatientFile.query.filter_by(
            id=patient_id,
            nutricionista_id=current_user.id
        ).first()

        if not patient:
            return jsonify({'error': 'Paciente no encontrado'}), 404

        patient.mark_url_sent()
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Marcado como enviado'
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/patients/<int:patient_id>/send-intake-email', methods=['POST'])
@login_required
def send_intake_email_endpoint(patient_id):
    """API para enviar/reenviar email de intake al paciente"""
    log_debug(f"[SEND-INTAKE-EMAIL] START - patient_id={patient_id}, user_id={current_user.id}")
    if current_user.user_type != 'nutricionista':
        log_debug(f"[SEND-INTAKE-EMAIL] DENIED")
        return jsonify({'error': 'No autorizado'}), 403

    try:
        patient = PatientFile.query.filter_by(
            id=patient_id,
            nutricionista_id=current_user.id
        ).first()

        if not patient:
            log_debug(f"[SEND-INTAKE-EMAIL] NOT FOUND - patient_id={patient_id}")
            return jsonify({'error': 'Paciente no encontrado'}), 404

        if not patient.email:
            log_debug(f"[SEND-INTAKE-EMAIL] NO EMAIL for patient_id={patient_id}")
            return jsonify({'success': False, 'error': 'El paciente no tiene email registrado'}), 400

        if not is_mail_configured():
            return jsonify({'success': False, 'error': 'El servicio de email no esta configurado. Configura las variables MAIL_USERNAME y MAIL_PASSWORD.'}), 503

        # Generate token if not exists
        if not patient.intake_token:
            patient.generate_intake_token()

        intake_url = patient.get_intake_url(request.host_url.rstrip('/'))

        result = send_intake_email(
            patient,
            intake_url,
            current_user.get_full_name()
        )

        if result['success']:
            patient.mark_url_sent()
            db.session.commit()
            return jsonify({
                'success': True,
                'message': f'Email enviado a {patient.email}',
                'intake_url': intake_url
            })
        else:
            return jsonify({'success': False, 'error': result.get('error', 'Error al enviar email')}), 500

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/my-recipes')
@login_required
def my_recipes():
    """Ver todas mis recetas"""
    log_debug(f"[MY-RECIPES] user_id={current_user.id}")
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
    log_debug(f"[SUPERFOODS] GET /api/superfoods - category={request.args.get('category','all')}, search='{request.args.get('search','')}'")
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
        
        log_debug(f"[OK] API Superfoods: {len(superfoods)} resultados (categoria: {category}, búsqueda: '{search}')")
        
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
        
@app.route('/api/alimentos', methods=['GET'])
def get_alimentos():
    """
    API para cargar base de alimentos desde Excel
    Organiza por: Grupo > Subgrupo > Lista de alimentos
    """
    log_debug(f"[ALIMENTOS] GET /api/alimentos")
    try:
        import pandas as pd

        # Cargar Excel con encoding correcto
        df = pd.read_excel('data/base_alimentos_porciones.xlsx')

        # Función para limpiar texto con encoding problemático
        import unicodedata
        def clean_text(text):
            if not isinstance(text, str):
                return str(text) if pd.notna(text) else ''
            # Intentar decodificar si tiene problemas de encoding
            try:
                # Reemplazar caracteres problemáticos comunes
                text = text.encode('latin1').decode('utf-8')
            except:
                pass
            return text.strip()

        def normalize_text(text):
            # Remove accents and convert to lowercase
            return ''.join(
                c for c in unicodedata.normalize('NFD', text.lower())
                if unicodedata.category(c) != 'Mn'
            )

        col_map = {}
        for col in df.columns:
            col_norm = normalize_text(col)
            if 'grupo' in col_norm and 'sub' not in col_norm:
                col_map[col] = 'grupo'
            elif 'subgrupo' in col_norm:
                col_map[col] = 'subgrupo'
            elif 'alimento' in col_norm:
                col_map[col] = 'alimento'
            elif 'gramos' in col_norm:
                col_map[col] = 'gramos_porcion'
            elif 'medida' in col_norm:
                col_map[col] = 'medida_casera'
            elif 'kcal' in col_norm:
                col_map[col] = 'kcal'
            elif 'prote' in col_norm:
                col_map[col] = 'proteinas'
            elif 'lip' in col_norm or 'grasa' in col_norm:
                col_map[col] = 'lipidos'
            elif 'carb' in col_norm:
                col_map[col] = 'carbohidratos'

        df = df.rename(columns=col_map)

        # Organizar estructura jerárquica
        alimentos_db = {}

        def safe_float(val):
            try:
                return float(val) if pd.notna(val) else 0.0
            except:
                return 0.0

        # M5: Fix group name typos from xlsx
        GRUPO_FIXES = {'AzúCares': 'Azúcares', 'azuCares': 'Azúcares', 'AzuCares': 'Azúcares'}

        for _, row in df.iterrows():
            grupo = clean_text(row.get('grupo', 'otros'))
            grupo = GRUPO_FIXES.get(grupo, grupo)  # Fix typos
            subgrupo = clean_text(row.get('subgrupo', 'general'))
            nombre = clean_text(row.get('alimento', ''))

            # Saltar filas sin nombre
            if not nombre or nombre == 'nan':
                continue

            if grupo not in alimentos_db:
                alimentos_db[grupo] = {}

            if subgrupo not in alimentos_db[grupo]:
                alimentos_db[grupo][subgrupo] = []

            alimentos_db[grupo][subgrupo].append({
                'nombre': nombre,
                'medida_casera': clean_text(row.get('medida_casera', '1 porcion')),
                'gramos_porcion': safe_float(row.get('gramos_porcion', 100)),
                'kcal': safe_float(row.get('kcal', 0)),
                'proteinas': safe_float(row.get('proteinas', 0)),
                'carbohidratos': safe_float(row.get('carbohidratos', 0)),
                'lipidos': safe_float(row.get('lipidos', 0))
            })

        # Contar totales
        total_grupos = len(alimentos_db)
        total_alimentos = sum(
            len(alimentos)
            for grupo in alimentos_db.values()
            for alimentos in grupo.values()
        )

        log_debug(f"[OK] API Alimentos: {total_grupos} grupos, {total_alimentos} alimentos")

        return jsonify({
            'success': True,
            'data': alimentos_db,
            'total_grupos': total_grupos,
            'total_alimentos': total_alimentos
        })

    except Exception as e:
        log_debug(f"[ERROR] API Alimentos: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/search-alimentos', methods=['GET'])
def search_alimentos():
    """
    API para buscar alimentos por nombre con autocompletado
    Retorna nombre, grupo, subgrupo y datos nutricionales
    """
    log_debug(f"[SEARCH-ALIMENTOS] q='{request.args.get('q','')}', limit={request.args.get('limit', 15)}")
    try:
        import pandas as pd

        query = request.args.get('q', '').strip().lower()
        limit = int(request.args.get('limit', 15))

        if len(query) < 2:
            return jsonify({
                'success': True,
                'results': [],
                'message': 'Query too short'
            })

        # Cargar Excel
        df = pd.read_excel('data/base_alimentos_porciones.xlsx')

        # Buscar coincidencias (nombre contiene el query)
        mask = df['nombre'].str.lower().str.contains(query, na=False)
        matches = df[mask].head(limit)

        results = []
        for _, row in matches.iterrows():
            results.append({
                'nombre': row.get('nombre', 'Sin nombre'),
                'grupo': row.get('grupo', 'otros'),
                'subgrupo': row.get('subgrupo', 'general'),
                'medida_casera': row.get('medida_casera', '1 porcion'),
                'kcal': float(row.get('kcal', 0)) if pd.notna(row.get('kcal')) else 0,
                'proteinas': float(row.get('proteinas', 0)) if pd.notna(row.get('proteinas')) else 0,
                'carbohidratos': float(row.get('carbohidratos', 0)) if pd.notna(row.get('carbohidratos')) else 0,
                'lipidos': float(row.get('lipidos', 0)) if pd.notna(row.get('lipidos')) else 0
            })

        log_debug(f"Search alimentos '{query}': {len(results)} resultados")

        return jsonify({
            'success': True,
            'results': results,
            'total': len(results)
        })

    except Exception as e:
        log_debug(f"Error en Search Alimentos: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/barcode/<barcode>', methods=['GET'])
@login_required
def barcode_lookup(barcode):
    """Lookup food product by barcode via Open Food Facts API."""
    log_debug(f"[BARCODE] Lookup barcode={barcode}")
    try:
        import requests as http_requests
        resp = http_requests.get(
            f'https://world.openfoodfacts.org/api/v2/product/{barcode}.json',
            headers={'User-Agent': 'BiteTrack/1.0 (nutritionist-tool)'},
            timeout=8
        )
        data = resp.json()

        if data.get('status') != 1 or not data.get('product'):
            return jsonify({'success': False, 'found': False, 'error': 'Producto no encontrado en Open Food Facts'})

        p = data['product']
        nuts = p.get('nutriments', {})

        product = {
            'barcode': barcode,
            'nombre': p.get('product_name') or p.get('product_name_es') or 'Sin nombre',
            'marca': p.get('brands', ''),
            'imagen': p.get('image_front_small_url') or p.get('image_url', ''),
            'ingredientes': p.get('ingredients_text_es') or p.get('ingredients_text', ''),
            'alergenos': p.get('allergens_tags', []),
            'categorias': p.get('categories', ''),
            'porcion_g': float(p.get('serving_quantity') or 100),
            'nutri_score': p.get('nutriscore_grade', ''),
            'nova_group': p.get('nova_group', ''),
            'por_100g': {
                'kcal': float(nuts.get('energy-kcal_100g', 0)),
                'proteinas': float(nuts.get('proteins_100g', 0)),
                'carbohidratos': float(nuts.get('carbohydrates_100g', 0)),
                'lipidos': float(nuts.get('fat_100g', 0)),
                'fibra': float(nuts.get('fiber_100g', 0)),
                'azucares': float(nuts.get('sugars_100g', 0)),
                'sodio_mg': float(nuts.get('sodium_100g', 0)) * 1000,
                'grasas_saturadas': float(nuts.get('saturated-fat_100g', 0)),
            }
        }

        log_debug(f"[BARCODE] Found: {product['nombre']} ({product['marca']})")
        return jsonify({'success': True, 'found': True, 'product': product})

    except Exception as e:
        log_debug(f"[BARCODE] ERROR: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/barcode/save', methods=['POST'])
@login_required
def barcode_save_to_db():
    """Save a scanned product to the local food database (Excel)."""
    log_debug(f"[BARCODE-SAVE] user_id={current_user.id}")
    try:
        import pandas as pd

        data = request.json
        nombre = data.get('nombre', '').strip()
        if not nombre:
            return jsonify({'success': False, 'error': 'Nombre requerido'}), 400

        excel_path = 'data/base_alimentos_porciones.xlsx'
        df = pd.read_excel(excel_path)

        # Check if already exists
        if nombre.lower() in df['Alimento'].str.lower().values:
            return jsonify({'success': False, 'error': f'"{nombre}" ya existe en la base de datos'})

        new_row = {
            'Grupo': data.get('grupo', 'Productos envasados'),
            'Subgrupo': data.get('subgrupo', 'Escaneado'),
            'Alimento': nombre,
            'Gramos_por_porción': data.get('gramos', 100),
            'Medida_casera': data.get('medida_casera', '1 porcion'),
            'Kcal_por_porción': data.get('kcal', 0),
            'Proteínas_g': data.get('proteinas', 0),
            'Lípidos_g': data.get('lipidos', 0),
            'Carbohidratos_g': data.get('carbohidratos', 0),
            'Comentario': f"Escaneado barcode:{data.get('barcode', '')} marca:{data.get('marca', '')}"
        }

        df = pd.concat([df, pd.DataFrame([new_row])], ignore_index=True)
        df.to_excel(excel_path, index=False)

        log_debug(f"[BARCODE-SAVE] Saved '{nombre}' to food DB")
        return jsonify({'success': True, 'message': f'"{nombre}" guardado en base de datos'})

    except Exception as e:
        log_debug(f"[BARCODE-SAVE] ERROR: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/check-recipe-limit', methods=['GET'])
@login_required
def check_recipe_limit():
    """Verifica si el usuario puede generar más recetas"""
    log_debug(f"[CHECK-RECIPE-LIMIT] user_id={current_user.id}, plan='{current_user.subscription_plan}'")
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
    log_debug(f"[RECIPE-HISTORY] user_id={current_user.id}")
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
    log_debug(f"[PROFILE] user_id={current_user.id}, email='{current_user.email}'")
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
                    log_debug(f"[OK] {file_path}: {len(df)} filas")
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
        log_debug("[START] === INICIANDO GENERACIÓN DE RECETA ===")
        
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
                    
                log_debug(f"[OK] Receta guardada para {current_user.email}")
            except Exception as e:
                log_debug(f"[WARN] Error guardando receta: {e}")
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
            log_debug(f"[SUBMIT-FEEDBACK] recipe_id={data.get('recipe_id')}, rating={data.get('rating')}")
            
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
                    log_debug(f"[OK] Review guardado para usuario {current_user.email}")
                except Exception as e:
                    log_debug(f"[WARN] Error guardando review: {e}")
            
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
    log_debug(f"[GET-FEEDBACK] recipe_id={recipe_id}")
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
        
        log_debug(f"[OK] Regeneración completada")
        
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

# ============================================
# RUTA ESTÁTICA GENÉRICA (SOLO UNA VEZ, AL FINAL)
# ============================================

# NOTA: Eliminada la ruta catch-all /<path:filename> porque interceptaba
# las rutas de auth, api, dashboard, etc. Los archivos estáticos se sirven
# a través de las rutas específicas /css/, /js/, /images/
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
# MIGRACIÓN DE BASE DE DATOS
# ============================================

@app.route('/api/debug-auth')
def debug_auth():
    """Endpoint para debuggear problemas de autenticación"""
    import traceback
    results = {
        'auth_enabled': AUTH_ENABLED,
        'checks': []
    }

    # 1. Verificar templates
    templates_to_check = ['login.html', 'register.html']
    for tpl in templates_to_check:
        path = os.path.join(app.template_folder or 'templates', tpl)
        exists = os.path.exists(path)
        results['checks'].append({
            'check': f'Template {tpl}',
            'exists': exists,
            'path': path
        })

    # 2. Verificar blueprint de auth
    results['blueprints'] = list(app.blueprints.keys())

    # 3. Verificar rutas de auth
    auth_routes = []
    for rule in app.url_map.iter_rules():
        if 'auth' in rule.endpoint or 'login' in str(rule) or 'register' in str(rule):
            auth_routes.append({
                'endpoint': rule.endpoint,
                'methods': list(rule.methods),
                'rule': str(rule)
            })
    results['auth_routes'] = auth_routes

    # 4. Verificar base de datos
    try:
        user_count = User.query.count()
        results['db_status'] = 'OK'
        results['user_count'] = user_count
    except Exception as e:
        results['db_status'] = 'ERROR'
        results['db_error'] = str(e)

    # 5. Intentar renderizar login template
    try:
        from flask import render_template_string
        test = render_template('login.html')
        results['login_template_render'] = 'OK'
    except Exception as e:
        results['login_template_render'] = 'ERROR'
        results['login_template_error'] = str(e)
        results['login_template_traceback'] = traceback.format_exc()

    # 6. Intentar renderizar register template
    try:
        test = render_template('register.html', countries=['Chile'], cities=['Santiago'])
        results['register_template_render'] = 'OK'
    except Exception as e:
        results['register_template_render'] = 'ERROR'
        results['register_template_error'] = str(e)
        results['register_template_traceback'] = traceback.format_exc()

    return jsonify(results)

@app.route('/api/test-auth', methods=['GET'])
@login_required
def test_auth_only():
    """Test just the @login_required decorator"""
    return jsonify({
        'success': True,
        'user_id': current_user.id,
        'user_email': current_user.email
    })

@app.route('/api/test-write', methods=['POST', 'GET'])
def test_write_noauth():
    """Test database write WITHOUT auth"""
    try:
        patient = PatientFile(
            nutricionista_id=1,
            nombre='Test-' + datetime.utcnow().strftime('%H%M%S'),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.session.add(patient)
        db.session.commit()
        return jsonify({'success': True, 'patient_id': patient.id})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/test-save', methods=['POST'])
@login_required
def test_save_patient():
    """Minimal test endpoint for patient save"""
    try:
        data = request.json or {}
        nombre = data.get('nombre', 'Test')

        patient = PatientFile(
            nutricionista_id=current_user.id,
            nombre=nombre,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.session.add(patient)
        db.session.commit()

        return jsonify({
            'success': True,
            'patient_id': patient.id,
            'message': 'Test save worked!'
        })
    except Exception as e:
        db.session.rollback()
        import traceback
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500

@app.route('/api/debug-db', methods=['GET'])
def debug_database():
    """Debug endpoint to check database schema"""
    try:
        from sqlalchemy import text, inspect
        inspector = inspect(db.engine)

        results = {
            'tables': inspector.get_table_names(),
            'patient_files_columns': [],
            'users_columns': [],
            'test_query': None
        }

        if 'patient_files' in results['tables']:
            results['patient_files_columns'] = [
                {'name': col['name'], 'type': str(col['type'])}
                for col in inspector.get_columns('patient_files')
            ]

        if 'users' in results['tables']:
            results['users_columns'] = [
                {'name': col['name'], 'type': str(col['type'])}
                for col in inspector.get_columns('users')
            ]

        # Test query
        try:
            count = PatientFile.query.count()
            results['patient_count'] = count
            results['test_query'] = 'OK'
        except Exception as e:
            results['test_query'] = f'ERROR: {str(e)}'

        return jsonify(results)
    except Exception as e:
        import traceback
        return jsonify({'error': str(e), 'traceback': traceback.format_exc()}), 500

@app.route('/api/migrate-db', methods=['GET', 'POST'])
def migrate_database():
    """Endpoint para agregar columnas faltantes a la base de datos"""
    try:
        from sqlalchemy import text, inspect

        inspector = inspect(db.engine)
        results = []

        # Columnas nuevas para patient_files y bookings
        new_columns = {
            'patient_files': [
                ('intake_token', 'VARCHAR(64)'),
                ('intake_completed', 'BOOLEAN DEFAULT FALSE'),
                ('intake_completed_at', 'TIMESTAMP'),
                ('intake_url_sent', 'BOOLEAN DEFAULT FALSE'),
                ('intake_url_sent_at', 'TIMESTAMP'),
                ('menstruacion', 'VARCHAR(50)'),
                ('restricciones_alimentarias', 'JSON'),
                ('delivery_restaurante', 'INTEGER'),
                ('percepcion_esfuerzo', 'INTEGER'),
                ('otros_diagnosticos', 'TEXT'),
                ('comidas_al_dia', 'VARCHAR(20)'),
                ('patient_user_id', 'INTEGER'),
                ('factor_actividad_num', 'FLOAT'),
                ('metodo_calculo', 'VARCHAR(30)'),
                ('ajuste_calorico', 'INTEGER'),
                ('get_kcal_ajustado', 'FLOAT'),
            ],
            'bookings': [
                ('reminder_24h_sent', 'BOOLEAN DEFAULT FALSE'),
                ('reminder_1h_sent', 'BOOLEAN DEFAULT FALSE'),
                ('reminder_nutri_24h_sent', 'BOOLEAN DEFAULT FALSE'),
                ('reschedule_token', 'VARCHAR(64)'),
            ]
        }

        for table_name, columns in new_columns.items():
            if table_name in inspector.get_table_names():
                existing_columns = [col['name'] for col in inspector.get_columns(table_name)]

                for col_name, col_type in columns:
                    if col_name not in existing_columns:
                        try:
                            # Sintaxis para PostgreSQL y SQLite
                            sql = f'ALTER TABLE {table_name} ADD COLUMN {col_name} {col_type}'
                            db.session.execute(text(sql))
                            results.append(f"Added: {table_name}.{col_name}")
                        except Exception as e:
                            results.append(f"Skip {col_name}: {str(e)[:50]}")

        # Resize columns that are too small
        resize_columns = {
            'bookings': [('specialty', 'VARCHAR(500)')],
        }
        for table_name, columns in resize_columns.items():
            if table_name in inspector.get_table_names():
                for col_name, col_type in columns:
                    try:
                        sql = f'ALTER TABLE {table_name} ALTER COLUMN {col_name} TYPE {col_type}'
                        db.session.execute(text(sql))
                        results.append(f"Resized: {table_name}.{col_name} -> {col_type}")
                    except Exception as e:
                        results.append(f"Skip resize {col_name}: {str(e)[:50]}")

        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Migration completed',
            'results': results
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ============================================
# CRON: BOOKING REMINDERS
# ============================================

@app.route('/api/cron/send-reminders', methods=['GET', 'POST'])
def cron_send_reminders():
    """
    Cron endpoint: sends booking reminders to patients and nutritionists.
    Should be called every 30 minutes by an external cron service.

    Sends:
    - 24h reminder to patient (when booking is 20-28h away)
    - 1h reminder to patient (when booking is 30min-2h away)
    - 24h reminder to nutritionist (when booking is 20-28h away)
    """
    # Simple auth via query param to prevent abuse
    cron_key = request.args.get('key', '')
    expected_key = os.environ.get('CRON_SECRET', 'bitetrack-cron-2024')
    if cron_key != expected_key:
        return jsonify({'error': 'Unauthorized'}), 401

    from datetime import timedelta
    # Chile time = UTC-3 (CLT). Bookings are stored in Chilean local time.
    CHILE_OFFSET_HOURS = -3
    now_utc = datetime.utcnow()
    now_chile = now_utc + timedelta(hours=CHILE_OFFSET_HOURS)
    results = {'sent': [], 'errors': [], 'checked': 0, 'now_chile': now_chile.isoformat()}

    try:
        # Get all upcoming bookings (next 28 hours) that are pending or confirmed
        upcoming = Booking.query.filter(
            Booking.status.in_([BookingStatus.PENDING, BookingStatus.CONFIRMED]),
            Booking.booking_date >= now_chile.date(),
            Booking.booking_date <= (now_chile + timedelta(hours=28)).date()
        ).all()

        results['checked'] = len(upcoming)

        for booking in upcoming:
            booking_dt = booking.get_datetime()
            if not booking_dt:
                continue

            # Compare in Chilean local time
            hours_until = (booking_dt - now_chile).total_seconds() / 3600

            # Skip past bookings
            if hours_until < 0:
                continue

            nutri = User.query.get(booking.nutritionist_id)
            if not nutri:
                continue

            # 24h reminder to patient (20-28 hours before)
            if 20 <= hours_until <= 28 and not booking.reminder_24h_sent:
                result = send_booking_reminder(booking, nutri, is_patient=True, time_label='en 24 horas')
                if result.get('success'):
                    booking.reminder_24h_sent = True
                    results['sent'].append(f'24h patient: {booking.client_email}')
                else:
                    results['errors'].append(f'24h patient {booking.client_email}: {result.get("error")}')

            # 24h reminder to nutritionist (20-28 hours before)
            if 20 <= hours_until <= 28 and not booking.reminder_nutri_24h_sent:
                result = send_booking_reminder(booking, nutri, is_patient=False, time_label='en 24 horas')
                if result.get('success'):
                    booking.reminder_nutri_24h_sent = True
                    results['sent'].append(f'24h nutri: {nutri.email}')
                else:
                    results['errors'].append(f'24h nutri {nutri.email}: {result.get("error")}')

            # 1h reminder to patient (0.5-2 hours before)
            if 0.5 <= hours_until <= 2 and not booking.reminder_1h_sent:
                result = send_booking_reminder(booking, nutri, is_patient=True, time_label='en 1 hora')
                if result.get('success'):
                    booking.reminder_1h_sent = True
                    results['sent'].append(f'1h patient: {booking.client_email}')
                else:
                    results['errors'].append(f'1h patient {booking.client_email}: {result.get("error")}')

        db.session.commit()

        return jsonify({
            'success': True,
            'checked': results['checked'],
            'sent': results['sent'],
            'errors': results['errors'],
            'timestamp': now_chile.isoformat()
        })

    except Exception as e:
        db.session.rollback()
        import traceback
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500


@app.route('/api/reset-all-data', methods=['GET', 'POST'])
def reset_all_data():
    """NUCLEAR RESET: borra TODA la data de la app (para testing)."""
    try:
        from sqlalchemy import text

        # Dynamically find ALL tables in the public schema
        result = db.session.execute(text(
            "SELECT tablename FROM pg_tables WHERE schemaname = 'public'"
        ))
        all_tables = [row[0] for row in result]

        # Skip migration tracking tables
        skip = {'alembic_version'}
        tables_to_truncate = [t for t in all_tables if t not in skip]

        if tables_to_truncate:
            table_list = ', '.join(tables_to_truncate)
            db.session.execute(text(
                f"TRUNCATE TABLE {table_list} RESTART IDENTITY CASCADE"
            ))
            db.session.commit()

        return jsonify({
            'success': True,
            'message': f'Truncated {len(tables_to_truncate)} tables',
            'tables': tables_to_truncate
        })

    except Exception as e:
        db.session.rollback()
        import traceback
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500


@app.route('/api/create-dummy-nutritionists', methods=['GET', 'POST'])
def create_dummy_nutritionists():
    """Crear nutricionistas dummy para testing."""
    try:
        dummy_nutris = [
            {
                'email': 'maria.gonzalez@demo.cl',
                'first_name': 'Maria',
                'last_name': 'Gonzalez',
                'birth_date': date(1988, 3, 15),
                'country': 'Chile',
                'city': 'Santiago',
                'specialization': 'nutricion_clinica,control_peso,diabetes_metabolismo',
                'bio': 'Nutricionista clinica con 10 anos de experiencia en control de peso y manejo de diabetes. Enfoque integral y personalizado.',
                'consulta_precio': 35000,
                'consulta_duracion': 45,
                'license_number': 'NC-2015-001',
            },
            {
                'email': 'carlos.fernandez@demo.cl',
                'first_name': 'Carlos',
                'last_name': 'Fernandez',
                'birth_date': date(1990, 7, 22),
                'country': 'Chile',
                'city': 'Santiago',
                'specialization': 'nutricion_deportiva,rendimiento_atletico,control_peso',
                'bio': 'Especialista en nutricion deportiva y rendimiento. Trabajo con atletas amateur y profesionales para optimizar su alimentacion.',
                'consulta_precio': 40000,
                'consulta_duracion': 60,
                'license_number': 'NC-2017-042',
            },
            {
                'email': 'ana.martinez@demo.cl',
                'first_name': 'Ana',
                'last_name': 'Martinez',
                'birth_date': date(1985, 11, 8),
                'country': 'Chile',
                'city': 'Valparaiso',
                'specialization': 'gastroenterologia_nutricional,alergias_intolerancias,enfermedad_celiaca',
                'bio': 'Especializada en problemas digestivos, intolerancias y alergias alimentarias. Certificada en enfermedad celiaca y dieta FODMAP.',
                'consulta_precio': 38000,
                'consulta_duracion': 50,
                'license_number': 'NC-2013-018',
            },
            {
                'email': 'valentina.rojas@demo.cl',
                'first_name': 'Valentina',
                'last_name': 'Rojas',
                'birth_date': date(1992, 5, 30),
                'country': 'Chile',
                'city': 'Santiago',
                'specialization': 'embarazo_lactancia,nutricion_pediatrica,nutricion_adolescente',
                'bio': 'Dedicada a la nutricion materno-infantil. Acompano a mamas durante embarazo, lactancia y alimentacion complementaria del bebe.',
                'consulta_precio': 32000,
                'consulta_duracion': 45,
                'license_number': 'NC-2019-067',
            },
        ]

        created = []
        for data in dummy_nutris:
            existing = User.query.filter_by(email=data['email']).first()
            if existing:
                created.append(f"SKIP: {data['email']} (already exists)")
                continue

            user = User(
                email=data['email'],
                first_name=data['first_name'],
                last_name=data['last_name'],
                birth_date=data['birth_date'],
                country=data['country'],
                city=data['city'],
                user_type=UserType.NUTRICIONISTA,
                subscription_plan=SubscriptionPlan.PROFESSIONAL,
                specialization=data['specialization'],
                bio=data['bio'],
                consulta_precio=data['consulta_precio'],
                consulta_duracion=data['consulta_duracion'],
                license_number=data['license_number'],
                is_active=True,
            )
            user.set_password('demo1234')
            db.session.add(user)
            db.session.flush()

            # Create schedule: Mon-Fri 9:00-17:00
            for day in range(5):  # 0=Mon to 4=Fri
                schedule = NutritionistSchedule(
                    nutritionist_id=user.id,
                    day_of_week=day,
                    start_time='09:00',
                    end_time='17:00',
                    slot_duration=data['consulta_duracion'],
                    is_active=True,
                )
                db.session.add(schedule)

            created.append(f"OK: {data['first_name']} {data['last_name']} ({data['email']})")

        db.session.commit()
        return jsonify({'success': True, 'created': created})

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


# ============================================
# ENDPOINTS PAUTA GENERATOR
# ============================================

@lru_cache(maxsize=1)
def load_alimentos_database():
    """Cargar base de datos de alimentos desde Excel (con cache)"""
    try:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        csv_path = os.path.join(base_dir, 'data', 'base_alimentos_porciones.xlsx')
        if not os.path.exists(csv_path):
             print(f"Error: Archivo no encontrado en {csv_path}")
             return {}

        df = pd.read_excel(csv_path, engine='openpyxl')
        df.columns = df.columns.str.strip()

        # Normalize column names to handle encoding issues
        col_map = {}
        for col in df.columns:
            col_lower = col.lower()
            if 'grupo' in col_lower and 'sub' not in col_lower:
                col_map[col] = 'grupo'
            elif 'subgrupo' in col_lower:
                col_map[col] = 'subgrupo'
            elif 'alimento' in col_lower:
                col_map[col] = 'alimento'
            elif 'gramos' in col_lower:
                col_map[col] = 'gramos_porcion'
            elif 'medida' in col_lower:
                col_map[col] = 'medida_casera'
            elif 'kcal' in col_lower:
                col_map[col] = 'kcal'
            elif 'prote' in col_lower:
                col_map[col] = 'proteinas'
            elif 'lip' in col_lower or 'grasa' in col_lower:
                col_map[col] = 'lipidos'
            elif 'carb' in col_lower:
                col_map[col] = 'carbohidratos'

        df = df.rename(columns=col_map)

        database = {}

        def safe_float(val, default=0):
            """Convert to float safely, handling ranges like '50-60' by averaging"""
            if pd.isna(val):
                return default
            if isinstance(val, (int, float)):
                return float(val)
            s = str(val).strip()
            if '-' in s and not s.startswith('-'):
                parts = s.split('-')
                try:
                    return sum(float(p) for p in parts) / len(parts)
                except ValueError:
                    return default
            try:
                return float(s)
            except ValueError:
                return default

        for grupo in df['grupo'].unique():
            grupo_key = str(grupo).lower().strip()
            # Normalizar key
            replacements = {'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u', ' ': '_'}
            for old, new in replacements.items():
                grupo_key = grupo_key.replace(old, new)

            database[grupo_key] = {}
            df_grupo = df[df['grupo'] == grupo]

            for subgrupo in df_grupo['subgrupo'].unique():
                subgrupo_key = str(subgrupo).lower().strip()
                df_subgrupo = df_grupo[df_grupo['subgrupo'] == subgrupo]
                alimentos_list = []

                for _, row in df_subgrupo.iterrows():
                    nombre = str(row.get('alimento', '')).strip()
                    if not nombre or nombre == 'nan':
                        continue

                    alimento = {
                        'nombre': nombre,
                        'gramos_porcion': safe_float(row.get('gramos_porcion', 100), 100),
                        'medida_casera': str(row.get('medida_casera', '1 porcion')),
                        'kcal': safe_float(row.get('kcal', 0)),
                        'proteinas': safe_float(row.get('proteinas', 0)),
                        'lipidos': safe_float(row.get('lipidos', 0)),
                        'carbohidratos': safe_float(row.get('carbohidratos', 0))
                    }
                    alimentos_list.append(alimento)

                if alimentos_list:
                    database[grupo_key][subgrupo_key] = alimentos_list

        print(f"[OK] load_alimentos_database: {len(database)} grupos cargados")
        return database
    except Exception as e:
        print(f"Error cargando alimentos: {e}")
        import traceback
        traceback.print_exc()
        return {}

@app.route('/api/alimentos/grupo/<grupo>', methods=['GET'])
@login_required
def get_alimentos_grupo(grupo):
    log_debug(f"[ALIMENTOS-GRUPO] grupo='{grupo}'")
    try:
        db = load_alimentos_database()
        grupo = grupo.lower().strip()
        alimentos = []
        
        # Mapping keywords
        keywords = {
            'lacteos': ['lacteo', 'leche', 'queso', 'yogur'],
            'cereales': ['cereal', 'pan', 'arroz', 'fideo', 'pasta', 'avena'],
            'frutas': ['fruta'],
            'verduras': ['verdura', 'hortaliza'],
            'proteina': ['carne', 'pescado', 'huevo', 'legumbre', 'pollo', 'cerdo', 'atun'],
            'grasas': ['aceite', 'grasa', 'palta', 'frutos_secos', 'semilla', 'almendra', 'nuez'],
            'azucares': ['azucar', 'miel', 'mermelada', 'dulce'],
            'otros': ['otro', 'bebida', 'aderezo']
        }
        
        search_terms = keywords.get(grupo, [grupo])
        
        for db_grupo, subgrupos in db.items():
            db_grupo_lower = db_grupo.lower()
            # Check if group matches
            if any(term in db_grupo_lower for term in search_terms):
                 for subgrupo, lista in subgrupos.items():
                     alimentos.extend(lista)
            else:
                # Check subgrupos
                 for subgrupo, lista in subgrupos.items():
                     if any(term in subgrupo.lower() for term in search_terms):
                         alimentos.extend(lista)
        
        # Sort by name
        alimentos.sort(key=lambda x: x['nombre'])
        
        return jsonify({'success': True, 'alimentos': alimentos})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/generar-pauta/<int:patient_id>', methods=['GET', 'POST'])
@login_required
def generar_pauta_endpoint(patient_id):
    log_debug(f"[GENERAR-PAUTA] START - patient_id={patient_id}, method={request.method}, user_id={current_user.id}")
    try:
        patient = PatientFile.query.get_or_404(patient_id)
        log_debug(f"[GENERAR-PAUTA] Patient: '{patient.nombre}', peso={patient.peso_kg}, talla={patient.talla_m}")
        alimentos_db = load_alimentos_database()
        log_debug(f"[GENERAR-PAUTA] Alimentos DB loaded: {len(alimentos_db)} grupos")

        # Prepare patient data dict - FIX: call calcular_edad()
        edad = patient.calcular_edad()
        if edad is None:
            edad = 30 # Default if unknown

        patient_data = {
            'id': patient.id,
            'nombre': patient.nombre or 'Paciente',
            'sexo': patient.sexo or '',
            'peso_kg': patient.peso_kg,
            'talla_m': patient.talla_m,
            'edad': edad,
            'get_kcal': patient.get_kcal,
            'factor_actividad': patient.factor_actividad,
            'proteinas_g': patient.proteinas_g,
            'carbohidratos_g': patient.carbohidratos_g,
            'grasas_g': patient.grasas_g,
            'registro_24h': patient.registro_24h,
            'frecuencia_consumo': patient.frecuencia_consumo,
            'objetivos': patient.objetivos,
            'liquido_ml': float(patient.consumo_agua_litros) * 1000 if patient.consumo_agua_litros else 2000,
            # Allergy, intolerance and dietary restriction data for filtering
            'alergias': patient.alergias if patient.alergias else '',
            'intolerancias': patient.intolerancias if patient.intolerancias else '',
            'restricciones_alimentarias': patient.restricciones_alimentarias if patient.restricciones_alimentarias else []
        }

        # If POST request, allow frontend to override/supplement allergy data
        if request.method == 'POST':
            post_data = request.get_json(silent=True) or {}
            if post_data.get('alergias'):
                patient_data['alergias'] = post_data['alergias']
            if post_data.get('intolerancias'):
                patient_data['intolerancias'] = post_data['intolerancias']
            if post_data.get('restricciones_alimentarias'):
                patient_data['restricciones_alimentarias'] = post_data['restricciones_alimentarias']

        generator = PautaInteligente(patient_data, alimentos_db)
        pauta = generator.generar()

        log_debug(f"[GENERAR-PAUTA] OK - pauta generated for patient_id={patient_id}")
        return jsonify({'success': True, 'pauta': pauta})
    except Exception as e:
        log_debug(f"[GENERAR-PAUTA] ERROR - patient_id={patient_id}: {str(e)}")
        import traceback
        log_debug(f"[GENERAR-PAUTA] TRACEBACK: {traceback.format_exc()}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/guardar-pauta/<int:patient_id>', methods=['POST'])
@login_required
def guardar_pauta_endpoint_post(patient_id):
    log_debug(f"[GUARDAR-PAUTA] START - patient_id={patient_id}, user_id={current_user.id}")
    try:
        patient = PatientFile.query.get_or_404(patient_id)
        data = request.json
        pauta = data.get('pauta')

        if pauta:
            patient.plan_alimentario = json.dumps(pauta)
            db.session.commit()
            log_debug(f"[GUARDAR-PAUTA] OK - pauta saved for '{patient.nombre}' (ID: {patient.id})")
            return jsonify({'success': True})
        log_debug(f"[GUARDAR-PAUTA] ERROR - no pauta in request body")
        return jsonify({'success': False, 'error': 'No pauta provided'}), 400
    except Exception as e:
        log_debug(f"[GUARDAR-PAUTA] ERROR - {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/pauta/modificar-ia', methods=['POST'])
@login_required
def modificar_pauta_ia_endpoint():
    """Modify or generate a pauta using AI natural language instructions."""
    log_debug(f"[PAUTA-IA] START - user_id={current_user.id}")
    try:
        data = request.json
        instruccion = data.get('instruccion', '').strip()
        patient_id = data.get('patient_id')
        pauta_actual = data.get('pauta_actual')  # None = generate from scratch

        if not instruccion:
            return jsonify({'success': False, 'error': 'Instruccion requerida'}), 400
        if not patient_id:
            return jsonify({'success': False, 'error': 'patient_id requerido'}), 400

        patient = PatientFile.query.get_or_404(patient_id)

        # Build patient_data context for AI
        patient_data = {
            'nombre': patient.nombre,
            'sexo': patient.sexo,
            'edad': patient.edad,
            'peso_kg': patient.peso,
            'talla_m': patient.talla,
            'get_kcal': patient.get_kcal,
            'proteinas_g': patient.proteinas_g,
            'carbohidratos_g': patient.carbohidratos_g,
            'grasas_g': patient.grasas_g,
            'restricciones_alimentarias': patient.restricciones_alimentarias,
            'alergias': patient.alergias,
            'intolerancias': patient.intolerancias,
            'objetivos': patient.objetivos,
            'diagnosticos': patient.diagnosticos,
        }

        log_debug(f"[PAUTA-IA] Calling AI - mode={'modify' if pauta_actual else 'generate'}, patient='{patient.nombre}'")
        result = modificar_pauta_ia(pauta_actual, instruccion, patient_data)

        log_debug(f"[PAUTA-IA] OK - AI returned pauta with {len(result.get('dias', {}))} dias")
        return jsonify({'success': True, 'pauta': result})

    except Exception as e:
        log_debug(f"[PAUTA-IA] ERROR - {str(e)}")
        import traceback
        log_debug(f"[PAUTA-IA] TRACEBACK: {traceback.format_exc()}")
        return jsonify({'success': False, 'error': str(e)}), 500


# ============================================
# GROQ AI - Alertas y Chatbot
# ============================================

# Intentar usar Gemini, si no está disponible usar Groq como fallback
try:
    from gemini_service import generar_alertas_paciente, chat_con_asistente, obtener_sugerencias_chat, ia_disponible, modificar_pauta_ia
    print("[OK] Usando Gemini AI Service")
except ImportError:
    try:
        from groq_service import generar_alertas_paciente, chat_con_asistente, obtener_sugerencias_chat, ia_disponible, modificar_pauta_ia
        print("[OK] Usando Groq AI Service")
    except ImportError:
        # Fallback sin IA
        def generar_alertas_paciente(data): return []
        def chat_con_asistente(msg, ctx=None, hist=None): return "IA no disponible"
        def obtener_sugerencias_chat(ctx=None): return []
        def modificar_pauta_ia(pauta, instr, data=None): raise RuntimeError("IA no disponible")
        def ia_disponible(): return False
        print("[WARNING] Ningun servicio de IA disponible")

def generar_alertas_reglas(patient):
    """Rule-based nutrition alerts from R24H, frecuencia consumo, and habits data"""
    alertas = []

    # --- Frecuencia de consumo alerts ---
    freq = patient.frecuencia_consumo or {}

    # Map frequency values (0-7 scale where 7=diario)
    def freq_val(key):
        v = freq.get(key)
        if isinstance(v, (int, float)):
            return v
        freq_map = {'nunca': 0, '1-3_mes': 1, '1_sem': 1, '2-4_sem': 3, '5-6_sem': 5, 'diario': 7, '2_dia': 7}
        return freq_map.get(str(v), 0) if v else 0

    frutas = freq_val('frutas')
    verduras = freq_val('verduras')
    legumbres = freq_val('legumbres')
    pescado = freq_val('pescados') or freq_val('pescado')
    frituras = freq_val('frituras')
    azucares = freq_val('azucares')
    lacteos = freq_val('lacteos')

    if verduras < 3:
        alertas.append({
            'tipo': 'warning',
            'icono': 'leaf',
            'titulo': 'Bajo consumo de verduras',
            'mensaje': f'Consume verduras solo {verduras}x/semana. Recomendado: diario. Considerar incluir al menos 1 porcion de verdura en almuerzo y cena.'
        })

    if frutas < 3:
        alertas.append({
            'tipo': 'warning',
            'icono': 'apple-alt',
            'titulo': 'Bajo consumo de frutas',
            'mensaje': f'Consume frutas solo {frutas}x/semana. Incluir 2-3 porciones diarias de fruta como colaciones.'
        })

    if frituras >= 4:
        alertas.append({
            'tipo': 'danger',
            'icono': 'fire',
            'titulo': 'Alto consumo de frituras',
            'mensaje': f'Reporta frituras {frituras}x/semana. Sugerir alternativas al horno, plancha o vapor.'
        })

    if azucares >= 4:
        alertas.append({
            'tipo': 'danger',
            'icono': 'candy-cane',
            'titulo': 'Alto consumo de azucares',
            'mensaje': f'Azucares/golosinas {azucares}x/semana. Reemplazar con frutas, frutos secos o yogurt natural.'
        })

    if pescado < 1:
        alertas.append({
            'tipo': 'info',
            'icono': 'fish',
            'titulo': 'Sin consumo de pescado',
            'mensaje': 'No consume pescado regularmente. Considerar 2 porciones semanales para omega-3.'
        })

    if legumbres < 2:
        alertas.append({
            'tipo': 'info',
            'icono': 'seedling',
            'titulo': 'Bajo consumo de legumbres',
            'mensaje': f'Legumbres solo {legumbres}x/semana. Recomendar 2-3 veces por semana como fuente de fibra y proteina vegetal.'
        })

    # --- Hydration ---
    agua = 0
    if hasattr(patient, 'consumo_agua_litros') and patient.consumo_agua_litros:
        agua = float(patient.consumo_agua_litros) if patient.consumo_agua_litros else 0
    elif isinstance(freq, dict):
        agua = float(freq.get('agua_litros', 0) or 0)

    if agua < 1.5:
        alertas.append({
            'tipo': 'warning',
            'icono': 'tint',
            'titulo': 'Hidratacion insuficiente',
            'mensaje': f'Reporta {agua}L de agua/dia. Recomendado: minimo 1.5-2L diarios. Sugerir llevar botella y establecer recordatorios.'
        })

    # --- Sleep ---
    sueno = None
    if hasattr(patient, 'calidad_sueno') and patient.calidad_sueno:
        try:
            sueno = int(patient.calidad_sueno)
        except (TypeError, ValueError):
            pass
    if sueno is not None and sueno <= 4:
        alertas.append({
            'tipo': 'warning',
            'icono': 'bed',
            'titulo': 'Mala calidad de sueno',
            'mensaje': f'Calidad de sueno {sueno}/10. Afecta regulacion del apetito y metabolismo. Revisar higiene del sueno.'
        })

    # --- Stress ---
    estres = None
    if hasattr(patient, 'nivel_estres') and patient.nivel_estres:
        try:
            estres = int(patient.nivel_estres)
        except (TypeError, ValueError):
            pass
    if estres is not None and estres >= 7:
        alertas.append({
            'tipo': 'warning',
            'icono': 'brain',
            'titulo': 'Estres elevado',
            'mensaje': f'Nivel de estres {estres}/10. El estres cronico puede promover alimentacion emocional y acumulacion de grasa visceral.'
        })

    # --- GI symptoms ---
    if patient.reflujo:
        alertas.append({
            'tipo': 'info',
            'icono': 'heartbeat',
            'titulo': 'Reflujo gastroesofagico',
            'mensaje': 'Presenta reflujo. Evitar comidas abundantes, grasas y acostarse despues de comer. Considerar fraccionamiento.'
        })

    if patient.hinchazon:
        alertas.append({
            'tipo': 'info',
            'icono': 'stomach',
            'titulo': 'Hinchazon abdominal',
            'mensaje': 'Reporta hinchazon. Evaluar tolerancia a lacteos, legumbres y FODMAPs. Considerar diario de sintomas.'
        })

    # --- R24H analysis ---
    r24h = patient.registro_24h
    if r24h and isinstance(r24h, dict):
        all_foods = []
        for meal, items in r24h.items():
            if isinstance(items, list):
                for item in items:
                    if isinstance(item, dict):
                        all_foods.append(item)

        # Check if any vegetables in R24H
        has_verdura = any('verdura' in str(f.get('grupo', '')).lower() or
                         'ensalada' in str(f.get('alimento', '') + f.get('alimento_nombre', '')).lower() or
                         'verdura' in str(f.get('grupo', '')).lower()
                         for f in all_foods)
        if all_foods and not has_verdura:
            alertas.append({
                'tipo': 'danger',
                'icono': 'exclamation-triangle',
                'titulo': 'Sin verduras en R24H',
                'mensaje': 'El registro 24 horas no incluye verduras. Priorizar agregar vegetales en almuerzo y cena.'
            })

        # Total kcal from R24H
        total_kcal = sum(float(f.get('kcal', 0)) for f in all_foods)
        if total_kcal > 0 and total_kcal < 1200:
            alertas.append({
                'tipo': 'warning',
                'icono': 'fire',
                'titulo': 'Ingesta calorica baja en R24H',
                'mensaje': f'Solo {int(total_kcal)} kcal registradas. Verificar si es habitual o sub-reporte.'
            })

    # --- Bebidas azucaradas ---
    bebidas = getattr(patient, 'consumo_bebidas_azucaradas', None) or ''
    if bebidas and bebidas.lower() not in ('nunca', 'no', ''):
        if bebidas.lower() in ('diario', 'frecuente', '3_o_mas'):
            alertas.append({
                'tipo': 'danger',
                'icono': 'glass-whiskey',
                'titulo': 'Alto consumo de bebidas azucaradas',
                'mensaje': 'Consume bebidas azucaradas frecuentemente. Reemplazar por agua, infusiones o agua saborizada natural.'
            })

    return alertas


@app.route('/api/patient/<int:patient_id>/alertas', methods=['GET'])
@login_required
def get_patient_alertas(patient_id):
    """Genera alertas IA para un paciente"""
    log_debug(f"[ALERTAS-IA] START - patient_id={patient_id}, user_id={current_user.id}, ia_disponible={ia_disponible()}")
    try:
        patient = PatientFile.query.get_or_404(patient_id)

        # Convertir paciente a diccionario
        patient_data = patient.to_dict() if hasattr(patient, 'to_dict') else {
            'nombre': patient.nombre,
            'edad': patient.edad,
            'sexo': patient.sexo,
            'imc': patient.imc,
            'peso': patient.peso,
            'talla': patient.talla,
            'porcentaje_grasa': patient.porcentaje_grasa,
            'perimetro_cintura': patient.perimetro_cintura,
            'actividad_fisica': patient.actividad_fisica,
            'consumo_agua_litros': patient.consumo_agua_litros,
            'calidad_sueno': patient.calidad_sueno,
            'nivel_estres': patient.nivel_estres,
            'horas_sueno': patient.horas_sueno,
            'diagnosticos': patient.diagnosticos,
            'alergias': patient.alergias,
            'intolerancias': patient.intolerancias,
            'restricciones_alimentarias': patient.restricciones_alimentarias,
            'objetivos': patient.objetivos,
            'motivo_consulta': patient.motivo_consulta,
            'reflujo': patient.reflujo,
            'hinchazon': patient.hinchazon,
            'consistencia_heces': patient.consistencia_heces,
            'fuma': patient.fuma,
        }

        # Try AI-powered alerts first
        alertas = generar_alertas_paciente(patient_data)

        # Add rule-based nutrition insights from R24H + frecuencia consumo + habits
        alertas_reglas = generar_alertas_reglas(patient)
        alertas = alertas + alertas_reglas

        log_debug(f"[ALERTAS-IA] OK - {len(alertas)} alertas generated for patient_id={patient_id}")
        return jsonify({
            'success': True,
            'alertas': alertas,
            'ia_disponible': ia_disponible()
        })
    except Exception as e:
        log_debug(f"[ALERTAS-IA] ERROR - patient_id={patient_id}: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/chat', methods=['POST'])
@login_required
def chat_endpoint():
    """Endpoint del chatbot asistente"""
    log_debug(f"[CHAT] START - user_id={current_user.id}")
    try:
        data = request.json
        mensaje = data.get('mensaje', '')
        patient_id = data.get('patient_id')
        historial = data.get('historial', [])
        log_debug(f"[CHAT] mensaje='{mensaje[:50]}...', patient_id={patient_id}, historial_len={len(historial)}")

        if not mensaje:
            return jsonify({'success': False, 'error': 'Mensaje vacio'}), 400

        # Obtener contexto del paciente si se proporciona
        contexto_paciente = None
        if patient_id:
            patient = PatientFile.query.get(patient_id)
            if patient:
                contexto_paciente = patient.to_dict() if hasattr(patient, 'to_dict') else {
                    'nombre': patient.nombre,
                    'edad': patient.edad,
                    'sexo': patient.sexo,
                    'imc': patient.imc,
                    'peso': patient.peso,
                    'diagnosticos': patient.diagnosticos,
                    'objetivos': patient.objetivos,
                    'motivo_consulta': patient.motivo_consulta,
                }

        respuesta = chat_con_asistente(mensaje, contexto_paciente, historial)
        sugerencias = obtener_sugerencias_chat(contexto_paciente)

        log_debug(f"[CHAT] OK - respuesta_len={len(respuesta)}, sugerencias={len(sugerencias)}")
        return jsonify({
            'success': True,
            'respuesta': respuesta,
            'sugerencias': sugerencias
        })
    except Exception as e:
        log_debug(f"[CHAT] ERROR - {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/ia/status', methods=['GET'])
@login_required
def ia_status():
    """Verifica el estado del servicio de IA"""
    log_debug(f"[IA-STATUS] disponible={ia_disponible()}")
    return jsonify({
        'disponible': ia_disponible(),
        'mensaje': 'Gemini AI activo' if ia_disponible() else 'Configure GEMINI_API_KEY para habilitar IA'
    })


# ============================================
# BOOKING SYSTEM - Page Routes
# ============================================

@app.route('/booking')
def booking_page():
    """Public booking wizard page"""
    log_debug(f"[BOOKING-PAGE] GET /booking")
    return render_template('booking.html')

@app.route('/booking/reschedule/<token>')
def reschedule_page(token):
    """Public reschedule page - accessed via email link"""
    booking = Booking.query.filter_by(reschedule_token=token).first()
    if not booking:
        return render_template('reschedule.html', error='Enlace de reagendamiento no válido o expirado.'), 404
    if booking.status not in [BookingStatus.PENDING, BookingStatus.CONFIRMED]:
        return render_template('reschedule.html', error='Esta cita ya fue cancelada o completada.')
    nutri = User.query.get(booking.nutritionist_id)
    return render_template('reschedule.html',
        booking=booking,
        nutritionist=nutri,
        token=token
    )

@app.route('/api/public/reschedule', methods=['POST'])
def api_reschedule_booking():
    """API: reschedule a booking via token"""
    from datetime import datetime as dt
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'JSON requerido'}), 400

    token = data.get('token', '')
    new_date_str = data.get('new_date', '')
    new_time = data.get('new_time', '')

    if not all([token, new_date_str, new_time]):
        return jsonify({'success': False, 'error': 'Faltan campos requeridos'}), 400

    booking = Booking.query.filter_by(reschedule_token=token).first()
    if not booking:
        return jsonify({'success': False, 'error': 'Token inválido'}), 404

    if booking.status not in [BookingStatus.PENDING, BookingStatus.CONFIRMED]:
        return jsonify({'success': False, 'error': 'Esta cita no se puede reagendar'}), 400

    try:
        new_date = dt.strptime(new_date_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'success': False, 'error': 'Formato de fecha inválido'}), 400

    # Check new slot is available
    existing = Booking.query.filter_by(
        nutritionist_id=booking.nutritionist_id,
        booking_date=new_date,
        booking_time=new_time
    ).filter(
        Booking.status.in_([BookingStatus.PENDING, BookingStatus.CONFIRMED]),
        Booking.id != booking.id
    ).first()

    if existing:
        return jsonify({'success': False, 'error': 'Este horario ya no está disponible'}), 409

    old_date = booking.booking_date.strftime('%d/%m/%Y')
    old_time = booking.booking_time

    # Update booking
    booking.booking_date = new_date
    booking.booking_time = new_time
    # Reset reminders so they fire again for the new date
    booking.reminder_24h_sent = False
    booking.reminder_1h_sent = False
    booking.reminder_nutri_24h_sent = False
    # Generate new reschedule token (one-time use)
    booking.generate_reschedule_token()

    db.session.commit()

    # Notify nutritionist about reschedule
    nutri = User.query.get(booking.nutritionist_id)
    if nutri and is_mail_configured():
        try:
            subject = f'Cita reagendada - {booking.client_name}'
            html = f'''
            <div style="font-family:Arial;padding:20px;background:#0f1923;color:#e2e8f0;">
                <h2 style="color:#10b981;">Cita Reagendada</h2>
                <p>El paciente <strong>{booking.client_name}</strong> ha reagendado su cita.</p>
                <p><strong>Antes:</strong> {old_date} a las {old_time}</p>
                <p><strong>Ahora:</strong> {new_date.strftime("%d/%m/%Y")} a las {new_time}</p>
            </div>
            '''
            text = f'Cita reagendada: {booking.client_name} - {old_date} {old_time} → {new_date.strftime("%d/%m/%Y")} {new_time}'
            from email_service import _send_email
            _send_email(nutri.email, subject, html, text)
        except Exception:
            pass  # Non-critical

    return jsonify({
        'success': True,
        'message': f'Cita reagendada para el {new_date.strftime("%d/%m/%Y")} a las {new_time}',
        'new_date': new_date_str,
        'new_time': new_time
    })

@app.route('/dashboard/nutritionist/schedule')
@login_required
def nutritionist_schedule_page():
    """Schedule management page for nutritionists"""
    log_debug(f"[SCHEDULE-PAGE] user_id={current_user.id}")
    if current_user.user_type != 'nutricionista':
        return redirect('/dashboard')
    return render_template('nutritionist_schedule.html')

@app.route('/dashboard/nutritionist/bookings')
@login_required
def nutritionist_bookings_page():
    """Bookings list page for nutritionists"""
    log_debug(f"[BOOKINGS-PAGE] user_id={current_user.id}")
    if current_user.user_type != 'nutricionista':
        return redirect('/dashboard')
    return render_template('nutritionist_bookings.html')

@app.route('/dashboard/nutritionist/profile')
@login_required
def nutritionist_profile_page():
    """Public profile editor for nutritionists"""
    log_debug(f"[NUTRI-PROFILE-PAGE] user_id={current_user.id}")
    if current_user.user_type != 'nutricionista':
        return redirect('/dashboard')
    return render_template('nutritionist_profile.html', specialties=NUTRITIONIST_SPECIALTIES)

# ============================================
# BOOKING SYSTEM - Public API
# ============================================

@app.route('/api/public/specialties')
def api_public_specialties():
    """Return the list of nutritionist specialties with 'Ver todos' option first"""
    log_debug(f"[PUBLIC-SPECIALTIES] GET /api/public/specialties")
    specialties_list = [{'key': 'todos', 'label': 'Ver todos los nutricionistas'}]
    specialties_list.extend([{'key': k, 'label': l} for k, l in NUTRITIONIST_SPECIALTIES])
    return jsonify({'success': True, 'specialties': specialties_list})

@app.route('/api/public/nutritionists')
def api_public_nutritionists():
    """List nutritionists, optionally filtered by specialty. Shows all by default."""
    specialty_param = request.args.get('specialty', '')
    log_debug(f"[PUBLIC-NUTRITIONISTS] specialty='{specialty_param}'")
    query = User.query.filter_by(user_type='nutricionista', is_active=True)

    # Support comma-separated specialties
    filter_specs = [s.strip() for s in specialty_param.split(',') if s.strip()] if specialty_param else []

    nutritionists = query.all()
    results = []
    for n in nutritionists:
        specs = n.get_specialties_list()

        # Si hay filtro de especialidad (y no es 'todos'), filtrar
        if filter_specs and 'todos' not in filter_specs:
            if not any(fs in specs for fs in filter_specs):
                continue

        results.append({
            'id': n.id,
            'name': n.get_full_name(),
            'bio': n.bio or '',
            'specialties': [{'key': s, 'label': SPECIALTIES_DICT.get(s, s)} for s in specs] if specs else [],
            'avg_rating': n.get_average_nutri_rating(),
            'review_count': n.get_nutri_review_count(),
            'consulta_precio': n.consulta_precio,
            'consulta_duracion': n.consulta_duracion or 60,
            'city': n.city or '',
            'country': n.country or '',
        })

    results.sort(key=lambda x: x['avg_rating'], reverse=True)
    log_debug(f"[PUBLIC-NUTRITIONISTS] OK - {len(results)} nutritionists returned")
    return jsonify({'success': True, 'nutritionists': results})

@app.route('/api/public/nutritionist/<int:nutri_id>/slots')
def api_public_slots(nutri_id):
    """Get available time slots for a nutritionist on a given date"""
    from datetime import datetime as dt
    date_str = request.args.get('date', '')
    log_debug(f"[PUBLIC-SLOTS] nutri_id={nutri_id}, date='{date_str}'")
    if not date_str:
        return jsonify({'success': False, 'error': 'Parametro date requerido'}), 400

    try:
        booking_date = dt.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'success': False, 'error': 'Formato de fecha invalido (YYYY-MM-DD)'}), 400

    try:
        day_of_week = booking_date.weekday()  # 0=Monday

        schedule = NutritionistSchedule.query.filter_by(
            nutritionist_id=nutri_id, day_of_week=day_of_week, is_active=True
        ).first()

        if not schedule:
            return jsonify({'success': True, 'slots': [], 'message': 'Sin horario para este dia'})

        all_slots = schedule.get_time_slots()

        # Remove already booked slots
        existing = Booking.query.filter_by(
            nutritionist_id=nutri_id, booking_date=booking_date
        ).filter(Booking.status.in_([BookingStatus.PENDING, BookingStatus.CONFIRMED])).all()

        # Get set of booked times
        booked_times = set()
        for booking in existing:
            if booking.booking_time:
                booked_times.add(booking.booking_time)

        # Filter out booked slots
        available = [s for s in all_slots if s not in booked_times]

        log_debug(f"[PUBLIC-SLOTS] OK - {len(available)} available slots (total={len(all_slots)}, booked={len(existing)})")
        return jsonify({'success': True, 'slots': available, 'date': date_str})

    except Exception as e:
        log_error(f"[PUBLIC-SLOTS] Error: {e}")
        return jsonify({'success': False, 'error': 'Error al obtener horarios disponibles', 'details': str(e)}), 500

@app.route('/api/public/book', methods=['POST'])
def api_public_book():
    """Create a new booking (public, no auth required)"""
    from datetime import datetime as dt
    data = request.get_json()
    log_debug(f"[PUBLIC-BOOK] START - data keys: {list(data.keys()) if data else 'None'}")
    if not data:
        return jsonify({'success': False, 'error': 'JSON requerido'}), 400

    required = ['nutritionist_id', 'client_name', 'client_email', 'booking_date', 'booking_time']
    for field in required:
        if not data.get(field):
            return jsonify({'success': False, 'error': f'Campo {field} requerido'}), 400

    try:
        log_debug(f"[PUBLIC-BOOK] client='{data.get('client_name')}', email='{data.get('client_email')}', nutri_id={data.get('nutritionist_id')}, date={data.get('booking_date')}, time={data.get('booking_time')}")
        nutri = User.query.get(data['nutritionist_id'])
        if not nutri or nutri.user_type != 'nutricionista':
            log_debug(f"[PUBLIC-BOOK] NUTRI NOT FOUND - id={data['nutritionist_id']}")
            return jsonify({'success': False, 'error': 'Nutricionista no encontrado'}), 404

        booking_date = dt.strptime(data['booking_date'], '%Y-%m-%d').date()

        # Check slot is still available
        existing = Booking.query.filter_by(
            nutritionist_id=nutri.id,
            booking_date=booking_date,
            booking_time=data['booking_time']
        ).filter(Booking.status.in_([BookingStatus.PENDING, BookingStatus.CONFIRMED])).first()

        if existing:
            log_debug(f"[PUBLIC-BOOK] SLOT TAKEN - date={data['booking_date']}, time={data['booking_time']}")
            return jsonify({'success': False, 'error': 'Este horario ya no esta disponible'}), 409

        # Create PatientFile for this client
        ficha_count = PatientFile.query.filter_by(nutricionista_id=nutri.id).count()
        patient = PatientFile(
            nutricionista_id=nutri.id,
            ficha_numero=ficha_count + 1,
            nombre=data['client_name'],
            email=data['client_email'],
            telefono=data.get('client_phone', ''),
            motivo_consulta=data.get('notes', '')
        )
        patient.generate_intake_token()
        db.session.add(patient)
        db.session.flush()

        # Create booking
        booking = Booking(
            nutritionist_id=nutri.id,
            patient_file_id=patient.id,
            client_name=data['client_name'],
            client_email=data['client_email'],
            client_phone=data.get('client_phone', ''),
            specialty=data.get('specialty', ''),
            booking_date=booking_date,
            booking_time=data['booking_time'],
            notes=data.get('notes', '')
        )
        booking.generate_reschedule_token()
        db.session.add(booking)
        db.session.commit()

        # Send confirmation email
        intake_url = patient.get_intake_url(request.host_url.rstrip('/'))
        email_sent = False
        if is_mail_configured():
            result = send_booking_confirmation(booking, nutri, intake_url)
            if result.get('success'):
                patient.mark_url_sent()
                db.session.commit()
                email_sent = True

        log_debug(f"[PUBLIC-BOOK] OK - booking_id={booking.id}, patient_id={patient.id}, email_sent={email_sent}")
        return jsonify({
            'success': True,
            'booking_id': booking.id,
            'intake_url': intake_url,
            'email_sent': email_sent,
            'message': 'Reserva creada exitosamente'
        })

    except Exception as e:
        db.session.rollback()
        log_debug(f"[PUBLIC-BOOK] ERROR - {str(e)}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

# ============================================
# BOOKING SYSTEM - Nutritionist API
# ============================================

@app.route('/api/nutritionist/schedule', methods=['GET'])
@login_required
def api_nutri_schedule_get():
    """Get current nutritionist's weekly schedule"""
    log_debug(f"[SCHEDULE-GET] user_id={current_user.id}")
    if current_user.user_type != 'nutricionista':
        log_debug(f"[SCHEDULE-GET] DENIED")
        return jsonify({'success': False, 'error': 'No autorizado'}), 403

    schedules = NutritionistSchedule.query.filter_by(
        nutritionist_id=current_user.id
    ).order_by(NutritionistSchedule.day_of_week).all()

    log_debug(f"[SCHEDULE-GET] OK - {len(schedules)} schedule entries")
    return jsonify({'success': True, 'schedule': [{
        'id': s.id,
        'day_of_week': s.day_of_week,
        'start_time': s.start_time,
        'end_time': s.end_time,
        'slot_duration': s.slot_duration,
        'is_active': s.is_active,
    } for s in schedules]})

@app.route('/api/nutritionist/schedule', methods=['POST'])
@login_required
def api_nutri_schedule_save():
    """Save weekly schedule (replaces all days)"""
    log_debug(f"[SCHEDULE-SAVE] START - user_id={current_user.id}")
    if current_user.user_type != 'nutricionista':
        log_debug(f"[SCHEDULE-SAVE] DENIED")
        return jsonify({'success': False, 'error': 'No autorizado'}), 403

    data = request.get_json()
    log_debug(f"[SCHEDULE-SAVE] days count: {len(data.get('days', [])) if data else 0}")
    if not data or 'days' not in data:
        return jsonify({'success': False, 'error': 'JSON con campo days requerido'}), 400

    try:
        # Delete existing schedule
        NutritionistSchedule.query.filter_by(nutritionist_id=current_user.id).delete()

        for day in data['days']:
            if day.get('is_active'):
                sched = NutritionistSchedule(
                    nutritionist_id=current_user.id,
                    day_of_week=day['day_of_week'],
                    start_time=day.get('start_time', '09:00'),
                    end_time=day.get('end_time', '17:00'),
                    slot_duration=day.get('slot_duration', 60),
                    is_active=True
                )
                db.session.add(sched)

        db.session.commit()
        log_debug(f"[SCHEDULE-SAVE] OK - schedule saved")
        return jsonify({'success': True, 'message': 'Horario guardado'})
    except Exception as e:
        db.session.rollback()
        log_debug(f"[SCHEDULE-SAVE] ERROR - {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/nutritionist/bookings')
@login_required
def api_nutri_bookings():
    """List bookings for current nutritionist"""
    log_debug(f"[NUTRI-BOOKINGS] user_id={current_user.id}")
    if current_user.user_type != 'nutricionista':
        log_debug(f"[NUTRI-BOOKINGS] DENIED")
        return jsonify({'success': False, 'error': 'No autorizado'}), 403

    bookings = Booking.query.filter_by(nutritionist_id=current_user.id)\
        .order_by(Booking.booking_date.desc(), Booking.booking_time.desc()).all()

    log_debug(f"[NUTRI-BOOKINGS] OK - {len(bookings)} bookings")
    return jsonify({'success': True, 'bookings': [{
        'id': b.id,
        'client_name': b.client_name,
        'client_email': b.client_email,
        'client_phone': b.client_phone or '',
        'specialty': b.specialty,
        'specialty_label': b.get_specialty_label(),
        'booking_date': b.booking_date.strftime('%Y-%m-%d'),
        'booking_time': b.booking_time,
        'status': b.status,
        'notes': b.notes or '',
        'patient_file_id': b.patient_file_id,
        'created_at': b.created_at.strftime('%Y-%m-%d %H:%M') if b.created_at else None,
    } for b in bookings]})

@app.route('/api/nutritionist/bookings/<int:booking_id>/status', methods=['PATCH'])
@login_required
def api_nutri_booking_status(booking_id):
    """Update booking status"""
    log_debug(f"[BOOKING-STATUS] START - booking_id={booking_id}, user_id={current_user.id}")
    if current_user.user_type != 'nutricionista':
        log_debug(f"[BOOKING-STATUS] DENIED")
        return jsonify({'success': False, 'error': 'No autorizado'}), 403

    booking = Booking.query.get_or_404(booking_id)
    if booking.nutritionist_id != current_user.id:
        log_debug(f"[BOOKING-STATUS] DENIED - booking belongs to nutri_id={booking.nutritionist_id}")
        return jsonify({'success': False, 'error': 'No autorizado'}), 403

    data = request.get_json()
    new_status = data.get('status')
    valid = [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.CANCELLED, BookingStatus.COMPLETED]
    if new_status not in valid:
        return jsonify({'success': False, 'error': 'Estado invalido'}), 400

    booking.status = new_status
    db.session.commit()
    log_debug(f"[BOOKING-STATUS] OK - booking_id={booking_id} -> {new_status}")
    return jsonify({'success': True, 'status': booking.status})

@app.route('/api/nutritionist/profile', methods=['GET'])
@login_required
def api_nutri_profile_get():
    """Get nutritionist public profile data"""
    log_debug(f"[NUTRI-PROFILE-GET] user_id={current_user.id}")
    if current_user.user_type != 'nutricionista':
        log_debug(f"[NUTRI-PROFILE-GET] DENIED")
        return jsonify({'success': False, 'error': 'No autorizado'}), 403

    banco = {}
    if current_user.banco_info:
        try:
            banco = json.loads(current_user.banco_info)
        except (json.JSONDecodeError, TypeError):
            banco = {}

    return jsonify({'success': True, 'profile': {
        'bio': current_user.bio or '',
        'specialization': current_user.get_specialties_list(),
        'consulta_precio': current_user.consulta_precio,
        'consulta_duracion': current_user.consulta_duracion or 60,
        'banco_info': banco,
    }})

@app.route('/api/nutritionist/profile', methods=['POST'])
@login_required
def api_nutri_profile_save():
    """Update nutritionist public profile"""
    log_debug(f"[NUTRI-PROFILE-SAVE] START - user_id={current_user.id}")
    if current_user.user_type != 'nutricionista':
        log_debug(f"[NUTRI-PROFILE-SAVE] DENIED")
        return jsonify({'success': False, 'error': 'No autorizado'}), 403

    data = request.get_json()
    log_debug(f"[NUTRI-PROFILE-SAVE] Data keys: {list(data.keys()) if data else 'None'}")
    if not data:
        return jsonify({'success': False, 'error': 'JSON requerido'}), 400

    try:
        if 'bio' in data:
            current_user.bio = data['bio']
        if 'specialization' in data:
            current_user.specialization = ','.join(data['specialization']) if isinstance(data['specialization'], list) else data['specialization']
        if 'consulta_precio' in data:
            current_user.consulta_precio = data['consulta_precio']
        if 'consulta_duracion' in data:
            current_user.consulta_duracion = data['consulta_duracion']
        if 'banco_info' in data:
            current_user.banco_info = json.dumps(data['banco_info'])

        db.session.commit()
        log_debug(f"[NUTRI-PROFILE-SAVE] OK - profile updated")
        return jsonify({'success': True, 'message': 'Perfil actualizado'})
    except Exception as e:
        db.session.rollback()
        log_debug(f"[NUTRI-PROFILE-SAVE] ERROR - {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

# ============================================
# INICIALIZACIÓN
# ============================================

if AUTH_ENABLED:
    with app.app_context():
        try:
            from sqlalchemy import text, inspect
            db.create_all()
            print("Tablas de base de datos creadas/verificadas")

            # Auto-migrar columnas nuevas
            inspector = inspect(db.engine)

            new_columns = {
                'patient_files': [
                    # PUBLIC INTAKE SYSTEM
                    ('intake_token', 'VARCHAR(64)'),
                    ('intake_completed', 'BOOLEAN DEFAULT FALSE'),
                    ('intake_completed_at', 'TIMESTAMP'),
                    ('intake_url_sent', 'BOOLEAN DEFAULT FALSE'),
                    ('intake_url_sent_at', 'TIMESTAMP'),
                    # ANTECEDENTES GENERALES
                    ('nombre', 'VARCHAR(100)'),
                    ('fecha_nacimiento', 'VARCHAR(20)'),
                    ('sexo', 'VARCHAR(20)'),
                    ('email', 'VARCHAR(120)'),
                    ('telefono', 'VARCHAR(20)'),
                    ('rut', 'VARCHAR(20)'),
                    ('direccion', 'VARCHAR(200)'),
                    ('ocupacion', 'VARCHAR(100)'),
                    ('motivo_consulta', 'TEXT'),
                    ('objetivos', 'TEXT'),
                    ('diagnosticos', 'TEXT'),
                    ('medicamentos', 'TEXT'),
                    ('suplementos', 'TEXT'),
                    ('alergias', 'TEXT'),
                    ('intolerancias', 'TEXT'),
                    ('alimentos_no_consume', 'TEXT'),
                    ('cirugias', 'TEXT'),
                    ('antecedentes_familiares', 'TEXT'),
                    ('otros_diagnosticos', 'TEXT'),
                    ('comidas_al_dia', 'VARCHAR(20)'),
                    ('profesion', 'VARCHAR(100)'),
                    ('teletrabajo', 'VARCHAR(20)'),
                    ('quien_cocina', 'TEXT'),
                    ('con_quien_vive', 'TEXT'),
                    ('donde_come', 'TEXT'),
                    ('observaciones_sueno', 'TEXT'),
                    ('gatillantes_estres', 'TEXT'),
                    ('manejo_estres', 'TEXT'),
                    ('consumo_alcohol', 'VARCHAR(50)'),
                    ('tipo_alcohol', 'TEXT'),
                    ('tabaco', 'VARCHAR(10)'),
                    ('drogas', 'VARCHAR(10)'),
                    # SÍNTOMAS GASTROINTESTINALES
                    ('frecuencia_evacuacion', 'VARCHAR(50)'),
                    ('gatillantes_gi', 'TEXT'),
                    ('reflujo', 'VARCHAR(10)'),
                    ('reflujo_alimento', 'TEXT'),
                    ('hinchazon', 'VARCHAR(10)'),
                    ('hinchazon_alimento', 'TEXT'),
                    ('tiene_alergias', 'VARCHAR(10)'),
                    ('alergias_alimento', 'TEXT'),
                    ('registro_24h', 'TEXT'),
                    ('frecuencia_consumo', 'TEXT'),
                    # ANTROPOMETRÍA
                    ('talla_m', 'FLOAT'),
                    ('peso_kg', 'FLOAT'),
                    ('peso_ideal', 'FLOAT'),
                    ('pliegue_bicipital', 'FLOAT'),
                    ('pliegue_tricipital', 'FLOAT'),
                    ('pliegue_subescapular', 'FLOAT'),
                    ('pliegue_supracrestideo', 'FLOAT'),
                    ('pliegue_abdominal', 'FLOAT'),
                    ('pliegue_muslo', 'FLOAT'),
                    ('pliegue_pantorrilla', 'FLOAT'),
                    ('perimetro_brazo', 'FLOAT'),
                    ('perimetro_brazo_contraido', 'FLOAT'),
                    ('perimetro_cintura', 'FLOAT'),
                    ('perimetro_cadera', 'FLOAT'),
                    ('perimetro_muslo', 'FLOAT'),
                    ('perimetro_pantorrilla', 'FLOAT'),
                    ('perimetro_muneca', 'FLOAT'),
                    ('diametro_humero', 'FLOAT'),
                    ('diametro_femur', 'FLOAT'),
                    ('diametro_muneca', 'FLOAT'),
                    ('imc', 'FLOAT'),
                    ('imc_categoria', 'VARCHAR(50)'),
                    ('porcentaje_grasa', 'FLOAT'),
                    ('masa_grasa_kg', 'FLOAT'),
                    ('masa_libre_grasa_kg', 'FLOAT'),
                    ('densidad_corporal', 'FLOAT'),
                    ('indice_cintura_cadera', 'FLOAT'),
                    ('riesgo_cardiovascular', 'VARCHAR(50)'),
                    ('masa_muscular_kg', 'FLOAT'),
                    ('grasa_visceral', 'FLOAT'),
                    ('metodo_composicion', 'VARCHAR(50)'),
                    # EVALUACIÓN BIOQUÍMICA
                    ('glucosa_ayunas', 'FLOAT'),
                    ('hemoglobina_glicada', 'FLOAT'),
                    ('colesterol_total', 'FLOAT'),
                    ('colesterol_hdl', 'FLOAT'),
                    ('colesterol_ldl', 'FLOAT'),
                    ('trigliceridos', 'FLOAT'),
                    ('hemoglobina', 'FLOAT'),
                    ('hematocrito', 'FLOAT'),
                    ('ferritina', 'FLOAT'),
                    ('vitamina_d', 'FLOAT'),
                    ('vitamina_b12', 'FLOAT'),
                    ('acido_urico', 'FLOAT'),
                    ('creatinina', 'FLOAT'),
                    ('albumina', 'FLOAT'),
                    ('tsh', 'FLOAT'),
                    ('fecha_examenes', 'VARCHAR(20)'),
                    # EVALUACIÓN CLÍNICA
                    ('presion_sistolica', 'INTEGER'),
                    ('presion_diastolica', 'INTEGER'),
                    ('frecuencia_cardiaca', 'INTEGER'),
                    ('signos_clinicos', 'TEXT'),
                    ('sintomas_gi', 'TEXT'),
                    ('consistencia_heces', 'VARCHAR(50)'),
                    # HÁBITOS ALIMENTARIOS
                    ('comidas_por_dia', 'INTEGER'),
                    ('horario_desayuno', 'VARCHAR(10)'),
                    ('horario_almuerzo', 'VARCHAR(10)'),
                    ('horario_cena', 'VARCHAR(10)'),
                    ('pica_entre_comidas', 'BOOLEAN DEFAULT FALSE'),
                    ('come_frente_tv', 'BOOLEAN DEFAULT FALSE'),
                    ('come_rapido', 'BOOLEAN DEFAULT FALSE'),
                    ('consumo_agua_litros', 'FLOAT'),
                    ('consumo_cafe_tazas', 'INTEGER'),
                    ('consumo_te_tazas', 'INTEGER'),
                    ('consumo_bebidas_azucaradas', 'VARCHAR(50)'),
                    # ESTILO DE VIDA
                    ('horas_sueno', 'VARCHAR(20)'),
                    ('calidad_sueno', 'INTEGER'),
                    ('nivel_estres', 'INTEGER'),
                    ('actividad_fisica', 'TEXT'),
                    ('tipo_ejercicio', 'VARCHAR(200)'),
                    ('frecuencia_ejercicio', 'VARCHAR(50)'),
                    ('duracion_ejercicio', 'VARCHAR(50)'),
                    ('percepcion_esfuerzo', 'INTEGER'),
                    ('fuma', 'BOOLEAN DEFAULT FALSE'),
                    ('cigarrillos_dia', 'INTEGER'),
                    ('menstruacion', 'VARCHAR(50)'),
                    ('restricciones_alimentarias', 'TEXT'),
                    ('delivery_restaurante', 'INTEGER'),
                    # NUEVOS CAMPOS ABRIL 2026
                    ('anticonceptivos', 'VARCHAR(100)'),
                    ('otros_antecedentes', 'TEXT'),
                    ('red_de_apoyo', 'TEXT'),
                    ('hambre_emocional', 'BOOLEAN DEFAULT FALSE'),
                    ('historial_antropometria', 'TEXT'),
                    ('historial_bioquimico', 'TEXT'),
                    ('archivos_examenes', 'TEXT'),
                    ('actividades_detalladas', 'TEXT'),
                    ('clasificacion_actividad', 'VARCHAR(20)'),
                    # REQUERIMIENTOS NUTRICIONALES
                    ('get_kcal', 'FLOAT'),
                    ('geb_kcal', 'FLOAT'),
                    ('factor_actividad', 'FLOAT'),
                    ('factor_actividad_num', 'FLOAT'),
                    ('factor_estres', 'FLOAT'),
                    ('metodo_calculo', 'VARCHAR(30)'),
                    ('ajuste_calorico', 'INTEGER'),
                    ('get_kcal_ajustado', 'FLOAT'),
                    ('proteinas_g', 'FLOAT'),
                    ('proteinas_porcentaje', 'FLOAT'),
                    ('proteinas_grkg', 'FLOAT'),
                    ('carbohidratos_g', 'FLOAT'),
                    ('carbohidratos_porcentaje', 'FLOAT'),
                    ('carbohidratos_grkg', 'FLOAT'),
                    ('grasas_g', 'FLOAT'),
                    ('grasas_porcentaje', 'FLOAT'),
                    ('grasas_grkg', 'FLOAT'),
                    ('fibra_g', 'FLOAT'),
                    # DIAGNÓSTICO Y PLAN
                    ('diagnostico_nutricional', 'TEXT'),
                    ('objetivos_nutricionales', 'TEXT'),
                    ('plan_alimentario', 'TEXT'),
                    ('indicaciones', 'TEXT'),
                    ('metas_corto_plazo', 'TEXT'),
                    ('metas_mediano_plazo', 'TEXT'),
                    ('metas_largo_plazo', 'TEXT'),
                    ('fecha_proxima_cita', 'TIMESTAMP'),
                    ('notas_seguimiento', 'TEXT'),
                ],
                'users': [
                    ('bio', 'TEXT'),
                    ('consulta_precio', 'INTEGER'),
                    ('consulta_duracion', 'INTEGER DEFAULT 60'),
                    ('banco_info', 'TEXT'),
                ],
                'bookings': [
                    ('reschedule_token', 'VARCHAR(64) UNIQUE'),
                ]
            }

            for table_name, columns in new_columns.items():
                if table_name in inspector.get_table_names():
                    existing_cols = [c['name'] for c in inspector.get_columns(table_name)]
                    for col_name, col_type in columns:
                        if col_name not in existing_cols:
                            try:
                                db.session.execute(text(f'ALTER TABLE {table_name} ADD COLUMN {col_name} {col_type}'))
                                print(f"  + Columna agregada: {table_name}.{col_name}")
                            except:
                                pass
                    db.session.commit()

            # Crear índices para columnas nuevas (PostgreSQL)
            indexes_to_create = [
                ('bookings', 'idx_bookings_reschedule_token', 'reschedule_token'),
            ]

            for table_name, index_name, column_name in indexes_to_create:
                try:
                    # Use CREATE INDEX IF NOT EXISTS (PostgreSQL 9.5+)
                    db.session.execute(text(f'CREATE INDEX IF NOT EXISTS {index_name} ON {table_name}({column_name})'))
                    print(f"  + Índice creado/verificado: {table_name}.{index_name}")
                except Exception as idx_err:
                    # Index might already exist, that's ok
                    pass
            db.session.commit()

        except Exception as e:
            print(f"[WARNING] DB init: {e}")
            db.session.rollback()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print("=" * 80)
    print("[START] GENERADOR DE RECETAS V3.4 - FIXED")
    print("=" * 80)
    print(f"🌐 Puerto: {port}")
    print(f"📂 Directorio: {os.getcwd()}")
    print(f"🔐 Autenticación: {'[OK] Habilitada' if AUTH_ENABLED else '❌ Deshabilitada'}")
    print("=" * 80)
    
    app.run(debug=False, host='0.0.0.0', port=port)