import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import kidboostLogo from '@/assets/kidboost-logo.png';

interface DashboardHeaderProps {
  handleLogout: () => Promise<void>;
}

export const DashboardHeader = ({ handleLogout }: DashboardHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={kidboostLogo} alt="Kidboost" className="h-10 w-auto" />
        </Link>
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
      </div>
      <Button variant="outline" onClick={handleLogout}>
        Se déconnecter
      </Button>
    </div>
  );
};