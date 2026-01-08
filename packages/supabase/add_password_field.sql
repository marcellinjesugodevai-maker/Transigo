-- =============================================
-- TRANSIGO - ADD PASSWORD FIELD TO USERS/DRIVERS
-- Run in Supabase SQL Editor
-- =============================================

-- Add password column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password TEXT;

-- Add password column to drivers table  
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS password TEXT;

-- Note: In production, passwords should be hashed using bcrypt or similar
-- This is a simple implementation for development
