import { useState } from "react";
import { Dumbbell, Plus, Check, ChevronRight } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Progress } from "../components/ui/progress";

interface TrainingPageProps {
  onNavigate: (page: string) => void;
}

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weight?: number;
  notes: string;
  completed: boolean;
}

interface WorkoutDay {
  day: string;
  muscleGroup: string;
  exercises: Exercise[];
}

export function TrainingPage({ onNavigate }: TrainingPageProps) {
  const [selectedDay, setSelectedDay] = useState(0);
  const [workoutData, setWorkoutData] = useState<WorkoutDay[]>([
    {
      day: "Lunes",
      muscleGroup: "Piernas & Glúteos",
      exercises: [
        { id: "1", name: "Sentadillas con barra", sets: 4, reps: "10-12", weight: 40, notes: "Descenso controlado 3 seg", completed: false },
        { id: "2", name: "Peso muerto rumano", sets: 4, reps: "10-12", weight: 35, notes: "Mantener espalda recta", completed: false },
        { id: "3", name: "Hip thrust", sets: 4, reps: "12-15", weight: 50, notes: "Pausa 2 seg arriba", completed: true },
        { id: "4", name: "Zancadas caminando", sets: 3, reps: "12 c/pierna", weight: 12, notes: "Mancuernas en cada mano", completed: true },
        { id: "5", name: "Extensiones de cuádriceps", sets: 3, reps: "15", notes: "Contracción máxima arriba", completed: false }
      ]
    },
    {
      day: "Miércoles",
      muscleGroup: "Espalda & Bíceps",
      exercises: [
        { id: "6", name: "Dominadas asistidas", sets: 4, reps: "8-10", notes: "Si no hay máquina, usar banda", completed: false },
        { id: "7", name: "Remo con barra", sets: 4, reps: "10-12", weight: 30, notes: "Apretar omóplatos", completed: false },
        { id: "8", name: "Remo en polea baja", sets: 3, reps: "12", notes: "Sacar pecho", completed: false },
        { id: "9", name: "Curl de bíceps con mancuernas", sets: 3, reps: "12-15", weight: 8, notes: "Sin balanceo", completed: false },
        { id: "10", name: "Curl martillo", sets: 3, reps: "12", weight: 10, notes: "Alternado", completed: false }
      ]
    },
    {
      day: "Viernes",
      muscleGroup: "Pecho & Tríceps",
      exercises: [
        { id: "11", name: "Press de banca", sets: 4, reps: "10-12", weight: 25, notes: "Bajar hasta pecho", completed: false },
        { id: "12", name: "Press inclinado con mancuernas", sets: 4, reps: "10-12", weight: 12, notes: "45 grados", completed: false },
        { id: "13", name: "Aperturas en polea", sets: 3, reps: "12-15", notes: "Contracción completa", completed: false },
        { id: "14", name: "Extensiones de tríceps", sets: 3, reps: "12-15", notes: "Codos fijos", completed: false },
        { id: "15", name: "Fondos en banco", sets: 3, reps: "hasta fallo", notes: "Descenso controlado", completed: false }
      ]
    },
    {
      day: "Sábado",
      muscleGroup: "Hombros & Core",
      exercises: [
        { id: "16", name: "Press militar", sets: 4, reps: "10-12", weight: 20, notes: "Con barra o mancuernas", completed: false },
        { id: "17", name: "Elevaciones laterales", sets: 4, reps: "12-15", weight: 6, notes: "Sin impulso", completed: false },
        { id: "18", name: "Elevaciones frontales", sets: 3, reps: "12", weight: 6, notes: "Alternar brazos", completed: false },
        { id: "19", name: "Plancha abdominal", sets: 3, reps: "45-60 seg", notes: "Cuerpo recto", completed: false },
        { id: "20", name: "Russian twists", sets: 3, reps: "20 c/lado", notes: "Con peso si es posible", completed: false }
      ]
    }
  ]);

  const currentWorkout = workoutData[selectedDay];
  const completedExercises = currentWorkout.exercises.filter(e => e.completed).length;
  const totalExercises = currentWorkout.exercises.length;
  const progressPercentage = (completedExercises / totalExercises) * 100;

  const toggleExerciseComplete = (exerciseId: string) => {
    setWorkoutData(prev => {
      const newData = [...prev];
      const exercise = newData[selectedDay].exercises.find(e => e.id === exerciseId);
      if (exercise) {
        exercise.completed = !exercise.completed;
      }
      return newData;
    });
  };

  const updateExerciseWeight = (exerciseId: string, weight: number) => {
    setWorkoutData(prev => {
      const newData = [...prev];
      const exercise = newData[selectedDay].exercises.find(e => e.id === exerciseId);
      if (exercise) {
        exercise.weight = weight;
      }
      return newData;
    });
  };

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
            Mi Plan de Entrenamiento
          </h1>
          <p className="text-muted-foreground">
            Plan personalizado de 4 días/semana - Objetivo: Recomposición Corporal
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Sidebar - Days Selection */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="p-6 border-border">
              <h3 className="text-lg text-foreground mb-4">Días de Entrenamiento</h3>
              <div className="space-y-2">
                {workoutData.map((workout, index) => {
                  const dayCompleted = workout.exercises.filter(e => e.completed).length;
                  const dayTotal = workout.exercises.length;
                  return (
                    <button
                      key={index}
                      onClick={() => setSelectedDay(index)}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                        selectedDay === index
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-foreground">{workout.day}</span>
                        {dayCompleted === dayTotal && (
                          <Check className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{workout.muscleGroup}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Progress value={(dayCompleted / dayTotal) * 100} className="h-1 flex-1" />
                        <span>{dayCompleted}/{dayTotal}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Equipment Info */}
            <Card className="p-6 border-border">
              <h3 className="text-lg text-foreground mb-3">Tu Equipamiento</h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Barra</Badge>
                <Badge variant="outline">Mancuernas</Badge>
                <Badge variant="outline">Banco</Badge>
                <Badge variant="outline">Poleas</Badge>
                <Badge variant="outline">Máquinas</Badge>
              </div>
              <Button variant="link" className="p-0 mt-3 h-auto text-sm">
                Actualizar equipamiento
              </Button>
            </Card>

            {/* Tips Card */}
            <Card className="p-6 bg-gradient-to-br from-primary to-primary/80 text-white border-0">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-3">
                <Dumbbell className="h-5 w-5" />
              </div>
              <h3 className="mb-2">Consejos</h3>
              <ul className="space-y-1 text-sm text-white/90">
                <li>• Calienta 5-10 min antes</li>
                <li>• Estira después de entrenar</li>
                <li>• Hidrátate durante la sesión</li>
                <li>• Descansa 48-72h entre grupos</li>
              </ul>
            </Card>
          </div>

          {/* Main Content - Exercise List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Overview */}
            <Card className="p-6 border-border">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl text-foreground mb-1">{currentWorkout.day}</h2>
                  <p className="text-muted-foreground">{currentWorkout.muscleGroup}</p>
                </div>
                <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                  {completedExercises}/{totalExercises} completados
                </Badge>
              </div>
              <Progress value={progressPercentage} className="h-3" />
            </Card>

            {/* Exercise List */}
            <div className="space-y-4">
              {currentWorkout.exercises.map((exercise, index) => (
                <Card 
                  key={exercise.id} 
                  className={`p-6 border-2 transition-all ${
                    exercise.completed 
                      ? 'border-primary/30 bg-primary/5' 
                      : 'border-border'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Exercise Number & Checkbox */}
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => toggleExerciseComplete(exercise.id)}
                        className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                          exercise.completed
                            ? 'border-primary bg-primary text-white'
                            : 'border-border hover:border-primary'
                        }`}
                      >
                        {exercise.completed ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          <span className="text-sm text-foreground">{index + 1}</span>
                        )}
                      </button>
                    </div>

                    {/* Exercise Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-lg mb-2 ${
                        exercise.completed ? 'text-muted-foreground line-through' : 'text-foreground'
                      }`}>
                        {exercise.name}
                      </h3>
                      
                      {/* Sets, Reps, Weight */}
                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Series</p>
                          <p className="text-foreground">{exercise.sets}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Repeticiones</p>
                          <p className="text-foreground">{exercise.reps}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Peso (kg)</p>
                          <Input
                            type="number"
                            value={exercise.weight || ''}
                            onChange={(e) => updateExerciseWeight(exercise.id, parseFloat(e.target.value))}
                            className="h-8 w-20"
                            placeholder="0"
                          />
                        </div>
                      </div>

                      {/* Notes */}
                      {exercise.notes && (
                        <div className="flex items-start gap-2 p-3 bg-cream rounded-lg">
                          <ChevronRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-muted-foreground">{exercise.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Finish Workout Button */}
            {completedExercises === totalExercises ? (
              <Card className="p-6 bg-gradient-to-br from-primary to-primary/80 text-white border-0">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                    <Check className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl mb-2">¡Entrenamiento Completado! 🎉</h3>
                  <p className="text-sm text-white/90 mb-4">
                    Excelente trabajo hoy. No olvides registrar tus pesos para la próxima sesión.
                  </p>
                  <Button variant="secondary" className="bg-white text-primary hover:bg-white/90">
                    Ver Resumen del Entrenamiento
                  </Button>
                </div>
              </Card>
            ) : (
              <Button className="w-full bg-primary hover:bg-primary/90">
                Guardar Progreso
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
