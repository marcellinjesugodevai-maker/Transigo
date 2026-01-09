-- =============================================
-- TRANSIGO - DRIVER PROFILE PHOTOS & VEHICLE COLORS
-- =============================================

-- Ajouter les colonnes pour photo de profil et couleur du véhicule
ALTER TABLE drivers 
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT,
ADD COLUMN IF NOT EXISTS vehicle_color TEXT;

-- Créer le bucket pour les photos de profil (à exécuter dans Supabase Dashboard > Storage)
-- Nom du bucket: driver-photos
-- Public: Oui (pour afficher les photos aux passagers)

-- Politique de stockage pour le bucket driver-photos
-- INSERT: Authentifié
-- SELECT: Tout le monde
-- UPDATE: Propriétaire
-- DELETE: Propriétaire

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_drivers_profile_photo ON drivers(profile_photo_url);
