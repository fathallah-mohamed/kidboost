import { UserCircle2, Sparkles, ShoppingCart } from "lucide-react";

const steps = [
  {
    number: 1,
    icon: UserCircle2,
    title: "Créez le profil de vos enfants",
    description: "Âge, goûts, allergies, contraintes religieuses (halal…), niveau d'appétit…",
    color: "hsl(var(--pastel-blue))",
  },
  {
    number: 2,
    icon: Sparkles,
    title: "Générer un planning de repas & goûters",
    description: "En quelques clics, KiBoost propose des idées adaptées à chaque enfant.",
    color: "hsl(var(--pastel-purple))",
  },
  {
    number: 3,
    icon: ShoppingCart,
    title: "Validez & obtenez la liste de courses",
    description: "Téléchargez votre planning et partez faire les courses sereinement.",
    color: "hsl(var(--pastel-green))",
  },
];

export const HowItWorksSection = () => {
  return (
    <section className="container mx-auto px-4 py-16 bg-white/30">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Comment ça marche ?
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Trois étapes simples pour transformer votre organisation des repas
        </p>
      </div>

      <div className="max-w-4xl mx-auto relative">
        {/* Timeline line (hidden on mobile) */}
        <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-1 bg-border transform -translate-x-1/2" />

        <div className="space-y-12">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className={`flex flex-col md:flex-row items-center gap-6 animate-fade-in ${
                index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
              }`}
              style={{ animationDelay: `${index * 200}ms` }}
            >
              {/* Content */}
              <div className="flex-1 text-center md:text-left">
                <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow border-2 border-transparent hover:border-primary/20">
                  <h3 className="text-2xl font-bold mb-3 flex items-center justify-center md:justify-start gap-2">
                    <span className="text-primary">{step.number}.</span>
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Icon circle */}
              <div className="relative z-10">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: step.color }}
                >
                  <step.icon className="w-10 h-10" style={{ color: "hsl(var(--foreground))" }} />
                </div>
              </div>

              {/* Spacer for alternating layout */}
              <div className="flex-1 hidden md:block" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
