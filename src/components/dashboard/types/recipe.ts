import { HealthBenefitCategory } from './health';

// Nouveau système de types de repas - 4 repas fixes par jour
export type MealType = 'breakfast' | 'lunch' | 'snack' | 'dinner';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type SpecialOccasion = 'birthday' | 'school' | 'quick' | 'party' | 'holiday';

export type FilterMealType = MealType | 'all';
export type FilterDifficulty = Difficulty | 'all';

export interface RecipeIngredient {
  item: string;
  quantity: string;
  unit: string;
}

export interface NutritionalInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// Conservation et réutilisation
export interface StorageInfo {
  method: 'fridge' | 'freezer' | 'room_temp';
  duration_days: number;
  container: string;
  tips?: string;
}

export interface ReuseInfo {
  total_uses: number;         // Combien de fois cette recette peut servir
  remaining_uses?: number;    // Utilisations restantes (pour le tracking)
  best_days?: string[];       // Meilleurs jours pour réutiliser
  reuse_tips?: string;        // Conseils de réutilisation
}

export interface Recipe {
  id: string;
  profile_id: string;
  name: string;
  ingredients: RecipeIngredient[];
  instructions: string[];
  nutritional_info: NutritionalInfo;
  meal_type: MealType;
  preparation_time: number;
  difficulty: Difficulty;
  servings: number;
  is_generated?: boolean;
  image_url?: string;
  health_benefits?: Array<{
    icon: string;
    category: HealthBenefitCategory;
    description: string;
  }>;
  min_age?: number;
  max_age?: number;
  dietary_preferences?: string[];
  allergens?: string[];
  cost_estimate?: number;
  seasonal_months?: number[];
  cooking_steps?: Array<{
    step: number;
    description: string;
    duration?: number;
    tips?: string;
  }>;
  // Parent pressé - réutilisation
  reuse_info?: ReuseInfo;
  storage_info?: StorageInfo;
  is_batch_cooking?: boolean;
  is_reuse?: boolean;           // True si c'est une réutilisation d'une recette existante
  original_recipe_id?: string;  // ID de la recette originale si c'est une réutilisation
}

export interface RecipeFilters {
  mealType?: FilterMealType;
  maxPrepTime?: number;
  difficulty?: FilterDifficulty;
  dietaryPreferences?: string[];
  excludedAllergens?: string[];
  maxCost?: number;
  season?: number;
  healthBenefits?: string[];
  includedIngredients?: string[];
  excludedIngredients?: string[];
  totalTime?: number;
  nutritionalTargets?: {
    calories?: { min?: number; max?: number };
    protein?: { min?: number; max?: number };
    carbs?: { min?: number; max?: number };
    fat?: { min?: number; max?: number };
  };
  specialOccasion?: SpecialOccasion;
  servings?: number;
}
