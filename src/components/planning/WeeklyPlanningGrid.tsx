import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coffee, Utensils, Cookie, Moon, Plus, MoreHorizontal, Eye, Edit, Trash2, Backpack } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { MealSlot, MEAL_ORDER, LunchType, LUNCH_CONFIGS } from "@/lib/meals";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface PlannedMeal {
  id: string;
  date: string;
  meal_time: string;
  recipe: {
    id: string;
    name: string;
    preparation_time?: number;
  } | null;
}

interface DayLunchConfig {
  date: string;
  lunchType: LunchType;
  label: string;
  canGenerate: boolean;
  isLunchbox: boolean;
}

interface WeeklyPlanningGridProps {
  weekDays: {
    date: Date;
    dateString: string;
    dayName: string;
    dayNumber: string;
    isToday: boolean;
  }[];
  plannedMeals: PlannedMeal[];
  lunchConfigs: DayLunchConfig[];
  onAddRecipe: (date: string, slot: MealSlot) => void;
  onViewRecipe: (recipeId: string) => void;
  onEditRecipe: (date: string, slot: MealSlot, mealId: string) => void;
  onDeleteRecipe: (mealId: string) => void;
}

const MEAL_ICONS: Record<MealSlot, typeof Coffee> = {
  breakfast: Coffee,
  lunch: Utensils,
  snack: Cookie,
  dinner: Moon,
};

const MEAL_LABELS_SHORT: Record<MealSlot, string> = {
  breakfast: "Petit-déj",
  lunch: "Déjeuner",
  snack: "Goûter",
  dinner: "Dîner",
};

export function WeeklyPlanningGrid({
  weekDays,
  plannedMeals,
  lunchConfigs,
  onAddRecipe,
  onViewRecipe,
  onEditRecipe,
  onDeleteRecipe,
}: WeeklyPlanningGridProps) {
  const getMealForSlot = (dateString: string, slot: MealSlot): PlannedMeal | undefined => {
    return plannedMeals.find(
      (meal) => meal.date === dateString && (meal.meal_time === slot || (slot === 'lunch' && meal.meal_time === 'lunchbox'))
    );
  };

  const getLunchConfigForDay = (dateString: string): DayLunchConfig | undefined => {
    return lunchConfigs.find((config) => config.date === dateString);
  };

  const getLunchLabel = (dateString: string): string => {
    const config = getLunchConfigForDay(dateString);
    if (!config) return MEAL_LABELS_SHORT.lunch;
    
    switch (config.lunchType) {
      case 'school_trip':
        return 'Lunchbox sortie';
      case 'special_diet':
        return 'Lunchbox perso';
      case 'canteen':
        return 'Cantine';
      case 'home':
        return 'Déj. maison';
      default:
        return MEAL_LABELS_SHORT.lunch;
    }
  };

  const isLunchboxDay = (dateString: string): boolean => {
    const config = getLunchConfigForDay(dateString);
    return config?.isLunchbox || false;
  };

  const canGenerateLunchForDay = (dateString: string): boolean => {
    const config = getLunchConfigForDay(dateString);
    return config?.canGenerate ?? true;
  };

  return (
    <div className="space-y-3">
      {weekDays.map((day) => {
        const lunchConfig = getLunchConfigForDay(day.dateString);
        
        return (
          <Card
            key={day.dateString}
            className={`p-4 transition-all ${day.isToday ? "ring-2 ring-primary bg-primary/5" : ""}`}
          >
            {/* En-tête du jour */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                    day.isToday ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {day.dayNumber}
                </div>
                <div>
                  <span className="font-semibold capitalize">{day.dayName}</span>
                  {day.isToday && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      Aujourd'hui
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* Indicateur lunchbox */}
              {isLunchboxDay(day.dateString) && (
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <Backpack className="w-3 h-3" />
                  {lunchConfig?.lunchType === 'school_trip' ? 'Sortie scolaire' : 'Régime spécial'}
                </Badge>
              )}
            </div>

            {/* Grille des 4 repas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {MEAL_ORDER.map((slot) => {
                const meal = getMealForSlot(day.dateString, slot);
                const Icon = slot === 'lunch' && isLunchboxDay(day.dateString) ? Backpack : MEAL_ICONS[slot];
                const label = slot === 'lunch' ? getLunchLabel(day.dateString) : MEAL_LABELS_SHORT[slot];
                const canGenerate = slot === 'lunch' ? canGenerateLunchForDay(day.dateString) : true;
                const isCanteen = slot === 'lunch' && lunchConfig?.lunchType === 'canteen';

                return (
                  <div
                    key={slot}
                    className={`relative p-3 rounded-lg border transition-all ${
                      meal
                        ? "bg-muted/50 border-border"
                        : isCanteen
                        ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
                        : "bg-background border-dashed border-muted-foreground/30 hover:border-primary/50"
                    }`}
                  >
                    {/* Label du repas */}
                    <div className="flex items-center gap-1.5 mb-2">
                      <Icon className={`w-4 h-4 ${meal ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="text-xs font-medium text-muted-foreground">{label}</span>
                    </div>

                    {/* Contenu */}
                    {meal?.recipe ? (
                      <div className="space-y-1">
                        <p className="text-sm font-medium truncate">{meal.recipe.name}</p>
                        {meal.recipe.preparation_time && (
                          <p className="text-xs text-muted-foreground">{meal.recipe.preparation_time} min</p>
                        )}
                        
                        {/* Menu actions */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute top-2 right-2 h-6 w-6 p-0"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onViewRecipe(meal.recipe!.id)}>
                              <Eye className="w-4 h-4 mr-2" />
                              Voir la recette
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEditRecipe(day.dateString, slot, meal.id)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Remplacer
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onDeleteRecipe(meal.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ) : isCanteen ? (
                      <p className="text-xs text-amber-600 dark:text-amber-400 italic">
                        Repas à la cantine
                      </p>
                    ) : canGenerate ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full h-auto py-1 text-xs text-muted-foreground hover:text-primary"
                        onClick={() => onAddRecipe(day.dateString, slot)}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Ajouter
                      </Button>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">Non disponible</p>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
