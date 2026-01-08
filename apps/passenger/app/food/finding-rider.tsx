// =============================================
// TRANSIGO FOOD - RECHERCHE LIVREUR (PREMIUM)
// Animation moderne pendant la recherche
// =============================================

import { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Easing,
    Alert,
    StatusBar,
    Dimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@/components/Icon';
import { COLORS, SPACING, RADIUS } from '@/constants';
import { useThemeStore, useLanguageStore } from '@/stores';
import { getTranslation } from '@/i18n/translations';

const { width, height } = Dimensions.get('window');

type OrderStatus = 'confirming' | 'preparing' | 'finding_rider' | 'rider_found';

const STATUS_CONFIG = {
    confirming: {
        label: 'Confirmation de la commande',
        labelEn: 'Confirming order',
        icon: '📋',
        color: '#2196F3',
        gradient: ['#2196F3', '#1976D2']
    },
    preparing: {
        label: 'Préparation en cours',
        labelEn: 'Preparing your order',
        icon: '👨‍🍳',
        color: '#FF9800',
        gradient: ['#FF9800', '#F57C00']
    },
    finding_rider: {
        label: 'Recherche d\'un livreur',
        labelEn: 'Finding a rider',
        icon: '🏍',
        color: '#9C27B0',
        gradient: ['#9C27B0', '#7B1FA2']
    },
    rider_found: {
        label: 'Livreur trouvé !',
        labelEn: 'Rider found!',
        icon: '✅',
        color: '#4CAF50',
        gradient: ['#4CAF50', '#388E3C']
    },
};

const MOCK_RIDER = {
    name: 'Koné Ahmed',
    phone: '+225 07 00 00 00',
    rating: 4.8,
    deliveries: 342,
    vehicle: 'Moto',
    plate: 'MC-1234-CI',
    avatar: '👨🏾',
};

export default function FindingRiderScreen() {
    const params = useLocalSearchParams();
    const { isDark, colors } = useThemeStore();
    const { language } = useLanguageStore();
    const t = (key: any) => getTranslation(key, language);

    // Paramètres
    const restaurantName = params.restaurant_name as string || 'Restaurant';
    const restaurantImage = params.restaurant_image as string || '🍽️';
    const deliveryAddress = params.delivery_address as string || 'Adresse';
    const total = Number(params.total) || 0;
    const deliveryTime = params.delivery_time as string || '30-45';
    const itemsCount = Number(params.items_count) || 0;

    // États
    const [status, setStatus] = useState<OrderStatus>('confirming');
    const [rider, setRider] = useState<typeof MOCK_RIDER | null>(null);

    // Animations
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Animations
        Animated.parallel([
            Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
            Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ]).start();

        // Pulse
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
            ])
        ).start();

        // Rotation
        Animated.loop(
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 3000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();

        // Progression automatique
        const timers = [
            setTimeout(() => setStatus('preparing'), 2000),
            setTimeout(() => setStatus('finding_rider'), 6000),
            setTimeout(() => {
                setStatus('rider_found');
                setRider(MOCK_RIDER);
            }, 10000),
        ];

        // Redirection automatique
        const redirectTimer = setTimeout(() => {
            handleContinue();
        }, 13000);

        return () => {
            timers.forEach(t => clearTimeout(t));
            clearTimeout(redirectTimer);
        };
    }, []);

    const rotateInterpolate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const handleCancel = () => {
        Alert.alert(
            language === 'fr' ? '❌ Annuler la commande' : '❌ Cancel order',
            language === 'fr' ? 'Voulez-vous vraiment annuler ?' : 'Do you really want to cancel?',
            [
                { text: language === 'fr' ? 'Non' : 'No', style: 'cancel' },
                { text: language === 'fr' ? 'Oui, annuler' : 'Yes, cancel', onPress: () => router.back(), style: 'destructive' },
            ]
        );
    };

    const handleContinue = () => {
        router.replace({
            pathname: '/food/tracking',
            params: {
                restaurant_name: restaurantName,
                restaurant_image: restaurantImage,
                delivery_address: deliveryAddress,
                delivery_lat: params.delivery_lat,
                delivery_lon: params.delivery_lon,
                total: total,
                delivery_time: deliveryTime,
                rider_name: rider?.name || MOCK_RIDER.name,
                rider_phone: rider?.phone || MOCK_RIDER.phone,
                rider_rating: rider?.rating || MOCK_RIDER.rating,
                rider_plate: rider?.plate || MOCK_RIDER.plate,
            }
        });
    };

    const currentStatus = STATUS_CONFIG[status];
    const statusIndex = Object.keys(STATUS_CONFIG).indexOf(status);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Background gradient */}
            <LinearGradient
                colors={currentStatus.gradient as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            />

            {/* Decorative circles */}
            <View style={styles.decorativeCircles}>
                <Animated.View style={[styles.decorCircle, styles.decorCircle1, { transform: [{ scale: pulseAnim }] }]} />
                <Animated.View style={[styles.decorCircle, styles.decorCircle2, { transform: [{ scale: Animated.multiply(pulseAnim, 0.8) }] }]} />
                <Animated.View style={[styles.decorCircle, styles.decorCircle3, { transform: [{ scale: Animated.multiply(pulseAnim, 0.6) }] }]} />
            </View>

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.closeButton} onPress={handleCancel}>
                    <Icon name="close" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerRestaurant}>{restaurantImage} {restaurantName}</Text>
                </View>
                <View style={{ width: 44 }} />
            </View>

            {/* Progress steps */}
            <View style={styles.progressContainer}>
                {Object.entries(STATUS_CONFIG).map(([key, config], index) => (
                    <View key={key} style={styles.progressStep}>
                        <View style={[
                            styles.progressDot,
                            index <= statusIndex && styles.progressDotActive
                        ]}>
                            <Text style={styles.progressDotIcon}>{config.icon}</Text>
                        </View>
                        {index < Object.keys(STATUS_CONFIG).length - 1 && (
                            <View style={[
                                styles.progressLine,
                                index < statusIndex && styles.progressLineActive
                            ]} />
                        )}
                    </View>
                ))}
            </View>

            {/* Main animation */}
            <Animated.View style={[
                styles.animationContainer,
                { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
            ]}>
                <View style={styles.pulseContainer}>
                    <Animated.View style={[styles.pulseRing, styles.pulseRing3, { transform: [{ scale: pulseAnim }] }]} />
                    <Animated.View style={[styles.pulseRing, styles.pulseRing2, { transform: [{ scale: Animated.multiply(pulseAnim, 0.85) }] }]} />
                    <Animated.View style={[styles.pulseRing, styles.pulseRing1, { transform: [{ scale: Animated.multiply(pulseAnim, 0.7) }] }]} />
                </View>

                <Animated.View style={[
                    styles.centerCircle,
                    status === 'finding_rider' && { transform: [{ rotate: rotateInterpolate }] }
                ]}>
                    <Text style={styles.centerIcon}>{currentStatus.icon}</Text>
                </Animated.View>
            </Animated.View>

            {/* Status text */}
            <View style={styles.statusContainer}>
                <Text style={styles.statusTitle}>
                    {language === 'fr' ? currentStatus.label : currentStatus.labelEn}
                </Text>
                {status !== 'rider_found' && (
                    <Text style={styles.statusSubtitle}>
                        {language === 'fr' ? 'Veuillez patienter...' : 'Please wait...'}
                    </Text>
                )}
            </View>

            {/* Rider card */}
            {rider && status === 'rider_found' && (
                <View style={styles.riderCard}>
                    <View style={styles.riderCardHeader}>
                        <View style={styles.riderAvatar}>
                            <Text style={styles.riderAvatarEmoji}>{rider.avatar}</Text>
                        </View>
                        <View style={styles.riderInfo}>
                            <Text style={styles.riderName}>{rider.name}</Text>
                            <View style={styles.riderMeta}>
                                <Text style={styles.riderRating}>⭐ {rider.rating}</Text>
                                <Text style={styles.riderDeliveries}>• {rider.deliveries} livraisons</Text>
                            </View>
                        </View>
                    </View>
                    <View style={styles.riderCardFooter}>
                        <View style={styles.riderVehicle}>
                            <Text style={styles.riderVehicleIcon}>🏍</Text>
                            <Text style={styles.riderVehicleText}>{rider.vehicle}</Text>
                        </View>
                        <View style={styles.riderPlate}>
                            <Text style={styles.riderPlateText}>{rider.plate}</Text>
                        </View>
                    </View>
                </View>
            )}

            {/* Order summary */}
            <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>📦 {itemsCount} article{itemsCount > 1 ? 's' : ''}</Text>
                    <Text style={styles.summaryValue}>{total.toLocaleString('fr-FR')} F</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>⏱️ {language === 'fr' ? 'Livraison estimée' : 'Est. delivery'}</Text>
                    <Text style={styles.summaryValue}>{deliveryTime} min</Text>
                </View>
            </View>

            {/* Action button */}
            <View style={styles.actionContainer}>
                {status === 'rider_found' ? (
                    <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
                        <Text style={styles.continueText}>
                            {language === 'fr' ? 'Suivre ma commande →' : 'Track my order →'}
                        </Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                        <Text style={styles.cancelText}>
                            {language === 'fr' ? 'Annuler la commande' : 'Cancel order'}
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
    gradient: {
        ...StyleSheet.absoluteFillObject,
    },

    // Decorative
    decorativeCircles: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    decorCircle: {
        position: 'absolute',
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    decorCircle1: {
        width: 300,
        height: 300,
    },
    decorCircle2: {
        width: 400,
        height: 400,
    },
    decorCircle3: {
        width: 500,
        height: 500,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingTop: 50,
    },
    closeButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerCenter: {},
    headerRestaurant: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.white,
    },

    // Progress
    progressContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING.xl,
        marginTop: SPACING.xl,
    },
    progressStep: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    progressDot: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressDotActive: {
        backgroundColor: COLORS.white,
    },
    progressDotIcon: {
        fontSize: 18,
    },
    progressLine: {
        width: 30,
        height: 3,
        backgroundColor: 'rgba(255,255,255,0.3)',
        marginHorizontal: 4,
    },
    progressLineActive: {
        backgroundColor: COLORS.white,
    },

    // Animation
    animationContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pulseContainer: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pulseRing: {
        position: 'absolute',
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    pulseRing1: {
        width: 140,
        height: 140,
    },
    pulseRing2: {
        width: 200,
        height: 200,
    },
    pulseRing3: {
        width: 260,
        height: 260,
    },
    centerCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 10,
    },
    centerIcon: {
        fontSize: 48,
    },

    // Status
    statusContainer: {
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    statusTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.white,
        textAlign: 'center',
    },
    statusSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 6,
    },

    // Rider card
    riderCard: {
        backgroundColor: COLORS.white,
        marginHorizontal: SPACING.lg,
        borderRadius: 20,
        padding: SPACING.lg,
        marginBottom: SPACING.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 5,
    },
    riderCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    riderAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#FF572220',
        justifyContent: 'center',
        alignItems: 'center',
    },
    riderAvatarEmoji: {
        fontSize: 30,
    },
    riderInfo: {
        marginLeft: SPACING.md,
        flex: 1,
    },
    riderName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    riderMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    riderRating: {
        fontSize: 14,
        fontWeight: '600',
    },
    riderDeliveries: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginLeft: 4,
    },
    riderCardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: SPACING.sm,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    riderVehicle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    riderVehicleIcon: {
        fontSize: 18,
    },
    riderVehicleText: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    riderPlate: {
        backgroundColor: '#F0F0F0',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    riderPlateText: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.text,
    },

    // Summary
    summaryCard: {
        backgroundColor: COLORS.white,
        marginHorizontal: SPACING.lg,
        borderRadius: 16,
        padding: SPACING.md,
        marginBottom: SPACING.lg,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    summaryLabel: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.text,
    },

    // Actions
    actionContainer: {
        paddingHorizontal: SPACING.lg,
        paddingBottom: 40,
    },
    continueButton: {
        backgroundColor: COLORS.white,
        paddingVertical: 18,
        borderRadius: 30,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 5,
    },
    continueText: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    cancelButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    cancelText: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.white,
    },
});
