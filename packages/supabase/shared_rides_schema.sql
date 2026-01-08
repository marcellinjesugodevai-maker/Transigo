-- =============================================
-- TRANSIGO - SHARED RIDES / COVOITURAGE
-- Run in Supabase SQL Editor
-- =============================================

-- Table principale des courses partagées
CREATE TABLE IF NOT EXISTS shared_rides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id UUID,
    creator_id UUID,
    creator_phone TEXT,
    
    -- Points de départ et arrivée
    pickup_address TEXT,
    pickup_lat DECIMAL(10, 8),
    pickup_lon DECIMAL(11, 8),
    dropoff_address TEXT,
    dropoff_lat DECIMAL(10, 8),
    dropoff_lon DECIMAL(11, 8),
    
    -- Infos véhicule et chauffeur
    vehicle_type TEXT DEFAULT 'standard',
    driver_name TEXT,
    driver_phone TEXT,
    
    -- Prix et places
    base_price INT NOT NULL,
    current_price_per_person INT NOT NULL,
    max_passengers INT DEFAULT 4,
    current_passengers INT DEFAULT 1,
    
    -- État
    status TEXT DEFAULT 'searching', -- searching, driver_assigned, in_progress, completed, cancelled
    is_accepting_passengers BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    departure_time TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Table des passagers dans une course partagée
CREATE TABLE IF NOT EXISTS shared_ride_passengers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shared_ride_id UUID REFERENCES shared_rides(id) ON DELETE CASCADE,
    user_id UUID,
    user_phone TEXT,
    user_name TEXT,
    
    -- Point de ramassage et dépôt du passager
    pickup_address TEXT,
    pickup_lat DECIMAL(10, 8),
    pickup_lon DECIMAL(11, 8),
    dropoff_address TEXT,
    dropoff_lat DECIMAL(10, 8),
    dropoff_lon DECIMAL(11, 8),
    
    -- Prix à payer par ce passager
    price_to_pay INT NOT NULL,
    
    -- Statut du passager
    status TEXT DEFAULT 'waiting', -- waiting, picked_up, dropped_off, cancelled
    pickup_order INT, -- Ordre de ramassage
    
    -- Timestamps
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    picked_up_at TIMESTAMP WITH TIME ZONE,
    dropped_off_at TIMESTAMP WITH TIME ZONE
);

-- Index pour recherches rapides
CREATE INDEX IF NOT EXISTS idx_shared_rides_status ON shared_rides(status);
CREATE INDEX IF NOT EXISTS idx_shared_rides_dropoff ON shared_rides(dropoff_lat, dropoff_lon);
CREATE INDEX IF NOT EXISTS idx_shared_rides_accepting ON shared_rides(is_accepting_passengers);

-- Activer Realtime sur ces tables
ALTER PUBLICATION supabase_realtime ADD TABLE shared_rides;
ALTER PUBLICATION supabase_realtime ADD TABLE shared_ride_passengers;

-- RLS Policies
ALTER TABLE shared_rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_ride_passengers ENABLE ROW LEVEL SECURITY;

-- Politique: tout le monde peut voir les courses partagées actives
CREATE POLICY "Anyone can view active shared rides" ON shared_rides
    FOR SELECT USING (status IN ('searching', 'driver_assigned') AND is_accepting_passengers = true);

-- Politique: les utilisateurs authentifiés peuvent créer
CREATE POLICY "Users can create shared rides" ON shared_rides
    FOR INSERT WITH CHECK (true);

-- Politique: créateur peut modifier sa course
CREATE POLICY "Creator can update own ride" ON shared_rides
    FOR UPDATE USING (true);

-- Politique pour les passagers
CREATE POLICY "Anyone can view passengers" ON shared_ride_passengers
    FOR SELECT USING (true);

CREATE POLICY "Users can join rides" ON shared_ride_passengers
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own status" ON shared_ride_passengers
    FOR UPDATE USING (true);

-- Ajout de la colonne stops à la table rides pour les arrêts moto
ALTER TABLE rides ADD COLUMN IF NOT EXISTS stops JSONB;
