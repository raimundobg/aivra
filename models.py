"""
models.py - Sistema de Base de Datos Escalable
Version: 2.1 - Con PatientFile completo + Public Intake System
"""
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime, date
from werkzeug.security import generate_password_hash, check_password_hash
import secrets

db = SQLAlchemy()

# ============================================
# CONSTANTES
# ============================================

class UserType:
    CLIENTE = 'cliente'
    NUTRICIONISTA = 'nutricionista'
    EMPRESA = 'empresa'

class SubscriptionPlan:
    FREE = 'free'  # Cliente - 2 recetas/mes
    PROFESSIONAL = 'professional'  # Nutricionista - ilimitado
    ENTERPRISE = 'enterprise'  # Empresa - ilimitado


# ============================================
# MODELO: USER
# ============================================

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    
    # ===== CAMPOS OBLIGATORIOS PARA TODOS =====
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(200), nullable=False)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    birth_date = db.Column(db.Date, nullable=False)
    country = db.Column(db.String(50), nullable=False)
    city = db.Column(db.String(50), nullable=True)
    
    # ===== TIPO DE CUENTA Y PLAN =====
    user_type = db.Column(db.String(20), nullable=False, default=UserType.CLIENTE)
    subscription_plan = db.Column(db.String(20), nullable=False, default=SubscriptionPlan.FREE)
    
    # ===== CAMPOS OPCIONALES COMUNES =====
    phone = db.Column(db.String(20))
    referral_code = db.Column(db.String(8))
    
    # ===== CAMPOS ESPECÍFICOS NUTRICIONISTA =====
    license_number = db.Column(db.String(50))
    specialization = db.Column(db.String(100))
    
    # ===== CAMPOS ESPECÍFICOS EMPRESA =====
    company_name = db.Column(db.String(100))
    company_rut = db.Column(db.String(20))
    industry = db.Column(db.String(50))
    
    # ===== LÍMITES Y CUOTAS =====
    recipes_this_month = db.Column(db.Integer, default=0)
    last_recipe_reset = db.Column(db.Date, default=date.today)
    
    # ===== METADATOS =====
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True)
    
    # ===== RELACIONES =====
    recipes = db.relationship('UserRecipe', backref='user', lazy='dynamic', 
                             cascade='all, delete-orphan',
                             foreign_keys='UserRecipe.user_id')
    reviews = db.relationship('Review', backref='user', lazy='dynamic',
                            cascade='all, delete-orphan')
    patient_files = db.relationship('PatientFile', backref='nutritionist', 
                                   lazy='dynamic', cascade='all, delete-orphan')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def get_full_name(self):
        if self.user_type == UserType.EMPRESA and self.company_name:
            return self.company_name
        return f"{self.first_name} {self.last_name}"
    
    def get_age(self):
        today = date.today()
        return today.year - self.birth_date.year - (
            (today.month, today.day) < (self.birth_date.month, self.birth_date.day)
        )
    
    def can_generate_recipe(self):
        today = date.today()
        if self.last_recipe_reset.month != today.month or \
           self.last_recipe_reset.year != today.year:
            self.recipes_this_month = 0
            self.last_recipe_reset = today
            db.session.commit()
        
        if self.subscription_plan == SubscriptionPlan.FREE:
            return self.recipes_this_month < 2
        return True
    
    def get_recipes_remaining(self):
        if self.subscription_plan == SubscriptionPlan.FREE:
            return max(0, 2 - self.recipes_this_month)
        return float('inf')
    
    def increment_recipe_count(self):
        self.recipes_this_month += 1
        db.session.commit()
    
    def get_recipe_count(self):
        return self.recipes.count()
    
    def get_recent_recipes(self, limit=5):
        return self.recipes.order_by(UserRecipe.created_at.desc()).limit(limit).all()
    
    def get_patient_count(self):
        """Obtener número de pacientes activos"""
        return self.patient_files.filter_by(is_active=True).count()
    
    def __repr__(self):
        return f'<User {self.email}>'


