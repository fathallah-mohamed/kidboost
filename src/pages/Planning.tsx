import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSession } from "@supabase/auth-helpers-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Plus, Edit, Check, X, Coffee, Utensils, Cookie, Moon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { MealSlot, MEAL_LABELS, MEAL_ORDER } from "@/lib/meals";

interface PlannedMeal {
  id: string;
  date: string;
  meal_time: string;
  recipe: {
    id: string;
    name: string;
  };
}

const MEAL_ICONS: Record<MealSlot, typeof Coffee> = {
  breakfast: Coffee,
  lunch: Utensils,
  snack: Cookie,
  dinner: Moon,
};

export default function Planning() {
  const navigate = useNavigate();
  const session = useSession();
  const [searchParams] = useSearchParams();
  const childId = searchParams.get("childId");
  
  const [plannedMeals, setPlannedMeals] = useState<PlannedMeal[]>([]);
  const [loading, setLoading] = useState(true);

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    return {
      date: format(date, "yyyy-MM-dd"),
      dayName: format(date, "EEEE", { locale: fr }),
      dayNumber: format(date, "d"),
      isToday: format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd"),
    };
  });

  useEffect(() => {
    const fetchPlannedMeals = async () => {
      if (!session?.user?.id) return;
      
      const startDate = weekDays[0].date;
      const endDate = weekDays[6].date;

      let query = supabase
        .from("meal_plans")
        .select(`
          id,
          date,
          meal_time,
          recipe:recipes(id, name)
        `)
        .eq("profile_id", session.user.id)
        .gte("date", startDate)
        .lte("date", endDate);

      if (childId) {
        query = query.eq("child_id", childId);
      }

      const { data, error } = await query;
      
      if (!error && data) {
        setPlannedMeals(data as any);
      }
      setLoading(false);
    };

    fetchPlannedMeals();
  }, [session?.user?.id, childId]);

  const getMealsForDay = (date: string) => {
    return plannedMeals.filter(meal => meal.date === date);
  };

  const getMealForSlot = (date: string, slot: MealSlot) => {
    const meals = getMealsForDay(date);
    // Handle legacy lunchbox -> lunch conversion
    if (slot === 'lunch') {
      return meals.find(m => m.meal_time === 'lunch' || m.meal_time === 'lunchbox');
    }
    return meals.find(m => m.meal_time === slot);
  };

  const countPlannedMeals = (date: string) => {
    return getMealsForDay(date).length;
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Planification de la semaine</h1>
            <p className="text-sm text-muted-foreground">
              Organisez les 4 repas quotidiens de votre enfant
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Chargement...
          </div>
        ) : (
          <div className="space-y-3">
            {weekDays.map((day) => {
              const plannedCount = countPlannedMeals(day.date);
              const isFullyPlanned = plannedCount >= 4;
              
              return (
                <Card
                  key={day.date}
                  className={`p-4 ${day.isToday ? "ring-2 ring-primary" : ""}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        day.isToday ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}>
                        {day.dayNumber}
                      </div>
                      <div>
                        <span className="font-semibold capitalize">{day.dayName}</span>
                        {day.isToday && (
                          <span className="ml-2 text-xs text-primary">(Aujourd'hui)</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{plannedCount}/4</span>
                      {isFullyPlanned ? (
                        <Check className="w-4 h-4 text-pastel-green" />
                      ) : (
                        <X className="w-4 h-4 text-destructive" />
                      )}
                    </div>
                  </div>

                  {/* Afficher les 4 repas */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {MEAL_ORDER.map((slot) => {
                      const meal = getMealForSlot(day.date, slot);
                      const Icon = MEAL_ICONS[slot];
                      return (
                        <div
                          key={slot}
                          className={`flex items-center gap-2 p-2 rounded-lg text-xs ${
                            meal ? "bg-muted/50" : "bg-muted/20 border border-dashed border-muted"
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${meal ? "text-primary" : "text-muted-foreground"}`} />
                          <span className={`flex-1 truncate ${!meal ? "text-muted-foreground italic" : ""}`}>
                            {meal?.recipe?.name || MEAL_LABELS[slot]}
                          </span>
                          {meal && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0"
                              onClick={() => navigate(`/recipe/${meal.recipe?.id}`)}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/planning/day/${day.date}${childId ? `?childId=${childId}` : ""}`)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Compléter
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/planning/day/${day.date}${childId ? `?childId=${childId}` : ""}`)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Modifier
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
