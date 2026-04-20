import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Recipe, MealType, Difficulty } from '../../types';
import { toast } from 'sonner';
import { validateMealType, validateDifficulty } from '../utils/validationUtils';

export const useRecipes = (userId: string) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      console.log('Fetching recipes for user:', userId);
      
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('profile_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching recipes:', error);
        throw error;
      }

      console.log('Raw recipes data:', data);

      if (!data || data.length === 0) {
        console.log('No recipes found for user');
        setRecipes([]);
        return;
      }

      const parsedRecipes = (data as any[]).map((recipe: any) => ({
        ...recipe,
        ingredients: typeof recipe.ingredients === 'string' 
          ? JSON.parse(recipe.ingredients)
          : recipe.ingredients,
        nutritional_info: typeof recipe.nutritional_info === 'string'
          ? JSON.parse(recipe.nutritional_info)
          : recipe.nutritional_info,
        instructions: typeof recipe.instructions === 'string'
          ? recipe.instructions.split('\n')
          : Array.isArray(recipe.instructions)
            ? recipe.instructions
            : [recipe.instructions],
        meal_type: validateMealType(recipe.meal_type),
        difficulty: validateDifficulty(recipe.difficulty),
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
      })) as Recipe[];

      console.log('Parsed recipes:', parsedRecipes);
      setRecipes(parsedRecipes);
    } catch (error) {
      console.error('Error fetching recipes:', error);
      toast.error("Impossible de charger les recettes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchRecipes();
    }
  }, [userId]);

  return { recipes, loading, fetchRecipes };
};