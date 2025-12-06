import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@supabase/auth-helpers-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Users, ChefHat, Plus, ThumbsUp, ThumbsDown } from "lucide-react";
import { toast } from "sonner";

interface Recipe {
  id: string;
  name: string;
  ingredients: any;
  instructions: string;
  preparation_time: number;
  nutritional_info: any;
  meal_type: string;
  difficulty: string;
  servings: number;
  health_benefits?: any;
}

export const RecipeDetailPage = () => {
  const { recipeId } = useParams();
  const navigate = useNavigate();
  const session = useSession();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecipe = async () => {
      if (!recipeId) return;

      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', recipeId)
        .single();

      if (error) {
        console.error('Error fetching recipe:', error);
        toast.error("Recette non trouvée");
        navigate(-1);
      } else {
        setRecipe(data);
      }
      setLoading(false);
    };

    fetchRecipe();
  }, [recipeId, navigate]);

  const handleAddToShoppingList = async () => {
    if (!recipe || !session?.user?.id) return;

    const { data: existingList } = await supabase
      .from('shopping_lists')
      .select('id, items')
      .eq('profile_id', session.user.id)
      .maybeSingle();

    const currentItems = Array.isArray(existingList?.items) ? existingList.items : [];
    const ingredientsArray = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
    const newItems = [...currentItems, ...ingredientsArray];

    if (existingList) {
      await supabase
        .from('shopping_lists')
        .update({ items: newItems })
        .eq('id', existingList.id);
    } else {
      await supabase
        .from('shopping_lists')
        .insert({ profile_id: session.user.id, items: newItems });
    }

    toast.success("Ingrédients ajoutés à la liste !");
  };

  const handleFeedback = async (liked: boolean) => {
    if (!recipe || !session?.user?.id) return;

    await supabase
      .from('recipe_ratings')
      .upsert({
        recipe_id: recipe.id,
        profile_id: session.user.id,
        rating: liked ? 5 : 1,
      });

    toast.success(liked ? "Super ! On en tiendra compte 👍" : "Noté ! On proposera autre chose 👎");
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Recette non trouvée</p>
      </div>
    );
  }

  const difficultyLabels: Record<string, string> = {
    easy: 'Facile',
    medium: 'Moyen',
    hard: 'Difficile',
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Retour
      </Button>

      <Card className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">{recipe.name}</h1>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {recipe.preparation_time} min
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {recipe.servings} pers.
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <ChefHat className="w-3 h-3" />
              {difficultyLabels[recipe.difficulty] || recipe.difficulty}
            </Badge>
          </div>
        </div>

        {/* Ingredients */}
        <div>
          <h2 className="text-lg font-bold mb-3">Ingrédients</h2>
          <ul className="space-y-2">
            {(Array.isArray(recipe.ingredients) ? recipe.ingredients : []).map((ing: any, idx: number) => (
              <li key={idx} className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-primary" />
                {ing.quantity} {ing.unit} {ing.item}
              </li>
            ))}
          </ul>
        </div>

        {/* Instructions */}
        <div>
          <h2 className="text-lg font-bold mb-3">Préparation</h2>
          <div className="space-y-3">
            {recipe.instructions.split('\n').map((step: string, idx: number) => (
              <div key={idx} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-sm font-bold flex items-center justify-center">
                  {idx + 1}
                </span>
                <p className="text-sm">{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Nutrition */}
        {recipe.nutritional_info && (
          <div>
            <h2 className="text-lg font-bold mb-3">Valeurs nutritionnelles</h2>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2 bg-muted rounded">
                <p className="text-lg font-bold">{recipe.nutritional_info.calories || 0}</p>
                <p className="text-xs text-muted-foreground">kcal</p>
              </div>
              <div className="p-2 bg-muted rounded">
                <p className="text-lg font-bold">{recipe.nutritional_info.protein || 0}g</p>
                <p className="text-xs text-muted-foreground">Protéines</p>
              </div>
              <div className="p-2 bg-muted rounded">
                <p className="text-lg font-bold">{recipe.nutritional_info.carbs || 0}g</p>
                <p className="text-xs text-muted-foreground">Glucides</p>
              </div>
              <div className="p-2 bg-muted rounded">
                <p className="text-lg font-bold">{recipe.nutritional_info.fat || 0}g</p>
                <p className="text-xs text-muted-foreground">Lipides</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-4 border-t">
          <Button onClick={handleAddToShoppingList} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter à la liste de courses
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => handleFeedback(true)}
            >
              <ThumbsUp className="w-4 h-4 mr-2" />
              Mon enfant a aimé
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => handleFeedback(false)}
            >
              <ThumbsDown className="w-4 h-4 mr-2" />
              N'a pas aimé
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
