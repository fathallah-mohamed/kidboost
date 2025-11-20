import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";

export const WeeklyBalance = () => {
  // Mock data - à connecter avec les vraies données plus tard
  const nutritionData = [
    { name: "Légumes", value: 35, color: "hsl(var(--pastel-green))" },
    { name: "Protéines", value: 30, color: "hsl(var(--primary))" },
    { name: "Féculents", value: 25, color: "hsl(var(--pastel-yellow))" },
    { name: "Produits laitiers", value: 10, color: "hsl(var(--pastel-blue))" },
  ];

  const getBalanceMessage = () => {
    // Logique simple basée sur les données mockées
    const vegetablesPercent = nutritionData.find((d) => d.name === "Légumes")?.value || 0;
    
    if (vegetablesPercent >= 35) {
      return {
        emoji: "🎉",
        message: "Super, la semaine démarre bien ! Vos repas sont bien équilibrés.",
        color: "text-pastel-green-foreground",
      };
    } else if (vegetablesPercent >= 25) {
      return {
        emoji: "😊",
        message: "Bon départ ! On peut ajouter un peu plus de légumes sur 2 repas.",
        color: "text-pastel-yellow-foreground",
      };
    } else {
      return {
        emoji: "💪",
        message: "On peut ajouter un peu de légumes mercredi 😉",
        color: "text-primary",
      };
    }
  };

  const balanceInfo = getBalanceMessage();

  return (
    <Card className="p-6 space-y-4 bg-gradient-to-br from-white to-pastel-green/10">
      <div className="space-y-2">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <span className="text-2xl">{balanceInfo.emoji}</span>
          Équilibre de la semaine
        </h3>
        <p className="text-sm text-muted-foreground">
          Répartition nutritionnelle de vos repas planifiés
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Graphique */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={nutritionData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {nutritionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                formatter={(value, entry: any) => (
                  <span className="text-sm">
                    {value} ({entry.payload.value}%)
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Message et détails */}
        <div className="space-y-4">
          <div className={`p-4 rounded-xl bg-white/80 border-2 ${balanceInfo.color.replace('text-', 'border-')}`}>
            <p className={`text-sm font-medium ${balanceInfo.color}`}>
              {balanceInfo.message}
            </p>
          </div>

          <div className="space-y-2">
            {nutritionData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span>{item.name}</span>
                </div>
                <span className="font-medium">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};
