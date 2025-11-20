import { ProgressSummary } from "./ProgressSummary";
import { StepCard } from "./StepCard";
import { UserCircle2, ChefHat, Calendar, ShoppingCart, CheckCircle } from "lucide-react";
import { StepStatus } from "./StepTimeline";

interface ProgressStepsProps {
  onSectionChange?: (section: string) => void;
}

export const ProgressSteps = ({ onSectionChange }: ProgressStepsProps) => {
  const steps = [
    {
      step: 1,
      icon: UserCircle2,
      title: "Profils enfants",
      subtitle: "Gérez les goûts, allergies et préférences.",
      status: "completed" as StepStatus,
      buttonLabel: "Voir mes enfants",
      action: "children",
    },
    {
      step: 2,
      icon: ChefHat,
      title: "Générer des recettes",
      subtitle: "Idées adaptées pour chaque enfant.",
      status: "completed" as StepStatus,
      buttonLabel: "Générer maintenant",
      action: "recipes",
    },
    {
      step: 3,
      icon: Calendar,
      title: "Planifier les repas",
      subtitle: "Complétez le planning jour par jour.",
      status: "in_progress" as StepStatus,
      buttonLabel: "Planifier",
      action: "planner",
    },
    {
      step: 4,
      icon: ShoppingCart,
      title: "Liste de courses",
      subtitle: "Liste auto-générée prête à cocher.",
      status: "not_started" as StepStatus,
      buttonLabel: "Préparer ma liste",
      action: "shopping",
    },
    {
      step: 5,
      icon: CheckCircle,
      title: "Valider le planning",
      subtitle: "Confirmez la semaine et détendez-vous.",
      status: "not_started" as StepStatus,
      buttonLabel: "Valider",
      action: "view-planner",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Progress visualization with donuts */}
      <ProgressSummary
        recipesReady={4}
        totalRecipes={7}
        daysPlanned={2}
        totalDays={7}
        shoppingDone={false}
      />

      {/* Step cards */}
      <div className="space-y-4">
        {steps.map((step) => (
          <StepCard
            key={step.step}
            step={step.step}
            icon={step.icon}
            title={step.title}
            subtitle={step.subtitle}
            status={step.status}
            buttonLabel={step.buttonLabel}
            onAction={() => onSectionChange?.(step.action)}
          />
        ))}
      </div>
    </div>
  );
};