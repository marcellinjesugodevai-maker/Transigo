// =============================================
// TRANSIGO DRIVER - HOME SCREEN (VERSION AMÉLIORÉE)
// Carte OSM plein écran, stats temps réel, demandes animées
// =============================================

import { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Alert,
    Animated,
    ScrollView,
    StatusBar,
    PanResponder,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import OSMMap from '../../src/components/OSMMap';
import { useDriverPremiumsStore } from '../../src/stores/driverPremiumsStore';
import { useDriverWalletStore, formatCFA } from '../../src/stores';
import { useRideRequests } from '../../src/services/useRideRequests';
import { useDriverStore } from '../../src/stores/driverStore';
import DeliveryHome from '../../src/components/DeliveryHome';

const { width, height } = Dimensions.get('window');

const COLORS = {
    primary: '#FF6B00',
    secondary: '#00C853',
    secondaryDark: '#00A344',
    white: '#FFFFFF',
    black: '#1A1A2E',
    gray50: '#FAFAFA',
    gray100: '#F5F5F5',
    gray600: '#757575',
    offline: '#9E9E9E',
    error: '#F44336',
};

// Demandes de course réelles via Supabase Realtime
// Les données sont gérées par useRideRequests.ts

export default function DriverHomeScreen() {
    const { driver } = useDriverStore();

    // Debug Log
    useEffect(() => {
        console.log('[Home] Current Driver Profile Type:', driver?.profileType);
    }, [driver?.profileType]);

    // Delivery Mode Check
    // TEST OVERRIDE: If you want to force delivery dashboard for testing, change 'delivery' to undefined or add a fallback
    if (driver?.profileType === 'delivery') {
        return <DeliveryHome />;
    }

    const [isOnline, setIsOnline] = useState(false);
    // Passer l'objet driver complet pour le filtrage Women Mode
    const { currentRequest, acceptRide: acceptRideHook, rejectRide: rejectRideHook } = useRideRequests(driver || null, isOnline);
    const [countdown, setCountdown] = useState(30);
    const [stats, setStats] = useState({
        todayEarnings: 45000,
        todayRides: 12,
        todayHours: 6.5,
        acceptRate: 94,
    });

    const { level, xp } = useDriverPremiumsStore();
    const { balance, isBlocked, checkAvailability } = useDriverWalletStore();

    // Animations
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const slideAnim = useRef(new Animated.Value(height)).current;

    // Position de la barre de raccourcis (déplaçable)
    const shortcutsY = useRef(new Animated.Value(0)).current;
    const lastShortcutsY = useRef(0);

    // PanResponder pour rendre la barre déplaçable
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 5,
            onPanResponderGrant: () => {
                shortcutsY.setOffset(lastShortcutsY.current);
                shortcutsY.setValue(0);
            },
            onPanResponderMove: (_, gestureState) => {
                const newY = Math.max(-200, Math.min(100, gestureState.dy));
                shortcutsY.setValue(newY);
            },
            onPanResponderRelease: (_, gestureState) => {
                shortcutsY.flattenOffset();
                lastShortcutsY.current = Math.max(-200, Math.min(100, lastShortcutsY.current + gestureState.dy));
            },
        })
    ).current;

    // Position du bouton toggle (déplaçable)
    const togglePosition = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
    const lastTogglePosition = useRef({ x: 0, y: 0 });

    // PanResponder pour le bouton toggle
    const togglePanResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) =>
                Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10,
            onPanResponderGrant: () => {
                togglePosition.setOffset(lastTogglePosition.current);
                togglePosition.setValue({ x: 0, y: 0 });
            },
            onPanResponderMove: (_, gestureState) => {
                // Limiter le mouvement (horizontal: -100 à 100, vertical: -150 à 50)
                const newX = Math.max(-100, Math.min(100, gestureState.dx));
                const newY = Math.max(-150, Math.min(50, gestureState.dy));
                togglePosition.setValue({ x: newX, y: newY });
            },
            onPanResponderRelease: (_, gestureState) => {
                togglePosition.flattenOffset();
                lastTogglePosition.current = {
                    x: Math.max(-100, Math.min(100, lastTogglePosition.current.x + gestureState.dx)),
                    y: Math.max(-150, Math.min(50, lastTogglePosition.current.y + gestureState.dy)),
                };
            },
        })
    ).current;

    useEffect(() => {
        if (currentRequest) {
            setCountdown(30);
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 50,
                friction: 8,
            }).start();
        } else {
            slideAnim.setValue(height);
        }
    }, [currentRequest]);

    useEffect(() => {
        if (currentRequest && countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else if (countdown === 0 && currentRequest) {
            rejectRequest();
        }
    }, [countdown, currentRequest]);

    useEffect(() => {
        if (isOnline) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [isOnline]);

    // ============================================
    // GPS Tracking & Online Status
    // ============================================
    const locationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const startLocationTracking = async () => {
        if (locationIntervalRef.current) return; // Déjà en cours

        try {
            const Location = await import('expo-location');

            // Demander permission
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('GPS requis', 'Activez la localisation pour recevoir des courses.');
                return false;
            }

            // Première position immédiate
            const loc = await Location.getCurrentPositionAsync({});
            if (driver?.id) {
                const { driverService } = await import('../../src/services/supabaseService');
                await driverService.updateLocation(driver.id, loc.coords.latitude, loc.coords.longitude);
            }

            // Puis toutes les 10 secondes
            locationIntervalRef.current = setInterval(async () => {
                try {
                    const newLoc = await Location.getCurrentPositionAsync({});
                    if (driver?.id) {
                        const { driverService } = await import('../../src/services/supabaseService');
                        await driverService.updateLocation(driver.id, newLoc.coords.latitude, newLoc.coords.longitude);
                    }
                } catch (e) {
                    console.log('GPS update error:', e);
                }
            }, 10000); // 10 secondes

            return true;
        } catch (error) {
            console.error('Location tracking error:', error);
            return false;
        }
    };

    const stopLocationTracking = () => {
        if (locationIntervalRef.current) {
            clearInterval(locationIntervalRef.current);
            locationIntervalRef.current = null;
        }
    };

    // Cleanup au démontage
    useEffect(() => {
        return () => stopLocationTracking();
    }, []);

    const toggleOnline = async () => {
        if (isOnline) {
            Alert.alert('Passer hors ligne ?', 'Vous ne recevrez plus de courses', [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Confirmer',
                    onPress: async () => {
                        // 1️⃣ Arrêter le tracking GPS
                        stopLocationTracking();

                        // 2️⃣ Mettre à jour Supabase
                        if (driver?.id) {
                            const { driverService } = await import('../../src/services/supabaseService');
                            await driverService.setOnlineStatus(driver.id, false);
                        }

                        // 3️⃣ Mettre à jour l'état local
                        setIsOnline(false);
                    }
                },
            ]);
        } else {
            // Vérifier le solde wallet avant de passer en ligne
            const { canGoOnline, message } = checkAvailability();
            if (!canGoOnline) {
                Alert.alert(
                    '⚠️ Solde insuffisant',
                    message + '\n\nVoulez-vous recharger votre compte ?',
                    [
                        { text: 'Annuler', style: 'cancel' },
                        { text: 'Recharger', onPress: () => router.push('/wallet') },
                    ]
                );
                return;
            }

            // 1️⃣ Démarrer le tracking GPS
            const gpsStarted = await startLocationTracking();
            if (!gpsStarted) return;

            // 2️⃣ Mettre à jour Supabase
            if (driver?.id) {
                const { driverService } = await import('../../src/services/supabaseService');
                await driverService.setOnlineStatus(driver.id, true);
            }

            // 3️⃣ Mettre à jour l'état local
            setIsOnline(true);
        }
    };

    const acceptRequest = async () => {
        if (!currentRequest || !driver) return;

        const success = await acceptRideHook(driver.id);
        if (success) {
            slideAnim.setValue(height);
            setStats(prev => ({
                ...prev,
                todayRides: prev.todayRides + 1,
                todayEarnings: prev.todayEarnings + currentRequest.price,
            }));
            Alert.alert('Course acceptée !', `Dirigez-vous vers ${currentRequest.pickup}`);
            router.push('/driver-navigation?type=pickup');
        }
    };

    const rejectRequest = () => {
        rejectRideHook();
        slideAnim.setValue(height);
        setStats(prev => ({ ...prev, acceptRate: Math.max(0, prev.acceptRate - 2) }));
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* CARTE OSM PLEIN ÉCRAN */}
            <OSMMap
                center={{ lat: 5.3599, lng: -4.0083 }}
                zoom={14}
                markers={[
                    { id: 'driver', lat: 5.3599, lng: -4.0083, type: 'driver', label: 'Vous' },
                    ...(isOnline ? [
                        { id: 'passenger1', lat: 5.3650, lng: -4.0120, type: 'passenger' as const, label: 'Kofi - 2 min' },
                        { id: 'passenger2', lat: 5.3550, lng: -4.0050, type: 'passenger' as const, label: 'Aminata - 5 min' },
                        { id: 'passenger3', lat: 5.3620, lng: -4.0000, type: 'passenger' as const, label: 'Jean - 4 min' },
                    ] : []),
                    ...(currentRequest ? [
                        { id: 'pickup', lat: currentRequest.pickupLat, lng: currentRequest.pickupLng, type: 'pickup' as const, label: currentRequest.pickup },
                        ...(currentRequest.stops || []).map((stop, idx) => ({
                            id: `stop-${idx}`,
                            lat: stop.latitude,
                            lng: stop.longitude,
                            type: 'pickup' as const, // Utiliser style pickup pour les arrêts
                            label: stop.address
                        })),
                        { id: 'dropoff', lat: currentRequest.dropoffLat, lng: currentRequest.dropoffLng, type: 'dropoff' as const, label: currentRequest.dropoff },
                    ] : []),
                ]}
                route={currentRequest ? {
                    coordinates: [
                        { lat: 5.3599, lng: -4.0083 },
                        { lat: currentRequest.pickupLat, lng: currentRequest.pickupLng },
                        ...(currentRequest.stops || []).map(s => ({ lat: s.latitude, lng: s.longitude })),
                        { lat: currentRequest.dropoffLat, lng: currentRequest.dropoffLng },
                    ],
                    color: '#00C853'
                } : undefined}
                onMarkerPress={(markerId) => {
                    if (markerId.startsWith('passenger')) {
                        Alert.alert('🚕 Passager', 'Ce passager recherche un chauffeur');
                    }
                }}
                style={StyleSheet.absoluteFill}
            />

            {/* HEADER OVERLAY */}
            <View style={styles.headerOverlay}>
                <LinearGradient
                    colors={isOnline ? ['rgba(0,200,83,0.95)', 'rgba(0,163,68,0.9)'] : ['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.9)']}
                    style={styles.header}
                >
                    <View style={styles.headerTop}>
                        <View>
                            <View style={styles.greetingRow}>
                                <Text style={[styles.greeting, { color: isOnline ? COLORS.white : COLORS.black }]}>
                                    Bonjour, {driver?.firstName || 'Partenaire'}
                                </Text>
                                <View style={styles.levelBadge}>
                                    <Text style={styles.levelText}>Niv. {level}</Text>
                                </View>
                            </View>
                            <Text style={[styles.status, { color: isOnline ? 'rgba(255,255,255,0.9)' : COLORS.gray600 }]}>
                                {isOnline ? '🟢 En ligne • Recherche...' : '🔴 Hors ligne'}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
                            <View style={[styles.avatarSmall, { backgroundColor: isOnline ? 'rgba(255,255,255,0.2)' : COLORS.gray100 }]}>
                                <Text style={styles.avatarText}>{driver?.firstName?.[0] || 'D'}</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Stats rapides + Wallet */}
                    <View style={styles.statsRow}>
                        <TouchableOpacity style={styles.statCard} onPress={() => router.push('/wallet')}>
                            <Text style={styles.statIcon}>💳</Text>
                            <Text style={[styles.statValue, { color: isBlocked ? COLORS.error : (isOnline ? COLORS.white : COLORS.black) }]}>
                                {formatCFA(balance)}
                            </Text>
                        </TouchableOpacity>
                        <View style={styles.statCard}>
                            <Text style={styles.statIcon}>🚗</Text>
                            <Text style={[styles.statValue, { color: isOnline ? COLORS.white : COLORS.black }]}>
                                {stats.todayRides}
                            </Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statIcon}>⏱️</Text>
                            <Text style={[styles.statValue, { color: isOnline ? COLORS.white : COLORS.black }]}>
                                {stats.todayHours}h
                            </Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statIcon}>✅</Text>
                            <Text style={[styles.statValue, { color: isOnline ? COLORS.white : COLORS.black }]}>
                                {stats.acceptRate}%
                            </Text>
                        </View>
                    </View>
                </LinearGradient>
            </View>

            {/* RACCOURCIS DÉPLAÇABLES */}
            <Animated.View
                style={[styles.shortcutsContainer, { transform: [{ translateY: shortcutsY }] }]}
                {...panResponder.panHandlers}
            >
                {/* Indicateur de glissement */}
                <View style={styles.dragHandle}>
                    <View style={styles.dragBar} />
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shortcutsContent}>
                    <TouchableOpacity style={styles.shortcutBtn} onPress={() => router.push('/heat-map')}>
                        <Text style={styles.shortcutIcon}>📍</Text>
                        <Text style={styles.shortcutLabel}>Zones</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.shortcutBtn} onPress={() => router.push('/leaderboard')}>
                        <Text style={styles.shortcutIcon}>🏆</Text>
                        <Text style={styles.shortcutLabel}>Ranking</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.shortcutBtn} onPress={() => router.push('/smart-predictions')}>
                        <Text style={styles.shortcutIcon}>🧠</Text>
                        <Text style={styles.shortcutLabel}>IA</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.shortcutBtn} onPress={() => router.push('/voice-copilot')}>
                        <Text style={styles.shortcutIcon}>🎙️</Text>
                        <Text style={styles.shortcutLabel}>Copilote</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.shortcutBtn} onPress={() => router.push('/translator')}>
                        <Text style={styles.shortcutIcon}>🌍</Text>
                        <Text style={styles.shortcutLabel}>Traduc.</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.shortcutBtn} onPress={() => router.push('/home-direction')}>
                        <Text style={styles.shortcutIcon}>🏠</Text>
                        <Text style={styles.shortcutLabel}>Maison</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.shortcutBtn} onPress={() => router.push('/clubs')}>
                        <Text style={styles.shortcutIcon}>👥</Text>
                        <Text style={styles.shortcutLabel}>Clubs</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.shortcutBtn} onPress={() => router.push('/premium')}>
                        <Text style={styles.shortcutIcon}>👑</Text>
                        <Text style={styles.shortcutLabel}>Premium</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.shortcutBtn} onPress={() => router.push('/analytics')}>
                        <Text style={styles.shortcutIcon}>📊</Text>
                        <Text style={styles.shortcutLabel}>Stats</Text>
                    </TouchableOpacity>
                </ScrollView>
            </Animated.View>

            {/* BOUTON ON/OFF DÉPLAÇABLE */}
            <Animated.View
                style={[styles.toggleContainer, { transform: togglePosition.getTranslateTransform() }]}
                {...togglePanResponder.panHandlers}
            >
                <TouchableOpacity onPress={toggleOnline} activeOpacity={0.9}>
                    <Animated.View style={{ transform: [{ scale: isOnline ? pulseAnim : 1 }] }}>
                        <LinearGradient
                            colors={isOnline ? [COLORS.secondary, COLORS.secondaryDark] : [COLORS.gray600, COLORS.offline]}
                            style={styles.toggleButton}
                        >
                            <Ionicons name={isOnline ? 'power' : 'power-outline'} size={36} color={COLORS.white} />
                            <Text style={styles.toggleText}>
                                {isOnline ? 'EN LIGNE' : 'HORS LIGNE'}
                            </Text>
                        </LinearGradient>
                    </Animated.View>
                </TouchableOpacity>
            </Animated.View>

            {/* DEMANDE DE COURSE (POPUP) */}
            {currentRequest && (
                <Animated.View style={[styles.requestOverlay, { transform: [{ translateY: slideAnim }] }]}>
                    <View style={styles.requestCard}>
                        {/* Countdown */}
                        <View style={styles.countdownContainer}>
                            <View style={[styles.countdownCircle, { borderColor: countdown > 10 ? COLORS.secondary : COLORS.error }]}>
                                <Text style={[styles.countdownText, { color: countdown > 10 ? COLORS.secondary : COLORS.error }]}>
                                    {countdown}
                                </Text>
                            </View>
                        </View>

                        {/* Passenger info */}
                        <View style={styles.passengerRow}>
                            <View style={styles.passengerAvatar}>
                                <Text style={styles.passengerAvatarText}>{currentRequest.passengerName.charAt(0)}</Text>
                            </View>
                            <View style={styles.passengerInfo}>
                                <Text style={styles.passengerName}>{currentRequest.passengerName}</Text>
                                <View style={styles.ratingRow}>
                                    <Ionicons name="star" size={14} color="#FFB800" />
                                    <Text style={styles.ratingText}>{currentRequest.passengerRating}</Text>
                                </View>
                                {currentRequest.womenOnly && (
                                    <View style={{ backgroundColor: '#FF69B4', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginTop: 4, alignSelf: 'flex-start' }}>
                                        <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>👩 Réservé aux femmes</Text>
                                    </View>
                                )}
                            </View>
                            <View style={styles.priceContainer}>
                                <Text style={styles.priceValue}>{currentRequest.price.toLocaleString('fr-FR')} F</Text>
                                {currentRequest.bonus > 0 && (
                                    <Text style={styles.bonusText}>+{currentRequest.bonus} F bonus</Text>
                                )}
                            </View>
                        </View>

                        {/* Route */}
                        <View style={styles.routeSection}>
                            <View style={styles.routePoint}>
                                <View style={styles.dotGreen} />
                                <View style={styles.routeInfo}>
                                    <Text style={styles.routeLabel}>Prise en charge</Text>
                                    <Text style={styles.routeAddress}>{currentRequest.pickup}</Text>
                                </View>
                            </View>

                            {currentRequest.stops && currentRequest.stops.map((stop, index) => (
                                <View key={`stop-${index}`}>
                                    <View style={styles.routeLine} />
                                    <View style={styles.routePoint}>
                                        <View style={[styles.dotGreen, { backgroundColor: COLORS.primary }]} />
                                        <View style={styles.routeInfo}>
                                            <Text style={[styles.routeLabel, { color: COLORS.primary }]}>Arrêt {index + 1}</Text>
                                            <Text style={styles.routeAddress}>{stop.address}</Text>
                                        </View>
                                    </View>
                                </View>
                            ))}

                            <View style={styles.routeLine} />
                            <View style={styles.routePoint}>
                                <View style={styles.dotOrange} />
                                <View style={styles.routeInfo}>
                                    <Text style={styles.routeLabel}>Destination</Text>
                                    <Text style={styles.routeAddress}>{currentRequest.dropoff}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Stats */}
                        <View style={styles.tripStats}>
                            <View style={styles.tripStat}>
                                <Ionicons name="navigate-outline" size={18} color={COLORS.gray600} />
                                <Text style={styles.tripStatValue}>{currentRequest.distance} km</Text>
                            </View>
                            <View style={styles.tripStat}>
                                <Ionicons name="time-outline" size={18} color={COLORS.gray600} />
                                <Text style={styles.tripStatValue}>{currentRequest.duration} min</Text>
                            </View>
                        </View>

                        {/* Buttons */}
                        <View style={styles.requestButtons}>
                            <TouchableOpacity style={styles.rejectBtn} onPress={rejectRequest}>
                                <Ionicons name="close" size={28} color={COLORS.error} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.acceptBtn} onPress={acceptRequest}>
                                <LinearGradient colors={[COLORS.secondary, COLORS.secondaryDark]} style={styles.acceptGradient}>
                                    <Text style={styles.acceptText}>ACCEPTER</Text>
                                    <Ionicons name="checkmark" size={24} color={COLORS.white} />
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Animated.View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.gray50 },

    // Header Overlay
    headerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    header: {
        paddingTop: 50,
        paddingBottom: 16,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    greeting: { fontSize: 18, fontWeight: 'bold' },
    status: { fontSize: 13, marginTop: 2 },
    avatarSmall: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 18, fontWeight: 'bold', color: COLORS.secondary },

    greetingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    levelBadge: { backgroundColor: '#FFD700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 12 },
    levelText: { fontSize: 10, fontWeight: 'bold', color: COLORS.black },

    // Stats
    statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    statCard: { alignItems: 'center', flex: 1 },
    statIcon: { fontSize: 18, marginBottom: 2 },
    statValue: { fontSize: 14, fontWeight: 'bold' },

    // Shortcuts
    shortcutsContainer: {
        position: 'absolute',
        bottom: 180,
        left: 12,
        right: 12,
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 16,
        paddingVertical: 10,
        elevation: 5,
        zIndex: 10,
    },
    shortcutsContent: { paddingHorizontal: 12, gap: 16 },
    shortcutBtn: { alignItems: 'center', minWidth: 55 },
    shortcutIcon: { fontSize: 22, marginBottom: 2 },
    shortcutLabel: { fontSize: 10, color: COLORS.gray600, fontWeight: '500' },
    dragHandle: { alignItems: 'center', paddingVertical: 6 },
    dragBar: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.gray600, opacity: 0.4 },

    // Toggle button
    toggleContainer: {
        position: 'absolute',
        bottom: 40,
        alignSelf: 'center',
        zIndex: 10,
    },
    toggleButton: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 15,
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    toggleText: { fontSize: 11, fontWeight: 'bold', color: COLORS.white, marginTop: 4 },

    // Request overlay
    requestOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingTop: 20,
        zIndex: 20,
    },
    requestCard: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
    },
    countdownContainer: { alignItems: 'center', marginBottom: 16 },
    countdownCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 3,
        justifyContent: 'center',
        alignItems: 'center',
    },
    countdownText: { fontSize: 20, fontWeight: 'bold' },

    // Passenger
    passengerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    passengerAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: COLORS.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
    },
    passengerAvatarText: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary },
    passengerInfo: { flex: 1, marginLeft: 12 },
    passengerName: { fontSize: 16, fontWeight: 'bold', color: COLORS.black },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    ratingText: { fontSize: 14, color: COLORS.gray600 },
    priceContainer: { alignItems: 'flex-end' },
    priceValue: { fontSize: 20, fontWeight: 'bold', color: COLORS.secondary },
    bonusText: { fontSize: 12, color: COLORS.primary, marginTop: 2 },

    // Route
    routeSection: { marginBottom: 16 },
    routePoint: { flexDirection: 'row', alignItems: 'flex-start' },
    dotGreen: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.secondary, marginTop: 4, marginRight: 12 },
    dotOrange: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.primary, marginTop: 4, marginRight: 12 },
    routeLine: { width: 2, height: 20, backgroundColor: COLORS.gray100, marginLeft: 5, marginVertical: 4 },
    routeInfo: { flex: 1 },
    routeLabel: { fontSize: 11, color: COLORS.gray600 },
    routeAddress: { fontSize: 14, color: COLORS.black, marginTop: 2 },

    // Trip stats
    tripStats: { flexDirection: 'row', justifyContent: 'center', gap: 30, marginBottom: 16 },
    tripStat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    tripStatValue: { fontSize: 14, color: COLORS.gray600 },

    // Buttons
    requestButtons: { flexDirection: 'row', gap: 12 },
    rejectBtn: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#FFEBEE',
        justifyContent: 'center',
        alignItems: 'center',
    },
    acceptBtn: { flex: 1 },
    acceptGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        borderRadius: 30,
        gap: 8,
    },
    acceptText: { fontSize: 18, fontWeight: 'bold', color: COLORS.white },
});
