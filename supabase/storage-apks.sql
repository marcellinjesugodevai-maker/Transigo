-- ============================================
-- SUPABASE STORAGE: Bucket APK pour TransiGo
-- À exécuter dans l'éditeur SQL de Supabase
-- ============================================

-- 1. Créer le bucket "apks" (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'apks',
  'apks',
  true,  -- Public: accessible sans authentification
  104857600,  -- 100 MB max par fichier
  ARRAY['application/vnd.android.package-archive', 'application/octet-stream']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 104857600;

-- 2. Politique RLS: Permettre la LECTURE publique (téléchargement)
DROP POLICY IF EXISTS "Allow public download of APKs" ON storage.objects;
CREATE POLICY "Allow public download of APKs"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'apks');

-- 3. Politique RLS: Permettre l'UPLOAD pour les utilisateurs authentifiés (admin)
DROP POLICY IF EXISTS "Allow authenticated users to upload APKs" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload APKs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'apks');

-- 4. Politique RLS: Permettre la MISE À JOUR pour les utilisateurs authentifiés
DROP POLICY IF EXISTS "Allow authenticated users to update APKs" ON storage.objects;
CREATE POLICY "Allow authenticated users to update APKs"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'apks');

-- 5. Politique RLS: Permettre la SUPPRESSION pour les utilisateurs authentifiés
DROP POLICY IF EXISTS "Allow authenticated users to delete APKs" ON storage.objects;
CREATE POLICY "Allow authenticated users to delete APKs"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'apks');

-- ============================================
-- APRÈS EXÉCUTION:
-- 1. Allez dans Storage > apks
-- 2. Uploadez vos fichiers APK:
--    - "TRANSI GO  New.apk" → renommez en "transigo-passenger-v1-1.apk"
--    - "TRANSI GO BUSINESS New.apk" → renommez en "transigo-business-v1-1.apk"
-- 3. Les URLs publiques seront:
--    https://zndgvloyaitopczhjddq.supabase.co/storage/v1/object/public/apks/transigo-passenger-v1-1.apk
--    https://zndgvloyaitopczhjddq.supabase.co/storage/v1/object/public/apks/transigo-business-v1-1.apk
-- ============================================
