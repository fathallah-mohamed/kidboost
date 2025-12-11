// Types de repas fixes - exactement 4 par jour
export type MealSlot = 'breakfast' | 'lunch' | 'snack' | 'dinner';

// Types de déjeuner possibles
export type LunchType = 'canteen' | 'home' | 'special_diet' | 'school_trip';

// Configuration d'un déjeuner
export interface LunchConfig {
  type: LunchType;
  label: string;
  description: string;
  canGenerate: boolean;
  isLunchbox: boolean;
}

// Configuration d'un enfant pour les repas
export interface ChildMealConfig {
  hasSpecialDiet: boolean;
  hasSchoolTripToday: boolean;
  eatsAtCanteen: boolean;
}

// Structure d'un repas du jour
export interface DayMeal {
  slot: MealSlot;
  label: string;
  icon: string;
  canGenerate: boolean;
  lunchType?: LunchType;
  isLunchbox?: boolean;
  recipe?: {
    id: string;
    name: string;
    prepTime?: number;
  } | null;
}

// Structure d'une journée complète
export interface DayMeals {
  date: string;
  breakfast: DayMeal;
  lunch: DayMeal;
  snack: DayMeal;
  dinner: DayMeal;
}

// Labels pour l'affichage
export const MEAL_LABELS: Record<MealSlot, string> = {
  breakfast: 'Petit-déjeuner',
  lunch: 'Déjeuner',
  snack: 'Goûter',
  dinner: 'Dîner',
};

// Configuration des types de déjeuner
export const LUNCH_CONFIGS: Record<LunchType, LunchConfig> = {
  canteen: {
    type: 'canteen',
    label: 'Déjeuner à la cantine',
    description: 'Votre enfant mange à la cantine',
    canGenerate: false,
    isLunchbox: false,
  },
  home: {
    type: 'home',
    label: 'Déjeuner maison',
    description: 'Préparez un déjeuner à la maison',
    canGenerate: true,
    isLunchbox: false,
  },
  special_diet: {
    type: 'special_diet',
    label: 'Lunchbox personnalisée',
    description: 'Déjeuner à apporter (régime spécial)',
    canGenerate: true,
    isLunchbox: true,
  },
  school_trip: {
    type: 'school_trip',
    label: 'Pique-nique sortie scolaire',
    description: 'Sortie scolaire : pique-nique à apporter',
    canGenerate: true,
    isLunchbox: true,
  },
};

// Ordre des repas dans la journée
export const MEAL_ORDER: MealSlot[] = ['breakfast', 'lunch', 'snack', 'dinner'];
