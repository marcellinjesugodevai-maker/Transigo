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
import * as Speech from 'expo-speech';
import { COLORS, SPACING, RADIUS, DEFAULT_LOCATION } from '@/constants';
import { useAuthStore, useLanguageStore, useThemeStore } from '@/stores';
import { getTranslation } from '@/i18n/translations';
import { locationService, LocationSearchResult } from '@/services/locationService';
import { rideService } from '@/services/supabaseService';
import { carpoolService } from '@/services/carpoolService';
import { SharedRide } from '@/stores/carpoolStore';

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
        icon: 'business',
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

    // Covoiturage dynamique
    const [sharedRides, setSharedRides] = useState<SharedRide[]>([]);
    const [selectedSharedRide, setSelectedSharedRide] = useState<SharedRide | null>(null);
    const [isJoining, setIsJoining] = useState(false);
    const [activeToast, setActiveToast] = useState<{ message: string; sub: string } | null>(null);
    const [isFlashActive, setIsFlashActive] = useState(false);
    const flashAnim = useRef(new Animated.Value(0)).current;
    const spokenRides = useRef<Set<string>>(new Set());

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

        // Charger les trajets de covoiturage disponibles
        const fetchSharedRides = async () => {
            try {
                const { rides } = await carpoolService.findAvailableRides(
                    userLocation.latitude, userLocation.longitude, 10 // Portée 10km
                );
                // Filtrer ceux qui ont une trajectoire
                if (rides) {
                    setSharedRides(rides.filter(r => r.route_trajectory && r.route_trajectory.length > 0));
                }
            } catch (e) {
                console.log('Error fetching shared rides:', e);
            }
        };

        fetchSharedRides();
        const sharedInterval = setInterval(fetchSharedRides, 15000);

        return () => {
            if (subscription) subscription.remove();
            clearInterval(interval);
            clearInterval(sharedInterval);
        };
    }, [userLocation.latitude, userLocation.longitude]);

    // Notification automatique de proximité covoiturage
    useEffect(() => {
        if (sharedRides.length > 0) {
            let activeNearest: { ride: SharedRide, dist: number } | null = null;

            sharedRides.forEach(ride => {
                const dist = calculateDistance(
                    userLocation.latitude, userLocation.longitude,
                    ride.current_lat || ride.pickup_lat, ride.current_lon || ride.pickup_lon
                );
                if (dist <= 1.5 && (!activeNearest || dist < activeNearest.dist)) {
                    activeNearest = { ride, dist };
                }
            });

            if (activeNearest && !selectedSharedRide) {
                const { ride, dist } = activeNearest as { ride: SharedRide, dist: number };
                setActiveToast({
                    message: language === 'fr' ? "Covoiturage à proximité !" : "Carpool nearby!",
                    sub: `${ride.driver_name || 'Un chauffeur'} ${language === 'fr' ? 'approche' : 'is approaching'}`
                });

                // VOIX : Annonce si distance < 0.8km et pas encore dit
                if (dist <= 0.8 && !spokenRides.current.has(ride.id)) {
                    const text = language === 'fr'
                        ? `Le chauffeur ${ride.driver_name || ''} arrive. Il est à moins de huit cent mètres.`
                        : `Driver ${ride.driver_name || ''} is approaching. Less than eight hundred meters away.`;
                    Speech.speak(text, { language: language === 'fr' ? 'fr-FR' : 'en-US' });
                    spokenRides.current.add(ride.id);
                }

                // Auto-hide toast after 8s
                setTimeout(() => setActiveToast(null), 8000);
            }
        }
    }, [sharedRides.length]);

    // Animation Flash Clignotant
    useEffect(() => {
        if (isFlashActive) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(flashAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
                    Animated.timing(flashAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
                ])
            ).start();
        } else {
            flashAnim.setValue(0);
        }
    }, [isFlashActive]);
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

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

    const handleRoutePress = (id: string) => {
        const ride = sharedRides.find(r => r.id === id);
        if (ride) {
            setSelectedSharedRide(ride);
        }
    };

    const handleJoinIntercept = async () => {
        if (!selectedSharedRide || !user) return;
        setIsJoining(true);
        try {
            const { success, error } = await carpoolService.joinRide(
                selectedSharedRide.id,
                user.id,
                user.phone || '',
                user.firstName,
                { address: 'Interception', lat: userLocation.latitude, lon: userLocation.longitude },
                { address: selectedSharedRide.dropoff_address, lat: selectedSharedRide.dropoff_lat, lon: selectedSharedRide.dropoff_lon }
            );

            if (success) {
                router.push({
                    pathname: '/ride-tracking',
                    params: { rideId: selectedSharedRide.id, type: 'shared' }
                });
            } else {
                alert(error || "Erreur lors de la jonction");
            }
        } catch (e) {
            console.error("Join error:", e);
        }
        setIsJoining(false);
        setSelectedSharedRide(null);
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
                sharedRoutes={sharedRides.map(r => ({
                    id: r.id,
                    coordinates: r.route_trajectory as any,
                    color: '#2E7D32'
                }))}
                onRoutePress={handleRoutePress}
            />

            {/* Toast Alerte de Proximité */}
            {activeToast && (
                <View style={styles.toastContainer}>
                    <LinearGradient colors={['#4CAF50', '#2E7D32']} style={styles.toastGradient}>
                        <Icon name="notifications" size={20} color={COLORS.white} />
                        <View style={styles.toastTextContainer}>
                            <Text style={styles.toastTitle}>{activeToast.message}</Text>
                            <Text style={styles.toastSub}>{activeToast.sub}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setActiveToast(null)}>
                            <Icon name="close" size={20} color={COLORS.white} />
                        </TouchableOpacity>
                    </LinearGradient>
                </View>
            )}

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
                        <LinearGradient
                            colors={[COLORS.primary, COLORS.primaryDark]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.commanderGradient}
                        >
                            <Icon
                                name={preselectedVehicleType === 'moto' ? 'bicycle' :
                                    preselectedVehicleType === 'van' ? 'bus' :
                                        preselectedVehicleType === 'comfort' ? 'car-sport' : 'car'}
                                size={24}
                                color={COLORS.white}
                            />
                            <Text style={styles.commanderText}>
                                {language === 'fr' ? 'Commander' : 'Book Now'}
                            </Text>
                            <Icon name="arrow-forward" size={20} color={COLORS.white} />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            )}

            {/* Modal Interception Covoiturage */}
            {selectedSharedRide && (
                <View style={styles.interceptModalOverlay}>
                    <View style={[styles.interceptModal, { backgroundColor: colors.card }]}>
                        <View style={styles.interceptHeader}>
                            <View style={styles.interceptIconContainer}>
                                <Icon name="people" size={24} color={COLORS.white} />
                            </View>
                            <View style={styles.interceptTitleRow}>
                                <Text style={[styles.interceptTitle, { color: colors.text }]}>Covoiturage trouvé !</Text>
                                <Text style={[styles.interceptSubtitle, { color: colors.textSecondary }]}>Passage imminent dans votre zone</Text>
                            </View>
                            <TouchableOpacity onPress={() => setSelectedSharedRide(null)}>
                                <Icon name="close" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.interceptContent}>
                            <View style={styles.interceptInfoRow}>
                                <View style={styles.interceptInfoItem}>
                                    <Text style={styles.interceptInfoLabel}>Vers</Text>
                                    <Text style={[styles.interceptInfoValue, { color: colors.text }]} numberOfLines={1}>
                                        {selectedSharedRide.dropoff_address}
                                    </Text>
                                </View>
                            </View>

                            <View style={[styles.priceBonusCard, { backgroundColor: isDark ? '#1a3a3a' : '#E8F5E9' }]}>
                                <View style={styles.priceInfo}>
                                    <Text style={styles.priceLabel}>Prix Interception</Text>
                                    <View style={styles.priceRow}>
                                        <Text style={[styles.priceValue, { color: colors.text }]}>
                                            {Math.round(selectedSharedRide.current_price_per_person * 1.15).toLocaleString()} F
                                        </Text>
                                        <View style={styles.bonusBadge}>
                                            <Text style={styles.bonusText}>-50% vs Taxi</Text>
                                        </View>
                                    </View>
                                </View>
                                <Icon name="rocket" size={32} color="#4CAF50" />
                            </View>

                            <TouchableOpacity
                                style={styles.joinButton}
                                onPress={handleJoinIntercept}
                                disabled={isJoining}
                            >
                                <LinearGradient colors={['#4CAF50', '#2E7D32']} style={styles.joinGradient}>
                                    <Text style={styles.joinText}>MONTER MAINTENANT</Text>
                                    <Icon name="arrow-forward" size={20} color={COLORS.white} />
                                </LinearGradient>
                            </TouchableOpacity>

                            {/* SIGNAL VERT : Pour se faire repérer */}
                            <TouchableOpacity
                                style={[styles.signalButton, isFlashActive && styles.signalButtonActive]}
                                onPress={() => setIsFlashActive(!isFlashActive)}
                            >
                                <Icon name="flashlight" size={20} color={isFlashActive ? COLORS.white : '#4CAF50'} />
                                <Text style={[styles.signalText, { color: isFlashActive ? COLORS.white : '#4CAF50' }]}>
                                    {isFlashActive ? "SIGNAL ACTIF (Agitez le téléphone)" : "SIGNALLER MA PRÉSENCE"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}

            {/* OVERLAY SIGNAL VERT (FLASH) */}
            {isFlashActive && (
                <TouchableOpacity
                    style={styles.flashOverlay}
                    onPress={() => setIsFlashActive(false)}
                    activeOpacity={1}
                >
                    <Animated.View style={[styles.flashContent, {
                        opacity: flashAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.3, 1]
                        })
                    }]}>
                        <Icon name="car" size={120} color={COLORS.white} />
                        <Text style={styles.flashTitle}>TRANSIGO</Text>
                        <Text style={styles.flashSub}>Le chauffeur vous cherche...</Text>
                    </Animated.View>
                </TouchableOpacity>
            )}

            {/* Carousel de Suggestions Simplifié */}
            {sharedRides && sharedRides.length > 0 && !selectedSharedRide && (
                <View style={styles.carpoolCarouselContainer}>
                    <Text style={[styles.carpoolCarouselTitle, { color: colors.text }]}>
                        🚗 {language === 'fr' ? 'Chauffeurs qui passent près de vous' : 'Drivers passing near you'}
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carpoolCarouselScroll}>
                        {sharedRides.map((ride) => (
                            <TouchableOpacity
                                key={ride.id}
                                style={[styles.carpoolCardMini, { backgroundColor: colors.card }]}
                                onPress={() => setSelectedSharedRide(ride)}
                                activeOpacity={0.9}
                            >
                                <View style={styles.carpoolCardHeader}>
                                    <View style={styles.driverAvatarSmall}>
                                        <Text style={styles.driverAvatarText}>{ride.driver_name?.charAt(0) || 'D'}</Text>
                                    </View>
                                    <View style={styles.carpoolInfoMini}>
                                        <Text style={[styles.driverNameMini, { color: colors.text }]}>{ride.driver_name || 'Chauffeur'}</Text>
                                        <Text style={styles.carpoolDestMini} numberOfLines={1}>Vers {ride.dropoff_address.split(',')[0]}</Text>
                                    </View>
                                    <View style={styles.approachBadge}>
                                        <Text style={styles.approachText}>
                                            {(() => {
                                                const d = calculateDistance(
                                                    userLocation.latitude, userLocation.longitude,
                                                    ride.current_lat || ride.pickup_lat, ride.current_lon || ride.pickup_lon
                                                );
                                                return d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`;
                                            })()}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.carpoolCardFooter}>
                                    <View style={styles.miniPriceBadge}>
                                        <Text style={styles.miniPriceText}>{Math.round(ride.current_price_per_person * 1.15).toLocaleString()} F</Text>
                                    </View>
                                    <View style={styles.miniCatchAction}>
                                        <Text style={styles.miniCatchText}>INTERCEPTER</Text>
                                        <Icon name="hand-right" size={14} color={COLORS.primary} />
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
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
        borderRadius: 30,
        overflow: 'hidden',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 15,
        elevation: 10,
    },
    commanderGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        paddingHorizontal: 24,
        gap: 10,
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
    // Interception Modal
    interceptModalOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
        padding: SPACING.lg,
    },
    interceptModal: {
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 20,
    },
    interceptHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    interceptIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    interceptTitleRow: {
        flex: 1,
    },
    interceptTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    interceptSubtitle: {
        fontSize: 12,
    },
    interceptContent: {
        gap: 16,
    },
    interceptInfoRow: {
        flexDirection: 'row',
    },
    interceptInfoItem: {
        flex: 1,
    },
    interceptInfoLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginBottom: 4,
    },
    interceptInfoValue: {
        fontSize: 16,
        fontWeight: '600',
    },
    priceBonusCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#4CAF5030',
    },
    priceInfo: {
        flex: 1,
    },
    priceLabel: {
        fontSize: 13,
        color: '#4CAF50',
        fontWeight: '600',
        marginBottom: 4,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    priceValue: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    bonusBadge: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    bonusText: {
        color: COLORS.white,
        fontSize: 10,
        fontWeight: 'bold',
    },
    joinButton: {
        borderRadius: 16,
        overflow: 'hidden',
        marginTop: 8,
    },
    joinGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        gap: 10,
    },
    joinText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    signalButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#4CAF50',
        marginTop: 10,
        gap: 10,
    },
    signalButtonActive: {
        backgroundColor: '#4CAF50',
    },
    signalText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    flashOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#4CAF50',
        zIndex: 9999,
        justifyContent: 'center',
        alignItems: 'center',
    },
    flashContent: {
        alignItems: 'center',
    },
    flashTitle: {
        color: COLORS.white,
        fontSize: 48,
        fontWeight: 'bold',
        marginTop: 20,
    },
    flashSub: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 18,
        marginTop: 10,
    },
    // Styles pour le Carousel de Suggestions
    carpoolCarouselContainer: {
        position: 'absolute',
        bottom: 100,
        left: 0,
        right: 0,
        paddingVertical: 10,
    },
    carpoolCarouselTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        marginLeft: 20,
        marginBottom: 8,
        textShadowColor: 'rgba(0,0,0,0.1)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    carpoolCarouselScroll: {
        paddingHorizontal: 20,
        gap: 12,
    },
    carpoolCardMini: {
        width: width * 0.7,
        borderRadius: 18,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: 'rgba(76, 175, 80, 0.1)',
    },
    carpoolCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    driverAvatarSmall: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#4CAF5020',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    driverAvatarText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    carpoolInfoMini: {
        flex: 1,
    },
    driverNameMini: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    carpoolDestMini: {
        fontSize: 11,
        color: COLORS.textSecondary,
    },
    carpoolCardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    miniPriceBadge: {
        backgroundColor: '#4CAF5015',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    miniPriceText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2E7D32',
    },
    miniCatchAction: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    miniCatchText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    approachBadge: {
        backgroundColor: COLORS.primary + '20',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.primary + '30',
    },
    approachText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    toastContainer: {
        position: 'absolute',
        top: 120,
        left: 20,
        right: 20,
        zIndex: 1000,
    },
    toastGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 10,
    },
    toastTextContainer: {
        flex: 1,
        marginLeft: 12,
    },
    toastTitle: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: 'bold',
    },
    toastSub: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
    },
});
