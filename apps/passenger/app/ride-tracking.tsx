// =============================================
// TRANSIGO - RIDE TRACKING SCREEN
// Suivi en temps réel du chauffeur
// =============================================

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
    Linking,
    Alert,
    Image,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@/components/Icon';
import OSMMap from '@/components/OSMMap';
import { COLORS, SPACING, RADIUS } from '@/constants';
import { useRideStore, useThemeStore, useLanguageStore } from '@/stores';
import { getTranslation } from '@/i18n/translations';
import { locationService } from '@/services/locationService';
import { rideService } from '@/services/supabaseService';
import { carpoolService } from '@/services/carpoolService';

const { width, height } = Dimensions.get('window');

// Helper function to convert color names to hex
const getColorHex = (colorName: string): string => {
    const colors: Record<string, string> = {
        'blanc': '#FFFFFF',
        'white': '#FFFFFF',
        'noir': '#000000',
        'black': '#000000',
        'gris': '#808080',
        'grise': '#808080',
        'grey': '#808080',
        'gray': '#808080',
        'rouge': '#FF0000',
        'red': '#FF0000',
        'bleu': '#0066FF',
        'blue': '#0066FF',
        'vert': '#00AA00',
        'green': '#00AA00',
        'jaune': '#FFD700',
        'yellow': '#FFD700',
        'orange': '#FF9800',
        'marron': '#8B4513',
        'brown': '#8B4513',
        'beige': '#F5F5DC',
        'argent': '#C0C0C0',
        'silver': '#C0C0C0',
    };
    return colors[colorName.toLowerCase()] || '#808080';
};

