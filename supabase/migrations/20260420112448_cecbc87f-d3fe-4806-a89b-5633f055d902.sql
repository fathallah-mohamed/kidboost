-- ============================================
-- KIDBOOST - Full schema migration to Lovable Cloud
-- ============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- UTILITY FUNCTION: updated_at trigger
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- ============================================
-- TABLE: profiles
-- ============================================
CREATE TABLE public.profiles (
    id uuid NOT NULL PRIMARY KEY,
    preferences_parent jsonb DEFAULT '{"difficulte": "facile", "style_cuisine": [], "materiel_maison": [], "allergenes_famille": []}'::jsonb,
    onboarding_completed boolean DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
    updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id) VALUES (new.id);
    RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- TABLE: children_profiles
-- ============================================
CREATE TABLE public.children_profiles (
    id uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    birth_date date NOT NULL,
    allergies text[] DEFAULT '{}',
    preferences text[] DEFAULT '{}',
    preferences_gout text[] DEFAULT '{}',
    aliments_preferes text[] DEFAULT '{}',
    aliments_interdits text[] DEFAULT '{}',
    restrictions_alimentaires text[] DEFAULT '{}',
    materiel_disponible text[] DEFAULT '{}',
    sortie_scolaire_dates date[] DEFAULT '{}',
    dislikes text[] DEFAULT '{}',
    meal_objectives text[] DEFAULT '{}',
    difficulte_souhaitee text DEFAULT 'facile',
    dejeuner_habituel text DEFAULT 'cantine',
    regime_special boolean DEFAULT false,
    available_time integer DEFAULT 20,
    onboarding_completed boolean DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
    updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.children_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their children profiles" ON public.children_profiles
    FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "Users can insert their children profiles" ON public.children_profiles
    FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY "Users can update their children profiles" ON public.children_profiles
    FOR UPDATE USING (profile_id = auth.uid());
CREATE POLICY "Users can delete their children profiles" ON public.children_profiles
    FOR DELETE USING (profile_id = auth.uid());

CREATE TRIGGER update_children_profiles_updated_at
    BEFORE UPDATE ON public.children_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- HEALTH BENEFIT VALIDATION
-- ============================================
CREATE OR REPLACE FUNCTION public.validate_health_benefit_categories(benefits jsonb)
RETURNS boolean
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF benefits IS NULL OR jsonb_array_length(benefits) = 0 THEN
        RETURN true;
    END IF;
    RETURN (
        SELECT bool_and(
            (value->>'category')::text IN (
                'cognitive', 'energy', 'satiety', 'digestive', 'immunity',
                'growth', 'mental', 'organs', 'beauty', 'physical',
                'prevention', 'global'
            )
        )
        FROM jsonb_array_elements(benefits)
    );
END;
$$;

-- ============================================
-- TABLE: recipes
-- ============================================
CREATE TABLE public.recipes (
    id uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    child_id uuid REFERENCES public.children_profiles(id) ON DELETE SET NULL,
    name text NOT NULL,
    ingredients jsonb NOT NULL,
    instructions text NOT NULL,
    nutritional_info jsonb NOT NULL,
    cooking_steps jsonb DEFAULT '[]'::jsonb,
    health_benefits jsonb DEFAULT '[{"icon": "brain", "category": "cognitive", "description": "Améliore la mémoire"}]'::jsonb,
    meal_type text NOT NULL DEFAULT 'dinner',
    difficulty text NOT NULL DEFAULT 'medium',
    preparation_time integer NOT NULL DEFAULT 30,
    max_prep_time integer NOT NULL DEFAULT 30,
    servings integer NOT NULL DEFAULT 4,
    image_url text DEFAULT 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9',
    is_generated boolean DEFAULT false,
    auto_generated boolean DEFAULT false,
    source text DEFAULT 'ia',
    seasonality text[],
    seasonal_months integer[] DEFAULT '{1,2,3,4,5,6,7,8,9,10,11,12}',
    budget_max integer,
    cost_estimate numeric DEFAULT 0,
    allergens text[] DEFAULT '{}',
    dietary_preferences text[] DEFAULT '{}',
    min_age integer DEFAULT 0,
    max_age integer DEFAULT 18,
    created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
    updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT valid_health_benefit_category CHECK (public.validate_health_benefit_categories(health_benefits))
);

ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own recipes" ON public.recipes
    FOR SELECT TO authenticated USING ((profile_id = auth.uid()) OR (is_generated = true));
CREATE POLICY "Enable insert for authenticated users only" ON public.recipes
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Users can update their recipes" ON public.recipes
    FOR UPDATE USING (profile_id = auth.uid());
CREATE POLICY "Users can delete their recipes" ON public.recipes
    FOR DELETE USING (profile_id = auth.uid());

CREATE TRIGGER update_recipes_updated_at
    BEFORE UPDATE ON public.recipes
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- TABLE: meal_plans
-- ============================================
CREATE TABLE public.meal_plans (
    id uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipe_id uuid NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    child_id uuid REFERENCES public.children_profiles(id) ON DELETE SET NULL,
    date date NOT NULL,
    meal_time text NOT NULL DEFAULT 'dinner',
    is_auto_generated boolean DEFAULT false,
    auto_generation_rating integer,
    auto_generation_feedback text,
    created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
    updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their meal plans" ON public.meal_plans
    FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "Users can insert their meal plans" ON public.meal_plans
    FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY "Users can update their meal plans" ON public.meal_plans
    FOR UPDATE USING (profile_id = auth.uid());
CREATE POLICY "Users can delete their meal plans" ON public.meal_plans
    FOR DELETE USING (profile_id = auth.uid());

CREATE TRIGGER update_meal_plans_updated_at
    BEFORE UPDATE ON public.meal_plans
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- TABLE: meal_statistics
-- ============================================
CREATE TABLE public.meal_statistics (
    id uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipe_id uuid NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    child_id uuid REFERENCES public.children_profiles(id) ON DELETE SET NULL,
    frequency integer DEFAULT 1,
    last_served date NOT NULL,
    created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
    updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
    UNIQUE (profile_id, recipe_id, child_id)
);

ALTER TABLE public.meal_statistics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their meal statistics" ON public.meal_statistics
    FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "Users can insert their meal statistics" ON public.meal_statistics
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their meal statistics" ON public.meal_statistics
    FOR UPDATE USING (profile_id = auth.uid());
CREATE POLICY "Users can delete their meal statistics" ON public.meal_statistics
    FOR DELETE USING (profile_id = auth.uid());

CREATE TRIGGER update_meal_statistics_updated_at
    BEFORE UPDATE ON public.meal_statistics
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to auto-update meal stats on meal_plans insert
CREATE OR REPLACE FUNCTION public.update_meal_statistics()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.meal_statistics (profile_id, recipe_id, child_id, last_served)
    VALUES (NEW.profile_id, NEW.recipe_id, NEW.child_id, NEW.date)
    ON CONFLICT (profile_id, recipe_id, child_id)
    DO UPDATE SET 
        frequency = public.meal_statistics.frequency + 1,
        last_served = NEW.date;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_meal_plan_insert
    AFTER INSERT ON public.meal_plans
    FOR EACH ROW EXECUTE FUNCTION public.update_meal_statistics();

-- ============================================
-- TABLE: leftovers
-- ============================================
CREATE TABLE public.leftovers (
    id uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    ingredient_name text NOT NULL,
    quantity numeric NOT NULL,
    unit text NOT NULL,
    expiry_date date,
    photos text[] DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
    updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.leftovers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their leftovers" ON public.leftovers
    FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "Users can insert their leftovers" ON public.leftovers
    FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY "Users can update their leftovers" ON public.leftovers
    FOR UPDATE USING (profile_id = auth.uid());
CREATE POLICY "Users can delete their leftovers" ON public.leftovers
    FOR DELETE USING (profile_id = auth.uid());

CREATE TRIGGER update_leftovers_updated_at
    BEFORE UPDATE ON public.leftovers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- TABLE: available_ingredients
-- ============================================
CREATE TABLE public.available_ingredients (
    id uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    ingredient_name text NOT NULL,
    quantity numeric NOT NULL,
    unit text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
    updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.available_ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their available ingredients" ON public.available_ingredients
    FOR SELECT TO authenticated USING (profile_id = auth.uid());
CREATE POLICY "Users can insert their available ingredients" ON public.available_ingredients
    FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());
CREATE POLICY "Users can update their available ingredients" ON public.available_ingredients
    FOR UPDATE TO authenticated USING (profile_id = auth.uid());
CREATE POLICY "Users can delete their available ingredients" ON public.available_ingredients
    FOR DELETE TO authenticated USING (profile_id = auth.uid());

CREATE TRIGGER update_available_ingredients_updated_at
    BEFORE UPDATE ON public.available_ingredients
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- TABLE: shopping_lists
-- ============================================
CREATE TABLE public.shopping_lists (
    id uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    items jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
    updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their shopping lists" ON public.shopping_lists
    FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "Users can insert their shopping lists" ON public.shopping_lists
    FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY "Users can update their shopping lists" ON public.shopping_lists
    FOR UPDATE USING (profile_id = auth.uid());
CREATE POLICY "Users can delete their shopping lists" ON public.shopping_lists
    FOR DELETE USING (profile_id = auth.uid());

CREATE TRIGGER update_shopping_lists_updated_at
    BEFORE UPDATE ON public.shopping_lists
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- TABLE: recipe_favorites
-- ============================================
CREATE TABLE public.recipe_favorites (
    id uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipe_id uuid REFERENCES public.recipes(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.recipe_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own favorites" ON public.recipe_favorites
    FOR SELECT TO authenticated USING (profile_id = auth.uid());
CREATE POLICY "Users can insert their own favorites" ON public.recipe_favorites
    FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Users can update their own favorites" ON public.recipe_favorites
    FOR UPDATE USING (profile_id = auth.uid());
CREATE POLICY "Users can delete their own favorites" ON public.recipe_favorites
    FOR DELETE TO authenticated USING (profile_id = auth.uid());

-- ============================================
-- TABLE: recipe_ratings
-- ============================================
CREATE TABLE public.recipe_ratings (
    id uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipe_id uuid REFERENCES public.recipes(id) ON DELETE CASCADE,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment text,
    created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.recipe_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all recipe ratings" ON public.recipe_ratings
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert their own ratings" ON public.recipe_ratings
    FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());
CREATE POLICY "Users can update their own ratings" ON public.recipe_ratings
    FOR UPDATE TO authenticated USING (profile_id = auth.uid());
CREATE POLICY "Users can delete their own ratings" ON public.recipe_ratings
    FOR DELETE TO authenticated USING (profile_id = auth.uid());

-- ============================================
-- TABLE: recipe_tags
-- ============================================
CREATE TABLE public.recipe_tags (
    id uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipe_id uuid REFERENCES public.recipes(id) ON DELETE CASCADE,
    tag text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.recipe_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their recipe tags" ON public.recipe_tags
    FOR SELECT TO authenticated USING (profile_id = auth.uid());
CREATE POLICY "Users can insert their recipe tags" ON public.recipe_tags
    FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());
CREATE POLICY "Users can delete their recipe tags" ON public.recipe_tags
    FOR DELETE TO authenticated USING (profile_id = auth.uid());

-- ============================================
-- BUSINESS FUNCTION: check_meal_plan_requirements
-- ============================================
CREATE OR REPLACE FUNCTION public.check_meal_plan_requirements(profile_id uuid)
RETURNS TABLE(can_generate boolean, message text)
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.children_profiles WHERE children_profiles.profile_id = $1) THEN
        RETURN QUERY SELECT false, 'Aucun profil enfant configuré'::text;
        RETURN;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM public.children_profiles 
        WHERE children_profiles.profile_id = $1 
        AND (birth_date IS NULL OR name IS NULL)
    ) THEN
        RETURN QUERY SELECT false, 'Certains profils enfants sont incomplets'::text;
        RETURN;
    END IF;
    
    RETURN QUERY SELECT true, 'OK'::text;
END;
$$;

-- ============================================
-- STORAGE: leftover-photos bucket (public)
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('leftover-photos', 'leftover-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Leftover photos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'leftover-photos');

CREATE POLICY "Authenticated users can upload leftover photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'leftover-photos');

CREATE POLICY "Users can update their own leftover photos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'leftover-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own leftover photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'leftover-photos' AND auth.uid()::text = (storage.foldername(name))[1]);