import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle } from "lucide-react";

interface ProgressBlockProps {
  recipesReady: number;
  totalRecipes: number;
  daysPlanned: number;
  totalDays: number;
  shoppingDone: boolean;
}

export const ProgressBlock = ({
  recipesReady = 4,
  totalRecipes = 7,
  daysPlanned = 2,
  totalDays = 7,
  shoppingDone = false,
}: ProgressBlockProps) => {
  const overallProgress = Math.round(
    ((recipesReady + daysPlanned + (shoppingDone ? totalDays : 0)) / (totalRecipes + totalDays + totalDays)) * 100
  );

  const stats = [
    {
      label: "Recettes prêtes",
      value: recipesReady,
      total: totalRecipes,
      color: "hsl(var(--primary))",
    },
    {
      label: "Planning validé",
      value: daysPlanned,
      total: totalDays,
      color: "hsl(var(--accent))",
    },
    {
      label: "Courses",
      value: shoppingDone ? 1 : 0,
      total: 1,
      color: "hsl(var(--pastel-green))",
    },
  ];

  return (
    <Card className="p-6 space-y-6 bg-gradient-to-br from-white to-primary/5">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Avancement de la semaine</h3>
          <span className="text-2xl font-bold text-primary">{overallProgress}%</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Complétez chaque étape pour être tranquille toute la semaine
        </p>
        <Progress value={overallProgress} className="h-3" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="relative p-4 rounded-xl border-2 bg-white/50"
            style={{ borderColor: stat.color }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
              {stat.value === stat.total ? (
                <CheckCircle2 className="w-5 h-5" style={{ color: stat.color }} />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground/30" />
              )}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold" style={{ color: stat.color }}>
                {stat.value}
              </span>
              <span className="text-lg text-muted-foreground">/ {stat.total}</span>
            </div>
            <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(stat.value / stat.total) * 100}%`,
                  backgroundColor: stat.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
        <span className="text-2xl">🎯</span>
        <p className="text-sm font-medium">
          {overallProgress === 100
            ? "Bravo ! Vous êtes prêts pour la semaine 🎉"
            : "Encore quelques étapes pour être au top !"}
        </p>
      </div>
    </Card>
  );
};
