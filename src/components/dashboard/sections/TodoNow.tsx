import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Calendar, ShoppingCart, ChefHat, CheckCircle } from "lucide-react";
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
  onAction: (route: string) => void;
}

export const TodoNow = ({
  recipesReady,
  totalRecipes,
  daysPlanned,
  totalDays,
  shoppingListReady,
  onAction,
}: TodoNowProps) => {
  const tasks: Task[] = [];

  if (daysPlanned === 0) {
    tasks.push({
      id: "no-planning",
      message: "Planifiez votre semaine 😄",
      action: "Planifier",
      route: "planner",
      icon: Calendar,
      priority: "high",
    });
  } else if (daysPlanned < totalDays) {
    tasks.push({
      id: "incomplete-planning",
      message: `${daysPlanned}/${totalDays} jours planifiés`,
      action: "Compléter",
      route: "planner",
      icon: Calendar,
      priority: "medium",
    });
  }

  if (recipesReady < totalRecipes) {
    tasks.push({
      id: "incomplete-recipes",
      message: `${recipesReady}/${totalRecipes} recettes`,
      action: "Générer",
      route: "recipes",
      icon: ChefHat,
      priority: "medium",
    });
  }

  if (!shoppingListReady && daysPlanned > 0) {
    tasks.push({
      id: "shopping-list",
      message: "Créer la liste de courses",
      action: "Créer",
      route: "shopping",
      icon: ShoppingCart,
      priority: "low",
    });
  }

  if (tasks.length === 0) {
    return (
      <Card className="p-3 bg-gradient-to-br from-pastel-green/20 to-pastel-green/5 border-pastel-green/30">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-pastel-green/30 rounded-full">
            <CheckCircle className="w-4 h-4 text-pastel-green-foreground" />
          </div>
          <p className="text-sm font-medium text-pastel-green-foreground">
            Tout est prêt ! 🎉
          </p>
        </div>
      </Card>
    );
  }

  const priorityColors = {
    high: "border-l-destructive",
    medium: "border-l-pastel-yellow",
    low: "border-l-muted",
  };

  return (
    <Card className="p-3 space-y-2 bg-gradient-to-br from-pastel-yellow/10 to-card">
      <div className="flex items-center gap-1.5">
        <AlertCircle className="w-4 h-4 text-pastel-yellow-foreground" />
        <h3 className="font-bold text-sm">À faire</h3>
      </div>

      <div className="space-y-1.5">
        {tasks.map((task) => {
          const Icon = task.icon;
          return (
            <div
              key={task.id}
              className={`flex items-center justify-between p-2 bg-card rounded-lg border-l-2 ${priorityColors[task.priority]}`}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm truncate">{task.message}</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs h-7 px-2 ml-2 flex-shrink-0"
                onClick={() => onAction(task.route)}
              >
                {task.action}
              </Button>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
