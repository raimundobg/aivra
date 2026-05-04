import { Download, Info, Apple, Beef, Salad, Cookie } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

interface NutritionPlanPageProps {
  onNavigate: (page: string) => void;
}

export function NutritionPlanPage({ onNavigate }: NutritionPlanPageProps) {
  const macros = {
    calorias: 1800,
    proteinas: 120,
    carbohidratos: 200,
    grasas: 55
  };

  const mealPlan = [
    {
      name: "Desayuno",
      time: "8:00 - 9:00",
      icon: Apple,
      calories: 450,
      items: [
        "2 huevos revueltos con espinacas",
        "2 rebanadas de pan integral",
        "1/2 palta",
        "1 taza de café con leche descremada"
      ]
    },
    {
      name: "Colación AM",
      time: "11:00",
      icon: Cookie,
      calories: 200,
      items: [
        "1 yogurt griego natural",
        "30g de almendras",
        "1 fruta mediana"
      ]
    },
    {
      name: "Almuerzo",
      time: "13:00 - 14:00",
      icon: Salad,
      calories: 550,
      items: [
        "150g de pechuga de pollo a la plancha",
        "1 taza de arroz integral cocido",
        "Ensalada verde abundante con aceite de oliva",
        "1 fruta de postre"
      ]
    },
    {
      name: "Colación PM",
      time: "17:00",
      icon: Cookie,
      calories: 180,
      items: [
        "Batido de proteína con leche de almendras",
        "1 plátano"
      ]
    },
    {
      name: "Cena",
      time: "20:00 - 21:00",
      icon: Beef,
      calories: 420,
      items: [
        "180g de salmón al horno",
        "1 camote mediano asado",
        "Verduras al vapor (brócoli, zanahoria)",
        "Ensalada con aceite de oliva"
      ]
    }
  ];

  const substitutions = [
    { original: "Pechuga de pollo", alternatives: ["Pavo", "Pescado blanco", "Tofu firme"] },
    { original: "Arroz integral", alternatives: ["Quinoa", "Pasta integral", "Camote"] },
    { original: "Yogurt griego", alternatives: ["Requesón", "Queso cottage", "Yogurt vegetal"] },
    { original: "Almendras", alternatives: ["Nueces", "Pistachos", "Maní natural"] }
  ];

  return (
    <div className="min-h-screen py-12 bg-gradient-to-br from-cream via-white to-beige/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl lg:text-4xl text-foreground mb-2">
                Tu pauta nutricional
              </h1>
              <p className="text-muted-foreground">
                Plan personalizado para recomposición corporal
              </p>
            </div>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Descargar PDF
            </Button>
          </div>

          {/* Macros Summary */}
          <Card className="p-6 border-border bg-white">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Calorías</p>
                <p className="text-3xl text-primary">{macros.calorias}</p>
                <p className="text-xs text-muted-foreground">kcal/día</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Proteínas</p>
                <p className="text-3xl text-foreground">{macros.proteinas}g</p>
                <p className="text-xs text-muted-foreground">{Math.round((macros.proteinas * 4 / macros.calorias) * 100)}%</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Carbohidratos</p>
                <p className="text-3xl text-foreground">{macros.carbohidratos}g</p>
                <p className="text-xs text-muted-foreground">{Math.round((macros.carbohidratos * 4 / macros.calorias) * 100)}%</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Grasas</p>
                <p className="text-3xl text-foreground">{macros.grasas}g</p>
                <p className="text-xs text-muted-foreground">{Math.round((macros.grasas * 9 / macros.calorias) * 100)}%</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="plan" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto">
            <TabsTrigger value="plan">Plan de comidas</TabsTrigger>
            <TabsTrigger value="substitutions">Sustituciones</TabsTrigger>
            <TabsTrigger value="tips">Consejos</TabsTrigger>
          </TabsList>

          {/* Meal Plan */}
          <TabsContent value="plan" className="space-y-4">
            {mealPlan.map((meal, index) => (
              <Card key={index} className="p-6 border-border hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <meal.icon className="h-7 w-7 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="text-lg text-foreground">{meal.name}</h3>
                        <p className="text-sm text-muted-foreground">{meal.time}</p>
                      </div>
                      <Badge variant="outline" className="text-primary border-primary">
                        {meal.calories} kcal
                      </Badge>
                    </div>
                    <ul className="space-y-2 mt-4">
                      {meal.items.map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            ))}

            <Card className="p-6 bg-cream border-border">
              <div className="flex items-start gap-4">
                <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-foreground mb-2">
                    <strong>Nota importante:</strong> Estos son ejemplos de comidas. Puedes intercambiar alimentos 
                    usando la tabla de sustituciones mientras mantengas las porciones y macros similares.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Recuerda beber al menos 2-3 litros de agua al día y ajustar las porciones según tu nivel 
                    de saciedad y energía.
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Substitutions */}
          <TabsContent value="substitutions" className="space-y-4">
            <Card className="p-6 border-border">
              <h3 className="text-lg text-foreground mb-4">
                Tabla de sustituciones equivalentes
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Usa estas alternativas para variar tu alimentación manteniendo los macros
              </p>
              <div className="space-y-4">
                {substitutions.map((sub, index) => (
                  <div key={index} className="p-4 rounded-lg bg-cream">
                    <p className="text-foreground mb-3">
                      <strong>{sub.original}</strong> → Puedes cambiar por:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {sub.alternatives.map((alt, i) => (
                        <Badge key={i} variant="outline" className="bg-white">
                          {alt}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 border-border">
              <h3 className="text-lg text-foreground mb-4">Grupos de alimentos</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border border-border">
                  <p className="text-foreground mb-3">Proteínas (100g = ~20-25g proteína)</p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Pollo, pavo, pescado</li>
                    <li>• Carne magra de res</li>
                    <li>• Huevos (2 unidades)</li>
                    <li>• Legumbres cocidas (150g)</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg border border-border">
                  <p className="text-foreground mb-3">Carbohidratos (100g cocido = ~25g carbs)</p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Arroz, quinoa, pasta integral</li>
                    <li>• Camote, papa</li>
                    <li>• Pan integral</li>
                    <li>• Avena</li>
                  </ul>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Tips */}
          <TabsContent value="tips" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 border-border">
                <h3 className="text-lg text-foreground mb-4">Preparación y organización</h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex gap-3">
                    <span className="text-primary">•</span>
                    <span>Meal prep domingos: cocina proteínas y carbohidratos para 3-4 días</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary">•</span>
                    <span>Ten vegetales ya lavados y cortados en el refrigerador</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary">•</span>
                    <span>Usa tuppers de vidrio para separar porciones</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary">•</span>
                    <span>Prepara colaciones la noche anterior</span>
                  </li>
                </ul>
              </Card>

              <Card className="p-6 border-border">
                <h3 className="text-lg text-foreground mb-4">Timing y rendimiento</h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex gap-3">
                    <span className="text-primary">•</span>
                    <span>Come 1-2 horas antes de entrenar (carbos + proteína)</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary">•</span>
                    <span>Post-entrenamiento: proteína + carbos en 60-90 min</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary">•</span>
                    <span>No te saltes el desayuno, activa tu metabolismo</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary">•</span>
                    <span>Cena ligera pero con proteína para recuperación nocturna</span>
                  </li>
                </ul>
              </Card>

              <Card className="p-6 border-border">
                <h3 className="text-lg text-foreground mb-4">Hidratación</h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex gap-3">
                    <span className="text-primary">•</span>
                    <span>Mínimo 2-3 litros de agua al día</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary">•</span>
                    <span>Aumenta 500ml por cada hora de ejercicio</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary">•</span>
                    <span>Infusiones sin azúcar cuentan como hidratación</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary">•</span>
                    <span>Bebe agua al despertar y antes de cada comida</span>
                  </li>
                </ul>
              </Card>

              <Card className="p-6 border-border">
                <h3 className="text-lg text-foreground mb-4">Flexibilidad</h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex gap-3">
                    <span className="text-primary">•</span>
                    <span>Regla 80/20: come "limpio" el 80% del tiempo</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary">•</span>
                    <span>Una comida libre a la semana es saludable</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary">•</span>
                    <span>Si te saltas una comida, sigue con la siguiente normalmente</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary">•</span>
                    <span>El plan es una guía, no una prisión. Escucha tu cuerpo</span>
                  </li>
                </ul>
              </Card>
            </div>

            <Card className="p-6 bg-primary/5 border-primary/20">
              <div className="flex items-start gap-4">
                <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-foreground mb-2">
                    <strong>Recuerda:</strong> Este plan se ajustará según tu progreso
                  </p>
                  <p className="text-sm text-muted-foreground">
                    En tu próximo check-in evaluaremos tus resultados y haremos los ajustes necesarios. 
                    Si tienes dudas o necesitas cambios antes, escríbeme por el chat.
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* CTA */}
        <Card className="mt-8 p-8 bg-gradient-to-br from-primary to-primary/80 text-white border-0">
          <div className="text-center">
            <h3 className="text-2xl mb-3">¿Tienes dudas sobre tu plan?</h3>
            <p className="text-white/90 mb-6">
              Estoy aquí para ayudarte a hacer ajustes y resolver cualquier pregunta
            </p>
            <Button
              onClick={() => onNavigate('chat')}
              className="bg-white text-primary hover:bg-white/90"
            >
              Chatear con Amalia
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
