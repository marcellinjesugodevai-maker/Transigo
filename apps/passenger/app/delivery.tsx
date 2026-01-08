// =============================================
// TRANSIGO - DELIVERY SCREEN (VERSION AMÉLIORÉE)
// Livraison de colis avec sélection véhicule et GPS
// =============================================

import { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    FlatList,
    ActivityIndicator,
    Dimensions,
    Image,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@/components/Icon';
import { COLORS, SPACING, RADIUS } from '@/constants';
import { useThemeStore, useLanguageStore } from '@/stores';
import { getTranslation } from '@/i18n/translations';
import { locationService, LocationSearchResult } from '@/services/locationService';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

// Types de véhicules pour livraison
const DELIVERY_VEHICLES = [
    {
        id: 'moto',
        icon: '🏍',
        name: 'Moto',
        nameEn: 'Motorcycle',
        description: 'Petit colis < 10kg',
        descriptionEn: 'Small package < 10kg',
        maxWeight: '10 kg',
        basePrice: 1000,
        pricePerKm: 100,
    },
    {
        id: 'car',
        icon: '🚗',
        name: 'Voiture',
        nameEn: 'Car',
        description: 'Colis moyen < 30kg',
        descriptionEn: 'Medium package < 30kg',
        maxWeight: '30 kg',
        basePrice: 1500,
        pricePerKm: 150,
    },
    {
        id: 'van',
        icon: '🚐',
        name: 'Camionnette',
        nameEn: 'Van',
        description: 'Gros colis < 100kg',
        descriptionEn: 'Large package < 100kg',
        maxWeight: '100 kg',
        basePrice: 2500,
        pricePerKm: 200,
    },
    {
        id: 'truck',
        icon: '🚚',
        name: 'Camion',
        nameEn: 'Truck',
        description: 'Déménagement / Gros volume',
        descriptionEn: 'Moving / Large volume',
        maxWeight: '500 kg+',
        basePrice: 5000,
        pricePerKm: 350,
    },
];

// Types de colis
const PACKAGE_TYPES = [
    { id: 'document', icon: '📄', name: 'Documents', nameEn: 'Documents' },
    { id: 'food', icon: '🍔', name: 'Nourriture', nameEn: 'Food' },
    { id: 'electronics', icon: '📱', name: 'Électronique', nameEn: 'Electronics' },
    { id: 'fragile', icon: '⚠️', name: 'Fragile', nameEn: 'Fragile' },
    { id: 'other', icon: '📦', name: 'Autre', nameEn: 'Other' },
];

export default function DeliveryScreen() {
    const { colors, isDark } = useThemeStore();
    const { language } = useLanguageStore();
    const t = (key: any) => getTranslation(key, language);

    // États du formulaire
    const [selectedVehicle, setSelectedVehicle] = useState(DELIVERY_VEHICLES[0]);
    const [packageType, setPackageType] = useState('other');
    const [packageDescription, setPackageDescription] = useState('');
    const [packagePhoto, setPackagePhoto] = useState<string | null>(null);
    const [recipientName, setRecipientName] = useState('');
    const [recipientPhone, setRecipientPhone] = useState('');

    // États pour les adresses avec GPS
    const [pickupAddress, setPickupAddress] = useState('');
    const [pickupCoords, setPickupCoords] = useState<{ latitude: number, longitude: number } | null>(null);
    const [pickupSearchResults, setPickupSearchResults] = useState<LocationSearchResult[]>([]);
    const [isSearchingPickup, setIsSearchingPickup] = useState(false);
    const [showPickupResults, setShowPickupResults] = useState(false);

    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [deliveryCoords, setDeliveryCoords] = useState<{ latitude: number, longitude: number } | null>(null);
    const [deliverySearchResults, setDeliverySearchResults] = useState<LocationSearchResult[]>([]);
    const [isSearchingDelivery, setIsSearchingDelivery] = useState(false);
    const [showDeliveryResults, setShowDeliveryResults] = useState(false);

    // Distance et prix estimés
    const [estimatedDistance, setEstimatedDistance] = useState(0);
    const [estimatedPrice, setEstimatedPrice] = useState(selectedVehicle.basePrice);

    // Recherche d'adresse d'enlèvement
    useEffect(() => {
        const searchPickup = async () => {
            if (pickupAddress.length >= 3 && !pickupCoords) {
                setIsSearchingPickup(true);
                const results = await locationService.searchPlaces(pickupAddress);
                setPickupSearchResults(results);
                setShowPickupResults(results.length > 0);
                setIsSearchingPickup(false);
            } else {
                setPickupSearchResults([]);
                setShowPickupResults(false);
            }
        };
        const debounce = setTimeout(searchPickup, 500);
        return () => clearTimeout(debounce);
    }, [pickupAddress]);

    // Recherche d'adresse de livraison
    useEffect(() => {
        const searchDelivery = async () => {
            if (deliveryAddress.length >= 3 && !deliveryCoords) {
                setIsSearchingDelivery(true);
                const results = await locationService.searchPlaces(deliveryAddress);
                setDeliverySearchResults(results);
                setShowDeliveryResults(results.length > 0);
                setIsSearchingDelivery(false);
            } else {
                setDeliverySearchResults([]);
                setShowDeliveryResults(false);
            }
        };
        const debounce = setTimeout(searchDelivery, 500);
        return () => clearTimeout(debounce);
    }, [deliveryAddress]);

    // Calcul du prix quand les coordonnées changent
    useEffect(() => {
        if (pickupCoords && deliveryCoords) {
            calculatePrice();
        }
    }, [pickupCoords, deliveryCoords, selectedVehicle]);

    const calculatePrice = async () => {
        if (!pickupCoords || !deliveryCoords) return;

        try {
            const route = await locationService.getRoute(
                pickupCoords.latitude, pickupCoords.longitude,
                deliveryCoords.latitude, deliveryCoords.longitude
            );
            if (route) {
                setEstimatedDistance(route.distance);
                const price = selectedVehicle.basePrice + (route.distance * selectedVehicle.pricePerKm);
                setEstimatedPrice(Math.round(price / 100) * 100); // Arrondi à 100
            }
        } catch (error) {
            console.error('Erreur calcul prix:', error);
        }
    };

    const handleSelectPickup = (result: LocationSearchResult) => {
        setPickupAddress(result.display_name);
        setPickupCoords({ latitude: result.latitude, longitude: result.longitude });
        setShowPickupResults(false);
    };

    const handleSelectDelivery = (result: LocationSearchResult) => {
        setDeliveryAddress(result.display_name);
        setDeliveryCoords({ latitude: result.latitude, longitude: result.longitude });
        setShowDeliveryResults(false);
    };

    const handleUseCurrentLocation = async (type: 'pickup' | 'delivery') => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission refusée', 'Activez la localisation pour continuer.');
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            const coords = { latitude: location.coords.latitude, longitude: location.coords.longitude };

            // Reverse geocoding pour obtenir l'adresse
            const address = await locationService.reverseGeocode(coords.latitude, coords.longitude);

            if (type === 'pickup') {
                setPickupAddress(address || 'Ma position actuelle');
                setPickupCoords(coords);
            } else {
                setDeliveryAddress(address || 'Ma position actuelle');
                setDeliveryCoords(coords);
            }
        } catch (error) {
            console.error('Erreur localisation:', error);
            Alert.alert('Erreur', 'Impossible d\'obtenir votre position.');
        }
    };

    const clearPickup = () => {
        setPickupAddress('');
        setPickupCoords(null);
    };

    const clearDelivery = () => {
        setDeliveryAddress('');
        setDeliveryCoords(null);
    };

    const handleConfirmDelivery = () => {
        if (!pickupCoords || !deliveryCoords) {
            Alert.alert(
                language === 'fr' ? 'Adresses manquantes' : 'Missing addresses',
                language === 'fr' ? 'Veuillez sélectionner les adresses d\'enlèvement et de livraison.' : 'Please select pickup and delivery addresses.'
            );
            return;
        }
        if (!recipientName || !recipientPhone) {
            Alert.alert(
                language === 'fr' ? 'Destinataire manquant' : 'Missing recipient',
                language === 'fr' ? 'Veuillez renseigner le nom et téléphone du destinataire.' : 'Please enter recipient name and phone.'
            );
            return;
        }

        router.push({
            pathname: '/finding-delivery',
            params: {
                pickup_address: pickupAddress,
                pickup_lat: pickupCoords.latitude,
                pickup_lon: pickupCoords.longitude,
                delivery_address: deliveryAddress,
                delivery_lat: deliveryCoords.latitude,
                delivery_lon: deliveryCoords.longitude,
                vehicle_type: selectedVehicle.id,
                package_type: packageType,
                package_description: packageDescription,
                recipient_name: recipientName,
                recipient_phone: recipientPhone,
                price: estimatedPrice,
                distance: estimatedDistance,
            }
        });
    };

    const renderAddressInput = (
        type: 'pickup' | 'delivery',
        value: string,
        setValue: (v: string) => void,
        coords: typeof pickupCoords,
        setCoords: (c: typeof pickupCoords) => void,
        searchResults: LocationSearchResult[],
        showResults: boolean,
        isSearching: boolean,
        handleSelect: (r: LocationSearchResult) => void,
        handleClear: () => void
    ) => (
        <View style={styles.addressInputWrapper}>
            <View style={styles.addressInputContainer}>
                <View style={[
                    styles.addressDot,
                    { backgroundColor: type === 'pickup' ? '#4CAF50' : COLORS.primary }
                ]} />
                <TextInput
                    style={[styles.addressInput, {
                        color: isDark ? '#FFFFFF' : '#1A1A1A',
                        backgroundColor: isDark ? '#333333' : '#F5F5F5',
                        borderWidth: 1,
                        borderColor: isDark ? '#444444' : '#E0E0E0',
                    }]}
                    placeholder={type === 'pickup'
                        ? (language === 'fr' ? 'Adresse d\'enlèvement...' : 'Pickup address...')
                        : (language === 'fr' ? 'Adresse de livraison...' : 'Delivery address...')}
                    placeholderTextColor={isDark ? '#888888' : '#999999'}
                    value={value}
                    onChangeText={(text) => {
                        setValue(text);
                        if (coords) setCoords(null);
                    }}
                />
                {isSearching && <ActivityIndicator size="small" color={COLORS.primary} />}
                {coords && (
                    <TouchableOpacity onPress={handleClear}>
                        <Icon name="close-circle" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    style={styles.gpsButton}
                    onPress={() => handleUseCurrentLocation(type)}
                >
                    <Icon name="locate" size={20} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            {/* Badge GPS validé */}
            {coords && (
                <View style={styles.coordsBadge}>
                    <Icon name="checkmark-circle" size={14} color="#4CAF50" />
                    <Text style={styles.coordsText}>
                        GPS: {coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)}
                    </Text>
                </View>
            )}

            {/* Résultats de recherche */}
            {showResults && (
                <View style={[styles.searchResults, {
                    backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
                    borderWidth: 1,
                    borderColor: isDark ? '#444' : '#E0E0E0',
                }]}>
                    {searchResults.slice(0, 4).map((result, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[styles.searchResultItem, {
                                backgroundColor: isDark ? '#333' : '#FAFAFA',
                            }]}
                            onPress={() => handleSelect(result)}
                        >
                            <Icon name="location" size={18} color={COLORS.primary} />
                            <Text style={[styles.searchResultText, {
                                color: isDark ? '#FFFFFF' : '#1A1A1A'
                            }]} numberOfLines={2}>
                                {result.display_name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header avec dégradé */}
            <LinearGradient
                colors={['#FF9800', '#F57C00']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Icon name="arrow-left" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>
                        📦 TransiGo Delivery
                    </Text>
                    <Text style={styles.headerSubtitle}>
                        {language === 'fr' ? 'Livraison rapide et sécurisée' : 'Fast and secure delivery'}
                    </Text>
                </View>
            </LinearGradient>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Section Véhicule */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    🚚 {language === 'fr' ? 'Type de véhicule' : 'Vehicle type'}
                </Text>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.vehiclesScroll}
                >
                    {DELIVERY_VEHICLES.map((vehicle) => (
                        <TouchableOpacity
                            key={vehicle.id}
                            style={[
                                styles.vehicleCard,
                                { backgroundColor: colors.card },
                                selectedVehicle.id === vehicle.id && styles.vehicleCardSelected
                            ]}
                            onPress={() => setSelectedVehicle(vehicle)}
                        >
                            <Text style={styles.vehicleIcon}>{vehicle.icon}</Text>
                            <Text style={[styles.vehicleName, { color: colors.text }]}>
                                {language === 'fr' ? vehicle.name : vehicle.nameEn}
                            </Text>
                            <Text style={[styles.vehicleDesc, { color: colors.textSecondary }]}>
                                {language === 'fr' ? vehicle.description : vehicle.descriptionEn}
                            </Text>
                            <Text style={styles.vehicleWeight}>{vehicle.maxWeight}</Text>
                            <Text style={styles.vehiclePrice}>
                                {language === 'fr' ? 'À partir de ' : 'From '}{vehicle.basePrice} F
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Section Adresses */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    📍 {language === 'fr' ? 'Adresses' : 'Addresses'}
                </Text>
                <View style={[styles.addressesCard, { backgroundColor: colors.card }]}>
                    {renderAddressInput(
                        'pickup',
                        pickupAddress,
                        setPickupAddress,
                        pickupCoords,
                        setPickupCoords,
                        pickupSearchResults,
                        showPickupResults,
                        isSearchingPickup,
                        handleSelectPickup,
                        clearPickup
                    )}

                    <View style={styles.addressConnectionLine} />

                    {renderAddressInput(
                        'delivery',
                        deliveryAddress,
                        setDeliveryAddress,
                        deliveryCoords,
                        setDeliveryCoords,
                        deliverySearchResults,
                        showDeliveryResults,
                        isSearchingDelivery,
                        handleSelectDelivery,
                        clearDelivery
                    )}
                </View>

                {/* Distance estimée */}
                {estimatedDistance > 0 && (
                    <View style={[styles.distanceCard, { backgroundColor: colors.card }]}>
                        <Text style={styles.distanceIcon}>📏</Text>
                        <Text style={[styles.distanceText, { color: colors.text }]}>
                            {estimatedDistance.toFixed(1)} km
                        </Text>
                    </View>
                )}

                {/* Type de colis */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    📦 {language === 'fr' ? 'Type de colis' : 'Package type'}
                </Text>
                <View style={styles.packageTypesRow}>
                    {PACKAGE_TYPES.map((pkg) => (
                        <TouchableOpacity
                            key={pkg.id}
                            style={[
                                styles.packageTypeChip,
                                { backgroundColor: isDark ? '#252525' : colors.card },
                                packageType === pkg.id && styles.packageTypeChipSelected
                            ]}
                            onPress={() => setPackageType(pkg.id)}
                        >
                            <Text style={styles.packageTypeIcon}>{pkg.icon}</Text>
                            <Text style={[
                                styles.packageTypeName,
                                { color: packageType === pkg.id ? COLORS.white : colors.text }
                            ]}>
                                {language === 'fr' ? pkg.name : pkg.nameEn}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Description */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    📝 {language === 'fr' ? 'Description (optionnel)' : 'Description (optional)'}
                </Text>
                <TextInput
                    style={[styles.descriptionInput, {
                        backgroundColor: colors.card,
                        color: colors.text,
                    }]}
                    placeholder={language === 'fr' ? 'Décrivez votre colis...' : 'Describe your package...'}
                    placeholderTextColor={colors.textSecondary}
                    value={packageDescription}
                    onChangeText={setPackageDescription}
                    multiline
                    numberOfLines={3}
                />

                {/* Photo du colis */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    📷 {language === 'fr' ? 'Photo du colis (recommandé)' : 'Package photo (recommended)'}
                </Text>
                <View style={[styles.photoSection, { backgroundColor: colors.card }]}>
                    {packagePhoto ? (
                        <View style={styles.photoPreviewContainer}>
                            <Image source={{ uri: packagePhoto }} style={styles.photoPreview} />
                            <TouchableOpacity
                                style={styles.removePhotoBtn}
                                onPress={() => setPackagePhoto(null)}
                            >
                                <Icon name="close-circle" size={28} color="#E91E63" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.photoButtons}>
                            <TouchableOpacity
                                style={styles.photoButton}
                                onPress={async () => {
                                    const { status } = await ImagePicker.requestCameraPermissionsAsync();
                                    if (status !== 'granted') {
                                        Alert.alert('Permission refusée', 'La caméra est nécessaire pour prendre une photo.');
                                        return;
                                    }
                                    const result = await ImagePicker.launchCameraAsync({
                                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                                        quality: 0.7,
                                        allowsEditing: true,
                                        aspect: [4, 3],
                                    });
                                    if (!result.canceled && result.assets[0]) {
                                        setPackagePhoto(result.assets[0].uri);
                                    }
                                }}
                            >
                                <LinearGradient
                                    colors={['#4CAF50', '#388E3C']}
                                    style={styles.photoButtonGradient}
                                >
                                    <Icon name="camera" size={24} color={COLORS.white} />
                                    <Text style={styles.photoButtonText}>
                                        {language === 'fr' ? 'Prendre photo' : 'Take photo'}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.photoButton}
                                onPress={async () => {
                                    const result = await ImagePicker.launchImageLibraryAsync({
                                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                                        quality: 0.7,
                                        allowsEditing: true,
                                        aspect: [4, 3],
                                    });
                                    if (!result.canceled && result.assets[0]) {
                                        setPackagePhoto(result.assets[0].uri);
                                    }
                                }}
                            >
                                <LinearGradient
                                    colors={['#2196F3', '#1976D2']}
                                    style={styles.photoButtonGradient}
                                >
                                    <Icon name="images" size={24} color={COLORS.white} />
                                    <Text style={styles.photoButtonText}>
                                        {language === 'fr' ? 'Galerie' : 'Gallery'}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    )}
                    <Text style={[styles.photoHint, { color: colors.textSecondary }]}>
                        💡 {language === 'fr' ? 'La photo aide le livreur à identifier votre colis' : 'Photo helps delivery driver identify your package'}
                    </Text>
                </View>

                {/* Destinataire */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    👤 {language === 'fr' ? 'Destinataire' : 'Recipient'}
                </Text>
                <View style={[styles.recipientCard, { backgroundColor: colors.card }]}>
                    <View style={styles.recipientInputRow}>
                        <Icon name="person" size={20} color={colors.textSecondary} />
                        <TextInput
                            style={[styles.recipientInput, { color: colors.text }]}
                            placeholder={language === 'fr' ? 'Nom du destinataire' : 'Recipient name'}
                            placeholderTextColor={colors.textSecondary}
                            value={recipientName}
                            onChangeText={setRecipientName}
                        />
                    </View>
                    <View style={styles.recipientDivider} />
                    <View style={styles.recipientInputRow}>
                        <Icon name="call" size={20} color={colors.textSecondary} />
                        <TextInput
                            style={[styles.recipientInput, { color: colors.text }]}
                            placeholder={language === 'fr' ? 'Téléphone' : 'Phone number'}
                            placeholderTextColor={colors.textSecondary}
                            value={recipientPhone}
                            onChangeText={setRecipientPhone}
                            keyboardType="phone-pad"
                        />
                    </View>
                </View>

                {/* Prix estimé */}
                <View style={styles.priceSection}>
                    <View style={[styles.priceCard, { backgroundColor: colors.card }]}>
                        <View style={styles.priceHeader}>
                            <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>
                                {language === 'fr' ? 'Prix estimé' : 'Estimated price'}
                            </Text>
                            <View style={styles.priceBreakdown}>
                                <Text style={[styles.priceBreakdownText, { color: colors.textSecondary }]}>
                                    {selectedVehicle.icon} {language === 'fr' ? selectedVehicle.name : selectedVehicle.nameEn}
                                </Text>
                            </View>
                        </View>
                        <Text style={styles.priceValue}>
                            {estimatedPrice.toLocaleString('fr-FR')} FCFA
                        </Text>
                    </View>
                </View>

                {/* Bouton Commander */}
                <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={handleConfirmDelivery}
                    activeOpacity={0.9}
                >
                    <LinearGradient
                        colors={['#FF9800', '#E65100']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.confirmGradient}
                    >
                        <Text style={styles.confirmText}>
                            {language === 'fr' ? 'Trouver un livreur' : 'Find a delivery driver'} 🚀
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingTop: 50,
        paddingBottom: SPACING.lg,
        gap: SPACING.md,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerContent: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 2,
    },
    scrollContent: {
        padding: SPACING.lg,
        paddingBottom: 40,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: SPACING.sm,
        marginTop: SPACING.md,
    },

    // Véhicules
    vehiclesScroll: {
        paddingVertical: SPACING.xs,
    },
    vehicleCard: {
        width: 140,
        padding: SPACING.md,
        borderRadius: RADIUS.lg,
        marginRight: SPACING.sm,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    vehicleCardSelected: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary + '10',
    },
    vehicleIcon: {
        fontSize: 36,
        marginBottom: 8,
    },
    vehicleName: {
        fontSize: 14,
        fontWeight: '700',
    },
    vehicleDesc: {
        fontSize: 10,
        textAlign: 'center',
        marginTop: 2,
    },
    vehicleWeight: {
        fontSize: 11,
        fontWeight: '600',
        color: COLORS.primary,
        marginTop: 4,
    },
    vehiclePrice: {
        fontSize: 10,
        color: COLORS.primary,
        marginTop: 2,
    },

    // Adresses
    addressesCard: {
        borderRadius: RADIUS.lg,
        padding: SPACING.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    addressInputWrapper: {
        marginBottom: SPACING.sm,
    },
    addressInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    addressDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    addressInput: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: SPACING.sm,
        borderRadius: RADIUS.md,
        fontSize: 14,
    },
    gpsButton: {
        padding: 8,
    },
    coordsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        marginLeft: 20,
        gap: 4,
    },
    coordsText: {
        fontSize: 10,
        color: '#4CAF50',
    },
    addressConnectionLine: {
        width: 2,
        height: 30,
        backgroundColor: '#E0E0E0',
        marginLeft: 5,
    },
    searchResults: {
        marginTop: SPACING.xs,
        marginLeft: 20,
        borderRadius: RADIUS.md,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    searchResultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.sm,
        gap: SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    searchResultText: {
        flex: 1,
        fontSize: 13,
    },

    // Distance
    distanceCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.sm,
        borderRadius: RADIUS.md,
        gap: SPACING.sm,
        marginTop: SPACING.sm,
    },
    distanceIcon: {
        fontSize: 18,
    },
    distanceText: {
        fontSize: 14,
        fontWeight: '600',
    },

    // Types de colis
    packageTypesRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.xs,
    },
    packageTypeChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        gap: 6,
    },
    packageTypeChipSelected: {
        backgroundColor: COLORS.primary,
    },
    packageTypeIcon: {
        fontSize: 16,
    },
    packageTypeName: {
        fontSize: 12,
        fontWeight: '500',
    },

    // Description
    descriptionInput: {
        borderRadius: RADIUS.md,
        padding: SPACING.md,
        fontSize: 14,
        minHeight: 80,
        textAlignVertical: 'top',
    },

    // Destinataire
    recipientCard: {
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
    },
    recipientInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        gap: SPACING.sm,
    },
    recipientInput: {
        flex: 1,
        fontSize: 14,
    },
    recipientDivider: {
        height: 1,
        backgroundColor: '#E0E0E0',
        marginHorizontal: SPACING.md,
    },

    // Prix
    priceSection: {
        marginTop: SPACING.lg,
    },
    priceCard: {
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    priceHeader: {
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    priceLabel: {
        fontSize: 14,
    },
    priceBreakdown: {
        marginTop: 4,
    },
    priceBreakdownText: {
        fontSize: 12,
    },
    priceValue: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#FF9800',
    },

    // Bouton
    confirmButton: {
        marginTop: SPACING.lg,
    },
    confirmGradient: {
        paddingVertical: 18,
        borderRadius: 30,
        alignItems: 'center',
        shadowColor: '#FF9800',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 5,
    },
    confirmText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.white,
    },

    // Photo du colis
    photoSection: {
        padding: SPACING.md,
        borderRadius: RADIUS.lg,
        marginBottom: SPACING.md,
    },
    photoPreviewContainer: {
        position: 'relative',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    photoPreview: {
        width: width - 80,
        height: 200,
        borderRadius: RADIUS.md,
    },
    removePhotoBtn: {
        position: 'absolute',
        top: -10,
        right: -10,
        backgroundColor: '#FFF',
        borderRadius: 20,
    },
    photoButtons: {
        flexDirection: 'row',
        gap: SPACING.md,
        marginBottom: SPACING.sm,
    },
    photoButton: {
        flex: 1,
    },
    photoButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.md,
        borderRadius: RADIUS.md,
        gap: 8,
    },
    photoButtonText: {
        color: COLORS.white,
        fontWeight: '600',
        fontSize: 14,
    },
    photoHint: {
        fontSize: 12,
        textAlign: 'center',
        marginTop: SPACING.sm,
    },
});
