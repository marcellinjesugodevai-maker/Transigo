-- =============================================
-- TRANSIGO - FIX RLS POLICIES FOR USERS TABLE
-- Permet l'inscription et la mise à jour des utilisateurs
-- =============================================

-- Supprimer les anciennes politiques restrictives
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Allow public insert" ON users;
DROP POLICY IF EXISTS "Allow public read" ON users;
DROP POLICY IF EXISTS "Allow public update" ON users;

-- 1. Permettre l'insertion publique (pour l'inscription)
CREATE POLICY "Allow public insert on users"
ON users
FOR INSERT
WITH CHECK (true);

-- 2. Permettre la lecture publique (pour vérifier si un utilisateur existe)
CREATE POLICY "Allow public read on users"
ON users
FOR SELECT
USING (true);

-- 3. Permettre la mise à jour publique (pour le profil)
CREATE POLICY "Allow public update on users"
ON users
FOR UPDATE
USING (true);

-- 4. Permettre la suppression (optionnel, pour admin)
CREATE POLICY "Allow public delete on users"
ON users
FOR DELETE
USING (true);

-- Note: Ces politiques sont permissives pour le développement.
-- Pour la production, restreignez avec auth.uid() = id
