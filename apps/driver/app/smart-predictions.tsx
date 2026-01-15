// =============================================
// TRANSIGO DRIVER - SMART PREDICTIONS (IA)
// Prédictions IA, multi-courses, suggestions
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
    Animated,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';

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
    ai: '#2196F3',
    aiDark: '#1976D2',
};

import { useDriverPremiumsStore } from '../src/stores/driverPremiumsStore';

// Prédictions IA (Initial Mock removed, used from store)
// ... Keep constant for type inference if needed for now, but usually mapped


// Multi-course suggestions
const MULTI_COURSE = [
    {
        id: 'm1',
        rides: [
            { pickup: 'Plateau Centre', dropoff: 'Cocody Riviera 2', price: 3500 },
            { pickup: 'Cocody Riviera 3', dropoff: '2 Plateaux', price: 2000 },
        ],
        totalPrice: 5500,
        totalTime: 45,
        bonus: 500,
        efficiency: 95,
    },
    {
        id: 'm2',
        rides: [
            { pickup: 'Marcory', dropoff: 'Aéroport FHB', price: 5500 },
            { pickup: 'Aéroport FHB', dropoff: 'Plateau', price: 6000 },
        ],
        totalPrice: 11500,
        totalTime: 70,
        bonus: 1000,
        efficiency: 98,
    },
];

// Vos meilleurs créneaux personnalisés
const BEST_TIMES = [
    { time: '7h-9h', earnings: 15000, label: 'Rush matin', icon: '🌅' },
    { time: '12h-14h', earnings: 8500, label: 'Pause déj', icon: '🍽️' },
    { time: '17h-20h', earnings: 25000, label: 'Rush soir', icon: '🌆' },
    { time: '21h-23h', earnings: 12000, label: 'Sorties', icon: '🌙' },
];

