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

@app.route('/dashboard/nutritionist/patient/new')
@login_required
def patient_intake_form():
    """Formulario de ingreso de nuevo paciente"""
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
    if current_user.user_type != 'nutricionista':
        return jsonify({'error': 'No autorizado'}), 403
    
    try:
        patient = PatientFile.query.filter_by(
            id=patient_id, 
            nutricionista_id=current_user.id
        ).first()
        
        if not patient:
            return jsonify({'error': 'Paciente no encontrado'}), 404
        
        return jsonify({
            'success': True,
            'patient': patient.to_dict()
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/patients/<int:patient_id>', methods=['PUT'])
@login_required
def update_patient(patient_id):
    """Actualizar datos de un paciente"""
    if current_user.user_type != 'nutricionista':
        return jsonify({'error': 'No autorizado'}), 403
    
    try:
        patient = PatientFile.query.filter_by(
            id=patient_id, 
            nutricionista_id=current_user.id
        ).first()
        
        if not patient:
            return jsonify({'error': 'Paciente no encontrado'}), 404
        
        data = request.get_json()
        
        # Actualizar campos básicos
        campos_texto = [
            'nombre', 'fecha_nacimiento', 'sexo', 'email', 'telefono', 
            'direccion', 'ocupacion', 'motivo_consulta', 'objetivos',
            'diagnosticos', 'medicamentos', 'suplementos', 'alergias',
            'intolerancias', 'cirugias', 'antecedentes_familiares',
            'horas_sueno', 'actividad_fisica', 'tipo_ejercicio',
            'frecuencia_ejercicio', 'duracion_ejercicio',
            'diagnostico_nutricional', 'objetivos_nutricionales',
            'plan_alimentario', 'indicaciones', 'metas_corto_plazo',
            'metas_mediano_plazo', 'metas_largo_plazo', 'notas_seguimiento',
            'fecha_examenes', 'frecuencia_evacuacion', 'consistencia_heces',
            'recordatorio_24h', 'frecuencia_consumo', 'signos_clinicos',
            'sintomas_gi', 'horario_desayuno', 'horario_almuerzo', 
            'horario_cena', 'quien_cocina', 'donde_come',
            'consumo_bebidas_azucaradas', 'consumo_alcohol', 'tipo_alcohol'
        ]
        
        for campo in campos_texto:
            if campo in data:
                setattr(patient, campo, data[campo])
        
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
            'proteinas_porcentaje', 'carbohidratos_porcentaje', 'grasas_porcentaje'
        ]
        
        for campo in campos_float:
            if campo in data and data[campo]:
                try:
                    setattr(patient, campo, float(data[campo]))
                except (ValueError, TypeError):
                    pass
        
        # Campos numéricos int
        campos_int = [
            'calidad_sueno', 'nivel_estres',
            'presion_sistolica', 'presion_diastolica', 'frecuencia_cardiaca',
            'comidas_por_dia', 'consumo_cafe_tazas', 'consumo_te_tazas',
            'cigarrillos_dia'
        ]
        
        for campo in campos_int:
            if campo in data and data[campo]:
                try:
                    setattr(patient, campo, int(data[campo]))
                except (ValueError, TypeError):
                    pass
        
        # Campos booleanos
        campos_bool = [
            'fuma', 'pica_entre_comidas', 'come_frente_tv', 'come_rapido'
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
                from datetime import datetime
                patient.fecha_proxima_cita = datetime.fromisoformat(data['fecha_proxima_cita'].replace('Z', '+00:00'))
            except:
                pass
        
        # Ejecutar cálculos automáticos
        patient.calcular_todo()
        
        db.session.commit()
        
        log_debug(f"✅ Paciente actualizado: {patient.nombre} (ID: {patient.id})")
        
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
    if current_user.user_type != 'nutricionista':
        return jsonify({'error': 'No autorizado'}), 403
    
    try:
        patient = PatientFile.query.filter_by(
            id=patient_id, 
            nutricionista_id=current_user.id
        ).first()
        
        if not patient:
            return jsonify({'error': 'Paciente no encontrado'}), 404
        
        # Soft delete
        patient.is_active = False
        db.session.commit()
        
        log_debug(f"✅ Paciente eliminado (soft): {patient.nombre} (ID: {patient.id})")
        
        return jsonify({
            'success': True,
            'message': 'Paciente eliminado exitosamente'
        })
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/patients', methods=['GET'])
@login_required
def list_patients():
    """Listar todos los pacientes del nutricionista"""
    if current_user.user_type != 'nutricionista':
        return jsonify({'error': 'No autorizado'}), 403
    
    try:
        # Parámetros de paginación y filtros
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '').strip()
        active_only = request.args.get('active', 'true').lower() == 'true'
        
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
            'motivo_consulta': p.motivo_consulta[:100] + '...' if p.motivo_consulta and len(p.motivo_consulta) > 100 else p.motivo_consulta,
            'imc': p.imc,
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
    if current_user.user_type != 'nutricionista':
        flash('No tienes permisos para acceder a esta página', 'danger')
        return redirect(url_for('dashboard'))
    
    return render_template('patient_list.html')


@app.route('/dashboard/nutritionist/patient/<int:patient_id>')
@login_required
def patient_file_view(patient_id):
    """Ver ficha de paciente"""
    if current_user.user_type != 'nutricionista':
        flash('No tienes permisos para acceder a esta página', 'danger')
        return redirect(url_for('dashboard'))
    
    patient = PatientFile.query.filter_by(
        id=patient_id,
        nutricionista_id=current_user.id
    ).first()
    
    if not patient:
        flash('Paciente no encontrado', 'danger')
        return redirect(url_for('patient_list'))
    
    return render_template('patient_file.html', patient=patient)



@app.route('/api/patients', methods=['POST'])
@login_required
def create_patient():
    """API para crear nuevo paciente"""
    if current_user.user_type != 'nutricionista':
        return jsonify({'error': 'No autorizado'}), 403
    
    try:
        data = request.get_json()
        
        # Obtener siguiente número de ficha para este nutricionista
        last_ficha = PatientFile.query.filter_by(
            nutricionista_id=current_user.id
        ).order_by(PatientFile.ficha_numero.desc()).first()
        
        next_ficha_numero = (last_ficha.ficha_numero or 0) + 1 if last_ficha else 1
        
        new_patient = PatientFile(
            nutricionista_id=current_user.id,
            ficha_numero=next_ficha_numero,
            
            # Campos existentes
            nombre=data.get('nombre'),
            fecha_nacimiento=data.get('fecha_nacimiento'),
            sexo=data.get('sexo'),
            motivo_consulta=data.get('motivo_consulta'),
            objetivos=data.get('objetivos', ''),
            
            # Diagnósticos, medicamentos, suplementos (JSON arrays)
            diagnosticos=json.dumps(data.get('diagnosticos', [])) if isinstance(data.get('diagnosticos'), list) else data.get('diagnosticos', ''),
            medicamentos=json.dumps(data.get('medicamentos', [])) if isinstance(data.get('medicamentos'), list) else data.get('medicamentos', ''),
            suplementos=json.dumps(data.get('suplementos', [])) if isinstance(data.get('suplementos'), list) else data.get('suplementos', ''),
            
            # Conducta y Entorno (NUEVOS)
            profesion=data.get('profesion'),
            teletrabajo=data.get('teletrabajo'),
            quien_cocina=json.dumps(data.get('quien_cocina', [])) if isinstance(data.get('quien_cocina'), list) else data.get('quien_cocina', ''),
            con_quien_vive=json.dumps(data.get('con_quien_vive', [])) if isinstance(data.get('con_quien_vive'), list) else data.get('con_quien_vive', ''),

            donde_come=json.dumps(data.get('donde_come', [])) if isinstance(data.get('donde_come'), list) else data.get('donde_come', ''),

            
            # Antropometría (existentes)
            talla_m=float(data.get('talla')) if data.get('talla') else None,
            peso_kg=float(data.get('peso')) if data.get('peso') else None,
            pliegue_bicipital=float(data.get('pliegue_bicipital')) if data.get('pliegue_bicipital') else None,
            pliegue_tricipital=float(data.get('pliegue_tricipital')) if data.get('pliegue_tricipital') else None,
            pliegue_subescapular=float(data.get('pliegue_subescapular')) if data.get('pliegue_subescapular') else None,
            pliegue_supracrestideo=float(data.get('pliegue_supracrestideo')) if data.get('pliegue_supracrestideo') else None,
            perimetro_brazo=float(data.get('perimetro_brazo')) if data.get('perimetro_brazo') else None,
            perimetro_cintura=float(data.get('perimetro_cintura')) if data.get('perimetro_cintura') else None,
            perimetro_cadera=float(data.get('perimetro_cadera')) if data.get('perimetro_cadera') else None,
            perimetro_pantorrilla=float(data.get('perimetro_pantorrilla')) if data.get('perimetro_pantorrilla') else None,
            
            # Salud General (existentes + nuevos)
            horas_sueno=data.get('horas_sueno'),
            calidad_sueno=int(data.get('calidad_sueno')) if data.get('calidad_sueno') else None,
            observaciones_sueno=data.get('observaciones_sueno'),
            nivel_estres=int(data.get('nivel_estres')) if data.get('nivel_estres') else None,
            gatillantes_estres=data.get('gatillantes_estres'),
            manejo_estres=data.get('manejo_estres'),
            consumo_alcohol=data.get('consumo_alcohol'),
            tipo_alcohol=json.dumps(data.get('tipo_alcohol', [])) if isinstance(data.get('tipo_alcohol'), list) else data.get('tipo_alcohol', ''),
            tabaco=data.get('tabaco'),
            drogas=data.get('drogas'),
            actividad_fisica=data.get('actividad_fisica'),
            tipo_ejercicio=data.get('tipo_ejercicio'),
            duracion_ejercicio=int(data.get('duracion_ejercicio')) if data.get('duracion_ejercicio') else None,
            
            # Síntomas GI (NUEVOS)
            frecuencia_evacuacion=data.get('frecuencia_evacuacion'),
            reflujo=data.get('reflujo'),
            reflujo_alimento=data.get('reflujo_alimento'),
            hinchazon=data.get('hinchazon'),
            hinchazon_alimento=data.get('hinchazon_alimento'),
            tiene_alergias=data.get('tiene_alergias'),
            alergias_alimento=data.get('alergias_alimento'),
            
            # Registro 24h y Frecuencia de Consumo (NUEVOS - JSON)
            # Registro 24h y Frecuencia de Consumo (NUEVOS - JSON)
# Convertir a string JSON si es dict/list
            registro_24h=json.dumps(data.get('registro_24h')) if isinstance(data.get('registro_24h'), (dict, list)) else data.get('registro_24h'),
            frecuencia_consumo=json.dumps(data.get('frecuencia_consumo')) if isinstance(data.get('frecuencia_consumo'), (dict, list)) else data.get('frecuencia_consumo')
        )
        
        # Calcular valores automáticos
        new_patient.calcular_todo()
        
        db.session.add(new_patient)
        db.session.commit()
        
        log_debug(f"✅ Paciente creado: {new_patient.nombre} (Ficha #{new_patient.ficha_numero})")
        
        return jsonify({
            'success': True,
            'message': 'Paciente guardado exitosamente',
            'patient_id': new_patient.id,
            'ficha_numero': new_patient.ficha_numero,
            'redirect_url': f'/dashboard/nutritionist/patient/{new_patient.id}'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        log_debug(f"❌ Error creando paciente: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


# ============================================
# RUTAS DE INTAKE PUBLICO (SIN LOGIN)
# Sistema para que pacientes llenen datos antes de la consulta
# ============================================

@app.route('/intake/<token>')
def patient_public_intake(token):
    """Vista publica del formulario de intake para pacientes"""
    patient = PatientFile.get_by_intake_token(token)

    if not patient:
        return render_template('patient_public_intake.html',
                             error="Enlace invalido o expirado",
                             patient=None)

    if patient.intake_completed:
        return render_template('patient_public_intake.html',
                             already_completed=True,
                             patient=patient)

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
    patient = PatientFile.get_by_intake_token(token)

    if not patient:
        return jsonify({'success': False, 'error': 'Token invalido'}), 404

    if patient.intake_completed:
        return jsonify({'success': False, 'error': 'Este formulario ya fue completado'}), 400

    try:
        data = request.get_json()

        # Actualizar datos personales basicos
        if data.get('nombre'):
            patient.nombre = data.get('nombre')
        if data.get('fecha_nacimiento'):
            patient.fecha_nacimiento = data.get('fecha_nacimiento')
        if data.get('sexo'):
            patient.sexo = data.get('sexo')
        if data.get('ocupacion'):
            patient.ocupacion = data.get('ocupacion')
        if data.get('direccion'):
            patient.direccion = data.get('direccion')

        # Motivo de consulta y objetivos
        if data.get('motivo_consulta'):
            patient.motivo_consulta = data.get('motivo_consulta')
        if data.get('objetivos'):
            patient.objetivos = json.dumps(data.get('objetivos')) if isinstance(data.get('objetivos'), list) else data.get('objetivos')

        # Antecedentes medicos
        if data.get('diagnosticos'):
            patient.diagnosticos = json.dumps(data.get('diagnosticos')) if isinstance(data.get('diagnosticos'), list) else data.get('diagnosticos')
        if data.get('medicamentos'):
            patient.medicamentos = data.get('medicamentos')
        if data.get('suplementos'):
            patient.suplementos = data.get('suplementos')
        if data.get('cirugias'):
            patient.cirugias = data.get('cirugias')
        if data.get('antecedentes_familiares'):
            patient.antecedentes_familiares = json.dumps(data.get('antecedentes_familiares')) if isinstance(data.get('antecedentes_familiares'), list) else data.get('antecedentes_familiares')

        # Alergias e intolerancias
        if data.get('alergias'):
            patient.alergias = data.get('alergias')
        if data.get('intolerancias'):
            patient.intolerancias = data.get('intolerancias')
        if data.get('restricciones_alimentarias'):
            patient.restricciones_alimentarias = data.get('restricciones_alimentarias')

        # Estilo de vida
        if data.get('horas_sueno'):
            patient.horas_sueno = data.get('horas_sueno')
        if data.get('calidad_sueno'):
            try:
                patient.calidad_sueno = int(data.get('calidad_sueno'))
            except:
                pass
        if data.get('nivel_estres'):
            try:
                patient.nivel_estres = int(data.get('nivel_estres'))
            except:
                pass

        # Actividad fisica
        if data.get('actividad_fisica'):
            patient.actividad_fisica = data.get('actividad_fisica')
        if data.get('tipo_ejercicio'):
            patient.tipo_ejercicio = data.get('tipo_ejercicio')
        if data.get('frecuencia_ejercicio'):
            patient.frecuencia_ejercicio = data.get('frecuencia_ejercicio')

        # Habitos
        if data.get('consumo_alcohol'):
            patient.consumo_alcohol = data.get('consumo_alcohol')
        if data.get('tabaco'):
            patient.tabaco = data.get('tabaco')
        if data.get('fuma') is not None:
            patient.fuma = data.get('fuma') in [True, 'true', 'True', 1, '1']

        # Sintomas GI
        if data.get('sintomas_gi'):
            patient.sintomas_gi = json.dumps(data.get('sintomas_gi')) if isinstance(data.get('sintomas_gi'), list) else data.get('sintomas_gi')

        # Marcar como completado
        patient.mark_intake_completed()

        db.session.commit()

        log_debug(f"Intake completado para paciente: {patient.nombre} (ID: {patient.id})")

        return jsonify({
            'success': True,
            'message': 'Tus datos han sido guardados exitosamente. Tu nutricionista los revisara antes de tu consulta.'
        })

    except Exception as e:
        db.session.rollback()
        log_debug(f"Error en intake publico: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/patients/<int:patient_id>/generate-intake-token', methods=['POST'])
@login_required
def generate_patient_intake_token(patient_id):
    """API para generar/regenerar token de intake para un paciente"""
    if current_user.user_type != 'nutricionista':
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
    if current_user.user_type != 'nutricionista':
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
        
@app.route('/api/alimentos', methods=['GET'])
def get_alimentos():
    """
    API para cargar base de alimentos desde Excel
    Organiza por: Grupo > Subgrupo > Lista de alimentos
    """
    try:
        import pandas as pd
        
        # Cargar Excel
        df = pd.read_excel('data/base_alimentos_porciones.xlsx')
        
        # Organizar estructura jerárquica
        alimentos_db = {}
        
        for _, row in df.iterrows():
            grupo = row.get('grupo', 'otros')
            subgrupo = row.get('subgrupo', 'general')
            
            if grupo not in alimentos_db:
                alimentos_db[grupo] = {}
            
            if subgrupo not in alimentos_db[grupo]:
                alimentos_db[grupo][subgrupo] = []
            
            alimentos_db[grupo][subgrupo].append({
                'nombre': row.get('nombre', 'Sin nombre'),
                'medida_casera': row.get('medida_casera', '1 porción'),
                'kcal': float(row.get('kcal', 0)),
                'proteinas': float(row.get('proteinas', 0)),
                'carbohidratos': float(row.get('carbohidratos', 0)),
                'lipidos': float(row.get('lipidos', 0))
            })
        
        # Contar totales
        total_grupos = len(alimentos_db)
        total_alimentos = sum(
            len(alimentos) 
            for grupo in alimentos_db.values() 
            for alimentos in grupo.values()
        )
        
        log_debug(f"✅ API Alimentos: {total_grupos} grupos, {total_alimentos} alimentos")
        
        return jsonify({
            'success': True,
            'data': alimentos_db,
            'total_grupos': total_grupos,
            'total_alimentos': total_alimentos
        })
    
    except Exception as e:
        log_debug(f"❌ Error en API Alimentos: {str(e)}")
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

# ============================================
# RUTA ESTÁTICA GENÉRICA (SOLO UNA VEZ, AL FINAL)
# ============================================

@app.route('/<path:filename>')
def serve_static(filename):
    """Sirve archivos estáticos (solo archivos que existen)."""
    
    # 🔧 FIX: Ignorar rutas de API y dashboards
    api_prefixes = ['api/', 'dashboard', 'nutritionist/', 'auth/', 'profile', 
                    'explore-', 'my-recipes', 'generate_', 'submit_', 'get_', 
                    'regenerate_', 'health', 'debug_', 'test_']
    
    for prefix in api_prefixes:
        if filename.startswith(prefix) or filename == prefix.rstrip('/'):
            # Dejar que Flask maneje estas rutas normalmente (404 si no existen)
            return jsonify({'error': 'Endpoint no encontrado'}), 404
    
    # Lista de extensiones permitidas
    allowed_extensions = ['.html', '.css', '.js', '.png', '.jpg', '.jpeg', '.gif', 
                         '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.map',
                         '.json', '.xml', '.txt', '.pdf']
    
    # Verificar extensión
    file_ext = os.path.splitext(filename)[1].lower()
    
    # Si no tiene extensión de archivo estático, rechazar
    if not file_ext or file_ext not in allowed_extensions:
        log_debug(f"🚫 No es archivo estático: {filename}")
        return jsonify({'error': 'Endpoint no encontrado'}), 404
    
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
    return jsonify({'error': 'Archivo no encontrado'}), 404
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

@app.route('/api/migrate-db', methods=['GET', 'POST'])
def migrate_database():
    """Endpoint para agregar columnas faltantes a la base de datos"""
    try:
        from sqlalchemy import text, inspect

        inspector = inspect(db.engine)
        results = []

        # Columnas nuevas para patient_files
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
# INICIALIZACIÓN
# ============================================

if AUTH_ENABLED:
    with app.app_context():
        try:
            db.create_all()
            print("Tablas de base de datos creadas/verificadas")
        except Exception as e:
            print(f"Error creando tablas: {e}")

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