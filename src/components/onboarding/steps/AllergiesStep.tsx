import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { OnboardingStep } from '../OnboardingStep';
import { ArrowRight, ArrowLeft, Plus, X, AlertTriangle } from 'lucide-react';

interface AllergiesStepProps {
  value: string[];
  onChange: (value: string[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const COMMON_ALLERGIES = [
  'Gluten', 'Lactose', 'Arachides', 'Fruits à coque', 
  'Œufs', 'Poisson', 'Crustacés', 'Soja', 'Sésame'
];

export const AllergiesStep = ({ value, onChange, onNext, onBack }: AllergiesStepProps) => {
  const [customAllergy, setCustomAllergy] = useState('');

  const toggleAllergy = (allergy: string) => {
    if (value.includes(allergy)) {
      onChange(value.filter(a => a !== allergy));
    } else {
      onChange([...value, allergy]);
    }
  };

  const addCustomAllergy = () => {
    if (customAllergy.trim() && !value.includes(customAllergy.trim())) {
      onChange([...value, customAllergy.trim()]);
      setCustomAllergy('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomAllergy();
    }
  };

  return (
    <OnboardingStep
      title="A-t-il des allergies ou restrictions ?"
      description="Sélectionnez les allergies ou ajoutez les vôtres"
    >
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          {COMMON_ALLERGIES.map(allergy => (
            <Badge
              key={allergy}
              variant={value.includes(allergy) ? 'default' : 'outline'}
              className="cursor-pointer py-2 px-3 text-sm transition-all hover:scale-105"
              onClick={() => toggleAllergy(allergy)}
            >
              {value.includes(allergy) && <AlertTriangle className="w-3 h-3 mr-1" />}
              {allergy}
            </Badge>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            value={customAllergy}
            onChange={(e) => setCustomAllergy(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Autre allergie..."
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={addCustomAllergy}
            disabled={!customAllergy.trim()}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {value.filter(a => !COMMON_ALLERGIES.includes(a)).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {value.filter(a => !COMMON_ALLERGIES.includes(a)).map(allergy => (
              <Badge key={allergy} variant="secondary" className="py-1 px-2">
                {allergy}
                <X
                  className="w-3 h-3 ml-1 cursor-pointer"
                  onClick={() => onChange(value.filter(a => a !== allergy))}
                />
              </Badge>
            ))}
          </div>
        )}

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
            type="button"
            onClick={onNext}
            className="flex-1 h-12"
          >
            {value.length === 0 ? 'Aucune allergie' : 'Continuer'}
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>
    </OnboardingStep>
  );
};
