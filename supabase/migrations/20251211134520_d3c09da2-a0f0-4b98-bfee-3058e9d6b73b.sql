-- Add new columns to children_profiles for Kidboost meal logic
ALTER TABLE public.children_profiles
ADD COLUMN IF NOT EXISTS dejeuner_habituel text DEFAULT 'cantine' CHECK (dejeuner_habituel IN ('cantine', 'maison')),
ADD COLUMN IF NOT EXISTS regime_special boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS sortie_scolaire_dates date[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS restrictions_alimentaires text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS aliments_interdits text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS aliments_preferes text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS preferences_gout text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS difficulte_souhaitee text DEFAULT 'facile' CHECK (difficulte_souhaitee IN ('tres_facile', 'facile', 'moyen')),
ADD COLUMN IF NOT EXISTS materiel_disponible text[] DEFAULT '{}';

-- Add parent preferences to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS preferences_parent jsonb DEFAULT '{
  "style_cuisine": [],
  "difficulte": "facile",
  "allergenes_famille": [],
  "materiel_maison": []
}'::jsonb;

-- Create index for sortie_scolaire_dates queries
CREATE INDEX IF NOT EXISTS idx_children_sorties ON public.children_profiles USING GIN (sortie_scolaire_dates);