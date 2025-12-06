import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { OnboardingStep } from '../OnboardingStep';
import { ArrowRight, User } from 'lucide-react';

interface NameStepProps {
  value: string;
  onChange: (value: string) => void;
  onNext: () => void;
}

export const NameStep = ({ value, onChange, onNext }: NameStepProps) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onNext();
    }
  };

  return (
    <OnboardingStep
      title="Comment s'appelle votre enfant ?"
      description="Nous utiliserons ce prénom pour personnaliser les recettes"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Prénom de l'enfant"
            className="pl-10 h-12 text-lg"
            autoFocus
            required
            maxLength={50}
          />
        </div>
        <Button 
          type="submit" 
          className="w-full h-12 text-lg"
          disabled={!value.trim()}
        >
          Continuer
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </form>
    </OnboardingStep>
  );
};
