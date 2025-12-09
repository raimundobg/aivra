"""
forms.py - Formularios WTForms para ZenLab Pro
Version: 2.0 - Formularios de Pacientes con Validacion Automatica
CORREGIDO: Campos de diagnostico y plan que no se guardaban
"""
from flask_wtf import FlaskForm
from wtforms import (
    StringField, TextAreaField, SelectField, SelectMultipleField,
    FloatField, IntegerField, BooleanField, DateField, DateTimeLocalField,
    HiddenField, FieldList, FormField
)
from wtforms.validators import (
    DataRequired, Optional, Email, NumberRange, Length, ValidationError
)
from wtforms.widgets import NumberInput


# ============================================
# OPCIONES PARA SELECTS
# ============================================

SEXO_CHOICES = [
    ('', 'Seleccionar'),
    ('Masculino', 'Masculino'),
    ('Femenino', 'Femenino')
]

OBJETIVOS_CHOICES = [
    ('fraccionamiento', 'Mejorar fraccionamiento'),
    ('agua', 'Aumentar consumo de agua'),
    ('consciente', 'Alimentacion consciente'),
    ('proteina', 'Aumentar proteina'),
    ('peso', 'Control de peso'),
    ('musculo', 'Ganar musculo'),
    ('energia', 'Mejorar energia'),
    ('digestion', 'Mejorar digestion')
]

DIAGNOSTICOS_CHOICES = [
    ('colesterol_alto', 'Colesterol Alto'),
    ('depresion', 'Depresion'),
    ('diabetes', 'Diabetes'),
    ('estrenimiento', 'Estrenimiento Cronico'),
    ('hipertension', 'Hipertension'),
    ('hipotiroidismo', 'Hipotiroidismo'),
    ('hipertiroidismo', 'Hipertiroidismo'),
    ('ingesta_emocional', 'Ingesta Emocional'),
    ('sarcopenia', 'Sarcopenia'),
    ('otros', 'Otros')
]

MEDICAMENTOS_CHOICES = [
    ('ansiolitico', 'Ansiolitico'),
    ('antidepresivo', 'Antidepresivo'),
    ('diabetes', 'Diabetes'),
    ('dolor_cronico', 'Dolor Cronico'),
    ('enfermedades_cronicas', 'Enfermedades Cronicas'),
    ('hipertension', 'Hipertension'),
    ('otros', 'Otros')
]

SUPLEMENTOS_CHOICES = [
    ('ashwaganda', 'Ashwaganda'),
    ('betadanina', 'Betadanina'),
    ('b12', 'Vitamina B12'),
    ('c', 'Vitamina C'),
    ('cordyceps', 'Cordyceps'),
    ('creatina', 'Creatina'),
    ('d', 'Vitamina D'),
    ('e', 'Vitamina E'),
    ('hierro', 'Hierro'),
    ('magnesio', 'Magnesio'),
    ('melena_leon', 'Melena de Leon'),
    ('omega3', 'Omega 3'),
    ('proteina_polvo', 'Proteina en Polvo'),
    ('reishi', 'Reishi'),
    ('zinc', 'Zinc')
]

PROFESION_CHOICES = [
    ('', 'Seleccionar'),
    ('abogado', 'Abogado'),
    ('administrativo', 'Administrativo'),
    ('arquitecto', 'Arquitecto'),
    ('comercial', 'Ing. Comercial'),
    ('contador', 'Contador'),
    ('disenador', 'Disenador'),
    ('empresario', 'Empresario'),
    ('enfermero', 'Enfermero/a'),
    ('estudiante', 'Estudiante'),
    ('ingeniero', 'Ingeniero'),
    ('medico', 'Medico'),
    ('profesor', 'Profesor/a'),
    ('psicologo', 'Psicologo/a'),
    ('vendedor', 'Vendedor'),
    ('otro', 'Otro')
]

TELETRABAJO_CHOICES = [
    ('', 'Seleccionar'),
    ('si', 'Si, teletrabajo'),
    ('no', 'No, va a oficina'),
    ('hibrido', 'Hibrido')
]

QUIEN_COCINA_CHOICES = [
    ('yo', 'Yo mismo/a'),
    ('pareja', 'Pareja'),
    ('empleada', 'Empleada del hogar'),
    ('familia', 'Otro familiar'),
    ('delivery', 'Delivery/Comida preparada')
]

CON_QUIEN_VIVE_CHOICES = [
    ('solo', 'Solo/a'),
    ('pareja', 'Pareja'),
    ('hijos', 'Hijos'),
    ('padres', 'Padres'),
    ('companeros', 'Companeros de piso'),
    ('mascotas', 'Mascotas')
]

