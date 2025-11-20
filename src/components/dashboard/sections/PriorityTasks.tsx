import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PriorityTaskCard } from "./PriorityTaskCard";

export const PriorityTasks = () => {
  const navigate = useNavigate();
  
  const tasks = [
    {
      id: "plan-meals",
      message: "Vous n'avez pas encore planifié cette semaine 😊",
      emoji: "📅",
      action: "Planifier maintenant",
      route: "planner",
      priority: "high" as const,
    },
    {
      id: "shopping-list",
      message: "Votre liste de courses a besoin d'une petite mise à jour.",
      emoji: "🛒",
      action: "Mettre à jour la liste",
      route: "shopping",
      priority: "medium" as const,
    }
  ];

  return (
    <Card className="p-6 space-y-4 bg-gradient-to-br from-pastel-yellow/10 to-white">
      <h3 className="text-xl font-semibold flex items-center gap-2">
        <div className="w-10 h-10 rounded-full bg-pastel-yellow/30 flex items-center justify-center">
          <AlertCircle className="w-5 h-5 text-pastel-yellow-foreground" />
        </div>
        À faire en priorité
      </h3>

      <div className="space-y-3">
        {tasks.map((task) => (
          <PriorityTaskCard
            key={task.id}
            emoji={task.emoji}
            message={task.message}
            buttonLabel={task.action}
            onAction={() => navigate(task.route)}
            priority={task.priority}
          />
        ))}
      </div>
    </Card>
  );
};