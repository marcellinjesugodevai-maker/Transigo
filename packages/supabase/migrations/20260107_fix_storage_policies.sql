-- ============================================
-- TRANSIGO: Fix Storage Policies for Driver Documents
-- ============================================
-- Run this in Supabase SQL Editor to fix upload issues

-- Drop ALL existing policies on storage.objects for driver-documents
DO $$
DECLARE
    pol_name TEXT;
BEGIN
    FOR pol_name IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'objects' AND schemaname = 'storage'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol_name);
    END LOOP;
END $$;

-- Recreate bucket (ensure it exists and is PUBLIC)
INSERT INTO storage.buckets (id, name, public)
VALUES ('driver-documents', 'driver-documents', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Policy: Allow ALL operations for authenticated users
CREATE POLICY "driver_docs_all_auth" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'driver-documents')
WITH CHECK (bucket_id = 'driver-documents');

-- Policy: Allow ALL operations for anon users (for testing)
CREATE POLICY "driver_docs_all_anon" ON storage.objects
FOR ALL TO anon
USING (bucket_id = 'driver-documents')
WITH CHECK (bucket_id = 'driver-documents');

-- Public read access
CREATE POLICY "driver_docs_public_select" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'driver-documents');
