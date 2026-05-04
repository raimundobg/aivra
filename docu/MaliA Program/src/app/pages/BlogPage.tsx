import { useState } from "react";
import { BookOpen, Search, Clock, ArrowRight, TrendingUp, Utensils, Dumbbell, Heart } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

interface BlogPageProps {
  onNavigate: (page: string) => void;
}

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: number;
  image: string;
  content?: string[];
}

export function BlogPage({ onNavigate }: BlogPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  const blogPosts: BlogPost[] = [
    // Nutrición Inteligente
    {
      id: "1",
      title: "Cómo armar un plato balanceado",
      excerpt: "Aprende la fórmula perfecta para crear comidas equilibradas que te ayuden a alcanzar tus objetivos.",
      category: "Nutrición Inteligente",
      readTime: 5,
      image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800",
      content: [
        "Un plato balanceado es la clave para una nutrición óptima. La regla general es dividir tu plato en tres secciones:",
        "**50% Vegetales**: Llena la mitad de tu plato con verduras de colores variados. Esto te asegura fibra, vitaminas y minerales.",
        "**25% Proteína**: Un cuarto del plato debe ser proteína magra (pollo, pescado, legumbres, tofu). La proteína es esencial para la recuperación muscular y la saciedad.",
        "**25% Carbohidratos complejos**: El último cuarto incluye carbohidratos como arroz integral, quinoa, batata o pasta integral. Estos te darán energía sostenida.",
        "**Grasas saludables**: Agrega una pequeña porción de grasas buenas como aguacate, aceite de oliva, frutos secos o semillas.",
        "Ejemplo práctico: Ensalada mixta + pechuga de pollo a la plancha + arroz integral + aguacate en rodajas."
      ]
    },
    {
      id: "2",
      title: "Qué comer antes y después del entrenamiento",
      excerpt: "Optimiza tus resultados con la nutrición adecuada según tu tipo de entrenamiento.",
      category: "Nutrición Inteligente",
      readTime: 7,
      image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800",
      content: [
        "La nutrición pre y post entreno puede marcar una gran diferencia en tus resultados.",
        "**Antes del entrenamiento de fuerza (1-2 horas antes):**",
        "- Carbohidratos: 0.5-1g por kg de peso corporal",
        "- Proteína: 20-30g",
        "- Ejemplo: Avena con plátano y mantequilla de maní",
        "**Antes del cardio moderado:**",
        "- Opción ligera 30-60 min antes",
        "- Ejemplo: Fruta + yogurt griego",
        "**Después del entrenamiento (dentro de 2 horas):**",
        "- Proteína: 20-40g para recuperación muscular",
        "- Carbohidratos: 0.5-1.5g por kg para reponer glucógeno",
        "- Ejemplo: Batido de proteína con plátano o pollo con arroz y vegetales",
        "La hidratación es fundamental antes, durante y después del ejercicio."
      ]
    },
    {
      id: "3",
      title: "Qué comer durante el entrenamiento de resistencia",
      excerpt: "Estrategias de nutrición para entrenamientos largos y de alta intensidad.",
      category: "Nutrición Inteligente",
      readTime: 6,
      image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800",
      content: [
        "Para entrenamientos de más de 90 minutos, necesitas nutrición durante el ejercicio.",
        "**Cada 45-60 minutos, consume:**",
        "- 30-60g de carbohidratos de rápida absorción",
        "- Opciones: Geles deportivos, gomitas energéticas, plátano, dátiles",
        "**Hidratación:**",
        "- 150-250ml de agua cada 15-20 minutos",
        "- Si el ejercicio supera 60 minutos: bebida isotónica",
        "**Señales de que necesitas más nutrición:**",
        "- Mareos o fatiga repentina",
        "- Pérdida de coordinación",
        "- Sensación de hambre intensa",
        "Practica tu estrategia nutricional en entrenamientos antes de competir."
      ]
    },
    {
      id: "4",
      title: "Meal Prep: Organiza tu semana en 2 horas",
      excerpt: "Guía completa para preparar todas tus comidas de la semana de forma eficiente.",
      category: "Nutrición Inteligente",
      readTime: 8,
      image: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800",
      content: [
        "El meal prep es la clave para mantener tu nutrición bajo control durante la semana.",
        "**Domingo de preparación:**",
        "1. Cocina proteínas en batch: pollo, pescado, huevos duros",
        "2. Prepara carbohidratos: arroz integral, quinoa, batatas al horno",
        "3. Corta vegetales para toda la semana",
        "4. Prepara snacks: porciones de frutos secos, yogurt con fruta",
        "**Organización en contenedores:**",
        "- Usa contenedores de cristal con compartimientos",
        "- Etiqueta con día de la semana",
        "- Guarda en el refrigerador hasta por 4 días",
        "**Tips para que no te aburras:**",
        "- Prepara 3 proteínas diferentes con distintas marinadas",
        "- Varía las guarniciones cada día",
        "- Ten salsas saludables preparadas para dar sabor",
        "Invierte 2 horas el domingo y ahorra tiempo toda la semana."
      ]
    },
    {
      id: "5",
      title: "Guía de suplementación básica",
      excerpt: "Los suplementos esenciales que realmente valen la pena según la ciencia.",
      category: "Nutrición Inteligente",
      readTime: 10,
      image: "https://images.unsplash.com/photo-1526920929362-5b26677c148c?w=800",
      content: [
        "No necesitas 20 suplementos. Estos son los esenciales con respaldo científico:",
        "**1. Proteína en polvo (Whey o vegetal):**",
        "- Cuándo: Si no llegas a tus requerimientos con comida",
        "- Dosis: 20-30g post-entreno o como snack",
        "**2. Creatina monohidrato:**",
        "- Beneficio: +5-10% fuerza, mayor masa muscular",
        "- Dosis: 5g diarios, cualquier hora del día",
        "**3. Omega-3 (EPA/DHA):**",
        "- Beneficio: Salud cardiovascular, reducción inflamación",
        "- Dosis: 1-2g diarios con las comidas",
        "**4. Vitamina D (si hay deficiencia):**",
        "- Test de sangre para confirmar necesidad",
        "- Dosis: Según indicación médica",
        "**5. Magnesio:**",
        "- Ayuda con recuperación muscular y sueño",
        "- Dosis: 300-400mg antes de dormir",
        "**Lo que NO necesitas:** Fat burners, BCAAs (si comes suficiente proteína), pre-workouts caros.",
        "Recuerda: Los suplementos complementan, no reemplazan una buena alimentación."
      ]
    },

    // Tips de Entrenamiento
    {
      id: "6",
      title: "Rutinas fáciles para comenzar",
      excerpt: "Programas de entrenamiento simples y efectivos para principiantes.",
      category: "Tips de Entrenamiento",
      readTime: 6,
      image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800",
      content: [
        "Empezar es lo más difícil. Aquí tienes rutinas simples para las primeras semanas:",
        "**Semana 1-2: Full Body 2x por semana**",
        "- Sentadillas: 3x10",
        "- Push-ups (o en rodillas): 3x8-12",
        "- Remo con mancuernas: 3x10",
        "- Plancha: 3x30 segundos",
        "**Semana 3-4: Full Body 3x por semana**",
        "Misma rutina, agregando:",
        "- Peso muerto rumano: 3x10",
        "- Press militar con mancuernas: 3x10",
        "**Progresión:**",
        "- Aumenta 2.5-5% del peso cada semana",
        "- O agrega 1-2 repeticiones por serie",
        "**Tips importantes:**",
        "- Calienta 5-10 minutos antes",
        "- Descansa 60-90 segundos entre series",
        "- La técnica es más importante que el peso"
      ]
    },
    {
      id: "7",
      title: "Cómo progresar en tus cargas",
      excerpt: "Estrategias de progresión para seguir ganando fuerza y músculo.",
      category: "Tips de Entrenamiento",
      readTime: 7,
      image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800",
      content: [
        "La progresión es clave para seguir viendo resultados. Aquí las mejores estrategias:",
        "**1. Sobrecarga progresiva:**",
        "- Aumenta 2.5-5kg cuando puedas hacer todas las series con buena técnica",
        "- Para ejercicios pequeños (bíceps, hombros): 1-2.5kg",
        "**2. Progresión por repeticiones:**",
        "- Rango: 8-12 reps",
        "- Cuando logres 12 reps en todas las series, sube el peso",
        "**3. Reducción de descansos:**",
        "- Pasa de 90 a 60 segundos entre series",
        "- Mantén la misma carga y repeticiones",
        "**4. Más volumen:**",
        "- Agrega 1 serie por ejercicio cada 2-3 semanas",
        "- Hasta un máximo de 5 series por ejercicio",
        "**Cuando dejar de progresar en peso:**",
        "- Si la técnica se deteriora",
        "- Si no puedes completar el mínimo de repeticiones",
        "- Si sientes dolor (no confundir con fatiga muscular)",
        "**Descarga cada 4-6 semanas:** Reduce volumen o intensidad 40-50% por una semana."
      ]
    },
    {
      id: "8",
      title: "¿Por qué priorizar el entrenamiento de fuerza?",
      excerpt: "Los beneficios del entrenamiento con pesas más allá de la estética.",
      category: "Tips de Entrenamiento",
      readTime: 6,
      image: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800",
      content: [
        "El entrenamiento de fuerza debería ser la base de cualquier programa de ejercicio:",
        "**Beneficios metabólicos:**",
        "- Aumenta el metabolismo basal",
        "- Mejora sensibilidad a la insulina",
        "- Facilita la pérdida de grasa manteniendo músculo",
        "**Salud ósea:**",
        "- Aumenta densidad ósea",
        "- Previene osteoporosis",
        "- Reduce riesgo de fracturas",
        "**Funcionalidad:**",
        "- Facilita actividades diarias",
        "- Mejora postura y reduce dolor de espalda",
        "- Previene caídas en adultos mayores",
        "**Salud mental:**",
        "- Reduce síntomas de ansiedad y depresión",
        "- Mejora autoestima y confianza",
        "- Mejor calidad de sueño",
        "**Recomendación:** 2-4 sesiones semanales de 45-60 minutos.",
        "El cardio es un complemento, no el enfoque principal para recomposición corporal."
      ]
    },
    {
      id: "9",
      title: "¿Qué pasa si no me gusta ir al gimnasio?",
      excerpt: "Alternativas efectivas para entrenar sin pisar un gym.",
      category: "Tips de Entrenamiento",
      readTime: 5,
      image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800",
      content: [
        "No necesitas un gimnasio para estar en forma. Alternativas efectivas:",
        "**1. Entrenamiento en casa:**",
        "- Peso corporal: push-ups, sentadillas, lunges, plancha",
        "- Equipamiento mínimo: bandas elásticas, mancuernas ajustables",
        "- Resultados similares al gym con consistencia",
        "**2. Ejercicio al aire libre:**",
        "- Calistenia en parques",
        "- Running, ciclismo, natación",
        "- Hiking en cerros",
        "**3. Clases online:**",
        "- Yoga, Pilates, HIIT",
        "- Mayor variedad y flexibilidad horaria",
        "**4. Deportes recreativos:**",
        "- Tenis, paddle, fútbol, básquetbol",
        "- Más divertido y social",
        "**Lo importante es:**",
        "- Consistencia 3-4x por semana",
        "- Progresión gradual",
        "- Disfrutar lo que haces",
        "El mejor ejercicio es el que realmente harás a largo plazo."
      ]
    },
    {
      id: "10",
      title: "Errores comunes de entrenamiento",
      excerpt: "Los 7 errores que frenan tu progreso y cómo corregirlos.",
      category: "Tips de Entrenamiento",
      readTime: 8,
      image: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800",
      content: [
        "Evita estos errores para maximizar tus resultados:",
        "**1. Técnica pobre por usar mucho peso:**",
        "- Solución: Reduce peso, domina el movimiento",
        "- Grabate para auto-corregirte",
        "**2. No calentar:**",
        "- Solución: 5-10 min de cardio ligero + movilidad",
        "- Series de calentamiento con poco peso",
        "**3. No progresar:**",
        "- Solución: Lleva un registro de pesos y repeticiones",
        "- Busca mejorar cada semana",
        "**4. No descansar suficiente:**",
        "- Solución: 7-9 horas de sueño",
        "- Al menos 1 día completo de descanso por semana",
        "**5. Entrenar solo lo que te gusta:**",
        "- Solución: Balance entre tren superior e inferior",
        "- No descuidar espalda y piernas",
        "**6. Cambiar de rutina constantemente:**",
        "- Solución: Mantén un programa al menos 8-12 semanas",
        "**7. No comer suficiente proteína:**",
        "- Solución: 1.6-2.2g por kg de peso corporal",
        "Corrige estos errores y verás resultados más rápido."
      ]
    },
    {
      id: "11",
      title: "Caminata: El ejercicio más subestimado",
      excerpt: "Por qué caminar 10,000 pasos al día puede transformar tu salud.",
      category: "Tips de Entrenamiento",
      readTime: 5,
      image: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800",
      content: [
        "Caminar es uno de los mejores hábitos que puedes desarrollar:",
        "**Beneficios:**",
        "- Quema 200-300 calorías por hora",
        "- Bajo impacto en articulaciones",
        "- Mejora salud cardiovascular",
        "- Reduce estrés y mejora estado de ánimo",
        "- Ayuda con la digestión",
        "**Meta de pasos:**",
        "- Mínimo: 7,000 pasos/día",
        "- Ideal: 10,000-12,000 pasos/día",
        "- Divide en caminatas de 10-15 minutos",
        "**Tips para aumentar pasos:**",
        "- Camina mientras hablas por teléfono",
        "- Estaciona más lejos",
        "- Usa escaleras",
        "- Pasea después de las comidas",
        "**Combinar con entrenamiento:**",
        "- Los pasos NO reemplazan el entrenamiento de fuerza",
        "- Son complementarios para salud general",
        "Una caminata diaria puede ser tan importante como el gym."
      ]
    },
    {
      id: "12",
      title: "Movilidad y estiramiento: La clave olvidada",
      excerpt: "Cómo mejorar tu rango de movimiento y prevenir lesiones.",
      category: "Tips de Entrenamiento",
      readTime: 7,
      image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800",
      content: [
        "La movilidad es fundamental para rendir mejor y evitar lesiones:",
        "**Diferencia clave:**",
        "- Movilidad: Movimiento activo controlado",
        "- Flexibilidad: Rango pasivo de movimiento",
        "**Rutina de movilidad diaria (10 min):**",
        "- Círculos de cuello: 10 cada lado",
        "- Círculos de hombros: 10 adelante y atrás",
        "- Gato-vaca (yoga): 10 repeticiones",
        "- Círculos de cadera: 10 cada lado",
        "- Sentadilla profunda hold: 30-60 segundos",
        "**Cuándo hacer movilidad:**",
        "- Por la mañana al despertar",
        "- Como calentamiento antes de entrenar",
        "- En descansos de trabajo si estás sentado",
        "**Estiramientos post-entreno:**",
        "- Mantén cada estiramiento 30-60 segundos",
        "- NO rebotes",
        "- Enfócate en músculos trabajados ese día",
        "**Señales de que necesitas más movilidad:**",
        "- Rigidez matutina",
        "- Rango limitado en ejercicios",
        "- Dolores recurrentes",
        "Invierte 10 minutos al día, verás gran diferencia."
      ]
    },

    // Estilo de Vida Saludable
    {
      id: "13",
      title: "Hábitos para mejorar el descanso",
      excerpt: "La importancia del sueño para tus resultados y cómo optimizarlo.",
      category: "Hábitos saludables y estilo de vida",
      readTime: 6,
      image: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=800",
      content: [
        "El sueño es tan importante como el entrenamiento y la nutrición:",
        "**Por qué importa:**",
        "- Recuperación muscular ocurre durante el sueño",
        "- Regula hormonas del hambre (leptina y grelina)",
        "- Afecta toma de decisiones alimenticias",
        "- Menos de 7 horas: +30% probabilidad de subir de peso",
        "**Rutina de sueño óptima:**",
        "1. Horario consistente: Acuéstate y levántate a la misma hora",
        "2. Última comida 2-3 horas antes de dormir",
        "3. Evita cafeína después de las 14:00",
        "4. Limita pantallas 1 hora antes (luz azul afecta melatonina)",
        "5. Temperatura fresca en la habitación (18-20°C)",
        "6. Oscuridad total o máscara de ojos",
        "7. Ruido blanco o tapones si hay ruido",
        "**Si tienes problemas para dormir:**",
        "- Magnesio 300-400mg antes de dormir",
        "- Infusiones relajantes (manzanilla, valeriana)",
        "- Meditación o lectura antes de dormir",
        "- Considera consultar si persiste",
        "Meta: 7-9 horas de sueño de calidad cada noche."
      ]
    },
    {
      id: "14",
      title: "Cómo manejar el estrés",
      excerpt: "Estrategias prácticas para reducir el cortisol y mejorar tu bienestar.",
      category: "Hábitos saludables y estilo de vida",
      readTime: 7,
      image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800",
      content: [
        "El estrés crónico sabotea tus resultados. Aquí cómo manejarlo:",
        "**Impacto del estrés:**",
        "- Cortisol elevado → retención de grasa abdominal",
        "- Aumenta antojos de comida",
        "- Dificulta recuperación muscular",
        "- Afecta calidad del sueño",
        "**Estrategias diarias:**",
        "**1. Respiración profunda (5 min, 2-3x al día):**",
        "- Inhala 4 segundos",
        "- Retén 4 segundos",
        "- Exhala 6 segundos",
        "**2. Movimiento:**",
        "- Caminata de 15 min en la naturaleza",
        "- Yoga o estiramientos",
        "**3. Establecer límites:**",
        "- Di 'no' a compromisos innecesarios",
        "- Prioriza tu tiempo de autocuidado",
        "**4. Conexión social:**",
        "- Tiempo de calidad con seres queridos",
        "- Comparte cómo te sientes",
        "**5. Hobbies sin pantallas:**",
        "- Lectura, jardinería, arte, música",
        "**Red flags de estrés crónico:**",
        "- Fatiga constante",
        "- Cambios de humor",
        "- Problemas digestivos",
        "- Ansiedad persistente",
        "Si identificas estas señales, busca ayuda profesional."
      ]
    },
    {
      id: "15",
      title: "Hambre real vs hambre emocional",
      excerpt: "Aprende a diferenciar entre necesidad física y emocional de comer.",
      category: "Hábitos saludables y estilo de vida",
      readTime: 6,
      image: "https://images.unsplash.com/photo-1445510861639-5651173bc5d5?w=800",
      content: [
        "Distinguir entre tipos de hambre es clave para una relación saludable con la comida:",
        "**Hambre física:**",
        "- Aparece gradualmente",
        "- Sucede 3-4 horas después de comer",
        "- Cualquier comida satisface",
        "- Señales: estómago gruñe, poca energía",
        "- Se va después de comer",
        "**Hambre emocional:**",
        "- Aparece repentinamente",
        "- Antojo específico (generalmente dulce o graso)",
        "- Sucede después de emoción fuerte",
        "- Continúa incluso después de comer",
        "- Seguido de culpa o remordimiento",
        "**Estrategia antes de comer:**",
        "1. Pausa 5 minutos",
        "2. Pregúntate: ¿Tengo hambre física?",
        "3. Identifica la emoción: ¿Estrés? ¿Aburrimiento? ¿Tristeza?",
        "4. Si es emocional, busca alternativa:",
        "   - Caminata corta",
        "   - Llamar a un amigo",
        "   - Escribir en un diario",
        "   - Respiración profunda",
        "**Crear nuevas asociaciones:**",
        "- Estrés → Caminar (no comer)",
        "- Aburrimiento → Hobby (no snacking)",
        "- Tristeza → Hablar con alguien (no comida)",
        "No se trata de nunca darte un gusto, sino de hacerlo conscientemente."
      ]
    },
    {
      id: "16",
      title: "Tips para mantener la motivación",
      excerpt: "Estrategias para mantener la constancia cuando las ganas fallan.",
      category: "Hábitos saludables y estilo de vida",
      readTime: 8,
      image: "https://images.unsplash.com/photo-1483721310020-03333e577078?w=800",
      content: [
        "La motivación es temporal. La disciplina y los sistemas son para siempre:",
        "**1. Objetivos SMART:**",
        "- Específico: 'Perder 5kg' vs 'bajar de peso'",
        "- Medible: Con números y fechas",
        "- Alcanzable: Desafiante pero realista",
        "- Relevante: Importante para ti",
        "- Tiempo definido: Plazo específico",
        "**2. Haz que sea fácil:**",
        "- Prepara ropa de gym la noche anterior",
        "- Meal prep los domingos",
        "- Bloquea tiempo en tu calendario",
        "**3. Sistema de recompensas:**",
        "- Cada semana completa → algo que disfrutes",
        "- No uses comida como recompensa",
        "- Ideas: masaje, ropa nueva, película",
        "**4. Accountability:**",
        "- Comparte tus metas con alguien",
        "- Fotos de progreso cada 2 semanas",
        "- Grupo de apoyo o entrenador",
        "**5. Celebra pequeñas victorias:**",
        "- Entrenaste 3 días esta semana",
        "- Comiste verduras en cada comida",
        "- Dormiste 8 horas 5 días seguidos",
        "**6. Ten un plan B:**",
        "- ¿Llovió? Entrena en casa",
        "- ¿No hay tiempo? 15 min de ejercicio",
        "- ¿Día malo? Sal a caminar",
        "**Recuerda:** No necesitas motivación todos los días, necesitas compromiso.",
        "Los días que menos quieres entrenar son los más importantes."
      ]
    },
    {
      id: "17",
      title: "Check-ins semanales: Por qué son importantes",
      excerpt: "Cómo hacer seguimiento efectivo de tu progreso y ajustar tu plan.",
      category: "Hábitos saludables y estilo de vida",
      readTime: 5,
      image: "https://images.unsplash.com/photo-1434626881859-194d67b2b86f?w=800",
      content: [
        "Los check-ins regulares son cruciales para mantener el rumbo:",
        "**Qué medir cada semana:**",
        "**1. Peso corporal:**",
        "- Mismo día y hora",
        "- Mismas condiciones (ej: al despertar, después de ir al baño)",
        "- Promedio semanal, no peso diario",
        "**2. Circunferencias (cada 2 semanas):**",
        "- Cintura, cadera, muslos, brazos",
        "- Más útil que el peso",
        "**3. Fotos de progreso (cada 2 semanas):**",
        "- Misma iluminación y ropa",
        "- Frente, perfil, espalda",
        "**4. Métricas de bienestar:**",
        "- Calidad de sueño (1-10)",
        "- Nivel de energía (1-10)",
        "- Nivel de estrés (1-10)",
        "- Digestión",
        "**5. Adherencia:**",
        "- Días que entrenaste",
        "- % de comidas según plan",
        "- Pasos diarios promedio",
        "**6. Rendimiento:**",
        "- Pesos levantados",
        "- Repeticiones logradas",
        "**Cuándo ajustar el plan:**",
        "- Peso estancado 2-3 semanas",
        "- Energía muy baja constantemente",
        "- Antojos incontrolables",
        "- Pérdida de fuerza en entrenamientos",
        "El seguimiento te mantiene honesto y permite ajustes oportunos."
      ]
    }
  ];

  const categories = [
    { name: "Todas", icon: BookOpen, count: blogPosts.length },
    { name: "Nutrición Inteligente", icon: Utensils, count: blogPosts.filter(p => p.category === "Nutrición Inteligente").length },
    { name: "Tips de Entrenamiento", icon: Dumbbell, count: blogPosts.filter(p => p.category === "Tips de Entrenamiento").length },
    { name: "Hábitos saludables y estilo de vida", icon: Heart, count: blogPosts.filter(p => p.category === "Hábitos saludables y estilo de vida").length }
  ];

  const [activeCategory, setActiveCategory] = useState("Todas");

  const filteredPosts = activeCategory === "Todas"
    ? blogPosts.filter(post =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : blogPosts.filter(post =>
        post.category === activeCategory &&
        (post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
         post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()))
      );

  if (selectedPost) {
    return (
      <div className="min-h-screen py-12 bg-gradient-to-br from-cream via-white to-beige/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button
            onClick={() => setSelectedPost(null)}
            variant="ghost"
            className="mb-6"
          >
            ← Volver al blog
          </Button>

          <Card className="overflow-hidden border-border">
            <div className="aspect-[21/9] relative">
              <ImageWithFallback
                src={selectedPost.image}
                alt={selectedPost.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="p-8 md:p-12">
              <div className="flex items-center gap-4 mb-6">
                <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                  {selectedPost.category}
                </Badge>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{selectedPost.readTime} min de lectura</span>
                </div>
              </div>

              <h1 className="text-3xl lg:text-4xl text-foreground mb-8">
                {selectedPost.title}
              </h1>

              <div className="prose prose-lg max-w-none">
                {selectedPost.content?.map((paragraph, index) => (
                  <p key={index} className="text-muted-foreground mb-4 leading-relaxed">
                    {paragraph.includes('**') ? (
                      paragraph.split('**').map((part, i) => 
                        i % 2 === 0 ? part : <strong key={i} className="text-foreground">{part}</strong>
                      )
                    ) : (
                      paragraph
                    )}
                  </p>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 bg-gradient-to-br from-cream via-white to-beige/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => onNavigate('dashboard')}
            variant="ghost"
            className="mb-4"
          >
            ← Volver al Dashboard
          </Button>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl text-foreground">Blog y Recursos</h1>
              <p className="text-muted-foreground">
                Artículos sobre nutrición, entrenamiento y estilo de vida saludable
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <Card className="p-6 border-border mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar artículos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        {/* Categories */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {categories.map((category) => (
            <button
              key={category.name}
              onClick={() => setActiveCategory(category.name)}
              className={`p-4 rounded-xl border-2 transition-all ${
                activeCategory === category.name
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <category.icon className={`h-6 w-6 mx-auto mb-2 ${
                activeCategory === category.name ? 'text-primary' : 'text-muted-foreground'
              }`} />
              <p className="text-sm text-foreground mb-1">{category.name}</p>
              <p className="text-xs text-muted-foreground">{category.count} artículos</p>
            </button>
          ))}
        </div>

        {/* Blog Posts Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <Card
              key={post.id}
              className="overflow-hidden border-border hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => setSelectedPost(post)}
            >
              <div className="aspect-video relative overflow-hidden">
                <ImageWithFallback
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <Badge className="absolute top-3 left-3 bg-white/95 text-foreground hover:bg-white">
                  {post.category}
                </Badge>
              </div>

              <div className="p-5">
                <h3 className="text-lg text-foreground mb-2 line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {post.excerpt}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{post.readTime} min</span>
                  </div>
                  <Button variant="ghost" size="sm" className="group-hover:text-primary">
                    Leer más
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <Card className="p-12 text-center border-border">
            <p className="text-muted-foreground">
              No se encontraron artículos. Intenta con otra búsqueda.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}