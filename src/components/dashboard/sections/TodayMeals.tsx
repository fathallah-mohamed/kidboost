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
    label: "Goûter du jour",
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
    <Card className={`p-4 bg-gradient-to-br ${config.gradient} hover:shadow-md transition-all`}>
      <div className="flex items-start gap-3">
        <div className={`p-2.5 ${config.iconBg} rounded-xl`}>
          <Icon className="w-5 h-5 text-foreground" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground mb-1">{config.label}</p>
          
          {recipeName ? (
            <>
              <h4 className="font-bold text-sm truncate mb-1">{recipeName}</h4>
              {prepTime && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{prepTime} min</span>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground italic">Pas encore de recette</p>
          )}
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        {recipeName ? (
          <>
            <Button size="sm" variant="ghost" className="flex-1 h-8 text-xs" onClick={onView}>
              <Eye className="w-3 h-3 mr-1" />
              Voir
            </Button>
            <Button size="sm" variant="ghost" className="flex-1 h-8 text-xs" onClick={onReplace}>
              <RefreshCw className="w-3 h-3 mr-1" />
              Remplacer
            </Button>
            <Button size="sm" variant="secondary" className="h-8 text-xs px-2" onClick={onAddToList}>
              <Plus className="w-3 h-3" />
            </Button>
          </>
        ) : (
          <Button size="sm" className="w-full h-8 text-xs" onClick={onReplace}>
            Générer une recette
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
    <div className="space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2">
        Aujourd'hui pour {childName} 👋
      </h2>
      
      <div className={`grid gap-3 ${showLunchbox ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
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
