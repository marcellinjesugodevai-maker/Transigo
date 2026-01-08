-- ============================================
-- TRANSIGO: Driver Documents Storage & Schema
-- ============================================
-- Run this in Supabase SQL Editor

-- 1. Create Storage Bucket for Driver Documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('driver-documents', 'driver-documents', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage Policies (Allow uploads and reads)
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow driver doc uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow driver doc reads" ON storage.objects;

-- Policy: Allow anyone to upload to driver-documents bucket
CREATE POLICY "Allow driver doc uploads" ON storage.objects
FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'driver-documents');

-- Policy: Allow anyone to read from driver-documents bucket
CREATE POLICY "Allow driver doc reads" ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id = 'driver-documents');

-- 3. Add Document URL Columns to drivers table
ALTER TABLE public.drivers
ADD COLUMN IF NOT EXISTS license_front_url TEXT,
ADD COLUMN IF NOT EXISTS license_back_url TEXT,
ADD COLUMN IF NOT EXISTS registration_card_url TEXT,
ADD COLUMN IF NOT EXISTS insurance_url TEXT,
ADD COLUMN IF NOT EXISTS id_card_url TEXT;

-- 4. Add is_verified column if not exists
ALTER TABLE public.drivers
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- Done!
-- Check your Supabase Storage > driver-documents bucket
-- Check your Table Editor > drivers table for new columns
