// =============================================
// TRANSIGO FOOD - SUIVI COMMANDE (PREMIUM)
// Tracking temps réel avec design moderne
// =============================================

import { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
    Linking,
    Alert,
    StatusBar,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@/components/Icon';
import OSMMap from '@/components/OSMMap';
import { COLORS, SPACING, RADIUS } from '@/constants';
import { useThemeStore, useLanguageStore } from '@/stores';
import { getTranslation } from '@/i18n/translations';
import { locationService } from '@/services/locationService';

const { width, height } = Dimensions.get('window');

type OrderStatus = 'preparing' | 'ready' | 'picked_up' | 'on_the_way' | 'arriving' | 'delivered';

const ORDER_STATUSES: { key: OrderStatus; label: string; labelEn: string; icon: string; color: string }[] = [
    { key: 'preparing', label: 'Préparation', labelEn: 'Preparing', icon: '👨‍🍳', color: '#FF9800' },
    { key: 'ready', label: 'Prêt', labelEn: 'Ready', icon: '✅', color: '#4CAF50' },
    { key: 'picked_up', label: 'Récupéré', labelEn: 'Picked up', icon: '📦', color: '#2196F3' },
    { key: 'on_the_way', label: 'En route', labelEn: 'On the way', icon: '🏍', color: '#9C27B0' },
    { key: 'arriving', label: 'Arrivée', labelEn: 'Arriving', icon: '🎯', color: '#E91E63' },
    { key: 'delivered', label: 'Livré', labelEn: 'Delivered', icon: '🎉', color: '#4CAF50' },
];

export default function FoodTrackingScreen() {
    const params = useLocalSearchParams();
    const { isDark, colors } = useThemeStore();
    const { language } = useLanguageStore();
    const t = (key: any) => getTranslation(key, language);

    // Paramètres
    const restaurantName = params.restaurant_name as string || 'Restaurant';
    const restaurantImage = params.restaurant_image as string || '🍽️';
    const deliveryAddress = params.delivery_address as string || 'Adresse';
    const deliveryCoords = {
        latitude: Number(params.delivery_lat) || 5.3599,
        longitude: Number(params.delivery_lon) || -3.9870,
    };
    const total = Number(params.total) || 0;
    const riderName = params.rider_name as string || 'Livreur';
    const riderPhone = params.rider_phone as string || '';
    const riderRating = params.rider_rating as string || '4.8';
    const riderPlate = params.rider_plate as string || '';

    // Position simulée du restaurant
    const restaurantCoords = {
        latitude: deliveryCoords.latitude + 0.015,
        longitude: deliveryCoords.longitude + 0.01,
    };

    // États
    const [status, setStatus] = useState<OrderStatus>('preparing');
    const [riderLocation, setRiderLocation] = useState(restaurantCoords);
    const [eta, setEta] = useState(25);
    const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);

    // Animations
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const slideAnim = useRef(new Animated.Value(height)).current;

    useEffect(() => {
        // Animation pulse
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            ])
        ).start();

        // Slide in animation
        Animated.spring(slideAnim, {
            toValue: 0,
            tension: 50,
            friction: 8,
            useNativeDriver: true,
        }).start();

        // Progression des statuts
        const statusTimers = [
            setTimeout(() => setStatus('ready'), 5000),
            setTimeout(() => setStatus('picked_up'), 10000),
            setTimeout(() => setStatus('on_the_way'), 13000),
            setTimeout(() => setStatus('arriving'), 25000),
            setTimeout(() => setStatus('delivered'), 30000),
        ];

        // Simulation du mouvement du livreur
        const moveInterval = setInterval(() => {
            setRiderLocation(prev => {
                const targetLat = deliveryCoords.latitude;
                const targetLon = deliveryCoords.longitude;

                const newLat = prev.latitude + (targetLat - prev.latitude) * 0.05;
                const newLon = prev.longitude + (targetLon - prev.longitude) * 0.05;

                return { latitude: newLat, longitude: newLon };
            });
            setEta(prev => Math.max(1, prev - 0.5));
        }, 2000);

        fetchRoute();

        return () => {
            statusTimers.forEach(t => clearTimeout(t));
            clearInterval(moveInterval);
        };
    }, []);

    useEffect(() => {
        fetchRoute();
    }, [status]);

    const fetchRoute = async () => {
        try {
            const route = await locationService.getRoute(
                riderLocation.latitude, riderLocation.longitude,
                deliveryCoords.latitude, deliveryCoords.longitude
            );
            if (route) {
                setRouteCoords(route.coordinates);
            }
        } catch (error) {
            console.error('Erreur route:', error);
        }
    };

    const handleCallRider = () => {
        if (riderPhone) {
            Linking.openURL(`tel:${riderPhone}`);
        }
    };

    const handleMessage = () => {
        Alert.alert('💬', language === 'fr' ? 'Messagerie bientôt disponible' : 'Messaging coming soon');
    };

    const handleConfirmDelivery = () => {
        router.push({
            pathname: '/food/rating',
            params: {
                restaurant_name: restaurantName,
                rider_name: riderName,
                total: total,
            }
        });
    };

    const currentStatusIndex = ORDER_STATUSES.findIndex(s => s.key === status);
    const currentStatusData = ORDER_STATUSES[currentStatusIndex];
    const isDelivered = status === 'delivered';

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="light-content" />

            {/* Carte */}
            <OSMMap
                style={styles.map}
                initialRegion={{
                    ...deliveryCoords,
                    latitudeDelta: 0.03,
                    longitudeDelta: 0.03,
                }}
                centerTo={isDelivered ? deliveryCoords : riderLocation}
                zoom={15}
                routeCoordinates={routeCoords}
                markers={[
                    { id: 'restaurant', latitude: restaurantCoords.latitude, longitude: restaurantCoords.longitude },
                    { id: 'delivery', latitude: deliveryCoords.latitude, longitude: deliveryCoords.longitude },
                    { id: 'rider', latitude: riderLocation.latitude, longitude: riderLocation.longitude },
                ]}
            />

            {/* Header flottant */}
            <View style={styles.floatingHeader}>
                <TouchableOpacity
                    style={[styles.backButton, { backgroundColor: colors.card }]}
                    onPress={() => router.replace('/(tabs)/home')}
                >
                    <Icon name="close" size={22} color={colors.text} />
                </TouchableOpacity>

                {/* Status Badge */}
                <View style={[styles.statusBadge, { backgroundColor: currentStatusData.color }]}>
                    <Text style={styles.statusBadgeIcon}>{currentStatusData.icon}</Text>
                    <Text style={styles.statusBadgeText}>
                        {language === 'fr' ? currentStatusData.label : currentStatusData.labelEn}
                    </Text>
                </View>
            </View>

            {/* Panneau inférieur */}
            <Animated.View style={[
                styles.bottomPanel,
                {
                    backgroundColor: colors.card,
                    transform: [{ translateY: slideAnim }]
                }
            ]}>
                <View style={[styles.handle, { backgroundColor: isDark ? '#444' : '#E0E0E0' }]} />

                {/* Timeline Premium */}
                <View style={styles.timeline}>
                    <View style={styles.timelineTrack}>
                        <View style={[
                            styles.timelineProgress,
                            { width: `${(currentStatusIndex / (ORDER_STATUSES.length - 1)) * 100}%` }
                        ]} />
                    </View>
                    <View style={styles.timelineSteps}>
                        {ORDER_STATUSES.map((s, index) => {
                            const isActive = index <= currentStatusIndex;
                            const isCurrent = s.key === status;
                            return (
                                <View key={s.key} style={styles.timelineStep}>
                                    <Animated.View style={[
                                        styles.timelineDot,
                                        { backgroundColor: isActive ? s.color : isDark ? '#333' : '#E0E0E0' },
                                        isCurrent && { transform: [{ scale: pulseAnim }] }
                                    ]}>
                                        <Text style={styles.timelineDotIcon}>{s.icon}</Text>
                                    </Animated.View>
                                    <Text style={[
                                        styles.timelineLabel,
                                        { color: isActive ? colors.text : colors.textSecondary }
                                    ]} numberOfLines={1}>
                                        {language === 'fr' ? s.label : s.labelEn}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* ETA Card */}
                {!isDelivered && (
                    <LinearGradient
                        colors={['#FF5722', '#E64A19']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.etaCard}
                    >
                        <View style={styles.etaLeft}>
                            <Text style={styles.etaIcon}>⏱️</Text>
                            <View>
                                <Text style={styles.etaLabel}>
                                    {language === 'fr' ? 'Arrivée estimée' : 'Estimated arrival'}
                                </Text>
                                <Text style={styles.etaValue}>{Math.round(eta)} min</Text>
                            </View>
                        </View>
                        <View style={styles.etaDivider} />
                        <View style={styles.etaRight}>
                            <Text style={styles.etaIcon}>💰</Text>
                            <View>
                                <Text style={styles.etaLabel}>Total</Text>
                                <Text style={styles.etaValue}>{total.toLocaleString('fr-FR')} F</Text>
                            </View>
                        </View>
                    </LinearGradient>
                )}

                {/* Rider Card */}
                <View style={[styles.riderCard, { backgroundColor: isDark ? '#1E1E1E' : '#F8F8F8' }]}>
                    <View style={styles.riderLeft}>
                        <View style={styles.riderAvatar}>
                            <Text style={styles.riderAvatarEmoji}>👨🏾</Text>
                        </View>
                        <View style={styles.riderInfo}>
                            <Text style={[styles.riderName, { color: colors.text }]}>{riderName}</Text>
                            <View style={styles.riderMeta}>
                                <Text style={styles.riderRating}>⭐ {riderRating}</Text>
                                <Text style={[styles.riderVehicle, { color: colors.textSecondary }]}>
                                    🏍 {riderPlate}
                                </Text>
                            </View>
                        </View>
                    </View>
                    <View style={styles.riderActions}>
                        <TouchableOpacity
                            style={[styles.riderActionBtn, { backgroundColor: '#E8F5E9' }]}
                            onPress={handleCallRider}
                        >
                            <Icon name="call" size={22} color="#4CAF50" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.riderActionBtn, { backgroundColor: '#FFF3E0' }]}
                            onPress={handleMessage}
                        >
                            <Icon name="chatbubble" size={22} color="#FF5722" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Address */}
                <View style={styles.addressCard}>
                    <View style={styles.addressRow}>
                        <View style={[styles.addressDot, { backgroundColor: '#4CAF50' }]} />
                        <View style={styles.addressInfo}>
                            <Text style={[styles.addressLabel, { color: colors.textSecondary }]}>
                                {restaurantImage} {restaurantName}
                            </Text>
                        </View>
                        {currentStatusIndex >= 2 && <Text style={styles.checkMark}>✓</Text>}
                    </View>
                    <View style={[styles.addressLine, { backgroundColor: isDark ? '#333' : '#E0E0E0' }]} />
                    <View style={styles.addressRow}>
                        <View style={[styles.addressDot, { backgroundColor: '#FF5722' }]} />
                        <View style={styles.addressInfo}>
                            <Text style={[styles.addressText, { color: colors.text }]} numberOfLines={1}>
                                📍 {deliveryAddress}
                            </Text>
                        </View>
                        {isDelivered && <Text style={styles.checkMark}>✓</Text>}
                    </View>
                </View>

                {/* Action Button */}
                {isDelivered ? (
                    <TouchableOpacity
                        style={styles.confirmButton}
                        onPress={handleConfirmDelivery}
                        activeOpacity={0.95}
                    >
                        <LinearGradient
                            colors={['#4CAF50', '#2E7D32']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.confirmGradient}
                        >
                            <Text style={styles.confirmEmoji}>🎉</Text>
                            <Text style={styles.confirmText}>
                                {language === 'fr' ? 'Confirmer la réception' : 'Confirm delivery'}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[styles.helpButton, { borderColor: isDark ? '#444' : '#E0E0E0' }]}
                        onPress={() => Alert.alert('🆘', language === 'fr' ? 'Support bientôt disponible' : 'Support coming soon')}
                    >
                        <Text style={[styles.helpText, { color: colors.textSecondary }]}>
                            {language === 'fr' ? '🆘 Besoin d\'aide ?' : '🆘 Need help?'}
                        </Text>
                    </TouchableOpacity>
                )}
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },

    // Floating Header
    floatingHeader: {
        position: 'absolute',
        top: 50,
        left: SPACING.lg,
        right: SPACING.lg,
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    statusBadge: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 25,
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    statusBadgeIcon: {
        fontSize: 20,
    },
    statusBadgeText: {
        color: COLORS.white,
        fontSize: 15,
        fontWeight: '700',
    },

    // Bottom Panel
    bottomPanel: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingTop: SPACING.sm,
        paddingHorizontal: SPACING.lg,
        paddingBottom: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 12,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: SPACING.md,
    },

    // Timeline
    timeline: {
        marginBottom: SPACING.md,
    },
    timelineTrack: {
        height: 4,
        backgroundColor: '#E0E0E0',
        borderRadius: 2,
        marginBottom: SPACING.sm,
    },
    timelineProgress: {
        height: '100%',
        backgroundColor: '#FF5722',
        borderRadius: 2,
    },
    timelineSteps: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    timelineStep: {
        alignItems: 'center',
        width: (width - 2 * SPACING.lg) / 6,
    },
    timelineDot: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    timelineDotIcon: {
        fontSize: 16,
    },
    timelineLabel: {
        fontSize: 9,
        fontWeight: '600',
        textAlign: 'center',
    },

    // ETA
    etaCard: {
        flexDirection: 'row',
        padding: SPACING.md,
        borderRadius: 16,
        marginBottom: SPACING.md,
    },
    etaLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    etaRight: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        justifyContent: 'flex-end',
    },
    etaDivider: {
        width: 1,
        backgroundColor: 'rgba(255,255,255,0.3)',
        marginHorizontal: SPACING.md,
    },
    etaIcon: {
        fontSize: 28,
    },
    etaLabel: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.8)',
    },
    etaValue: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.white,
    },

    // Rider
    riderCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: SPACING.md,
        borderRadius: 16,
        marginBottom: SPACING.md,
    },
    riderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    riderAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#FF572230',
        justifyContent: 'center',
        alignItems: 'center',
    },
    riderAvatarEmoji: {
        fontSize: 26,
    },
    riderInfo: {
        marginLeft: SPACING.sm,
        flex: 1,
    },
    riderName: {
        fontSize: 16,
        fontWeight: '700',
    },
    riderMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 2,
    },
    riderRating: {
        fontSize: 13,
        fontWeight: '600',
    },
    riderVehicle: {
        fontSize: 12,
    },
    riderActions: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    riderActionBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Address
    addressCard: {
        marginBottom: SPACING.md,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    addressDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    addressLine: {
        width: 2,
        height: 24,
        marginLeft: 5,
        marginVertical: 4,
    },
    addressInfo: {
        flex: 1,
        marginLeft: SPACING.sm,
    },
    addressLabel: {
        fontSize: 13,
    },
    addressText: {
        fontSize: 14,
        fontWeight: '500',
    },
    checkMark: {
        fontSize: 18,
        color: '#4CAF50',
    },

    // Buttons
    confirmButton: {},
    confirmGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        borderRadius: 30,
        gap: 10,
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 6,
    },
    confirmEmoji: {
        fontSize: 24,
    },
    confirmText: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
    helpButton: {
        paddingVertical: 14,
        borderRadius: 30,
        alignItems: 'center',
        borderWidth: 1,
    },
    helpText: {
        fontSize: 14,
        fontWeight: '500',
    },
});
