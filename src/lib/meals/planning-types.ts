// Types pour la planification avancée

// Fréquence de cuisine du parent
export type CookingFrequency = 'daily' | 'every_2_days' | 'twice_a_week' | 'once_a_week';

// Niveau de réutilisation
export type ReuseLevel = 0 | 1 | 2 | 3 | 'auto';

// Préférences de planification du parent
export interface PlanningPreferences {
  cooking_frequency: CookingFrequency;
  reuse_level: ReuseLevel;
  include_weekend: boolean;
}

// Labels pour l'interface
export const COOKING_FREQUENCY_LABELS: Record<CookingFrequency, { label: string; description: string; maxRecipesPerWeek: number }> = {
  daily: {
    label: 'Tous les jours',
    description: 'Je cuisine chaque jour',
    maxRecipesPerWeek: 7
  },
  every_2_days: {
    label: 'Tous les 2 jours',
    description: 'Je cuisine un jour sur deux',
    maxRecipesPerWeek: 4
  },
  twice_a_week: {
    label: '2 fois par semaine',
    description: 'Je cuisine 2 fois par semaine maximum',
    maxRecipesPerWeek: 2
  },
  once_a_week: {
    label: '1 fois par semaine',
    description: 'Je cuisine 1 seule fois par semaine (batch cooking)',
    maxRecipesPerWeek: 1
  }
};

export const REUSE_LEVEL_LABELS: Record<string, { label: string; description: string }> = {
  '0': {
    label: 'Pas de réutilisation',
    description: 'Chaque repas est unique'
  },
  '1': {
    label: '1 réutilisation',
    description: 'Chaque plat peut servir 2 fois'
  },
  '2': {
    label: '2 réutilisations',
    description: 'Chaque plat peut servir 3 fois'
  },
  '3': {
    label: '3 réutilisations',
    description: 'Chaque plat peut servir 4 fois (idéal batch cooking)'
  },
  'auto': {
    label: 'Automatique',
    description: 'L\'IA décide selon le type de plat'
  }
};

// Estimation d'utilisation par type de recette
export const PORTION_USAGE_ESTIMATES: Record<string, number> = {
  cake: 3,
  gâteau: 3,
  muffins: 4,
  biscuits: 4,
  gratin: 2,
  batch_cooking: 4,
  soupe: 3,
  plat_four: 2,
  salade: 1,
  sandwich: 1,
  default: 2
};

// Valeurs par défaut
export const DEFAULT_PLANNING_PREFERENCES: PlanningPreferences = {
  cooking_frequency: 'every_2_days',
  reuse_level: 'auto',
  include_weekend: true
};

// Calculer le nombre de répétitions réel
export function calculateRepeatCount(
  reuseLevel: ReuseLevel,
  portionUsageEstimate: number
): number {
  if (reuseLevel === 'auto') {
    return portionUsageEstimate;
  }
  return Math.min(reuseLevel, portionUsageEstimate);
}

// Obtenir les jours de la semaine selon include_weekend
export function getWeekDays(includeWeekend: boolean): number[] {
  if (includeWeekend) {
    return [0, 1, 2, 3, 4, 5, 6]; // Dimanche à Samedi
  }
  return [1, 2, 3, 4, 5]; // Lundi à Vendredi
}

// Calculer le nombre max de nouvelles recettes selon la fréquence
export function getMaxNewRecipes(frequency: CookingFrequency, includeWeekend: boolean): number {
  const config = COOKING_FREQUENCY_LABELS[frequency];
  if (!includeWeekend && frequency === 'daily') {
    return 5; // 5 jours seulement
  }
  return config.maxRecipesPerWeek;
}
