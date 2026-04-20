import { useCallback } from "react";
import { Recipe } from "@/components/dashboard/types";
import { supabase } from "@/integrations/supabase/client";

/**
 * Génère en parallèle des images réalistes pour chaque recette.
 * Met à jour progressivement le state via le callback `onImageReady`.
 * Persiste l'URL dans la table `recipes` quand l'image arrive.
 */
export const useRecipeImageGeneration = () => {
  const generateImageForRecipe = useCallback(
    async (recipe: Recipe): Promise<string | null> => {
      try {
        const { data, error } = await supabase.functions.invoke<{ imageUrl: string }>(
          "generate-recipe-image",
          {
            body: {
              recipeId: recipe.id,
              recipeName: recipe.name,
              ingredients: recipe.ingredients,
            },
          }
        );

        if (error || !data?.imageUrl) {
          console.warn("Image generation failed for", recipe.name, error);
          return null;
        }

        // Persister l'URL uniquement si l'ID est un vrai UUID (recette déjà en DB)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (recipe.id && uuidRegex.test(recipe.id)) {
          await supabase
            .from("recipes")
            .update({ image_url: data.imageUrl })
            .eq("id", recipe.id);
        }

        return data.imageUrl;
      } catch (err) {
        console.warn("Image generation error:", err);
        return null;
      }
    },
    []
  );

  /**
   * Lance la génération en parallèle pour toutes les recettes.
   * `onImageReady(recipeId, imageUrl)` est appelé dès qu'une image est prête.
   */
  const generateImagesForAll = useCallback(
    async (
      recipes: Recipe[],
      onImageReady: (recipeId: string, imageUrl: string) => void
    ) => {
      await Promise.all(
        recipes.map(async (recipe) => {
          const url = await generateImageForRecipe(recipe);
          if (url) onImageReady(recipe.id, url);
        })
      );
    },
    [generateImageForRecipe]
  );

  return { generateImageForRecipe, generateImagesForAll };
};
