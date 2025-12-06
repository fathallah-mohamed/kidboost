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

  // Dynamic messages
  const messages: string[] = [];
  if (remaining > 0) {
    messages.push(`Il reste ${remaining} repas à préparer`);
  }
  if (daysPlanned < totalDays) {
    messages.push("Planifiez la semaine en 1 clic");
  }
  if (!shoppingListReady) {
    messages.push("Liste de courses non générée");
  }
  if (messages.length === 0) {
    messages.push("Tout est prêt pour la semaine ! 🎉");
  }

  return (
    <Card className="p-3 space-y-3">
      <h3 className="font-bold text-sm">Votre organisation</h3>

      <div className="grid grid-cols-3 gap-2">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="text-center space-y-1">
              <div className="flex justify-center">
                <div className={`p-1.5 ${stat.color}/20 rounded-lg`}>
                  <Icon className="w-4 h-4 text-foreground" />
                </div>
              </div>
              <p className="text-base font-bold">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              <Progress value={stat.percent} className="h-1" />
            </div>
          );
        })}
      </div>

      <div className="space-y-1 pt-1 border-t border-border/50">
        {messages.map((msg, index) => (
          <p key={index} className="text-sm text-muted-foreground flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-primary" />
            {msg}
          </p>
        ))}
      </div>
    </Card>
  );
};
