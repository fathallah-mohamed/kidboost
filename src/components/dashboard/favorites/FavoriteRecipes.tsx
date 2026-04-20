import { useEffect, useState } from 'react';
import { Recipe, MealType, Difficulty } from '../types';
import { supabase } from '@/integrations/supabase/client';
import { RecipeCard } from '../recipe/RecipeCard';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useFavorites } from '../recipe/hooks/useFavorites';
import { BackToDashboard } from '../BackToDashboard';

interface FavoriteRecipesProps {
  onSectionChange: (section: string) => void;
}

export const FavoriteRecipes = ({ onSectionChange }: FavoriteRecipesProps) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { favoriteRecipes, toggleFavorite } = useFavorites();

  useEffect(() => {
    fetchFavoriteRecipes();
  }, [favoriteRecipes]);

  const fetchFavoriteRecipes = async () => {
    try {
      if (!favoriteRecipes.length) {
        setRecipes([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .in('id', favoriteRecipes);

      if (error) throw error;

      const parsedRecipes: Recipe[] = data.map((recipe: any) => ({
        ...recipe,
        ingredients: typeof recipe.ingredients === 'string' 
          ? JSON.parse(recipe.ingredients) 
          : recipe.ingredients,
        nutritional_info: typeof recipe.nutritional_info === 'string'
          ? JSON.parse(recipe.nutritional_info)
          : recipe.nutritional_info,
        instructions: Array.isArray(recipe.instructions)
          ? recipe.instructions
          : [recipe.instructions].filter(Boolean),
        health_benefits: recipe.health_benefits
          ? (typeof recipe.health_benefits === 'string'
            ? JSON.parse(recipe.health_benefits)
            : recipe.health_benefits)
          : undefined,
        cooking_steps: recipe.cooking_steps 
          ? (typeof recipe.cooking_steps === 'string'
            ? JSON.parse(recipe.cooking_steps)
            : recipe.cooking_steps)
          : [],
        meal_type: recipe.meal_type as MealType,
        difficulty: recipe.difficulty as Difficulty,
        dietary_preferences: recipe.dietary_preferences || [],
        allergens: recipe.allergens || [],
        seasonal_months: recipe.seasonal_months || [],
        cost_estimate: recipe.cost_estimate || 0,
        min_age: recipe.min_age || 0,
        max_age: recipe.max_age || 18,
        is_generated: recipe.is_generated || false,
        image_url: recipe.image_url || 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9',
      }));

      setRecipes(parsedRecipes);
    } catch (error) {
      console.error('Error fetching favorite recipes:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger vos recettes favorites.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (recipe: Recipe) => {
    await toggleFavorite(recipe);
    toast({
      title: "Favori supprimé",
      description: "La recette a été retirée de vos favoris.",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackToDashboard />
      
      <h2 className="text-2xl font-bold">Mes recettes favorites</h2>
      {recipes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Vous n'avez pas encore de recettes favorites.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onAdd={() => {}}
            />
          ))}
        </div>
      )}
    </div>
  );
};