import { useEffect, useState } from "react";
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
import { format } from "date-fns";

interface Child {
  id: string;
  name: string;
  birth_date: string;
  allergies: string[] | null;
  meal_objectives: string[] | null;
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
  
  const { generateQuickPlan, loading } = useQuickPlan(userId);

  // Fetch user data and children
  useEffect(() => {
    const fetchData = async () => {
      // Get username
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUsername(user.email.split("@")[0]);
      }

      // Fetch children
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

  // Fetch planned days and today's meals when child changes
  useEffect(() => {
    if (!selectedChild) return;

    const fetchMealData = async () => {
      const today = format(new Date(), 'yyyy-MM-dd');

      // Fetch planned days for the week
      const { data: mealPlans } = await supabase
        .from('meal_plans')
        .select('date')
        .eq('profile_id', userId)
        .eq('child_id', selectedChild.id);

      if (mealPlans) {
        setPlannedDays([...new Set(mealPlans.map(p => p.date))]);
      }

      // Fetch today's recipes
      const { data: todayPlans } = await supabase
        .from('meal_plans')
        .select(`
          meal_time,
          recipe:recipe_id (
            name,
            preparation_time
          )
        `)
        .eq('profile_id', userId)
        .eq('child_id', selectedChild.id)
        .eq('date', today);

      if (todayPlans) {
        const meals = {
          snack: { name: null as string | null, prepTime: undefined as number | undefined },
          dinner: { name: null as string | null, prepTime: undefined as number | undefined },
          lunchbox: { name: null as string | null, prepTime: undefined as number | undefined },
        };

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

        setTodayMeals(meals);
      }
    };

    fetchMealData();
  }, [selectedChild, userId]);

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

  const handleActionSelect = (action: string) => {
    if (action === "quick-plan") {
      generateQuickPlan();
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
            allergies={selectedChild.allergies || []}
            onChangeChild={() => setShowChildSelector(true)}
          />
        )}
      </div>

      {/* Today's Meals - TOP PRIORITY */}
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

      {/* Todo Now */}
      <TodoNow
        recipesReady={4}
        totalRecipes={7}
        daysPlanned={plannedDays.length}
        totalDays={7}
        shoppingListReady={false}
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
          vegetables={25}
          proteins={20}
          starches={15}
          dairy={10}
        />
      </div>

      {/* Week Progress */}
      <WeekProgress
        recipesReady={4}
        totalRecipes={7}
        daysPlanned={plannedDays.length}
        totalDays={7}
        shoppingListReady={false}
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
