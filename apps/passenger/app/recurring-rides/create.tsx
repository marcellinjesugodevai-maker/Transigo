// =============================================
// TRANSIGO - CREATE RECURRING RIDE SCREEN
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
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@/components/Icon';
import { COLORS, SPACING } from '@/constants';
import { useRecurringRideStore, DayOfWeek } from '@/stores';
import {
    scheduleRecurringRideNotification,
    requestNotificationPermissions
} from '@/services/recurringRideNotificationService';

const DAYS: { value: DayOfWeek; label: string }[] = [
    { value: 'mon', label: 'Lun' },
    { value: 'tue', label: 'Mar' },
    { value: 'wed', label: 'Mer' },
    { value: 'thu', label: 'Jeu' },
    { value: 'fri', label: 'Ven' },
    { value: 'sat', label: 'Sam' },
    { value: 'sun', label: 'Dim' },
];

const VEHICLE_TYPES = [
    { id: 'classic', name: 'Classic', price: 2500 },
    { id: 'comfort', name: 'Comfort', price: 3500 },
    { id: 'xl', name: 'XL', price: 5000 },
];

export default function CreateRecurringRideScreen() {
    const { addRide } = useRecurringRideStore();

    const [pickup, setPickup] = useState('Cocody, Riviera 2');
    const [dropoff, setDropoff] = useState('Plateau, Centre-ville');
    const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>(['mon', 'tue', 'wed', 'thu', 'fri']);
    const [time, setTime] = useState('07:30');
    const [vehicleType, setVehicleType] = useState<'classic' | 'comfort' | 'xl'>('classic');

    const toggleDay = (day: DayOfWeek) => {
        setSelectedDays((prev) =>
            prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
        );
    };

    const calculateMonthlyPrice = () => {
        const vehicle = VEHICLE_TYPES.find((v) => v.id === vehicleType);
        if (!vehicle) return 0;
        const ridesPerMonth = selectedDays.length * 4;
        const discount = 0.75; // -25%
        return Math.round(vehicle.price * ridesPerMonth * discount);
    };

    const handleCreate = async () => {
        if (selectedDays.length === 0) {
            Alert.alert('Erreur', 'Sélectionnez au moins un jour');
            return;
        }

        // Demander les permissions de notification
        const hasPermission = await requestNotificationPermissions();
        if (!hasPermission) {
            Alert.alert(
                'Permissions requises',
                'Veuillez activer les notifications pour recevoir des rappels avant vos trajets.',
                [{ text: 'OK' }]
            );
        }

        const monthlyPrice = calculateMonthlyPrice();
        const vehicle = VEHICLE_TYPES.find((v) => v.id === vehicleType)!;

        // Créer le trajet
        const newRide = {
            pickup: {
                address: pickup,
                latitude: 5.3599,
                longitude: -3.9870,
            },
            dropoff: {
                address: dropoff,
                latitude: 5.3200,
                longitude: -4.0200,
            },
            days: selectedDays,
            time,
            vehicleType,
            monthlyPrice,
            pricePerRide: vehicle.price,
            estimatedRidesPerMonth: selectedDays.length * 4,
            status: 'active' as const,
            startDate: new Date(),
        };

        addRide(newRide);

        // Programmer les notifications pour ce trajet
        // On récupère les trajets du store pour obtenir le nouvel ID
        setTimeout(async () => {
            const { rides } = useRecurringRideStore.getState();
            const createdRide = rides[rides.length - 1];
            if (createdRide) {
                await scheduleRecurringRideNotification(createdRide);
                console.log('Notifications programmées pour le trajet:', createdRide.id);
            }
        }, 100);

        Alert.alert(
            '🎉 Trajet créé !',
            `Votre trajet régulier est programmé.\n\n📅 ${selectedDays.length} jours/semaine\n⏰ Rappel 15 min avant\n💰 ${monthlyPrice.toLocaleString('fr-FR')} F/mois`,
            [{ text: 'OK', onPress: () => router.back() }]
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
                <Text style={styles.headerTitle}>Nouveau Trajet Régulier</Text>
                <View style={{ width: 40 }} />
            </LinearGradient>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Route */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Itinéraire</Text>
                    <View style={styles.inputGroup}>
                        <Icon name="location" size={20} color="#4CAF50" />
                        <TextInput
                            style={styles.input}
                            value={pickup}
                            onChangeText={setPickup}
                            placeholder="Lieu de départ"
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Icon name="location" size={20} color={COLORS.primary} />
                        <TextInput
                            style={styles.input}
                            value={dropoff}
                            onChangeText={setDropoff}
                            placeholder="Destination"
                        />
                    </View>
                </View>

                {/* Days */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Jours de la semaine</Text>
                    <View style={styles.daysGrid}>
                        {DAYS.map((day) => (
                            <TouchableOpacity
                                key={day.value}
                                style={[
                                    styles.dayButton,
                                    selectedDays.includes(day.value) && styles.dayButtonActive,
                                ]}
                                onPress={() => toggleDay(day.value)}
                                activeOpacity={0.8}
                            >
                                <Text
                                    style={[
                                        styles.dayButtonText,
                                        selectedDays.includes(day.value) && styles.dayButtonTextActive,
                                    ]}
                                >
                                    {day.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Time */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Heure de départ</Text>
                    <View style={styles.inputGroup}>
                        <Icon name="time" size={20} color={COLORS.primary} />
                        <TextInput
                            style={styles.input}
                            value={time}
                            onChangeText={setTime}
                            placeholder="07:30"
                        />
                    </View>
                </View>

                {/* Vehicle */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Type de véhicule</Text>
                    {VEHICLE_TYPES.map((vehicle) => (
                        <TouchableOpacity
                            key={vehicle.id}
                            style={[
                                styles.vehicleButton,
                                vehicleType === vehicle.id && styles.vehicleButtonActive,
                            ]}
                            onPress={() => setVehicleType(vehicle.id as any)}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.vehicleName}>{vehicle.name}</Text>
                            <Text style={styles.vehiclePrice}>{vehicle.price} F/course</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Summary */}
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>Résumé</Text>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Courses par mois</Text>
                        <Text style={styles.summaryValue}>{selectedDays.length * 4}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Prix unitaire</Text>
                        <Text style={styles.summaryValue}>
                            {VEHICLE_TYPES.find((v) => v.id === vehicleType)?.price} F
                        </Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Réduction -25%</Text>
                        <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>Incluse</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.summaryRow}>
                        <Text style={styles.totalLabel}>Total mensuel</Text>
                        <Text style={styles.totalValue}>
                            {calculateMonthlyPrice().toLocaleString('fr-FR')} F
                        </Text>
                    </View>
                </View>

                {/* Create Button */}
                <TouchableOpacity
                    style={styles.createButton}
                    onPress={handleCreate}
                    activeOpacity={0.9}
                >
                    <LinearGradient
                        colors={[COLORS.primary, COLORS.primaryDark]}
                        style={styles.createButtonGradient}
                    >
                        <Text style={styles.createButtonText}>Créer le trajet régulier</Text>
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
        paddingHorizontal: SPACING.md,
        paddingVertical: 14,
        marginBottom: SPACING.sm,
        gap: SPACING.sm,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: COLORS.text,
    },
    daysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
    },
    dayButton: {
        flex: 1,
        minWidth: 60,
        paddingVertical: 12,
        backgroundColor: COLORS.white,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.white,
    },
    dayButtonActive: {
        backgroundColor: COLORS.primaryBg,
        borderColor: COLORS.primary,
    },
    dayButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    dayButtonTextActive: {
        color: COLORS.primary,
    },
    vehicleButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
        borderWidth: 2,
        borderColor: COLORS.white,
    },
    vehicleButtonActive: {
        backgroundColor: COLORS.primaryBg,
        borderColor: COLORS.primary,
    },
    vehicleName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },
    vehiclePrice: {
        fontSize: 14,
        color: COLORS.textSecondary,
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
    createButton: {
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: SPACING.xl,
    },
    createButtonGradient: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    createButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.white,
    },
});
