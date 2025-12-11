import {
  MealSlot,
  LunchType,
  ChildMealConfig,
  DayMeal,
  DayMeals,
  MEAL_LABELS,
  LUNCH_CONFIGS,
  MEAL_ORDER,
} from './types';

/**
 * Détermine le type de déjeuner selon la priorité :
 * SORTIE SCOLAIRE > RÉGIME SPÉCIAL > MAISON > CANTINE
 */
export function determineLunchType(config: ChildMealConfig): LunchType {
  if (config.hasSchoolTripToday) {
    return 'school_trip';
  }
  if (config.hasSpecialDiet) {
    return 'special_diet';
  }
  if (config.eatsAtCanteen) {
    return 'canteen';
  }
  return 'home';
}

/**
 * Vérifie si un déjeuner nécessite une lunchbox
 */
export function isLunchboxRequired(lunchType: LunchType): boolean {
  return LUNCH_CONFIGS[lunchType].isLunchbox;
}

/**
 * Vérifie si on peut générer une recette pour un type de déjeuner
 */
export function canGenerateLunch(lunchType: LunchType): boolean {
  return LUNCH_CONFIGS[lunchType].canGenerate;
}

/**
 * Crée la structure d'un repas vide
 */
export function createEmptyMeal(slot: MealSlot, lunchType?: LunchType): DayMeal {
  const baseMeal: DayMeal = {
    slot,
    label: MEAL_LABELS[slot],
    icon: getMealIcon(slot),
    canGenerate: true,
    recipe: null,
  };

  if (slot === 'lunch' && lunchType) {
    const lunchConfig = LUNCH_CONFIGS[lunchType];
    return {
      ...baseMeal,
      label: lunchConfig.label,
      canGenerate: lunchConfig.canGenerate,
      lunchType,
      isLunchbox: lunchConfig.isLunchbox,
    };
  }

  return baseMeal;
}

/**
 * Crée la structure complète d'une journée
 */
export function createDayMeals(date: string, childConfig: ChildMealConfig): DayMeals {
  const lunchType = determineLunchType(childConfig);

  return {
    date,
    breakfast: createEmptyMeal('breakfast'),
    lunch: createEmptyMeal('lunch', lunchType),
    snack: createEmptyMeal('snack'),
    dinner: createEmptyMeal('dinner'),
  };
}

/**
 * Retourne l'icône pour un type de repas
 */
export function getMealIcon(slot: MealSlot): string {
  switch (slot) {
    case 'breakfast':
      return 'coffee';
    case 'lunch':
      return 'utensils';
    case 'snack':
      return 'cookie';
    case 'dinner':
      return 'moon';
    default:
      return 'utensils';
  }
}

/**
 * Convertit un ancien type de repas vers le nouveau système
 */
export function convertLegacyMealType(legacyType: string): MealSlot {
  const mapping: Record<string, MealSlot> = {
    snack: 'snack',
    dinner: 'dinner',
    lunchbox: 'lunch', // Lunchbox devient un type de déjeuner
    breakfast: 'breakfast',
    lunch: 'lunch',
  };
  return mapping[legacyType] || 'dinner';
}

/**
 * Retourne tous les slots de repas dans l'ordre
 */
export function getMealSlots(): MealSlot[] {
  return [...MEAL_ORDER];
}

/**
 * Vérifie si un slot est générateur de recette
 */
export function canGenerateRecipeForSlot(slot: MealSlot, lunchType?: LunchType): boolean {
  if (slot === 'lunch' && lunchType) {
    return LUNCH_CONFIGS[lunchType].canGenerate;
  }
  return true; // Tous les autres repas peuvent générer des recettes
}

/**
 * Retourne la configuration du déjeuner basée sur le profil enfant
 */
export function getChildMealConfigFromProfile(childProfile: {
  allergies?: string[] | null;
  preferences?: string[] | null;
  dislikes?: string[] | null;
}): Partial<ChildMealConfig> {
  // Un enfant a un régime spécial s'il a des allergies
  const hasSpecialDiet = Boolean(childProfile.allergies && childProfile.allergies.length > 0);
  
  return {
    hasSpecialDiet,
    // Ces valeurs devront être définies ailleurs (paramètres utilisateur, calendrier scolaire, etc.)
    hasSchoolTripToday: false,
    eatsAtCanteen: false,
  };
}

/**
 * Filtre les types de repas pour la génération de recettes
 */
export function getGeneratableMealSlots(childConfig: ChildMealConfig): MealSlot[] {
  const slots: MealSlot[] = ['breakfast', 'snack', 'dinner'];
  
  const lunchType = determineLunchType(childConfig);
  if (canGenerateLunch(lunchType)) {
    slots.splice(1, 0, 'lunch'); // Ajouter après breakfast
  }
  
  return slots;
}
