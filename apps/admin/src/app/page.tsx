'use client';

import { useEffect, useState } from 'react';
import { adminService, supabase } from '../lib/supabase';
import Link from 'next/link';

interface Stats {
    totalDrivers: number;
    onlineDrivers: number;
    totalUsers: number;
    totalRides: number;
    activeRides: number;
    totalRevenue: number;
}

interface RecentRide {
    id: string;
    status: string;
    pickup_address: string;
    dropoff_address: string;
    price: number;
    created_at: string;
    users?: { first_name: string; last_name: string };
    drivers?: { first_name: string; last_name: string };
}

interface TopDriver {
    id: string;
    first_name: string;
    last_name: string;
    total_rides: number;
    rating: number;
    wallet_balance: number;
    is_online: boolean;
}

const statusColors: Record<string, string> = {
    requested: '#fbbf24',
    accepted: '#3b82f6',
    arriving: '#8b5cf6',
    in_progress: '#22c55e',
    completed: '#10b981',
    cancelled: '#dc2626',
};

const statusLabels: Record<string, string> = {
    requested: '⏳ En attente',
    accepted: '✓ Acceptée',
    arriving: '🚗 En route',
    in_progress: '🏃 En cours',
    completed: '✅ Terminée',
    cancelled: '❌ Annulée',
};

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [recentRides, setRecentRides] = useState<RecentRide[]>([]);
    const [topDrivers, setTopDrivers] = useState<TopDriver[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

    const fetchData = async () => {
        try {
            // Stats
            const statsData = await adminService.getStats();
            setStats(statsData);

            // Recent Rides
            const { data: rides } = await supabase
                .from('rides')
                .select('*, users!passenger_id(first_name, last_name), drivers!driver_id(first_name, last_name)')
                .order('created_at', { ascending: false })
                .limit(8);
            setRecentRides(rides || []);

            // Top Drivers
            const { data: drivers } = await supabase
                .from('drivers')
                .select('id, first_name, last_name, total_rides, rating, wallet_balance, is_online')
                .order('total_rides', { ascending: false })
                .limit(5);
            setTopDrivers(drivers || []);

            setLastUpdate(new Date());
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        // Real-time updates
        const unsubscribe = adminService.subscribeToStats(() => {
            fetchData();
        });

        // Auto-refresh every 30s
        const interval = setInterval(fetchData, 30000);

        return () => {
            unsubscribe();
            clearInterval(interval);
        };
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR').format(amount) + ' F';
    };

    const cardStyle = {
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(10px)',
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.1)',
        padding: 20,
    };

    return (
        <div style={{ padding: 32, color: '#fff' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: 32, fontWeight: 700 }}>
                        📊 Dashboard
                    </h1>
                    <p style={{ margin: '8px 0 0', color: '#94a3b8' }}>
                        Vue d'ensemble en temps réel
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        background: loading ? '#fbbf24' : '#22c55e',
                        padding: '8px 16px',
                        borderRadius: 20,
                        fontSize: 13,
                        fontWeight: 500,
                        color: '#000'
                    }}>
                        <span style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: '#000',
                            animation: loading ? 'pulse 1s infinite' : 'none'
                        }} />
                        {loading ? 'Mise à jour...' : 'En direct'}
                    </div>
                    <button
                        onClick={fetchData}
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
            </div>

            {/* Main Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
                {/* Active Rides */}
                <div style={{
                    ...cardStyle,
                    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                    border: 'none'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 8 }}>🚗 Courses Actives</div>
                            <div style={{ fontSize: 36, fontWeight: 700 }}>{stats?.activeRides || 0}</div>
                        </div>
                        <div style={{ fontSize: 40 }}>🔥</div>
                    </div>
                    <div style={{ marginTop: 12, fontSize: 13, opacity: 0.8 }}>
                        {stats?.totalRides || 0} courses au total
                    </div>
                </div>

                {/* Online Drivers */}
                <div style={{
                    ...cardStyle,
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    border: 'none'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 8 }}>👨‍✈️ Chauffeurs En Ligne</div>
                            <div style={{ fontSize: 36, fontWeight: 700 }}>{stats?.onlineDrivers || 0}</div>
                        </div>
                        <div style={{ fontSize: 40 }}>🟢</div>
                    </div>
                    <div style={{ marginTop: 12, fontSize: 13, opacity: 0.8 }}>
                        sur {stats?.totalDrivers || 0} inscrits
                    </div>
                </div>

                {/* Total Users */}
                <div style={cardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 8 }}>👥 Passagers</div>
                            <div style={{ fontSize: 36, fontWeight: 700 }}>{stats?.totalUsers || 0}</div>
                        </div>
                        <div style={{ fontSize: 40 }}>📱</div>
                    </div>
                    <div style={{ marginTop: 12, fontSize: 13, color: '#64748b' }}>
                        Utilisateurs inscrits
                    </div>
                </div>

                {/* Revenue */}
                <div style={{
                    ...cardStyle,
                    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                    border: 'none'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 8 }}>💰 Revenus</div>
                            <div style={{ fontSize: 28, fontWeight: 700 }}>{formatCurrency(stats?.totalRevenue || 0)}</div>
                        </div>
                        <div style={{ fontSize: 40 }}>📈</div>
                    </div>
                    <div style={{ marginTop: 12, fontSize: 13, opacity: 0.8 }}>
                        Commissions totales
                    </div>
                </div>
            </div>

            {/* Second Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 32 }}>
                {/* Recent Rides */}
                <div style={cardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <h3 style={{ margin: 0, fontSize: 18 }}>🚗 Courses Récentes</h3>
                        <Link href="/rides" style={{ color: '#3b82f6', fontSize: 13, textDecoration: 'none' }}>
                            Voir tout →
                        </Link>
                    </div>
                    {recentRides.length === 0 ? (
                        <p style={{ color: '#64748b' }}>Aucune course récente</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {recentRides.slice(0, 6).map((ride) => (
                                <div key={ride.id} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '12px 16px',
                                    background: 'rgba(255,255,255,0.03)',
                                    borderRadius: 10,
                                    borderLeft: `3px solid ${statusColors[ride.status] || '#64748b'}`
                                }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 13, marginBottom: 4 }}>
                                            📍 {ride.pickup_address?.substring(0, 25)}...
                                        </div>
                                        <div style={{ fontSize: 12, color: '#64748b' }}>
                                            {ride.users ? `${ride.users.first_name} ${ride.users.last_name}` : 'Passager'}
                                            {ride.drivers && ` → ${ride.drivers.first_name}`}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{
                                            background: statusColors[ride.status] || '#64748b',
                                            padding: '3px 10px',
                                            borderRadius: 12,
                                            fontSize: 11,
                                            fontWeight: 500
                                        }}>
                                            {statusLabels[ride.status] || ride.status}
                                        </span>
                                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                                            {formatCurrency(ride.price)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Top Drivers */}
                <div style={cardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <h3 style={{ margin: 0, fontSize: 18 }}>🏆 Top Chauffeurs</h3>
                        <Link href="/drivers" style={{ color: '#3b82f6', fontSize: 13, textDecoration: 'none' }}>
                            Voir tout →
                        </Link>
                    </div>
                    {topDrivers.length === 0 ? (
                        <p style={{ color: '#64748b' }}>Aucun chauffeur</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {topDrivers.map((driver, i) => (
                                <div key={driver.id} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    padding: '10px 12px',
                                    background: 'rgba(255,255,255,0.03)',
                                    borderRadius: 10
                                }}>
                                    <span style={{ fontSize: 20, width: 28 }}>
                                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                                    </span>
                                    <div style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: '50%',
                                        background: driver.is_online ? '#22c55e' : '#475569',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 700,
                                        fontSize: 14
                                    }}>
                                        {driver.first_name[0]}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: 14 }}>{driver.first_name} {driver.last_name}</div>
                                        <div style={{ fontSize: 11, color: '#64748b' }}>
                                            {driver.total_rides} courses • ⭐ {driver.rating}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: 13, color: '#22c55e', fontWeight: 600 }}>
                                        {formatCurrency(driver.wallet_balance)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div style={cardStyle}>
                <h3 style={{ margin: '0 0 20px', fontSize: 18 }}>⚡ Actions Rapides</h3>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <Link href="/drivers" style={{
                        background: '#3b82f6',
                        color: '#fff',
                        padding: '12px 24px',
                        borderRadius: 10,
                        textDecoration: 'none',
                        fontWeight: 500,
                        fontSize: 14,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                    }}>
                        👨‍✈️ Gérer Chauffeurs
                    </Link>
                    <Link href="/rides" style={{
                        background: '#8b5cf6',
                        color: '#fff',
                        padding: '12px 24px',
                        borderRadius: 10,
                        textDecoration: 'none',
                        fontWeight: 500,
                        fontSize: 14,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                    }}>
                        🚗 Voir Courses
                    </Link>
                    <Link href="/wallets" style={{
                        background: '#22c55e',
                        color: '#fff',
                        padding: '12px 24px',
                        borderRadius: 10,
                        textDecoration: 'none',
                        fontWeight: 500,
                        fontSize: 14,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                    }}>
                        💳 Recharger Wallet
                    </Link>
                    <Link href="/analytics" style={{
                        background: '#f97316',
                        color: '#fff',
                        padding: '12px 24px',
                        borderRadius: 10,
                        textDecoration: 'none',
                        fontWeight: 500,
                        fontSize: 14,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                    }}>
                        📈 Analytics
                    </Link>
                </div>
            </div>

            {/* Footer */}
            <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#475569', fontSize: 12 }}>
                <span>TransiGo Admin v1.0</span>
                <span>Dernière mise à jour: {lastUpdate.toLocaleTimeString('fr-FR')}</span>
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>
        </div>
    );
}
