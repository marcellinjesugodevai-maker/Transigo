-- =============================================
-- TRANSIGO - CHAT SUPPORT SCHEMA
-- Exécuter dans Supabase SQL Editor
-- =============================================

-- Conversations de chat support
CREATE TABLE IF NOT EXISTS public.chat_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id),
    driver_id UUID REFERENCES public.drivers(id),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages de chat
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'driver', 'admin')),
    sender_id UUID,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_conversations_user ON public.chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_driver ON public.chat_conversations(driver_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON public.chat_conversations(status);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.chat_messages(conversation_id);

-- RLS
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for chat_conversations" ON public.chat_conversations FOR ALL USING (true);
CREATE POLICY "Allow all for chat_messages" ON public.chat_messages FOR ALL USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
