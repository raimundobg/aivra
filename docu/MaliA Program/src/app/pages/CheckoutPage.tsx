import { useState } from "react";
import { CreditCard, Lock, Check, ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";

interface CheckoutPageProps {
  planId?: string;
  onNavigate: (page: string) => void;
}

export function CheckoutPage({ planId = "un-mes-seguimiento", onNavigate }: CheckoutPageProps) {
  const [paymentMethod, setPaymentMethod] = useState<'credit' | 'debit'>('credit');

  const plans: Record<string, { name: string; price: number; period: string; features: string[] }> = {
    "low-cost": {
      name: "Low Cost",
      price: 19990,
      period: "pago único",
      features: ["Pauta automática IA", "Sin seguimiento", "Entrega 24hrs"]
    },
    "un-mes-acompanamiento": {
      name: "1 Mes con Acompañamiento",
      price: 79990,
      period: "mes",
      features: ["Consulta 1:1", "Seguimiento WhatsApp", "Recetarios + Listas", "Grupo motivacional"]
    },
    "tres-meses-acompanamiento": {
      name: "3 Meses con Acompañamiento",
      price: 199990,
      period: "3 meses",
      features: ["Todo lo anterior", "3 mini-consultas", "Ajustes ilimitados", "Plan mantención"]
    },
    "full-nutricion-entrenamiento": {
      name: "Full: Nutrición + Entrenamiento",
      price: 149990,
      period: "mes (opción 3 meses: $379.990)",
      features: ["Todo incluido", "Plan entrenamiento", "Seguimiento ejercicios", "Gráficos progreso"]
    }
  };

  const selectedPlan = plans[planId];

  return (
    <div className="min-h-screen py-12 bg-gradient-to-br from-cream via-white to-beige/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => onNavigate('plans')}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a planes
          </Button>
          <h1 className="text-3xl lg:text-4xl text-foreground mb-2">
            Finalizar compra
          </h1>
          <p className="text-muted-foreground">
            Completa tu información para comenzar tu transformación
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card className="p-6 border-border">
              <h2 className="text-xl text-foreground mb-6">Información personal</h2>
              <form className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nombre</Label>
                    <Input
                      id="firstName"
                      placeholder="María"
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Apellido</Label>
                    <Input
                      id="lastName"
                      placeholder="González"
                      className="bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="maria@ejemplo.com"
                    className="bg-white"
                  />
                  <p className="text-xs text-muted-foreground">
                    Recibirás el acceso a tu dashboard en este email
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+56 9 XXXX XXXX"
                    className="bg-white"
                  />
                </div>
              </form>
            </Card>

            {/* Payment Information */}
            <Card className="p-6 border-border">
              <div className="flex items-center gap-3 mb-6">
                <Lock className="h-5 w-5 text-primary" />
                <h2 className="text-xl text-foreground">Información de pago</h2>
              </div>

              {/* Payment Method Selection */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('credit')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    paymentMethod === 'credit'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <CreditCard className={`h-6 w-6 mb-2 mx-auto ${
                    paymentMethod === 'credit' ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                  <p className="text-sm text-foreground">Tarjeta de Crédito</p>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('debit')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    paymentMethod === 'debit'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <CreditCard className={`h-6 w-6 mb-2 mx-auto ${
                    paymentMethod === 'debit' ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                  <p className="text-sm text-foreground">Tarjeta de Débito</p>
                </button>
              </div>

              <form className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Número de tarjeta</Label>
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    className="bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="expiry">Fecha de vencimiento</Label>
                    <Input
                      id="expiry"
                      placeholder="MM/AA"
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      placeholder="123"
                      className="bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardName">Nombre en la tarjeta</Label>
                  <Input
                    id="cardName"
                    placeholder="MARIA GONZALEZ"
                    className="bg-white"
                  />
                </div>
              </form>

              <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-start gap-3">
                  <Lock className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-foreground mb-1">Pago 100% seguro</p>
                    <p className="text-xs text-muted-foreground">
                      Tu información está encriptada y protegida. No almacenamos datos de tarjetas.
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Terms */}
            <Card className="p-6 border-border">
              <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <Checkbox className="mt-1" />
                  <span className="text-sm text-muted-foreground">
                    Acepto los{" "}
                    <a href="#" className="text-primary hover:underline">
                      términos y condiciones
                    </a>{" "}
                    y la{" "}
                    <a href="#" className="text-primary hover:underline">
                      política de privacidad
                    </a>
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <Checkbox className="mt-1" />
                  <span className="text-sm text-muted-foreground">
                    Quiero recibir consejos de nutrición y ofertas especiales por email
                  </span>
                </label>
              </div>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 border-border sticky top-6">
              <h3 className="text-lg text-foreground mb-6">Resumen del pedido</h3>

              <div className="space-y-4 mb-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-foreground">{selectedPlan.name}</h4>
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                      {selectedPlan.period}
                    </Badge>
                  </div>
                  <ul className="space-y-2">
                    {selectedPlan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">
                    ${selectedPlan.price.toLocaleString('es-CL')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">IVA incluido</span>
                  <span className="text-foreground">
                    ${Math.round(selectedPlan.price * 0.19).toLocaleString('es-CL')}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-foreground">Total</span>
                  <span className="text-2xl text-primary">
                    ${selectedPlan.price.toLocaleString('es-CL')}
                  </span>
                </div>
              </div>

              <Button
                onClick={() => onNavigate('onboarding')}
                size="lg"
                className="w-full bg-primary hover:bg-primary/90"
              >
                Confirmar y pagar
              </Button>

              <p className="text-xs text-center text-muted-foreground mt-4">
                Garantía de satisfacción de 7 días
              </p>
            </Card>

            {/* Trust Badges */}
            <Card className="p-6 border-border mt-6">
              <h4 className="text-sm text-foreground mb-4">¿Por qué elegirnos?</h4>
              <div className="space-y-3">
                {[
                  "500+ clientes transformados",
                  "94% tasa de éxito",
                  "Soporte profesional",
                  "Garantía de devolución"
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}