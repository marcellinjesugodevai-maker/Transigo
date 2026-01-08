-- Ajout de status et reference_id pour la gestion manuelle des dépôts
ALTER TABLE public.wallet_transactions 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed',
ADD COLUMN IF NOT EXISTS reference_id TEXT,
ADD COLUMN IF NOT EXISTS receipt_image_url TEXT;

-- Ajouter une contrainte pour le status
-- On utilise DROP CONSTRAINT IF EXISTS pour éviter les erreurs si on relance le script
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_transaction_status') THEN
        ALTER TABLE public.wallet_transactions DROP CONSTRAINT check_transaction_status;
    END IF;
END $$;

ALTER TABLE public.wallet_transactions 
ADD CONSTRAINT check_transaction_status CHECK (status IN ('pending', 'completed', 'rejected'));

-- Mettre à jour les anciennes transactions pour qu'elles soient 'completed'
UPDATE public.wallet_transactions SET status = 'completed' WHERE status IS NULL;
