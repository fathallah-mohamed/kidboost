import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Child {
  id: string;
  name: string;
  birth_date: string;
  allergies: string[] | null;
  meal_objectives: string[] | null;
  preferences: string[] | null;
  dislikes: string[] | null;
  available_time: number | null;
}

interface MealData {
  name: string | null;
  prepTime?: number;
  recipeId?: string;
}

interface DashboardData {
  todayMeals: {
    snack: MealData;
    dinner: MealData;
    lunchbox: MealData;
  };
  plannedDays: string[];
  stats: {
    recipesReady: number;
    totalRecipes: number;
    daysPlanned: number;
    totalDays: number;
    shoppingListReady: boolean;
  };
  nutrition: {
    vegetables: number;
    proteins: number;
    starches: number;
    dairy: number;
  };
}

export const useDashboardData = (userId: string) => {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async (child: Child): Promise<DashboardData> => {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    
    // Get week boundaries
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() + mondayOffset);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const weekStartStr = format(weekStart, 'yyyy-MM-dd');
    const weekEndStr = format(weekEnd, 'yyyy-MM-dd');

    try {
      // 1. Fetch week's meal plans
      const { data: mealPlans } = await supabase
        .from('meal_plans')
        .select(`
          date,
          meal_time,
          recipe:recipe_id (
            id,
            name,
            preparation_time,
            nutritional_info
          )
        `)
        .eq('profile_id', userId)
        .eq('child_id', child.id)
        .gte('date', weekStartStr)
        .lte('date', weekEndStr);

      // 2. Get today's meals
      const todayMeals = {
        snack: { name: null as string | null, prepTime: undefined as number | undefined, recipeId: undefined as string | undefined },
        dinner: { name: null as string | null, prepTime: undefined as number | undefined, recipeId: undefined as string | undefined },
        lunchbox: { name: null as string | null, prepTime: undefined as number | undefined, recipeId: undefined as string | undefined },
      };

      if (mealPlans) {
        mealPlans
          .filter((p: any) => p.date === todayStr && p.recipe)
          .forEach((plan: any) => {
            const mealType = plan.meal_time as keyof typeof todayMeals;
            if (mealType in todayMeals) {
              todayMeals[mealType] = {
                name: plan.recipe.name,
                prepTime: plan.recipe.preparation_time,
                recipeId: plan.recipe.id,
              };
            }
          });
      }

      // 3. Calculate planned days
      const plannedDays = mealPlans 
        ? [...new Set(mealPlans.map((p: any) => p.date))]
        : [];

      // 4. Count total recipes for user
      const { count: recipeCount } = await supabase
        .from('recipes')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', userId);

      // 5. Check shopping list
      const { data: shoppingList } = await supabase
        .from('shopping_lists')
        .select('items')
        .eq('profile_id', userId)
        .maybeSingle();

      const hasShoppingList = shoppingList && 
        shoppingList.items && 
        Array.isArray(shoppingList.items) && 
        shoppingList.items.length > 0;

      // 6. Calculate nutrition from weekly meals
      let nutrition = { vegetables: 0, proteins: 0, starches: 0, dairy: 0 };
      
      if (mealPlans && mealPlans.length > 0) {
        let totalCalories = 0;
        let totalProtein = 0;
        let totalCarbs = 0;
        let totalFat = 0;
        let totalFiber = 0;

        mealPlans.forEach((plan: any) => {
          if (plan.recipe?.nutritional_info) {
            const info = plan.recipe.nutritional_info;
            totalCalories += Number(info.calories) || 0;
            totalProtein += Number(info.protein) || 0;
            totalCarbs += Number(info.carbs) || 0;
            totalFat += Number(info.fat) || 0;
            totalFiber += Number(info.fiber) || 0;
          }
        });

        // Estimate categories from macros
        const total = totalProtein + totalCarbs + totalFiber + (totalFat * 0.5);
        if (total > 0) {
          nutrition = {
            vegetables: Math.round((totalFiber * 3 / total) * 100),
            proteins: Math.round((totalProtein / total) * 100),
            starches: Math.round((totalCarbs / total) * 100),
            dairy: Math.round(((totalFat * 0.5) / total) * 100),
          };
        }
      }

      // Default balanced if no data
      if (nutrition.vegetables === 0 && nutrition.proteins === 0) {
        nutrition = { vegetables: 25, proteins: 25, starches: 30, dairy: 20 };
      }

      return {
        todayMeals,
        plannedDays,
        stats: {
          recipesReady: Math.min(recipeCount || 0, 7),
          totalRecipes: 7,
          daysPlanned: plannedDays.length,
          totalDays: 7,
          shoppingListReady: hasShoppingList,
        },
        nutrition,
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      return {
        todayMeals: {
          snack: { name: null },
          dinner: { name: null },
          lunchbox: { name: null },
        },
        plannedDays: [],
        stats: {
          recipesReady: 0,
          totalRecipes: 7,
          daysPlanned: 0,
          totalDays: 7,
          shoppingListReady: false,
        },
        nutrition: { vegetables: 25, proteins: 25, starches: 30, dairy: 20 },
      };
    }
  }, [userId]);

  const generateMeal = useCallback(async (
    child: Child, 
    mealType: 'snack' | 'dinner' | 'lunchbox'
  ): Promise<MealData | null> => {
    setGenerating(mealType);
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    try {
      const { data, error } = await supabase.functions.invoke('generate-daily-meal', {
        body: {
          childId: child.id,
          profileId: userId,
          mealType,
          date: todayStr,
        },
      });

      if (error) throw error;

      if (data?.success && data?.recipe) {
        toast.success(`${data.recipe.name} généré !`);
        return {
          name: data.recipe.name,
          prepTime: data.recipe.preparation_time,
          recipeId: data.recipe.id,
        };
      } else {
        throw new Error(data?.error || 'Erreur de génération');
      }
    } catch (error: any) {
      console.error('Error generating meal:', error);
      toast.error(error.message || 'Erreur lors de la génération');
      return null;
    } finally {
      setGenerating(null);
    }
  }, [userId]);

  return {
    loading,
    generating,
    fetchDashboardData,
    generateMeal,
  };
};
