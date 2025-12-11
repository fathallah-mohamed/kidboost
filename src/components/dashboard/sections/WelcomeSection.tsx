import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuickPlan } from "../meal-planner/hooks/useQuickPlan";
import { useDashboardData } from "../hooks/useDashboardData";
import { TodayMeals } from "./TodayMeals";
import { TodoNow } from "./TodoNow";
import { WeekProgress } from "./WeekProgress";
import { CompactActionCards } from "./CompactActionCards";
import { MiniCalendar } from "./MiniCalendar";
import { NutritionBalance } from "./NutritionBalance";
import { QuickStartGuide } from "./QuickStartGuide";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MealSlot, LunchType } from "@/lib/meals";
import { Users, Settings, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GlobalChildSelector } from "@/components/common/GlobalChildSelector";
import { useChild, calculateAge } from "@/contexts/ChildContext";
import { format } from "date-fns";

interface MealData {
  name: string | null;
  prepTime?: number;
  recipeId?: string;
  difficulty?: string;
}

interface WelcomeSectionProps {
  userId: string;
  onSectionChange: (section: string) => void;
}

export const WelcomeSection = ({ userId, onSectionChange }: WelcomeSectionProps) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState<string>("");
  const [showChildSelector, setShowChildSelector] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Use global child context
  const { children, selectedChild, setSelectedChild, loading: childrenLoading } = useChild();
  
  const [dashboardData, setDashboardData] = useState<{
    todayMeals: {
      breakfast: MealData;
      lunch: MealData;
      snack: MealData;
      dinner: MealData;
    };
    lunchType: LunchType;
    plannedDays: string[];
    stats: {
      recipesReady: number;
      totalRecipes: number;
      daysPlanned: number;
      totalDays: number;
      shoppingListReady: boolean;
      mealsToplan: number;
    };
    nutrition: { vegetables: number; proteins: number; starches: number; dairy: number };
  }>({
    todayMeals: {
      breakfast: { name: null },
      lunch: { name: null },
      snack: { name: null },
      dinner: { name: null },
    },
    lunchType: 'home',
    plannedDays: [],
    stats: {
      recipesReady: 0,
      totalRecipes: 7,
      daysPlanned: 0,
      totalDays: 7,
      shoppingListReady: false,
      mealsToplan: 28,
    },
    nutrition: { vegetables: 25, proteins: 25, starches: 30, dairy: 20 },
  });

  const { generateQuickPlan, loading: quickPlanLoading } = useQuickPlan(userId);
  const { fetchDashboardData, generateMeal, generating } = useDashboardData(userId);

  // Check if child has special diet from profile settings
  const hasSpecialDiet = selectedChild?.regime_special || false;

  // Fetch username on mount
  useEffect(() => {
    const fetchUsername = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUsername(user.email.split("@")[0]);
      }
    };
    fetchUsername();
  }, []);

  // Fetch dashboard data when child or date changes
  const refreshDashboard = useCallback(async () => {
    if (!selectedChild) return;
    
    const data = await fetchDashboardData(selectedChild, format(selectedDate, "yyyy-MM-dd"));
    
    // Calculate meals to plan (4 meals per day * 7 days - planned meals)
    const plannedMealsCount = data.stats.recipesReady;
    const totalMealsWeek = 28; // 4 meals * 7 days
    
    setDashboardData({
      ...data,
      stats: {
        ...data.stats,
        mealsToplan: totalMealsWeek - plannedMealsCount,
      },
    });
  }, [selectedChild, selectedDate, fetchDashboardData]);

  useEffect(() => {
    refreshDashboard();
  }, [refreshDashboard]);

  // Auto-refresh at midnight
  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    const timer = setTimeout(() => {
      setSelectedDate(new Date());
      refreshDashboard();
    }, msUntilMidnight);

    return () => clearTimeout(timer);
  }, [refreshDashboard]);

  const handleActionSelect = async (action: string) => {
    if (action === "quick-plan") {
      navigate(`/planning-express${selectedChild ? `?childId=${selectedChild.id}` : ""}`);
    } else if (action === "recipes") {
      navigate("/recipes");
    } else if (action === "planner") {
      navigate(`/planning${selectedChild ? `?childId=${selectedChild.id}` : ""}`);
    } else if (action === "shopping") {
      navigate("/shopping-list");
    } else {
      onSectionChange(action);
    }
  };

  const handleDayClick = (date: string) => {
    navigate(`/planning/day/${date}${selectedChild ? `?childId=${selectedChild.id}` : ""}`);
  };

  const handleViewRecipe = (slot: MealSlot) => {
    const meal = dashboardData.todayMeals[slot];
    if (meal?.recipeId) {
      navigate(`/recipe/${meal.recipeId}`);
    }
  };

  const handleEditRecipe = (slot: MealSlot) => {
    const meal = dashboardData.todayMeals[slot];
    if (meal?.recipeId) {
      navigate(`/recipe/${meal.recipeId}?edit=true`);
    }
  };

  const handleAddRecipe = (slot: MealSlot) => {
    navigate(`/recipes?mealType=${slot}`);
  };

  const handleReplaceRecipe = async (slot: MealSlot) => {
    if (!selectedChild) return;
    
    const newMeal = await generateMeal(selectedChild, slot, format(selectedDate, "yyyy-MM-dd"));
    
    if (newMeal) {
      setDashboardData(prev => ({
        ...prev,
        todayMeals: {
          ...prev.todayMeals,
          [slot]: newMeal,
        },
      }));
    }
  };

  const handleDeleteRecipe = async (slot: MealSlot) => {
    if (!selectedChild) return;
    
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    
    // Delete from meal_plans
    await supabase
      .from('meal_plans')
      .delete()
      .eq('profile_id', userId)
      .eq('child_id', selectedChild.id)
      .eq('date', dateStr)
      .eq('meal_time', slot);

    // Update local state
    setDashboardData(prev => ({
      ...prev,
      todayMeals: {
        ...prev.todayMeals,
        [slot]: { name: null },
      },
    }));
  };

  const handleAddToList = async (slot: MealSlot) => {
    const meal = dashboardData.todayMeals[slot];
    if (!meal?.recipeId) return;

    // Get recipe ingredients
    const { data: recipe } = await supabase
      .from('recipes')
      .select('ingredients')
      .eq('id', meal.recipeId)
      .single();

    if (!recipe?.ingredients) return;

    // Get or create shopping list
    const { data: existingList } = await supabase
      .from('shopping_lists')
      .select('id, items')
      .eq('profile_id', userId)
      .maybeSingle();

    const currentItems = Array.isArray(existingList?.items) ? existingList.items : [];
    const ingredientsArray = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
    const newItems = [...currentItems, ...ingredientsArray];

    if (existingList) {
      await supabase
        .from('shopping_lists')
        .update({ items: newItems })
        .eq('id', existingList.id);
    } else {
      await supabase
        .from('shopping_lists')
        .insert({ profile_id: userId, items: newItems });
    }

    setDashboardData(prev => ({
      ...prev,
      stats: { ...prev.stats, shoppingListReady: true },
    }));
  };

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  // Show loading state
  if (childrenLoading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="h-40 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  // Show QuickStartGuide if no children
  if (children.length === 0) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="space-y-1">
          <h1 className="text-lg md:text-xl font-bold leading-tight">
            Bonjour {username || "Parent"} 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            Commencez par créer le profil de votre enfant pour personnaliser Kidboost.
          </p>
        </div>
        <QuickStartGuide onSelectStep={onSectionChange} />
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-fade-in pb-4">
      {/* Header: Welcome + Child Selector */}
      <div className="space-y-2">
        <div>
          <h1 className="text-lg md:text-xl font-bold leading-tight">
            Bonjour {username || "Parent"} 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            Voici ce que Kidboost a préparé pour votre famille aujourd'hui.
          </p>
        </div>

        {/* Global Child Selector + Voir fiche */}
        {children.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <GlobalChildSelector />
            
            {/* Voir fiche enfant button */}
            {selectedChild && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                onClick={() => navigate(`/profile-settings?childId=${selectedChild.id}`)}
              >
                <User className="w-3.5 h-3.5" />
                Voir fiche enfant
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Today's Meals - 4 repas fixes */}
      {selectedChild && (
        <TodayMeals
          childName={selectedChild.name}
          meals={dashboardData.todayMeals}
          lunchType={dashboardData.lunchType}
          hasSpecialDiet={hasSpecialDiet}
          generating={generating}
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
          onViewRecipe={handleViewRecipe}
          onReplaceRecipe={handleReplaceRecipe}
          onAddToList={handleAddToList}
          onEditRecipe={handleEditRecipe}
          onAddRecipe={handleAddRecipe}
          onDeleteRecipe={handleDeleteRecipe}
        />
      )}

      {/* Manage Children & Preferences Card */}
      <Card className="p-3 bg-gradient-to-br from-secondary/30 to-secondary/10 border-secondary/40">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-secondary/50 rounded-lg">
            <Users className="w-5 h-5 text-secondary-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm">Gérer les enfants & préférences</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Modifiez les informations, allergies, préférences alimentaires, repas habituels et réglages de votre famille.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={() => navigate("/profile-settings")}
          >
            <Settings className="w-3.5 h-3.5" />
            Gérer
          </Button>
        </div>
      </Card>

      {/* Compact Quick Actions */}
      <CompactActionCards onSelectAction={handleActionSelect} loading={quickPlanLoading} />

      {/* Todo Now - with real data */}
      <TodoNow
        recipesReady={dashboardData.stats.recipesReady}
        totalRecipes={dashboardData.stats.totalRecipes}
        daysPlanned={dashboardData.stats.daysPlanned}
        totalDays={dashboardData.stats.totalDays}
        shoppingListReady={dashboardData.stats.shoppingListReady}
        mealsToplan={dashboardData.stats.mealsToplan}
        onAction={onSectionChange}
      />

      {/* Two columns: Calendar + Nutrition */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <MiniCalendar
          plannedDays={dashboardData.plannedDays}
          onDayClick={handleDayClick}
          onViewFull={() => navigate("/planning")}
        />
        <NutritionBalance
          vegetables={dashboardData.nutrition.vegetables}
          proteins={dashboardData.nutrition.proteins}
          starches={dashboardData.nutrition.starches}
          dairy={dashboardData.nutrition.dairy}
        />
      </div>

      {/* Week Progress - with real data */}
      <WeekProgress
        recipesReady={dashboardData.stats.recipesReady}
        totalRecipes={dashboardData.stats.totalRecipes}
        daysPlanned={dashboardData.stats.daysPlanned}
        totalDays={dashboardData.stats.totalDays}
        shoppingListReady={dashboardData.stats.shoppingListReady}
      />

      {/* Child Selector Dialog */}
      <Dialog open={showChildSelector} onOpenChange={setShowChildSelector}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Changer d'enfant</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {children.map((child) => (
              <Button
                key={child.id}
                variant={selectedChild?.id === child.id ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => {
                  setSelectedChild(child);
                  setShowChildSelector(false);
                }}
              >
                {child.name} ({calculateAge(child.birth_date)} ans)
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