# ============================================
# MODELO: USER RECIPE
# ============================================

class UserRecipe(db.Model):
    __tablename__ = 'user_recipes'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    recipe_name = db.Column(db.String(200), nullable=False)
    recipe_data = db.Column(db.JSON, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    view_count = db.Column(db.Integer, default=0)
    
    patient_file_id = db.Column(db.Integer, db.ForeignKey('patient_files.id'), nullable=True)
    
    reviews = db.relationship('Review', backref='recipe', lazy='dynamic',
                            cascade='all, delete-orphan')
    
    def get_average_rating(self):
        reviews = self.reviews.all()
        if not reviews:
            return 0
        return round(sum(r.rating for r in reviews) / len(reviews), 1)
    
    def __repr__(self):
        return f'<UserRecipe {self.recipe_name}>'


# ============================================
# MODELO: REVIEW
# ============================================

class Review(db.Model):
    __tablename__ = 'reviews'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    recipe_id = db.Column(db.Integer, db.ForeignKey('user_recipes.id'), nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    comment = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        db.CheckConstraint('rating >= 1 AND rating <= 5', name='check_rating_range'),
        db.UniqueConstraint('user_id', 'recipe_id', name='unique_user_recipe_review'),
    )
    
    def __repr__(self):
        return f'<Review {self.rating}★>'


# ============================================
# MODELO: PATIENT FILE (Solo Nutricionistas)
# Versión 2.0 - Completo con todos los campos
# ============================================

class PatientFile(db.Model):
    __tablename__ = 'patient_files'
    
    id = db.Column(db.Integer, primary_key=True)
    nutricionista_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # ===== NUMERO DE FICHA (auto-generado por nutricionista) =====
    ficha_numero = db.Column(db.Integer)  # Ficha #1, #2, etc. por nutricionista

    # ===== PUBLIC INTAKE SYSTEM (NUEVO) =====
    intake_token = db.Column(db.String(64), unique=True, index=True)  # Token unico para URL publica
    intake_completed = db.Column(db.Boolean, default=False)  # Si el paciente ya lleno el formulario
    intake_completed_at = db.Column(db.DateTime)  # Cuando lo completo
    intake_url_sent = db.Column(db.Boolean, default=False)  # Si se envio la URL al paciente
    intake_url_sent_at = db.Column(db.DateTime)  # Cuando se envio

    # ===== 1. ANTECEDENTES GENERALES =====
    nombre = db.Column(db.String(100), nullable=False)
    fecha_nacimiento = db.Column(db.String(20))
    sexo = db.Column(db.String(20))
    email = db.Column(db.String(120))
    telefono = db.Column(db.String(20))
    direccion = db.Column(db.String(200))
    ocupacion = db.Column(db.String(100))
    
    # Motivo y objetivos
    motivo_consulta = db.Column(db.Text)
    objetivos = db.Column(db.Text)  # JSON string de objetivos seleccionados
    
    # Historial médico
    diagnosticos = db.Column(db.Text)  # Diagnósticos médicos
    medicamentos = db.Column(db.Text)  # Medicamentos actuales
    suplementos = db.Column(db.Text)   # Suplementos actuales
    alergias = db.Column(db.Text)      # Alergias alimentarias
    intolerancias = db.Column(db.Text) # Intolerancias
    cirugias = db.Column(db.Text)      # Cirugías previas
    antecedentes_familiares = db.Column(db.Text)
    # Conducta y Entorno
    profesion = db.Column(db.String(100))
    teletrabajo = db.Column(db.String(20))
    quien_cocina = db.Column(db.Text)  # JSON array
    con_quien_vive = db.Column(db.Text)  # JSON array
    donde_come = db.Column(db.Text)  # JSON array

    # Salud General (adicionales)
    observaciones_sueno = db.Column(db.Text)
    gatillantes_estres = db.Column(db.Text)
    manejo_estres = db.Column(db.Text)
    consumo_alcohol = db.Column(db.String(50))
    tipo_alcohol = db.Column(db.Text)  # JSON array
    tabaco = db.Column(db.String(10))
    drogas = db.Column(db.String(10))
    duracion_ejercicio = db.Column(db.Integer)

    # Síntomas Gastrointestinales
    frecuencia_evacuacion = db.Column(db.String(50))
    reflujo = db.Column(db.String(10))
    reflujo_alimento = db.Column(db.Text)
    hinchazon = db.Column(db.String(10))
    hinchazon_alimento = db.Column(db.Text)
    tiene_alergias = db.Column(db.String(10))
    alergias_alimento = db.Column(db.Text)

    # Registro 24 horas (almacenado como JSON)
    registro_24h = db.Column(db.JSON)

    # Frecuencia de consumo (almacenado como JSON)
    frecuencia_consumo = db.Column(db.JSON)
    
    # ===== 2. EVALUACIÓN ANTROPOMÉTRICA =====
    # Medidas básicas
    talla_m = db.Column(db.Float)      # Altura en metros
    peso_kg = db.Column(db.Float)      # Peso en kg
    peso_ideal = db.Column(db.Float)   # Peso ideal calculado
    
    # Pliegues cutáneos (mm) - Método Durnin-Womersley
    pliegue_bicipital = db.Column(db.Float)
    pliegue_tricipital = db.Column(db.Float)
    pliegue_subescapular = db.Column(db.Float)
    pliegue_supracrestideo = db.Column(db.Float)
    pliegue_abdominal = db.Column(db.Float)
    pliegue_muslo = db.Column(db.Float)
    pliegue_pantorrilla = db.Column(db.Float)
    
    # Perímetros (cm)
    perimetro_brazo = db.Column(db.Float)
    perimetro_brazo_contraido = db.Column(db.Float)
    perimetro_cintura = db.Column(db.Float)
    perimetro_cadera = db.Column(db.Float)
    perimetro_muslo = db.Column(db.Float)
    perimetro_pantorrilla = db.Column(db.Float)
    perimetro_muneca = db.Column(db.Float)
    
    # Diámetros óseos (cm)
    diametro_humero = db.Column(db.Float)
    diametro_femur = db.Column(db.Float)
    diametro_muneca = db.Column(db.Float)
    
    # Cálculos derivados (se calculan automáticamente)
    imc = db.Column(db.Float)                    # Índice de Masa Corporal
    imc_categoria = db.Column(db.String(50))     # Bajo peso, Normal, Sobrepeso, etc.
    porcentaje_grasa = db.Column(db.Float)       # % Grasa corporal (Siri)
    masa_grasa_kg = db.Column(db.Float)          # Masa grasa en kg
    masa_libre_grasa_kg = db.Column(db.Float)    # Masa libre de grasa
    densidad_corporal = db.Column(db.Float)      # Densidad corporal (Durnin-Womersley)
    indice_cintura_cadera = db.Column(db.Float)  # ICC
    riesgo_cardiovascular = db.Column(db.String(50))  # Bajo, Moderado, Alto
    
    # ===== 3. EVALUACIÓN BIOQUÍMICA =====
    glucosa_ayunas = db.Column(db.Float)
    hemoglobina_glicada = db.Column(db.Float)
    colesterol_total = db.Column(db.Float)
    colesterol_hdl = db.Column(db.Float)
    colesterol_ldl = db.Column(db.Float)
    trigliceridos = db.Column(db.Float)
    hemoglobina = db.Column(db.Float)
    hematocrito = db.Column(db.Float)
    ferritina = db.Column(db.Float)
    vitamina_d = db.Column(db.Float)
    vitamina_b12 = db.Column(db.Float)
    acido_urico = db.Column(db.Float)
    creatinina = db.Column(db.Float)
    albumina = db.Column(db.Float)
    tsh = db.Column(db.Float)
    fecha_examenes = db.Column(db.String(20))
    
    # ===== 4. EVALUACIÓN CLÍNICA =====
    presion_sistolica = db.Column(db.Integer)
    presion_diastolica = db.Column(db.Integer)
    frecuencia_cardiaca = db.Column(db.Integer)
    
    # Signos clínicos (JSON)
    signos_clinicos = db.Column(db.Text)  # Pelo, uñas, piel, etc.
    
    # Síntomas gastrointestinales
    sintomas_gi = db.Column(db.Text)  # JSON: náuseas, vómitos, diarrea, etc.
    frecuencia_evacuacion = db.Column(db.String(50))
    consistencia_heces = db.Column(db.String(50))  # Escala Bristol
    
    # ===== 5. EVALUACIÓN DIETÉTICA =====
    # Recordatorio 24 horas (JSON)
    recordatorio_24h = db.Column(db.Text)
    
    # Frecuencia de consumo (JSON)
    frecuencia_consumo = db.Column(db.Text)
    
    # Hábitos alimentarios
    comidas_por_dia = db.Column(db.Integer)
    horario_desayuno = db.Column(db.String(10))
    horario_almuerzo = db.Column(db.String(10))
    horario_cena = db.Column(db.String(10))
    pica_entre_comidas = db.Column(db.Boolean, default=False)
    come_frente_tv = db.Column(db.Boolean, default=False)
    come_rapido = db.Column(db.Boolean, default=False)
    quien_cocina = db.Column(db.String(100))
    donde_come = db.Column(db.String(100))
    
    # Consumo de líquidos
    consumo_agua_litros = db.Column(db.Float)
    consumo_cafe_tazas = db.Column(db.Integer)
    consumo_te_tazas = db.Column(db.Integer)
    consumo_bebidas_azucaradas = db.Column(db.String(50))
    consumo_alcohol = db.Column(db.String(50))
    tipo_alcohol = db.Column(db.String(100))
    
    # ===== 6. ESTILO DE VIDA =====
    horas_sueno = db.Column(db.String(20))
    calidad_sueno = db.Column(db.Integer)  # 1-10
    nivel_estres = db.Column(db.Integer)   # 1-10
    
    # Actividad física
    actividad_fisica = db.Column(db.JSON)  # [{"tipo": "pesas", "frecuencia": 3, "duracion": 60}, ...]
    tipo_ejercicio = db.Column(db.String(200))
    frecuencia_ejercicio = db.Column(db.String(50))
    duracion_ejercicio = db.Column(db.String(50))
    percepcion_esfuerzo = db.Column(db.Integer)  # 1-10 escala Borg

    # Hábitos
    fuma = db.Column(db.Boolean, default=False)
    cigarrillos_dia = db.Column(db.Integer)

    # ===== 6.1 CAMPOS ADICIONALES ESTILO DE VIDA =====
    menstruacion = db.Column(db.String(50))  # regular/irregular/menopausia/no_aplica
    restricciones_alimentarias = db.Column(db.JSON)  # ["vegetariano", "vegano", "sin_gluten", "sin_lactosa", "kosher", "halal"]
    delivery_restaurante = db.Column(db.Integer)  # 0-7 veces/semana
    
    # ===== 7. REQUERIMIENTOS NUTRICIONALES =====
    # Calculados automáticamente
    get_kcal = db.Column(db.Float)           # Gasto Energético Total
    geb_kcal = db.Column(db.Float)           # Gasto Energético Basal (Harris-Benedict)
    factor_actividad = db.Column(db.Float)
    factor_estres = db.Column(db.Float)
    
    # Macronutrientes objetivo
    proteinas_g = db.Column(db.Float)
    proteinas_porcentaje = db.Column(db.Float)
    carbohidratos_g = db.Column(db.Float)
    carbohidratos_porcentaje = db.Column(db.Float)
    grasas_g = db.Column(db.Float)
    grasas_porcentaje = db.Column(db.Float)
    fibra_g = db.Column(db.Float)
    
    # ===== 8. DIAGNÓSTICO NUTRICIONAL =====
    diagnostico_nutricional = db.Column(db.Text)
    
    # ===== 9. PLAN DE INTERVENCIÓN =====
    objetivos_nutricionales = db.Column(db.Text)  # JSON de objetivos SMART
    plan_alimentario = db.Column(db.Text)          # JSON del plan
    indicaciones = db.Column(db.Text)
    metas_corto_plazo = db.Column(db.Text)
    metas_mediano_plazo = db.Column(db.Text)
    metas_largo_plazo = db.Column(db.Text)
    
    # ===== 10. SEGUIMIENTO =====
    fecha_proxima_cita = db.Column(db.DateTime)
    notas_seguimiento = db.Column(db.Text)
    
    # ===== METADATOS =====
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    
    # Relaciones
    recipes = db.relationship('UserRecipe', backref='patient', lazy='dynamic')

    # ============================================
    # METODOS PARA PUBLIC INTAKE SYSTEM
    # ============================================

    def generate_intake_token(self):
        """Genera un token unico para el formulario publico"""
        self.intake_token = secrets.token_urlsafe(32)
        return self.intake_token

    def get_intake_url(self, base_url=''):
        """Retorna la URL completa del formulario publico"""
        if not self.intake_token:
            self.generate_intake_token()
        return f"{base_url}/intake/{self.intake_token}"

    def mark_intake_completed(self):
        """Marca el formulario como completado"""
        self.intake_completed = True
        self.intake_completed_at = datetime.utcnow()

    def mark_url_sent(self):
        """Marca que la URL fue enviada al paciente"""
        self.intake_url_sent = True
        self.intake_url_sent_at = datetime.utcnow()

    @staticmethod
    def get_by_intake_token(token):
        """Busca un paciente por su token de intake"""
        return PatientFile.query.filter_by(intake_token=token, is_active=True).first()

    # ============================================
    # METODOS DE CALCULO AUTOMATICO
    # ============================================

    def calcular_edad(self):
        """Calcular edad a partir de fecha de nacimiento"""
        if not self.fecha_nacimiento:
            return None
        try:
            birth = datetime.strptime(self.fecha_nacimiento, '%Y-%m-%d')
            today = datetime.now()
            return today.year - birth.year - ((today.month, today.day) < (birth.month, birth.day))
        except:
            return None
    
    def calcular_imc(self):
        """Calcular IMC y categoría"""
        if self.peso_kg and self.talla_m and self.talla_m > 0:
            self.imc = round(self.peso_kg / (self.talla_m ** 2), 1)
            
            if self.imc < 18.5:
                self.imc_categoria = 'Bajo peso'
            elif self.imc < 25:
                self.imc_categoria = 'Normal'
            elif self.imc < 30:
                self.imc_categoria = 'Sobrepeso'
            elif self.imc < 35:
                self.imc_categoria = 'Obesidad I'
            elif self.imc < 40:
                self.imc_categoria = 'Obesidad II'
            else:
                self.imc_categoria = 'Obesidad III'
            
            return self.imc
        return None
    
    def calcular_densidad_corporal(self):
        """
        Calcular densidad corporal usando Durnin-Womersley (4 pliegues)
        Pliegues: bicipital, tricipital, subescapular, supracrestideo
        """
        pliegues = [
            self.pliegue_bicipital,
            self.pliegue_tricipital,
            self.pliegue_subescapular,
            self.pliegue_supracrestideo
        ]
        
        if not all(pliegues):
            return None
        
        suma_pliegues = sum(pliegues)
        log_pliegues = 0
        
        import math
        log_pliegues = math.log10(suma_pliegues)
        
        edad = self.calcular_edad() or 30
        
        # Coeficientes Durnin-Womersley según sexo y edad
        if self.sexo == 'Masculino':
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
        else:  # Femenino
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
        
        self.densidad_corporal = round(c - (m * log_pliegues), 4)
        return self.densidad_corporal
    
    def calcular_porcentaje_grasa(self):
        """
        Calcular % de grasa corporal usando ecuación de Siri
        % Grasa = (495 / Densidad) - 450
        """
        if not self.densidad_corporal:
            self.calcular_densidad_corporal()
        
        if self.densidad_corporal and self.densidad_corporal > 0:
            self.porcentaje_grasa = round((495 / self.densidad_corporal) - 450, 1)
            
            # Calcular masas
            if self.peso_kg:
                self.masa_grasa_kg = round(self.peso_kg * (self.porcentaje_grasa / 100), 1)
                self.masa_libre_grasa_kg = round(self.peso_kg - self.masa_grasa_kg, 1)
            
            return self.porcentaje_grasa
        return None
    
    def calcular_icc(self):
        """Calcular Índice Cintura-Cadera y riesgo cardiovascular"""
        if self.perimetro_cintura and self.perimetro_cadera and self.perimetro_cadera > 0:
            self.indice_cintura_cadera = round(self.perimetro_cintura / self.perimetro_cadera, 2)
            
            # Determinar riesgo cardiovascular
            if self.sexo == 'Masculino':
                if self.indice_cintura_cadera < 0.95:
                    self.riesgo_cardiovascular = 'Bajo'
                elif self.indice_cintura_cadera < 1.0:
                    self.riesgo_cardiovascular = 'Moderado'
                else:
                    self.riesgo_cardiovascular = 'Alto'
            else:  # Femenino
                if self.indice_cintura_cadera < 0.80:
                    self.riesgo_cardiovascular = 'Bajo'
                elif self.indice_cintura_cadera < 0.85:
                    self.riesgo_cardiovascular = 'Moderado'
                else:
                    self.riesgo_cardiovascular = 'Alto'
            
            return self.indice_cintura_cadera
        return None
    
    def calcular_geb(self):
        """
        Calcular Gasto Energético Basal usando Harris-Benedict revisada
        """
        if not self.peso_kg or not self.talla_m:
            return None
        
        edad = self.calcular_edad() or 30
        altura_cm = self.talla_m * 100
        
        if self.sexo == 'Masculino':
            self.geb_kcal = round(88.362 + (13.397 * self.peso_kg) + (4.799 * altura_cm) - (5.677 * edad))
        else:
            self.geb_kcal = round(447.593 + (9.247 * self.peso_kg) + (3.098 * altura_cm) - (4.330 * edad))
        
        return self.geb_kcal
    
    def calcular_get(self):
        """
        Calcular Gasto Energético Total
        GET = GEB × Factor Actividad × Factor Estrés
        """
        if not self.geb_kcal:
            self.calcular_geb()
        
        if not self.geb_kcal:
            return None
        
        # Factor de actividad
        factores_actividad = {
            'sedentario': 1.2,
            'ligero': 1.375,
            'moderado': 1.55,
            'activo': 1.725,
            'muy_activo': 1.9
        }

        # Manejar actividad_fisica como JSON o string
        actividad_key = 'sedentario'
        if self.actividad_fisica:
            if isinstance(self.actividad_fisica, str):
                actividad_key = self.actividad_fisica
            elif isinstance(self.actividad_fisica, list) and len(self.actividad_fisica) > 0:
                # Si es array de actividades, calcular factor basado en frecuencia total
                total_frecuencia = sum(act.get('frecuencia', 0) for act in self.actividad_fisica if isinstance(act, dict))
                if total_frecuencia >= 6:
                    actividad_key = 'muy_activo'
                elif total_frecuencia >= 4:
                    actividad_key = 'activo'
                elif total_frecuencia >= 3:
                    actividad_key = 'moderado'
                elif total_frecuencia >= 1:
                    actividad_key = 'ligero'

        self.factor_actividad = factores_actividad.get(actividad_key, 1.2)
        self.factor_estres = 1.0  # Por defecto, ajustar según patología
        
        self.get_kcal = round(self.geb_kcal * self.factor_actividad * self.factor_estres)
        
        return self.get_kcal
    
    def calcular_macronutrientes(self, proteinas_pct=20, carbohidratos_pct=50, grasas_pct=30):
        """
        Calcular distribución de macronutrientes según GET
        """
        if not self.get_kcal:
            self.calcular_get()
        
        if not self.get_kcal:
            return None
        
        self.proteinas_porcentaje = proteinas_pct
        self.carbohidratos_porcentaje = carbohidratos_pct
        self.grasas_porcentaje = grasas_pct
        
        # Proteínas: 4 kcal/g
        self.proteinas_g = round((self.get_kcal * proteinas_pct / 100) / 4)
        
        # Carbohidratos: 4 kcal/g
        self.carbohidratos_g = round((self.get_kcal * carbohidratos_pct / 100) / 4)
        
        # Grasas: 9 kcal/g
        self.grasas_g = round((self.get_kcal * grasas_pct / 100) / 9)
        
        # Fibra: 14g por cada 1000 kcal
        self.fibra_g = round(self.get_kcal * 14 / 1000)
        
        return {
            'proteinas_g': self.proteinas_g,
            'carbohidratos_g': self.carbohidratos_g,
            'grasas_g': self.grasas_g,
            'fibra_g': self.fibra_g
        }
    
    def calcular_todo(self):
        """Ejecutar todos los cálculos"""
        self.calcular_imc()
        self.calcular_densidad_corporal()
        self.calcular_porcentaje_grasa()
        self.calcular_icc()
        self.calcular_geb()
        self.calcular_get()
        self.calcular_macronutrientes()
    
    def to_dict(self):
        """Convertir a diccionario para API"""
        return {
            'id': self.id,
            'ficha_numero': self.ficha_numero,
            'nombre': self.nombre,
            'fecha_nacimiento': self.fecha_nacimiento,
            'edad': self.calcular_edad(),
            'sexo': self.sexo,
            'email': self.email,
            'telefono': self.telefono,
            'motivo_consulta': self.motivo_consulta,
            'objetivos': self.objetivos,
            'diagnosticos': self.diagnosticos,
            'medicamentos': self.medicamentos,
            'talla_m': self.talla_m,
            'peso_kg': self.peso_kg,
            'imc': self.imc,
            'imc_categoria': self.imc_categoria,
            'porcentaje_grasa': self.porcentaje_grasa,
            'masa_grasa_kg': self.masa_grasa_kg,
            'masa_libre_grasa_kg': self.masa_libre_grasa_kg,
            'indice_cintura_cadera': self.indice_cintura_cadera,
            'riesgo_cardiovascular': self.riesgo_cardiovascular,
            'geb_kcal': self.geb_kcal,
            'get_kcal': self.get_kcal,
            'proteinas_g': self.proteinas_g,
            'carbohidratos_g': self.carbohidratos_g,
            'grasas_g': self.grasas_g,
            # Nuevos campos
            'menstruacion': self.menstruacion,
            'restricciones_alimentarias': self.restricciones_alimentarias,
            'actividad_fisica': self.actividad_fisica,
            'delivery_restaurante': self.delivery_restaurante,
            'percepcion_esfuerzo': self.percepcion_esfuerzo,
            'intake_token': self.intake_token,
            'intake_completed': self.intake_completed,
            'intake_completed_at': self.intake_completed_at.strftime('%Y-%m-%d %H:%M') if self.intake_completed_at else None,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M') if self.created_at else None,
            'updated_at': self.updated_at.strftime('%Y-%m-%d %H:%M') if self.updated_at else None,
            'is_active': self.is_active
        }
    
    def __repr__(self):
        return f'<PatientFile #{self.ficha_numero} - {self.nombre}>'