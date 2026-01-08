// =============================================
// TRANSIGO - HISTORIQUE DES PRIX
// Évolution des prix sur vos trajets fréquents
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
import { COLORS, SPACING } from '@/constants';
import { useThemeStore, useLanguageStore } from '@/stores';
import { getTranslation } from '@/i18n/translations';

const { width } = Dimensions.get('window');

// Trajets fréquents avec historique de prix
const FREQUENT_ROUTES = [
    {
        id: 'r1',
        from: 'Plateau, Abidjan',
        to: 'Aéroport FHB',
        currentPrice: 4500,
        history: [
            { date: 'Lun', price: 4200, time: '08:00' },
            { date: 'Mar', price: 4800, time: '18:30' },
            { date: 'Mer', price: 4500, time: '12:00' },
            { date: 'Jeu', price: 5200, time: '17:00' },
            { date: 'Ven', price: 4500, time: '14:00' },
            { date: 'Sam', price: 3800, time: '10:00' },
            { date: 'Dim', price: 3500, time: '09:00' },
        ],
        avgPrice: 4357,
        minPrice: 3500,
        maxPrice: 5200,
        bestTime: 'Dimanche matin',
        distance: 12.5,
    },
    {
        id: 'r2',
        from: 'Cocody Riviera',
        to: 'Zone 4, Marcory',
        currentPrice: 2800,
        history: [
            { date: 'Lun', price: 2500, time: '09:00' },
            { date: 'Mar', price: 3200, time: '18:00' },
            { date: 'Mer', price: 2800, time: '11:00' },
            { date: 'Jeu', price: 3500, time: '17:30' },
            { date: 'Ven', price: 2800, time: '15:00' },
            { date: 'Sam', price: 2200, time: '10:00' },
            { date: 'Dim', price: 2000, time: '08:00' },
        ],
        avgPrice: 2714,
        minPrice: 2000,
        maxPrice: 3500,
        bestTime: 'Dimanche matin',
        distance: 8.2,
    },
    {
        id: 'r3',
        from: 'Yopougon',
        to: 'Plateau, Abidjan',
        currentPrice: 3200,
        history: [
            { date: 'Lun', price: 3000, time: '07:00' },
            { date: 'Mar', price: 3800, time: '08:00' },
            { date: 'Mer', price: 3200, time: '10:00' },
            { date: 'Jeu', price: 4000, time: '08:30' },
            { date: 'Ven', price: 3500, time: '09:00' },
            { date: 'Sam', price: 2500, time: '11:00' },
            { date: 'Dim', price: 2200, time: '10:00' },
        ],
        avgPrice: 3171,
        minPrice: 2200,
        maxPrice: 4000,
        bestTime: 'Week-end matin',
        distance: 15.3,
    },
];

// Facteurs de prix
const PRICE_FACTORS = [
    { icon: '🌅', factor: 'Matin (6h-9h)', impact: '+15%', color: '#FF9800' },
    { icon: '☀️', factor: 'Journée (9h-17h)', impact: 'Normal', color: '#4CAF50' },
    { icon: '🌆', factor: 'Soir (17h-20h)', impact: '+25%', color: '#E91E63' },
    { icon: '🌙', factor: 'Nuit (20h-6h)', impact: '+10%', color: '#9C27B0' },
    { icon: '🌧️', factor: 'Pluie', impact: '+30%', color: '#2196F3' },
    { icon: '📅', factor: 'Week-end', impact: '-15%', color: '#4CAF50' },
];

