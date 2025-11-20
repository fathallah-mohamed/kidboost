import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface PriorityTaskCardProps {
  emoji: string;
  message: string;
  buttonLabel: string;
  onAction: () => void;
  priority?: "high" | "medium" | "low";
}

export const PriorityTaskCard = ({
  emoji,
  message,
  buttonLabel,
  onAction,
  priority = "medium",
}: PriorityTaskCardProps) => {
  const getGradient = () => {
    switch (priority) {
      case "high":
        return "from-primary/10 via-accent/5 to-pastel-yellow/10";
      case "medium":
        return "from-pastel-yellow/10 via-pastel-blue/5 to-white";
      default:
        return "from-pastel-blue/10 to-white";
    }
  };

  return (
    <Card className={`p-5 bg-gradient-to-br ${getGradient()} border-2 hover:shadow-md transition-all`}>
      <div className="flex flex-col sm:flex-row items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-2xl shadow-sm">
            {emoji}
          </div>
        </div>
        
        <div className="flex-1 space-y-3">
          <p className="text-sm font-medium leading-relaxed">{message}</p>
          <Button
            onClick={onAction}
            size="sm"
            className="w-full sm:w-auto group shadow-sm"
          >
            {buttonLabel}
            <ArrowRight className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
