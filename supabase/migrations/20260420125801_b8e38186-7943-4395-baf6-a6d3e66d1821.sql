-- Create public bucket for AI-generated recipe images
INSERT INTO storage.buckets (id, name, public)
VALUES ('recipe-images', 'recipe-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access
CREATE POLICY "Recipe images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'recipe-images');

-- Authenticated users can upload
CREATE POLICY "Authenticated users can upload recipe images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'recipe-images');

-- Authenticated users can update images
CREATE POLICY "Authenticated users can update recipe images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'recipe-images');