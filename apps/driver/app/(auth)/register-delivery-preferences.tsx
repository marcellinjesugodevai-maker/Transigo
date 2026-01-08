import { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useDriverRegStore } from '../../src/stores/driverRegStore';

const COLORS = {
    primary: '#00C853',
    primaryDark: '#00A344',
    white: '#FFFFFF',
    black: '#1A1A2E',
    gray100: '#F5F5F5',
    gray600: '#757575',
    activeLight: '#E8F5E9',
};

const TRANSPORT_MODES = [
    { id: 'bike', label: 'Vélo', icon: 'bicycle', emoji: '🚲' },
    { id: 'moto', label: 'Moto', icon: 'bicycle', emoji: '🏍️' }, // use compatible icon
    { id: 'scooter', label: 'Scooter', icon: 'bicycle', emoji: '🛵' },
    { id: 'walker', label: 'À pied', icon: 'walk', emoji: '🚶' },
    { id: 'van', label: 'Camionnette', icon: 'bus', emoji: '🚚' },
];

const AVAILABILITY = [
    { id: 'full_time', label: 'Temps Plein', sub: '8h+ / jour' },
    { id: 'part_time', label: 'Temps Partiel', sub: '4h / jour' },
    { id: 'flexible', label: 'Flexible', sub: 'Week-ends...' },
];

export default function RegisterDeliveryPreferences() {
    const { data, updateData } = useDriverRegStore();

    // Local state initialized with store data
    const [transportMode, setTransportMode] = useState(data.deliveryTransportMode || 'moto');
    const [zone, setZone] = useState(data.deliveryZone || '');
    const [availability, setAvailability] = useState(data.availability || 'full_time');

    const handleNext = () => {
        if (!zone.trim()) {
            Alert.alert('Champs requis', 'Veuillez indiquer votre zone de livraison préférée (ex: Cocody).');
            return;
        }

        updateData({
            deliveryTransportMode: transportMode,
            deliveryZone: zone,
            availability: availability,
            // Map to generic vehicle fields for DB compatibility
            vehicleType: transportMode === 'van' ? 'van' : 'moto',
            vehicleBrand: transportMode.toUpperCase(), // e.g. "BIKE"
            vehicleModel: 'Standard',
            vehiclePlate: 'LIVREUR-' + Math.floor(Math.random() * 10000), // Temporary until verified
        });

        router.push('/(auth)/register-documents');
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryDark]}
                    style={styles.header}
                >
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.white} />
                    </TouchableOpacity>
                    <View style={styles.headerContent}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="cube" size={32} color={COLORS.primary} />
                        </View>
                        <Text style={styles.title}>Mode Livreur</Text>
                        <Text style={styles.subtitle}>Vos préférences de travail</Text>
                    </View>
                </LinearGradient>

                <View style={styles.form}>
                    {/* 1. Transport Mode */}
                    <Text style={styles.sectionTitle}>Comment livrez-vous ?</Text>
                    <View style={styles.grid}>
                        {TRANSPORT_MODES.map((mode) => (
                            <TouchableOpacity
                                key={mode.id}
                                style={[
                                    styles.card,
                                    transportMode === mode.id && styles.activeCard
                                ]}
                                onPress={() => setTransportMode(mode.id as any)}
                            >
                                <Text style={styles.emoji}>{mode.emoji}</Text>
                                <Text style={[
                                    styles.cardLabel,
                                    transportMode === mode.id && styles.activeText
                                ]}>
                                    {mode.label}
                                </Text>
                                {transportMode === mode.id && (
                                    <View style={styles.checkmark}>
                                        <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* 2. Zone */}
                    <Text style={styles.sectionTitle}>Zone Préférée</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="location" size={20} color={COLORS.gray600} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Ex: Cocody, Marcory, Plateau..."
                            placeholderTextColor={COLORS.gray600}
                            value={zone}
                            onChangeText={setZone}
                        />
                    </View>
                    <Text style={styles.helperText}>
                        Indiquez le quartier où vous souhaitez recevoir le plus de commandes.
                    </Text>

                    {/* 3. Availability */}
                    <Text style={styles.sectionTitle}>Disponibilité</Text>
                    <View style={styles.availabilityContainer}>
                        {AVAILABILITY.map((opt) => (
                            <TouchableOpacity
                                key={opt.id}
                                style={[
                                    styles.optionRow,
                                    availability === opt.id && styles.activeOptionRow
                                ]}
                                onPress={() => setAvailability(opt.id as any)}
                            >
                                <View>
                                    <Text style={[
                                        styles.optionLabel,
                                        availability === opt.id && styles.activeText
                                    ]}>{opt.label}</Text>
                                    <Text style={styles.optionSub}>{opt.sub}</Text>
                                </View>
                                <View style={[
                                    styles.radioOuter,
                                    availability === opt.id && { borderColor: COLORS.primary }
                                ]}>
                                    {availability === opt.id && <View style={styles.radioInner} />}
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={{ height: 40 }} />

                    <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                        <LinearGradient
                            colors={[COLORS.primary, COLORS.primaryDark]}
                            style={styles.gradientButton}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.nextButtonText}>Suivant</Text>
                            <Ionicons name="arrow-forward" size={24} color={COLORS.white} />
                        </LinearGradient>
                    </TouchableOpacity>

                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    header: {
        paddingTop: 60,
        paddingBottom: 30,
        paddingHorizontal: 24,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 10,
        padding: 8,
    },
    headerContent: {
        alignItems: 'center',
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.white,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
    },
    form: {
        padding: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.black,
        marginTop: 10,
        marginBottom: 16,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    card: {
        width: '48%', // Approx half
        backgroundColor: COLORS.gray100,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    activeCard: {
        backgroundColor: COLORS.activeLight,
        borderColor: COLORS.primary,
    },
    emoji: {
        fontSize: 32,
        marginBottom: 8,
    },
    cardLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.black,
    },
    activeText: {
        color: COLORS.primaryDark,
        fontWeight: 'bold',
    },
    checkmark: {
        position: 'absolute',
        top: 8,
        right: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.gray100,
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 56,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: COLORS.black,
    },
    helperText: {
        fontSize: 12,
        color: COLORS.gray600,
        marginTop: 6,
        marginLeft: 4,
    },
    availabilityContainer: {
        gap: 12,
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.gray100,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    activeOptionRow: {
        backgroundColor: COLORS.activeLight,
        borderColor: COLORS.primary,
    },
    optionLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.black,
    },
    optionSub: {
        fontSize: 12,
        color: COLORS.gray600,
    },
    radioOuter: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.gray600,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: COLORS.primary,
    },
    nextButton: {
        marginTop: 20,
        borderRadius: 30,
        overflow: 'hidden',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    gradientButton: {
        paddingVertical: 18,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    nextButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.white,
    },
});
