// =============================================
// TRANSIGO - BOOKING SCREEN (NOUVELLE MAQUETTE)
// =============================================

import { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Image,
    Platform,
    Modal,
    TextInput,
    KeyboardAvoidingView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@/components/Icon';
import OSMMap from '@/components/OSMMap';
import { COLORS, SPACING, RADIUS } from '@/constants';
import { useRideStore, useLanguageStore, useThemeStore, calculatePrice } from '@/stores';
import { getTranslation } from '@/i18n/translations';
import { locationService } from '@/services/locationService';
import { useEffect, useRef } from 'react';

const { width, height } = Dimensions.get('window');

// Types de véhicules TransiGo
const SUPABASE_STORAGE = 'https://zndgvloyaitopczhjddq.supabase.co/storage/v1/object/public/app-assets';

const VEHICLE_TYPES = [
    {
        id: 'standard',
        name: 'Standard',
        description: 'Économique',
        capacity: '4 places',
        duration: '3 min',
        isTop: true,
        image: { uri: `${SUPABASE_STORAGE}/standard.png` },
        cardColor: '#4A90E2', // Blue
        textColor: '#FFFFFF',
        badge: 'Eco',
    },
    {
        id: 'comfort',
        name: 'Confort',
        description: 'Berline climatisée',
        capacity: '4 places • AC',
        duration: '5 min',
        isTop: false,
        image: { uri: `${SUPABASE_STORAGE}/comfort.png` },
        cardColor: '#5C6BC0', // Indigo
        textColor: '#FFFFFF',
        badge: 'Confort',
    },
    {
        id: 'luxury',
        name: 'Luxe',
        description: 'Premium VIP',
        capacity: '4 places • VIP',
        duration: '10 min',
        isTop: false,
        image: { uri: `${SUPABASE_STORAGE}/luxury.png` },
        cardColor: '#263238', // Dark Blue Grey
        textColor: '#FFFFFF',
        badge: 'Premium',
    },
    {
        id: 'family',
        name: 'Famille',
        description: 'Van 6+ places',
        capacity: '6 places',
        duration: '12 min',
        isTop: false,
        image: { uri: `${SUPABASE_STORAGE}/family.png` },
        cardColor: '#3949AB', // Dark Indigo
        textColor: '#FFFFFF',
        badge: 'Van',
    },
];

// Helper pour trouver le véhicule par type
const findVehicleByType = (type: string | undefined) => {
    if (!type) return VEHICLE_TYPES[0];
    const found = VEHICLE_TYPES.find(v => v.id === type);
    return found || VEHICLE_TYPES[0];
};

// Helper pour calculer la distance (Utilisé pour le prix si OSRM échoue)

export default function BookingScreen() {
    const params = useLocalSearchParams();
    const { pickup, dropoff } = useRideStore();

    const { language } = useLanguageStore();
    const { isDark, colors } = useThemeStore();
    const t = (key: any) => getTranslation(key, language);
    // const mapRef = useRef<any>(null); // Désactivé pour OSMMap

    // Coordonnées pour la démo ou via params
    const pickupCoords = params.src_lat
        ? { latitude: Number(params.src_lat), longitude: Number(params.src_lon) }
        : { latitude: 5.3599, longitude: -3.9870 }; // Abidjan Mall par défaut

    const dropoffCoords = params.dest_lat
        ? { latitude: Number(params.dest_lat), longitude: Number(params.dest_lon) }
        : { latitude: 5.2539, longitude: -3.9263 }; // Aéroport

    const [routeCoords, setRouteCoords] = useState<{ latitude: number, longitude: number }[]>([]);
    const [distance, setDistance] = useState(params.distance ? Number(params.distance) : 0);
    const [eta, setEta] = useState(params.duration ? Math.round(Number(params.duration)) : 0);

    const [selectedVehicle, setSelectedVehicle] = useState(() => findVehicleByType(params.vehicleType as string));
    const [womenMode, setWomenMode] = useState(false);
    const [sharedRide, setSharedRide] = useState(false);
    const [stops, setStops] = useState<{ address: string, latitude: number, longitude: number }[]>([]);
    const [showStopModal, setShowStopModal] = useState(false);
    const [newStopAddress, setNewStopAddress] = useState('');
    const [showPriceDetails, setShowPriceDetails] = useState(false);

    // États négociation
    const [showNegotiationModal, setShowNegotiationModal] = useState(false);
    const [proposedPrice, setProposedPrice] = useState('');
    const [isNegotiating, setIsNegotiating] = useState(false);
    const [negotiationMessage, setNegotiationMessage] = useState('');

    useEffect(() => {
        const fetchRoute = async () => {
            const route = await locationService.getRoute(
                pickupCoords.latitude, pickupCoords.longitude,
                dropoffCoords.latitude, dropoffCoords.longitude
            );
            if (route) {
                setRouteCoords(route.coordinates);
                setDistance(route.distance);
                setEta(Math.round(route.duration / 60));
            }
        };
        fetchRoute();
    }, []);

    const mapRegion = {
        latitude: (pickupCoords.latitude + dropoffCoords.latitude) / 2,
        longitude: (pickupCoords.longitude + dropoffCoords.longitude) / 2,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
    };

    // Calcul du prix final
    const getFinalPrice = () => {
        let price = calculatePrice(distance, eta, selectedVehicle.id as any);
        if (sharedRide) price = price * 0.3; // -70% trajets partagés
        return Math.round(price);
    };

    const handleConfirmRide = () => {
        // Sauvegarder les données dans le store
        const { setPickup, setDropoff, setEstimates, setRouteCoordinates, setSelectedVehicle } = useRideStore.getState();

        // Prix Brut (Base) vs Prix Final (Net)
        const grossPrice = calculatePrice(distance, eta, selectedVehicle.id as any);
        const finalPrice = getFinalPrice();

        // Si l'utilisateur négocie, on utilise son prix proposé
        const displayPrice = isNegotiating && proposedPrice ? Number(proposedPrice) : finalPrice;

        setPickup(pickupCoords as any, params.src_name as string || 'Ma position');
        setDropoff(dropoffCoords as any, params.dest_name as string || 'Destination');
        setEstimates(displayPrice, eta, distance);
        setRouteCoordinates(routeCoords);
        useRideStore.getState().clearStops();
        stops.forEach(s => useRideStore.getState().addStop(s));
        useRideStore.getState().setWomenSafetyMode(womenMode);

        // Navigation vers écran de recherche de chauffeur
        router.push({
            pathname: '/finding-driver',
            params: {
                pickup_lat: pickupCoords.latitude,
                pickup_lon: pickupCoords.longitude,
                pickup_address: params.src_name || 'Ma position',
                dest_lat: dropoffCoords.latitude,
                dest_lon: dropoffCoords.longitude,
                dest_address: params.dest_name || 'Destination',
                distance: distance.toFixed(1),
                duration: eta.toString(),
                price: displayPrice.toString(), // Prix affiché (négocié ou normal)
                gross_price: grossPrice.toString(), // Prix de base
                is_negotiated: isNegotiating ? 'true' : 'false',
                negotiated_price: isNegotiating ? proposedPrice : '',
                stops: JSON.stringify(stops)
            }
        });
    };

    const isMoto = selectedVehicle.id === 'moto';

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Carte avec itinéraire OSM */}
            <OSMMap
                style={styles.map}
                initialRegion={mapRegion}
                routeCoordinates={routeCoords}
                markers={[
                    { id: 'pickup', latitude: pickupCoords.latitude, longitude: pickupCoords.longitude },
                    { id: 'dropoff', latitude: dropoffCoords.latitude, longitude: dropoffCoords.longitude },
                ]}
            />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={[styles.backButton, { backgroundColor: colors.card }]}
                    onPress={() => router.back()}
                    activeOpacity={0.8}
                >
                    <Icon name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>

                <Text style={[styles.title, { color: colors.text }]}>
                    {language === 'fr' ? 'Confirmer la course' : 'Confirm ride'}
                </Text>
            </View>

            {/* Panneau inférieur */}
            <View style={[styles.bottomSheet, { backgroundColor: colors.card }]}>
                {/* Handle */}
                <View style={[styles.handle, { backgroundColor: isDark ? '#333' : '#E0E0E0' }]} />

                {/* Contenu scrollable */}
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.bottomSheetScroll}
                    nestedScrollEnabled={true}
                >
                    {/* Adresses */}
                    <View style={styles.addressesContainer}>
                        {/* Infos Trajet Dynamiques */}
                        <View style={styles.tripQuickInfo}>
                            <View style={styles.tripInfoRow}>
                                <Icon name="resize" size={16} color={colors.textSecondary} style={{ marginRight: 4 }} />
                                <Text style={[styles.tripInfoText, { color: colors.textSecondary }]}>
                                    {distance.toFixed(1)} km  •
                                </Text>
                                <Icon name="time" size={16} color={colors.textSecondary} style={{ marginLeft: 8, marginRight: 4 }} />
                                <Text style={[styles.tripInfoText, { color: colors.textSecondary }]}>
                                    {eta} min
                                </Text>
                            </View>
                        </View>

                        {/* Départ */}
                        <View style={styles.addressRow}>
                            <View style={styles.dotGreen} />
                            <View style={styles.addressInfo}>
                                <Text style={[styles.addressLabel, { color: colors.textSecondary }]}>{t('pickup')}</Text>
                                <Text style={[styles.addressText, { color: colors.text }]}>
                                    {params.src_name || (pickup as any)?.name || (typeof pickup === 'string' ? pickup : 'Ma position')}
                                </Text>
                            </View>
                        </View>

                        {/* Ligne de connexion */}
                        <View style={styles.connectionLine} />

                        {/* Destination */}
                        <View style={styles.addressRow}>
                            <View style={styles.dotOrange} />
                            <View style={styles.addressInfo}>
                                <Text style={[styles.addressLabel, { color: colors.textSecondary }]}>{t('dropoff')}</Text>
                                <Text style={[styles.addressText, { color: colors.text }]}>
                                    {params.dest_name || 'Aéroport Félix Houphouët-Boigny'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Titre section véhicules */}
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        {language === 'fr' ? 'Choisir un véhicule' : 'Select vehicle'}
                    </Text>

                    {/* Carousel de véhicules */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.vehiclesScroll}
                        style={styles.vehiclesContainer}
                    >
                        {VEHICLE_TYPES.map((vehicle) => {
                            const isSelected = selectedVehicle.id === vehicle.id;
                            // Calcul du prix dynamique
                            const dynamicPrice = calculatePrice(distance, eta, vehicle.id as any);
                            const formattedPrice = new Intl.NumberFormat('fr-FR').format(dynamicPrice) + ' F';

                            return (
                                <TouchableOpacity
                                    key={vehicle.id}
                                    style={[
                                        styles.vehicleCard,
                                        { backgroundColor: vehicle.cardColor || colors.card },
                                        isSelected && styles.vehicleCardSelected
                                    ]}
                                    onPress={() => setSelectedVehicle(vehicle)}
                                    activeOpacity={0.9}
                                >
                                    {/* Badge Top (Optionnel, caché pour ce design propre) */}
                                    {/* {vehicle.isTop && ( ... )} */}

                                    {/* Nom du véhicule (Centré en haut) */}
                                    <Text style={[styles.vehicleName, { color: vehicle.textColor || colors.text, textAlign: 'center', marginTop: 8 }]}>
                                        {vehicle.name}
                                    </Text>

                                    {/* Image du véhicule */}
                                    <View style={styles.vehicleImageContainer}>
                                        <Image
                                            source={vehicle.image}
                                            style={styles.vehicleImage}
                                            resizeMode="contain"
                                        />
                                    </View>

                                    {/* Prix Dynamique (AJOUTÉ) */}
                                    <Text style={[styles.vehiclePrice, { color: vehicle.textColor || colors.primary, textAlign: 'center', fontSize: 16, fontWeight: 'bold' }]}>
                                        {formattedPrice}
                                    </Text>

                                    {/* Badge du bas */}
                                    <View style={{
                                        alignSelf: 'center',
                                        backgroundColor: '#FFF',
                                        paddingHorizontal: 12,
                                        paddingVertical: 4,
                                        borderRadius: 12,
                                        marginTop: 'auto',
                                        marginBottom: 8
                                    }}>
                                        <Text style={{
                                            fontSize: 10,
                                            fontWeight: 'bold',
                                            color: vehicle.cardColor
                                        }}>
                                            {vehicle.badge || vehicle.name}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    {/* Options avancées */}
                    <View style={styles.optionsContainer}>
                        {/* Mode Women */}
                        <TouchableOpacity
                            style={[styles.optionRow, { backgroundColor: isDark ? colors.card : colors.background }]}
                            onPress={() => setWomenMode(!womenMode)}
                            activeOpacity={0.8}
                        >
                            <View style={styles.optionLeft}>
                                <View style={[styles.optionIconContainer, { backgroundColor: '#FF6B9D20' }]}>
                                    <Icon name="woman" size={20} color="#FF6B9D" />
                                </View>
                                <View>
                                    <Text style={[styles.optionTitle, { color: colors.text }]}>{t('womenMode')}</Text>
                                    <Text style={[styles.optionSubtitle, { color: colors.textSecondary }]}>{t('womenModeSubtitle')}</Text>
                                </View>
                            </View>
                            <View style={[styles.checkbox, { borderColor: colors.textSecondary }, womenMode && [styles.checkboxActive, { backgroundColor: COLORS.primary, borderColor: COLORS.primary }]]}>
                                {womenMode && <Icon name="checkmark" size={14} color={COLORS.white} />}
                            </View>
                        </TouchableOpacity>

                        {/* Trajets Partagés - Masqué si Moto */}
                        {!isMoto && (
                            <TouchableOpacity
                                style={[styles.optionRow, { backgroundColor: isDark ? colors.card : colors.background }]}
                                onPress={() => router.push({
                                    pathname: '/carpool',
                                    params: {
                                        dest_lat: dropoffCoords.latitude,
                                        dest_lon: dropoffCoords.longitude,
                                        dest_address: params.dest_name || 'Destination',
                                        pickup_lat: pickupCoords.latitude,
                                        pickup_lon: pickupCoords.longitude,
                                        pickup_address: params.src_name || 'Ma position',
                                    }
                                })}
                                activeOpacity={0.8}
                            >
                                <View style={styles.optionLeft}>
                                    <View style={[styles.optionIconContainer, { backgroundColor: '#4CAF5020' }]}>
                                        <Icon name="people" size={20} color="#4CAF50" />
                                    </View>
                                    <View>
                                        <Text style={[styles.optionTitle, { color: colors.text }]}>Covoiturage</Text>
                                        <Text style={[styles.optionSubtitle, { color: colors.textSecondary }]}>Voir les courses disponibles</Text>
                                    </View>
                                </View>
                                <View style={styles.carpoolBadge}>
                                    <Text style={styles.carpoolBadgeText}>-75%</Text>
                                </View>
                            </TouchableOpacity>
                        )}

                        {/* Points d'arrêt - Uniquement si Moto */}
                        {isMoto && (
                            <View style={styles.stopsSection}>
                                <TouchableOpacity
                                    style={[styles.addStopButton, { backgroundColor: isDark ? colors.card : colors.background }]}
                                    onPress={() => setShowStopModal(true)}
                                >
                                    <View style={styles.optionLeft}>
                                        <View style={[styles.optionIconContainer, { backgroundColor: COLORS.primary + '20' }]}>
                                            <Icon name="add" size={20} color={COLORS.primary} />
                                        </View>
                                        <Text style={[styles.optionTitle, { color: colors.text }]}>Ajouter un arrêt</Text>
                                    </View>
                                </TouchableOpacity>

                                {stops.map((stop, index) => (
                                    <View key={index} style={styles.stopItem}>
                                        <Icon name="location-on" size={16} color={COLORS.primary} />
                                        <Text style={[styles.stopText, { color: colors.text }]} numberOfLines={1}>
                                            {stop.address}
                                        </Text>
                                        <TouchableOpacity onPress={() => setStops(prev => prev.filter((_, i) => i !== index))}>
                                            <Icon name="close" size={16} color={colors.textSecondary} />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Transparence Prix */}
                        <TouchableOpacity
                            style={[styles.priceDetailsButton, { backgroundColor: isDark ? colors.primary + '20' : '#FFF4E6' }]}
                            onPress={() => setShowPriceDetails(!showPriceDetails)}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.priceDetailsText, { color: colors.text }]}>
                                {language === 'fr' ? 'Prix final' : 'Final price'}: {getFinalPrice().toLocaleString('fr-FR')} FCFA
                            </Text>
                            <Icon name="chevron-down" size={20} color={colors.text} />
                        </TouchableOpacity>

                        {/* Détails du prix */}
                        {showPriceDetails && (
                            <View style={[styles.priceBreakdown, { backgroundColor: isDark ? '#252525' : colors.white }]}>
                                <View style={styles.priceRow}>
                                    <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Prix de base</Text>
                                    <Text style={[styles.priceValue, { color: colors.text }]}>{calculatePrice(distance, eta, selectedVehicle.id as any)} FCFA</Text>
                                </View>
                                {sharedRide && (
                                    <View style={styles.priceRow}>
                                        <Text style={[styles.priceLabel, { color: '#4CAF50' }]}>Trajet partagé (-70%)</Text>
                                        <Text style={[styles.priceValue, { color: '#4CAF50' }]}>-{Math.round(calculatePrice(distance, eta, selectedVehicle.id as any) * 0.7)} FCFA</Text>
                                    </View>
                                )}
                                <View style={[styles.priceDivider, { backgroundColor: isDark ? '#333' : '#F0F0F0' }]} />
                                <View style={styles.priceRow}>
                                    <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Commission TransiGo (12%)</Text>
                                    <Text style={[styles.priceValue, { color: colors.text }]}>{Math.round(getFinalPrice() * 0.12)} FCFA</Text>
                                </View>
                                <View style={styles.priceRow}>
                                    <Text style={[styles.priceLabel, { fontWeight: 'bold', color: colors.text }]}>Part chauffeur</Text>
                                    <Text style={[styles.priceValue, { fontWeight: 'bold', color: COLORS.primary }]}>
                                        {Math.round(getFinalPrice() * 0.88)} FCFA
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Section Négociation de Prix */}
                    <View style={styles.negotiationSection}>
                        <Text style={[styles.negotiationTitle, { color: colors.text }]}>
                            <Icon name="cash" size={20} color={COLORS.primary} /> {language === 'fr' ? 'Négocier le prix' : 'Negotiate price'}
                        </Text>

                        {!isNegotiating ? (
                            <TouchableOpacity
                                style={[styles.negotiateButton, { backgroundColor: isDark ? '#252525' : colors.background }]}
                                onPress={() => setShowNegotiationModal(true)}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.negotiateButtonText, { color: colors.text }]}>
                                    {language === 'fr' ? 'Proposer mon prix' : 'Propose my price'}
                                </Text>
                                <Icon name="create-outline" size={20} color={COLORS.primary} />
                            </TouchableOpacity>
                        ) : (
                            <View style={[styles.proposedPriceContainer, { backgroundColor: '#4CAF5020', borderColor: '#4CAF50' }]}>
                                <Text style={styles.proposedPriceLabel}>
                                    {language === 'fr' ? 'Votre proposition' : 'Your offer'}
                                </Text>
                                <Text style={styles.proposedPriceValue}>
                                    {Number(proposedPrice).toLocaleString('fr-FR')} FCFA
                                </Text>
                                <TouchableOpacity onPress={() => {
                                    setIsNegotiating(false);
                                    setProposedPrice('');
                                }}>
                                    <Text style={styles.changeProposalText}>
                                        {language === 'fr' ? 'Modifier' : 'Change'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </ScrollView>

                {/* Boutons d'action - Fixe en bas */}
                <View style={styles.actionButtonsContainer}>
                    <TouchableOpacity
                        style={styles.commandButton}
                        onPress={handleConfirmRide}
                        activeOpacity={0.9}
                    >
                        <LinearGradient
                            colors={[COLORS.primary, COLORS.primaryDark]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.commandButtonGradient}
                        >
                            <Text style={styles.commandButtonText}>
                                {isNegotiating
                                    ? (language === 'fr' ? `Envoyer offre • ${Number(proposedPrice).toLocaleString('fr-FR')} F` : `Send offer • ${Number(proposedPrice).toLocaleString('fr-FR')} F`)
                                    : (language === 'fr' ? `Commander • ${getFinalPrice().toLocaleString('fr-FR')} F` : `Book • ${getFinalPrice().toLocaleString('fr-FR')} F`)}
                            </Text>
                            <Icon name="arrow-forward" size={20} color={COLORS.white} />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Modal ajout d'arrêt */}
            <Modal visible={showStopModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Ajouter un arrêt</Text>
                        <TextInput
                            style={[styles.customPriceInput, { color: colors.text, borderColor: colors.border, borderWidth: 1 }]}
                            placeholder="Adresse de l'arrêt"
                            placeholderTextColor={colors.textSecondary}
                            value={newStopAddress}
                            onChangeText={setNewStopAddress}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => {
                                    setShowStopModal(false);
                                    setNewStopAddress('');
                                }}
                            >
                                <Text style={{ color: colors.textSecondary }}>Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmButton, { backgroundColor: COLORS.primary }]}
                                onPress={() => {
                                    if (newStopAddress.trim()) {
                                        setStops(prev => [...prev, {
                                            address: newStopAddress,
                                            latitude: pickupCoords.latitude + 0.01,
                                            longitude: pickupCoords.longitude + 0.01
                                        }]);
                                        setNewStopAddress('');
                                        setShowStopModal(false);
                                    }
                                }}
                            >
                                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Ajouter</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Modal de négociation */}
            <Modal
                visible={showNegotiationModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowNegotiationModal(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>
                                {language === 'fr' ? 'Proposer votre prix' : 'Propose your price'}
                            </Text>
                            <TouchableOpacity onPress={() => setShowNegotiationModal(false)}>
                                <Icon name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.recommendedPriceBox}>
                            <Text style={[styles.recommendedLabel, { color: colors.textSecondary }]}>
                                {language === 'fr' ? 'Prix recommandé' : 'Recommended price'}
                            </Text>
                            <Text style={styles.recommendedValue}>
                                {getFinalPrice().toLocaleString('fr-FR')} FCFA
                            </Text>
                        </View>

                        <Text style={[styles.suggestionsLabel, { color: colors.textSecondary }]}>
                            {language === 'fr' ? 'Suggestions' : 'Quick picks'}
                        </Text>
                        <View style={styles.suggestionsRow}>
                            {[-500, -300, 0, +200].map((offset) => {
                                const suggestionPrice = Math.max(500, getFinalPrice() + offset);
                                return (
                                    <TouchableOpacity
                                        key={offset}
                                        style={[
                                            styles.suggestionButton,
                                            { backgroundColor: isDark ? '#252525' : colors.background },
                                            proposedPrice === String(suggestionPrice) && styles.suggestionButtonActive
                                        ]}
                                        onPress={() => setProposedPrice(String(suggestionPrice))}
                                    >
                                        <Text style={[
                                            styles.suggestionText,
                                            { color: offset < 0 ? '#4CAF50' : offset > 0 ? COLORS.primary : colors.text },
                                            proposedPrice === String(suggestionPrice) && { color: COLORS.white }
                                        ]}>
                                            {offset < 0 ? `${offset}` : offset > 0 ? `+${offset}` : '—'}
                                        </Text>
                                        <Text style={[
                                            styles.suggestionPrice,
                                            { color: colors.text },
                                            proposedPrice === String(suggestionPrice) && { color: COLORS.white }
                                        ]}>
                                            {suggestionPrice.toLocaleString('fr-FR')} F
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <Text style={[styles.customPriceLabel, { color: colors.textSecondary }]}>
                            {language === 'fr' ? 'Ou entrez votre prix' : 'Or enter your price'}
                        </Text>
                        <View style={[styles.customPriceInput, { backgroundColor: isDark ? '#252525' : colors.background }]}>
                            <TextInput
                                style={[styles.priceInput, { color: colors.text }]}
                                placeholder="0"
                                placeholderTextColor={colors.textSecondary}
                                keyboardType="numeric"
                                value={proposedPrice}
                                onChangeText={setProposedPrice}
                            />
                            <Text style={[styles.priceCurrency, { color: colors.textSecondary }]}>FCFA</Text>
                        </View>

                        {proposedPrice && Number(proposedPrice) < getFinalPrice() * 0.7 && (
                            <Text style={styles.warningText}>
                                <Icon name="alert-circle" size={16} color="#FFA000" /> {language === 'fr'
                                    ? 'Prix très bas, peu de chauffeurs accepteront'
                                    : 'Very low price, few drivers will accept'}
                            </Text>
                        )}

                        <TouchableOpacity
                            style={[
                                styles.confirmProposalButton,
                                { opacity: proposedPrice ? 1 : 0.5 }
                            ]}
                            disabled={!proposedPrice}
                            onPress={() => {
                                setIsNegotiating(true);
                                setShowNegotiationModal(false);
                            }}
                        >
                            <LinearGradient
                                colors={[COLORS.primary, COLORS.primaryDark]}
                                style={styles.confirmProposalGradient}
                            >
                                <Text style={styles.confirmProposalText}>
                                    {language === 'fr' ? 'Confirmer cette proposition' : 'Confirm this offer'}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
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

    // Markers
    markerGreen: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#4CAF50',
    },
    markerGreenInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#4CAF50',
    },
    markerOrange: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: COLORS.primary,
    },
    markerOrangeInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: COLORS.primary,
    },

    // Header
    header: {
        position: 'absolute',
        top: 50,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },

    // Bottom Sheet
    bottomSheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        maxHeight: '75%',
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: SPACING.sm,
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.sm,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 10,
    },
    bottomSheetScroll: {
        paddingBottom: SPACING.md,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: COLORS.textSecondary + '30',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: SPACING.md,
    },

    // Adresses
    tripQuickInfo: {
        marginBottom: SPACING.md,
        alignItems: 'center',
    },
    tripInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    tripInfoText: {
        fontSize: 14,
        fontWeight: '600',
    },
    addressesContainer: {
        marginBottom: SPACING.lg,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    dotGreen: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#4CAF50',
        marginTop: 6,
        marginRight: SPACING.md,
    },
    dotOrange: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: COLORS.primary,
        marginTop: 6,
        marginRight: SPACING.md,
    },
    connectionLine: {
        width: 2,
        height: 16,
        backgroundColor: COLORS.textSecondary + '30',
        marginLeft: 5,
        marginVertical: 4,
    },
    addressInfo: {
        flex: 1,
    },
    addressLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    addressText: {
        fontSize: 15,
        fontWeight: '500',
        color: COLORS.text,
        marginBottom: SPACING.md,
    },

    // Section titre
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginBottom: SPACING.md,
    },

    // Véhicules
    vehiclesContainer: {
        marginBottom: SPACING.lg,
    },
    vehiclesScroll: {
        paddingRight: SPACING.lg,
    },
    vehicleCard: {
        width: 140,
        borderRadius: 16,
        padding: SPACING.md,
        marginRight: SPACING.md,
        borderWidth: 2,
        borderColor: 'transparent',
        position: 'relative',
    },
    vehicleCardSelected: {
        borderColor: COLORS.primary,
    },
    topBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: COLORS.primary,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        zIndex: 1,
    },
    topBadgeText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    vehicleImageContainer: {
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    vehicleEmoji: {
        fontSize: 48,
    },
    vehicleName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 4,
    },
    vehicleCapacity: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginBottom: 8,
    },
    vehiclePrice: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 2,
    },
    vehicleDuration: {
        fontSize: 11,
        color: COLORS.textSecondary,
    },
    vehicleImage: {
        width: 120,
        height: 100,
    },
    vehicleDescription: {
        fontSize: 10,
        color: COLORS.textSecondary,
        marginBottom: 4,
    },

    // Bouton Commander
    commandButton: {
        marginTop: SPACING.sm,
    },
    commandButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 30,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 5,
    },
    commandButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.white,
        marginRight: SPACING.sm,
    },

    // Options avancées
    optionsContainer: {
        marginTop: SPACING.md,
        marginBottom: SPACING.md,
        gap: SPACING.sm,
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.background,
        padding: SPACING.md,
        borderRadius: 12,
    },
    optionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    optionIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.sm,
    },
    optionEmoji: {
        fontSize: 20,
    },
    optionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 2,
    },
    optionSubtitle: {
        fontSize: 11,
        color: COLORS.textSecondary,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: COLORS.textSecondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    checkIcon: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.white,
    },

    // Transparence Prix
    priceDetailsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.primaryBg,
        padding: SPACING.md,
        borderRadius: 12,
        marginTop: SPACING.sm,
    },
    priceDetailsText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
    },
    priceBreakdown: {
        backgroundColor: COLORS.white,
        padding: SPACING.md,
        borderRadius: 12,
        marginTop: SPACING.sm,
        gap: SPACING.sm,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    priceLabel: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    priceValue: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.text,
    },
    priceDivider: {
        height: 1,
        backgroundColor: COLORS.background,
        marginVertical: 4,
    },

    // Négociation
    negotiationSection: {
        marginTop: SPACING.md,
        marginBottom: SPACING.sm,
    },
    negotiationTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: SPACING.sm,
    },
    negotiateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: SPACING.md,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.primary + '50',
        borderStyle: 'dashed',
    },
    negotiateButtonText: {
        fontSize: 14,
        fontWeight: '500',
    },
    proposedPriceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: SPACING.md,
        borderRadius: 12,
        borderWidth: 1,
    },
    proposedPriceLabel: {
        fontSize: 12,
        color: '#4CAF50',
    },
    proposedPriceValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    changeProposalText: {
        fontSize: 12,
        color: COLORS.primary,
        textDecorationLine: 'underline',
    },
    actionButtonsContainer: {
        marginTop: SPACING.sm,
    },

    // Modal négociation
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: SPACING.lg,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    recommendedPriceBox: {
        alignItems: 'center',
        padding: SPACING.lg,
        backgroundColor: COLORS.primary + '15',
        borderRadius: 16,
        marginBottom: SPACING.lg,
    },
    recommendedLabel: {
        fontSize: 12,
        marginBottom: 4,
    },
    recommendedValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    suggestionsLabel: {
        fontSize: 12,
        marginBottom: SPACING.sm,
    },
    suggestionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.lg,
        gap: 8,
    },
    suggestionButton: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    suggestionButtonActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    suggestionText: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 2,
    },
    suggestionPrice: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    customPriceLabel: {
        fontSize: 12,
        marginBottom: SPACING.sm,
    },
    customPriceInput: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: SPACING.md,
        marginBottom: SPACING.md,
    },
    priceInput: {
        flex: 1,
        fontSize: 24,
        fontWeight: 'bold',
        paddingVertical: SPACING.md,
    },
    priceCurrency: {
        fontSize: 16,
        fontWeight: '500',
    },
    warningText: {
        fontSize: 12,
        color: '#FF9800',
        marginBottom: SPACING.md,
        textAlign: 'center',
    },
    confirmProposalButton: {
        marginTop: SPACING.sm,
    },
    confirmProposalGradient: {
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
    },
    confirmProposalText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    carpoolBadge: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    carpoolBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    stopsSection: {
        gap: 8,
    },
    addStopButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        borderRadius: 12,
    },
    stopItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        padding: 12,
        borderRadius: 10,
        marginHorizontal: SPACING.sm,
    },
    stopText: {
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 16,
        marginTop: 16,
    },
    cancelButton: {
        padding: 10,
    },
    confirmButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
});
