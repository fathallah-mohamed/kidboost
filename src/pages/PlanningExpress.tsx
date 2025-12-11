import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSession } from "@supabase/auth-helpers-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, Sparkles, Calendar, Check, Loader2, Coffee, Utensils, 
  Cookie, Moon, AlertTriangle, ChefHat, Backpack, UtensilsCrossed,
  Users
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, startOfWeek, addDays, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { MealSlot, MEAL_ORDER, determineLunchType, LUNCH_CONFIGS } from "@/lib/meals";
import { useChild, ChildProfile } from "@/contexts/ChildContext";
import { GlobalChildSelector } from "@/components/common/GlobalChildSelector";

interface ExistingMeal {
  date: string;
  meal_time: string;
  recipe_id: string;
  recipes?: { name: string };
}

interface GeneratedMeal {
  slot: MealSlot | 'lunchbox_special' | 'lunchbox_trip';
  name: string;
  id: string;
  isNew: boolean;
}

interface DayPlan {
  date: string;
  dayName: string;
  dayNumber: string;
  meals: GeneratedMeal[];
  lunchType?: string;
  isSchoolTrip?: boolean;
}

const MEAL_ICONS: Record<string, typeof Coffee> = {
  breakfast: Coffee,
  lunch: Utensils,
  snack: Cookie,
  dinner: Moon,
  lunchbox_special: Backpack,
  lunchbox_trip: UtensilsCrossed,
};

const MEAL_LABELS: Record<string, string> = {
  breakfast: "Petit-déjeuner",
  lunch: "Déjeuner",
  snack: "Goûter",
  dinner: "Dîner",
  lunchbox_special: "Lunchbox perso",
  lunchbox_trip: "Lunchbox sortie",
};

