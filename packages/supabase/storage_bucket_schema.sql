-- =============================================
-- TRANSIGO - SUPABASE STORAGE BUCKET
-- Bucket pour les assets de l'application (images, illustrations)
-- =============================================

-- 1. Créer le bucket "app-assets" pour stocker les images de l'app
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'app-assets',
    'app-assets',
    true,  -- Public bucket (lecture sans authentification)
    5242880,  -- 5MB max par fichier
    ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =============================================
-- POLITIQUES RLS POUR LE BUCKET
-- =============================================

-- 2. Politique : Lecture publique (tout le monde peut voir les images)
CREATE POLICY "Public Read Access"
ON storage.objects
FOR SELECT
USING (bucket_id = 'app-assets');

-- 3. Politique : Upload réservé aux utilisateurs authentifiés
-- (Vous pouvez restreindre davantage avec un rôle admin si nécessaire)
CREATE POLICY "Authenticated Upload Access"
ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'app-assets'
    AND auth.role() = 'authenticated'
);

-- 4. Politique : Modification réservée aux utilisateurs authentifiés
CREATE POLICY "Authenticated Update Access"
ON storage.objects
FOR UPDATE
USING (
    bucket_id = 'app-assets'
    AND auth.role() = 'authenticated'
);

-- 5. Politique : Suppression réservée aux utilisateurs authentifiés
CREATE POLICY "Authenticated Delete Access"
ON storage.objects
FOR DELETE
USING (
    bucket_id = 'app-assets'
    AND auth.role() = 'authenticated'
);

-- =============================================
-- STRUCTURE DES DOSSIERS RECOMMANDÉE
-- =============================================
-- app-assets/
--   ├── splash/           (Images du splash screen)
--   │   └── car.png
--   ├── onboarding/       (Images de l'onboarding)
--   │   ├── travel.png
--   │   ├── negotiate.png
--   │   └── safety.png
--   ├── icons/            (Icônes de l'application)
--   └── logos/            (Logos et branding)

-- =============================================
-- COMMENT UTILISER DANS L'APP
-- =============================================
-- URL publique : https://[PROJECT_ID].supabase.co/storage/v1/object/public/app-assets/[CHEMIN_FICHIER]
-- Exemple : https://abc123.supabase.co/storage/v1/object/public/app-assets/splash/car.png
