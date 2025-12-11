import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface NutritionBalanceProps {
  vegetables: number;
  proteins: number;
  starches: number;
  dairy: number;
}

export const NutritionBalance = ({
  vegetables,
  proteins,
  starches,
  dairy,
}: NutritionBalanceProps) => {
  const total = vegetables + proteins + starches + dairy;
  const vegetablesPercent = total > 0 ? Math.round((vegetables / total) * 100) : 0;

  const data = [
    { name: "Légumes", value: vegetables || 1, color: "hsl(142, 76%, 36%)", target: 30 },
    { name: "Protéines", value: proteins || 1, color: "hsl(var(--primary))", target: 25 },
    { name: "Féculents", value: starches || 1, color: "hsl(45, 93%, 47%)", target: 25 },
    { name: "Laitiers", value: dairy || 1, color: "hsl(199, 89%, 48%)", target: 20 },
  ];

  const getBalanceScore = () => {
    const overallBalance = Math.min(100, Math.round(
      (Math.min(vegetables, 30) / 30 * 25) +
      (Math.min(proteins, 25) / 25 * 25) +
      (Math.min(starches, 25) / 25 * 25) +
      (Math.min(dairy, 20) / 20 * 25)
    ));
    return overallBalance;
  };

  const getBalanceMessage = () => {
    const score = getBalanceScore();

    if (score >= 80) {
      return { text: "Équilibré", emoji: "🎉", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/40" };
    }
    if (score >= 60) {
      return { text: "Bon", emoji: "👍", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-900/40" };
    }
    return { text: "À améliorer", emoji: "📈", color: "text-red-600 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/40" };
  };

  const message = getBalanceMessage();

  const getTrend = (value: number, target: number) => {
    const diff = value - target;
    if (diff > 5) return { icon: TrendingUp, color: "text-emerald-500" };
    if (diff < -5) return { icon: TrendingDown, color: "text-red-500" };
    return { icon: Minus, color: "text-muted-foreground" };
  };

  return (
    <Card className="p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm">Nutrition</h3>
          <p className="text-[10px] text-muted-foreground">Analyse nutritionnelle de la semaine</p>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${message.bg} ${message.color}`}>
          {message.text} {message.emoji}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-16 h-16 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={18}
                outerRadius={30}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-1">
          {data.map((item) => {
            const trend = getTrend(item.value, item.target);
            const TrendIcon = trend.icon;
            return (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-[10px] text-muted-foreground">{item.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-medium">{item.value}%</span>
                  <TrendIcon className={`w-2.5 h-2.5 ${trend.color}`} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};
