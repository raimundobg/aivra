"""
app.py - Flask App con Generador de Recetas + Sistema de Autenticación
Versión: 3.5 - Con API de Alimentos desde Excel
"""
from flask import Flask, render_template, request, jsonify, send_from_directory, redirect, url_for, flash
from flask_login import LoginManager, login_required, current_user
import sys
import os
import traceback
import json
import pandas as pd
from functools import lru_cache
from datetime import datetime, date

# Agregar el directorio actual al path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

app = Flask(__name__)

# ============================================
# CONFIGURACIÓN
# ============================================

app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-cambiar-en-produccion')
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

try:
    from flask_cors import CORS
    CORS(app)
    print("✅ CORS habilitado")
except ImportError:
    print("⚠️ CORS no disponible")
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
    
    db.init_app(app)
    
    login_manager = LoginManager()
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'
    login_manager.login_message = 'Por favor inicia sesión para acceder'
    login_manager.login_message_category = 'info'
    
    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))
    
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
    print(message)
    debug_logs.append(message)
    if len(debug_logs) > 50:
        debug_logs.pop(0)

# ============================================
# CACHE DE ALIMENTOS (API ENDPOINT)
# ============================================

@lru_cache(maxsize=1)
def load_alimentos_database():
    """Cargar base de datos de alimentos desde Excel (con cache)"""
    try:
        csv_path = os.path.join('data', 'base_alimentos_porciones.xlsx')
        
        if not os.path.exists(csv_path):
            print(f"❌ Error: No se encontró el archivo {csv_path}")
            return {}
        
        df = pd.read_excel(csv_path)
        df.columns = df.columns.str.strip()
        
        database = {}
        
        for grupo in df['Grupo'].unique():
            grupo_key = grupo.lower().replace(' ', '_').replace('á', 'a').replace('é', 'e').replace('í', 'i').replace('ó', 'o').replace('ú', 'u')
            database[grupo_key] = {}
            
            df_grupo = df[df['Grupo'] == grupo]
            
            for subgrupo in df_grupo['Subgrupo'].unique():
                subgrupo_key = str(subgrupo).lower().replace(' ', '_').replace(',', '').replace('/', '_').replace('(', '').replace(')', '').replace('á', 'a').replace('é', 'e').replace('í', 'i').replace('ó', 'o').replace('ú', 'u')[:50]
                
                df_subgrupo = df_grupo[df_grupo['Subgrupo'] == subgrupo]
                alimentos_list = []
                
                for _, row in df_subgrupo.iterrows():
                    alimento = {
                        'nombre': str(row['Alimento']),
                        'gramos': str(row['Gramos_por_porción']),
                        'medida_casera': str(row['Medida_casera']),
                        'kcal': float(row['Kcal_por_porción']) if pd.notna(row['Kcal_por_porción']) else 0,
                        'proteinas': float(row['Proteínas_g']) if pd.notna(row['Proteínas_g']) else 0,
                        'lipidos': float(row['Lípidos_g']) if pd.notna(row['Lípidos_g']) else 0,
                        'carbohidratos': float(row['Carbohidratos_g']) if pd.notna(row['Carbohidratos_g']) else 0
                    }
                    alimentos_list.append(alimento)
                
                database[grupo_key][subgrupo_key] = alimentos_list
        
        print(f"✅ Base de datos de alimentos cargada: {len(database)} grupos")
        return database
    
    except Exception as e:
        print(f"❌ Error cargando alimentos: {e}")
        import traceback
        traceback.print_exc()
        return {}

# ============================================
# API ENDPOINTS - ALIMENTOS
# ============================================

