import { HeroSection } from '@/components/home/HeroSection';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { HowItWorksSection } from '@/components/home/HowItWorksSection';
import { ExploreSection } from '@/components/home/ExploreSection';
import { PremiumTeaser } from '@/components/home/PremiumTeaser';
import { useSession } from "@supabase/auth-helpers-react";
import { Link } from 'react-router-dom';
import kidboostLogo from '@/assets/kidboost-logo.png';

const Index = () => {
  const session = useSession();

  return (
    <div className="min-h-screen bg-[#FFF5E4]">
      <nav className="p-4 flex justify-between items-center container mx-auto">
        <Link to="/" className="flex items-center gap-2">
          <img src={kidboostLogo} alt="Kidboost" className="h-12 w-auto" />
        </Link>
        <div />
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