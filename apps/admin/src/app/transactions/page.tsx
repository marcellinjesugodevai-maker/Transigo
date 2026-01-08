'use client';

import { useEffect, useState } from 'react';
import { adminService } from '../../lib/supabase';
import { Trash2, CheckCircle, XCircle, Clock } from 'lucide-react';

interface Transaction {
    id: string;
    driver_id: string;
    type: string;
    amount: number;
    status: string;
    reference_id?: string;
    description: string;
    created_at: string;
    drivers?: { first_name: string; last_name: string; phone: string };
}

const statusLabels: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    pending: { label: 'En attente', color: '#b45309', bg: '#fff7ed', icon: Clock },
    completed: { label: 'Validé', color: '#15803d', bg: '#f0fdf4', icon: CheckCircle },
    rejected: { label: 'Rejeté', color: '#b91c1c', bg: '#fef2f2', icon: XCircle },
};

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');
    const [processing, setProcessing] = useState<string | null>(null);

    const fetchTransactions = async () => {
        setLoading(true);
        // On récupère tout et on filtre localement ou via API si besoin
        // Pour l'admin, on veut voir surtout les pending
        const { transactions: data } = await adminService.getTransactions();
        setTransactions(data as any[]);
        setLoading(false);
    };

    useEffect(() => {
        fetchTransactions();

        // Auto refresh for new requests
        const interval = setInterval(fetchTransactions, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleApprove = async (tx: Transaction) => {
        if (!confirm(`Valider le dépôt de ${tx.amount} F pour ${tx.drivers?.first_name} ?`)) return;

        setProcessing(tx.id);
        const { error } = await adminService.approveTransaction(tx.id);
        if (error) {
            alert('Erreur: ' + error);
        } else {
            await fetchTransactions(); // Refresh list/balance
        }
        setProcessing(null);
    };

    const handleReject = async (tx: Transaction) => {
        if (!confirm('Rejeter cette transaction ?')) return;

        setProcessing(tx.id);
        const { error } = await adminService.rejectTransaction(tx.id);
        if (error) {
            alert('Erreur: ' + error);
        } else {
            await fetchTransactions();
        }
        setProcessing(null);
    };

    const filteredTransactions = transactions.filter(t => {
        if (filter === 'all') return true;

        // Si filtre est 'pending', on veut voir les pending
        // Si 'completed', on veut voir completed ET rejected (historique traité)
        if (filter === 'completed') return ['completed', 'rejected'].includes(t.status || 'completed');

        return (t.status || 'completed') === filter;
    });

    return (
        <div style={{ padding: 32, color: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: 28 }}>📜 Gestion des Transactions</h1>
                    <p style={{ margin: '8px 0 0', color: '#94a3b8' }}>
                        Validez les dépôts des chauffeurs
                    </p>
                </div>
                <button
                    onClick={fetchTransactions}
                    style={{
                        background: '#3b82f6',
                        color: '#fff',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontWeight: 500
                    }}
                >
                    🔄 Rafraîchir
                </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                <button
                    onClick={() => setFilter('pending')}
                    style={{
                        padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
                        background: filter === 'pending' ? '#f59e0b' : 'rgba(255,255,255,0.1)',
                        color: filter === 'pending' ? '#000' : '#fff', fontWeight: 600
                    }}
                >
                    ⏳ En attente ({transactions.filter(t => (t.status === 'pending')).length})
                </button>
                <button
                    onClick={() => setFilter('completed')}
                    style={{
                        padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
                        background: filter === 'completed' ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                        color: filter === 'completed' ? '#fff' : '#fff', fontWeight: 600
                    }}
                >
                    ✅ Traitées
                </button>
                <button
                    onClick={() => setFilter('all')}
                    style={{
                        padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
                        background: filter === 'all' ? '#64748b' : 'rgba(255,255,255,0.1)',
                        color: filter === 'all' ? '#fff' : '#fff', fontWeight: 600
                    }}
                >
                    Tout voir
                </button>
            </div>

            {/* Table */}
            <div style={{
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(10px)',
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.1)',
                padding: 24,
            }}>
                {loading ? (
                    <p style={{ color: '#94a3b8', textAlign: 'center', padding: 20 }}>Chargement...</p>
                ) : filteredTransactions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40 }}>
                        <Clock size={48} color="#94a3b8" />
                        <p style={{ color: '#94a3b8', marginTop: 16 }}>Aucune transaction trouvée</p>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                <th style={{ textAlign: 'left', padding: '12px 8px', color: '#94a3b8' }}>Status</th>
                                <th style={{ textAlign: 'left', padding: '12px 8px', color: '#94a3b8' }}>Chauffeur</th>
                                <th style={{ textAlign: 'left', padding: '12px 8px', color: '#94a3b8' }}>Type / Réf</th>
                                <th style={{ textAlign: 'right', padding: '12px 8px', color: '#94a3b8' }}>Montant</th>
                                <th style={{ textAlign: 'right', padding: '12px 8px', color: '#94a3b8' }}>Date</th>
                                <th style={{ textAlign: 'right', padding: '12px 8px', color: '#94a3b8' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTransactions.map((tx) => {
                                const status = tx.status || 'completed';
                                const statusConfig = statusLabels[status] || statusLabels.completed;
                                const Icon = statusConfig.icon;

                                return (
                                    <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '16px 8px' }}>
                                            <div style={{
                                                display: 'flex', alignItems: 'center', gap: 6,
                                                background: statusConfig.bg, color: statusConfig.color,
                                                padding: '4px 12px', borderRadius: 20, width: 'fit-content',
                                                fontSize: 12, fontWeight: 600
                                            }}>
                                                <Icon size={14} />
                                                {statusConfig.label}
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 8px' }}>
                                            <div style={{ fontWeight: 600 }}>
                                                {tx.drivers ? `${tx.drivers.first_name} ${tx.drivers.last_name}` : 'Inconnu'}
                                            </div>
                                            <div style={{ fontSize: 12, color: '#94a3b8' }}>
                                                {tx.drivers?.phone}
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 8px' }}>
                                            <div>{tx.type === 'topup' ? '💳 Dépôt' : tx.type}</div>
                                            <div style={{ fontSize: 12, color: '#94a3b8' }}>
                                                {tx.reference_id ? `Réf: ${tx.reference_id}` : tx.description}
                                            </div>
                                        </td>
                                        <td style={{
                                            padding: '16px 8px', textAlign: 'right',
                                            fontWeight: 600, fontSize: 16,
                                            color: tx.amount >= 0 ? '#22c55e' : '#dc2626'
                                        }}>
                                            {tx.amount >= 0 ? '+' : ''}{new Intl.NumberFormat('fr-FR').format(tx.amount)} F
                                        </td>
                                        <td style={{ padding: '16px 8px', textAlign: 'right', fontSize: 12, color: '#94a3b8' }}>
                                            {new Date(tx.created_at).toLocaleDateString('fr-FR', {
                                                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </td>
                                        <td style={{ padding: '16px 8px', textAlign: 'right' }}>
                                            {status === 'pending' && (
                                                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                                    <button
                                                        onClick={() => handleApprove(tx)}
                                                        disabled={processing === tx.id}
                                                        style={{
                                                            background: '#22c55e', color: 'white', border: 'none',
                                                            padding: '6px 12px', borderRadius: 6, cursor: 'pointer',
                                                            display: 'flex', alignItems: 'center', gap: 4
                                                        }}
                                                    >
                                                        <CheckCircle size={14} /> Valider
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(tx)}
                                                        disabled={processing === tx.id}
                                                        style={{
                                                            background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: 'none',
                                                            padding: '6px 12px', borderRadius: 6, cursor: 'pointer',
                                                            display: 'flex', alignItems: 'center', gap: 4
                                                        }}
                                                    >
                                                        <XCircle size={14} /> Rejeter
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
