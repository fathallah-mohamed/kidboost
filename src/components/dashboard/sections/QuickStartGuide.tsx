import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChefHat, Users, CalendarDays, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";

interface QuickStartGuideProps {
  onSelectStep: (step: string) => void;
}

export const QuickStartGuide = ({ onSelectStep }: QuickStartGuideProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem("quickStartDismissed");
    if (isDismissed) {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("quickStartDismissed", "true");
    setDismissed(true);
  };

  const steps = [
    {
      icon: Users,
      title: "1. Créez les profils de vos enfants",
      description: "Ajoutez leurs goûts, allergies et préférences alimentaires",
      action: "children",
      buttonLabel: "Créer un profil enfant",
      color: "bg-pastel-blue",
    },
    {
      icon: ChefHat,
      title: "2. Générez des recettes adaptées",
      description: "L'IA crée des recettes personnalisées pour chaque enfant",
      action: "recipes",
      buttonLabel: "Générer des recettes",
      color: "bg-primary/20",
    },
    {
      icon: CalendarDays,
      title: "3. Planifiez votre semaine",
      description: "Organisez vos repas jour par jour en quelques clics",
      action: "planner",
      buttonLabel: "Planifier maintenant",
      color: "bg-pastel-purple/30",
    },
  ];

  if (dismissed) return null;

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  return (
    <Card className="relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl -ml-16 -mb-16" />
      
      <div className="relative p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-primary to-accent rounded-xl shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Guide de démarrage rapide</h3>
              <p className="text-sm text-muted-foreground">
                Lancez-vous en 3 étapes simples
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground"
          >
            Masquer
          </Button>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentStep
                  ? "w-8 bg-primary"
                  : "w-2 bg-muted hover:bg-muted-foreground/50"
              }`}
            />
          ))}
        </div>

        {/* Current step content */}
        <div className="flex flex-col md:flex-row items-center gap-6 p-6 bg-white rounded-xl">
          <div className={`w-20 h-20 rounded-2xl ${currentStepData.color} flex items-center justify-center flex-shrink-0`}>
            <Icon className="w-10 h-10 text-foreground" />
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <h4 className="text-lg font-bold mb-2">{currentStepData.title}</h4>
            <p className="text-sm text-muted-foreground mb-4">
              {currentStepData.description}
            </p>
            <Button
              onClick={() => onSelectStep(currentStepData.action)}
              className="w-full md:w-auto"
            >
              {currentStepData.buttonLabel}
            </Button>
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
          >
            Précédent
          </Button>
          
          <span className="text-sm text-muted-foreground">
            Étape {currentStep + 1} sur {steps.length}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
            disabled={currentStep === steps.length - 1}
          >
            Suivant
          </Button>
        </div>
      </div>
    </Card>
  );
};
