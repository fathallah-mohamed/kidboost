import { HeroSection } from '@/components/home/HeroSection';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { HowItWorksSection } from '@/components/home/HowItWorksSection';
import { ExploreSection } from '@/components/home/ExploreSection';
import { PremiumTeaser } from '@/components/home/PremiumTeaser';
import { useSession } from "@supabase/auth-helpers-react";

const Index = () => {
  const session = useSession();

  return (
    <div className="min-h-screen bg-[#FFF5E4]">
      <nav className="p-4 flex justify-end">
      </nav>
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <ExploreSection />
      <PremiumTeaser />
    </div>
  );
};

export default Index;