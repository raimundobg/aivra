"""
auth.py - Sistema de Autenticación
Registro simplificado con campos obligatorios
"""
from flask import Blueprint, render_template, redirect, url_for, request, flash
from flask_login import login_user, logout_user, login_required, current_user
from models import db, User, UserType, SubscriptionPlan, NUTRITIONIST_SPECIALTIES
from email_validator import validate_email, EmailNotValidError
from datetime import datetime

auth_bp = Blueprint('auth', __name__)

# Países de Latinoamérica
LATAM_COUNTRIES = [
    'Argentina', 'Bolivia', 'Brasil', 'Chile', 'Colombia',
    'Costa Rica', 'Ecuador', 'México', 'Panamá', 'Paraguay',
    'Perú', 'Uruguay', 'Venezuela'
]

# Ciudades de Chile (solo si country='Chile')
CHILE_CITIES = [
    'Santiago', 'Valparaíso', 'Viña del Mar', 'Concepción',
    'La Serena', 'Antofagasta', 'Temuco', 'Iquique',
    'Puerto Montt', 'Talca', 'Arica', 'Chillán',
    'Punta Arenas', 'Osorno', 'Valdivia', 'Otra'
]


@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    """Registro simplificado"""
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    
    if request.method == 'POST':
        try:
            # ===== CAMPOS OBLIGATORIOS =====
            email = request.form.get('email', '').strip().lower()
            password = request.form.get('password', '')
            confirm_password = request.form.get('confirm_password', '')
            first_name = request.form.get('first_name', '').strip()
            last_name = request.form.get('last_name', '').strip()
            birth_date_str = request.form.get('birth_date', '')
            country = request.form.get('country', '')
            city = request.form.get('city', '').strip() if country == 'Chile' else None
            user_type = request.form.get('user_type', UserType.CLIENTE)
            
            # Validaciones básicas
            if not all([email, password, first_name, last_name, birth_date_str, country]):
                flash('Por favor completa todos los campos obligatorios', 'danger')
                return render_template('register.html', 
                                     countries=LATAM_COUNTRIES,
                                     cities=CHILE_CITIES,
                                     specialties=NUTRITIONIST_SPECIALTIES)
            
            # Validar ciudad si es Chile
            if country == 'Chile' and not city:
                flash('La ciudad es obligatoria para Chile', 'danger')
                return render_template('register.html',
                                     countries=LATAM_COUNTRIES,
                                     cities=CHILE_CITIES,
                                     specialties=NUTRITIONIST_SPECIALTIES)
            
            # Validar email
            try:
                valid = validate_email(email)
                email = valid.email
            except EmailNotValidError:
                flash('Email inválido', 'danger')
                return render_template('register.html',
                                     countries=LATAM_COUNTRIES,
                                     cities=CHILE_CITIES,
                                     specialties=NUTRITIONIST_SPECIALTIES)
            
            # Validar contraseña
            if len(password) < 6:
                flash('La contraseña debe tener al menos 6 caracteres', 'danger')
                return render_template('register.html',
                                     countries=LATAM_COUNTRIES,
                                     cities=CHILE_CITIES,
                                     specialties=NUTRITIONIST_SPECIALTIES)
            
            if password != confirm_password:
                flash('Las contraseñas no coinciden', 'danger')
                return render_template('register.html',
                                     countries=LATAM_COUNTRIES,
                                     cities=CHILE_CITIES,
                                     specialties=NUTRITIONIST_SPECIALTIES)
            
            # Validar fecha de nacimiento
            try:
                birth_date = datetime.strptime(birth_date_str, '%Y-%m-%d').date()
                today = datetime.today().date()
                age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
                
                if age < 18:
                    flash('Debes ser mayor de 18 años', 'danger')
                    return render_template('register.html',
                                         countries=LATAM_COUNTRIES,
                                         cities=CHILE_CITIES)
            except ValueError:
                flash('Fecha de nacimiento inválida', 'danger')
                return render_template('register.html',
                                     countries=LATAM_COUNTRIES,
                                     cities=CHILE_CITIES,
                                     specialties=NUTRITIONIST_SPECIALTIES)
            
            # Verificar duplicados
            if User.query.filter_by(email=email).first():
                flash('Este email ya está registrado', 'danger')
                return render_template('register.html',
                                     countries=LATAM_COUNTRIES,
                                     cities=CHILE_CITIES,
                                     specialties=NUTRITIONIST_SPECIALTIES)
            
            # Determinar plan según tipo
            if user_type == UserType.CLIENTE:
                plan = SubscriptionPlan.FREE
            elif user_type == UserType.NUTRICIONISTA:
                plan = SubscriptionPlan.PROFESSIONAL
            elif user_type == UserType.EMPRESA:
                plan = SubscriptionPlan.ENTERPRISE
            else:
                plan = SubscriptionPlan.FREE
            
            # ===== CREAR USUARIO =====
            new_user = User(
                email=email,
                first_name=first_name,
                last_name=last_name,
                birth_date=birth_date,
                country=country,
                city=city,
                user_type=user_type,
                subscription_plan=plan,
                phone=request.form.get('phone', '').strip(),
                referral_code=request.form.get('referral_code', '').strip()
            )
            new_user.set_password(password)
            
            # Campos opcionales específicos
            if user_type == UserType.NUTRICIONISTA:
                new_user.license_number = request.form.get('license_number', '').strip()
                new_user.specialization = ','.join(request.form.getlist('specialization'))
            elif user_type == UserType.EMPRESA:
                new_user.company_name = request.form.get('company_name', '').strip()
                new_user.company_rut = request.form.get('company_rut', '').strip()
                new_user.industry = request.form.get('industry', '').strip()
            
            # Guardar
            db.session.add(new_user)
            db.session.commit()
            
            # Login automático
            login_user(new_user)
            
            flash(f'Bienvenido/a, {new_user.get_full_name()}!', 'success')
            
            # Redirigir según tipo
            if user_type == UserType.NUTRICIONISTA:
                return redirect(url_for('nutritionist_dashboard'))
            elif user_type == UserType.EMPRESA:
                return redirect(url_for('enterprise_dashboard'))
            return redirect(url_for('dashboard'))
            
        except Exception as e:
            db.session.rollback()
            flash('Error al crear la cuenta', 'danger')
            print(f"Error: {e}")
    
    return render_template('register.html',
                         countries=LATAM_COUNTRIES,
                         cities=CHILE_CITIES,
                         specialties=NUTRITIONIST_SPECIALTIES)


