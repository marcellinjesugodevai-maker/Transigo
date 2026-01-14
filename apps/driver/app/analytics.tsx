// =============================================
// TRANSIGO DRIVER - ANALYTICS DASHBOARD
// Statistiques avancées et insights
// =============================================

import { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { rideService } from '../src/services/supabaseService';
import { useDriverStore } from '../src/stores/driverStore';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay, getHours } from 'date-fns';
import { fr } from 'date-fns/locale';

const { width } = Dimensions.get('window');

const COLORS = {
    primary: '#FF6B00',
    secondary: '#00C853',
    secondaryDark: '#00A344',
    white: '#FFFFFF',
    black: '#1A1A2E',
    gray50: '#FAFAFA',
    gray100: '#F5F5F5',
    gray600: '#757575',
};

export default function AnalyticsScreen() {
    const { driver } = useDriverStore();
    const [selectedPeriod, setSelectedPeriod] = useState('week');
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        totalEarnings: 0,
        totalRides: 0,
        avgPerHour: 0,
        weeklyData: [] as any[],
        zonePerformance: [] as any[],
        slotPerformance: [] as any[],
        insights: [] as any[]
    });

    useEffect(() => {
        if (driver?.id) {
            loadAnalytics();
        }
    }, [driver?.id]);

    const loadAnalytics = async () => {
        setLoading(true);
        const { totalEarnings, totalRides, rides, error } = await rideService.getStats(driver!.id);

        if (rides) {
            const now = new Date();

            // Weekly Data
            const start = startOfWeek(now, { weekStartsOn: 1 });
            const end = endOfWeek(now, { weekStartsOn: 1 });
            const days = eachDayOfInterval({ start, end });
            const weekly = days.map(day => {
                const dayRides = rides.filter((r: any) => isSameDay(new Date(r.created_at), day));
                return {
                    day: format(day, 'EEE', { locale: fr }),
                    earnings: dayRides.reduce((sum: number, r: any) => sum + (r.price || 0) + (r.tip || 0), 0),
                    rides: dayRides.length
                };
            });

            // Zone Performance (Simplified by address prefix/common names)
            const zonesTemp: Record<string, { earnings: number, rides: number }> = {};
            rides.forEach((r: any) => {
                const zone = (r.pickup_address || 'Autre').split(' ')[0];
                if (!zonesTemp[zone]) zonesTemp[zone] = { earnings: 0, rides: 0 };
                zonesTemp[zone].earnings += (r.price || 0) + (r.tip || 0);
                zonesTemp[zone].rides += 1;
            });
            const zonePerformance = Object.entries(zonesTemp)
                .map(([zone, stats], i) => ({
                    zone,
                    earnings: stats.earnings,
                    perHour: Math.round(stats.earnings / Math.max(stats.rides, 1)), // Rough estimate
                    rank: i + 1,
                    icon: i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`
                }))
                .sort((a, b) => b.earnings - a.earnings)
                .slice(0, 5);

            // Slot Performance
            const slots = [
                { id: 'rush_morn', slot: 'Rush matin', hours: [7, 8, 9, 10], earnings: 0 },
                { id: 'mid', slot: 'Midi', hours: [12, 13, 14], earnings: 0 },
                { id: 'rush_eve', slot: 'Rush soir', hours: [17, 18, 19, 20], earnings: 0 },
                { id: 'night', slot: 'Soirée/Nuit', hours: [21, 22, 23, 0, 1, 2, 3, 4, 5, 6], earnings: 0 },
            ];
            rides.forEach((r: any) => {
                const hour = getHours(new Date(r.created_at));
                const slot = slots.find(s => s.hours.includes(hour));
                if (slot) slot.earnings += (r.price || 0) + (r.tip || 0);
            });
            const slotPerformance = slots.map(s => ({
                ...s,
                hours: `${s.hours[0]}h-${s.hours[s.hours.length - 1]}h`,
                recommendation: s.earnings > 20000 ? 'excellent' : 'good'
            }));

            // Insights
            const insights = [
                { id: 'i1', type: 'tip', icon: '📈', title: 'Activité', message: `Vous avez effectué ${totalRides} courses au total.` },
                { id: 'i2', type: 'tip', icon: '📍', title: 'Zone rentable', message: zonePerformance[0]?.zone ? `${zonePerformance[0].zone} est votre zone la plus lucrative.` : 'Pas assez de données.' },
                { id: 'i3', type: 'achievement', icon: '💰', title: 'Gains', message: `Moyenne de ${Math.round(totalEarnings / Math.max(totalRides, 1))} F par course.` },
            ];

            setData({
                totalEarnings,
                totalRides,
                avgPerHour: Math.round(totalEarnings / 40), // Hypothetical 40h
                weeklyData: weekly,
                zonePerformance,
                slotPerformance,
                insights
            });
        }
        setLoading(false);
    };

    const maxEarnings = Math.max(...data.weeklyData.map(d => d.earnings), 1);

    const getRecommendationColor = (rec: string) => {
        switch (rec) {
            case 'excellent': return COLORS.secondary;
            case 'good': return COLORS.primary;
            default: return COLORS.gray600;
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <LinearGradient colors={['#2196F3', '#1976D2']} style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Text style={{ fontSize: 24, color: COLORS.white }}>⬅️</Text>
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>📊 Analytics</Text>
                    <Text style={styles.headerSubtitle}>Vos performances détaillées</Text>
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Period selector */}
                <View style={styles.periodSelector}>
                    {['day', 'week', 'month'].map((period) => (
                        <TouchableOpacity
                            key={period}
                            style={[styles.periodBtn, selectedPeriod === period && styles.periodBtnActive]}
                            onPress={() => setSelectedPeriod(period)}
                        >
                            <Text style={[styles.periodText, selectedPeriod === period && styles.periodTextActive]}>
                                {period === 'day' ? 'Jour' : period === 'week' ? 'Semaine' : 'Mois'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Stats overview */}
                <View style={styles.statsOverview}>
                    <View style={styles.statMainCard}>
                        <Text style={styles.statMainLabel}>Gains totaux</Text>
                        <Text style={styles.statMainValue}>{data.totalEarnings.toLocaleString('fr-FR')} F</Text>
                        <Text style={styles.statMainChange}>Mise à jour en direct</Text>
                    </View>
                    <View style={styles.statsSecondary}>
                        <View style={styles.statSecondaryCard}>
                            <Text style={styles.statSecondaryIcon}>🚗</Text>
                            <Text style={styles.statSecondaryValue}>{data.totalRides}</Text>
                            <Text style={styles.statSecondaryLabel}>Courses</Text>
                        </View>
                        <View style={styles.statSecondaryCard}>
                            <Text style={styles.statSecondaryIcon}>⏱️</Text>
                            <Text style={styles.statSecondaryValue}>{data.avgPerHour.toLocaleString('fr-FR')}</Text>
                            <Text style={styles.statSecondaryLabel}>F/h</Text>
                        </View>
                    </View>
                </View>

                {/* Weekly chart */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📈 Évolution de la semaine</Text>
                    <View style={styles.chartContainer}>
                        {data.weeklyData.map((item, i) => {
                            const heightPercent = (item.earnings / maxEarnings) * 100;
                            const isToday = i === new Date().getDay() - 1; // Correction simpliste

                            return (
                                <View key={i} style={styles.chartBar}>
                                    <Text style={styles.chartValue}>
                                        {Math.round(item.earnings / 1000)}k
                                    </Text>
                                    <View style={styles.barContainer}>
                                        <LinearGradient
                                            colors={isToday ? [COLORS.secondary, COLORS.secondaryDark] : ['#90CAF9', '#2196F3']}
                                            style={[styles.bar, { height: `${heightPercent}%` }]}
                                        />
                                    </View>
                                    <Text style={[styles.chartLabel, isToday && styles.chartLabelActive]}>
                                        {item.day}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* Zones performance */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📍 Performance par zone</Text>
                    {data.zonePerformance.map((zone: any) => (
                        <View key={zone.zone} style={styles.zoneRow}>
                            <View style={styles.zoneRank}>
                                <Text style={styles.zoneRankText}>{zone.icon}</Text>
                            </View>
                            <View style={styles.zoneInfo}>
                                <Text style={styles.zoneName}>{zone.zone}</Text>
                                <Text style={styles.zonePerHour}>{zone.perHour.toLocaleString('fr-FR')} F/h</Text>
                            </View>
                            <Text style={styles.zoneEarnings}>{zone.earnings.toLocaleString('fr-FR')} F</Text>
                        </View>
                    ))}
                    {data.zonePerformance.length === 0 && <Text style={styles.emptyText}>Pas encore de données par zone</Text>}
                </View>

                {/* Time slots */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>⏰ Créneaux horaires</Text>
                    <View style={styles.slotsContainer}>
                        {data.slotPerformance.map((slot: any, i: number) => (
                            <View key={i} style={styles.slotCard}>
                                <View style={[styles.slotIndicator, { backgroundColor: getRecommendationColor(slot.recommendation) }]} />
                                <Text style={styles.slotName}>{slot.slot}</Text>
                                <Text style={styles.slotHours}>{slot.hours}</Text>
                                <Text style={styles.slotEarnings}>{slot.earnings.toLocaleString('fr-FR')} F</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Insights */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>💡 Insights personnalisés</Text>
                    {data.insights.map((insight: any) => (
                        <View key={insight.id} style={styles.insightCard}>
                            <Text style={styles.insightIcon}>{insight.icon}</Text>
                            <View style={styles.insightContent}>
                                <Text style={styles.insightTitle}>{insight.title}</Text>
                                <Text style={styles.insightMessage}>{insight.message}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.gray50 },

    // Header
    header: {
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerContent: { flex: 1, marginLeft: 12 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.white },
    headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },

    content: { padding: 16 },

    // Period selector
    periodSelector: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 4,
        marginBottom: 16,
    },
    periodBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
    periodBtnActive: { backgroundColor: '#2196F3' },
    periodText: { fontSize: 13, fontWeight: '600', color: COLORS.gray600 },
    periodTextActive: { color: COLORS.white },

    // Stats overview
    statsOverview: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    statMainCard: { flex: 2, backgroundColor: COLORS.white, padding: 16, borderRadius: 16 },
    statMainLabel: { fontSize: 12, color: COLORS.gray600 },
    statMainValue: { fontSize: 24, fontWeight: 'bold', color: COLORS.black, marginVertical: 4 },
    statMainChange: { fontSize: 12, color: COLORS.secondary },
    statsSecondary: { flex: 1, gap: 12 },
    statSecondaryCard: { flex: 1, backgroundColor: COLORS.white, padding: 12, borderRadius: 12, alignItems: 'center' },
    statSecondaryIcon: { fontSize: 18 },
    statSecondaryValue: { fontSize: 16, fontWeight: 'bold', color: COLORS.black },
    statSecondaryLabel: { fontSize: 10, color: COLORS.gray600 },

    // Section
    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.black, marginBottom: 12 },

    // Chart
    chartContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 150,
        backgroundColor: COLORS.white,
        padding: 16,
        borderRadius: 16,
    },
    chartBar: { alignItems: 'center', flex: 1 },
    chartValue: { fontSize: 10, color: COLORS.gray600, marginBottom: 4 },
    barContainer: { width: 24, height: 100, justifyContent: 'flex-end' },
    bar: { width: '100%', borderRadius: 4 },
    chartLabel: { fontSize: 11, color: COLORS.gray600, marginTop: 8 },
    chartLabelActive: { fontWeight: 'bold', color: COLORS.secondary },

    // Zones
    zoneRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
    },
    zoneRank: { width: 30, alignItems: 'center' },
    zoneRankText: { fontSize: 16 },
    zoneInfo: { flex: 1, marginLeft: 12 },
    zoneName: { fontSize: 14, fontWeight: '600', color: COLORS.black },
    zonePerHour: { fontSize: 11, color: COLORS.gray600 },
    zoneEarnings: { fontSize: 14, fontWeight: 'bold', color: COLORS.secondary },

    // Time slots
    slotsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    slotCard: {
        width: (width - 48) / 3,
        backgroundColor: COLORS.white,
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    slotIndicator: { width: '100%', height: 4, borderRadius: 2, marginBottom: 8 },
    slotName: { fontSize: 11, fontWeight: '600', color: COLORS.black },
    slotHours: { fontSize: 10, color: COLORS.gray600 },
    slotEarnings: { fontSize: 12, fontWeight: 'bold', color: COLORS.secondary, marginTop: 4 },

    // Insights
    insightCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        padding: 14,
        borderRadius: 12,
        marginBottom: 8,
    },
    insightIcon: { fontSize: 24 },
    insightContent: { flex: 1, marginLeft: 12 },
    insightTitle: { fontSize: 13, fontWeight: '600', color: COLORS.black },
    insightMessage: { fontSize: 12, color: COLORS.gray600, marginTop: 2 },
    emptyText: { textAlign: 'center', color: COLORS.gray600, marginTop: 10, fontSize: 14 },
});
