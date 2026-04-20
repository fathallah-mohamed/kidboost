
import { useState } from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import { BackToDashboard } from '../BackToDashboard';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Recipe, ChildProfile } from "../types";
import { StepNavigation } from '../navigation/StepNavigation';
import { useInView } from 'react-intersection-observer';
import { LoadingOverlay } from './LoadingOverlay';
import { GenerationSection } from './sections/GenerationSection';
import { ResultsSection } from './sections/ResultsSection';
import { useRecipeQuery } from './hooks/useRecipeQuery';
import { useRecipeGeneration } from './hooks/useRecipeGeneration';
import { useRecipeImageGeneration } from './hooks/useRecipeImageGeneration';
import { useRecipeSaving } from './hooks/useRecipeSaving';
import { Button } from '@/components/ui/button';
import { useRecipeFilters } from './hooks/useRecipeFilters';
import { Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const RecipeGeneratorPage = () => {
  const [loading, setLoading] = useState(false);
  const [selectedChildren, setSelectedChildren] = useState<ChildProfile[]>([]);
  const [displayCount, setDisplayCount] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [generatedRecipes, setGeneratedRecipes] = useState<Recipe[]>([]);
  const session = useSession();
  const navigate = useNavigate();
  const filters = useRecipeFilters();
  const { ref: loadMoreRef, inView } = useInView();
  const { generateRecipes } = useRecipeGeneration();
  const { generateImagesForAll } = useRecipeImageGeneration();
  const { saveRecipe } = useRecipeSaving();

  const { data: savedRecipes = [], refetch } = useRecipeQuery(
    session?.user?.id,
    filters.getFilters()
  );

  // Combine generated and saved recipes
  const allRecipes = [...generatedRecipes, ...savedRecipes];

  const handleGenerateRecipes = async () => {
    if (!selectedChildren.length) {
      toast.error("Veuillez sélectionner au moins un enfant");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const selectedChild = selectedChildren[0];
      
      if (!selectedChild.name || !selectedChild.birth_date) {
        throw new Error("Les informations de l'enfant sont incomplètes");
      }

      console.log("Generating recipes with filters:", filters.getFilters());
      // Ajouter un timestamp pour garantir de nouvelles recettes à chaque génération
      const currentFilters = {
        ...filters.getFilters(),
        timestamp: new Date().getTime()
      };
      
      const newRecipes = await generateRecipes(selectedChild, currentFilters);
      console.log("Generated recipes:", newRecipes);
      
      if (!newRecipes || newRecipes.length === 0) {
        throw new Error("Aucune recette n'a été générée");
      }

      // Marquer les recettes comme étant en attente d'image
      const recipesWithLoadingImage = newRecipes.map((r) => ({
        ...r,
        image_url: undefined as any,
      }));
      setGeneratedRecipes(recipesWithLoadingImage);
      toast.success("Recettes générées ! Les images arrivent...");

      // Lancer la génération d'images en arrière-plan (non bloquant)
      generateImagesForAll(newRecipes, (recipeId, imageUrl) => {
        setGeneratedRecipes((current) =>
          current.map((r) => (r.id === recipeId ? { ...r, image_url: imageUrl } : r))
        );
      }).catch((err) => console.warn("Background image generation failed:", err));

    } catch (error) {
      console.error('Error generating recipes:', error);
      const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue";
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    setDisplayCount(prev => Math.min(prev + 5, allRecipes.length));
  };

  const handleDeleteAllRecipes = async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('profile_id', session.user.id)
        .eq('is_generated', true);

      if (error) throw error;

      setGeneratedRecipes([]); // Clear generated recipes
      toast.success('Toutes les recettes générées ont été supprimées');
      refetch(); // Refresh the saved recipes list
    } catch (error) {
      console.error('Error deleting recipes:', error);
      toast.error('Une erreur est survenue lors de la suppression des recettes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {loading && <LoadingOverlay />}
      
      <BackToDashboard />
      
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Générateur de Recettes</h2>
            <p className="text-muted-foreground mt-2">
              Générez des recettes personnalisées adaptées aux besoins de vos enfants
            </p>
          </div>
          <div className="flex gap-4">
            {allRecipes.length > 0 && (
              <Button 
                variant="destructive"
                onClick={handleDeleteAllRecipes}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer toutes les recettes
              </Button>
            )}
            <Button 
              onClick={() => navigate('/dashboard/planner')}
              className="bg-primary hover:bg-primary/90"
            >
              Commencer à planifier
            </Button>
          </div>
        </div>

        <GenerationSection
          loading={loading}
          saving={false}
          selectedChildren={selectedChildren}
          setSelectedChildren={setSelectedChildren}
          onGenerate={handleGenerateRecipes}
          filters={filters}
        />

        <ResultsSection
          recipes={allRecipes.slice(0, displayCount)}
          displayCount={displayCount}
          error={error}
          onSaveRecipe={saveRecipe}
          onLoadMore={handleLoadMore}
        />

        {displayCount < allRecipes.length && (
          <div ref={loadMoreRef} className="h-10" />
        )}

        <StepNavigation
          previousStep={{
            label: "Profils enfants",
            route: "/dashboard/children"
          }}
          nextStep={{
            label: "Planifier les repas",
            route: "/dashboard/planner"
          }}
        />
      </div>
    </div>
  );
};
