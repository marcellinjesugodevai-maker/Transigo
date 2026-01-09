-- =============================================
-- TRANSIGO - PUSH NOTIFICATIONS SCHEMA
-- =============================================

-- Table pour stocker les tokens push des utilisateurs
CREATE TABLE IF NOT EXISTS push_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    device_type TEXT DEFAULT 'android', -- android, ios
    app_type TEXT NOT NULL, -- 'passenger', 'driver'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Un token appartient soit à un user soit à un driver
    CONSTRAINT check_owner CHECK (
        (user_id IS NOT NULL AND driver_id IS NULL) OR 
        (user_id IS NULL AND driver_id IS NOT NULL)
    )
);

-- Index pour recherches rapides
CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_driver ON push_tokens(driver_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_app_type ON push_tokens(app_type);
CREATE INDEX IF NOT EXISTS idx_push_tokens_active ON push_tokens(is_active);

-- Table pour logger les notifications envoyées
CREATE TABLE IF NOT EXISTS notifications_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    
    -- Type de notification
    notification_type TEXT NOT NULL DEFAULT 'manual', -- 'manual', 'auto_ride_accepted', 'auto_driver_arrived', etc.
    
    -- Cible
    target_type TEXT NOT NULL DEFAULT 'all', -- 'all', 'passengers', 'drivers', 'specific'
    target_ids UUID[] DEFAULT '{}', -- IDs spécifiques si target_type = 'specific'
    
    -- Statistiques
    sent_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    
    -- Métadonnées
    created_by UUID, -- Admin qui a envoyé (pour les manuelles)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour historique
CREATE INDEX IF NOT EXISTS idx_notifications_log_type ON notifications_log(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_log_created ON notifications_log(created_at DESC);

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_push_token_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at
DROP TRIGGER IF EXISTS update_push_tokens_timestamp ON push_tokens;
CREATE TRIGGER update_push_tokens_timestamp
    BEFORE UPDATE ON push_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_push_token_timestamp();

-- RLS Policies
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications_log ENABLE ROW LEVEL SECURITY;

-- Politique: Les admins peuvent tout faire
CREATE POLICY admin_push_tokens ON push_tokens FOR ALL TO authenticated
    USING (true);

CREATE POLICY admin_notifications_log ON notifications_log FOR ALL TO authenticated
    USING (true);

-- Vue pour faciliter les requêtes admin
CREATE OR REPLACE VIEW push_tokens_summary AS
SELECT 
    app_type,
    COUNT(*) FILTER (WHERE is_active) as active_count,
    COUNT(*) as total_count
FROM push_tokens
GROUP BY app_type;
