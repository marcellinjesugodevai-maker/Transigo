'use client';

import { useState, useEffect } from 'react';
import { adminService, supabase } from '../../lib/supabase';
import Link from 'next/link';

interface Ride {
    id: string;
    status: string;
    pickup_address: string;
    dropoff_address: string;
    price: number;
    discount: number;
    user_pays: number;
    distance_km: number;
    duration_min: number;
    created_at: string;
    users?: { first_name: string; last_name: string; phone: string };
    drivers?: { first_name: string; last_name: string; phone: string };
    women_only?: boolean;
}

const statusColors: Record<string, string> = {
    requested: '#fbbf24', // Amber
    accepted: '#3b82f6', // Blue
    arriving: '#8b5cf6', // Violet
    in_progress: '#22c55e', // Green
    completed: '#10b981', // Emerald
    cancelled: '#ef4444', // Red
};

const statusLabels: Record<string, string> = {
    requested: '⏳ En attente',
    accepted: '✓ Acceptée',
    arriving: '🚗 En route',
    in_progress: '🏃 En cours',
    completed: '✅ Terminée',
    cancelled: '❌ Annulée',
};

export default function RidesPage() {
    const [rides, setRides] = useState<Ride[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [selectedRide, setSelectedRide] = useState<Ride | null>(null);

    const fetchRides = async () => {
        setLoading(true);
        const { rides: data, error } = await adminService.getRides(filter === 'all' ? undefined : filter);
        if (data) setRides(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchRides();
    }, [filter]);

    const handleCancelRide = async (rideId: string) => {
        if (!confirm('Êtes-vous sûr de vouloir annuler cette course ?')) return;

        const { error } = await supabase
            .from('rides')
            .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
            .eq('id', rideId);

        if (!error) {
            alert('Course annulée');
            fetchRides();
            setSelectedRide(null);
        } else {
            alert('Erreur: ' + error.message);
        }
    };

    const cardStyle = {
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(10px)',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.1)',
        padding: 20,
        marginBottom: 16,
        cursor: 'pointer',
        transition: 'all 0.2s',
    };

    const detailModalStyle = {
        position: 'fixed' as 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.8)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000
    };

    return (
        <div style={{ padding: 32, color: '#fff' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Link href="/" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 24 }}>←</Link>
                    <h1 style={{ margin: 0, fontSize: 32, fontWeight: 700 }}>🚗 Gestion Courses</h1>
                </div>
                <button
                    onClick={fetchRides}
                    style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer' }}
                >
                    🔄 Actualiser
                </button>
            </div>

            {/* Filters */}
            <div style={{ marginBottom: 24, display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
                {['all', 'requested', 'accepted', 'in_progress', 'completed', 'cancelled'].map(status => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        style={{
                            padding: '8px 16px',
                            borderRadius: 20,
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: filter === status ? '#fff' : 'rgba(255,255,255,0.05)',
                            color: filter === status ? '#000' : '#fff',
                            cursor: 'pointer',
                            fontWeight: 500
                        }}
                    >
                        {status === 'all' ? 'Toutes' : statusLabels[status]}
                    </button>
                ))}
            </div>

            {/* List */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Chargement...</div>
            ) : rides.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Aucune course trouvée</div>
            ) : (
                <div style={{ display: 'grid', gap: 16 }}>
                    {rides.map(ride => (
                        <div
                            key={ride.id}
                            style={{
                                ...cardStyle,
                                borderLeft: `4px solid ${statusColors[ride.status] || '#64748b'}`
                            }}
                            onClick={() => setSelectedRide(ride)}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                        <span style={{
                                            background: statusColors[ride.status] || '#64748b',
                                            color: '#fff',
                                            padding: '2px 8px',
                                            borderRadius: 4,
                                            fontSize: 12,
                                            fontWeight: 600
                                        }}>
                                            {statusLabels[ride.status]}
                                        </span>
                                        <span style={{ color: '#94a3b8', fontSize: 13 }}>
                                            {new Date(ride.created_at).toLocaleString('fr-FR')}
                                        </span>
                                        {ride.women_only && <span title="Women Only">👩</span>}
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                        <span style={{ color: '#22c55e', fontSize: 14 }}>●</span>
                                        <span style={{ fontSize: 15 }}>{ride.pickup_address}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ color: '#ef4444', fontSize: 14 }}>●</span>
                                        <span style={{ fontSize: 15 }}>{ride.dropoff_address}</span>
                                    </div>
                                </div>

                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 700, fontSize: 18 }}>
                                        {ride.price.toLocaleString()} F
                                    </div>
                                    {ride.discount > 0 && (
                                        <div style={{ fontSize: 12, color: '#ef4444' }}>
                                            Promo: -{ride.discount.toLocaleString()} F
                                        </div>
                                    )}
                                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                                        {ride.distance_km} km • {ride.duration_min} min
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Detail Modal */}
            {selectedRide && (
                <div style={detailModalStyle} onClick={() => setSelectedRide(null)}>
                    <div style={{
                        background: '#1e293b',
                        padding: 32,
                        borderRadius: 16,
                        width: 500,
                        maxWidth: '90%',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                            <h2 style={{ margin: 0 }}>Détails de la Course</h2>
                            <button onClick={() => setSelectedRide(null)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 24, cursor: 'pointer' }}>×</button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
                            <div>
                                <h3 style={{ fontSize: 14, color: '#94a3b8', marginBottom: 8 }}>PASSAGER</h3>
                                <div style={{ fontWeight: 600 }}>
                                    {selectedRide.users ? `${selectedRide.users.first_name} ${selectedRide.users.last_name}` : 'Inconnu'}
                                </div>
                                <div style={{ fontSize: 13, color: '#64748b' }}>
                                    {selectedRide.users?.phone || '-'}
                                </div>
                            </div>
                            <div>
                                <h3 style={{ fontSize: 14, color: '#94a3b8', marginBottom: 8 }}>CHAUFFEUR</h3>
                                <div style={{ fontWeight: 600 }}>
                                    {selectedRide.drivers ? `${selectedRide.drivers.first_name} ${selectedRide.drivers.last_name}` : 'En attente'}
                                </div>
                                <div style={{ fontSize: 13, color: '#64748b' }}>
                                    {selectedRide.drivers?.phone || '-'}
                                </div>
                            </div>
                        </div>

                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: 16, borderRadius: 8, marginBottom: 24 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span>Prix Course (Brut)</span>
                                <span>{selectedRide.price.toLocaleString()} F</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#ef4444' }}>
                                <span>Réduction</span>
                                <span>-{selectedRide.discount.toLocaleString()} F</span>
                            </div>
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                                <span>Payé par client</span>
                                <span style={{ color: '#22c55e' }}>{selectedRide.user_pays?.toLocaleString() || selectedRide.price.toLocaleString()} F</span>
                            </div>
                        </div>

                        {['requested', 'arriving', 'in_progress'].includes(selectedRide.status) && (
                            <button
                                onClick={() => handleCancelRide(selectedRide.id)}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: 8,
                                    background: '#ef4444',
                                    color: '#fff',
                                    fontWeight: 600,
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                🚫 Annuler la course (Admin)
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
