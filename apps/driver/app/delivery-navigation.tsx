// =============================================
// TRANSIGO DELIVERY - NAVIGATION GPS
// Itinéraire vers restaurant ou client
// =============================================

import { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    StatusBar,
    Animated,
    Alert,
    Linking,
    Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import * as Location from 'expo-location';
import OSMMap from '../src/components/OSMMap';
import { locationService, RouteStep } from '../src/services/locationService';
import { useDriverStore } from '../src/stores/driverStore';
import { driverService } from '../src/services/supabaseService';

const { width, height } = Dimensions.get('window');

const COLORS = {
    primary: '#00C853', // Delivery Green
    secondary: '#FF6B00',
    white: '#FFFFFF',
    black: '#1A1A2E',
    gray50: '#FAFAFA',
    gray100: '#F5F5F5',
    gray600: '#757575',
};

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in metres
};

const translateInstruction = (step: any) => {
    const type = step.maneuver.type;
    const modifier = step.maneuver.modifier;
    const name = step.name || "la rue";

    let action = "Continuez";
    if (type === 'turn') {
        if (modifier === 'right') action = "Tournez à droite";
        if (modifier === 'left') action = "Tournez à gauche";
        if (modifier === 'slight right') action = "Serrez à droite";
        if (modifier === 'slight left') action = "Serrez à gauche";
    } else if (type === 'arrive') {
        return "Vous êtes arrivé à destination.";
    } else if (type === 'depart') {
        action = "Démarrez";
    }

    return `${action} sur ${name}`;
};

