// =============================================
// TRANSIGO - AR TROUVER CHAUFFEUR
// Réalité Augmentée pour localiser le véhicule
// =============================================

import { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
    StatusBar,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@/components/Icon';
import { COLORS, SPACING } from '@/constants';
import { useThemeStore, useLanguageStore } from '@/stores';
import { getTranslation } from '@/i18n/translations';

const { width, height } = Dimensions.get('window');

// Données chauffeur simulées
const DRIVER_DATA = {
    name: 'Koné Ibrahim',
    vehicle: 'Toyota Corolla',
    plate: 'CI 1234 AB',
    color: 'Blanc',
    distance: 45, // mètres
    direction: 'ahead-right', // ahead, left, right, behind
    eta: '30 sec',
};

export default function ARFindDriverScreen() {
    const params = useLocalSearchParams();
    const { isDark, colors } = useThemeStore();
    const { language } = useLanguageStore();
    const t = (key: any) => getTranslation(key, language);

    // Données du chauffeur (depuis params ou simulées)
    const driverName = params.driver_name as string || DRIVER_DATA.name;
    const vehicle = params.vehicle as string || DRIVER_DATA.vehicle;
    const plate = params.plate as string || DRIVER_DATA.plate;
    const vehicleColor = params.color as string || DRIVER_DATA.color;

    const [distance, setDistance] = useState(DRIVER_DATA.distance);
    const [direction, setDirection] = useState(DRIVER_DATA.direction);
    const [isScanning, setIsScanning] = useState(true);

    // Animations
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const arrowAnim = useRef(new Animated.Value(0)).current;
    const scanLineAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Animation pulsation
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            ])
        ).start();

        // Animation flèche
        Animated.loop(
            Animated.sequence([
                Animated.timing(arrowAnim, { toValue: 10, duration: 500, useNativeDriver: true }),
                Animated.timing(arrowAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
            ])
        ).start();

        // Animation scan
        Animated.loop(
            Animated.sequence([
                Animated.timing(scanLineAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
                Animated.timing(scanLineAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
            ])
        ).start();

        // Simuler la réduction de distance
        const interval = setInterval(() => {
            setDistance(prev => {
                if (prev <= 5) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 5;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const getDirectionArrow = () => {
        switch (direction) {
            case 'ahead': return '⬆️';
            case 'ahead-right': return '↗️';
            case 'right': return '➡️';
            case 'behind-right': return '↘️';
            case 'behind': return '⬇️';
            case 'behind-left': return '↙️';
            case 'left': return '⬅️';
            case 'ahead-left': return '↖️';
            default: return '⬆️';
        }
    };

    const getDirectionText = () => {
        const directions: Record<string, { fr: string, en: string }> = {
            'ahead': { fr: 'Devant vous', en: 'Ahead' },
            'ahead-right': { fr: 'En avant à droite', en: 'Ahead right' },
            'right': { fr: 'À votre droite', en: 'To your right' },
            'behind-right': { fr: 'Derrière à droite', en: 'Behind right' },
            'behind': { fr: 'Derrière vous', en: 'Behind you' },
            'behind-left': { fr: 'Derrière à gauche', en: 'Behind left' },
            'left': { fr: 'À votre gauche', en: 'To your left' },
            'ahead-left': { fr: 'En avant à gauche', en: 'Ahead left' },
        };
        return language === 'fr' ? directions[direction]?.fr : directions[direction]?.en;
    };

    const getDistanceColor = () => {
        if (distance <= 10) return '#4CAF50';
        if (distance <= 30) return '#FF9800';
        return '#2196F3';
    };

    return (
        <View style={[styles.container, { backgroundColor: '#000' }]}>
            <StatusBar barStyle="light-content" />

            {/* Simulation vue caméra (fond noir avec grille) */}
            <View style={styles.cameraView}>
                {/* Grille AR */}
                <View style={styles.arGrid}>
                    {[...Array(5)].map((_, i) => (
                        <View key={`h${i}`} style={[styles.gridLineH, { top: (height / 5) * i }]} />
                    ))}
                    {[...Array(5)].map((_, i) => (
                        <View key={`v${i}`} style={[styles.gridLineV, { left: (width / 5) * i }]} />
                    ))}
                </View>

                {/* Ligne de scan */}
                <Animated.View
                    style={[
                        styles.scanLine,
                        {
                            transform: [{
                                translateY: scanLineAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0, height - 200]
                                })
                            }]
                        }
                    ]}
                />

                {/* Zone centrale - Cible */}
                <View style={styles.targetZone}>
                    {/* Cercles concentriques */}
                    <Animated.View style={[styles.targetCircle, styles.targetCircle1, { transform: [{ scale: pulseAnim }] }]} />
                    <Animated.View style={[styles.targetCircle, styles.targetCircle2, { transform: [{ scale: pulseAnim }] }]} />
                    <View style={styles.targetCircle3} />

                    {/* Flèche directionnelle */}
                    <Animated.View style={[styles.arrowContainer, { transform: [{ translateY: arrowAnim }] }]}>
                        <Text style={styles.arrowEmoji}>{getDirectionArrow()}</Text>
                    </Animated.View>

                    {/* Distance */}
                    <View style={[styles.distanceBadge, { backgroundColor: getDistanceColor() }]}>
                        <Text style={styles.distanceText}>{distance} m</Text>
                    </View>
                </View>

                {/* Indicateur véhicule trouvé */}
                {distance === 0 && (
                    <View style={styles.foundOverlay}>
                        <View style={styles.foundCard}>
                            <Text style={styles.foundIcon}>🎉</Text>
                            <Text style={styles.foundTitle}>
                                {language === 'fr' ? 'Véhicule trouvé !' : 'Vehicle found!'}
                            </Text>
                            <Text style={styles.foundSubtitle}>
                                {language === 'fr' ? 'Le chauffeur vous attend' : 'The driver is waiting'}
                            </Text>
                        </View>
                    </View>
                )}
            </View>

            {/* Header overlay */}
            <View style={styles.headerOverlay}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Icon name="arrow-back" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>📱 AR {language === 'fr' ? 'Trouver' : 'Find'}</Text>
                </View>
                <View style={styles.arBadge}>
                    <Text style={styles.arBadgeText}>AR</Text>
                </View>
            </View>

            {/* Info direction */}
            <View style={styles.directionCard}>
                <LinearGradient
                    colors={['rgba(0,0,0,0.9)', 'rgba(0,0,0,0.7)']}
                    style={styles.directionGradient}
                >
                    <Text style={styles.directionArrow}>{getDirectionArrow()}</Text>
                    <View style={styles.directionInfo}>
                        <Text style={styles.directionText}>{getDirectionText()}</Text>
                        <Text style={styles.directionEta}>
                            {distance > 0
                                ? `${language === 'fr' ? 'Arrive dans' : 'Arriving in'} ~${Math.ceil(distance / 10) * 5} sec`
                                : (language === 'fr' ? 'Arrivé !' : 'Arrived!')}
                        </Text>
                    </View>
                </LinearGradient>
            </View>

            {/* Info véhicule */}
            <View style={styles.vehicleCard}>
                <LinearGradient
                    colors={['rgba(0,0,0,0.9)', 'rgba(0,0,0,0.8)']}
                    style={styles.vehicleGradient}
                >
                    <View style={styles.vehicleRow}>
                        <Text style={styles.vehicleIcon}>🚗</Text>
                        <View style={styles.vehicleInfo}>
                            <Text style={styles.vehicleName}>{vehicle}</Text>
                            <Text style={styles.vehicleColor}>{vehicleColor}</Text>
                        </View>
                        <View style={styles.plateBox}>
                            <Text style={styles.plateText}>{plate}</Text>
                        </View>
                    </View>
                    <View style={styles.driverRow}>
                        <Text style={styles.driverAvatar}>👨🏾</Text>
                        <Text style={styles.driverName}>{driverName}</Text>
                    </View>
                </LinearGradient>
            </View>

            {/* Boutons d'action */}
            <View style={styles.actionsRow}>
                <TouchableOpacity style={styles.actionBtn}>
                    <LinearGradient colors={['#4CAF50', '#388E3C']} style={styles.actionGradient}>
                        <Icon name="call" size={24} color={COLORS.white} />
                    </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn}>
                    <LinearGradient colors={['#2196F3', '#1976D2']} style={styles.actionGradient}>
                        <Icon name="chatbubble" size={24} color={COLORS.white} />
                    </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => router.back()}>
                    <LinearGradient colors={['#E91E63', '#C2185B']} style={styles.actionGradient}>
                        <Icon name="close" size={24} color={COLORS.white} />
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },

    // Camera view
    cameraView: { flex: 1 },
    arGrid: { ...StyleSheet.absoluteFillObject },
    gridLineH: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: 'rgba(0,255,0,0.1)',
    },
    gridLineV: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 1,
        backgroundColor: 'rgba(0,255,0,0.1)',
    },
    scanLine: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: '#00FF00',
        shadowColor: '#00FF00',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 10,
    },

    // Target
    targetZone: {
        position: 'absolute',
        top: height / 2 - 100,
        left: width / 2 - 100,
        width: 200,
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    targetCircle: {
        position: 'absolute',
        borderWidth: 2,
        borderColor: '#4CAF50',
        borderRadius: 200,
    },
    targetCircle1: { width: 180, height: 180, opacity: 0.3 },
    targetCircle2: { width: 120, height: 120, opacity: 0.5 },
    targetCircle3: {
        width: 60,
        height: 60,
        borderWidth: 3,
        borderColor: '#4CAF50',
        borderRadius: 30,
        backgroundColor: 'rgba(76,175,80,0.2)',
    },
    arrowContainer: { marginBottom: 20 },
    arrowEmoji: { fontSize: 60 },
    distanceBadge: {
        position: 'absolute',
        bottom: -40,
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 20,
    },
    distanceText: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },

    // Found overlay
    foundOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    foundCard: {
        backgroundColor: '#4CAF50',
        padding: 30,
        borderRadius: 20,
        alignItems: 'center',
    },
    foundIcon: { fontSize: 50, marginBottom: 10 },
    foundTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.white },
    foundSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 5 },

    // Header
    headerOverlay: {
        position: 'absolute',
        top: 50,
        left: SPACING.lg,
        right: SPACING.lg,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerContent: { flex: 1, marginLeft: SPACING.md },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.white },
    arBadge: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    arBadgeText: { color: COLORS.white, fontWeight: 'bold', fontSize: 14 },

    // Direction card
    directionCard: {
        position: 'absolute',
        top: 120,
        left: SPACING.lg,
        right: SPACING.lg,
    },
    directionGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        borderRadius: 16,
        gap: SPACING.md,
    },
    directionArrow: { fontSize: 36 },
    directionInfo: {},
    directionText: { fontSize: 18, fontWeight: '700', color: COLORS.white },
    directionEta: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

    // Vehicle card
    vehicleCard: {
        position: 'absolute',
        bottom: 120,
        left: SPACING.lg,
        right: SPACING.lg,
    },
    vehicleGradient: { padding: SPACING.md, borderRadius: 16 },
    vehicleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
    vehicleIcon: { fontSize: 30 },
    vehicleInfo: { flex: 1, marginLeft: SPACING.sm },
    vehicleName: { fontSize: 16, fontWeight: '700', color: COLORS.white },
    vehicleColor: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
    plateBox: {
        backgroundColor: '#FFC107',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    plateText: { fontSize: 14, fontWeight: 'bold', color: '#000' },
    driverRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
    driverAvatar: { fontSize: 24 },
    driverName: { fontSize: 14, color: COLORS.white },

    // Actions
    actionsRow: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: SPACING.lg,
    },
    actionBtn: {},
    actionGradient: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
