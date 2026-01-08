-- Add women_only column to rides table if it doesn't exist
ALTER TABLE public.rides 
ADD COLUMN IF NOT EXISTS women_only BOOLEAN DEFAULT FALSE;

-- Update the schema cache (usually happens automatically but good to know)
-- NOTIFY pgrst, 'reload config'; 
