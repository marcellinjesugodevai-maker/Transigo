-- =============================================
-- TRANSIGO - SUPPORT CLIENT SCHEMA
-- Exécuter dans Supabase SQL Editor
-- =============================================

-- Tickets de support
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id),
    driver_id UUID REFERENCES public.drivers(id),
    ride_id UUID REFERENCES public.rides(id),
    category TEXT NOT NULL CHECK (category IN ('ride', 'payment', 'driver', 'passenger', 'app', 'other')),
    subject TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    assigned_admin_id UUID REFERENCES public.admin_users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les tickets
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_user ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_driver ON public.support_tickets(driver_id);

-- Messages dans un ticket
CREATE TABLE IF NOT EXISTS public.ticket_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'driver', 'admin')),
    sender_id UUID,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les messages
CREATE INDEX IF NOT EXISTS idx_messages_ticket ON public.ticket_messages(ticket_id);

-- FAQ
CREATE TABLE IF NOT EXISTS public.faq_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL CHECK (category IN ('general', 'rides', 'payments', 'drivers', 'passengers')),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    order_index INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour FAQ
CREATE INDEX IF NOT EXISTS idx_faq_category ON public.faq_items(category);

-- Politique RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for support_tickets" ON public.support_tickets FOR ALL USING (true);
CREATE POLICY "Allow all for ticket_messages" ON public.ticket_messages FOR ALL USING (true);
CREATE POLICY "Allow all for faq_items" ON public.faq_items FOR ALL USING (true);

-- FAQ par défaut
INSERT INTO public.faq_items (category, question, answer, order_index) VALUES
('general', 'Comment fonctionne TransiGo ?', 'TransiGo est une application de VTC qui vous permet de commander une course en quelques clics. Entrez votre destination, choisissez le type de véhicule, et un chauffeur viendra vous chercher.', 1),
('general', 'Comment créer un compte ?', 'Téléchargez l''app, entrez votre numéro de téléphone, et validez avec le code reçu par SMS.', 2),
('rides', 'Comment annuler une course ?', 'Avant l''arrivée du chauffeur, appuyez sur le bouton "Annuler" dans l''écran de suivi.', 1),
('rides', 'Comment modifier ma destination ?', 'Pendant la course, informez simplement votre chauffeur du changement.', 2),
('payments', 'Quels moyens de paiement sont acceptés ?', 'Nous acceptons les paiements en espèces, Mobile Money (Orange/MTN/Moov/Wave).', 1),
('payments', 'Comment obtenir une facture ?', 'Un reçu est envoyé automatiquement par email après chaque course.', 2),
('drivers', 'Comment devenir chauffeur TransiGo ?', 'Téléchargez l''app chauffeur, remplissez le formulaire avec vos documents, et attendez la validation.', 1)
ON CONFLICT DO NOTHING;
