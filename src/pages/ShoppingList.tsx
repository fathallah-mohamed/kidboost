import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "@supabase/auth-helpers-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Sparkles, Trash2, Download, Carrot, Drumstick, Wheat, Milk, ShoppingCart, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  category: string;
  checked: boolean;
}

const categoryConfig = {
  vegetables: { label: "Légumes", icon: Carrot, color: "text-pastel-green" },
  proteins: { label: "Protéines", icon: Drumstick, color: "text-primary" },
  starches: { label: "Féculents", icon: Wheat, color: "text-pastel-yellow-foreground" },
  dairy: { label: "Laitiers", icon: Milk, color: "text-blue-500" },
  other: { label: "Autres", icon: ShoppingCart, color: "text-muted-foreground" },
};

export default function ShoppingList() {
  const navigate = useNavigate();
  const session = useSession();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const fetchShoppingList = async () => {
      if (!session?.user?.id) return;
      
      const { data, error } = await supabase
        .from("shopping_lists")
        .select("items")
        .eq("profile_id", session.user.id)
        .maybeSingle();
      
      if (!error && data?.items && Array.isArray(data.items)) {
        setItems(data.items as unknown as ShoppingItem[]);
      }
      setLoading(false);
    };

    fetchShoppingList();
  }, [session?.user?.id]);

  const handleGenerateList = async () => {
    if (!session?.user?.id) return;
    setGenerating(true);

    try {
      // Fetch planned meals for the week
      const today = new Date();
      const weekEnd = new Date(today);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const { data: meals } = await supabase
        .from("meal_plans")
        .select("recipe:recipes(ingredients)")
        .eq("profile_id", session.user.id)
        .gte("date", today.toISOString().split("T")[0])
        .lte("date", weekEnd.toISOString().split("T")[0]);

      if (!meals || meals.length === 0) {
        toast.error("Aucun repas planifié cette semaine");
        return;
      }

      // Extract and combine ingredients
      const allIngredients: ShoppingItem[] = [];
      let idCounter = 0;

      meals.forEach((meal: any) => {
        const ingredients = meal.recipe?.ingredients || [];
        if (Array.isArray(ingredients)) {
          ingredients.forEach((ing: any) => {
            allIngredients.push({
              id: `item-${idCounter++}`,
              name: typeof ing === "string" ? ing : ing.name || ing.ingredient || "Ingrédient",
              quantity: typeof ing === "object" ? `${ing.quantity || ""} ${ing.unit || ""}`.trim() : "",
              category: "other",
              checked: false,
            });
          });
        }
      });

      // Save to database - delete first, then insert
      await supabase
        .from("shopping_lists")
        .delete()
        .eq("profile_id", session.user.id);

      await supabase
        .from("shopping_lists")
        .insert({
          profile_id: session.user.id,
          items: allIngredients as unknown as any,
        });

      setItems(allIngredients);
      toast.success("Liste de courses générée !");
    } catch (error) {
      console.error("Error generating list:", error);
      toast.error("Erreur lors de la génération");
    } finally {
      setGenerating(false);
    }
  };

  const toggleItem = async (itemId: string) => {
    const newItems = items.map(item =>
      item.id === itemId ? { ...item, checked: !item.checked } : item
    );
    setItems(newItems);

    if (session?.user?.id) {
      await supabase
        .from("shopping_lists")
        .update({ items: newItems as unknown as any })
        .eq("profile_id", session.user.id);
    }
  };

  const clearList = async () => {
    if (!session?.user?.id) return;
    
    await supabase
      .from("shopping_lists")
      .delete()
      .eq("profile_id", session.user.id);
    
    setItems([]);
    toast.success("Liste vidée");
  };

  const exportList = () => {
    const text = items
      .filter(i => !i.checked)
      .map(i => `${i.checked ? "✓" : "○"} ${i.name} ${i.quantity}`)
      .join("\n");
    
    navigator.clipboard.writeText(text);
    toast.success("Liste copiée dans le presse-papier");
  };

  const groupedItems = items.reduce((acc, item) => {
    const cat = item.category || "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, ShoppingItem[]>);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-lg mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Liste de courses</h1>
          </div>
        </div>

        <Button 
          onClick={handleGenerateList} 
          disabled={generating}
          className="w-full"
        >
          {generating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 mr-2" />
          )}
          Générer depuis les repas planifiés
        </Button>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Chargement...
          </div>
        ) : items.length === 0 ? (
          <Card className="p-8 text-center">
            <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Aucun article dans la liste
            </p>
          </Card>
        ) : (
          <>
            {Object.entries(categoryConfig).map(([key, config]) => {
              const categoryItems = groupedItems[key];
              if (!categoryItems || categoryItems.length === 0) return null;
              
              const Icon = config.icon;
              return (
                <Card key={key} className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-4 h-4 ${config.color}`} />
                    <span className="font-semibold text-sm">{config.label}</span>
                  </div>
                  <div className="space-y-2">
                    {categoryItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2"
                      >
                        <Checkbox
                          checked={item.checked}
                          onCheckedChange={() => toggleItem(item.id)}
                        />
                        <span className={`flex-1 text-sm ${item.checked ? "line-through text-muted-foreground" : ""}`}>
                          {item.name}
                        </span>
                        {item.quantity && (
                          <span className="text-xs text-muted-foreground">
                            {item.quantity}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={clearList}>
                <Trash2 className="w-4 h-4 mr-2" />
                Vider
              </Button>
              <Button variant="outline" className="flex-1" onClick={exportList}>
                <Download className="w-4 h-4 mr-2" />
                Exporter
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
