import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuickPlan } from "../meal-planner/hooks/useQuickPlan";
import { ChildProfileBadge } from "./ChildProfileBadge";
import { TodayMeals } from "./TodayMeals";
import { TodoNow } from "./TodoNow";
import { WeekProgress } from "./WeekProgress";
import { CompactActionCards } from "./CompactActionCards";
import { MiniCalendar } from "./MiniCalendar";
import { NutritionBalance } from "./NutritionBalance";
import { QuickStartGuide } from "./QuickStartGuide";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format, startOfWeek, endOfWeek, addDays } from "date-fns";

interface Child {
  id: string;
  name: string;
  birth_date: string;
  allergies: string[] | null;
  meal_objectives: string[] | null;
}

interface DashboardStats {
  recipesReady: number;
  totalRecipes: number;
  daysPlanned: number;
  totalDays: number;
  shoppingListReady: boolean;
  nutrition: {
    vegetables: number;
    proteins: number;
    starches: number;
    dairy: number;
  };
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
  const [plannedDays, setPlannedDays] = useState<string[]>([]);
  const [todayMeals, setTodayMeals] = useState({
    snack: { name: null as string | null, prepTime: undefined as number | undefined },
    dinner: { name: null as string | null, prepTime: undefined as number | undefined },
    lunchbox: { name: null as string | null, prepTime: undefined as number | undefined },
  });
  const [stats, setStats] = useState<DashboardStats>({
    recipesReady: 0,
    totalRecipes: 7,
    daysPlanned: 0,
    totalDays: 7,
    shoppingListReady: false,
    nutrition: { vegetables: 0, proteins: 0, starches: 0, dairy: 0 },
  });

  const { generateQuickPlan, loading } = useQuickPlan(userId);

