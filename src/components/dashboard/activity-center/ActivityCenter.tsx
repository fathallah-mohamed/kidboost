import { ChefHat, Dumbbell, Heart, Users } from "lucide-react";
import { ActivityCard } from "./ActivityCard";
import { useNavigate } from "react-router-dom";

export const ActivityCenter = () => {
  const navigate = useNavigate();

  const activities = [
    {
      icon: ChefHat,
      title: "Recettes",
      subtitle: "Découvrez des centaines de recettes adaptées aux goûts et besoins nutritionnels de vos enfants.",
      buttonLabel: "Explorer les recettes",
      gradient: "bg-gradient-to-br from-primary/10 to-accent/10",
      action: () => navigate('/dashboard/recipes'),
      isComingSoon: false,
    },
    {
      icon: Dumbbell,
      title: "Activités sportives",
      subtitle: "Des idées d'exercices et de jeux pour bouger en famille et garder vos enfants actifs.",
      buttonLabel: "Découvrir des idées sportives",
      gradient: "bg-gradient-to-br from-pastel-blue to-pastel-purple",
      action: () => {},
      isComingSoon: true,
    },
    {
      icon: Heart,
      title: "Activités en famille",
      subtitle: "Bricolage, sorties, jeux créatifs… Trouvez l'inspiration pour des moments complices.",
      buttonLabel: "Trouver une activité",
      gradient: "bg-gradient-to-br from-pastel-purple to-primary/10",
      action: () => {},
      isComingSoon: true,
    },
    {
      icon: Users,
      title: "Rencontres entre familles",
      subtitle: "Connectez-vous avec d'autres parents de votre région pour organiser des activités ensemble.",
      buttonLabel: "Voir les familles proches",
      gradient: "bg-gradient-to-br from-pastel-green to-pastel-yellow",
      action: () => {},
      isComingSoon: true,
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center space-y-3">
        <h2 className="text-3xl md:text-4xl font-bold">
          Boostez le quotidien de votre famille
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Idées de repas, d'activités et de moments à partager
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {activities.map((activity, index) => (
          <ActivityCard
            key={index}
            icon={activity.icon}
            title={activity.title}
            subtitle={activity.subtitle}
            buttonLabel={activity.buttonLabel}
            onAction={activity.action}
            isComingSoon={activity.isComingSoon}
            gradient={activity.gradient}
          />
        ))}
      </div>
    </div>
  );
};
