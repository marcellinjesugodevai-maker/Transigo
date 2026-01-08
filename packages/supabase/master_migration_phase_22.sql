-- =================================================================
-- TRANSIGO - PHASE 22 MIGRATION SCRIPT
-- Driver Integration, Vouchers & Safety Features
-- =================================================================

-- 1. SECURITÉ FEMMES : Ajout colonne 'women_only' dans rides
-- Permet de marquer une course comme réservée aux femmes
ALTER TABLE public.rides 
ADD COLUMN IF NOT EXISTS women_only BOOLEAN DEFAULT FALSE;

-- 2. LOGIQUE VOUCHERS : Ajout colonnes de prix détaillés
-- Permet au chauffeur de voir le prix TOTAL (price)
-- Et de stocker la réduction (discount) et ce que le client paie (user_pays)
ALTER TABLE public.rides 
ADD COLUMN IF NOT EXISTS discount INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS user_pays INT; 

-- 3. PROFIL CHAUFFEUR : Ajout colonne 'gender'
-- Nécessaire pour filtrer les courses 'women_only' côté chauffeur
ALTER TABLE public.drivers 
ADD COLUMN IF NOT EXISTS gender VARCHAR(10) CHECK (gender IN ('male', 'female'));

-- =================================================================
-- EXECUTION : Copiez tout ce contenu dans l'éditeur SQL de Supabase
-- =================================================================
