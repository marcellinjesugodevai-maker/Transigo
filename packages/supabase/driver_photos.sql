-- =============================================
-- TRANSIGO - DRIVER PROFILE PHOTOS & VEHICLE COLORS
-- =============================================

-- 1. Ajouter les colonnes pour photo de profil et couleur du véhicule
ALTER TABLE drivers 
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT,
ADD COLUMN IF NOT EXISTS vehicle_color TEXT;

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_drivers_profile_photo ON drivers(profile_photo_url);

-- =============================================
-- 2. CRÉATION DU BUCKET STORAGE
-- =============================================

-- Créer le bucket pour les photos de profil des chauffeurs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'driver-photos',
    'driver-photos',
    true,  -- Public pour que les passagers puissent voir les photos
    5242880,  -- 5MB max
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 3. POLITIQUES RLS POUR LE BUCKET
-- =============================================

-- Politique: Tout le monde peut voir les photos (bucket public)
CREATE POLICY "Photos publiques pour tous"
ON storage.objects FOR SELECT
USING (bucket_id = 'driver-photos');

-- Politique: Les utilisateurs authentifiés peuvent uploader leurs photos
CREATE POLICY "Chauffeurs peuvent uploader leurs photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'driver-photos'
);

-- Politique: Les chauffeurs peuvent modifier leurs propres photos
CREATE POLICY "Chauffeurs peuvent modifier leurs photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'driver-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Politique: Les chauffeurs peuvent supprimer leurs propres photos
CREATE POLICY "Chauffeurs peuvent supprimer leurs photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'driver-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- =============================================
-- NOTE: Structure des fichiers recommandée
-- =============================================
-- Les photos doivent être uploadées avec le format:
-- driver-photos/{driver_id}/profile.jpg
-- 
-- Exemple d'URL finale:
-- https://votre-projet.supabase.co/storage/v1/object/public/driver-photos/{driver_id}/profile.jpg
