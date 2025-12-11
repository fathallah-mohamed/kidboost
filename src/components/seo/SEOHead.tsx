import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  noIndex?: boolean;
  structuredData?: object;
}

// Default SEO values for Kidboost
const defaults = {
  siteName: 'Kidboost',
  baseUrl: 'https://kidboost.app',
  defaultTitle: 'Kidboost - Planificateur de repas IA pour enfants',
  defaultDescription: 'Générez des recettes personnalisées pour vos enfants grâce à l\'IA. Planification adaptée aux allergies, préférences et âge. Liste de courses automatique!',
  defaultKeywords: 'planificateur repas enfants, recettes enfants, menu semaine famille, repas équilibré enfant, batch cooking famille',
  defaultImage: '/og-image.png',
};

/**
 * SEO Head component for managing page-specific meta tags
 * Use this component at the top of each page to set SEO metadata
 */
export const SEOHead = ({
  title,
  description = defaults.defaultDescription,
  keywords = defaults.defaultKeywords,
  canonicalUrl,
  ogImage = defaults.defaultImage,
  ogType = 'website',
  noIndex = false,
  structuredData,
}: SEOHeadProps) => {
  const fullTitle = title 
    ? `${title} | ${defaults.siteName}` 
    : defaults.defaultTitle;

  useEffect(() => {
    // Update document title
    document.title = fullTitle;

    // Helper to update or create meta tag
    const updateMeta = (name: string, content: string, property = false) => {
      const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        if (property) {
          meta.setAttribute('property', name);
        } else {
          meta.name = name;
        }
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // Update meta tags
    updateMeta('description', description);
    updateMeta('keywords', keywords);
    updateMeta('robots', noIndex ? 'noindex, nofollow' : 'index, follow');
    
    // Open Graph
    updateMeta('og:title', fullTitle, true);
    updateMeta('og:description', description, true);
    updateMeta('og:type', ogType, true);
    updateMeta('og:image', ogImage.startsWith('http') ? ogImage : `${defaults.baseUrl}${ogImage}`, true);
    
    if (canonicalUrl) {
      updateMeta('og:url', canonicalUrl, true);
      
      // Update canonical link
      let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.appendChild(canonical);
      }
      canonical.href = canonicalUrl;
    }
    
    // Twitter
    updateMeta('twitter:title', fullTitle);
    updateMeta('twitter:description', description);
    updateMeta('twitter:image', ogImage.startsWith('http') ? ogImage : `${defaults.baseUrl}${ogImage}`);

    // Add structured data if provided
    if (structuredData) {
      const existingScript = document.querySelector('script[data-seo-structured]');
      if (existingScript) {
        existingScript.remove();
      }
      
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo-structured', 'true');
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }

    // Cleanup on unmount
    return () => {
      const structuredScript = document.querySelector('script[data-seo-structured]');
      if (structuredScript) {
        structuredScript.remove();
      }
    };
  }, [fullTitle, description, keywords, canonicalUrl, ogImage, ogType, noIndex, structuredData]);

  return null; // This component only manages head elements
};

/**
 * Generate FAQ structured data
 */
export const generateFAQStructuredData = (faqs: { question: string; answer: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqs.map(faq => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer
    }
  }))
});

/**
 * Generate Recipe structured data
 */
export const generateRecipeStructuredData = (recipe: {
  name: string;
  description: string;
  prepTime: number;
  cookTime?: number;
  servings: number;
  ingredients: string[];
  instructions: string[];
  image?: string;
  calories?: number;
}) => ({
  "@context": "https://schema.org",
  "@type": "Recipe",
  "name": recipe.name,
  "description": recipe.description,
  "prepTime": `PT${recipe.prepTime}M`,
  "cookTime": recipe.cookTime ? `PT${recipe.cookTime}M` : undefined,
  "totalTime": `PT${recipe.prepTime + (recipe.cookTime || 0)}M`,
  "recipeYield": `${recipe.servings} portions`,
  "recipeIngredient": recipe.ingredients,
  "recipeInstructions": recipe.instructions.map((step, index) => ({
    "@type": "HowToStep",
    "position": index + 1,
    "text": step
  })),
  "image": recipe.image,
  "nutrition": recipe.calories ? {
    "@type": "NutritionInformation",
    "calories": `${recipe.calories} calories`
  } : undefined,
  "author": {
    "@type": "Organization",
    "name": "Kidboost"
  },
  "datePublished": new Date().toISOString().split('T')[0]
});

/**
 * Generate HowTo structured data for guides
 */
export const generateHowToStructuredData = (howTo: {
  name: string;
  description: string;
  steps: { name: string; text: string }[];
  totalTime?: number;
}) => ({
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": howTo.name,
  "description": howTo.description,
  "totalTime": howTo.totalTime ? `PT${howTo.totalTime}M` : undefined,
  "step": howTo.steps.map((step, index) => ({
    "@type": "HowToStep",
    "position": index + 1,
    "name": step.name,
    "text": step.text
  }))
});

/**
 * Generate BreadcrumbList structured data
 */
export const generateBreadcrumbStructuredData = (items: { name: string; url: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    "item": item.url
  }))
});

export default SEOHead;
