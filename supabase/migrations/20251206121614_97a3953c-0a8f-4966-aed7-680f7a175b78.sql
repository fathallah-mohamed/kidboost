-- Add additional columns for onboarding data
ALTER TABLE public.children_profiles 
ADD COLUMN IF NOT EXISTS meal_objectives text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS available_time integer DEFAULT 20,
ADD COLUMN IF NOT EXISTS dislikes text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- Add onboarding_completed to profiles table to track if user completed onboarding
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;