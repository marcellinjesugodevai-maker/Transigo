-- =============================================
-- TRANSIGO - TABLES COVOITURAGE & RÉCURRENTS
-- À exécuter dans Supabase SQL Editor
-- =============================================

-- ============================================
-- 1. TABLE SHARED_RIDES (Covoiturage)
-- ============================================
CREATE TABLE IF NOT EXISTS shared_rides (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Créateur de la course
    creator_id UUID REFERENCES auth.users(id),
    creator_phone VARCHAR(20),
    
    -- Chauffeur (si assigné)
    driver_id UUID REFERENCES auth.users(id),
    driver_name VARCHAR(100),
    driver_phone VARCHAR(20),
    
    -- Point de départ
    pickup_address TEXT NOT NULL,
    pickup_lat DOUBLE PRECISION NOT NULL,
    pickup_lon DOUBLE PRECISION NOT NULL,
    
    -- Destination
    dropoff_address TEXT NOT NULL,
    dropoff_lat DOUBLE PRECISION NOT NULL,
    dropoff_lon DOUBLE PRECISION NOT NULL,
    
    -- Trajet (pour matching en route)
    route_trajectory JSONB, -- Array de {latitude, longitude}
    
    -- Type et prix
    vehicle_type VARCHAR(20) DEFAULT 'classic',
    base_price INTEGER NOT NULL,
    current_price_per_person INTEGER NOT NULL,
    
    -- Passagers
    max_passengers INTEGER DEFAULT 4,
    current_passengers INTEGER DEFAULT 1,
    is_accepting_passengers BOOLEAN DEFAULT true,
    
    -- Type de course
    ride_type VARCHAR(20) DEFAULT 'passenger_request', -- 'passenger_request' | 'driver_planned'
    destination_mode VARCHAR(20), -- 'home' | 'custom' (pour trajets chauffeur)
    departure_time TIMESTAMPTZ,
    
    -- Statut
    status VARCHAR(20) DEFAULT 'searching', -- searching, driver_assigned, in_progress, completed, cancelled
    
    -- Position actuelle (pour suivi)
    current_lat DOUBLE PRECISION,
    current_lon DOUBLE PRECISION,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_shared_rides_status ON shared_rides(status);
CREATE INDEX IF NOT EXISTS idx_shared_rides_accepting ON shared_rides(is_accepting_passengers) WHERE is_accepting_passengers = true;
CREATE INDEX IF NOT EXISTS idx_shared_rides_driver ON shared_rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_shared_rides_creator ON shared_rides(creator_id);

-- ============================================
-- 2. TABLE SHARED_RIDE_PASSENGERS
-- ============================================
CREATE TABLE IF NOT EXISTS shared_ride_passengers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    shared_ride_id UUID REFERENCES shared_rides(id) ON DELETE CASCADE,
    
    -- Passager
    user_id UUID REFERENCES auth.users(id),
    user_phone VARCHAR(20),
    user_name VARCHAR(100),
    
    -- Points de prise/dépose
    pickup_address TEXT NOT NULL,
    pickup_lat DOUBLE PRECISION NOT NULL,
    pickup_lon DOUBLE PRECISION NOT NULL,
    dropoff_address TEXT NOT NULL,
    dropoff_lat DOUBLE PRECISION NOT NULL,
    dropoff_lon DOUBLE PRECISION NOT NULL,
    
    -- Prix à payer
    price_to_pay INTEGER NOT NULL,
    
    -- Ordre de ramassage
    pickup_order INTEGER DEFAULT 1,
    
    -- Statut
    status VARCHAR(20) DEFAULT 'waiting', -- waiting, picked_up, dropped_off, cancelled
    
    -- Timestamps
    joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_shared_passengers_ride ON shared_ride_passengers(shared_ride_id);
CREATE INDEX IF NOT EXISTS idx_shared_passengers_user ON shared_ride_passengers(user_id);

-- ============================================
-- 3. TABLE RECURRING_RIDES (Trajets récurrents)
-- ============================================
CREATE TABLE IF NOT EXISTS recurring_rides (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Passager
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    
    -- Point de départ
    pickup_address TEXT NOT NULL,
    pickup_lat DOUBLE PRECISION NOT NULL,
    pickup_lon DOUBLE PRECISION NOT NULL,
    
    -- Destination
    dropoff_address TEXT NOT NULL,
    dropoff_lat DOUBLE PRECISION NOT NULL,
    dropoff_lon DOUBLE PRECISION NOT NULL,
    
    -- Jours de la semaine (array: ['mon', 'tue', 'wed', 'thu', 'fri'])
    days_of_week TEXT[] NOT NULL,
    
    -- Heure de départ (format HH:MM)
    departure_time VARCHAR(5) NOT NULL,
    
    -- Type de véhicule
    vehicle_type VARCHAR(20) DEFAULT 'classic',
    
    -- Chauffeur préféré (optionnel)
    preferred_driver_id UUID REFERENCES auth.users(id),
    preferred_driver_name VARCHAR(100),
    
    -- Prix
    price_per_ride INTEGER NOT NULL,
    monthly_price INTEGER, -- Prix mensuel estimé
    
    -- Stats
    estimated_rides_per_month INTEGER DEFAULT 0,
    completed_rides INTEGER DEFAULT 0,
    
    -- Statut
    status VARCHAR(20) DEFAULT 'active', -- active, paused, expired, cancelled
    
    -- Dates
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_recurring_user ON recurring_rides(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_status ON recurring_rides(status);
CREATE INDEX IF NOT EXISTS idx_recurring_driver ON recurring_rides(preferred_driver_id);

-- ============================================
-- 4. TABLE SUBSCRIPTIONS (Abonnements)
-- ============================================
CREATE TABLE IF NOT EXISTS ride_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Passager
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    
    -- Plan
    plan_name VARCHAR(50) NOT NULL, -- 'basic', 'pro', 'unlimited'
    rides_per_month INTEGER NOT NULL,
    price_per_month INTEGER NOT NULL,
    discount_percentage INTEGER DEFAULT 0,
    
    -- Utilisation
    rides_used INTEGER DEFAULT 0,
    
    -- Statut
    status VARCHAR(20) DEFAULT 'active', -- active, paused, expired, cancelled
    
    -- Dates
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    next_billing_date DATE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON ride_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON ride_subscriptions(status);

-- ============================================
-- 5. TABLE SCHEDULED_RIDES (Réservations)
-- ============================================
CREATE TABLE IF NOT EXISTS scheduled_rides (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Passager
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    user_phone VARCHAR(20),
    
    -- Chauffeur (assigné plus tard)
    driver_id UUID REFERENCES auth.users(id),
    driver_name VARCHAR(100),
    
    -- Point de départ
    pickup_address TEXT NOT NULL,
    pickup_lat DOUBLE PRECISION NOT NULL,
    pickup_lon DOUBLE PRECISION NOT NULL,
    
    -- Destination
    dropoff_address TEXT NOT NULL,
    dropoff_lat DOUBLE PRECISION NOT NULL,
    dropoff_lon DOUBLE PRECISION NOT NULL,
    
    -- Date et heure
    scheduled_date DATE NOT NULL,
    scheduled_time VARCHAR(5) NOT NULL, -- HH:MM
    
    -- Type et prix
    vehicle_type VARCHAR(20) DEFAULT 'classic',
    estimated_price INTEGER NOT NULL,
    final_price INTEGER,
    
    -- Statut
    status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, driver_on_way, in_progress, completed, cancelled
    
    -- Paiement
    payment_status VARCHAR(20) DEFAULT 'pending', -- pending, paid, refunded
    payment_method VARCHAR(20), -- wallet, mobile_money, cash
    
    -- Lié à un trajet récurrent ?
    recurring_ride_id UUID REFERENCES recurring_rides(id),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_scheduled_user ON scheduled_rides(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_driver ON scheduled_rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_date ON scheduled_rides(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_status ON scheduled_rides(status);

-- ============================================
-- 6. TRIGGERS pour updated_at
-- ============================================

-- Fonction générique
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
DROP TRIGGER IF EXISTS update_shared_rides_updated_at ON shared_rides;
CREATE TRIGGER update_shared_rides_updated_at
    BEFORE UPDATE ON shared_rides
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_recurring_rides_updated_at ON recurring_rides;
CREATE TRIGGER update_recurring_rides_updated_at
    BEFORE UPDATE ON recurring_rides
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON ride_subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON ride_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_scheduled_rides_updated_at ON scheduled_rides;
CREATE TRIGGER update_scheduled_rides_updated_at
    BEFORE UPDATE ON scheduled_rides
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. RLS POLICIES (Row Level Security)
-- ============================================

-- Activer RLS
ALTER TABLE shared_rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_ride_passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_rides ENABLE ROW LEVEL SECURITY;

-- DROP existing policies first (pour éviter erreurs si déjà créées)
DROP POLICY IF EXISTS "Users can view open rides" ON shared_rides;
DROP POLICY IF EXISTS "Users can create rides" ON shared_rides;
DROP POLICY IF EXISTS "Creators and drivers can update rides" ON shared_rides;
DROP POLICY IF EXISTS "Passengers can view their rides" ON shared_ride_passengers;
DROP POLICY IF EXISTS "Users can join rides" ON shared_ride_passengers;
DROP POLICY IF EXISTS "Passengers can update their status" ON shared_ride_passengers;
DROP POLICY IF EXISTS "Users can view own recurring rides" ON recurring_rides;
DROP POLICY IF EXISTS "Users can create recurring rides" ON recurring_rides;
DROP POLICY IF EXISTS "Users can update own recurring rides" ON recurring_rides;
DROP POLICY IF EXISTS "Users can delete own recurring rides" ON recurring_rides;
DROP POLICY IF EXISTS "Users can view own subscriptions" ON ride_subscriptions;
DROP POLICY IF EXISTS "Users can create subscriptions" ON ride_subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON ride_subscriptions;
DROP POLICY IF EXISTS "Users can view own scheduled rides" ON scheduled_rides;
DROP POLICY IF EXISTS "Users can create scheduled rides" ON scheduled_rides;
DROP POLICY IF EXISTS "Users and drivers can update scheduled rides" ON scheduled_rides;

-- Policies shared_rides
CREATE POLICY "Users can view open rides" ON shared_rides
    FOR SELECT USING (is_accepting_passengers = true OR creator_id = auth.uid() OR driver_id = auth.uid());

CREATE POLICY "Users can create rides" ON shared_rides
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Creators and drivers can update rides" ON shared_rides
    FOR UPDATE USING (creator_id = auth.uid() OR driver_id = auth.uid());

-- Policies shared_ride_passengers
CREATE POLICY "Passengers can view their rides" ON shared_ride_passengers
    FOR SELECT USING (user_id = auth.uid() OR shared_ride_id IN (SELECT id FROM shared_rides WHERE creator_id = auth.uid() OR driver_id = auth.uid()));

CREATE POLICY "Users can join rides" ON shared_ride_passengers
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Passengers can update their status" ON shared_ride_passengers
    FOR UPDATE USING (user_id = auth.uid());

-- Policies recurring_rides
CREATE POLICY "Users can view own recurring rides" ON recurring_rides
    FOR SELECT USING (user_id = auth.uid() OR preferred_driver_id = auth.uid());

CREATE POLICY "Users can create recurring rides" ON recurring_rides
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own recurring rides" ON recurring_rides
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own recurring rides" ON recurring_rides
    FOR DELETE USING (user_id = auth.uid());

-- Policies subscriptions
CREATE POLICY "Users can view own subscriptions" ON ride_subscriptions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create subscriptions" ON ride_subscriptions
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own subscriptions" ON ride_subscriptions
    FOR UPDATE USING (user_id = auth.uid());

-- Policies scheduled_rides
CREATE POLICY "Users can view own scheduled rides" ON scheduled_rides
    FOR SELECT USING (user_id = auth.uid() OR driver_id = auth.uid());

CREATE POLICY "Users can create scheduled rides" ON scheduled_rides
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users and drivers can update scheduled rides" ON scheduled_rides
    FOR UPDATE USING (user_id = auth.uid() OR driver_id = auth.uid());

-- ============================================
-- 8. ENABLE REALTIME (ignore if already added)
-- ============================================
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE shared_rides;
EXCEPTION WHEN duplicate_object THEN
    -- Table already in publication, ignore
END;
$$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE shared_ride_passengers;
EXCEPTION WHEN duplicate_object THEN
    -- Table already in publication, ignore
END;
$$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE scheduled_rides;
EXCEPTION WHEN duplicate_object THEN
    -- Table already in publication, ignore
END;
$$;

-- ============================================
-- DONE! Tables créées avec succès 🎉
-- ============================================
