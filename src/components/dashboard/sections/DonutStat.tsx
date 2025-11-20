import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface DonutStatProps {
  value: number;
  total: number;
  label: string;
  color: string;
  size?: "sm" | "md";
}

export const DonutStat = ({ value, total, label, color, size = "md" }: DonutStatProps) => {
  const percentage = Math.round((value / total) * 100);
  const data = [
    { name: "completed", value: value },
    { name: "remaining", value: total - value },
  ];

  const dimensions = size === "sm" ? { outer: 70, inner: 50 } : { outer: 100, inner: 70 };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <ResponsiveContainer width={dimensions.outer} height={dimensions.outer}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={dimensions.inner / 2}
              outerRadius={dimensions.outer / 2}
              paddingAngle={2}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
            >
              <Cell fill={color} />
              <Cell fill="hsl(var(--muted))" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold" style={{ color }}>
            {value}/{total}
          </span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{percentage}%</p>
      </div>
    </div>
  );
};
