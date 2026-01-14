// =============================================
// TRANSIGO DRIVER - HEAT MAP SCREEN
// Carte des zones chaudes
// =============================================

import { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    RefreshControl,
    Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

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
    surge: '#F44336',
    high: '#FF9800',
    medium: '#FFC107',
    low: '#4CAF50',
};

interface HotZone {
    id: string;
    name: string;
    demandLevel: 'low' | 'medium' | 'high' | 'surge';
    demandScore: number;
    surgeMultiplier: number;
    estimatedWaitTime: number;
    predictedChange: 'increasing' | 'stable' | 'decreasing';
    reason?: string;
    distance: number;
}

import { useDriverPremiumsStore, ZonePrediction } from '../src/stores/driverPremiumsStore';

// Note: MOCK_ZONES removed in favor of Supabase data

export default function HeatMapScreen() {
    const { predictions, refreshPredictions } = useDriverPremiumsStore();
    const [refreshing, setRefreshing] = useState(false);
    const [selectedZone, setSelectedZone] = useState<any | null>(null); // Using loose type for mapped zone

    // Map store predictions to UI format
    const zones = predictions.map(p => ({
        id: p.id,
        name: p.zone,
        demandLevel: p.currentDemand,
        demandScore: p.confidence,
        surgeMultiplier: p.surgeMultiplier,
        estimatedWaitTime: p.inMinutes || 5,
        predictedChange: p.trend === 'up' ? 'increasing' : p.trend === 'down' ? 'decreasing' : 'stable',
        reason: p.reason,
        distance: p.distance || 0
    }));

    useEffect(() => {
        refreshPredictions();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await refreshPredictions();
        setRefreshing(false);
    };

    const getDemandColor = (level: string) => {
        switch (level) {
            case 'surge': return COLORS.surge;
            case 'high': return COLORS.high;
            case 'medium': return COLORS.medium;
            case 'low': return COLORS.low;
            default: return COLORS.gray600;
        }
    };

    const getDemandLabel = (level: string) => {
        switch (level) {
            case 'surge': return '🔥 SURGE';
            case 'high': return '🔴 Haute';
            case 'medium': return '🟡 Moyenne';
            case 'low': return '🟢 Basse';
            default: return level;
        }
    };

    const getChangeIcon = (change: string) => {
        switch (change) {
            case 'increasing': return '📈';
            case 'decreasing': return '📉';
            default: return '➡️';
        }
    };

    const recommendation = zones.filter(z => z.demandScore >= 70)[0];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <LinearGradient colors={[COLORS.primary, '#E65100']} style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Text style={{ fontSize: 24, color: COLORS.white }}>⬅️</Text>
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>📍 Zones Chaudes</Text>
                    <Text style={styles.headerSubtitle}>Mis à jour il y a 2 min</Text>
                </View>
                <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
                    <Text style={{ fontSize: 22, color: COLORS.white }}>🔄</Text>
                </TouchableOpacity>
            </LinearGradient>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
            >
                {/* Recommandation */}
                {recommendation && (
                    <View style={styles.recommendationCard}>
                        <LinearGradient colors={[COLORS.secondary, COLORS.secondaryDark]} style={styles.recommendationGradient}>
                            <View style={styles.recommendationIcon}>
                                <Text style={styles.recommendationEmoji}>💡</Text>
                            </View>
                            <View style={styles.recommendationContent}>
                                <Text style={styles.recommendationTitle}>Recommandation</Text>
                                <Text style={styles.recommendationText}>
                                    Déplacez-vous vers {recommendation.name} ({recommendation.distance} km)
                                </Text>
                                <Text style={styles.recommendationBonus}>
                                    +{Math.round((recommendation.surgeMultiplier - 1) * 100)}% de gains
                                </Text>
                            </View>
                            <TouchableOpacity style={styles.goBtn}>
                                <Text style={{ fontSize: 22 }}>🚀</Text>
                            </TouchableOpacity>
                        </LinearGradient>
                    </View>
                )}

                {/* Carte simulée */}
                <View style={styles.mapPlaceholder}>
                    <Text style={styles.mapIcon}>🗺️</Text>
                    <Text style={styles.mapText}>Carte des zones chaudes</Text>

                    {/* Points de chaleur simulés */}
                    {zones.slice(0, 5).map((zone, index) => (
                        <View
                            key={zone.id}
                            style={[
                                styles.heatDot,
                                {
                                    backgroundColor: getDemandColor(zone.demandLevel),
                                    top: `${20 + index * 15}%`,
                                    left: `${15 + index * 12}%`,
                                    width: 20 + zone.demandScore / 5,
                                    height: 20 + zone.demandScore / 5,
                                    borderRadius: 50,
                                    opacity: 0.6,
                                },
                            ]}
                        />
                    ))}
                </View>

                {/* Légende */}
                <View style={styles.legendContainer}>
                    <Text style={styles.legendTitle}>Légende</Text>
                    <View style={styles.legendRow}>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: COLORS.surge }]} />
                            <Text style={styles.legendLabel}>Surge</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: COLORS.high }]} />
                            <Text style={styles.legendLabel}>Haute</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: COLORS.medium }]} />
                            <Text style={styles.legendLabel}>Moyenne</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: COLORS.low }]} />
                            <Text style={styles.legendLabel}>Basse</Text>
                        </View>
                    </View>
                </View>

                {/* Liste des zones */}
                <Text style={styles.sectionTitle}>📋 Toutes les zones</Text>

                {zones.map((zone) => (
                    <TouchableOpacity
                        key={zone.id}
                        style={[styles.zoneCard, selectedZone?.id === zone.id && styles.zoneCardSelected]}
                        onPress={() => setSelectedZone(zone)}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.zoneDemandIndicator, { backgroundColor: getDemandColor(zone.demandLevel) }]} />
                        <View style={styles.zoneContent}>
                            <View style={styles.zoneHeader}>
                                <Text style={styles.zoneName}>{zone.name}</Text>
                                <Text style={[styles.zoneDemandLabel, { color: getDemandColor(zone.demandLevel) }]}>
                                    {getDemandLabel(zone.demandLevel)}
                                </Text>
                            </View>
                            <View style={styles.zoneStats}>
                                <View style={styles.zoneStat}>
                                    <Text style={styles.zoneStatLabel}>Demande</Text>
                                    <Text style={styles.zoneStatValue}>{zone.demandScore}%</Text>
                                </View>
                                <View style={styles.zoneStat}>
                                    <Text style={styles.zoneStatLabel}>Attente</Text>
                                    <Text style={styles.zoneStatValue}>~{zone.estimatedWaitTime} min</Text>
                                </View>
                                <View style={styles.zoneStat}>
                                    <Text style={styles.zoneStatLabel}>Distance</Text>
                                    <Text style={styles.zoneStatValue}>{zone.distance} km</Text>
                                </View>
                                <View style={styles.zoneStat}>
                                    <Text style={styles.zoneStatLabel}>Tendance</Text>
                                    <Text style={styles.zoneStatValue}>{getChangeIcon(zone.predictedChange)}</Text>
                                </View>
                            </View>
                            {zone.reason && <Text style={styles.zoneReason}>{zone.reason}</Text>}
                            {zone.surgeMultiplier > 1 && (
                                <View style={styles.surgeBadge}>
                                    <Text style={styles.surgeText}>
                                        💰 +{Math.round((zone.surgeMultiplier - 1) * 100)}% gains
                                    </Text>
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>
                ))}

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
        paddingBottom: 16,
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
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.white },
    headerSubtitle: { fontSize: 11, color: 'rgba(255,255,255,0.8)' },
    refreshBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    content: { padding: 16 },

    // Recommendation
    recommendationCard: { marginBottom: 16 },
    recommendationGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
    },
    recommendationIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    recommendationEmoji: { fontSize: 20 },
    recommendationContent: { flex: 1, marginLeft: 12 },
    recommendationTitle: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
    recommendationText: { fontSize: 14, fontWeight: '600', color: COLORS.white },
    recommendationBonus: { fontSize: 12, color: '#FFD700', marginTop: 2 },
    goBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Map
    mapPlaceholder: {
        height: 200,
        backgroundColor: '#E8F5E9',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        overflow: 'hidden',
        position: 'relative',
    },
    mapIcon: { fontSize: 40, marginBottom: 4 },
    mapText: { fontSize: 12, color: COLORS.gray600 },
    heatDot: { position: 'absolute' },

    // Legend
    legendContainer: {
        backgroundColor: COLORS.white,
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
    },
    legendTitle: { fontSize: 12, fontWeight: '600', color: COLORS.black, marginBottom: 8 },
    legendRow: { flexDirection: 'row', justifyContent: 'space-around' },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    legendDot: { width: 12, height: 12, borderRadius: 6 },
    legendLabel: { fontSize: 11, color: COLORS.gray600 },

    // Section
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.black, marginBottom: 12 },

    // Zone card
    zoneCard: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        borderRadius: 16,
        marginBottom: 12,
        overflow: 'hidden',
    },
    zoneCardSelected: { borderWidth: 2, borderColor: COLORS.primary },
    zoneDemandIndicator: { width: 6 },
    zoneContent: { flex: 1, padding: 14 },
    zoneHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    zoneName: { fontSize: 15, fontWeight: '600', color: COLORS.black },
    zoneDemandLabel: { fontSize: 11, fontWeight: 'bold' },
    zoneStats: { flexDirection: 'row', justifyContent: 'space-between' },
    zoneStat: { alignItems: 'center' },
    zoneStatLabel: { fontSize: 10, color: COLORS.gray600 },
    zoneStatValue: { fontSize: 13, fontWeight: '600', color: COLORS.black },
    zoneReason: { fontSize: 11, color: COLORS.primary, marginTop: 8 },
    surgeBadge: { backgroundColor: '#FFF8E1', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginTop: 8, alignSelf: 'flex-start' },
    surgeText: { fontSize: 11, fontWeight: '600', color: COLORS.primary },
});
