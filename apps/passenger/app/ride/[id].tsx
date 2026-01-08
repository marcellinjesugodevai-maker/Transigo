// =============================================
// TRANSIGO - RIDE TRACKING SCREEN
// =============================================

import { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Linking,
    Dimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@/components/Icon';
import OSMMap from '@/components/OSMMap';
import { COLORS, SPACING } from '@/constants';
import { useLanguageStore, useThemeStore } from '@/stores';
import { getTranslation } from '@/i18n/translations';

const { width, height } = Dimensions.get('window');

// Helper interpolation
const interpolate = (start: number, end: number, progress: number) => {
    return start + (end - start) * progress;
};

export default function RideTrackingScreen() {
    const params = useLocalSearchParams();
    const { id } = params;

    // Coordonnées passées ou par défaut
    const pickupLocation = params.pickup_lat
        ? { latitude: Number(params.pickup_lat), longitude: Number(params.pickup_lon) }
        : { latitude: 5.3599, longitude: -3.9870 };
    const dropoffLocation = params.dest_lat
        ? { latitude: Number(params.dest_lat), longitude: Number(params.dest_lon) }
        : { latitude: 5.2539, longitude: -3.9263 };
    const initialDriverLoc = {
        latitude: pickupLocation.latitude + 0.02,
        longitude: pickupLocation.longitude + 0.02
    };

    const { language } = useLanguageStore();
    const { colors, isDark } = useThemeStore();
    const t = (key: any) => getTranslation(key, language);
    // const mapRef = useRef<any>(null); // Désactivé pour OSMMap

    // État de la course
    const [rideStatus, setRideStatus] = useState<'on_way' | 'arrived' | 'in_progress' | 'completed'>('on_way');
    const [progress, setProgress] = useState(0);
    const [currentDriverLoc, setCurrentDriverLoc] = useState(initialDriverLoc);
    const [etaProgress, setEtaProgress] = useState(params.duration ? Number(params.duration) : 5);

    // Simulation mouvement
    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => {
                const next = prev + 0.01;
                if (next >= 1) {
                    if (rideStatus === 'on_way') {
                        setRideStatus('arrived');
                        setTimeout(() => setRideStatus('in_progress'), 3000);
                        return 0; // Reset pour le trajet vers dropoff
                    } else if (rideStatus === 'in_progress') {
                        setRideStatus('completed');
                        clearInterval(interval);
                        return 1;
                    }
                }
                return next;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [rideStatus]);

    useEffect(() => {
        if (rideStatus === 'on_way') {
            setCurrentDriverLoc({
                latitude: interpolate(initialDriverLoc.latitude, pickupLocation.latitude, progress),
                longitude: interpolate(initialDriverLoc.longitude, pickupLocation.longitude, progress),
            });
            setEtaProgress(Math.max(1, Math.round(5 * (1 - progress))));
        } else if (rideStatus === 'in_progress') {
            setCurrentDriverLoc({
                latitude: interpolate(pickupLocation.latitude, dropoffLocation.latitude, progress),
                longitude: interpolate(pickupLocation.longitude, dropoffLocation.longitude, progress),
            });
            setEtaProgress(Math.max(1, Math.round(15 * (1 - progress))));
        }
    }, [progress, rideStatus]);

    // Informations du chauffeur
    const driver = {
        name: 'Moussa Traoré',
        avatar: '👨',
        rating: 4.9,
        phone: '+225 07 00 11 22',
        vehicle: 'Toyota Corolla',
        plate: 'AB 1234 CI',
        eta: `${etaProgress} min`,
    };

    const callDriver = () => {
        Linking.openURL(`tel:${driver.phone}`);
    };

    const getStatusMessage = () => {
        switch (rideStatus) {
            case 'on_way':
                return `${driver.name} arrive dans ${driver.eta}`;
            case 'arrived':
                return 'Votre chauffeur est arrivé';
            case 'in_progress':
                return 'Course en cours...';
            case 'completed':
                return 'Course terminée !';
            default:
                return '';
        }
    };

    const getStatusColor = () => {
        switch (rideStatus) {
            case 'on_way':
                return COLORS.primary;
            case 'arrived':
                return '#4CAF50';
            case 'in_progress':
                return '#2196F3';
            case 'completed':
                return '#4CAF50';
            default:
                return COLORS.textSecondary;
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Carte OSM avec suivi */}
            <OSMMap
                style={styles.map}
                initialRegion={{
                    latitude: (pickupLocation.latitude + dropoffLocation.latitude) / 2,
                    longitude: (pickupLocation.longitude + dropoffLocation.longitude) / 2,
                    latitudeDelta: 0.1,
                    longitudeDelta: 0.1,
                }}
                markers={[
                    { id: 'pickup', latitude: pickupLocation.latitude, longitude: pickupLocation.longitude },
                    { id: 'taxi', latitude: currentDriverLoc.latitude, longitude: currentDriverLoc.longitude },
                    { id: 'destination', latitude: dropoffLocation.latitude, longitude: dropoffLocation.longitude },
                ]}
                routeCoordinates={[pickupLocation, dropoffLocation]}
            />

            {/* Bouton retour */}
            <TouchableOpacity
                style={[styles.backButton, { backgroundColor: colors.card }]}
                onPress={() => router.back()}
                activeOpacity={0.8}
            >
                <Icon name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>

            {/* Panneau infos chauffeur */}
            <View style={[styles.bottomSheet, { backgroundColor: colors.card }]}>
                {/* Barre de statut */}
                <View style={[styles.statusBar, { backgroundColor: getStatusColor() }]}>
                    <Text style={[styles.statusText, { color: COLORS.white }]}>{getStatusMessage()}</Text>
                </View>

                {/* Infos chauffeur */}
                <View style={[styles.driverInfo, { borderBottomColor: isDark ? '#333' : '#F0F0F0' }]}>
                    <View style={[styles.driverAvatar, { backgroundColor: isDark ? colors.primary + '20' : '#FFF5F0' }]}>
                        <Text style={styles.driverAvatarText}>{driver.avatar}</Text>
                    </View>
                    <View style={styles.driverDetails}>
                        <Text style={[styles.driverName, { color: colors.text }]}>{driver.name}</Text>
                        <View style={styles.ratingContainer}>
                            <Text style={styles.starIcon}>⭐</Text>
                            <Text style={[styles.ratingText, { color: colors.text }]}>{driver.rating}</Text>
                        </View>
                        <Text style={[styles.vehicleText, { color: colors.textSecondary }]}>{driver.vehicle} • {driver.plate}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.callButton}
                        onPress={callDriver}
                        activeOpacity={0.9}
                    >
                        <LinearGradient
                            colors={['#4CAF50', '#2E7D32']}
                            style={styles.callButtonGradient}
                        >
                            <Text style={styles.callIcon}>📞</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* Actions */}
                <View style={styles.actionsContainer}>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: isDark ? '#333' : colors.background }]}
                        activeOpacity={0.9}
                        onPress={() => router.push('/chat/driver123' as any)}
                    >
                        <Icon name="chatbubble" size={20} color={COLORS.primary} />
                        <Text style={[styles.actionText, { color: colors.text }]}>Message</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.actionButton, { backgroundColor: isDark ? '#333' : colors.background }]} activeOpacity={0.9}>
                        <Icon name="shield" size={20} color={COLORS.primary} />
                        <Text style={[styles.actionText, { color: colors.text }]}>{t('shareRide') || 'Partager'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.actionButton, { backgroundColor: isDark ? '#333' : colors.background }]} activeOpacity={0.9}>
                        <Icon name="help-circle" size={20} color={COLORS.primary} />
                        <Text style={[styles.actionText, { color: colors.text }]}>{t('help')}</Text>
                    </TouchableOpacity>
                </View>

                {/* Bouton d'annulation (si statut le permet) */}
                {(rideStatus === 'on_way') && (
                    <TouchableOpacity style={styles.cancelButton} activeOpacity={0.9}>
                        <Text style={styles.cancelButtonText}>Annuler la course</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },

    // Markers
    driverMarker: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    driverMarkerIcon: {
        fontSize: 30,
    },
    pickupMarker: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#4CAF50',
    },
    pickupMarkerInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#4CAF50',
    },
    dropoffMarker: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: COLORS.primary,
    },
    dropoffMarkerInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: COLORS.primary,
    },

    // Bouton retour
    backButton: {
        position: 'absolute',
        top: 50,
        left: SPACING.lg,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },

    // Bottom Sheet
    bottomSheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 10,
    },

    // Barre de statut
    statusBar: {
        paddingVertical: 12,
        paddingHorizontal: SPACING.lg,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    statusText: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.white,
        textAlign: 'center',
    },

    // Infos chauffeur
    driverInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.lg,
        borderBottomWidth: 1,
    },
    driverAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.primaryBg,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    driverAvatarText: {
        fontSize: 30,
    },
    driverDetails: {
        flex: 1,
    },
    driverName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 4,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    starIcon: {
        fontSize: 14,
        marginRight: 4,
    },
    ratingText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
    },
    vehicleText: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    callButton: {
        borderRadius: 25,
        overflow: 'hidden',
    },
    callButtonGradient: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    callIcon: {
        fontSize: 24,
    },

    // Actions
    actionsContainer: {
        flexDirection: 'row',
        padding: SPACING.lg,
        gap: SPACING.sm,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.background,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 6,
    },
    actionText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.text,
    },

    // Annulation
    cancelButton: {
        marginHorizontal: SPACING.lg,
        marginBottom: SPACING.lg,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#F44336',
    },
    cancelButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#F44336',
        textAlign: 'center',
    },
});
