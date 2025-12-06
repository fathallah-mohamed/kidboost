import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

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
    { name: "Légumes", value: vegetables, color: "hsl(var(--pastel-green))" },
    { name: "Protéines", value: proteins, color: "hsl(var(--primary))" },
    { name: "Féculents", value: starches, color: "hsl(var(--pastel-yellow))" },
    { name: "Laitiers", value: dairy, color: "hsl(var(--pastel-blue))" },
  ];

  const getBalanceMessage = () => {
    const overallBalance = Math.min(100, Math.round(
      (Math.min(vegetables, 30) / 30 * 25) +
      (Math.min(proteins, 25) / 25 * 25) +
      (Math.min(starches, 25) / 25 * 25) +
      (Math.min(dairy, 20) / 20 * 25)
    ));

    if (overallBalance >= 80) {
      return { text: "Semaine bien équilibrée", emoji: "🎉", color: "text-pastel-green-foreground" };
    }
    if (vegetablesPercent < 20) {
      return { text: "Les légumes sont faibles cette semaine", emoji: "🥬", color: "text-destructive" };
    }
    if (overallBalance >= 50) {
      return { text: `Semaine équilibrée à ${overallBalance}%`, emoji: "👍", color: "text-pastel-yellow-foreground" };
    }
    return { text: "Équilibre nutritionnel à améliorer", emoji: "💡", color: "text-muted-foreground" };
  };

  const message = getBalanceMessage();

  return (
    <Card className="p-4 space-y-3">
      <h3 className="font-bold text-sm">Équilibre nutritionnel</h3>

      <p className={`text-sm font-medium ${message.color}`}>
        {message.emoji} {message.text}
      </p>

      <div className="flex items-center gap-4">
        <div className="w-24 h-24">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={25}
                outerRadius={40}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-2">
          {data.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-muted-foreground">{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
