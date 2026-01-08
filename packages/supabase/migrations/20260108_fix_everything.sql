-- ================================================
-- TRANSIGO FINAL FIX: Schema & Permissions
-- ================================================

-- 1. Ensure 'drivers' table has all new columns
ALTER TABLE public.drivers 
ADD COLUMN IF NOT EXISTS profile_type TEXT DEFAULT 'driver',
ADD COLUMN IF NOT EXISTS license_front_url TEXT,
ADD COLUMN IF NOT EXISTS license_back_url TEXT,
ADD COLUMN IF NOT EXISTS registration_card_url TEXT,
ADD COLUMN IF NOT EXISTS insurance_url TEXT,
ADD COLUMN IF NOT EXISTS id_card_url TEXT,
ADD COLUMN IF NOT EXISTS business_registration_url TEXT, -- For sellers
ADD COLUMN IF NOT EXISTS vehicle_brand TEXT,
ADD COLUMN IF NOT EXISTS vehicle_model TEXT,
ADD COLUMN IF NOT EXISTS vehicle_year INTEGER,
ADD COLUMN IF NOT EXISTS vehicle_plate TEXT,
ADD COLUMN IF NOT EXISTS vehicle_color TEXT,
ADD COLUMN IF NOT EXISTS vehicle_type TEXT DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- 2. Fix Row Level Security (RLS) for Drivers Update
-- Enable RLS
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

-- Allow drivers to read their own data
DROP POLICY IF EXISTS "Drivers can view own data" ON public.drivers;
CREATE POLICY "Drivers can view own data" ON public.drivers
FOR SELECT USING (auth.uid() = id);

-- Allow drivers to update their own data (CRITICAL FOR ONBOARDING)
DROP POLICY IF EXISTS "Drivers can update own data" ON public.drivers;
CREATE POLICY "Drivers can update own data" ON public.drivers
FOR UPDATE USING (auth.uid() = id);

-- Allow new drivers to insert their data
DROP POLICY IF EXISTS "Drivers can insert own data" ON public.drivers;
CREATE POLICY "Drivers can insert own data" ON public.drivers
FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. Fix Storage Permissions (Bucket 'driver-documents')
INSERT INTO storage.buckets (id, name, public)
VALUES ('driver-documents', 'driver-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Allow uploads (Insert)
DROP POLICY IF EXISTS "Allow driver doc uploads" ON storage.objects;
CREATE POLICY "Allow driver doc uploads" ON storage.objects
FOR INSERT TO authenticated, anon
WITH CHECK (bucket_id = 'driver-documents');

-- Allow reads (Select)
DROP POLICY IF EXISTS "Allow driver doc reads" ON storage.objects;
CREATE POLICY "Allow driver doc reads" ON storage.objects
FOR SELECT TO authenticated, anon
USING (bucket_id = 'driver-documents');
