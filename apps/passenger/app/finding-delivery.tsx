// =============================================
// TRANSIGO - FINDING DELIVERY PERSON SCREEN
// Animation de recherche de livreur
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
    Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@/components/Icon';
import { COLORS, SPACING, RADIUS } from '@/constants';
import { getTranslation } from '@/i18n/translations';
import { rideService } from '@/services/supabaseService';
import { useAuthStore, useThemeStore, useLanguageStore } from '@/stores';

const { width, height } = Dimensions.get('window');

// Livreur simulé (pour la démo)
const MOCK_DELIVERY_PERSON = {
    id: 'delivery_001',
    firstName: 'Yao',
    lastName: 'Paul',
    phone: '+225 05 00 00 00',
    rating: 4.9,
    totalDeliveries: 512,
    vehicleType: 'Moto',
    vehiclePlate: 'MC-5678-CI',
};

export default function FindingDeliveryScreen() {
    const params = useLocalSearchParams();
    const { isDark, colors } = useThemeStore();
    const { language } = useLanguageStore();
    const t = (key: any) => getTranslation(key, language);

    // Paramètres de la livraison
    const pickupAddress = params.pickup_address as string || 'Adresse d\'enlèvement';
    const deliveryAddress = params.delivery_address as string || 'Adresse de livraison';
    const packageSize = params.package_size as string || 'Petit';
    const price = Number(params.price) || 1500;
    const recipientName = params.recipient_name as string || '';

    // Animations
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const [searchSeconds, setSearchSeconds] = useState(0);
    const [dots, setDots] = useState('');
    const [deliveryPerson, setDeliveryPerson] = useState<typeof MOCK_DELIVERY_PERSON | null>(null);
    const [isAccepted, setIsAccepted] = useState(false);

    const { user } = useAuthStore();
    const [rideId, setRideId] = useState<string | null>(null);

    // Démarrer la recherche au montage
    useEffect(() => {
        fadeIn();
        startPulseAnimation();
        startRotateAnimation();

        // Timer de recherche
        const timer = setInterval(() => {
            setSearchSeconds(prev => prev + 1);
        }, 1000);

        // Dots animation
        const dotsInterval = setInterval(() => {
            setDots(prev => prev.length >= 3 ? '' : prev + '.');
        }, 500);

        // Créer la demande réelle dans Supabase
        const initiateSearch = async () => {
            if (!user) return;

            const { ride, error } = await rideService.createRide({
                passenger_id: user.id,
                pickup_address: pickupAddress,
                pickup_lat: Number(params.pickup_lat),
                pickup_lng: Number(params.pickup_lon),
                dropoff_address: deliveryAddress,
                dropoff_lat: Number(params.delivery_lat),
                dropoff_lng: Number(params.delivery_lon),
                distance_km: Number(params.distance) || 0,
                duration_min: (Number(params.distance) || 0) * 2, // Approximation
                price: price,
                vehicle_type: params.vehicle_type as string || 'moto',
                service_type: 'delivery'
            });

            if (error) {
                console.error('Error creating delivery request:', error);
                Alert.alert('Erreur', 'Impossible de créer la demande de livraison.');
                router.back();
                return;
            }

            if (ride) {
                setRideId(ride.id);
                // S'abonner aux mises à jour
                const subscription = rideService.subscribeToRide(ride.id, (updatedRide) => {
                    if (updatedRide.status === 'accepted' && updatedRide.driver_id) {
                        // Récupérer les infos du livreur
                        fetchDriverDetails(updatedRide.driver_id);
                    }
                });

                return () => subscription.unsubscribe();
            }
        };

        const fetchDriverDetails = async (driverId: string) => {
            const { ride: driver, error } = await rideService.getRide(rideId || ''); // Fetch ride with driver info
            if (driver && driver.drivers) {
                setDeliveryPerson({
                    id: driver.drivers.id,
                    firstName: driver.drivers.first_name,
                    lastName: driver.drivers.last_name,
                    phone: driver.drivers.phone,
                    rating: driver.drivers.rating || 5.0,
                    totalDeliveries: driver.drivers.total_rides || 0,
                    vehicleType: driver.drivers.vehicle_type || 'Moto',
                    vehiclePlate: driver.drivers.vehicle_plate || '-',
                });
                setIsAccepted(true);
            }
        };

        initiateSearch();

        return () => {
            clearInterval(timer);
            clearInterval(dotsInterval);
        };
    }, [user]);

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
        Alert.alert(
            language === 'fr' ? 'Annuler la livraison' : 'Cancel delivery',
            language === 'fr' ? 'Voulez-vous vraiment annuler cette demande ?' : 'Do you really want to cancel this request?',
            [
                { text: language === 'fr' ? 'Non' : 'No', style: 'cancel' },
                { text: language === 'fr' ? 'Oui' : 'Yes', onPress: () => router.back(), style: 'destructive' },
            ]
        );
    };

    const handleContactDeliveryPerson = () => {
        Alert.alert(
            language === 'fr' ? 'Contacter le livreur' : 'Contact delivery person',
            `📞 ${deliveryPerson?.phone}`
        );
    };

    const handleConfirmPickup = () => {
        // Naviguer vers l'écran de suivi en temps réel
        router.replace({
            pathname: '/delivery-tracking',
            params: {
                pickup_address: pickupAddress,
                pickup_lat: params.pickup_lat,
                pickup_lon: params.pickup_lon,
                delivery_address: deliveryAddress,
                delivery_lat: params.delivery_lat,
                delivery_lon: params.delivery_lon,
                delivery_person_name: `${deliveryPerson?.firstName} ${deliveryPerson?.lastName}`,
                delivery_person_phone: deliveryPerson?.phone,
                vehicle_plate: deliveryPerson?.vehiclePlate,
                price: price,
            }
        });
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Fond dégradé */}
            <LinearGradient
                colors={['#FF9800', '#FF6B00', '#E65100']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            />

            {/* Contenu principal */}
            <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={handleCancel}
                    >
                        <Icon name="close" size={24} color={COLORS.white} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        📦 {language === 'fr' ? 'TransiGo Delivery' : 'TransiGo Delivery'}
                    </Text>
                    <View style={{ width: 44 }} />
                </View>

                {!isAccepted ? (
                    /* État de recherche */
                    <>
                        {/* Animation de recherche */}
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
                                    <Text style={styles.deliveryEmoji}>🏍</Text>
                                </Animated.View>
                            </View>
                        </View>

                        {/* Texte de recherche */}
                        <View style={styles.textContainer}>
                            <Text style={styles.searchingText}>
                                {language === 'fr' ? 'Recherche d\'un livreur' : 'Finding delivery person'}{dots}
                            </Text>
                            <Text style={styles.searchingSubtext}>
                                {language === 'fr'
                                    ? 'Nous cherchons le livreur le plus proche'
                                    : 'We are looking for the nearest delivery person'}
                            </Text>
                            <Text style={styles.timerText}>
                                {Math.floor(searchSeconds / 60)}:{String(searchSeconds % 60).padStart(2, '0')}
                            </Text>
                        </View>
                    </>
                ) : (
                    /* Livreur trouvé */
                    <>
                        <View style={styles.foundContainer}>
                            <View style={styles.checkCircle}>
                                <Text style={styles.checkEmoji}>✅</Text>
                            </View>
                            <Text style={styles.foundTitle}>
                                {language === 'fr' ? 'Livreur trouvé !' : 'Delivery person found!'}
                            </Text>
                        </View>

                        {/* Carte du livreur */}
                        <View style={styles.deliveryPersonCard}>
                            <View style={styles.deliveryPersonHeader}>
                                <View style={styles.deliveryPersonAvatar}>
                                    <Text style={styles.avatarEmoji}>👨🏾</Text>
                                </View>
                                <View style={styles.deliveryPersonInfo}>
                                    <Text style={styles.deliveryPersonName}>
                                        {deliveryPerson?.firstName} {deliveryPerson?.lastName}
                                    </Text>
                                    <View style={styles.ratingRow}>
                                        <Text style={styles.rating}>⭐ {deliveryPerson?.rating}</Text>
                                        <Text style={styles.deliveries}>
                                            • {deliveryPerson?.totalDeliveries} {language === 'fr' ? 'livraisons' : 'deliveries'}
                                        </Text>
                                    </View>
                                    <Text style={styles.vehicleInfo}>
                                        🏍 {deliveryPerson?.vehicleType} • {deliveryPerson?.vehiclePlate}
                                    </Text>
                                </View>
                            </View>

                            {/* Boutons d'action */}
                            <View style={styles.actionButtons}>
                                <TouchableOpacity
                                    style={styles.contactButton}
                                    onPress={handleContactDeliveryPerson}
                                >
                                    <Icon name="call" size={20} color="#4CAF50" />
                                    <Text style={styles.contactButtonText}>
                                        {language === 'fr' ? 'Appeler' : 'Call'}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.messageButton}
                                    onPress={() => Alert.alert('Message', 'Chat coming soon!')}
                                >
                                    <Icon name="chatbubble" size={20} color={COLORS.primary} />
                                    <Text style={styles.messageButtonText}>
                                        {language === 'fr' ? 'Message' : 'Message'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Info arrivée */}
                        <View style={styles.arrivalCard}>
                            <Text style={styles.arrivalEmoji}>⏱️</Text>
                            <View>
                                <Text style={styles.arrivalLabel}>
                                    {language === 'fr' ? 'Arrivée estimée pour récupération' : 'Estimated arrival for pickup'}
                                </Text>
                                <Text style={styles.arrivalTime}>3-5 min</Text>
                            </View>
                        </View>
                    </>
                )}

                {/* Résumé de la livraison */}
                <View style={styles.summaryCard}>
                    <View style={styles.summaryRow}>
                        <View style={styles.addressItem}>
                            <View style={styles.dotGreen} />
                            <View style={styles.addressInfo}>
                                <Text style={styles.addressLabel}>
                                    {language === 'fr' ? 'Enlèvement' : 'Pickup'}
                                </Text>
                                <Text style={styles.addressText} numberOfLines={1}>
                                    {pickupAddress}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.connectionLine} />
                        <View style={styles.addressItem}>
                            <View style={styles.dotOrange} />
                            <View style={styles.addressInfo}>
                                <Text style={styles.addressLabel}>
                                    {language === 'fr' ? 'Livraison' : 'Delivery'}
                                </Text>
                                <Text style={styles.addressText} numberOfLines={1}>
                                    {deliveryAddress}
                                </Text>
                            </View>
                        </View>
                    </View>
                    <View style={styles.priceSummary}>
                        <Text style={styles.priceLabel}>
                            {language === 'fr' ? 'Prix total' : 'Total price'}
                        </Text>
                        <Text style={styles.priceValue}>{price.toLocaleString('fr-FR')} FCFA</Text>
                    </View>
                </View>

                {/* Bouton action */}
                {isAccepted ? (
                    <TouchableOpacity
                        style={styles.confirmButton}
                        onPress={handleConfirmPickup}
                        activeOpacity={0.9}
                    >
                        <Text style={styles.confirmButtonText}>
                            {language === 'fr' ? '✓ Colis récupéré par le livreur' : '✓ Package picked up by driver'}
                        </Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={handleCancel}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.cancelButtonText}>
                            {language === 'fr' ? 'Annuler la demande' : 'Cancel request'}
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
    gradient: {
        ...StyleSheet.absoluteFillObject,
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
        paddingTop: 50,
        paddingBottom: 40,
        paddingHorizontal: SPACING.lg,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.white,
    },

    // Animation de recherche
    searchContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 220,
    },
    pulseCircle: {
        position: 'absolute',
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    pulseCircle1: {
        width: 100,
        height: 100,
        opacity: 0.4,
    },
    pulseCircle2: {
        width: 150,
        height: 150,
        opacity: 0.25,
    },
    pulseCircle3: {
        width: 200,
        height: 200,
        opacity: 0.15,
    },
    centerCircle: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 10,
    },
    deliveryEmoji: {
        fontSize: 40,
    },

    // Textes recherche
    textContainer: {
        alignItems: 'center',
    },
    searchingText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.white,
        marginBottom: 8,
    },
    searchingSubtext: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        marginBottom: 16,
    },
    timerText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.white,
    },

    // Livreur trouvé
    foundContainer: {
        alignItems: 'center',
        marginVertical: SPACING.lg,
    },
    checkCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    checkEmoji: {
        fontSize: 40,
    },
    foundTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.white,
    },

    // Carte livreur
    deliveryPersonCard: {
        backgroundColor: COLORS.white,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        marginBottom: SPACING.md,
    },
    deliveryPersonHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    deliveryPersonAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#FF9800' + '30',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    avatarEmoji: {
        fontSize: 32,
    },
    deliveryPersonInfo: {
        flex: 1,
    },
    deliveryPersonName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    rating: {
        fontSize: 14,
        color: COLORS.text,
    },
    deliveries: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginLeft: 4,
    },
    vehicleInfo: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    contactButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E8F5E9',
        paddingVertical: 12,
        borderRadius: RADIUS.md,
        gap: 8,
    },
    contactButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4CAF50',
    },
    messageButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF3E0',
        paddingVertical: 12,
        borderRadius: RADIUS.md,
        gap: 8,
    },
    messageButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.primary,
    },

    // Arrivée
    arrivalCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: RADIUS.md,
        padding: SPACING.md,
        marginBottom: SPACING.md,
        gap: SPACING.md,
    },
    arrivalEmoji: {
        fontSize: 28,
    },
    arrivalLabel: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    arrivalTime: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },

    // Résumé
    summaryCard: {
        backgroundColor: COLORS.white,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        marginBottom: SPACING.md,
    },
    summaryRow: {
        marginBottom: SPACING.md,
    },
    addressItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    dotGreen: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#4CAF50',
        marginRight: SPACING.sm,
    },
    dotOrange: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: COLORS.primary,
        marginRight: SPACING.sm,
    },
    connectionLine: {
        width: 2,
        height: 20,
        backgroundColor: '#E0E0E0',
        marginLeft: 5,
        marginBottom: 8,
    },
    addressInfo: {
        flex: 1,
    },
    addressLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    addressText: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.text,
    },
    priceSummary: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: SPACING.md,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    priceLabel: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    priceValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.primary,
    },

    // Boutons
    confirmButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    cancelButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.white,
    },
});
