import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Clock, Eye, RefreshCw, Plus, Utensils, Moon, Sandwich, Loader2, 
  Ban, Edit, School, Home, AlertTriangle, MoreHorizontal, Trash2, 
  Replace, Sun, Apple, ChevronLeft, ChevronRight 
} from "lucide-react";
import { MealSlot, LunchType, MEAL_LABELS, LUNCH_CONFIGS } from "@/lib/meals";
import { format, addDays, subDays } from "date-fns";
import { fr } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

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
  onDelete?: () => void;
}

const getMealConfig = (slot: MealSlot, lunchType?: LunchType) => {
  const configs: Record<MealSlot, { icon: typeof Sun; gradient: string; iconBg: string; accentColor: string }> = {
    breakfast: {
      icon: Sun,
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
      icon: Apple,
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
  onDelete,
}: MealCardProps) => {
  const config = getMealConfig(slot, lunchType);
  const Icon = slot === 'lunch' && lunchType ? getLunchIcon(lunchType) : config.icon;
  const label = getLabel(slot, lunchType);
  const generateLabel = getGenerateButtonLabel(slot, lunchType);
  const isSpecialDiet = slot === 'lunch' && lunchType === 'special_diet';
  const isSchoolTrip = slot === 'lunch' && lunchType === 'school_trip';
  const isHomeLunch = slot === 'lunch' && lunchType === 'home';

  // Sub-labels pour chaque type de déjeuner
  const getSubLabel = () => {
    if (slot !== 'lunch') return null;
    switch (lunchType) {
      case 'home':
        return "Repas à préparer aujourd'hui";
      case 'special_diet':
        return "Régime alimentaire spécial";
      case 'school_trip':
        return "Pique-nique obligatoire";
      default:
        return null;
    }
  };

  const subLabel = getSubLabel();

  return (
    <Card className={`px-3 py-3.5 bg-gradient-to-br ${config.gradient} hover:shadow-md transition-all border-b border-border/30`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 ${config.iconBg} rounded-lg`}>
          <Icon className={`w-5 h-5 ${config.accentColor}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <span className="text-sm font-bold text-foreground block leading-tight">
            {label}
          </span>
          
          {/* Sub-label pour le déjeuner */}
          {subLabel && (
            <span className={`text-[10px] font-medium ${
              isSchoolTrip ? 'text-blue-600 dark:text-blue-400' :
              isSpecialDiet ? 'text-amber-600 dark:text-amber-400' :
              'text-muted-foreground'
            }`}>
              {subLabel}
            </span>
          )}
          
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
              <h4 className="font-semibold text-sm truncate">{recipeName}</h4>
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
            <p className="text-sm text-muted-foreground italic mt-0.5">Aucune recette ajoutée</p>
          )}
        </div>

        {!generating && canGenerate && (
          recipeName ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background w-48">
                <DropdownMenuItem onClick={onView} className="cursor-pointer">
                  <Eye className="w-4 h-4 mr-2" />
                  Voir recette
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
                  <Edit className="w-4 h-4 mr-2" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onReplace} className="cursor-pointer">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Régénérer
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onAddRecipe} className="cursor-pointer">
                  <Replace className="w-4 h-4 mr-2" />
                  Remplacer
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onAddToList} className="cursor-pointer">
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter aux courses
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="cursor-pointer text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
  hasSpecialDiet?: boolean;
  generating?: MealSlot | null;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onViewRecipe: (slot: MealSlot) => void;
  onReplaceRecipe: (slot: MealSlot) => void;
  onAddToList: (slot: MealSlot) => void;
  onEditRecipe: (slot: MealSlot) => void;
  onAddRecipe: (slot: MealSlot) => void;
  onDeleteRecipe?: (slot: MealSlot) => void;
}

export const TodayMeals = ({
  childName,
  meals,
  lunchType,
  hasSpecialDiet,
  generating,
  selectedDate,
  onDateChange,
  onViewRecipe,
  onReplaceRecipe,
  onAddToList,
  onEditRecipe,
  onAddRecipe,
  onDeleteRecipe,
}: TodayMealsProps) => {
  const canGenerateLunch = LUNCH_CONFIGS[lunchType].canGenerate;
  
  const isToday = format(selectedDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
  const formattedDate = format(selectedDate, "EEEE d MMMM", { locale: fr });
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  const handlePreviousDay = () => {
    onDateChange(subDays(selectedDate, 1));
  };

  const handleNextDay = () => {
    onDateChange(addDays(selectedDate, 1));
  };

  return (
    <div className="space-y-2">
      <h2 className="text-base font-bold">
        {isToday ? `Aujourd'hui pour ${childName}` : `${capitalizedDate} pour ${childName}`} 🍽️
      </h2>
      
      {/* Indicateur régime spécial */}
      {hasSpecialDiet && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-100/80 dark:bg-amber-900/30 rounded-lg border border-amber-200 dark:border-amber-800">
          <span className="text-xs text-amber-700 dark:text-amber-300">
            🔔 Régime alimentaire spécial détecté : Kidboost adapte les repas automatiquement.
          </span>
        </div>
      )}

      {/* Day Selector */}
      <div className="flex items-center justify-center gap-2 py-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={handlePreviousDay}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm font-medium min-w-[160px] text-center">
          {isToday ? `Aujourd'hui (${format(selectedDate, "EEEE d", { locale: fr })})` : capitalizedDate}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={handleNextDay}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="space-y-3">
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
          onDelete={() => onDeleteRecipe?.("breakfast")}
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
          onDelete={() => onDeleteRecipe?.("lunch")}
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
          onDelete={() => onDeleteRecipe?.("snack")}
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
          onDelete={() => onDeleteRecipe?.("dinner")}
        />
      </div>
    </div>
  );
};
