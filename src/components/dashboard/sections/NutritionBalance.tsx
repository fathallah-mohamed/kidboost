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
    { name: "Légumes", value: vegetables || 1, color: "hsl(var(--pastel-green))" },
    { name: "Protéines", value: proteins || 1, color: "hsl(var(--primary))" },
    { name: "Féculents", value: starches || 1, color: "hsl(var(--pastel-yellow))" },
    { name: "Laitiers", value: dairy || 1, color: "hsl(var(--pastel-blue))" },
  ];

  const getBalanceMessage = () => {
    const overallBalance = Math.min(100, Math.round(
      (Math.min(vegetables, 30) / 30 * 25) +
      (Math.min(proteins, 25) / 25 * 25) +
      (Math.min(starches, 25) / 25 * 25) +
      (Math.min(dairy, 20) / 20 * 25)
    ));

    if (overallBalance >= 80) {
      return { text: "Équilibré 🎉", color: "text-pastel-green-foreground" };
    }
    if (vegetablesPercent < 20) {
      return { text: "Légumes ↑", color: "text-destructive" };
    }
    if (overallBalance >= 50) {
      return { text: `${overallBalance}%`, color: "text-pastel-yellow-foreground" };
    }
    return { text: "À améliorer", color: "text-muted-foreground" };
  };

  const message = getBalanceMessage();

  return (
    <Card className="p-2 space-y-1">
      <h3 className="font-bold text-xs">Nutrition</h3>

      <div className="flex items-center gap-2">
        <div className="w-12 h-12 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={14}
                outerRadius={22}
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

        <div className="flex-1 space-y-0.5">
          <p className={`text-xs font-semibold ${message.color}`}>
            {message.text}
          </p>
          <div className="grid grid-cols-2 gap-x-1 gap-y-0">
            {data.map((item) => (
              <div key={item.name} className="flex items-center gap-0.5">
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-[8px] text-muted-foreground truncate">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};
