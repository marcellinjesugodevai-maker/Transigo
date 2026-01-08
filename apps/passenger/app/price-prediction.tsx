// =============================================
// TRANSIGO - PRÉDICTION PRIX IA
// Suggère le meilleur moment pour voyager
// =============================================

import { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    StatusBar,
    Animated,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@/components/Icon';
import { COLORS, SPACING } from '@/constants';
import { useThemeStore, useLanguageStore } from '@/stores';
import { getTranslation } from '@/i18n/translations';

const { width } = Dimensions.get('window');

// Prédictions simulées
const PREDICTIONS = [
    { hour: '06:00', price: 2800, traffic: 'low', recommendation: 'good' },
    { hour: '07:00', price: 3200, traffic: 'medium', recommendation: 'neutral' },
    { hour: '08:00', price: 4200, traffic: 'high', recommendation: 'bad' },
    { hour: '09:00', price: 3800, traffic: 'high', recommendation: 'neutral' },
    { hour: '10:00', price: 3000, traffic: 'medium', recommendation: 'neutral' },
    { hour: '11:00', price: 2600, traffic: 'low', recommendation: 'good' },
    { hour: '12:00', price: 2800, traffic: 'medium', recommendation: 'neutral' },
    { hour: '13:00', price: 2700, traffic: 'low', recommendation: 'good' },
    { hour: '14:00', price: 2900, traffic: 'medium', recommendation: 'neutral' },
    { hour: '15:00', price: 3100, traffic: 'medium', recommendation: 'neutral' },
    { hour: '16:00', price: 3500, traffic: 'medium', recommendation: 'neutral' },
    { hour: '17:00', price: 4500, traffic: 'high', recommendation: 'bad' },
    { hour: '18:00', price: 4800, traffic: 'high', recommendation: 'bad' },
    { hour: '19:00', price: 4200, traffic: 'high', recommendation: 'bad' },
    { hour: '20:00', price: 3500, traffic: 'medium', recommendation: 'neutral' },
    { hour: '21:00', price: 3000, traffic: 'low', recommendation: 'good' },
    { hour: '22:00', price: 2700, traffic: 'low', recommendation: 'good' },
];

// Jours de la semaine
const DAYS = [
    { id: 0, labelFr: 'Lun', labelEn: 'Mon', modifier: 1.0 },
    { id: 1, labelFr: 'Mar', labelEn: 'Tue', modifier: 1.0 },
    { id: 2, labelFr: 'Mer', labelEn: 'Wed', modifier: 0.95 },
    { id: 3, labelFr: 'Jeu', labelEn: 'Thu', modifier: 1.05 },
    { id: 4, labelFr: 'Ven', labelEn: 'Fri', modifier: 1.15 },
    { id: 5, labelFr: 'Sam', labelEn: 'Sat', modifier: 0.85 },
    { id: 6, labelFr: 'Dim', labelEn: 'Sun', modifier: 0.80 },
];

// Facteurs IA
const AI_FACTORS = [
    { icon: '🌤️', factor: 'Météo', value: '+5%', color: '#FF9800' },
    { icon: '🚦', factor: 'Trafic prévu', value: 'Moyen', color: '#FFC107' },
    { icon: '📅', factor: 'Jour', value: 'Normal', color: '#4CAF50' },
    { icon: '🎉', factor: 'Événement', value: 'Aucun', color: '#9E9E9E' },
];

export default function PricePredictionScreen() {
    const { isDark, colors } = useThemeStore();
    const { language } = useLanguageStore();
    const t = (key: any) => getTranslation(key, language);

    const [selectedDay, setSelectedDay] = useState(0);
    const [pulseAnim] = useState(new Animated.Value(1));

    const currentHour = new Date().getHours();

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    const dayModifier = DAYS[selectedDay].modifier;
    const adjustedPredictions = PREDICTIONS.map(p => ({
        ...p,
        price: Math.round(p.price * dayModifier),
    }));

    const bestTime = adjustedPredictions.reduce((min, p) => p.price < min.price ? p : min, adjustedPredictions[0]);
    const worstTime = adjustedPredictions.reduce((max, p) => p.price > max.price ? p : max, adjustedPredictions[0]);
    const avgPrice = Math.round(adjustedPredictions.reduce((sum, p) => sum + p.price, 0) / adjustedPredictions.length);
    const savings = Math.round(((worstTime.price - bestTime.price) / worstTime.price) * 100);

    const getRecommendationColor = (rec: string) => {
        switch (rec) {
            case 'good': return '#4CAF50';
            case 'bad': return '#E91E63';
            default: return '#FF9800';
        }
    };

    const getTrafficIcon = (traffic: string) => {
        switch (traffic) {
            case 'low': return '🟢';
            case 'high': return '🔴';
            default: return '🟡';
        }
    };

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
                    <Text style={styles.headerTitle}>🤖 {language === 'fr' ? 'Prédiction IA' : 'AI Prediction'}</Text>
                    <Text style={styles.headerSubtitle}>
                        {language === 'fr' ? 'Prédiction basée sur l\'historique' : 'Prediction based on history'}
                    </Text>
                </View>
                <View style={styles.aiBadge}>
                    <Text style={styles.aiBadgeText}>AI</Text>
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Sélecteur de jour */}
                <View style={styles.daysContainer}>
                    {DAYS.map((day) => (
                        <TouchableOpacity
                            key={day.id}
                            style={[
                                styles.dayChip,
                                { backgroundColor: selectedDay === day.id ? '#673AB7' : colors.card }
                            ]}
                            onPress={() => setSelectedDay(day.id)}
                        >
                            <Text style={[
                                styles.dayText,
                                { color: selectedDay === day.id ? COLORS.white : colors.text }
                            ]}>
                                {language === 'fr' ? day.labelFr : day.labelEn}
                            </Text>
                            {day.modifier < 1 && (
                                <Text style={styles.dayDiscount}>-{Math.round((1 - day.modifier) * 100)}%</Text>
                            )}
                            {day.modifier > 1 && (
                                <Text style={styles.dayIncrease}>+{Math.round((day.modifier - 1) * 100)}%</Text>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Recommandation IA */}
                <Animated.View style={[styles.recommendationCard, { transform: [{ scale: pulseAnim }] }]}>
                    <LinearGradient
                        colors={['#4CAF50', '#388E3C']}
                        style={styles.recommendationGradient}
                    >
                        <View style={styles.recommendationHeader}>
                            <Text style={styles.recommendationIcon}>💡</Text>
                            <Text style={styles.recommendationTitle}>
                                {language === 'fr' ? 'Recommandation IA' : 'AI Recommendation'}
                            </Text>
                        </View>
                        <Text style={styles.recommendationTime}>
                            {language === 'fr' ? 'Partez à' : 'Leave at'} {bestTime.hour}
                        </Text>
                        <Text style={styles.recommendationPrice}>
                            {bestTime.price.toLocaleString('fr-FR')} F
                        </Text>
                        <Text style={styles.recommendationSaving}>
                            {language === 'fr' ? `Économisez ${savings}% vs heures de pointe` : `Save ${savings}% vs peak hours`}
                        </Text>
                    </LinearGradient>
                </Animated.View>

                {/* Statistiques */}
                <View style={styles.statsRow}>
                    <View style={[styles.statBox, { backgroundColor: colors.card }]}>
                        <Text style={styles.statIcon}>📉</Text>
                        <Text style={[styles.statValue, { color: '#4CAF50' }]}>
                            {bestTime.price.toLocaleString('fr-FR')} F
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                            {language === 'fr' ? 'Prix min' : 'Min price'}
                        </Text>
                    </View>
                    <View style={[styles.statBox, { backgroundColor: colors.card }]}>
                        <Text style={styles.statIcon}>📊</Text>
                        <Text style={[styles.statValue, { color: colors.text }]}>
                            {avgPrice.toLocaleString('fr-FR')} F
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                            {language === 'fr' ? 'Prix moyen' : 'Avg price'}
                        </Text>
                    </View>
                    <View style={[styles.statBox, { backgroundColor: colors.card }]}>
                        <Text style={styles.statIcon}>📈</Text>
                        <Text style={[styles.statValue, { color: '#E91E63' }]}>
                            {worstTime.price.toLocaleString('fr-FR')} F
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                            {language === 'fr' ? 'Prix max' : 'Max price'}
                        </Text>
                    </View>
                </View>

                {/* Graphique horaire */}
                <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
                    <Text style={[styles.chartTitle, { color: colors.text }]}>
                        📊 {language === 'fr' ? 'Prédiction par heure' : 'Hourly prediction'}
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.chart}>
                            {adjustedPredictions.map((prediction, index) => {
                                const height = (prediction.price / worstTime.price) * 100;
                                const isNow = parseInt(prediction.hour) === currentHour;
                                const isBest = prediction.hour === bestTime.hour;
                                return (
                                    <View key={index} style={styles.chartColumn}>
                                        <Text style={[styles.chartPrice, { color: colors.text }]}>
                                            {(prediction.price / 1000).toFixed(1)}k
                                        </Text>
                                        <View style={styles.chartBarContainer}>
                                            <View
                                                style={[
                                                    styles.chartBar,
                                                    {
                                                        height,
                                                        backgroundColor: getRecommendationColor(prediction.recommendation),
                                                        borderWidth: isNow ? 2 : 0,
                                                        borderColor: '#FFF',
                                                    }
                                                ]}
                                            />
                                            {isBest && <Text style={styles.bestTag}>⭐</Text>}
                                        </View>
                                        <Text style={styles.chartTraffic}>{getTrafficIcon(prediction.traffic)}</Text>
                                        <Text style={[
                                            styles.chartHour,
                                            { color: isNow ? '#673AB7' : colors.textSecondary, fontWeight: isNow ? 'bold' : 'normal' }
                                        ]}>
                                            {prediction.hour}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>
                    </ScrollView>
                    <View style={styles.legend}>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
                            <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                                {language === 'fr' ? 'Bon moment' : 'Good time'}
                            </Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: '#FF9800' }]} />
                            <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                                {language === 'fr' ? 'Normal' : 'Normal'}
                            </Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: '#E91E63' }]} />
                            <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                                {language === 'fr' ? 'À éviter' : 'Avoid'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Facteurs IA */}
                <View style={[styles.factorsCard, { backgroundColor: colors.card }]}>
                    <Text style={[styles.chartTitle, { color: colors.text }]}>
                        🧠 {language === 'fr' ? 'Facteurs analysés par l\'IA' : 'Factors analyzed by AI'}
                    </Text>
                    {AI_FACTORS.map((factor, index) => (
                        <View key={index} style={styles.factorRow}>
                            <Text style={styles.factorIcon}>{factor.icon}</Text>
                            <Text style={[styles.factorLabel, { color: colors.text }]}>{factor.factor}</Text>
                            <View style={[styles.factorValue, { backgroundColor: factor.color + '20' }]}>
                                <Text style={[styles.factorValueText, { color: factor.color }]}>{factor.value}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Bouton réserver */}
                <TouchableOpacity
                    style={styles.bookButton}
                    onPress={() => router.push('/(tabs)/home')}
                >
                    <LinearGradient
                        colors={['#673AB7', '#512DA8']}
                        style={styles.bookGradient}
                    >
                        <Text style={styles.bookText}>
                            🚗 {language === 'fr' ? 'Réserver maintenant' : 'Book now'}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>

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
    aiBadge: {
        backgroundColor: '#FF5722',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    aiBadgeText: { color: COLORS.white, fontWeight: 'bold', fontSize: 12 },

    content: { padding: SPACING.lg },

    // Days
    daysContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.md },
    dayChip: { padding: 10, borderRadius: 12, alignItems: 'center', minWidth: 44 },
    dayText: { fontSize: 12, fontWeight: '600' },
    dayDiscount: { fontSize: 9, color: '#4CAF50', marginTop: 2 },
    dayIncrease: { fontSize: 9, color: '#E91E63', marginTop: 2 },

    // Recommendation
    recommendationCard: { marginBottom: SPACING.md },
    recommendationGradient: { padding: SPACING.lg, borderRadius: 20, alignItems: 'center' },
    recommendationHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    recommendationIcon: { fontSize: 24 },
    recommendationTitle: { fontSize: 14, color: 'rgba(255,255,255,0.9)' },
    recommendationTime: { fontSize: 16, color: COLORS.white, fontWeight: '600' },
    recommendationPrice: { fontSize: 36, fontWeight: 'bold', color: COLORS.white, marginVertical: 8 },
    recommendationSaving: { fontSize: 14, color: 'rgba(255,255,255,0.9)' },

    // Stats
    statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
    statBox: { flex: 1, padding: SPACING.sm, borderRadius: 16, alignItems: 'center' },
    statIcon: { fontSize: 20, marginBottom: 4 },
    statValue: { fontSize: 14, fontWeight: 'bold' },
    statLabel: { fontSize: 10, marginTop: 2 },

    // Chart
    chartCard: { padding: SPACING.md, borderRadius: 16, marginBottom: SPACING.md },
    chartTitle: { fontSize: 15, fontWeight: '600', marginBottom: SPACING.md },
    chart: { flexDirection: 'row', alignItems: 'flex-end', height: 140, paddingRight: SPACING.lg },
    chartColumn: { alignItems: 'center', marginRight: 8, width: 36 },
    chartPrice: { fontSize: 9, marginBottom: 4 },
    chartBarContainer: { alignItems: 'center' },
    chartBar: { width: 16, borderRadius: 6, minHeight: 10 },
    bestTag: { position: 'absolute', top: -16, fontSize: 12 },
    chartTraffic: { fontSize: 10, marginTop: 4 },
    chartHour: { fontSize: 10, marginTop: 2 },
    legend: { flexDirection: 'row', justifyContent: 'center', gap: SPACING.md, marginTop: SPACING.md },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    legendDot: { width: 10, height: 10, borderRadius: 5 },
    legendText: { fontSize: 11 },

    // Factors
    factorsCard: { padding: SPACING.md, borderRadius: 16, marginBottom: SPACING.lg },
    factorRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
    factorIcon: { fontSize: 20, marginRight: SPACING.sm },
    factorLabel: { flex: 1, fontSize: 14 },
    factorValue: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    factorValueText: { fontSize: 12, fontWeight: '600' },

    // Book button
    bookButton: {},
    bookGradient: { paddingVertical: 18, borderRadius: 30, alignItems: 'center' },
    bookText: { fontSize: 17, fontWeight: 'bold', color: COLORS.white },
});
