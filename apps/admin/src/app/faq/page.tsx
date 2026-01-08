'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface FaqItem {
    id: string;
    category: string;
    question: string;
    answer: string;
    order_index: number;
    is_active: boolean;
}

const categoryOptions = [
    { value: 'general', label: '📋 Général' },
    { value: 'rides', label: '🚗 Courses' },
    { value: 'payments', label: '💳 Paiements' },
    { value: 'drivers', label: '👨‍✈️ Chauffeurs' },
    { value: 'passengers', label: '👥 Passagers' },
];

export default function FaqPage() {
    const [faqs, setFaqs] = useState<FaqItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null);
    const [formData, setFormData] = useState({
        category: 'general',
        question: '',
        answer: '',
        order_index: 0,
    });

    const fetchFaqs = async () => {
        const { data } = await supabase
            .from('faq_items')
            .select('*')
            .order('category')
            .order('order_index');
        setFaqs(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchFaqs();
    }, []);

    const handleSave = async () => {
        if (!formData.question || !formData.answer) {
            alert('Question et réponse requises');
            return;
        }

        if (editingFaq) {
            await supabase.from('faq_items').update(formData).eq('id', editingFaq.id);
        } else {
            await supabase.from('faq_items').insert(formData);
        }

        setShowModal(false);
        setEditingFaq(null);
        setFormData({ category: 'general', question: '', answer: '', order_index: 0 });
        fetchFaqs();
    };

    const handleEdit = (faq: FaqItem) => {
        setEditingFaq(faq);
        setFormData({
            category: faq.category,
            question: faq.question,
            answer: faq.answer,
            order_index: faq.order_index,
        });
        setShowModal(true);
    };

    const handleToggleActive = async (faq: FaqItem) => {
        await supabase.from('faq_items').update({ is_active: !faq.is_active }).eq('id', faq.id);
        fetchFaqs();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Supprimer cette question ?')) return;
        await supabase.from('faq_items').delete().eq('id', id);
        fetchFaqs();
    };

    const cardStyle = {
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(10px)',
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.1)',
        padding: 24,
    };

    const groupedFaqs = faqs.reduce((acc, faq) => {
        if (!acc[faq.category]) acc[faq.category] = [];
        acc[faq.category].push(faq);
        return acc;
    }, {} as Record<string, FaqItem[]>);

    return (
        <div style={{ padding: 32, color: '#fff' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: 28 }}>❓ Gestion FAQ</h1>
                    <p style={{ margin: '8px 0 0', color: '#94a3b8' }}>{faqs.length} questions</p>
                </div>
                <button
                    onClick={() => { setEditingFaq(null); setFormData({ category: 'general', question: '', answer: '', order_index: 0 }); setShowModal(true); }}
                    style={{
                        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                        color: '#fff',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: 10,
                        cursor: 'pointer',
                        fontWeight: 600
                    }}
                >
                    ➕ Nouvelle Question
                </button>
            </div>

            {/* FAQ List by Category */}
            {loading ? (
                <p style={{ color: '#94a3b8' }}>Chargement...</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {categoryOptions.map(({ value, label }) => (
                        groupedFaqs[value] && groupedFaqs[value].length > 0 && (
                            <div key={value} style={cardStyle}>
                                <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>{label}</h3>
                                {groupedFaqs[value].map((faq) => (
                                    <div
                                        key={faq.id}
                                        style={{
                                            padding: 16,
                                            background: 'rgba(255,255,255,0.03)',
                                            borderRadius: 10,
                                            marginBottom: 12,
                                            opacity: faq.is_active ? 1 : 0.5
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                            <div style={{ fontWeight: 600, fontSize: 14 }}>{faq.question}</div>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button
                                                    onClick={() => handleToggleActive(faq)}
                                                    style={{
                                                        background: faq.is_active ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                                                        color: faq.is_active ? '#fca5a5' : '#86efac',
                                                        border: 'none',
                                                        padding: '4px 10px',
                                                        borderRadius: 6,
                                                        cursor: 'pointer',
                                                        fontSize: 11
                                                    }}
                                                >
                                                    {faq.is_active ? 'Désactiver' : 'Activer'}
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(faq)}
                                                    style={{
                                                        background: 'rgba(59, 130, 246, 0.2)',
                                                        color: '#93c5fd',
                                                        border: 'none',
                                                        padding: '4px 10px',
                                                        borderRadius: 6,
                                                        cursor: 'pointer',
                                                        fontSize: 11
                                                    }}
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(faq.id)}
                                                    style={{
                                                        background: 'rgba(239, 68, 68, 0.2)',
                                                        color: '#fca5a5',
                                                        border: 'none',
                                                        padding: '4px 10px',
                                                        borderRadius: 6,
                                                        cursor: 'pointer',
                                                        fontSize: 11
                                                    }}
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                        <div style={{ fontSize: 13, color: '#94a3b8' }}>{faq.answer}</div>
                                    </div>
                                ))}
                            </div>
                        )
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: '#1e293b',
                        padding: 32,
                        borderRadius: 16,
                        width: '100%',
                        maxWidth: 500
                    }}>
                        <h2 style={{ margin: '0 0 24px', fontSize: 20 }}>
                            {editingFaq ? '✏️ Modifier' : '➕ Nouvelle'} Question
                        </h2>

                        <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            style={inputStyle}
                        >
                            {categoryOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>

                        <input
                            type="text"
                            placeholder="Question"
                            value={formData.question}
                            onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                            style={{ ...inputStyle, marginTop: 12 }}
                        />

                        <textarea
                            placeholder="Réponse"
                            value={formData.answer}
                            onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                            style={{ ...inputStyle, marginTop: 12, height: 120, resize: 'none' }}
                        />

                        <input
                            type="number"
                            placeholder="Ordre (0, 1, 2...)"
                            value={formData.order_index}
                            onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                            style={{ ...inputStyle, marginTop: 12 }}
                        />

                        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{
                                    flex: 1,
                                    padding: 14,
                                    borderRadius: 10,
                                    border: 'none',
                                    background: '#475569',
                                    color: '#fff',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleSave}
                                style={{
                                    flex: 1,
                                    padding: 14,
                                    borderRadius: 10,
                                    border: 'none',
                                    background: '#22c55e',
                                    color: '#fff',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                            >
                                {editingFaq ? 'Modifier' : 'Créer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.2)',
    background: 'rgba(255,255,255,0.1)',
    color: '#fff',
    fontSize: 14,
};
