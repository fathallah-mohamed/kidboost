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
  const recipesPercent = Math.min((recipesReady / totalRecipes) * 100, 100);
  const planningPercent = (daysPlanned / totalDays) * 100;
  const remaining = totalRecipes - Math.min(recipesReady, totalRecipes);

  const stats = [
    {
      icon: ChefHat,
      label: "Recettes",
      value: `${Math.min(recipesReady, totalRecipes)}/${totalRecipes}`,
      percent: recipesPercent,
      color: "bg-primary",
    },
    {
      icon: Calendar,
      label: "Planning",
      value: `${daysPlanned}/${totalDays}`,
      percent: planningPercent,
      color: "bg-accent",
    },
    {
      icon: ShoppingCart,
      label: "Courses",
      value: shoppingListReady ? "✓" : "—",
      percent: shoppingListReady ? 100 : 0,
      color: "bg-pastel-green",
    },
  ];

  const messages: string[] = [];
  if (remaining > 0) messages.push(`${remaining} repas à préparer`);
  if (daysPlanned < totalDays) messages.push("Planifiez en 1 clic");
  if (!shoppingListReady) messages.push("Liste non générée");
  if (messages.length === 0) messages.push("Tout est prêt ! 🎉");

  return (
    <Card className="p-2 space-y-1.5">
      <h3 className="font-bold text-xs">Votre organisation</h3>

      <div className="grid grid-cols-3 gap-1.5">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="text-center space-y-0.5">
              <div className="flex justify-center">
                <div className={`p-1 ${stat.color}/20 rounded-md`}>
                  <Icon className="w-3.5 h-3.5 text-foreground" />
                </div>
              </div>
              <p className="text-sm font-bold leading-none">{stat.value}</p>
              <p className="text-[9px] text-muted-foreground">{stat.label}</p>
              <Progress value={stat.percent} className="h-0.5" />
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-x-2 gap-y-0.5 pt-0.5 border-t border-border/30">
        {messages.map((msg, index) => (
          <span key={index} className="text-[10px] text-muted-foreground flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-primary" />
            {msg}
          </span>
        ))}
      </div>
    </Card>
  );
};
