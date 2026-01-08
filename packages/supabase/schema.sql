-- =============================================
-- TRANSIGO - DATABASE SCHEMA
-- Exécuter ce script dans Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: users (Passagers)
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    avatar_url TEXT,
    push_token TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: drivers (Chauffeurs)
-- ============================================
CREATE TABLE IF NOT EXISTS public.drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    phone TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    avatar_url TEXT,
    
    -- Véhicule
    vehicle_brand TEXT NOT NULL DEFAULT 'Toyota',
    vehicle_model TEXT NOT NULL DEFAULT 'Corolla',
    vehicle_year INTEGER NOT NULL DEFAULT 2020,
    vehicle_plate TEXT NOT NULL,
    vehicle_color TEXT NOT NULL DEFAULT 'Blanc',
    vehicle_type TEXT NOT NULL DEFAULT 'standard' CHECK (vehicle_type IN ('standard', 'comfort', 'premium', 'moto', 'van')),
    
    -- Wallet & Stats
    wallet_balance INTEGER NOT NULL DEFAULT 0,
    commission_rate DECIMAL(3,2) NOT NULL DEFAULT 0.15,
    rating DECIMAL(2,1) NOT NULL DEFAULT 5.0,
    total_rides INTEGER NOT NULL DEFAULT 0,
    
    -- Status
    is_online BOOLEAN NOT NULL DEFAULT FALSE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Location
    current_lat DECIMAL(10,7),
    current_lng DECIMAL(10,7),
    
    -- Push
    push_token TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: rides (Courses)
-- ============================================
CREATE TABLE IF NOT EXISTS public.rides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    passenger_id UUID REFERENCES public.users(id) NOT NULL,
    driver_id UUID REFERENCES public.drivers(id),
    
    -- Status
    status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'accepted', 'arriving', 'waiting', 'in_progress', 'completed', 'cancelled')),
    
    -- Pickup
    pickup_address TEXT NOT NULL,
    pickup_lat DECIMAL(10,7) NOT NULL,
    pickup_lng DECIMAL(10,7) NOT NULL,
    
    -- Dropoff
    dropoff_address TEXT NOT NULL,
    dropoff_lat DECIMAL(10,7) NOT NULL,
    dropoff_lng DECIMAL(10,7) NOT NULL,
    
    -- Tarification
    distance_km DECIMAL(5,2) NOT NULL DEFAULT 0,
    duration_min INTEGER NOT NULL DEFAULT 0,
    price INTEGER NOT NULL DEFAULT 0,
    commission INTEGER NOT NULL DEFAULT 0,
    vehicle_type TEXT NOT NULL DEFAULT 'standard',
    
    -- Dates
    created_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    arrived_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    
    -- Extra
    cancellation_reason TEXT,
    rating_by_passenger INTEGER CHECK (rating_by_passenger >= 1 AND rating_by_passenger <= 5),
    rating_by_driver INTEGER CHECK (rating_by_driver >= 1 AND rating_by_driver <= 5),
    tip INTEGER NOT NULL DEFAULT 0
);

-- ============================================
-- TABLE: wallet_transactions
-- ============================================
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID REFERENCES public.drivers(id) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('topup', 'commission')),
    amount INTEGER NOT NULL,
    ride_id UUID REFERENCES public.rides(id),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES pour performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_rides_status ON public.rides(status);
CREATE INDEX IF NOT EXISTS idx_rides_passenger ON public.rides(passenger_id);
CREATE INDEX IF NOT EXISTS idx_rides_driver ON public.rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_drivers_online ON public.drivers(is_online) WHERE is_online = TRUE;
CREATE INDEX IF NOT EXISTS idx_wallet_driver ON public.wallet_transactions(driver_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Policies pour users
CREATE POLICY "Users can view own data" ON public.users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Policies pour drivers (plus permissives pour le moment)
CREATE POLICY "Anyone can view drivers" ON public.drivers
    FOR SELECT USING (TRUE);

CREATE POLICY "Drivers can update own data" ON public.drivers
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Anyone can register as driver" ON public.drivers
    FOR INSERT WITH CHECK (TRUE);

-- Policies pour rides
CREATE POLICY "Anyone can view rides" ON public.rides
    FOR SELECT USING (TRUE);

CREATE POLICY "Anyone can create rides" ON public.rides
    FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Anyone can update rides" ON public.rides
    FOR UPDATE USING (TRUE);

-- Policies pour wallet_transactions
CREATE POLICY "Drivers can view own transactions" ON public.wallet_transactions
    FOR SELECT USING (TRUE);

-- ============================================
-- REALTIME - Activer pour les tables
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.rides;
ALTER PUBLICATION supabase_realtime ADD TABLE public.drivers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_transactions;

-- ============================================
-- FUNCTION: Prélever commission automatiquement
-- ============================================
CREATE OR REPLACE FUNCTION public.deduct_commission()
RETURNS TRIGGER AS $$
DECLARE
    driver_record RECORD;
    commission_amount INTEGER;
BEGIN
    -- Seulement quand la course passe à "completed"
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- Récupérer le chauffeur
        SELECT * INTO driver_record FROM public.drivers WHERE id = NEW.driver_id;
        
        -- Calculer la commission (15%)
        commission_amount := ROUND(NEW.price * driver_record.commission_rate);
        NEW.commission := commission_amount;
        
        -- Déduire du wallet
        UPDATE public.drivers 
        SET 
            wallet_balance = wallet_balance - commission_amount,
            total_rides = total_rides + 1,
            updated_at = NOW()
        WHERE id = NEW.driver_id;
        
        -- Enregistrer la transaction
        INSERT INTO public.wallet_transactions (driver_id, type, amount, ride_id, description)
        VALUES (
            NEW.driver_id, 
            'commission', 
            commission_amount, 
            NEW.id,
            'Commission course ' || SUBSTRING(NEW.id::text, 1, 8)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour commission automatique
DROP TRIGGER IF EXISTS trigger_deduct_commission ON public.rides;
CREATE TRIGGER trigger_deduct_commission
    BEFORE UPDATE ON public.rides
    FOR EACH ROW
    EXECUTE FUNCTION public.deduct_commission();

-- ============================================
-- DONNÉES DE DÉMO
-- ============================================
-- Chauffeur de démonstration
INSERT INTO public.drivers (
    phone, first_name, last_name, vehicle_plate, wallet_balance, is_verified
) VALUES (
    '+22507000001', 'Moussa', 'Koné', 'CI 1234 AB', 15000, TRUE
) ON CONFLICT (phone) DO NOTHING;

-- Passager de démonstration
INSERT INTO public.users (
    phone, first_name, last_name
) VALUES (
    '+22507000002', 'Kofi', 'Asante'
) ON CONFLICT (phone) DO NOTHING;
