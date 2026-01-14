// =============================================
// TRANSIGO - FINDING DRIVER SCREEN
// Animation de recherche de chauffeur
// =============================================

import { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
    Easing,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@/components/Icon';
import OSMMap from '@/components/OSMMap';
import { COLORS, SPACING, RADIUS } from '@/constants';
import { useRideStore, useThemeStore, useLanguageStore, VEHICLE_OPTIONS, useAuthStore } from '@/stores';
import { rideService, supabase } from '@/services/supabaseService';
import type { DriverInfo } from '@/stores';
import { getTranslation } from '@/i18n/translations';

const { width, height } = Dimensions.get('window');

export default function FindingDriverScreen() {
    const params = useLocalSearchParams();
    const { isDark, colors } = useThemeStore();
    const { language } = useLanguageStore();
    const t = (key: any) => getTranslation(key, language);

    const {
        pickup,
        dropoff,
        pickupAddress,
        dropoffAddress,
        selectedVehicle,
        estimatedPrice,
        estimatedDistance,
        estimatedDuration,
        routeCoordinates,
        rideStatus,
        startSearching,
        driverAccepted,
        cancelRide,
        womenSafetyMode,
    } = useRideStore();

    // Animations
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const [searchSeconds, setSearchSeconds] = useState(0);
    const [dots, setDots] = useState('');

    // Démarrer la recherche au montage
    useEffect(() => {
        startPulseAnimation();
        startRotateAnimation();
        fadeIn();

        // Timer visuel
        const timer = setInterval(() => setSearchSeconds(s => s + 1), 1000);
        const dotsInterval = setInterval(() => setDots(p => p.length >= 3 ? '' : p + '.'), 500);

        // 1. Créer la course sur Supabase
        const createAndMonitorRide = async () => {
            const { user } = useAuthStore.getState();
            if (!user) {
                alert("Vous devez être connecté pour commander");
                router.back();
                return;
            }

            // Préparer les données
            const rideData = {
                passenger_id: user.id,
                pickup_address: pickupAddress || params.pickup_address as string || 'Départ',
                pickup_lat: pickupCoords.latitude,
                pickup_lng: pickupCoords.longitude,
                dropoff_address: dropoffAddress || params.dest_address as string || 'Arrivée',
                dropoff_lat: dropoffCoords.latitude,
                dropoff_lng: dropoffCoords.longitude,
                distance_km: estimatedDistance || Number(params.distance) || 0,
                duration_min: estimatedDuration || Number(params.duration) || 0,
                price: Number(params.gross_price) || estimatedPrice || Number(params.price) || 0,
                discount: (Number(params.gross_price) || estimatedPrice || 0) - (Number(params.price) || 0),
                user_pays: Number(params.price) || 0,
                vehicle_type: selectedVehicle || 'standard',
                women_only: womenSafetyMode,
            };

            const { ride, error } = await rideService.createRide(rideData);

            if (error) {
                console.error("Erreur création course", error);
                alert("Impossible de créer la course: " + error.message);
                router.back();
                return;
            }

            console.log("Course créée:", ride?.id);

            // 2. Lancer le système de notification cascade
            // Notifie le chauffeur le plus proche, attend 15s, puis le suivant...
            if (ride) {
                rideService.notifyDriversCascade(
                    ride.id,
                    pickupCoords.latitude,
                    pickupCoords.longitude,
                    {
                        pickupAddress: rideData.pickup_address,
                        dropoffAddress: rideData.dropoff_address,
                        price: rideData.price,
                        distance: rideData.distance_km,
                        vehicleType: rideData.vehicle_type,
                    },
                    {
                        timeoutSeconds: 15,  // 15 secondes par chauffeur
                        maxDrivers: 5,       // Max 5 chauffeurs
                        radiusKm: 5,         // Rayon de 5km
                    }
                ).then(result => {
                    console.log('[Cascade] Result:', result);
                    if (!result.success) {
                        console.log('Aucun chauffeur n\'a accepté la course');
                    }
                });

                // 3. S'abonner aux changements (Accepted)
                const sub = rideService.subscribeToRide(ride.id, async (updatedRide) => {
                    console.log("Ride update:", updatedRide.status);

                    if (updatedRide.status === 'accepted') {
                        // Récupérer les infos du chauffeur
                        const { ride: fullRide } = await rideService.getRide(ride.id);

                        if (fullRide?.drivers) {
                            const d = fullRide.drivers;
                            // Transformer pour le store
                            const driverInfo: DriverInfo = {
                                id: d.id || fullRide.driver_id,
                                firstName: d.first_name || 'Chauffeur',
                                lastName: d.last_name || '',
                                phone: d.phone || '',
                                photo: d.avatar_url || null,
                                rating: d.rating || 5.0,
                                totalRides: d.total_rides || 0,
                                vehicleBrand: d.vehicle_brand || '',
                                vehicleModel: d.vehicle_model || '',
                                vehicleColor: d.vehicle_color || '',
                                vehiclePlate: d.vehicle_plate || '',
                                currentLocation: {
                                    latitude: d.current_lat || 0,
                                    longitude: d.current_lng || 0
                                }
                            };

                            driverAccepted(driverInfo, 10); // 10 min d'approche

                            router.replace({
                                pathname: '/ride-tracking',
                                params: {
                                    rideId: ride.id, // Passer l'ID réel
                                    pickup_lat: pickupCoords.latitude,
                                    pickup_lon: pickupCoords.longitude,
                                    dest_lat: dropoffCoords.latitude,
                                    dest_lon: dropoffCoords.longitude,
                                    pickup_address: rideData.pickup_address,
                                    dest_address: rideData.dropoff_address,
                                }
                            });
                        }
                    }
                });

                return () => {
                    supabase.removeChannel(sub);
                    // Optionnel: annuler la course si on quitte l'écran sans chauffeur ?
                    // rideService.cancelRide(ride.id, "Recherche annulée par l'utilisateur");
                };
            }
        };

        const cleanup = createAndMonitorRide();

        return () => {
            clearInterval(timer);
            clearInterval(dotsInterval);
            // Cleanup subscription handled inside async function wrapper logic if needed
            // Pour faire simple ici on laisse le channel actif ou on le clean via une ref si besoin
            // Mais React useEffect async cleanup est tricky. 
            // On simplifie: le composant démonte => pas grave si le sub reste quelques ms.
        };
    }, []);

    const fadeIn = () => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();
    };

    const startPulseAnimation = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.3,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    };

    const startRotateAnimation = () => {
        Animated.loop(
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 3000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();
    };

    const rotateInterpolate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const handleCancel = () => {
        cancelRide();
        router.back();
    };

    // Coordonnées pour la carte
    const pickupCoords = pickup || {
        latitude: Number(params.pickup_lat) || 5.3599,
        longitude: Number(params.pickup_lon) || -3.9870,
    };

    const dropoffCoords = dropoff || {
        latitude: Number(params.dest_lat) || 5.2539,
        longitude: Number(params.dest_lon) || -3.9263,
    };

    const mapRegion = {
        latitude: (pickupCoords.latitude + dropoffCoords.latitude) / 2,
        longitude: (pickupCoords.longitude + dropoffCoords.longitude) / 2,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
    };

    const vehicleOption = VEHICLE_OPTIONS.find(v => v.type === selectedVehicle);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Carte en arrière-plan */}
            <OSMMap
                style={styles.map}
                initialRegion={mapRegion}
                routeCoordinates={routeCoordinates}
                markers={[
                    { id: 'pickup', latitude: pickupCoords.latitude, longitude: pickupCoords.longitude },
                    { id: 'dropoff', latitude: dropoffCoords.latitude, longitude: dropoffCoords.longitude },
                ]}
            />

            {/* Overlay semi-transparent */}
            <View style={styles.overlay} />

            {/* Contenu principal */}
            <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={[styles.backButton, { backgroundColor: colors.card }]}
                        onPress={handleCancel}
                    >
                        <Icon name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>

                {/* Centre - Animation de recherche */}
                <View style={styles.searchContainer}>
                    {/* Cercles pulsants */}
                    <Animated.View style={[
                        styles.pulseCircle,
                        styles.pulseCircle3,
                        { transform: [{ scale: pulseAnim }] }
                    ]} />
                    <Animated.View style={[
                        styles.pulseCircle,
                        styles.pulseCircle2,
                        { transform: [{ scale: Animated.multiply(pulseAnim, 0.85) }] }
                    ]} />
                    <Animated.View style={[
                        styles.pulseCircle,
                        styles.pulseCircle1,
                        { transform: [{ scale: Animated.multiply(pulseAnim, 0.7) }] }
                    ]} />

                    {/* Cercle central avec icône */}
                    <View style={styles.centerCircle}>
                        <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
                            <Text style={styles.carEmoji}>{vehicleOption?.icon || '🚗'}</Text>
                        </Animated.View>
                    </View>
                </View>

                {/* Texte de recherche */}
                <View style={styles.textContainer}>
                    <Text style={[styles.searchingText, { color: colors.text }]}>
                        {language === 'fr' ? 'Recherche en cours' : 'Finding driver'}{dots}
                    </Text>
                    <Text style={[styles.searchingSubtext, { color: colors.textSecondary }]}>
                        {language === 'fr'
                            ? 'Nous cherchons le meilleur chauffeur pour vous'
                            : 'We are looking for the best driver for you'}
                    </Text>
                    <Text style={[styles.timerText, { color: COLORS.primary }]}>
                        {Math.floor(searchSeconds / 60)}:{String(searchSeconds % 60).padStart(2, '0')}
                    </Text>
                </View>

                {/* Résumé de la course */}
                <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
                    <View style={styles.summaryRow}>
                        <View style={styles.summaryItem}>
                            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                                {language === 'fr' ? 'Distance' : 'Distance'}
                            </Text>
                            <Text style={[styles.summaryValue, { color: colors.text }]}>
                                {estimatedDistance?.toFixed(1) || params.distance || '0'} km
                            </Text>
                        </View>
                        <View style={[styles.summaryDivider, { backgroundColor: colors.textSecondary + '30' }]} />
                        <View style={styles.summaryItem}>
                            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                                {language === 'fr' ? 'Durée' : 'Duration'}
                            </Text>
                            <Text style={[styles.summaryValue, { color: colors.text }]}>
                                {estimatedDuration || params.duration || '0'} min
                            </Text>
                        </View>
                        <View style={[styles.summaryDivider, { backgroundColor: colors.textSecondary + '30' }]} />
                        <View style={styles.summaryItem}>
                            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                                {params.is_negotiated === 'true'
                                    ? (language === 'fr' ? 'Votre offre' : 'Your offer')
                                    : (language === 'fr' ? 'Prix' : 'Price')}
                            </Text>
                            <Text style={[styles.summaryValue, { color: params.is_negotiated === 'true' ? '#4CAF50' : COLORS.primary }]}>
                                {(estimatedPrice || Number(params.price) || 2500).toLocaleString('fr-FR')} F
                                {params.is_negotiated === 'true' && ' 💬'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Bouton annuler */}
                <TouchableOpacity
                    style={[styles.cancelButton, { backgroundColor: colors.card }]}
                    onPress={handleCancel}
                    activeOpacity={0.8}
                >
                    <Text style={[styles.cancelButtonText, { color: '#FF5252' }]}>
                        {language === 'fr' ? 'Annuler la demande' : 'Cancel request'}
                    </Text>
                </TouchableOpacity>
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
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
        paddingTop: 50,
        paddingBottom: 40,
    },
    header: {
        paddingHorizontal: SPACING.lg,
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

    // Animation de recherche
    searchContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 250,
    },
    pulseCircle: {
        position: 'absolute',
        borderRadius: 999,
        backgroundColor: COLORS.primary,
    },
    pulseCircle1: {
        width: 120,
        height: 120,
        opacity: 0.3,
    },
    pulseCircle2: {
        width: 180,
        height: 180,
        opacity: 0.2,
    },
    pulseCircle3: {
        width: 240,
        height: 240,
        opacity: 0.1,
    },
    centerCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 10,
    },
    carEmoji: {
        fontSize: 48,
    },

    // Textes
    textContainer: {
        alignItems: 'center',
        paddingHorizontal: SPACING.xl,
    },
    searchingText: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    searchingSubtext: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 16,
    },
    timerText: {
        fontSize: 28,
        fontWeight: 'bold',
    },

    // Résumé
    summaryCard: {
        marginHorizontal: SPACING.lg,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    summaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    summaryItem: {
        flex: 1,
        alignItems: 'center',
    },
    summaryDivider: {
        width: 1,
        height: 40,
    },
    summaryLabel: {
        fontSize: 12,
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 18,
        fontWeight: 'bold',
    },

    // Bouton annuler
    cancelButton: {
        marginHorizontal: SPACING.lg,
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FF5252',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
