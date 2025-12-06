import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { OnboardingStep } from '../OnboardingStep';
import { ArrowRight, ArrowLeft, Calendar } from 'lucide-react';

interface AgeStepProps {
  value: string;
  onChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const AgeStep = ({ value, onChange, onNext, onBack }: AgeStepProps) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value) {
      onNext();
    }
  };

  // Calculate max date (today) and min date (18 years ago)
  const today = new Date().toISOString().split('T')[0];
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 18);
  const minDateStr = minDate.toISOString().split('T')[0];

  return (
    <OnboardingStep
      title="Quelle est sa date de naissance ?"
      description="L'âge nous aide à adapter les recettes et portions"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="pl-10 h-12 text-lg"
            max={today}
            min={minDateStr}
            required
          />
        </div>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="flex-1 h-12"
          >
            <ArrowLeft className="mr-2 w-5 h-5" />
            Retour
          </Button>
          <Button 
            type="submit" 
            className="flex-1 h-12"
            disabled={!value}
          >
            Continuer
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </form>
    </OnboardingStep>
  );
};
