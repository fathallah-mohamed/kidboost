-- Add missing columns for batch cooking / reuse features
ALTER TABLE public.recipes
    ADD COLUMN IF NOT EXISTS is_batch_cooking boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS is_reuse boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS original_recipe_id uuid REFERENCES public.recipes(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS reuse_info jsonb,
    ADD COLUMN IF NOT EXISTS storage_info jsonb;

-- Fix WARN 1: tighten meal_statistics insert policy
DROP POLICY IF EXISTS "Users can insert their meal statistics" ON public.meal_statistics;
CREATE POLICY "Users can insert their meal statistics" ON public.meal_statistics
    FOR INSERT WITH CHECK (profile_id = auth.uid());

-- Fix WARN 2: restrict leftover-photos bucket SELECT to owner
DROP POLICY IF EXISTS "Leftover photos are publicly accessible" ON storage.objects;
CREATE POLICY "Users can view their own leftover photos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'leftover-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Make bucket private (signed URLs needed for access)
UPDATE storage.buckets SET public = false WHERE id = 'leftover-photos';