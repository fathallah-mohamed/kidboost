import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "@supabase/auth-helpers-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, Plus, Cookie, Utensils, Sandwich, Clock, ChefHat } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type FilterType = "all" | "snack" | "dinner" | "lunchbox";

interface Recipe {
  id: string;
  name: string;
  meal_type: string;
  preparation_time: number;
  difficulty: string;
}

export default function Recipes() {
  const navigate = useNavigate();
  const session = useSession();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecipes = async () => {
      if (!session?.user?.id) return;
      
      let query = supabase
        .from("recipes")
        .select("id, name, meal_type, preparation_time, difficulty")
        .eq("profile_id", session.user.id);

      if (filter !== "all") {
        query = query.eq("meal_type", filter);
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      
      if (!error && data) {
        setRecipes(data);
      }
      setLoading(false);
    };

    fetchRecipes();
  }, [session?.user?.id, filter]);

  const filters = [
    { type: "all" as FilterType, label: "Tous", icon: ChefHat },
    { type: "snack" as FilterType, label: "Goûter", icon: Cookie },
    { type: "dinner" as FilterType, label: "Repas", icon: Utensils },
    { type: "lunchbox" as FilterType, label: "Lunchbox", icon: Sandwich },
  ];

  const filteredRecipes = recipes.filter(recipe =>
    recipe.name.toLowerCase().includes(search.toLowerCase())
  );

  const getMealTypeIcon = (type: string) => {
    switch (type) {
      case "snack": return Cookie;
      case "lunchbox": return Sandwich;
      default: return Utensils;
    }
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
          </div>
          <Button onClick={() => navigate("/dashboard/generate")}>
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
                <Icon className="w-4 h-4 mr-1" />
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
              {search ? "Aucune recette trouvée" : "Aucune recette enregistrée"}
            </p>
            <Button onClick={() => navigate("/dashboard/generate")}>
              <Plus className="w-4 h-4 mr-2" />
              Créer une recette
            </Button>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredRecipes.map((recipe) => {
              const Icon = getMealTypeIcon(recipe.meal_type);
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
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {recipe.preparation_time} min
                        </span>
                        <span className="capitalize">{recipe.difficulty}</span>
                      </div>
                    </div>
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
