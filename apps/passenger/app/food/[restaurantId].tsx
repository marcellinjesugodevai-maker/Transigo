// =============================================
// TRANSIGO FOOD - DÉTAIL RESTAURANT (PREMIUM)
// Menu avec design appétissant
// =============================================

import { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    Alert,
    Animated,
    StatusBar,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@/components/Icon';
import { COLORS, SPACING, RADIUS } from '@/constants';
import { useThemeStore, useLanguageStore } from '@/stores';
import { getTranslation } from '@/i18n/translations';

const { width, height } = Dimensions.get('window');

// Restaurant data (simulé)
const RESTAURANT_DATA: Record<string, any> = {
    resto_1: {
        id: 'resto_1',
        name: 'Poulet Braisé Chez Tantie',
        image: '🍗',
        coverGradient: ['#FF8A65', '#FF5722', '#E64A19'],
        rating: 4.8,
        reviewCount: 234,
        deliveryTime: '25-35',
        deliveryFee: 500,
        minOrder: 2000,
        address: 'Cocody, Riviera 2, Abidjan',
        description: 'Le meilleur poulet braisé de la ville avec notre sauce secrète maison. Recette traditionnelle ivoirienne.',
        menu: [
            {
                category: '🔥 Spécialités',
                categoryEn: '🔥 Specialties',
                items: [
                    { id: 'item_1', name: 'Poulet braisé entier', nameEn: 'Whole grilled chicken', price: 5000, description: 'Poulet fermier braisé au charbon avec sauce pimentée', image: '🍗', isPopular: true, calories: '850 kcal' },
                    { id: 'item_2', name: 'Demi poulet braisé', nameEn: 'Half grilled chicken', price: 3000, description: 'Demi poulet juteux avec oignons grillés', image: '🍗', isPopular: true, calories: '425 kcal' },
                    { id: 'item_3', name: 'Cuisses de poulet (2)', nameEn: 'Chicken thighs (2)', price: 2500, description: '2 cuisses bien grillées, tendres et savoureuses', image: '🍖', isPopular: false, calories: '380 kcal' },
                    { id: 'item_10', name: 'Ailes de poulet (6)', nameEn: 'Chicken wings (6)', price: 2000, description: '6 ailes croustillantes sauce BBQ', image: '🍗', isPopular: true, calories: '320 kcal' },
                ]
            },
            {
                category: '🍚 Accompagnements',
                categoryEn: '🍚 Sides',
                items: [
                    { id: 'item_4', name: 'Attieké frais', nameEn: 'Fresh Attieké', price: 500, description: 'Semoule de manioc traditionnelle', image: '🍚', isPopular: true, calories: '180 kcal' },
                    { id: 'item_5', name: 'Alloco doré', nameEn: 'Golden fried plantain', price: 1000, description: 'Bananes plantains frites dorées', image: '🍌', isPopular: true, calories: '280 kcal' },
                    { id: 'item_6', name: 'Frites maison', nameEn: 'Homemade fries', price: 800, description: 'Pommes de terre frites croustillantes', image: '🍟', isPopular: false, calories: '220 kcal' },
                    { id: 'item_11', name: 'Riz parfumé', nameEn: 'Fragrant rice', price: 600, description: 'Riz basmati aux épices', image: '🍚', isPopular: false, calories: '200 kcal' },
                ]
            },
            {
                category: '🥤 Boissons',
                categoryEn: '🥤 Drinks',
                items: [
                    { id: 'item_7', name: 'Bissap glacé', nameEn: 'Iced hibiscus', price: 500, description: 'Jus d\'hibiscus frais et glacé', image: '🧃', isPopular: true, calories: '80 kcal' },
                    { id: 'item_8', name: 'Gingembre frais', nameEn: 'Fresh ginger juice', price: 500, description: 'Jus de gingembre maison', image: '🥤', isPopular: false, calories: '60 kcal' },
                    { id: 'item_9', name: 'Eau minérale 1.5L', nameEn: 'Mineral water 1.5L', price: 300, description: 'Eau fraîche', image: '💧', isPopular: false, calories: '0 kcal' },
                ]
            }
        ]
    },
    resto_2: {
        id: 'resto_2',
        name: 'Pizza Express Abidjan',
        image: '🍕',
        coverGradient: ['#FFAB91', '#FF8A65', '#FF5722'],
        rating: 4.5,
        reviewCount: 189,
        deliveryTime: '30-45',
        deliveryFee: 750,
        minOrder: 3000,
        address: 'Zone 4, Marcory, Abidjan',
        description: 'Pizzas artisanales cuites au feu de bois avec des ingrédients frais importés d\'Italie.',
        menu: [
            {
                category: '🍕 Pizzas Classiques',
                categoryEn: '🍕 Classic Pizzas',
                items: [
                    { id: 'pizza_1', name: 'Margherita', nameEn: 'Margherita', price: 4500, description: 'Tomate, mozzarella di bufala, basilic frais', image: '🍕', isPopular: true, calories: '680 kcal' },
                    { id: 'pizza_2', name: 'Pepperoni', nameEn: 'Pepperoni', price: 5500, description: 'Double pepperoni, mozzarella fondante', image: '🍕', isPopular: true, calories: '820 kcal' },
                    { id: 'pizza_3', name: '4 Fromages', nameEn: '4 Cheese', price: 6000, description: 'Mozzarella, gorgonzola, parmesan, chèvre', image: '🧀', isPopular: false, calories: '920 kcal' },
                ]
            },
            {
                category: '🥤 Boissons',
                categoryEn: '🥤 Drinks',
                items: [
                    { id: 'drink_1', name: 'Coca-Cola', nameEn: 'Coca-Cola', price: 500, description: '33cl glacé', image: '🥤', isPopular: false, calories: '140 kcal' },
                    { id: 'drink_2', name: 'Fanta Orange', nameEn: 'Fanta Orange', price: 500, description: '33cl', image: '🍊', isPopular: false, calories: '130 kcal' },
                ]
            }
        ]
    },
    resto_3: {
        id: 'resto_3',
        name: 'Burger King CI',
        image: '🍔',
        coverGradient: ['#FFD54F', '#FFC107', '#FF9800'],
        rating: 4.3,
        reviewCount: 521,
        deliveryTime: '20-30',
        deliveryFee: 600,
        minOrder: 2500,
        address: 'Plateau, Centre-ville, Abidjan',
        description: 'Burgers juteux préparés avec du bœuf 100% frais et des ingrédients premium.',
        menu: [
            {
                category: '🍔 Burgers Premium',
                categoryEn: '🍔 Premium Burgers',
                items: [
                    { id: 'burger_1', name: 'Classic Burger', nameEn: 'Classic Burger', price: 3500, description: 'Bœuf 150g, salade, tomate, oignon, sauce maison', image: '🍔', isPopular: true, calories: '650 kcal' },
                    { id: 'burger_2', name: 'Double Cheese', nameEn: 'Double Cheese', price: 4500, description: '2 steaks, double cheddar fondu, bacon', image: '🍔', isPopular: true, calories: '980 kcal' },
                    { id: 'burger_3', name: 'Chicken Burger', nameEn: 'Chicken Burger', price: 3000, description: 'Filet de poulet pané croustillant', image: '🍔', isPopular: false, calories: '580 kcal' },
                ]
            },
            {
                category: '🍟 Accompagnements',
                categoryEn: '🍟 Sides',
                items: [
                    { id: 'side_1', name: 'Frites XL', nameEn: 'XL Fries', price: 1000, description: 'Portion extra généreuse', image: '🍟', isPopular: true, calories: '420 kcal' },
                    { id: 'side_2', name: 'Nuggets (6)', nameEn: 'Nuggets (6)', price: 1500, description: '6 nuggets croustillants + sauce', image: '🍗', isPopular: false, calories: '280 kcal' },
                ]
            }
        ]
    }
};

// Default
const DEFAULT_RESTAURANT = {
    id: 'default',
    name: 'Restaurant',
    image: '🍽️',
    coverGradient: ['#9E9E9E', '#757575'],
    rating: 4.0,
    reviewCount: 0,
    deliveryTime: '30-45',
    deliveryFee: 500,
    minOrder: 2000,
    address: 'Abidjan',
    description: 'Restaurant partenaire TransiGo Food',
    menu: []
};

type CartItem = {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
};

export default function RestaurantDetailScreen() {
    const params = useLocalSearchParams();
    const { isDark, colors } = useThemeStore();
    const { language } = useLanguageStore();
    const t = (key: any) => getTranslation(key, language);

    const restaurantId = params.restaurantId as string;
    const restaurant = RESTAURANT_DATA[restaurantId] || DEFAULT_RESTAURANT;

    const [cart, setCart] = useState<CartItem[]>([]);
    const [activeSection, setActiveSection] = useState(0);
    const scrollY = useRef(new Animated.Value(0)).current;

    const addToCart = (item: any) => {
        const existing = cart.find(c => c.id === item.id);
        if (existing) {
            setCart(cart.map(c =>
                c.id === item.id
                    ? { ...c, quantity: c.quantity + 1 }
                    : c
            ));
        } else {
            setCart([...cart, {
                id: item.id,
                name: language === 'fr' ? item.name : item.nameEn,
                price: item.price,
                quantity: 1,
                image: item.image
            }]);
        }
    };

    const removeFromCart = (itemId: string) => {
        const existing = cart.find(c => c.id === itemId);
        if (existing && existing.quantity > 1) {
            setCart(cart.map(c =>
                c.id === itemId
                    ? { ...c, quantity: c.quantity - 1 }
                    : c
            ));
        } else {
            setCart(cart.filter(c => c.id !== itemId));
        }
    };

    const getItemQuantity = (itemId: string) => {
        return cart.find(c => c.id === itemId)?.quantity || 0;
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    const handleViewCart = () => {
        if (cartTotal < restaurant.minOrder) {
            Alert.alert(
                language === 'fr' ? '⚠️ Commande minimum' : '⚠️ Minimum order',
                language === 'fr'
                    ? `Le minimum de commande est ${restaurant.minOrder.toLocaleString('fr-FR')} FCFA`
                    : `Minimum order is ${restaurant.minOrder.toLocaleString('fr-FR')} FCFA`
            );
            return;
        }
        router.push({
            pathname: '/food/cart',
            params: {
                restaurant_id: restaurant.id,
                restaurant_name: restaurant.name,
                restaurant_image: restaurant.image,
                delivery_fee: restaurant.deliveryFee,
                delivery_time: restaurant.deliveryTime,
                cart: JSON.stringify(cart)
            }
        });
    };

    // Header qui change avec le scroll
    const headerOpacity = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="light-content" />

            {/* Header fixe (apparaît au scroll) */}
            <Animated.View style={[styles.fixedHeader, { opacity: headerOpacity, backgroundColor: colors.card }]}>
                <TouchableOpacity
                    style={[styles.fixedBackButton, { backgroundColor: isDark ? '#333' : '#F5F5F5' }]}
                    onPress={() => router.back()}
                >
                    <Icon name="arrow-back" size={22} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.fixedHeaderTitle, { color: colors.text }]} numberOfLines={1}>
                    {restaurant.name}
                </Text>
                <View style={styles.fixedHeaderRight} />
            </Animated.View>

            <Animated.ScrollView
                showsVerticalScrollIndicator={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: true }
                )}
                scrollEventThrottle={16}
            >
                {/* Cover with gradient */}
                <LinearGradient
                    colors={restaurant.coverGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.coverImage}
                >
                    {/* Back button */}
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Icon name="arrow-back" size={24} color={COLORS.white} />
                    </TouchableOpacity>

                    {/* Restaurant emoji */}
                    <View style={styles.coverContent}>
                        <Text style={styles.coverEmoji}>{restaurant.image}</Text>
                    </View>

                    {/* Delivery badge */}
                    <View style={styles.deliveryBadge}>
                        <Text style={styles.deliveryBadgeText}>
                            ⏱️ {restaurant.deliveryTime} min
                        </Text>
                    </View>
                </LinearGradient>

                {/* Restaurant Info Card */}
                <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
                    <Text style={[styles.restaurantName, { color: colors.text }]}>
                        {restaurant.name}
                    </Text>

                    <Text style={[styles.restaurantDescription, { color: colors.textSecondary }]}>
                        {restaurant.description}
                    </Text>

                    {/* Stats Row */}
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <View style={[styles.statIcon, { backgroundColor: '#FFF3E0' }]}>
                                <Text style={styles.statEmoji}>⭐</Text>
                            </View>
                            <View>
                                <Text style={[styles.statValue, { color: colors.text }]}>{restaurant.rating}</Text>
                                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                                    ({restaurant.reviewCount} avis)
                                </Text>
                            </View>
                        </View>

                        <View style={styles.statDivider} />

                        <View style={styles.statItem}>
                            <View style={[styles.statIcon, { backgroundColor: '#E3F2FD' }]}>
                                <Text style={styles.statEmoji}>🚚</Text>
                            </View>
                            <View>
                                <Text style={[styles.statValue, { color: colors.text }]}>{restaurant.deliveryFee} F</Text>
                                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                                    {language === 'fr' ? 'Livraison' : 'Delivery'}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.statDivider} />

                        <View style={styles.statItem}>
                            <View style={[styles.statIcon, { backgroundColor: '#F3E5F5' }]}>
                                <Text style={styles.statEmoji}>💰</Text>
                            </View>
                            <View>
                                <Text style={[styles.statValue, { color: colors.text }]}>{restaurant.minOrder} F</Text>
                                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                                    {language === 'fr' ? 'Min.' : 'Min.'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Address */}
                    <View style={styles.addressRow}>
                        <Icon name="location" size={16} color="#FF5722" />
                        <Text style={[styles.addressText, { color: colors.textSecondary }]}>
                            {restaurant.address}
                        </Text>
                    </View>
                </View>

                {/* Menu Sections Navigation */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.menuNav}
                >
                    {restaurant.menu.map((section: any, index: number) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.menuNavItem,
                                activeSection === index && styles.menuNavItemActive
                            ]}
                            onPress={() => setActiveSection(index)}
                        >
                            <Text style={[
                                styles.menuNavText,
                                { color: activeSection === index ? '#FF5722' : colors.textSecondary }
                            ]}>
                                {language === 'fr' ? section.category : section.categoryEn}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Menu Items */}
                <View style={styles.menuContainer}>
                    {restaurant.menu.map((section: any, sectionIndex: number) => (
                        <View key={sectionIndex} style={styles.menuSection}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                {language === 'fr' ? section.category : section.categoryEn}
                            </Text>

                            {section.items.map((item: any) => {
                                const quantity = getItemQuantity(item.id);
                                return (
                                    <View
                                        key={item.id}
                                        style={[styles.menuItem, { backgroundColor: colors.card }]}
                                    >
                                        {/* Item image */}
                                        <View style={styles.menuItemImage}>
                                            <LinearGradient
                                                colors={[isDark ? '#333' : '#F8F8F8', isDark ? '#252525' : '#F0F0F0']}
                                                style={styles.menuItemImageGradient}
                                            >
                                                <Text style={styles.menuItemEmoji}>{item.image}</Text>
                                            </LinearGradient>
                                            {item.isPopular && (
                                                <View style={styles.popularBadge}>
                                                    <Text style={styles.popularBadgeText}>🔥</Text>
                                                </View>
                                            )}
                                        </View>

                                        {/* Item info */}
                                        <View style={styles.menuItemInfo}>
                                            <Text style={[styles.menuItemName, { color: colors.text }]}>
                                                {language === 'fr' ? item.name : item.nameEn}
                                            </Text>
                                            <Text style={[styles.menuItemDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                                                {item.description}
                                            </Text>
                                            <View style={styles.menuItemFooter}>
                                                <Text style={styles.menuItemPrice}>
                                                    {item.price.toLocaleString('fr-FR')} F
                                                </Text>
                                                {item.calories && (
                                                    <Text style={[styles.menuItemCalories, { color: colors.textSecondary }]}>
                                                        • {item.calories}
                                                    </Text>
                                                )}
                                            </View>
                                        </View>

                                        {/* Add to cart */}
                                        <View style={styles.quantityControls}>
                                            {quantity > 0 ? (
                                                <View style={styles.quantityRow}>
                                                    <TouchableOpacity
                                                        style={styles.quantityButton}
                                                        onPress={() => removeFromCart(item.id)}
                                                    >
                                                        <Text style={styles.quantityButtonText}>−</Text>
                                                    </TouchableOpacity>
                                                    <Text style={[styles.quantityText, { color: colors.text }]}>
                                                        {quantity}
                                                    </Text>
                                                    <TouchableOpacity
                                                        style={[styles.quantityButton, styles.quantityButtonAdd]}
                                                        onPress={() => addToCart(item)}
                                                    >
                                                        <Text style={styles.quantityButtonTextAdd}>+</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            ) : (
                                                <TouchableOpacity
                                                    style={styles.addButton}
                                                    onPress={() => addToCart(item)}
                                                >
                                                    <Icon name="add" size={20} color={COLORS.white} />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    ))}
                </View>

                <View style={{ height: 120 }} />
            </Animated.ScrollView>

            {/* Cart button */}
            {cartCount > 0 && (
                <View style={styles.cartButtonContainer}>
                    <TouchableOpacity
                        style={styles.cartButton}
                        onPress={handleViewCart}
                        activeOpacity={0.95}
                    >
                        <LinearGradient
                            colors={['#FF5722', '#E64A19']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.cartGradient}
                        >
                            <View style={styles.cartBadge}>
                                <Text style={styles.cartBadgeText}>{cartCount}</Text>
                            </View>
                            <Text style={styles.cartText}>
                                {language === 'fr' ? 'Voir le panier' : 'View cart'}
                            </Text>
                            <Text style={styles.cartTotal}>
                                {cartTotal.toLocaleString('fr-FR')} F
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
    },

    // Fixed header
    fixedHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 50,
        paddingBottom: 12,
        paddingHorizontal: SPACING.lg,
    },
    fixedBackButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fixedHeaderTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        marginHorizontal: SPACING.md,
    },
    fixedHeaderRight: {
        width: 40,
    },

    // Cover
    coverImage: {
        height: 220,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: SPACING.lg,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    coverContent: {
        alignItems: 'center',
    },
    coverEmoji: {
        fontSize: 80,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 12,
    },
    deliveryBadge: {
        position: 'absolute',
        bottom: 15,
        right: 15,
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
    },
    deliveryBadgeText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '600',
    },

    // Info card
    infoCard: {
        marginTop: -30,
        marginHorizontal: SPACING.lg,
        borderRadius: 20,
        padding: SPACING.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 5,
    },
    restaurantName: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    restaurantDescription: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: SPACING.md,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    statItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statEmoji: {
        fontSize: 16,
    },
    statValue: {
        fontSize: 14,
        fontWeight: '700',
    },
    statLabel: {
        fontSize: 11,
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: '#E0E0E0',
        marginHorizontal: 8,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    addressText: {
        fontSize: 13,
        flex: 1,
    },

    // Menu navigation
    menuNav: {
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        gap: SPACING.sm,
    },
    menuNavItem: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: 'transparent',
        marginRight: SPACING.sm,
    },
    menuNavItemActive: {
        backgroundColor: '#FFF3E0',
    },
    menuNavText: {
        fontSize: 14,
        fontWeight: '600',
    },

    // Menu
    menuContainer: {
        paddingHorizontal: SPACING.lg,
    },
    menuSection: {
        marginBottom: SPACING.lg,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: SPACING.md,
    },
    menuItem: {
        flexDirection: 'row',
        padding: SPACING.sm,
        borderRadius: 16,
        marginBottom: SPACING.sm,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    menuItemImage: {
        width: 80,
        height: 80,
        borderRadius: 12,
        overflow: 'hidden',
    },
    menuItemImageGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuItemEmoji: {
        fontSize: 40,
    },
    popularBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#FF5722',
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    popularBadgeText: {
        fontSize: 12,
    },
    menuItemInfo: {
        flex: 1,
        marginLeft: SPACING.sm,
        justifyContent: 'center',
    },
    menuItemName: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 4,
    },
    menuItemDesc: {
        fontSize: 12,
        lineHeight: 16,
        marginBottom: 6,
    },
    menuItemFooter: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuItemPrice: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#FF5722',
    },
    menuItemCalories: {
        fontSize: 11,
        marginLeft: 8,
    },

    // Quantity
    quantityControls: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    quantityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    quantityButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F0F0F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    quantityButtonAdd: {
        backgroundColor: '#FF5722',
    },
    quantityButtonText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#666',
    },
    quantityButtonTextAdd: {
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
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FF5722',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Cart button
    cartButtonContainer: {
        position: 'absolute',
        bottom: 30,
        left: SPACING.lg,
        right: SPACING.lg,
    },
    cartButton: {},
    cartGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 30,
        shadowColor: '#FF5722',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 15,
        elevation: 8,
    },
    cartBadge: {
        backgroundColor: COLORS.white,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cartBadgeText: {
        color: '#FF5722',
        fontWeight: 'bold',
        fontSize: 15,
    },
    cartText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
    },
    cartTotal: {
        color: COLORS.white,
        fontSize: 17,
        fontWeight: 'bold',
    },
});
