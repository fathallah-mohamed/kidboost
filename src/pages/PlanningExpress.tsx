import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSession } from "@supabase/auth-helpers-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  Sparkles, 
  Calendar, 
  Check, 
  Loader2, 
  Coffee, 
  Utensils, 
  Cookie, 
  Moon,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, startOfWeek, addDays, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { MealSlot, MEAL_LABELS, MEAL_ORDER, determineLunchType, LunchType, LUNCH_CONFIGS } from "@/lib/meals";

interface ChildProfile {
  id: string;
  name: string;
  allergies: string[] | null;
  preferences: string[] | null;
  dislikes: string[] | null;
  restrictions_alimentaires: string[] | null;
  dejeuner_habituel: string | null;
  regime_special: boolean | null;
  sortie_scolaire_dates: string[] | null;
  available_time: number | null;
}

interface PlannedMeal {
  date: string;
  meal_time: string;
  recipe_id: string;
  recipe_name?: string;
}

interface DayPlan {
  date: string;
  dayName: string;
  dayNumber: string;
  meals: {
    slot: MealSlot;
    status: 'existing' | 'generated' | 'skipped' | 'pending';
    recipeName?: string;
    recipeId?: string;
    lunchType?: LunchType;
    skipReason?: string;
  }[];
}

interface GenerationProgress {
  current: number;
  total: number;
  currentDay: string;
  currentMeal: string;
}

const MEAL_ICONS: Record<MealSlot, typeof Coffee> = {
  breakfast: Coffee,
  lunch: Utensils,
  snack: Cookie,
  dinner: Moon,
};

