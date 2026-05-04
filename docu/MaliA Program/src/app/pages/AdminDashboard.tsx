import { AlertCircle, CheckCircle, Clock, DollarSign, TrendingUp, Users, FileText, MessageSquare, Settings } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Avatar, AvatarFallback } from "../components/ui/avatar";

interface AdminDashboardProps {
  onNavigate: (page: string) => void;
}

export function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const stats = [
    {
      label: "Clientes Activos",
      value: "127",
      change: "+12 este mes",
      icon: Users,
      color: "text-primary"
    },
    {
      label: "Ingresos Mensuales",
      value: "$5.2M",
      change: "+23% vs mes anterior",
      icon: DollarSign,
      color: "text-accent"
    },
    {
      label: "Consultas Pendientes",
      value: "8",
      change: "Requieren atención",
      icon: MessageSquare,
      color: "text-orange-500"
    },
    {
      label: "Tasa de Éxito",
      value: "94%",
      change: "Clientes satisfechos",
      icon: TrendingUp,
      color: "text-green-600"
    }
  ];

  const recentClients = [
    {
      name: "María González",
      plan: "2 Meses Premium",
      status: "activo",
      startDate: "15 Nov 2025",
      progress: 43,
      lastContact: "Hace 2 días"
    },
    {
      name: "Sofía Martínez",
      plan: "1 Mes + Seguimiento",
      status: "activo",
      startDate: "18 Nov 2025",
      progress: 12,
      lastContact: "Hoy"
    },
    {
      name: "Carolina Ruiz",
      plan: "Programa 1 Mes",
      status: "pendiente",
      startDate: "18 Nov 2025",
      progress: 0,
      lastContact: "Nunca"
    },
    {
      name: "Valentina Silva",
      plan: "Plan Automático",
      status: "activo",
      startDate: "10 Nov 2025",
      progress: 67,
      lastContact: "Hace 5 días"
    }
  ];

  const pendingTasks = [
    {
      client: "Sofía Martínez",
      task: "Revisar fotos de progreso y ajustar pauta",
      priority: "alta",
      due: "Hoy"
    },
    {
      client: "María González",
      task: "Mini-consulta programada (30 min)",
      priority: "alta",
      due: "Mañana"
    },
    {
      client: "Carolina Ruiz",
      task: "Crear pauta inicial personalizada",
      priority: "media",
      due: "En 2 días"
    },
    {
      client: "Andrea López",
      task: "Check-in semanal y responder dudas",
      priority: "media",
      due: "En 3 días"
    }
  ];

  const planDistribution = [
    { name: "Plan Automático", count: 45, revenue: "$899k", color: "bg-chart-3" },
    { name: "Programa 1 Mes", count: 38, revenue: "$1.9M", color: "bg-chart-4" },
    { name: "1 Mes + Seguimiento", count: 32, revenue: "$2.6M", color: "bg-primary" },
    { name: "2 Meses Premium", count: 12, revenue: "$1.7M", color: "bg-accent" }
  ];

  return (
    <div className="min-h-screen py-12 bg-gradient-to-br from-cream via-white to-beige/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl lg:text-4xl text-foreground mb-2">
              Panel de Administración
            </h1>
            <p className="text-muted-foreground">
              Bienvenida, Amalia. Aquí está tu resumen del día.
            </p>
          </div>
          <Button variant="outline" className="gap-2">
            <Settings className="h-4 w-4" />
            Configuración
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="p-6 border-border">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
              <p className="text-3xl text-foreground mb-1">{stat.value}</p>
              <p className="text-sm text-muted-foreground mb-2">{stat.label}</p>
              <p className="text-xs text-primary">{stat.change}</p>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Tasks & Clients */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pending Tasks */}
            <Card className="p-6 border-border">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl text-foreground">Tareas pendientes</h2>
                <Badge variant="outline" className="text-orange-600 border-orange-600">
                  {pendingTasks.length} tareas
                </Badge>
              </div>
              <div className="space-y-3">
                {pendingTasks.map((task, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
                  >
                    <div
                      className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${
                        task.priority === 'alta' ? 'bg-red-500' : 'bg-orange-400'
                      }`}
                    ></div>
                    <div className="flex-1">
                      <p className="text-foreground text-sm mb-1">{task.task}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{task.client}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">{task.due}</span>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      Revisar
                    </Button>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recent Clients */}
            <Card className="p-6 border-border">
              <h2 className="text-xl text-foreground mb-6">Clientes recientes</h2>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Progreso</TableHead>
                      <TableHead>Último contacto</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentClients.map((client, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8 bg-primary">
                              <AvatarFallback className="text-white text-xs">
                                {client.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm text-foreground">{client.name}</p>
                              <p className="text-xs text-muted-foreground">{client.startDate}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{client.plan}</TableCell>
                        <TableCell>
                          <Badge
                            variant={client.status === 'activo' ? 'default' : 'outline'}
                            className={
                              client.status === 'activo'
                                ? 'bg-green-100 text-green-700 hover:bg-green-100'
                                : 'text-orange-600 border-orange-600'
                            }
                          >
                            {client.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary"
                                style={{ width: `${client.progress}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-muted-foreground">{client.progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {client.lastContact}
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost">
                            Ver
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>

          {/* Right Column - Insights */}
          <div className="space-y-6">
            {/* Plan Distribution */}
            <Card className="p-6 border-border">
              <h3 className="text-lg text-foreground mb-6">Distribución de planes</h3>
              <div className="space-y-4">
                {planDistribution.map((plan, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground">{plan.name}</span>
                      <span className="text-muted-foreground">{plan.count} clientes</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${plan.color}`}
                        style={{ width: `${(plan.count / 127) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-muted-foreground">{plan.revenue}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-6 border-border">
              <h3 className="text-lg text-foreground mb-4">Acciones rápidas</h3>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start gap-3">
                  <FileText className="h-4 w-4" />
                  Crear pauta nueva
                </Button>
                <Button variant="outline" className="w-full justify-start gap-3">
                  <MessageSquare className="h-4 w-4" />
                  Revisar mensajes
                </Button>
                <Button variant="outline" className="w-full justify-start gap-3">
                  <Users className="h-4 w-4" />
                  Ver todos los clientes
                </Button>
                <Button variant="outline" className="w-full justify-start gap-3">
                  <Settings className="h-4 w-4" />
                  Actualizar base de datos
                </Button>
              </div>
            </Card>

            {/* Alerts */}
            <Card className="p-6 border-border bg-primary/5 border-primary/20">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-foreground mb-2">Recordatorios</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      2 mini-consultas esta semana
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3" />
                      5 clientes cerca de completar su plan
                    </li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
