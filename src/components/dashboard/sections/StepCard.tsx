import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";
import { StepStatus } from "./StepTimeline";

interface StepCardProps {
  step: number;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  status: StepStatus;
  buttonLabel: string;
  onAction: () => void;
}

export const StepCard = ({
  step,
  icon: Icon,
  title,
  subtitle,
  status,
  buttonLabel,
  onAction,
}: StepCardProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case "completed":
        return {
          badge: "Terminé",
          badgeColor: "bg-pastel-green text-pastel-green-foreground",
          iconBg: "bg-pastel-green/20",
          iconColor: "text-pastel-green-foreground",
        };
      case "in_progress":
        return {
          badge: "En cours",
          badgeColor: "bg-pastel-yellow text-pastel-yellow-foreground",
          iconBg: "bg-pastel-yellow/20",
          iconColor: "text-pastel-yellow-foreground",
        };
      default:
        return {
          badge: "À faire",
          badgeColor: "bg-muted text-muted-foreground",
          iconBg: "bg-muted/20",
          iconColor: "text-muted-foreground",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Card className="p-6 hover:shadow-lg transition-all hover:-translate-y-1 bg-white">
      <div className="flex flex-col sm:flex-row items-start gap-4">
        {/* Icon */}
        <div className="relative flex-shrink-0">
          <div className={`w-16 h-16 rounded-2xl ${config.iconBg} flex items-center justify-center`}>
            <Icon className={`w-8 h-8 ${config.iconColor}`} />
          </div>
          <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shadow-md">
            {step}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-bold text-lg mb-1">{title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{subtitle}</p>
            </div>
            <Badge className={`${config.badgeColor} shrink-0`}>{config.badge}</Badge>
          </div>

          <Button
            onClick={onAction}
            variant={status === "completed" ? "outline" : "default"}
            className="w-full sm:w-auto"
          >
            {buttonLabel}
          </Button>
        </div>
      </div>
    </Card>
  );
};
