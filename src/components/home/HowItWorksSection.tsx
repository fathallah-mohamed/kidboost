import { UserCircle2, Sparkles, ShoppingCart } from "lucide-react";

const steps = [
  {
    number: 1,
    icon: UserCircle2,
    title: "Créez le profil de vos enfants",
    description: "Âge, goûts, allergies, contraintes religieuses (halal…), niveau d'appétit… Chaque enfant a son profil personnalisé.",
    seoDescription: "Créez un profil détaillé pour chaque enfant incluant son âge, ses préférences alimentaires, ses allergies et restrictions",
    color: "hsl(var(--pastel-blue))",
  },
  {
    number: 2,
    icon: Sparkles,
    title: "Générez un planning de repas & goûters",
    description: "En quelques clics, KiBoost propose des idées adaptées à chaque enfant grâce à l'intelligence artificielle.",
    seoDescription: "L'IA génère automatiquement des recettes personnalisées et crée un planning hebdomadaire de repas adaptés",
    color: "hsl(var(--pastel-purple))",
  },
  {
    number: 3,
    icon: ShoppingCart,
    title: "Validez & obtenez la liste de courses",
    description: "Téléchargez votre planning et partez faire les courses sereinement avec la liste auto-générée.",
    seoDescription: "Obtenez une liste de courses complète générée automatiquement à partir de votre planning de repas",
    color: "hsl(var(--pastel-green))",
  },
];

export const HowItWorksSection = () => {
  return (
    <section 
      className="container mx-auto px-4 py-16 bg-white/30"
      aria-labelledby="how-it-works-title"
      itemScope
      itemType="https://schema.org/HowTo"
    >
      <header className="text-center mb-12">
        <h2 
          id="how-it-works-title"
          className="text-3xl md:text-4xl font-bold mb-4"
          itemProp="name"
        >
          Comment ça marche ?
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto" itemProp="description">
          <strong>Trois étapes simples</strong> pour transformer votre organisation des repas 
          et gagner du temps chaque semaine
        </p>
        <meta itemProp="totalTime" content="PT10M" />
      </header>

      <div className="max-w-4xl mx-auto relative">
        {/* Timeline line (hidden on mobile) */}
        <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-1 bg-border transform -translate-x-1/2" aria-hidden="true" />

        <ol className="space-y-12" role="list" aria-label="Étapes pour utiliser Kidboost">
          {steps.map((step, index) => (
            <li
              key={step.number}
              className={`flex flex-col md:flex-row items-center gap-6 animate-fade-in ${
                index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
              }`}
              style={{ animationDelay: `${index * 200}ms` }}
              itemProp="step"
              itemScope
              itemType="https://schema.org/HowToStep"
            >
              {/* Content */}
              <div className="flex-1 text-center md:text-left">
                <article className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow border-2 border-transparent hover:border-primary/20">
                  <h3 
                    className="text-2xl font-bold mb-3 flex items-center justify-center md:justify-start gap-2"
                    itemProp="name"
                  >
                    <span className="text-primary" aria-hidden="true">{step.number}.</span>
                    <span className="sr-only">Étape {step.number} : </span>
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed" itemProp="text">
                    {step.description}
                  </p>
                  {/* Hidden SEO content */}
                  <span className="sr-only">{step.seoDescription}</span>
                </article>
              </div>

              {/* Icon circle */}
              <div className="relative z-10" aria-hidden="true">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: step.color }}
                >
                  <step.icon className="w-10 h-10" style={{ color: "hsl(var(--foreground))" }} />
                </div>
              </div>

              {/* Spacer for alternating layout */}
              <div className="flex-1 hidden md:block" aria-hidden="true" />
            </li>
          ))}
        </ol>
      </div>
      
      {/* Hidden SEO content */}
      <div className="sr-only">
        <h3>Guide complet d'utilisation de Kidboost</h3>
        <p>
          Kidboost simplifie la planification des repas pour les familles avec enfants. 
          En seulement 3 étapes, créez des profils pour vos enfants avec leurs allergies et préférences, 
          générez automatiquement un planning de repas personnalisé grâce à l'intelligence artificielle, 
          et obtenez une liste de courses prête à l'emploi. 
          Idéal pour les parents pressés qui veulent des repas équilibrés et adaptés.
        </p>
      </div>
    </section>
  );
};
