// =============================================
// TRANSIGO - RECURRING RIDES LIST SCREEN  
// =============================================

import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@/components/Icon';
import { COLORS, SPACING } from '@/constants';
import { useRecurringRideStore } from '@/stores';

const DAY_LABELS: Record<string, string> = {
    mon: 'L',
    tue: 'M',
    wed: 'M',
    thu: 'J',
    fri: 'V',
    sat: 'S',
    sun: 'D',
};

export default function RecurringRidesScreen() {
    const { rides, togglePause, deleteRide } = useRecurringRideStore();

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return '#4CAF50';
            case 'paused': return '#FF9800';
            case 'expired': return '#F44336';
            default: return COLORS.textSecondary;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'active': return 'Actif';
            case 'paused': return 'Suspendu';
            case 'expired': return 'Expiré';
            default: return status;
        }
    };

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
                <Text style={styles.headerTitle}>Trajets Réguliers</Text>
                <TouchableOpacity
                    style={styles.addIcon}
                    onPress={() => router.push('/recurring-rides/create')}
                    activeOpacity={0.8}
                >
                    <Icon name="add" size={28} color={COLORS.white} />
                </TouchableOpacity>
            </LinearGradient>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {rides.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyEmoji}>📅</Text>
                        <Text style={styles.emptyTitle}>Aucun trajet régulier</Text>
                        <Text style={styles.emptyText}>
                            Programmez vos trajets quotidiens et économisez -25% !
                        </Text>
                        <TouchableOpacity
                            style={styles.createButton}
                            onPress={() => router.push('/recurring-rides/create')}
                            activeOpacity={0.9}
                        >
                            <LinearGradient
                                colors={[COLORS.primary, COLORS.primaryDark]}
                                style={styles.createButtonGradient}
                            >
                                <Icon name="add" size={24} color={COLORS.white} />
                                <Text style={styles.createButtonText}>Créer un trajet</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                ) : (
                    rides.map((ride) => (
                        <TouchableOpacity
                            key={ride.id}
                            style={styles.rideCard}
                            onPress={() => router.push(`/recurring-rides/${ride.id}` as any)}
                            activeOpacity={0.9}
                        >
                            {/* Status Badge */}
                            <View
                                style={[
                                    styles.statusBadge,
                                    { backgroundColor: getStatusColor(ride.status) + '20' },
                                ]}
                            >
                                <Text style={[styles.statusText, { color: getStatusColor(ride.status) }]}>
                                    {getStatusLabel(ride.status)}
                                </Text>
                            </View>

                            {/* Route */}
                            <View style={styles.routeContainer}>
                                <View style={styles.routePoint}>
                                    <View style={styles.pickupDot} />
                                    <Text style={styles.locationText} numberOfLines={1}>
                                        {ride.pickup.address}
                                    </Text>
                                </View>
                                <View style={styles.routeLine} />
                                <View style={styles.routePoint}>
                                    <View style={styles.dropoffDot} />
                                    <Text style={styles.locationText} numberOfLines={1}>
                                        {ride.dropoff.address}
                                    </Text>
                                </View>
                            </View>

                            {/* Days & Time */}
                            <View style={styles.scheduleContainer}>
                                <View style={styles.daysRow}>
                                    {(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const).map((day) => (
                                        <View
                                            key={day}
                                            style={[
                                                styles.dayBadge,
                                                ride.days.includes(day) && styles.dayBadgeActive,
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.dayText,
                                                    ride.days.includes(day) && styles.dayTextActive,
                                                ]}
                                            >
                                                {DAY_LABELS[day]}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                                <View style={styles.timeContainer}>
                                    <Icon name="time" size={16} color={COLORS.primary} />
                                    <Text style={styles.timeText}>{ride.time}</Text>
                                </View>
                            </View>

                            {/* Price & Stats */}
                            <View style={styles.footer}>
                                <View style={styles.priceContainer}>
                                    <Text style={styles.priceLabel}>Prix mensuel</Text>
                                    <Text style={styles.priceValue}>
                                        {ride.monthlyPrice.toLocaleString('fr-FR')} F
                                    </Text>
                                    <Text style={styles.savings}>
                                        -25% • {ride.completedRides} courses effectuées
                                    </Text>
                                </View>
                                {ride.preferredDriverName && (
                                    <View style={styles.driverBadge}>
                                        <Icon name="star" size={14} color={COLORS.primary} />
                                        <Text style={styles.driverText}>{ride.preferredDriverName}</Text>
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
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
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    addIcon: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        padding: SPACING.lg,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: SPACING.xl * 2,
    },
    emptyEmoji: {
        fontSize: 80,
        marginBottom: SPACING.md,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: SPACING.sm,
    },
    emptyText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: SPACING.xl,
        paddingHorizontal: SPACING.xl,
    },
    createButton: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    createButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: SPACING.xl,
        gap: SPACING.sm,
    },
    createButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.white,
    },
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
    statusBadge: {
        position: 'absolute',
        top: SPACING.md,
        right: SPACING.md,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    routeContainer: {
        marginBottom: SPACING.md,
    },
    routePoint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    pickupDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#4CAF50',
    },
    dropoffDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: COLORS.primary,
    },
    routeLine: {
        width: 2,
        height: 20,
        backgroundColor: COLORS.background,
        marginLeft: 5,
        marginVertical: 4,
    },
    locationText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.text,
    },
    scheduleContainer: {
        marginBottom: SPACING.md,
    },
    daysRow: {
        flexDirection: 'row',
        gap: 6,
        marginBottom: SPACING.sm,
    },
    dayBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dayBadgeActive: {
        backgroundColor: COLORS.primaryBg,
    },
    dayText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    dayTextActive: {
        color: COLORS.primary,
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    timeText: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.text,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: SPACING.md,
        borderTopWidth: 1,
        borderTopColor: COLORS.background,
    },
    priceContainer: {
        flex: 1,
    },
    priceLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginBottom: 2,
    },
    priceValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 2,
    },
    savings: {
        fontSize: 11,
        color: '#4CAF50',
        fontWeight: '600',
    },
    driverBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primaryBg,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 4,
    },
    driverText: {
        fontSize: 11,
        fontWeight: '600',
        color: COLORS.primary,
    },
});
