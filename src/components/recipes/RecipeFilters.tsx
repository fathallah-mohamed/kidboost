import { Button } from "@/components/ui/button";
import { Coffee, Utensils, Cookie, Moon, ChefHat, Heart, Package } from "lucide-react";

export type FilterType = "all" | "breakfast" | "lunch" | "snack" | "dinner" | "lunchbox" | "favorites";

interface RecipeFiltersProps {
  filter: FilterType;
  setFilter: (filter: FilterType) => void;
  showLunchbox: boolean;
}

const filters: { type: FilterType; label: string; icon: typeof ChefHat }[] = [
  { type: "all", label: "Tous", icon: ChefHat },
  { type: "favorites", label: "Favoris", icon: Heart },
  { type: "breakfast", label: "Petit-déj", icon: Coffee },
  { type: "lunch", label: "Déjeuner", icon: Utensils },
  { type: "snack", label: "Goûter", icon: Cookie },
  { type: "dinner", label: "Dîner", icon: Moon },
  { type: "lunchbox", label: "Lunchbox", icon: Package },
];

export const RecipeFilters = ({ filter, setFilter, showLunchbox }: RecipeFiltersProps) => {
  const visibleFilters = filters.filter(f => {
    if (f.type === "lunchbox" && !showLunchbox) return false;
    return true;
  });

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {visibleFilters.map((f) => {
        const Icon = f.icon;
        return (
          <Button
            key={f.type}
            variant={filter === f.type ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f.type)}
            className="flex-shrink-0"
          >
            <Icon className={`w-4 h-4 mr-1.5 ${f.type === "favorites" && filter === "favorites" ? "fill-current" : ""}`} />
            {f.label}
          </Button>
        );
      })}
    </div>
  );
};
