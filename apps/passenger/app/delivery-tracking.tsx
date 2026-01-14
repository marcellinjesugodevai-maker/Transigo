// =============================================
// TRANSIGO - DELIVERY TRACKING SCREEN
// Suivi en temps réel du livreur
// =============================================

import { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
    Alert,
    Linking,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@/components/Icon';
import OSMMap from '@/components/OSMMap';
import { COLORS, SPACING, RADIUS } from '@/constants';
import { useThemeStore, useLanguageStore } from '@/stores';
import { getTranslation } from '@/i18n/translations';
import { locationService } from '@/services/locationService';
import { rideService } from '@/services/supabaseService';

const { width, height } = Dimensions.get('window');

// Statuts de livraison
type DeliveryStatus = 'en_route_pickup' | 'at_pickup' | 'picked_up' | 'en_route_delivery' | 'arrived' | 'delivered';

const STATUS_CONFIG: Record<DeliveryStatus, { label: string; labelEn: string; icon: string; color: string }> = {
    en_route_pickup: { label: 'En route pour récupérer', labelEn: 'On the way to pickup', icon: '🏍', color: '#2196F3' },
    at_pickup: { label: 'Arrivé au point de collecte', labelEn: 'Arrived at pickup', icon: '📍', color: '#FF9800' },
    picked_up: { label: 'Colis récupéré', labelEn: 'Package picked up', icon: '📦', color: '#4CAF50' },
    en_route_delivery: { label: 'En route vers destination', labelEn: 'On the way to delivery', icon: '🚀', color: '#2196F3' },
    arrived: { label: 'Arrivé à destination', labelEn: 'Arrived at destination', icon: '🎯', color: '#FF9800' },
    delivered: { label: 'Livraison effectuée', labelEn: 'Delivered', icon: '✅', color: '#4CAF50' },
};

export default function DeliveryTrackingScreen() {
    const params = useLocalSearchParams();
    const { isDark, colors } = useThemeStore();
    const { language } = useLanguageStore();
    const t = (key: any) => getTranslation(key, language);

    // Paramètres de la livraison
    const pickupAddress = params.pickup_address as string || 'Point de collecte';
    const deliveryAddress = params.delivery_address as string || 'Destination';
    const pickupCoords = {
        latitude: Number(params.pickup_lat) || 5.3599,
        longitude: Number(params.pickup_lon) || -3.9870,
    };
    const deliveryCoords = {
        latitude: Number(params.delivery_lat) || 5.2539,
        longitude: Number(params.delivery_lon) || -3.9263,
    };
    const deliveryPersonName = params.delivery_person_name as string || 'Yao Paul';
    const deliveryPersonPhone = params.delivery_person_phone as string || '+225 05 00 00 00';
    const vehiclePlate = params.vehicle_plate as string || 'MC-5678-CI';

    // États
    const [status, setStatus] = useState<DeliveryStatus>('en_route_pickup');
    const [deliveryPersonLocation, setDeliveryPersonLocation] = useState({
        latitude: pickupCoords.latitude + 0.01,
        longitude: pickupCoords.longitude + 0.01,
    });
    const [routeCoords, setRouteCoords] = useState<{ latitude: number, longitude: number }[]>([]);
    const [eta, setEta] = useState(5);
    const [mapCenter, setMapCenter] = useState(pickupCoords);

    // Animation pulse
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Animation pulse pour le marqueur livreur
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
            ])
        ).start();

        // TODO: Obtenir le vrai ID du livreur depuis les params ou une requête Supabase
        // Pour l'instant on utilise un fallback ou un ID passé en paramètre
        const driverId = params.driver_id as string;

        let locationSubscription: any;

        if (driverId) {
            console.log("📡 Subscribing to delivery driver:", driverId);
            locationSubscription = rideService.subscribeToDriverLocation(driverId, (location) => {
                const { lat, lng } = location;
                setDeliveryPersonLocation({ latitude: lat, longitude: lng });

                // Recalculer ETA approximatif
                const target = status === 'en_route_pickup' || status === 'at_pickup' || status === 'picked_up'
                    ? pickupCoords
                    : deliveryCoords;

                const dist = rideService.haversineDistance(lat, lng, target.latitude, target.longitude);
                setEta(Math.ceil(dist * 3)); // ~20km/h
            });
        }

        // Calculer la route initiale
        fetchRoute();

        return () => {
            if (locationSubscription) locationSubscription.unsubscribe();
        };
    }, [status, params.driver_id]);

    useEffect(() => {
        // Recalculer la route selon le statut
        fetchRoute();
    }, [status]);

    const fetchRoute = async () => {
        try {
            const start = deliveryPersonLocation;
            const end = status === 'en_route_pickup' || status === 'at_pickup'
                ? pickupCoords
                : deliveryCoords;

            const route = await locationService.getRoute(
                start.latitude, start.longitude,
                end.latitude, end.longitude
            );
            if (route) {
                setRouteCoords(route.coordinates);
            }
        } catch (error) {
            console.error('Erreur route:', error);
        }
    };

    const handleCall = () => {
        Linking.openURL(`tel:${deliveryPersonPhone}`);
    };

    const handleMessage = () => {
        Alert.alert(
            language === 'fr' ? 'Message' : 'Message',
            language === 'fr' ? 'La messagerie sera bientôt disponible.' : 'Messaging coming soon.'
        );
    };

    const handleConfirmDelivery = () => {
        Alert.alert(
            language === 'fr' ? '✅ Livraison confirmée' : '✅ Delivery confirmed',
            language === 'fr'
                ? 'Merci d\'avoir utilisé TransiGo Delivery !'
                : 'Thank you for using TransiGo Delivery!',
            [{ text: 'OK', onPress: () => router.replace('/(tabs)/home') }]
        );
    };

    const handleReportIssue = () => {
        Alert.alert(
            language === 'fr' ? 'Signaler un problème' : 'Report an issue',
            language === 'fr' ? 'Quel est le problème ?' : 'What is the issue?',
            [
                { text: language === 'fr' ? 'Annuler' : 'Cancel', style: 'cancel' },
                { text: language === 'fr' ? 'Livreur en retard' : 'Driver late' },
                { text: language === 'fr' ? 'Autre problème' : 'Other issue' },
            ]
        );
    };

    const currentStatus = STATUS_CONFIG[status];
    const isDelivered = status === 'delivered';

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Carte */}
            <OSMMap
                style={styles.map}
                initialRegion={{
                    ...mapCenter,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                }}
                centerTo={deliveryPersonLocation}
                zoom={14}
                routeCoordinates={routeCoords}
                markers={[
                    { id: 'pickup', latitude: pickupCoords.latitude, longitude: pickupCoords.longitude },
                    { id: 'delivery', latitude: deliveryCoords.latitude, longitude: deliveryCoords.longitude },
                    { id: 'driver', latitude: deliveryPersonLocation.latitude, longitude: deliveryPersonLocation.longitude },
                ]}
            />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={[styles.backButton, { backgroundColor: colors.card }]}
                    onPress={() => router.back()}
                >
                    <Icon name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={[styles.statusBadge, { backgroundColor: currentStatus.color }]}>
                    <Text style={styles.statusIcon}>{currentStatus.icon}</Text>
                    <Text style={styles.statusText}>
                        {language === 'fr' ? currentStatus.label : currentStatus.labelEn}
                    </Text>
                </View>
            </View>

            {/* Panneau inférieur */}
            <View style={[styles.bottomPanel, { backgroundColor: colors.card }]}>
                {/* Handle */}
                <View style={[styles.handle, { backgroundColor: isDark ? '#444' : '#E0E0E0' }]} />

                {/* ETA */}
                {!isDelivered && (
                    <View style={styles.etaContainer}>
                        <Text style={styles.etaEmoji}>⏱️</Text>
                        <View>
                            <Text style={[styles.etaLabel, { color: colors.textSecondary }]}>
                                {language === 'fr' ? 'Arrivée estimée' : 'Estimated arrival'}
                            </Text>
                            <Text style={[styles.etaValue, { color: colors.text }]}>
                                {Math.round(eta)} min
                            </Text>
                        </View>
                    </View>
                )}

                {/* Infos Livreur */}
                <View style={styles.deliveryPersonCard}>
                    <View style={styles.deliveryPersonAvatar}>
                        <Text style={styles.avatarEmoji}>👨🏾</Text>
                    </View>
                    <View style={styles.deliveryPersonInfo}>
                        <Text style={[styles.deliveryPersonName, { color: colors.text }]}>
                            {deliveryPersonName}
                        </Text>
                        <Text style={[styles.vehicleInfo, { color: colors.textSecondary }]}>
                            🏍 {vehiclePlate}
                        </Text>
                    </View>
                    <View style={styles.contactButtons}>
                        <TouchableOpacity style={styles.callButton} onPress={handleCall}>
                            <Icon name="call" size={22} color="#4CAF50" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.messageButton} onPress={handleMessage}>
                            <Icon name="chatbubble" size={22} color={COLORS.primary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Adresses */}
                <View style={styles.addressesContainer}>
                    <View style={styles.addressRow}>
                        <View style={[styles.dot, { backgroundColor: '#4CAF50' }]} />
                        <View style={styles.addressInfo}>
                            <Text style={[styles.addressLabel, { color: colors.textSecondary }]}>
                                {language === 'fr' ? 'Collecte' : 'Pickup'}
                            </Text>
                            <Text style={[styles.addressText, { color: colors.text }]} numberOfLines={1}>
                                {pickupAddress}
                            </Text>
                        </View>
                        {(status === 'at_pickup' || status === 'picked_up') && (
                            <Text style={styles.checkmark}>✓</Text>
                        )}
                    </View>
                    <View style={styles.addressLine} />
                    <View style={styles.addressRow}>
                        <View style={[styles.dot, { backgroundColor: COLORS.primary }]} />
                        <View style={styles.addressInfo}>
                            <Text style={[styles.addressLabel, { color: colors.textSecondary }]}>
                                {language === 'fr' ? 'Livraison' : 'Delivery'}
                            </Text>
                            <Text style={[styles.addressText, { color: colors.text }]} numberOfLines={1}>
                                {deliveryAddress}
                            </Text>
                        </View>
                        {isDelivered && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                </View>

                {/* Boutons d'action */}
                {isDelivered ? (
                    <TouchableOpacity
                        style={styles.confirmButton}
                        onPress={handleConfirmDelivery}
                        activeOpacity={0.9}
                    >
                        <LinearGradient
                            colors={['#4CAF50', '#2E7D32']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.confirmGradient}
                        >
                            <Text style={styles.confirmText}>
                                {language === 'fr' ? '✓ Confirmer la réception' : '✓ Confirm receipt'}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[styles.reportButton, { borderColor: '#FF5252' }]}
                        onPress={handleReportIssue}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.reportText}>
                            {language === 'fr' ? '⚠️ Signaler un problème' : '⚠️ Report an issue'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
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

    // Header
    header: {
        position: 'absolute',
        top: 50,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        gap: SPACING.md,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    statusBadge: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 25,
        gap: 8,
    },
    statusIcon: {
        fontSize: 20,
    },
    statusText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '600',
    },

    // Bottom Panel
    bottomPanel: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: SPACING.sm,
        paddingHorizontal: SPACING.lg,
        paddingBottom: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 10,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: SPACING.md,
    },

    // ETA
    etaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        marginBottom: SPACING.md,
        padding: SPACING.sm,
        backgroundColor: '#FFF3E0',
        borderRadius: RADIUS.md,
    },
    etaEmoji: {
        fontSize: 28,
    },
    etaLabel: {
        fontSize: 12,
    },
    etaValue: {
        fontSize: 20,
        fontWeight: 'bold',
    },

    // Delivery Person
    deliveryPersonCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.md,
        paddingBottom: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    deliveryPersonAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#FF9800' + '30',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarEmoji: {
        fontSize: 28,
    },
    deliveryPersonInfo: {
        flex: 1,
        marginLeft: SPACING.sm,
    },
    deliveryPersonName: {
        fontSize: 16,
        fontWeight: '600',
    },
    vehicleInfo: {
        fontSize: 13,
        marginTop: 2,
    },
    contactButtons: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    callButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#E8F5E9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    messageButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FFF3E0',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Addresses
    addressesContainer: {
        marginBottom: SPACING.lg,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    addressInfo: {
        flex: 1,
    },
    addressLabel: {
        fontSize: 11,
    },
    addressText: {
        fontSize: 14,
        fontWeight: '500',
    },
    addressLine: {
        width: 2,
        height: 20,
        backgroundColor: '#E0E0E0',
        marginLeft: 5,
        marginVertical: 4,
    },
    checkmark: {
        fontSize: 18,
        color: '#4CAF50',
    },

    // Buttons
    confirmButton: {},
    confirmGradient: {
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
    },
    confirmText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    reportButton: {
        paddingVertical: 14,
        borderRadius: 30,
        alignItems: 'center',
        borderWidth: 1,
    },
    reportText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FF5252',
    },
});
