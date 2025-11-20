import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";

interface ActivityCardProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  buttonLabel: string;
  onAction: () => void;
  isComingSoon?: boolean;
  gradient: string;
}

export const ActivityCard = ({
  icon: Icon,
  title,
  subtitle,
  buttonLabel,
  onAction,
  isComingSoon = false,
  gradient,
}: ActivityCardProps) => {
  return (
    <Card className={`relative overflow-hidden p-6 hover:shadow-xl transition-all hover:-translate-y-1 ${gradient}`}>
      {isComingSoon && (
        <Badge className="absolute top-4 right-4 bg-pastel-purple text-pastel-purple-foreground">
          Bientôt disponible ✨
        </Badge>
      )}
      
      <div className="space-y-4">
        <div className="w-16 h-16 rounded-full bg-white/50 flex items-center justify-center">
          <Icon className="w-8 h-8" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-bold">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{subtitle}</p>
        </div>
        
        <Button 
          onClick={onAction}
          disabled={isComingSoon}
          className="w-full"
          variant={isComingSoon ? "outline" : "default"}
        >
          {buttonLabel}
        </Button>
        
        {isComingSoon && (
          <p className="text-xs text-muted-foreground text-center">
            Nous préparons une sélection d'idées testées par de vraies familles
          </p>
        )}
      </div>
    </Card>
  );
};
