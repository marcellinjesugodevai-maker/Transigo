-- =============================================
-- TABLE: reviews (Avis utilisateurs landing page)
-- =============================================

CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour tri par date
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);

-- Index pour filtrer par statut d'approbation
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON public.reviews(is_approved);

-- Activer RLS (Row Level Security)
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Politique: Lecture publique uniquement pour les avis approuvés
CREATE POLICY "Avis approuvés visibles publiquement" ON public.reviews
    FOR SELECT
    USING (is_approved = true);

-- Politique: Insertion publique (tout le monde peut laisser un avis)
CREATE POLICY "Tout le monde peut laisser un avis" ON public.reviews
    FOR INSERT
    WITH CHECK (true);

-- Politique: Admin peut tout faire (via anon key avec bypass)
CREATE POLICY "Admin full access" ON public.reviews
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_reviews_updated_at
    BEFORE UPDATE ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_reviews_updated_at();

-- Commentaires
COMMENT ON TABLE public.reviews IS 'Avis utilisateurs collectés depuis la landing page';
COMMENT ON COLUMN public.reviews.is_approved IS 'Avis doit être approuvé par admin avant affichage';
