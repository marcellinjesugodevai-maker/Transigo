// =============================================
// TRANSIGO DRIVER - NAVIGATION GPS
// Itinéraire vers passager ou destination
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
import * as Speech from 'expo-speech';
import * as Location from 'expo-location';
import { useDriverStore } from '../src/stores/driverStore';
import { driverService } from '../src/services/supabaseService';
import OSMMap from '../src/components/OSMMap';

const { width, height } = Dimensions.get('window');

const COLORS = {
    primary: '#FF6B00',
    secondary: '#00C853',
    secondaryDark: '#00A344',
    white: '#FFFFFF',
    black: '#1A1A2E',
    gray50: '#FAFAFA',
    gray100: '#F5F5F5',
    gray600: '#757575',
};

const NAVIGATION_STEPS = [
    { id: '1', instruction: 'Démarrez vers le Nord', distance: '50 m', icon: '🧭', lat: 5.3499, lng: -4.0166, locationName: 'Cocody Centre' },
    { id: '2', instruction: 'Continuez tout droit sur 200m', distance: '200 m', icon: '⬆️', lat: 5.3520, lng: -4.0160, locationName: 'Rue des Jardins' },
    { id: '3', instruction: 'Tournez à droite sur Blvd Latrille', distance: '500 m', icon: '➡️', lat: 5.3550, lng: -4.0150, locationName: 'Boulevard Latrille' },
    { id: '4', instruction: 'Continuez sur Blvd Latrille', distance: '1.2 km', icon: '⬆️', lat: 5.3600, lng: -4.0140, locationName: 'Carrefour de la Vie' },
    { id: '5', instruction: 'Tournez à gauche', distance: '100 m', icon: '⬅️', lat: 5.3650, lng: -4.0130, locationName: 'Abidjan Mall' },
    { id: '6', instruction: 'Votre destination est sur la droite', distance: '0 m', icon: '🏁', lat: 5.3700, lng: -4.0120, locationName: 'Destination Finale' },
];

