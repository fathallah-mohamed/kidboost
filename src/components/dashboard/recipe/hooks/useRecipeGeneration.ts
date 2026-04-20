
import { useState } from "react";
import { Recipe, RecipeFilters, ChildProfile } from "@/components/dashboard/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAIProvider } from "@/hooks/useAIProvider";

export const useRecipeGeneration = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { aiProvider } = useAIProvider();

  const generateRecipes = async (child: ChildProfile, filters: RecipeFilters) => {
    try {
      setLoading(true);
      setError(null);

      console.log("Generating recipes for child:", child);
      console.log("Using filters:", filters);

      // Vérifier la session avant d'appeler la fonction
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        toast.error("Erreur de session", {
          description: "Veuillez vous reconnecter",
          action: {
            label: "Reconnecter",
            onClick: () => window.location.href = "/login"
          }
        });
        throw sessionError;
      }

      if (!session) {
        toast.error("Session expirée", {
          description: "Veuillez vous reconnecter",
          action: {
            label: "Reconnecter",
            onClick: () => window.location.href = "/login"
          }
        });
        throw new Error("Session expirée");
      }

      // Générer un identifiant de demande unique pour éviter les recettes dupliquées
      const requestId = Date.now();

      const { data, error: generateError } = await supabase.functions.invoke<{ recipes: Recipe[] }>(
        'generate-recipe',
        {
          body: { 
            child: {
              ...child,
              id: child.id,
              name: child.name,
              birth_date: child.birth_date,
              allergies: child.allergies || [],
              preferences: child.preferences || []
            },
            filters: {
              ...filters,
              requestId
            },
            aiProvider
          }
        }
      );

      if (generateError) {
        // Vérifier si c'est une erreur de quota insuffisant
        if (generateError.message?.includes("quota OpenAI est insuffisant")) {
          toast.error("Quota OpenAI insuffisant", {
            description: "Veuillez vérifier votre clé API ou réessayer plus tard.",
          });
        }
        throw generateError;
      }

      if (!data) {
        throw new Error("Aucune donnée reçue de la fonction");
      }

      const { recipes } = data;
      console.log("Generated recipes:", recipes);

      if (!recipes || !Array.isArray(recipes) || recipes.length === 0) {
        throw new Error("Aucune recette n'a été générée");
      }

      // Vérifier que chaque recette a les propriétés requises
      recipes.forEach((recipe, index) => {
        if (!recipe.name || !recipe.ingredients || !recipe.instructions) {
          console.error(`Invalid recipe at index ${index}:`, recipe);
          throw new Error(`La recette ${index + 1} est invalide`);
        }
      });

      return recipes;

    } catch (err) {
      console.error("Error generating recipes:", err);
      const errorMessage = err instanceof Error ? err.message : "Une erreur est survenue";
      setError(errorMessage);
      
      // Si ce n'est pas déjà une erreur de quota insuffisant (pour éviter le double toast)
      if (!errorMessage.includes("quota OpenAI est insuffisant")) {
        toast.error("Erreur de génération", {
          description: errorMessage
        });
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    generateRecipes,
    loading,
    error
  };
};
