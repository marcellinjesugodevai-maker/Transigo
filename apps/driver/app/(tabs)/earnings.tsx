import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { rideService } from '../../src/services/supabaseService';
import { useDriverStore } from '../../src/stores/driverStore';
import { useProfileTerms } from '../../src/hooks/useProfileTerms';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';

const COLORS = { primary: '#FF6B00', secondary: '#00C853', secondaryDark: '#00A344', white: '#FFFFFF', black: '#1A1A2E', gray50: '#FAFAFA', gray100: '#F5F5F5', gray600: '#757575' };

export default function EarningsScreen() {
    const { driver } = useDriverStore();
    const terms = useProfileTerms(); // Dynamic terminology
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalEarnings: 0,
        totalRides: 0,
        totalTips: 0,
        todayEarnings: 0,
        weeklyData: [] as { day: string, amount: number }[]
    });

    useEffect(() => {
        if (driver?.id) {
            loadStats();
        }
    }, [driver?.id]);

    const loadStats = async () => {
        setLoading(true);
        const { totalEarnings, totalRides, totalTips, rides, error } = await rideService.getStats(driver!.id);

        if (rides) {
            const now = new Date();
            const today = rides.filter((r: any) => isSameDay(new Date(r.created_at), now))
                .reduce((sum: number, r: any) => sum + (r.price || 0) + (r.tip || 0), 0);

            // Generate weekly data
            const start = startOfWeek(now, { weekStartsOn: 1 });
            const end = endOfWeek(now, { weekStartsOn: 1 });
            const days = eachDayOfInterval({ start, end });

            const weekly = days.map(day => {
                const dayRides = rides.filter((r: any) => isSameDay(new Date(r.created_at), day));
                const amount = dayRides.reduce((sum: number, r: any) => sum + (r.price || 0) + (r.tip || 0), 0);
                return {
                    day: format(day, 'EEE', { locale: fr }).charAt(0).toUpperCase() + format(day, 'EEE', { locale: fr }).slice(1),
                    amount
                };
            });

            setStats({
                totalEarnings,
                totalRides,
                totalTips,
                todayEarnings: today,
                weeklyData: weekly
            });
        }
        setLoading(false);
    };

    const maxAmount = Math.max(...stats.weeklyData.map(d => d.amount), 1);
    const commission = Math.round(stats.totalEarnings * 0.12);
    const netEarnings = stats.totalEarnings - commission;

    return (
        <ScrollView style={styles.container}>
            {/* Header */}
            <LinearGradient colors={[COLORS.secondary, COLORS.secondaryDark]} style={styles.header}>
                <Text style={styles.headerLabel}>Gains aujourd'hui</Text>
                <Text style={styles.headerAmount}>{stats.todayEarnings.toLocaleString()} FCFA</Text>
                <View style={styles.headerStats}>
                    <View style={styles.headerStat}><Text style={{ fontSize: 20 }}>🚕</Text><Text style={styles.headerStatText}>{stats.totalRides} {terms.trips}</Text></View>
                    <View style={styles.headerStat}><Text style={{ fontSize: 20 }}>💳</Text><Text style={styles.headerStatText}>Solde: {stats.todayEarnings.toLocaleString()} F</Text></View>
                </View>
                <TouchableOpacity style={styles.withdrawBtn} onPress={() => router.push('/wallet')}>
                    <Text style={styles.withdrawBtnText}>➕ Recharger mon compte</Text>
                </TouchableOpacity>
            </LinearGradient>

            {/* Weekly Chart */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Cette semaine</Text>
                {loading ? (
                    <ActivityIndicator size="small" color={COLORS.secondary} />
                ) : (
                    <View style={styles.chart}>
                        {stats.weeklyData.map((item, i) => (
                            <View key={i} style={styles.chartBar}>
                                <View style={[styles.bar, { height: (item.amount / maxAmount) * 100 }]}>
                                    <LinearGradient colors={[COLORS.secondary, COLORS.secondaryDark]} style={styles.barGradient} />
                                </View>
                                <Text style={styles.barLabel}>{item.day}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </View>

            {/* Summary */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Résumé</Text>
                <View style={styles.summaryCard}>
                    <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Gains bruts</Text><Text style={styles.summaryValue}>{stats.totalEarnings.toLocaleString()} FCFA</Text></View>
                    <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Commission (12%)</Text><Text style={[styles.summaryValue, { color: COLORS.primary }]}>-{commission.toLocaleString()} FCFA</Text></View>
                    <View style={styles.divider} />
                    <View style={styles.summaryRow}><Text style={styles.summaryLabelBold}>Gains nets</Text><Text style={styles.summaryValueBold}>{netEarnings.toLocaleString()} FCFA</Text></View>
                </View>
            </View>

            {/* Level */}
            <View style={styles.section}>
                <View style={styles.levelCard}>
                    <View style={styles.levelBadge}><Text style={styles.levelBadgeText}>🥇 OR</Text></View>
                    <View style={styles.levelInfo}>
                        <Text style={styles.levelTitle}>Niveau Or</Text>
                        <Text style={styles.levelDesc}>Commission réduite à 10%</Text>
                    </View>
                    <Text style={styles.levelProgress}>324/500 courses</Text>
                </View>
            </View>

            <View style={{ height: 100 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.gray50 },
    header: { paddingTop: 70, paddingBottom: 24, paddingHorizontal: 24, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerLabel: { fontSize: 14, color: COLORS.white, opacity: 0.9 },
    headerAmount: { fontSize: 40, fontWeight: 'bold', color: COLORS.white, marginVertical: 8 },
    headerStats: { flexDirection: 'row', gap: 24, marginBottom: 16 },
    headerStat: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerStatText: { fontSize: 14, fontWeight: '500', color: COLORS.white },
    withdrawBtn: { backgroundColor: COLORS.white, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
    withdrawBtnText: { fontSize: 16, fontWeight: '600', color: COLORS.secondary },
    section: { padding: 24 },
    sectionTitle: { fontSize: 18, fontWeight: '600', color: COLORS.black, marginBottom: 16 },
    chart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120, backgroundColor: COLORS.white, padding: 16, borderRadius: 16 },
    chartBar: { alignItems: 'center', flex: 1 },
    bar: { width: 24, borderRadius: 12, overflow: 'hidden', marginBottom: 8 },
    barGradient: { flex: 1 },
    barLabel: { fontSize: 12, fontWeight: '500', color: COLORS.gray600 },
    summaryCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 20 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    summaryLabel: { fontSize: 14, color: COLORS.gray600 },
    summaryValue: { fontSize: 14, fontWeight: '500', color: COLORS.black },
    summaryLabelBold: { fontSize: 16, fontWeight: '600', color: COLORS.black },
    summaryValueBold: { fontSize: 18, fontWeight: 'bold', color: COLORS.secondary },
    divider: { height: 1, backgroundColor: COLORS.gray100, marginVertical: 12 },
    levelCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF8E1', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#FFD54F' },
    levelBadge: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFD700', justifyContent: 'center', alignItems: 'center' },
    levelBadgeText: { fontSize: 14, fontWeight: 'bold' },
    levelInfo: { flex: 1, marginLeft: 12 },
    levelTitle: { fontSize: 16, fontWeight: '600', color: COLORS.black },
    levelDesc: { fontSize: 12, color: COLORS.gray600 },
    levelProgress: { fontSize: 12, fontWeight: '500', color: COLORS.gray600 },
});
