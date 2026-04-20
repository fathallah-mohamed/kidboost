import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Recipe, ChildProfile, MealType, Difficulty, HealthBenefit } from '../../types';

export const usePlannedRecipesFetching = (selectedChildren: ChildProfile[]) => {
  const [plannedRecipes, setPlannedRecipes] = useState<{ [key: string]: Recipe | null }>({});

  const fetchPlannedRecipes = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const query = supabase
        .from('meal_plans')
        .select('*, recipes(*)')
        .eq('profile_id', session.user.id);

      if (selectedChildren.length > 0) {
        query.in('child_id', selectedChildren.map(child => child.id));
      }

      const { data, error } = await query;

      if (error) throw error;

      const plannedRecipeMap: { [key: string]: Recipe | null } = {};
      data.forEach((plan: any) => {
        if (plan.recipes) {
          const recipe = plan.recipes;
          plannedRecipeMap[plan.date] = {
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
            health_benefits: recipe.health_benefits ? 
              (typeof recipe.health_benefits === 'string' 
                ? JSON.parse(recipe.health_benefits) 
                : recipe.health_benefits) as HealthBenefit[]
              : undefined,
            cooking_steps: recipe.cooking_steps ? 
              (typeof recipe.cooking_steps === 'string'
                ? JSON.parse(recipe.cooking_steps)
                : recipe.cooking_steps) as { 
                  step: number; 
                  description: string; 
                  duration?: number; 
                  tips?: string; 
                }[]
              : []
          };
        }
      });

      setPlannedRecipes(plannedRecipeMap);
    } catch (error) {
      console.error('Error fetching planned recipes:', error);
    }
  };

  useEffect(() => {
    fetchPlannedRecipes();
  }, [selectedChildren]);

  return { plannedRecipes, fetchPlannedRecipes };
};