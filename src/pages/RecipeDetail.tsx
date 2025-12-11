import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSession } from "@supabase/auth-helpers-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, Clock, ChefHat, Users, ShoppingCart, Calendar, 
  Loader2, Heart, Pencil, Trash2, Copy, AlertTriangle 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AddToMealDialog } from "@/components/recipes/AddToMealDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  allergens?: string[];
}

export default function RecipeDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const session = useSession();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [addingToList, setAddingToList] = useState(false);
  const [showAddToMeal, setShowAddToMeal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showLunchbox, setShowLunchbox] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id || !session?.user?.id) return;

      // Fetch recipe
      const { data: recipeData, error: recipeError } = await supabase
        .from("recipes")
        .select("*")
        .eq("id", id)
        .single();

      if (!recipeError && recipeData) {
        setRecipe({
          ...recipeData,
          ingredients: typeof recipeData.ingredients === "string" 
            ? JSON.parse(recipeData.ingredients) 
            : recipeData.ingredients,
        } as Recipe);
      }

      // Check if favorite
      const { data: favData } = await supabase
        .from("recipe_favorites")
        .select("id")
        .eq("recipe_id", id)
        .eq("profile_id", session.user.id)
        .maybeSingle();

      setIsFavorite(!!favData);

      // Check lunchbox eligibility
      const { data: children } = await supabase
        .from("children_profiles")
        .select("regime_special, sortie_scolaire_dates")
        .eq("profile_id", session.user.id);

      if (children) {
        const hasSpecialChild = children.some(child => {
          return child.regime_special === true || 
            (Array.isArray(child.sortie_scolaire_dates) && child.sortie_scolaire_dates.length > 0);
        });
        setShowLunchbox(hasSpecialChild);
      }

      setLoading(false);
    };

    fetchData();
  }, [id, session?.user?.id]);

  const toggleFavorite = async () => {
    if (!recipe || !session?.user?.id) return;

    try {
      if (isFavorite) {
        await supabase
          .from("recipe_favorites")
          .delete()
          .eq("recipe_id", recipe.id)
          .eq("profile_id", session.user.id);
        setIsFavorite(false);
        toast.success("Retiré des favoris");
      } else {
        await supabase
          .from("recipe_favorites")
          .insert({ recipe_id: recipe.id, profile_id: session.user.id });
        setIsFavorite(true);
        toast.success("Ajouté aux favoris");
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
    }
  };

  const handleAddToShoppingList = async () => {
    if (!recipe || !session?.user?.id) return;
    setAddingToList(true);

    try {
      const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
      const shoppingItems = ingredients.map((ing: any, idx: number) => ({
        id: `item-${Date.now()}-${idx}`,
        name: typeof ing === "string" ? ing : ing.name || ing.item || ing.ingredient || "Ingrédient",
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

  const handleDuplicate = async () => {
    if (!recipe || !session?.user?.id) return;

    try {
      const { id, ...recipeData } = recipe;
      await supabase.from("recipes").insert({
        ...recipeData,
        profile_id: session.user.id,
        name: `${recipe.name} (copie)`,
        ingredients: recipe.ingredients,
        nutritional_info: recipe.nutritional_info,
      });

      toast.success("Recette dupliquée !");
      navigate("/recipes");
    } catch (error) {
      toast.error("Erreur lors de la duplication");
    }
  };

  const handleDelete = async () => {
    if (!recipe || !session?.user?.id) return;
    setDeleting(true);

    try {
      // First delete from meal_plans
      await supabase
        .from("meal_plans")
        .delete()
        .eq("recipe_id", recipe.id);

      // Delete from favorites
      await supabase
        .from("recipe_favorites")
        .delete()
        .eq("recipe_id", recipe.id);

      // Delete recipe
      await supabase
        .from("recipes")
        .delete()
        .eq("id", recipe.id);

      toast.success("Recette supprimée");
      navigate("/recipes");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleting(false);
    }
  };

  const getIngredientsList = () => {
    if (!recipe?.ingredients) return [];
    if (Array.isArray(recipe.ingredients)) {
      return recipe.ingredients.map((ing: any) => {
        if (typeof ing === "string") return ing;
        return `${ing.quantity || ""} ${ing.unit || ""} ${ing.name || ing.item || ing.ingredient || ""}`.trim();
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

  const getMealTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      breakfast: "Petit-déjeuner",
      lunch: "Déjeuner",
      snack: "Goûter",
      dinner: "Dîner",
      lunchbox: "Lunchbox",
      lunchbox_special: "Lunchbox régime",
      lunchbox_trip: "Lunchbox sortie",
    };
    return labels[type] || type;
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
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{recipe.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary">{getMealTypeLabel(recipe.meal_type)}</Badge>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {recipe.preparation_time} min
              </span>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {recipe.servings} portions
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFavorite}
          >
            <Heart className={`w-5 h-5 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
          </Button>
        </div>

        {/* Allergens Warning */}
        {recipe.allergens && recipe.allergens.length > 0 && (
          <Card className="p-3 bg-amber-500/10 border-amber-500/20">
            <div className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">Allergènes: {recipe.allergens.join(", ")}</span>
            </div>
          </Card>
        )}

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
            <div className="text-sm whitespace-pre-wrap leading-relaxed">{recipe.instructions}</div>
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

        {/* Primary Actions */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => setShowAddToMeal(true)}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Ajouter au repas
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

        {/* Secondary Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={handleDuplicate}>
            <Copy className="w-4 h-4 mr-1" />
            Dupliquer
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 text-destructive hover:text-destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Supprimer
          </Button>
        </div>
      </div>

      {/* Add to Meal Dialog */}
      {session?.user?.id && (
        <AddToMealDialog
          open={showAddToMeal}
          onOpenChange={setShowAddToMeal}
          recipeId={recipe.id}
          recipeMealType={recipe.meal_type}
          userId={session.user.id}
          showLunchbox={showLunchbox}
          onSuccess={() => {}}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette recette ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La recette sera supprimée de votre bibliothèque 
              et retirée de tous les plannings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
