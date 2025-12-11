import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Eye, RefreshCw, Plus, Coffee, Utensils, Cookie, Moon, Sandwich, Loader2, Ban } from "lucide-react";
import { MealSlot, LunchType, MEAL_LABELS, LUNCH_CONFIGS } from "@/lib/meals";

interface MealCardProps {
  slot: MealSlot;
  recipeName: string | null;
  prepTime?: number;
  generating?: boolean;
  canGenerate: boolean;
  lunchType?: LunchType;
  onView: () => void;
  onReplace: () => void;
  onAddToList: () => void;
}

const getMealConfig = (slot: MealSlot, lunchType?: LunchType) => {
  const configs: Record<MealSlot, { icon: typeof Coffee; gradient: string; iconBg: string }> = {
    breakfast: {
      icon: Coffee,
      gradient: "from-amber-100/50 to-amber-50/30",
      iconBg: "bg-amber-200/50",
    },
    lunch: {
      icon: lunchType && LUNCH_CONFIGS[lunchType].isLunchbox ? Sandwich : Utensils,
      gradient: "from-emerald-100/50 to-emerald-50/30",
      iconBg: "bg-emerald-200/50",
    },
    snack: {
      icon: Cookie,
      gradient: "from-pastel-yellow/30 to-pastel-yellow/10",
      iconBg: "bg-pastel-yellow/50",
    },
    dinner: {
      icon: Moon,
      gradient: "from-primary/20 to-primary/5",
      iconBg: "bg-primary/30",
    },
  };
  return configs[slot];
};

const getLabel = (slot: MealSlot, lunchType?: LunchType): string => {
  if (slot === 'lunch' && lunchType) {
    return LUNCH_CONFIGS[lunchType].label;
  }
  return MEAL_LABELS[slot];
};

const MealCard = ({ 
  slot, 
  recipeName, 
  prepTime, 
  generating, 
  canGenerate, 
  lunchType,
  onView, 
  onReplace, 
  onAddToList 
}: MealCardProps) => {
  const config = getMealConfig(slot, lunchType);
  const Icon = config.icon;
  const label = getLabel(slot, lunchType);

  return (
    <Card className={`px-2.5 py-2 bg-gradient-to-br ${config.gradient} hover:shadow-md transition-all`}>
      <div className="flex items-center gap-2">
        <div className={`p-1 ${config.iconBg} rounded-md`}>
          <Icon className="w-3.5 h-3.5 text-foreground" />
        </div>
        
        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-semibold text-muted-foreground block leading-tight">{label}</span>
          {generating ? (
            <div className="flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span className="text-xs text-muted-foreground">Génération...</span>
            </div>
          ) : !canGenerate ? (
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground italic">Aucune action requise</span>
            </div>
          ) : recipeName ? (
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

        {!generating && canGenerate && (
          recipeName ? (
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
          )
        )}

        {!canGenerate && (
          <Ban className="w-4 h-4 text-muted-foreground/50" />
        )}
      </div>
    </Card>
  );
};

interface MealData {
  name: string | null;
  prepTime?: number;
  recipeId?: string;
}

interface TodayMealsProps {
  childName: string;
  meals: {
    breakfast: MealData;
    lunch: MealData;
    snack: MealData;
    dinner: MealData;
  };
  lunchType: LunchType;
  generating?: MealSlot | null;
  onViewRecipe: (slot: MealSlot) => void;
  onReplaceRecipe: (slot: MealSlot) => void;
  onAddToList: (slot: MealSlot) => void;
}

export const TodayMeals = ({
  childName,
  meals,
  lunchType,
  generating,
  onViewRecipe,
  onReplaceRecipe,
  onAddToList,
}: TodayMealsProps) => {
  const canGenerateLunch = LUNCH_CONFIGS[lunchType].canGenerate;

  return (
    <div className="space-y-1.5">
      <h2 className="text-base font-bold">
        Aujourd'hui pour {childName} 👋
      </h2>
      
      <div className="space-y-1.5">
        <MealCard
          slot="breakfast"
          recipeName={meals.breakfast.name}
          prepTime={meals.breakfast.prepTime}
          generating={generating === 'breakfast'}
          canGenerate={true}
          onView={() => onViewRecipe("breakfast")}
          onReplace={() => onReplaceRecipe("breakfast")}
          onAddToList={() => onAddToList("breakfast")}
        />

        <MealCard
          slot="lunch"
          recipeName={meals.lunch.name}
          prepTime={meals.lunch.prepTime}
          generating={generating === 'lunch'}
          canGenerate={canGenerateLunch}
          lunchType={lunchType}
          onView={() => onViewRecipe("lunch")}
          onReplace={() => onReplaceRecipe("lunch")}
          onAddToList={() => onAddToList("lunch")}
        />
        
        <MealCard
          slot="snack"
          recipeName={meals.snack.name}
          prepTime={meals.snack.prepTime}
          generating={generating === 'snack'}
          canGenerate={true}
          onView={() => onViewRecipe("snack")}
          onReplace={() => onReplaceRecipe("snack")}
          onAddToList={() => onAddToList("snack")}
        />
        
        <MealCard
          slot="dinner"
          recipeName={meals.dinner.name}
          prepTime={meals.dinner.prepTime}
          generating={generating === 'dinner'}
          canGenerate={true}
          onView={() => onViewRecipe("dinner")}
          onReplace={() => onReplaceRecipe("dinner")}
          onAddToList={() => onAddToList("dinner")}
        />
      </div>
    </div>
  );
};
