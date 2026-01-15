// =============================================
// TRANSIGO BUSINESS - ACTIVITY SCREEN
// Historique dynamique selon le profil (VTC/Livreur)
// =============================================

import { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { rideService } from '../../src/services/supabaseService';
import { useDriverStore } from '../../src/stores/driverStore';
import { useProfileTerms } from '../../src/hooks/useProfileTerms';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const COLORS = {
    primary: '#FF6B00',
    secondary: '#00C853',
    secondaryDark: '#00A344',
    white: '#FFFFFF',
    black: '#1A1A2E',
    gray50: '#FAFAFA',
    gray100: '#F5F5F5',
    gray600: '#757575',
    error: '#F44336',
};

type RideStatus = 'completed' | 'cancelled' | 'ongoing';

interface Ride {
    id: string;
    passengerName: string;
    passengerRating: number;
    pickup: string;
    dropoff: string;
    date: string;
    time: string;
    price: number;
    distance: number;
    duration: number;
    status: RideStatus;
    tip: number;
}



const FILTERS = [
    { id: 'all', label: 'Toutes', icon: '📋' },
    { id: 'completed', label: 'Terminées', icon: '✅' },
    { id: 'cancelled', label: 'Annulées', icon: '❌' },
];

export default function ActivityScreen() {
    const { driver } = useDriverStore();
    const terms = useProfileTerms(); // Dynamic terminology
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [rides, setRides] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (driver?.id) {
            loadHistory();
        }
    }, [driver?.id]);

    const loadHistory = async () => {
        setLoading(true);
        const { rides: data, error } = await rideService.getRideHistory(driver!.id);
        if (data) setRides(data);
        setLoading(false);
    };

    const filteredRides = rides.filter(ride =>
        selectedFilter === 'all' || ride.status === selectedFilter
    );

    const totalEarnings = rides.filter(r => r.status === 'completed').reduce((sum, r) => sum + (r.price || 0) + (r.tip || 0), 0);
    const totalRides = rides.filter(r => r.status === 'completed').length;
    const totalTips = rides.filter(r => r.status === 'completed').reduce((sum, r) => sum + (r.tip || 0), 0);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return { label: 'Terminée', color: COLORS.secondary, bg: '#E8F5E9' };
            case 'cancelled':
                return { label: 'Annulée', color: COLORS.error, bg: '#FFEBEE' };
            default:
                return { label: 'En cours', color: COLORS.primary, bg: '#FFF3E0' };
        }
    };

    const renderRide = ({ item }: { item: any }) => {
        const badge = getStatusBadge(item.status);
        const dateObj = new Date(item.created_at);
        const dateStr = format(dateObj, "d MMM", { locale: fr });
        const timeStr = format(dateObj, "HH:mm");
        const passenger = item.users || { first_name: 'Client', last_name: 'TransiGo' };
        const passengerName = `${passenger.first_name} ${passenger.last_name}`;

        return (
            <View style={styles.rideCard}>
                {/* Header */}
                <View style={styles.rideHeader}>
                    <View style={styles.passengerRow}>
                        <View style={styles.passengerAvatar}>
                            <Text style={styles.avatarText}>{passengerName.charAt(0)}</Text>
                        </View>
                        <View style={styles.passengerInfo}>
                            <Text style={styles.passengerName}>{passengerName}</Text>
                            <View style={styles.ratingRow}>
                                <Text style={{ fontSize: 12 }}>⭐</Text>
                                <Text style={styles.ratingText}>4.8</Text>
                            </View>
                        </View>
                    </View>
                    <View style={styles.priceSection}>
                        <Text style={[styles.priceText, item.status === 'cancelled' && styles.priceCancelled]}>
                            {(item.price || 0).toLocaleString('fr-FR')} F
                        </Text>
                        {item.tip > 0 && (
                            <Text style={styles.tipText}>+{item.tip} F pourboire</Text>
                        )}
                    </View>
                </View>

                {/* Route */}
                <View style={styles.routeSection}>
                    <View style={styles.routePoint}>
                        <View style={styles.dotGreen} />
                        <Text style={styles.routeAddress} numberOfLines={1}>{item.pickup_address}</Text>
                    </View>
                    <View style={styles.routeLine} />
                    <View style={styles.routePoint}>
                        <View style={styles.dotOrange} />
                        <Text style={styles.routeAddress} numberOfLines={1}>{item.dropoff_address}</Text>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.rideFooter}>
                    <View style={styles.rideStats}>
                        <View style={styles.rideStat}>
                            <Text style={{ fontSize: 14 }}>📅</Text>
                            <Text style={styles.rideStatText}>{dateStr}, {timeStr}</Text>
                        </View>
                        <View style={styles.rideStat}>
                            <Text style={{ fontSize: 14 }}>📍</Text>
                            <Text style={styles.rideStatText}>{item.distance_km || 0} km</Text>
                        </View>
                        <View style={styles.rideStat}>
                            <Text style={{ fontSize: 14 }}>⏱️</Text>
                            <Text style={styles.rideStatText}>{item.duration_min || 0} min</Text>
                        </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.statusText, { color: badge.color }]}>{badge.label}</Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient colors={[COLORS.secondary, COLORS.secondaryDark]} style={styles.header}>
                <Text style={styles.headerTitle}>📋 Mon Activité</Text>

                {/* Stats */}
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{totalRides}</Text>
                        <Text style={styles.statLabel}>{terms.tripsCapital}</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{totalEarnings.toLocaleString('fr-FR')} F</Text>
                        <Text style={styles.statLabel}>Gains</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{totalTips.toLocaleString('fr-FR')} F</Text>
                        <Text style={styles.statLabel}>Pourboires</Text>
                    </View>
                </View>
            </LinearGradient>

            {/* Filters */}
            <View style={styles.filtersContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {FILTERS.map((filter) => (
                        <TouchableOpacity
                            key={filter.id}
                            style={[
                                styles.filterChip,
                                selectedFilter === filter.id && styles.filterChipActive
                            ]}
                            onPress={() => setSelectedFilter(filter.id)}
                        >
                            <Text style={styles.filterIcon}>{filter.icon}</Text>
                            <Text style={[
                                styles.filterLabel,
                                selectedFilter === filter.id && styles.filterLabelActive
                            ]}>
                                {filter.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Rides list */}
            {loading ? (
                <View style={styles.emptyContainer}>
                    <ActivityIndicator size="large" color={COLORS.secondary} />
                    <Text style={[styles.emptyText, { marginTop: 12 }]}>Chargement de l'historique...</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredRides}
                    renderItem={renderRide}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    onRefresh={loadHistory}
                    refreshing={loading}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={() => (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIcon}>{terms.isDelivery ? '📦' : '🚗'}</Text>
                            <Text style={styles.emptyText}>Aucune {terms.trip} trouvée</Text>
                        </View>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.gray50 },

    // Header
    header: {
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.white, marginBottom: 16 },
    statsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: 16 },
    statCard: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 18, fontWeight: 'bold', color: COLORS.white },
    statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
    statDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.2)' },

    // Filters
    filtersContainer: { paddingVertical: 12, paddingHorizontal: 16 },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.gray100,
    },
    filterChipActive: { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary },
    filterIcon: { fontSize: 14, marginRight: 6 },
    filterLabel: { fontSize: 13, fontWeight: '600', color: COLORS.gray600 },
    filterLabelActive: { color: COLORS.white },

    // List
    listContent: { paddingHorizontal: 16, paddingBottom: 100 },

    // Ride card
    rideCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    rideHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    passengerRow: { flexDirection: 'row', alignItems: 'center' },
    passengerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary },
    passengerInfo: { marginLeft: 10 },
    passengerName: { fontSize: 14, fontWeight: '600', color: COLORS.black },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    ratingText: { fontSize: 12, color: COLORS.gray600 },
    priceSection: { alignItems: 'flex-end' },
    priceText: { fontSize: 16, fontWeight: 'bold', color: COLORS.secondary },
    priceCancelled: { textDecorationLine: 'line-through', color: COLORS.gray600 },
    tipText: { fontSize: 11, color: COLORS.primary, marginTop: 2 },

    // Route
    routeSection: { marginBottom: 12 },
    routePoint: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    dotGreen: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.secondary },
    dotOrange: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },
    routeLine: { width: 2, height: 12, backgroundColor: COLORS.gray100, marginLeft: 4, marginVertical: 2 },
    routeAddress: { flex: 1, fontSize: 13, color: COLORS.black },

    // Footer
    rideFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    rideStats: { flexDirection: 'row', gap: 12 },
    rideStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    rideStatText: { fontSize: 11, color: COLORS.gray600 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    statusText: { fontSize: 11, fontWeight: '600' },

    // Empty
    emptyContainer: { alignItems: 'center', paddingVertical: 60 },
    emptyIcon: { fontSize: 50, marginBottom: 12 },
    emptyText: { fontSize: 14, color: COLORS.gray600 },
});
