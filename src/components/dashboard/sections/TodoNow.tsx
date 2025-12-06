import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Calendar, ShoppingCart, ChefHat, CheckCircle } from "lucide-react";

interface Task {
  id: string;
  message: string;
  action: string;
  route: string;
  icon: React.ElementType;
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

  // Check planning status
  if (daysPlanned === 0) {
    tasks.push({
      id: "no-planning",
      message: "Vous n'avez pas encore planifié votre semaine 😄",
      action: "Planifier maintenant",
      route: "planner",
      icon: Calendar,
      priority: "high",
    });
  } else if (daysPlanned < totalDays) {
    tasks.push({
      id: "incomplete-planning",
      message: `${daysPlanned}/${totalDays} jours planifiés → planifiez la semaine en 1 clic`,
      action: "Compléter",
      route: "planner",
      icon: Calendar,
      priority: "medium",
    });
  }

  // Check recipes status
  if (recipesReady < totalRecipes) {
    tasks.push({
      id: "incomplete-recipes",
      message: `${recipesReady}/${totalRecipes} recettes générées → compléter la semaine`,
      action: "Générer",
      route: "recipes",
      icon: ChefHat,
      priority: "medium",
    });
  }

  // Check shopping list
  if (!shoppingListReady && daysPlanned > 0) {
    tasks.push({
      id: "shopping-list",
      message: "Votre liste de courses doit être mise à jour",
      action: "Mettre à jour",
      route: "shopping",
      icon: ShoppingCart,
      priority: "low",
    });
  }

  if (tasks.length === 0) {
    return (
      <Card className="p-4 bg-gradient-to-br from-pastel-green/20 to-pastel-green/5 border-pastel-green/30">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-pastel-green/30 rounded-full">
            <CheckCircle className="w-5 h-5 text-pastel-green-foreground" />
          </div>
          <div>
            <p className="font-medium text-pastel-green-foreground">Tout est prêt !</p>
            <p className="text-sm text-muted-foreground">
              Votre semaine est bien organisée 🎉
            </p>
          </div>
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
    <Card className="p-4 space-y-3 bg-gradient-to-br from-pastel-yellow/10 to-card">
      <div className="flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-pastel-yellow-foreground" />
        <h3 className="font-bold text-sm">À faire maintenant</h3>
      </div>

      <div className="space-y-2">
        {tasks.map((task) => {
          const Icon = task.icon;
          return (
            <div
              key={task.id}
              className={`flex items-center justify-between p-3 bg-card rounded-lg border-l-4 ${priorityColors[task.priority]}`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm truncate">{task.message}</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs ml-2 flex-shrink-0"
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
