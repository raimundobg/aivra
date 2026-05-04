import { useState } from "react";
import { Search, Clock, Users, Flame, ChefHat, Heart, Download } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

interface RecipesPageProps {
  onNavigate: (page: string) => void;
}

interface Recipe {
  id: string;
  title: string;
  category: string;
  image: string;
  prepTime: number;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  tags: string[];
  difficulty: string;
  ingredients: string[];
  instructions: string[];
  favorite: boolean;
}

export function RecipesPage({ onNavigate }: RecipesPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const recipes: Recipe[] = [
    {
      id: "1",
      title: "Bowl de Quinoa con Pollo y Aguacate",
      category: "Almuerzos",
      image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800",
      prepTime: 25,
      servings: 2,
      calories: 450,
      protein: 35,
      carbs: 42,
      fats: 18,
      tags: ["Alto en proteína", "Sin gluten"],
      difficulty: "Fácil",
      ingredients: [
        "1 taza de quinoa cocida",
        "200g de pechuga de pollo",
        "1 aguacate maduro",
        "1 taza de espinacas frescas",
        "1/2 taza de tomates cherry",
        "2 cdas de aceite de oliva",
        "Jugo de 1 limón",
        "Sal y pimienta"
      ],
      instructions: [
        "Cocina la quinoa según las instrucciones del paquete",
        "Sazona el pollo con sal y pimienta, cocínalo a la plancha",
        "Corta el aguacate en cubos y los tomates por la mitad",
        "Arma el bowl: quinoa de base, pollo encima, aguacate, espinacas y tomates",
        "Aliña con aceite de oliva y jugo de limón"
      ],
      favorite: true
    },
    {
      id: "2",
      title: "Overnight Oats con Frutos Rojos",
      category: "Desayunos",
      image: "https://images.unsplash.com/photo-1590301157890-4810ed352733?w=800",
      prepTime: 10,
      servings: 1,
      calories: 320,
      protein: 12,
      carbs: 48,
      fats: 10,
      tags: ["Vegetariano", "Prep anticipado"],
      difficulty: "Muy fácil",
      ingredients: [
        "1/2 taza de avena",
        "3/4 taza de leche de almendras",
        "1 cda de semillas de chía",
        "1/2 taza de frutos rojos congelados",
        "1 cda de miel",
        "1 cda de mantequilla de maní"
      ],
      instructions: [
        "En un frasco, mezcla la avena, leche, chía y miel",
        "Revuelve bien y refrigera toda la noche",
        "Por la mañana, agrega los frutos rojos y la mantequilla de maní",
        "Mezcla suavemente y disfruta frío"
      ],
      favorite: false
    },
    {
      id: "3",
      title: "Salmón al Horno con Vegetales",
      category: "Cenas",
      image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800",
      prepTime: 30,
      servings: 2,
      calories: 380,
      protein: 32,
      carbs: 22,
      fats: 20,
      tags: ["Rico en omega-3", "Keto friendly"],
      difficulty: "Media",
      ingredients: [
        "2 filetes de salmón (150g c/u)",
        "2 tazas de brócoli",
        "1 taza de zanahoria en rodajas",
        "2 cdas de aceite de oliva",
        "2 dientes de ajo picados",
        "Jugo de 1 limón",
        "Romero fresco"
      ],
      instructions: [
        "Precalienta el horno a 200°C",
        "En una bandeja, coloca las verduras con aceite, ajo y sal",
        "Hornea las verduras por 15 minutos",
        "Agrega el salmón sazonado con limón, sal y romero",
        "Hornea todo junto por 12-15 minutos más"
      ],
      favorite: true
    },
    {
      id: "4",
      title: "Batido Proteico de Chocolate",
      category: "Snacks",
      image: "https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=800",
      prepTime: 5,
      servings: 1,
      calories: 280,
      protein: 30,
      carbs: 28,
      fats: 8,
      tags: ["Post-entreno", "Alto en proteína"],
      difficulty: "Muy fácil",
      ingredients: [
        "1 scoop de proteína de chocolate",
        "1 plátano congelado",
        "1 taza de leche descremada",
        "1 cda de cacao puro",
        "1 cda de mantequilla de maní",
        "Hielo al gusto"
      ],
      instructions: [
        "Coloca todos los ingredientes en la licuadora",
        "Licúa hasta obtener una consistencia suave",
        "Sirve inmediatamente",
        "Opcional: agrega un toque de canela"
      ],
      favorite: false
    },
    {
      id: "5",
      title: "Ensalada de Lentejas con Feta",
      category: "Almuerzos",
      image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800",
      prepTime: 20,
      servings: 3,
      calories: 340,
      protein: 18,
      carbs: 45,
      fats: 12,
      tags: ["Vegetariano", "Alto en fibra"],
      difficulty: "Fácil",
      ingredients: [
        "1.5 tazas de lentejas cocidas",
        "100g de queso feta",
        "1 pepino picado",
        "1 taza de tomates cherry",
        "1/2 cebolla morada",
        "Perejil fresco",
        "3 cdas de aceite de oliva",
        "2 cdas de vinagre balsámico"
      ],
      instructions: [
        "En un bowl grande, mezcla las lentejas cocidas y enfriadas",
        "Agrega el pepino, tomates y cebolla picados",
        "Desmenuza el queso feta sobre la ensalada",
        "Prepara la vinagreta con aceite y vinagre",
        "Aliña, mezcla y decora con perejil"
      ],
      favorite: false
    },
    {
      id: "6",
      title: "Tacos de Pavo con Vegetales",
      category: "Cenas",
      image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800",
      prepTime: 20,
      servings: 4,
      calories: 310,
      protein: 28,
      carbs: 32,
      fats: 10,
      tags: ["Bajo en grasa", "Rico en proteína"],
      difficulty: "Fácil",
      ingredients: [
        "400g de carne molida de pavo",
        "8 tortillas integrales pequeñas",
        "1 pimiento rojo picado",
        "1 cebolla picada",
        "1 taza de lechuga",
        "1 tomate picado",
        "Especias mexicanas",
        "Yogurt griego natural"
      ],
      instructions: [
        "Cocina la carne de pavo con cebolla y pimiento",
        "Sazona con especias mexicanas al gusto",
        "Calienta las tortillas en un sartén",
        "Rellena con la carne, lechuga y tomate",
        "Sirve con una cucharada de yogurt griego"
      ],
      favorite: true
    }
  ];

  const filteredRecipes = recipes.filter(recipe =>
    recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipe.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipe.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const categories = ["Todas", "Desayunos", "Almuerzos", "Cenas", "Snacks"];
  const [activeCategory, setActiveCategory] = useState("Todas");

  const categoryFilteredRecipes = activeCategory === "Todas" 
    ? filteredRecipes 
    : filteredRecipes.filter(r => r.category === activeCategory);

  if (selectedRecipe) {
    return (
      <div className="min-h-screen py-12 bg-gradient-to-br from-cream via-white to-beige/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button
            onClick={() => setSelectedRecipe(null)}
            variant="ghost"
            className="mb-6"
          >
            ← Volver a recetas
          </Button>

          <Card className="overflow-hidden border-border">
            {/* Recipe Image */}
            <div className="aspect-[21/9] relative">
              <ImageWithFallback
                src={selectedRecipe.image}
                alt={selectedRecipe.title}
                className="w-full h-full object-cover"
              />
              <button
                className={`absolute top-4 right-4 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center ${
                  selectedRecipe.favorite ? 'text-red-500' : 'text-muted-foreground'
                }`}
              >
                <Heart className={`h-6 w-6 ${selectedRecipe.favorite ? 'fill-current' : ''}`} />
              </button>
            </div>

            <div className="p-8">
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                    {selectedRecipe.category}
                  </Badge>
                  <Badge variant="outline">{selectedRecipe.difficulty}</Badge>
                </div>
                <h1 className="text-3xl text-foreground mb-4">{selectedRecipe.title}</h1>
                
                {/* Quick Info */}
                <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{selectedRecipe.prepTime} min</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{selectedRecipe.servings} porciones</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Flame className="h-4 w-4" />
                    <span>{selectedRecipe.calories} kcal</span>
                  </div>
                </div>
              </div>

              {/* Macros */}
              <div className="grid grid-cols-3 gap-4 mb-8 p-4 bg-cream rounded-xl">
                <div className="text-center">
                  <p className="text-2xl text-primary mb-1">{selectedRecipe.protein}g</p>
                  <p className="text-sm text-muted-foreground">Proteína</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl text-primary mb-1">{selectedRecipe.carbs}g</p>
                  <p className="text-sm text-muted-foreground">Carbohidratos</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl text-primary mb-1">{selectedRecipe.fats}g</p>
                  <p className="text-sm text-muted-foreground">Grasas</p>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-8">
                {selectedRecipe.tags.map((tag, index) => (
                  <Badge key={index} variant="outline">{tag}</Badge>
                ))}
              </div>

              {/* Ingredients & Instructions */}
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h2 className="text-xl text-foreground mb-4">Ingredientes</h2>
                  <ul className="space-y-2">
                    {selectedRecipe.ingredients.map((ingredient, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <div className="w-2 h-2 rounded-full bg-primary"></div>
                        </div>
                        <span className="text-muted-foreground">{ingredient}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h2 className="text-xl text-foreground mb-4">Preparación</h2>
                  <ol className="space-y-3">
                    {selectedRecipe.instructions.map((instruction, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm">
                          {index + 1}
                        </span>
                        <span className="text-muted-foreground pt-0.5">{instruction}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex gap-3">
                <Button className="flex-1 bg-primary hover:bg-primary/90">
                  <Download className="h-4 w-4 mr-2" />
                  Descargar PDF
                </Button>
                <Button variant="outline" className="flex-1">
                  Agregar a mi plan
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

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
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <ChefHat className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl text-foreground">Recetario</h1>
              <p className="text-muted-foreground">
                Recetas saludables adaptadas a tu plan nutricional
              </p>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <Card className="p-6 border-border mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar recetas, ingredientes o etiquetas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {categories.map((category) => (
                <Button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  variant={activeCategory === category ? "default" : "outline"}
                  size="sm"
                  className="whitespace-nowrap"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Recipes Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categoryFilteredRecipes.map((recipe) => (
            <Card
              key={recipe.id}
              className="overflow-hidden border-border hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => setSelectedRecipe(recipe)}
            >
              <div className="aspect-video relative overflow-hidden">
                <ImageWithFallback
                  src={recipe.image}
                  alt={recipe.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  className={`absolute top-3 right-3 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center ${
                    recipe.favorite ? 'text-red-500' : 'text-muted-foreground'
                  }`}
                >
                  <Heart className={`h-5 w-5 ${recipe.favorite ? 'fill-current' : ''}`} />
                </button>
                <Badge className="absolute bottom-3 left-3 bg-white/95 text-foreground hover:bg-white">
                  {recipe.category}
                </Badge>
              </div>

              <div className="p-5">
                <h3 className="text-lg text-foreground mb-3 line-clamp-2">
                  {recipe.title}
                </h3>

                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{recipe.prepTime} min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Flame className="h-4 w-4" />
                    <span>{recipe.calories} kcal</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex gap-4 text-sm">
                    <span className="text-primary">{recipe.protein}g P</span>
                    <span className="text-muted-foreground">{recipe.carbs}g C</span>
                    <span className="text-muted-foreground">{recipe.fats}g G</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {recipe.difficulty}
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {categoryFilteredRecipes.length === 0 && (
          <Card className="p-12 text-center border-border">
            <p className="text-muted-foreground">
              No se encontraron recetas. Intenta con otra búsqueda.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
