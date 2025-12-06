import { Button } from '@/components/ui/button';
import { OnboardingStep } from '../OnboardingStep';
import { ArrowLeft, Check, Loader2, Clock } from 'lucide-react';

interface TimeStepProps {
  value: number;
  onChange: (value: number) => void;
  onComplete: () => void;
  onBack: () => void;
  loading: boolean;
}

const TIME_OPTIONS = [
  { value: 5, label: '5 min', description: 'Ultra rapide' },
  { value: 10, label: '10 min', description: 'Express' },
  { value: 20, label: '20 min', description: 'Classique' },
  { value: 30, label: '30 min+', description: 'Tranquille' },
];

export const TimeStep = ({ value, onChange, onComplete, onBack, loading }: TimeStepProps) => {
  return (
    <OnboardingStep
      title="Combien de temps avez-vous ?"
      description="Nous proposerons des recettes adaptées à votre emploi du temps"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3">
          {TIME_OPTIONS.map(option => {
            const isSelected = value === option.value;
            
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange(option.value)}
                className={`relative p-4 rounded-xl border-2 text-center transition-all ${
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
                <Clock className={`w-8 h-8 mx-auto mb-2 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                <div className="font-bold text-xl text-foreground">{option.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{option.description}</div>
              </button>
            );
          })}
        </div>

        <div className="flex gap-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onBack} 
            className="flex-1 h-12"
            disabled={loading}
          >
            <ArrowLeft className="mr-2 w-5 h-5" />
            Retour
          </Button>
          <Button 
            type="button" 
            onClick={onComplete} 
            className="flex-1 h-12"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                Création...
              </>
            ) : (
              <>
                Terminer
                <Check className="ml-2 w-5 h-5" />
              </>
            )}
          </Button>
        </div>
      </div>
    </OnboardingStep>
  );
};
