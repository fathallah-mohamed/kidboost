import { useSession } from '@supabase/auth-helpers-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';

const Onboarding = () => {
  const session = useSession();
  const navigate = useNavigate();

  if (!session) {
    return <Navigate to="/login" />;
  }

  const handleComplete = () => {
    navigate('/dashboard');
  };

  return (
    <OnboardingFlow 
      userId={session.user.id} 
      onComplete={handleComplete} 
    />
  );
};

export default Onboarding;
