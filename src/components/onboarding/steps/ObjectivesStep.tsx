import { Button } from '@/components/ui/button';
import { OnboardingStep } from '../OnboardingStep';
import { ArrowRight, ArrowLeft, Cookie, Briefcase, Clock, Utensils, Check } from 'lucide-react';

interface ObjectivesStepProps {
  value: string[];
  onChange: (value: string[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const OBJECTIVES = [
  { id: 'gouters', label: 'Goûters', icon: Cookie, description: 'Recettes de goûters sains' },
  { id: 'lunchbox', label: 'Lunchbox', icon: Briefcase, description: 'Repas à emporter' },
  { id: 'rapides', label: 'Repas rapides', icon: Clock, description: 'Moins de 20 min' },
  { id: 'soir', label: 'Repas du soir', icon: Utensils, description: 'Dîners équilibrés' },
];

export const ObjectivesStep = ({ value, onChange, onNext, onBack }: ObjectivesStepProps) => {
  const toggleObjective = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter(o => o !== id));
    } else {
      onChange([...value, id]);
    }
  };

  return (
    <OnboardingStep
      title="Quels sont vos objectifs ?"
      description="Sélectionnez les types de recettes qui vous intéressent"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {OBJECTIVES.map(objective => {
            const Icon = objective.icon;
            const isSelected = value.includes(objective.id);
            
            return (
              <button
                key={objective.id}
                type="button"
                onClick={() => toggleObjective(objective.id)}
                className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50 hover:bg-accent/50'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
                <Icon className={`w-8 h-8 mb-2 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                <div className="font-medium text-foreground">{objective.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{objective.description}</div>
              </button>
            );
          })}
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onBack} className="flex-1 h-12">
            <ArrowLeft className="mr-2 w-5 h-5" />
            Retour
          </Button>
          <Button 
            type="button" 
            onClick={onNext} 
            className="flex-1 h-12"
            disabled={value.length === 0}
          >
            Continuer
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>
    </OnboardingStep>
  );
};
