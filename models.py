"""
models.py - Sistema de Base de Datos Escalable
VersiÃ³n: 2.0 - Con PatientFile completo para Nutricionistas
"""
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime, date
from werkzeug.security import generate_password_hash, check_password_hash

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
    
    # ===== CAMPOS ESPECÃFICOS NUTRICIONISTA =====
    license_number = db.Column(db.String(50))
    specialization = db.Column(db.String(100))
    
    # ===== CAMPOS ESPECÃFICOS EMPRESA =====
    company_name = db.Column(db.String(100))
    company_rut = db.Column(db.String(20))
    industry = db.Column(db.String(50))
    
    # ===== LÃMITES Y CUOTAS =====
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
        """Obtener nÃºmero de pacientes activos"""
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
        return f'<Review {self.rating}â˜…>'


# ============================================
# MODELO: PATIENT FILE (Solo Nutricionistas)
# VersiÃ³n 2.0 - Completo con todos los campos
# ============================================

class PatientFile(db.Model):
    __tablename__ = 'patient_files'
    
    id = db.Column(db.Integer, primary_key=True)
    nutricionista_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # ===== NÃšMERO DE FICHA (auto-generado por nutricionista) =====
    ficha_numero = db.Column(db.Integer)  # Ficha #1, #2, etc. por nutricionista
    
    # ===== 1. ANTECEDENTES GENERALES =====
    nombre = db.Column(db.String(100), nullable=False)
    fecha_nacimiento = db.Column(db.String(20))
    fecha_atencion = db.Column(db.DateTime)  # â† AGREGAR ESTA LÃNEA
    sexo = db.Column(db.String(20))
    email = db.Column(db.String(120))
    telefono = db.Column(db.String(20))
    direccion = db.Column(db.String(200))
    ocupacion = db.Column(db.String(100))
    
    # Motivo y objetivos
    motivo_consulta = db.Column(db.Text)
    objetivos = db.Column(db.Text)  # JSON string de objetivos seleccionados
    
    # Historial mÃ©dico
    diagnosticos = db.Column(db.Text)  # DiagnÃ³sticos mÃ©dicos
    medicamentos = db.Column(db.Text)  # Medicamentos actuales
    suplementos = db.Column(db.Text)   # Suplementos actuales
    alergias = db.Column(db.Text)      # Alergias alimentarias
    intolerancias = db.Column(db.Text) # Intolerancias
    cirugias = db.Column(db.Text)      # CirugÃ­as previas
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

    # SÃ­ntomas Gastrointestinales
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
    
    # ===== 2. EVALUACIÃ“N ANTROPOMÃ‰TRICA =====
    # Medidas bÃ¡sicas
    talla_m = db.Column(db.Float)      # Altura en metros
    peso_kg = db.Column(db.Float)      # Peso en kg
    peso_ideal = db.Column(db.Float)   # Peso ideal calculado
    
    # Pliegues cutÃ¡neos (mm) - MÃ©todo Durnin-Womersley
    pliegue_bicipital = db.Column(db.Float)
    pliegue_tricipital = db.Column(db.Float)
    pliegue_subescapular = db.Column(db.Float)
    pliegue_supracrestideo = db.Column(db.Float)
    pliegue_abdominal = db.Column(db.Float)
    pliegue_muslo = db.Column(db.Float)
    pliegue_pantorrilla = db.Column(db.Float)
    
    # PerÃ­metros (cm)
    perimetro_brazo = db.Column(db.Float)
    perimetro_brazo_contraido = db.Column(db.Float)
    perimetro_cintura = db.Column(db.Float)
    perimetro_cadera = db.Column(db.Float)
    perimetro_muslo = db.Column(db.Float)
    perimetro_pantorrilla = db.Column(db.Float)
    perimetro_muneca = db.Column(db.Float)
    
    # DiÃ¡metros Ã³seos (cm)
    diametro_humero = db.Column(db.Float)
    diametro_femur = db.Column(db.Float)
    diametro_muneca = db.Column(db.Float)
    
    # CÃ¡lculos derivados (se calculan automÃ¡ticamente)
    imc = db.Column(db.Float)                    # Ãndice de Masa Corporal
    imc_categoria = db.Column(db.String(50))     # Bajo peso, Normal, Sobrepeso, etc.
    porcentaje_grasa = db.Column(db.Float)       # % Grasa corporal (Siri)
    masa_grasa_kg = db.Column(db.Float)          # Masa grasa en kg
    masa_libre_grasa_kg = db.Column(db.Float)    # Masa libre de grasa
    densidad_corporal = db.Column(db.Float)      # Densidad corporal (Durnin-Womersley)
    indice_cintura_cadera = db.Column(db.Float)  # ICC
    riesgo_cardiovascular = db.Column(db.String(50))  # Bajo, Moderado, Alto
    
    # ===== 3. EVALUACIÃ“N BIOQUÃMICA =====
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
    
    # ===== 4. EVALUACIÃ“N CLÃNICA =====
    presion_sistolica = db.Column(db.Integer)
    presion_diastolica = db.Column(db.Integer)
    frecuencia_cardiaca = db.Column(db.Integer)
    
    # Signos clÃ­nicos (JSON)
    signos_clinicos = db.Column(db.Text)  # Pelo, uÃ±as, piel, etc.
    
    # SÃ­ntomas gastrointestinales
    sintomas_gi = db.Column(db.Text)  # JSON: nÃ¡useas, vÃ³mitos, diarrea, etc.
    frecuencia_evacuacion = db.Column(db.String(50))
    consistencia_heces = db.Column(db.String(50))  # Escala Bristol
    
    # ===== 5. EVALUACIÃ“N DIETÃ‰TICA =====
    # Recordatorio 24 horas (JSON)
    recordatorio_24h = db.Column(db.Text)
    
    # Frecuencia de consumo (JSON)
    frecuencia_consumo = db.Column(db.Text)
    
    # HÃ¡bitos alimentarios
    comidas_por_dia = db.Column(db.Integer)
    horario_desayuno = db.Column(db.String(10))
    horario_almuerzo = db.Column(db.String(10))
    horario_cena = db.Column(db.String(10))
    pica_entre_comidas = db.Column(db.Boolean, default=False)
    come_frente_tv = db.Column(db.Boolean, default=False)
    come_rapido = db.Column(db.Boolean, default=False)
    quien_cocina = db.Column(db.String(100))
    donde_come = db.Column(db.String(100))
    
    # Consumo de lÃ­quidos
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
    
    # Actividad fÃ­sica
    actividad_fisica = db.Column(db.String(50))  # sedentario, ligero, moderado, etc.
    tipo_ejercicio = db.Column(db.String(200))
    frecuencia_ejercicio = db.Column(db.String(50))
    duracion_ejercicio = db.Column(db.String(50))
    
    # HÃ¡bitos
    fuma = db.Column(db.Boolean, default=False)
    cigarrillos_dia = db.Column(db.Integer)
    
    # ===== 7. REQUERIMIENTOS NUTRICIONALES =====
    # Calculados automÃ¡ticamente
    get_kcal = db.Column(db.Float)           # Gasto EnergÃ©tico Total
    geb_kcal = db.Column(db.Float)           # Gasto EnergÃ©tico Basal (Harris-Benedict)
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
    liquido_porcentaje = db.Column(db.Float)  # Porcentaje de líquido en distribución
    liquido_ml = db.Column(db.Float)          # Líquido recomendado en ml
    
    # ===== 8. DIAGNÃ“STICO NUTRICIONAL =====
    diagnostico_nutricional = db.Column(db.Text)
    
    # ===== 9. PLAN DE INTERVENCIÃ“N =====
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
    # MÃ‰TODOS DE CÃLCULO AUTOMÃTICO
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
        """Calcular IMC y categorÃ­a"""
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
        
        # Coeficientes Durnin-Womersley segÃºn sexo y edad
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
        Calcular % de grasa corporal usando ecuaciÃ³n de Siri
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
        """Calcular Ãndice Cintura-Cadera y riesgo cardiovascular"""
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
        Calcular Gasto EnergÃ©tico Basal usando Harris-Benedict revisada
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
        Calcular Gasto EnergÃ©tico Total
        GET = GEB Ã— Factor Actividad Ã— Factor EstrÃ©s
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
        
        self.factor_actividad = factores_actividad.get(self.actividad_fisica, 1.2)
        self.factor_estres = 1.0  # Por defecto, ajustar segÃºn patologÃ­a
        
        self.get_kcal = round(self.geb_kcal * self.factor_actividad * self.factor_estres)
        
        return self.get_kcal
    
    def calcular_macronutrientes(self, proteinas_pct=20, carbohidratos_pct=50, grasas_pct=30, liquido_pct=5):
        """
        Calcular distribución de macronutrientes según GET
        Incluye cálculo de líquido recomendado
        """
        if not self.get_kcal:
            self.calcular_get()
        
        if not self.get_kcal:
            return None
        
        self.proteinas_porcentaje = proteinas_pct
        self.carbohidratos_porcentaje = carbohidratos_pct
        self.grasas_porcentaje = grasas_pct
        self.liquido_porcentaje = liquido_pct
        
        # Proteínas: 4 kcal/g
        self.proteinas_g = round((self.get_kcal * proteinas_pct / 100) / 4)
        
        # Carbohidratos: 4 kcal/g
        self.carbohidratos_g = round((self.get_kcal * carbohidratos_pct / 100) / 4)
        
        # Grasas: 9 kcal/g
        self.grasas_g = round((self.get_kcal * grasas_pct / 100) / 9)
        
        # Fibra: 14g por cada 1000 kcal
        self.fibra_g = round(self.get_kcal * 14 / 1000)
        
        # Líquido: 35ml por kg de peso, ajustado por porcentaje
        if self.peso_kg:
            liquido_base = self.peso_kg * 35
            self.liquido_ml = round(liquido_base * (liquido_pct / 5))  # 5% = 100% del requerimiento
        
        return {
            'proteinas_g': self.proteinas_g,
            'carbohidratos_g': self.carbohidratos_g,
            'grasas_g': self.grasas_g,
            'fibra_g': self.fibra_g,
            'liquido_ml': self.liquido_ml
        }
    
    def calcular_todo(self):
        """Ejecutar todos los cálculos - PRESERVA valores de macros personalizados"""
        self.calcular_imc()
        self.calcular_densidad_corporal()
        self.calcular_porcentaje_grasa()
        self.calcular_icc()
        self.calcular_geb()
        self.calcular_get()
        
        # Usar valores existentes si hay, sino usar defaults
        prot_pct = self.proteinas_porcentaje if self.proteinas_porcentaje else 20
        carb_pct = self.carbohidratos_porcentaje if self.carbohidratos_porcentaje else 50
        gras_pct = self.grasas_porcentaje if self.grasas_porcentaje else 25
        liq_pct = self.liquido_porcentaje if self.liquido_porcentaje else 5
        
        self.calcular_macronutrientes(prot_pct, carb_pct, gras_pct, liq_pct)
    
    def to_dict(self):
        """Convertir a diccionario COMPLETO para API - RETORNA TODOS LOS CAMPOS"""
        return {
            # ===== IDENTIFICACIÃ“N =====
            'id': self.id,
            'ficha_numero': self.ficha_numero,
            'nutricionista_id': self.nutricionista_id,
            
            # ===== 1. ANTECEDENTES GENERALES =====
            'nombre': self.nombre,
            'fecha_nacimiento': self.fecha_nacimiento,
            'fecha_atencion': self.fecha_atencion.strftime('%Y-%m-%d %H:%M') if self.fecha_atencion else None,
            'sexo': self.sexo,
            'email': self.email,
            'telefono': self.telefono,
            'direccion': self.direccion,
            'ocupacion': self.ocupacion,
            'motivo_consulta': self.motivo_consulta,
            'objetivos': self.objetivos,
            'diagnosticos': self.diagnosticos,
            'medicamentos': self.medicamentos,
            'suplementos': self.suplementos,
            'alergias': self.alergias,
            'intolerancias': self.intolerancias,
            'cirugias': self.cirugias,
            'antecedentes_familiares': self.antecedentes_familiares,
            
            # ===== 2. CONDUCTA Y ENTORNO =====
            'profesion': self.profesion,
            'teletrabajo': self.teletrabajo,
            'quien_cocina': self.quien_cocina,
            'con_quien_vive': self.con_quien_vive,
            'donde_come': self.donde_come,
            
            # ===== 3. SALUD GENERAL Y HÃBITOS =====
            'horas_sueno': self.horas_sueno,
            'calidad_sueno': self.calidad_sueno,
            'observaciones_sueno': self.observaciones_sueno,
            'nivel_estres': self.nivel_estres,
            'gatillantes_estres': self.gatillantes_estres,
            'manejo_estres': self.manejo_estres,
            'consumo_alcohol': self.consumo_alcohol,
            'tipo_alcohol': self.tipo_alcohol,
            'tabaco': self.tabaco,
            'drogas': self.drogas,
            'actividad_fisica': self.actividad_fisica,
            'tipo_ejercicio': self.tipo_ejercicio,
            'duracion_ejercicio': self.duracion_ejercicio,
            
            # ===== 4. SÃNTOMAS GASTROINTESTINALES =====
            'frecuencia_evacuacion': self.frecuencia_evacuacion,
            'reflujo': self.reflujo,
            'reflujo_alimento': self.reflujo_alimento,
            'hinchazon': self.hinchazon,
            'hinchazon_alimento': self.hinchazon_alimento,
            'tiene_alergias': self.tiene_alergias,
            'alergias_alimento': self.alergias_alimento,
            
            # ===== 5. REGISTRO 24H Y FRECUENCIA =====
            'registro_24h': self.registro_24h,
            'frecuencia_consumo': self.frecuencia_consumo,
            
            # ===== 6. EVALUACIÃ“N ANTROPOMÃ‰TRICA =====
            'talla_m': self.talla_m,
            'peso_kg': self.peso_kg,
            'peso_ideal': self.peso_ideal,
            'pliegue_bicipital': self.pliegue_bicipital,
            'pliegue_tricipital': self.pliegue_tricipital,
            'pliegue_subescapular': self.pliegue_subescapular,
            'pliegue_supracrestideo': self.pliegue_supracrestideo,
            'pliegue_abdominal': self.pliegue_abdominal,
            'pliegue_muslo': self.pliegue_muslo,
            'pliegue_pantorrilla': self.pliegue_pantorrilla,
            'perimetro_brazo': self.perimetro_brazo,
            'perimetro_brazo_contraido': self.perimetro_brazo_contraido,
            'perimetro_cintura': self.perimetro_cintura,
            'perimetro_cadera': self.perimetro_cadera,
            'perimetro_muslo': self.perimetro_muslo,
            'perimetro_pantorrilla': self.perimetro_pantorrilla,
            'perimetro_muneca': self.perimetro_muneca,
            'diametro_humero': self.diametro_humero,
            'diametro_femur': self.diametro_femur,
            'diametro_muneca': self.diametro_muneca,
            'imc': self.imc,
            'imc_categoria': self.imc_categoria,
            'porcentaje_grasa': self.porcentaje_grasa,
            'masa_grasa_kg': self.masa_grasa_kg,
            'masa_libre_grasa_kg': self.masa_libre_grasa_kg,
            'densidad_corporal': self.densidad_corporal,
            'indice_cintura_cadera': self.indice_cintura_cadera,
            'riesgo_cardiovascular': self.riesgo_cardiovascular,
            
            # ===== 7. EVALUACIÃ“N BIOQUÃMICA =====
            'glucosa_ayunas': self.glucosa_ayunas,
            'hemoglobina_glicada': self.hemoglobina_glicada,
            'colesterol_total': self.colesterol_total,
            'colesterol_hdl': self.colesterol_hdl,
            'colesterol_ldl': self.colesterol_ldl,
            'trigliceridos': self.trigliceridos,
            'hemoglobina': self.hemoglobina,
            'hematocrito': self.hematocrito,
            'ferritina': self.ferritina,
            'vitamina_d': self.vitamina_d,
            'vitamina_b12': self.vitamina_b12,
            'acido_urico': self.acido_urico,
            'creatinina': self.creatinina,
            'albumina': self.albumina,
            'tsh': self.tsh,
            'fecha_examenes': self.fecha_examenes,
            
            # ===== 8. EVALUACIÃ“N CLÃNICA =====
            'presion_sistolica': self.presion_sistolica,
            'presion_diastolica': self.presion_diastolica,
            'frecuencia_cardiaca': self.frecuencia_cardiaca,
            'signos_clinicos': self.signos_clinicos,
            'sintomas_gi': self.sintomas_gi,
            'consistencia_heces': self.consistencia_heces,
            
            # ===== 9. EVALUACIÃ“N DIETÃ‰TICA =====
            'recordatorio_24h': self.recordatorio_24h,
            'comidas_por_dia': self.comidas_por_dia,
            'horario_desayuno': self.horario_desayuno,
            'horario_almuerzo': self.horario_almuerzo,
            'horario_cena': self.horario_cena,
            'pica_entre_comidas': self.pica_entre_comidas,
            'come_frente_tv': self.come_frente_tv,
            'come_rapido': self.come_rapido,
            'consumo_agua_litros': self.consumo_agua_litros,
            'consumo_cafe_tazas': self.consumo_cafe_tazas,
            'consumo_te_tazas': self.consumo_te_tazas,
            'consumo_bebidas_azucaradas': self.consumo_bebidas_azucaradas,
            
            # ===== 10. REQUERIMIENTOS NUTRICIONALES =====
            'get_kcal': self.get_kcal,
            'geb_kcal': self.geb_kcal,
            'factor_actividad': self.factor_actividad,
            'factor_estres': self.factor_estres,
            'proteinas_g': self.proteinas_g,
            'proteinas_porcentaje': self.proteinas_porcentaje,
            'carbohidratos_g': self.carbohidratos_g,
            'carbohidratos_porcentaje': self.carbohidratos_porcentaje,
            'grasas_g': self.grasas_g,
            'grasas_porcentaje': self.grasas_porcentaje,
            'fibra_g': self.fibra_g,
            'liquido_porcentaje': self.liquido_porcentaje,
            'liquido_ml': self.liquido_ml,
            
            # ===== 11. DIAGNÃ“STICO Y PLAN =====
            'diagnostico_nutricional': self.diagnostico_nutricional,
            'objetivos_nutricionales': self.objetivos_nutricionales,
            'plan_alimentario': self.plan_alimentario,
            'indicaciones': self.indicaciones,
            'metas_corto_plazo': self.metas_corto_plazo,
            'metas_mediano_plazo': self.metas_mediano_plazo,
            'metas_largo_plazo': self.metas_largo_plazo,
            'fecha_proxima_cita': self.fecha_proxima_cita.strftime('%Y-%m-%d %H:%M') if self.fecha_proxima_cita else None,
            'notas_seguimiento': self.notas_seguimiento,
            
            # ===== METADATOS =====
            'edad': self.calcular_edad(),
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S') if self.created_at else None,
            'updated_at': self.updated_at.strftime('%Y-%m-%d %H:%M:%S') if self.updated_at else None,
            'is_active': self.is_active
        }

    def __repr__(self):
        return f'<PatientFile #{self.ficha_numero} - {self.nombre}>'