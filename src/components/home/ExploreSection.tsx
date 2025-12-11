import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useSession } from "@supabase/auth-helpers-react";

export const ExploreSection = () => {
  const session = useSession();
  
  return (
    <section 
      className="container mx-auto px-4 py-16 text-center"
      aria-labelledby="explore-title"
    >
      <h2 
        id="explore-title"
        className="text-3xl font-bold mb-6 animate-fade-in"
      >
        Essayez Kidboost gratuitement{!session && ", sans inscription"} !
      </h2>
      <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
        Découvrez comment <strong>Kidboost</strong> peut simplifier la planification 
        de vos repas familiaux et vous faire gagner du temps chaque semaine.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <Button 
          asChild 
          variant="default" 
          size="lg" 
          className="w-full sm:w-auto"
        >
          <Link 
            to={session ? "/dashboard" : "/signup"}
            aria-label={session ? "Accéder au tableau de bord" : "S'inscrire gratuitement à Kidboost"}
          >
            {session ? "Accéder au dashboard" : "Commencer gratuitement"}
          </Link>
        </Button>
      </div>
      
      {/* SEO hidden content */}
      <div className="sr-only">
        <h3>Essai gratuit de Kidboost</h3>
        <p>
          Testez toutes les fonctionnalités de Kidboost sans engagement : 
          création de profils enfants, génération de recettes par IA, 
          planning hebdomadaire automatique, liste de courses intelligente.
          L'application idéale pour les parents qui veulent des repas 
          équilibrés et adaptés à leurs enfants.
        </p>
      </div>
    </section>
  );
};
