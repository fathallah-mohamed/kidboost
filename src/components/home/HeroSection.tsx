import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useSession } from "@supabase/auth-helpers-react";

export const HeroSection = () => {
  const session = useSession();

  return (
    <section className="container mx-auto px-4 py-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left content */}
        <div className="text-center lg:text-left space-y-6">
          <div className="inline-block animate-fade-in">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-sm font-medium text-primary">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              Propulsé par l'IA
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight animate-fade-in [animation-delay:100ms]">
            Planifiez des repas qui rendent vos enfants{" "}
            <span className="text-primary relative inline-block">
              heureux
              <svg className="absolute -bottom-2 left-0 w-full" height="8" viewBox="0 0 200 8" fill="none">
                <path d="M0 4C50 2 150 6 200 4" stroke="currentColor" strokeWidth="3" className="text-primary/30" />
              </svg>
            </span>{" "}
            🧡
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed animate-fade-in [animation-delay:200ms]">
            Créez les profils de vos enfants, générez des recettes adaptées et organisez vos repas en quelques minutes par semaine.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-in [animation-delay:300ms]">
            {session ? (
              <Button asChild size="lg" className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-all">
                <Link to="/dashboard">Accéder à mon tableau de bord</Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg" className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-all">
                  <Link to="/signup">Commencer en 2 minutes</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full sm:w-auto border-2">
                  <Link to="/login">Se connecter</Link>
                </Button>
              </>
            )}
          </div>
          
          {!session && (
            <p className="text-sm text-muted-foreground animate-fade-in [animation-delay:400ms]">
              Sans inscription obligatoire • Test gratuit
            </p>
          )}
        </div>

        {/* Right illustration */}
        <div className="relative animate-fade-in [animation-delay:500ms]">
          <div className="relative bg-white/50 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border-2 border-primary/10">
            {/* Mini dashboard preview */}
            <div className="space-y-4">
              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Progression de la semaine</span>
                  <span className="text-primary font-bold">4/7 jours</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-accent w-[57%] rounded-full" />
                </div>
              </div>

              {/* Child avatars */}
              <div className="flex gap-3 py-3">
                <div className="flex-1 bg-pastel-blue p-3 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-primary/20 mb-2" />
                  <p className="text-xs font-medium">Emma, 5 ans</p>
                </div>
                <div className="flex-1 bg-pastel-purple p-3 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-accent/20 mb-2" />
                  <p className="text-xs font-medium">Lucas, 8 ans</p>
                </div>
              </div>

              {/* Recipe cards */}
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">Lundi</p>
                    <p className="text-xs text-muted-foreground">Spaghetti bolo veggie</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent/20 to-primary/20" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">Mardi</p>
                    <p className="text-xs text-muted-foreground">Wraps de poulet</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating mascot */}
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center shadow-lg animate-float">
              <span className="text-2xl">✨</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};