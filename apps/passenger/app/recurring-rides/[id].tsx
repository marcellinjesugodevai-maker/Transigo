// =============================================
// TRANSIGO - RECURRING RIDE DETAIL SCREEN
// =============================================

import { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@/components/Icon';
import { COLORS, SPACING } from '@/constants';
import { useRecurringRideStore } from '@/stores';

const DAY_FULL: Record<string, string> = {
    mon: 'Lundi',
    tue: 'Mardi',
    wed: 'Mercredi',
    thu: 'Jeudi',
    fri: 'Vendredi',
    sat: 'Samedi',
    sun: 'Dimanche',
};

export default function RecurringRideDetailScreen() {
    const { id } = useLocalSearchParams();
    const { getRideById, togglePause, deleteRide } = useRecurringRideStore();

    const ride = getRideById(id as string);

    if (!ride) {
        return (
            <View style={styles.container}>
                <Text>Trajet introuvable</Text>
            </View>
        );
    }

    const handleTogglePause = () => {
        const action = ride.status === 'active' ? 'suspendre' : 'reprendre';
        Alert.alert(
            action === 'suspendre' ? 'Suspendre' : 'Reprendre',
            `Voulez-vous ${action} ce trajet ?`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: action === 'suspendre' ? 'Suspendre' : 'Reprendre',
                    onPress: () => {
                        togglePause(ride.id);
                        Alert.alert('Succès', `Trajet ${action === 'suspendre' ? 'suspendu' : 'repris'}`);
                    },
                },
            ]
        );
    };

    const handleDelete = () => {
        Alert.alert(
            'Supprimer',
            'Voulez-vous supprimer définitivement ce trajet régulier ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: () => {
                        deleteRide(ride.id);
                        router.back();
                    },
                },
            ]
        );
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
                <Text style={styles.headerTitle}>Détails du trajet</Text>
                <View style={{ width: 40 }} />
            </LinearGradient>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Status Card */}
                <View style={styles.statusCard}>
                    <Text style={styles.statusLabel}>Statut</Text>
                    <Text
                        style={[
                            styles.statusValue,
                            {
                                color:
                                    ride.status === 'active'
                                        ? '#4CAF50'
                                        : ride.status === 'paused'
                                            ? '#FF9800'
                                            : '#F44336',
                            },
                        ]}
                    >
                        {ride.status === 'active' ? 'Actif ✓' : ride.status === 'paused' ? 'Suspendu' : 'Expiré'}
                    </Text>
                </View>

                {/* Route */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Itinéraire</Text>
                    <View style={styles.routeCard}>
                        <View style={styles.routePoint}>
                            <View style={styles.pickupDot} />
                            <Text style={styles.locationText}>{ride.pickup.address}</Text>
                        </View>
                        <View style={styles.routeLine} />
                        <View style={styles.routePoint}>
                            <View style={styles.dropoffDot} />
                            <Text style={styles.locationText}>{ride.dropoff.address}</Text>
                        </View>
                    </View>
                </View>

                {/* Schedule */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Programmation</Text>
                    <View style={styles.scheduleCard}>
                        <View style={styles.infoRow}>
                            <Icon name="calendar" size={20} color={COLORS.primary} />
                            <Text style={styles.infoText}>
                                {ride.days.map((d) => DAY_FULL[d]).join(', ')}
                            </Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Icon name="time" size={20} color={COLORS.primary} />
                            <Text style={styles.infoText}>{ride.time}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Icon name="car" size={20} color={COLORS.primary} />
                            <Text style={styles.infoText}>
                                {ride.vehicleType.charAt(0).toUpperCase() + ride.vehicleType.slice(1)}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Pricing */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Tarification</Text>
                    <View style={styles.priceCard}>
                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>Prix par course</Text>
                            <Text style={styles.priceValue}>{ride.pricePerRide.toLocaleString('fr-FR')} F</Text>
                        </View>
                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>Courses estimées/mois</Text>
                            <Text style={styles.priceValue}>{ride.estimatedRidesPerMonth}</Text>
                        </View>
                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>Réduction</Text>
                            <Text style={[styles.priceValue, { color: '#4CAF50' }]}>-25%</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.priceRow}>
                            <Text style={styles.totalLabel}>Total mensuel</Text>
                            <Text style={styles.totalValue}>
                                {ride.monthlyPrice.toLocaleString('fr-FR')} F/mois
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Stats */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Statistiques</Text>
                    <View style={styles.statsCard}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{ride.completedRides}</Text>
                            <Text style={styles.statLabel}>Courses effectuées</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>
                                {Math.round(
                                    (ride.pricePerRide * ride.estimatedRidesPerMonth * 0.25) / 1000
                                )}K
                            </Text>
                            <Text style={styles.statLabel}>Économisés</Text>
                        </View>
                    </View>
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[
                            styles.actionButton,
                            ride.status === 'active' ? styles.pauseButton : styles.resumeButton,
                        ]}
                        onPress={handleTogglePause}
                        activeOpacity={0.9}
                    >
                        <Icon
                            name={ride.status === 'active' ? 'pause' : 'play'}
                            size={20}
                            color={COLORS.white}
                        />
                        <Text style={styles.actionButtonText}>
                            {ride.status === 'active' ? 'Suspendre' : 'Reprendre'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={handleDelete}
                        activeOpacity={0.9}
                    >
                        <Icon name="trash" size={20} color={COLORS.white} />
                        <Text style={styles.actionButtonText}>Supprimer</Text>
                    </TouchableOpacity>
                </View>
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
    scrollContent: {
        padding: SPACING.lg,
    },
    statusCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: SPACING.lg,
        marginBottom: SPACING.md,
        alignItems: 'center',
    },
    statusLabel: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 4,
    },
    statusValue: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    section: {
        marginBottom: SPACING.lg,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: SPACING.sm,
    },
    routeCard: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: SPACING.md,
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
    scheduleCard: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: SPACING.md,
        gap: SPACING.sm,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    infoText: {
        fontSize: 15,
        color: COLORS.text,
    },
    priceCard: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: SPACING.md,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.sm,
    },
    priceLabel: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    priceValue: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.background,
        marginVertical: SPACING.sm,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    totalValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    statsCard: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: SPACING.md,
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    actions: {
        flexDirection: 'row',
        gap: SPACING.sm,
        marginTop: SPACING.md,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    pauseButton: {
        backgroundColor: '#FF9800',
    },
    resumeButton: {
        backgroundColor: '#4CAF50',
    },
    deleteButton: {
        backgroundColor: '#F44336',
    },
    actionButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.white,
    },
});
