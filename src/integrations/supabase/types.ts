export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      available_ingredients: {
        Row: {
          created_at: string
          id: string
          ingredient_name: string
          profile_id: string
          quantity: number
          unit: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          ingredient_name: string
          profile_id: string
          quantity: number
          unit: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          ingredient_name?: string
          profile_id?: string
          quantity?: number
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "available_ingredients_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      children_profiles: {
        Row: {
          aliments_interdits: string[] | null
          aliments_preferes: string[] | null
          allergies: string[] | null
          available_time: number | null
          birth_date: string
          created_at: string
          dejeuner_habituel: string | null
          difficulte_souhaitee: string | null
          dislikes: string[] | null
          id: string
          materiel_disponible: string[] | null
          meal_objectives: string[] | null
          name: string
          onboarding_completed: boolean | null
          preferences: string[] | null
          preferences_gout: string[] | null
          profile_id: string
          regime_special: boolean | null
          restrictions_alimentaires: string[] | null
          sortie_scolaire_dates: string[] | null
          updated_at: string
        }
        Insert: {
          aliments_interdits?: string[] | null
          aliments_preferes?: string[] | null
          allergies?: string[] | null
          available_time?: number | null
          birth_date: string
          created_at?: string
          dejeuner_habituel?: string | null
          difficulte_souhaitee?: string | null
          dislikes?: string[] | null
          id?: string
          materiel_disponible?: string[] | null
          meal_objectives?: string[] | null
          name: string
          onboarding_completed?: boolean | null
          preferences?: string[] | null
          preferences_gout?: string[] | null
          profile_id: string
          regime_special?: boolean | null
          restrictions_alimentaires?: string[] | null
          sortie_scolaire_dates?: string[] | null
          updated_at?: string
        }
        Update: {
          aliments_interdits?: string[] | null
          aliments_preferes?: string[] | null
          allergies?: string[] | null
          available_time?: number | null
          birth_date?: string
          created_at?: string
          dejeuner_habituel?: string | null
          difficulte_souhaitee?: string | null
          dislikes?: string[] | null
          id?: string
          materiel_disponible?: string[] | null
          meal_objectives?: string[] | null
          name?: string
          onboarding_completed?: boolean | null
          preferences?: string[] | null
          preferences_gout?: string[] | null
          profile_id?: string
          regime_special?: boolean | null
          restrictions_alimentaires?: string[] | null
          sortie_scolaire_dates?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "children_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leftovers: {
        Row: {
          created_at: string
          expiry_date: string | null
          id: string
          ingredient_name: string
          photos: string[] | null
          profile_id: string
          quantity: number
          unit: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expiry_date?: string | null
          id?: string
          ingredient_name: string
          photos?: string[] | null
          profile_id: string
          quantity: number
          unit: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expiry_date?: string | null
          id?: string
          ingredient_name?: string
          photos?: string[] | null
          profile_id?: string
          quantity?: number
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leftovers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plans: {
        Row: {
          auto_generation_feedback: string | null
          auto_generation_rating: number | null
          child_id: string | null
          created_at: string
          date: string
          id: string
          is_auto_generated: boolean | null
          meal_time: string
          profile_id: string
          recipe_id: string
          updated_at: string
        }
        Insert: {
          auto_generation_feedback?: string | null
          auto_generation_rating?: number | null
          child_id?: string | null
          created_at?: string
          date: string
          id?: string
          is_auto_generated?: boolean | null
          meal_time?: string
          profile_id: string
          recipe_id: string
          updated_at?: string
        }
        Update: {
          auto_generation_feedback?: string | null
          auto_generation_rating?: number | null
          child_id?: string | null
          created_at?: string
          date?: string
          id?: string
          is_auto_generated?: boolean | null
          meal_time?: string
          profile_id?: string
          recipe_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_plans_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_plans_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_plans_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_statistics: {
        Row: {
          child_id: string | null
          created_at: string
          frequency: number | null
          id: string
          last_served: string
          profile_id: string
          recipe_id: string
          updated_at: string
        }
        Insert: {
          child_id?: string | null
          created_at?: string
          frequency?: number | null
          id?: string
          last_served: string
          profile_id: string
          recipe_id: string
          updated_at?: string
        }
        Update: {
          child_id?: string | null
          created_at?: string
          frequency?: number | null
          id?: string
          last_served?: string
          profile_id?: string
          recipe_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_statistics_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_statistics_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_statistics_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          onboarding_completed: boolean | null
          preferences_parent: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          onboarding_completed?: boolean | null
          preferences_parent?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          onboarding_completed?: boolean | null
          preferences_parent?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      recipe_favorites: {
        Row: {
          created_at: string
          id: string
          profile_id: string | null
          recipe_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id?: string | null
          recipe_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string | null
          recipe_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_favorites_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_favorites_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_ratings: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          profile_id: string | null
          rating: number
          recipe_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          profile_id?: string | null
          rating: number
          recipe_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          profile_id?: string | null
          rating?: number
          recipe_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ratings_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ratings_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_tags: {
        Row: {
          created_at: string
          id: string
          profile_id: string | null
          recipe_id: string | null
          tag: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id?: string | null
          recipe_id?: string | null
          tag: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string | null
          recipe_id?: string | null
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_tags_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_tags_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          allergens: string[] | null
          auto_generated: boolean | null
          budget_max: number | null
          child_id: string | null
          cooking_steps: Json | null
          cost_estimate: number | null
          created_at: string
          dietary_preferences: string[] | null
          difficulty: string
          health_benefits: Json | null
          id: string
          image_url: string | null
          ingredients: Json
          instructions: string
          is_generated: boolean | null
          max_age: number | null
          max_prep_time: number
          meal_type: string
          min_age: number | null
          name: string
          nutritional_info: Json
          preparation_time: number
          profile_id: string
          seasonal_months: number[] | null
          seasonality: string[] | null
          servings: number
          source: string | null
          updated_at: string
        }
        Insert: {
          allergens?: string[] | null
          auto_generated?: boolean | null
          budget_max?: number | null
          child_id?: string | null
          cooking_steps?: Json | null
          cost_estimate?: number | null
          created_at?: string
          dietary_preferences?: string[] | null
          difficulty?: string
          health_benefits?: Json | null
          id?: string
          image_url?: string | null
          ingredients: Json
          instructions: string
          is_generated?: boolean | null
          max_age?: number | null
          max_prep_time?: number
          meal_type?: string
          min_age?: number | null
          name: string
          nutritional_info: Json
          preparation_time?: number
          profile_id: string
          seasonal_months?: number[] | null
          seasonality?: string[] | null
          servings?: number
          source?: string | null
          updated_at?: string
        }
        Update: {
          allergens?: string[] | null
          auto_generated?: boolean | null
          budget_max?: number | null
          child_id?: string | null
          cooking_steps?: Json | null
          cost_estimate?: number | null
          created_at?: string
          dietary_preferences?: string[] | null
          difficulty?: string
          health_benefits?: Json | null
          id?: string
          image_url?: string | null
          ingredients?: Json
          instructions?: string
          is_generated?: boolean | null
          max_age?: number | null
          max_prep_time?: number
          meal_type?: string
          min_age?: number | null
          name?: string
          nutritional_info?: Json
          preparation_time?: number
          profile_id?: string
          seasonal_months?: number[] | null
          seasonality?: string[] | null
          servings?: number
          source?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipes_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_lists: {
        Row: {
          created_at: string
          id: string
          items: Json
          profile_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          items: Json
          profile_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          items?: Json
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_lists_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_meal_plan_requirements: {
        Args: { profile_id: string }
        Returns: {
          can_generate: boolean
          message: string
        }[]
      }
      validate_health_benefit_categories: {
        Args: { benefits: Json }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