export default function PriceHistoryScreen() {
    const { isDark, colors } = useThemeStore();
    const { language } = useLanguageStore();
    const t = (key: any) => getTranslation(key, language);

    const [selectedRoute, setSelectedRoute] = useState(FREQUENT_ROUTES[0]);

    const maxHistoryPrice = Math.max(...selectedRoute.history.map(h => h.price));

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <LinearGradient
                colors={['#9C27B0', '#7B1FA2']}
                style={styles.header}
            >
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Icon name="arrow-back" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>📈 {language === 'fr' ? 'Historique des Prix' : 'Price History'}</Text>
                    <Text style={styles.headerSubtitle}>
                        {language === 'fr' ? 'Trouvez le meilleur moment pour voyager' : 'Find the best time to travel'}
                    </Text>
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Sélecteur de trajet */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    📍 {language === 'fr' ? 'Vos trajets fréquents' : 'Your frequent routes'}
                </Text>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.routesScroll}>
                    {FREQUENT_ROUTES.map((route) => (
                        <TouchableOpacity
                            key={route.id}
                            style={[
                                styles.routeChip,
                                { backgroundColor: selectedRoute.id === route.id ? '#9C27B0' : colors.card }
                            ]}
                            onPress={() => setSelectedRoute(route)}
                        >
                            <Text style={[
                                styles.routeChipFrom,
                                { color: selectedRoute.id === route.id ? COLORS.white : colors.text }
                            ]}>
                                {route.from}
                            </Text>
                            <Text style={[
                                styles.routeChipArrow,
                                { color: selectedRoute.id === route.id ? 'rgba(255,255,255,0.7)' : colors.textSecondary }
                            ]}>
                                → {route.to}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Prix actuel */}
                <View style={[styles.currentPriceCard, { backgroundColor: colors.card }]}>
                    <View style={styles.currentPriceLeft}>
                        <Text style={[styles.currentPriceLabel, { color: colors.textSecondary }]}>
                            {language === 'fr' ? 'Prix actuel estimé' : 'Current estimated price'}
                        </Text>
                        <Text style={styles.currentPriceValue}>
                            {selectedRoute.currentPrice.toLocaleString('fr-FR')} F
                        </Text>
                        <Text style={[styles.currentPriceDistance, { color: colors.textSecondary }]}>
                            📍 {selectedRoute.distance} km
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={styles.bookNowBtn}
                        onPress={() => router.push('/(tabs)/home')}
                    >
                        <LinearGradient
                            colors={['#4CAF50', '#388E3C']}
                            style={styles.bookNowGradient}
                        >
                            <Text style={styles.bookNowText}>
                                {language === 'fr' ? 'Réserver' : 'Book'} 🚗
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* Graphique de l'historique */}
                <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
                    <Text style={[styles.chartTitle, { color: colors.text }]}>
                        📊 {language === 'fr' ? 'Prix sur 7 jours' : '7-day price history'}
                    </Text>
                    <View style={styles.chart}>
                        {selectedRoute.history.map((item, index) => {
                            const height = (item.price / maxHistoryPrice) * 100;
                            const isMin = item.price === selectedRoute.minPrice;
                            const isMax = item.price === selectedRoute.maxPrice;
                            return (
                                <View key={index} style={styles.chartColumn}>
                                    <Text style={[styles.chartPrice, { color: colors.text }]}>
                                        {(item.price / 1000).toFixed(1)}k
                                    </Text>
                                    <View
                                        style={[
                                            styles.chartBar,
                                            {
                                                height,
                                                backgroundColor: isMin ? '#4CAF50' : isMax ? '#E91E63' : '#9C27B0'
                                            }
                                        ]}
                                    />
                                    <Text style={[styles.chartDay, { color: colors.textSecondary }]}>{item.date}</Text>
                                    <Text style={[styles.chartTime, { color: colors.textSecondary }]}>{item.time}</Text>
                                </View>
                            );
                        })}
                    </View>
                    <View style={styles.chartLegend}>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
                            <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                                Min: {selectedRoute.minPrice.toLocaleString('fr-FR')} F
                            </Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: '#E91E63' }]} />
                            <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                                Max: {selectedRoute.maxPrice.toLocaleString('fr-FR')} F
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Meilleur moment */}
                <View style={[styles.bestTimeCard, { backgroundColor: '#4CAF5020' }]}>
                    <Text style={styles.bestTimeIcon}>💡</Text>
                    <View style={styles.bestTimeContent}>
                        <Text style={[styles.bestTimeTitle, { color: colors.text }]}>
                            {language === 'fr' ? 'Meilleur moment pour ce trajet' : 'Best time for this route'}
                        </Text>
                        <Text style={styles.bestTimeValue}>{selectedRoute.bestTime}</Text>
                        <Text style={[styles.bestTimeSaving, { color: '#4CAF50' }]}>
                            {language === 'fr' ? 'Économisez jusqu\'à' : 'Save up to'} {Math.round((1 - selectedRoute.minPrice / selectedRoute.maxPrice) * 100)}%
                        </Text>
                    </View>
                </View>

                {/* Statistiques */}
                <View style={styles.statsRow}>
                    <View style={[styles.statBox, { backgroundColor: colors.card }]}>
                        <Text style={styles.statIcon}>📊</Text>
                        <Text style={[styles.statValue, { color: colors.text }]}>
                            {selectedRoute.avgPrice.toLocaleString('fr-FR')} F
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                            {language === 'fr' ? 'Prix moyen' : 'Average price'}
                        </Text>
                    </View>
                    <View style={[styles.statBox, { backgroundColor: colors.card }]}>
                        <Text style={styles.statIcon}>📉</Text>
                        <Text style={[styles.statValue, { color: '#4CAF50' }]}>
                            {selectedRoute.minPrice.toLocaleString('fr-FR')} F
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                            {language === 'fr' ? 'Prix min' : 'Min price'}
                        </Text>
                    </View>
                    <View style={[styles.statBox, { backgroundColor: colors.card }]}>
                        <Text style={styles.statIcon}>📈</Text>
                        <Text style={[styles.statValue, { color: '#E91E63' }]}>
                            {selectedRoute.maxPrice.toLocaleString('fr-FR')} F
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                            {language === 'fr' ? 'Prix max' : 'Max price'}
                        </Text>
                    </View>
                </View>

                {/* Facteurs de prix */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    💰 {language === 'fr' ? 'Ce qui influence le prix' : 'What affects the price'}
                </Text>

                <View style={[styles.factorsCard, { backgroundColor: colors.card }]}>
                    {PRICE_FACTORS.map((factor, index) => (
                        <View key={index} style={styles.factorRow}>
                            <Text style={styles.factorIcon}>{factor.icon}</Text>
                            <Text style={[styles.factorLabel, { color: colors.text }]}>{factor.factor}</Text>
                            <Text style={[styles.factorImpact, { color: factor.color }]}>{factor.impact}</Text>
                        </View>
                    ))}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },

    // Header
    header: {
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
        marginBottom: SPACING.sm,
    },
    headerContent: {},
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.white },
    headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },

    content: { padding: SPACING.lg },

    sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: SPACING.sm, marginTop: SPACING.md },

    // Routes
    routesScroll: { marginBottom: SPACING.md },
    routeChip: { padding: SPACING.sm, paddingHorizontal: SPACING.md, borderRadius: 16, marginRight: SPACING.sm },
    routeChipFrom: { fontSize: 14, fontWeight: '600' },
    routeChipArrow: { fontSize: 12, marginTop: 2 },

    // Current price
    currentPriceCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: SPACING.md,
        borderRadius: 16,
        marginBottom: SPACING.md,
    },
    currentPriceLeft: {},
    currentPriceLabel: { fontSize: 12 },
    currentPriceValue: { fontSize: 28, fontWeight: 'bold', color: '#9C27B0', marginVertical: 4 },
    currentPriceDistance: { fontSize: 12 },
    bookNowBtn: {},
    bookNowGradient: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 25 },
    bookNowText: { color: COLORS.white, fontWeight: '600', fontSize: 14 },

    // Chart
    chartCard: { padding: SPACING.md, borderRadius: 16, marginBottom: SPACING.md },
    chartTitle: { fontSize: 15, fontWeight: '600', marginBottom: SPACING.md },
    chart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 140 },
    chartColumn: { alignItems: 'center', width: (width - 4 * SPACING.lg) / 7 },
    chartPrice: { fontSize: 10, marginBottom: 4, fontWeight: '500' },
    chartBar: { width: 20, borderRadius: 6, minHeight: 10 },
    chartDay: { fontSize: 10, marginTop: 4, fontWeight: '600' },
    chartTime: { fontSize: 8 },
    chartLegend: { flexDirection: 'row', justifyContent: 'center', gap: SPACING.lg, marginTop: SPACING.md },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 10, height: 10, borderRadius: 5 },
    legendText: { fontSize: 12 },

    // Best time
    bestTimeCard: {
        flexDirection: 'row',
        padding: SPACING.md,
        borderRadius: 16,
        marginBottom: SPACING.md,
        alignItems: 'center',
    },
    bestTimeIcon: { fontSize: 36, marginRight: SPACING.md },
    bestTimeContent: {},
    bestTimeTitle: { fontSize: 13 },
    bestTimeValue: { fontSize: 18, fontWeight: 'bold', color: '#4CAF50', marginVertical: 4 },
    bestTimeSaving: { fontSize: 13, fontWeight: '600' },

    // Stats
    statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
    statBox: { flex: 1, padding: SPACING.sm, borderRadius: 16, alignItems: 'center' },
    statIcon: { fontSize: 20, marginBottom: 4 },
    statValue: { fontSize: 14, fontWeight: 'bold' },
    statLabel: { fontSize: 10, marginTop: 2, textAlign: 'center' },

    // Factors
    factorsCard: { padding: SPACING.md, borderRadius: 16 },
    factorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    factorIcon: { fontSize: 20, marginRight: SPACING.sm },
    factorLabel: { flex: 1, fontSize: 14 },
    factorImpact: { fontSize: 14, fontWeight: '700' },
});
