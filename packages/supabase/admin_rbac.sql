-- =============================================
-- TRANSIGO ADMIN - RBAC SCHEMA
-- Exécuter dans Supabase SQL Editor
-- =============================================

-- Table des utilisateurs admin
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'analyst' CHECK (role IN ('super_admin', 'controller_passengers', 'manager_wallets', 'supervisor_drivers', 'support_client', 'analyst')),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

-- Index pour la recherche par email
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);

-- Politique RLS (permettre lecture pour tous les admins authentifiés)
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for admin_users" ON public.admin_users
    FOR ALL USING (true);

-- Super Admin par défaut (password: admin123)
-- Note: En production, utilisez un vrai hash bcrypt
INSERT INTO public.admin_users (email, password_hash, role, first_name, last_name)
VALUES ('admin@transigo.ci', 'admin123', 'super_admin', 'Super', 'Admin')
ON CONFLICT (email) DO NOTHING;

-- Table des logs d'actions admin (optionnel mais recommandé)
CREATE TABLE IF NOT EXISTS public.admin_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES public.admin_users(id),
    action TEXT NOT NULL,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les logs par admin et date
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON public.admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_date ON public.admin_logs(created_at DESC);

-- Politique RLS pour les logs
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for admin_logs" ON public.admin_logs
    FOR ALL USING (true);