import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChefHat, Calendar, ShoppingCart } from "lucide-react";

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
  const recipesPercent = (recipesReady / totalRecipes) * 100;
  const planningPercent = (daysPlanned / totalDays) * 100;

  const stats = [
    {
      icon: ChefHat,
      label: "Recettes",
      value: `${recipesReady}/${totalRecipes}`,
      percent: recipesPercent,
      message: recipesReady < totalRecipes 
        ? `Il reste ${totalRecipes - recipesReady} repas à préparer`
        : "Toutes les recettes sont prêtes",
      color: "bg-primary",
    },
    {
      icon: Calendar,
      label: "Planning",
      value: `${daysPlanned}/${totalDays}`,
      percent: planningPercent,
      message: daysPlanned < totalDays
        ? `Planifiez la semaine en 1 clic`
        : "Semaine complète",
      color: "bg-accent",
    },
    {
      icon: ShoppingCart,
      label: "Courses",
      value: shoppingListReady ? "Prête" : "À faire",
      percent: shoppingListReady ? 100 : 0,
      message: shoppingListReady ? "Liste générée" : "Liste non générée",
      color: "bg-pastel-green",
    },
  ];

  return (
    <Card className="p-4 space-y-4">
      <h3 className="font-bold text-sm">Votre organisation de la semaine</h3>

      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="text-center space-y-2">
              <div className="flex justify-center">
                <div className={`p-2 ${stat.color}/20 rounded-lg`}>
                  <Icon className={`w-4 h-4 ${stat.color.replace('bg-', 'text-')}`} />
                </div>
              </div>
              <div>
                <p className="text-lg font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
              <Progress value={stat.percent} className="h-1.5" />
            </div>
          );
        })}
      </div>

      <div className="space-y-1">
        {stats.map((stat, index) => (
          <p key={index} className="text-xs text-muted-foreground flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${stat.color}`} />
            {stat.message}
          </p>
        ))}
      </div>
    </Card>
  );
};