export default function RideTrackingScreen() {
    const params = useLocalSearchParams();
    const { isDark, colors } = useThemeStore();
    const { language } = useLanguageStore();
    const t = (key: any) => getTranslation(key, language);

    const {
        pickup,
        dropoff,
        pickupAddress,
        dropoffAddress,
        assignedDriver,
        driverEta,
        driverLocation,
        rideStatus,
        updateDriverLocation,
        updateDriverEta,
        driverArriving,
        driverArrived,
        startRide,
        completeRide,
        cancelRide,
    } = useRideStore();

    const [routeToPickup, setRouteToPickup] = useState<{ latitude: number; longitude: number }[]>([]);
    const [routeToDestination, setRouteToDestination] = useState<{ latitude: number; longitude: number }[]>([]);
    const slideAnim = useRef(new Animated.Value(0)).current;
    const routeFetchedRef = useRef(false); // Empêche les recalculs de route

    // Coordonnées
    const pickupCoords = pickup || {
        latitude: Number(params.pickup_lat) || 5.3599,
        longitude: Number(params.pickup_lon) || -3.9870,
    };

    const dropoffCoords = dropoff || {
        latitude: Number(params.dest_lat) || 5.2539,
        longitude: Number(params.dest_lon) || -3.9263,
    };

    // Position initiale du chauffeur (simulée) - stockée dans un ref pour la stabilité
    const initialDriverPos = useRef({
        latitude: pickupCoords.latitude + 0.015,
        longitude: pickupCoords.longitude + 0.01,
    }).current;

    const [simulatedDriverPos, setSimulatedDriverPos] = useState(initialDriverPos);

    const [currentEta, setCurrentEta] = useState(driverEta || 4);
    const [statusMessage, setStatusMessage] = useState('');
    const currentRouteIndexRef = useRef(0); // Index du point actuel sur la route

    // Mémoriser les marqueurs pour éviter les re-rendus
    const markers = React.useMemo(() => [
        { id: 'pickup', latitude: pickupCoords.latitude, longitude: pickupCoords.longitude },
        { id: 'driver', latitude: simulatedDriverPos.latitude, longitude: simulatedDriverPos.longitude },
    ], [simulatedDriverPos.latitude, simulatedDriverPos.longitude]);

    // Chargement données Covoiturage si nécessaire
    useEffect(() => {
        if (params.type === 'shared' && params.rideId) {
            const loadSharedRide = async () => {
                const { ride } = await carpoolService.getRide(params.rideId as string);
                if (ride) {
                    // Update store with shared ride info specifically for tracking
                    // We map the shared ride driver to the store's assignedDriver structure
                    useRideStore.getState().setAssignedDriver({
                        id: ride.driver_id || ride.creator_id,
                        firstName: ride.driver_name?.split(' ')[0] || 'Chauffeur',
                        lastName: ride.driver_name?.split(' ').slice(1).join(' ') || '',
                        phone: ride.driver_phone || '',
                        rating: 4.8, // Mock or fetch real
                        totalRides: 100,
                        vehicleBrand: ride.vehicle_type || 'Voiture',
                        vehicleModel: '',
                        vehicleColor: '',
                        vehiclePlate: '',
                        profilePhotoUrl: null
                    });

                    // Also update pickup/dropoff if needed
                    // ...
                }
            };
            loadSharedRide();
        }
    }, [params.type, params.rideId]);

    useEffect(() => {
        // Animation d'entrée
        Animated.spring(slideAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 50,
            friction: 8,
        }).start();

        // Calculer la route chauffeur -> pickup UNE SEULE FOIS
        if (!routeFetchedRef.current) {
            routeFetchedRef.current = true;
            fetchRouteToPickup();
        }
    }, []);

    // Suivi réel du chauffeur via Supabase
    useEffect(() => {
        if (!assignedDriver?.id) return;

        console.log("Subscribing to driver location:", assignedDriver.id);
        const subscription = rideService.subscribeToDriverLocation(assignedDriver.id, (location) => {
            console.log("Real-time driver location update:", location);

            // Mise à jour de la position du chauffeur
            setSimulatedDriverPos({
                latitude: location.lat,
                longitude: location.lng
            });

            // Recalculer ETA approximatif (distance à vol d'oiseau * 2 min/km + trafic)
            const dist = rideService.haversineDistance(
                location.lat, location.lng,
                pickupCoords.latitude, pickupCoords.longitude
            );
            setCurrentEta(Math.ceil(dist * 3)); // ~20km/h en ville

            // Mise à jour dans le store global
            updateDriverLocation({ latitude: location.lat, longitude: location.lng });
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [assignedDriver?.id]);

    // Calcul initial de la route (pour affichage seulement)
    useEffect(() => {
        if (!routeFetchedRef.current) {
            routeFetchedRef.current = true;
            fetchRouteToPickup();
        }
    }, []);

    // Mettre à jour le message de statut
    useEffect(() => {
        if (currentEta > 2) {
            setStatusMessage(language === 'fr'
                ? `${assignedDriver?.firstName || 'Votre chauffeur'} arrive dans ${Math.ceil(currentEta)} min`
                : `${assignedDriver?.firstName || 'Your driver'} arrives in ${Math.ceil(currentEta)} min`);
        } else if (currentEta > 0) {
            driverArriving();
            setStatusMessage(language === 'fr'
                ? `${assignedDriver?.firstName || 'Votre chauffeur'} est presque arrivé`
                : `${assignedDriver?.firstName || 'Your driver'} is almost there`);
        } else {
            driverArrived();
            setStatusMessage(language === 'fr'
                ? `${assignedDriver?.firstName || 'Votre chauffeur'} est arrivé !`
                : `${assignedDriver?.firstName || 'Your driver'} has arrived!`);
        }
    }, [currentEta]);

    const fetchRouteToPickup = async () => {
        const route = await locationService.getRoute(
            initialDriverPos.latitude,
            initialDriverPos.longitude,
            pickupCoords.latitude,
            pickupCoords.longitude
        );
        if (route) {
            setRouteToPickup(route.coordinates);
        }
    };

    const handleCall = () => {
        if (assignedDriver?.phone) {
            Linking.openURL(`tel:${assignedDriver.phone}`);
        }
    };

    const handleMessage = () => {
        Alert.alert(
            language === 'fr' ? 'Message' : 'Message',
            language === 'fr'
                ? 'La fonctionnalité de chat sera bientôt disponible'
                : 'Chat feature coming soon'
        );
    };

    const handleEmergency = () => {
        Alert.alert(
            language === 'fr' ? '🚨 Urgence' : '🚨 Emergency',
            language === 'fr'
                ? 'Voulez-vous contacter les services d\'urgence ?'
                : 'Do you want to contact emergency services?',
            [
                { text: language === 'fr' ? 'Annuler' : 'Cancel', style: 'cancel' },
                { text: language === 'fr' ? 'Appeler 170' : 'Call 911', onPress: () => Linking.openURL('tel:170') },
            ]
        );
    };

    const handleCancelRide = () => {
        Alert.alert(
            language === 'fr' ? 'Annuler la course ?' : 'Cancel ride?',
            language === 'fr'
                ? 'Des frais d\'annulation peuvent s\'appliquer'
                : 'Cancellation fees may apply',
            [
                { text: language === 'fr' ? 'Non' : 'No', style: 'cancel' },
                {
                    text: language === 'fr' ? 'Oui, annuler' : 'Yes, cancel',
                    style: 'destructive',
                    onPress: () => {
                        cancelRide();
                        router.replace('/(tabs)/home');
                    }
                },
            ]
        );
    };

    const handleStartRide = () => {
        startRide();
        // Naviguer vers l'écran de course en cours
        router.replace({
            pathname: '/ride-in-progress',
            params: {
                pickup_lat: pickupCoords.latitude,
                pickup_lon: pickupCoords.longitude,
                dest_lat: dropoffCoords.latitude,
                dest_lon: dropoffCoords.longitude,
            }
        });
    };

    const mapRegion = {
        latitude: (pickupCoords.latitude + simulatedDriverPos.latitude) / 2,
        longitude: (pickupCoords.longitude + simulatedDriverPos.longitude) / 2,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
    };

    const slideTranslate = slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [300, 0],
    });

    const driver = assignedDriver || {
        firstName: 'Kouassi',
        lastName: 'Jean-Marc',
        phone: '+225 07 00 00 00',
        rating: 4.8,
        totalRides: 234,
        vehicleBrand: 'Toyota',
        vehicleModel: 'Corolla',
        vehicleColor: 'Grise',
        vehiclePlate: 'AB-1234-CI',
        photo: null, // URL from Supabase Storage
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Carte avec chauffeur */}
            <OSMMap
                style={styles.map}
                initialRegion={mapRegion}
                routeCoordinates={routeToPickup}
                markers={markers}
            />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={[styles.headerButton, { backgroundColor: colors.card }]}
                    onPress={() => router.back()}
                >
                    <Icon name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>

                <View style={[styles.statusBadge, { backgroundColor: COLORS.primary }]}>
                    <Text style={styles.statusBadgeText}>
                        {rideStatus === 'arrived'
                            ? (language === 'fr' ? 'Arrivé' : 'Arrived')
                            : (language === 'fr' ? 'En route' : 'On the way')}
                    </Text>
                </View>

                <TouchableOpacity
                    style={[styles.headerButton, { backgroundColor: '#FF5252' }]}
                    onPress={handleEmergency}
                >
                    <Text style={styles.emergencyEmoji}>🚨</Text>
                </TouchableOpacity>
            </View>

            {/* Panel inférieur */}
            <Animated.View
                style={[
                    styles.bottomPanel,
                    { backgroundColor: colors.card, transform: [{ translateY: slideTranslate }] }
                ]}
            >
                {/* Handle */}
                <View style={[styles.handle, { backgroundColor: isDark ? '#333' : '#E0E0E0' }]} />

                {/* Message de statut */}
                <View style={styles.statusContainer}>
                    <Text style={[styles.statusMessage, { color: colors.text }]}>
                        {statusMessage}
                    </Text>
                    {currentEta > 0 && (
                        <View style={styles.etaContainer}>
                            <Text style={styles.etaNumber}>{Math.ceil(currentEta)}</Text>
                            <Text style={[styles.etaLabel, { color: colors.textSecondary }]}>min</Text>
                        </View>
                    )}
                </View>

                {/* Infos chauffeur */}
                <View style={[styles.driverCard, { backgroundColor: isDark ? '#252525' : colors.background }]}>
                    <View style={styles.driverInfo}>
                        {/* Avatar - Photo de profil ou emoji fallback */}
                        <View style={styles.driverAvatar}>
                            {driver.photo ? (
                                <Image
                                    source={{ uri: driver.photo }}
                                    style={styles.profilePhoto}
                                />
                            ) : (
                                <Text style={styles.avatarEmoji}>👨🏾</Text>
                            )}
                        </View>

                        {/* Détails */}
                        <View style={styles.driverDetails}>
                            <Text style={[styles.driverName, { color: colors.text }]}>
                                {driver.firstName} {driver.lastName}
                            </Text>
                            <View style={styles.ratingRow}>
                                <Text style={styles.ratingStar}>⭐</Text>
                                <Text style={[styles.ratingText, { color: colors.text }]}>
                                    {driver.rating}
                                </Text>
                                <Text style={[styles.ratingCount, { color: colors.textSecondary }]}>
                                    ({driver.totalRides} courses)
                                </Text>
                            </View>
                        </View>

                        {/* Boutons contact */}
                        <View style={styles.contactButtons}>
                            <TouchableOpacity
                                style={[styles.contactButton, { backgroundColor: '#4CAF5020' }]}
                                onPress={handleCall}
                            >
                                <Text style={styles.contactEmoji}>📞</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.contactButton, { backgroundColor: COLORS.primary + '20' }]}
                                onPress={handleMessage}
                            >
                                <Text style={styles.contactEmoji}>💬</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Véhicule avec couleur */}
                    <View style={[styles.vehicleInfo, { borderTopColor: isDark ? '#333' : '#F0F0F0' }]}>
                        <Text style={styles.vehicleEmoji}>🚗</Text>
                        <View style={styles.vehicleDetails}>
                            <Text style={[styles.vehicleName, { color: colors.text }]}>
                                {driver.vehicleBrand} {driver.vehicleModel}
                            </Text>
                            <View style={styles.vehicleRow}>
                                <View style={[styles.colorBadge, { backgroundColor: getColorHex(driver.vehicleColor) }]} />
                                <Text style={[styles.vehicleColorText, { color: colors.textSecondary }]}>
                                    {driver.vehicleColor}
                                </Text>
                                <Text style={styles.vehicleSeparator}>•</Text>
                                <Text style={[styles.vehiclePlate, { color: COLORS.primary }]}>
                                    {driver.vehiclePlate}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Boutons d'action */}
                {rideStatus === 'arrived' ? (
                    <TouchableOpacity
                        style={styles.startRideButton}
                        onPress={handleStartRide}
                        activeOpacity={0.9}
                    >
                        <LinearGradient
                            colors={[COLORS.primary, COLORS.primaryDark]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.startRideGradient}
                        >
                            <Text style={styles.startRideText}>
                                {language === 'fr' ? 'Démarrer la course' : 'Start ride'}
                            </Text>
                            <Icon name="arrow-forward" size={20} color={COLORS.white} />
                        </LinearGradient>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[styles.cancelButton, { borderColor: '#FF5252' }]}
                        onPress={handleCancelRide}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.cancelButtonText}>
                            {language === 'fr' ? 'Annuler' : 'Cancel'}
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
        flex: 1,
    },

    // Header
    header: {
        position: 'absolute',
        top: 50,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
    },
    headerButton: {
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
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    statusBadgeText: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 14,
    },
    emergencyEmoji: {
        fontSize: 20,
    },

    // Panel inférieur
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

    // Status
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: SPACING.md,
    },
    statusMessage: {
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
    },
    etaContainer: {
        alignItems: 'center',
        backgroundColor: COLORS.primary + '20',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
    },
    etaNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    etaLabel: {
        fontSize: 12,
    },

    // Driver card
    driverCard: {
        borderRadius: RADIUS.lg,
        padding: SPACING.md,
        marginBottom: SPACING.md,
    },
    driverInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    driverAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    avatarEmoji: {
        fontSize: 36,
    },
    driverDetails: {
        flex: 1,
    },
    driverName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingStar: {
        fontSize: 14,
        marginRight: 4,
    },
    ratingText: {
        fontSize: 14,
        fontWeight: '600',
        marginRight: 4,
    },
    ratingCount: {
        fontSize: 12,
    },
    contactButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    contactButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contactEmoji: {
        fontSize: 20,
    },

    // Vehicle info
    vehicleInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: SPACING.md,
        paddingTop: SPACING.md,
        borderTopWidth: 1,
    },
    vehicleEmoji: {
        fontSize: 28,
        marginRight: SPACING.md,
    },
    vehicleDetails: {
        flex: 1,
    },
    vehicleName: {
        fontSize: 14,
        marginBottom: 4,
    },
    vehicleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    colorBadge: {
        width: 14,
        height: 14,
        borderRadius: 7,
        marginRight: 6,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    vehicleColorText: {
        fontSize: 13,
    },
    vehicleSeparator: {
        marginHorizontal: 8,
        color: '#999',
    },
    vehiclePlate: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    profilePhoto: {
        width: '100%',
        height: '100%',
        borderRadius: 30,
    },

    // Buttons
    startRideButton: {
        marginTop: SPACING.sm,
    },
    startRideGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 30,
    },
    startRideText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.white,
        marginRight: 8,
    },
    cancelButton: {
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
        borderWidth: 1,
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FF5252',
    },
});
