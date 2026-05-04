import { Mail, MessageCircle, Instagram, MapPin, Clock, Send } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";

interface ContactPageProps {
  onNavigate: (page: string) => void;
}

export function ContactPage({ onNavigate }: ContactPageProps) {
  const contactMethods = [
    {
      icon: Mail,
      title: "Email",
      value: "contacto@amalia.cl",
      description: "Respuesta en 24-48 horas"
    },
    {
      icon: MessageCircle,
      title: "WhatsApp",
      value: "+56 9 XXXX XXXX",
      description: "Para clientes actuales"
    },
    {
      icon: Instagram,
      title: "Instagram",
      value: "@amalia.nutricion",
      description: "Sígueme para tips diarios"
    }
  ];

  const faq = [
    {
      question: "¿Cuánto tiempo demora recibir mi pauta?",
      answer: "Las pautas automáticas están listas en 24 horas. Las personalizadas toman 24-48 horas."
    },
    {
      question: "¿Puedo cambiar de plan después?",
      answer: "Sí, puedes hacer upgrade en cualquier momento con ajuste proporcional del precio."
    },
    {
      question: "¿Hacen devoluciones?",
      answer: "Ofrecemos garantía de satisfacción de 7 días. Si no estás conforme, devolvemos tu dinero."
    },
    {
      question: "¿Atienden a nivel internacional?",
      answer: "Sí, todos los planes están disponibles online para cualquier país."
    }
  ];

  return (
    <div className="min-h-screen py-20 bg-gradient-to-br from-cream via-white to-beige/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl lg:text-5xl text-foreground mb-6">
            Conversemos
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            ¿Tienes dudas sobre los planes o necesitas más información? Estoy aquí para ayudarte.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="p-8 border-border">
              <h2 className="text-2xl text-foreground mb-6">Envíame un mensaje</h2>
              <form className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre completo</Label>
                    <Input
                      id="name"
                      placeholder="María González"
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="maria@ejemplo.com"
                      className="bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono (opcional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+56 9 XXXX XXXX"
                    className="bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Motivo de contacto</Label>
                  <Select>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Selecciona una opción" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="consulta">Consulta sobre planes</SelectItem>
                      <SelectItem value="personalizado">Necesito algo personalizado</SelectItem>
                      <SelectItem value="duda">Duda técnica</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Mensaje</Label>
                  <Textarea
                    id="message"
                    placeholder="Cuéntame más sobre tus objetivos y cómo puedo ayudarte..."
                    className="bg-white min-h-[150px]"
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-primary hover:bg-primary/90 gap-2"
                >
                  <Send className="h-5 w-5" />
                  Enviar mensaje
                </Button>

                <p className="text-sm text-center text-muted-foreground">
                  Te responderé en menos de 24 horas
                </p>
              </form>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Methods */}
            <Card className="p-6 border-border">
              <h3 className="text-lg text-foreground mb-6">Otras formas de contacto</h3>
              <div className="space-y-4">
                {contactMethods.map((method, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <method.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-foreground mb-1">{method.title}</p>
                      <p className="text-sm text-primary mb-1">{method.value}</p>
                      <p className="text-xs text-muted-foreground">{method.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Info Card */}
            <Card className="p-6 border-border">
              <h3 className="text-lg text-foreground mb-4">Información adicional</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-foreground mb-1">Horario de atención</p>
                    <p className="text-xs text-muted-foreground">Lunes a Viernes: 9:00 - 19:00</p>
                    <p className="text-xs text-muted-foreground">Sábados: 10:00 - 14:00</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-foreground mb-1">Ubicación</p>
                    <p className="text-xs text-muted-foreground">
                      Consultas 100% online desde cualquier lugar
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* CTA Card */}
            <Card className="p-6 bg-gradient-to-br from-primary to-primary/80 text-white border-0">
              <h3 className="text-lg mb-3">¿Ya sabes qué plan quieres?</h3>
              <p className="text-sm text-white/90 mb-4">
                Ahorra tiempo y comienza tu transformación hoy mismo
              </p>
              <Button
                onClick={() => onNavigate('plans')}
                className="w-full bg-white text-primary hover:bg-white/90"
              >
                Ver planes
              </Button>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <h2 className="text-3xl text-center text-foreground mb-12">
            Preguntas frecuentes
          </h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {faq.map((item, index) => (
              <Card key={index} className="p-6 border-border">
                <h4 className="text-foreground mb-3">{item.question}</h4>
                <p className="text-sm text-muted-foreground">{item.answer}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
