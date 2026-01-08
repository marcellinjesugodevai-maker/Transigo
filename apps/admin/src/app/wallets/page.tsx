'use client';

import { useState, useEffect } from 'react';
import { adminService, supabase } from '../../lib/supabase';

interface Driver {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
    wallet_balance: number;
    is_online: boolean;
    total_rides: number;
}

interface Transaction {
    id: string;
    driver_id: string;
    type: string;
    amount: number;
    description: string;
    created_at: string;
}

export default function WalletsPage() {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
    const [topupAmount, setTopupAmount] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const loadData = async () => {
        setLoading(true);
        const { drivers: driverList } = await adminService.getDrivers();
        setDrivers(driverList);

        const { data: txList } = await supabase
            .from('wallet_transactions')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);
        setTransactions(txList || []);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleTopup = async () => {
        if (!selectedDriver || !topupAmount) return;
        const amount = parseInt(topupAmount);
        if (isNaN(amount) || amount <= 0) {
            alert('Montant invalide');
            return;
        }
        await adminService.topUpDriverWallet(selectedDriver.id, amount);
        setShowModal(false);
        setTopupAmount('');
        setSelectedDriver(null);
        loadData();
    };

    const filteredDrivers = drivers.filter(d =>
        d.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.phone.includes(searchQuery)
    );

    const totalBalance = drivers.reduce((sum, d) => sum + d.wallet_balance, 0);

    const cardStyle = {
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(10px)',
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.1)',
        padding: 24,
    };

    return (
        <div style={{ padding: 32, color: '#fff' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: 28 }}>💳 Gestion des Wallets</h1>
                    <p style={{ margin: '8px 0 0', color: '#94a3b8' }}>
                        {drivers.length} chauffeurs • Total: {new Intl.NumberFormat('fr-FR').format(totalBalance)} F
                    </p>
                </div>
                <button
                    onClick={loadData}
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

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 32 }}>
                <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' }}>
                    <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 8 }}>💰 Total en circulation</div>
                    <div style={{ fontSize: 28, fontWeight: 700 }}>{new Intl.NumberFormat('fr-FR').format(totalBalance)} F</div>
                </div>
                <div style={cardStyle}>
                    <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 8 }}>👥 Chauffeurs avec wallet</div>
                    <div style={{ fontSize: 28, fontWeight: 700 }}>{drivers.length}</div>
                </div>
                <div style={cardStyle}>
                    <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 8 }}>⚠️ Solde insuffisant (&lt;1000F)</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: '#f97316' }}>
                        {drivers.filter(d => d.wallet_balance < 1000).length}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
                {/* Drivers List */}
                <div style={cardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <h3 style={{ margin: 0, fontSize: 18 }}>Chauffeurs</h3>
                        <input
                            type="text"
                            placeholder="🔍 Rechercher..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                background: 'rgba(255,255,255,0.1)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                padding: '8px 16px',
                                borderRadius: 8,
                                color: '#fff',
                                fontSize: 14
                            }}
                        />
                    </div>

                    {loading ? (
                        <p style={{ color: '#94a3b8' }}>Chargement...</p>
                    ) : filteredDrivers.length === 0 ? (
                        <p style={{ color: '#94a3b8' }}>Aucun chauffeur trouvé</p>
                    ) : (
                        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                            {filteredDrivers.map((driver) => (
                                <div
                                    key={driver.id}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '12px 16px',
                                        background: 'rgba(255,255,255,0.05)',
                                        borderRadius: 10,
                                        marginBottom: 8
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: '50%',
                                            background: driver.is_online ? '#22c55e' : '#64748b',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 700
                                        }}>
                                            {driver.first_name[0]}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{driver.first_name} {driver.last_name}</div>
                                            <div style={{ fontSize: 12, color: '#94a3b8' }}>{driver.phone}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{
                                                fontWeight: 700,
                                                color: driver.wallet_balance < 1000 ? '#f97316' : '#22c55e'
                                            }}>
                                                {new Intl.NumberFormat('fr-FR').format(driver.wallet_balance)} F
                                            </div>
                                            <div style={{ fontSize: 11, color: '#64748b' }}>{driver.total_rides} courses</div>
                                        </div>
                                        <button
                                            onClick={() => { setSelectedDriver(driver); setShowModal(true); }}
                                            style={{
                                                background: '#22c55e',
                                                color: '#fff',
                                                border: 'none',
                                                width: 32,
                                                height: 32,
                                                borderRadius: 8,
                                                cursor: 'pointer',
                                                fontSize: 18
                                            }}
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Transactions */}
                <div style={cardStyle}>
                    <h3 style={{ margin: '0 0 20px', fontSize: 18 }}>Transactions récentes</h3>
                    {transactions.length === 0 ? (
                        <p style={{ color: '#94a3b8' }}>Aucune transaction</p>
                    ) : (
                        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                            {transactions.map((tx) => (
                                <div
                                    key={tx.id}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '10px 12px',
                                        background: 'rgba(255,255,255,0.05)',
                                        borderRadius: 8,
                                        marginBottom: 8
                                    }}
                                >
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 500 }}>{tx.description || tx.type}</div>
                                        <div style={{ fontSize: 11, color: '#64748b' }}>
                                            {new Date(tx.created_at).toLocaleDateString('fr-FR')}
                                        </div>
                                    </div>
                                    <div style={{
                                        fontWeight: 600,
                                        color: tx.type === 'topup' ? '#22c55e' : '#f97316'
                                    }}>
                                        {tx.type === 'topup' ? '+' : '-'}{new Intl.NumberFormat('fr-FR').format(tx.amount)} F
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {showModal && selectedDriver && (
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
                        maxWidth: 400
                    }}>
                        <h2 style={{ margin: '0 0 16px', fontSize: 20 }}>💳 Recharger le wallet</h2>
                        <p style={{ color: '#94a3b8', marginBottom: 24 }}>
                            <strong>{selectedDriver.first_name} {selectedDriver.last_name}</strong><br />
                            Solde actuel: {new Intl.NumberFormat('fr-FR').format(selectedDriver.wallet_balance)} F
                        </p>
                        <input
                            type="number"
                            placeholder="Montant (FCFA)"
                            value={topupAmount}
                            onChange={(e) => setTopupAmount(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '14px 16px',
                                borderRadius: 10,
                                border: '1px solid rgba(255,255,255,0.2)',
                                background: 'rgba(255,255,255,0.1)',
                                color: '#fff',
                                fontSize: 18,
                                marginBottom: 20
                            }}
                        />
                        <div style={{ display: 'flex', gap: 12 }}>
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
                                onClick={handleTopup}
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
                                Recharger
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
