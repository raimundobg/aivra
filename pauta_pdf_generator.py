"""
GENERADOR DE PDF - PAUTA ALIMENTARIA SEMANAL
=============================================
Genera un PDF profesional con la pauta alimentaria del paciente.

Autor: Sistema MadLab Nutrition
Fecha: Diciembre 2024
"""

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, Image, HRFlowable
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.pdfgen import canvas
from io import BytesIO
from datetime import datetime
import json

# ============================================
# ESTILOS PERSONALIZADOS
# ============================================

def get_custom_styles():
    """Retorna estilos personalizados para el PDF"""
    styles = getSampleStyleSheet()
    
    # Título principal
    styles.add(ParagraphStyle(
        name='TituloPrincipal',
        parent=styles['Title'],
        fontSize=24,
        textColor=colors.HexColor('#0d9488'),
        spaceAfter=20,
        alignment=TA_CENTER
    ))
    
    # Subtítulo
    styles.add(ParagraphStyle(
        name='Subtitulo',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#475569'),
        spaceAfter=10,
        alignment=TA_CENTER
    ))
    
    # Encabezado de sección
    styles.add(ParagraphStyle(
        name='SeccionHeader',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.white,
        backColor=colors.HexColor('#0d9488'),
        spaceBefore=15,
        spaceAfter=10,
        leftIndent=10,
        rightIndent=10,
        borderPadding=8
    ))
    
    # Encabezado de día
    styles.add(ParagraphStyle(
        name='DiaHeader',
        parent=styles['Heading3'],
        fontSize=12,
        textColor=colors.HexColor('#0d9488'),
        spaceBefore=12,
        spaceAfter=6,
        borderColor=colors.HexColor('#0d9488'),
        borderWidth=1,
        borderPadding=5
    ))
    
    # Tiempo de comida
    styles.add(ParagraphStyle(
        name='TiempoComida',
        parent=styles['Normal'],
        fontSize=11,
        textColor=colors.HexColor('#1e293b'),
        spaceBefore=8,
        spaceAfter=4,
        fontName='Helvetica-Bold'
    ))
    
    # Texto normal
    styles.add(ParagraphStyle(
        name='TextoNormal',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#334155'),
        spaceAfter=4
    ))
    
    # Texto pequeño
    styles.add(ParagraphStyle(
        name='TextoPequeno',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.HexColor('#64748b'),
        spaceAfter=2
    ))
    
    # Destacado
    styles.add(ParagraphStyle(
        name='Destacado',
        parent=styles['Normal'],
        fontSize=11,
        textColor=colors.HexColor('#0d9488'),
        fontName='Helvetica-Bold',
        alignment=TA_CENTER
    ))
    
    return styles


# ============================================
# CLASE PRINCIPAL
# ============================================

