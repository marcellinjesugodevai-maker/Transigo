-- =============================================
-- TRANSIGO - AUTORISATION RAPIDE UPLOAD STORAGE
-- Exécuter ce script pour permettre l'upload sans authentification
-- =============================================

-- Supprimer les anciennes politiques restrictives
DROP POLICY IF EXISTS "Authenticated Upload Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete Access" ON storage.objects;

-- Créer des politiques permissives (tout le monde peut uploader)
CREATE POLICY "Allow Public Upload"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'app-assets');

CREATE POLICY "Allow Public Update"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'app-assets');

CREATE POLICY "Allow Public Delete"
ON storage.objects
FOR DELETE
USING (bucket_id = 'app-assets');

-- =============================================
-- NOTE DE SÉCURITÉ
-- =============================================
-- Ces politiques sont TRÈS permissives (tout le monde peut uploader/supprimer)
-- Pour la production, vous devriez les restreindre aux admins authentifiés
-- Exemple pour production :
-- WITH CHECK (bucket_id = 'app-assets' AND auth.role() = 'authenticated')
