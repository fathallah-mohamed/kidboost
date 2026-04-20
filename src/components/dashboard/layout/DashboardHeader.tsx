import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/Logo';

interface DashboardHeaderProps {
  handleLogout: () => Promise<void>;
}

export const DashboardHeader = ({ handleLogout }: DashboardHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-4">
        <Link to="/" aria-label="Kidboost - Accueil">
          <Logo size="sm" withText priority />
        </Link>
        <h1 className="text-2xl font-bold hidden sm:block">Tableau de bord</h1>
      </div>
      <Button variant="outline" onClick={handleLogout}>
        Se déconnecter
      </Button>
    </div>
  );
};
