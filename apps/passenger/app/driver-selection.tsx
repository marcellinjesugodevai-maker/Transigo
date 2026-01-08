// =============================================
// TRANSIGO - DRIVER SELECTION SCREEN
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

interface Driver {
    id: string;
    name: string;
    avatar: string;
    rating: number;
    totalRides: number;
    vehicle: string;
    plate: string;
    eta: string;
    price: number;
    isFavorite?: boolean;
}

const AVAILABLE_DRIVERS: Driver[] = [
    {
        id: '1',
        name: 'Moussa Traoré',
        avatar: '👨',
        rating: 4.9,
        totalRides: 1240,
        vehicle: 'Toyota Corolla 2020',
        plate: 'AB 1234 CI',
        eta: '3 min',
        price: 2500,
        isFavorite: true,
    },
    {
        id: '2',
        name: 'Jean Kouassi',
        avatar: '👨',
        rating: 4.8,
        totalRides: 890,
        vehicle: 'Honda Civic 2019',
        plate: 'CD 5678 CI',
        eta: '5 min',
        price: 2300,
    },
    {
        id: '3',
        name: 'Aminata Diallo',
        avatar: '👩',
        rating: 5.0,
        totalRides: 650,
        vehicle: 'Nissan Sentra 2021',
        plate: 'EF 9012 CI',
        eta: '7 min',
        price: 2700,
        isFavorite: false,
    },
];

export default function DriverSelectionScreen() {
    const params = useLocalSearchParams();
    const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

    const handleSelectDriver = (driver: Driver) => {
        setSelectedDriver(driver);
    };

    const handleConfirmDriver = () => {
        if (!selectedDriver) {
            Alert.alert('Sélection requise', 'Veuillez choisir un chauffeur');
            return;
        }

        Alert.alert(
            'Confirmer',
            `Réserver avec ${selectedDriver.name} pour ${selectedDriver.price} FCFA ?`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Confirmer',
                    onPress: () => router.push('/ride/123'),
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
                <Text style={styles.headerTitle}>Choisir un chauffeur</Text>
                <View style={{ width: 40 }} />
            </LinearGradient>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.subtitle}>
                    {AVAILABLE_DRIVERS.length} chauffeurs disponibles
                </Text>

                {/* Liste des chauffeurs */}
                {AVAILABLE_DRIVERS.map((driver) => {
                    const isSelected = selectedDriver?.id === driver.id;
                    return (
                        <TouchableOpacity
                            key={driver.id}
                            style={[
                                styles.driverCard,
                                isSelected && styles.driverCardSelected,
                            ]}
                            onPress={() => handleSelectDriver(driver)}
                            activeOpacity={0.9}
                        >
                            {driver.isFavorite && (
                                <View style={styles.favoriteBadge}>
                                    <Text style={styles.favoriteIcon}>⭐</Text>
                                </View>
                            )}

                            <View style={styles.driverHeader}>
                                <View style={styles.driverAvatar}>
                                    <Text style={styles.driverAvatarText}>{driver.avatar}</Text>
                                </View>
                                <View style={styles.driverInfo}>
                                    <Text style={styles.driverName}>{driver.name}</Text>
                                    <View style={styles.ratingContainer}>
                                        <Text style={styles.starIcon}>⭐</Text>
                                        <Text style={styles.ratingText}>
                                            {driver.rating} ({driver.totalRides} courses)
                                        </Text>
                                    </View>
                                    <Text style={styles.vehicleText}>{driver.vehicle}</Text>
                                    <Text style={styles.plateText}>🚗 {driver.plate}</Text>
                                </View>
                                <View style={styles.driverRight}>
                                    <View style={styles.etaBadge}>
                                        <Text style={styles.etaText}>{driver.eta}</Text>
                                    </View>
                                    <Text style={styles.priceText}>
                                        {driver.price.toLocaleString('fr-FR')} F
                                    </Text>
                                </View>
                            </View>

                            {isSelected && (
                                <View style={styles.selectedIndicator}>
                                    <Icon name="checkmark-circle" size={24} color={COLORS.primary} />
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* Bouton confirmer */}
            {selectedDriver && (
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.confirmButton}
                        onPress={handleConfirmDriver}
                        activeOpacity={0.9}
                    >
                        <LinearGradient
                            colors={[COLORS.primary, COLORS.primaryDark]}
                            style={styles.confirmButtonGradient}
                        >
                            <Text style={styles.confirmButtonText}>
                                Réserver avec {selectedDriver.name}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },

    // Header
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

    // Content
    scrollContent: {
        padding: SPACING.lg,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: SPACING.lg,
    },

    // Driver Card
    driverCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: SPACING.lg,
        marginBottom: SPACING.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        position: 'relative',
    },
    driverCardSelected: {
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    favoriteBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 1,
    },
    favoriteIcon: {
        fontSize: 20,
    },
    driverHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
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
    driverInfo: {
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
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    vehicleText: {
        fontSize: 13,
        color: COLORS.text,
        marginBottom: 2,
    },
    plateText: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    driverRight: {
        alignItems: 'flex-end',
    },
    etaBadge: {
        backgroundColor: COLORS.primaryBg,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 8,
    },
    etaText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.primary,
    },
    priceText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    selectedIndicator: {
        position: 'absolute',
        bottom: 12,
        right: 12,
    },

    // Footer
    footer: {
        padding: SPACING.lg,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.background,
    },
    confirmButton: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    confirmButtonGradient: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.white,
    },
});