DONDE_COME_CHOICES = [
    ('casa', 'En casa'),
    ('trabajo', 'En el trabajo'),
    ('restaurante', 'Restaurante'),
    ('casino', 'Casino/Cafeteria'),
    ('auto', 'En el auto')
]

HORAS_SUENO_CHOICES = [
    ('', 'Seleccionar'),
    ('3-5', '3 a 5 horas'),
    ('5-6', '5 a 6 horas'),
    ('6-7', '6 a 7 horas'),
    ('7-8', '7 a 8 horas'),
    ('+8', 'Mas de 8 horas')
]

CONSUMO_ALCOHOL_CHOICES = [
    ('', 'Seleccionar'),
    ('nunca', 'No consume'),
    ('1_semana', '1 vez a la semana'),
    ('2_semana', '2 veces a la semana'),
    ('3_mas', '3+ veces a la semana')
]

TIPO_ALCOHOL_CHOICES = [
    ('destilado', 'Destilado'),
    ('vino', 'Vino'),
    ('cerveza', 'Cerveza')
]

SI_NO_CHOICES = [
    ('no', 'No'),
    ('si', 'Si')
]

ACTIVIDAD_FISICA_CHOICES = [
    ('', 'Seleccionar'),
    ('sedentario', 'Sedentario (sin ejercicio)'),
    ('ligero', 'Ligero (1-2 veces/semana)'),
    ('moderado', 'Moderado (3-4 veces/semana)'),
    ('activo', 'Activo (5-6 veces/semana)'),
    ('muy_activo', 'Muy Activo (diario)')
]

DURACION_EJERCICIO_CHOICES = [
    ('', 'Seleccionar'),
    ('20', '20 minutos'),
    ('30', '30 minutos'),
    ('45', '45 minutos'),
    ('60', '60 minutos'),
    ('90', '90 minutos'),
    ('120', '2 horas'),
    ('180', '3+ horas')
]

FRECUENCIA_EVACUACION_CHOICES = [
    ('', 'Seleccionar'),
    ('1_dia', '1 vez al dia'),
    ('2_dia', '2+ veces al dia'),
    ('dia_medio', 'Dia por medio'),
    ('2_semana', '2 veces a la semana'),
    ('menos', 'Menos frecuente')
]


# ============================================
# FORMULARIO: FICHA DE PACIENTE (INTAKE)
# ============================================

