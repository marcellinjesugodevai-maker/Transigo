-- ============================================
-- TRANSIGO BUSINESS: Profile Types
-- ============================================
-- Run this in Supabase SQL Editor

-- Add profile_type column to drivers table
ALTER TABLE public.drivers
ADD COLUMN IF NOT EXISTS profile_type TEXT DEFAULT 'driver' 
    CHECK (profile_type IN ('driver', 'delivery', 'seller'));

-- Comment for clarity
COMMENT ON COLUMN public.drivers.profile_type IS 'Type of business profile: driver (VTC), delivery (livreur), seller (vendeur)';
