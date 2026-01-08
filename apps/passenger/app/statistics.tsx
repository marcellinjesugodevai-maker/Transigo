// =============================================
// TRANSIGO - STATISTIQUES PERSONNELLES
// Aperçu des activités de l'utilisateur
// =============================================

import { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@/components/Icon';
import { COLORS, SPACING, RADIUS } from '@/constants';
import { useThemeStore, useLanguageStore } from '@/stores';
import { getTranslation } from '@/i18n/translations';

const { width } = Dimensions.get('window');

// Données simulées
const STATS_DATA = {
    totalRides: 47,
    totalDeliveries: 12,
    totalFoodOrders: 23,
    totalSpent: 156500,
    totalDistance: 342.5,
    co2Saved: 45.2, // kg de CO2 économisé vs voiture personnelle
    favoriteDriver: 'Koné Ibrahim',
    favoriteRestaurant: 'Poulet Braisé Chez Tantie',
    memberSince: 'Août 2024',
    level: 'Or',
    points: 2450,
};

// Historique mensuel
const MONTHLY_DATA = [
    { month: 'Jan', rides: 8, spent: 24000 },
    { month: 'Fév', rides: 6, spent: 18500 },
    { month: 'Mar', rides: 10, spent: 32000 },
    { month: 'Avr', rides: 7, spent: 21000 },
    { month: 'Mai', rides: 9, spent: 28500 },
    { month: 'Juin', rides: 7, spent: 22500 },
];

type TabType = 'overview' | 'rides' | 'spending';

export default function StatisticsScreen() {
    const { isDark, colors } = useThemeStore();
    const { language } = useLanguageStore();
    const t = (key: any) => getTranslation(key, language);

    const [activeTab, setActiveTab] = useState<TabType>('overview');

    const maxSpent = Math.max(...MONTHLY_DATA.map(d => d.spent));

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <LinearGradient
                colors={['#673AB7', '#512DA8']}
                style={styles.header}
            >
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Icon name="arrow-back" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>📊 {language === 'fr' ? 'Mes Statistiques' : 'My Statistics'}</Text>
                    <Text style={styles.headerSubtitle}>
                        {language === 'fr' ? `Membre depuis ${STATS_DATA.memberSince}` : `Member since ${STATS_DATA.memberSince}`}
                    </Text>
                </View>
                <View style={styles.levelBadge}>
                    <Text style={styles.levelIcon}>🥇</Text>
                    <Text style={styles.levelText}>{STATS_DATA.level}</Text>
                </View>
            </LinearGradient>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                {[
                    { id: 'overview', label: language === 'fr' ? 'Aperçu' : 'Overview', icon: '📊' },
                    { id: 'rides', label: language === 'fr' ? 'Courses' : 'Rides', icon: '🚗' },
                    { id: 'spending', label: language === 'fr' ? 'Dépenses' : 'Spending', icon: '💰' },
                ].map((tab) => (
                    <TouchableOpacity
                        key={tab.id}
                        style={[styles.tab, activeTab === tab.id && styles.tabActive]}
                        onPress={() => setActiveTab(tab.id as TabType)}
                    >
                        <Text style={styles.tabIcon}>{tab.icon}</Text>
                        <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* ===== APERÇU ===== */}
                {activeTab === 'overview' && (
                    <>
                        {/* Stats principales */}
                        <View style={styles.statsGrid}>
                            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                                <LinearGradient colors={['#4CAF50', '#388E3C']} style={styles.statIconBg}>
                                    <Text style={styles.statEmoji}>🚗</Text>
                                </LinearGradient>
                                <Text style={[styles.statValue, { color: colors.text }]}>{STATS_DATA.totalRides}</Text>
                                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                                    {language === 'fr' ? 'Courses' : 'Rides'}
                                </Text>
                            </View>

                            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                                <LinearGradient colors={['#FF9800', '#F57C00']} style={styles.statIconBg}>
                                    <Text style={styles.statEmoji}>📦</Text>
                                </LinearGradient>
                                <Text style={[styles.statValue, { color: colors.text }]}>{STATS_DATA.totalDeliveries}</Text>
                                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                                    {language === 'fr' ? 'Livraisons' : 'Deliveries'}
                                </Text>
                            </View>

                            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                                <LinearGradient colors={['#E91E63', '#C2185B']} style={styles.statIconBg}>
                                    <Text style={styles.statEmoji}>🍔</Text>
                                </LinearGradient>
                                <Text style={[styles.statValue, { color: colors.text }]}>{STATS_DATA.totalFoodOrders}</Text>
                                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Food</Text>
                            </View>

                            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                                <LinearGradient colors={['#2196F3', '#1976D2']} style={styles.statIconBg}>
                                    <Text style={styles.statEmoji}>📍</Text>
                                </LinearGradient>
                                <Text style={[styles.statValue, { color: colors.text }]}>{STATS_DATA.totalDistance}</Text>
                                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>km</Text>
                            </View>
                        </View>

                        {/* Impact écologique */}
                        <View style={[styles.ecoCard, { backgroundColor: colors.card }]}>
                            <View style={styles.ecoHeader}>
                                <Text style={styles.ecoIcon}>🌍</Text>
                                <Text style={[styles.ecoTitle, { color: colors.text }]}>
                                    {language === 'fr' ? 'Impact Écologique' : 'Ecological Impact'}
                                </Text>
                            </View>
                            <View style={styles.ecoContent}>
                                <View style={styles.ecoStat}>
                                    <Text style={styles.ecoValue}>{STATS_DATA.co2Saved} kg</Text>
                                    <Text style={[styles.ecoLabel, { color: colors.textSecondary }]}>
                                        {language === 'fr' ? 'CO2 économisé' : 'CO2 saved'}
                                    </Text>
                                </View>
                                <View style={styles.ecoEquiv}>
                                    <Text style={styles.ecoEquivIcon}>🌳</Text>
                                    <Text style={[styles.ecoEquivText, { color: colors.text }]}>
                                        = {Math.round(STATS_DATA.co2Saved / 21)} {language === 'fr' ? 'arbres plantés' : 'trees planted'}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Favoris */}
                        <View style={[styles.favoritesCard, { backgroundColor: colors.card }]}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                ⭐ {language === 'fr' ? 'Vos Favoris' : 'Your Favorites'}
                            </Text>
                            <View style={styles.favoriteItem}>
                                <Text style={styles.favoriteIcon}>🚗</Text>
                                <View style={styles.favoriteInfo}>
                                    <Text style={[styles.favoriteLabel, { color: colors.textSecondary }]}>
                                        {language === 'fr' ? 'Chauffeur préféré' : 'Favorite driver'}
                                    </Text>
                                    <Text style={[styles.favoriteName, { color: colors.text }]}>{STATS_DATA.favoriteDriver}</Text>
                                </View>
                            </View>
                            <View style={styles.favoriteItem}>
                                <Text style={styles.favoriteIcon}>🍽️</Text>
                                <View style={styles.favoriteInfo}>
                                    <Text style={[styles.favoriteLabel, { color: colors.textSecondary }]}>
                                        {language === 'fr' ? 'Restaurant préféré' : 'Favorite restaurant'}
                                    </Text>
                                    <Text style={[styles.favoriteName, { color: colors.text }]}>{STATS_DATA.favoriteRestaurant}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Points fidélité */}
                        <View style={[styles.pointsCard, { backgroundColor: '#FFD700' }]}>
                            <View style={styles.pointsContent}>
                                <Text style={styles.pointsIcon}>🏆</Text>
                                <View>
                                    <Text style={styles.pointsValue}>{STATS_DATA.points.toLocaleString('fr-FR')}</Text>
                                    <Text style={styles.pointsLabel}>
                                        {language === 'fr' ? 'Points de fidélité' : 'Loyalty points'}
                                    </Text>
                                </View>
                            </View>
                            <TouchableOpacity style={styles.pointsButton}>
                                <Text style={styles.pointsButtonText}>
                                    {language === 'fr' ? 'Échanger →' : 'Redeem →'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}

                {/* ===== COURSES ===== */}
                {activeTab === 'rides' && (
                    <>
                        <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
                            <Text style={[styles.summaryTitle, { color: colors.text }]}>
                                {language === 'fr' ? 'Résumé des courses' : 'Rides summary'}
                            </Text>
                            <View style={styles.summaryRow}>
                                <View style={styles.summaryItem}>
                                    <Text style={styles.summaryEmoji}>🚗</Text>
                                    <Text style={[styles.summaryValue, { color: colors.text }]}>{STATS_DATA.totalRides}</Text>
                                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>VTC</Text>
                                </View>
                                <View style={styles.summaryDivider} />
                                <View style={styles.summaryItem}>
                                    <Text style={styles.summaryEmoji}>📦</Text>
                                    <Text style={[styles.summaryValue, { color: colors.text }]}>{STATS_DATA.totalDeliveries}</Text>
                                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                                        {language === 'fr' ? 'Livraisons' : 'Deliveries'}
                                    </Text>
                                </View>
                                <View style={styles.summaryDivider} />
                                <View style={styles.summaryItem}>
                                    <Text style={styles.summaryEmoji}>🍔</Text>
                                    <Text style={[styles.summaryValue, { color: colors.text }]}>{STATS_DATA.totalFoodOrders}</Text>
                                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Food</Text>
                                </View>
                            </View>
                        </View>

                        {/* Graphique courses par mois */}
                        <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
                            <Text style={[styles.chartTitle, { color: colors.text }]}>
                                📈 {language === 'fr' ? 'Courses par mois' : 'Rides per month'}
                            </Text>
                            <View style={styles.chart}>
                                {MONTHLY_DATA.map((item, index) => (
                                    <View key={index} style={styles.chartBar}>
                                        <View style={[styles.barFill, { height: (item.rides / 12) * 100 }]} />
                                        <Text style={[styles.barLabel, { color: colors.textSecondary }]}>{item.month}</Text>
                                        <Text style={[styles.barValue, { color: colors.text }]}>{item.rides}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </>
                )}

                {/* ===== DÉPENSES ===== */}
                {activeTab === 'spending' && (
                    <>
                        {/* Total dépensé */}
                        <LinearGradient
                            colors={['#FF5722', '#E64A19']}
                            style={styles.totalCard}
                        >
                            <Text style={styles.totalLabel}>
                                {language === 'fr' ? 'Total dépensé' : 'Total spent'}
                            </Text>
                            <Text style={styles.totalValue}>
                                {STATS_DATA.totalSpent.toLocaleString('fr-FR')} F
                            </Text>
                            <Text style={styles.totalPeriod}>
                                {language === 'fr' ? 'Depuis votre inscription' : 'Since you joined'}
                            </Text>
                        </LinearGradient>

                        {/* Graphique dépenses */}
                        <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
                            <Text style={[styles.chartTitle, { color: colors.text }]}>
                                💰 {language === 'fr' ? 'Dépenses par mois' : 'Spending per month'}
                            </Text>
                            <View style={styles.chart}>
                                {MONTHLY_DATA.map((item, index) => (
                                    <View key={index} style={styles.chartBar}>
                                        <View style={[styles.barFillMoney, { height: (item.spent / maxSpent) * 100 }]} />
                                        <Text style={[styles.barLabel, { color: colors.textSecondary }]}>{item.month}</Text>
                                        <Text style={[styles.barValueSmall, { color: colors.text }]}>
                                            {(item.spent / 1000).toFixed(0)}k
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* Répartition */}
                        <View style={[styles.breakdownCard, { backgroundColor: colors.card }]}>
                            <Text style={[styles.chartTitle, { color: colors.text }]}>
                                📊 {language === 'fr' ? 'Répartition' : 'Breakdown'}
                            </Text>
                            {[
                                { label: 'VTC', percent: 55, color: '#4CAF50', amount: 86075 },
                                { label: 'Food', percent: 30, color: '#E91E63', amount: 46950 },
                                { label: language === 'fr' ? 'Livraisons' : 'Deliveries', percent: 15, color: '#FF9800', amount: 23475 },
                            ].map((item, index) => (
                                <View key={index} style={styles.breakdownItem}>
                                    <View style={styles.breakdownHeader}>
                                        <Text style={[styles.breakdownLabel, { color: colors.text }]}>{item.label}</Text>
                                        <Text style={[styles.breakdownAmount, { color: colors.text }]}>
                                            {item.amount.toLocaleString('fr-FR')} F
                                        </Text>
                                    </View>
                                    <View style={styles.breakdownBarBg}>
                                        <View style={[styles.breakdownBarFill, { width: `${item.percent}%`, backgroundColor: item.color }]} />
                                    </View>
                                    <Text style={[styles.breakdownPercent, { color: colors.textSecondary }]}>{item.percent}%</Text>
                                </View>
                            ))}
                        </View>
                    </>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 50,
        paddingBottom: SPACING.lg,
        paddingHorizontal: SPACING.lg,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerContent: { flex: 1, marginLeft: SPACING.md },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.white },
    headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
    levelBadge: {
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 16,
    },
    levelIcon: { fontSize: 20 },
    levelText: { fontSize: 12, fontWeight: 'bold', color: COLORS.white },

    // Tabs
    tabsContainer: {
        flexDirection: 'row',
        marginHorizontal: SPACING.lg,
        marginTop: SPACING.md,
        backgroundColor: '#E0E0E0',
        borderRadius: 16,
        padding: 4,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 12,
        gap: 4,
    },
    tabActive: { backgroundColor: '#FFF' },
    tabIcon: { fontSize: 16 },
    tabText: { fontSize: 12, fontWeight: '600', color: '#666' },
    tabTextActive: { color: '#673AB7' },

    content: { padding: SPACING.lg },

    // Stats Grid
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
        marginBottom: SPACING.lg,
    },
    statCard: {
        width: (width - 3 * SPACING.lg) / 2 - SPACING.sm / 2,
        padding: SPACING.md,
        borderRadius: 16,
        alignItems: 'center',
    },
    statIconBg: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    statEmoji: { fontSize: 24 },
    statValue: { fontSize: 24, fontWeight: 'bold' },
    statLabel: { fontSize: 12, marginTop: 2 },

    // Eco Card
    ecoCard: { padding: SPACING.md, borderRadius: 16, marginBottom: SPACING.lg },
    ecoHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: SPACING.sm },
    ecoIcon: { fontSize: 24 },
    ecoTitle: { fontSize: 16, fontWeight: '700' },
    ecoContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    ecoStat: {},
    ecoValue: { fontSize: 28, fontWeight: 'bold', color: '#4CAF50' },
    ecoLabel: { fontSize: 12 },
    ecoEquiv: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    ecoEquivIcon: { fontSize: 24 },
    ecoEquivText: { fontSize: 14 },

    // Favorites
    favoritesCard: { padding: SPACING.md, borderRadius: 16, marginBottom: SPACING.lg },
    sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: SPACING.sm },
    favoriteItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
    favoriteIcon: { fontSize: 24, marginRight: SPACING.sm },
    favoriteInfo: {},
    favoriteLabel: { fontSize: 11 },
    favoriteName: { fontSize: 14, fontWeight: '600' },

    // Points
    pointsCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: SPACING.md,
        borderRadius: 16,
    },
    pointsContent: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
    pointsIcon: { fontSize: 36 },
    pointsValue: { fontSize: 24, fontWeight: 'bold', color: '#333' },
    pointsLabel: { fontSize: 12, color: '#666' },
    pointsButton: { backgroundColor: '#333', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
    pointsButtonText: { color: '#FFF', fontWeight: '600', fontSize: 13 },

    // Summary
    summaryCard: { padding: SPACING.md, borderRadius: 16, marginBottom: SPACING.lg },
    summaryTitle: { fontSize: 16, fontWeight: '700', marginBottom: SPACING.md },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
    summaryItem: { alignItems: 'center' },
    summaryEmoji: { fontSize: 28, marginBottom: 4 },
    summaryValue: { fontSize: 24, fontWeight: 'bold' },
    summaryLabel: { fontSize: 12 },
    summaryDivider: { width: 1, backgroundColor: '#E0E0E0' },

    // Chart
    chartCard: { padding: SPACING.md, borderRadius: 16, marginBottom: SPACING.lg },
    chartTitle: { fontSize: 16, fontWeight: '700', marginBottom: SPACING.md },
    chart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120 },
    chartBar: { alignItems: 'center', width: 40 },
    barFill: { width: 24, backgroundColor: '#673AB7', borderRadius: 8 },
    barFillMoney: { width: 24, backgroundColor: '#FF5722', borderRadius: 8 },
    barLabel: { fontSize: 10, marginTop: 4 },
    barValue: { fontSize: 12, fontWeight: '600' },
    barValueSmall: { fontSize: 10, fontWeight: '600' },

    // Total
    totalCard: { padding: SPACING.xl, borderRadius: 20, alignItems: 'center', marginBottom: SPACING.lg },
    totalLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
    totalValue: { fontSize: 36, fontWeight: 'bold', color: COLORS.white, marginVertical: 8 },
    totalPeriod: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },

    // Breakdown
    breakdownCard: { padding: SPACING.md, borderRadius: 16 },
    breakdownItem: { marginBottom: SPACING.md },
    breakdownHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    breakdownLabel: { fontSize: 14, fontWeight: '500' },
    breakdownAmount: { fontSize: 14, fontWeight: '600' },
    breakdownBarBg: { height: 8, backgroundColor: '#E0E0E0', borderRadius: 4, overflow: 'hidden' },
    breakdownBarFill: { height: '100%', borderRadius: 4 },
    breakdownPercent: { fontSize: 11, marginTop: 2 },
});
