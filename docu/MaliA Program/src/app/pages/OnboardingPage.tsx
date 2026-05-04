import { useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Checkbox } from "../components/ui/checkbox";
import { Progress } from "../components/ui/progress";

interface OnboardingPageProps {
  onNavigate: (page: string) => void;
}

export function OnboardingPage({ onNavigate }: OnboardingPageProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    objetivo: "",
    peso: "",
    altura: "",
    edad: "",
    genero: "",
    nivelActividad: "",
    preferencias: [] as string[],
    restricciones: "",
    horarios: "",
    experiencia: ""
  });

  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      onNavigate('dashboard');
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen py-12 bg-gradient-to-br from-cream via-white to-beige/30">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              Paso {currentStep} de {totalSteps}
            </span>
            <span className="text-sm text-primary">
              {Math.round(progress)}% completado
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card className="p-8 md:p-12 border-border">
          {/* Step 1: Objetivo */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl text-foreground mb-2">¿Cuál es tu objetivo principal?</h2>
                <p className="text-muted-foreground">
                  Selecciona la meta que mejor describa lo que quieres lograr
                </p>
              </div>

              <RadioGroup
                value={formData.objetivo}
                onValueChange={(value) => updateFormData('objetivo', value)}
                className="space-y-4"
              >
                {[
                  {
                    value: "perder-grasa",
                    title: "Perder grasa corporal",
                    description: "Quiero reducir mi porcentaje de grasa y definir mi figura"
                  },
                  {
                    value: "recomposicion",
                    title: "Recomposición corporal",
                    description: "Quiero ganar músculo y perder grasa simultáneamente"
                  },
                  {
                    value: "ganar-masa",
                    title: "Aumentar masa muscular",
                    description: "Mi prioridad es ganar músculo y volumen"
                  },
                  {
                    value: "mantenimiento",
                    title: "Mantención saludable",
                    description: "Quiero mantener mi peso y mejorar mis hábitos"
                  }
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-start gap-4 p-6 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.objetivo === option.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <RadioGroupItem value={option.value} className="mt-1" />
                    <div className="flex-1">
                      <p className="text-foreground mb-1">{option.title}</p>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </div>
                  </label>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Step 2: Datos Básicos */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl text-foreground mb-2">Datos básicos</h2>
                <p className="text-muted-foreground">
                  Esta información nos ayuda a calcular tus requerimientos nutricionales
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="edad">Edad</Label>
                  <Input
                    id="edad"
                    type="number"
                    placeholder="25"
                    value={formData.edad}
                    onChange={(e) => updateFormData('edad', e.target.value)}
                    className="bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="genero">Género</Label>
                  <RadioGroup
                    value={formData.genero}
                    onValueChange={(value) => updateFormData('genero', value)}
                  >
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <RadioGroupItem value="femenino" />
                        <span className="text-sm">Femenino</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <RadioGroupItem value="masculino" />
                        <span className="text-sm">Masculino</span>
                      </label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="peso">Peso actual (kg)</Label>
                  <Input
                    id="peso"
                    type="number"
                    placeholder="65"
                    value={formData.peso}
                    onChange={(e) => updateFormData('peso', e.target.value)}
                    className="bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="altura">Altura (cm)</Label>
                  <Input
                    id="altura"
                    type="number"
                    placeholder="165"
                    value={formData.altura}
                    onChange={(e) => updateFormData('altura', e.target.value)}
                    className="bg-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Nivel de actividad física</Label>
                <RadioGroup
                  value={formData.nivelActividad}
                  onValueChange={(value) => updateFormData('nivelActividad', value)}
                  className="space-y-3"
                >
                  {[
                    { value: "sedentario", label: "Sedentario (poco o nada de ejercicio)" },
                    { value: "ligero", label: "Ligero (ejercicio 1-3 días/semana)" },
                    { value: "moderado", label: "Moderado (ejercicio 3-5 días/semana)" },
                    { value: "intenso", label: "Intenso (ejercicio 6-7 días/semana)" }
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                        formData.nivelActividad === option.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <RadioGroupItem value={option.value} />
                      <span className="text-sm">{option.label}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>
            </div>
          )}

          {/* Step 3: Preferencias Alimentarias */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl text-foreground mb-2">Preferencias alimentarias</h2>
                <p className="text-muted-foreground">
                  Selecciona todas las que apliquen para personalizar tu plan
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { id: "omnivoro", label: "Omnívoro (como de todo)" },
                  { id: "vegetariano", label: "Vegetariano" },
                  { id: "vegano", label: "Vegano" },
                  { id: "sin-lactosa", label: "Sin lactosa" },
                  { id: "sin-gluten", label: "Sin gluten" },
                  { id: "low-carb", label: "Prefiero bajo en carbohidratos" },
                  { id: "flexible", label: "Flexible (me adapto fácilmente)" }
                ].map((pref) => (
                  <label
                    key={pref.id}
                    className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary/50 cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={formData.preferencias.includes(pref.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          updateFormData('preferencias', [...formData.preferencias, pref.id]);
                        } else {
                          updateFormData('preferencias', formData.preferencias.filter(p => p !== pref.id));
                        }
                      }}
                    />
                    <span className="text-sm">{pref.label}</span>
                  </label>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="restricciones">Alergias o restricciones médicas</Label>
                <Textarea
                  id="restricciones"
                  placeholder="Ej: Alergia a los frutos secos, intolerancia a..."
                  value={formData.restricciones}
                  onChange={(e) => updateFormData('restricciones', e.target.value)}
                  className="bg-white min-h-[100px]"
                />
              </div>
            </div>
          )}

          {/* Step 4: Estilo de Vida */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl text-foreground mb-2">Tu estilo de vida</h2>
                <p className="text-muted-foreground">
                  Ayúdanos a crear un plan que se adapte a tu rutina
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="horarios">Horarios y rutina diaria</Label>
                <Textarea
                  id="horarios"
                  placeholder="Ej: Trabajo de 9 a 18hrs, entreno por las mañanas a las 7am, ceno tarde..."
                  value={formData.horarios}
                  onChange={(e) => updateFormData('horarios', e.target.value)}
                  className="bg-white min-h-[120px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="experiencia">¿Tienes experiencia previa con nutrición deportiva?</Label>
                <Textarea
                  id="experiencia"
                  placeholder="Cuéntanos sobre dietas o planes nutricionales anteriores, qué funcionó y qué no..."
                  value={formData.experiencia}
                  onChange={(e) => updateFormData('experiencia', e.target.value)}
                  className="bg-white min-h-[120px]"
                />
              </div>
            </div>
          )}

          {/* Step 5: Confirmación */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Check className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-3xl text-foreground mb-2">¡Todo listo!</h2>
                <p className="text-muted-foreground">
                  Revisaremos tu información y tendrás tu pauta personalizada en 24-48 horas
                </p>
              </div>

              <Card className="p-6 bg-cream border-border">
                <h3 className="text-foreground mb-4">Resumen de tu perfil</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Objetivo:</span>
                    <span className="text-foreground">{formData.objetivo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Edad:</span>
                    <span className="text-foreground">{formData.edad} años</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Peso:</span>
                    <span className="text-foreground">{formData.peso} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Altura:</span>
                    <span className="text-foreground">{formData.altura} cm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Actividad:</span>
                    <span className="text-foreground">{formData.nivelActividad}</span>
                  </div>
                </div>
              </Card>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
                <p className="text-sm text-foreground text-center">
                  Recibirás un email de confirmación y acceso a tu dashboard donde podrás 
                  seguir el progreso de tu pauta.
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-12 pt-6 border-t border-border">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Anterior
            </Button>

            <Button
              onClick={nextStep}
              className="bg-primary hover:bg-primary/90 gap-2"
            >
              {currentStep === totalSteps ? 'Finalizar' : 'Siguiente'}
              {currentStep < totalSteps && <ArrowRight className="h-4 w-4" />}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
