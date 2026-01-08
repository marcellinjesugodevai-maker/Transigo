// =============================================
// TRANSIGO FOOD - PANIER (PREMIUM)
// Checkout moderne et fluide
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
    ActivityIndicator,
    StatusBar,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@/components/Icon';
import { COLORS, SPACING, RADIUS } from '@/constants';
import { useThemeStore, useLanguageStore } from '@/stores';
import { getTranslation } from '@/i18n/translations';
import { locationService, LocationSearchResult } from '@/services/locationService';
import * as Location from 'expo-location';

type CartItem = {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
};

const PAYMENT_METHODS = [
    { id: 'cash', name: 'Espèces', nameEn: 'Cash', icon: '💵', color: '#4CAF50' },
    { id: 'wave', name: 'Wave', nameEn: 'Wave', icon: '🌊', color: '#00BCD4' },
    { id: 'orange', name: 'Orange Money', nameEn: 'Orange Money', icon: '🟠', color: '#FF9800' },
    { id: 'mtn', name: 'MTN MoMo', nameEn: 'MTN MoMo', icon: '🟡', color: '#FFEB3B' },
];

const TIP_OPTIONS = [
    { value: 0, label: 'Non', labelEn: 'No', emoji: '❌' },
    { value: 200, label: '200 F', labelEn: '200 F', emoji: '😊' },
    { value: 500, label: '500 F', labelEn: '500 F', emoji: '🙏' },
    { value: 1000, label: '1000 F', labelEn: '1000 F', emoji: '🤩' },
];

