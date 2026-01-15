import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, Dimensions, TouchableOpacity,
    Switch, Animated, FlatList, Alert, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDriverStore } from '../stores/driverStore';
import { useDriverWalletStore } from '../stores';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { rideService, driverService, supabase } from '../services/supabaseService';
import OSMMap from './OSMMap';
import * as Speech from 'expo-speech';

const { width, height } = Dimensions.get('window');

// Charte Graphique: Vert, Blanc, Orange Clémé
const COLORS = {
    primary: '#00C853',       // Vert principal
    primaryDark: '#00A040',   // Vert foncé
    orange: '#FF8C00',        // Orange clémé
    orangeLight: '#FFA500',   // Orange clair
    white: '#FFFFFF',         // Blanc
    black: '#1A1A2E',
    gray: '#6B7280',
    lightGray: '#F5F5F5',
    lightGreen: '#E8F5E9',    // Vert très clair
    warning: '#FF9500',
    error: '#FF3B30',
    success: '#34C759',
    blue: '#007AFF',
};

export default function DeliveryHome() {
    const router = useRouter();
    const { driver, isOnline, goOnline, goOffline, currentLocation, updateLocation, stats } = useDriverStore();
    const { checkAvailability } = useDriverWalletStore();
    const [orders, setOrders] = useState<any[]>([]);
    const [activeOrder, setActiveOrder] = useState<any>(null);
    const [deliveryStep, setDeliveryStep] = useState<'inactive' | 'to_pickup' | 'at_restaurant' | 'to_dropoff'>('inactive');
    const [onlineTime, setOnlineTime] = useState(0);

    const [ttsSettings, setTtsSettings] = useState({
        text: 'Nouvelle livraison disponible!',
        language: 'fr-FR',
        pitch: 1.1,
        rate: 1.0,
    });

    const slideAnim = useRef(new Animated.Value(height)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // Pulse animation for Go Online button
    useEffect(() => {
        if (!isOnline) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.08, duration: 800, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [isOnline]);

    // Online time counter
    useEffect(() => {
        let interval: any;
        if (isOnline) {
            interval = setInterval(() => setOnlineTime(t => t + 1), 60000);
        }
        return () => clearInterval(interval);
    }, [isOnline]);

    // Fetch TTS settings
    useEffect(() => {
        const fetchTtsSettings = async () => {
            try {
                const { data } = await supabase.from('app_settings').select('key, value')
                    .in('key', ['tts_text_delivery', 'tts_language', 'tts_pitch', 'tts_rate']);
                if (data) {
                    const settings: any = {};
                    data.forEach((s: { key: string; value: string }) => {
                        if (s.key === 'tts_text_delivery') settings.text = s.value;
                        if (s.key === 'tts_language') settings.language = s.value;
                        if (s.key === 'tts_pitch') settings.pitch = parseFloat(s.value) || 1.1;
                        if (s.key === 'tts_rate') settings.rate = parseFloat(s.value) || 1.0;
                    });
                    if (Object.keys(settings).length > 0) setTtsSettings(prev => ({ ...prev, ...settings }));
                }
            } catch (error) { console.log('TTS settings fetch failed'); }
        };
        fetchTtsSettings();
    }, []);

    const playAlertSound = () => {
        Speech.speak(ttsSettings.text, {
            language: ttsSettings.language,
            pitch: ttsSettings.pitch,
            rate: ttsSettings.rate,
        });
    };

    // Location tracking
    useEffect(() => {
        let subscription: any;
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;
            subscription = await Location.watchPositionAsync(
                { accuracy: Location.Accuracy.High, distanceInterval: 10 },
                (location) => {
                    updateLocation(location.coords.latitude, location.coords.longitude);
                    if (isOnline && driver) {
                        driverService.updateLocation(driver.id, location.coords.latitude, location.coords.longitude);
                    }
                }
            );
        })();
        return () => subscription?.remove();
    }, [isOnline, driver]);

    // Orders subscription
    useEffect(() => {
        if (!isOnline) { setOrders([]); return; }

        const fetchOrders = async () => {
            const { rides } = await rideService.getRequestedRides('delivery');
            if (rides) {
                setOrders(rides.map(r => ({
                    id: r.id, restaurant: 'Colis Express', address: r.pickup_address,
                    destination: r.dropoff_address, price: r.price,
                    distance: `${(r.distance_km || 0).toFixed(1)} km`, duration: `${(r.duration_min || 10)} min`,
                    pickupLat: r.pickup_lat, pickupLng: r.pickup_lng,
                    dropoffLat: r.dropoff_lat, dropoffLng: r.dropoff_lng
                })));
            }
        };
        fetchOrders();

        const channel = rideService.subscribeToNewRides((newRide) => {
            if (newRide.service_type === 'delivery') {
                playAlertSound();
                setOrders(prev => [{
                    id: newRide.id, restaurant: '🆕 Nouvelle livraison', address: newRide.pickup_address,
                    destination: newRide.dropoff_address, price: newRide.price,
                    distance: `${(newRide.distance_km || 0).toFixed(1)} km`, duration: `${(newRide.duration_min || 10)} min`,
                    pickupLat: newRide.pickup_lat, pickupLng: newRide.pickup_lng,
                    dropoffLat: newRide.dropoff_lat, dropoffLng: newRide.dropoff_lng
                }, ...prev]);
            }
        }, 'delivery');

        return () => { supabase.removeChannel(channel); };
    }, [isOnline]);

    // Bottom sheet animation
    useEffect(() => {
        if (isOnline && !activeOrder) {
            Animated.spring(slideAnim, { toValue: height * 0.55, useNativeDriver: true, friction: 10 }).start();
            Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
        } else {
            Animated.timing(slideAnim, { toValue: height, duration: 300, useNativeDriver: true }).start();
        }
    }, [isOnline, activeOrder]);

    const toggleOnline = () => {
        if (isOnline) {
            goOffline();
            setActiveOrder(null);
            setDeliveryStep('inactive');
            setOnlineTime(0);
        } else {
            // Vérification Solde Wallet
            const { canGoOnline, message } = checkAvailability();
            if (!canGoOnline) {
                Alert.alert(
                    '⚠️ Solde insuffisant',
                    message + '\n\nVeuillez recharger votre compte pour recevoir des livraisons.',
                    [
                        { text: 'Annuler', style: 'cancel' },
                        { text: 'Recharger', onPress: () => router.push('/wallet') },
                    ]
                );
                return;
            }
            goOnline();
        }
    };

    const handleAcceptOrder = async (order: any) => {
        if (!driver) return;
        const { error } = await rideService.acceptRide(order.id, driver.id);
        if (error) { Alert.alert('Erreur', 'Commande déjà prise.'); return; }
        setActiveOrder(order); setDeliveryStep('to_pickup');
    };

    const handleNextStep = async () => {
        if (!activeOrder) return;
        if (deliveryStep === 'to_pickup') { await rideService.updateRideStatus(activeOrder.id, 'arriving'); setDeliveryStep('at_restaurant'); }
        else if (deliveryStep === 'at_restaurant') { await rideService.updateRideStatus(activeOrder.id, 'in_progress'); setDeliveryStep('to_dropoff'); }
        else if (deliveryStep === 'to_dropoff') {
            await rideService.updateRideStatus(activeOrder.id, 'completed');
            Alert.alert('🎉 Bravo!', `Livraison terminée! +${activeOrder.price} F`, [{ text: 'Continuer', onPress: () => { setActiveOrder(null); setDeliveryStep('inactive'); } }]);
        }
    };

    const formatTime = (mins: number) => `${Math.floor(mins / 60)}h ${mins % 60}m`;

    const renderOrderItem = ({ item, index }: { item: any; index: number }) => (
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
            <TouchableOpacity style={styles.orderCard} onPress={() => handleAcceptOrder(item)} activeOpacity={0.9}>
                <LinearGradient colors={['#FFFFFF', '#FAFBFC']} style={styles.orderCardInner}>
                    {/* Price Badge */}
                    <View style={styles.priceBadge}>
                        <Text style={styles.priceText}>{item.price}</Text>
                        <Text style={styles.priceCurrency}>F</Text>
                    </View>

                    {/* Header */}
                    <View style={styles.orderHeader}>
                        <View style={styles.iconBox}>
                            <Text style={{ fontSize: 22 }}>📦</Text>
                        </View>
                        <View style={styles.orderInfo}>
                            <Text style={styles.orderTitle} numberOfLines={1}>{item.restaurant}</Text>
                            <Text style={styles.orderSubtitle} numberOfLines={1}>📍 {item.address}</Text>
                        </View>
                    </View>

                    {/* Route Preview */}
                    <View style={styles.routePreview}>
                        <View style={styles.routePoint}>
                            <View style={[styles.routeDot, { backgroundColor: COLORS.primary }]} />
                            <Text style={styles.routeLabel}>Retrait</Text>
                        </View>
                        <View style={styles.routeLine} />
                        <View style={styles.routePoint}>
                            <View style={[styles.routeDot, { backgroundColor: COLORS.blue }]} />
                            <Text style={styles.routeLabel}>Livraison</Text>
                        </View>
                    </View>

                    {/* Stats Row */}
                    <View style={styles.statsRow}>
                        <View style={styles.statChip}>
                            <Text style={{ fontSize: 14 }}>🧭</Text>
                            <Text style={styles.statChipText}>{item.distance}</Text>
                        </View>
                        <View style={styles.statChip}>
                            <Text style={{ fontSize: 14 }}>⏱️</Text>
                            <Text style={styles.statChipText}>{item.duration}</Text>
                        </View>
                    </View>

                    {/* Accept Button */}
                    <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.acceptBtn}>
                        <Text style={styles.acceptBtnText}>ACCEPTER</Text>
                        <Text style={{ fontSize: 20 }}>✅</Text>
                    </LinearGradient>
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
    );

    const mapMarkers = activeOrder
        ? [{ id: 'pickup', lat: activeOrder.pickupLat || 5.35, lng: activeOrder.pickupLng || -4.01, type: 'pickup' as const, label: activeOrder.restaurant },
        ...(deliveryStep === 'to_dropoff' ? [{ id: 'dropoff', lat: activeOrder.dropoffLat, lng: activeOrder.dropoffLng, type: 'dropoff' as const, label: 'Client' }] : [])]
        : orders.slice(0, 5).map(o => ({ id: o.id, lat: o.pickupLat, lng: o.pickupLng, type: 'pickup' as const, label: o.restaurant }));

    return (
        <View style={styles.container}>
            <OSMMap center={currentLocation || { lat: 5.3499, lng: -4.0166 }} markers={mapMarkers} style={StyleSheet.absoluteFill} />

            {/* Premium Stats Header - Brand Colors */}
            <View style={styles.headerContainer}>
                <LinearGradient colors={[COLORS.white, '#F8FFF8']} style={styles.glassHeader}>
                    <View style={styles.statsGrid}>
                        <View style={styles.statBlock}>
                            <View style={[styles.statIconBox, { backgroundColor: 'rgba(0,200,83,0.1)' }]}>
                                <Text style={{ fontSize: 18 }}>💰</Text>
                            </View>
                            <Text style={styles.statAmount}>{(stats?.todayEarnings || 0).toLocaleString()}</Text>
                            <Text style={styles.statUnit}>FCFA</Text>
                        </View>
                        <View style={styles.dividerVertical} />
                        <View style={styles.statBlock}>
                            <View style={[styles.statIconBox, { backgroundColor: 'rgba(255,140,0,0.1)' }]}>
                                <Text style={{ fontSize: 18 }}>⭐</Text>
                            </View>
                            <Text style={styles.statAmount}>{driver?.rating || 4.9}</Text>
                            <Text style={styles.statUnit}>NOTE</Text>
                        </View>
                        <View style={styles.dividerVertical} />
                        <View style={styles.statBlock}>
                            <View style={[styles.statIconBox, { backgroundColor: 'rgba(0,200,83,0.1)' }]}>
                                <Text style={{ fontSize: 18 }}>⏱️</Text>
                            </View>
                            <Text style={styles.statAmount}>{formatTime(onlineTime)}</Text>
                            <Text style={styles.statUnit}>EN LIGNE</Text>
                        </View>
                    </View>
                </LinearGradient>

                {/* Status Bar */}
                {!activeOrder && (
                    <View style={styles.statusBar}>
                        <View style={styles.statusLeft}>
                            <View style={[styles.statusIndicator, { backgroundColor: isOnline ? COLORS.primary : COLORS.gray }]}>
                                {isOnline && <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]} />}
                            </View>
                            <Text style={styles.statusLabel}>{isOnline ? 'EN SERVICE' : 'HORS LIGNE'}</Text>
                        </View>
                        <Switch value={isOnline} onValueChange={toggleOnline}
                            trackColor={{ false: '#E0E0E0', true: COLORS.primary }} thumbColor={COLORS.white}
                            ios_backgroundColor="#E0E0E0" />
                    </View>
                )}
            </View>

            {/* Floating Action Buttons */}
            {isOnline && !activeOrder && (
                <View style={styles.fabRow}>
                    <TouchableOpacity style={styles.fab} onPress={() => router.push('/wallet')}>
                        <LinearGradient colors={['#FFFFFF', '#F5F5F5']} style={styles.fabInner}>
                            <Text style={{ fontSize: 22 }}>💰</Text>
                        </LinearGradient>
                        <Text style={styles.fabLabel}>Wallet</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.fab} onPress={() => router.push('/analytics')}>
                        <LinearGradient colors={['#FFFFFF', '#F5F5F5']} style={styles.fabInner}>
                            <Text style={{ fontSize: 22 }}>📊</Text>
                        </LinearGradient>
                        <Text style={styles.fabLabel}>Stats</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.fab} onPress={() => router.push('/heat-map')}>
                        <LinearGradient colors={['#FFFFFF', '#F5F5F5']} style={styles.fabInner}>
                            <Text style={{ fontSize: 22 }}>🔥</Text>
                        </LinearGradient>
                        <Text style={styles.fabLabel}>Zones</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.fab} onPress={() => router.push('/support-chat')}>
                        <LinearGradient colors={['#FFFFFF', '#F5F5F5']} style={styles.fabInner}>
                            <Text style={{ fontSize: 22 }}>💬</Text>
                        </LinearGradient>
                        <Text style={styles.fabLabel}>Support</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Go Online Button (when offline) */}
            {!isOnline && (
                <View style={styles.goOnlineContainer}>
                    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                        <TouchableOpacity onPress={toggleOnline} activeOpacity={0.9}>
                            <LinearGradient colors={[COLORS.primary, '#00A040']} style={styles.goOnlineBtn}>
                                <Text style={{ fontSize: 32 }}>🚀</Text>
                                <Text style={styles.goOnlineText}>DÉMARRER</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>
                    <Text style={styles.goOnlineHint}>Appuyez pour recevoir des livraisons</Text>
                </View>
            )}

            {/* Active Delivery Card */}
            {activeOrder && (
                <View style={styles.activeCard}>
                    <LinearGradient colors={['#FFFFFF', '#F8FAFC']} style={styles.activeCardInner}>
                        <View style={styles.activeHeader}>
                            <View style={[styles.stepBadge, { backgroundColor: deliveryStep === 'to_dropoff' ? COLORS.blue : COLORS.primary }]}>
                                <Text style={styles.stepBadgeText}>
                                    {deliveryStep === 'to_pickup' && '🛵 EN ROUTE'}
                                    {deliveryStep === 'at_restaurant' && '📦 RÉCUPÉRATION'}
                                    {deliveryStep === 'to_dropoff' && '🎯 LIVRAISON'}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => setActiveOrder(null)}>
                                <Text style={{ fontSize: 28 }}>❌</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.activeInfo}>
                            <Text style={styles.activeTitle}>{activeOrder.restaurant}</Text>
                            <Text style={styles.activeSubtitle}>
                                {deliveryStep === 'to_dropoff' ? `🏠 ${activeOrder.destination}` : `📍 ${activeOrder.address}`}
                            </Text>
                            <Text style={styles.activePrice}>💰 {activeOrder.price} FCFA</Text>
                        </View>

                        <View style={styles.activeActions}>
                            <TouchableOpacity style={styles.navBtn} onPress={() => router.push('/delivery-navigation')}>
                                <Text style={{ fontSize: 22 }}>🧭</Text>
                                <Text style={styles.navBtnText}>GPS</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleNextStep} style={{ flex: 2 }}>
                                <LinearGradient colors={deliveryStep === 'to_dropoff' ? [COLORS.blue, '#0056D6'] : [COLORS.primary, COLORS.primaryDark]} style={styles.confirmBtn}>
                                    <Text style={styles.confirmBtnText}>
                                        {deliveryStep === 'to_pickup' && 'ARRIVÉ'}
                                        {deliveryStep === 'at_restaurant' && 'RÉCUPÉRÉ'}
                                        {deliveryStep === 'to_dropoff' && 'LIVRÉ ✓'}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>
                </View>
            )}

            {/* Orders Bottom Sheet */}
            <Animated.View style={[styles.bottomSheet, { transform: [{ translateY: slideAnim }] }]}>
                <View style={styles.sheetHandle} />
                <View style={styles.sheetHeader}>
                    <Text style={styles.sheetTitle}>📦 Commandes disponibles</Text>
                    <View style={styles.orderCount}>
                        <Text style={styles.orderCountText}>{orders.length}</Text>
                    </View>
                </View>
                <FlatList data={orders} renderItem={renderOrderItem} keyExtractor={item => item.id}
                    contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}
                    ListEmptyComponent={<View style={styles.emptyState}><Text style={styles.emptyText}>Aucune commande pour le moment</Text><Text style={styles.emptySubtext}>Les nouvelles commandes apparaîtront ici</Text></View>} />
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#E8F5E9' },

    // Header - Brand Colors
    headerContainer: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 35, left: 16, right: 16, gap: 10 },
    glassHeader: { borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(0,200,83,0.2)', ...Platform.select({ ios: { shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12 }, android: { elevation: 8 } }) },
    statsGrid: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
    statBlock: { alignItems: 'center', flex: 1 },
    statIconBox: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
    statIcon: { fontSize: 18, marginBottom: 4 },
    statAmount: { fontSize: 18, fontWeight: '800', color: COLORS.black },
    statUnit: { fontSize: 9, color: COLORS.gray, fontWeight: '600', letterSpacing: 1, marginTop: 2 },
    dividerVertical: { width: 1, height: 40, backgroundColor: 'rgba(0,200,83,0.2)' },

    // Status Bar
    statusBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.white, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 50, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 }, android: { elevation: 6 } }) },
    statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    statusIndicator: { width: 12, height: 12, borderRadius: 6 },
    pulseRing: { position: 'absolute', width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,200,83,0.3)', top: -4, left: -4 },
    statusLabel: { fontSize: 13, fontWeight: '700', color: COLORS.black, letterSpacing: 0.5 },

    // FAB Row
    fabRow: { position: 'absolute', bottom: height * 0.47, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-around' },
    fab: { alignItems: 'center' },
    fabInner: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 }, android: { elevation: 6 } }) },
    fabLabel: { fontSize: 10, fontWeight: '600', color: COLORS.black, marginTop: 6 },

    // Go Online
    goOnlineContainer: { position: 'absolute', bottom: 100, alignSelf: 'center', alignItems: 'center' },
    goOnlineBtn: { width: 140, height: 140, borderRadius: 70, justifyContent: 'center', alignItems: 'center', ...Platform.select({ ios: { shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 16 }, android: { elevation: 12 } }) },
    goOnlineText: { color: COLORS.white, fontSize: 14, fontWeight: '900', marginTop: 8, letterSpacing: 1 },
    goOnlineHint: { color: COLORS.gray, fontSize: 12, marginTop: 16 },

    // Order Card
    orderCard: { marginBottom: 14, borderRadius: 20, overflow: 'hidden', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 12 }, android: { elevation: 6 } }) },
    orderCardInner: { padding: 18, position: 'relative' },
    priceBadge: { position: 'absolute', top: 14, right: 14, flexDirection: 'row', alignItems: 'flex-end' },
    priceText: { fontSize: 24, fontWeight: '900', color: COLORS.primary },
    priceCurrency: { fontSize: 12, fontWeight: '700', color: COLORS.primary, marginBottom: 3, marginLeft: 2 },
    orderHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
    iconBox: { width: 48, height: 48, borderRadius: 14, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
    orderInfo: { flex: 1 },
    orderTitle: { fontSize: 16, fontWeight: '700', color: COLORS.black },
    orderSubtitle: { fontSize: 13, color: COLORS.gray, marginTop: 3 },
    routePreview: { flexDirection: 'row', alignItems: 'center', marginVertical: 12, paddingHorizontal: 8 },
    routePoint: { alignItems: 'center' },
    routeDot: { width: 10, height: 10, borderRadius: 5, marginBottom: 4 },
    routeLabel: { fontSize: 10, color: COLORS.gray, fontWeight: '500' },
    routeLine: { flex: 1, height: 2, backgroundColor: '#E0E0E0', marginHorizontal: 8 },
    statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
    statChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
    statChipText: { fontSize: 12, fontWeight: '600', color: COLORS.black },
    acceptBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 14, borderRadius: 14, gap: 8 },
    acceptBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '800', letterSpacing: 1 },

    // Active Card
    activeCard: { position: 'absolute', bottom: 30, left: 16, right: 16, borderRadius: 24, overflow: 'hidden', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16 }, android: { elevation: 12 } }) },
    activeCardInner: { padding: 20 },
    activeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    stepBadge: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
    stepBadgeText: { color: COLORS.white, fontSize: 12, fontWeight: '700' },
    activeInfo: { marginBottom: 18 },
    activeTitle: { fontSize: 20, fontWeight: '700', color: COLORS.black },
    activeSubtitle: { fontSize: 14, color: COLORS.gray, marginTop: 4 },
    activePrice: { fontSize: 18, fontWeight: '800', color: COLORS.primary, marginTop: 8 },
    activeActions: { flexDirection: 'row', gap: 12 },
    navBtn: { flex: 1, flexDirection: 'row', backgroundColor: COLORS.black, paddingVertical: 16, borderRadius: 14, justifyContent: 'center', alignItems: 'center', gap: 8 },
    navBtnText: { color: COLORS.white, fontWeight: '700' },
    confirmBtn: { paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
    confirmBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '800' },

    // Bottom Sheet
    bottomSheet: { position: 'absolute', top: 0, left: 0, right: 0, height: height, backgroundColor: COLORS.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 12, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.1, shadowRadius: 16 }, android: { elevation: 16 } }) },
    sheetHandle: { width: 40, height: 5, backgroundColor: '#E0E0E0', borderRadius: 3, alignSelf: 'center', marginBottom: 16 },
    sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sheetTitle: { fontSize: 18, fontWeight: '700', color: COLORS.black },
    orderCount: { backgroundColor: COLORS.primary, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    orderCountText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
    emptyState: { alignItems: 'center', paddingVertical: 40 },
    emptyText: { fontSize: 16, fontWeight: '600', color: COLORS.gray },
    emptySubtext: { fontSize: 13, color: COLORS.gray, marginTop: 6 },
});
