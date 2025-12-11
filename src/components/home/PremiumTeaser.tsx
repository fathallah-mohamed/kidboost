import { Card } from "@/components/ui/card";
import { Sparkles, Check } from "lucide-react";

const premiumFeatures = [
  "Recettes exclusives créées par des nutritionnistes",
  "Profils enfants illimités",
  "Mode batch cooking avancé",
  "Export PDF des plannings",
  "Support prioritaire",
];

export const PremiumTeaser = () => {
  return (
    <section 
      className="container mx-auto px-4 py-16"
      aria-labelledby="premium-title"
    >
      <Card className="p-8 text-center bg-gradient-to-r from-secondary/20 to-primary/20 backdrop-blur-sm">
        <div className="flex justify-center mb-4" aria-hidden="true">
          <Sparkles className="w-12 h-12 text-primary animate-pulse" />
        </div>
        <h2 id="premium-title" className="text-2xl font-bold mb-4">
          Bientôt disponible : Kidboost Premium
        </h2>
        <p className="text-lg text-muted-foreground mb-6 max-w-xl mx-auto">
          Profitez de <strong>recettes exclusives</strong>, profils illimités, 
          et des fonctionnalités avancées pour une planification encore plus efficace.
        </p>
        
        {/* Premium features list */}
        <ul className="inline-flex flex-col gap-2 text-left mb-6" aria-label="Fonctionnalités Premium">
          {premiumFeatures.map((feature, index) => (
            <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="w-4 h-4 text-primary flex-shrink-0" aria-hidden="true" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        
        <p className="text-sm text-muted-foreground">
          Inscrivez-vous maintenant pour être notifié du lancement !
        </p>
      </Card>
      
      {/* SEO hidden content */}
      <div className="sr-only">
        <h3>Kidboost Premium - Fonctionnalités avancées</h3>
        <p>
          La version Premium de Kidboost offre des fonctionnalités avancées 
          pour les familles exigeantes : recettes créées par des nutritionnistes, 
          gestion de profils enfants illimités, mode batch cooking pour parents pressés, 
          export PDF des plannings de repas, et support client prioritaire.
          Idéal pour optimiser la nutrition de toute la famille.
        </p>
      </div>
    </section>
  );
};