export default function DeliveryNavigationScreen() {
    const params = useLocalSearchParams();
    const destination = params.destination as string || 'Adresse de livraison';
    const clientName = params.client as string || 'Client TransiGo';
    const isPickup = params.type === 'pickup';

    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [allSteps, setAllSteps] = useState<RouteStep[]>([]);
    const [routeCoords, setRouteCoords] = useState<{ lat: number; lng: number }[]>([]);
    const [eta, setEta] = useState(isPickup ? 5 : 15);
    const [distanceRemaining, setDistanceRemaining] = useState(isPickup ? 1.2 : 4.5);
    const [driverLocation, setDriverLocation] = useState({ lat: 5.3499, lng: -4.0166 });
    const [destCoords] = useState({
        lat: parseFloat(params.lat as string) || 5.3600,
        lng: parseFloat(params.lng as string) || -4.0140
    });

    const lastSpokenStep = useRef(-1);

    // Initialisation : Permissions et Itinéraire initial
    useEffect(() => {
        const startMessage = isPickup
            ? "Navigation vers le point de collecte démarrée."
            : "Navigation vers le client démarrée. Livrez le colis en toute sécurité.";
        speakInstruction(startMessage);

        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert("Permission refusée", "L'accès à la localisation est nécessaire pour la navigation.");
                return;
            }

            const initialLoc = await Location.getCurrentPositionAsync({});
            setDriverLocation({ lat: initialLoc.coords.latitude, lng: initialLoc.coords.longitude });

            // Calcul de l'itinéraire
            const route = await locationService.getRoute(
                initialLoc.coords.latitude, initialLoc.coords.longitude,
                destCoords.lat, destCoords.lng
            );

            if (route) {
                setRouteCoords(route.coordinates.map(c => ({ lat: c.latitude, lng: c.longitude })));
                setAllSteps(route.steps || []);
                setDistanceRemaining(route.distance);
                setEta(route.duration);
            }
        })();
    }, [isPickup]);

    // Tracking GPS réel
    useEffect(() => {
        let subscription: any;

        (async () => {
            subscription = await Location.watchPositionAsync(
                { accuracy: Location.Accuracy.High, distanceInterval: 10, timeInterval: 3000 },
                async (location) => {
                    const { latitude, longitude } = location.coords;
                    setDriverLocation({ lat: latitude, lng: longitude });

                    // Mettre à jour la location dans Supabase
                    try {
                        const driverId = useDriverStore.getState().driver?.id;
                        if (driverId) {
                            await driverService.updateLocation(driverId, latitude, longitude);
                        }
                    } catch (err) {
                        console.error("Erreur update location:", err);
                    }

                    // Mettre à jour la distance restante
                    const distToDest = getDistance(latitude, longitude, destCoords.lat, destCoords.lng);
                    setDistanceRemaining(distToDest / 1000);

                    // Logic de guidance vocale
                    if (allSteps.length > 0) {
                        let nextStepIndex = currentStepIndex;
                        const currentStep = allSteps[nextStepIndex];

                        if (currentStep) {
                            const distToStep = getDistance(
                                latitude, longitude,
                                currentStep.maneuver.location[1],
                                currentStep.maneuver.location[0]
                            );

                            if (distToStep < 20 && nextStepIndex < allSteps.length - 1) {
                                nextStepIndex++;
                                setCurrentStepIndex(nextStepIndex);
                            }

                            if (distToStep < 100 && lastSpokenStep.current !== nextStepIndex) {
                                speakInstruction(translateInstruction(allSteps[nextStepIndex]));
                                lastSpokenStep.current = nextStepIndex;
                            }
                        }
                    }
                }
            );
        })();

        return () => subscription?.remove();
    }, [allSteps, currentStepIndex]);

    const speakInstruction = (text: string) => {
        Speech.speak(text, { language: 'fr-FR', rate: 0.9 });
    };

    const openExternalMap = () => {
        const latLng = `${destCoords.lat},${destCoords.lng}`;
        const url = Platform.select({
            ios: `maps://?daddr=${latLng}`,
            android: `google.navigation:q=${latLng}`
        });
        if (url) Linking.openURL(url);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.mapContainer}>
                <OSMMap
                    center={driverLocation}
                    zoom={16}
                    route={routeCoords.length > 0 ? { coordinates: routeCoords } : undefined}
                    markers={[
                        { id: 'me', lat: driverLocation.lat, lng: driverLocation.lng, type: 'driver', label: 'Moi' },
                        {
                            id: 'dest',
                            lat: destCoords.lat,
                            lng: destCoords.lng,
                            type: isPickup ? 'pickup' : 'dropoff',
                            label: isPickup ? 'Restaurant' : 'Client'
                        }
                    ]}
                />

                <View style={styles.headerOverlay}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                        <Text style={{ fontSize: 24, color: COLORS.black }}>❌</Text>
                    </TouchableOpacity>
                    <View style={styles.headerInfo}>
                        <Text style={styles.headerTitle}>
                            {isPickup ? '📦 Collecte Colis' : '🏠 Livraison Client'}
                        </Text>
                    </View>
                </View>
            </View>

            <View style={styles.navPanel}>
                <LinearGradient colors={[COLORS.primary, '#00A344']} style={styles.currentInstruction}>
                    <View style={styles.instructionIcon}>
                        <Text style={{ fontSize: 36, color: COLORS.white }}>
                            {allSteps[currentStepIndex]?.maneuver?.type?.includes('turn') ? "➡️" : (isPickup ? "📦" : "👤")}
                        </Text>
                    </View>
                    <View style={styles.instructionContent}>
                        <Text style={styles.instructionDistance}>
                            {allSteps[currentStepIndex] ? `${Math.round(allSteps[currentStepIndex].distance)} m` : '--'}
                        </Text>
                        <Text style={styles.instructionText}>
                            {allSteps[currentStepIndex] ? translateInstruction(allSteps[currentStepIndex]) : 'Calcul de l\'itinéraire...'}
                        </Text>
                    </View>
                </LinearGradient>

                <View style={styles.destinationCard}>
                    <View style={styles.etaSection}>
                        <Text style={styles.etaValue}>{Math.ceil(eta)}</Text>
                        <Text style={styles.etaLabel}>min</Text>
                    </View>
                    <View style={styles.destinationInfo}>
                        <Text style={styles.destinationLabel}>
                            {isPickup ? 'POINT DE COLLECTE' : 'DESTINATION CLIENT'}
                        </Text>
                        <Text style={styles.destinationAddress} numberOfLines={1}>{destination}</Text>
                        <Text style={styles.clientLabel}>👤 {clientName}</Text>
                    </View>
                    <View style={styles.distanceSection}>
                        <Text style={styles.distanceValue}>{distanceRemaining.toFixed(1)}</Text>
                        <Text style={styles.distanceLabel}>km</Text>
                    </View>
                </View>

                <View style={styles.actionsRow}>
                    <TouchableOpacity style={styles.actionBtn} onPress={openExternalMap}>
                        <View style={[styles.actionIcon, { backgroundColor: '#E8F5E9' }]}>
                            <Text style={{ fontSize: 22 }}>🗺️</Text>
                        </View>
                        <Text style={styles.actionLabel}>GPS Externe</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert('Appel client', 'Contact du client : 07 00 00 00 00')}>
                        <View style={[styles.actionIcon, { backgroundColor: '#E3F2FD' }]}>
                            <Text style={{ fontSize: 22 }}>📞</Text>
                        </View>
                        <Text style={styles.actionLabel}>Appeler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: isPickup ? COLORS.primary : '#2196F3' }]} onPress={() => router.back()}>
                        <Text style={styles.confirmBtnText}>
                            {isPickup ? 'Colis récupéré' : 'Livré au client'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.gray50 },
    mapContainer: { flex: 1 },
    headerOverlay: {
        position: 'absolute',
        top: 50,
        left: 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
    },
    headerInfo: { flex: 1, marginLeft: 12 },
    headerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.black,
        backgroundColor: 'rgba(255,255,255,0.9)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        textAlign: 'center'
    },
    navPanel: {
        height: 280,
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 16,
        paddingBottom: 20,
        elevation: 10,
    },
    currentInstruction: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginTop: -30,
        marginBottom: 10,
        elevation: 8,
    },
    instructionIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    instructionContent: { flex: 1, marginLeft: 16 },
    instructionDistance: { fontSize: 28, fontWeight: 'bold', color: COLORS.white },
    instructionText: { fontSize: 16, color: COLORS.white, fontWeight: '500' },
    destinationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    etaSection: { alignItems: 'center', width: 60 },
    etaValue: { fontSize: 24, fontWeight: 'bold', color: COLORS.primary },
    etaLabel: { fontSize: 12, color: COLORS.gray600 },
    destinationInfo: { flex: 1, marginHorizontal: 16 },
    destinationLabel: { fontSize: 11, color: COLORS.gray600, fontWeight: 'bold' },
    destinationAddress: { fontSize: 14, fontWeight: '600', color: COLORS.black, marginTop: 2 },
    clientLabel: { fontSize: 12, color: COLORS.primary, marginTop: 4 },
    distanceSection: { alignItems: 'center', width: 60 },
    distanceValue: { fontSize: 20, fontWeight: 'bold', color: COLORS.black },
    distanceLabel: { fontSize: 12, color: COLORS.gray600 },
    actionsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 15, gap: 12 },
    actionBtn: { alignItems: 'center' },
    actionIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    actionLabel: { fontSize: 10, color: COLORS.gray600 },
    confirmBtn: {
        flex: 1,
        height: 54,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmBtnText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
});