class PatientIntakeForm(FlaskForm):
    """
    Formulario de ingreso de pacientes - WTForms
    Los IDs HTML se generan automaticamente del nombre del campo.
    """
    
    # ===== SECCION 1: ANTECEDENTES GENERALES =====
    nombre = StringField(
        'Nombre Completo',
        validators=[DataRequired(message='El nombre es obligatorio'), Length(max=100)],
        render_kw={'placeholder': 'Ej: Maria Gonzalez Perez', 'class': 'form-control'}
    )
    
    fecha_nacimiento = StringField(
        'Fecha de Nacimiento',
        validators=[DataRequired(message='La fecha de nacimiento es obligatoria')],
        render_kw={'type': 'date', 'class': 'form-control'}
    )
    
    sexo = SelectField(
        'Sexo',
        choices=SEXO_CHOICES,
        validators=[DataRequired(message='El sexo es obligatorio')],
        render_kw={'class': 'form-select'}
    )
    
    fecha_atencion = StringField(
        'Fecha de Atencion',
        validators=[Optional()],
        render_kw={'type': 'datetime-local', 'class': 'form-control'}
    )
    
    email = StringField(
        'Email',
        validators=[Optional(), Email(message='Email invalido')],
        render_kw={'placeholder': 'correo@ejemplo.com', 'class': 'form-control'}
    )
    
    telefono = StringField(
        'Telefono',
        validators=[Optional(), Length(max=20)],
        render_kw={'placeholder': '+56 9 1234 5678', 'class': 'form-control'}
    )
    
    motivo_consulta = TextAreaField(
        'Motivo de Consulta',
        validators=[DataRequired(message='El motivo de consulta es obligatorio')],
        render_kw={'rows': 3, 'placeholder': 'Describe el motivo principal de la consulta...', 'class': 'form-control'}
    )
    
    objetivos = HiddenField('Objetivos')  # Se llena via JavaScript
    
    diagnosticos = SelectMultipleField(
        'Diagnosticos Medicos',
        choices=DIAGNOSTICOS_CHOICES,
        validators=[Optional()],
        render_kw={'class': 'form-select', 'size': '5'}
    )
    
    medicamentos = SelectMultipleField(
        'Medicamentos Actuales',
        choices=MEDICAMENTOS_CHOICES,
        validators=[Optional()],
        render_kw={'class': 'form-select', 'size': '5'}
    )
    
    suplementos = SelectMultipleField(
        'Suplementos',
        choices=SUPLEMENTOS_CHOICES,
        validators=[Optional()],
        render_kw={'class': 'form-select', 'size': '4'}
    )
    
    alergias = TextAreaField(
        'Alergias Alimentarias',
        validators=[Optional()],
        render_kw={'rows': 2, 'class': 'form-control'}
    )
    
    intolerancias = TextAreaField(
        'Intolerancias',
        validators=[Optional()],
        render_kw={'rows': 2, 'class': 'form-control'}
    )
    
    # ===== SECCION 2: CONDUCTA Y ENTORNO =====
    profesion = SelectField(
        'Profesion / Ocupacion',
        choices=PROFESION_CHOICES,
        validators=[Optional()],
        render_kw={'class': 'form-select'}
    )
    
    ocupacion = StringField(
        'Ocupacion (detalle)',
        validators=[Optional(), Length(max=100)],
        render_kw={'class': 'form-control'}
    )
    
    teletrabajo = SelectField(
        'Trabaja desde casa?',
        choices=TELETRABAJO_CHOICES,
        validators=[Optional()],
        render_kw={'class': 'form-select'}
    )
    
    quien_cocina = SelectMultipleField(
        'Quien cocina en casa?',
        choices=QUIEN_COCINA_CHOICES,
        validators=[Optional()],
        render_kw={'class': 'form-select', 'size': '3'}
    )
    
    con_quien_vive = SelectMultipleField(
        'Con quien vive?',
        choices=CON_QUIEN_VIVE_CHOICES,
        validators=[Optional()],
        render_kw={'class': 'form-select', 'size': '4'}
    )
    
    donde_come = SelectMultipleField(
        'Donde come habitualmente?',
        choices=DONDE_COME_CHOICES,
        validators=[Optional()],
        render_kw={'class': 'form-select', 'size': '4'}
    )
    
    # ===== SECCION 3: ANTROPOMETRIA =====
    talla_m = FloatField(
        'Talla (m)',
        validators=[Optional(), NumberRange(min=1.0, max=2.5, message='Talla debe estar entre 1.00 y 2.50 m')],
        render_kw={
            'step': '0.01', 'min': '1.00', 'max': '2.50',
            'placeholder': 'Ej: 1.65', 'class': 'form-control',
            'hx-post': '/api/calcular-imc', 'hx-trigger': 'change', 'hx-target': '#imc-result'
        }
    )
    
    peso_kg = FloatField(
        'Peso (kg)',
        validators=[Optional(), NumberRange(min=30, max=300, message='Peso debe estar entre 30 y 300 kg')],
        render_kw={
            'step': '0.1', 'min': '30', 'max': '300',
            'placeholder': 'Ej: 70.5', 'class': 'form-control',
            'hx-post': '/api/calcular-imc', 'hx-trigger': 'change', 'hx-target': '#imc-result'
        }
    )
    
    peso_ideal = FloatField(
        'Peso Ideal (kg)',
        validators=[Optional()],
        render_kw={'step': '0.1', 'class': 'form-control', 'readonly': True}
    )
    
    # Pliegues cutaneos
    pliegue_bicipital = FloatField(
        'Pliegue Bicipital (mm)',
        validators=[Optional(), NumberRange(min=0)],
        render_kw={'step': '0.1', 'placeholder': 'Bicipital', 'class': 'form-control'}
    )
    
    pliegue_tricipital = FloatField(
        'Pliegue Tricipital (mm)',
        validators=[Optional(), NumberRange(min=0)],
        render_kw={'step': '0.1', 'placeholder': 'Tricipital', 'class': 'form-control'}
    )
    
    pliegue_subescapular = FloatField(
        'Pliegue Subescapular (mm)',
        validators=[Optional(), NumberRange(min=0)],
        render_kw={'step': '0.1', 'placeholder': 'Subescapular', 'class': 'form-control'}
    )
    
    pliegue_supracrestideo = FloatField(
        'Pliegue Supracrestideo (mm)',
        validators=[Optional(), NumberRange(min=0)],
        render_kw={'step': '0.1', 'placeholder': 'Supracrestideo', 'class': 'form-control'}
    )
    
    # Perimetros
    perimetro_brazo = FloatField(
        'Perimetro Brazo (cm)',
        validators=[Optional(), NumberRange(min=0)],
        render_kw={'step': '0.1', 'placeholder': 'Brazo Relajado', 'class': 'form-control'}
    )
    
    perimetro_cintura = FloatField(
        'Perimetro Cintura (cm)',
        validators=[Optional(), NumberRange(min=0)],
        render_kw={'step': '0.1', 'placeholder': 'Cintura', 'class': 'form-control'}
    )
    
    perimetro_cadera = FloatField(
        'Perimetro Cadera (cm)',
        validators=[Optional(), NumberRange(min=0)],
        render_kw={'step': '0.1', 'placeholder': 'Cadera', 'class': 'form-control'}
    )
    
    perimetro_pantorrilla = FloatField(
        'Perimetro Pantorrilla (cm)',
        validators=[Optional(), NumberRange(min=0)],
        render_kw={'step': '0.1', 'placeholder': 'Pantorrilla', 'class': 'form-control'}
    )
    
    perimetro_muneca = FloatField(
        'Perimetro Muneca (cm)',
        validators=[Optional(), NumberRange(min=0)],
        render_kw={'step': '0.1', 'placeholder': 'Muneca', 'class': 'form-control'}
    )
    
    # ===== SECCION 4: SALUD GENERAL Y HABITOS =====
    # CORREGIDO: horas_sueno es SelectField (String en el modelo)
    horas_sueno = SelectField(
        'Horas de Sueno',
        choices=HORAS_SUENO_CHOICES,
        validators=[Optional()],
        render_kw={'class': 'form-select'}
    )
    
    calidad_sueno = IntegerField(
        'Calidad del Sueno (1-10)',
        validators=[Optional(), NumberRange(min=1, max=10)],
        default=5,
        render_kw={'type': 'range', 'min': '1', 'max': '10', 'class': 'form-range'}
    )
    
    observaciones_sueno = StringField(
        'Observaciones Sueno',
        validators=[Optional()],
        render_kw={'placeholder': 'Ej: Insomnio, apnea...', 'class': 'form-control'}
    )
    
    nivel_estres = IntegerField(
        'Nivel de Estres (1-10)',
        validators=[Optional(), NumberRange(min=1, max=10)],
        default=5,
        render_kw={'type': 'range', 'min': '1', 'max': '10', 'class': 'form-range'}
    )
    
    gatillantes_estres = StringField(
        'Gatillantes del Estres',
        validators=[Optional()],
        render_kw={'placeholder': 'Ej: Trabajo, familia...', 'class': 'form-control'}
    )
    
    manejo_estres = StringField(
        'Manejo del Estres',
        validators=[Optional()],
        render_kw={'placeholder': 'Ej: Meditacion, ejercicio...', 'class': 'form-control'}
    )
    
    consumo_alcohol = SelectField(
        'Consumo de Alcohol',
        choices=CONSUMO_ALCOHOL_CHOICES,
        validators=[Optional()],
        render_kw={'class': 'form-select'}
    )
    
    tipo_alcohol = SelectMultipleField(
        'Tipo de Alcohol',
        choices=TIPO_ALCOHOL_CHOICES,
        validators=[Optional()],
        render_kw={'class': 'form-select', 'size': '3'}
    )
    
    tabaco = SelectField(
        'Fuma?',
        choices=SI_NO_CHOICES,
        validators=[Optional()],
        render_kw={'class': 'form-select'}
    )
    
    drogas = SelectField(
        'Drogas?',
        choices=SI_NO_CHOICES,
        validators=[Optional()],
        render_kw={'class': 'form-select'}
    )
    
    actividad_fisica = SelectField(
        'Actividad Fisica Semanal',
        choices=ACTIVIDAD_FISICA_CHOICES,
        validators=[Optional()],
        render_kw={'class': 'form-select'}
    )
    
    tipo_ejercicio = StringField(
        'Tipo de Ejercicio',
        validators=[Optional()],
        render_kw={'placeholder': 'Ej: Caminata, pesas, yoga...', 'class': 'form-control'}
    )
    
    duracion_ejercicio = SelectField(
        'Duracion por Sesion',
        choices=DURACION_EJERCICIO_CHOICES,
        validators=[Optional()],
        render_kw={'class': 'form-select'}
    )
    
    # ===== SECCION 5: SINTOMAS GASTROINTESTINALES =====
    frecuencia_evacuacion = SelectField(
        'Frecuencia de Evacuacion',
        choices=FRECUENCIA_EVACUACION_CHOICES,
        validators=[Optional()],
        render_kw={'class': 'form-select'}
    )
    
    reflujo = SelectField(
        'Presenta Reflujo?',
        choices=SI_NO_CHOICES,
        validators=[Optional()],
        render_kw={'class': 'form-select'}
    )
    
    reflujo_alimento = StringField(
        'Con que alimentos? (Reflujo)',
        validators=[Optional()],
        render_kw={'placeholder': 'Escriba los alimentos...', 'class': 'form-control'}
    )
    
    hinchazon = SelectField(
        'Presenta Hinchazon?',
        choices=SI_NO_CHOICES,
        validators=[Optional()],
        render_kw={'class': 'form-select'}
    )
    
    hinchazon_alimento = StringField(
        'Con que alimentos? (Hinchazon)',
        validators=[Optional()],
        render_kw={'placeholder': 'Escriba los alimentos...', 'class': 'form-control'}
    )
    
    tiene_alergias = SelectField(
        'Alergias / Intolerancias?',
        choices=SI_NO_CHOICES,
        validators=[Optional()],
        render_kw={'class': 'form-select'}
    )
    
    alergias_alimento = StringField(
        'A que alimentos?',
        validators=[Optional()],
        render_kw={'placeholder': 'Escriba los alimentos...', 'class': 'form-control'}
    )
    
    # ===== SECCION 6: REGISTRO 24H (como JSON) =====
    registro_24h = HiddenField('Registro 24 Horas')
    
    # ===== SECCION 7: FRECUENCIA DE CONSUMO =====
    # Se almacena como JSON en un campo hidden
    frecuencia_consumo = HiddenField('Frecuencia de Consumo')
    
    # Campos individuales de frecuencia (0-7)
    freq_cereales_desayuno = IntegerField(default=0, render_kw={'type': 'hidden'})
    freq_arroz_pasta = IntegerField(default=0, render_kw={'type': 'hidden'})
    freq_pan = IntegerField(default=0, render_kw={'type': 'hidden'})
    tipo_pan = StringField(validators=[Optional()])
    freq_verduras = IntegerField(default=0, render_kw={'type': 'hidden'})
    freq_frutas = IntegerField(default=0, render_kw={'type': 'hidden'})
    cuales_frutas = StringField(validators=[Optional()])
    freq_jugos = IntegerField(default=0, render_kw={'type': 'hidden'})
    freq_legumbres = IntegerField(default=0, render_kw={'type': 'hidden'})
    freq_carnes_blancas = IntegerField(default=0, render_kw={'type': 'hidden'})
    freq_carnes_rojas = IntegerField(default=0, render_kw={'type': 'hidden'})
    freq_huevo = IntegerField(default=0, render_kw={'type': 'hidden'})
    freq_pescado = IntegerField(default=0, render_kw={'type': 'hidden'})
    freq_cecinas = IntegerField(default=0, render_kw={'type': 'hidden'})
    freq_lacteos = IntegerField(default=0, render_kw={'type': 'hidden'})
    freq_aceite = IntegerField(default=0, render_kw={'type': 'hidden'})
    freq_frutos_secos = IntegerField(default=0, render_kw={'type': 'hidden'})
    cuales_frutos_secos = StringField(validators=[Optional()])
    freq_dulces = IntegerField(default=0, render_kw={'type': 'hidden'})
    freq_frituras = IntegerField(default=0, render_kw={'type': 'hidden'})
    freq_agua = IntegerField(default=0, render_kw={'type': 'hidden'})
    freq_cafe_te = IntegerField(default=0, render_kw={'type': 'hidden'})
    freq_bebidas_azucaradas = IntegerField(default=0, render_kw={'type': 'hidden'})