@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    """Login"""
    if current_user.is_authenticated:
        if current_user.user_type == UserType.NUTRICIONISTA:
            return redirect(url_for('nutritionist_dashboard'))
        elif current_user.user_type == UserType.EMPRESA:
            return redirect(url_for('enterprise_dashboard'))
        return redirect(url_for('dashboard'))
    
    if request.method == 'POST':
        email = request.form.get('email', '').strip().lower()
        password = request.form.get('password', '')
        remember = request.form.get('remember', False)
        
        if not email or not password:
            flash('Email y contraseña son obligatorios', 'danger')
            return render_template('login.html')
        
        user = User.query.filter_by(email=email).first()
        
        if user and user.check_password(password):
            user.last_login = datetime.utcnow()
            db.session.commit()
            
            login_user(user, remember=remember)
            flash(f'Bienvenido/a, {user.get_full_name()}!', 'success')
            
            # Redirigir según tipo de usuario
            if user.user_type == 'nutricionista':
                return redirect('/dashboard/nutritionist')
            elif user.user_type == 'empresa':
                return redirect('/dashboard/enterprise')
            elif user.user_type == 'paciente':
                return redirect('/dashboard/patient')
            elif user.user_type == 'cliente':
                return redirect('/dashboard/client')
            
            next_page = request.args.get('next')
            return redirect(next_page) if next_page else redirect(url_for('dashboard'))
        else:
            flash('Email o contraseña incorrectos', 'danger')
    
    return render_template('login.html')


@auth_bp.route('/logout')
@login_required
def logout():
    """Cerrar sesión"""
    logout_user()
    flash('Has cerrado sesión', 'info')
    return redirect(url_for('index'))