export default function CartScreen() {
    const params = useLocalSearchParams();
    const { isDark, colors } = useThemeStore();
    const { language } = useLanguageStore();
    const t = (key: any) => getTranslation(key, language);

    // Restaurant info
    const restaurantName = params.restaurant_name as string || 'Restaurant';
    const restaurantImage = params.restaurant_image as string || '🍽️';
    const deliveryFee = Number(params.delivery_fee) || 500;
    const deliveryTime = params.delivery_time as string || '30-45';

    // Parse cart
    const [cart, setCart] = useState<CartItem[]>(() => {
        try {
            return JSON.parse(params.cart as string || '[]');
        } catch {
            return [];
        }
    });

    // États
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [deliveryCoords, setDeliveryCoords] = useState<{ lat: number, lon: number } | null>(null);
    const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [specialInstructions, setSpecialInstructions] = useState('');
    const [selectedPayment, setSelectedPayment] = useState('cash');
    const [selectedTip, setSelectedTip] = useState(0);
    const [promoCode, setPromoCode] = useState('');
    const [promoDiscount, setPromoDiscount] = useState(0);
    const [promoApplied, setPromoApplied] = useState(false);

    // Calculs
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const serviceFee = Math.round(subtotal * 0.05);
    const total = subtotal + deliveryFee + serviceFee + selectedTip - promoDiscount;

    // Recherche d'adresse
    useEffect(() => {
        const search = async () => {
            if (deliveryAddress.length >= 3 && !deliveryCoords) {
                setIsSearching(true);
                const results = await locationService.searchPlaces(deliveryAddress);
                setSearchResults(results);
                setShowResults(results.length > 0);
                setIsSearching(false);
            } else {
                setSearchResults([]);
                setShowResults(false);
            }
        };
        const debounce = setTimeout(search, 500);
        return () => clearTimeout(debounce);
    }, [deliveryAddress]);

    const handleSelectAddress = (result: LocationSearchResult) => {
        setDeliveryAddress(result.display_name);
        setDeliveryCoords({ lat: result.latitude, lon: result.longitude });
        setShowResults(false);
    };

    const handleUseCurrentLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission refusée', 'Activez la localisation.');
                return;
            }
            const location = await Location.getCurrentPositionAsync({});
            const address = await locationService.reverseGeocode(
                location.coords.latitude,
                location.coords.longitude
            );
            setDeliveryAddress(address || 'Ma position actuelle');
            setDeliveryCoords({ lat: location.coords.latitude, lon: location.coords.longitude });
        } catch (error) {
            Alert.alert('Erreur', 'Impossible d\'obtenir votre position.');
        }
    };

    const updateQuantity = (itemId: string, delta: number) => {
        setCart(cart.map(item => {
            if (item.id === itemId) {
                const newQuantity = item.quantity + delta;
                return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
            }
            return item;
        }).filter(item => item.quantity > 0));
    };

    const applyPromoCode = () => {
        if (promoApplied) return;
        if (promoCode.toUpperCase() === 'TRANSIGO10') {
            setPromoDiscount(Math.round(subtotal * 0.1));
            setPromoApplied(true);
            Alert.alert('🎉 Bravo !', '-10% appliqué sur votre commande');
        } else if (promoCode.toUpperCase() === 'FOOD500') {
            setPromoDiscount(500);
            setPromoApplied(true);
            Alert.alert('🎉 Bravo !', '-500 FCFA sur votre commande');
        } else if (promoCode.toUpperCase() === 'LIVRAISON') {
            setPromoDiscount(deliveryFee);
            setPromoApplied(true);
            Alert.alert('🎉 Bravo !', 'Livraison offerte !');
        } else {
            Alert.alert('❌ Code invalide', 'Ce code promo n\'existe pas.');
        }
    };

    const handleConfirmOrder = () => {
        if (!deliveryCoords) {
            Alert.alert('📍 Adresse requise', 'Veuillez sélectionner une adresse de livraison.');
            return;
        }
        if (cart.length === 0) {
            Alert.alert('🛒 Panier vide', 'Ajoutez des articles à votre panier.');
            return;
        }

        router.push({
            pathname: '/food/finding-rider',
            params: {
                restaurant_name: restaurantName,
                restaurant_image: restaurantImage,
                delivery_address: deliveryAddress,
                delivery_lat: deliveryCoords.lat,
                delivery_lon: deliveryCoords.lon,
                total: total,
                delivery_time: deliveryTime,
                items_count: cart.reduce((sum, item) => sum + item.quantity, 0),
                payment_method: selectedPayment,
            }
        });
    };

    if (cart.length === 0) {
        return (
            <View style={[styles.container, styles.emptyContainer, { backgroundColor: colors.background }]}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
                <Text style={styles.emptyEmoji}>🛒</Text>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                    {language === 'fr' ? 'Votre panier est vide' : 'Your cart is empty'}
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                    {language === 'fr' ? 'Ajoutez des plats délicieux !' : 'Add some delicious food!'}
                </Text>
                <TouchableOpacity style={styles.emptyButton} onPress={() => router.back()}>
                    <LinearGradient
                        colors={['#FF5722', '#E64A19']}
                        style={styles.emptyButtonGradient}
                    >
                        <Text style={styles.emptyButtonText}>
                            {language === 'fr' ? '← Retour au menu' : '← Back to menu'}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.card }]}>
                <TouchableOpacity style={styles.headerBack} onPress={() => router.back()}>
                    <Icon name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>
                        🛒 {language === 'fr' ? 'Votre commande' : 'Your order'}
                    </Text>
                    <View style={styles.restaurantBadge}>
                        <Text style={styles.restaurantBadgeEmoji}>{restaurantImage}</Text>
                        <Text style={[styles.restaurantBadgeText, { color: colors.textSecondary }]} numberOfLines={1}>
                            {restaurantName}
                        </Text>
                    </View>
                </View>
                <TouchableOpacity onPress={() => setCart([])}>
                    <Icon name="trash-outline" size={22} color="#FF5252" />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Articles */}
                <View style={[styles.section, { backgroundColor: colors.card }]}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            📦 {language === 'fr' ? 'Articles' : 'Items'}
                        </Text>
                        <View style={styles.itemCountBadge}>
                            <Text style={styles.itemCountText}>
                                {cart.reduce((sum, item) => sum + item.quantity, 0)}
                            </Text>
                        </View>
                    </View>

                    {cart.map((item, index) => (
                        <View key={item.id} style={[
                            styles.cartItem,
                            index < cart.length - 1 && styles.cartItemBorder
                        ]}>
                            <View style={styles.cartItemLeft}>
                                <Text style={styles.cartItemEmoji}>{item.image}</Text>
                                <View style={styles.cartItemInfo}>
                                    <Text style={[styles.cartItemName, { color: colors.text }]}>
                                        {item.name}
                                    </Text>
                                    <Text style={styles.cartItemPrice}>
                                        {item.price.toLocaleString('fr-FR')} F
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.cartItemControls}>
                                <TouchableOpacity
                                    style={[styles.controlBtn, { backgroundColor: isDark ? '#333' : '#F0F0F0' }]}
                                    onPress={() => updateQuantity(item.id, -1)}
                                >
                                    <Text style={[styles.controlBtnText, { color: colors.text }]}>−</Text>
                                </TouchableOpacity>
                                <Text style={[styles.quantityText, { color: colors.text }]}>
                                    {item.quantity}
                                </Text>
                                <TouchableOpacity
                                    style={[styles.controlBtn, styles.controlBtnAdd]}
                                    onPress={() => updateQuantity(item.id, 1)}
                                >
                                    <Text style={styles.controlBtnTextAdd}>+</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Adresse */}
                <View style={[styles.section, { backgroundColor: colors.card }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        📍 {language === 'fr' ? 'Livrer à' : 'Deliver to'}
                    </Text>

                    <View style={styles.addressContainer}>
                        <View style={[styles.addressInput, { backgroundColor: isDark ? '#252525' : '#F5F5F5' }]}>
                            <Icon name="location" size={20} color="#FF5722" />
                            <TextInput
                                style={[styles.addressTextInput, { color: colors.text }]}
                                placeholder={language === 'fr' ? 'Entrez votre adresse...' : 'Enter your address...'}
                                placeholderTextColor={colors.textSecondary}
                                value={deliveryAddress}
                                onChangeText={(text) => {
                                    setDeliveryAddress(text);
                                    if (deliveryCoords) setDeliveryCoords(null);
                                }}
                            />
                            {isSearching && <ActivityIndicator size="small" color="#FF5722" />}
                        </View>

                        <TouchableOpacity
                            style={styles.gpsButton}
                            onPress={handleUseCurrentLocation}
                        >
                            <LinearGradient
                                colors={['#FF5722', '#E64A19']}
                                style={styles.gpsButtonGradient}
                            >
                                <Icon name="navigate" size={20} color={COLORS.white} />
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    {deliveryCoords && (
                        <View style={styles.addressConfirmed}>
                            <Icon name="checkmark-circle" size={18} color="#4CAF50" />
                            <Text style={styles.addressConfirmedText}>
                                {language === 'fr' ? 'Adresse confirmée' : 'Address confirmed'}
                            </Text>
                        </View>
                    )}

                    {showResults && (
                        <View style={[styles.searchResults, { backgroundColor: isDark ? '#1E1E1E' : '#FFF' }]}>
                            {searchResults.slice(0, 4).map((result, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[styles.searchResultItem, { borderBottomColor: isDark ? '#333' : '#F0F0F0' }]}
                                    onPress={() => handleSelectAddress(result)}
                                >
                                    <Icon name="location-outline" size={18} color="#FF5722" />
                                    <Text style={[styles.searchResultText, { color: colors.text }]} numberOfLines={2}>
                                        {result.display_name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                {/* Instructions */}
                <View style={[styles.section, { backgroundColor: colors.card }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        📝 {language === 'fr' ? 'Instructions' : 'Instructions'}
                    </Text>
                    <TextInput
                        style={[styles.instructionsInput, {
                            color: colors.text,
                            backgroundColor: isDark ? '#252525' : '#F5F5F5'
                        }]}
                        placeholder={language === 'fr' ? 'Ex: Sans piment, bien cuit, sonnez 2 fois...' : 'E.g.: No spice, well done, ring twice...'}
                        placeholderTextColor={colors.textSecondary}
                        value={specialInstructions}
                        onChangeText={setSpecialInstructions}
                        multiline
                    />
                </View>

                {/* Paiement */}
                <View style={[styles.section, { backgroundColor: colors.card }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        💳 {language === 'fr' ? 'Paiement' : 'Payment'}
                    </Text>
                    <View style={styles.paymentGrid}>
                        {PAYMENT_METHODS.map((method) => (
                            <TouchableOpacity
                                key={method.id}
                                style={[
                                    styles.paymentCard,
                                    { backgroundColor: isDark ? '#252525' : '#F8F8F8' },
                                    selectedPayment === method.id && { borderColor: method.color, borderWidth: 2 }
                                ]}
                                onPress={() => setSelectedPayment(method.id)}
                            >
                                <Text style={styles.paymentIcon}>{method.icon}</Text>
                                <Text style={[styles.paymentName, { color: colors.text }]}>
                                    {language === 'fr' ? method.name : method.nameEn}
                                </Text>
                                {selectedPayment === method.id && (
                                    <View style={[styles.paymentCheck, { backgroundColor: method.color }]}>
                                        <Text style={styles.paymentCheckText}>✓</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Pourboire */}
                <View style={[styles.section, { backgroundColor: colors.card }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        💝 {language === 'fr' ? 'Pourboire livreur' : 'Rider tip'}
                    </Text>
                    <View style={styles.tipGrid}>
                        {TIP_OPTIONS.map((tip) => (
                            <TouchableOpacity
                                key={tip.value}
                                style={[
                                    styles.tipCard,
                                    { backgroundColor: isDark ? '#252525' : '#F8F8F8' },
                                    selectedTip === tip.value && styles.tipCardSelected
                                ]}
                                onPress={() => setSelectedTip(tip.value)}
                            >
                                <Text style={styles.tipEmoji}>{tip.emoji}</Text>
                                <Text style={[
                                    styles.tipLabel,
                                    { color: selectedTip === tip.value ? COLORS.white : colors.text }
                                ]}>
                                    {language === 'fr' ? tip.label : tip.labelEn}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Code promo */}
                <View style={[styles.section, { backgroundColor: colors.card }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        🎁 {language === 'fr' ? 'Code promo' : 'Promo code'}
                    </Text>
                    <View style={styles.promoRow}>
                        <TextInput
                            style={[styles.promoInput, {
                                color: colors.text,
                                backgroundColor: isDark ? '#252525' : '#F5F5F5'
                            }]}
                            placeholder="TRANSIGO10"
                            placeholderTextColor={colors.textSecondary}
                            value={promoCode}
                            onChangeText={setPromoCode}
                            autoCapitalize="characters"
                            editable={!promoApplied}
                        />
                        <TouchableOpacity
                            style={[styles.promoButton, promoApplied && styles.promoButtonApplied]}
                            onPress={applyPromoCode}
                            disabled={promoApplied}
                        >
                            <Text style={styles.promoButtonText}>
                                {promoApplied ? '✓' : (language === 'fr' ? 'Appliquer' : 'Apply')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Récapitulatif */}
                <View style={[styles.section, styles.summarySection, { backgroundColor: colors.card }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        🧾 {language === 'fr' ? 'Récapitulatif' : 'Summary'}
                    </Text>

                    <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                            {language === 'fr' ? 'Sous-total' : 'Subtotal'}
                        </Text>
                        <Text style={[styles.summaryValue, { color: colors.text }]}>
                            {subtotal.toLocaleString('fr-FR')} F
                        </Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                            🚚 {language === 'fr' ? 'Livraison' : 'Delivery'}
                        </Text>
                        <Text style={[styles.summaryValue, { color: colors.text }]}>
                            {deliveryFee.toLocaleString('fr-FR')} F
                        </Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                            📊 {language === 'fr' ? 'Service (5%)' : 'Service (5%)'}
                        </Text>
                        <Text style={[styles.summaryValue, { color: colors.text }]}>
                            {serviceFee.toLocaleString('fr-FR')} F
                        </Text>
                    </View>
                    {selectedTip > 0 && (
                        <View style={styles.summaryRow}>
                            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                                💝 {language === 'fr' ? 'Pourboire' : 'Tip'}
                            </Text>
                            <Text style={[styles.summaryValue, { color: colors.text }]}>
                                {selectedTip.toLocaleString('fr-FR')} F
                            </Text>
                        </View>
                    )}
                    {promoDiscount > 0 && (
                        <View style={styles.summaryRow}>
                            <Text style={[styles.summaryLabel, { color: '#4CAF50' }]}>
                                🎁 {language === 'fr' ? 'Réduction' : 'Discount'}
                            </Text>
                            <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>
                                -{promoDiscount.toLocaleString('fr-FR')} F
                            </Text>
                        </View>
                    )}

                    <View style={styles.totalDivider} />

                    <View style={styles.totalRow}>
                        <Text style={[styles.totalLabel, { color: colors.text }]}>
                            TOTAL
                        </Text>
                        <Text style={styles.totalValue}>
                            {total.toLocaleString('fr-FR')} F
                        </Text>
                    </View>
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Bouton Commander */}
            <View style={styles.confirmButtonContainer}>
                <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={handleConfirmOrder}
                    activeOpacity={0.95}
                >
                    <LinearGradient
                        colors={['#FF5722', '#E64A19']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.confirmGradient}
                    >
                        <Text style={styles.confirmText}>
                            {language === 'fr' ? 'Commander' : 'Order'} • {total.toLocaleString('fr-FR')} F
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

    // Empty state
    emptyContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
    },
    emptyEmoji: {
        fontSize: 80,
        marginBottom: SPACING.lg,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        marginBottom: SPACING.xl,
    },
    emptyButton: {},
    emptyButtonGradient: {
        paddingVertical: 14,
        paddingHorizontal: 30,
        borderRadius: 25,
    },
    emptyButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 50,
        paddingBottom: 15,
        paddingHorizontal: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    headerBack: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerCenter: {
        flex: 1,
        marginHorizontal: SPACING.md,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    restaurantBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        gap: 6,
    },
    restaurantBadgeEmoji: {
        fontSize: 16,
    },
    restaurantBadgeText: {
        fontSize: 13,
        flex: 1,
    },

    // Content
    content: {
        padding: SPACING.md,
    },
    section: {
        borderRadius: 16,
        padding: SPACING.md,
        marginBottom: SPACING.md,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: SPACING.md,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: SPACING.sm,
    },
    itemCountBadge: {
        backgroundColor: '#FF5722',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    itemCountText: {
        color: COLORS.white,
        fontSize: 13,
        fontWeight: 'bold',
    },

    // Cart items
    cartItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: SPACING.sm,
    },
    cartItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    cartItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    cartItemEmoji: {
        fontSize: 36,
        marginRight: SPACING.sm,
    },
    cartItemInfo: {},
    cartItemName: {
        fontSize: 14,
        fontWeight: '600',
    },
    cartItemPrice: {
        fontSize: 14,
        color: '#FF5722',
        fontWeight: '700',
        marginTop: 2,
    },
    cartItemControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    controlBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    controlBtnAdd: {
        backgroundColor: '#FF5722',
    },
    controlBtnText: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    controlBtnTextAdd: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    quantityText: {
        fontSize: 16,
        fontWeight: '600',
        minWidth: 24,
        textAlign: 'center',
    },

    // Address
    addressContainer: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    addressInput: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingVertical: 12,
        borderRadius: 12,
        gap: SPACING.sm,
    },
    addressTextInput: {
        flex: 1,
        fontSize: 14,
    },
    gpsButton: {},
    gpsButtonGradient: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addressConfirmed: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: SPACING.sm,
        gap: 6,
    },
    addressConfirmedText: {
        fontSize: 13,
        color: '#4CAF50',
        fontWeight: '500',
    },
    searchResults: {
        marginTop: SPACING.sm,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    searchResultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.sm,
        gap: SPACING.sm,
        borderBottomWidth: 1,
    },
    searchResultText: {
        flex: 1,
        fontSize: 13,
    },

    // Instructions
    instructionsInput: {
        padding: SPACING.md,
        borderRadius: 12,
        fontSize: 14,
        minHeight: 70,
        textAlignVertical: 'top',
    },

    // Payment
    paymentGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
    },
    paymentCard: {
        width: '48%',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        gap: 10,
    },
    paymentIcon: {
        fontSize: 24,
    },
    paymentName: {
        fontSize: 13,
        fontWeight: '600',
        flex: 1,
    },
    paymentCheck: {
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    paymentCheckText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: 'bold',
    },

    // Tips
    tipGrid: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    tipCard: {
        flex: 1,
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
    },
    tipCardSelected: {
        backgroundColor: '#FF5722',
    },
    tipEmoji: {
        fontSize: 24,
        marginBottom: 4,
    },
    tipLabel: {
        fontSize: 12,
        fontWeight: '600',
    },

    // Promo
    promoRow: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    promoInput: {
        flex: 1,
        padding: 12,
        borderRadius: 12,
        fontSize: 14,
    },
    promoButton: {
        backgroundColor: '#FF5722',
        paddingHorizontal: 20,
        borderRadius: 12,
        justifyContent: 'center',
    },
    promoButtonApplied: {
        backgroundColor: '#4CAF50',
    },
    promoButtonText: {
        color: COLORS.white,
        fontWeight: '700',
    },

    // Summary
    summarySection: {},
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    summaryLabel: {
        fontSize: 14,
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: '500',
    },
    totalDivider: {
        height: 1,
        backgroundColor: '#E0E0E0',
        marginVertical: SPACING.sm,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    totalValue: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#FF5722',
    },

    // Confirm
    confirmButtonContainer: {
        position: 'absolute',
        bottom: 30,
        left: SPACING.lg,
        right: SPACING.lg,
    },
    confirmButton: {},
    confirmGradient: {
        paddingVertical: 18,
        borderRadius: 30,
        alignItems: 'center',
        shadowColor: '#FF5722',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 15,
        elevation: 8,
    },
    confirmText: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
});
