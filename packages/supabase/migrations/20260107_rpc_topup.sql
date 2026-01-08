-- =============================================
-- TRANSIGO - SECURE WALLET TOP UP (RPC)
-- Exécuter ce script pour permettre à l'Admin d'ajouter des fonds
-- sans être bloqué par les règles RLS (via SECURITY DEFINER).
-- =============================================

-- Fonction sécurisée par un Secret Key
CREATE OR REPLACE FUNCTION public.admin_top_up_wallet(
    p_driver_id UUID,
    p_amount NUMERIC,
    p_secret_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Exécute avec les droits du créateur (Service Role)
AS $$
DECLARE
    v_new_balance NUMERIC;
    v_driver_name TEXT;
BEGIN
    -- 1. Vérification Sécurité (Clé Secrète)
    -- Cette clé est codée en dur pour simplifier (Admin <-> DB)
    IF p_secret_key != 'TRANSIGO_ADMIN_SECRET_2026' THEN
        RAISE EXCEPTION 'Accès refusé : Clé secrète invalide';
    END IF;

    -- 2. Mise à jour du Wallet
    UPDATE public.drivers
    SET wallet_balance = wallet_balance + p_amount
    WHERE id = p_driver_id
    RETURNING wallet_balance, first_name || ' ' || last_name INTO v_new_balance, v_driver_name;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Chauffeur introuvable (ID: %)', p_driver_id;
    END IF;

    -- 3. Log de la transaction
    INSERT INTO public.wallet_transactions (
        driver_id,
        amount,
        type,
        status,
        description,
        created_at
    ) VALUES (
        p_driver_id,
        p_amount,
        'topup',
        'completed',
        'Recharge Admin (RPC)',
        NOW()
    );

    -- 4. Retour succès
    RETURN jsonb_build_object(
        'success', true,
        'new_balance', v_new_balance,
        'message', 'Wallet crédité avec succès'
    );
END;
$$;

-- Permissions : Tout le monde peut appeler (si on a la clé secrète)
GRANT EXECUTE ON FUNCTION public.admin_top_up_wallet TO anon, authenticated, service_role;
