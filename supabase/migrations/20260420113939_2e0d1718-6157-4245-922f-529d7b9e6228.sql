ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS ai_provider text NOT NULL DEFAULT 'lovable'
CHECK (ai_provider IN ('lovable', 'perplexity'));