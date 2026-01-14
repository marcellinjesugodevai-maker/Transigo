// =============================================
// TRANSIGO DRIVER - SUPPORT SERVICE
// Gestion du chat avec le support Admin
// =============================================

import { supabase } from './supabaseService';

export interface ChatMessage {
    id: string;
    conversation_id: string;
    sender_type: 'admin' | 'driver' | 'user';
    sender_id: string | null;
    message: string;
    created_at: string;
    is_read: boolean;
}

export interface ChatConversation {
    id: string;
    driver_id: string;
    status: 'active' | 'closed';
    last_message_at: string;
}

export const supportService = {
    // 1. Récupérer ou créer une conversation pour le chauffeur
    getOrCreateConversation: async (driverId: string) => {
        // Chercher une conversation active
        const { data: existing } = await supabase
            .from('chat_conversations')
            .select('*')
            .eq('driver_id', driverId)
            .eq('status', 'active')
            .single();

        if (existing) return { conversation: existing, error: null };

        // Sinon créer une nouvelle
        const { data: newConv, error } = await supabase
            .from('chat_conversations')
            .insert({
                driver_id: driverId,
                status: 'active',
                last_message_at: new Date().toISOString(),
            })
            .select()
            .single();

        return { conversation: newConv, error };
    },

    // 2. Récupérer les messages
    getMessages: async (conversationId: string) => {
        const { data, error } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

        return { messages: data as ChatMessage[], error };
    },

    // 3. Envoyer un message
    sendMessage: async (conversationId: string, driverId: string, message: string) => {
        const { error } = await supabase
            .from('chat_messages')
            .insert({
                conversation_id: conversationId,
                sender_type: 'driver',
                sender_id: driverId,
                message: message.trim(),
            });

        if (!error) {
            // Mettre à jour la date de dernier message
            await supabase
                .from('chat_conversations')
                .update({ last_message_at: new Date().toISOString() })
                .eq('id', conversationId);
        }

        return { error };
    },

    // 4. Marquer comme lu
    markAsRead: async (conversationId: string) => {
        await supabase
            .from('chat_messages')
            .update({ is_read: true })
            .eq('conversation_id', conversationId)
            .eq('sender_type', 'admin'); // On marque les messages de l'admin comme lus
    }
};
