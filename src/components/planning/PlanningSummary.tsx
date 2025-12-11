import { Card } from "@/components/ui/card";
import { CalendarCheck, Backpack, Home, UtensilsCrossed } from "lucide-react";
import { LunchType } from "@/lib/meals";

interface PlanningSummaryProps {
  plannedMealsCount: number;
  totalMealsCount: number;
  lunchboxCount: number;
  homeLunchCount: number;
  canteenCount: number;
}

export function PlanningSummary({
  plannedMealsCount,
  totalMealsCount,
  lunchboxCount,
  homeLunchCount,
  canteenCount,
}: PlanningSummaryProps) {
  const stats = [
    {
      label: "Repas planifiés",
      value: `${plannedMealsCount} / ${totalMealsCount}`,
      icon: CalendarCheck,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Lunchbox obligatoires",
      value: lunchboxCount.toString(),
      icon: Backpack,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-100 dark:bg-amber-900/30",
    },
    {
      label: "Repas maison",
      value: homeLunchCount.toString(),
      icon: Home,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/30",
    },
    {
      label: "Cantine",
      value: canteenCount.toString(),
      icon: UtensilsCrossed,
      color: "text-slate-600 dark:text-slate-400",
      bgColor: "bg-slate-100 dark:bg-slate-800",
    },
  ];

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4 text-sm text-muted-foreground">Résumé de la semaine</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`flex items-center gap-3 p-3 rounded-lg ${stat.bgColor}`}
          >
            <stat.icon className={`w-5 h-5 ${stat.color}`} />
            <div>
              <p className="text-lg font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
