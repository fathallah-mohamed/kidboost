import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { supabase } from '@/integrations/supabase/client';
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Onboarding from "./pages/Onboarding";
import GenerateMeal from "./pages/GenerateMeal";
import PlanningExpress from "./pages/PlanningExpress";
import Recipes from "./pages/Recipes";
import RecipeDetail from "./pages/RecipeDetail";
import Planning from "./pages/Planning";
import ShoppingListPage from "./pages/ShoppingList";
import DayPlanning from "./pages/DayPlanning";
import Children from "./pages/Children";
import { Dashboard } from "./components/dashboard/Dashboard";
import { useSession } from "@supabase/auth-helpers-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RecipeGenerator } from "./components/dashboard/RecipeGenerator";
import { MealPlanner } from "./components/dashboard/MealPlanner";
import { ShoppingList } from "./components/dashboard/ShoppingList";
import { ChildrenProfiles } from "./components/dashboard/ChildrenProfiles";
import { FavoriteRecipes } from "./components/dashboard/favorites/FavoriteRecipes";
import { RecipeGeneratorPage } from "./components/dashboard/recipe/RecipeGeneratorPage";
import { RecipeDetailPage } from "./components/dashboard/recipe/RecipeDetailPage";
import { PlannerPage } from "./components/dashboard/planner/PlannerPage";
import { WeeklyPlanViewer } from "./components/dashboard/WeeklyPlanViewer";

const queryClient = new QueryClient();

// Component to check onboarding status and redirect
const OnboardingGuard = ({ children }: { children: React.ReactNode }) => {
  const session = useSession();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!session?.user?.id) {
        setCheckingOnboarding(false);
        return;
      }

      try {
        // Check if user has any children profiles
        const { data: children, error } = await supabase
          .from('children_profiles')
          .select('id')
          .eq('profile_id', session.user.id)
          .limit(1);

        if (error) throw error;

        // If no children profiles, needs onboarding
        setNeedsOnboarding(!children || children.length === 0);
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      } finally {
        setCheckingOnboarding(false);
      }
    };

    checkOnboarding();
  }, [session?.user?.id]);

  if (checkingOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (needsOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  const session = useSession();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED') {
        console.log('Token has been refreshed');
      }
      if (event === 'SIGNED_OUT') {
        toast.error("Votre session a expiré. Veuillez vous reconnecter.");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={session ? <Navigate to="/dashboard" /> : <Auth />} />
      <Route path="/signup" element={session ? <Navigate to="/dashboard" /> : <Auth />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/onboarding" element={session ? <Onboarding /> : <Navigate to="/login" />} />
      
      {/* New standalone pages */}
      <Route path="/generate-meal" element={session ? <GenerateMeal /> : <Navigate to="/login" />} />
      <Route path="/planning-express" element={session ? <PlanningExpress /> : <Navigate to="/login" />} />
      <Route path="/recipes" element={session ? <Recipes /> : <Navigate to="/login" />} />
      <Route path="/recipe/:id" element={session ? <RecipeDetail /> : <Navigate to="/login" />} />
      <Route path="/planning" element={session ? <Planning /> : <Navigate to="/login" />} />
      <Route path="/planning/day/:date" element={session ? <DayPlanning /> : <Navigate to="/login" />} />
      <Route path="/shopping-list" element={session ? <ShoppingListPage /> : <Navigate to="/login" />} />
      <Route path="/children" element={session ? <Children /> : <Navigate to="/login" />} />
      
      <Route 
        path="/dashboard" 
        element={
          session ? (
            <OnboardingGuard>
              <Dashboard session={session} />
            </OnboardingGuard>
          ) : (
            <Navigate to="/login" />
          )
        }
      >
        <Route index element={<Navigate to="/dashboard/overview" />} />
        <Route path="overview" element={<Dashboard session={session!} />} />
        <Route path="recipes" element={<RecipeGenerator onSectionChange={() => {}} />} />
        <Route path="generate" element={<RecipeGeneratorPage />} />
        <Route path="generate-recipes" element={<RecipeGeneratorPage />} />
        <Route path="planner" element={<PlannerPage userId={session?.user?.id || ''} />} />
        <Route path="view-planner" element={<WeeklyPlanViewer userId={session?.user?.id || ''} />} />
        <Route path="shopping" element={<ShoppingList userId={session?.user?.id || ''} onSectionChange={() => {}} />} />
        <Route path="children" element={<ChildrenProfiles userId={session?.user?.id || ''} onSelectChild={() => {}} />} />
        <Route path="favorites" element={<FavoriteRecipes onSectionChange={() => {}} />} />
        <Route path="recipe/:recipeId" element={<RecipeDetailPage />} />
      </Route>
    </Routes>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionContextProvider supabaseClient={supabase}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </SessionContextProvider>
    </QueryClientProvider>
  );
};

export default App;