export default function SmartPredictionsScreen() {
    const { predictions, refreshPredictions } = useDriverPremiumsStore();
    const [selectedPrediction, setSelectedPrediction] = useState<string | null>(null);
    const pulseAnim = useState(new Animated.Value(1))[0];

    useEffect(() => {
        // Simulate real-time update
        refreshPredictions();

        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
            ])
        ).start();

        // Coach Vocal Stratégique (IA)
        // Attend un peu que les données "chargent" pour parler
        setTimeout(() => {
            const bestPred = predictions.find(p => p.trend === 'up') || predictions[0];
            if (bestPred) {
                const message = `Conseil stratégique : La demande augmente fortement à ${bestPred.zone}. ${bestPred.reason}. Je vous suggère de vous y rendre maintenant.`;
                Speech.speak(message, {
                    language: 'fr-FR',
                    rate: 0.95,
                    pitch: 1.0
                });
            }
        }, 1500);

    }, []);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <LinearGradient colors={[COLORS.ai, COLORS.aiDark]} style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Text style={{ fontSize: 24, color: COLORS.white }}>⬅️</Text>
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <View style={styles.headerRow}>
                        <Text style={styles.headerTitle}>🧠 Intelligence TransiGo</Text>
                        <View style={styles.aiBadge}>
                            <Text style={styles.aiBadgeText}>IA</Text>
                        </View>
                    </View>
                    <Text style={styles.headerSubtitle}>Prédictions personnalisées pour maximiser vos gains</Text>
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Live AI Alert */}
                <Animated.View style={[styles.liveAlert, { transform: [{ scale: pulseAnim }] }]}>
                    <LinearGradient colors={['#4CAF50', '#388E3C']} style={styles.liveAlertGradient}>
                        <View style={styles.liveAlertDot} />
                        <Text style={styles.liveAlertText}>🔮 IA Active - Analyse en cours</Text>
                    </LinearGradient>
                </Animated.View>

                {/* Predictions */}
                <Text style={styles.sectionTitle}>📈 Prédictions à venir</Text>

                {/* Predictions */}
                <Text style={styles.sectionTitle}>📈 Prédictions à venir</Text>

                {predictions.map((prediction) => (
                    <TouchableOpacity
                        key={prediction.id}
                        style={[styles.predictionCard, selectedPrediction === prediction.id && styles.predictionCardSelected]}
                        onPress={() => setSelectedPrediction(prediction.id === selectedPrediction ? null : prediction.id)}
                    >
                        <View style={styles.predictionHeader}>
                            <View>
                                <Text style={styles.predictionZone}>{prediction.zone}</Text>
                                <Text style={styles.predictionReason}>{prediction.reason}</Text>
                            </View>
                            <View style={styles.predictionChange}>
                                <Text style={[styles.predictionChangeText, { color: prediction.changePercent > 0 ? COLORS.secondary : COLORS.primary }]}>
                                    {prediction.changePercent > 0 ? '+' : ''}{prediction.changePercent}%
                                </Text>
                                <Text style={styles.predictionTime}>dans {prediction.inMinutes} min</Text>
                            </View>
                        </View>

                        {/* Progress bars */}
                        <View style={styles.predictionBars}>
                            <View style={styles.predictionBarRow}>
                                <Text style={styles.predictionBarLabel}>Maintenant</Text>
                                <View style={styles.predictionBar}>
                                    <View style={[styles.predictionBarFill, {
                                        width: `${prediction.currentDemand === 'low' ? 25 : prediction.currentDemand === 'medium' ? 50 : prediction.currentDemand === 'high' ? 75 : 95}%`,
                                        backgroundColor: COLORS.gray600
                                    }]} />
                                </View>
                                <Text style={styles.predictionBarValue}>{prediction.currentDemand === 'low' ? 'Faible' : prediction.currentDemand === 'medium' ? 'Moy.' : prediction.currentDemand === 'high' ? 'Forte' : 'Surge'}</Text>
                            </View>
                            <View style={styles.predictionBarRow}>
                                <Text style={styles.predictionBarLabel}>Prédit</Text>
                                <View style={styles.predictionBar}>
                                    <LinearGradient
                                        colors={prediction.changePercent > 0 ? [COLORS.secondary, COLORS.secondaryDark] : [COLORS.primary, '#E65100']}
                                        style={[styles.predictionBarFillGradient, {
                                            width: `${prediction.predictedDemand === 'low' ? 25 : prediction.predictedDemand === 'medium' ? 50 : prediction.predictedDemand === 'high' ? 75 : 95}%`
                                        }]}
                                    />
                                </View>
                                <Text style={[styles.predictionBarValue, { color: prediction.changePercent > 0 ? COLORS.secondary : COLORS.primary }]}>
                                    {prediction.predictedDemand === 'low' ? 'Faible' : prediction.predictedDemand === 'medium' ? 'Moy.' : prediction.predictedDemand === 'high' ? 'Forte' : 'Surge'}
                                </Text>
                            </View>
                        </View>

                        {/* Confidence */}
                        <View style={styles.predictionConfidence}>
                            <Text style={styles.predictionConfidenceLabel}>Confiance IA: {prediction.confidence}%</Text>
                            <TouchableOpacity style={styles.goButton} onPress={() => router.push('/heat-map')}>
                                <Text style={styles.goButtonText}>Y ALLER</Text>
                                <Text style={{ fontSize: 16, color: COLORS.white }}>➡️</Text>
                            </TouchableOpacity>
                        </View>

                        {selectedPrediction === prediction.id && (
                            <View style={styles.predictionDetails}>
                                <Text style={styles.predictionRecommendation}>💡 {prediction.recommendation}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                ))}

                {/* Multi-course */}
                <Text style={styles.sectionTitle}>🔗 Courses enchaînées (IA)</Text>
                <Text style={styles.sectionSubtitle}>Optimisez votre temps avec des trajets consécutifs</Text>

                {MULTI_COURSE.map((multi) => (
                    <View key={multi.id} style={styles.multiCard}>
                        <View style={styles.multiHeader}>
                            <View style={styles.multiEfficiency}>
                                <Text style={styles.multiEfficiencyText}>{multi.efficiency}%</Text>
                                <Text style={styles.multiEfficiencyLabel}>Efficacité</Text>
                            </View>
                            <View style={styles.multiStats}>
                                <Text style={styles.multiPrice}>{multi.totalPrice.toLocaleString('fr-FR')} F</Text>
                                <Text style={styles.multiBonusTag}>+{multi.bonus} F bonus</Text>
                            </View>
                        </View>

                        {/* Routes */}
                        {multi.rides.map((ride, i) => (
                            <View key={i} style={styles.multiRoute}>
                                <View style={styles.multiRouteNumber}>
                                    <Text style={styles.multiRouteNumberText}>{i + 1}</Text>
                                </View>
                                <View style={styles.multiRouteInfo}>
                                    <View style={styles.multiRoutePoint}>
                                        <View style={styles.dotGreen} />
                                        <Text style={styles.multiRouteAddress}>{ride.pickup}</Text>
                                    </View>
                                    <View style={styles.multiRouteLine} />
                                    <View style={styles.multiRoutePoint}>
                                        <View style={styles.dotOrange} />
                                        <Text style={styles.multiRouteAddress}>{ride.dropoff}</Text>
                                    </View>
                                </View>
                                <Text style={styles.multiRoutePrice}>{ride.price.toLocaleString('fr-FR')} F</Text>
                            </View>
                        ))}

                        <TouchableOpacity style={styles.multiAcceptBtn}>
                            <LinearGradient colors={[COLORS.secondary, COLORS.secondaryDark]} style={styles.multiAcceptGradient}>
                                <Text style={styles.multiAcceptText}>ACTIVER MULTI-COURSE</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                ))}

                {/* Best times */}
                <Text style={styles.sectionTitle}>⏰ Vos meilleurs créneaux</Text>
                <Text style={styles.sectionSubtitle}>Basé sur votre historique personnel</Text>

                <View style={styles.timesGrid}>
                    {BEST_TIMES.map((time, i) => (
                        <View key={i} style={styles.timeCard}>
                            <Text style={styles.timeIcon}>{time.icon}</Text>
                            <Text style={styles.timeSlot}>{time.time}</Text>
                            <Text style={styles.timeLabel}>{time.label}</Text>
                            <Text style={styles.timeEarnings}>{time.earnings.toLocaleString('fr-FR')} F</Text>
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
    header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    headerContent: {},
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.white },
    aiBadge: { backgroundColor: 'rgba(255,255,255,0.3)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    aiBadgeText: { fontSize: 10, fontWeight: 'bold', color: COLORS.white },
    headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 6 },

    content: { padding: 16 },

    // Live alert
    liveAlert: { marginBottom: 16 },
    liveAlertGradient: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
    liveAlertDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.white, marginRight: 10 },
    liveAlertText: { fontSize: 13, fontWeight: '600', color: COLORS.white },

    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.black, marginBottom: 4, marginTop: 16 },
    sectionSubtitle: { fontSize: 12, color: COLORS.gray600, marginBottom: 12 },

    // Prediction card
    predictionCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 12 },
    predictionCardSelected: { borderWidth: 2, borderColor: COLORS.ai },
    predictionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    predictionZone: { fontSize: 16, fontWeight: 'bold', color: COLORS.black },
    predictionReason: { fontSize: 12, color: COLORS.gray600, marginTop: 2 },
    predictionChange: { alignItems: 'flex-end' },
    predictionChangeText: { fontSize: 20, fontWeight: 'bold' },
    predictionTime: { fontSize: 11, color: COLORS.gray600 },
    predictionBars: { gap: 8, marginBottom: 12 },
    predictionBarRow: { flexDirection: 'row', alignItems: 'center' },
    predictionBarLabel: { fontSize: 11, color: COLORS.gray600, width: 70 },
    predictionBar: { flex: 1, height: 8, backgroundColor: COLORS.gray100, borderRadius: 4, marginHorizontal: 8, overflow: 'hidden' },
    predictionBarFill: { height: '100%', borderRadius: 4 },
    predictionBarFillGradient: { height: '100%', borderRadius: 4 },
    predictionBarValue: { fontSize: 12, fontWeight: 'bold', width: 40, textAlign: 'right' },
    predictionConfidence: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    predictionConfidenceLabel: { fontSize: 11, color: COLORS.ai },
    goButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.ai, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, gap: 4 },
    goButtonText: { fontSize: 11, fontWeight: 'bold', color: COLORS.white },
    predictionDetails: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.gray100 },
    predictionRecommendation: { fontSize: 13, color: COLORS.black, fontStyle: 'italic' },

    // Multi-course
    multiCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 12 },
    multiHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    multiEfficiency: { alignItems: 'center', backgroundColor: '#E3F2FD', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
    multiEfficiencyText: { fontSize: 20, fontWeight: 'bold', color: COLORS.ai },
    multiEfficiencyLabel: { fontSize: 10, color: COLORS.ai },
    multiStats: { alignItems: 'flex-end' },
    multiPrice: { fontSize: 20, fontWeight: 'bold', color: COLORS.secondary },
    multiBonusTag: { fontSize: 11, color: COLORS.primary },
    multiRoute: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    multiRouteNumber: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.ai, justifyContent: 'center', alignItems: 'center' },
    multiRouteNumberText: { fontSize: 12, fontWeight: 'bold', color: COLORS.white },
    multiRouteInfo: { flex: 1, marginLeft: 12 },
    multiRoutePoint: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dotGreen: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.secondary },
    dotOrange: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
    multiRouteLine: { width: 2, height: 10, backgroundColor: COLORS.gray100, marginLeft: 3, marginVertical: 2 },
    multiRouteAddress: { fontSize: 12, color: COLORS.black },
    multiRoutePrice: { fontSize: 14, fontWeight: 'bold', color: COLORS.secondary },
    multiAcceptBtn: { borderRadius: 12, overflow: 'hidden', marginTop: 4 },
    multiAcceptGradient: { paddingVertical: 12, alignItems: 'center' },
    multiAcceptText: { fontSize: 14, fontWeight: 'bold', color: COLORS.white },

    // Times grid
    timesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    timeCard: { width: (width - 42) / 2, backgroundColor: COLORS.white, borderRadius: 16, padding: 14, alignItems: 'center' },
    timeIcon: { fontSize: 28, marginBottom: 6 },
    timeSlot: { fontSize: 14, fontWeight: 'bold', color: COLORS.black },
    timeLabel: { fontSize: 11, color: COLORS.gray600 },
    timeEarnings: { fontSize: 16, fontWeight: 'bold', color: COLORS.secondary, marginTop: 6 },
});

