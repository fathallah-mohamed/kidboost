import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DonutStat } from "./DonutStat";

interface ProgressSummaryProps {
  recipesReady: number;
  totalRecipes: number;
  daysPlanned: number;
  totalDays: number;
  shoppingDone: boolean;
}

export const ProgressSummary = ({
  recipesReady = 4,
  totalRecipes = 7,
  daysPlanned = 2,
  totalDays = 7,
  shoppingDone = false,
}: ProgressSummaryProps) => {
  const overallProgress = Math.round(
    ((recipesReady + daysPlanned + (shoppingDone ? totalDays : 0)) / (totalRecipes + totalDays + totalDays)) * 100
  );

  return (
    <Card className="p-6 space-y-6 bg-gradient-to-br from-white via-primary/5 to-accent/5">
      {/* Header avec progress bar principale */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold">Avancement de la semaine</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Complétez les étapes pour être tranquille toute la semaine
            </p>
          </div>
          <div className="text-right">
            <span className="text-4xl font-bold text-primary">{overallProgress}%</span>
          </div>
        </div>
        <Progress value={overallProgress} className="h-4" />
      </div>

      {/* 3 mini-graphiques donuts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
        <div className="flex flex-col items-center p-4 bg-white rounded-xl shadow-sm">
          <DonutStat
            value={recipesReady}
            total={totalRecipes}
            label="Recettes générées"
            color="hsl(var(--primary))"
          />
        </div>

        <div className="flex flex-col items-center p-4 bg-white rounded-xl shadow-sm">
          <DonutStat
            value={daysPlanned}
            total={totalDays}
            label="Jours planifiés"
            color="hsl(var(--accent))"
          />
        </div>

        <div className="flex flex-col items-center p-4 bg-white rounded-xl shadow-sm">
          <DonutStat
            value={shoppingDone ? 1 : 0}
            total={1}
            label="Liste de courses"
            color="hsl(var(--pastel-green))"
          />
        </div>
      </div>

      {/* Message motivant */}
      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl">
        <span className="text-3xl">🎯</span>
        <p className="text-sm font-medium">
          {overallProgress === 100
            ? "Bravo ! Vous êtes prêts pour la semaine 🎉"
            : overallProgress >= 50
            ? "Super départ ! Encore quelques étapes et c'est bon !"
            : "On s'y met ensemble ? Commençons par les profils enfants !"}
        </p>
      </div>
    </Card>
  );
};
