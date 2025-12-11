import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Eye, RefreshCw, Plus, Coffee, Utensils, Cookie, Moon, Sandwich, Loader2, Ban, Edit, School, Home, AlertTriangle } from "lucide-react";
import { MealSlot, LunchType, MEAL_LABELS, LUNCH_CONFIGS } from "@/lib/meals";

interface MealCardProps {
  slot: MealSlot;
  recipeName: string | null;
  prepTime?: number;
  difficulty?: string;
  generating?: boolean;
  canGenerate: boolean;
  lunchType?: LunchType;
  onView: () => void;
  onReplace: () => void;
  onAddToList: () => void;
  onEdit: () => void;
  onAddRecipe: () => void;
}

const getMealConfig = (slot: MealSlot, lunchType?: LunchType) => {
  const configs: Record<MealSlot, { icon: typeof Coffee; gradient: string; iconBg: string; accentColor: string }> = {
    breakfast: {
      icon: Coffee,
      gradient: "from-amber-100/60 to-amber-50/30 dark:from-amber-900/30 dark:to-amber-950/20",
      iconBg: "bg-amber-200/70 dark:bg-amber-800/50",
      accentColor: "text-amber-700 dark:text-amber-400",
    },
    lunch: {
      icon: lunchType && LUNCH_CONFIGS[lunchType].isLunchbox ? Sandwich : Utensils,
      gradient: "from-emerald-100/60 to-emerald-50/30 dark:from-emerald-900/30 dark:to-emerald-950/20",
      iconBg: "bg-emerald-200/70 dark:bg-emerald-800/50",
      accentColor: "text-emerald-700 dark:text-emerald-400",
    },
    snack: {
      icon: Cookie,
      gradient: "from-orange-100/60 to-orange-50/30 dark:from-orange-900/30 dark:to-orange-950/20",
      iconBg: "bg-orange-200/70 dark:bg-orange-800/50",
      accentColor: "text-orange-700 dark:text-orange-400",
    },
    dinner: {
      icon: Moon,
      gradient: "from-primary/20 to-primary/5",
      iconBg: "bg-primary/30",
      accentColor: "text-primary",
    },
  };
  return configs[slot];
};

const getLunchIcon = (lunchType: LunchType) => {
  switch (lunchType) {
    case 'canteen':
      return School;
    case 'home':
      return Home;
    case 'special_diet':
      return AlertTriangle;
    case 'school_trip':
      return Sandwich;
    default:
      return Utensils;
  }
};

const getLabel = (slot: MealSlot, lunchType?: LunchType): string => {
  if (slot === 'lunch' && lunchType) {
    return LUNCH_CONFIGS[lunchType].label;
  }
  return MEAL_LABELS[slot];
};

const getGenerateButtonLabel = (slot: MealSlot, lunchType?: LunchType): string => {
  if (slot !== 'lunch') return "Générer";
  
  switch (lunchType) {
    case 'special_diet':
      return "Générer lunchbox";
    case 'school_trip':
      return "Générer pique-nique";
    default:
      return "Générer";
  }
};

