-- =============================================
-- FIX RLS FOR NON-AUTH BASED UPDATES
-- Since login doesn't use Supabase Auth, we need to allow
-- updates based on the ID in the request, not auth.uid()
-- =============================================

-- Option 1: Disable RLS entirely on drivers table
-- (Simple but less secure - OK for development)
ALTER TABLE public.drivers DISABLE ROW LEVEL SECURITY;

-- If you want to keep RLS enabled later, run this instead:
-- DROP POLICY IF EXISTS "Drivers update own profile" ON public.drivers;
-- CREATE POLICY "Allow all updates on drivers" ON public.drivers
--     FOR UPDATE USING (true) WITH CHECK (true);
-- CREATE POLICY "Allow all selects on drivers" ON public.drivers
--     FOR SELECT USING (true);
