import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { StepName } from './OnboardingStep';
import { StepIndicator } from './StepIndicator';
import { NameStep } from './steps/NameStep';
import { AgeStep } from './steps/AgeStep';
import { AllergiesStep } from './steps/AllergiesStep';
import { PreferencesStep } from './steps/PreferencesStep';
import { ObjectivesStep } from './steps/ObjectivesStep';
import { TimeStep } from './steps/TimeStep';

interface OnboardingData {
  name: string;
  birthDate: string;
  allergies: string[];
  preferences: string[];
  dislikes: string[];
  objectives: string[];
  availableTime: number;
}

interface OnboardingFlowProps {
  userId: string;
  onComplete: () => void;
}

const STEPS: StepName[] = ['name', 'age', 'allergies', 'preferences', 'objectives', 'time'];

export const OnboardingFlow = ({ userId, onComplete }: OnboardingFlowProps) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    name: '',
    birthDate: '',
    allergies: [],
    preferences: [],
    dislikes: [],
    objectives: [],
    availableTime: 20,
  });

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    if (!data.name || !data.birthDate) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    try {
      // Create child profile
      const { error: childError } = await supabase
        .from('children_profiles')
        .insert({
          profile_id: userId,
          name: data.name,
          birth_date: data.birthDate,
          allergies: data.allergies,
          preferences: data.preferences,
          dislikes: data.dislikes,
          meal_objectives: data.objectives,
          available_time: data.availableTime,
          onboarding_completed: true,
        });

      if (childError) throw childError;

      // Mark user onboarding as completed
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', userId);

      if (profileError) throw profileError;

      toast.success('Profil créé avec succès !');
      onComplete();
      navigate('/dashboard');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (STEPS[currentStep]) {
      case 'name':
        return (
          <NameStep
            value={data.name}
            onChange={(name) => updateData({ name })}
            onNext={nextStep}
          />
        );
      case 'age':
        return (
          <AgeStep
            value={data.birthDate}
            onChange={(birthDate) => updateData({ birthDate })}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 'allergies':
        return (
          <AllergiesStep
            value={data.allergies}
            onChange={(allergies) => updateData({ allergies })}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 'preferences':
        return (
          <PreferencesStep
            preferences={data.preferences}
            dislikes={data.dislikes}
            onPreferencesChange={(preferences) => updateData({ preferences })}
            onDislikesChange={(dislikes) => updateData({ dislikes })}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 'objectives':
        return (
          <ObjectivesStep
            value={data.objectives}
            onChange={(objectives) => updateData({ objectives })}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 'time':
        return (
          <TimeStep
            value={data.availableTime}
            onChange={(availableTime) => updateData({ availableTime })}
            onComplete={handleComplete}
            onBack={prevStep}
            loading={loading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Bienvenue sur Kiboost ! 🎉
          </h1>
          <p className="text-muted-foreground">
            Configurons le profil de votre enfant
          </p>
        </div>

        <StepIndicator steps={STEPS} currentStep={currentStep} />

        <div className="bg-card rounded-2xl shadow-xl p-6 md:p-8 border border-border">
          {renderStep()}
        </div>
      </div>
    </div>
  );
};