const MealCard = ({ 
  slot, 
  recipeName, 
  prepTime,
  difficulty,
  generating, 
  canGenerate, 
  lunchType,
  onView, 
  onReplace, 
  onAddToList,
  onEdit,
  onAddRecipe,
}: MealCardProps) => {
  const config = getMealConfig(slot, lunchType);
  const Icon = slot === 'lunch' && lunchType ? getLunchIcon(lunchType) : config.icon;
  const label = getLabel(slot, lunchType);
  const generateLabel = getGenerateButtonLabel(slot, lunchType);

  return (
    <Card className={`px-3 py-2.5 bg-gradient-to-br ${config.gradient} hover:shadow-md transition-all border-l-4 border-l-transparent hover:border-l-current ${config.accentColor}`}>
      <div className="flex items-center gap-3">
        <div className={`p-1.5 ${config.iconBg} rounded-lg`}>
          <Icon className={`w-4 h-4 ${config.accentColor}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide block leading-tight">
            {label}
          </span>
          
          {generating ? (
            <div className="flex items-center gap-1.5 mt-0.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">Génération en cours...</span>
            </div>
          ) : !canGenerate ? (
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-sm text-muted-foreground italic">
                {lunchType === 'canteen' ? "Votre enfant mange à la cantine" : "Aucune action requise"}
              </span>
            </div>
          ) : recipeName ? (
            <div className="space-y-0.5 mt-0.5">
              <h4 className="font-bold text-sm truncate">{recipeName}</h4>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                {prepTime && (
                  <span className="flex items-center gap-0.5">
                    <Clock className="w-3 h-3" />
                    {prepTime} min
                  </span>
                )}
                {difficulty && (
                  <span className="capitalize">{difficulty}</span>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mt-0.5">Pas de recette</p>
          )}
        </div>

        {!generating && canGenerate && (
          recipeName ? (
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onView} title="Voir">
                <Eye className="w-3.5 h-3.5" />
              </Button>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onReplace} title="Régénérer">
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onEdit} title="Modifier">
                <Edit className="w-3.5 h-3.5" />
              </Button>
              <Button size="sm" variant="secondary" className="h-7 w-7 p-0" onClick={onAddToList} title="Ajouter aux courses">
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          ) : (
            <div className="flex gap-1">
              <Button size="sm" variant="outline" className="h-7 px-2 text-[10px]" onClick={onAddRecipe}>
                <Plus className="w-3 h-3 mr-0.5" />
                Ajouter
              </Button>
              <Button size="sm" className="h-7 px-2 text-[10px]" onClick={onReplace}>
                {generateLabel}
              </Button>
            </div>
          )
        )}

        {!canGenerate && (
          <div className="flex items-center gap-1 text-muted-foreground/60">
            <Ban className="w-4 h-4" />
          </div>
        )}
      </div>
    </Card>
  );
};

interface MealData {
  name: string | null;
  prepTime?: number;
  recipeId?: string;
  difficulty?: string;
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
  onEditRecipe: (slot: MealSlot) => void;
  onAddRecipe: (slot: MealSlot) => void;
}

export const TodayMeals = ({
  childName,
  meals,
  lunchType,
  generating,
  onViewRecipe,
  onReplaceRecipe,
  onAddToList,
  onEditRecipe,
  onAddRecipe,
}: TodayMealsProps) => {
  const canGenerateLunch = LUNCH_CONFIGS[lunchType].canGenerate;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold">
          Aujourd'hui pour {childName} 🍽️
        </h2>
        <span className="text-[10px] text-muted-foreground">4 repas</span>
      </div>
      
      <div className="space-y-2">
        <MealCard
          slot="breakfast"
          recipeName={meals.breakfast.name}
          prepTime={meals.breakfast.prepTime}
          difficulty={meals.breakfast.difficulty}
          generating={generating === 'breakfast'}
          canGenerate={true}
          onView={() => onViewRecipe("breakfast")}
          onReplace={() => onReplaceRecipe("breakfast")}
          onAddToList={() => onAddToList("breakfast")}
          onEdit={() => onEditRecipe("breakfast")}
          onAddRecipe={() => onAddRecipe("breakfast")}
        />

        <MealCard
          slot="lunch"
          recipeName={meals.lunch.name}
          prepTime={meals.lunch.prepTime}
          difficulty={meals.lunch.difficulty}
          generating={generating === 'lunch'}
          canGenerate={canGenerateLunch}
          lunchType={lunchType}
          onView={() => onViewRecipe("lunch")}
          onReplace={() => onReplaceRecipe("lunch")}
          onAddToList={() => onAddToList("lunch")}
          onEdit={() => onEditRecipe("lunch")}
          onAddRecipe={() => onAddRecipe("lunch")}
        />
        
        <MealCard
          slot="snack"
          recipeName={meals.snack.name}
          prepTime={meals.snack.prepTime}
          difficulty={meals.snack.difficulty}
          generating={generating === 'snack'}
          canGenerate={true}
          onView={() => onViewRecipe("snack")}
          onReplace={() => onReplaceRecipe("snack")}
          onAddToList={() => onAddToList("snack")}
          onEdit={() => onEditRecipe("snack")}
          onAddRecipe={() => onAddRecipe("snack")}
        />
        
        <MealCard
          slot="dinner"
          recipeName={meals.dinner.name}
          prepTime={meals.dinner.prepTime}
          difficulty={meals.dinner.difficulty}
          generating={generating === 'dinner'}
          canGenerate={true}
          onView={() => onViewRecipe("dinner")}
          onReplace={() => onReplaceRecipe("dinner")}
          onAddToList={() => onAddToList("dinner")}
          onEdit={() => onEditRecipe("dinner")}
          onAddRecipe={() => onAddRecipe("dinner")}
        />
      </div>
    </div>
  );
};
