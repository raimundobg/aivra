import { Check, Sparkles, Star, Crown, Zap, Dumbbell } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";

interface PlansPageProps {
  onNavigate: (page: string, planId?: string) => void;
}

export function PlansPage({ onNavigate }: PlansPageProps) {
  const plans = [
    {
      id: "low-cost",
      icon: Zap,
      name: "Low Cost",
      badge: "Automático",
      price: "$19.990",
      period: "único",
      description: "Pauta nutricional automática generada con IA. Sin contacto directo con la nutricionista.",
      features: [
        "Encuesta de evaluación inicial",
        "Pauta nutricional personalizada por IA",
        "Cálculo de macros y calorías",
        "Plan de alimentación semanal",
        "Sin seguimiento personalizado",
        "Entrega en 24 hrs"
      ],
      highlight: false
    },
    {
      id: "meses-acompanamiento",
      icon: Star,
      name: "1 o 3 Meses con Seguimiento",
      badge: "Más popular",
      price: "Desde $79.990",
      period: "mes",
      description: "Consulta personal + seguimiento completo + acceso a toda la plataforma. Elige 1 o 3 meses.",
      features: [
        "Encuesta previa a consulta",
        "Consulta online 1:1 con Amalia (60 min)",
        "Pauta nutricional 100% personalizada",
        "Acceso completo a la plataforma",
        "Recetarios y listas de supermercado",
        "Grupo WhatsApp motivacional",
        "Seguimiento semanal por WhatsApp",
        "Recomendaciones semanales",
        "1 mes: $79.990 | 3 meses: $199.990"
      ],
      highlight: true
    },
    {
      id: "full-nutricion-entrenamiento",
      icon: Dumbbell,
      name: "Full: Nutrición + Entrenamiento",
      badge: "Premium",
      price: "Desde $149.990",
      period: "mes",
      description: "Programa integral con nutrición personalizada + plan de entrenamiento adaptado a tu equipamiento. Opción 1 o 3 meses.",
      features: [
        "Todo lo del plan con acompañamiento",
        "Plan de entrenamiento personalizado",
        "Distribución por días y grupos musculares",
        "Adaptado a tu equipamiento disponible",
        "Sistema de seguimiento de ejercicios",
        "Registro de pesos y repeticiones",
        "Gráficos de progreso automáticos",
        "Acceso al blog de nutrición y entrenamiento",
        "1 mes: $149.990 | 3 meses: $379.990"
      ],
      highlight: false
    }
  ];

  return (
    <div className="min-h-screen py-20 bg-gradient-to-br from-cream via-white to-beige/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl lg:text-5xl text-foreground mb-6">
            Elige tu plan de transformación
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Todos los planes con acompañamiento incluyen acceso a recetarios, listas de supermercado, 
            grupo WhatsApp y seguimiento personalizado.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative p-8 ${
                plan.highlight
                  ? 'border-2 border-primary shadow-xl scale-105'
                  : 'border-border'
              }`}
            >
              {plan.badge && (
                <Badge className="absolute top-4 right-4 bg-accent text-white">
                  {plan.badge}
                </Badge>
              )}

              <div className="mb-6">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <plan.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl text-foreground mb-2">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-6 min-h-[3rem]">
                  {plan.description}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl text-primary">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">/{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8 min-h-[380px]">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => onNavigate('checkout', plan.id)}
                className={`w-full ${
                  plan.highlight
                    ? 'bg-primary hover:bg-primary/90'
                    : 'bg-primary/90 hover:bg-primary'
                }`}
              >
                Contratar
              </Button>
            </Card>
          ))}
        </div>

        {/* Comparison Note */}
        <Card className="p-8 bg-white border-border">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-8 w-8 text-accent" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl text-foreground mb-2">
                ¿No estás segura cuál elegir?
              </h3>
              <p className="text-muted-foreground">
                El programa de 1 mes con acompañamiento es perfecto para comenzar con todo el apoyo necesario. 
                Si buscas transformación completa, el programa Full incluye entrenamiento personalizado.
              </p>
            </div>
            <Button
              onClick={() => onNavigate('contact')}
              variant="outline"
              className="flex-shrink-0"
            >
              Contáctame
            </Button>
          </div>
        </Card>

        {/* FAQ Section */}
        <div className="mt-20">
          <h2 className="text-3xl text-center text-foreground mb-12">
            Preguntas frecuentes
          </h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {[
              {
                q: "¿Qué incluye el acceso a la plataforma?",
                a: "Recetarios actualizados, listas de supermercado personalizadas, seguimiento de progreso con gráficos, y en el plan Full: sistema completo de entrenamiento."
              },
              {
                q: "¿Cómo funciona el seguimiento?",
                a: "Registro de circunferencias y fotos opcionales, gráficos automáticos de progreso, y seguimiento continuo por WhatsApp con recomendaciones semanales."
              },
              {
                q: "¿Qué equipamiento necesito para el entrenamiento?",
                a: "El plan Full se adapta a tu equipamiento. Puede ser gimnasio completo, mancuernas en casa, o solo peso corporal."
              },
              {
                q: "¿Puedo cambiar de plan después?",
                a: "Sí, puedes hacer upgrade en cualquier momento. El precio se ajusta proporcionalmente al tiempo restante."
              }
            ].map((faq, index) => (
              <Card key={index} className="p-6 border-border">
                <h4 className="text-foreground mb-3">{faq.q}</h4>
                <p className="text-sm text-muted-foreground">{faq.a}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}