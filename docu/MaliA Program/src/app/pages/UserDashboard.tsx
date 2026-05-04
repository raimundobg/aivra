import { Activity, Calendar, FileText, MessageCircle, Play, TrendingDown, TrendingUp, Video, Dumbbell, ShoppingCart, ChefHat, Camera, BarChart3, BookOpen } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";
import { useState } from "react";

interface UserDashboardProps {
  onNavigate: (page: string) => void;
}

export function UserDashboard({ onNavigate }: UserDashboardProps) {
  const [showMacros, setShowMacros] = useState(true);

  const userStats = {
    pesoInicial: 70,
    pesoActual: 67,
    pesoObjetivo: 63,
    porcentajeProgreso: 43,
    diasEnPlan: 18,
    diasRestantes: 12,
    diasTotales: 30,
    planType: "full" // "low-cost" | "acompanamiento" | "full"
  };

  const macrosToday = [
    { name: "Proteína", current: 95, target: 120, unit: "g", color: "bg-primary" },
    { name: "Carbohidratos", current: 180, target: 200, unit: "g", color: "bg-accent" },
    { name: "Grasas", current: 45, target: 55, unit: "g", color: "bg-chart-2" }
  ];

  const quickActions = [
    {
      title: "Recetario personalizado",
      description: "Más de 50 recetas adaptadas a tu plan",
      icon: ChefHat,
      action: "recipes"
    },
    {
      title: "Lista de compras semanal",
      description: "Descarga tu lista optimizada",
      icon: ShoppingCart,
      action: "shopping-list"
    },
    {
      title: "Cómo medir circunferencias",
      description: "Tutorial paso a paso para mediciones precisas",
      icon: Video,
      action: "video-circunferencias"
    },
    {
      title: "Cómo medir las porciones",
      description: "Guía de tazas, cucharaditas y mano de proteína",
      icon: Video,
      action: "video-porciones"
    }
  ];

  return (
    <div className="min-h-screen py-12 bg-gradient-to-br from-cream via-white to-beige/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl text-foreground mb-2">
            Bienvenida, María 👋
          </h1>
          <p className="text-muted-foreground">
            Aquí está tu resumen de progreso y herramientas
          </p>
          
          {/* Program Days Progress Bar */}
          <Card className="p-4 border-border mt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Programa 1 Mes + Seguimiento</p>
              <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                Día {userStats.diasEnPlan} de {userStats.diasTotales}
              </Badge>
            </div>
            <Progress value={(userStats.diasEnPlan / userStats.diasTotales) * 100} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {userStats.diasRestantes} días restantes para completar tu programa
            </p>
          </Card>
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Progress */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Card */}
            <Card className="p-6 border-border">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl text-foreground">Tu progreso</h2>
                <Button
                  onClick={() => onNavigate('progress-tracking')}
                  variant="outline"
                  size="sm"
                >
                  Ver detalles
                </Button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-cream rounded-xl">
                  <p className="text-sm text-muted-foreground mb-3">Historial de mediciones</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/50">
                          <th className="text-left py-3 px-2 text-muted-foreground">Fecha</th>
                          <th className="text-left py-3 px-2 text-muted-foreground">Peso</th>
                          <th className="text-left py-3 px-2 text-muted-foreground">Cintura</th>
                          <th className="text-left py-3 px-2 text-muted-foreground">Cadera</th>
                          <th className="text-left py-3 px-2 text-muted-foreground">Pecho</th>
                          <th className="text-left py-3 px-2 text-muted-foreground">Brazo</th>
                          <th className="text-left py-3 px-2 text-muted-foreground">Muslo</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-border/30">
                          <td className="py-3 px-2 text-foreground">31 oct 2024</td>
                          <td className="py-3 px-2 text-foreground">70 kg</td>
                          <td className="py-3 px-2 text-foreground">80 cm</td>
                          <td className="py-3 px-2 text-foreground">100 cm</td>
                          <td className="py-3 px-2 text-foreground">92 cm</td>
                          <td className="py-3 px-2 text-foreground">30 cm</td>
                          <td className="py-3 px-2 text-foreground">58 cm</td>
                        </tr>
                        <tr className="border-b border-border/30">
                          <td className="py-3 px-2 text-foreground">7 nov 2024</td>
                          <td className="py-3 px-2 text-foreground">69 kg</td>
                          <td className="py-3 px-2 text-foreground">78 cm</td>
                          <td className="py-3 px-2 text-foreground">99 cm</td>
                          <td className="py-3 px-2 text-foreground">91 cm</td>
                          <td className="py-3 px-2 text-foreground">29 cm</td>
                          <td className="py-3 px-2 text-foreground">57 cm</td>
                        </tr>
                        <tr className="border-b border-border/30">
                          <td className="py-3 px-2 text-foreground">14 nov 2024</td>
                          <td className="py-3 px-2 text-foreground">67.5 kg</td>
                          <td className="py-3 px-2 text-foreground">76 cm</td>
                          <td className="py-3 px-2 text-foreground">98 cm</td>
                          <td className="py-3 px-2 text-foreground">90 cm</td>
                          <td className="py-3 px-2 text-foreground">29 cm</td>
                          <td className="py-3 px-2 text-foreground">56 cm</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-2 text-foreground">20 nov 2024</td>
                          <td className="py-3 px-2 text-foreground">67 kg</td>
                          <td className="py-3 px-2 text-foreground">75 cm</td>
                          <td className="py-3 px-2 text-foreground">97 cm</td>
                          <td className="py-3 px-2 text-foreground">90 cm</td>
                          <td className="py-3 px-2 text-foreground">28.5 cm</td>
                          <td className="py-3 px-2 text-foreground">55 cm</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <Button
                  onClick={() => onNavigate('progress-tracking')}
                  variant="outline"
                  className="w-full mt-4"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Ver gráficos y fotos de progreso
                </Button>
              </div>
            </Card>

            {/* Macros Today - Now Optional */}
            <Card className="p-6 border-border">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl text-foreground">Macros de hoy</h2>
                <div className="flex items-center gap-2">
                  <Switch
                    id="show-macros"
                    checked={showMacros}
                    onCheckedChange={setShowMacros}
                  />
                  <Label htmlFor="show-macros" className="text-sm text-muted-foreground cursor-pointer">
                    Mostrar
                  </Label>
                </div>
              </div>
              {showMacros ? (
                <>
                  <div className="space-y-6">
                    {macrosToday.map((macro) => (
                      <div key={macro.name} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-foreground">{macro.name}</span>
                          <span className="text-muted-foreground">
                            {macro.current}/{macro.target}{macro.unit}
                          </span>
                        </div>
                        <Progress
                          value={(macro.current / macro.target) * 100}
                          className="h-2"
                        />
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={() => onNavigate('nutrition-plan')}
                    variant="outline"
                    className="w-full mt-6"
                  >
                    Ver mi pauta completa
                  </Button>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    Seguimiento sin conteo de macros activado. Te enfocaremos en otros indicadores de progreso.
                  </p>
                  <Button
                    onClick={() => onNavigate('nutrition-plan')}
                    variant="outline"
                  >
                    Ver mi pauta
                  </Button>
                </div>
              )}
            </Card>

            {/* Quick Actions */}
            <Card className="p-6 border-border">
              <h2 className="text-xl text-foreground mb-4">Recursos y herramientas</h2>
              <div className="space-y-3">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    onClick={() => action.action && onNavigate(action.action)}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-3"
                  >
                    <action.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{action.title}</p>
                      <p className="text-xs text-muted-foreground">{action.description}</p>
                    </div>
                  </Button>
                ))}
                <Button
                  onClick={() => onNavigate('blog')}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <BookOpen className="h-5 w-5 mr-3" />
                  Blog y recursos
                </Button>
                <Button
                  onClick={() => onNavigate('chat')}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <MessageCircle className="h-5 w-5 mr-3" />
                  Chat con Amalia
                </Button>
              </div>
            </Card>
          </div>

          {/* Right Column - Quick Access */}
          <div className="space-y-6">
            {/* Next Steps Card */}
            <Card className="p-6 border-border bg-primary/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-foreground">Próximas tareas</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5"></div>
                  <span className="text-muted-foreground">Sube tus mediciones el próximo lunes</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5"></div>
                  <span className="text-muted-foreground">Entrenamiento mañana</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5"></div>
                  <span className="text-muted-foreground">Actualiza tus pesos del entrenamiento de ayer</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5"></div>
                  <span className="text-muted-foreground">Agenda tu consulta de control</span>
                </li>
              </ul>
            </Card>

            {/* Training Plan Card - Only for Full plan users */}
            {userStats.planType === "full" && (
              <Card className="p-6 border-border">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <Dumbbell className="h-5 w-5 text-accent" />
                  </div>
                  <h3 className="text-foreground">Plan de entrenamiento</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Hoy toca: Tren superior
                </p>
                <Button
                  onClick={() => onNavigate('training')}
                  className="w-full bg-accent hover:bg-accent/90"
                >
                  Ver mi rutina
                </Button>
              </Card>
            )}

            {/* Quick Stats */}
            <Card className="p-6 border-border">
              <h3 className="text-foreground mb-4">Resumen de la semana</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Entrenamientos</span>
                  </div>
                  <span className="text-primary">3/4</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Adherencia</span>
                  </div>
                  <span className="text-primary">85%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Racha activa</span>
                  </div>
                  <span className="text-primary">12 días</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
