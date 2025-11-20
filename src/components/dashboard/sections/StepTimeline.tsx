import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Clock, UserCircle2, ChefHat, Calendar, ShoppingCart, CheckCircle } from "lucide-react";
import { LucideIcon } from "lucide-react";

export type StepStatus = "completed" | "in_progress" | "not_started";

interface TimelineStepProps {
  step: number;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  status: StepStatus;
  buttonLabel: string;
  onAction: () => void;
  isLast?: boolean;
}

export const TimelineStep = ({
  step,
  icon: Icon,
  title,
  subtitle,
  status,
  buttonLabel,
  onAction,
  isLast = false,
}: TimelineStepProps) => {
  const getStatusStyles = () => {
    switch (status) {
      case "completed":
        return {
          bgColor: "bg-pastel-green",
          iconColor: "text-pastel-green-foreground",
          statusIcon: CheckCircle2,
          statusText: "Terminé",
          statusColor: "text-pastel-green-foreground",
        };
      case "in_progress":
        return {
          bgColor: "bg-pastel-yellow",
          iconColor: "text-pastel-yellow-foreground",
          statusIcon: Clock,
          statusText: "En cours",
          statusColor: "text-pastel-yellow-foreground",
        };
      default:
        return {
          bgColor: "bg-muted",
          iconColor: "text-muted-foreground",
          statusIcon: Circle,
          statusText: "À faire",
          statusColor: "text-muted-foreground",
        };
    }
  };

  const styles = getStatusStyles();
  const StatusIcon = styles.statusIcon;

  return (
    <div className="relative">
      <div className="flex gap-4 items-start">
        {/* Icon circle */}
        <div className="relative flex-shrink-0">
          <div className={`w-14 h-14 rounded-full ${styles.bgColor} flex items-center justify-center shadow-md`}>
            <Icon className={`w-7 h-7 ${styles.iconColor}`} />
          </div>
          <div
            className={`absolute top-2 left-2 w-4 h-4 rounded-full bg-white flex items-center justify-center text-xs font-bold ${styles.iconColor}`}
          >
            {step}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 pb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm border-2 border-transparent hover:border-primary/20 transition-all">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1">
                <h4 className="font-semibold text-lg mb-1">{title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{subtitle}</p>
              </div>
              <div className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-muted/50">
                <StatusIcon className={`w-3 h-3 ${styles.statusColor}`} />
                <span className={styles.statusColor}>{styles.statusText}</span>
              </div>
            </div>
            <Button
              onClick={onAction}
              size="sm"
              variant={status === "completed" ? "outline" : "default"}
              className="w-full sm:w-auto"
            >
              {buttonLabel}
            </Button>
          </div>
        </div>
      </div>

      {/* Connecting line */}
      {!isLast && (
        <div className="absolute left-7 top-14 w-0.5 h-8 bg-border transform -translate-x-1/2" />
      )}
    </div>
  );
};

interface StepTimelineProps {
  onSectionChange: (section: string) => void;
}

export const StepTimeline = ({ onSectionChange }: StepTimelineProps) => {
  const steps = [
    {
      step: 1,
      icon: UserCircle2,
      title: "Configurer les profils enfants",
      subtitle: "Mettez à jour les goûts et contraintes si besoin.",
      status: "completed" as StepStatus,
      buttonLabel: "Voir mes enfants",
      action: "children",
    },
    {
      step: 2,
      icon: ChefHat,
      title: "Générer des recettes",
      subtitle: "Propositions adaptées pour la semaine.",
      status: "completed" as StepStatus,
      buttonLabel: "Générer maintenant",
      action: "recipes",
    },
    {
      step: 3,
      icon: Calendar,
      title: "Planifier les repas",
      subtitle: "Choisissez les plats pour chaque jour.",
      status: "in_progress" as StepStatus,
      buttonLabel: "Ouvrir le planning",
      action: "planner",
    },
    {
      step: 4,
      icon: ShoppingCart,
      title: "Liste de courses",
      subtitle: "Validez les quantités et marques.",
      status: "not_started" as StepStatus,
      buttonLabel: "Préparer ma liste",
      action: "shopping",
    },
    {
      step: 5,
      icon: CheckCircle,
      title: "Valider le planning",
      subtitle: "Bloquez votre planning final, et détendez-vous.",
      status: "not_started" as StepStatus,
      buttonLabel: "Valider la semaine",
      action: "view-planner",
    },
  ];

  return (
    <div className="space-y-0">
      {steps.map((step, index) => (
        <TimelineStep
          key={step.step}
          step={step.step}
          icon={step.icon}
          title={step.title}
          subtitle={step.subtitle}
          status={step.status}
          buttonLabel={step.buttonLabel}
          onAction={() => onSectionChange(step.action)}
          isLast={index === steps.length - 1}
        />
      ))}
    </div>
  );
};
