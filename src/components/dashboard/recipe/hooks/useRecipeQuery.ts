import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Recipe, MealType, RecipeFilters } from "../../types";

const removeDuplicateRecipes = (recipes: Recipe[]) => {
  const seen = new Set();
  return recipes.filter(recipe => {
    const normalizedName = recipe.name.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");
    
    if (seen.has(normalizedName)) {
      return false;
    }
    seen.add(normalizedName);
    return true;
  });
};

export const useRecipeQuery = (userId: string | undefined, filters: RecipeFilters) => {
  return useQuery({
    queryKey: ['generated-recipes', userId, filters],
    queryFn: async () => {
      if (!userId) return [];
      
      console.log('Fetching recipes for user:', userId);
      console.log('Using filters:', filters);
      
      let query = supabase
        .from('recipes')
        .select('*')
        .eq('profile_id', userId)
        .eq('is_generated', true);

      if (filters?.mealType && filters.mealType !== 'all') {
        query = query.eq('meal_type', filters.mealType);
      }
      
      if (filters?.maxPrepTime) {
        query = query.lte('preparation_time', filters.maxPrepTime);
      }

      if (filters?.difficulty && filters?.difficulty !== 'all') {
        query = query.eq('difficulty', filters.difficulty);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching recipes:', error);
        throw error;
      }

      console.log('Raw recipes data:', data);

      const parsedRecipes = (data as any[]).map((recipe: any) => ({
        ...recipe,
        meal_type: recipe.meal_type as MealType,
        ingredients: typeof recipe.ingredients === 'string' 
          ? JSON.parse(recipe.ingredients)
          : recipe.ingredients,
        instructions: typeof recipe.instructions === 'string'
          ? recipe.instructions.split('\n')
          : Array.isArray(recipe.instructions)
            ? recipe.instructions
            : [recipe.instructions],
        nutritional_info: typeof recipe.nutritional_info === 'string'
          ? JSON.parse(recipe.nutritional_info)
          : recipe.nutritional_info,
        health_benefits: typeof recipe.health_benefits === 'string'
          ? JSON.parse(recipe.health_benefits)
          : recipe.health_benefits || [],
        cooking_steps: typeof recipe.cooking_steps === 'string'
          ? JSON.parse(recipe.cooking_steps)
          : recipe.cooking_steps || []
      })) as Recipe[];

      console.log('Parsed recipes:', parsedRecipes);
      return removeDuplicateRecipes(parsedRecipes);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    gcTime: 1000 * 60 * 15, // Keep unused data for 15 minutes
    retry: false, // Disable retries to prevent unnecessary state updates
    refetchOnWindowFocus: false, // Disable automatic refetching on window focus
    refetchOnMount: false, // Disable automatic refetching on mount
  });
};