class PautaPDFGenerator:
    """Generador de PDF para Pauta Alimentaria"""
    
    def __init__(self, pauta_data: dict, patient_data: dict = None):
        self.pauta = pauta_data
        self.patient = patient_data or pauta_data.get('paciente', {})
        self.styles = get_custom_styles()
        self.buffer = BytesIO()
        
    @staticmethod
    def _format_porcion(cantidad, medida_casera):
        """Format portion display: handles '1 taza'→'4 tazas', fractions, and numeric medidas."""
        import re
        if not medida_casera:
            return f"{cantidad} porción"
        medida = medida_casera.strip()

        # "1 taza" with cantidad=4 → "4 tazas"
        m = re.match(r'^1\s+(.+)$', medida)
        if m and cantidad != 1:
            unidad = m.group(1)
            if not unidad.endswith('s') and cantidad > 1:
                if unidad.endswith('z'):
                    unidad = unidad[:-1] + 'ces'
                elif unidad.endswith('ón'):
                    unidad = unidad[:-2] + 'ones'
                else:
                    unidad += 's'
            return f"{cantidad} {unidad}"

        # Medida already starts with a number (e.g. "2 tazas") → use as-is
        if re.match(r'^\d+(\.\d+)?\s+', medida):
            return medida

        # Fractions like "½ taza" → "4 × ½ taza"
        if cantidad > 1 and re.match(r'^[½¼¾⅓⅔]', medida):
            return f"{cantidad} × {medida}"

        if cantidad == 1:
            return medida
        return f"{cantidad} {medida}"

    def generate(self) -> BytesIO:
        """Genera el PDF y retorna el buffer"""
        
        doc = SimpleDocTemplate(
            self.buffer,
            pagesize=letter,
            rightMargin=0.75*inch,
            leftMargin=0.75*inch,
            topMargin=0.75*inch,
            bottomMargin=0.75*inch
        )
        
        story = []
        
        # Portada / Header
        story.extend(self._build_header())
        
        # Información del paciente
        story.extend(self._build_patient_info())
        
        # Requerimientos nutricionales
        story.extend(self._build_requirements())
        
        # Tiempos de comida activos
        story.extend(self._build_meal_times())
        
        # Separador
        story.append(Spacer(1, 20))
        
        # Cada día de la semana
        dias = self.pauta.get('dias', {})
        dias_orden = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
        
        for i, dia_key in enumerate(dias_orden):
            if dia_key in dias:
                story.extend(self._build_day(dia_key, dias[dia_key]))
                # Page break cada 2 días (excepto el último)
                if (i + 1) % 2 == 0 and i < len(dias_orden) - 1:
                    story.append(PageBreak())
        
        # Resumen semanal (nueva página)
        story.append(PageBreak())
        story.extend(self._build_weekly_summary())
        
        # Footer con fecha
        story.extend(self._build_footer())
        
        # Construir PDF
        doc.build(story)
        self.buffer.seek(0)
        
        return self.buffer
    
    def _build_header(self) -> list:
        """Construye el encabezado del documento"""
        elements = []
        
        # Título
        elements.append(Paragraph(
            "🥗 Pauta Alimentaria Semanal",
            self.styles['TituloPrincipal']
        ))
        
        # Subtítulo con nombre del paciente
        nombre = self.patient.get('nombre', 'Paciente')
        elements.append(Paragraph(
            f"Plan personalizado para <b>{nombre}</b>",
            self.styles['Subtitulo']
        ))
        
        # Línea separadora
        elements.append(HRFlowable(
            width="100%",
            thickness=2,
            color=colors.HexColor('#0d9488'),
            spaceAfter=20
        ))
        
        return elements
    
    def _build_patient_info(self) -> list:
        """Construye la sección de información del paciente"""
        elements = []
        
        elements.append(Paragraph(
            "📋 Información del Paciente",
            self.styles['SeccionHeader']
        ))
        
        # Tabla con información
        data = []
        
        if self.patient.get('nombre'):
            data.append(['Nombre:', self.patient['nombre']])
        if self.patient.get('objetivos'):
            objetivos = self.patient['objetivos']
            if isinstance(objetivos, list):
                objetivos = ', '.join(objetivos)
            data.append(['Objetivos:', objetivos])
        
        if data:
            table = Table(data, colWidths=[2*inch, 4.5*inch])
            table.setStyle(TableStyle([
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#475569')),
                ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor('#1e293b')),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ('TOPPADDING', (0, 0), (-1, -1), 8),
            ]))
            elements.append(table)
        
        elements.append(Spacer(1, 10))
        return elements
    
    def _build_requirements(self) -> list:
        """Construye la sección de requerimientos nutricionales"""
        elements = []
        
        elements.append(Paragraph(
            "📊 Requerimientos Nutricionales Diarios",
            self.styles['SeccionHeader']
        ))
        
        req = self.pauta.get('requerimientos', {})
        
        # Tabla de requerimientos
        data = [
            ['Nutriente', 'Cantidad', 'Unidad'],
            ['Energía (GET)', str(int(req.get('get_kcal', 0))), 'kcal'],
            ['Proteínas', str(round(req.get('proteinas_g', 0), 1)), 'g'],
            ['Carbohidratos', str(round(req.get('carbohidratos_g', 0), 1)), 'g'],
            ['Grasas', str(round(req.get('grasas_g', 0), 1)), 'g'],
            ['Fibra', str(round(req.get('fibra_g', 0), 1)), 'g'],
            ['Líquidos', str(int(req.get('liquido_ml', 0))), 'ml'],
        ]
        
        table = Table(data, colWidths=[2.5*inch, 2*inch, 1.5*inch])
        table.setStyle(TableStyle([
            # Header
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0d9488')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            # Body
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('ALIGN', (1, 1), (-1, -1), 'CENTER'),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.HexColor('#334155')),
            # Alternating rows
            ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor('#f0fdfa')),
            ('BACKGROUND', (0, 3), (-1, 3), colors.HexColor('#f0fdfa')),
            ('BACKGROUND', (0, 5), (-1, 5), colors.HexColor('#f0fdfa')),
            # Grid
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
        ]))
        
        elements.append(table)
        elements.append(Spacer(1, 10))
        
        return elements
    
    def _build_meal_times(self) -> list:
        """Construye la sección de tiempos de comida"""
        elements = []
        
        tiempos = self.pauta.get('tiempos_comida', {})
        activos = tiempos.get('activos', [])
        excluidos = tiempos.get('excluidos', [])
        distribucion = tiempos.get('distribucion', {})
        
        if activos or excluidos:
            elements.append(Paragraph(
                "🕐 Distribución de Tiempos de Comida",
                self.styles['SeccionHeader']
            ))
            
            # Nombres bonitos
            nombres = {
                'desayuno': 'Desayuno',
                'colacion_am': 'Colación AM',
                'almuerzo': 'Almuerzo',
                'colacion_pm': 'Colación PM',
                'cena': 'Cena'
            }
            
            data = [['Tiempo', 'Estado', 'Distribución']]
            
            for tiempo in ['desayuno', 'colacion_am', 'almuerzo', 'colacion_pm', 'cena']:
                nombre = nombres.get(tiempo, tiempo)
                if tiempo in activos:
                    estado = '✅ Activo'
                    pct = distribucion.get(tiempo, 0)
                    dist = f"{pct}%"
                else:
                    estado = '⏭️ Excluido'
                    dist = '-'
                data.append([nombre, estado, dist])
            
            table = Table(data, colWidths=[2*inch, 2*inch, 2*inch])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0d9488')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
            ]))
            
            elements.append(table)
            elements.append(Spacer(1, 15))
        
        return elements
    
    def _build_day(self, dia_key: str, dia_data: dict) -> list:
        """Construye la sección de un día específico"""
        elements = []
        
        nombre_dia = dia_data.get('nombre', dia_key.capitalize())
        totales = dia_data.get('totales', {})
        
        # Header del día
        header_text = f"📅 {nombre_dia} — {int(totales.get('kcal', 0))} kcal | {round(totales.get('proteinas', 0), 1)}g prot | {round(totales.get('carbohidratos', 0), 1)}g carbs | {round(totales.get('lipidos', 0), 1)}g grasas"
        
        elements.append(Paragraph(header_text, self.styles['DiaHeader']))
        
        # Cada tiempo de comida
        tiempos = dia_data.get('tiempos', {})
        tiempos_orden = ['desayuno', 'colacion_am', 'almuerzo', 'colacion_pm', 'cena']
        
        for tiempo_key in tiempos_orden:
            if tiempo_key in tiempos:
                tiempo_data = tiempos[tiempo_key]
                elements.extend(self._build_meal(tiempo_key, tiempo_data))
        
        elements.append(Spacer(1, 10))
        
        return elements
    
    def _build_meal(self, tiempo_key: str, tiempo_data: dict) -> list:
        """Construye la sección de un tiempo de comida"""
        elements = []
        
        nombre = tiempo_data.get('nombre', tiempo_key)
        hora = tiempo_data.get('hora', '')
        totales = tiempo_data.get('totales', {})
        alimentos = tiempo_data.get('alimentos', [])
        
        # Header del tiempo
        elements.append(Paragraph(
            f"🍽️ {nombre} ({hora}) — {int(totales.get('kcal', 0))} kcal",
            self.styles['TiempoComida']
        ))
        
        if alimentos:
            # Tabla de alimentos
            data = [['Alimento', 'Cantidad', 'Kcal', 'Prot', 'Carbs', 'Grasas']]
            
            for alimento in alimentos:
                nombre_al = alimento.get('nombre', '')
                cantidad = self._format_porcion(alimento.get('cantidad', 1), alimento.get('medida_casera', 'porción'))
                kcal = str(int(alimento.get('kcal', 0)))
                prot = f"{round(alimento.get('proteinas', 0), 1)}g"
                carbs = f"{round(alimento.get('carbohidratos', 0), 1)}g"
                grasas = f"{round(alimento.get('lipidos', 0), 1)}g"
                
                # Marcar alimentos preferidos
                if alimento.get('es_preferido'):
                    nombre_al = f"⭐ {nombre_al}"
                
                data.append([nombre_al, cantidad, kcal, prot, carbs, grasas])
            
            # Fila de totales
            data.append([
                'TOTAL',
                '',
                str(int(totales.get('kcal', 0))),
                f"{round(totales.get('proteinas', 0), 1)}g",
                f"{round(totales.get('carbohidratos', 0), 1)}g",
                f"{round(totales.get('lipidos', 0), 1)}g"
            ])
            
            table = Table(data, colWidths=[2.2*inch, 1.3*inch, 0.6*inch, 0.6*inch, 0.6*inch, 0.7*inch])
            table.setStyle(TableStyle([
                # Header
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e2e8f0')),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 8),
                # Body
                ('FONTNAME', (0, 1), (-1, -2), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 8),
                # Total row
                ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#f0fdfa')),
                ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
                # Alignment
                ('ALIGN', (2, 0), (-1, -1), 'CENTER'),
                # Grid
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
                ('TOPPADDING', (0, 0), (-1, -1), 4),
            ]))
            
            elements.append(table)
        
        elements.append(Spacer(1, 8))
        return elements
    
    def _build_weekly_summary(self) -> list:
        """Construye el resumen semanal"""
        elements = []
        
        elements.append(Paragraph(
            "📈 Resumen Semanal",
            self.styles['TituloPrincipal']
        ))
        
        resumen = self.pauta.get('resumen_semanal', {})
        promedio = resumen.get('promedio_diario', {})
        total = resumen.get('total_semanal', {})
        cumplimiento = resumen.get('cumplimiento_promedio', 0)
        
        # Tabla de resumen
        data = [
            ['Métrica', 'Promedio Diario', 'Total Semanal'],
            ['Calorías', f"{int(promedio.get('kcal', 0))} kcal", f"{int(total.get('kcal', 0))} kcal"],
            ['Proteínas', f"{round(promedio.get('proteinas', 0), 1)} g", f"{round(total.get('proteinas', 0), 1)} g"],
            ['Carbohidratos', f"{round(promedio.get('carbohidratos', 0), 1)} g", f"{round(total.get('carbohidratos', 0), 1)} g"],
            ['Grasas', f"{round(promedio.get('lipidos', 0), 1)} g", f"{round(total.get('lipidos', 0), 1)} g"],
        ]
        
        table = Table(data, colWidths=[2*inch, 2*inch, 2*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0d9488')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor('#f0fdfa')),
            ('BACKGROUND', (0, 3), (-1, 3), colors.HexColor('#f0fdfa')),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ('TOPPADDING', (0, 0), (-1, -1), 10),
        ]))
        
        elements.append(table)
        elements.append(Spacer(1, 20))
        
        # Cumplimiento
        color_cumplimiento = '#22c55e' if cumplimiento >= 90 else '#f59e0b' if cumplimiento >= 70 else '#ef4444'
        elements.append(Paragraph(
            f"<font color='{color_cumplimiento}' size='16'><b>Cumplimiento: {cumplimiento}%</b></font>",
            self.styles['Destacado']
        ))
        
        elements.append(Spacer(1, 20))
        
        # Leyenda
        elements.append(Paragraph(
            "⭐ = Alimento preferido del paciente (basado en Registro 24h)",
            self.styles['TextoPequeno']
        ))
        
        return elements
    
    def _build_footer(self) -> list:
        """Construye el footer del documento"""
        elements = []
        
        elements.append(Spacer(1, 30))
        elements.append(HRFlowable(
            width="100%",
            thickness=1,
            color=colors.HexColor('#e2e8f0'),
            spaceAfter=10
        ))
        
        fecha = datetime.now().strftime('%d/%m/%Y %H:%M')
        elements.append(Paragraph(
            f"Generado el {fecha} por MadLab Nutrition System",
            self.styles['TextoPequeno']
        ))
        
        elements.append(Paragraph(
            "Este plan es personalizado y debe ser supervisado por un profesional de la nutrición.",
            self.styles['TextoPequeno']
        ))
        
        return elements


# ============================================
# FUNCIÓN HELPER
# ============================================

def generar_pdf_pauta(pauta_data: dict, patient_data: dict = None) -> BytesIO:
    """
    Genera un PDF de la pauta alimentaria.
    
    Args:
        pauta_data: Diccionario con la pauta generada
        patient_data: Diccionario con datos adicionales del paciente (opcional)
    
    Returns:
        BytesIO buffer con el PDF generado
    """
    generator = PautaPDFGenerator(pauta_data, patient_data)
    return generator.generate()