import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSession } from "@supabase/auth-helpers-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Sparkles, Calendar, Check, Loader2, Cookie, Utensils, Sandwich } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, startOfWeek, addDays } from "date-fns";
import { fr } from "date-fns/locale";

interface DayPlan {
  date: string;
  snack?: { name: string; id: string };
  dinner?: { name: string; id: string };
  lunchbox?: { name: string; id: string };
}

export default function PlanningExpress() {
  const navigate = useNavigate();
  const session = useSession();
  const [searchParams] = useSearchParams();
  const childId = searchParams.get("childId");
  
  const [generating, setGenerating] = useState(false);
  const [weekPlan, setWeekPlan] = useState<DayPlan[]>([]);

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    return {
      date: format(date, "yyyy-MM-dd"),
      dayName: format(date, "EEEE", { locale: fr }),
      dayNumber: format(date, "d MMMM", { locale: fr }),
    };
  });

  const handleGenerateWeek = async () => {
    if (!session?.user?.id || !childId) {
      toast.error("Veuillez sélectionner un enfant");
      return;
    }

    setGenerating(true);
    const newPlan: DayPlan[] = [];

    try {
      for (const day of weekDays) {
        for (const mealType of ["snack", "dinner"] as const) {
          const { data, error } = await supabase.functions.invoke("generate-daily-meal", {
            body: {
              childId,
              mealType,
              date: day.date,
            },
          });

          if (!error && data?.recipe) {
            const existingDay = newPlan.find(d => d.date === day.date);
            if (existingDay) {
              existingDay[mealType] = { name: data.recipe.name, id: data.recipe.id };
            } else {
              newPlan.push({
                date: day.date,
                [mealType]: { name: data.recipe.name, id: data.recipe.id },
              });
            }
          }
        }
      }

      setWeekPlan(newPlan);
      toast.success("Planning de la semaine généré avec succès !");
    } catch (error) {
      console.error("Error generating week plan:", error);
      toast.error("Erreur lors de la génération du planning");
    } finally {
      setGenerating(false);
    }
  };

  const getDayPlan = (date: string) => weekPlan.find(d => d.date === date);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Planning Express</h1>
            <p className="text-sm text-muted-foreground">
              L'IA planifie votre semaine en un clic
            </p>
          </div>
        </div>

        <Card className="p-4 bg-gradient-to-br from-primary/10 to-accent/10">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-6 h-6 text-primary" />
            <p className="text-sm">
              Générez automatiquement les goûters et repas du soir pour toute la semaine,
              adaptés aux préférences et allergies de votre enfant.
            </p>
          </div>
          <Button 
            onClick={handleGenerateWeek} 
            disabled={generating}
            className="w-full"
            size="lg"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <Calendar className="w-5 h-5 mr-2" />
                Générer mon planning complet
              </>
            )}
          </Button>
        </Card>

        {weekPlan.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Check className="w-5 h-5 text-pastel-green" />
              Aperçu de la semaine
            </h2>
            
            {weekDays.map((day) => {
              const plan = getDayPlan(day.date);
              return (
                <Card key={day.date} className="p-3">
                  <div className="font-semibold text-sm capitalize mb-2">
                    {day.dayName} {day.dayNumber}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 text-xs">
                      <Cookie className="w-4 h-4 text-pastel-yellow-foreground" />
                      <span className={plan?.snack ? "" : "text-muted-foreground"}>
                        {plan?.snack?.name || "Non planifié"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Utensils className="w-4 h-4 text-primary" />
                      <span className={plan?.dinner ? "" : "text-muted-foreground"}>
                        {plan?.dinner?.name || "Non planifié"}
                      </span>
                    </div>
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