export default function DriverNavigationScreen() {
    const params = useLocalSearchParams();
    const destination = params.destination as string || 'Cocody Riviera 2';
    const passengerName = params.passenger as string || 'Kofi Asante';
    const isPickup = params.type === 'pickup';

    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [eta, setEta] = useState(8);
    const [distance, setDistance] = useState(2.5);

    const [driverLocation, setDriverLocation] = useState({ lat: 5.3499, lng: -4.0166 });
    const locationSubscription = useRef<any>(null);

    // Initialisation du tracking réel
    useEffect(() => {
        let subscription: any;

        const startTracking = async () => {
            // Demander la permission
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission refusée', 'La géolocalisation est requise pour naviguer.');
                return;
            }

            // Démarrer le suivi GPS réel
            subscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    timeInterval: 3000, // Mise à jour toutes les 3s
                    distanceInterval: 10, // ou tous les 10m
                },
                async (location) => {
                    const { latitude, longitude } = location.coords;

                    // Mise à jour locale
                    setDriverLocation({ lat: latitude, lng: longitude });

                    // Mise à jour Supabase (pour le passager)
                    // On suppose qu'on a l'ID du chauffeur dans le store ou context
                    // Ici on utilise un mock ID ou celui du store si disponible
                    try {
                        const driverId = (await import('../src/stores/driverStore')).useDriverStore.getState().driver?.id;
                        if (driverId) {
                            await (await import('../src/services/supabaseService')).driverService.updateLocation(driverId, latitude, longitude);
                        }
                    } catch (err) {
                        console.error("Erreur update location:", err);
                    }
                }
            );
            locationSubscription.current = subscription;
        };

        startTracking();

        // Annoncer le début du trajet
        const startMessage = isPickup
            ? "Navigation vers le passager démarrée."
            : "Course démarrée. Navigation vers la destination.";
        speakInstruction(startMessage);

        return () => {
            if (locationSubscription.current) {
                locationSubscription.current.remove();
            }
        };
    }, [isPickup]);

    const speakInstruction = (text: string) => {
        // Optionnel : ne parler que si nécessaire ou via Google Maps
        // Speech.speak(text, { language: 'fr-FR', rate: 0.9, pitch: 1.0 });
    };

    const openExternalMap = () => {
        // Coordonnées de destination (simulées ici, devraient venir du vrai point de dropoff)
        const lat = 5.3700;
        const lng = -4.0120;
        const label = isPickup ? "Passager" : "Destination";

        const latLng = `${lat},${lng}`;

        // Url spécifique pour lancer la navigation
        const url = Platform.select({
            ios: `comgooglemaps://?daddr=${latLng}&directionsmode=driving`,
            android: `google.navigation:q=${latLng}`
        });

        if (url) {
            Linking.canOpenURL(url).then(supported => {
                if (supported) {
                    Linking.openURL(url);
                } else {
                    // Fallback: Si Google Maps n'est pas installé sur iOS, utiliser Apple Maps
                    if (Platform.OS === 'ios') {
                        Linking.openURL(`maps://?daddr=${latLng}`);
                    } else {
                        // Fallback browser
                        Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${latLng}`);
                    }
                }
            }).catch(err => console.error('An error occurred', err));
        }
    };

    const currentStep = NAVIGATION_STEPS[currentStepIndex];
    const nextStep = NAVIGATION_STEPS[currentStepIndex + 1];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Carte OSM Réelle */}
            <View style={styles.mapContainer}>
                <OSMMap
                    center={driverLocation}
                    zoom={16}
                    markers={[
                        { id: 'driver', lat: driverLocation.lat, lng: driverLocation.lng, type: 'driver', label: 'Vous' },
                        {
                            id: 'dest',
                            lat: 5.3700,
                            lng: -4.0120,
                            type: isPickup ? 'pickup' : 'dropoff',
                            label: isPickup ? 'Passager' : 'Destination'
                        }
                    ]}
                    route={{
                        coordinates: NAVIGATION_STEPS.map(s => ({ lat: s.lat, lng: s.lng })),
                        color: isPickup ? COLORS.primary : COLORS.secondary
                    }}
                />

                {/* Header overlay */}
                <View style={styles.headerOverlay}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                        <Text style={{ fontSize: 24, color: COLORS.black }}>⬅️</Text>
                    </TouchableOpacity>
                    <View style={styles.headerInfo}>
                        <Text style={styles.headerTitle}>
                            {isPickup ? '🚗 Vers passager' : '📍 Vers destination'}
                        </Text>
                    </View>
                    <TouchableOpacity style={styles.menuBtn} onPress={() => speakInstruction(currentStep.instruction)}>
                        <Text style={{ fontSize: 22, color: COLORS.black }}>🔊</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Navigation panel */}
            <View style={styles.navPanel}>
                {/* Current instruction */}
                <LinearGradient colors={[COLORS.secondary, COLORS.secondaryDark]} style={styles.currentInstruction}>
                    <View style={styles.instructionIcon}>
                        <Text style={{ fontSize: 36, color: COLORS.white }}>{currentStep.icon}</Text>
                    </View>
                    <View style={styles.instructionContent}>
                        <Text style={styles.instructionDistance}>{currentStep.distance}</Text>
                        <Text style={styles.instructionText}>{currentStep.instruction}</Text>
                    </View>
                </LinearGradient>

                {/* Next instruction */}
                {nextStep && (
                    <View style={styles.nextInstruction}>
                        <View style={styles.nextIcon}>
                            <Text style={{ fontSize: 16 }}>{nextStep.icon}</Text>
                        </View>
                        <Text style={styles.nextText}>Ensuite: {nextStep.instruction}</Text>
                        <Text style={styles.nextDistance}>{nextStep.distance}</Text>
                    </View>
                )}

                {/* ETA and destination */}
                <View style={styles.destinationCard}>
                    <View style={styles.etaSection}>
                        <Text style={styles.etaValue}>{Math.ceil(eta)}</Text>
                        <Text style={styles.etaLabel}>min</Text>
                    </View>
                    <View style={styles.destinationInfo}>
                        <Text style={styles.destinationLabel}>
                            {isPickup ? 'Prise en charge' : 'Destination'}
                        </Text>
                        <Text style={styles.destinationAddress} numberOfLines={1}>{destination}</Text>
                        {isPickup && <Text style={styles.passengerLabel}>👤 {passengerName}</Text>}
                    </View>
                    <View style={styles.distanceSection}>
                        <Text style={styles.distanceValue}>{distance.toFixed(1)}</Text>
                        <Text style={styles.distanceLabel}>km</Text>
                    </View>
                </View>

                {/* Actions */}
                <View style={styles.actionsRow}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => router.push(`/driver-chat?name=${passengerName}`)}>
                        <View style={[styles.actionIcon, { backgroundColor: '#E3F2FD' }]}>
                            <Text style={{ fontSize: 22 }}>💬</Text>
                        </View>
                        <Text style={styles.actionLabel}>Chat</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert('Appel', 'Numérotation en cours...')}>
                        <View style={[styles.actionIcon, { backgroundColor: '#E8F5E9' }]}>
                            <Text style={{ fontSize: 22 }}>📞</Text>
                        </View>
                        <Text style={styles.actionLabel}>Appeler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={openExternalMap}>
                        <View style={[styles.actionIcon, { backgroundColor: '#FFF3E0' }]}>
                            <Text style={{ fontSize: 22 }}>🗺️</Text>
                        </View>
                        <Text style={styles.actionLabel}>Google Maps</Text>
                    </TouchableOpacity>
                    {isPickup ? (
                        <TouchableOpacity style={styles.actionBtn} onPress={() => router.replace('/ride-boarding')}>
                            <View style={[styles.actionIcon, { backgroundColor: '#E8F5E9' }]}>
                                <Text style={{ fontSize: 22 }}>🚶</Text>
                            </View>
                            <Text style={styles.actionLabel}>Arrivé (Boarding)</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={styles.actionBtn} onPress={() => router.replace('/ride-payment')}>
                            <View style={[styles.actionIcon, { backgroundColor: '#E8F5E9' }]}>
                                <Text style={{ fontSize: 22 }}>🏁</Text>
                            </View>
                            <Text style={styles.actionLabel}>Terminer</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.gray50 },

    // Map
    mapContainer: { flex: 1 },

    // Header overlay
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
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3.84,
        elevation: 5,
    },
    headerInfo: { flex: 1, marginLeft: 12 },
    headerTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.black, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, overflow: 'hidden', textAlign: 'center' },
    menuBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3.84,
        elevation: 5,
    },

    // Navigation panel
    navPanel: {
        height: 320,
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 16,
        paddingTop: 0,
        paddingBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 10,
    },

    // Current instruction
    currentInstruction: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginTop: -30,
        marginBottom: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
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
    instructionText: { fontSize: 16, color: COLORS.white, marginTop: 2, fontWeight: '500' },

    // Next instruction
    nextInstruction: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray100,
    },
    nextIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.gray100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    nextText: { flex: 1, fontSize: 13, color: COLORS.gray600, marginLeft: 12 },
    nextDistance: { fontSize: 13, fontWeight: '600', color: COLORS.black },

    // Destination card
    destinationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    etaSection: { alignItems: 'center', width: 60 },
    etaValue: { fontSize: 24, fontWeight: 'bold', color: COLORS.secondary },
    etaLabel: { fontSize: 12, color: COLORS.gray600 },
    destinationInfo: { flex: 1, marginHorizontal: 16 },
    destinationLabel: { fontSize: 11, color: COLORS.gray600 },
    destinationAddress: { fontSize: 14, fontWeight: '600', color: COLORS.black, marginTop: 2 },
    passengerLabel: { fontSize: 12, color: COLORS.primary, marginTop: 4 },
    distanceSection: { alignItems: 'center', width: 60 },
    distanceValue: { fontSize: 20, fontWeight: 'bold', color: COLORS.black },
    distanceLabel: { fontSize: 12, color: COLORS.gray600 },

    // Actions
    actionsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 },
    actionBtn: { alignItems: 'center' },
    actionIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    actionLabel: { fontSize: 11, color: COLORS.gray600 },
});

