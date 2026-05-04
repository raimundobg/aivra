import { Award, BookOpen, Heart, Target, TrendingUp, Users } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

interface AboutPageProps {
  onNavigate: (page: string) => void;
}

export function AboutPage({ onNavigate }: AboutPageProps) {
  const achievements = [
    {
      icon: Users,
      number: "500+",
      label: "Clientes transformados"
    },
    {
      icon: TrendingUp,
      number: "94%",
      label: "Tasa de éxito"
    },
    {
      icon: Award,
      number: "8 años",
      label: "De experiencia"
    },
    {
      icon: Heart,
      number: "100%",
      label: "Compromiso personal"
    }
  ];

  const certifications = [
    "Nutricionista Universidad del Desarrollo",
    "Diplomado de Nutrición Deportiva en Barca Innovation Hub"
  ];

  const philosophy = [
    {
      icon: Target,
      title: "Enfoque científico",
      description: "Planes basados en evidencia científica actualizada, sin modas ni dietas extremas."
    },
    {
      icon: Heart,
      title: "Sostenibilidad",
      description: "Creamos hábitos que puedes mantener a largo plazo, no soluciones temporales."
    },
    {
      icon: Users,
      title: "Personalización",
      description: "Cada persona es única. Tu plan se adapta a tu vida, no al revés."
    },
    {
      icon: BookOpen,
      title: "Educación",
      description: "Te enseño a entender tu cuerpo y tomar decisiones informadas sobre tu nutrición."
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-cream via-white to-beige/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="inline-flex items-center px-4 py-2 bg-white rounded-full shadow-sm mb-6">
                <Heart className="h-4 w-4 text-accent mr-2" />
                <span className="text-sm text-muted-foreground">Tu nutricionista de confianza</span>
              </div>
              
              <h1 className="text-4xl lg:text-5xl text-foreground mb-6">
                Hola, soy{" "}
                <span className="text-primary">Amalia Abogabir</span>
              </h1>
              
              <div className="space-y-4 text-muted-foreground mb-8">
                <p>
                  Nutricionista deportiva especializada en recomposición corporal y optimización del rendimiento. 
                  Mi misión es ayudarte a alcanzar tus objetivos de forma sostenible y saludable.
                </p>
                <p>
                  Durante más de 8 años he trabajado con cientos de personas, desde principiantes hasta atletas 
                  de alto rendimiento, ayudándoles a transformar no solo su cuerpo, sino su relación con la comida.
                </p>
                <p>
                  Creo firmemente que la nutrición no debe ser restrictiva ni complicada. Con el enfoque correcto 
                  y un plan personalizado, cualquier persona puede lograr resultados increíbles sin sacrificar su 
                  calidad de vida.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  onClick={() => onNavigate('plans')}
                  className="bg-primary hover:bg-primary/90"
                >
                  Ver planes
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => onNavigate('contact')}
                >
                  Contáctame
                </Button>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="relative">
                <div className="aspect-[3/4] w-3/4 mx-auto rounded-3xl overflow-hidden shadow-2xl bg-muted">
                  <ImageWithFallback
                    src=""
                    alt="Amalia Abogabir"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Achievements */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            {achievements.map((achievement, index) => (
              <Card key={index} className="p-8 text-center border-border hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <achievement.icon className="h-8 w-8 text-primary" />
                </div>
                <p className="text-3xl text-primary mb-2">{achievement.number}</p>
                <p className="text-sm text-muted-foreground">{achievement.label}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="py-20 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl text-foreground mb-4">
              Mi filosofía de trabajo
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Cuatro pilares que guían cada plan nutricional que creo
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {philosophy.map((item, index) => (
              <Card key={index} className="p-8 border-border bg-white">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <item.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl text-foreground mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl text-foreground mb-6">
                Formación y certificaciones
              </h2>
              <div className="space-y-4">
                {certifications.map((cert, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Award className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-foreground">{cert}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="aspect-square rounded-2xl overflow-hidden shadow-lg">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1543352632-5a4b24e4d2a6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGh5JTIwbWVhbCUyMHByZXB8ZW58MXx8fHwxNzYzMzg2ODIxfDA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Nutrición saludable"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="aspect-square rounded-2xl overflow-hidden shadow-lg mt-8">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1670164747721-d3500ef757a6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGh5JTIwbnV0cml0aW9uJTIwZm9vZHxlbnwxfHx8fDE3NjMzNzc3ODR8MA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Comida saludable"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-primary to-primary/80 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-5xl mb-6">
            ¿Lista para comenzar tu transformación?
          </h2>
          <p className="text-xl mb-8 text-white/90">
            Trabajemos juntas para alcanzar tus objetivos de forma sostenible y saludable
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => onNavigate('plans')}
              className="bg-white text-primary hover:bg-white/90 text-lg px-8"
            >
              Ver planes
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => onNavigate('contact')}
              className="border-white text-white hover:bg-white/10 text-lg px-8"
            >
              Agendar consulta gratuita
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}