import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuickPlan } from "../meal-planner/hooks/useQuickPlan";
import { useDashboardData } from "../hooks/useDashboardData";
import { ChildProfileBadge } from "./ChildProfileBadge";
import { TodayMeals } from "./TodayMeals";
import { TodoNow } from "./TodoNow";
import { WeekProgress } from "./WeekProgress";
import { CompactActionCards } from "./CompactActionCards";
import { MiniCalendar } from "./MiniCalendar";
import { NutritionBalance } from "./NutritionBalance";
import { QuickStartGuide } from "./QuickStartGuide";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MealSlot, LunchType, determineLunchType } from "@/lib/meals";
import { Users, Settings, ChevronDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Child {
  id: string;
  name: string;
  birth_date: string;
  allergies: string[] | null;
  meal_objectives: string[] | null;
  preferences: string[] | null;
  dislikes: string[] | null;
  available_time: number | null;
}

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
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [showChildSelector, setShowChildSelector] = useState(false);
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
    },
    nutrition: { vegetables: 25, proteins: 25, starches: 30, dairy: 20 },
  });

  const { generateQuickPlan, loading: quickPlanLoading } = useQuickPlan(userId);
  const { fetchDashboardData, generateMeal, generating } = useDashboardData(userId);

  // Fetch user and children on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUsername(user.email.split("@")[0]);
      }

      const { data: childrenData } = await supabase
        .from('children_profiles')
        .select('id, name, birth_date, allergies, meal_objectives, preferences, dislikes, available_time')
        .eq('profile_id', userId);

      if (childrenData && childrenData.length > 0) {
        setChildren(childrenData);
        setSelectedChild(childrenData[0]);
      }
    };

    fetchInitialData();
  }, [userId]);

  // Fetch dashboard data when child changes
  const refreshDashboard = useCallback(async () => {
    if (!selectedChild) return;
    
    const data = await fetchDashboardData(selectedChild);
    setDashboardData(data);
  }, [selectedChild, fetchDashboardData]);

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
      refreshDashboard();
    }, msUntilMidnight);

    return () => clearTimeout(timer);
  }, [refreshDashboard]);

  const calculateAge = (birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

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
    
    const newMeal = await generateMeal(selectedChild, slot);
    
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

  const handleChildChange = (childId: string) => {
    const child = children.find(c => c.id === childId);
    if (child) {
      setSelectedChild(child);
    }
  };

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

        {/* Child Selector Dropdown */}
        {children.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Enfant :</span>
            <Select
              value={selectedChild?.id || ""}
              onValueChange={handleChildChange}
            >
              <SelectTrigger className="w-48 h-9">
                <SelectValue placeholder="Sélectionner un enfant" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                {children.map((child) => (
                  <SelectItem key={child.id} value={child.id}>
                    {child.name} ({calculateAge(child.birth_date)} ans)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {selectedChild && (
          <ChildProfileBadge
            childName={selectedChild.name}
            childAge={calculateAge(selectedChild.birth_date)}
            allergies={(selectedChild.allergies || []).filter(a => a && a.trim() !== '')}
            onChangeChild={() => setShowChildSelector(true)}
          />
        )}
      </div>

      {/* Today's Meals - 4 repas fixes */}
      {selectedChild && (
        <TodayMeals
          childName={selectedChild.name}
          meals={dashboardData.todayMeals}
          lunchType={dashboardData.lunchType}
          generating={generating}
          onViewRecipe={handleViewRecipe}
          onReplaceRecipe={handleReplaceRecipe}
          onAddToList={handleAddToList}
          onEditRecipe={handleEditRecipe}
          onAddRecipe={handleAddRecipe}
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
            variant="secondary"
            size="sm"
            className="h-8 px-3 text-xs gap-1.5"
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
                  handleChildChange(child.id);
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
