import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSession } from "@supabase/auth-helpers-react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronLeft, ChevronRight, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, endOfWeek, addWeeks, addDays, isSameDay, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { MealSlot, LunchType, determineLunchType, ChildMealConfig } from "@/lib/meals";
import { WeeklyPlanningGrid } from "@/components/planning/WeeklyPlanningGrid";
import { ChildSelector } from "@/components/planning/ChildSelector";
import { AddRecipeDialog } from "@/components/planning/AddRecipeDialog";
import { toast } from "sonner";

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

interface Child {
  id: string;
  name: string;
  birth_date: string;
  regime_special: boolean;
  dejeuner_habituel: string;
  sortie_scolaire_dates: string[];
}

interface DayLunchConfig {
  date: string;
  lunchType: LunchType;
  label: string;
  canGenerate: boolean;
  isLunchbox: boolean;
}

export default function Planning() {
  const navigate = useNavigate();
  const session = useSession();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [currentWeekStart, setCurrentWeekStart] = useState(() => 
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [plannedMeals, setPlannedMeals] = useState<PlannedMeal[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<MealSlot | null>(null);

  // Generate week days
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(currentWeekStart, i);
    return {
      date,
      dateString: format(date, "yyyy-MM-dd"),
      dayName: format(date, "EEEE", { locale: fr }),
      dayNumber: format(date, "d"),
      isToday: isSameDay(date, new Date()),
    };
  });

  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
  const weekLabel = `${format(currentWeekStart, "d MMM", { locale: fr })} au ${format(weekEnd, "d MMM yyyy", { locale: fr })}`;

  // Calculate lunch configs for each day
  const calculateLunchConfigs = useCallback((): DayLunchConfig[] => {
    if (!selectedChild) return [];

    return weekDays.map((day) => {
      const schoolTripDates = selectedChild.sortie_scolaire_dates || [];
      const hasSchoolTripToday = schoolTripDates.some((tripDate) => {
        try {
          return isSameDay(parseISO(tripDate), day.date);
        } catch {
          return false;
        }
      });

      const config: ChildMealConfig = {
        hasSpecialDiet: selectedChild.regime_special || false,
        hasSchoolTripToday,
        eatsAtCanteen: selectedChild.dejeuner_habituel === "cantine",
      };

      const lunchType = determineLunchType(config);
      
      const lunchLabels: Record<LunchType, string> = {
        school_trip: "Lunchbox sortie",
        special_diet: "Lunchbox personnalisée",
        canteen: "Cantine",
        home: "Déjeuner maison",
      };

      return {
        date: day.dateString,
        lunchType,
        label: lunchLabels[lunchType],
        canGenerate: lunchType !== "canteen",
        isLunchbox: lunchType === "school_trip" || lunchType === "special_diet",
      };
    });
  }, [selectedChild, weekDays]);

  const lunchConfigs = calculateLunchConfigs();

  // Fetch planned meals
  useEffect(() => {
    const fetchPlannedMeals = async () => {
      if (!session?.user?.id || !selectedChild) {
        setPlannedMeals([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const startDate = format(currentWeekStart, "yyyy-MM-dd");
      const endDate = format(weekEnd, "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("meal_plans")
        .select(`
          id,
          date,
          meal_time,
          recipe:recipes(id, name, preparation_time)
        `)
        .eq("profile_id", session.user.id)
        .eq("child_id", selectedChild.id)
        .gte("date", startDate)
        .lte("date", endDate);

      if (!error && data) {
        setPlannedMeals(data as PlannedMeal[]);
      }
      setLoading(false);
    };

    fetchPlannedMeals();
  }, [session?.user?.id, selectedChild?.id, currentWeekStart]);

  // Handle child selection
  const handleSelectChild = useCallback((child: Child | null) => {
    setSelectedChild(child);
    if (child) {
      setSearchParams({ childId: child.id });
    }
  }, [setSearchParams]);

  // Navigation
  const goToPreviousWeek = () => setCurrentWeekStart((prev) => addWeeks(prev, -1));
  const goToNextWeek = () => setCurrentWeekStart((prev) => addWeeks(prev, 1));
  const goToCurrentWeek = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  // Recipe actions
  const handleAddRecipe = (date: string, slot: MealSlot) => {
    setSelectedDate(date);
    setSelectedSlot(slot);
    setDialogOpen(true);
  };

  const handleViewRecipe = (recipeId: string) => {
    navigate(`/recipe/${recipeId}`);
  };

  const handleEditRecipe = (date: string, slot: MealSlot, mealId: string) => {
    setSelectedDate(date);
    setSelectedSlot(slot);
    setDialogOpen(true);
  };

  const handleDeleteRecipe = async (mealId: string) => {
    try {
      const { error } = await supabase
        .from("meal_plans")
        .delete()
        .eq("id", mealId);

      if (error) throw error;

      setPlannedMeals((prev) => prev.filter((meal) => meal.id !== mealId));
      toast.success("Recette supprimée du planning");
    } catch (error) {
      console.error("Error deleting meal:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleSelectRecipe = async (recipe: { id: string; name: string; preparation_time: number }) => {
    if (!session?.user?.id || !selectedChild || !selectedDate || !selectedSlot) return;

    try {
      // Check if there's already a meal for this slot
      const existingMeal = plannedMeals.find(
        (meal) => meal.date === selectedDate && (meal.meal_time === selectedSlot || (selectedSlot === 'lunch' && meal.meal_time === 'lunchbox'))
      );

      if (existingMeal) {
        // Update existing
        const { error } = await supabase
          .from("meal_plans")
          .update({ recipe_id: recipe.id })
          .eq("id", existingMeal.id);

        if (error) throw error;

        setPlannedMeals((prev) =>
          prev.map((meal) =>
            meal.id === existingMeal.id
              ? { ...meal, recipe: { id: recipe.id, name: recipe.name, preparation_time: recipe.preparation_time } }
              : meal
          )
        );
      } else {
        // Insert new
        const { data, error } = await supabase
          .from("meal_plans")
          .insert({
            profile_id: session.user.id,
            child_id: selectedChild.id,
            date: selectedDate,
            meal_time: selectedSlot,
            recipe_id: recipe.id,
          })
          .select(`
            id,
            date,
            meal_time,
            recipe:recipes(id, name, preparation_time)
          `)
          .single();

        if (error) throw error;

        if (data) {
          setPlannedMeals((prev) => [...prev, data as PlannedMeal]);
        }
      }

      toast.success("Recette ajoutée au planning");
    } catch (error) {
      console.error("Error adding recipe:", error);
      toast.error("Erreur lors de l'ajout de la recette");
    }
  };

  const handleGenerateRecipe = () => {
    if (selectedChild && selectedSlot) {
      navigate(`/generate-meal?childId=${selectedChild.id}&mealType=${selectedSlot}&date=${selectedDate}`);
    }
  };

  const childIdFromParams = searchParams.get("childId");

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Planning de la semaine</h1>
              <p className="text-sm text-muted-foreground">
                Gérez les 4 repas quotidiens de votre enfant
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => navigate("/profile-settings")}>
            <Settings className="w-5 h-5" />
          </Button>
        </div>

        {/* Child selector */}
        {session?.user?.id && (
          <ChildSelector
            userId={session.user.id}
            selectedChildId={selectedChild?.id || childIdFromParams}
            onSelectChild={handleSelectChild}
          />
        )}

        {/* Week navigation */}
        <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
          <Button variant="ghost" size="icon" onClick={goToPreviousWeek}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="text-center">
            <button
              onClick={goToCurrentWeek}
              className="font-semibold hover:text-primary transition-colors"
            >
              Semaine du {weekLabel}
            </button>
            {selectedChild && (
              <p className="text-sm text-muted-foreground">
                Planning pour {selectedChild.name}
              </p>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={goToNextWeek}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Weekly grid */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Chargement...</div>
        ) : !selectedChild ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              Sélectionnez un enfant pour voir son planning
            </p>
            <Button variant="outline" onClick={() => navigate("/profile-settings")}>
              <Settings className="w-4 h-4 mr-2" />
              Configurer les enfants
            </Button>
          </div>
        ) : (
          <WeeklyPlanningGrid
            weekDays={weekDays}
            plannedMeals={plannedMeals}
            lunchConfigs={lunchConfigs}
            onAddRecipe={handleAddRecipe}
            onViewRecipe={handleViewRecipe}
            onEditRecipe={handleEditRecipe}
            onDeleteRecipe={handleDeleteRecipe}
          />
        )}

        {/* Add Recipe Dialog */}
        {session?.user?.id && (
          <AddRecipeDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            date={selectedDate}
            slot={selectedSlot}
            userId={session.user.id}
            childId={selectedChild?.id || null}
            onSelectRecipe={handleSelectRecipe}
            onGenerateRecipe={handleGenerateRecipe}
          />
        )}
      </div>
    </div>
  );
}
