-- =================================================================
-- SCRIPT DE CORRECTION : DOCUMENTS CHAUFFEUR ET PERMISSIONS ADMIN
-- =================================================================
-- Instructions : Copiez tout le contenu et exécutez-le dans Supabase SQL Editor.

BEGIN;

-- 1. Ajout des colonnes manquantes (si elles n'existent pas)
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS license_front_url TEXT;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS license_back_url TEXT;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS registration_card_url TEXT;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS insurance_url TEXT;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS id_card_url TEXT;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- 2. Configuration du Bucket Storage (Public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('driver-documents', 'driver-documents', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. Correction des Politiques de Storage (Permissions Fichiers)
-- On supprime les anciennes pour être sûr
DROP POLICY IF EXISTS "Allow driver doc uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow driver doc reads" ON storage.objects;
DROP POLICY IF EXISTS "Give anon/auth access to driver-documents" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

-- Nouvelle politique : Tout le monde peut uploader (nécessaire pour l'inscription sans être encore connecté parfois, ou connecté)
CREATE POLICY "Allow All Uploads" ON storage.objects
FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'driver-documents');

-- Nouvelle politique : Tout le monde peut lire (Public)
CREATE POLICY "Allow All Reads" ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id = 'driver-documents');


-- 4. Correction des Permissions Table 'drivers' (Permissions Données)
-- Active RLS mais ajoute une politique publique pour lecture
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

-- Supprime anciennes politiques restrictives
DROP POLICY IF EXISTS "Public read drivers" ON public.drivers;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.drivers;
DROP POLICY IF EXISTS "Admins can view all" ON public.drivers;

-- Politique 1 : Lecture PUBLIQUE (permet à l'Admin de voir les infos)
CREATE POLICY "Public Read All Drivers" ON public.drivers
FOR SELECT USING (true);

-- Politique 2 : Mise à jour par le chauffeur lui-même (via user_id si lié à auth.uid, ou loose permission)
-- Pour simplifier le debug, on permet l'update aux authentifiés pour leurs propres lignes
DROP POLICY IF EXISTS "Drivers update own" ON public.drivers;
CREATE POLICY "Drivers update own" ON public.drivers
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- En cas de doute sur user_id vs auth.users, on donne grant explicite
GRANT SELECT, UPDATE ON public.drivers TO anon, authenticated, service_role;

COMMIT;

-- FIN DU SCRIPT
