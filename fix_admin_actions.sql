-- =================================================================
-- SCRIPT DE CORRECTION : ACTIONS ADMIN SÉCURISÉES (RPC)
-- =================================================================
-- Instructions : Copiez tout le contenu et exécutez-le dans Supabase SQL Editor.

BEGIN;

-- 1. Fonction : VALIDER UN CHAUFFEUR (admin_verify_driver)
CREATE OR REPLACE FUNCTION public.admin_verify_driver(
    p_driver_id UUID,
    p_verified BOOLEAN,
    p_secret_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Exécute avec les droits du créateur (Service Role)
AS $$
BEGIN
    -- Vérification Sécurité
    IF p_secret_key != 'TRANSIGO_ADMIN_SECRET_2026' THEN
        RAISE EXCEPTION 'Accès refusé : Clé secrète invalide';
    END IF;

    -- Mise à jour
    UPDATE public.drivers
    SET is_verified = p_verified,
        updated_at = NOW()
    WHERE id = p_driver_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Chauffeur introuvable';
    END IF;

    RETURN jsonb_build_object('success', true, 'is_verified', p_verified);
END;
$$;

-- 2. Fonction : BLOQUER/DÉBLOQUER UN CHAUFFEUR (admin_block_driver)
CREATE OR REPLACE FUNCTION public.admin_block_driver(
    p_driver_id UUID,
    p_blocked BOOLEAN,
    p_secret_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Vérification Sécurité
    IF p_secret_key != 'TRANSIGO_ADMIN_SECRET_2026' THEN
        RAISE EXCEPTION 'Accès refusé : Clé secrète invalide';
    END IF;

    -- Mise à jour (Si bloqué, on met aussi is_online = false et is_verified = false par sécurité)
    IF p_blocked THEN
        UPDATE public.drivers
        SET is_blocked = true,
            is_online = false,
            is_verified = false,
            updated_at = NOW()
        WHERE id = p_driver_id;
    ELSE
        UPDATE public.drivers
        SET is_blocked = false,
            updated_at = NOW()
        WHERE id = p_driver_id;
    END IF;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Chauffeur introuvable';
    END IF;

    RETURN jsonb_build_object('success', true, 'is_blocked', p_blocked);
END;
$$;

-- 3. Permissions : Tout le monde peut appeler ces fonctions (protégées par clé interne)
GRANT EXECUTE ON FUNCTION public.admin_verify_driver TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_block_driver TO anon, authenticated, service_role;

COMMIT;

-- FIN DU SCRIPT
