// =============================================
// TRANSIGO DRIVER - MODE DIRECTION FLEXIBLE
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
import { rideService } from '../src/services/supabaseService';
import { useDriverStore } from '../src/stores/driverStore';
import { carpoolDriverService } from '../src/services/carpoolDriverService';
import { locationService } from '../src/services/locationService';
import * as Location from 'expo-location';
import { useDriverPremiumsStore } from '../src/stores/driverPremiumsStore';

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

export default function HomeDirectionScreen() {
    const { driver } = useDriverStore();
    const { homeMode, toggleHomeMode, setHomeAddress } = useDriverPremiumsStore();

    const [maxDetour, setMaxDetour] = useState(3);
    const [isEditing, setIsEditing] = useState(false);
    const [tempAddress, setTempAddress] = useState(homeMode.address);
    const [rides, setRides] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [activeSharedRide, setActiveSharedRide] = useState<any>(null);

    // Destination personnalisée
    const [destinationMode, setDestinationMode] = useState<'home' | 'custom'>('home');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [customDestination, setCustomDestination] = useState<{ address: string; lat: number; lng: number } | null>(null);

    useEffect(() => {
        if (homeMode.active || activeSharedRide) {
            loadRides();
            const channel = rideService.subscribeToNewRides(() => {
                loadRides();
            });
            return () => {
                if (channel) channel.unsubscribe();
            };
        }
    }, [homeMode.active, maxDetour, destinationMode, customDestination, activeSharedRide]);

    useEffect(() => {
        const delaySearch = setTimeout(async () => {
            if (searchQuery.length >= 3) {
                try {
                    const results = await locationService.searchPlaces(searchQuery);
                    setSearchResults(results);
                } catch (e) { }
            } else {
                setSearchResults([]);
            }
        }, 500);
        return () => clearTimeout(delaySearch);
    }, [searchQuery]);

    // Synchronisation GPS du trajet actif
    useEffect(() => {
        let locationInterval: NodeJS.Timeout;

        if (activeSharedRide) {
            locationInterval = setInterval(async () => {
                try {
                    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                    await carpoolDriverService.updateRouteProgress(
                        activeSharedRide.id,
                        loc.coords.latitude,
                        loc.coords.longitude
                    );
                } catch (e) {
                    console.error("Sync error:", e);
                }
            }, 10000); // Toutes les 10 secondes
        }

        return () => {
            if (locationInterval) clearInterval(locationInterval);
        };
    }, [activeSharedRide]);

    // Abonnement aux interceptions (nouveaux passagers)
    useEffect(() => {
        let passengerSub: any;

        if (activeSharedRide) {
            passengerSub = carpoolDriverService.subscribeToPassengers(activeSharedRide.id, (passenger) => {
                Alert.alert(
                    "🚀 Nouvelle Interception !",
                    `${passenger.user_name} vient de vous intercepter !\nArrêtez-vous à : ${passenger.pickup_address}`,
                    [{ text: "OK", style: "default" }]
                );
            });
        }

        return () => {
            if (passengerSub) passengerSub.unsubscribe();
        };
    }, [activeSharedRide]);

    const loadRides = async () => {
        setLoading(true);
        const targetLat = destinationMode === 'home' ? homeMode.lat : customDestination?.lat;
        const targetLng = destinationMode === 'home' ? homeMode.lng : customDestination?.lng;

        if (!targetLat || !targetLng) {
            setLoading(false);
            return;
        }

        try {
            const { rides: allRides } = await rideService.getRequestedRides();
            if (allRides) {
                const filtered = allRides.filter((r: any) => {
                    const detour = getDistance(r.dropoff_lat, r.dropoff_lng, targetLat, targetLng);
                    return detour <= maxDetour;
                }).map((r: any) => ({
                    ...r,
                    detourKm: getDistance(r.dropoff_lat, r.dropoff_lng, targetLat, targetLng).toFixed(1),
                    homeProximity: Math.round(Math.max(0, 100 - (getDistance(r.dropoff_lat, r.dropoff_lng, targetLat, targetLng) * 10))),
                    passengerName: `${r.users?.first_name} ${r.users?.last_name || ''}`,
                    passengerRating: 4.8
                }));
                setRides(filtered);
            }
        } catch (e) { }
        setLoading(false);
    };

    const handleToggle = async (value: boolean) => {
        if (value) {
            setPublishing(true);
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                    const loc = await Location.getCurrentPositionAsync({});

                    const targetLat = destinationMode === 'home' ? homeMode.lat : customDestination?.lat;
                    const targetLng = destinationMode === 'home' ? homeMode.lng : customDestination?.lng;
                    const targetAddress = destinationMode === 'home' ? homeMode.address : customDestination?.address;

                    if (!targetLat || !targetLng) {
                        setPublishing(false);
                        Alert.alert("Destination manquante", "Veuillez choisir une destination.");
                        return;
                    }

                    const route = await locationService.getRoute(
                        loc.coords.latitude, loc.coords.longitude,
                        targetLat, targetLng
                    );

                    if (route) {
                        const { ride, error } = await carpoolDriverService.publishRoute({
                            driverId: driver!.id,
                            driverName: `${driver!.firstName} ${driver!.lastName || ''}`,
                            driverPhone: driver!.phone || '',
                            pickup: {
                                address: 'Position actuelle',
                                lat: loc.coords.latitude,
                                lon: loc.coords.longitude
                            },
                            dropoff: {
                                address: targetAddress || 'Destination',
                                lat: targetLat,
                                lon: targetLng
                            },
                            trajectory: route.coordinates,
                            basePrice: Math.round(route.distance * 200),
                            vehicleType: (driver as any).vehicleType || 'standard',
                            destinationMode: destinationMode
                        });

                        if (ride) setActiveSharedRide(ride);
                    }
                }
            } catch (e) {
                console.error("Erreur publication itinéraire:", e);
                Alert.alert("Erreur", "Impossible de publier votre itinéraire.");
            }
            setPublishing(false);
        } else {
            if (activeSharedRide) {
                try {
                    await carpoolDriverService.updateRideStatus(activeSharedRide.id, 'cancelled');
                } catch (e) { }
                setActiveSharedRide(null);
            }
        }

        if (destinationMode === 'home') {
            toggleHomeMode();
        }
    };

    const handleSelectCustomDest = (place: any) => {
        setCustomDestination({
            address: place.display_name,
            lat: parseFloat(place.lat),
            lng: parseFloat(place.lon)
        });
        setSearchQuery(place.display_name);
        setSearchResults([]);
    };

    const handleSaveAddress = () => {
        setHomeAddress(tempAddress);
        setIsEditing(false);
    };

    const handleAcceptRide = async (ride: any) => {
        try {
            const { error } = await rideService.acceptRide(ride.id, driver!.id);
            if (!error) {
                Alert.alert(
                    '🏠 Course acceptée !',
                    `Dirigez-vous vers ${ride.pickup_address}.`,
                    [{ text: 'OK', onPress: () => router.push('/driver-navigation?type=pickup') }]
                );
            }
        } catch (e) { }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <LinearGradient colors={[COLORS.home, COLORS.homeDark]} style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Text style={{ fontSize: 24, color: COLORS.white }}>⬅️</Text>
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>🏠 Mode Direction</Text>
                    <Text style={styles.headerSubtitle}>Proposez votre trajet au covoiturage</Text>
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.toggleCard}>
                    <View style={styles.toggleInfo}>
                        <Text style={styles.toggleTitle}>Partager mon trajet</Text>
                        <Text style={styles.toggleDesc}>Visible par les passagers sur votre route</Text>
                    </View>
                    <Switch
                        value={activeSharedRide ? true : homeMode.active}
                        onValueChange={handleToggle}
                        trackColor={{ false: COLORS.gray100, true: COLORS.home + '50' }}
                        thumbColor={(activeSharedRide || homeMode.active) ? COLORS.home : COLORS.gray600}
                    />
                </View>

                <View style={styles.modeSelector}>
                    <TouchableOpacity
                        style={[styles.modeBtn, destinationMode === 'home' && styles.modeBtnActive]}
                        onPress={() => setDestinationMode('home')}
                    >
                        <Text style={{ fontSize: 20 }}>🏠</Text>
                        <Text style={[styles.modeBtnText, destinationMode === 'home' && styles.modeBtnTextActive]}>Maison</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.modeBtn, destinationMode === 'custom' && styles.modeBtnActive]}
                        onPress={() => setDestinationMode('custom')}
                    >
                        <Text style={{ fontSize: 20 }}>🗺️</Text>
                        <Text style={[styles.modeBtnText, destinationMode === 'custom' && styles.modeBtnTextActive]}>Libre</Text>
                    </TouchableOpacity>
                </View>

                {destinationMode === 'home' ? (
                    <View style={styles.addressCard}>
                        <View style={styles.addressHeader}>
                            <Text style={styles.addressLabel}>🏠 Mon domicile</Text>
                            <TouchableOpacity onPress={isEditing ? handleSaveAddress : () => setIsEditing(true)}>
                                <Text style={styles.editBtn}>{isEditing ? 'Enregistrer' : 'Modifier'}</Text>
                            </TouchableOpacity>
                        </View>
                        {isEditing ? (
                            <TextInput
                                style={styles.addressInput}
                                value={tempAddress}
                                onChangeText={setTempAddress}
                                placeholder="Adresse domicile..."
                                placeholderTextColor={COLORS.gray600}
                            />
                        ) : (
                            <Text style={styles.addressText}>{homeMode.address}</Text>
                        )}
                    </View>
                ) : (
                    <View style={styles.addressCard}>
                        <Text style={styles.addressLabel}>📍 Destination personnalisée</Text>
                        <View style={styles.searchBar}>
                            <Text style={{ fontSize: 18 }}>🔍</Text>
                            <TextInput
                                style={[styles.addressInput, { flex: 1, marginLeft: 8 }]}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                placeholder="Où allez-vous ?"
                                placeholderTextColor={COLORS.gray600}
                            />
                        </View>
                        {searchResults.length > 0 && (
                            <View style={styles.searchResults}>
                                {searchResults.map((res: any, idx: number) => (
                                    <TouchableOpacity key={idx} style={styles.searchItem} onPress={() => handleSelectCustomDest(res)}>
                                        <Text style={styles.searchResultText} numberOfLines={1}>{res.display_name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>
                )}

                {activeSharedRide && (
                    <View style={styles.shareBadge}>
                        <LinearGradient colors={['#4CAF50', '#2E7D32']} style={styles.shareBadgeGradient}>
                            <Text style={{ fontSize: 16 }}>📡</Text>
                            <Text style={styles.shareBadgeText}>Trajet actif (+15% bonus interception)</Text>
                        </LinearGradient>
                    </View>
                )}

                <View style={styles.detourCard}>
                    <Text style={styles.detourLabel}>🛤️ Détour maximum accepté</Text>
                    <View style={styles.detourOptions}>
                        {[1, 2, 3, 5].map((km) => (
                            <TouchableOpacity
                                key={km}
                                style={[styles.detourOption, maxDetour === km && styles.detourOptionActive]}
                                onPress={() => setMaxDetour(km)}
                            >
                                <Text style={[styles.detourOptionText, maxDetour === km && styles.detourOptionTextActive]}>{km} km</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color={COLORS.home} style={{ marginTop: 20 }} />
                ) : (
                    rides.length > 0 && (
                        <>
                            <Text style={styles.sectionTitle}>🚗 Courses sur votre route</Text>
                            {rides.map((ride) => (
                                <View key={ride.id} style={styles.rideCard}>
                                    <View style={styles.rideHeader}>
                                        <Text style={styles.passengerName}>{ride.passengerName}</Text>
                                        <Text style={styles.priceText}>{ride.price.toLocaleString()} F</Text>
                                    </View>
                                    <Text style={styles.routeAddress} numberOfLines={1}>📍 {ride.pickup_address}</Text>
                                    <Text style={styles.routeAddress} numberOfLines={1}>🏁 {ride.dropoff_address}</Text>
                                    <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAcceptRide(ride)}>
                                        <LinearGradient colors={[COLORS.home, COLORS.homeDark]} style={styles.acceptGradient}>
                                            <Text style={styles.acceptText}>ACCEPTER</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </>
                    )
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.gray50 },
    header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    headerContent: { marginTop: 12 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.white },
    headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
    content: { padding: 16 },
    toggleCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, padding: 16, borderRadius: 16, marginBottom: 12 },
    toggleInfo: { flex: 1 },
    toggleTitle: { fontSize: 16, fontWeight: 'bold' },
    toggleDesc: { fontSize: 12, color: COLORS.gray600 },
    modeSelector: { flexDirection: 'row', backgroundColor: COLORS.gray100, borderRadius: 12, padding: 4, marginBottom: 16 },
    modeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, gap: 8 },
    modeBtnActive: { backgroundColor: COLORS.home },
    modeBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.gray600 },
    modeBtnTextActive: { color: COLORS.white },
    addressCard: { backgroundColor: COLORS.white, padding: 16, borderRadius: 16, marginBottom: 12 },
    addressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    addressLabel: { fontSize: 13, fontWeight: 'bold' },
    addressText: { color: COLORS.gray600, fontSize: 14 },
    addressInput: { borderBottomWidth: 1, borderBottomColor: COLORS.gray100, paddingVertical: 8, fontSize: 14, color: '#000' },
    editBtn: { color: COLORS.home, fontWeight: 'bold' },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.gray50, borderRadius: 8, paddingHorizontal: 10, marginTop: 8 },
    searchResults: { marginTop: 8, borderTopWidth: 1, borderTopColor: COLORS.gray100, maxHeight: 200 },
    searchItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.gray50 },
    searchResultText: { fontSize: 12, color: '#333' },
    shareBadge: { marginBottom: 12, borderRadius: 12, overflow: 'hidden' },
    shareBadgeGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, gap: 8 },
    shareBadgeText: { color: COLORS.white, fontSize: 12, fontWeight: 'bold' },
    detourCard: { backgroundColor: COLORS.white, padding: 16, borderRadius: 16, marginBottom: 20 },
    detourLabel: { fontSize: 13, fontWeight: 'bold' },
    detourOptions: { flexDirection: 'row', gap: 10, marginTop: 12 },
    detourOption: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10, backgroundColor: COLORS.gray100 },
    detourOptionActive: { backgroundColor: COLORS.home },
    detourOptionText: { fontSize: 13, fontWeight: 'bold', color: COLORS.gray600 },
    detourOptionTextActive: { color: COLORS.white },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
    rideCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 12 },
    rideHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    passengerName: { fontWeight: 'bold' },
    priceText: { color: COLORS.secondary, fontWeight: 'bold' },
    routeAddress: { fontSize: 12, color: COLORS.gray600, marginBottom: 4 },
    acceptBtn: { marginTop: 12, borderRadius: 10, overflow: 'hidden' },
    acceptGradient: { paddingVertical: 12, alignItems: 'center' },
    acceptText: { color: COLORS.white, fontWeight: 'bold' }
});

