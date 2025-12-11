import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { Search, Clock, ChefHat, Sparkles } from "lucide-react";
import { MealSlot, MEAL_LABELS } from "@/lib/meals";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Recipe {
  id: string;
  name: string;
  preparation_time: number;
  meal_type: string;
  difficulty: string;
}

interface AddRecipeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string | null;
  slot: MealSlot | null;
  userId: string;
  childId: string | null;
  onSelectRecipe: (recipe: Recipe) => void;
  onNavigateToGenerate: () => void;
}

export function AddRecipeDialog({
  open,
  onOpenChange,
  date,
  slot,
  userId,
  childId,
  onSelectRecipe,
  onNavigateToGenerate,
}: AddRecipeDialogProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (open && userId) {
      fetchRecipes();
    }
  }, [open, userId, slot]);

  const fetchRecipes = async () => {
    setLoading(true);
    
    let query = supabase
      .from("recipes")
      .select("id, name, preparation_time, meal_type, difficulty")
      .eq("profile_id", userId)
      .order("name");

    // Filtrer par type de repas si possible
    if (slot) {
      query = query.eq("meal_type", slot);
    }

    const { data, error } = await query.limit(50);

    if (!error && data) {
      setRecipes(data);
    }
    setLoading(false);
  };

  const filteredRecipes = recipes.filter((recipe) =>
    recipe.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formattedDate = date ? format(new Date(date), "EEEE d MMMM", { locale: fr }) : "";
  const slotLabel = slot ? MEAL_LABELS[slot] : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter une recette</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {slotLabel} • {formattedDate}
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Bouton génération IA */}
          <Button
            variant="outline"
            className="w-full justify-start gap-2 border-primary/50 hover:bg-primary/5"
            onClick={() => {
              onNavigateToGenerate();
              onOpenChange(false);
            }}
          >
            <Sparkles className="w-4 h-4 text-primary" />
            Générer une recette avec l'IA
          </Button>

          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une recette..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Liste des recettes */}
          <ScrollArea className="h-[300px]">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Chargement...</div>
            ) : filteredRecipes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? "Aucune recette trouvée" : "Aucune recette disponible"}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredRecipes.map((recipe) => (
                  <button
                    key={recipe.id}
                    onClick={() => {
                      onSelectRecipe(recipe);
                      onOpenChange(false);
                    }}
                    className="w-full p-3 rounded-lg border bg-card hover:bg-accent text-left transition-colors"
                  >
                    <p className="font-medium text-sm">{recipe.name}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {recipe.preparation_time} min
                      </span>
                      <span className="flex items-center gap-1">
                        <ChefHat className="w-3 h-3" />
                        {recipe.difficulty}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
