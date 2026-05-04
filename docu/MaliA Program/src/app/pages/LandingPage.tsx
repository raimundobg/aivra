import { ArrowRight, Check, Sparkles, Target, TrendingUp, Users } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  const benefits = [
    {
      icon: Sparkles,
      title: "Plan Low-Cost automático",
      description: "Pauta nutricional generada con IA. Sin contacto directo con la nutricionista."
    },
    {
      icon: Users,
      title: "1 o 3 meses con seguimiento",
      description: "Consulta personalizada + seguimiento semanal + acceso completo a la plataforma."
    },
    {
      icon: Target,
      title: "Programa Full",
      description: "Nutrición + entrenamiento personalizado con seguimiento completo."
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Elige tu programa",
      description: "Selecciona el plan que mejor se adapte a tus objetivos y realiza el pago de forma segura"
    },
    {
      number: "02",
      title: "Completa tu encuesta",
      description: "Responde las preguntas sobre tu estilo de vida, objetivos y preferencias para personalizar tu plan"
    },
    {
      number: "03",
      title: "Consulta personalizada",
      description: "Agenda tu consulta online (planes 1, 3 meses y Full). El plan Low Cost es automático e inmediato"
    },
    {
      number: "04",
      title: "Recibe tu plan",
      description: "Plan Low Cost: inmediato. Otros planes: 72 horas post-consulta. Acceso completo a plataforma"
    },
    {
      number: "05",
      title: "Seguimiento continuo",
      description: "Check-ins semanales, gráficos de progreso, ajustes personalizados y acompañamiento constante"
    }
  ];

  const testimonials = [
    {
      name: "María González",
      result: "-8kg en 3 meses",
      text: "El seguimiento personalizado y la flexibilidad del plan hicieron toda la diferencia. Me siento increíble.",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop",
      program: "3 Meses con Seguimiento"
    },
    {
      name: "Sofía Martínez",
      result: "Recomposición corporal exitosa",
      text: "Logré ganar masa muscular y perder grasa al mismo tiempo. El plan es científico y muy fácil de seguir.",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
      program: "Programa Full"
    },
    {
      name: "Carolina Ruiz",
      result: "+4kg músculo",
      text: "Amalia entendió mis objetivos y creó un plan perfecto para mi estilo de vida. Los resultados hablan solos.",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop",
      program: "1 Mes con Seguimiento"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-cream via-white to-beige/30 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center px-4 py-2 bg-white rounded-full shadow-sm mb-8">
              <Sparkles className="h-4 w-4 text-accent mr-2" />
              <span className="text-sm text-muted-foreground">Nutrición inteligente y personalizada</span>
            </div>
            
            <h1 className="text-4xl lg:text-6xl text-foreground leading-tight mb-8">
              Transforma tu composición corporal con un plan{" "}
              <span className="text-primary">inteligente, personalizado y flexible.</span>
            </h1>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => onNavigate('plans')}
                className="bg-primary hover:bg-primary/90 text-lg px-8"
              >
                Ver planes
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => onNavigate('about')}
                className="text-lg px-8"
              >
                Conocer a Amalia
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl text-foreground mb-4">
              Elige el plan perfecto para ti
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Desde pautas automáticas accesibles hasta seguimiento premium personalizado
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow border-border">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <benefit.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-foreground mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl text-foreground mb-4">
              ¿Cómo funciona?
            </h2>
            <p className="text-lg text-muted-foreground">
              Un proceso simple y estructurado para lograr tus objetivos de forma efectiva
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-1/2 w-full h-0.5 bg-border -z-10" />
                )}
                <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center mb-6 mx-auto text-xl">
                    {step.number}
                  </div>
                  <h3 className="text-center mb-3 text-foreground">{step.title}</h3>
                  <p className="text-sm text-center text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl text-foreground mb-4">
              Resultados reales
            </h2>
            <p className="text-lg text-muted-foreground">
              Lo que dicen nuestros clientes
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-8 border-border">
                <div className="flex items-center gap-4 mb-6">
                  <ImageWithFallback
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-primary">{testimonial.result}</p>
                  </div>
                </div>
                <p className="text-muted-foreground italic">"{testimonial.text}"</p>
                <p className="text-sm text-muted-foreground mt-2">Programa: {testimonial.program}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary to-primary/80 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-5xl mb-6">
            Comienza tu transformación hoy
          </h2>
          <p className="text-xl mb-8 text-white/90">
            Da el primer paso hacia el cuerpo que deseas con un plan diseñado para ti
          </p>
          <Button
            size="lg"
            onClick={() => onNavigate('plans')}
            className="bg-white text-primary hover:bg-white/90 text-lg px-8"
          >
            Ver planes y precios
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
    </div>
  );
}