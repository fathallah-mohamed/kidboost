import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChefHat, Calendar, ShoppingCart, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface WeekProgressProps {
  recipesReady: number;
  totalRecipes: number;
  daysPlanned: number;
  totalDays: number;
  shoppingListReady: boolean;
}

export const WeekProgress = ({
  recipesReady,
  totalRecipes,
  daysPlanned,
  totalDays,
  shoppingListReady,
}: WeekProgressProps) => {
  const navigate = useNavigate();
  const recipesPercent = Math.min((recipesReady / totalRecipes) * 100, 100);
  const planningPercent = (daysPlanned / totalDays) * 100;

  const stats = [
    {
      icon: ChefHat,
      label: "Recettes",
      value: `${Math.min(recipesReady, totalRecipes)}/${totalRecipes}`,
      percent: recipesPercent,
      color: "bg-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: Calendar,
      label: "Planning",
      value: `${daysPlanned}/${totalDays}`,
      percent: planningPercent,
      color: "bg-accent",
      bgColor: "bg-accent/10",
    },
    {
      icon: ShoppingCart,
      label: "Courses",
      value: shoppingListReady ? "✓" : "—",
      percent: shoppingListReady ? 100 : 0,
      color: "bg-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
  ];

  const isComplete = recipesReady >= totalRecipes && daysPlanned >= totalDays && shoppingListReady;

  return (
    <Card className="p-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm">Votre organisation</h3>
        {isComplete && (
          <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-medium">
            Tout est prêt ! 🎉
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="text-center space-y-1">
              <div className="flex justify-center">
                <div className={`p-1.5 ${stat.bgColor} rounded-lg`}>
                  <Icon className="w-4 h-4 text-foreground" />
                </div>
              </div>
              <p className="text-lg font-bold leading-none">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              <Progress value={stat.percent} className="h-1" />
            </div>
          );
        })}
      </div>

      {!isComplete && (
        <div className="pt-2 border-t border-border/40">
          <Button
            className="w-full h-9 text-sm gap-2"
            onClick={() => navigate("/planning-express")}
          >
            <Sparkles className="w-4 h-4" />
            Planifiez en 1 clic
          </Button>
        </div>
      )}
    </Card>
  );
};
