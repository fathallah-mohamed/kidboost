import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coffee, Utensils, Cookie, Moon, Plus, MoreHorizontal, Eye, Edit, Trash2, Backpack, Lock, RefreshCw } from "lucide-react";
import { MealSlot, MEAL_ORDER, LunchType } from "@/lib/meals";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  onReplaceRecipe?: (date: string, slot: MealSlot, mealId: string) => void;
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

// Visual styles for different lunch types
const LUNCH_TYPE_STYLES: Record<LunchType, { bg: string; border: string; text: string; badge: string }> = {
  canteen: {
    bg: "bg-slate-100 dark:bg-slate-800/50",
    border: "border-slate-300 dark:border-slate-700",
    text: "text-slate-500 dark:text-slate-400",
    badge: "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  },
  home: {
    bg: "bg-background",
    border: "border-border",
    text: "text-foreground",
    badge: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  special_diet: {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-300 dark:border-amber-800",
    text: "text-amber-700 dark:text-amber-400",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  school_trip: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-300 dark:border-blue-800",
    text: "text-blue-700 dark:text-blue-400",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
};

export function WeeklyPlanningGrid({
  weekDays,
  plannedMeals,
  lunchConfigs,
  onAddRecipe,
  onViewRecipe,
  onEditRecipe,
  onDeleteRecipe,
  onReplaceRecipe,
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

  const getLunchTypeForDay = (dateString: string): LunchType => {
    const config = getLunchConfigForDay(dateString);
    return config?.lunchType || 'home';
  };

  const isLunchboxDay = (dateString: string): boolean => {
    const config = getLunchConfigForDay(dateString);
    return config?.isLunchbox || false;
  };

  const canGenerateLunchForDay = (dateString: string): boolean => {
    const config = getLunchConfigForDay(dateString);
    return config?.canGenerate ?? true;
  };

  // Determine if a meal slot is locked (can't change the type)
  // Only school trips are fully locked - canteen can be overridden manually
  const isSlotLocked = (dateString: string, slot: MealSlot): boolean => {
    if (slot !== 'lunch') return false;
    const lunchType = getLunchTypeForDay(dateString);
    // Only school trips are fully locked
    return lunchType === 'school_trip';
  };

  // Determine if a meal slot can have its recipe modified
  // Canteen can be overridden for occasional home lunches
  const canModifyRecipe = (dateString: string, slot: MealSlot): boolean => {
    if (slot !== 'lunch') return true;
    const lunchType = getLunchTypeForDay(dateString);
    // School trips cannot be modified to ensure lunchbox is prepared
    return lunchType !== 'school_trip';
  };

  // Check if a canteen slot has been manually overridden
  const isCanteenOverridden = (dateString: string): boolean => {
    const config = getLunchConfigForDay(dateString);
    if (config?.lunchType !== 'canteen') return false;
    const meal = getMealForSlot(dateString, 'lunch');
    return !!meal?.recipe;
  };

  // Get background style for a meal slot
  const getSlotStyle = (dateString: string, slot: MealSlot, hasMeal: boolean): string => {
    if (slot === 'lunch') {
      const lunchType = getLunchTypeForDay(dateString);
      const styles = LUNCH_TYPE_STYLES[lunchType];
      return `${styles.bg} ${styles.border}`;
    }
    
    if (hasMeal) {
      return "bg-muted/50 border-border";
    }
    
    return "bg-background border-dashed border-muted-foreground/30 hover:border-primary/50";
  };

  return (
    <TooltipProvider>
      <div className="space-y-3">
        {weekDays.map((day) => {
          const lunchConfig = getLunchConfigForDay(day.dateString);
          const lunchType = getLunchTypeForDay(day.dateString);
          
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
                  <Badge className={`text-xs flex items-center gap-1 ${LUNCH_TYPE_STYLES[lunchType].badge}`}>
                    <Backpack className="w-3 h-3" />
                    {lunchConfig?.lunchType === 'school_trip' ? 'Sortie scolaire' : 'Régime spécial'}
                  </Badge>
                )}
              </div>

              {/* Grille des 4 repas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {MEAL_ORDER.map((slot) => {
                  const meal = getMealForSlot(day.dateString, slot);
                  const isCanteenOverride = isCanteenOverridden(day.dateString);
                  const Icon = slot === 'lunch' && isLunchboxDay(day.dateString) ? Backpack : MEAL_ICONS[slot];
                  // Show different label if canteen is overridden
                  const label = slot === 'lunch' 
                    ? (isCanteenOverride ? 'Déj. maison (exceptionnel)' : getLunchLabel(day.dateString)) 
                    : MEAL_LABELS_SHORT[slot];
                  const canGenerate = slot === 'lunch' ? (canGenerateLunchForDay(day.dateString) || lunchType === 'canteen') : true;
                  const isCanteen = slot === 'lunch' && lunchType === 'canteen';
                  const isLocked = isSlotLocked(day.dateString, slot);
                  const canModify = canModifyRecipe(day.dateString, slot);
                  const slotStyle = getSlotStyle(day.dateString, slot, !!meal || isCanteenOverride);

                  return (
                    <div
                      key={slot}
                      className={`relative p-3 rounded-lg border transition-all ${slotStyle}`}
                    >
                      {/* Label du repas avec indicateur de verrouillage */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <Icon className={`w-4 h-4 ${meal ? "text-primary" : "text-muted-foreground"}`} />
                          <span className="text-xs font-medium text-muted-foreground">{label}</span>
                        </div>
                        
                        {isLocked && (
                          <Tooltip>
                            <TooltipTrigger>
                              <Lock className="w-3 h-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">
                                {isCanteen 
                                  ? "Défini dans les paramètres" 
                                  : "Sortie scolaire programmée"}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>

                      {/* Contenu */}
                      {meal?.recipe ? (
                        <div className="space-y-1">
                          <p className="text-sm font-medium truncate pr-6">{meal.recipe.name}</p>
                          {meal.recipe.preparation_time && (
                            <p className="text-xs text-muted-foreground">{meal.recipe.preparation_time} min</p>
                          )}
                          
                          {/* Menu actions */}
                          {canModify && (
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
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => onEditRecipe(day.dateString, slot, meal.id)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => (onReplaceRecipe || onEditRecipe)(day.dateString, slot, meal.id)}>
                                  <RefreshCw className="w-4 h-4 mr-2" />
                                  Remplacer
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => onDeleteRecipe(meal.id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      ) : isCanteen && !isCanteenOverridden(day.dateString) ? (
                        <div className="space-y-1">
                          <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                            Repas à la cantine
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full h-auto py-1 text-xs text-muted-foreground hover:text-primary"
                            onClick={() => onAddRecipe(day.dateString, slot)}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Remplacer par maison
                          </Button>
                        </div>
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
    </TooltipProvider>
  );
}
