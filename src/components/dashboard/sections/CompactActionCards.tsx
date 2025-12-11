import { Button } from "@/components/ui/button";
import { Sparkles, ChefHat, Calendar, ShoppingCart } from "lucide-react";

interface CompactActionCardsProps {
  onSelectAction: (action: string) => void;
  loading?: boolean;
}

export const CompactActionCards = ({ onSelectAction, loading }: CompactActionCardsProps) => {
  const actions = [
    {
      icon: Sparkles,
      title: "Planning Express",
      action: "quick-plan",
      gradient: "from-primary/30 to-primary/10",
      iconColor: "text-primary",
      hoverBg: "hover:from-primary/40 hover:to-primary/20",
    },
    {
      icon: ChefHat,
      title: "Recettes",
      action: "recipes",
      gradient: "from-accent/30 to-accent/10",
      iconColor: "text-accent-foreground",
      hoverBg: "hover:from-accent/40 hover:to-accent/20",
    },
    {
      icon: Calendar,
      title: "Planifier",
      action: "planner",
      gradient: "from-violet-200/50 to-violet-100/30 dark:from-violet-900/40 dark:to-violet-950/20",
      iconColor: "text-violet-600 dark:text-violet-400",
      hoverBg: "hover:from-violet-200/70 hover:to-violet-100/50",
    },
    {
      icon: ShoppingCart,
      title: "Courses",
      action: "shopping",
      gradient: "from-emerald-200/50 to-emerald-100/30 dark:from-emerald-900/40 dark:to-emerald-950/20",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      hoverBg: "hover:from-emerald-200/70 hover:to-emerald-100/50",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {actions.map((item, index) => {
        const Icon = item.icon;
        return (
          <Button
            key={index}
            variant="ghost"
            disabled={item.action === "quick-plan" && loading}
            className={`flex flex-col items-center justify-center gap-1 h-16 px-2 rounded-xl bg-gradient-to-br ${item.gradient} ${item.hoverBg} transition-all hover:scale-[1.03] active:scale-[0.97] border-0`}
            onClick={() => onSelectAction(item.action)}
          >
            <Icon className={`w-5 h-5 ${item.iconColor}`} />
            <span className="text-[10px] font-semibold text-foreground leading-tight text-center">{item.title}</span>
          </Button>
        );
      })}
    </div>
  );
};
