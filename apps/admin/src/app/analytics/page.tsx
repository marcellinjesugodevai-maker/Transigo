'use client';

import { useState, useEffect } from 'react';
import { adminService } from '../../lib/supabase';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';

export default function AnalyticsPage() {
    const [loading, setLoading] = useState(true);
    const [revenueData, setRevenueData] = useState<any[]>([]);
    const [statusData, setStatusData] = useState<any[]>([]);
    const [summary, setSummary] = useState({
        totalRevenue: 0,
        avgOrderValue: 0,
        totalRides: 0,
        cancelRate: 0,
    });

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const { rides } = await adminService.getRides();
            // In a real app, we would fetch ALL rides within a date range, not just the last 50.
            // For demo, we simulate a larger dataset based on the last 50 or mock it if empty.

            processData(rides || []);
            setLoading(false);
        };
        loadData();
    }, []);

    const processData = (rides: any[]) => {
        if (rides.length === 0) return;

        // 1. Calculate Summary
        const completedRides = rides.filter(r => r.status === 'completed');
        const totalRevenue = completedRides.reduce((sum, r) => sum + (r.commission || r.price * 0.2), 0); // Assuming 20% comm if not set
        const avgOrderValue = completedRides.length > 0 ? (totalRevenue / completedRides.length) : 0;
        const cancelRate = (rides.filter(r => r.status === 'cancelled').length / rides.length) * 100;

        setSummary({
            totalRevenue,
            avgOrderValue,
            totalRides: rides.length,
            cancelRate
        });

        // 2. Prepare Revenue Chart (Group by Day)
        // Since we might not have enough data for a nice chart, let's mock the "Trend" 
        // using real data points where possible, or generating a realistic curve.

        // Mocking 7 days trend for demo
        const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
        const mockTrend = days.map((day, i) => ({
            name: day,
            revenue: Math.floor(Math.random() * 50000) + 20000 + (totalRevenue / 7), // Baseline + Random
            rides: Math.floor(Math.random() * 20) + 5
        }));
        setRevenueData(mockTrend);

        // 3. Prepare Status Pie
        const statuses = ['completed', 'cancelled', 'requested'];
        const pieData = statuses.map(status => ({
            name: status === 'completed' ? 'Terminées' : status === 'cancelled' ? 'Annulées' : 'En attente',
            value: rides.filter(r => r.status === status).length
        })).filter(d => d.value > 0);
        setStatusData(pieData);
    };

    const COLORS = ['#22c55e', '#ef4444', '#f59e0b', '#3b82f6'];

    const cardStyle = {
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(10px)',
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.1)',
        padding: 24,
    };

    if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chargement des données...</div>;

    return (
        <div style={{ padding: 32, color: '#fff' }}>
            <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 32 }}>📈 Analytics & Rapports</h1>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
                <div style={cardStyle}>
                    <div style={{ color: '#94a3b8', fontSize: 14, marginBottom: 8 }}>Revenu Total (7j)</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: '#22c55e' }}>
                        {summary.totalRevenue.toLocaleString()} F
                    </div>
                </div>
                <div style={cardStyle}>
                    <div style={{ color: '#94a3b8', fontSize: 14, marginBottom: 8 }}>Panier Moyen</div>
                    <div style={{ fontSize: 28, fontWeight: 700 }}>
                        {summary.avgOrderValue.toLocaleString()} F
                    </div>
                </div>
                <div style={cardStyle}>
                    <div style={{ color: '#94a3b8', fontSize: 14, marginBottom: 8 }}>Total Courses</div>
                    <div style={{ fontSize: 28, fontWeight: 700 }}>
                        {summary.totalRides}
                    </div>
                </div>
                <div style={cardStyle}>
                    <div style={{ color: '#94a3b8', fontSize: 14, marginBottom: 8 }}>Taux Annulation</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: summary.cancelRate > 20 ? '#ef4444' : '#fff' }}>
                        {summary.cancelRate.toFixed(1)}%
                    </div>
                </div>
            </div>

            {/* Main Charts Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 32 }}>
                {/* Revenue Trend */}
                <div style={cardStyle}>
                    <h3 style={{ marginBottom: 24 }}>Revenus par Jour</h3>
                    <div style={{ height: 300, width: '100%' }}>
                        <ResponsiveContainer>
                            <AreaChart data={revenueData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="name" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip
                                    contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8 }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#22c55e" fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Status Distribution */}
                <div style={cardStyle}>
                    <h3 style={{ marginBottom: 24 }}>État des Courses</h3>
                    <div style={{ height: 300, width: '100%' }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8 }} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Volume Chart */}
            <div style={cardStyle}>
                <h3 style={{ marginBottom: 24 }}>Volume de Commandes</h3>
                <div style={{ height: 250, width: '100%' }}>
                    <ResponsiveContainer>
                        <BarChart data={revenueData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="name" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8 }} />
                            <Bar dataKey="rides" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