export default function PlanningExpress() {
  const navigate = useNavigate();
  const session = useSession();
  const [searchParams] = useSearchParams();
  const childId = searchParams.get("childId");
  
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [child, setChild] = useState<ChildProfile | null>(null);
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(childId);
  const [existingMeals, setExistingMeals] = useState<PlannedMeal[]>([]);
  const [weekPlan, setWeekPlan] = useState<DayPlan[]>([]);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [generationComplete, setGenerationComplete] = useState(false);

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 6);

  // Fetch children profiles
  useEffect(() => {
    const fetchChildren = async () => {
      if (!session?.user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from("children_profiles")
          .select("*")
          .eq("profile_id", session.user.id);
          
        if (error) throw error;
        setChildren(data || []);
        
        if (data && data.length > 0) {
          const targetChild = childId 
            ? data.find(c => c.id === childId) 
            : data[0];
          if (targetChild) {
            setSelectedChildId(targetChild.id);
            setChild(targetChild);
          }
        }
      } catch (error) {
        console.error("Error fetching children:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChildren();
  }, [session?.user?.id, childId]);

  // Fetch existing meals when child is selected
  useEffect(() => {
    const fetchExistingMeals = async () => {
      if (!session?.user?.id || !selectedChildId) return;

      try {
        const { data, error } = await supabase
          .from("meal_plans")
          .select("date, meal_time, recipe_id, recipes(name)")
          .eq("profile_id", session.user.id)
          .eq("child_id", selectedChildId)
          .gte("date", format(weekStart, "yyyy-MM-dd"))
          .lte("date", format(weekEnd, "yyyy-MM-dd"));

        if (error) throw error;
        
        const meals = (data || []).map(m => ({
          date: m.date,
          meal_time: m.meal_time,
          recipe_id: m.recipe_id,
          recipe_name: (m.recipes as any)?.name
        }));
        
        setExistingMeals(meals);
        initializeWeekPlan(meals);
      } catch (error) {
        console.error("Error fetching existing meals:", error);
      }
    };

    fetchExistingMeals();
  }, [session?.user?.id, selectedChildId]);

  // Update child when selection changes
  useEffect(() => {
    if (selectedChildId && children.length > 0) {
      const selected = children.find(c => c.id === selectedChildId);
      if (selected) setChild(selected);
    }
  }, [selectedChildId, children]);

  const initializeWeekPlan = (meals: PlannedMeal[]) => {
    if (!child) return;

    const plan: DayPlan[] = [];
    
    for (let i = 0; i < 7; i++) {
      const date = addDays(weekStart, i);
      const dateStr = format(date, "yyyy-MM-dd");
      
      const dayMeals = MEAL_ORDER.map(slot => {
        const existingMeal = meals.find(
          m => m.date === dateStr && m.meal_time === slot
        );
        
        // Determine lunch type for this day
        let lunchType: LunchType | undefined;
        if (slot === 'lunch') {
          const isSchoolTrip = child.sortie_scolaire_dates?.includes(dateStr);
          lunchType = determineLunchType({
            hasSpecialDiet: child.regime_special || false,
            hasSchoolTripToday: isSchoolTrip || false,
            eatsAtCanteen: child.dejeuner_habituel === 'cantine'
          });
        }
        
        if (existingMeal) {
          return {
            slot,
            status: 'existing' as const,
            recipeName: existingMeal.recipe_name,
            recipeId: existingMeal.recipe_id,
            lunchType
          };
        }
        
        // Check if lunch should be skipped (canteen)
        if (slot === 'lunch' && lunchType === 'canteen') {
          return {
            slot,
            status: 'skipped' as const,
            lunchType,
            skipReason: 'Cantine'
          };
        }
        
        return {
          slot,
          status: 'pending' as const,
          lunchType
        };
      });
      
      plan.push({
        date: dateStr,
        dayName: format(date, "EEEE", { locale: fr }),
        dayNumber: format(date, "d MMMM", { locale: fr }),
        meals: dayMeals
      });
    }
    
    setWeekPlan(plan);
  };

  const handleChildSelect = (childId: string) => {
    setSelectedChildId(childId);
    setGenerationComplete(false);
    setWeekPlan([]);
  };

  const countMealsToGenerate = () => {
    return weekPlan.reduce((acc, day) => {
      return acc + day.meals.filter(m => m.status === 'pending').length;
    }, 0);
  };

  const handleGenerateWeek = async () => {
    if (!session?.user?.id || !selectedChildId || !child) {
      toast.error("Veuillez sélectionner un enfant");
      return;
    }

    const mealsToGenerate = weekPlan.flatMap(day => 
      day.meals
        .filter(m => m.status === 'pending')
        .map(m => ({ date: day.date, dayName: day.dayName, ...m }))
    );

    if (mealsToGenerate.length === 0) {
      toast.info("Tous les repas sont déjà planifiés !");
      return;
    }

    setGenerating(true);
    setProgress({ current: 0, total: mealsToGenerate.length, currentDay: '', currentMeal: '' });

    const updatedPlan = [...weekPlan];

    try {
      for (let i = 0; i < mealsToGenerate.length; i++) {
        const meal = mealsToGenerate[i];
        
        setProgress({
          current: i + 1,
          total: mealsToGenerate.length,
          currentDay: meal.dayName,
          currentMeal: MEAL_LABELS[meal.slot]
        });

        // Determine context for generation
        const isLunchbox = meal.lunchType === 'special_diet' || meal.lunchType === 'school_trip';
        const lunchboxType = meal.lunchType === 'school_trip' ? 'sortie' : 
                           meal.lunchType === 'special_diet' ? 'regime' : undefined;

        const { data, error } = await supabase.functions.invoke("generate-daily-meal", {
          body: {
            childId: selectedChildId,
            mealType: meal.slot,
            date: meal.date,
            context: {
              isLunchbox,
              lunchboxType,
              allergies: child.allergies,
              restrictions: child.restrictions_alimentaires,
              preferences: child.preferences,
              dislikes: child.dislikes,
              availableTime: child.available_time
            }
          },
        });

        if (!error && data?.recipe) {
          // Update the plan state
          const dayIndex = updatedPlan.findIndex(d => d.date === meal.date);
          if (dayIndex !== -1) {
            const mealIndex = updatedPlan[dayIndex].meals.findIndex(m => m.slot === meal.slot);
            if (mealIndex !== -1) {
              updatedPlan[dayIndex].meals[mealIndex] = {
                ...updatedPlan[dayIndex].meals[mealIndex],
                status: 'generated',
                recipeName: data.recipe.name,
                recipeId: data.recipe.id
              };
            }
          }
          setWeekPlan([...updatedPlan]);
        }
      }

      setGenerationComplete(true);
      toast.success("Planning de la semaine généré avec succès !");
    } catch (error) {
      console.error("Error generating week plan:", error);
      toast.error("Erreur lors de la génération du planning");
    } finally {
      setGenerating(false);
      setProgress(null);
    }
  };

  const getMealStatusIcon = (status: string) => {
    switch (status) {
      case 'existing':
        return <CheckCircle2 className="w-4 h-4 text-blue-500" />;
      case 'generated':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'skipped':
        return <XCircle className="w-4 h-4 text-muted-foreground" />;
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-dashed border-muted-foreground" />;
    }
  };

  const getMealStatusBadge = (meal: DayPlan['meals'][0]) => {
    if (meal.status === 'existing') {
      return <Badge variant="secondary" className="text-xs">Déjà planifié</Badge>;
    }
    if (meal.status === 'generated') {
      return <Badge className="text-xs bg-green-500">Généré</Badge>;
    }
    if (meal.status === 'skipped') {
      return <Badge variant="outline" className="text-xs">{meal.skipReason}</Badge>;
    }
    if (meal.lunchType && meal.slot === 'lunch') {
      const config = LUNCH_CONFIGS[meal.lunchType];
      if (meal.lunchType === 'special_diet') {
        return <Badge variant="outline" className="text-xs text-orange-600">Lunchbox perso</Badge>;
      }
      if (meal.lunchType === 'school_trip') {
        return <Badge variant="outline" className="text-xs text-purple-600">Sortie scolaire</Badge>;
      }
    }
    return <Badge variant="outline" className="text-xs">À générer</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const mealsToGenerate = countMealsToGenerate();

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Planning Express</h1>
            <p className="text-sm text-muted-foreground">
              Génération automatique intelligente
            </p>
          </div>
        </div>

        {/* Explanation Card */}
        <Card className="p-4 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
          <div className="flex items-start gap-3 mb-4">
            <Sparkles className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Générez automatiquement les repas de la semaine pour votre enfant.
              </p>
              <p className="text-xs text-muted-foreground">
                Kidboost respecte les repas déjà planifiés, les allergies, les préférences et les lunchbox obligatoires.
              </p>
            </div>
          </div>
        </Card>

        {/* Child Selector */}
        {children.length > 0 && (
          <Card className="p-4">
            <h2 className="font-semibold mb-3">Sélectionner un enfant</h2>
            <div className="flex flex-wrap gap-2">
              {children.map((c) => (
                <Button
                  key={c.id}
                  variant={selectedChildId === c.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleChildSelect(c.id)}
                >
                  {c.name}
                </Button>
              ))}
            </div>
          </Card>
        )}

        {/* Child Info & Warnings */}
        {child && (
          <Card className="p-4 space-y-3">
            <h2 className="font-semibold">Planning pour {child.name}</h2>
            
            <div className="flex flex-wrap gap-2">
              {child.allergies && child.allergies.length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Allergies : {child.allergies.join(", ")}
                </Badge>
              )}
              {child.regime_special && (
                <Badge variant="secondary" className="text-xs">
                  Régime spécial
                </Badge>
              )}
              {child.dejeuner_habituel === 'cantine' && (
                <Badge variant="outline" className="text-xs">
                  Cantine en semaine
                </Badge>
              )}
            </div>

            <div className="text-sm text-muted-foreground">
              Semaine du {format(weekStart, "d MMMM", { locale: fr })} au {format(weekEnd, "d MMMM yyyy", { locale: fr })}
            </div>
          </Card>
        )}

        {/* Generation Progress */}
        {generating && progress && (
          <Card className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Génération en cours...</span>
                <span className="text-sm text-muted-foreground">
                  {progress.current} / {progress.total}
                </span>
              </div>
              <Progress value={(progress.current / progress.total) * 100} />
              <p className="text-xs text-muted-foreground">
                {progress.currentDay} - {progress.currentMeal}
              </p>
            </div>
          </Card>
        )}

        {/* Week Plan Preview */}
        {weekPlan.length > 0 && child && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">Aperçu de la semaine</h2>
              {!generationComplete && mealsToGenerate > 0 && (
                <Badge variant="outline">
                  {mealsToGenerate} repas à générer
                </Badge>
              )}
            </div>
            
            {weekPlan.map((day) => (
              <Card key={day.date} className="p-3">
                <div className="font-semibold text-sm capitalize mb-3 flex items-center justify-between">
                  <span>{day.dayName} {day.dayNumber}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {day.meals.map((meal) => {
                    const Icon = MEAL_ICONS[meal.slot];
                    return (
                      <div 
                        key={meal.slot} 
                        className={`flex items-center gap-2 p-2 rounded-lg ${
                          meal.status === 'generated' 
                            ? 'bg-green-50 dark:bg-green-950/20' 
                            : meal.status === 'existing'
                            ? 'bg-blue-50 dark:bg-blue-950/20'
                            : meal.status === 'skipped'
                            ? 'bg-muted/50'
                            : 'bg-muted/30'
                        }`}
                      >
                        {getMealStatusIcon(meal.status)}
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium">
                            {MEAL_LABELS[meal.slot]}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {meal.recipeName || (meal.status === 'skipped' ? meal.skipReason : 'En attente')}
                          </div>
                        </div>
                        {getMealStatusBadge(meal)}
                      </div>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Generate Button */}
        {child && weekPlan.length > 0 && (
          <div className="sticky bottom-4">
            <Button 
              onClick={handleGenerateWeek} 
              disabled={generating || mealsToGenerate === 0}
              className="w-full shadow-lg"
              size="lg"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Génération en cours...
                </>
              ) : mealsToGenerate === 0 ? (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Semaine complète !
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Planifier {mealsToGenerate} repas automatiquement
                </>
              )}
            </Button>
          </div>
        )}

        {/* Post-Generation Actions */}
        {generationComplete && (
          <Card className="p-4 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">
                  Planning généré avec succès !
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Tous les repas ont été ajoutés au planning.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                onClick={() => navigate(`/planning?childId=${selectedChildId}`)}
                className="flex-1"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Voir le planning
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate("/dashboard")}
                className="flex-1"
              >
                Retour au dashboard
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card>
        )}

        {/* No Children Warning */}
        {!loading && children.length === 0 && (
          <Card className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-semibold mb-2">Aucun profil enfant</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Créez d'abord un profil enfant pour utiliser le Planning Express.
            </p>
            <Button onClick={() => navigate("/children")}>
              Créer un profil enfant
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