@app.route('/api/alimentos', methods=['GET'])
def get_alimentos():
    """Endpoint para obtener la base de datos completa de alimentos"""
    try:
        database = load_alimentos_database()
        
        if not database:
            return jsonify({
                'success': False,
                'error': 'No se pudo cargar la base de datos de alimentos'
            }), 500
        
        total_grupos = len(database)
        total_alimentos = sum(
            len(alimentos) 
            for subgrupos in database.values() 
            for alimentos in subgrupos.values()
        )
        
        return jsonify({
            'success': True,
            'data': database,
            'total_grupos': total_grupos,
            'total_alimentos': total_alimentos
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ============================================
# RUTAS PRINCIPALES
# ============================================

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

# ============================================
# RUTAS DE DASHBOARDS
# ============================================

@app.route('/dashboard')
@app.route('/dashboard/')
@login_required
def dashboard():
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
    
    return render_template('client_dashboard.html',
                         user=current_user,
                         current_user=current_user,
                         recipes=recipes,
                         recipes_remaining=recipes_remaining,
                         total_recipes=total_recipes)

@app.route('/dashboard/nutritionist')
@login_required
def nutritionist_dashboard():
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
        except Exception as e:
            recipes = []
            total_recipes = 0
    else:
        recipes = []
        total_recipes = 0
    
    return render_template('nutritionist_dashboard.html',
                         user=current_user,
                         recipes=recipes,
                         total_recipes=total_recipes)

@app.route('/dashboard/enterprise')
@login_required
def enterprise_dashboard():
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
            
            recipes_remaining = current_user.get_recipes_remaining()
            if recipes_remaining == float('inf'):
                recipes_remaining = 'Ilimitadas'
                
        except Exception as e:
            recipes = []
            total_recipes = 0
            recipes_remaining = 0
    else:
        recipes = []
        total_recipes = 0
        recipes_remaining = 0
    
    return render_template('enterprise_dashboard.html',
                         user=current_user,
                         recipes=recipes,
                         total_recipes=total_recipes,
                         recipes_remaining=recipes_remaining)

# ============================================
# RUTAS DE PACIENTES
# ============================================
@app.route('/dashboard/nutritionist/patient/new')
@login_required
def patient_intake_form():
    """Crear nuevo paciente y redirigir a su ficha"""
    if current_user.user_type != 'nutricionista':
        flash('No tienes permisos para acceder a esta página', 'danger')
        return redirect(url_for('dashboard'))
    
    try:
        # Obtener el siguiente número de ficha
        last_ficha = PatientFile.query.filter_by(
            nutricionista_id=current_user.id
        ).order_by(PatientFile.ficha_numero.desc()).first()
        
        next_ficha_numero = (last_ficha.ficha_numero or 0) + 1 if last_ficha else 1
        
        # Crear paciente borrador
        new_patient = PatientFile(
            nutricionista_id=current_user.id,
            ficha_numero=next_ficha_numero,
            nombre='Nuevo Paciente',  # Nombre temporal
            sexo='',
            fecha_nacimiento=None,
            motivo_consulta=''
        )
        
        db.session.add(new_patient)
        db.session.commit()
        
        log_debug(f"✅ Paciente borrador creado: ID {new_patient.id}, Ficha #{new_patient.ficha_numero}")
        
        # Redirigir a la ficha del paciente recién creado
        return redirect(f'/dashboard/nutritionist/patient/{new_patient.id}')
        
    except Exception as e:
        db.session.rollback()
        log_debug(f"❌ Error creando paciente borrador: {str(e)}")
        flash('Error al crear nuevo paciente', 'danger')
        return redirect(url_for('nutritionist_dashboard'))

@app.route('/dashboard/nutritionist/patients')
@login_required
def patient_list():
    if current_user.user_type != 'nutricionista':
        flash('No tienes permisos para acceder a esta página', 'danger')
        return redirect(url_for('dashboard'))
    
    return render_template('patient_list.html')

@app.route('/dashboard/nutritionist/patient/<int:patient_id>')
@login_required
def patient_file_view(patient_id):
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

# ============================================
# API ENDPOINTS - PACIENTES
# ============================================

@app.route('/api/patient/save-draft', methods=['POST'])
@login_required
def save_patient_draft():
    """Guardar borrador de paciente (con o sin ID)"""
    if current_user.user_type != 'nutricionista':
        return jsonify({'error': 'No autorizado'}), 403
    
    try:
        data = request.form.to_dict()
        patient_id = data.get('patient_id')
        
        # ============================================
        # HELPER: Convertir fecha_atencion string → datetime
        # ============================================
        def parse_fecha_atencion(fecha_str):
            """Convertir string de fecha_atencion a objeto datetime"""
            if not fecha_str:
                return None
            try:
                # Formato HTML datetime-local: "2025-12-02T08:19"
                return datetime.strptime(fecha_str, '%Y-%m-%dT%H:%M')
            except ValueError:
                log_debug(f"⚠️ Error parseando fecha_atencion: {fecha_str}")
                return None
        
        # ============================================
        # CASO 1: ACTUALIZAR PACIENTE EXISTENTE
        # ============================================
        if patient_id:
            patient = PatientFile.query.filter_by(
                id=patient_id,
                nutricionista_id=current_user.id
            ).first()
            
            if not patient:
                return jsonify({'error': 'Paciente no encontrado'}), 404
            
            # Actualizar campos de texto básicos
            for field in ['nombre', 'fecha_nacimiento', 'sexo', 'motivo_consulta']:
                if field in data:
                    setattr(patient, field, data[field])
            
            # Actualizar fecha_atencion (requiere conversión)
            if 'fecha_atencion' in data:
                patient.fecha_atencion = parse_fecha_atencion(data['fecha_atencion'])
            
            # Actualizar medidas antropométricas
            if 'talla' in data and data['talla']:
                patient.talla_m = float(data['talla'])
            if 'peso' in data and data['peso']:
                patient.peso_kg = float(data['peso'])
            
            # Actualizar campos JSON
            for field in ['diagnosticos', 'medicamentos', 'suplementos', 'objetivos']:
                if field in data:
                    value = data[field]
                    if isinstance(value, str) and value:
                        setattr(patient, field, value if value.startswith('[') else f'["{value}"]')
            
            # Recalcular valores automáticos
            patient.calcular_todo()
            db.session.commit()
            
            return jsonify({
                'success': True,
                'patient_id': patient.id,
                'message': 'Borrador actualizado'
            })
        
        # ============================================
        # CASO 2: CREAR NUEVO PACIENTE
        # ============================================
        else:
            last_ficha = PatientFile.query.filter_by(
                nutricionista_id=current_user.id
            ).order_by(PatientFile.ficha_numero.desc()).first()
            
            next_ficha_numero = (last_ficha.ficha_numero or 0) + 1 if last_ficha else 1
            
            # Convertir fecha_atencion antes de crear el paciente
            fecha_atencion_obj = parse_fecha_atencion(data.get('fecha_atencion'))
            
            new_patient = PatientFile(
                nutricionista_id=current_user.id,
                ficha_numero=next_ficha_numero,
                nombre=data.get('nombre', 'Borrador sin nombre'),
                fecha_nacimiento=data.get('fecha_nacimiento'),
                fecha_atencion=fecha_atencion_obj,  # ← Usar objeto datetime
                sexo=data.get('sexo'),
                motivo_consulta=data.get('motivo_consulta', ''),
                talla_m=float(data.get('talla')) if data.get('talla') else None,
                peso_kg=float(data.get('peso')) if data.get('peso') else None
            )
            
            # Calcular valores automáticos
            new_patient.calcular_todo()
            db.session.add(new_patient)
            db.session.commit()
            
            return jsonify({
                'success': True,
                'patient_id': new_patient.id,
                'ficha_numero': new_patient.ficha_numero,
                'message': 'Borrador creado'
            }), 201
    
    except Exception as e:
        db.session.rollback()
        log_debug(f"❌ Error en save_patient_draft: {str(e)}")
        return jsonify({'error': str(e)}), 500
# ← AQUÍ EMPIEZA LA SIGUIENTE FUNCIÓN
@app.route('/api/patients', methods=['GET'])
@login_required
def list_patients():
    """Listar todos los pacientes del nutricionista"""
    if current_user.user_type != 'nutricionista':
        return jsonify({'error': 'No autorizado'}), 403
    
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '').strip()
        active_only = request.args.get('active', 'true').lower() == 'true'
        
        query = PatientFile.query.filter_by(nutricionista_id=current_user.id)
        
        if active_only:
            query = query.filter_by(is_active=True)
        
        if search:
            query = query.filter(PatientFile.nombre.ilike(f'%{search}%'))
        
        query = query.order_by(PatientFile.updated_at.desc())
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

# ============================================
# RUTA UPDATE_PATIENT MEJORADA CON DEBUGGING
# Reemplaza la función update_patient en app.py (línea 578)
# ============================================

@app.route('/api/patients/<int:patient_id>', methods=['PUT'])
@login_required
def update_patient(patient_id):
    """Actualizar datos de un paciente - VERSIÓN MEJORADA"""
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
        
        # ============================================
        # DEBUGGING: Mostrar datos recibidos
        # ============================================
        log_debug(f"🔍 DEBUG: Actualizando paciente ID {patient_id}")
        log_debug(f"📊 DEBUG: Campos recibidos: {list(data.keys())}")
        log_debug(f"📦 DEBUG: Total de campos: {len(data)}")
        
        # ============================================
        # 1. ANTECEDENTES GENERALES (TEXTO)
        # ============================================
        campos_texto = [
            'nombre', 'fecha_nacimiento', 'sexo', 'email', 'telefono', 
            'motivo_consulta', 'objetivos'  # ← fecha_atencion REMOVIDO de aquí
        ]
        
        for campo in campos_texto:
            if campo in data:
                setattr(patient, campo, data[campo])
                log_debug(f"  ✓ {campo}: {data[campo]}")
        
        # ============================================
        # 2. CAMPOS DATETIME (requieren conversión)
        # ============================================
        if 'fecha_atencion' in data and data['fecha_atencion']:
            try:
                # Convertir string a datetime object
                fecha_atencion_obj = datetime.strptime(data['fecha_atencion'], '%Y-%m-%dT%H:%M')
                patient.fecha_atencion = fecha_atencion_obj
                log_debug(f"  ✓ fecha_atencion: {fecha_atencion_obj}")
            except ValueError as e:
                log_debug(f"  ⚠️ Error parseando fecha_atencion: {e}")
                # Si falla, intentar otros formatos comunes
                try:
                    fecha_atencion_obj = datetime.strptime(data['fecha_atencion'], '%Y-%m-%d %H:%M:%S')
                    patient.fecha_atencion = fecha_atencion_obj
                    log_debug(f"  ✓ fecha_atencion (formato alternativo): {fecha_atencion_obj}")
                except ValueError:
                    log_debug(f"  ❌ No se pudo parsear fecha_atencion: {data['fecha_atencion']}")
        elif 'fecha_atencion' in data and not data['fecha_atencion']:
            # Si viene vacío, establecer como None
            patient.fecha_atencion = None
            log_debug(f"  ✓ fecha_atencion: None (campo vacío)")
        
        # ============================================
        # 3. DIAGNÓSTICOS, MEDICAMENTOS, SUPLEMENTOS
        # ============================================
        campos_json = [
            'diagnosticos', 'medicamentos', 'suplementos',
            'quien_cocina', 'con_quien_vive', 'donde_come', 'tipo_alcohol'
        ]
        
        for campo in campos_json:
            if campo in data:
                valor = data[campo]
                # Convertir a JSON si es lista
                if isinstance(valor, list):
                    setattr(patient, campo, json.dumps(valor))
                    log_debug(f"  ✓ {campo} (lista): {valor}")
                else:
                    setattr(patient, campo, valor)
                    log_debug(f"  ✓ {campo}: {valor}")
        
        # ============================================
        # 4. CONDUCTA Y ENTORNO
        # ============================================
        campos_conducta = [
            'profesion', 'teletrabajo', 'horas_sueno', 'observaciones_sueno',
            'gatillantes_estres', 'manejo_estres', 'consumo_alcohol',
            'tabaco', 'drogas', 'actividad_fisica', 'tipo_ejercicio'
        ]
        
        for campo in campos_conducta:
            if campo in data:
                setattr(patient, campo, data[campo])
                log_debug(f"  ✓ {campo}: {data[campo]}")
        
        # ============================================
        # 5. CAMPOS NUMÉRICOS - FLOAT
        # ============================================
        campos_float = [
            'talla_m', 'peso_kg', 'peso_ideal',
            # PLIEGUES CUTÁNEOS
            'pliegue_bicipital', 'pliegue_tricipital', 
            'pliegue_subescapular', 'pliegue_supracrestideo',
            # PERÍMETROS
            'perimetro_brazo', 'perimetro_cintura', 
            'perimetro_cadera', 'perimetro_pantorrilla'
        ]
        
        for campo in campos_float:
            if campo in data and data[campo]:
                try:
                    valor = float(data[campo])
                    setattr(patient, campo, valor)
                    log_debug(f"  ✓ {campo}: {valor}")
                except (ValueError, TypeError) as e:
                    log_debug(f"  ⚠️ Error convirtiendo {campo}: {e}")
        
        # ============================================
        # 6. CAMPOS NUMÉRICOS - INT
        # ============================================
        campos_int = [
            'calidad_sueno', 'nivel_estres', 'duracion_ejercicio'
        ]
        
        for campo in campos_int:
            if campo in data and data[campo]:
                try:
                    valor = int(data[campo])
                    setattr(patient, campo, valor)
                    log_debug(f"  ✓ {campo}: {valor}")
                except (ValueError, TypeError) as e:
                    log_debug(f"  ⚠️ Error convirtiendo {campo}: {e}")
        
        # ============================================
        # 7. CAMPOS GASTROINTESTINALES
        # ============================================
        campos_gastro = [
            'frecuencia_evacuacion', 'reflujo', 'reflujo_alimento',
            'hinchazon', 'hinchazon_alimento', 'tiene_alergias', 'alergias_alimento'
        ]
        
        for campo in campos_gastro:
            if campo in data:
                setattr(patient, campo, data[campo])
                log_debug(f"  ✓ {campo}: {data[campo]}")
        
        # ============================================
        # 8. REGISTRO 24H Y FRECUENCIA DE CONSUMO
        # ============================================
        if 'registro_24h' in data:
            registro = data['registro_24h']
            if isinstance(registro, (dict, list)):
                patient.registro_24h = json.dumps(registro)
                log_debug(f"  ✓ registro_24h: {len(str(registro))} caracteres")
            else:
                patient.registro_24h = registro
                log_debug(f"  ✓ registro_24h: {registro}")
        
        if 'frecuencia_consumo' in data:
            frecuencia = data['frecuencia_consumo']
            if isinstance(frecuencia, (dict, list)):
                patient.frecuencia_consumo = json.dumps(frecuencia)
                log_debug(f"  ✓ frecuencia_consumo: {len(frecuencia)} items")
            else:
                patient.frecuencia_consumo = frecuencia
                log_debug(f"  ✓ frecuencia_consumo: {frecuencia}")
        
        # ============================================
        # 9. CALCULAR VALORES AUTOMÁTICOS
        # ============================================
        log_debug("📊 DEBUG: Calculando valores automáticos (IMC, GET, etc.)...")
        patient.calcular_todo()
        
        # ============================================
        # 10. GUARDAR EN BASE DE DATOS
        # ============================================
        db.session.commit()
        
        log_debug(f"✅ Paciente actualizado: {patient.nombre} (ID: {patient.id})")
        log_debug(f"📊 Valores calculados: IMC={patient.imc}, GET={patient.get_kcal}")
        
        return jsonify({
            'success': True,
            'message': 'Paciente actualizado exitosamente',
            'patient': patient.to_dict()
        })
    
    except Exception as e:
        db.session.rollback()
        log_debug(f"❌ ERROR actualizando paciente: {str(e)}")
        log_debug(f"❌ Traceback: {traceback.format_exc()}")
        return jsonify({'success': False, 'error': str(e)}), 500
# ============================================
# TAMBIÉN ACTUALIZAR create_patient (línea 337)
# ============================================

@app.route('/api/patients', methods=['POST'])
@login_required
def create_patient():
    if current_user.user_type != 'nutricionista':
        return jsonify({'error': 'No autorizado'}), 403
    
    try:
        data = request.get_json()
        
        # Debugging
        log_debug(f"🔍 DEBUG: Creando nuevo paciente")
        log_debug(f"📊 DEBUG: Campos recibidos: {list(data.keys())}")
        
        last_ficha = PatientFile.query.filter_by(
            nutricionista_id=current_user.id
        ).order_by(PatientFile.ficha_numero.desc()).first()
        
        next_ficha_numero = (last_ficha.ficha_numero or 0) + 1 if last_ficha else 1
        
        # Convertir fecha_atencion de string a datetime
        fecha_atencion_str = data.get('fecha_atencion')
        fecha_atencion_obj = None
        if fecha_atencion_str:
            try:
                fecha_atencion_obj = datetime.strptime(fecha_atencion_str, '%Y-%m-%dT%H:%M')
            except ValueError:
                log_debug(f"⚠️ Error parseando fecha_atencion: {fecha_atencion_str}")

        new_patient = PatientFile(
            nutricionista_id=current_user.id,
            ficha_numero=next_ficha_numero,
            nombre=data.get('nombre'),
            fecha_nacimiento=data.get('fecha_nacimiento'),
            fecha_atencion=fecha_atencion_obj,  # ← Usar objeto datetime, NO string
            sexo=data.get('sexo'),
            
            # Diagnósticos, medicamentos, suplementos
            diagnosticos=json.dumps(data.get('diagnosticos', [])) if isinstance(data.get('diagnosticos'), list) else data.get('diagnosticos', ''),
            medicamentos=json.dumps(data.get('medicamentos', [])) if isinstance(data.get('medicamentos'), list) else data.get('medicamentos', ''),
            suplementos=json.dumps(data.get('suplementos', [])) if isinstance(data.get('suplementos'), list) else data.get('suplementos', ''),
            
            # Conducta y entorno
            profesion=data.get('profesion'),
            teletrabajo=data.get('teletrabajo'),
            quien_cocina=json.dumps(data.get('quien_cocina', [])) if isinstance(data.get('quien_cocina'), list) else data.get('quien_cocina', ''),
            con_quien_vive=json.dumps(data.get('con_quien_vive', [])) if isinstance(data.get('con_quien_vive'), list) else data.get('con_quien_vive', ''),
            donde_come=json.dumps(data.get('donde_come', [])) if isinstance(data.get('donde_come'), list) else data.get('donde_come', ''),
            
            # Antropometría
            talla_m=float(data.get('talla')) if data.get('talla') else None,
            peso_kg=float(data.get('peso')) if data.get('peso') else None,
            
            # *** PLIEGUES CUTÁNEOS ***
            pliegue_bicipital=float(data.get('pliegue_bicipital')) if data.get('pliegue_bicipital') else None,
            pliegue_tricipital=float(data.get('pliegue_tricipital')) if data.get('pliegue_tricipital') else None,
            pliegue_subescapular=float(data.get('pliegue_subescapular')) if data.get('pliegue_subescapular') else None,
            pliegue_supracrestideo=float(data.get('pliegue_supracrestideo')) if data.get('pliegue_supracrestideo') else None,
            
            # *** PERÍMETROS ***
            perimetro_brazo=float(data.get('perimetro_brazo')) if data.get('perimetro_brazo') else None,
            perimetro_cintura=float(data.get('perimetro_cintura')) if data.get('perimetro_cintura') else None,
            perimetro_cadera=float(data.get('perimetro_cadera')) if data.get('perimetro_cadera') else None,
            perimetro_pantorrilla=float(data.get('perimetro_pantorrilla')) if data.get('perimetro_pantorrilla') else None,
            
            # Sueño y estrés
            horas_sueno=data.get('horas_sueno'),
            calidad_sueno=int(data.get('calidad_sueno')) if data.get('calidad_sueno') else None,
            observaciones_sueno=data.get('observaciones_sueno'),
            nivel_estres=int(data.get('nivel_estres')) if data.get('nivel_estres') else None,
            gatillantes_estres=data.get('gatillantes_estres'),
            manejo_estres=data.get('manejo_estres'),
            
            # Hábitos
            consumo_alcohol=data.get('consumo_alcohol'),
            tipo_alcohol=json.dumps(data.get('tipo_alcohol', [])) if isinstance(data.get('tipo_alcohol'), list) else data.get('tipo_alcohol', ''),
            tabaco=data.get('tabaco'),
            drogas=data.get('drogas'),
            actividad_fisica=data.get('actividad_fisica'),
            tipo_ejercicio=data.get('tipo_ejercicio'),
            duracion_ejercicio=int(data.get('duracion_ejercicio')) if data.get('duracion_ejercicio') else None,
            
            # Gastrointestinal
            frecuencia_evacuacion=data.get('frecuencia_evacuacion'),
            reflujo=data.get('reflujo'),
            reflujo_alimento=data.get('reflujo_alimento'),
            hinchazon=data.get('hinchazon'),
            hinchazon_alimento=data.get('hinchazon_alimento'),
            tiene_alergias=data.get('tiene_alergias'),
            alergias_alimento=data.get('alergias_alimento'),
            
            # Registro 24h y frecuencia
            registro_24h=json.dumps(data.get('registro_24h')) if isinstance(data.get('registro_24h'), (dict, list)) else data.get('registro_24h'),
            frecuencia_consumo=json.dumps(data.get('frecuencia_consumo')) if isinstance(data.get('frecuencia_consumo'), (dict, list)) else data.get('frecuencia_consumo')
        )
        
        new_patient.calcular_todo()
        
        db.session.add(new_patient)
        db.session.commit()
        
        log_debug(f"✅ Paciente creado: {new_patient.nombre} (Ficha #{new_patient.ficha_numero})")
        log_debug(f"📊 Pliegues: bici={new_patient.pliegue_bicipital}, trici={new_patient.pliegue_tricipital}")
        log_debug(f"📊 Perímetros: cintura={new_patient.perimetro_cintura}, cadera={new_patient.perimetro_cadera}")
        
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
        log_debug(f"❌ Traceback: {traceback.format_exc()}")
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

# ============================================
# OTRAS RUTAS DE USUARIO
# ============================================

@app.route('/my-recipes')
@login_required
def my_recipes():
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

@app.route('/profile')
@login_required
def profile():
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
# API ENDPOINTS - SUPERFOODS Y RECETAS
# ============================================

@app.route('/api/superfoods', methods=['GET'])
@login_required
def get_superfoods():
    try:
        df = pd.read_csv('data/db_maestra_superalimentos_ampliada.csv')
        
        category = request.args.get('category', 'all')
        search = request.args.get('search', '').lower()
        
        if category != 'all':
            df = df[df['categoria_id'] == category]
        
        if search:
            mask = (
                df['nombre'].str.lower().str.contains(search, na=False) |
                df['descripcion'].str.lower().str.contains(search, na=False) |
                df['nombre_cientifico'].str.lower().str.contains(search, na=False)
            )
            df = df[mask]
        
        columns_to_show = [
            'superalimento_id', 'nombre', 'nombre_cientifico', 'categoria_id',
            'descripcion', 'origen', 'forma_consumo', 'precio_relativo',
            'calorias', 'proteinas', 'carbohidratos', 'grasas_totales',
            'omega_3', 'fibra', 'vitamina_c', 'vitamina_a', 'calcio',
            'hierro', 'magnesio', 'capacidad_antioxidante_total',
            'funcion_principal', 'biodisponibilidad_porcentaje'
        ]
        
        available_columns = [col for col in columns_to_show if col in df.columns]
        df_filtered = df[available_columns]
        
        superfoods = df_filtered.fillna('').to_dict('records')
        
        return jsonify({
            'success': True,
            'data': superfoods,
            'total': len(superfoods)
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/check-recipe-limit', methods=['GET'])
@login_required
def check_recipe_limit():
    can_generate = current_user.can_generate_recipe()
    remaining = current_user.get_recipes_remaining()
    
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
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/generate_recipe', methods=['POST'])
def generate_recipe():
    try:
        log_debug("🚀 === INICIANDO GENERACIÓN DE RECETA ===")
        
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No se recibieron datos'}), 400
        
        if not data.get('primary_objective'):
            return jsonify({'error': 'El objetivo principal es requerido'}), 400
        
        if AUTH_ENABLED and current_user.is_authenticated:
            if not current_user.can_generate_recipe():
                return jsonify({
                    'error': 'Has alcanzado el límite de recetas de tu plan',
                    'recipes_remaining': 0,
                    'upgrade_required': True
                }), 403
        
        try:
            from recipe_generator_v2 import RecipeGeneratorV3
            
            generator = RecipeGeneratorV3(
                db_path='data/db_maestra_superalimentos_ampliada.csv',
                benchmark_csv='benchmark_recipes_database.csv',
                feedback_db='user_feedback.db'
            )
        except ImportError as e:
            return jsonify({'error': f"Error importando RecipeGeneratorV3: {str(e)}"}), 500
        
        recipe = generator.generate_recipe_with_scoring(data)
        
        # Limpiar valores Infinity
        def clean_infinity(obj):
            if isinstance(obj, dict):
                return {k: clean_infinity(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [clean_infinity(item) for item in obj]
            elif isinstance(obj, float):
                if obj == float('inf'):
                    return 999999
                elif obj == float('-inf'):
                    return -999999
                elif obj != obj:
                    return 0
            return obj
        
        recipe = clean_infinity(recipe)
        
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
                
                recipes_remaining = current_user.get_recipes_remaining()
                if recipes_remaining == float('inf'):
                    recipe['recipes_remaining'] = 'unlimited'
                else:
                    recipe['recipes_remaining'] = recipes_remaining
                    
                log_debug(f"✅ Receta guardada para {current_user.email}")
            except Exception as e:
                log_debug(f"⚠️ Error guardando receta: {e}")
        else:
            recipe['recipes_remaining'] = 'unlimited'
        
        return jsonify(recipe)
        
    except Exception as e:
        return jsonify({'error': f'Error interno del servidor: {str(e)}'}), 500

@app.route('/submit_feedback', methods=['POST'])
def submit_feedback():
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
            except Exception as e:
                log_debug(f"⚠️ Error guardando review: {e}")
        
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
    try:
        from recipe_generator_v2 import RecipeGeneratorV3
        generator = RecipeGeneratorV3()
        
        feedback = generator.get_recipe_feedback(recipe_id)
        return jsonify(feedback)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/regenerate_optimized', methods=['POST'])
def regenerate_optimized_endpoint():
    try:
        log_debug("🔄 === INICIANDO REGENERACIÓN OPTIMIZADA ===")
        
        data = request.get_json()
        
        from regenerate_optimized import regenerate_optimized
        
        result = regenerate_optimized(
            original_recipe_data=data,
            target_score=float(data.get('target_score', 80)),
            max_iterations=int(data.get('max_iterations', 3))
        )
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': f'Error en regeneración: {str(e)}'}), 500

# ============================================
# RUTAS ESTÁTICAS
# ============================================

@app.route('/css/<path:filename>')
def serve_css(filename):
    return send_from_directory('css', filename)

@app.route('/js/<path:filename>')
def serve_js(filename):
    return send_from_directory('js', filename)

@app.route('/images/<path:filename>')
def serve_images(filename):
    return send_from_directory('images', filename)

@app.route('/images/products/<path:filename>')
def serve_product_images(filename):
    return send_from_directory('images/products', filename)

@app.route('/<path:filename>')
def serve_static(filename):
    api_prefixes = ['api/', 'dashboard', 'nutritionist/', 'auth/', 'profile', 
                    'explore-', 'my-recipes', 'generate_', 'submit_', 'get_', 
                    'regenerate_', 'health', 'debug_', 'test_']
    
    for prefix in api_prefixes:
        if filename.startswith(prefix) or filename == prefix.rstrip('/'):
            return jsonify({'error': 'Endpoint no encontrado'}), 404
    
    allowed_extensions = ['.html', '.css', '.js', '.png', '.jpg', '.jpeg', '.gif', 
                         '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.map',
                         '.json', '.xml', '.txt', '.pdf']
    
    file_ext = os.path.splitext(filename)[1].lower()
    
    if not file_ext or file_ext not in allowed_extensions:
        return jsonify({'error': 'Endpoint no encontrado'}), 404
    
    if filename.startswith('templates/') or '/templates/' in filename:
        return jsonify({'error': 'Acceso denegado'}), 403
    
    if filename.endswith('.py') or filename.endswith('.pyc'):
        return jsonify({'error': 'Acceso denegado'}), 403
    
    if filename in ['app.py', 'models.py', 'auth.py', 'requirements.txt', '.env']:
        return jsonify({'error': 'Acceso denegado'}), 403
    
    if os.path.exists(filename) and os.path.isfile(filename):
        return send_from_directory('.', filename)
    
    return jsonify({'error': 'Archivo no encontrado'}), 404

# ============================================
# UTILIDADES Y ERROR HANDLERS
# ============================================

@app.route('/debug_logs')
def get_debug_logs():
    return jsonify({'logs': debug_logs})

@app.route('/test_data')
def test_data():
    try:
        log_debug("🔍 TESTING: Verificando archivos de datos...")
        
        data_files = ['data/db_maestra_superalimentos_ampliada.csv']
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
                except Exception as e:
                    results[file_path] = {'exists': True, 'error': str(e)}
            else:
                results[file_path] = {'exists': False}
        
        return jsonify(results)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health')
def health_check():
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
        'version': 'v3.5 - Con API de Alimentos',
        'auth_enabled': AUTH_ENABLED,
        'database': db_status,
        'alimentos_loaded': len(load_alimentos_database()) > 0
    })

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint no encontrado'}), 404

@app.errorhandler(500)
def internal_error(error):
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
    print("🚀 GENERADOR DE RECETAS V3.5 - CON API DE ALIMENTOS")
    print("=" * 80)
    print(f"🌐 Puerto: {port}")
    print(f"📂 Directorio: {os.getcwd()}")
    print(f"🔐 Autenticación: {'✅ Habilitada' if AUTH_ENABLED else '❌ Deshabilitada'}")
    print(f"🍎 API Alimentos: {'✅ Configurada' if os.path.exists('data/base_alimentos_porciones.xlsx') else '⚠️ Excel no encontrado'}")
    print("=" * 80)
    
    app.run(debug=False, host='0.0.0.0', port=port)