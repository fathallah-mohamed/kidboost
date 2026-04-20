import { Recipe } from "../../types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useRecipeSavingLogic = (userId?: string) => {
  const saveGeneratedRecipes = async (recipes: Recipe[]) => {
    if (!userId) {
      console.error('No user ID provided for saving recipes');
      return [];
    }

    const savedRecipes = await Promise.all(
      recipes.map(async (recipe) => {
        try {
          // Convert instructions array to string
          const recipeToSave = {
            ...recipe,
            profile_id: userId,
            is_generated: true,
            instructions: Array.isArray(recipe.instructions) 
              ? recipe.instructions.join('\n') 
              : recipe.instructions,
            // Ensure these are properly typed for Supabase
            ingredients: JSON.stringify(recipe.ingredients),
            nutritional_info: JSON.stringify(recipe.nutritional_info),
            health_benefits: recipe.health_benefits 
              ? JSON.stringify(recipe.health_benefits)
              : null,
            cooking_steps: recipe.cooking_steps 
              ? JSON.stringify(recipe.cooking_steps)
              : null
          };
          
          const { error } = await supabase
            .from('recipes')
            .insert([recipeToSave as any]);

          if (error) throw error;
          return recipe;
        } catch (error) {
          console.error('Error saving generated recipe:', error);
          toast.error(`Erreur lors de la sauvegarde de la recette ${recipe.name}`);
          return null;
        }
      })
    );

    return savedRecipes.filter((recipe): recipe is Recipe => recipe !== null);
  };

  return { saveGeneratedRecipes };
};