import { Card } from "@/components/ui/card";
import { ProgressBlock } from "./ProgressBlock";
import { StepTimeline } from "./StepTimeline";

interface ProgressStepsProps {
  onSectionChange?: (section: string) => void;
}

export const ProgressSteps = ({ onSectionChange }: ProgressStepsProps) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-2xl font-bold">Votre parcours de la semaine</h3>
        <p className="text-muted-foreground">
          Suivez ces étapes simples pour être organisé toute la semaine
        </p>
      </div>

      {/* Progress visualization */}
      <ProgressBlock
        recipesReady={4}
        totalRecipes={7}
        daysPlanned={2}
        totalDays={7}
        shoppingDone={false}
      />

      {/* Step timeline */}
      <Card className="p-6">
        <h4 className="text-lg font-semibold mb-6">Étapes à suivre</h4>
        <StepTimeline onSectionChange={onSectionChange || (() => {})} />
      </Card>
    </div>
  );
};