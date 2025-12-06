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
      color: "bg-primary/20 hover:bg-primary/30",
      iconColor: "text-primary",
    },
    {
      icon: ChefHat,
      title: "Recettes",
      action: "recipes",
      color: "bg-accent/20 hover:bg-accent/30",
      iconColor: "text-accent",
    },
    {
      icon: Calendar,
      title: "Planifier",
      action: "planner",
      color: "bg-pastel-purple/30 hover:bg-pastel-purple/40",
      iconColor: "text-pastel-purple-foreground",
    },
    {
      icon: ShoppingCart,
      title: "Courses",
      action: "shopping",
      color: "bg-pastel-green/30 hover:bg-pastel-green/40",
      iconColor: "text-pastel-green-foreground",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {actions.map((item, index) => {
        const Icon = item.icon;
        return (
          <Button
            key={index}
            variant="ghost"
            disabled={item.action === "quick-plan" && loading}
            className={`flex flex-col items-center gap-1 h-auto py-2.5 px-2 rounded-xl ${item.color} transition-all hover:scale-[1.02] active:scale-[0.98]`}
            onClick={() => onSelectAction(item.action)}
          >
            <Icon className={`w-6 h-6 ${item.iconColor}`} />
            <span className="text-xs font-medium text-foreground">{item.title}</span>
          </Button>
        );
      })}
    </div>
  );
};
