import { Session } from '@supabase/auth-helpers-react';
import { WelcomeSection } from '../sections/WelcomeSection';
import { RecipeGenerator } from '../RecipeGenerator';
import { WeeklyPlanViewer } from '../WeeklyPlanViewer';
import { ChildrenProfiles } from '../ChildrenProfiles';
import { ShoppingList } from '../ShoppingList';
import { FavoriteRecipes } from '../favorites/FavoriteRecipes';
import { CategoriesGrid } from '../categories/CategoriesGrid';
import { PlannerPage } from '../planner/PlannerPage';
import { ActivityCenter } from '../activity-center/ActivityCenter';

interface DashboardContentProps {
  session: Session;
  activeSection: string;
  setActiveSection: (section: string) => void;
}

export const DashboardContent = ({ 
  session, 
  activeSection, 
  setActiveSection 
}: DashboardContentProps) => {
  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <WelcomeSection 
            userId={session.user.id} 
            onSectionChange={setActiveSection}
          />
        );
      case 'categories':
        return <ActivityCenter />;
      case 'recipes':
        return <RecipeGenerator onSectionChange={setActiveSection} />;
      case 'planner':
        return <PlannerPage userId={session.user.id} />;
      case 'view-planner':
        return <WeeklyPlanViewer userId={session.user.id} onSectionChange={setActiveSection} />;
      case 'children':
        return <ChildrenProfiles userId={session.user.id} onSelectChild={() => {}} />;
      case 'shopping':
        return <ShoppingList userId={session.user.id} onSectionChange={setActiveSection} />;
      case 'favorites':
        return <FavoriteRecipes onSectionChange={setActiveSection} />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {renderContent()}
    </div>
  );
};