import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coffee, Utensils, Cookie, Moon, Clock, Heart, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface RecipeCardProps {
  recipe: {
    id: string;
    name: string;
    meal_type: string;
    preparation_time: number;
    difficulty: string;
    ingredients?: any[];
  };
  isFavorite: boolean;
  onToggleFavorite: (recipeId: string, e: React.MouseEvent) => void;
}

const MEAL_ICONS: Record<string, typeof Coffee> = {
  breakfast: Coffee,
  lunch: Utensils,
  snack: Cookie,
  dinner: Moon,
  lunchbox: Package,
  lunchbox_special: Package,
  lunchbox_trip: Package,
};

const MEAL_LABELS: Record<string, string> = {
  breakfast: "Petit-déjeuner",
  lunch: "Déjeuner",
  snack: "Goûter",
  dinner: "Dîner",
  lunchbox: "Lunchbox",
  lunchbox_special: "Lunchbox régime",
  lunchbox_trip: "Lunchbox sortie",
};

export const RecipeCard = ({ recipe, isFavorite, onToggleFavorite }: RecipeCardProps) => {
  const navigate = useNavigate();
  const Icon = MEAL_ICONS[recipe.meal_type] || Utensils;
  const mealLabel = MEAL_LABELS[recipe.meal_type] || recipe.meal_type;

  // Extract first 2 ingredients for preview
  const ingredientPreview = Array.isArray(recipe.ingredients) 
    ? recipe.ingredients.slice(0, 2).map((ing: any) => {
        if (typeof ing === "string") return ing;
        return ing.name || ing.item || ing.ingredient || "";
      }).filter(Boolean).join(", ")
    : "";

  return (
    <Card
      className="p-4 cursor-pointer hover:shadow-md transition-all group"
      onClick={() => navigate(`/recipe/${recipe.id}`)}
    >
      <div className="flex items-start gap-3">
        <div className="p-2.5 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{recipe.name}</h3>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
            <span className="px-2 py-0.5 bg-muted rounded-full">{mealLabel}</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {recipe.preparation_time} min
            </span>
          </div>
          {ingredientPreview && (
            <p className="text-xs text-muted-foreground mt-2 truncate">
              {ingredientPreview}...
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => onToggleFavorite(recipe.id, e)}
          className="shrink-0"
        >
          <Heart className={`w-5 h-5 transition-colors ${isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground hover:text-red-400"}`} />
        </Button>
      </div>
    </Card>
  );
};
