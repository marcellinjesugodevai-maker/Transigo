'use client';

import { useState, useEffect } from 'react';
import { adminService, supabase } from '../../lib/supabase';
import Link from 'next/link';

interface Driver {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
    is_online: boolean;
    is_blocked: boolean;
    is_verified: boolean;
    wallet_balance: number;
    rating: number;
    total_rides: number;
    created_at: string;
    gender?: string;
    vehicle_plate?: string;
    profile_type?: 'driver' | 'delivery' | 'seller';
}

export default function DriversPage() {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, online, blocked
    const [search, setSearch] = useState('');
    const [showTopUpModal, setShowTopUpModal] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
    const [topUpAmount, setTopUpAmount] = useState('');

    const fetchDrivers = async () => {
        setLoading(true);
        const { drivers: data, error } = await adminService.getDrivers();
        if (data) setDrivers(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchDrivers();
    }, []);

    const handleBlockToggle = async (driver: Driver) => {
        if (!confirm(`Voulez-vous vraiment ${driver.is_blocked ? 'débloquer' : 'bloquer'} ce chauffeur ?`)) return;

        await adminService.toggleDriverBlock(driver.id, !driver.is_blocked);
        fetchDrivers();
    };

    const handleTopUp = async () => {
        if (!selectedDriver || !topUpAmount) return;
        const amount = parseInt(topUpAmount);
        if (isNaN(amount) || amount <= 0) return alert('Montant invalide');

        try {
            await adminService.topUpDriverWallet(selectedDriver.id, amount);
            alert(`Wallet crédité de ${amount} F pour ${selectedDriver.first_name}`);
            setShowTopUpModal(false);
            setTopUpAmount('');
            fetchDrivers();
        } catch (e: any) {
            console.error(e);
            alert('Erreur: ' + (e.message || 'Impossible de créditer le wallet. Vérifiez les permissions.'));
        }
    };

    const openTopUp = (driver: Driver) => {
        setSelectedDriver(driver);
        setShowTopUpModal(true);
    };

    const filteredDrivers = drivers.filter(d => {
        const matchesFilter =
            filter === 'all' ? true :
                filter === 'online' ? d.is_online :
                    filter === 'blocked' ? d.is_blocked :
                        filter === 'pending' ? !d.is_verified :
                            filter === 'driver' ? d.profile_type === 'driver' :
                                filter === 'delivery' ? d.profile_type === 'delivery' :
                                    filter === 'seller' ? d.profile_type === 'seller' : true;

        const searchLower = search.toLowerCase();
        const matchesSearch =
            d.first_name?.toLowerCase().includes(searchLower) ||
            d.last_name?.toLowerCase().includes(searchLower) ||
            d.phone?.includes(searchLower) ||
            d.email?.toLowerCase().includes(searchLower);

        return matchesFilter && matchesSearch;
    });

    const cardStyle = {
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(10px)',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.1)',
        padding: 20,
        marginBottom: 16,
    };

    const buttonStyle = {
        padding: '8px 16px',
        borderRadius: 8,
        border: 'none',
        cursor: 'pointer',
        fontWeight: 500,
        fontSize: 14,
    };

    return (
        <div style={{ padding: 32, color: '#fff' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Link href="/" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 24 }}>←</Link>
                        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 700 }}>👨‍✈️ Gestion Chauffeurs</h1>
                    </div>
                    <p style={{ margin: '8px 0 0 40px', color: '#94a3b8' }}>
                        {drivers.length} chauffeurs inscrits
                    </p>
                </div>
                <button
                    onClick={fetchDrivers}
                    style={{ ...buttonStyle, background: '#3b82f6', color: '#fff' }}
                >
                    🔄 Actualiser
                </button>
            </div>

            {/* Filters */}
            <div style={{ marginBottom: 24, display: 'flex', gap: 16 }}>
                <input
                    type="text"
                    placeholder="Rechercher (Nom, Tel...)"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{
                        padding: '10px 16px',
                        borderRadius: 8,
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(255,255,255,0.05)',
                        color: '#fff',
                        width: 300
                    }}
                />
                <select
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    style={{
                        padding: '10px 16px',
                        borderRadius: 8,
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(255,255,255,0.05)',
                        color: '#fff',
                    }}
                >
                    <option value="all">Tous les statuts</option>
                    <option value="pending">🟡 En attente de validation</option>
                    <option value="driver">🚗 Chauffeurs VTC</option>
                    <option value="delivery">📦 Livreurs</option>
                    <option value="seller">🏪 Vendeurs</option>
                    <option value="online">En Ligne 🟢</option>
                    <option value="blocked">Bloqués 🔴</option>
                </select>
            </div>

            {/* List */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Chargement...</div>
            ) : filteredDrivers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Aucun chauffeur trouvé</div>
            ) : (
                <div style={{ display: 'grid', gap: 16 }}>
                    {filteredDrivers.map(driver => (
                        <div key={driver.id} style={{ ...cardStyle, cursor: 'pointer' }} onClick={() => window.location.href = `/drivers/${driver.id}`}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                {/* Info */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                    <div style={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: '50%',
                                        background: driver.is_online ? '#22c55e' : '#475569',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 700,
                                        fontSize: 20
                                    }}>
                                        {driver.first_name[0]}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                            {driver.first_name} {driver.last_name}
                                            {driver.gender === 'female' && <span title="Femme">👩</span>}
                                            {driver.is_verified ? (
                                                <span style={{ fontSize: 11, background: '#22c55e', padding: '2px 6px', borderRadius: 4 }}>✅ Vérifié</span>
                                            ) : (
                                                <span style={{ fontSize: 11, background: '#f59e0b', padding: '2px 6px', borderRadius: 4 }}>⏳ En attente</span>
                                            )}
                                            {driver.is_blocked && <span style={{ fontSize: 12, background: '#ef4444', padding: '2px 6px', borderRadius: 4 }}>BLOQUÉ</span>}
                                        </div>
                                        <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>
                                            {driver.profile_type === 'driver' ? '🚗' : driver.profile_type === 'delivery' ? '📦' : driver.profile_type === 'seller' ? '🏪' : '👤'} {driver.phone} • ⭐ {driver.rating?.toFixed(1) || '5.0'} • {driver.total_rides || 0} courses
                                        </div>
                                    </div>
                                </div>

                                {/* Wallet & Actions */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 600, color: '#22c55e', fontSize: 18 }}>
                                            {driver.wallet_balance.toLocaleString()} F
                                        </div>
                                        <div style={{ fontSize: 11, color: '#64748b' }}>Solde Wallet</div>
                                    </div>

                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button
                                            onClick={() => openTopUp(driver)}
                                            style={{ ...buttonStyle, background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}
                                            title="Créditer Wallet"
                                        >
                                            💰
                                        </button>
                                        <a
                                            href={`https://wa.me/${driver.phone.replace(/\+/g, '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ ...buttonStyle, background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', textDecoration: 'none', display: 'flex', alignItems: 'center' }}
                                            title="Contacter WhatsApp"
                                        >
                                            💬
                                        </a>
                                        <button
                                            onClick={() => handleBlockToggle(driver)}
                                            style={{ ...buttonStyle, background: driver.is_blocked ? '#22c55e' : '#ef4444', color: '#fff' }}
                                        >
                                            {driver.is_blocked ? 'Débloquer' : 'Bloquer'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Top Up Modal */}
            {showTopUpModal && selectedDriver && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: '#1e293b',
                        padding: 32,
                        borderRadius: 16,
                        width: 400,
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <h2 style={{ margin: '0 0 24px' }}>💰 Créditer Wallet</h2>
                        <p style={{ marginBottom: 24 }}>
                            Ajouter des fonds pour <strong>{selectedDriver.first_name} {selectedDriver.last_name}</strong>.
                        </p>

                        <div style={{ marginBottom: 24 }}>
                            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#94a3b8' }}>Montant (FCFA)</label>
                            <input
                                type="number"
                                value={topUpAmount}
                                onChange={e => setTopUpAmount(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: 8,
                                    background: 'rgba(0,0,0,0.2)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: '#fff',
                                    fontSize: 18
                                }}
                                placeholder="ex: 5000"
                                autoFocus
                            />
                        </div>

                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setShowTopUpModal(false)}
                                style={{
                                    ...buttonStyle,
                                    background: 'transparent',
                                    color: '#94a3b8'
                                }}
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleTopUp}
                                style={{
                                    ...buttonStyle,
                                    background: '#22c55e',
                                    color: '#fff'
                                }}
                            >
                                Confirmer Crédit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
