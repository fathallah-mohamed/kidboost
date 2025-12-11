import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useSession } from "@supabase/auth-helpers-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Sparkles, ChefHat, Save, Coffee, Utensils, Cookie, Moon, Loader2, Ban } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { MealSlot, MEAL_LABELS, MEAL_ORDER, LunchType, determineLunchType, LUNCH_CONFIGS } from "@/lib/meals";

interface PlannedMeal {
  id: string;
  meal_time: string;
  recipe: {
    id: string;
    name: string;
    preparation_time: number;
  };
}

const MEAL_ICONS: Record<MealSlot, typeof Coffee> = {
  breakfast: Coffee,
  lunch: Utensils,
  snack: Cookie,
  dinner: Moon,
};

const MEAL_COLORS: Record<MealSlot, string> = {
  breakfast: "bg-amber-100/50",
  lunch: "bg-emerald-100/50",
  snack: "bg-pastel-yellow/30",
  dinner: "bg-primary/20",
};

export default function DayPlanning() {
  const navigate = useNavigate();
  const { date } = useParams<{ date: string }>();
  const [searchParams] = useSearchParams();
  const childId = searchParams.get("childId");
  const session = useSession();
  
  const [meals, setMeals] = useState<PlannedMeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<MealSlot | null>(null);
  const [lunchType, setLunchType] = useState<LunchType>('home');

  const formattedDate = date ? format(parseISO(date), "EEEE d MMMM", { locale: fr }) : "";

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user?.id || !date) return;
      
      // Fetch child config for lunch type
      if (childId) {
        const { data: childData } = await supabase
          .from("children_profiles")
          .select("allergies")
          .eq("id", childId)
          .single();
        
        if (childData) {
          const hasSpecialDiet = Boolean(childData.allergies && childData.allergies.length > 0);
          const determinedLunchType = determineLunchType({
            hasSpecialDiet,
            hasSchoolTripToday: false, // TODO: implement calendar
            eatsAtCanteen: false, // TODO: implement settings
          });
          setLunchType(determinedLunchType);
        }
      }
      
      // Fetch meals
      let query = supabase
        .from("meal_plans")
        .select(`
          id,
          meal_time,
          recipe:recipes(id, name, preparation_time)
        `)
        .eq("profile_id", session.user.id)
        .eq("date", date);

      if (childId) {
        query = query.eq("child_id", childId);
      }

      const { data, error } = await query;
      
      if (!error && data) {
        setMeals(data as any);
      }
      setLoading(false);
    };

    fetchData();
  }, [session?.user?.id, date, childId]);

  const handleGenerateMeal = async (mealSlot: MealSlot) => {
    if (!session?.user?.id || !childId || !date) {
      toast.error("Informations manquantes");
      return;
    }

    setGenerating(mealSlot);

    try {
      const { data, error } = await supabase.functions.invoke("generate-daily-meal", {
        body: {
          childId,
          mealType: mealSlot,
          date,
        },
      });

      if (error) throw error;

      // Refresh meals
      const { data: updatedMeals } = await supabase
        .from("meal_plans")
        .select(`
          id,
          meal_time,
          recipe:recipes(id, name, preparation_time)
        `)
        .eq("profile_id", session.user.id)
        .eq("date", date);

      if (updatedMeals) {
        setMeals(updatedMeals as any);
      }

      toast.success("Recette générée et ajoutée !");
    } catch (error) {
      console.error("Error generating meal:", error);
      toast.error("Erreur lors de la génération");
    } finally {
      setGenerating(null);
    }
  };

  const getMealForSlot = (slot: MealSlot) => {
    // Handle legacy lunchbox -> lunch conversion
    if (slot === 'lunch') {
      return meals.find(m => m.meal_time === 'lunch' || m.meal_time === 'lunchbox');
    }
    return meals.find(m => m.meal_time === slot);
  };

  const canGenerateForSlot = (slot: MealSlot): boolean => {
    if (slot === 'lunch') {
      return LUNCH_CONFIGS[lunchType].canGenerate;
    }
    return true;
  };

  const getLabelForSlot = (slot: MealSlot): string => {
    if (slot === 'lunch') {
      return LUNCH_CONFIGS[lunchType].label;
    }
    return MEAL_LABELS[slot];
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-lg mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/planning")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Planification</h1>
            <p className="text-sm text-muted-foreground capitalize">{formattedDate}</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Chargement...
          </div>
        ) : (
          <div className="space-y-3">
            {MEAL_ORDER.map((slot) => {
              const meal = getMealForSlot(slot);
              const Icon = MEAL_ICONS[slot];
              const isGenerating = generating === slot;
              const canGenerate = canGenerateForSlot(slot);
              const label = getLabelForSlot(slot);

              return (
                <Card key={slot} className={`p-4 ${MEAL_COLORS[slot]}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <Icon className="w-5 h-5" />
                    <span className="font-semibold">{label}</span>
                    {!canGenerate && (
                      <span className="text-xs text-muted-foreground ml-auto">
                        Aucune action requise
                      </span>
                    )}
                  </div>

                  {!canGenerate ? (
                    <div className="p-3 bg-background/50 rounded-lg flex items-center gap-2">
                      <Ban className="w-4 h-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground italic">
                        {LUNCH_CONFIGS[lunchType].description}
                      </p>
                    </div>
                  ) : meal ? (
                    <div className="p-3 bg-background/80 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{meal.recipe?.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {meal.recipe?.preparation_time} min de préparation
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/recipe/${meal.recipe?.id}`)}
                        >
                          Voir
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mb-3">
                      Aucun repas planifié
                    </p>
                  )}

                  {canGenerate && (
                    <div className="flex gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => navigate(`/recipes?select=true&date=${date}&mealType=${slot}`)}
                      >
                        <ChefHat className="w-4 h-4 mr-1" />
                        Mes recettes
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        disabled={isGenerating}
                        onClick={() => handleGenerateMeal(slot)}
                      >
                        {isGenerating ? (
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4 mr-1" />
                        )}
                        IA
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        <Button
          className="w-full"
          onClick={() => {
            toast.success("Planning enregistré");
            navigate("/planning");
          }}
        >
          <Save className="w-4 h-4 mr-2" />
          Enregistrer pour ce jour
        </Button>
      </div>
    </div>
  );
}
