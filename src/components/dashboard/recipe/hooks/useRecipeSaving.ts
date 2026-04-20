import { useState } from "react";
import { Recipe } from "../../types";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@supabase/auth-helpers-react";
import { toast } from "sonner";

export const useRecipeSaving = () => {
  const [saving, setSaving] = useState(false);
  const session = useSession();

  const saveRecipe = async (recipe: Recipe) => {
    if (!session?.user?.id) {
      toast.error("Vous devez être connecté pour sauvegarder une recette");
      return;
    }

    try {
      setSaving(true);
      
      // Ensure ingredients is a proper JSON object if it's a string
      const ingredients = typeof recipe.ingredients === 'string' 
        ? JSON.parse(recipe.ingredients) 
        : recipe.ingredients;

      // Ensure nutritional_info is a proper JSON object if it's a string
      const nutritionalInfo = typeof recipe.nutritional_info === 'string'
        ? JSON.parse(recipe.nutritional_info)
        : recipe.nutritional_info;

      // Ensure health_benefits is a proper JSON array if it's a string
      const healthBenefits = typeof recipe.health_benefits === 'string'
        ? JSON.parse(recipe.health_benefits)
        : recipe.health_benefits;

      // Create a new object without the id field
      const { id, ...recipeWithoutId } = recipe;

      const recipeToSave = {
        ...recipeWithoutId,
        profile_id: session.user.id,
        ingredients: ingredients,
        instructions: Array.isArray(recipe.instructions) 
          ? recipe.instructions.join('\n') 
          : recipe.instructions,
        nutritional_info: nutritionalInfo,
        health_benefits: healthBenefits,
        cooking_steps: recipe.cooking_steps || []
      };

      console.log('Saving recipe with data:', recipeToSave);

      const { error } = await supabase
        .from('recipes')
        .insert([recipeToSave]);

      if (error) throw error;

      toast.success("Recette sauvegardée avec succès");
    } catch (error) {
      console.error('Error saving recipe:', error);
      toast.error("Une erreur est survenue lors de la sauvegarde de la recette");
      throw error;
    } finally {
      setSaving(false);
    }
  };

  return {
    saving,
    saveRecipe,
  };
};