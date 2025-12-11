import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "@supabase/auth-helpers-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, Plus, Coffee, Utensils, Cookie, Moon, Clock, ChefHat, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { MealSlot, MEAL_LABELS } from "@/lib/meals";

type FilterType = "all" | MealSlot | "favorites";

interface Recipe {
  id: string;
  name: string;
  meal_type: string;
  preparation_time: number;
  difficulty: string;
}

const MEAL_ICONS: Record<MealSlot, typeof Coffee> = {
  breakfast: Coffee,
  lunch: Utensils,
  snack: Cookie,
  dinner: Moon,
};

export default function Recipes() {
  const navigate = useNavigate();
  const session = useSession();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user?.id) return;
      
      // Fetch recipes
      let query = supabase
        .from("recipes")
        .select("id, name, meal_type, preparation_time, difficulty")
        .eq("profile_id", session.user.id);

      if (filter !== "all" && filter !== "favorites") {
        // Handle legacy lunchbox type
        if (filter === "lunch") {
          query = query.or("meal_type.eq.lunch,meal_type.eq.lunchbox");
        } else {
          query = query.eq("meal_type", filter);
        }
      }

      const { data: recipesData, error: recipesError } = await query.order("created_at", { ascending: false });
      
      // Fetch favorites
      const { data: favoritesData, error: favoritesError } = await supabase
        .from("recipe_favorites")
        .select("recipe_id")
        .eq("profile_id", session.user.id);

      if (!recipesError && recipesData) {
        setRecipes(recipesData);
      }
      if (!favoritesError && favoritesData) {
        setFavoriteIds(favoritesData.map(f => f.recipe_id).filter(Boolean) as string[]);
      }
      setLoading(false);
    };

    fetchData();
  }, [session?.user?.id, filter]);

  const toggleFavorite = async (recipeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session?.user?.id) return;

    const isFavorite = favoriteIds.includes(recipeId);

    if (isFavorite) {
      const { error } = await supabase
        .from("recipe_favorites")
        .delete()
        .eq("recipe_id", recipeId)
        .eq("profile_id", session.user.id);

      if (!error) {
        setFavoriteIds(prev => prev.filter(id => id !== recipeId));
        toast({ title: "Retiré des favoris" });
      }
    } else {
      const { error } = await supabase
        .from("recipe_favorites")
        .insert({ recipe_id: recipeId, profile_id: session.user.id });

      if (!error) {
        setFavoriteIds(prev => [...prev, recipeId]);
        toast({ title: "Ajouté aux favoris" });
      }
    }
  };

  // Filtres avec les 4 types de repas
  const filters: { type: FilterType; label: string; icon: typeof ChefHat }[] = [
    { type: "all", label: "Tous", icon: ChefHat },
    { type: "favorites", label: "Favoris", icon: Heart },
    { type: "breakfast", label: MEAL_LABELS.breakfast, icon: Coffee },
    { type: "lunch", label: MEAL_LABELS.lunch, icon: Utensils },
    { type: "snack", label: MEAL_LABELS.snack, icon: Cookie },
    { type: "dinner", label: MEAL_LABELS.dinner, icon: Moon },
  ];

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(search.toLowerCase());
    const matchesFavorites = filter === "favorites" ? favoriteIds.includes(recipe.id) : true;
    return matchesSearch && matchesFavorites;
  });

  const getMealTypeIcon = (type: string) => {
    // Handle legacy lunchbox type
    if (type === "lunchbox") return Utensils;
    return MEAL_ICONS[type as MealSlot] || Utensils;
  };

  const getMealTypeLabel = (type: string) => {
    // Handle legacy lunchbox type
    if (type === "lunchbox") return "Déjeuner (Lunchbox)";
    return MEAL_LABELS[type as MealSlot] || type;
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Toutes les recettes</h1>
            <p className="text-xs text-muted-foreground">
              Petit-déjeuner, déjeuner, goûter et dîner
            </p>
          </div>
          <Button onClick={() => navigate("/generate-meal")}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une recette..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {filters.map((f) => {
            const Icon = f.icon;
            return (
              <Button
                key={f.type}
                variant={filter === f.type ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(f.type)}
                className="flex-shrink-0"
              >
                <Icon className={`w-4 h-4 mr-1 ${f.type === "favorites" && filter === "favorites" ? "fill-current" : ""}`} />
                {f.label}
              </Button>
            );
          })}
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Chargement...
          </div>
        ) : filteredRecipes.length === 0 ? (
          <Card className="p-8 text-center">
            <ChefHat className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              {filter === "favorites" ? "Aucun favori" : search ? "Aucune recette trouvée" : "Aucune recette enregistrée"}
            </p>
            <Button onClick={() => navigate("/generate-meal")}>
              <Plus className="w-4 h-4 mr-2" />
              Créer une recette
            </Button>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredRecipes.map((recipe) => {
              const Icon = getMealTypeIcon(recipe.meal_type);
              const isFavorite = favoriteIds.includes(recipe.id);
              return (
                <Card
                  key={recipe.id}
                  className="p-3 cursor-pointer hover:shadow-md transition-all"
                  onClick={() => navigate(`/recipe/${recipe.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{recipe.name}</h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{getMealTypeLabel(recipe.meal_type)}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {recipe.preparation_time} min
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => toggleFavorite(recipe.id, e)}
                      className="shrink-0"
                    >
                      <Heart className={`w-5 h-5 ${isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
