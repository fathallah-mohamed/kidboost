import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSession } from "@supabase/auth-helpers-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Settings, Calendar, AlertCircle, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { MealOptionCard, MealOptionType, MEAL_OPTIONS } from "@/components/generate-meal/MealOptionCard";
import { GenerateMealDialog } from "@/components/generate-meal/GenerateMealDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GlobalChildSelector } from "@/components/common/GlobalChildSelector";
import { useChild, calculateAge } from "@/contexts/ChildContext";

interface ParentPreferences {
  style_cuisine: string[];
  difficulte: string;
  allergenes_famille: string[];
  materiel_maison: string[];
}

export default function GenerateMeal() {
  const navigate = useNavigate();
  const session = useSession();
  const [searchParams] = useSearchParams();
  const { selectedChild } = useChild();
  
  const dateParam = searchParams.get("date") || format(new Date(), "yyyy-MM-dd");
  const mealTypeParam = searchParams.get("mealType");
  const fromParam = searchParams.get("from"); // 'planning' or 'dashboard'
  
  const [parentPreferences, setParentPreferences] = useState<ParentPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<MealOptionType | null>(null);

  const selectedDate = useMemo(() => {
    try {
      return parseISO(dateParam);
    } catch {
      return new Date();
    }
  }, [dateParam]);

  const formattedDate = format(selectedDate, "EEEE d MMMM yyyy", { locale: fr });

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }

      try {
        // Fetch parent preferences
        const { data: profileData } = await supabase
          .from("profiles")
          .select("preferences_parent")
          .eq("id", session.user.id)
          .single();

        if (profileData?.preferences_parent) {
          setParentPreferences(profileData.preferences_parent as unknown as ParentPreferences);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session?.user?.id]);

  // Auto-open dialog if mealType is provided in URL
  useEffect(() => {
    if (mealTypeParam && selectedChild) {
      const validTypes: MealOptionType[] = ['breakfast', 'lunch', 'snack', 'dinner', 'lunchbox_special', 'lunchbox_trip'];
      if (validTypes.includes(mealTypeParam as MealOptionType)) {
        setSelectedMealType(mealTypeParam as MealOptionType);
        setDialogOpen(true);
      }
    }
  }, [mealTypeParam, selectedChild]);

  // Calculate which meals are available based on child's config
  const availableMeals = useMemo((): MealOptionType[] => {
    if (!selectedChild) return [];

    const meals: MealOptionType[] = ['breakfast', 'snack', 'dinner'];
    
    const schoolTripDates = selectedChild.sortie_scolaire_dates || [];
    const hasSchoolTripToday = schoolTripDates.some((tripDate) => {
      try {
        return isSameDay(parseISO(tripDate), selectedDate);
      } catch {
        return false;
      }
    });

    const hasSpecialDiet = selectedChild.regime_special || false;
    const eatsAtCanteen = selectedChild.dejeuner_habituel === "cantine";

    // Logic for lunch/lunchbox
    if (hasSchoolTripToday) {
      // School trip -> only lunchbox_trip for lunch
      meals.push('lunchbox_trip');
    } else if (hasSpecialDiet) {
      // Special diet -> lunchbox_special
      meals.push('lunchbox_special');
    } else if (!eatsAtCanteen) {
      // Home lunch -> regular lunch
      meals.push('lunch');
    }
    // If eats at canteen and no special conditions -> no lunch option (handled by canteen)

    return meals;
  }, [selectedChild, selectedDate]);

  const handleMealClick = (mealType: MealOptionType) => {
    setSelectedMealType(mealType);
    setDialogOpen(true);
  };

  const handleSuccess = () => {
    // Navigate back based on origin
    if (fromParam === 'planning') {
      navigate(`/planning`);
    } else {
      navigate('/dashboard');
    }
  };

  const handleBack = () => {
    if (fromParam === 'planning') {
      navigate(`/planning`);
    } else {
      navigate('/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!selectedChild) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-lg mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">Générer un repas</h1>
          </div>

          <Card className="p-4">
            <p className="text-sm text-muted-foreground mb-3">Sélectionnez un enfant pour continuer :</p>
            <GlobalChildSelector variant="default" />
          </Card>
        </div>
      </div>
    );
  }

  // Check if it's a canteen day with no special conditions
  const isCanteenOnlyDay = 
    selectedChild.dejeuner_habituel === "cantine" && 
    !selectedChild.regime_special && 
    !(selectedChild.sortie_scolaire_dates || []).some((d) => {
      try { return isSameDay(parseISO(d), selectedDate); } catch { return false; }
    });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Générer un repas</h1>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => navigate("/profile-settings")}>
            <Settings className="w-5 h-5" />
          </Button>
        </div>

        {/* Global Child Selector */}
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Générer pour :</span>
            </div>
            <GlobalChildSelector variant="compact" showLabel={false} />
          </div>
        </Card>

        {/* Date display */}
        <Card className="p-4 bg-muted/30">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-primary" />
            <div>
              <p className="font-medium capitalize">{formattedDate}</p>
              <p className="text-sm text-muted-foreground">
                {isSameDay(selectedDate, new Date()) ? "Aujourd'hui" : "Jour sélectionné"}
              </p>
            </div>
          </div>
        </Card>

        {/* Canteen info if applicable */}
        {isCanteenOnlyDay && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {selectedChild.name} mange à la cantine ce jour. Seuls le petit-déjeuner, le goûter et le dîner peuvent être planifiés.
            </AlertDescription>
          </Alert>
        )}

        {/* Meal options */}
        <div className="space-y-3">
          <h2 className="font-semibold text-lg">Quel repas souhaitez-vous générer ?</h2>
          
          {availableMeals.map((mealType) => {
            const option = MEAL_OPTIONS[mealType];
            return (
              <MealOptionCard
                key={mealType}
                option={{ type: mealType, ...option }}
                onClick={() => handleMealClick(mealType)}
              />
            );
          })}
        </div>

        {/* Info about child preferences */}
        {(selectedChild.allergies?.length > 0 || selectedChild.restrictions_alimentaires?.length > 0) && (
          <Card className="p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
            <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
              ⚠️ Restrictions actives pour {selectedChild.name}
            </p>
            <div className="mt-2 text-sm text-amber-600 dark:text-amber-400 space-y-1">
              {selectedChild.allergies?.length > 0 && (
                <p>Allergies : {selectedChild.allergies.join(", ")}</p>
              )}
              {selectedChild.restrictions_alimentaires?.length > 0 && (
                <p>Restrictions : {selectedChild.restrictions_alimentaires.join(", ")}</p>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Generate dialog */}
      {session?.user?.id && (
        <GenerateMealDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          mealType={selectedMealType}
          date={dateParam}
          userId={session.user.id}
          childId={selectedChild.id}
          childName={selectedChild.name}
          childProfile={{
            allergies: selectedChild.allergies || [],
            restrictions: [
              ...(selectedChild.restrictions_alimentaires || []),
              ...(selectedChild.aliments_interdits || []),
            ],
            preferences: [
              ...(selectedChild.aliments_preferes || []),
              ...(selectedChild.preferences_gout || []),
            ],
            availableTime: selectedChild.available_time || 20,
            equipment: selectedChild.materiel_disponible || [],
          }}
          parentPreferences={parentPreferences ? {
            style: parentPreferences.style_cuisine || [],
            difficulty: parentPreferences.difficulte || "facile",
            allergens: parentPreferences.allergenes_famille || [],
            equipment: parentPreferences.materiel_maison || [],
          } : null}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
