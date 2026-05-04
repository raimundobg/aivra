import { useState } from "react";
import { ShoppingCart, Plus, Trash2, Check, Download, RefreshCw } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Checkbox } from "../components/ui/checkbox";
import { Badge } from "../components/ui/badge";

interface ShoppingListPageProps {
  onNavigate: (page: string) => void;
}

interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  category: string;
  checked: boolean;
}

export function ShoppingListPage({ onNavigate }: ShoppingListPageProps) {
  const [newItemName, setNewItemName] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState("");
  const [items, setItems] = useState<ShoppingItem[]>([
    // Proteínas
    { id: "1", name: "Pechuga de pollo", quantity: "1 kg", category: "Proteínas", checked: false },
    { id: "2", name: "Salmón fresco", quantity: "400g", category: "Proteínas", checked: false },
    { id: "3", name: "Huevos", quantity: "1 docena", category: "Proteínas", checked: true },
    { id: "4", name: "Pavo molido", quantity: "500g", category: "Proteínas", checked: false },
    { id: "5", name: "Queso feta", quantity: "200g", category: "Proteínas", checked: false },

    // Carbohidratos
    { id: "6", name: "Avena", quantity: "500g", category: "Carbohidratos", checked: true },
    { id: "7", name: "Quinoa", quantity: "300g", category: "Carbohidratos", checked: false },
    { id: "8", name: "Arroz integral", quantity: "1 kg", category: "Carbohidratos", checked: false },
    { id: "9", name: "Pan integral", quantity: "1 paquete", category: "Carbohidratos", checked: false },
    { id: "10", name: "Tortillas integrales", quantity: "1 paquete", category: "Carbohidratos", checked: false },

    // Vegetales
    { id: "11", name: "Brócoli", quantity: "500g", category: "Vegetales", checked: false },
    { id: "12", name: "Espinacas", quantity: "300g", category: "Vegetales", checked: false },
    { id: "13", name: "Tomates cherry", quantity: "250g", category: "Vegetales", checked: true },
    { id: "14", name: "Pimiento rojo", quantity: "3 unidades", category: "Vegetales", checked: false },
    { id: "15", name: "Zanahorias", quantity: "500g", category: "Vegetales", checked: false },
    { id: "16", name: "Lechuga", quantity: "1 unidad", category: "Vegetales", checked: false },

    // Frutas
    { id: "17", name: "Plátanos", quantity: "6 unidades", category: "Frutas", checked: false },
    { id: "18", name: "Frutos rojos congelados", quantity: "400g", category: "Frutas", checked: false },
    { id: "19", name: "Limones", quantity: "4 unidades", category: "Frutas", checked: false },
    { id: "20", name: "Aguacate", quantity: "4 unidades", category: "Frutas", checked: false },

    // Grasas saludables
    { id: "21", name: "Aceite de oliva", quantity: "500ml", category: "Grasas", checked: true },
    { id: "22", name: "Mantequilla de maní", quantity: "1 frasco", category: "Grasas", checked: false },
    { id: "23", name: "Nueces mixtas", quantity: "200g", category: "Grasas", checked: false },

    // Lácteos
    { id: "24", name: "Leche de almendras", quantity: "1 litro", category: "Lácteos", checked: false },
    { id: "25", name: "Yogurt griego natural", quantity: "500g", category: "Lácteos", checked: false },

    // Otros
    { id: "26", name: "Proteína en polvo chocolate", quantity: "1 bote", category: "Otros", checked: false },
    { id: "27", name: "Semillas de chía", quantity: "200g", category: "Otros", checked: false },
    { id: "28", name: "Especias mexicanas", quantity: "1 frasco", category: "Otros", checked: false },
  ]);

  const categories = ["Proteínas", "Carbohidratos", "Vegetales", "Frutas", "Grasas", "Lácteos", "Otros"];

  const toggleItem = (id: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const deleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const addItem = () => {
    if (newItemName.trim()) {
      const newItem: ShoppingItem = {
        id: Date.now().toString(),
        name: newItemName,
        quantity: newItemQuantity || "1 unidad",
        category: "Otros",
        checked: false
      };
      setItems([...items, newItem]);
      setNewItemName("");
      setNewItemQuantity("");
    }
  };

  const clearChecked = () => {
    setItems(items.filter(item => !item.checked));
  };

  const uncheckAll = () => {
    setItems(items.map(item => ({ ...item, checked: false })));
  };

  const checkedCount = items.filter(item => item.checked).length;
  const totalCount = items.length;

  return (
    <div className="min-h-screen py-12 bg-gradient-to-br from-cream via-white to-beige/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
              <ShoppingCart className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl text-foreground">Lista de Compras</h1>
              <p className="text-muted-foreground">
                Semana del 21 al 27 de Noviembre
              </p>
            </div>
          </div>
        </div>

        {/* Stats Card */}
        <Card className="p-6 border-border mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Progreso de compras</p>
              <p className="text-2xl text-foreground">
                {checkedCount} de {totalCount} items
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => onNavigate('dashboard')}
                variant="outline"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar PDF
              </Button>
              <Button
                onClick={uncheckAll}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reiniciar
              </Button>
            </div>
          </div>
        </Card>

        {/* Add Item */}
        <Card className="p-6 border-border mb-6">
          <h3 className="text-lg text-foreground mb-4">Agregar item</h3>
          <div className="flex gap-3">
            <Input
              placeholder="Nombre del producto"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addItem()}
              className="flex-1"
            />
            <Input
              placeholder="Cantidad"
              value={newItemQuantity}
              onChange={(e) => setNewItemQuantity(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addItem()}
              className="w-32"
            />
            <Button onClick={addItem} className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Agregar
            </Button>
          </div>
        </Card>

        {/* Shopping List by Category */}
        <div className="space-y-6">
          {categories.map(category => {
            const categoryItems = items.filter(item => item.category === category);
            if (categoryItems.length === 0) return null;

            return (
              <Card key={category} className="p-6 border-border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg text-foreground">{category}</h3>
                  <Badge variant="outline">
                    {categoryItems.filter(item => item.checked).length}/{categoryItems.length}
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  {categoryItems.map(item => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-4 p-3 rounded-lg border transition-all ${
                        item.checked 
                          ? 'bg-primary/5 border-primary/20' 
                          : 'bg-white border-border hover:border-primary/50'
                      }`}
                    >
                      <Checkbox
                        checked={item.checked}
                        onCheckedChange={() => toggleItem(item.id)}
                        className="flex-shrink-0"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <p className={`text-foreground ${item.checked ? 'line-through text-muted-foreground' : ''}`}>
                          {item.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity}
                        </p>
                      </div>

                      <Button
                        onClick={() => deleteItem(item.id)}
                        variant="ghost"
                        size="sm"
                        className="flex-shrink-0 text-muted-foreground hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Clear Checked Button */}
        {checkedCount > 0 && (
          <Card className="p-6 border-border mt-6 bg-gradient-to-br from-primary to-primary/80 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg mb-1">Items comprados</h3>
                <p className="text-sm text-white/90">
                  Tienes {checkedCount} items marcados como comprados
                </p>
              </div>
              <Button
                onClick={clearChecked}
                variant="secondary"
                className="bg-white text-primary hover:bg-white/90"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Limpiar comprados
              </Button>
            </div>
          </Card>
        )}

        {/* Tips Card */}
        <Card className="p-6 border-border mt-6">
          <h3 className="text-foreground mb-3">💡 Tips para tus compras</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Compra vegetales frescos para 3-4 días y congela el resto</li>
            <li>• Prepara tus proteínas en batch cooking los domingos</li>
            <li>• Los frutos rojos congelados mantienen todos sus nutrientes</li>
            <li>• Revisa las ofertas de la semana en tu supermercado favorito</li>
            <li>• Lista actualizada automáticamente según tu plan nutricional</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
