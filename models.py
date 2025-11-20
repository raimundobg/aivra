"""
models.py - Sistema de Base de Datos Escalable
Versión: 1.0 - MVP con estructura escalable
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
    city = db.Column(db.String(50), nullable=True)  # Obligatorio solo si Chile
    
    # ===== TIPO DE CUENTA Y PLAN =====
    user_type = db.Column(db.String(20), nullable=False, default=UserType.CLIENTE)
    subscription_plan = db.Column(db.String(20), nullable=False, default=SubscriptionPlan.FREE)
    
    # ===== CAMPOS OPCIONALES COMUNES =====
    phone = db.Column(db.String(20))
    referral_code = db.Column(db.String(8))
    
    # ===== CAMPOS ESPECÍFICOS NUTRICIONISTA =====
    license_number = db.Column(db.String(50))  # OPCIONAL - sin fricción
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
        """Hashear contraseña"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Verificar contraseña"""
        return check_password_hash(self.password_hash, password)
    
    def get_full_name(self):
        """Obtener nombre completo"""
        if self.user_type == UserType.EMPRESA and self.company_name:
            return self.company_name
        return f"{self.first_name} {self.last_name}"
    
    def get_age(self):
        """Calcular edad"""
        today = date.today()
        return today.year - self.birth_date.year - (
            (today.month, today.day) < (self.birth_date.month, self.birth_date.day)
        )
    
    def can_generate_recipe(self):
        """Verificar si puede generar recetas según su plan"""
        # Resetear contador si cambió el mes
        today = date.today()
        if self.last_recipe_reset.month != today.month or \
           self.last_recipe_reset.year != today.year:
            self.recipes_this_month = 0
            self.last_recipe_reset = today
            db.session.commit()
        
        # Verificar límites según plan
        if self.subscription_plan == SubscriptionPlan.FREE:
            return self.recipes_this_month < 2  # 2 recetas gratis/mes
        return True  # Nutricionista y Empresa: ilimitado
    
    def get_recipes_remaining(self):
        """Obtener recetas restantes este mes"""
        if self.subscription_plan == SubscriptionPlan.FREE:
            return max(0, 2 - self.recipes_this_month)
        return float('inf')  # Ilimitado
    
    def increment_recipe_count(self):
        """Incrementar contador de recetas"""
        self.recipes_this_month += 1
        db.session.commit()
    
    def get_recipe_count(self):
        """Total de recetas creadas"""
        return self.recipes.count()
    
    def get_recent_recipes(self, limit=5):
        """Obtener recetas recientes"""
        return self.recipes.order_by(UserRecipe.created_at.desc()).limit(limit).all()
    
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
    
    # Si fue creada por nutricionista para paciente
    patient_file_id = db.Column(db.Integer, db.ForeignKey('patient_files.id'), nullable=True)
    
    # Relaciones
    reviews = db.relationship('Review', backref='recipe', lazy='dynamic',
                            cascade='all, delete-orphan')
    
    def get_average_rating(self):
        """Calcular rating promedio"""
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
    rating = db.Column(db.Integer, nullable=False)  # 1-5
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
# Estructura básica - ESCALABLE para agregar más campos
# ============================================

class PatientFile(db.Model):
    __tablename__ = 'patient_files'
    
    id = db.Column(db.Integer, primary_key=True)
    nutritionist_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # ===== DATOS BÁSICOS DEL PACIENTE =====
    patient_name = db.Column(db.String(100), nullable=False)
    patient_email = db.Column(db.String(120))
    
    # ===== INFORMACIÓN CLÍNICA BÁSICA =====
    medical_conditions = db.Column(db.Text)  # Condiciones médicas
    health_goals = db.Column(db.Text)  # Objetivos de salud
    
    # ===== CAMPOS ESCALABLES (agregar más adelante) =====
    # weight = db.Column(db.Float)  # 🔜 Agregar cuando necesites
    # height = db.Column(db.Float)  # 🔜 Agregar cuando necesites
    # bmi = db.Column(db.Float)     # 🔜 Agregar cuando necesites
    # allergies = db.Column(db.Text) # 🔜 Agregar cuando necesites
    
    # ===== METADATOS =====
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    
    # Relaciones
    recipes = db.relationship('UserRecipe', backref='patient_file', lazy='dynamic')
    
    def __repr__(self):
        return f'<PatientFile {self.patient_name}>'