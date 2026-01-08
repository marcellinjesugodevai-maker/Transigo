// =============================================
// TRANSIGO DRIVER - MODE RETOUR MAISON
// Courses vers votre direction préférée
// =============================================

import { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Switch,
    TextInput,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { rideService } from '../src/services/supabaseService';
import { useDriverStore } from '../src/stores/driverStore';

// Distance calculation (Haversine)
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 999;
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
};

const COLORS = {
    primary: '#FF6B00',
    secondary: '#00C853',
    secondaryDark: '#00A344',
    white: '#FFFFFF',
    black: '#1A1A2E',
    gray50: '#FAFAFA',
    gray100: '#F5F5F5',
    gray600: '#757575',
    home: '#E91E63',
    homeDark: '#C2185B',
};

import { useDriverPremiumsStore } from '../src/stores/driverPremiumsStore';

export default function HomeDirectionScreen() {
    const { driver } = useDriverStore();
    const { homeMode, toggleHomeMode, setHomeAddress } = useDriverPremiumsStore();

    const [maxDetour, setMaxDetour] = useState(3);
    const [isEditing, setIsEditing] = useState(false);
    const [tempAddress, setTempAddress] = useState(homeMode.address);
    const [rides, setRides] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (homeMode.active) {
            loadRides();
            const channel = rideService.subscribeToNewRides(() => {
                loadRides();
            });
            return () => {
                channel.unsubscribe();
            };
        }
    }, [homeMode.active, maxDetour]);

    const loadRides = async () => {
        setLoading(true);
        const { rides: allRides } = await rideService.getRequestedRides();
        if (allRides) {
            const filtered = allRides.filter((r: any) => {
                const detour = getDistance(r.dropoff_lat, r.dropoff_lng, homeMode.lat, homeMode.lng);
                return detour <= maxDetour;
            }).map((r: any) => ({
                ...r,
                detourKm: getDistance(r.dropoff_lat, r.dropoff_lng, homeMode.lat, homeMode.lng).toFixed(1),
                homeProximity: Math.round(Math.max(0, 100 - (getDistance(r.dropoff_lat, r.dropoff_lng, homeMode.lat, homeMode.lng) * 10))),
                passengerName: `${r.users?.first_name} ${r.users?.last_name || ''}`,
                passengerRating: 4.8
            }));
            setRides(filtered);
        }
        setLoading(false);
    };

    const handleToggle = (value: boolean) => {
        toggleHomeMode();
    };

    const handleSaveAddress = () => {
        setHomeAddress(tempAddress);
        setIsEditing(false);
    };

    const handleAcceptRide = async (ride: any) => {
        const { error } = await rideService.acceptRide(ride.id, driver!.id);
        if (!error) {
            Alert.alert(
                '🏠 Course vers maison acceptée !',
                `Dirigez-vous vers ${ride.pickup_address} pour récupérer ${ride.passengerName}.`,
                [{ text: 'OK', onPress: () => router.push('/driver-navigation?type=pickup') }]
            );
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <LinearGradient colors={[COLORS.home, COLORS.homeDark]} style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>🏠 Mode Retour Maison</Text>
                    <Text style={styles.headerSubtitle}>Recevez uniquement des courses vers votre direction</Text>
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Toggle */}
                <View style={styles.toggleCard}>
                    <View style={styles.toggleInfo}>
                        <Text style={styles.toggleTitle}>Activer le mode</Text>
                        <Text style={styles.toggleDesc}>Filtrer les courses vers votre maison</Text>
                    </View>
                    <Switch
                        value={homeMode.active}
                        onValueChange={handleToggle}
                        trackColor={{ false: COLORS.gray100, true: COLORS.home + '50' }}
                        thumbColor={homeMode.active ? COLORS.home : COLORS.gray600}
                    />
                </View>

                {/* Home address */}
                <View style={styles.addressCard}>
                    <View style={styles.addressHeader}>
                        <Text style={styles.addressLabel}>📍 Adresse de destination</Text>
                        <TouchableOpacity onPress={isEditing ? handleSaveAddress : () => setIsEditing(true)}>
                            <Text style={styles.editBtn}>{isEditing ? 'Enregistrer' : 'Modifier'}</Text>
                        </TouchableOpacity>
                    </View>
                    {isEditing ? (
                        <TextInput
                            style={styles.addressInput}
                            value={tempAddress}
                            onChangeText={setTempAddress}
                            placeholder="Entrez votre adresse..."
                            placeholderTextColor={COLORS.gray600}
                        />
                    ) : (
                        <Text style={styles.addressText}>{homeMode.address}</Text>
                    )}
                </View>

                {/* Max detour */}
                <View style={styles.detourCard}>
                    <Text style={styles.detourLabel}>🛤️ Détour maximum accepté</Text>
                    <View style={styles.detourOptions}>
                        {[1, 2, 3, 5].map((km) => (
                            <TouchableOpacity
                                key={km}
                                style={[styles.detourOption, maxDetour === km && styles.detourOptionActive]}
                                onPress={() => setMaxDetour(km)}
                            >
                                <Text style={[styles.detourOptionText, maxDetour === km && styles.detourOptionTextActive]}>
                                    {km} km
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Available rides */}
                {homeMode.active && (
                    <>
                        <Text style={styles.sectionTitle}>🚗 Courses disponibles vers votre direction</Text>

                        {loading && rides.length === 0 ? (
                            <ActivityIndicator size="large" color={COLORS.home} style={{ marginTop: 20 }} />
                        ) : rides.map((ride) => (
                            <View key={ride.id} style={styles.rideCard}>
                                {/* Proximity badge */}
                                <View style={[styles.proximityBadge, { backgroundColor: ride.homeProximity >= 80 ? COLORS.secondary + '20' : COLORS.primary + '20' }]}>
                                    <Text style={[styles.proximityText, { color: ride.homeProximity >= 80 ? COLORS.secondary : COLORS.primary }]}>
                                        🏠 {ride.homeProximity}% vers maison
                                    </Text>
                                </View>

                                {/* Passenger */}
                                <View style={styles.rideHeader}>
                                    <View style={styles.passengerRow}>
                                        <View style={styles.passengerAvatar}>
                                            <Text style={styles.avatarText}>{ride.passengerName.charAt(0)}</Text>
                                        </View>
                                        <View style={styles.passengerInfo}>
                                            <Text style={styles.passengerName}>{ride.passengerName}</Text>
                                            <View style={styles.ratingRow}>
                                                <Ionicons name="star" size={12} color="#FFB800" />
                                                <Text style={styles.ratingText}>{ride.passengerRating}</Text>
                                            </View>
                                        </View>
                                    </View>
                                    <View style={styles.priceSection}>
                                        <Text style={styles.priceText}>{(ride.price || 0).toLocaleString('fr-FR')} F</Text>
                                        <Text style={styles.detourText}>+{ride.detourKm} km détour</Text>
                                    </View>
                                </View>

                                {/* Route */}
                                <View style={styles.routeSection}>
                                    <View style={styles.routePoint}>
                                        <View style={styles.dotGreen} />
                                        <Text style={styles.routeAddress}>{ride.pickup_address}</Text>
                                    </View>
                                    <View style={styles.routeLine} />
                                    <View style={styles.routePoint}>
                                        <View style={styles.dotHome} />
                                        <Text style={styles.routeAddress}>{ride.dropoff_address}</Text>
                                    </View>
                                </View>

                                {/* Stats */}
                                <View style={styles.rideStats}>
                                    <View style={styles.rideStat}>
                                        <Ionicons name="navigate-outline" size={16} color={COLORS.gray600} />
                                        <Text style={styles.rideStatText}>{ride.distance_km || 0} km</Text>
                                    </View>
                                    <View style={styles.rideStat}>
                                        <Ionicons name="time-outline" size={16} color={COLORS.gray600} />
                                        <Text style={styles.rideStatText}>{ride.duration_min || 0} min</Text>
                                    </View>
                                </View>

                                {/* Accept button */}
                                <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAcceptRide(ride)}>
                                    <LinearGradient colors={[COLORS.home, COLORS.homeDark]} style={styles.acceptGradient}>
                                        <Text style={styles.acceptText}>ACCEPTER & RENTRER</Text>
                                        <Text style={styles.acceptIcon}>🏠</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        ))}

                        {!loading && rides.length === 0 && (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyIcon}>🔍</Text>
                                <Text style={styles.emptyText}>Aucune course vers votre direction pour l'instant</Text>
                                <Text style={styles.emptyHint}>Augmentez le détour maximum ou patientez</Text>
                            </View>
                        )}
                    </>
                )}

                {!homeMode.active && (
                    <View style={styles.disabledState}>
                        <Text style={styles.disabledIcon}>🏠</Text>
                        <Text style={styles.disabledText}>Mode désactivé</Text>
                        <Text style={styles.disabledHint}>Activez pour filtrer les courses vers votre maison</Text>
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.gray50 },

    // Header
    header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    headerContent: {},
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.white },
    headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4 },

    content: { padding: 16 },

    // Toggle
    toggleCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, padding: 16, borderRadius: 16, marginBottom: 12 },
    toggleInfo: { flex: 1 },
    toggleTitle: { fontSize: 16, fontWeight: '600', color: COLORS.black },
    toggleDesc: { fontSize: 12, color: COLORS.gray600, marginTop: 2 },

    // Address
    addressCard: { backgroundColor: COLORS.white, padding: 16, borderRadius: 16, marginBottom: 12 },
    addressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    addressLabel: { fontSize: 13, fontWeight: '600', color: COLORS.black },
    editBtn: { fontSize: 13, color: COLORS.home, fontWeight: '600' },
    addressText: { fontSize: 14, color: COLORS.gray600 },
    addressInput: { fontSize: 14, color: COLORS.black, borderBottomWidth: 1, borderBottomColor: COLORS.home, paddingVertical: 8 },

    // Detour
    detourCard: { backgroundColor: COLORS.white, padding: 16, borderRadius: 16, marginBottom: 20 },
    detourLabel: { fontSize: 13, fontWeight: '600', color: COLORS.black, marginBottom: 12 },
    detourOptions: { flexDirection: 'row', gap: 10 },
    detourOption: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10, backgroundColor: COLORS.gray100 },
    detourOptionActive: { backgroundColor: COLORS.home },
    detourOptionText: { fontSize: 14, fontWeight: '600', color: COLORS.gray600 },
    detourOptionTextActive: { color: COLORS.white },

    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.black, marginBottom: 12 },

    // Ride card
    rideCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 12 },
    proximityBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginBottom: 12 },
    proximityText: { fontSize: 11, fontWeight: '600' },
    rideHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    passengerRow: { flexDirection: 'row', alignItems: 'center' },
    passengerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.home + '20', justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 16, fontWeight: 'bold', color: COLORS.home },
    passengerInfo: { marginLeft: 10 },
    passengerName: { fontSize: 14, fontWeight: '600', color: COLORS.black },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    ratingText: { fontSize: 12, color: COLORS.gray600 },
    priceSection: { alignItems: 'flex-end' },
    priceText: { fontSize: 18, fontWeight: 'bold', color: COLORS.secondary },
    detourText: { fontSize: 11, color: COLORS.primary },

    // Route
    routeSection: { marginBottom: 12 },
    routePoint: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    dotGreen: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.secondary },
    dotHome: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.home },
    routeLine: { width: 2, height: 12, backgroundColor: COLORS.gray100, marginLeft: 4, marginVertical: 2 },
    routeAddress: { flex: 1, fontSize: 13, color: COLORS.black },

    // Stats
    rideStats: { flexDirection: 'row', gap: 20, marginBottom: 12 },
    rideStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    rideStatText: { fontSize: 12, color: COLORS.gray600 },

    // Accept
    acceptBtn: { borderRadius: 12, overflow: 'hidden' },
    acceptGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 8 },
    acceptText: { fontSize: 14, fontWeight: 'bold', color: COLORS.white },
    acceptIcon: { fontSize: 18 },

    // Empty state
    emptyState: { alignItems: 'center', paddingVertical: 40 },
    emptyIcon: { fontSize: 50, marginBottom: 12 },
    emptyText: { fontSize: 14, fontWeight: '600', color: COLORS.black },
    emptyHint: { fontSize: 12, color: COLORS.gray600, marginTop: 4 },

    // Disabled
    disabledState: { alignItems: 'center', paddingVertical: 60 },
    disabledIcon: { fontSize: 60, marginBottom: 16, opacity: 0.5 },
    disabledText: { fontSize: 16, fontWeight: '600', color: COLORS.gray600 },
    disabledHint: { fontSize: 12, color: COLORS.gray600, marginTop: 4 },
});
