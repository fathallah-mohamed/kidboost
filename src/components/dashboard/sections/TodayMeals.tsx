import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Eye, RefreshCw, Plus, Cookie, Utensils, Sandwich } from "lucide-react";

interface MealCardProps {
  type: "snack" | "dinner" | "lunchbox";
  recipeName: string | null;
  prepTime?: number;
  onView: () => void;
  onReplace: () => void;
  onAddToList: () => void;
}

const mealConfig = {
  snack: {
    icon: Cookie,
    label: "Goûter",
    gradient: "from-pastel-yellow/30 to-pastel-yellow/10",
    iconBg: "bg-pastel-yellow/50",
  },
  dinner: {
    icon: Utensils,
    label: "Repas du soir",
    gradient: "from-primary/20 to-primary/5",
    iconBg: "bg-primary/30",
  },
  lunchbox: {
    icon: Sandwich,
    label: "Lunchbox",
    gradient: "from-pastel-green/30 to-pastel-green/10",
    iconBg: "bg-pastel-green/50",
  },
};

const MealCard = ({ type, recipeName, prepTime, onView, onReplace, onAddToList }: MealCardProps) => {
  const config = mealConfig[type];
  const Icon = config.icon;

  return (
    <Card className={`p-3 bg-gradient-to-br ${config.gradient} hover:shadow-md transition-all`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 ${config.iconBg} rounded-lg`}>
          <Icon className="w-4 h-4 text-foreground" />
        </div>
        <span className="text-xs font-semibold text-muted-foreground">{config.label}</span>
      </div>
      
      {recipeName ? (
        <div className="space-y-2">
          <div>
            <h4 className="font-bold text-sm truncate">{recipeName}</h4>
            {prepTime && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{prepTime} min</span>
              </div>
            )}
          </div>
          <div className="flex gap-1 justify-end">
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={onView}>
              <Eye className="w-3 h-3" />
            </Button>
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={onReplace}>
              <RefreshCw className="w-3 h-3" />
            </Button>
            <Button size="sm" variant="secondary" className="h-7 px-2 text-xs" onClick={onAddToList}>
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground italic">Pas de recette</p>
          <Button size="sm" className="h-7 px-3 text-xs" onClick={onReplace}>
            Générer
          </Button>
        </div>
      )}
    </Card>
  );
};

interface TodayMealsProps {
  childName: string;
  snack: { name: string | null; prepTime?: number };
  dinner: { name: string | null; prepTime?: number };
  lunchbox?: { name: string | null; prepTime?: number };
  showLunchbox: boolean;
  onViewRecipe: (type: string) => void;
  onReplaceRecipe: (type: string) => void;
  onAddToList: (type: string) => void;
}

export const TodayMeals = ({
  childName,
  snack,
  dinner,
  lunchbox,
  showLunchbox,
  onViewRecipe,
  onReplaceRecipe,
  onAddToList,
}: TodayMealsProps) => {
  return (
    <div className="space-y-2">
      <h2 className="text-lg font-bold">
        Aujourd'hui pour {childName} 👋
      </h2>
      
      <div className={`grid gap-2 ${showLunchbox ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
        <MealCard
          type="snack"
          recipeName={snack.name}
          prepTime={snack.prepTime}
          onView={() => onViewRecipe("snack")}
          onReplace={() => onReplaceRecipe("snack")}
          onAddToList={() => onAddToList("snack")}
        />
        
        <MealCard
          type="dinner"
          recipeName={dinner.name}
          prepTime={dinner.prepTime}
          onView={() => onViewRecipe("dinner")}
          onReplace={() => onReplaceRecipe("dinner")}
          onAddToList={() => onAddToList("dinner")}
        />
        
        {showLunchbox && lunchbox && (
          <MealCard
            type="lunchbox"
            recipeName={lunchbox.name}
            prepTime={lunchbox.prepTime}
            onView={() => onViewRecipe("lunchbox")}
            onReplace={() => onReplaceRecipe("lunchbox")}
            onAddToList={() => onAddToList("lunchbox")}
          />
        )}
      </div>
    </div>
  );
};
