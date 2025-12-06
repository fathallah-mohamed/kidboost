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
    <Card className={`px-2.5 py-2 bg-gradient-to-br ${config.gradient} hover:shadow-md transition-all`}>
      <div className="flex items-center gap-2">
        <div className={`p-1 ${config.iconBg} rounded-md`}>
          <Icon className="w-3.5 h-3.5 text-foreground" />
        </div>
        
        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-semibold text-muted-foreground block leading-tight">{config.label}</span>
          {recipeName ? (
            <div className="flex items-center gap-1">
              <h4 className="font-bold text-xs truncate">{recipeName}</h4>
              {prepTime && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" />
                  {prepTime}m
                </span>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Pas de recette</p>
          )}
        </div>

        {recipeName ? (
          <div className="flex gap-0.5">
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={onView}>
              <Eye className="w-3 h-3" />
            </Button>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={onReplace}>
              <RefreshCw className="w-3 h-3" />
            </Button>
            <Button size="sm" variant="secondary" className="h-6 w-6 p-0" onClick={onAddToList}>
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <Button size="sm" className="h-6 px-2 text-[10px]" onClick={onReplace}>
            Générer
          </Button>
        )}
      </div>
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
    <div className="space-y-1.5">
      <h2 className="text-base font-bold">
        Aujourd'hui pour {childName} 👋
      </h2>
      
      <div className="space-y-1.5">
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
