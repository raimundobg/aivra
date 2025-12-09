"""
app.py - Flask App con Generador de Recetas + Sistema de Autenticacion
Version: 3.6 - Con WTForms y Sistema de Pacientes Mejorado
"""
from flask import Flask, render_template, request, jsonify, send_from_directory, redirect, url_for, flash
from flask_login import LoginManager, login_required, current_user
from sqlalchemy import or_
import sys
import os
import traceback
import json
import math
import pandas as pd
from functools import lru_cache
from datetime import datetime, date
from flask_wtf import CSRFProtect
from forms import PatientIntakeForm, PatientFileForm
from flask import send_file
from pauta_pdf_generator import generar_pdf_pauta

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

app = Flask(__name__)

app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-cambiar-en-produccion')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///local.db')

# CSRF - Configuracion
# Excluir metodos seguros y rutas API de la verificacion CSRF
app.config['WTF_CSRF_METHODS'] = ['POST', 'PUT', 'PATCH']  # DELETE excluido intencionalmente para APIs
app.config['WTF_CSRF_TIME_LIMIT'] = 3600

csrf = CSRFProtect(app)

if app.config['SQLALCHEMY_DATABASE_URI'].startswith('postgres://'):
    app.config['SQLALCHEMY_DATABASE_URI'] = app.config['SQLALCHEMY_DATABASE_URI'].replace('postgres://', 'postgresql://', 1)

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_size': 10,
    'pool_recycle': 3600,
}

# CORS
try:
    from flask_cors import CORS
    CORS(app)
    print("[OK] CORS habilitado")
except ImportError:
    print("[WARN] CORS no disponible")
    @app.after_request
    def after_request(response):
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response

# Autenticacion
try:
    from models import db, User, UserRecipe, Review, UserType, SubscriptionPlan, PatientFile
    from auth import auth_bp
    
    db.init_app(app)
    
    login_manager = LoginManager()
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'
    login_manager.login_message = 'Por favor inicia sesion para acceder'
    login_manager.login_message_category = 'info'
    
    @login_manager.user_loader
    def load_user(user_id):
        return db.session.get(User, int(user_id))
    
    app.register_blueprint(auth_bp, url_prefix='/auth')
    
    print("[OK] Sistema de autenticacion habilitado")
    AUTH_ENABLED = True
except ImportError as e:
    print(f"[WARN] Sistema de autenticacion no disponible: {e}")
    AUTH_ENABLED = False

# Debug logs
debug_logs = []

def log_debug(message):
    print(message)
    debug_logs.append(message)
    if len(debug_logs) > 50:
        debug_logs.pop(0)


# ============================================
# CARGA DE BASE DE DATOS DE ALIMENTOS
# ============================================
@lru_cache(maxsize=1)
def load_alimentos_database():
    try:
        csv_path = os.path.join('data', 'base_alimentos_porciones.xlsx')
        
        if not os.path.exists(csv_path):
            print(f"[ERROR] No se encontro el archivo {csv_path}")
            return {}
        
        df = pd.read_excel(csv_path)
        df.columns = df.columns.str.strip()
        
        print(f"[INFO] Columnas encontradas: {df.columns.tolist()}")
        
        def find_column(df, keywords):
            import unicodedata
            def normalize(text):
                # Quitar acentos y convertir a minÃºsculas
                text = unicodedata.normalize('NFD', text)
                text = ''.join(c for c in text if unicodedata.category(c) != 'Mn')
                return text.lower()
            
            for col in df.columns:
                col_normalized = normalize(col)
                for kw in keywords:
                    if kw in col_normalized:
                        return col
            return None
        
        col_grupo = find_column(df, ['grupo']) or 'Grupo'
        col_subgrupo = find_column(df, ['subgrupo']) or 'Subgrupo'
        col_alimento = find_column(df, ['alimento']) or 'Alimento'
        col_gramos = find_column(df, ['gramos', 'porci']) or 'Gramos_por_porcion'
        col_medida = find_column(df, ['medida', 'casera']) or 'Medida_casera'
        col_kcal = find_column(df, ['kcal', 'calor']) or 'Kcal_por_porcion'
        col_proteinas = find_column(df, ['prote']) or 'Proteinas_g'
        col_lipidos = find_column(df, ['lipid', 'grasa']) or 'Lipidos_g'
        col_carbs = find_column(df, ['carbohidrato', 'cho']) or 'Carbohidratos_g'
        
        database = {}
        
        def clean_key(text):
            text = str(text).lower().replace(' ', '_')
            replacements = {'a':'a', 'e':'e', 'i':'i', 'o':'o', 'u':'u', 'n':'n', ',':'', '/':'_', '(':'', ')':''}
            for old, new in replacements.items():
                text = text.replace(old, new)
            return text[:50]
        
        for grupo in df[col_grupo].unique():
            if pd.isna(grupo):
                continue
            grupo_key = clean_key(grupo)
            database[grupo_key] = {}
            
            df_grupo = df[df[col_grupo] == grupo]
            
            for subgrupo in df_grupo[col_subgrupo].unique():
                if pd.isna(subgrupo):
                    continue
                subgrupo_key = clean_key(subgrupo)
                
                df_subgrupo = df_grupo[df_grupo[col_subgrupo] == subgrupo]
                alimentos_list = []
                
                for _, row in df_subgrupo.iterrows():
                    alimento = {
                        'nombre': str(row[col_alimento]) if pd.notna(row[col_alimento]) else '',
                        'gramos': str(row[col_gramos]) if pd.notna(row[col_gramos]) else '',
                        'medida_casera': str(row[col_medida]) if pd.notna(row[col_medida]) else '',
                        'kcal': float(row[col_kcal]) if pd.notna(row[col_kcal]) else 0,
                        'proteinas': float(row[col_proteinas]) if pd.notna(row[col_proteinas]) else 0,
                        'lipidos': float(row[col_lipidos]) if pd.notna(row[col_lipidos]) else 0,
                        'carbohidratos': float(row[col_carbs]) if pd.notna(row[col_carbs]) else 0
                    }
                    alimentos_list.append(alimento)
                
                database[grupo_key][subgrupo_key] = alimentos_list
        
        total_alimentos = sum(len(al) for sg in database.values() for al in sg.values())
        print(f"[OK] Base de datos de alimentos cargada: {len(database)} grupos, {total_alimentos} alimentos")
        return database
    
    except Exception as e:
        print(f"[ERROR] Cargando alimentos: {e}")
        traceback.print_exc()
        return {}


# ============================================
# API DE ALIMENTOS
# ============================================
@app.route('/api/alimentos', methods=['GET'])
def get_alimentos():
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
        flash('No tienes permisos para acceder a esta pagina', 'danger')
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
        flash('No tienes permisos para acceder a esta pagina', 'danger')
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
# RUTAS DE PACIENTES - VISTAS
# ============================================
@app.route('/dashboard/nutritionist/patient/new')
@login_required
def patient_intake_form():
    """Crear nuevo paciente y redirigir a su ficha"""
    if current_user.user_type != 'nutricionista':
        flash('No tienes permisos para acceder a esta pagina', 'danger')
        return redirect(url_for('dashboard'))
    
    try:
        last_ficha = PatientFile.query.filter_by(
            nutricionista_id=current_user.id
        ).order_by(PatientFile.ficha_numero.desc()).first()
        
        next_ficha_numero = (last_ficha.ficha_numero or 0) + 1 if last_ficha else 1
        
        new_patient = PatientFile(
            nutricionista_id=current_user.id,
            ficha_numero=next_ficha_numero,
            nombre='Nuevo Paciente',
            sexo='',
            fecha_nacimiento=None,
            motivo_consulta=''
        )
        
        db.session.add(new_patient)
        db.session.commit()
        
        log_debug(f"[OK] Paciente borrador creado: ID {new_patient.id}, Ficha #{new_patient.ficha_numero}")
        
        return redirect(f'/dashboard/nutritionist/patient/{new_patient.id}')
        
    except Exception as e:
        db.session.rollback()
        log_debug(f"[ERROR] Creando paciente borrador: {str(e)}")
        flash('Error al crear nuevo paciente', 'danger')
        return redirect(url_for('nutritionist_dashboard'))


@app.route('/dashboard/nutritionist/patients')
@login_required
def patient_list():
    """Vista de lista de pacientes"""
    if current_user.user_type != 'nutricionista':
        flash('No tienes permisos para acceder a esta pagina', 'danger')
        return redirect(url_for('dashboard'))
    
    return render_template('patient_list.html')


@app.route('/dashboard/nutritionist/patient/<int:patient_id>')
@login_required
def patient_file_view(patient_id):
    """Vista de ficha de paciente"""
    try:
        if current_user.user_type != 'nutricionista':
            flash('No tienes permisos para acceder a esta pagina', 'danger')
            return redirect(url_for('dashboard'))
        
        patient = PatientFile.query.filter_by(
            id=patient_id,
            nutricionista_id=current_user.id
        ).first()
        
        if not patient:
            flash('Paciente no encontrado', 'danger')
            return redirect(url_for('patient_list'))
        
        try:
            edad_calculada = patient.calcular_edad()
        except Exception as e:
            print(f"[WARN] Error calculando edad: {e}")
            edad_calculada = None
        
        return render_template('patient_file.html', patient=patient, edad_calculada=edad_calculada)
    
    except Exception as e:
        print(f"[ERROR] en patient_file_view({patient_id}): {str(e)}")
        traceback.print_exc()
        flash(f'Error al cargar la ficha: {str(e)}', 'danger')
        return redirect(url_for('patient_displayer'))


