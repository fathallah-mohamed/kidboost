import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChefHat, Calendar, ShoppingCart, Sparkles } from "lucide-react";

interface ActionCardsProps {
  onSelectAction: (action: string) => void;
}

export const ActionCards = ({ onSelectAction }: ActionCardsProps) => {
  const actions = [
    {
      icon: Sparkles,
      title: "Planning Express",
      description: "L'IA planifie toute votre semaine en 1 clic",
      action: "quick-plan",
      gradient: "from-primary/20 to-accent/20",
      iconColor: "text-primary",
      badge: "Rapide",
      badgeColor: "bg-primary text-white",
    },
    {
      icon: ChefHat,
      title: "Nouvelles recettes",
      description: "Découvrez des recettes adaptées à vos enfants",
      action: "recipes",
      gradient: "from-pastel-blue/20 to-pastel-purple/20",
      iconColor: "text-accent",
      badge: "Populaire",
      badgeColor: "bg-accent text-white",
    },
    {
      icon: Calendar,
      title: "Planifier manuellement",
      description: "Choisissez vos recettes jour par jour",
      action: "planner",
      gradient: "from-pastel-purple/20 to-pastel-green/20",
      iconColor: "text-pastel-purple-foreground",
    },
    {
      icon: ShoppingCart,
      title: "Liste de courses",
      description: "Générez votre liste automatiquement",
      action: "shopping",
      gradient: "from-pastel-green/20 to-pastel-yellow/20",
      iconColor: "text-pastel-green-foreground",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {actions.map((item, index) => (
        <Card
          key={index}
          className={`relative overflow-hidden bg-gradient-to-br ${item.gradient} hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer group`}
          onClick={() => onSelectAction(item.action)}
        >
          <div className="p-5 space-y-3">
            {/* Badge */}
            {item.badge && (
              <div className={`inline-flex px-2 py-1 ${item.badgeColor} text-xs font-medium rounded-full`}>
                {item.badge}
              </div>
            )}
            
            {/* Icon */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <item.icon className={`w-6 h-6 ${item.iconColor}`} />
              </div>
              <h4 className="font-bold text-sm">{item.title}</h4>
            </div>
            
            {/* Description */}
            <p className="text-xs text-muted-foreground leading-relaxed">
              {item.description}
            </p>
            
            {/* Action */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between group-hover:bg-white/50 transition-colors"
            >
              Accéder
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
};
