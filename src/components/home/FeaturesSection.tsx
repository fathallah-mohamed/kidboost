import { Heart, Calendar, ShoppingBag, Users } from "lucide-react";
import { BenefitCard } from "./BenefitCard";

const benefits = [
  {
    icon: Heart,
    title: "Recettes personnalisées",
    subtitle: "Adaptées à l'âge, aux goûts et aux contraintes (allergies, halal, etc.).",
    ariaLabel: "Génération de recettes personnalisées par intelligence artificielle"
  },
  {
    icon: Calendar,
    title: "Planning super simple",
    subtitle: "Un calendrier clair des repas et goûters pour toute la semaine.",
    ariaLabel: "Planification hebdomadaire des repas pour toute la famille"
  },
  {
    icon: ShoppingBag,
    title: "Courses sans stress",
    subtitle: "Liste de courses auto-générée, prête à cocher au supermarché.",
    ariaLabel: "Liste de courses automatique générée depuis le planning de repas"
  },
  {
    icon: Users,
    title: "Enfants impliqués",
    subtitle: "Choisissez ensemble les idées de recettes via une interface amusante.",
    ariaLabel: "Interface ludique pour impliquer les enfants dans le choix des repas"
  }
];

export const FeaturesSection = () => {
  return (
    <section 
      className="container mx-auto px-4 py-16"
      aria-labelledby="features-title"
      itemScope
      itemType="https://schema.org/ItemList"
    >
      <header className="text-center mb-12">
        <h2 
          id="features-title"
          className="text-3xl md:text-4xl font-bold mb-4"
          itemProp="name"
        >
          Pourquoi les parents adorent <span className="text-primary">Kidboost</span>
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto" itemProp="description">
          Tout ce dont vous avez besoin pour des <strong>repas réussis en famille</strong> : 
          recettes personnalisées, planning automatique et liste de courses intelligente.
        </p>
      </header>
      
      <div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        role="list"
        aria-label="Fonctionnalités principales de Kidboost"
      >
        {benefits.map((benefit, index) => (
          <div key={index} role="listitem" itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
            <meta itemProp="position" content={String(index + 1)} />
            <BenefitCard
              icon={benefit.icon}
              title={benefit.title}
              subtitle={benefit.subtitle}
              delay={`${index * 100}ms`}
              ariaLabel={benefit.ariaLabel}
            />
          </div>
        ))}
      </div>
      
      {/* Hidden semantic content for SEO */}
      <div className="sr-only">
        <h3>Avantages de Kidboost pour la planification des repas enfants</h3>
        <ul>
          <li>Intelligence artificielle pour générer des recettes adaptées à chaque enfant</li>
          <li>Prise en compte des allergies alimentaires (gluten, lactose, arachides, etc.)</li>
          <li>Gestion des restrictions alimentaires (halal, végétarien, végan)</li>
          <li>Planning hebdomadaire automatique des repas</li>
          <li>Liste de courses générée automatiquement</li>
          <li>Profils multi-enfants avec préférences individuelles</li>
          <li>Mode batch cooking pour parents pressés</li>
          <li>Recettes adaptées à l'âge de l'enfant</li>
        </ul>
      </div>
    </section>
  );
};