export default function PlanningExpress() {
  const navigate = useNavigate();
  const session = useSession();
  const [searchParams] = useSearchParams();
  const childIdParam = searchParams.get("childId");
  
  // Use global child context
  const { selectedChild, children, selectChildById } = useChild();
  
  const [generating, setGenerating] = useState(false);
  const [existingMeals, setExistingMeals] = useState<ExistingMeal[]>([]);
  const [weekPlan, setWeekPlan] = useState<DayPlan[]>([]);
  const [generateBreakfast, setGenerateBreakfast] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, currentMeal: "" });
  const [generateForAll, setGenerateForAll] = useState(false);

  // Sync with URL param
  useEffect(() => {
    if (childIdParam && selectedChild?.id !== childIdParam) {
      selectChildById(childIdParam);
    }
  }, [childIdParam, selectChildById, selectedChild?.id]);

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    return {
      date: format(date, "yyyy-MM-dd"),
      dayName: format(date, "EEEE", { locale: fr }),
      dayNumber: format(date, "d MMMM", { locale: fr }),
    };
  });

  // Use selectedChild from context
  const child = selectedChild;

  // Fetch existing meals for current child
  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user?.id || !child?.id) return;

      const { data: mealsData } = await supabase
        .from("meal_plans")
        .select("date, meal_time, recipe_id, recipes(name)")
        .eq("profile_id", session.user.id)
        .eq("child_id", child.id)
        .gte("date", weekDays[0].date)
        .lte("date", weekDays[6].date);

      if (mealsData) {
        setExistingMeals(mealsData as ExistingMeal[]);
      }
    };

    fetchData();
  }, [session?.user?.id, child?.id]);

  // Check if a meal already exists for a specific day and slot
  const mealExists = (date: string, mealTime: string): ExistingMeal | undefined => {
    return existingMeals.find(m => m.date === date && m.meal_time === mealTime);
  };

  // Check if date is a school trip day
  const isSchoolTripDay = (date: string): boolean => {
    if (!child?.sortie_scolaire_dates) return false;
    return child.sortie_scolaire_dates.includes(date);
  };

  // Determine what lunch type should be generated for a specific day
  const getLunchTypeForDay = (date: string): 'lunch' | 'lunchbox_special' | 'lunchbox_trip' | null => {
    if (!child) return null;

    // School trip takes priority
    if (isSchoolTripDay(date)) {
      return 'lunchbox_trip';
    }

    // Special diet requires lunchbox
    if (child.regime_special) {
      return 'lunchbox_special';
    }

    // Home lunch
    if (child.dejeuner_habituel === 'maison') {
      return 'lunch';
    }

    // Canteen - don't generate anything
    return null;
  };

  // Get meals to generate for a specific day
  const getMealsToGenerate = (date: string): (MealSlot | 'lunchbox_special' | 'lunchbox_trip')[] => {
    const meals: (MealSlot | 'lunchbox_special' | 'lunchbox_trip')[] = [];

    // Breakfast only if option is checked
    if (generateBreakfast && !mealExists(date, 'breakfast')) {
      meals.push('breakfast');
    }

    // Lunch logic
    const lunchType = getLunchTypeForDay(date);
    if (lunchType && !mealExists(date, 'lunch')) {
      meals.push(lunchType);
    }

    // Always generate snack and dinner if missing
    if (!mealExists(date, 'snack')) {
      meals.push('snack');
    }
    if (!mealExists(date, 'dinner')) {
      meals.push('dinner');
    }

    return meals;
  };

  // Count total meals to generate
  const countMealsToGenerate = (): number => {
    return weekDays.reduce((count, day) => {
      return count + getMealsToGenerate(day.date).length;
    }, 0);
  };

  const handleGenerateWeek = async () => {
    if (!session?.user?.id || !child?.id || !child) {
      toast.error("Veuillez sélectionner un enfant");
      return;
    }

    const totalMeals = countMealsToGenerate();
    if (totalMeals === 0) {
      toast.info("Tous les repas sont déjà planifiés pour cette semaine !");
      return;
    }

    setGenerating(true);
    setProgress({ current: 0, total: totalMeals, currentMeal: "" });
    
    const newWeekPlan: DayPlan[] = [];
    let currentMealIndex = 0;

    try {
      for (const day of weekDays) {
        const mealsToGenerate = getMealsToGenerate(day.date);
        const dayPlan: DayPlan = {
          date: day.date,
          dayName: day.dayName,
          dayNumber: day.dayNumber,
          meals: [],
          lunchType: getLunchTypeForDay(day.date) || undefined,
          isSchoolTrip: isSchoolTripDay(day.date),
        };

        // Add existing meals first
        const existingForDay = existingMeals.filter(m => m.date === day.date);
        for (const existing of existingForDay) {
          const slot = existing.meal_time as MealSlot;
          dayPlan.meals.push({
            slot,
            name: existing.recipes?.name || "Recette existante",
            id: existing.recipe_id,
            isNew: false,
          });
        }

        // Generate new meals
        for (const mealSlot of mealsToGenerate) {
          currentMealIndex++;
          setProgress({
            current: currentMealIndex,
            total: totalMeals,
            currentMeal: `${MEAL_LABELS[mealSlot]} - ${day.dayName}`,
          });

          // Determine context for the edge function
          const isLunchbox = mealSlot === 'lunchbox_special' || mealSlot === 'lunchbox_trip';
          const lunchboxType = mealSlot === 'lunchbox_trip' ? 'school_trip' : 
                              mealSlot === 'lunchbox_special' ? 'special_diet' : null;
          
          // Map to actual meal_time for storage
          const actualMealTime = isLunchbox ? 'lunch' : mealSlot;

          const { data, error } = await supabase.functions.invoke("generate-daily-meal", {
            body: {
              childId: child.id,
              profileId: session.user.id,
              mealType: actualMealTime,
              date: day.date,
              context: {
                isLunchbox,
                lunchboxType,
                isAutoGenerated: true,
                mealConstraints: getMealConstraints(mealSlot),
              },
            },
          });

          if (!error && data?.recipe) {
            dayPlan.meals.push({
              slot: mealSlot,
              name: data.recipe.name,
              id: data.recipe.id,
              isNew: true,
            });
          } else {
            console.error(`Error generating ${mealSlot} for ${day.date}:`, error);
          }
        }

        newWeekPlan.push(dayPlan);
      }

      setWeekPlan(newWeekPlan);
      toast.success("Planning généré avec succès !");
      
      // Navigate back to dashboard after a short delay
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);

    } catch (error) {
      console.error("Error generating week plan:", error);
      toast.error("Erreur lors de la génération du planning");
    } finally {
      setGenerating(false);
      setProgress({ current: 0, total: 0, currentMeal: "" });
    }
  };

  // Get specific constraints for each meal type
  const getMealConstraints = (mealSlot: string): string => {
    switch (mealSlot) {
      case 'breakfast':
        return "Petit-déjeuner simple et adapté aux enfants. Rapide à préparer.";
      case 'snack':
        return "Goûter sucré léger, fruit ou collation saine. Simple et rapide.";
      case 'dinner':
        return "Dîner consistant mais simple. Repas équilibré du soir.";
      case 'lunch':
        return "Déjeuner maison équilibré. Peut être chaud ou froid.";
      case 'lunchbox_special':
        return "Lunchbox personnalisée STRICTEMENT froide et transportable. Respect absolu des allergies et restrictions. Pas de soupe, pas de plat chaud. Quantité adaptée à un enfant.";
      case 'lunchbox_trip':
        return "Lunchbox sortie scolaire : UNIQUEMENT sandwich, wrap, salade froide, fruit ou dessert simple. AUCUNE cuisson nécessaire. 100% transportable et consommable froid.";
      default:
        return "";
    }
  };

  const existingMealsCount = existingMeals.length;
  const mealsToGenerateCount = countMealsToGenerate();

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Planning Express</h1>
            {child && (
              <p className="text-sm text-muted-foreground">
                Pour {child.name}
              </p>
            )}
          </div>
        </div>

        {/* Explanation Card */}
        <Card className="p-5 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-full bg-primary/20">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 space-y-2">
              <h2 className="font-semibold">Génération automatique intelligente</h2>
              <p className="text-sm text-muted-foreground">
                Kidboost génère automatiquement les repas manquants de la semaine en respectant :
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Les repas déjà planifiés (jamais écrasés)</li>
                <li>• Les allergies et restrictions alimentaires</li>
                <li>• Les préférences de votre enfant</li>
                <li>• Les lunchbox obligatoires (sorties scolaires, régimes spéciaux)</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Options */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Options de génération</h3>
          <div className="flex items-center space-x-3">
            <Checkbox 
              id="breakfast" 
              checked={generateBreakfast}
              onCheckedChange={(checked) => setGenerateBreakfast(checked === true)}
            />
            <Label htmlFor="breakfast" className="text-sm cursor-pointer">
              Générer les petits-déjeuners (optionnel)
            </Label>
          </div>
        </Card>

        {/* Stats */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Résumé de la semaine</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Check className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{existingMealsCount}</p>
                <p className="text-xs text-muted-foreground">Repas déjà planifiés</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <ChefHat className="w-5 h-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{mealsToGenerateCount}</p>
                <p className="text-xs text-muted-foreground">Repas à générer</p>
              </div>
            </div>
          </div>

          {/* School trips warning */}
          {child?.sortie_scolaire_dates && child.sortie_scolaire_dates.length > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {child.sortie_scolaire_dates.filter(d => 
                    weekDays.some(wd => wd.date === d)
                  ).length} sortie(s) scolaire(s) cette semaine
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Des lunchbox pique-nique seront générées automatiquement.
              </p>
            </div>
          )}

          {/* Special diet info */}
          {child?.regime_special && (
            <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center gap-2 text-blue-600">
                <Backpack className="w-4 h-4" />
                <span className="text-sm font-medium">Régime spécial activé</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Des lunchbox personnalisées seront générées pour les déjeuners.
              </p>
            </div>
          )}
        </Card>

        {/* Generate Button */}
        <Button 
          onClick={handleGenerateWeek} 
          disabled={generating || mealsToGenerateCount === 0}
          className="w-full h-14 text-lg"
          size="lg"
        >
          {generating ? (
            <div className="flex flex-col items-center">
              <div className="flex items-center">
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Génération en cours... ({progress.current}/{progress.total})
              </div>
              <span className="text-xs opacity-80">{progress.currentMeal}</span>
            </div>
          ) : (
            <>
              <Calendar className="w-5 h-5 mr-2" />
              ✨ Planifier toute la semaine
            </>
          )}
        </Button>

        {mealsToGenerateCount === 0 && (
          <p className="text-center text-sm text-muted-foreground">
            Tous les repas sont déjà planifiés pour cette semaine !
          </p>
        )}

        {/* Week Preview */}
        {weekPlan.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              Planning généré
            </h2>
            
            {weekPlan.map((day) => (
              <Card key={day.date} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-semibold capitalize">
                    {day.dayName} {day.dayNumber}
                  </div>
                  {day.isSchoolTrip && (
                    <span className="text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-600">
                      🎒 Sortie scolaire
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {day.meals.map((meal) => {
                    const Icon = MEAL_ICONS[meal.slot] || Utensils;
                    return (
                      <div 
                        key={meal.slot} 
                        className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
                          meal.isNew ? 'bg-green-500/10 border border-green-500/20' : 'bg-muted/50'
                        }`}
                      >
                        <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">
                            {MEAL_LABELS[meal.slot]}
                          </p>
                          <p className="truncate font-medium">{meal.name}</p>
                        </div>
                        {meal.isNew && (
                          <span className="text-xs text-green-600 ml-auto">✨</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
