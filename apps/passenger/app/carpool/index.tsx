// =============================================
// TRANSIGO - CARPOOL SCREEN (Covoiturage)
// =============================================

import { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@/components/Icon';
import { COLORS, SPACING, RADIUS } from '@/constants';
import { useThemeStore, useAuthStore } from '@/stores';
import { useCarpoolStore, SharedRide } from '@/stores/carpoolStore';
import { carpoolService } from '@/services/carpoolService';

export default function CarpoolScreen() {
    const params = useLocalSearchParams();
    const { colors, isDark } = useThemeStore();
    const { user } = useAuthStore();
    const { availableRides, setAvailableRides, isLoading, setLoading } = useCarpoolStore();

    const [refreshing, setRefreshing] = useState(false);

    // Destination de l'utilisateur (passée en paramètre)
    const destLat = params.dest_lat ? Number(params.dest_lat) : 5.2539;
    const destLon = params.dest_lon ? Number(params.dest_lon) : -3.9263;
    const destAddress = params.dest_address as string || 'Destination';

    useEffect(() => {
        loadAvailableRides();
    }, []);

    const loadAvailableRides = async () => {
        setLoading(true);
        const { rides } = await carpoolService.findAvailableRides(destLat, destLon);
        setAvailableRides(rides);
        setLoading(false);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadAvailableRides();
        setRefreshing(false);
    };

    const handleJoinRide = async (ride: SharedRide) => {
        if (!user) {
            Alert.alert('Erreur', 'Vous devez être connecté');
            return;
        }

        Alert.alert(
            'Rejoindre cette course ?',
            `Vous paierez ${ride.current_price_per_person.toLocaleString()} F CFA`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Rejoindre',
                    onPress: async () => {
                        setLoading(true);
                        const { success, newPrice, error } = await carpoolService.joinRide(
                            ride.id,
                            user.id,
                            user.phone || '',
                            user.firstName,
                            {
                                address: params.pickup_address as string || 'Mon emplacement',
                                lat: params.pickup_lat ? Number(params.pickup_lat) : 5.3599,
                                lon: params.pickup_lon ? Number(params.pickup_lon) : -3.9870,
                            },
                            {
                                address: destAddress,
                                lat: destLat,
                                lon: destLon,
                            }
                        );

                        setLoading(false);

                        if (success) {
                            Alert.alert(
                                '🎉 Course rejointe !',
                                `Nouveau prix: ${newPrice?.toLocaleString()} F CFA par personne`,
                                [{ text: 'OK', onPress: () => router.push(`/ride/${ride.id}`) }]
                            );
                        } else {
                            Alert.alert('Erreur', error || 'Impossible de rejoindre');
                        }
                    }
                }
            ]
        );
    };

    const handleCreateNew = () => {
        // Retourner à booking avec option de créer course partageable
        router.push({
            pathname: '/booking',
            params: {
                ...params,
                enable_carpool: 'true',
            },
        });
    };

    const getTimeAgo = (createdAt: string) => {
        const diff = Date.now() - new Date(createdAt).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return 'À l\'instant';
        if (minutes < 60) return `Il y a ${minutes} min`;
        return `Il y a ${Math.floor(minutes / 60)}h`;
    };

    const getSavingsPercent = (ride: SharedRide) => {
        const savings = ((ride.base_price - ride.current_price_per_person) / ride.base_price) * 100;
        return Math.round(savings);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.card }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Icon name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>🚗 Covoiturage</Text>
                    <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                        Vers: {destAddress.substring(0, 25)}...
                    </Text>
                </View>
                <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
                    <Icon name="refresh" size={24} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            {/* Bannière d'info */}
            <View style={[styles.infoBanner, { backgroundColor: isDark ? '#1e3a5f' : '#e0f2fe' }]}>
                <Text style={styles.infoBannerIcon}>💡</Text>
                <Text style={[styles.infoBannerText, { color: isDark ? '#93c5fd' : '#0369a1' }]}>
                    Partagez votre trajet et économisez jusqu'à 75% !
                </Text>
            </View>

            {/* Liste des courses disponibles */}
            <ScrollView
                style={styles.list}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
                }
            >
                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                            Recherche de courses...
                        </Text>
                    </View>
                ) : availableRides.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>🔍</Text>
                        <Text style={[styles.emptyTitle, { color: colors.text }]}>
                            Aucune course disponible
                        </Text>
                        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                            Créez votre propre course et laissez d'autres vous rejoindre !
                        </Text>
                    </View>
                ) : (
                    availableRides.map((ride) => (
                        <TouchableOpacity
                            key={ride.id}
                            style={[styles.rideCard, { backgroundColor: colors.card }]}
                            onPress={() => handleJoinRide(ride)}
                            activeOpacity={0.8}
                        >
                            {/* Badge économie */}
                            {getSavingsPercent(ride) > 0 && (
                                <View style={styles.savingsBadge}>
                                    <Text style={styles.savingsBadgeText}>
                                        -{getSavingsPercent(ride)}%
                                    </Text>
                                </View>
                            )}

                            {/* En-tête de la carte */}
                            <View style={styles.rideHeader}>
                                <View style={styles.rideCreator}>
                                    <View style={[styles.creatorAvatar, { backgroundColor: COLORS.primary + '20' }]}>
                                        <Text style={styles.creatorAvatarText}>👤</Text>
                                    </View>
                                    <View>
                                        <Text style={[styles.creatorName, { color: colors.text }]}>
                                            Passager
                                        </Text>
                                        <Text style={[styles.createdAt, { color: colors.textSecondary }]}>
                                            {getTimeAgo(ride.created_at)}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.passengerCount}>
                                    <Text style={styles.passengerIcon}>👥</Text>
                                    <Text style={[styles.passengerText, { color: colors.text }]}>
                                        {ride.current_passengers}/{ride.max_passengers}
                                    </Text>
                                </View>
                            </View>

                            {/* Trajet */}
                            <View style={styles.routeContainer}>
                                <View style={styles.routePoint}>
                                    <View style={[styles.routeDot, { backgroundColor: '#4CAF50' }]} />
                                    <Text style={[styles.routeAddress, { color: colors.text }]} numberOfLines={1}>
                                        {ride.pickup_address}
                                    </Text>
                                </View>
                                <View style={styles.routeLine} />
                                <View style={styles.routePoint}>
                                    <View style={[styles.routeDot, { backgroundColor: COLORS.primary }]} />
                                    <Text style={[styles.routeAddress, { color: colors.text }]} numberOfLines={1}>
                                        {ride.dropoff_address}
                                    </Text>
                                </View>
                            </View>

                            {/* Prix */}
                            <View style={styles.priceContainer}>
                                <View>
                                    <Text style={[styles.originalPrice, { color: colors.textSecondary }]}>
                                        Prix initial: {ride.base_price.toLocaleString()} F
                                    </Text>
                                    <Text style={[styles.currentPrice, { color: COLORS.primary }]}>
                                        Votre part: {ride.current_price_per_person.toLocaleString()} F CFA
                                    </Text>
                                </View>
                                <View style={styles.joinBtnContainer}>
                                    <LinearGradient
                                        colors={['#f97316', '#ea580c']}
                                        style={styles.joinBtn}
                                    >
                                        <Text style={styles.joinBtnText}>Rejoindre</Text>
                                    </LinearGradient>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>

            {/* Bouton créer une nouvelle course */}
            <View style={[styles.bottomBar, { backgroundColor: colors.card }]}>
                <TouchableOpacity
                    style={styles.createButton}
                    onPress={handleCreateNew}
                    activeOpacity={0.9}
                >
                    <LinearGradient
                        colors={['#f97316', '#ea580c']}
                        style={styles.createButtonGradient}
                    >
                        <Icon name="add" size={24} color={COLORS.white} />
                        <Text style={styles.createButtonText}>
                            Créer une course partageable
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 50,
        paddingBottom: 16,
        paddingHorizontal: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerCenter: {
        flex: 1,
        marginLeft: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        fontSize: 12,
        marginTop: 2,
    },
    refreshBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        marginHorizontal: SPACING.md,
        marginTop: SPACING.md,
        borderRadius: RADIUS.md,
    },
    infoBannerIcon: {
        fontSize: 20,
        marginRight: 10,
    },
    infoBannerText: {
        flex: 1,
        fontSize: 13,
    },
    list: {
        flex: 1,
    },
    listContent: {
        padding: SPACING.md,
        paddingBottom: 100,
    },
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyIcon: {
        fontSize: 60,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    rideCard: {
        borderRadius: RADIUS.lg,
        padding: SPACING.md,
        marginBottom: SPACING.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        position: 'relative',
    },
    savingsBadge: {
        position: 'absolute',
        top: -8,
        right: 16,
        backgroundColor: '#4CAF50',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    savingsBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    rideHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    rideCreator: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    creatorAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    creatorAvatarText: {
        fontSize: 20,
    },
    creatorName: {
        fontSize: 14,
        fontWeight: '600',
    },
    createdAt: {
        fontSize: 11,
    },
    passengerCount: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
    },
    passengerIcon: {
        fontSize: 14,
        marginRight: 4,
    },
    passengerText: {
        fontSize: 13,
        fontWeight: '600',
    },
    routeContainer: {
        marginBottom: 12,
    },
    routePoint: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    routeDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 10,
    },
    routeLine: {
        width: 2,
        height: 20,
        backgroundColor: '#e0e0e0',
        marginLeft: 4,
        marginVertical: 4,
    },
    routeAddress: {
        flex: 1,
        fontSize: 13,
    },
    priceContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 12,
    },
    originalPrice: {
        fontSize: 12,
        textDecorationLine: 'line-through',
    },
    currentPrice: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    joinBtnContainer: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    joinBtn: {
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    joinBtnText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: SPACING.md,
        paddingBottom: 30,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    createButton: {
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
    },
    createButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    createButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
