'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Link from 'next/link';

interface SharedRide {
    id: string;
    driver_id: string;
    departure_address: string;
    destination_address: string;
    departure_lat: number;
    departure_lng: number;
    destination_lat: number;
    destination_lng: number;
    departure_time: string;
    available_seats: number;
    price_per_seat: number;
    status: 'active' | 'completed' | 'cancelled';
    route_description?: string;
    created_at: string;
    // Joined driver info
    drivers?: {
        first_name: string;
        last_name: string;
        phone: string;
        rating: number;
        vehicle_type: string;
        vehicle_plate: string;
    };
    // Passengers who joined
    passengers?: {
        id: string;
        user_id: string;
        seats_booked: number;
        pickup_point?: string;
        status: string;
    }[];
}

export default function CarpoolsPage() {
    const [carpools, setCarpools] = useState<SharedRide[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');

    const fetchCarpools = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('shared_rides')
                .select(`
                    *,
                    drivers (
                        first_name,
                        last_name,
                        phone,
                        rating,
                        vehicle_type,
                        vehicle_plate
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCarpools(data || []);
        } catch (error) {
            console.error('Error fetching carpools:', error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchCarpools();
    }, []);

    const handleCancelCarpool = async (carpoolId: string) => {
        if (!confirm('Voulez-vous vraiment annuler ce covoiturage ?')) return;

        const { error } = await supabase
            .from('shared_rides')
            .update({ status: 'cancelled' })
            .eq('id', carpoolId);

        if (error) {
            alert('Erreur: ' + error.message);
        } else {
            fetchCarpools();
        }
    };

    const handleDeleteCarpool = async (carpoolId: string) => {
        if (!confirm('⚠️ Supprimer définitivement ce covoiturage ? Cette action est irréversible.')) return;

        const { error } = await supabase
            .from('shared_rides')
            .delete()
            .eq('id', carpoolId);

        if (error) {
            alert('Erreur: ' + error.message);
        } else {
            fetchCarpools();
        }
    };

    const filteredCarpools = carpools.filter(c => {
        const matchesFilter =
            filter === 'all' ? true :
                filter === 'active' ? c.status === 'active' :
                    filter === 'completed' ? c.status === 'completed' :
                        filter === 'cancelled' ? c.status === 'cancelled' : true;

        const searchLower = search.toLowerCase();
        const matchesSearch =
            c.departure_address?.toLowerCase().includes(searchLower) ||
            c.destination_address?.toLowerCase().includes(searchLower) ||
            c.drivers?.first_name?.toLowerCase().includes(searchLower) ||
            c.drivers?.last_name?.toLowerCase().includes(searchLower);

        return matchesFilter && matchesSearch;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return '#22c55e';
            case 'completed': return '#3b82f6';
            case 'cancelled': return '#ef4444';
            default: return '#64748b';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'active': return '🟢 Actif';
            case 'completed': return '✅ Terminé';
            case 'cancelled': return '❌ Annulé';
            default: return status;
        }
    };

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
                        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 700 }}>🚗 Covoiturages</h1>
                    </div>
                    <p style={{ margin: '8px 0 0 40px', color: '#94a3b8' }}>
                        {carpools.length} covoiturages • {carpools.filter(c => c.status === 'active').length} actifs
                    </p>
                </div>
                <button
                    onClick={fetchCarpools}
                    style={{ ...buttonStyle, background: '#3b82f6', color: '#fff' } as React.CSSProperties}
                >
                    🔄 Actualiser
                </button>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
                <div style={cardStyle}>
                    <div style={{ fontSize: 32, fontWeight: 700, color: '#22c55e' }}>
                        {carpools.filter(c => c.status === 'active').length}
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: 14 }}>Covoiturages actifs</div>
                </div>
                <div style={cardStyle}>
                    <div style={{ fontSize: 32, fontWeight: 700, color: '#3b82f6' }}>
                        {carpools.filter(c => c.status === 'completed').length}
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: 14 }}>Terminés</div>
                </div>
                <div style={cardStyle}>
                    <div style={{ fontSize: 32, fontWeight: 700, color: '#f59e0b' }}>
                        {carpools.reduce((sum, c) => sum + (c.available_seats || 0), 0)}
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: 14 }}>Places disponibles</div>
                </div>
                <div style={cardStyle}>
                    <div style={{ fontSize: 32, fontWeight: 700, color: '#8b5cf6' }}>
                        {carpools.reduce((sum, c) => sum + (c.price_per_seat || 0), 0).toLocaleString()} F
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: 14 }}>Revenus potentiels</div>
                </div>
            </div>

            {/* Filters */}
            <div style={{ marginBottom: 24, display: 'flex', gap: 16 }}>
                <input
                    type="text"
                    placeholder="Rechercher (Départ, Destination, Chauffeur...)"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{
                        padding: '10px 16px',
                        borderRadius: 8,
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(255,255,255,0.05)',
                        color: '#fff',
                        width: 400
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
                    <option value="active">🟢 Actifs</option>
                    <option value="completed">✅ Terminés</option>
                    <option value="cancelled">❌ Annulés</option>
                </select>
            </div>

            {/* List */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Chargement...</div>
            ) : filteredCarpools.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                    Aucun covoiturage trouvé
                </div>
            ) : (
                <div style={{ display: 'grid', gap: 16 }}>
                    {filteredCarpools.map(carpool => (
                        <div key={carpool.id} style={cardStyle}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                {/* Left: Route Info */}
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                        <span style={{
                                            padding: '4px 12px',
                                            borderRadius: 20,
                                            fontSize: 12,
                                            fontWeight: 600,
                                            background: getStatusColor(carpool.status),
                                            color: '#fff'
                                        }}>
                                            {getStatusLabel(carpool.status)}
                                        </span>
                                        <span style={{ color: '#64748b', fontSize: 12 }}>
                                            {new Date(carpool.created_at).toLocaleDateString('fr-FR')}
                                        </span>
                                    </div>

                                    <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
                                        📍 {carpool.departure_address}
                                    </div>
                                    <div style={{ fontSize: 16, fontWeight: 600, color: '#22c55e', marginBottom: 16 }}>
                                        🏁 {carpool.destination_address}
                                    </div>

                                    {/* Driver Info */}
                                    {carpool.drivers && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
                                            <div style={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: '50%',
                                                background: '#3b82f6',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: 700
                                            }}>
                                                {carpool.drivers.first_name?.[0]}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>
                                                    {carpool.drivers.first_name} {carpool.drivers.last_name}
                                                </div>
                                                <div style={{ fontSize: 12, color: '#94a3b8' }}>
                                                    ⭐ {carpool.drivers.rating?.toFixed(1)} • {carpool.drivers.vehicle_plate} • {carpool.drivers.phone}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Right: Stats & Actions */}
                                <div style={{ textAlign: 'right', marginLeft: 32 }}>
                                    <div style={{ marginBottom: 16 }}>
                                        <div style={{ fontSize: 24, fontWeight: 700, color: '#22c55e' }}>
                                            {carpool.price_per_seat?.toLocaleString()} F
                                        </div>
                                        <div style={{ fontSize: 12, color: '#64748b' }}>par place</div>
                                    </div>

                                    <div style={{ marginBottom: 16 }}>
                                        <div style={{ fontSize: 20, fontWeight: 600 }}>
                                            🪑 {carpool.available_seats} places
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: 16 }}>
                                        <div style={{ fontSize: 14, color: '#94a3b8' }}>
                                            🕐 {carpool.departure_time ? new Date(carpool.departure_time).toLocaleString('fr-FR') : 'Non défini'}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                        {carpool.status === 'active' && (
                                            <button
                                                onClick={() => handleCancelCarpool(carpool.id)}
                                                style={{ ...buttonStyle, background: '#f59e0b', color: '#fff' } as React.CSSProperties}
                                            >
                                                ❌ Annuler
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDeleteCarpool(carpool.id)}
                                            style={{ ...buttonStyle, background: '#ef4444', color: '#fff' } as React.CSSProperties}
                                        >
                                            🗑️ Supprimer
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
