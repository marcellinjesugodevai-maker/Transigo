-- Add gender column to drivers table
ALTER TABLE public.drivers 
ADD COLUMN IF NOT EXISTS gender VARCHAR(10) CHECK (gender IN ('male', 'female'));

-- Optional: Set default gender for existing drivers (e.g., 'male') if needed
-- UPDATE public.drivers SET gender = 'male' WHERE gender IS NULL;
