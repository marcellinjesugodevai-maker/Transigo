-- Add discount and user_pays columns to rides table
ALTER TABLE public.rides 
ADD COLUMN IF NOT EXISTS discount INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS user_pays INT;

-- user_pays represents what the customer actually pays (price - discount)
-- price represents the Driver's earnings (Base Price + Surge)
