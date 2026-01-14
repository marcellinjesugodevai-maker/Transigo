-- =============================================
-- TRANSIGO - DRIVER ADVANCED FEATURES (SQL)
-- =============================================

-- 1. ZONE PREDICTIONS (Heat Map Zones)
DROP TABLE IF EXISTS zone_predictions CASCADE;
CREATE TABLE zone_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zone TEXT NOT NULL,
    current_demand TEXT NOT NULL CHECK (current_demand IN ('low', 'medium', 'high', 'surge')),
    predicted_demand TEXT NOT NULL CHECK (predicted_demand IN ('low', 'medium', 'high', 'surge')),
    confidence INTEGER DEFAULT 80,
    trend TEXT DEFAULT 'stable' CHECK (trend IN ('up', 'down', 'stable')),
    surge_multiplier FLOAT DEFAULT 1.0,
    reason TEXT,
    change_percent INTEGER DEFAULT 0,
    in_minutes INTEGER DEFAULT 0,
    recommendation TEXT,
    latitude FLOAT NOT NULL DEFAULT 5.3599, -- Pour afficher sur la carte
    longitude FLOAT NOT NULL DEFAULT -4.0083,
    distance FLOAT DEFAULT 0, -- Distance relative mockée ou calculée
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE zone_predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read zone predictions" ON zone_predictions FOR SELECT USING (true);


-- 2. DRIVER BEST TIMES (Smart Predictions Analytics)
DROP TABLE IF EXISTS driver_best_times CASCADE;
CREATE TABLE driver_best_times (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    time_slot TEXT NOT NULL, -- e.g. "7h-9h"
    earnings INTEGER DEFAULT 0,
    label TEXT,
    icon TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE driver_best_times ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Drivers can view own stats" ON driver_best_times FOR SELECT USING (auth.uid() = driver_id);


-- 3. RIDE BUNDLES (Multi-Course Offers)
DROP TABLE IF EXISTS ride_bundles CASCADE;
CREATE TABLE ride_bundles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    total_price INTEGER NOT NULL,
    total_time INTEGER NOT NULL, -- minutes
    bonus INTEGER DEFAULT 0,
    efficiency INTEGER DEFAULT 100,
    rides JSONB NOT NULL, -- Array of ride details
    status TEXT DEFAULT 'available',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE ride_bundles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Drivers can view own bundles" ON ride_bundles FOR SELECT USING (auth.uid() = driver_id);


-- =============================================
-- MOCK DATA INJECTION (Pour affichage immédiat)
-- =============================================

-- Hot Zones (Globales pour tous)
INSERT INTO zone_predictions (zone, current_demand, predicted_demand, confidence, trend, surge_multiplier, reason, change_percent, in_minutes, recommendation, latitude, longitude, distance)
VALUES 
('Aéroport FHB', 'surge', 'surge', 95, 'stable', 1.5, '✈️ Arrivées de vols internationaux', 0, 0, 'Foncez ! Forte demande.', 5.2556, -3.9304, 8.5),
('Plateau', 'high', 'high', 82, 'up', 1.3, '🏢 Sortie de bureaux', 15, 10, 'Positionnez-vous près des tours admin.', 5.3261, -4.0200, 3.2),
('Cocody', 'high', 'medium', 75, 'stable', 1.2, '🏫 Fin des cours', 0, 0, 'Bonne zone pour des courses courtes.', 5.3533, -3.9964, 1.5),
('2 Plateaux', 'high', 'surge', 70, 'up', 1.2, '🍽️ Déjeuners et Rendez-vous', 25, 20, 'Demande en hausse dans 20 min.', 5.3621, -4.0003, 2.8),
('Riviera', 'medium', 'medium', 55, 'stable', 1.0, '🏘️ Calme résidentiel', 0, 0, 'Zone idéale pour se reposer un peu.', 5.3780, -3.9632, 4.2),
('Yopougon', 'low', 'low', 30, 'stable', 1.0, '🚗 Trafic fluide', 0, 0, 'Rejoignez le Plateau pour plus de gains.', 5.3413, -4.0759, 12.3);

-- Note: Best Times et Bundles sont liés à un Driver ID spécifique. 
-- Ils seront vides initialement pour un nouveau compte, ce qui est normal.
