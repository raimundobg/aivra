import { useState } from "react";
import { Camera, Plus, TrendingDown, TrendingUp, Calendar } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface ProgressTrackingPageProps {
  onNavigate: (page: string) => void;
}

export function ProgressTrackingPage({ onNavigate }: ProgressTrackingPageProps) {
  const [showAddMeasurement, setShowAddMeasurement] = useState(false);

  // Datos simulados de mediciones
  const measurementsHistory = [
    { date: "2024-11-01", peso: 70, cintura: 80, cadera: 100, pecho: 92, brazo: 30, muslo: 58 },
    { date: "2024-11-08", peso: 69, cintura: 78, cadera: 99, pecho: 91, brazo: 29, muslo: 57 },
    { date: "2024-11-15", peso: 67.5, cintura: 76, cadera: 98, pecho: 90, brazo: 29, muslo: 56 },
    { date: "2024-11-21", peso: 67, cintura: 75, cadera: 97, pecho: 90, brazo: 28.5, muslo: 55 }
  ];

  const latestMeasurement = measurementsHistory[measurementsHistory.length - 1];
  const firstMeasurement = measurementsHistory[0];

  const calculateChange = (current: number, initial: number) => {
    const diff = current - initial;
    return {
      value: Math.abs(diff),
      isPositive: diff < 0
    };
  };

  const measurements = [
    { name: "Peso", current: latestMeasurement.peso, unit: "kg", key: "peso" },
    { name: "Cintura", current: latestMeasurement.cintura, unit: "cm", key: "cintura" },
    { name: "Cadera", current: latestMeasurement.cadera, unit: "cm", key: "cadera" },
    { name: "Pecho", current: latestMeasurement.pecho, unit: "cm", key: "pecho" },
    { name: "Brazo", current: latestMeasurement.brazo, unit: "cm", key: "brazo" },
    { name: "Muslo", current: latestMeasurement.muslo, unit: "cm", key: "muslo" }
  ];

  const progressPhotos = [
    { date: "01 Nov 2024", week: "Semana 1", image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400" },
    { date: "08 Nov 2024", week: "Semana 2", image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400" },
    { date: "15 Nov 2024", week: "Semana 3", image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400" },
    { date: "21 Nov 2024", week: "Semana 4", image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400" }
  ];

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
          <h1 className="text-3xl lg:text-4xl text-foreground mb-2">
            Seguimiento de Progreso
          </h1>
          <p className="text-muted-foreground">
            Registra tus mediciones y fotos para visualizar tu transformación
          </p>
        </div>

        <Tabs defaultValue="measurements" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="measurements">Mediciones</TabsTrigger>
            <TabsTrigger value="photos">Fotos de Progreso</TabsTrigger>
          </TabsList>

          {/* Measurements Tab */}
          <TabsContent value="measurements" className="space-y-6">
            {/* Current Measurements Grid */}
            <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
              {measurements.map((measurement) => {
                const change = calculateChange(
                  measurement.current,
                  firstMeasurement[measurement.key as keyof typeof firstMeasurement] as number
                );
                return (
                  <Card key={measurement.name} className="p-4 border-border">
                    <p className="text-sm text-muted-foreground mb-2">{measurement.name}</p>
                    <p className="text-2xl text-foreground mb-1">
                      {measurement.current}
                      <span className="text-sm ml-1">{measurement.unit}</span>
                    </p>
                    <div className={`flex items-center gap-1 text-sm ${change.isPositive ? 'text-primary' : 'text-red-500'}`}>
                      {change.isPositive ? (
                        <TrendingDown className="h-4 w-4" />
                      ) : (
                        <TrendingUp className="h-4 w-4" />
                      )}
                      <span>{change.isPositive ? '-' : '+'}{change.value} {measurement.unit}</span>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Add New Measurement Button */}
            <Card className="p-6 border-border">
              {!showAddMeasurement ? (
                <Button
                  onClick={() => setShowAddMeasurement(true)}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Registrar Nueva Medición
                </Button>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg text-foreground">Nueva Medición</h3>
                    <Button
                      onClick={() => setShowAddMeasurement(false)}
                      variant="ghost"
                      size="sm"
                    >
                      Cancelar
                    </Button>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="peso">Peso (kg)</Label>
                      <Input id="peso" type="number" step="0.1" placeholder="67.0" />
                    </div>
                    <div>
                      <Label htmlFor="cintura">Cintura (cm)</Label>
                      <Input id="cintura" type="number" placeholder="75" />
                    </div>
                    <div>
                      <Label htmlFor="cadera">Cadera (cm)</Label>
                      <Input id="cadera" type="number" placeholder="97" />
                    </div>
                    <div>
                      <Label htmlFor="pecho">Pecho (cm)</Label>
                      <Input id="pecho" type="number" placeholder="90" />
                    </div>
                    <div>
                      <Label htmlFor="brazo">Brazo (cm)</Label>
                      <Input id="brazo" type="number" step="0.1" placeholder="28.5" />
                    </div>
                    <div>
                      <Label htmlFor="muslo">Muslo (cm)</Label>
                      <Input id="muslo" type="number" placeholder="55" />
                    </div>
                  </div>
                  <Button className="w-full bg-primary hover:bg-primary/90">
                    Guardar Medición
                  </Button>
                </div>
              )}
            </Card>

            {/* Charts */}
            <Card className="p-6 border-border">
              <h3 className="text-lg text-foreground mb-6">Evolución de Mediciones</h3>
              <div className="space-y-8">
                {/* Weight Chart */}
                <div>
                  <h4 className="text-sm text-muted-foreground mb-4">Peso (kg)</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={measurementsHistory}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(date) => new Date(date).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
                      />
                      <YAxis domain={['dataMin - 2', 'dataMax + 2']} />
                      <Tooltip />
                      <Line type="monotone" dataKey="peso" stroke="#8B6F47" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Circumferences Chart */}
                <div>
                  <h4 className="text-sm text-muted-foreground mb-4">Circunferencias (cm)</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={measurementsHistory}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(date) => new Date(date).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
                      />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="cintura" stroke="#8B6F47" strokeWidth={2} name="Cintura" />
                      <Line type="monotone" dataKey="cadera" stroke="#D4A574" strokeWidth={2} name="Cadera" />
                      <Line type="monotone" dataKey="pecho" stroke="#C9ADA7" strokeWidth={2} name="Pecho" />
                      <Line type="monotone" dataKey="brazo" stroke="#9A7B5B" strokeWidth={2} name="Brazo" />
                      <Line type="monotone" dataKey="muslo" stroke="#B89278" strokeWidth={2} name="Muslo" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Card>


          </TabsContent>

          {/* Photos Tab */}
          <TabsContent value="photos" className="space-y-6">
            {/* Add Photo Button */}
            <Card className="p-6 border-border">
              <Button className="w-full bg-primary hover:bg-primary/90">
                <Camera className="h-5 w-5 mr-2" />
                Subir Nueva Foto de Progreso
              </Button>
              <p className="text-sm text-muted-foreground text-center mt-4">
                Las fotos son opcionales pero ayudan a visualizar mejor tu transformación
              </p>
            </Card>

            {/* Photo Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {progressPhotos.map((photo, index) => (
                <Card key={index} className="overflow-hidden border-border">
                  <div className="aspect-[3/4] bg-cream relative">
                    <img 
                      src={photo.image} 
                      alt={`Progreso ${photo.week}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <Badge className="mb-2 bg-primary/10 text-primary hover:bg-primary/20">
                      {photo.week}
                    </Badge>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{photo.date}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Tips Card */}
            <Card className="p-6 bg-gradient-to-br from-primary to-primary/80 text-white border-0">
              <h3 className="text-lg mb-2">💡 Tips para fotos de progreso</h3>
              <ul className="space-y-2 text-sm text-white/90">
                <li>• Toma las fotos en el mismo lugar y con la misma iluminación</li>
                <li>• Usa la misma ropa o ropa similar en cada foto</li>
                <li>• Toma fotos de frente, perfil y espalda</li>
                <li>• Registra tus fotos semanalmente en el mismo día</li>
                <li>• Las fotos son privadas y solo tú y Amalia pueden verlas</li>
              </ul>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
