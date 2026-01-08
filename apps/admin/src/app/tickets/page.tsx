'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface Ticket {
    id: string;
    category: string;
    subject: string;
    status: string;
    priority: string;
    created_at: string;
    user_id: string | null;
    driver_id: string | null;
    users?: { first_name: string; last_name: string; phone: string };
    drivers?: { first_name: string; last_name: string; phone: string };
}

interface Message {
    id: string;
    sender_type: string;
    message: string;
    created_at: string;
}

const statusColors: Record<string, string> = {
    open: '#fbbf24',
    in_progress: '#3b82f6',
    resolved: '#22c55e',
    closed: '#64748b',
};

const statusLabels: Record<string, string> = {
    open: '🆕 Ouvert',
    in_progress: '⏳ En cours',
    resolved: '✅ Résolu',
    closed: '📁 Fermé',
};

const categoryLabels: Record<string, string> = {
    ride: '🚗 Course',
    payment: '💳 Paiement',
    driver: '👨‍✈️ Chauffeur',
    passenger: '👥 Passager',
    app: '📱 Application',
    other: '❓ Autre',
};

export default function TicketsPage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [replyText, setReplyText] = useState('');

    const fetchTickets = async () => {
        let query = supabase
            .from('support_tickets')
            .select('*, users(first_name, last_name, phone), drivers(first_name, last_name, phone)')
            .order('created_at', { ascending: false });

        if (filter !== 'all') {
            query = query.eq('status', filter);
        }

        const { data } = await query;
        setTickets(data || []);
        setLoading(false);
    };

    const fetchMessages = async (ticketId: string) => {
        const { data } = await supabase
            .from('ticket_messages')
            .select('*')
            .eq('ticket_id', ticketId)
            .order('created_at', { ascending: true });
        setMessages(data || []);
    };

    useEffect(() => {
        fetchTickets();
    }, [filter]);

    const handleSelectTicket = (ticket: Ticket) => {
        setSelectedTicket(ticket);
        fetchMessages(ticket.id);
    };

    const handleReply = async () => {
        if (!selectedTicket || !replyText.trim()) return;

        await supabase.from('ticket_messages').insert({
            ticket_id: selectedTicket.id,
            sender_type: 'admin',
            sender_id: null,
            message: replyText,
        });

        // Update status to in_progress if was open
        if (selectedTicket.status === 'open') {
            await supabase.from('support_tickets').update({ status: 'in_progress' }).eq('id', selectedTicket.id);
        }

        setReplyText('');
        fetchMessages(selectedTicket.id);
        fetchTickets();
    };

    const handleChangeStatus = async (status: string) => {
        if (!selectedTicket) return;
        await supabase.from('support_tickets').update({ status }).eq('id', selectedTicket.id);
        setSelectedTicket({ ...selectedTicket, status });
        fetchTickets();
    };

    const cardStyle = {
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(10px)',
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.1)',
        padding: 20,
    };

    return (
        <div style={{ padding: 32, color: '#fff', display: 'flex', gap: 24 }}>
            {/* List */}
            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h1 style={{ margin: 0, fontSize: 28 }}>📩 Tickets Support</h1>
                    <span style={{ color: '#94a3b8' }}>{tickets.length} tickets</span>
                </div>

                {/* Filters */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                    {['all', 'open', 'in_progress', 'resolved', 'closed'].map((s) => (
                        <button
                            key={s}
                            onClick={() => setFilter(s)}
                            style={{
                                background: filter === s ? '#f97316' : 'rgba(255,255,255,0.1)',
                                color: '#fff',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: 20,
                                cursor: 'pointer',
                                fontSize: 13
                            }}
                        >
                            {s === 'all' ? 'Tous' : statusLabels[s]}
                        </button>
                    ))}
                </div>

                {/* Tickets List */}
                <div style={{ ...cardStyle, maxHeight: 600, overflowY: 'auto' }}>
                    {loading ? (
                        <p style={{ color: '#94a3b8' }}>Chargement...</p>
                    ) : tickets.length === 0 ? (
                        <p style={{ color: '#94a3b8' }}>Aucun ticket</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {tickets.map((ticket) => (
                                <div
                                    key={ticket.id}
                                    onClick={() => handleSelectTicket(ticket)}
                                    style={{
                                        padding: '14px 16px',
                                        background: selectedTicket?.id === ticket.id ? 'rgba(249, 115, 22, 0.2)' : 'rgba(255,255,255,0.03)',
                                        borderRadius: 10,
                                        cursor: 'pointer',
                                        borderLeft: `3px solid ${statusColors[ticket.status]}`
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                        <span style={{ fontWeight: 600, fontSize: 14 }}>{ticket.subject}</span>
                                        <span style={{ fontSize: 11, color: '#64748b' }}>
                                            {new Date(ticket.created_at).toLocaleDateString('fr-FR')}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, fontSize: 12 }}>
                                        <span style={{ color: statusColors[ticket.status] }}>{statusLabels[ticket.status]}</span>
                                        <span style={{ color: '#64748b' }}>•</span>
                                        <span style={{ color: '#94a3b8' }}>{categoryLabels[ticket.category]}</span>
                                    </div>
                                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                                        {ticket.users ? `${ticket.users.first_name} ${ticket.users.last_name}` :
                                            ticket.drivers ? `Chauffeur: ${ticket.drivers.first_name}` : 'Anonyme'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Detail Panel */}
            <div style={{ width: 400 }}>
                {selectedTicket ? (
                    <div style={cardStyle}>
                        <div style={{ marginBottom: 20 }}>
                            <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>{selectedTicket.subject}</h2>
                            <div style={{ display: 'flex', gap: 8, fontSize: 12, color: '#94a3b8' }}>
                                <span>{categoryLabels[selectedTicket.category]}</span>
                                <span>•</span>
                                <span style={{ color: statusColors[selectedTicket.status] }}>{statusLabels[selectedTicket.status]}</span>
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
                            {selectedTicket.users && (
                                <>
                                    <div>👤 {selectedTicket.users.first_name} {selectedTicket.users.last_name}</div>
                                    <div style={{ color: '#94a3b8' }}>📞 {selectedTicket.users.phone}</div>
                                </>
                            )}
                            {selectedTicket.drivers && (
                                <>
                                    <div>🚗 {selectedTicket.drivers.first_name} {selectedTicket.drivers.last_name}</div>
                                    <div style={{ color: '#94a3b8' }}>📞 {selectedTicket.drivers.phone}</div>
                                </>
                            )}
                        </div>

                        {/* Status Buttons */}
                        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                            {['in_progress', 'resolved', 'closed'].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => handleChangeStatus(s)}
                                    disabled={selectedTicket.status === s}
                                    style={{
                                        flex: 1,
                                        padding: '8px',
                                        borderRadius: 8,
                                        border: 'none',
                                        background: selectedTicket.status === s ? statusColors[s] : 'rgba(255,255,255,0.1)',
                                        color: '#fff',
                                        fontSize: 11,
                                        cursor: 'pointer'
                                    }}
                                >
                                    {statusLabels[s]}
                                </button>
                            ))}
                        </div>

                        {/* Messages */}
                        <div style={{ maxHeight: 250, overflowY: 'auto', marginBottom: 16 }}>
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    style={{
                                        padding: 10,
                                        marginBottom: 8,
                                        borderRadius: 8,
                                        background: msg.sender_type === 'admin' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.05)',
                                        borderLeft: msg.sender_type === 'admin' ? '3px solid #22c55e' : '3px solid #64748b'
                                    }}
                                >
                                    <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>
                                        {msg.sender_type === 'admin' ? '👨‍💼 Support' : '👤 Utilisateur'} • {new Date(msg.created_at).toLocaleString('fr-FR')}
                                    </div>
                                    <div style={{ fontSize: 13 }}>{msg.message}</div>
                                </div>
                            ))}
                        </div>

                        {/* Reply */}
                        <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Votre réponse..."
                            style={{
                                width: '100%',
                                padding: 12,
                                borderRadius: 8,
                                border: '1px solid rgba(255,255,255,0.2)',
                                background: 'rgba(255,255,255,0.1)',
                                color: '#fff',
                                fontSize: 13,
                                resize: 'none',
                                height: 80,
                                marginBottom: 12
                            }}
                        />
                        <button
                            onClick={handleReply}
                            style={{
                                width: '100%',
                                padding: 12,
                                borderRadius: 8,
                                border: 'none',
                                background: '#22c55e',
                                color: '#fff',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            ✉️ Envoyer la réponse
                        </button>
                    </div>
                ) : (
                    <div style={{ ...cardStyle, textAlign: 'center', color: '#64748b' }}>
                        <p>👈 Sélectionnez un ticket</p>
                    </div>
                )}
            </div>
        </div>
    );
}
