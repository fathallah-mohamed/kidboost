import { HeroSection } from '@/components/home/HeroSection';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { HowItWorksSection } from '@/components/home/HowItWorksSection';
import { ExploreSection } from '@/components/home/ExploreSection';
import { PremiumTeaser } from '@/components/home/PremiumTeaser';
import { SEOHead, generateFAQStructuredData, generateHowToStructuredData } from '@/components/seo/SEOHead';
import { useSession } from "@supabase/auth-helpers-react";
import { Link } from 'react-router-dom';
import kidboostLogo from '@/assets/kidboost-logo.png';

// FAQ data for SEO
const faqData = [
  {
    question: "Comment fonctionne Kidboost pour planifier les repas de mes enfants ?",
    answer: "Kidboost utilise l'intelligence artificielle pour générer des recettes personnalisées basées sur l'âge, les préférences alimentaires, les allergies et les restrictions de vos enfants. Vous créez un profil pour chaque enfant, et l'IA propose des repas adaptés pour toute la semaine."
  },
  {
    question: "Kidboost peut-il gérer les allergies alimentaires ?",
    answer: "Oui, Kidboost prend en compte toutes les allergies (gluten, lactose, arachides, etc.) et restrictions alimentaires (halal, végétarien, végan). Les recettes générées excluent automatiquement les allergènes identifiés."
  },
  {
    question: "La liste de courses est-elle générée automatiquement ?",
    answer: "Absolument ! Une fois votre planning de repas validé, Kidboost génère automatiquement une liste de courses complète avec tous les ingrédients nécessaires, organisés par catégories pour faciliter vos achats."
  },
  {
    question: "Puis-je gérer plusieurs enfants avec des régimes différents ?",
    answer: "Oui, Kidboost permet de créer des profils distincts pour chaque enfant avec leurs propres préférences, allergies et restrictions. Vous pouvez planifier des repas différents ou communs selon vos besoins."
  },
  {
    question: "Kidboost est-il gratuit ?",
    answer: "Kidboost propose un essai gratuit pour découvrir toutes les fonctionnalités. Vous pouvez créer vos profils enfants, générer des recettes et planifier vos repas sans engagement."
  }
];

// HowTo data for SEO
const howToData = {
  name: "Comment utiliser Kidboost pour planifier les repas de vos enfants",
  description: "Guide étape par étape pour créer un planning de repas personnalisé avec Kidboost",
  totalTime: 10,
  steps: [
    { name: "Créer un compte", text: "Inscrivez-vous gratuitement sur Kidboost en quelques secondes" },
    { name: "Ajouter vos enfants", text: "Créez un profil pour chaque enfant avec son âge, ses allergies et ses préférences" },
    { name: "Configurer vos préférences", text: "Définissez votre fréquence de cuisine et vos contraintes de temps" },
    { name: "Générer le planning", text: "Laissez l'IA créer un planning de repas personnalisé pour la semaine" },
    { name: "Valider et cuisiner", text: "Consultez la liste de courses générée et commencez à cuisiner !" }
  ]
};

const Index = () => {
  const session = useSession();

  // Combined structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      generateFAQStructuredData(faqData),
      generateHowToStructuredData(howToData),
      {
        "@type": "WebPage",
        "@id": "https://kidboost.app/#webpage",
        "url": "https://kidboost.app/",
        "name": "Kidboost - Planificateur de repas IA pour enfants",
        "description": "Générez des recettes personnalisées pour vos enfants grâce à l'IA. Planification adaptée aux allergies, préférences et âge.",
        "isPartOf": { "@id": "https://kidboost.app/#website" },
        "primaryImageOfPage": { "@id": "https://kidboost.app/#primaryimage" },
        "datePublished": "2024-01-01",
        "dateModified": "2025-01-15"
      }
    ]
  };

  return (
    <>
      <SEOHead
        title="Planificateur de repas IA pour enfants - Recettes personnalisées"
        description="Kidboost génère des recettes personnalisées pour vos enfants grâce à l'IA. Planification adaptée aux allergies, préférences alimentaires et âge. Liste de courses automatique. Essai gratuit!"
        keywords="planificateur repas enfants, recettes enfants IA, menu semaine famille, repas bébé, alimentation enfant, planning repas, liste courses automatique, batch cooking famille, lunchbox enfant, goûter maison, repas équilibré enfant, allergies alimentaires enfant, recettes halal enfant, recettes végétariennes enfant"
        canonicalUrl="https://kidboost.app/"
        structuredData={structuredData}
      />
      
      <div className="min-h-screen bg-[#FFF5E4]">
        {/* Header with semantic nav */}
        <header role="banner">
          <nav className="p-4 flex justify-between items-center container mx-auto" aria-label="Navigation principale">
            <Link to="/" className="flex items-center gap-2" aria-label="Kidboost - Accueil">
              <img 
                src={kidboostLogo} 
                alt="Kidboost - Planificateur de repas pour enfants" 
                className="h-12 w-auto" 
                width="48"
                height="48"
                loading="eager"
              />
            </Link>
            <div />
          </nav>
        </header>
        
        {/* Main content with semantic structure */}
        <main role="main" id="main-content">
          <HeroSection />
          <FeaturesSection />
          <HowItWorksSection />
          <ExploreSection />
          <PremiumTeaser />
          
          {/* Hidden FAQ section for SEO (visually hidden but accessible) */}
          <section className="sr-only" aria-label="Questions fréquentes">
            <h2>Questions fréquentes sur Kidboost</h2>
            {faqData.map((faq, index) => (
              <article key={index}>
                <h3>{faq.question}</h3>
                <p>{faq.answer}</p>
              </article>
            ))}
          </section>
        </main>
        
        {/* Footer for SEO */}
        <footer role="contentinfo" className="bg-background/50 py-8 mt-12">
          <div className="container mx-auto px-4">
            <div className="text-center text-sm text-muted-foreground">
              <p>© 2025 Kidboost - Planificateur de repas intelligent pour enfants</p>
              <p className="mt-2">
                <span className="sr-only">Mots-clés : </span>
                Recettes personnalisées • Planning repas famille • Liste de courses automatique • Gestion allergies
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Index;
