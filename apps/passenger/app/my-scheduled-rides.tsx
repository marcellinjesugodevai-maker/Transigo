// =============================================
// TRANSIGO - MY SCHEDULED RIDES SCREEN
// =============================================

import { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@/components/Icon';
import { COLORS, SPACING } from '@/constants';
import { scheduledRidesService, ScheduledRideDB } from '@/services/scheduledRidesService';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
    pending: { label: 'En attente', color: '#FF9800', icon: '⏳' },
    confirmed: { label: 'Confirmé', color: '#4CAF50', icon: '✅' },
    driver_on_way: { label: 'Chauffeur en route', color: '#2196F3', icon: '🚗' },
    in_progress: { label: 'En cours', color: '#9C27B0', icon: '🚀' },
    completed: { label: 'Terminé', color: '#607D8B', icon: '✓' },
    cancelled: { label: 'Annulé', color: '#F44336', icon: '✗' },
};

export default function MyScheduledRidesScreen() {
    const [rides, setRides] = useState<ScheduledRideDB[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadRides();
    }, []);

    const loadRides = async () => {
        setIsLoading(true);
        const { rides: data } = await scheduledRidesService.getMyScheduledRides();
        setRides(data);
        setIsLoading(false);
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadRides().then(() => setRefreshing(false));
    }, []);

    const handleCancel = async (rideId: string) => {
        Alert.alert(
            'Annuler la réservation ?',
            'Cette action est irréversible.',
            [
                { text: 'Non', style: 'cancel' },
                {
                    text: 'Oui, annuler',
                    style: 'destructive',
                    onPress: async () => {
                        const { success } = await scheduledRidesService.cancelScheduledRide(rideId);
                        if (success) {
                            loadRides();
                        }
                    },
                },
            ]
        );
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
    };

    const upcomingRides = rides.filter(r => ['pending', 'confirmed', 'driver_on_way'].includes(r.status));
    const pastRides = rides.filter(r => ['completed', 'cancelled', 'in_progress'].includes(r.status));

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                style={styles.header}
            >
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                    activeOpacity={0.8}
                >
                    <Icon name="arrow-back" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>📅 Mes Réservations</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => router.push('/schedule-ride')}
                    activeOpacity={0.8}
                >
                    <Icon name="add" size={28} color={COLORS.white} />
                </TouchableOpacity>
            </LinearGradient>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[COLORS.primary]}
                    />
                }
            >
                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                        <Text style={styles.loadingText}>Chargement...</Text>
                    </View>
                ) : rides.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyEmoji}>📅</Text>
                        <Text style={styles.emptyTitle}>Aucune réservation</Text>
                        <Text style={styles.emptyText}>
                            Réservez une course à l'avance pour ne jamais être en retard !
                        </Text>
                        <TouchableOpacity
                            style={styles.createButton}
                            onPress={() => router.push('/schedule-ride')}
                            activeOpacity={0.9}
                        >
                            <LinearGradient
                                colors={[COLORS.primary, COLORS.primaryDark]}
                                style={styles.createButtonGradient}
                            >
                                <Icon name="add" size={24} color={COLORS.white} />
                                <Text style={styles.createButtonText}>Nouvelle réservation</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        {/* À venir */}
                        {upcomingRides.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>🚗 À venir</Text>
                                {upcomingRides.map(ride => (
                                    <View key={ride.id} style={styles.rideCard}>
                                        <View style={styles.rideHeader}>
                                            <View style={styles.dateContainer}>
                                                <Text style={styles.dateText}>{formatDate(ride.scheduled_date)}</Text>
                                                <Text style={styles.timeText}>{ride.scheduled_time}</Text>
                                            </View>
                                            <View style={[styles.statusBadge, { backgroundColor: STATUS_CONFIG[ride.status]?.color + '20' }]}>
                                                <Text style={[styles.statusText, { color: STATUS_CONFIG[ride.status]?.color }]}>
                                                    {STATUS_CONFIG[ride.status]?.icon} {STATUS_CONFIG[ride.status]?.label}
                                                </Text>
                                            </View>
                                        </View>

                                        <View style={styles.routeContainer}>
                                            <View style={styles.routePoint}>
                                                <View style={[styles.dot, { backgroundColor: '#4CAF50' }]} />
                                                <Text style={styles.locationText} numberOfLines={1}>
                                                    {ride.pickup_address}
                                                </Text>
                                            </View>
                                            <View style={styles.routeLine} />
                                            <View style={styles.routePoint}>
                                                <View style={[styles.dot, { backgroundColor: COLORS.primary }]} />
                                                <Text style={styles.locationText} numberOfLines={1}>
                                                    {ride.dropoff_address}
                                                </Text>
                                            </View>
                                        </View>

                                        <View style={styles.rideFooter}>
                                            <View style={styles.priceContainer}>
                                                <Text style={styles.priceLabel}>Prix estimé</Text>
                                                <Text style={styles.priceValue}>
                                                    {ride.estimated_price.toLocaleString('fr-FR')} F
                                                </Text>
                                            </View>
                                            {ride.driver_name ? (
                                                <View style={styles.driverBadge}>
                                                    <Text style={styles.driverText}>👤 {ride.driver_name}</Text>
                                                </View>
                                            ) : (
                                                <TouchableOpacity
                                                    style={styles.cancelButton}
                                                    onPress={() => handleCancel(ride.id)}
                                                >
                                                    <Text style={styles.cancelButtonText}>Annuler</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Historique */}
                        {pastRides.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>📜 Historique</Text>
                                {pastRides.map(ride => (
                                    <View key={ride.id} style={[styles.rideCard, styles.rideCardPast]}>
                                        <View style={styles.rideHeader}>
                                            <View style={styles.dateContainer}>
                                                <Text style={styles.dateTextPast}>{formatDate(ride.scheduled_date)}</Text>
                                                <Text style={styles.timeTextPast}>{ride.scheduled_time}</Text>
                                            </View>
                                            <View style={[styles.statusBadge, { backgroundColor: STATUS_CONFIG[ride.status]?.color + '20' }]}>
                                                <Text style={[styles.statusText, { color: STATUS_CONFIG[ride.status]?.color }]}>
                                                    {STATUS_CONFIG[ride.status]?.icon} {STATUS_CONFIG[ride.status]?.label}
                                                </Text>
                                            </View>
                                        </View>
                                        <Text style={styles.routeTextSimple}>
                                            {ride.pickup_address} → {ride.dropoff_address}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 50,
        paddingBottom: SPACING.lg,
        paddingHorizontal: SPACING.lg,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.white },
    addButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { padding: SPACING.lg },
    loadingContainer: { alignItems: 'center', paddingVertical: 60 },
    loadingText: { marginTop: 12, color: COLORS.textSecondary },
    emptyState: { alignItems: 'center', paddingVertical: SPACING.xl * 2 },
    emptyEmoji: { fontSize: 80, marginBottom: SPACING.md },
    emptyTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.sm },
    emptyText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SPACING.xl, paddingHorizontal: SPACING.xl },
    createButton: { borderRadius: 16, overflow: 'hidden' },
    createButtonGradient: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: SPACING.xl, gap: SPACING.sm },
    createButtonText: { fontSize: 16, fontWeight: 'bold', color: COLORS.white },
    section: { marginBottom: SPACING.xl },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.md },
    rideCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: SPACING.lg,
        marginBottom: SPACING.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    rideCardPast: { opacity: 0.7 },
    rideHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.md },
    dateContainer: {},
    dateText: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
    timeText: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
    dateTextPast: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
    timeTextPast: { fontSize: 13, color: COLORS.textSecondary },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusText: { fontSize: 11, fontWeight: 'bold' },
    routeContainer: { marginBottom: SPACING.md },
    routePoint: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
    dot: { width: 10, height: 10, borderRadius: 5 },
    routeLine: { width: 2, height: 16, backgroundColor: COLORS.background, marginLeft: 4, marginVertical: 2 },
    locationText: { flex: 1, fontSize: 14, color: COLORS.text },
    rideFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.background },
    priceContainer: {},
    priceLabel: { fontSize: 12, color: COLORS.textSecondary },
    priceValue: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
    driverBadge: { backgroundColor: COLORS.primaryBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    driverText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
    cancelButton: { backgroundColor: '#F4433620', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    cancelButtonText: { fontSize: 12, fontWeight: '600', color: '#F44336' },
    routeTextSimple: { fontSize: 13, color: COLORS.textSecondary },
});
