// =============================================
// TRANSIGO - SCHEDULE RIDE SCREEN (Réservation)
// =============================================

import { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    Platform,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@/components/Icon';
import { COLORS, SPACING } from '@/constants';
import { scheduledRidesService } from '@/services/scheduledRidesService';

const VEHICLE_TYPES = [
    { id: 'classic', name: 'Classic', emoji: '🚗', price: 2500, description: 'Économique' },
    { id: 'comfort', name: 'Comfort', emoji: '🚙', price: 3500, description: 'Confortable' },
    { id: 'xl', name: 'XL', emoji: '🚐', price: 5000, description: '6+ places' },
];

export default function ScheduleRideScreen() {
    const [pickup, setPickup] = useState('');
    const [dropoff, setDropoff] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [vehicleType, setVehicleType] = useState('classic');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const selectedVehicle = VEHICLE_TYPES.find(v => v.id === vehicleType);
    const estimatedPrice = selectedVehicle?.price || 2500;

    const validateForm = () => {
        if (!pickup.trim()) {
            Alert.alert('Erreur', 'Veuillez entrer le lieu de départ');
            return false;
        }
        if (!dropoff.trim()) {
            Alert.alert('Erreur', 'Veuillez entrer la destination');
            return false;
        }
        if (!date.trim()) {
            Alert.alert('Erreur', 'Veuillez entrer la date (JJ/MM/AAAA)');
            return false;
        }
        if (!time.trim()) {
            Alert.alert('Erreur', 'Veuillez entrer l\'heure (HH:MM)');
            return false;
        }
        return true;
    };

    const formatDateForDB = (dateStr: string): string => {
        // Convert DD/MM/YYYY to YYYY-MM-DD
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        return dateStr;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            const { ride, error } = await scheduledRidesService.createScheduledRide({
                pickup: { address: pickup, lat: 5.36, lon: -4.0 },
                dropoff: { address: dropoff, lat: 5.32, lon: -4.02 },
                scheduledDate: formatDateForDB(date),
                scheduledTime: time,
                vehicleType,
                estimatedPrice,
                paymentMethod: 'wallet',
            });

            if (error) throw error;

            Alert.alert(
                '🎉 Réservation confirmée !',
                `Votre course est programmée pour le ${date} à ${time}.\n\nUn chauffeur sera assigné et vous serez notifié.`,
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } catch (error: any) {
            Alert.alert('Erreur', error.message || 'Impossible de créer la réservation');
        }
        setIsSubmitting(false);
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
                <Text style={styles.headerTitle}>📅 Réserver une course</Text>
                <View style={{ width: 40 }} />
            </LinearGradient>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Info Card */}
                <View style={styles.infoCard}>
                    <Text style={styles.infoIcon}>💡</Text>
                    <Text style={styles.infoText}>
                        Réservez à l'avance et un chauffeur sera assigné automatiquement. Vous serez notifié la veille.
                    </Text>
                </View>

                {/* Itinéraire */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📍 Itinéraire</Text>
                    <View style={styles.inputGroup}>
                        <View style={styles.inputIcon}>
                            <View style={[styles.dot, { backgroundColor: '#4CAF50' }]} />
                        </View>
                        <TextInput
                            style={styles.input}
                            value={pickup}
                            onChangeText={setPickup}
                            placeholder="Lieu de départ"
                            placeholderTextColor={COLORS.textSecondary}
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <View style={styles.inputIcon}>
                            <View style={[styles.dot, { backgroundColor: COLORS.primary }]} />
                        </View>
                        <TextInput
                            style={styles.input}
                            value={dropoff}
                            onChangeText={setDropoff}
                            placeholder="Destination"
                            placeholderTextColor={COLORS.textSecondary}
                        />
                    </View>
                </View>

                {/* Date et Heure */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>⏰ Date et Heure</Text>
                    <View style={styles.dateTimeRow}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                            <TextInput
                                style={styles.inputCentered}
                                value={date}
                                onChangeText={setDate}
                                placeholder="JJ/MM/AAAA"
                                placeholderTextColor={COLORS.textSecondary}
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                            <TextInput
                                style={styles.inputCentered}
                                value={time}
                                onChangeText={setTime}
                                placeholder="HH:MM"
                                placeholderTextColor={COLORS.textSecondary}
                                keyboardType="numeric"
                            />
                        </View>
                    </View>
                </View>

                {/* Type de véhicule */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🚗 Type de véhicule</Text>
                    {VEHICLE_TYPES.map((vehicle) => (
                        <TouchableOpacity
                            key={vehicle.id}
                            style={[
                                styles.vehicleOption,
                                vehicleType === vehicle.id && styles.vehicleOptionActive,
                            ]}
                            onPress={() => setVehicleType(vehicle.id)}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.vehicleEmoji}>{vehicle.emoji}</Text>
                            <View style={styles.vehicleInfo}>
                                <Text style={styles.vehicleName}>{vehicle.name}</Text>
                                <Text style={styles.vehicleDesc}>{vehicle.description}</Text>
                            </View>
                            <Text style={styles.vehiclePrice}>
                                {vehicle.price.toLocaleString('fr-FR')} F
                            </Text>
                            {vehicleType === vehicle.id && (
                                <View style={styles.checkmark}>
                                    <Text style={styles.checkmarkText}>✓</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Résumé */}
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>📋 Résumé</Text>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Date</Text>
                        <Text style={styles.summaryValue}>{date || '-'}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Heure</Text>
                        <Text style={styles.summaryValue}>{time || '-'}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Véhicule</Text>
                        <Text style={styles.summaryValue}>{selectedVehicle?.name}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.summaryRow}>
                        <Text style={styles.totalLabel}>Prix estimé</Text>
                        <Text style={styles.totalValue}>
                            {estimatedPrice.toLocaleString('fr-FR')} F
                        </Text>
                    </View>
                </View>

                {/* Bouton Réserver */}
                <TouchableOpacity
                    style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                    activeOpacity={0.9}
                >
                    <LinearGradient
                        colors={isSubmitting ? ['#9E9E9E', '#757575'] : [COLORS.primary, COLORS.primaryDark]}
                        style={styles.submitButtonGradient}
                    >
                        <Text style={styles.submitButtonText}>
                            {isSubmitting ? '⏳ Réservation en cours...' : '📅 Confirmer la réservation'}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
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
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primaryBg,
        borderRadius: 12,
        padding: SPACING.md,
        marginBottom: SPACING.lg,
    },
    infoIcon: {
        fontSize: 24,
        marginRight: SPACING.sm,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: COLORS.primary,
        lineHeight: 18,
    },
    section: {
        marginBottom: SPACING.xl,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: SPACING.md,
    },
    inputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 12,
        marginBottom: SPACING.sm,
        paddingHorizontal: SPACING.md,
    },
    inputIcon: {
        marginRight: SPACING.sm,
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    input: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 15,
        color: COLORS.text,
    },
    inputCentered: {
        paddingVertical: 14,
        fontSize: 15,
        color: COLORS.text,
        textAlign: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 12,
    },
    dateTimeRow: {
        flexDirection: 'row',
    },
    vehicleOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
        borderWidth: 2,
        borderColor: COLORS.white,
    },
    vehicleOptionActive: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primaryBg,
    },
    vehicleEmoji: {
        fontSize: 32,
        marginRight: SPACING.md,
    },
    vehicleInfo: {
        flex: 1,
    },
    vehicleName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },
    vehicleDesc: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    vehiclePrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginRight: SPACING.sm,
    },
    checkmark: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkmarkText: {
        color: COLORS.white,
        fontWeight: 'bold',
    },
    summaryCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: SPACING.lg,
        marginBottom: SPACING.xl,
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: SPACING.md,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.sm,
    },
    summaryLabel: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.background,
        marginVertical: SPACING.md,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    totalValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    submitButton: {
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: SPACING.xl,
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitButtonGradient: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.white,
    },
});
