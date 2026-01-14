// =============================================
// TRANSIGO - RIDE IN PROGRESS SCREEN
// Course en cours avec suivi temps réel
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
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Icon from '@/components/Icon';
import OSMMap from '@/components/OSMMap';
import { COLORS, SPACING, RADIUS } from '@/constants';
import { useRideStore, useThemeStore, useLanguageStore } from '@/stores';
import { getTranslation } from '@/i18n/translations';
import { locationService } from '@/services/locationService';
import { rideService } from '@/services/supabaseService';

const { width, height } = Dimensions.get('window');

export default function RideInProgressScreen() {
    const params = useLocalSearchParams();
    const { isDark, colors } = useThemeStore();
    const { language } = useLanguageStore();
    const t = (key: any) => getTranslation(key, language);

    const {
        dropoff,
        dropoffAddress,
        assignedDriver,
        estimatedPrice,
        completeRide,
        resetAll,
    } = useRideStore();

    const [routeToDestination, setRouteToDestination] = useState<{ latitude: number; longitude: number }[]>([]);
    const progressAnim = useRef(new Animated.Value(0)).current;
    const routeFetchedRef = useRef(false); // Empêche les recalculs de route

    // Coordonnées
    const pickupCoords = {
        latitude: Number(params.pickup_lat) || 5.3599,
        longitude: Number(params.pickup_lon) || -3.9870,
    };

    const dropoffCoords = dropoff || {
        latitude: Number(params.dest_lat) || 5.2539,
        longitude: Number(params.dest_lon) || -3.9263,
    };

    // Position simulée du véhicule (en mouvement vers la destination)
    const [vehiclePos, setVehiclePos] = useState(pickupCoords);
    const [remainingDistance, setRemainingDistance] = useState(0);
    const [remainingTime, setRemainingTime] = useState(0);
    const [progressPercent, setProgressPercent] = useState(0);
    const currentRouteIndexRef = useRef(0);
    const totalRouteDistanceRef = useRef(0);

    // Mémoriser les marqueurs pour éviter les re-rendus
    const markers = useMemo(() => [
        { id: 'taxi', latitude: vehiclePos.latitude, longitude: vehiclePos.longitude },
        { id: 'dropoff', latitude: dropoffCoords.latitude, longitude: dropoffCoords.longitude },
    ], [vehiclePos.latitude, vehiclePos.longitude]);

    useEffect(() => {
        // Calculer la route vers la destination UNE SEULE FOIS
        if (!routeFetchedRef.current) {
            routeFetchedRef.current = true;
            fetchRouteToDestination();
        }
    }, []);

    // Suivi réel du véhicule via Supabase Realtime
    useEffect(() => {
        if (!assignedDriver?.id) return;

        console.log('📡 [RideInProgress] Subscribing to driver location:', assignedDriver.id);

        const subscription = rideService.subscribeToDriverLocation(
            assignedDriver.id,
            (location) => {
                const { lat, lng } = location;
                // Mettre à jour la position du véhicule
                setVehiclePos({ latitude: lat, longitude: lng });

                // Recalculer la distance restante à vol d'oiseau
                // (On pourrait aussi utiliser OSRM chaque X secondes mais c'est lourd)
                const distKm = rideService.haversineDistance(
                    lat, lng,
                    dropoffCoords.latitude, dropoffCoords.longitude
                );

                // Convertir en mètres pour l'affichage
                setRemainingDistance(distKm * 1000);

                // Estimation temps restant (basé sur 3 min/km en ville ou vitesse moyenne 20km/h)
                setRemainingTime(Math.ceil(distKm * 3));

                // Mettre à jour le pourcentage de progression
                if (totalRouteDistanceRef.current > 0) {
                    const covered = totalRouteDistanceRef.current - (distKm * 1000);
                    const progress = Math.min(100, Math.max(0, (covered / totalRouteDistanceRef.current) * 100));
                    setProgressPercent(Math.round(progress));

                    // Animation fluide de la barre
                    Animated.timing(progressAnim, {
                        toValue: progress / 100,
                        duration: 1000,
                        useNativeDriver: false,
                    }).start();
                }

                // Détection arrivée (< 100m)
                if (distKm < 0.1) {
                    handleArrival();
                }
            }
        );

        return () => {
            // Nettoyage subscription
            if (subscription) subscription.unsubscribe();
        };
    }, [assignedDriver?.id]);

    const fetchRouteToDestination = async () => {
        // Obtenir la route statique pour l'affichage sur la carte
        const route = await locationService.getRoute(
            pickupCoords.latitude,
            pickupCoords.longitude,
            dropoffCoords.latitude,
            dropoffCoords.longitude
        );
        if (route) {
            setRouteToDestination(route.coordinates);
            // Initialiser les distances basées sur la route théorique au début
            setRemainingDistance(route.distance);
            setRemainingTime(Math.round(route.duration));
            totalRouteDistanceRef.current = route.distance;
        }
    };

    const handleArrival = () => {
        completeRide();
        // Naviguer vers l'écran de fin de course
        router.replace({
            pathname: '/ride-complete',
            params: {
                price: estimatedPrice || 2500,
            }
        });
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

    const handleCall = () => {
        if (assignedDriver?.phone) {
            Linking.openURL(`tel:${assignedDriver.phone}`);
        }
    };

    const handleCancel = () => {
        Alert.alert(
            language === 'fr' ? '❌ Annuler la course ?' : '❌ Cancel the ride?',
            language === 'fr'
                ? 'Des frais d\'annulation de 500 F peuvent s\'appliquer.'
                : 'A cancellation fee of 500 F may apply.',
            [
                { text: language === 'fr' ? 'Non' : 'No', style: 'cancel' },
                {
                    text: language === 'fr' ? 'Oui, annuler' : 'Yes, cancel',
                    style: 'destructive',
                    onPress: () => {
                        Alert.alert('✅', language === 'fr' ? 'Course annulée' : 'Ride cancelled');
                        router.replace('/(tabs)/home');
                    }
                },
            ]
        );
    };

    const handleSOS = () => {
        router.push('/sos');
    };

    const mapRegion = {
        latitude: (vehiclePos.latitude + dropoffCoords.latitude) / 2,
        longitude: (vehiclePos.longitude + dropoffCoords.longitude) / 2,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
    };

    const driver = assignedDriver || {
        firstName: 'Kouassi',
        lastName: 'Jean-Marc',
        phone: '+225 07 00 00 00',
    };

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Carte */}
            <OSMMap
                style={styles.map}
                initialRegion={mapRegion}
                routeCoordinates={routeToDestination}
                markers={markers}
            />

            {/* Header avec urgence */}
            <View style={styles.header}>
                <View style={[styles.rideBadge, { backgroundColor: COLORS.primary }]}>
                    <Text style={styles.rideBadgeText}>
                        {language === 'fr' ? '🚗 Course en cours' : '🚗 Ride in progress'}
                    </Text>
                </View>

                <TouchableOpacity
                    style={[styles.emergencyButton, { backgroundColor: '#FF5252' }]}
                    onPress={handleEmergency}
                >
                    <Text style={styles.emergencyEmoji}>🆘</Text>
                </TouchableOpacity>
            </View>

            {/* Panneau inférieur */}
            <View style={[styles.bottomPanel, { backgroundColor: colors.card }]}>
                {/* Handle */}
                <View style={[styles.handle, { backgroundColor: isDark ? '#333' : '#E0E0E0' }]} />

                {/* Progression */}
                <View style={styles.progressSection}>
                    <View style={styles.progressHeader}>
                        <Text style={[styles.progressTitle, { color: colors.text }]}>
                            {language === 'fr' ? 'En route vers destination' : 'Heading to destination'}
                        </Text>
                        <Text style={[styles.progressPercent, { color: COLORS.primary }]}>
                            {progressPercent}%
                        </Text>
                    </View>

                    <View style={[styles.progressBar, { backgroundColor: isDark ? '#333' : '#F0F0F0' }]}>
                        <Animated.View
                            style={[
                                styles.progressFill,
                                { width: progressWidth, backgroundColor: COLORS.primary }
                            ]}
                        />
                    </View>

                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statEmoji}>📍</Text>
                            <Text style={[styles.statValue, { color: colors.text }]}>
                                {remainingDistance.toFixed(1)} km
                            </Text>
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                                {language === 'fr' ? 'restant' : 'remaining'}
                            </Text>
                        </View>
                        <View style={[styles.statDivider, { backgroundColor: isDark ? '#333' : '#F0F0F0' }]} />
                        <View style={styles.statItem}>
                            <Text style={styles.statEmoji}>⏱️</Text>
                            <Text style={[styles.statValue, { color: colors.text }]}>
                                {remainingTime} min
                            </Text>
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                                {language === 'fr' ? 'arrivée' : 'arrival'}
                            </Text>
                        </View>
                        <View style={[styles.statDivider, { backgroundColor: isDark ? '#333' : '#F0F0F0' }]} />
                        <View style={styles.statItem}>
                            <Text style={styles.statEmoji}>💰</Text>
                            <Text style={[styles.statValue, { color: COLORS.primary }]}>
                                {(estimatedPrice || 2500).toLocaleString('fr-FR')} F
                            </Text>
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                                {language === 'fr' ? 'prix' : 'price'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Destination */}
                <View style={[styles.destinationCard, { backgroundColor: isDark ? '#252525' : colors.background }]}>
                    <View style={styles.destinationIcon}>
                        <Text style={styles.destinationEmoji}>📍</Text>
                    </View>
                    <View style={styles.destinationInfo}>
                        <Text style={[styles.destinationLabel, { color: colors.textSecondary }]}>
                            {language === 'fr' ? 'Destination' : 'Destination'}
                        </Text>
                        <Text style={[styles.destinationAddress, { color: colors.text }]} numberOfLines={1}>
                            {dropoffAddress || params.dest_address || 'Aéroport Félix Houphouët-Boigny'}
                        </Text>
                    </View>
                </View>

                {/* Chauffeur mini */}
                <View style={[styles.driverMini, { backgroundColor: isDark ? '#252525' : colors.background }]}>
                    <View style={styles.driverMiniAvatar}>
                        <Text style={styles.driverMiniEmoji}>👨🏾</Text>
                    </View>
                    <View style={styles.driverMiniInfo}>
                        <Text style={[styles.driverMiniName, { color: colors.text }]}>
                            {driver.firstName}
                        </Text>
                        <Text style={[styles.driverMiniLabel, { color: colors.textSecondary }]}>
                            {language === 'fr' ? 'Votre chauffeur' : 'Your driver'}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.callButton, { backgroundColor: '#4CAF5020' }]}
                        onPress={handleCall}
                    >
                        <Text style={styles.callEmoji}>📞</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.callButton, { backgroundColor: '#E91E6320' }]}
                        onPress={handleSOS}
                    >
                        <Text style={styles.callEmoji}>🆘</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.callButton, { backgroundColor: '#F4433620' }]}
                        onPress={handleCancel}
                    >
                        <Text style={styles.callEmoji}>❌</Text>
                    </TouchableOpacity>
                </View>
            </View>
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
    rideBadge: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    rideBadgeText: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 14,
    },
    emergencyButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#FF5252',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    emergencyEmoji: {
        fontSize: 24,
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

    // Progress
    progressSection: {
        marginBottom: SPACING.md,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    progressTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    progressPercent: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    progressBar: {
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: SPACING.md,
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        width: 1,
        height: 40,
    },
    statEmoji: {
        fontSize: 20,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 11,
    },

    // Destination
    destinationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        borderRadius: RADIUS.md,
        marginBottom: SPACING.md,
    },
    destinationIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    destinationEmoji: {
        fontSize: 22,
    },
    destinationInfo: {
        flex: 1,
    },
    destinationLabel: {
        fontSize: 12,
        marginBottom: 2,
    },
    destinationAddress: {
        fontSize: 14,
        fontWeight: '600',
    },

    // Driver mini
    driverMini: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        borderRadius: RADIUS.md,
    },
    driverMiniAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    driverMiniEmoji: {
        fontSize: 24,
    },
    driverMiniInfo: {
        flex: 1,
    },
    driverMiniName: {
        fontSize: 16,
        fontWeight: '600',
    },
    driverMiniLabel: {
        fontSize: 12,
    },
    callButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    callEmoji: {
        fontSize: 20,
    },
});
