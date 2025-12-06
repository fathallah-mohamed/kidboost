import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useSession } from "@supabase/auth-helpers-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Plus, Sparkles, ChefHat, Save, Cookie, Utensils, Sandwich, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

interface PlannedMeal {
  id: string;
  meal_time: string;
  recipe: {
    id: string;
    name: string;
    preparation_time: number;
  };
}

export default function DayPlanning() {
  const navigate = useNavigate();
  const { date } = useParams<{ date: string }>();
  const [searchParams] = useSearchParams();
  const childId = searchParams.get("childId");
  const session = useSession();
  
  const [meals, setMeals] = useState<PlannedMeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);

  const formattedDate = date ? format(parseISO(date), "EEEE d MMMM", { locale: fr }) : "";

  useEffect(() => {
    const fetchMeals = async () => {
      if (!session?.user?.id || !date) return;
      
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

    fetchMeals();
  }, [session?.user?.id, date, childId]);

  const handleGenerateMeal = async (mealType: string) => {
    if (!session?.user?.id || !childId || !date) {
      toast.error("Informations manquantes");
      return;
    }

    setGenerating(mealType);

    try {
      const { data, error } = await supabase.functions.invoke("generate-daily-meal", {
        body: {
          childId,
          mealType,
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

  const mealTypes = [
    { type: "snack", label: "Goûter", icon: Cookie, color: "bg-pastel-yellow/30" },
    { type: "dinner", label: "Repas du soir", icon: Utensils, color: "bg-primary/20" },
    { type: "lunchbox", label: "Lunchbox", icon: Sandwich, color: "bg-pastel-green/30" },
  ];

  const getMealForType = (type: string) => meals.find(m => m.meal_time === type);

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
            {mealTypes.map((mealType) => {
              const meal = getMealForType(mealType.type);
              const Icon = mealType.icon;
              const isGenerating = generating === mealType.type;

              return (
                <Card key={mealType.type} className={`p-4 ${mealType.color}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <Icon className="w-5 h-5" />
                    <span className="font-semibold">{mealType.label}</span>
                  </div>

                  {meal ? (
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
                          onClick={() => navigate(`/dashboard/recipe/${meal.recipe?.id}`)}
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

                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/recipes?select=true&date=${date}&mealType=${mealType.type}`)}
                    >
                      <ChefHat className="w-4 h-4 mr-1" />
                      Mes recettes
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      disabled={isGenerating}
                      onClick={() => handleGenerateMeal(mealType.type)}
                    >
                      {isGenerating ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4 mr-1" />
                      )}
                      IA
                    </Button>
                  </div>
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
