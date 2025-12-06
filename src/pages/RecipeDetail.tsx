import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSession } from "@supabase/auth-helpers-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Clock, ChefHat, Users, Plus, ShoppingCart, Calendar, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Recipe {
  id: string;
  name: string;
  meal_type: string;
  preparation_time: number;
  difficulty: string;
  servings: number;
  ingredients: any[];
  instructions: string;
  nutritional_info: any;
}

export default function RecipeDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const session = useSession();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingToList, setAddingToList] = useState(false);
  const [addingToWeek, setAddingToWeek] = useState(false);

  useEffect(() => {
    const fetchRecipe = async () => {
      if (!id) return;
      
      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("id", id)
        .single();
      
      if (!error && data) {
        setRecipe(data as Recipe);
      }
      setLoading(false);
    };

    fetchRecipe();
  }, [id]);

  const handleAddToShoppingList = async () => {
    if (!recipe || !session?.user?.id) return;
    setAddingToList(true);

    try {
      const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
      const shoppingItems = ingredients.map((ing: any, idx: number) => ({
        id: `item-${Date.now()}-${idx}`,
        name: typeof ing === "string" ? ing : ing.name || ing.ingredient || "Ingrédient",
        quantity: typeof ing === "object" ? `${ing.quantity || ""} ${ing.unit || ""}`.trim() : "",
        category: "other",
        checked: false,
      }));

      const { data: existingList } = await supabase
        .from("shopping_lists")
        .select("id, items")
        .eq("profile_id", session.user.id)
        .maybeSingle();

      const currentItems = Array.isArray(existingList?.items) ? existingList.items : [];
      const newItems = [...currentItems, ...shoppingItems];

      if (existingList) {
        await supabase
          .from("shopping_lists")
          .update({ items: newItems as unknown as any })
          .eq("id", existingList.id);
      } else {
        await supabase
          .from("shopping_lists")
          .insert({ profile_id: session.user.id, items: newItems as unknown as any });
      }

      toast.success("Ingrédients ajoutés à la liste de courses");
    } catch (error) {
      console.error("Error adding to shopping list:", error);
      toast.error("Erreur lors de l'ajout");
    } finally {
      setAddingToList(false);
    }
  };

  const handleAddToWeek = async () => {
    if (!recipe || !session?.user?.id) return;
    setAddingToWeek(true);

    try {
      const today = new Date().toISOString().split("T")[0];
      
      await supabase.from("meal_plans").insert({
        profile_id: session.user.id,
        recipe_id: recipe.id,
        date: today,
        meal_time: recipe.meal_type || "dinner",
      });

      toast.success("Recette ajoutée au planning");
    } catch (error) {
      console.error("Error adding to week:", error);
      toast.error("Erreur lors de l'ajout");
    } finally {
      setAddingToWeek(false);
    }
  };

  const getIngredientsList = () => {
    if (!recipe?.ingredients) return [];
    if (Array.isArray(recipe.ingredients)) {
      return recipe.ingredients.map((ing: any) => {
        if (typeof ing === "string") return ing;
        return `${ing.quantity || ""} ${ing.unit || ""} ${ing.name || ing.ingredient || ""}`.trim();
      });
    }
    return [];
  };

  const getNutritionalInfo = () => {
    if (!recipe?.nutritional_info) return null;
    const info = recipe.nutritional_info;
    return {
      calories: info.calories || info.energy || "—",
      proteins: info.proteins || info.protein || "—",
      carbs: info.carbohydrates || info.carbs || "—",
      fats: info.fats || info.fat || info.lipids || "—",
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-lg mx-auto text-center py-12">
          <ChefHat className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-xl font-bold mb-2">Recette introuvable</h1>
          <Button onClick={() => navigate("/recipes")}>
            Retour aux recettes
          </Button>
        </div>
      </div>
    );
  }

  const ingredients = getIngredientsList();
  const nutritionalInfo = getNutritionalInfo();

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{recipe.name}</h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {recipe.preparation_time} min
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {recipe.servings} portions
              </span>
              <span className="capitalize">{recipe.difficulty}</span>
            </div>
          </div>
        </div>

        {/* Ingredients */}
        <Card className="p-4">
          <h2 className="font-bold mb-3">Ingrédients</h2>
          {ingredients.length > 0 ? (
            <ul className="space-y-2">
              {ingredients.map((ing, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  {ing}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Aucun ingrédient listé</p>
          )}
        </Card>

        {/* Instructions */}
        <Card className="p-4">
          <h2 className="font-bold mb-3">Étapes de préparation</h2>
          {recipe.instructions ? (
            <div className="text-sm whitespace-pre-wrap">{recipe.instructions}</div>
          ) : (
            <p className="text-sm text-muted-foreground">Aucune instruction disponible</p>
          )}
        </Card>

        {/* Nutritional Info */}
        {nutritionalInfo && (
          <Card className="p-4">
            <h2 className="font-bold mb-3">Valeurs nutritionnelles</h2>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2 bg-muted rounded-lg">
                <div className="text-lg font-bold">{nutritionalInfo.calories}</div>
                <div className="text-xs text-muted-foreground">kcal</div>
              </div>
              <div className="p-2 bg-muted rounded-lg">
                <div className="text-lg font-bold">{nutritionalInfo.proteins}g</div>
                <div className="text-xs text-muted-foreground">Protéines</div>
              </div>
              <div className="p-2 bg-muted rounded-lg">
                <div className="text-lg font-bold">{nutritionalInfo.carbs}g</div>
                <div className="text-xs text-muted-foreground">Glucides</div>
              </div>
              <div className="p-2 bg-muted rounded-lg">
                <div className="text-lg font-bold">{nutritionalInfo.fats}g</div>
                <div className="text-xs text-muted-foreground">Lipides</div>
              </div>
            </div>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={handleAddToWeek}
            disabled={addingToWeek}
          >
            {addingToWeek ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Calendar className="w-4 h-4 mr-2" />
            )}
            Ajouter à la semaine
          </Button>
          <Button 
            className="flex-1"
            onClick={handleAddToShoppingList}
            disabled={addingToList}
          >
            {addingToList ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <ShoppingCart className="w-4 h-4 mr-2" />
            )}
            Ajouter aux courses
          </Button>
        </div>
      </div>
    </div>
  );
}
