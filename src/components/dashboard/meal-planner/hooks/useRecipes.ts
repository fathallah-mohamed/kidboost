import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Recipe, MealType, Difficulty } from '../../types';
import { useToast } from '@/components/ui/use-toast';

export const useRecipes = (userId: string) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('profile_id', userId);

      if (error) throw error;

      setRecipes((data || []).map((recipe: any) => ({
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
        meal_type: recipe.meal_type as MealType,
        difficulty: recipe.difficulty as Difficulty,
        is_generated: recipe.is_generated || false,
        image_url: recipe.image_url || 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9',
        health_benefits: recipe.health_benefits ? 
          (typeof recipe.health_benefits === 'string' 
            ? JSON.parse(recipe.health_benefits) 
            : recipe.health_benefits)
          : undefined,
        cooking_steps: recipe.cooking_steps ? 
          (typeof recipe.cooking_steps === 'string'
            ? JSON.parse(recipe.cooking_steps)
            : recipe.cooking_steps)
          : []
      })));
    } catch (error) {
      console.error('Error fetching recipes:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les recettes.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, [userId]);

  return { recipes, loading };
};