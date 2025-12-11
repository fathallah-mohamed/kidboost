import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Calendar, ShoppingCart, UtensilsCrossed, CheckCircle, ArrowRight, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

interface Task {
  id: string;
  message: string;
  action: string;
  route: string;
  icon: LucideIcon;
  priority: "high" | "medium" | "low";
}

interface TodoNowProps {
  recipesReady: number;
  totalRecipes: number;
  daysPlanned: number;
  totalDays: number;
  shoppingListReady: boolean;
  mealsToplan?: number;
  onAction: (route: string) => void;
}

export const TodoNow = ({
  recipesReady,
  totalRecipes,
  daysPlanned,
  totalDays,
  shoppingListReady,
  mealsToplan = 0,
  onAction,
}: TodoNowProps) => {
  const navigate = useNavigate();
  const tasks: Task[] = [];

  // Primary task: meals to plan
  const missingRecipes = totalRecipes - recipesReady;
  
  if (mealsToplan > 0 || missingRecipes > 0) {
    // Combine into a single meaningful message
    const parts: string[] = [];
    if (mealsToplan > 0) parts.push(`${mealsToplan} repas à planifier`);
    if (missingRecipes > 0) parts.push(`${missingRecipes} recette${missingRecipes > 1 ? 's' : ''} à ajouter`);
    
    tasks.push({
      id: "meals-to-plan",
      message: `🎯 ${parts.join(' • ')}`,
      action: "Planifier",
      route: "/planning",
      icon: Target,
      priority: "high",
    });
  } else if (daysPlanned === 0) {
    tasks.push({
      id: "no-planning",
      message: "🎯 Aucun repas planifié cette semaine",
      action: "Planifier",
      route: "/planning",
      icon: Calendar,
      priority: "high",
    });
  }

  if (!shoppingListReady && daysPlanned > 0) {
    tasks.push({
      id: "shopping-list",
      message: "🛒 Liste de courses à créer",
      action: "Créer",
      route: "/shopping-list",
      icon: ShoppingCart,
      priority: "medium",
    });
  }

  const handleTaskAction = (route: string) => {
    navigate(route);
  };

  if (tasks.length === 0) {
    return (
      <Card className="px-3 py-2.5 bg-gradient-to-br from-emerald-100/50 to-emerald-50/30 dark:from-emerald-900/30 dark:to-emerald-950/20 border-emerald-200/50 dark:border-emerald-800/50">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
            Tout est prêt pour la semaine ! 🎉
          </p>
        </div>
      </Card>
    );
  }

  const priorityConfig = {
    high: {
      border: "border-l-red-500",
      bg: "bg-red-50/50 dark:bg-red-950/20",
      dot: "bg-red-500",
    },
    medium: {
      border: "border-l-amber-500",
      bg: "bg-amber-50/50 dark:bg-amber-950/20",
      dot: "bg-amber-500",
    },
    low: {
      border: "border-l-muted",
      bg: "bg-muted/30",
      dot: "bg-muted-foreground/50",
    },
  };

  return (
    <Card className="p-3 space-y-2 bg-gradient-to-br from-amber-50/50 to-background dark:from-amber-950/20 dark:to-background">
      <div className="flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        <h3 className="font-bold text-sm">À faire</h3>
        <span className="text-[10px] text-muted-foreground">({tasks.length} tâche{tasks.length > 1 ? 's' : ''})</span>
      </div>

      <div className="space-y-1.5">
        {tasks.map((task) => {
          const Icon = task.icon;
          const config = priorityConfig[task.priority];
          return (
            <div
              key={task.id}
              className={`flex items-center justify-between px-2.5 py-2 rounded-lg border-l-3 ${config.border} ${config.bg}`}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                <Icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-xs truncate">{task.message}</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs h-7 px-2 gap-1 hover:bg-primary/10"
                onClick={() => handleTaskAction(task.route)}
              >
                {task.action}
                <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