# ============================================
# FORMULARIO: FICHA PACIENTE (EDIT/VIEW)
# ============================================

class PatientFileForm(PatientIntakeForm):
    """
    Formulario para editar ficha de paciente existente.
    Hereda de PatientIntakeForm y agrega campos adicionales.
    """
    
    # ===== EVALUACION BIOQUIMICA =====
    fecha_examenes = StringField(
        'Fecha de Examenes',
        validators=[Optional()],
        render_kw={'type': 'date', 'class': 'form-control'}
    )
    
    glucosa_ayunas = FloatField(
        'Glucosa Ayunas (mg/dL)',
        validators=[Optional()],
        render_kw={'step': '0.1', 'class': 'form-control'}
    )
    
    hemoglobina_glicada = FloatField(
        'HbA1c (%)',
        validators=[Optional()],
        render_kw={'step': '0.1', 'class': 'form-control'}
    )
    
    colesterol_total = FloatField(
        'Colesterol Total (mg/dL)',
        validators=[Optional()],
        render_kw={'step': '0.1', 'class': 'form-control'}
    )
    
    colesterol_hdl = FloatField(
        'HDL (mg/dL)',
        validators=[Optional()],
        render_kw={'step': '0.1', 'class': 'form-control'}
    )
    
    colesterol_ldl = FloatField(
        'LDL (mg/dL)',
        validators=[Optional()],
        render_kw={'step': '0.1', 'class': 'form-control'}
    )
    
    trigliceridos = FloatField(
        'Trigliceridos (mg/dL)',
        validators=[Optional()],
        render_kw={'step': '0.1', 'class': 'form-control'}
    )
    
    hemoglobina = FloatField(
        'Hemoglobina (g/dL)',
        validators=[Optional()],
        render_kw={'step': '0.1', 'class': 'form-control'}
    )
    
    hematocrito = FloatField(
        'Hematocrito (%)',
        validators=[Optional()],
        render_kw={'step': '0.1', 'class': 'form-control'}
    )
    
    ferritina = FloatField(
        'Ferritina (ng/mL)',
        validators=[Optional()],
        render_kw={'step': '0.1', 'class': 'form-control'}
    )
    
    vitamina_d = FloatField(
        'Vitamina D (ng/mL)',
        validators=[Optional()],
        render_kw={'step': '0.1', 'class': 'form-control'}
    )
    
    vitamina_b12 = FloatField(
        'Vitamina B12 (pg/mL)',
        validators=[Optional()],
        render_kw={'step': '0.1', 'class': 'form-control'}
    )
    
    acido_urico = FloatField(
        'Acido Urico (mg/dL)',
        validators=[Optional()],
        render_kw={'step': '0.1', 'class': 'form-control'}
    )
    
    creatinina = FloatField(
        'Creatinina (mg/dL)',
        validators=[Optional()],
        render_kw={'step': '0.1', 'class': 'form-control'}
    )
    
    albumina = FloatField(
        'Albumina (g/dL)',
        validators=[Optional()],
        render_kw={'step': '0.1', 'class': 'form-control'}
    )
    
    tsh = FloatField(
        'TSH (mIU/L)',
        validators=[Optional()],
        render_kw={'step': '0.01', 'class': 'form-control'}
    )
    
    # ===== EVALUACION CLINICA =====
    presion_sistolica = IntegerField(
        'Presion Sistolica (mmHg)',
        validators=[Optional(), NumberRange(min=60, max=250)],
        render_kw={'class': 'form-control'}
    )
    
    presion_diastolica = IntegerField(
        'Presion Diastolica (mmHg)',
        validators=[Optional(), NumberRange(min=40, max=150)],
        render_kw={'class': 'form-control'}
    )
    
    frecuencia_cardiaca = IntegerField(
        'Frecuencia Cardiaca (lpm)',
        validators=[Optional(), NumberRange(min=40, max=200)],
        render_kw={'class': 'form-control'}
    )
    
    # ===== REQUERIMIENTOS NUTRICIONALES =====
    proteinas_porcentaje = FloatField(
        'Proteinas (%)',
        validators=[Optional(), NumberRange(min=10, max=40)],
        default=20,
        render_kw={'min': '10', 'max': '40', 'class': 'form-control'}
    )
    
    carbohidratos_porcentaje = FloatField(
        'Carbohidratos (%)',
        validators=[Optional(), NumberRange(min=30, max=70)],
        default=50,
        render_kw={'min': '30', 'max': '70', 'class': 'form-control'}
    )
    
    grasas_porcentaje = FloatField(
        'Grasas (%)',
        validators=[Optional(), NumberRange(min=15, max=45)],
        default=30,
        render_kw={'min': '15', 'max': '45', 'class': 'form-control'}
    )
    
    liquido_porcentaje = FloatField(
        'Líquido (%)',
        validators=[Optional(), NumberRange(min=0, max=20)],
        default=5,
        render_kw={'min': '0', 'max': '20', 'class': 'form-control'}
    )
    
    # ===== SECCION 9: DIAGNOSTICO Y PLAN (CAMPOS CORREGIDOS) =====
    diagnostico_nutricional = TextAreaField(
        'Diagnostico Nutricional',
        validators=[Optional(), Length(max=2000)],
        render_kw={'rows': 4, 'class': 'form-control', 'placeholder': 'Escriba el diagnostico nutricional...'}
    )
    
    objetivos_nutricionales = TextAreaField(
        'Objetivos Nutricionales',
        validators=[Optional(), Length(max=2000)],
        render_kw={'rows': 3, 'placeholder': 'Objetivos SMART del paciente...', 'class': 'form-control'}
    )
    
    indicaciones = TextAreaField(
        'Indicaciones',
        validators=[Optional(), Length(max=3000)],
        render_kw={'rows': 4, 'class': 'form-control', 'placeholder': 'Indicaciones y recomendaciones...'}
    )
    
    # CORREGIDO: Nombre correcto del campo (fecha_proxima_cita, no proxima_cita)
    fecha_proxima_cita = StringField(
        'Fecha Proxima Cita',
        validators=[Optional()],
        render_kw={'type': 'datetime-local', 'class': 'form-control'}
    )
    
    # CORREGIDO: Nombre correcto del campo (notas_seguimiento, no notas)
    notas_seguimiento = TextAreaField(
        'Notas de Seguimiento',
        validators=[Optional(), Length(max=2000)],
        render_kw={'rows': 3, 'class': 'form-control', 'placeholder': 'Notas adicionales...'}
    )
    
    # ===== CAMPOS CALCULADOS (readonly) =====
    imc = FloatField('IMC', render_kw={'readonly': True, 'class': 'form-control-plaintext'})
    imc_categoria = StringField('Categoria IMC', render_kw={'readonly': True})
    porcentaje_grasa = FloatField('% Grasa', render_kw={'readonly': True})
    masa_grasa_kg = FloatField('Masa Grasa (kg)', render_kw={'readonly': True})
    masa_libre_grasa_kg = FloatField('Masa Libre Grasa (kg)', render_kw={'readonly': True})
    densidad_corporal = FloatField('Densidad Corporal', render_kw={'readonly': True})
    indice_cintura_cadera = FloatField('ICC', render_kw={'readonly': True})
    riesgo_cardiovascular = StringField('Riesgo CV', render_kw={'readonly': True})
    geb_kcal = FloatField('GEB (kcal)', render_kw={'readonly': True})
    get_kcal = FloatField('GET (kcal)', render_kw={'readonly': True})
    factor_actividad = FloatField('Factor Actividad', render_kw={'readonly': True})
    factor_estres = FloatField('Factor Estres', render_kw={'readonly': True})
    proteinas_g = FloatField('Proteinas (g)', render_kw={'readonly': True})
    carbohidratos_g = FloatField('Carbohidratos (g)', render_kw={'readonly': True})
    grasas_g = FloatField('Grasas (g)', render_kw={'readonly': True})
    fibra_g = FloatField('Fibra (g)', render_kw={'readonly': True})
    
    # ===== METADATOS =====
    is_active = BooleanField('Paciente Activo', default=True)