  // Fetch user data and children
  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUsername(user.email.split("@")[0]);
      }

      const { data: childrenData } = await supabase
        .from('children_profiles')
        .select('id, name, birth_date, allergies, meal_objectives')
        .eq('profile_id', userId);

      if (childrenData && childrenData.length > 0) {
        setChildren(childrenData);
        setSelectedChild(childrenData[0]);
      }
    };

    fetchData();
  }, [userId]);

  // Fetch all dashboard data when child changes
  const fetchDashboardData = useCallback(async () => {
    if (!selectedChild) return;

    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    const weekStartStr = format(weekStart, 'yyyy-MM-dd');
    const weekEndStr = format(weekEnd, 'yyyy-MM-dd');

    try {
      // 1. Fetch planned days for the week
      const { data: mealPlans } = await supabase
        .from('meal_plans')
        .select('date, meal_time')
        .eq('profile_id', userId)
        .eq('child_id', selectedChild.id)
        .gte('date', weekStartStr)
        .lte('date', weekEndStr);

      const uniquePlannedDays = mealPlans ? [...new Set(mealPlans.map(p => p.date))] : [];
      setPlannedDays(uniquePlannedDays);

      // 2. Fetch today's recipes with details
      const { data: todayPlans } = await supabase
        .from('meal_plans')
        .select(`
          meal_time,
          recipe:recipe_id (
            name,
            preparation_time,
            nutritional_info
          )
        `)
        .eq('profile_id', userId)
        .eq('child_id', selectedChild.id)
        .eq('date', todayStr);

      const meals = {
        snack: { name: null as string | null, prepTime: undefined as number | undefined },
        dinner: { name: null as string | null, prepTime: undefined as number | undefined },
        lunchbox: { name: null as string | null, prepTime: undefined as number | undefined },
      };

      if (todayPlans) {
        todayPlans.forEach((plan: any) => {
          if (plan.recipe) {
            const mealType = plan.meal_time as 'snack' | 'dinner' | 'lunchbox';
            if (mealType in meals) {
              meals[mealType] = {
                name: plan.recipe.name,
                prepTime: plan.recipe.preparation_time,
              };
            }
          }
        });
      }
      setTodayMeals(meals);

      // 3. Count recipes for the user
      const { count: recipeCount } = await supabase
        .from('recipes')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', userId);

      // 4. Check if shopping list exists and has items
      const { data: shoppingList } = await supabase
        .from('shopping_lists')
        .select('items')
        .eq('profile_id', userId)
        .maybeSingle();

      const hasShoppingList = shoppingList && 
        shoppingList.items && 
        Array.isArray(shoppingList.items) && 
        shoppingList.items.length > 0;

      // 5. Calculate nutrition from weekly planned recipes
      const { data: weeklyRecipes } = await supabase
        .from('meal_plans')
        .select(`
          recipe:recipe_id (
            nutritional_info,
            ingredients
          )
        `)
        .eq('profile_id', userId)
        .eq('child_id', selectedChild.id)
        .gte('date', weekStartStr)
        .lte('date', weekEndStr);

      // Calculate rough nutrition distribution
      let nutrition = { vegetables: 0, proteins: 0, starches: 0, dairy: 0 };
      
      if (weeklyRecipes && weeklyRecipes.length > 0) {
        weeklyRecipes.forEach((plan: any) => {
          if (plan.recipe?.nutritional_info) {
            const info = plan.recipe.nutritional_info;
            // Estimate based on macros
            if (info.proteins) nutrition.proteins += Number(info.proteins) || 0;
            if (info.carbs) nutrition.starches += Number(info.carbs) || 0;
            if (info.fiber) nutrition.vegetables += Number(info.fiber) * 5 || 0;
            if (info.calcium) nutrition.dairy += Number(info.calcium) / 100 || 0;
          }
        });
        
        // Normalize to reasonable values
        const total = nutrition.vegetables + nutrition.proteins + nutrition.starches + nutrition.dairy;
        if (total > 0) {
          nutrition = {
            vegetables: Math.round((nutrition.vegetables / total) * 100),
            proteins: Math.round((nutrition.proteins / total) * 100),
            starches: Math.round((nutrition.starches / total) * 100),
            dairy: Math.round((nutrition.dairy / total) * 100),
          };
        }
      }

      // If no data, show default balanced distribution
      if (nutrition.vegetables === 0 && nutrition.proteins === 0) {
        nutrition = { vegetables: 25, proteins: 25, starches: 30, dairy: 20 };
      }

      setStats({
        recipesReady: recipeCount || 0,
        totalRecipes: 7,
        daysPlanned: uniquePlannedDays.length,
        totalDays: 7,
        shoppingListReady: hasShoppingList,
        nutrition,
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  }, [selectedChild, userId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

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

  const hasLunchboxObjective = selectedChild?.meal_objectives?.includes('lunchbox') ?? false;

  const handleActionSelect = async (action: string) => {
    if (action === "quick-plan") {
      await generateQuickPlan();
      // Refresh data after quick plan
      fetchDashboardData();
    } else {
      onSectionChange(action);
    }
  };

  const handleDayClick = (date: string) => {
    navigate(`/dashboard/planner?date=${date}`);
  };

  // Show QuickStartGuide if no children
  if (children.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">
            Bonjour {username || "Parent"} 👋
          </h1>
          <p className="text-muted-foreground">
            Commencez par créer le profil de votre enfant pour personnaliser Kidboost.
          </p>
        </div>
        <QuickStartGuide onSelectStep={onSectionChange} />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Smart welcome + Child Profile Badge */}
      <div className="space-y-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">
            Bonjour {username || "Parent"} 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            Voici ce que Kidboost a préparé pour {selectedChild?.name} aujourd'hui.
          </p>
        </div>

        {selectedChild && (
          <ChildProfileBadge
            childName={selectedChild.name}
            childAge={calculateAge(selectedChild.birth_date)}
            allergies={(selectedChild.allergies || []).filter(a => a && a.trim() !== '')}
            onChangeChild={() => setShowChildSelector(true)}
          />
        )}
      </div>

      {/* Today's Meals */}
      {selectedChild && (
        <TodayMeals
          childName={selectedChild.name}
          snack={todayMeals.snack}
          dinner={todayMeals.dinner}
          lunchbox={todayMeals.lunchbox}
          showLunchbox={hasLunchboxObjective}
          onViewRecipe={(type) => console.log("View", type)}
          onReplaceRecipe={() => onSectionChange("recipes")}
          onAddToList={() => onSectionChange("shopping")}
        />
      )}

      {/* Compact Quick Actions */}
      <CompactActionCards onSelectAction={handleActionSelect} loading={loading} />

      {/* Todo Now - with real data */}
      <TodoNow
        recipesReady={stats.recipesReady}
        totalRecipes={stats.totalRecipes}
        daysPlanned={stats.daysPlanned}
        totalDays={stats.totalDays}
        shoppingListReady={stats.shoppingListReady}
        onAction={onSectionChange}
      />

      {/* Two columns: Calendar + Nutrition */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MiniCalendar
          plannedDays={plannedDays}
          onDayClick={handleDayClick}
          onViewFull={() => navigate("/dashboard/view-planner")}
        />
        <NutritionBalance
          vegetables={stats.nutrition.vegetables}
          proteins={stats.nutrition.proteins}
          starches={stats.nutrition.starches}
          dairy={stats.nutrition.dairy}
        />
      </div>

      {/* Week Progress - with real data */}
      <WeekProgress
        recipesReady={stats.recipesReady}
        totalRecipes={stats.totalRecipes}
        daysPlanned={stats.daysPlanned}
        totalDays={stats.totalDays}
        shoppingListReady={stats.shoppingListReady}
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
