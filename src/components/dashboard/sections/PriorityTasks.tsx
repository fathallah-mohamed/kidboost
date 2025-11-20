import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const PriorityTasks = () => {
  const navigate = useNavigate();
  
  const tasks = [
    {
      id: "plan-meals",
      message: "On s'y met ensemble ? Planifions vos repas pour cette semaine",
      emoji: "🎯",
      action: "Planifier maintenant",
      route: "planner",
      priority: "high"
    },
    {
      id: "shopping-list",
      message: "Prêt à faire les courses ? Votre liste vous attend",
      emoji: "🛒",
      action: "Voir ma liste",
      route: "shopping",
      priority: "medium"
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "from-primary/10 to-accent/10 border-primary/20";
      case "medium":
        return "from-pastel-yellow to-pastel-purple border-pastel-yellow";
      default:
        return "from-pastel-blue to-pastel-green border-pastel-blue";
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-primary" />
        À faire en priorité cette semaine
      </h3>

      <div className="space-y-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`relative overflow-hidden p-4 rounded-xl border-2 bg-gradient-to-r animate-fade-in ${getPriorityColor(task.priority)}`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">{task.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium mb-3">{task.message}</p>
                <Button
                  size="sm"
                  onClick={() => navigate(task.route)}
                  className="group shadow-sm"
                >
                  {task.action}
                  <ArrowRight className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};