# ============================================
# HELPER: Convertir lista a string y viceversa
# ============================================

def list_to_string(value):
    """Convierte lista a string separado por comas"""
    if isinstance(value, list):
        return ','.join(value)
    return value or ''


def string_to_list(value):
    """Convierte string separado por comas a lista"""
    if isinstance(value, str) and value:
        return [v.strip() for v in value.split(',') if v.strip()]
    return value if isinstance(value, list) else []


# ============================================
# HELPER: Poblar formulario desde paciente
# ============================================

def populate_form_from_patient(form, patient):
    """
    Poblar un formulario WTForms con los datos de un paciente existente.
    Maneja correctamente los diferentes tipos de campos.
    """
    from datetime import datetime
    
    # Campos de texto simples (incluye horas_sueno que es String en el modelo)
    simple_text_fields = [
        'nombre', 'sexo', 'email', 'telefono', 'motivo_consulta',
        'profesion', 'ocupacion', 'teletrabajo',
        'horas_sueno', 'observaciones_sueno', 'gatillantes_estres', 'manejo_estres',
        'consumo_alcohol', 'tabaco', 'drogas',
        'actividad_fisica', 'tipo_ejercicio', 'duracion_ejercicio',
        'frecuencia_evacuacion', 'reflujo', 'reflujo_alimento',
        'hinchazon', 'hinchazon_alimento', 'tiene_alergias', 'alergias_alimento',
        'alergias', 'intolerancias',
        # Campos de diagnostico y plan
        'diagnostico_nutricional', 'objetivos_nutricionales', 'indicaciones', 'notas_seguimiento',
        # Campos bioquimicos string
        'fecha_examenes', 'imc_categoria', 'riesgo_cardiovascular'
    ]
    
    for field_name in simple_text_fields:
        if hasattr(form, field_name) and hasattr(patient, field_name):
            value = getattr(patient, field_name)
            if value is not None:
                getattr(form, field_name).data = value
    
    # Fecha de nacimiento (string en modelo)
    if hasattr(form, 'fecha_nacimiento') and hasattr(patient, 'fecha_nacimiento'):
        if patient.fecha_nacimiento:
            form.fecha_nacimiento.data = patient.fecha_nacimiento
    
    # Fecha de atencion (datetime en modelo)
    if hasattr(form, 'fecha_atencion') and hasattr(patient, 'fecha_atencion'):
        if patient.fecha_atencion:
            if isinstance(patient.fecha_atencion, datetime):
                form.fecha_atencion.data = patient.fecha_atencion.strftime('%Y-%m-%dT%H:%M')
            else:
                form.fecha_atencion.data = patient.fecha_atencion
    
    # Fecha proxima cita (datetime en modelo)
    if hasattr(form, 'fecha_proxima_cita') and hasattr(patient, 'fecha_proxima_cita'):
        if patient.fecha_proxima_cita:
            if isinstance(patient.fecha_proxima_cita, datetime):
                form.fecha_proxima_cita.data = patient.fecha_proxima_cita.strftime('%Y-%m-%dT%H:%M')
            else:
                form.fecha_proxima_cita.data = patient.fecha_proxima_cita
    
    # Campos float
    float_fields = [
        'talla_m', 'peso_kg', 'peso_ideal',
        'pliegue_bicipital', 'pliegue_tricipital', 'pliegue_subescapular', 'pliegue_supracrestideo',
        'perimetro_brazo', 'perimetro_cintura', 'perimetro_cadera', 'perimetro_pantorrilla', 'perimetro_muneca',
        # Bioquimicos
        'glucosa_ayunas', 'hemoglobina_glicada', 'colesterol_total', 'colesterol_hdl', 'colesterol_ldl',
        'trigliceridos', 'hemoglobina', 'hematocrito', 'ferritina', 'vitamina_d', 'vitamina_b12',
        'acido_urico', 'creatinina', 'albumina', 'tsh',
        # Calculados
        'imc', 'porcentaje_grasa', 'masa_grasa_kg', 'masa_libre_grasa_kg', 'densidad_corporal',
        'indice_cintura_cadera', 'geb_kcal', 'get_kcal', 'factor_actividad', 'factor_estres',
        'proteinas_g', 'carbohidratos_g', 'grasas_g', 'fibra_g',
        'proteinas_porcentaje', 'carbohidratos_porcentaje', 'grasas_porcentaje'
    ]
    
    for field_name in float_fields:
        if hasattr(form, field_name) and hasattr(patient, field_name):
            value = getattr(patient, field_name)
            if value is not None:
                getattr(form, field_name).data = float(value)
    
    # Campos int
    int_fields = ['calidad_sueno', 'nivel_estres', 'presion_sistolica', 'presion_diastolica', 'frecuencia_cardiaca']
    for field_name in int_fields:
        if hasattr(form, field_name) and hasattr(patient, field_name):
            value = getattr(patient, field_name)
            if value is not None:
                getattr(form, field_name).data = int(value)
    
    # Campos de lista (SelectMultiple) - string en DB -> lista en form
    list_fields = ['diagnosticos', 'medicamentos', 'suplementos', 'quien_cocina', 
                   'con_quien_vive', 'donde_come', 'tipo_alcohol']
    for field_name in list_fields:
        if hasattr(form, field_name) and hasattr(patient, field_name):
            value = getattr(patient, field_name)
            if value:
                if isinstance(value, str):
                    getattr(form, field_name).data = [v.strip() for v in value.split(',') if v.strip()]
                elif isinstance(value, list):
                    getattr(form, field_name).data = value
    
    # Objetivos (HiddenField con JSON)
    if hasattr(form, 'objetivos') and hasattr(patient, 'objetivos'):
        if patient.objetivos:
            form.objetivos.data = patient.objetivos
    
    # JSON fields
    if hasattr(form, 'registro_24h') and hasattr(patient, 'registro_24h'):
        if patient.registro_24h:
            form.registro_24h.data = patient.registro_24h if isinstance(patient.registro_24h, str) else str(patient.registro_24h)
    
    if hasattr(form, 'frecuencia_consumo') and hasattr(patient, 'frecuencia_consumo'):
        if patient.frecuencia_consumo:
            form.frecuencia_consumo.data = patient.frecuencia_consumo if isinstance(patient.frecuencia_consumo, str) else str(patient.frecuencia_consumo)
    
    # Boolean
    if hasattr(form, 'is_active') and hasattr(patient, 'is_active'):
        form.is_active.data = patient.is_active
    
    return form