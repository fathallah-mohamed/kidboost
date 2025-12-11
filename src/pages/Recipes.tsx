import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "@supabase/auth-helpers-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, Plus, ChefHat, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RecipeFilters, FilterType } from "@/components/recipes/RecipeFilters";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { AddRecipeDialog } from "@/components/recipes/AddRecipeDialog";

interface Recipe {
  id: string;
  name: string;
  meal_type: string;
  preparation_time: number;
  difficulty: string;
  ingredients?: any[];
}

export default function Recipes() {
  const navigate = useNavigate();
  const session = useSession();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLunchbox, setShowLunchbox] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Check if any child has special diet or school trips
  useEffect(() => {
    const checkLunchboxEligibility = async () => {
      if (!session?.user?.id) return;

      const { data: children } = await supabase
        .from("children_profiles")
        .select("regime_special, sortie_scolaire_dates")
        .eq("profile_id", session.user.id);

      if (children) {
        const hasSpecialChild = children.some(child => {
          const hasSpecialDiet = child.regime_special === true;
          const hasSchoolTrips = Array.isArray(child.sortie_scolaire_dates) && 
            child.sortie_scolaire_dates.length > 0;
          return hasSpecialDiet || hasSchoolTrips;
        });
        setShowLunchbox(hasSpecialChild);
      }
    };

    checkLunchboxEligibility();
  }, [session?.user?.id]);

  const fetchRecipes = async () => {
    if (!session?.user?.id) return;
    setLoading(true);

    try {
      let query = supabase
        .from("recipes")
        .select("id, name, meal_type, preparation_time, difficulty, ingredients")
        .eq("profile_id", session.user.id);

      // Apply meal type filter
      if (filter !== "all" && filter !== "favorites") {
        if (filter === "lunchbox") {
          query = query.or("meal_type.eq.lunchbox,meal_type.eq.lunchbox_special,meal_type.eq.lunchbox_trip");
        } else {
          query = query.eq("meal_type", filter);
        }
      }

      const { data: recipesData, error: recipesError } = await query.order("created_at", { ascending: false });
      
      if (recipesError) throw recipesError;
      
      // Parse ingredients if stringified
      const parsedRecipes = (recipesData || []).map(r => ({
        ...r,
        ingredients: typeof r.ingredients === "string" ? JSON.parse(r.ingredients) : r.ingredients
      }));
      
      setRecipes(parsedRecipes);
    } catch (error) {
      console.error("Error fetching recipes:", error);
      toast.error("Erreur lors du chargement des recettes");
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    if (!session?.user?.id) return;

    const { data: favoritesData } = await supabase
      .from("recipe_favorites")
      .select("recipe_id")
      .eq("profile_id", session.user.id);

    if (favoritesData) {
      setFavoriteIds(favoritesData.map(f => f.recipe_id).filter(Boolean) as string[]);
    }
  };

  useEffect(() => {
    fetchRecipes();
    fetchFavorites();
  }, [session?.user?.id, filter]);

  const toggleFavorite = async (recipeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session?.user?.id) return;

    const isFavorite = favoriteIds.includes(recipeId);

    try {
      if (isFavorite) {
        await supabase
          .from("recipe_favorites")
          .delete()
          .eq("recipe_id", recipeId)
          .eq("profile_id", session.user.id);

        setFavoriteIds(prev => prev.filter(id => id !== recipeId));
        toast.success("Retiré des favoris");
      } else {
        await supabase
          .from("recipe_favorites")
          .insert({ recipe_id: recipeId, profile_id: session.user.id });

        setFavoriteIds(prev => [...prev, recipeId]);
        toast.success("Ajouté aux favoris");
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error("Une erreur est survenue");
    }
  };

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(search.toLowerCase());
    const matchesFavorites = filter === "favorites" ? favoriteIds.includes(recipe.id) : true;
    return matchesSearch && matchesFavorites;
  });

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Toutes les recettes</h1>
            <p className="text-xs text-muted-foreground">
              Gérez votre bibliothèque de recettes
            </p>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une recette..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters */}
        <RecipeFilters 
          filter={filter} 
          setFilter={setFilter} 
          showLunchbox={showLunchbox} 
        />

        {/* Recipe List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredRecipes.length === 0 ? (
          <Card className="p-8 text-center">
            <ChefHat className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              {filter === "favorites" 
                ? "Aucun favori pour le moment" 
                : search 
                  ? "Aucune recette trouvée" 
                  : "Aucune recette enregistrée"}
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Créer une recette
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                isFavorite={favoriteIds.includes(recipe.id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        )}

        {/* Add Recipe Dialog */}
        {session?.user?.id && (
          <AddRecipeDialog
            open={showAddDialog}
            onOpenChange={setShowAddDialog}
            userId={session.user.id}
            showLunchbox={showLunchbox}
            onSuccess={fetchRecipes}
          />
        )}
      </div>
    </div>
  );
}
