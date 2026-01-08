'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';

interface Conversation {
    id: string;
    user_id: string | null;
    driver_id: string | null;
    status: string;
    last_message_at: string;
    users?: { first_name: string; last_name: string; phone: string };
    drivers?: { first_name: string; last_name: string; phone: string };
    unread_count?: number;
}

interface Message {
    id: string;
    sender_type: string;
    message: string;
    created_at: string;
    is_read: boolean;
}

export default function ChatPage() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const fetchConversations = async () => {
        const { data } = await supabase
            .from('chat_conversations')
            .select('*, users(first_name, last_name, phone), drivers(first_name, last_name, phone)')
            .order('last_message_at', { ascending: false });
        setConversations(data || []);
        setLoading(false);
    };

    const fetchMessages = async (conversationId: string) => {
        const { data } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });
        setMessages(data || []);

        // Mark as read
        await supabase
            .from('chat_messages')
            .update({ is_read: true })
            .eq('conversation_id', conversationId)
            .eq('is_read', false);
    };

    useEffect(() => {
        fetchConversations();

        // Real-time subscription
        const channel = supabase
            .channel('chat-updates')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
                const newMsg = payload.new as Message;
                if (selectedConversation && newMsg) {
                    setMessages(prev => [...prev, newMsg]);
                }
                fetchConversations();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [selectedConversation]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSelectConversation = (conv: Conversation) => {
        setSelectedConversation(conv);
        fetchMessages(conv.id);
    };

    const handleSend = async () => {
        if (!selectedConversation || !newMessage.trim()) return;

        await supabase.from('chat_messages').insert({
            conversation_id: selectedConversation.id,
            sender_type: 'admin',
            sender_id: null,
            message: newMessage.trim(),
        });

        await supabase.from('chat_conversations')
            .update({ last_message_at: new Date().toISOString() })
            .eq('id', selectedConversation.id);

        setNewMessage('');
        fetchMessages(selectedConversation.id);
    };

    const handleCloseConversation = async () => {
        if (!selectedConversation) return;
        await supabase.from('chat_conversations')
            .update({ status: 'closed' })
            .eq('id', selectedConversation.id);
        setSelectedConversation(null);
        fetchConversations();
    };

    const cardStyle = {
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(10px)',
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.1)',
    };

    const getContactName = (conv: Conversation) => {
        if (conv.users) return `${conv.users.first_name} ${conv.users.last_name}`;
        if (conv.drivers) return `🚗 ${conv.drivers.first_name} ${conv.drivers.last_name}`;
        return 'Anonyme';
    };

    return (
        <div style={{ padding: 32, color: '#fff', height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
            <h1 style={{ margin: '0 0 24px', fontSize: 28 }}>💬 Chat Support</h1>

            <div style={{ flex: 1, display: 'flex', gap: 24, overflow: 'hidden' }}>
                {/* Conversations List */}
                <div style={{ ...cardStyle, width: 320, padding: 16, overflowY: 'auto' }}>
                    <div style={{ marginBottom: 16, fontSize: 14, color: '#94a3b8' }}>
                        {conversations.filter(c => c.status === 'active').length} conversations actives
                    </div>

                    {loading ? (
                        <p style={{ color: '#64748b' }}>Chargement...</p>
                    ) : conversations.length === 0 ? (
                        <p style={{ color: '#64748b', textAlign: 'center', padding: 40 }}>
                            Aucune conversation<br /><br />
                            Les utilisateurs pourront vous contacter via l'app
                        </p>
                    ) : (
                        conversations.map((conv) => (
                            <div
                                key={conv.id}
                                onClick={() => handleSelectConversation(conv)}
                                style={{
                                    padding: '12px 16px',
                                    background: selectedConversation?.id === conv.id ? 'rgba(249, 115, 22, 0.2)' : 'rgba(255,255,255,0.03)',
                                    borderRadius: 10,
                                    marginBottom: 8,
                                    cursor: 'pointer',
                                    borderLeft: conv.status === 'active' ? '3px solid #22c55e' : '3px solid #64748b'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 600, fontSize: 14 }}>{getContactName(conv)}</span>
                                    {conv.status === 'closed' && (
                                        <span style={{ fontSize: 10, color: '#64748b', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: 10 }}>
                                            Fermé
                                        </span>
                                    )}
                                </div>
                                <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                                    {new Date(conv.last_message_at).toLocaleString('fr-FR')}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Chat Area */}
                <div style={{ ...cardStyle, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {selectedConversation ? (
                        <>
                            {/* Header */}
                            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontWeight: 600 }}>{getContactName(selectedConversation)}</div>
                                    <div style={{ fontSize: 12, color: '#94a3b8' }}>
                                        {selectedConversation.users?.phone || selectedConversation.drivers?.phone}
                                    </div>
                                </div>
                                {selectedConversation.status === 'active' && (
                                    <button
                                        onClick={handleCloseConversation}
                                        style={{
                                            background: 'rgba(239, 68, 68, 0.2)',
                                            color: '#fca5a5',
                                            border: 'none',
                                            padding: '8px 16px',
                                            borderRadius: 8,
                                            cursor: 'pointer',
                                            fontSize: 13
                                        }}
                                    >
                                        Fermer la conversation
                                    </button>
                                )}
                            </div>

                            {/* Messages */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        style={{
                                            display: 'flex',
                                            justifyContent: msg.sender_type === 'admin' ? 'flex-end' : 'flex-start',
                                            marginBottom: 12
                                        }}
                                    >
                                        <div style={{
                                            maxWidth: '70%',
                                            padding: '10px 14px',
                                            borderRadius: 12,
                                            background: msg.sender_type === 'admin' ? '#22c55e' : 'rgba(255,255,255,0.1)',
                                            color: msg.sender_type === 'admin' ? '#fff' : '#fff'
                                        }}>
                                            <div style={{ fontSize: 14 }}>{msg.message}</div>
                                            <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4, textAlign: 'right' }}>
                                                {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            {selectedConversation.status === 'active' && (
                                <div style={{ padding: 16, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: 12 }}>
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                        placeholder="Tapez votre message..."
                                        style={{
                                            flex: 1,
                                            padding: '12px 16px',
                                            borderRadius: 10,
                                            border: '1px solid rgba(255,255,255,0.2)',
                                            background: 'rgba(255,255,255,0.1)',
                                            color: '#fff',
                                            fontSize: 14
                                        }}
                                    />
                                    <button
                                        onClick={handleSend}
                                        style={{
                                            padding: '12px 24px',
                                            borderRadius: 10,
                                            border: 'none',
                                            background: '#22c55e',
                                            color: '#fff',
                                            fontWeight: 600,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Envoyer
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
                                <p>Sélectionnez une conversation</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