@app.route('/patient-displayer')
@login_required
def patient_displayer():
    if current_user.user_type != 'nutricionista':
        flash('No tienes permisos para acceder a esta pagina', 'danger')
        return redirect(url_for('dashboard'))
    
    return render_template('patient-displayer.html')

# ============================================
# API DE PACIENTES
# ============================================
@app.route('/api/patients', methods=['GET'])
@login_required
def list_patients_api():
    """Listar todos los pacientes del nutricionista - CON ORDENAMIENTO"""
    if current_user.user_type != 'nutricionista':
        return jsonify({'error': 'No autorizado'}), 403
    
    try:
        # Parametros
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 12, type=int)
        search = request.args.get('search', '').strip()
        sort_by = request.args.get('sort_by', 'created_at')
        sort_order = request.args.get('sort_order', 'desc')
        date_from = request.args.get('date_from', '')
        date_to = request.args.get('date_to', '')
        active_only = request.args.get('active', 'true').lower() == 'true'
        
        # Validacion
        if page < 1:
            page = 1
        if per_page < 1 or per_page > 100:
            per_page = 12
        
        # Query base
        query = PatientFile.query.filter_by(nutricionista_id=current_user.id)
        
        # Filtro: solo pacientes activos
        if active_only and hasattr(PatientFile, 'is_active'):
            query = query.filter_by(is_active=True)
        
        # Busqueda
        if search:
            if search.isdigit():
                query = query.filter(
                    or_(
                        PatientFile.nombre.ilike(f'%{search}%'),
                        PatientFile.ficha_numero == int(search)
                    )
                )
            else:
                query = query.filter(PatientFile.nombre.ilike(f'%{search}%'))
        
        # Filtro por fecha
        if date_from:
            try:
                from_date = datetime.strptime(date_from, '%Y-%m-%d')
                query = query.filter(PatientFile.created_at >= from_date)
            except:
                pass
        
        if date_to:
            try:
                to_date = datetime.strptime(date_to, '%Y-%m-%d')
                to_date = to_date.replace(hour=23, minute=59, second=59)
                query = query.filter(PatientFile.created_at <= to_date)
            except:
                pass
        
        # Ordenamiento
        sort_column = None
        if sort_by == 'ficha_numero':
            sort_column = PatientFile.ficha_numero
        elif sort_by == 'nombre':
            sort_column = PatientFile.nombre
        elif sort_by == 'updated_at':
            sort_column = PatientFile.updated_at
        elif sort_by == 'fecha_nacimiento':
            sort_column = PatientFile.fecha_nacimiento
        else:
            sort_column = PatientFile.created_at
        
        if sort_column is not None:
            if sort_order == 'asc':
                query = query.order_by(sort_column.asc())
            else:
                query = query.order_by(sort_column.desc())
        
        # Paginacion
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        # Helper para formatear fechas
        def format_date(date_obj):
            if date_obj is None:
                return None
            if isinstance(date_obj, str):
                return date_obj
            return date_obj.isoformat() if hasattr(date_obj, 'isoformat') else str(date_obj)
        
        # Construir respuesta
        patients = []
        for p in pagination.items:
            patient_data = {
                'id': p.id,
                'ficha_numero': p.ficha_numero or p.id,
                'numero_ficha': p.ficha_numero or p.id,  # Alias
                'nombre': p.nombre,
                'sexo': p.sexo,
                'edad': p.calcular_edad() if hasattr(p, 'calcular_edad') else None,
                'peso_kg': float(p.peso_kg) if p.peso_kg else None,
                'talla_m': float(p.talla_m) if p.talla_m else None,
                'imc': float(p.imc) if p.imc else None,
                'porcentaje_grasa': float(p.porcentaje_grasa) if p.porcentaje_grasa else None,
                # Campos nutricionales
                'get_kcal': float(p.get_kcal) if p.get_kcal else None,
                'proteinas_g': float(p.proteinas_g) if p.proteinas_g else None,
                'carbohidratos_g': float(p.carbohidratos_g) if p.carbohidratos_g else None,
                'grasas_g': float(p.grasas_g) if p.grasas_g else None,
                # Campos para verificar datos disponibles
                'registro_24h': p.registro_24h if hasattr(p, 'registro_24h') else None,
                'frecuencia_consumo': p.frecuencia_consumo if hasattr(p, 'frecuencia_consumo') else None,
                'objetivos': p.objetivos if hasattr(p, 'objetivos') else None,
                # Fechas
                'fecha_nacimiento': format_date(p.fecha_nacimiento) if hasattr(p, 'fecha_nacimiento') else None,
                'fecha_atencion': format_date(p.fecha_atencion) if hasattr(p, 'fecha_atencion') else None,
                'motivo_consulta': p.motivo_consulta[:100] + '...' if p.motivo_consulta and len(p.motivo_consulta) > 100 else p.motivo_consulta,
                'created_at': p.created_at.strftime('%Y-%m-%d') if p.created_at else None,
                'updated_at': p.updated_at.strftime('%Y-%m-%d %H:%M') if p.updated_at else None,
            }
            patients.append(patient_data)
        
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
        print(f"[ERROR] listando pacientes: {str(e)}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/patients/<int:patient_id>', methods=['GET'])
@login_required
def get_patient(patient_id):
    """Obtener un paciente especifico"""
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


@app.route('/api/patients', methods=['POST'])
@csrf.exempt
@login_required
def create_patient():
    """Crear nuevo paciente via API"""
    if current_user.user_type != 'nutricionista':
        return jsonify({'error': 'No autorizado'}), 403
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No se recibieron datos'}), 400
        
        log_debug(f"[INFO] Creando paciente con datos: {list(data.keys())}")
        
        last_ficha = PatientFile.query.filter_by(
            nutricionista_id=current_user.id
        ).order_by(PatientFile.ficha_numero.desc()).first()
        
        next_ficha_numero = (last_ficha.ficha_numero or 0) + 1 if last_ficha else 1
        
        def parse_fecha_atencion(fecha_str):
            if not fecha_str:
                return None
            formatos = ['%Y-%m-%dT%H:%M', '%Y-%m-%d %H:%M', '%Y-%m-%d', '%d/%m/%Y']
            for fmt in formatos:
                try:
                    return datetime.strptime(fecha_str, fmt)
                except ValueError:
                    continue
            return None
        
        patient = PatientFile(
            nutricionista_id=current_user.id,
            ficha_numero=next_ficha_numero,
            nombre=data.get('nombre', ''),
            fecha_nacimiento=data.get('fecha_nacimiento'),
            fecha_atencion=parse_fecha_atencion(data.get('fecha_atencion')),
            sexo=data.get('sexo'),
            email=data.get('email'),
            telefono=data.get('telefono'),
            motivo_consulta=data.get('motivo_consulta', ''),
            diagnosticos=data.get('diagnosticos', ''),
            medicamentos=data.get('medicamentos', ''),
            suplementos=data.get('suplementos', ''),
            objetivos=data.get('objetivos', ''),
            profesion=data.get('profesion', ''),
            ocupacion=data.get('ocupacion', ''),
            teletrabajo=data.get('teletrabajo', ''),
            quien_cocina=data.get('quien_cocina', ''),
            con_quien_vive=data.get('con_quien_vive', ''),
            donde_come=data.get('donde_come', ''),
            talla_m=float(data['talla_m']) if data.get('talla_m') else None,
            peso_kg=float(data['peso_kg']) if data.get('peso_kg') else None,
            pliegue_bicipital=float(data['pliegue_bicipital']) if data.get('pliegue_bicipital') else None,
            pliegue_tricipital=float(data['pliegue_tricipital']) if data.get('pliegue_tricipital') else None,
            pliegue_subescapular=float(data['pliegue_subescapular']) if data.get('pliegue_subescapular') else None,
            pliegue_supracrestideo=float(data['pliegue_supracrestideo']) if data.get('pliegue_supracrestideo') else None,
            perimetro_brazo=float(data['perimetro_brazo']) if data.get('perimetro_brazo') else None,
            perimetro_cintura=float(data['perimetro_cintura']) if data.get('perimetro_cintura') else None,
            perimetro_cadera=float(data['perimetro_cadera']) if data.get('perimetro_cadera') else None,
            perimetro_pantorrilla=float(data['perimetro_pantorrilla']) if data.get('perimetro_pantorrilla') else None,
            horas_sueno=int(data['horas_sueno']) if data.get('horas_sueno') else None,
            calidad_sueno=int(data['calidad_sueno']) if data.get('calidad_sueno') else None,
            observaciones_sueno=data.get('observaciones_sueno', ''),
            nivel_estres=int(data['nivel_estres']) if data.get('nivel_estres') else None,
            gatillantes_estres=data.get('gatillantes_estres', ''),
            manejo_estres=data.get('manejo_estres', ''),
            consumo_alcohol=data.get('consumo_alcohol', ''),
            tipo_alcohol=data.get('tipo_alcohol', ''),
            tabaco=data.get('tabaco', ''),
            drogas=data.get('drogas', ''),
            actividad_fisica=data.get('actividad_fisica', ''),
            tipo_ejercicio=data.get('tipo_ejercicio', ''),
            duracion_ejercicio=data.get('duracion_ejercicio', ''),
            frecuencia_evacuacion=data.get('frecuencia_evacuacion', ''),
            reflujo=data.get('reflujo', ''),
            reflujo_alimento=data.get('reflujo_alimento', ''),
            hinchazon=data.get('hinchazon', ''),
            hinchazon_alimento=data.get('hinchazon_alimento', ''),
            tiene_alergias=data.get('tiene_alergias', ''),
            alergias_alimento=data.get('alergias_alimento', ''),
            registro_24h=data.get('registro_24h', '{}'),
            frecuencia_consumo=data.get('frecuencia_consumo', '{}')
        )
        
        patient.calcular_todo()
        
        db.session.add(patient)
        db.session.commit()
        
        log_debug(f"[OK] Paciente creado: ID={patient.id}, Ficha={patient.ficha_numero}")
        
        return jsonify({
            'success': True,
            'patient_id': patient.id,
            'ficha_numero': patient.ficha_numero,
            'message': f'Paciente {patient.nombre} creado exitosamente'
        }), 201
    
    except Exception as e:
        db.session.rollback()
        log_debug(f"[ERROR] Creando paciente: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/patients/<int:patient_id>', methods=['PUT'])
@csrf.exempt
@login_required
def update_patient(patient_id):
    """Actualizar paciente existente"""
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
        if not data:
            return jsonify({'error': 'No se recibieron datos'}), 400
        
        log_debug(f"[INFO] Actualizando paciente {patient_id}: {list(data.keys())}")
        
        # Campos de texto (horas_sueno es String en el modelo)
        campos_texto = ['nombre', 'fecha_nacimiento', 'sexo', 'email', 'telefono',
                       'motivo_consulta', 'diagnosticos', 'medicamentos', 'suplementos',
                       'objetivos', 'profesion', 'ocupacion', 'teletrabajo', 'quien_cocina',
                       'con_quien_vive', 'donde_come', 'horas_sueno', 'observaciones_sueno', 
                       'gatillantes_estres', 'manejo_estres', 'consumo_alcohol', 'tipo_alcohol', 
                       'tabaco', 'drogas', 'actividad_fisica', 'tipo_ejercicio', 'duracion_ejercicio',
                       'frecuencia_evacuacion', 'reflujo', 'reflujo_alimento', 'hinchazon',
                       'hinchazon_alimento', 'tiene_alergias', 'alergias_alimento',
                       'registro_24h', 'frecuencia_consumo',
                       'diagnostico_nutricional', 'objetivos_nutricionales', 'indicaciones', 'notas_seguimiento']
        
        for campo in campos_texto:
            if campo in data:
                setattr(patient, campo, data[campo])
        
        # Campos float (incluye peso_ideal)
        campos_float = ['talla_m', 'peso_kg', 'peso_ideal', 'pliegue_bicipital', 'pliegue_tricipital',
                       'pliegue_subescapular', 'pliegue_supracrestideo', 'perimetro_brazo',
                       'perimetro_cintura', 'perimetro_cadera', 'perimetro_pantorrilla', 'perimetro_muneca',
                       # Bioquimicos
                       'glucosa_ayunas', 'hemoglobina_glicada', 'colesterol_total', 
                       'colesterol_hdl', 'colesterol_ldl', 'trigliceridos',
                       'hemoglobina', 'hematocrito', 'ferritina', 'vitamina_d', 'vitamina_b12',
                       'acido_urico', 'creatinina', 'albumina', 'tsh',
                       # Porcentajes macros
                       'proteinas_porcentaje', 'carbohidratos_porcentaje', 'grasas_porcentaje']
        
        for campo in campos_float:
            if campo in data:
                valor = data[campo]
                if valor is not None and valor != '':
                    setattr(patient, campo, float(valor))
                else:
                    setattr(patient, campo, None)
        
        # Campos int (horas_sueno ya no va aqui, es String)
        campos_int = ['calidad_sueno', 'nivel_estres', 'presion_sistolica', 'presion_diastolica', 'frecuencia_cardiaca']
        for campo in campos_int:
            if campo in data:
                valor = data[campo]
                if valor is not None and valor != '':
                    setattr(patient, campo, int(valor))
                else:
                    setattr(patient, campo, None)
        
        # Fecha de atencion
        if 'fecha_atencion' in data:
            fecha_str = data['fecha_atencion']
            if fecha_str:
                formatos = ['%Y-%m-%dT%H:%M', '%Y-%m-%d %H:%M', '%Y-%m-%d']
                for fmt in formatos:
                    try:
                        patient.fecha_atencion = datetime.strptime(fecha_str, fmt)
                        break
                    except ValueError:
                        continue
            else:
                patient.fecha_atencion = None
        
        # Fecha proxima cita
        if 'fecha_proxima_cita' in data:
            fecha_str = data['fecha_proxima_cita']
            if fecha_str:
                formatos = ['%Y-%m-%dT%H:%M', '%Y-%m-%d %H:%M', '%Y-%m-%d']
                for fmt in formatos:
                    try:
                        patient.fecha_proxima_cita = datetime.strptime(fecha_str, fmt)
                        break
                    except ValueError:
                        continue
            else:
                patient.fecha_proxima_cita = None
        
        patient.calcular_todo()
        db.session.commit()
        
        log_debug(f"[OK] Paciente {patient_id} actualizado")
        
        return jsonify({
            'success': True,
            'message': 'Paciente actualizado exitosamente'
        })
    
    except Exception as e:
        db.session.rollback()
        log_debug(f"[ERROR] Actualizando paciente {patient_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/patients/<int:patient_id>', methods=['DELETE'])
@login_required
@csrf.exempt
def delete_patient(patient_id):
    """Eliminar paciente"""
    if current_user.user_type != 'nutricionista':
        return jsonify({'error': 'No autorizado'}), 403
    
    try:
        patient = PatientFile.query.filter_by(
            id=patient_id,
            nutricionista_id=current_user.id
        ).first()
        
        if not patient:
            return jsonify({'error': 'Paciente no encontrado'}), 404
        
        nombre = patient.nombre
        db.session.delete(patient)
        db.session.commit()
        
        log_debug(f"[OK] Paciente eliminado: {nombre} (ID: {patient_id})")
        
        return jsonify({
            'success': True,
            'message': f'Paciente {nombre} eliminado exitosamente'
        })
    
    except Exception as e:
        db.session.rollback()
        log_debug(f"[ERROR] Eliminando paciente {patient_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/patient/save-draft', methods=['POST'])
@csrf.exempt
@login_required
def save_patient_draft():
    """Guardar borrador de paciente"""
    if current_user.user_type != 'nutricionista':
        return jsonify({'error': 'No autorizado'}), 403
    
    try:
        data = request.form.to_dict()
        patient_id = data.get('patient_id')
        
        def parse_fecha_atencion(fecha_str):
            if not fecha_str:
                return None
            try:
                return datetime.strptime(fecha_str, '%Y-%m-%dT%H:%M')
            except ValueError:
                log_debug(f"[WARN] Error parseando fecha_atencion: {fecha_str}")
                return None
        
        if patient_id:
            patient = PatientFile.query.filter_by(
                id=patient_id,
                nutricionista_id=current_user.id
            ).first()
            
            if not patient:
                return jsonify({'error': 'Paciente no encontrado'}), 404
            
            for field in ['nombre', 'fecha_nacimiento', 'sexo', 'motivo_consulta']:
                if field in data:
                    setattr(patient, field, data[field])
            
            if 'fecha_atencion' in data:
                patient.fecha_atencion = parse_fecha_atencion(data['fecha_atencion'])
            
            if 'talla' in data and data['talla']:
                patient.talla_m = float(data['talla'])
            if 'peso' in data and data['peso']:
                patient.peso_kg = float(data['peso'])
            
            for field in ['diagnosticos', 'medicamentos', 'suplementos', 'objetivos']:
                if field in data:
                    value = data[field]
                    if isinstance(value, str) and value:
                        setattr(patient, field, value if value.startswith('[') else f'["{value}"]')
            
            patient.calcular_todo()
            db.session.commit()
            
            return jsonify({
                'success': True,
                'patient_id': patient.id,
                'message': 'Borrador actualizado'
            })
        
        else:
            last_ficha = PatientFile.query.filter_by(
                nutricionista_id=current_user.id
            ).order_by(PatientFile.ficha_numero.desc()).first()
            
            next_ficha_numero = (last_ficha.ficha_numero or 0) + 1 if last_ficha else 1
            
            fecha_atencion_obj = parse_fecha_atencion(data.get('fecha_atencion'))
            
            new_patient = PatientFile(
                nutricionista_id=current_user.id,
                ficha_numero=next_ficha_numero,
                nombre=data.get('nombre', 'Borrador sin nombre'),
                fecha_nacimiento=data.get('fecha_nacimiento'),
                fecha_atencion=fecha_atencion_obj,
                sexo=data.get('sexo'),
                motivo_consulta=data.get('motivo_consulta', ''),
                talla_m=float(data.get('talla')) if data.get('talla') else None,
                peso_kg=float(data.get('peso')) if data.get('peso') else None
            )
            
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
        log_debug(f"[ERROR] en save_patient_draft: {str(e)}")
        return jsonify({'error': str(e)}), 500

# ============================================
# RUTAS WTFORMS PARA PACIENTES
# ============================================
# CREAR PACIENTE CON WTFORMS - CORREGIDO
# ============================================
@app.route('/nutritionist/patient/new-wtf', methods=['GET', 'POST'])
@login_required
def patient_intake_wtf():
    """Crear nuevo paciente usando WTForms - VERSION CORREGIDA"""
    if current_user.user_type != 'nutricionista':
        flash('No tienes permisos para acceder a esta pagina', 'danger')
        return redirect(url_for('dashboard'))
    
    form = PatientIntakeForm()
    
    if request.method == 'POST':
        # ValidaciÃ³n mÃ­nima: solo nombre es requerido
        nombre = request.form.get('nombre', '').strip()
        if not nombre:
            flash('El nombre del paciente es obligatorio', 'danger')
            return render_template('patient_intake_wtf.html', form=form, is_edit=False)
        
        try:
            # Crear nuevo paciente
            patient = PatientFile(
                nutricionista_id=current_user.id,
                nombre=nombre,
                fecha_atencion=datetime.now()
            )
            
            # =========================================
            # 1. CAMPOS DE TEXTO (desde request.form directamente)
            # =========================================
            campos_texto = ['sexo', 'email', 'telefono', 'motivo_consulta',
                           'profesion', 'ocupacion', 'teletrabajo',
                           'horas_sueno', 'observaciones_sueno', 'gatillantes_estres', 'manejo_estres',
                           'consumo_alcohol', 'tabaco', 'drogas', 'actividad_fisica',
                           'tipo_ejercicio', 'duracion_ejercicio',
                           'frecuencia_evacuacion', 'reflujo', 'reflujo_alimento',
                           'hinchazon', 'hinchazon_alimento', 'tiene_alergias', 'alergias_alimento',
                           'alergias', 'intolerancias',
                           'diagnostico_nutricional', 'objetivos_nutricionales', 'indicaciones', 'notas_seguimiento',
                           'tipo_pan', 'cuales_frutas', 'cuales_frutos_secos']
            
            for campo in campos_texto:
                if hasattr(patient, campo):
                    valor = request.form.get(campo, '').strip()
                    setattr(patient, campo, valor if valor else None)
            
            # =========================================
            # 2. FECHA DE NACIMIENTO
            # =========================================
            fecha_nac = request.form.get('fecha_nacimiento', '')
            if fecha_nac:
                patient.fecha_nacimiento = fecha_nac
            
            # =========================================
            # 3. FECHA PRÃ"XIMA CITA - CORREGIDO
            # =========================================
            fecha_cita = request.form.get('fecha_proxima_cita', '')
            if fecha_cita:
                patient.fecha_proxima_cita = parse_datetime_field(fecha_cita)
            
            # =========================================
            # 4. CAMPOS FLOAT (desde request.form directamente)
            # =========================================
            campos_float = ['talla_m', 'peso_kg', 'peso_ideal',
                           'pliegue_bicipital', 'pliegue_tricipital',
                           'pliegue_subescapular', 'pliegue_supracrestideo',
                           'perimetro_brazo', 'perimetro_cintura', 'perimetro_cadera',
                           'perimetro_pantorrilla', 'perimetro_muneca',
                           # BioquÃ­micos
                           'glucosa_ayunas', 'hemoglobina_glicada', 'colesterol_total',
                           'colesterol_hdl', 'colesterol_ldl', 'trigliceridos',
                           'hemoglobina', 'hematocrito', 'ferritina', 'vitamina_d', 'vitamina_b12',
                           'acido_urico', 'creatinina', 'albumina', 'tsh']
            
            for campo in campos_float:
                if hasattr(patient, campo):
                    valor = request.form.get(campo, '')
                    if valor:
                        try:
                            setattr(patient, campo, float(valor))
                        except (ValueError, TypeError):
                            pass
            
            # =========================================
            # 5. PORCENTAJES DE MACROS (desde request.form)
            # =========================================
            macro_fields = ['proteinas_porcentaje', 'carbohidratos_porcentaje', 'grasas_porcentaje', 'liquido_porcentaje']
            
            # DEBUG: Mostrar valores recibidos
            print("\n" + "="*50)
            print("DEBUG MACROS - Valores recibidos del formulario:")
            print("="*50)
            for campo in macro_fields:
                valor = request.form.get(campo)
                print(f"  {campo}: {valor}")
            print("="*50 + "\n")
            
            for campo in macro_fields:
                valor = request.form.get(campo)
                if valor and hasattr(patient, campo):
                    try:
                        setattr(patient, campo, float(valor))
                        print(f"DEBUG: Guardado {campo} = {float(valor)}")
                    except (ValueError, TypeError) as e:
                        print(f"DEBUG ERROR: No se pudo guardar {campo}: {e}")
            
            # Calcular liquido en ml basado en peso
            if patient.peso_kg and patient.liquido_porcentaje:
                liquido_base = patient.peso_kg * 35  # 35ml por kg
                patient.liquido_ml = round(liquido_base * (patient.liquido_porcentaje / 5))
                print(f"DEBUG: Calculado liquido_ml = {patient.liquido_ml}")
            
            # =========================================
            # 6. CAMPOS INT (desde request.form directamente)
            # =========================================
            campos_int = ['calidad_sueno', 'nivel_estres', 'presion_sistolica',
                         'presion_diastolica', 'frecuencia_cardiaca']
            
            for campo in campos_int:
                if hasattr(patient, campo):
                    valor = request.form.get(campo, '')
                    if valor:
                        try:
                            setattr(patient, campo, int(valor))
                        except (ValueError, TypeError):
                            pass
            
            # =========================================
            # 7. CAMPOS DE LISTA (SelectMultiple) - desde request.form
            # =========================================
            campos_lista = ['quien_cocina', 'con_quien_vive', 'donde_come', 'tipo_alcohol']
            
            for campo in campos_lista:
                if hasattr(patient, campo):
                    valores = request.form.getlist(campo)
                    if valores:
                        setattr(patient, campo, ', '.join(valores))
                    else:
                        # Intentar como campo simple
                        valor = request.form.get(campo, '')
                        if valor:
                            setattr(patient, campo, valor)
            
            # =========================================
            # 7b. CAMPOS DE TEXTO LIBRE (antes SelectMultiple)
            # =========================================
            for campo in ['diagnosticos', 'medicamentos', 'suplementos']:
                if hasattr(patient, campo):
                    valor = request.form.get(campo, '').strip()
                    setattr(patient, campo, valor if valor else None)
            
            # =========================================
            # 8. OBJETIVOS (desde checkboxes)
            # =========================================
            objetivos_lista = request.form.getlist('objetivos_lista')
            if objetivos_lista:
                patient.objetivos = json.dumps(objetivos_lista)
            else:
                # Fallback al campo hidden
                objetivos_raw = request.form.get('objetivos', '')
                if objetivos_raw:
                    patient.objetivos = objetivos_raw
            
            # =========================================
            # 9. FRECUENCIA DE CONSUMO (JSON)
            # =========================================
            frecuencia_raw = request.form.get('frecuencia_consumo', '')
            if frecuencia_raw:
                try:
                    json.loads(frecuencia_raw)
                    patient.frecuencia_consumo = frecuencia_raw
                except json.JSONDecodeError:
                    frecuencia_data = build_frecuencia_from_form(request.form)
                    if frecuencia_data:
                        patient.frecuencia_consumo = json.dumps(frecuencia_data)
            else:
                frecuencia_data = build_frecuencia_from_form(request.form)
                if frecuencia_data:
                    patient.frecuencia_consumo = json.dumps(frecuencia_data)
            
            # =========================================
            # 10. REGISTRO 24H (desde input hidden)
            # =========================================
            registro_24h_data = request.form.get('registro_24h_data')
            if registro_24h_data:
                try:
                    parsed_data = json.loads(registro_24h_data)
                    patient.registro_24h = parsed_data
                    print(f"DEBUG: Registro 24h guardado (nuevo paciente)")
                except json.JSONDecodeError as e:
                    print(f"DEBUG ERROR: registro_24h no es JSON válido: {e}")
            
            # =========================================
            # 11. CALCULAR Y GUARDAR
            # =========================================
            db.session.add(patient)
            db.session.flush()
            
            if hasattr(patient, 'calcular_todo'):
                patient.calcular_todo()
            elif hasattr(patient, 'calcular_imc'):
                patient.calcular_imc()
                if hasattr(patient, 'calcular_macronutrientes'):
                    patient.calcular_macronutrientes()
            
            db.session.commit()
            
            flash(f'Paciente {patient.nombre} creado exitosamente', 'success')
            return redirect(url_for('patient_edit_wtf', patient_id=patient.id))
            
        except Exception as e:
            db.session.rollback()
            print(f"[ERROR] Creando paciente WTF: {str(e)}")
            traceback.print_exc()
            flash(f'Error al crear paciente: {str(e)}', 'danger')
    
    return render_template('patient_intake_wtf.html', form=form, is_edit=False, patient=None)


# ============================================
# HELPER: PARSE DATETIME
# ============================================
def parse_datetime_field(value):
    """Convierte string datetime-local a objeto datetime de Python"""
    if not value:
        return None
    
    if isinstance(value, datetime):
        return value
    
    if isinstance(value, str):
        formats = [
            '%Y-%m-%dT%H:%M',
            '%Y-%m-%dT%H:%M:%S',
            '%Y-%m-%d %H:%M',
            '%Y-%m-%d %H:%M:%S',
            '%Y-%m-%d',
        ]
        for fmt in formats:
            try:
                return datetime.strptime(value, fmt)
            except ValueError:
                continue
    
    return None


# ============================================
# HELPER: BUILD FRECUENCIA FROM FORM
# ============================================
def build_frecuencia_from_form(form_data):
    """Construye el JSON de frecuencia de consumo desde campos individuales"""
    frecuencia_data = {}
    freq_fields = ['cereales_desayuno', 'arroz_pasta', 'pan', 'verduras', 'frutas',
                  'jugos', 'legumbres', 'carnes_blancas', 'carnes_rojas', 'huevo',
                  'pescado', 'cecinas', 'lacteos', 'aceite', 'frutos_secos',
                  'dulces', 'frituras', 'agua', 'cafe_te', 'bebidas_azucaradas']
    has_any = False
    for field in freq_fields:
        val = form_data.get(f'freq_{field}', None)
        if val is not None:
            has_any = True
            try:
                frecuencia_data[field] = int(val)
            except:
                frecuencia_data[field] = 0
    
    return frecuencia_data if has_any else None


# ============================================
# EDITAR PACIENTE CON WTFORMS - CORREGIDO
# ============================================
@app.route('/nutritionist/patient/<int:patient_id>/edit', methods=['GET', 'POST'])
@login_required
def patient_edit_wtf(patient_id):
    """Editar paciente existente usando WTForms - VERSION CORREGIDA"""
    if current_user.user_type != 'nutricionista':
        flash('No tienes permisos para acceder a esta pagina', 'danger')
        return redirect(url_for('dashboard'))
    
    patient = PatientFile.query.filter_by(
        id=patient_id,
        nutricionista_id=current_user.id
    ).first()
    
    if not patient:
        flash('Paciente no encontrado', 'danger')
        return redirect(url_for('patient_list'))
    
    form = PatientFileForm()
    
    if request.method == 'POST':
        # ValidaciÃ³n mÃ­nima: nombre es requerido
        nombre = request.form.get('nombre', '').strip()
        if not nombre:
            flash('El nombre del paciente es obligatorio', 'danger')
            populate_form_from_patient(form, patient)
            return render_template('patient_intake_wtf.html', form=form, is_edit=True, patient=patient)
        
        try:
            # =========================================
            # 1. CAMPOS DE TEXTO (desde request.form)
            # =========================================
            campos_texto = ['nombre', 'sexo', 'email', 'telefono', 'motivo_consulta',
                           'profesion', 'ocupacion', 'teletrabajo',
                           'horas_sueno', 'observaciones_sueno', 'gatillantes_estres', 'manejo_estres',
                           'consumo_alcohol', 'tabaco', 'drogas', 'actividad_fisica',
                           'tipo_ejercicio', 'duracion_ejercicio',
                           'frecuencia_evacuacion', 'reflujo', 'reflujo_alimento',
                           'hinchazon', 'hinchazon_alimento', 'tiene_alergias', 'alergias_alimento',
                           'alergias', 'intolerancias',
                           'diagnostico_nutricional', 'objetivos_nutricionales', 'indicaciones', 'notas_seguimiento',
                           'tipo_pan', 'cuales_frutas', 'cuales_frutos_secos']
            
            for campo in campos_texto:
                if hasattr(patient, campo):
                    valor = request.form.get(campo, '').strip()
                    setattr(patient, campo, valor if valor else None)
            
            # =========================================
            # 2. FECHA DE NACIMIENTO
            # =========================================
            fecha_nac = request.form.get('fecha_nacimiento', '')
            if fecha_nac:
                patient.fecha_nacimiento = fecha_nac
            
            # =========================================
            # 3. FECHA PRÃ"XIMA CITA - CORREGIDO
            # =========================================
            fecha_cita = request.form.get('fecha_proxima_cita', '')
            if fecha_cita:
                patient.fecha_proxima_cita = parse_datetime_field(fecha_cita)
            else:
                patient.fecha_proxima_cita = None
            
            # =========================================
            # 4. CAMPOS FLOAT (desde request.form)
            # =========================================
            campos_float = ['talla_m', 'peso_kg', 'peso_ideal', 
                           'pliegue_bicipital', 'pliegue_tricipital',
                           'pliegue_subescapular', 'pliegue_supracrestideo', 
                           'perimetro_brazo', 'perimetro_cintura', 'perimetro_cadera', 
                           'perimetro_pantorrilla', 'perimetro_muneca',
                           'glucosa_ayunas', 'hemoglobina_glicada', 'colesterol_total', 
                           'colesterol_hdl', 'colesterol_ldl', 'trigliceridos',
                           'hemoglobina', 'hematocrito', 'ferritina', 'vitamina_d', 'vitamina_b12',
                           'acido_urico', 'creatinina', 'albumina', 'tsh']
            
            for campo in campos_float:
                if hasattr(patient, campo):
                    valor = request.form.get(campo, '')
                    if valor:
                        try:
                            setattr(patient, campo, float(valor))
                        except (ValueError, TypeError):
                            pass
                    else:
                        setattr(patient, campo, None)
            
            # =========================================
            # 5. PORCENTAJES DE MACROS
            # =========================================
            macro_fields = ['proteinas_porcentaje', 'carbohidratos_porcentaje', 'grasas_porcentaje', 'liquido_porcentaje']
            
            # DEBUG: Mostrar valores recibidos
            print("\n" + "="*50)
            print("DEBUG MACROS [EDIT] - Valores recibidos:")
            print("="*50)
            for campo in macro_fields:
                valor = request.form.get(campo)
                print(f"  {campo}: {valor}")
            print("="*50 + "\n")
            
            for campo in macro_fields:
                valor = request.form.get(campo)
                if valor and hasattr(patient, campo):
                    try:
                        setattr(patient, campo, float(valor))
                        print(f"DEBUG: Guardado {campo} = {float(valor)}")
                    except (ValueError, TypeError) as e:
                        print(f"DEBUG ERROR: No se pudo guardar {campo}: {e}")
            
            # Calcular liquido en ml basado en peso
            if patient.peso_kg and patient.liquido_porcentaje:
                liquido_base = patient.peso_kg * 35  # 35ml por kg
                patient.liquido_ml = round(liquido_base * (patient.liquido_porcentaje / 5))
                print(f"DEBUG: Calculado liquido_ml = {patient.liquido_ml}")
            
            # =========================================
            # 6. CAMPOS INT (desde request.form)
            # =========================================
            campos_int = ['calidad_sueno', 'nivel_estres', 'presion_sistolica', 
                         'presion_diastolica', 'frecuencia_cardiaca']
            for campo in campos_int:
                if hasattr(patient, campo):
                    valor = request.form.get(campo, '')
                    if valor:
                        try:
                            setattr(patient, campo, int(valor))
                        except (ValueError, TypeError):
                            pass
                    else:
                        setattr(patient, campo, None)
            
            # =========================================
            # 7. CAMPOS DE LISTA (SelectMultiple) - desde request.form
            # =========================================
            campos_lista = ['quien_cocina', 'con_quien_vive', 'donde_come', 'tipo_alcohol']
            
            for campo in campos_lista:
                if hasattr(patient, campo):
                    valores = request.form.getlist(campo)
                    if valores:
                        setattr(patient, campo, ', '.join(valores))
                    else:
                        valor = request.form.get(campo, '')
                        if valor:
                            setattr(patient, campo, valor)
                        else:
                            setattr(patient, campo, None)
            
            # =========================================
            # 7b. CAMPOS DE TEXTO LIBRE (antes SelectMultiple)
            # =========================================
            for campo in ['diagnosticos', 'medicamentos', 'suplementos']:
                if hasattr(patient, campo):
                    valor = request.form.get(campo, '').strip()
                    setattr(patient, campo, valor if valor else None)
            
            # =========================================
            # 8. OBJETIVOS (desde checkboxes)
            # =========================================
            objetivos_lista = request.form.getlist('objetivos_lista')
            if objetivos_lista:
                patient.objetivos = json.dumps(objetivos_lista)
            else:
                # Fallback al campo hidden
                objetivos_raw = request.form.get('objetivos', '')
                if objetivos_raw:
                    patient.objetivos = objetivos_raw
            
            # =========================================
            # 9. FRECUENCIA DE CONSUMO (JSON string)
            # =========================================
            frecuencia_raw = request.form.get('frecuencia_consumo', '')
            if frecuencia_raw:
                try:
                    json.loads(frecuencia_raw)
                    patient.frecuencia_consumo = frecuencia_raw
                except json.JSONDecodeError:
                    frecuencia_data = build_frecuencia_from_form(request.form)
                    if frecuencia_data:
                        patient.frecuencia_consumo = json.dumps(frecuencia_data)
            else:
                frecuencia_data = build_frecuencia_from_form(request.form)
                if frecuencia_data:
                    patient.frecuencia_consumo = json.dumps(frecuencia_data)
            
            # =========================================
            # 10. REGISTRO 24H (desde input hidden)
            # =========================================
            registro_24h_data = request.form.get('registro_24h_data')
            print(f"\n{'='*50}")
            print(f"DEBUG REGISTRO 24H [EDIT]")
            print(f"{'='*50}")
            print(f"  Recibido: {registro_24h_data[:200] if registro_24h_data else '(vacío)'}...")
            
            if registro_24h_data and registro_24h_data.strip():
                try:
                    # Validar que es JSON válido
                    parsed_data = json.loads(registro_24h_data)
                    patient.registro_24h = parsed_data
                    
                    # Mostrar resumen
                    meals = ['desayuno', 'colacion1', 'almuerzo', 'colacion2', 'cena']
                    for meal in meals:
                        items = parsed_data.get(meal, [])
                        if items:
                            print(f"  {meal}: {len(items)} alimentos")
                    
                    if 'totales' in parsed_data:
                        print(f"  Totales: {parsed_data['totales']}")
                    
                    print(f"✅ Registro 24h guardado correctamente")
                except json.JSONDecodeError as e:
                    print(f"❌ ERROR JSON: {e}")
                    print(f"   Valor recibido: {registro_24h_data[:100]}")
            else:
                print(f"  ℹ️ No hay datos de registro 24h para guardar")
            print(f"{'='*50}\n")
            
            # =========================================
            # 11. RECALCULAR (preservando macros personalizados)
            # =========================================
            if hasattr(patient, 'calcular_todo'):
                patient.calcular_todo()  # Ya usa valores existentes
            elif hasattr(patient, 'calcular_imc'):
                patient.calcular_imc()
                if hasattr(patient, 'calcular_macronutrientes'):
                    # Usar valores existentes
                    prot = patient.proteinas_porcentaje or 20
                    carb = patient.carbohidratos_porcentaje or 50
                    gras = patient.grasas_porcentaje or 25
                    liq = patient.liquido_porcentaje or 5
                    patient.calcular_macronutrientes(prot, carb, gras, liq)
            
            # DEBUG: Verificar valores antes del commit
            print(f"DEBUG PRE-COMMIT: P={patient.proteinas_porcentaje}, C={patient.carbohidratos_porcentaje}, G={patient.grasas_porcentaje}, L={patient.liquido_porcentaje}")
            
            # =========================================
            # 12. GUARDAR
            # =========================================
            db.session.commit()
            
            print(f"DEBUG POST-COMMIT: Commit exitoso para paciente {patient.id}")
            
            flash(f'Paciente {patient.nombre} actualizado exitosamente', 'success')
            return redirect(url_for('patient_edit_wtf', patient_id=patient.id))
            
        except Exception as e:
            db.session.rollback()
            print(f"[ERROR] Actualizando paciente WTF: {str(e)}")
            traceback.print_exc()
            flash(f'Error al actualizar paciente: {str(e)}', 'danger')
    
    elif request.method == 'GET':
        populate_form_from_patient(form, patient)
    
    edad_calculada = None
    if hasattr(patient, 'calcular_edad'):
        try:
            edad_calculada = patient.calcular_edad()
        except:
            pass
    
    return render_template('patient_intake_wtf.html', 
                         form=form, 
                         is_edit=True, 
                         patient=patient,
                         edad_calculada=edad_calculada)


# ============================================
# POPULATE FORM FROM PATIENT - CORREGIDO
# ============================================
def populate_form_from_patient(form, patient):
    """Poblar formulario WTForms con datos del paciente - VERSION CORREGIDA"""
    
    # DEBUG: Mostrar valores de macros del paciente
    print("\n" + "="*50)
    print("DEBUG POPULATE - Valores del paciente en BD:")
    print("="*50)
    print(f"  proteinas_porcentaje: {patient.proteinas_porcentaje}")
    print(f"  carbohidratos_porcentaje: {patient.carbohidratos_porcentaje}")
    print(f"  grasas_porcentaje: {patient.grasas_porcentaje}")
    print(f"  liquido_porcentaje: {patient.liquido_porcentaje}")
    print("="*50 + "\n")
    
    # 1. CAMPOS DE TEXTO
    campos_texto = ['nombre', 'sexo', 'email', 'telefono', 'motivo_consulta',
                   'profesion', 'ocupacion', 'teletrabajo',
                   'horas_sueno', 'observaciones_sueno', 'gatillantes_estres', 'manejo_estres',
                   'consumo_alcohol', 'tabaco', 'drogas', 'actividad_fisica',
                   'tipo_ejercicio', 'duracion_ejercicio',
                   'frecuencia_evacuacion', 'reflujo', 'reflujo_alimento',
                   'hinchazon', 'hinchazon_alimento', 'tiene_alergias', 'alergias_alimento',
                   'alergias', 'intolerancias', 'fecha_examenes',
                   'diagnostico_nutricional', 'objetivos_nutricionales', 'indicaciones', 'notas_seguimiento',
                   'imc_categoria', 'riesgo_cardiovascular']
    
    for campo in campos_texto:
        if hasattr(form, campo) and hasattr(patient, campo):
            valor = getattr(patient, campo)
            if valor:
                getattr(form, campo).data = valor
    
    # 2. FECHA DE NACIMIENTO
    if hasattr(form, 'fecha_nacimiento') and patient.fecha_nacimiento:
        form.fecha_nacimiento.data = patient.fecha_nacimiento
    
    # 3. FECHA PRÃ"XIMA CITA
    if hasattr(form, 'fecha_proxima_cita') and hasattr(patient, 'fecha_proxima_cita'):
        if patient.fecha_proxima_cita:
            if isinstance(patient.fecha_proxima_cita, datetime):
                form.fecha_proxima_cita.data = patient.fecha_proxima_cita.strftime('%Y-%m-%dT%H:%M')
            else:
                form.fecha_proxima_cita.data = patient.fecha_proxima_cita
    
    # 4. CAMPOS FLOAT
    campos_float = ['talla_m', 'peso_kg', 'peso_ideal',
                   'pliegue_bicipital', 'pliegue_tricipital',
                   'pliegue_subescapular', 'pliegue_supracrestideo',
                   'perimetro_brazo', 'perimetro_cintura', 'perimetro_cadera',
                   'perimetro_pantorrilla', 'perimetro_muneca',
                   'glucosa_ayunas', 'hemoglobina_glicada', 'colesterol_total',
                   'colesterol_hdl', 'colesterol_ldl', 'trigliceridos',
                   'hemoglobina', 'hematocrito', 'ferritina', 'vitamina_d', 'vitamina_b12',
                   'acido_urico', 'creatinina', 'albumina', 'tsh',
                   'proteinas_porcentaje', 'carbohidratos_porcentaje', 'grasas_porcentaje', 'liquido_porcentaje',
                   'imc', 'porcentaje_grasa', 'masa_grasa_kg', 'masa_libre_grasa_kg',
                   'indice_cintura_cadera', 'geb_kcal', 'get_kcal',
                   'proteinas_g', 'carbohidratos_g', 'grasas_g', 'fibra_g', 'liquido_ml']
    
    for campo in campos_float:
        if hasattr(form, campo) and hasattr(patient, campo):
            valor = getattr(patient, campo)
            if valor is not None:
                try:
                    getattr(form, campo).data = float(valor)
                except:
                    pass
    
    # DEBUG: Verificar valores de macros en el formulario
    print("\nDEBUG POPULATE - Valores asignados al formulario:")
    print(f"  form.proteinas_porcentaje.data: {form.proteinas_porcentaje.data}")
    print(f"  form.carbohidratos_porcentaje.data: {form.carbohidratos_porcentaje.data}")
    print(f"  form.grasas_porcentaje.data: {form.grasas_porcentaje.data}")
    print(f"  form.liquido_porcentaje.data: {getattr(form, 'liquido_porcentaje', None) and form.liquido_porcentaje.data}")
    
    # 5. CAMPOS INT
    campos_int = ['calidad_sueno', 'nivel_estres', 'presion_sistolica', 
                 'presion_diastolica', 'frecuencia_cardiaca']
    
    for campo in campos_int:
        if hasattr(form, campo) and hasattr(patient, campo):
            valor = getattr(patient, campo)
            if valor is not None:
                try:
                    getattr(form, campo).data = int(valor)
                except:
                    pass
    
    # 6. CAMPOS DE LISTA (string -> list)
    campos_lista = ['diagnosticos', 'medicamentos', 'suplementos', 
                   'quien_cocina', 'con_quien_vive', 'donde_come', 'tipo_alcohol']
    
    for campo in campos_lista:
        if hasattr(form, campo) and hasattr(patient, campo):
            valor = getattr(patient, campo)
            if valor and isinstance(valor, str):
                getattr(form, campo).data = [v.strip() for v in valor.split(',') if v.strip()]
    
    # 7. OBJETIVOS (JSON string)
    if hasattr(form, 'objetivos') and hasattr(patient, 'objetivos'):
        if patient.objetivos:
            form.objetivos.data = patient.objetivos
    
    # 8. FRECUENCIA DE CONSUMO (JSON string)
    if hasattr(form, 'frecuencia_consumo') and hasattr(patient, 'frecuencia_consumo'):
        if patient.frecuencia_consumo:
            form.frecuencia_consumo.data = patient.frecuencia_consumo if isinstance(patient.frecuencia_consumo, str) else json.dumps(patient.frecuencia_consumo)
    
    # 9. REGISTRO 24H
    if hasattr(form, 'registro_24h') and hasattr(patient, 'registro_24h'):
        if patient.registro_24h:
            form.registro_24h.data = patient.registro_24h
    
    # 10. BOOLEAN
    if hasattr(form, 'is_active') and hasattr(patient, 'is_active'):
        form.is_active.data = patient.is_active


# ============================================
# CALCULOS ANTROPOMETRICOS HTMX
# ============================================
@app.route('/api/calcular-antropometria', methods=['POST'])
@csrf.exempt
@login_required
def calcular_antropometria_htmx():
    """Calcular IMC, % grasa, ICC, GEB, GET via HTMX"""
    try:
        talla = request.form.get('talla_m', type=float)
        peso = request.form.get('peso_kg', type=float)
        sexo = request.form.get('sexo', '')
        fecha_nacimiento = request.form.get('fecha_nacimiento', '')
        actividad = request.form.get('actividad_fisica', 'sedentario')
        
        # Pliegues
        p_bicipital = request.form.get('pliegue_bicipital', type=float) or 0
        p_tricipital = request.form.get('pliegue_tricipital', type=float) or 0
        p_subescapular = request.form.get('pliegue_subescapular', type=float) or 0
        p_supracrestideo = request.form.get('pliegue_supracrestideo', type=float) or 0
        
        # Perimetros
        cintura = request.form.get('perimetro_cintura', type=float)
        cadera = request.form.get('perimetro_cadera', type=float)
        
        resultados = {}
        
        # IMC
        if talla and peso and talla > 0:
            imc = peso / (talla * talla)
            resultados['imc'] = round(imc, 1)
            
            if imc < 18.5:
                resultados['imc_categoria'] = 'Bajo peso'
                resultados['imc_clase'] = 'text-warning'
            elif imc < 25:
                resultados['imc_categoria'] = 'Normal'
                resultados['imc_clase'] = 'text-success'
            elif imc < 30:
                resultados['imc_categoria'] = 'Sobrepeso'
                resultados['imc_clase'] = 'text-warning'
            elif imc < 35:
                resultados['imc_categoria'] = 'Obesidad I'
                resultados['imc_clase'] = 'text-danger'
            elif imc < 40:
                resultados['imc_categoria'] = 'Obesidad II'
                resultados['imc_clase'] = 'text-danger'
            else:
                resultados['imc_categoria'] = 'Obesidad III'
                resultados['imc_clase'] = 'text-danger'
        
        # Edad
        edad = None
        if fecha_nacimiento:
            try:
                fecha_nac = datetime.strptime(fecha_nacimiento, '%Y-%m-%d')
                hoy = datetime.now()
                edad = hoy.year - fecha_nac.year - ((hoy.month, hoy.day) < (fecha_nac.month, fecha_nac.day))
                resultados['edad'] = edad
            except:
                pass
        
        # % Grasa (Durnin-Womersley + Siri)
        suma_pliegues = p_bicipital + p_tricipital + p_subescapular + p_supracrestideo
        if suma_pliegues > 0 and edad and sexo:
            log_pliegues = math.log10(suma_pliegues)
            
            if sexo.lower() in ['masculino', 'm', 'hombre']:
                if edad < 17:
                    c, m = 1.1533, 0.0643
                elif edad < 20:
                    c, m = 1.1620, 0.0630
                elif edad < 30:
                    c, m = 1.1631, 0.0632
                elif edad < 40:
                    c, m = 1.1422, 0.0544
                elif edad < 50:
                    c, m = 1.1620, 0.0700
                else:
                    c, m = 1.1715, 0.0779
            else:
                if edad < 17:
                    c, m = 1.1369, 0.0598
                elif edad < 20:
                    c, m = 1.1549, 0.0678
                elif edad < 30:
                    c, m = 1.1599, 0.0717
                elif edad < 40:
                    c, m = 1.1423, 0.0632
                elif edad < 50:
                    c, m = 1.1333, 0.0612
                else:
                    c, m = 1.1339, 0.0645
            
            densidad = c - (m * log_pliegues)
            porcentaje_grasa = (495 / densidad) - 450
            resultados['porcentaje_grasa'] = round(porcentaje_grasa, 1)
        
        # ICC
        if cintura and cadera and cadera > 0:
            icc = cintura / cadera
            resultados['icc'] = round(icc, 2)
            
            if sexo.lower() in ['masculino', 'm', 'hombre']:
                if icc >= 1.0:
                    resultados['riesgo_cv'] = 'Alto'
                    resultados['riesgo_clase'] = 'text-danger'
                elif icc >= 0.95:
                    resultados['riesgo_cv'] = 'Moderado'
                    resultados['riesgo_clase'] = 'text-warning'
                else:
                    resultados['riesgo_cv'] = 'Bajo'
                    resultados['riesgo_clase'] = 'text-success'
            else:
                if icc >= 0.85:
                    resultados['riesgo_cv'] = 'Alto'
                    resultados['riesgo_clase'] = 'text-danger'
                elif icc >= 0.80:
                    resultados['riesgo_cv'] = 'Moderado'
                    resultados['riesgo_clase'] = 'text-warning'
                else:
                    resultados['riesgo_cv'] = 'Bajo'
                    resultados['riesgo_clase'] = 'text-success'
        
        # GEB y GET (Harris-Benedict)
        if peso and talla and edad and sexo:
            altura_cm = talla * 100
            
            if sexo.lower() in ['masculino', 'm', 'hombre']:
                geb = 88.362 + (13.397 * peso) + (4.799 * altura_cm) - (5.677 * edad)
            else:
                geb = 447.593 + (9.247 * peso) + (3.098 * altura_cm) - (4.330 * edad)
            
            resultados['geb'] = round(geb, 0)
            
            factores = {
                'sedentario': 1.2,
                'ligero': 1.375,
                'moderado': 1.55,
                'activo': 1.725,
                'muy_activo': 1.9
            }
            factor = factores.get(actividad, 1.2)
            get_valor = geb * factor
            resultados['get'] = round(get_valor, 0)
        
        # Construir HTML de respuesta
        html = '<div class="row g-3">'
        
        if 'imc' in resultados:
            html += f'''
                <div class="col-md-4">
                    <div class="calculated-field">
                        <span class="label">IMC</span>
                        <span class="value {resultados.get("imc_clase", "")}">{resultados["imc"]} kg/mÂ²</span>
                        <span class="category">{resultados.get("imc_categoria", "")}</span>
                    </div>
                </div>
            '''
        
        if 'porcentaje_grasa' in resultados:
            html += f'''
                <div class="col-md-4">
                    <div class="calculated-field">
                        <span class="label">% Grasa Corporal</span>
                        <span class="value">{resultados["porcentaje_grasa"]}%</span>
                    </div>
                </div>
            '''
        
        if 'icc' in resultados:
            html += f'''
                <div class="col-md-4">
                    <div class="calculated-field">
                        <span class="label">ICC</span>
                        <span class="value">{resultados["icc"]}</span>
                        <span class="category {resultados.get("riesgo_clase", "")}">Riesgo: {resultados.get("riesgo_cv", "N/A")}</span>
                    </div>
                </div>
            '''
        
        if 'geb' in resultados:
            html += f'''
                <div class="col-md-6">
                    <div class="calculated-field">
                        <span class="label">GEB (Metabolismo Basal)</span>
                        <span class="value">{int(resultados["geb"])} kcal/dia</span>
                    </div>
                </div>
            '''
        
        if 'get' in resultados:
            html += f'''
                <div class="col-md-6">
                    <div class="calculated-field">
                        <span class="label">GET (Gasto Total)</span>
                        <span class="value text-primary fw-bold">{int(resultados["get"])} kcal/dia</span>
                    </div>
                </div>
            '''
        
        html += '</div>'
        
        return html
        
    except Exception as e:
        print(f"[ERROR] en calculo HTMX: {str(e)}")
        return f'<div class="alert alert-danger">Error en calculo: {str(e)}</div>'

# ============================================
# RUTAS DE RECETAS
# ============================================
@app.route('/nutritionist/my-recipes')
@login_required
def my_recipes():
    if current_user.user_type != 'nutricionista':
        flash('No tienes permisos para acceder', 'danger')
        return redirect(url_for('dashboard'))
    return render_template('nutritionist_dashboard.html', active_tab='recipes')


@app.route('/profile')
@login_required
def profile():
    return render_template('dashboard.html', user=current_user)


# ============================================
# API SUPERFOODS
# ============================================
@app.route('/api/superfoods', methods=['GET'])
def get_superfoods():
    try:
        csv_path = os.path.join(app.root_path, 'data', 'db_maestra_superalimentos_ampliada.csv')
        
        if not os.path.exists(csv_path):
            return jsonify({'error': 'Base de datos no encontrada'}), 404
        
        df = pd.read_csv(csv_path)
        superfoods = df.to_dict('records')
        
        return jsonify({
            'success': True,
            'data': superfoods,
            'total': len(superfoods)
        })
    
    except Exception as e:
        log_debug(f"[ERROR] Cargando superfoods: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/superfoods/<int:food_id>', methods=['GET'])
def get_superfood_detail(food_id):
    try:
        csv_path = os.path.join(app.root_path, 'data', 'db_maestra_superalimentos_ampliada.csv')
        df = pd.read_csv(csv_path)
        
        if food_id < 0 or food_id >= len(df):
            return jsonify({'error': 'Superalimento no encontrado'}), 404
        
        food = df.iloc[food_id].to_dict()
        
        return jsonify({
            'success': True,
            'data': food
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================
# GENERADOR DE RECETAS
# ============================================
@app.route('/api/generate-recipe', methods=['POST'])
@csrf.exempt
@login_required
def generate_recipe():
    try:
        data = request.get_json()
        
        objetivo_calorico = data.get('objetivo_calorico', 2000)
        restricciones = data.get('restricciones', [])
        preferencias = data.get('preferencias', {})
        tiempo_comida = data.get('tiempo_comida', 'almuerzo')
        
        log_debug(f"[INFO] Generando receta: {objetivo_calorico} kcal, {tiempo_comida}")
        
        try:
            from recipe_generator_v2 import RecipeGeneratorV2
            generator = RecipeGeneratorV2()
            
            receta = generator.generate(
                objetivo_calorico=objetivo_calorico,
                restricciones=restricciones,
                preferencias=preferencias,
                tiempo_comida=tiempo_comida
            )
            
            def clean_infinity(obj):
                if isinstance(obj, dict):
                    return {k: clean_infinity(v) for k, v in obj.items()}
                elif isinstance(obj, list):
                    return [clean_infinity(item) for item in obj]
                elif isinstance(obj, float):
                    if math.isinf(obj) or math.isnan(obj):
                        return 0
                    return obj
                return obj
            
            receta = clean_infinity(receta)
            
            return jsonify({
                'success': True,
                'recipe': receta
            })
            
        except ImportError:
            return jsonify({
                'success': True,
                'recipe': {
                    'nombre': f'Receta de {tiempo_comida}',
                    'ingredientes': ['Ingrediente 1', 'Ingrediente 2'],
                    'calorias': objetivo_calorico,
                    'mensaje': 'Generador de recetas no disponible'
                }
            })
    
    except Exception as e:
        log_debug(f"[ERROR] Generando receta: {str(e)}")
        return jsonify({'error': str(e)}), 500


# ============================================
# RUTAS ESTATICAS
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


@app.route('/data/<path:filename>')
def serve_data(filename):
    return send_from_directory('data', filename)

# ============================================
# ERROR HANDLERS
# ============================================
@app.errorhandler(404)
def not_found_error(error):
    if request.path.startswith('/api/'):
        return jsonify({'error': 'Recurso no encontrado'}), 404
    return render_template('login.html', error='Pagina no encontrada'), 404


@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    log_debug(f"[ERROR] Error interno: {str(error)}")
    if request.path.startswith('/api/'):
        return jsonify({'error': 'Error interno del servidor'}), 500
    return render_template('login.html', error='Error interno del servidor'), 500


# ============================================
# HEALTH CHECK
# ============================================
@app.route('/health')
def health_check():
    try:
        db.session.execute(db.text('SELECT 1'))
        db_status = 'ok'
    except Exception as e:
        db_status = f'error: {str(e)}'
    
    return jsonify({
        'status': 'ok',
        'database': db_status,
        'timestamp': datetime.now().isoformat()
    })


# ============================================
# GENERADOR DE PAUTA ALIMENTARIA
# ============================================
from pauta_generator import PautaGenerator, generar_pauta_alimentaria

@app.route('/api/generar-pauta/<int:patient_id>', methods=['GET'])
@login_required
def api_generar_pauta(patient_id):
    """
    Endpoint para generar pauta alimentaria personalizada
    """
    try:
        # Verificar que el nutricionista tiene acceso a este paciente
        patient = PatientFile.query.filter_by(
            id=patient_id,
            nutricionista_id=current_user.id
        ).first()
        
        if not patient:
            return jsonify({
                'success': False,
                'error': 'Paciente no encontrado o sin acceso'
            }), 404
        
        # Cargar base de datos de alimentos
        alimentos_db = load_alimentos_database()
        
        if not alimentos_db:
            return jsonify({
                'success': False,
                'error': 'No se pudo cargar la base de datos de alimentos'
            }), 500
        
        # Convertir paciente a diccionario
        patient_dict = patient.to_dict()
        
        # Generar pauta con el nuevo algoritmo
        pauta = generar_pauta_alimentaria(patient_dict, alimentos_db)
        
        print(f"✅ Pauta generada para paciente {patient.nombre}")
        print(f"   GET: {pauta['requerimientos']['get_kcal']} kcal")
        # Pauta semanal usa resumen_semanal
        if 'resumen_semanal' in pauta:
            print(f"   Promedio diario: {pauta['resumen_semanal']['promedio_diario']['kcal']} kcal ({pauta['resumen_semanal']['cumplimiento_promedio']}%)")
        elif 'totales' in pauta:
            print(f"   Total generado: {pauta['totales']['kcal']} kcal")
        
        return jsonify({
            'success': True,
            'pauta': pauta
        })
        
    except Exception as e:
        print(f"❌ Error generando pauta: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/guardar-pauta/<int:patient_id>', methods=['POST'])
@csrf.exempt
@login_required
def api_guardar_pauta(patient_id):
    """
    Endpoint para guardar pauta alimentaria en la ficha del paciente
    """
    try:
        # Verificar acceso
        patient = PatientFile.query.filter_by(
            id=patient_id,
            nutricionista_id=current_user.id
        ).first()
        
        if not patient:
            return jsonify({
                'success': False,
                'error': 'Paciente no encontrado o sin acceso'
            }), 404
        
        # Obtener datos de la pauta
        data = request.get_json()
        pauta = data.get('pauta')
        
        if not pauta:
            return jsonify({
                'success': False,
                'error': 'No se recibieron datos de la pauta'
            }), 400
        
        # Guardar en el campo plan_alimentario del paciente
        patient.plan_alimentario = json.dumps(pauta)
        
        db.session.commit()
        
        print(f"✅ Pauta guardada para paciente {patient.nombre}")
        
        return jsonify({
            'success': True,
            'message': 'Pauta guardada exitosamente'
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error guardando pauta: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/ver-pauta/<int:patient_id>', methods=['GET'])
@login_required
def api_ver_pauta(patient_id):
    """
    Endpoint para ver la pauta alimentaria guardada de un paciente
    """
    try:
        # Verificar acceso
        patient = PatientFile.query.filter_by(
            id=patient_id,
            nutricionista_id=current_user.id
        ).first()
        
        if not patient:
            return jsonify({
                'success': False,
                'error': 'Paciente no encontrado o sin acceso'
            }), 404
        
        # Obtener pauta guardada
        if patient.plan_alimentario:
            try:
                pauta = json.loads(patient.plan_alimentario)
                return jsonify({
                    'success': True,
                    'pauta': pauta
                })
            except json.JSONDecodeError:
                return jsonify({
                    'success': False,
                    'error': 'Error al leer la pauta guardada'
                }), 500
        else:
            return jsonify({
                'success': False,
                'error': 'No hay pauta guardada para este paciente'
            }), 404
        
    except Exception as e:
        print(f"Error viendo pauta: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/exportar-pauta-pdf/<int:patient_id>', methods=['GET'])
@login_required
def api_exportar_pauta_pdf(patient_id):
    """
    Exporta la pauta alimentaria guardada a PDF
    """
    try:
        # Verificar acceso al paciente
        patient = PatientFile.query.filter_by(
            id=patient_id,
            nutricionista_id=current_user.id
        ).first()
        
        if not patient:
            return jsonify({
                'success': False,
                'error': 'Paciente no encontrado o sin acceso'
            }), 404
        
        # Verificar que tiene pauta guardada
        if not patient.plan_alimentario:
            return jsonify({
                'success': False,
                'error': 'El paciente no tiene una pauta alimentaria guardada'
            }), 404
        
        # Parsear la pauta
        try:
            pauta_data = json.loads(patient.plan_alimentario) if isinstance(patient.plan_alimentario, str) else patient.plan_alimentario
        except json.JSONDecodeError:
            return jsonify({
                'success': False,
                'error': 'Error al leer la pauta guardada'
            }), 500
        
        # Datos adicionales del paciente
        patient_data = {
            'id': patient.id,
            'nombre': patient.nombre,
            'objetivos': patient.objetivos,
            'peso_kg': patient.peso_kg,
            'talla_m': patient.talla_m
        }
        
        # Generar PDF
        print(f"📄 Generando PDF para paciente {patient.nombre}...")
        pdf_buffer = generar_pdf_pauta(pauta_data, patient_data)
        
        # Nombre del archivo
        nombre_archivo = f"pauta_alimentaria_{patient.nombre.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}.pdf"
        
        print(f"✅ PDF generado: {nombre_archivo}")
        
        return send_file(
            pdf_buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=nombre_archivo
        )
        
    except Exception as e:
        print(f"❌ Error generando PDF: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# ============================================
# ENDPOINT ALTERNATIVO: Generar PDF desde pauta en memoria
# ============================================

@app.route('/api/generar-pdf-pauta/<int:patient_id>', methods=['POST'])
@login_required  
def api_generar_pdf_pauta(patient_id):
    """
    Genera PDF desde datos de pauta enviados en el request
    (útil para generar PDF antes de guardar)
    """
    try:
        patient = PatientFile.query.filter_by(
            id=patient_id,
            nutricionista_id=current_user.id
        ).first()
        
        if not patient:
            return jsonify({
                'success': False,
                'error': 'Paciente no encontrado'
            }), 404
        
        # Obtener pauta del request
        data = request.get_json()
        pauta_data = data.get('pauta')
        
        if not pauta_data:
            return jsonify({
                'success': False,
                'error': 'No se recibieron datos de la pauta'
            }), 400
        
        patient_data = {
            'id': patient.id,
            'nombre': patient.nombre,
            'objetivos': patient.objetivos
        }
        
        # Generar PDF
        pdf_buffer = generar_pdf_pauta(pauta_data, patient_data)
        
        nombre_archivo = f"pauta_{patient.nombre.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}.pdf"
        
        return send_file(
            pdf_buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=nombre_archivo
        )
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500
    
# ============================================
# DEBUG ENDPOINT
# ============================================
@app.route('/api/debug/logs')
@login_required
def get_debug_logs():
    if current_user.user_type != 'nutricionista':
        return jsonify({'error': 'No autorizado'}), 403
    
    return jsonify({
        'logs': debug_logs[-50:],
        'total': len(debug_logs)
    })


# ============================================
# INICIALIZACION
# ============================================
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        log_debug("[OK] Base de datos inicializada")
        
        alimentos_db = load_alimentos_database()
        if alimentos_db:
            total = sum(len(items) for subgroups in alimentos_db.values() for items in subgroups.values())
            log_debug(f"[OK] Alimentos cargados: {total} items")
    
    port = int(os.environ.get('PORT', 5000))
    debug_mode = os.environ.get('FLASK_DEBUG', 'True').lower() == 'true'
    
    log_debug(f"[OK] Servidor iniciando en puerto {port}")
    app.run(host='0.0.0.0', port=port, debug=debug_mode)