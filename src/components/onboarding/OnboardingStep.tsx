import { ReactNode } from 'react';

export type StepName = 'name' | 'age' | 'allergies' | 'preferences' | 'objectives' | 'time';

interface OnboardingStepProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export const OnboardingStep = ({ title, description, children }: OnboardingStepProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground mb-2">{title}</h2>
        {description && (
          <p className="text-muted-foreground text-sm">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
};
