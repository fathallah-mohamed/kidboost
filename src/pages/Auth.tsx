import { AuthForm } from "@/components/auth/AuthForm";
import { SEOHead } from "@/components/seo/SEOHead";
import { Link, useLocation } from "react-router-dom";
import kidboostLogo from '@/assets/kidboost-logo.png';

const Auth = () => {
  const location = useLocation();
  const isSignup = location.pathname === '/signup';
  
  const title = isSignup 
    ? "Inscription gratuite - Créez votre compte" 
    : "Connexion - Accédez à votre compte";
  
  const description = isSignup
    ? "Inscrivez-vous gratuitement sur Kidboost et commencez à planifier les repas de vos enfants. Créez des profils personnalisés, générez des recettes adaptées et organisez votre semaine."
    : "Connectez-vous à votre compte Kidboost pour accéder à vos plannings de repas, recettes personnalisées et listes de courses.";

  return (
    <>
      <SEOHead
        title={title}
        description={description}
        keywords="inscription kidboost, connexion kidboost, créer compte planificateur repas, application repas enfants"
        canonicalUrl={`https://kidboost.app${location.pathname}`}
        noIndex={false}
      />
      
      <div className="min-h-screen bg-[#FFF5E4] flex flex-col items-center justify-center p-4">
        <header className="absolute top-4 left-4 flex items-center gap-4">
          <Link 
            to="/" 
            className="text-primary hover:underline flex items-center gap-2"
            aria-label="Retour à la page d'accueil Kidboost"
          >
            <span aria-hidden="true">←</span> Retour à l'accueil
          </Link>
        </header>
        
        <main role="main" aria-labelledby="auth-title">
          <div className="sr-only">
            <h1 id="auth-title">{title}</h1>
            <p>{description}</p>
          </div>
          <AuthForm />
        </main>
        
        {/* SEO Footer */}
        <footer className="absolute bottom-4 text-center text-xs text-muted-foreground">
          <p>© 2025 Kidboost - Planificateur de repas pour enfants</p>
        </footer>
      </div>
    </>
  );
};

export default Auth;
