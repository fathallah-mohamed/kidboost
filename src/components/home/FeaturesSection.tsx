import { Heart, Calendar, ShoppingBag, Users } from "lucide-react";
import { BenefitCard } from "./BenefitCard";

const benefits = [
  {
    icon: Heart,
    title: "Recettes personnalisées",
    subtitle: "Adaptées à l'âge, aux goûts et aux contraintes (allergies, halal, etc.)."
  },
  {
    icon: Calendar,
    title: "Planning super simple",
    subtitle: "Un calendrier clair des repas et goûters pour toute la semaine."
  },
  {
    icon: ShoppingBag,
    title: "Courses sans stress",
    subtitle: "Liste de courses auto-générée, prête à cocher au supermarché."
  },
  {
    icon: Users,
    title: "Enfants impliqués",
    subtitle: "Choisissez ensemble les idées de recettes via une interface amusante."
  }
];

export const FeaturesSection = () => {
  return (
    <section className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Pourquoi les parents adorent KiBoost
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Tout ce dont vous avez besoin pour des repas réussis en famille
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {benefits.map((benefit, index) => (
          <BenefitCard
            key={index}
            icon={benefit.icon}
            title={benefit.title}
            subtitle={benefit.subtitle}
            delay={`${index * 100}ms`}
          />
        ))}
      </div>
    </section>
  );
};