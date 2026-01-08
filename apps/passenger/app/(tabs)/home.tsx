// =============================================
// TRANSIGO - HOME SCREEN (NOUVELLE MAQUETTE)
// =============================================

import { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Dimensions,
    ScrollView,
    Platform,
    Animated,
    PanResponder,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@/components/Icon';
import OSMMap from '@/components/OSMMap';
import * as Location from 'expo-location';
import { COLORS, SPACING, RADIUS, DEFAULT_LOCATION } from '@/constants';
import { useAuthStore, useLanguageStore, useThemeStore } from '@/stores';
import { getTranslation } from '@/i18n/translations';
import { locationService, LocationSearchResult } from '@/services/locationService';
import { rideService } from '@/services/supabaseService';

interface NearbyDriver {
    id: string;
    latitude: number;
    longitude: number;
    profile_type?: string;
    vehicle_type?: string;
}

const { width, height } = Dimensions.get('window');

// Lieux populaires
const POPULAR_PLACES = [
    {
        id: '1',
        name: 'Aéroport FHB',
        icon: 'airplane',
        distance: '12 km',
        duration: '25 min',
        coords: { latitude: 5.2539, longitude: -3.9263 },
    },
    {
        id: '2',
        name: 'Plateau',
        icon: 'grid',
        distance: '5 km',
        duration: '15 min',
        coords: { latitude: 5.3219, longitude: -4.0156 },
    },
];

// Taxis fictifs sur la carte
const NEARBY_DRIVERS: NearbyDriver[] = [
    { id: '1', latitude: 5.345, longitude: -4.025, profile_type: 'driver', vehicle_type: 'standard' },
    { id: '2', latitude: 5.335, longitude: -4.015, profile_type: 'driver', vehicle_type: 'standard' },
    { id: '3', latitude: 5.355, longitude: -4.035, profile_type: 'delivery', vehicle_type: 'moto' },
];

export default function HomeScreen() {
    const params = useLocalSearchParams<{
        vehicleType?: string;
        destLat?: string;
        destLng?: string;
        destName?: string;
    }>();
    const { user } = useAuthStore();
    const { language } = useLanguageStore();
    const { isDark, colors } = useThemeStore();
    const t = (key: any) => getTranslation(key, language);

    // Type de véhicule présélectionné depuis l'écran Services
    const preselectedVehicleType = params.vehicleType || null;

    // const mapRef = useRef<any>(null); // Désactivé temporairement pour OSMMap

    const [userLocation, setUserLocation] = useState(DEFAULT_LOCATION);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const [drivers, setDrivers] = useState<NearbyDriver[]>(NEARBY_DRIVERS);
    const [mapCenter, setMapCenter] = useState<{ latitude: number, longitude: number } | undefined>(undefined);
    const [zoom, setZoom] = useState(13);
    const [destinationMarker, setDestinationMarker] = useState<any>(null);
    const [routeCoords, setRouteCoords] = useState<{ latitude: number, longitude: number }[]>([]);
    const [tripInfo, setTripInfo] = useState<{ distance: number, duration: number } | null>(null);
    const [pickupAddress, setPickupAddress] = useState('Ma position');

    // Draggable button position
    const buttonPosition = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                buttonPosition.setOffset({
                    x: (buttonPosition.x as any)._value,
                    y: (buttonPosition.y as any)._value,
                });
                buttonPosition.setValue({ x: 0, y: 0 });
            },
            onPanResponderMove: Animated.event(
                [null, { dx: buttonPosition.x, dy: buttonPosition.y }],
                { useNativeDriver: false }
            ),
            onPanResponderRelease: () => {
                buttonPosition.flattenOffset();
            },
        })
    ).current;

    useEffect(() => {
        let subscription: Location.LocationSubscription | null = null;

        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const location = await Location.getCurrentPositionAsync({});
                const initialCoords = {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                };
                setUserLocation(initialCoords);

                // Récupérer l'adresse textuelle
                try {
                    const address = await locationService.reverseGeocode(location.coords.latitude, location.coords.longitude);
                    setPickupAddress(address);
                } catch (e) { }

                subscription = await Location.watchPositionAsync(
                    {
                        accuracy: Location.Accuracy.High,
                        distanceInterval: 10,
                    },
                    (newLocation) => {
                        setUserLocation((prev) => ({
                            ...prev,
                            latitude: newLocation.coords.latitude,
                            longitude: newLocation.coords.longitude,
                        }));
                    }
                );
            }
        })();

        const fetchRealDrivers = async () => {
            try {
                const { drivers: realDrivers } = await rideService.getNearbyDrivers(userLocation.latitude, userLocation.longitude, 10);
                if (realDrivers && realDrivers.length > 0) {
                    setDrivers(realDrivers.map((d: any) => ({
                        id: d.id,
                        latitude: d.current_lat,
                        longitude: d.current_lng,
                        profile_type: d.profile_type,
                        vehicle_type: d.vehicle_type
                    })));
                }
            } catch (e) {
                console.error('Error fetching real drivers:', e);
            }
        };

        fetchRealDrivers();
        const interval = setInterval(fetchRealDrivers, 10000); // Update every 10s

        return () => {
            if (subscription) subscription.remove();
            clearInterval(interval);
        };
    }, []);

    // Gestion de la destination via commande vocale
    useEffect(() => {
        if (params.destLat && params.destLng && userLocation.latitude !== 5.3499) {
            handlePlaceSelect({
                latitude: parseFloat(params.destLat),
                longitude: parseFloat(params.destLng),
                display_name: params.destName || 'Destination vocale'
            });
        }
    }, [params.destLat, params.destLng, userLocation.latitude]);

    useEffect(() => {
        const delaySearch = setTimeout(async () => {
            if (searchQuery.length >= 3) {
                setIsSearching(true);
                const results = await locationService.searchPlaces(searchQuery);
                setSearchResults(results);
                setIsSearching(false);
            } else {
                setSearchResults([]);
            }
        }, 500);

        return () => clearTimeout(delaySearch);
    }, [searchQuery]);

    const recenterMap = () => {
        setMapCenter({ latitude: userLocation.latitude, longitude: userLocation.longitude });
        setZoom(15);
    };

    const handlePlaceSelect = async (place: any) => {
        setSearchQuery(place.name || place.display_name);
        const coords = place.coords || { latitude: place.latitude, longitude: place.longitude };

        // Centrer et Zoomer
        setMapCenter(coords);
        setZoom(14);

        setDestinationMarker({
            id: 'destination',
            latitude: coords.latitude,
            longitude: coords.longitude,
            title: place.name || place.display_name
        });
        setSearchResults([]);

        // Calculer l'itinéraire immédiatement
        try {
            const route = await locationService.getRoute(
                userLocation.latitude, userLocation.longitude,
                coords.latitude, coords.longitude
            );
            if (route) {
                setRouteCoords(route.coordinates);
                setTripInfo({
                    distance: route.distance,
                    duration: route.duration
                });
            }
        } catch (error) {
            console.error('Erreur calcul trajet home:', error);
        }
    };

    const clearSelection = () => {
        setDestinationMarker(null);
        setRouteCoords([]);
        setTripInfo(null);
        setSearchQuery('');
        setMapCenter({ latitude: userLocation.latitude, longitude: userLocation.longitude });
        setZoom(13);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <OSMMap
                style={styles.map}
                initialRegion={userLocation}
                centerTo={mapCenter}
                zoom={zoom}
                markers={[
                    { id: destinationMarker ? 'pickup' : 'user', latitude: userLocation.latitude, longitude: userLocation.longitude },
                    ...drivers.map(d => ({
                        ...d,
                        id: d.id.toString(),
                        icon: d.profile_type === 'delivery' ? 'bicycle' : (d.vehicle_type === 'moto' ? 'bicycle' : 'car')
                    })),
                    ...(destinationMarker ? [destinationMarker] : [])
                ]}
                routeCoordinates={routeCoords}
            />

            <View style={styles.header}>
                <View>
                    <Text style={[styles.greetingSmall, { color: colors.textSecondary }]}>{t('greeting')} <Icon name="hand-right" size={14} color="#FFD54F" /></Text>
                    <Text style={[styles.userName, { color: colors.text }]}>{user?.firstName || 'Voyageur'} {user?.lastName || ''}</Text>
                </View>
                <TouchableOpacity
                    style={[styles.profileButton, { backgroundColor: colors.card }]}
                    onPress={() => router.push('/(tabs)/profile')}
                >
                    <Text style={styles.profileInitial}>{(user?.firstName?.[0] || 'V').toUpperCase()}</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
                <View style={[styles.searchBar, { backgroundColor: colors.card }]}>
                    <Icon name="search" size={20} color={COLORS.primary} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder={t('whereToGo')}
                        placeholderTextColor={colors.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    <Icon name="calendar" size={20} color={colors.textSecondary} />
                </View>

                {searchResults.length > 0 && (
                    <View style={[styles.resultsContainer, { backgroundColor: colors.card }]}>
                        {searchResults.map((result) => (
                            <TouchableOpacity
                                key={result.id}
                                style={[styles.resultItem, { borderBottomColor: isDark ? '#333' : '#F0F0F0' }]}
                                onPress={() => handlePlaceSelect(result)}
                            >
                                <Icon name="location" size={18} color={colors.textSecondary} />
                                <Text style={[styles.resultText, { color: colors.text }]} numberOfLines={1}>
                                    {result.display_name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>

            <View style={styles.placesContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.placesScroll}
                >
                    {POPULAR_PLACES.map((place) => (
                        <TouchableOpacity
                            key={place.id}
                            style={[styles.placeCard, { backgroundColor: colors.card }]}
                            onPress={() => handlePlaceSelect(place)}
                            activeOpacity={0.9}
                        >
                            <View style={styles.placeIconContainer}>
                                <Icon
                                    name={place.icon as any}
                                    size={20}
                                    color={COLORS.primary}
                                />
                            </View>
                            <View style={styles.placeInfo}>
                                <Text style={[styles.placeName, { color: colors.text }]}>
                                    {place.id === '1' ? t('airport') : place.id === '2' ? t('plateau') : place.name}
                                </Text>
                                <Text style={[styles.placeDetails, { color: colors.textSecondary }]}>
                                    {place.distance} • {place.duration}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                    {/* Bouton Historique des Prix */}
                    <TouchableOpacity
                        style={[styles.placeCard, { backgroundColor: '#9C27B020' }]}
                        onPress={() => router.push('/price-history')}
                        activeOpacity={0.9}
                    >
                        <View style={[styles.placeIconContainer, { backgroundColor: '#9C27B0' }]}>
                            <Icon name="trending-up" size={20} color={COLORS.white} />
                        </View>
                        <View style={styles.placeInfo}>
                            <Text style={[styles.placeName, { color: colors.text }]}>
                                {language === 'fr' ? 'Historique Prix' : 'Price History'}
                            </Text>
                            <Text style={[styles.placeDetails, { color: '#9C27B0' }]}>
                                {language === 'fr' ? 'Meilleur moment' : 'Best time'}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            <TouchableOpacity
                style={[styles.recenterButton, { backgroundColor: colors.card }]}
                onPress={recenterMap}
                activeOpacity={0.9}
            >
                <Icon name="navigate" size={24} color={colors.text} />
            </TouchableOpacity>

            {/* Trip Info Card - Only when destination selected */}
            {tripInfo && destinationMarker && (
                <View style={styles.tripInfoContainer}>
                    <View style={[styles.tripInfoCard, { backgroundColor: colors.card }]}>
                        <View style={styles.tripInfoRow}>
                            <View style={styles.tripInfoItem}>
                                <Text style={styles.tripInfoLabel}>Distance</Text>
                                <Text style={[styles.tripInfoValue, { color: colors.text }]}>{tripInfo.distance.toFixed(1)} km</Text>
                            </View>
                            <View style={[styles.tripInfoDivider, { backgroundColor: isDark ? '#333' : '#F0F0F0' }]} />
                            <View style={styles.tripInfoItem}>
                                <Text style={styles.tripInfoLabel}>Temps</Text>
                                <Text style={[styles.tripInfoValue, { color: colors.text }]}>{Math.round(tripInfo.duration)} min</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.clearSelectionButton} onPress={clearSelection}>
                            <Icon name="close-circle" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Floating Commander Button - Only visible when destination is set */}
            {destinationMarker && (
                <View style={styles.floatingCommanderButton}>
                    <TouchableOpacity
                        style={styles.commanderButtonInner}
                        activeOpacity={0.9}
                        onPress={() => {
                            router.push({
                                pathname: '/booking',
                                params: {
                                    dest_lat: destinationMarker.latitude,
                                    dest_lon: destinationMarker.longitude,
                                    dest_name: destinationMarker.title,
                                    src_lat: userLocation.latitude,
                                    src_lon: userLocation.longitude,
                                    src_name: pickupAddress,
                                    distance: tripInfo?.distance,
                                    duration: tripInfo?.duration,
                                    vehicleType: preselectedVehicleType || undefined
                                }
                            });
                        }}
                    >
                        <Icon
                            name={preselectedVehicleType === 'moto' ? 'bicycle' :
                                preselectedVehicleType === 'van' ? 'bus' :
                                    preselectedVehicleType === 'comfort' ? 'car-sport' : 'car'}
                            size={28}
                            color={COLORS.white}
                            style={{ marginRight: 10 }}
                        />
                        <Text style={styles.commanderText}>{t('commandButton')}</Text>
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
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingTop: 60,
        paddingBottom: SPACING.md,
        backgroundColor: 'transparent',
    },
    greetingSmall: {
        fontSize: 14,
        fontFamily: 'Poppins-Regular',
        marginBottom: 4,
    },
    userName: {
        fontSize: 22,
        fontFamily: 'Poppins-Bold',
    },
    profileButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    profileInitial: {
        fontSize: 20,
        fontFamily: 'Poppins-Bold',
        color: COLORS.primary,
    },
    searchContainer: {
        paddingHorizontal: SPACING.lg,
        marginBottom: SPACING.md,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 30,
        paddingHorizontal: SPACING.md,
        paddingVertical: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        marginLeft: SPACING.sm,
        marginRight: SPACING.sm,
    },
    resultsContainer: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        borderRadius: RADIUS.md,
        marginTop: SPACING.xs,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 10,
        zIndex: 1000,
        padding: SPACING.xs,
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: SPACING.md,
        borderBottomWidth: 1,
    },
    resultText: {
        fontSize: 14,
        marginLeft: 10,
        flex: 1,
    },
    placesContainer: {
        paddingLeft: SPACING.lg,
    },
    placesScroll: {
        paddingRight: SPACING.lg,
    },
    placeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginRight: SPACING.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        minWidth: 160,
    },
    placeIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: COLORS.primaryBg,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    placeIcon: {
        fontSize: 20,
    },
    placeInfo: {
        flex: 1,
    },
    placeName: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    placeDetails: {
        fontSize: 12,
    },
    userMarker: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#2196F3',
    },
    userMarkerInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#2196F3',
    },
    taxiMarker: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    taxiIcon: {
        fontSize: 18,
    },
    recenterButton: {
        position: 'absolute',
        right: SPACING.lg,
        bottom: 140,
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    tripInfoContainer: {
        position: 'absolute',
        bottom: 160,
        left: SPACING.lg,
        right: SPACING.lg,
    },
    floatingCommanderButton: {
        position: 'absolute',
        bottom: 100,
        left: SPACING.lg,
        right: SPACING.lg,
        zIndex: 999,
    },
    commanderButtonInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        borderRadius: 30,
        backgroundColor: COLORS.primary,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 15,
        elevation: 10,
    },
    commanderIcon: {
        fontSize: 24,
        marginRight: 10,
    },
    commanderText: {
        fontSize: 18,
        fontFamily: 'Poppins-Bold',
        color: COLORS.white,
        letterSpacing: 1,
    },
    tripInfoCard: {
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    tripInfoRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    tripInfoItem: {
        alignItems: 'center',
    },
    tripInfoLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginBottom: 4,
    },
    tripInfoValue: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    tripInfoDivider: {
        width: 1,
        height: 30,
    },
    clearSelectionButton: {
        marginLeft: 8,
    },
});
