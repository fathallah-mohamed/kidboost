import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProgressSteps } from "./ProgressSteps";
import { PriorityTasks } from "./PriorityTasks";
import { WeeklyOverview } from "./WeeklyOverview";
import { Button } from "@/components/ui/button";
import { Sparkles, Zap } from "lucide-react";
import { useQuickPlan } from "../meal-planner/hooks/useQuickPlan";

interface WelcomeSectionProps {
  userId: string;
  onSectionChange: (section: string) => void;
}

export const WelcomeSection = ({ userId, onSectionChange }: WelcomeSectionProps) => {
  const [username, setUsername] = useState<string>("");
  const [childrenNames, setChildrenNames] = useState<string[]>([]);
  const { generateQuickPlan, loading } = useQuickPlan(userId);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUsername(user.email.split("@")[0]);
      }

      // Fetch children names
      const { data: children } = await supabase
        .from('children_profiles')
        .select('name')
        .eq('profile_id', userId)
        .limit(2);
      
      if (children) {
        setChildrenNames(children.map(c => c.name));
      }
    };
    fetchUserData();
  }, [userId]);

  const getCurrentWeek = () => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay() + 1);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    
    return `Semaine du ${start.getDate()} au ${end.getDate()} ${end.toLocaleDateString('fr-FR', { month: 'long' })}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with mascot */}
      <Card className="p-6 bg-gradient-to-r from-primary/10 via-accent/10 to-pastel-purple relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1">
            <h2 className="text-3xl font-bold mb-2 flex items-center gap-2">
              Bonjour {username} 👋
            </h2>
            <p className="text-muted-foreground text-lg">
              {childrenNames.length > 0 
                ? `Planifions ensemble les repas de ${childrenNames.join(' et ')} cette semaine.`
                : "Planifions ensemble les repas de vos enfants cette semaine."}
            </p>
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-white/80 rounded-full text-sm font-medium">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              {getCurrentWeek()}
            </div>
          </div>
          <Button 
            onClick={generateQuickPlan}
            disabled={loading}
            size="lg"
            className="whitespace-nowrap group hover:scale-105 transition-all duration-300 shadow-lg"
          >
            {loading ? (
              <Sparkles className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Zap className="w-4 h-4 mr-2 group-hover:text-yellow-400" />
            )}
            Planning express de la semaine
          </Button>
        </div>
        
        {/* Floating mascot */}
        <div className="absolute -top-2 -right-2 w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center shadow-lg animate-float hidden md:flex">
          <span className="text-3xl">✨</span>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6">
        <ProgressSteps onSectionChange={onSectionChange} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PriorityTasks />
          <WeeklyOverview />
        </div>
      </div>
    </div>
  );
};