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
      color: "bg-primary/20 hover:bg-primary/30 text-foreground",
      iconColor: "text-primary",
    },
    {
      icon: ChefHat,
      title: "Nouvelles recettes",
      action: "recipes",
      color: "bg-accent/20 hover:bg-accent/30 text-foreground",
      iconColor: "text-accent",
    },
    {
      icon: Calendar,
      title: "Planifier",
      action: "planner",
      color: "bg-pastel-purple/30 hover:bg-pastel-purple/40 text-foreground",
      iconColor: "text-pastel-purple-foreground",
    },
    {
      icon: ShoppingCart,
      title: "Courses",
      action: "shopping",
      color: "bg-pastel-green/30 hover:bg-pastel-green/40 text-foreground",
      iconColor: "text-pastel-green-foreground",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {actions.map((item, index) => (
        <Button
          key={index}
          variant="ghost"
          disabled={item.action === "quick-plan" && loading}
          className={`flex flex-col items-center gap-1.5 h-auto py-3 px-2 rounded-xl ${item.color} transition-all`}
          onClick={() => onSelectAction(item.action)}
        >
          <item.icon className={`w-5 h-5 ${item.iconColor}`} />
          <span className="text-xs font-medium truncate w-full text-center">{item.title}</span>
        </Button>
      ))}
    </div>
  );
};
