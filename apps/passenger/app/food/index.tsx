// =============================================
// TRANSIGO FOOD - LISTE DES RESTAURANTS (PREMIUM)
// Design moderne avec animations et promos
// =============================================

import { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Dimensions,
    Animated,
    StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@/components/Icon';
import { COLORS, SPACING, RADIUS } from '@/constants';
import { useThemeStore, useLanguageStore } from '@/stores';
import { getTranslation } from '@/i18n/translations';

const { width } = Dimensions.get('window');

// Catégories de restaurants
const CATEGORIES = [
    { id: 'all', name: 'Tout', nameEn: 'All', icon: '🍽️', gradient: ['#FF5722', '#E64A19'] },
    { id: 'fast-food', name: 'Fast-food', nameEn: 'Fast-food', icon: '🍔', gradient: ['#FFC107', '#FF9800'] },
    { id: 'african', name: 'Africain', nameEn: 'African', icon: '🍲', gradient: ['#8BC34A', '#4CAF50'] },
    { id: 'asian', name: 'Asiatique', nameEn: 'Asian', icon: '🍜', gradient: ['#E91E63', '#C2185B'] },
    { id: 'pizza', name: 'Pizza', nameEn: 'Pizza', icon: '🍕', gradient: ['#FF5722', '#BF360C'] },
    { id: 'grill', name: 'Grillades', nameEn: 'Grill', icon: '🍖', gradient: ['#795548', '#5D4037'] },
    { id: 'dessert', name: 'Desserts', nameEn: 'Desserts', icon: '🍰', gradient: ['#9C27B0', '#7B1FA2'] },
    { id: 'drinks', name: 'Boissons', nameEn: 'Drinks', icon: '🥤', gradient: ['#00BCD4', '#0097A7'] },
];

// Promos du moment
const PROMOS = [
    { id: 'promo1', title: '🔥 -30% Aujourd\'hui', titleEn: '🔥 -30% Today', subtitle: 'Sur tous les burgers', subtitleEn: 'On all burgers', gradient: ['#FF5722', '#FF9800'] },
    { id: 'promo2', title: '🎁 Livraison Offerte', titleEn: '🎁 Free Delivery', subtitle: 'Première commande', subtitleEn: 'First order', gradient: ['#4CAF50', '#8BC34A'] },
    { id: 'promo3', title: '🌙 Menu Nuit -20%', titleEn: '🌙 Night Menu -20%', subtitle: 'De 22h à 6h', subtitleEn: 'From 10PM to 6AM', gradient: ['#673AB7', '#9C27B0'] },
];

// Restaurants simulés avec plus de détails
const RESTAURANTS = [
    {
        id: 'resto_1',
        name: 'Poulet Braisé Chez Tantie',
        category: 'african',
        image: '🍗',
        coverGradient: ['#FF8A65', '#FF5722'],
        rating: 4.8,
        reviewCount: 234,
        deliveryTime: '25-35',
        deliveryFee: 500,
        minOrder: 2000,
        distance: 1.2,
        isOpen: true,
        isPromo: true,
        promoText: '-20%',
        tags: ['Poulet', 'Braisé', 'Attieké'],
        featured: true,
    },
    {
        id: 'resto_2',
        name: 'Pizza Express Abidjan',
        category: 'pizza',
        image: '🍕',
        coverGradient: ['#FFAB91', '#FF5722'],
        rating: 4.5,
        reviewCount: 189,
        deliveryTime: '30-45',
        deliveryFee: 750,
        minOrder: 3000,
        distance: 2.5,
        isOpen: true,
        isPromo: false,
        promoText: '',
        tags: ['Pizza', 'Italien', 'Pâtes'],
        featured: false,
    },
    {
        id: 'resto_3',
        name: 'Burger King CI',
        category: 'fast-food',
        image: '🍔',
        coverGradient: ['#FFD54F', '#FF9800'],
        rating: 4.3,
        reviewCount: 521,
        deliveryTime: '20-30',
        deliveryFee: 600,
        minOrder: 2500,
        distance: 0.8,
        isOpen: true,
        isPromo: true,
        promoText: 'Menu offert',
        featured: true,
    },
    {
        id: 'resto_4',
        name: 'Sushi Palace',
        category: 'asian',
        image: '🍣',
        coverGradient: ['#F48FB1', '#E91E63'],
        rating: 4.7,
        reviewCount: 156,
        deliveryTime: '35-50',
        deliveryFee: 1000,
        minOrder: 5000,
        distance: 3.2,
        isOpen: true,
        isPromo: false,
        promoText: '',
        tags: ['Sushi', 'Japonais'],
        featured: false,
    },
    {
        id: 'resto_5',
        name: 'Le Maquis du Plateau',
        category: 'african',
        image: '🍲',
        coverGradient: ['#A5D6A7', '#4CAF50'],
        rating: 4.9,
        reviewCount: 412,
        deliveryTime: '30-40',
        deliveryFee: 500,
        minOrder: 1500,
        distance: 1.8,
        isOpen: true,
        isPromo: false,
        promoText: '',
        tags: ['Ivoirien', 'Foutou', 'Sauce graine'],
        featured: true,
    },
    {
        id: 'resto_6',
        name: 'Grillades du Sud',
        category: 'grill',
        image: '🥩',
        coverGradient: ['#A1887F', '#795548'],
        rating: 4.6,
        reviewCount: 287,
        deliveryTime: '25-35',
        deliveryFee: 700,
        minOrder: 3000,
        distance: 2.1,
        isOpen: false,
        isPromo: false,
        promoText: '',
        tags: ['Viande', 'Brochettes', 'BBQ'],
        featured: false,
    },
];

export default function FoodScreen() {
    const { isDark, colors } = useThemeStore();
    const { language } = useLanguageStore();
    const t = (key: any) => getTranslation(key, language);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [sortBy, setSortBy] = useState<'rating' | 'distance' | 'time'>('rating');

    // Animations
    const scrollY = useRef(new Animated.Value(0)).current;
    const promoScrollX = useRef(new Animated.Value(0)).current;

    // Filtrer et trier les restaurants
    const filteredRestaurants = RESTAURANTS
        .filter(r => {
            const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesCategory = selectedCategory === 'all' || r.category === selectedCategory;
            return matchesSearch && matchesCategory;
        })
        .sort((a, b) => {
            if (sortBy === 'rating') return b.rating - a.rating;
            if (sortBy === 'distance') return a.distance - b.distance;
            if (sortBy === 'time') return parseInt(a.deliveryTime) - parseInt(b.deliveryTime);
            return 0;
        });

    const featuredRestaurants = RESTAURANTS.filter(r => r.featured && r.isOpen);

    const handleRestaurantPress = (restaurant: typeof RESTAURANTS[0]) => {
        if (!restaurant.isOpen) return;
        router.push({
            pathname: '/food/[restaurantId]',
            params: { restaurantId: restaurant.id }
        });
    };

    // Carte restaurant premium
    const renderRestaurantCard = (restaurant: typeof RESTAURANTS[0], isFeatured = false) => (
        <TouchableOpacity
            key={restaurant.id}
            style={[
                isFeatured ? styles.featuredCard : styles.restaurantCard,
                { backgroundColor: colors.card },
                !restaurant.isOpen && styles.restaurantCardClosed
            ]}
            onPress={() => handleRestaurantPress(restaurant)}
            activeOpacity={0.95}
        >
            {/* Cover avec gradient */}
            <LinearGradient
                colors={restaurant.coverGradient as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={isFeatured ? styles.featuredCover : styles.restaurantCover}
            >
                <Text style={isFeatured ? styles.featuredEmoji : styles.restaurantEmoji}>
                    {restaurant.image}
                </Text>

                {/* Badge promo */}
                {restaurant.isPromo && (
                    <View style={styles.promoBadge}>
                        <Text style={styles.promoBadgeText}>{restaurant.promoText}</Text>
                    </View>
                )}

                {/* Badge fermé */}
                {!restaurant.isOpen && (
                    <View style={styles.closedOverlay}>
                        <View style={styles.closedBadge}>
                            <Text style={styles.closedText}>
                                {language === 'fr' ? 'Fermé' : 'Closed'}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Badge temps de livraison */}
                <View style={styles.deliveryTimeBadge}>
                    <Text style={styles.deliveryTimeIcon}>⏱️</Text>
                    <Text style={styles.deliveryTimeText}>{restaurant.deliveryTime} min</Text>
                </View>
            </LinearGradient>

            {/* Infos */}
            <View style={styles.restaurantInfo}>
                <View style={styles.restaurantHeader}>
                    <Text style={[styles.restaurantName, { color: colors.text }]} numberOfLines={1}>
                        {restaurant.name}
                    </Text>
                    <View style={styles.ratingBadge}>
                        <Text style={styles.ratingText}>⭐ {restaurant.rating}</Text>
                    </View>
                </View>

                <View style={styles.metaRow}>
                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                        📍 {restaurant.distance} km
                    </Text>
                    <Text style={[styles.metaDot, { color: colors.textSecondary }]}>•</Text>
                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                        🚚 {restaurant.deliveryFee} F
                    </Text>
                    <Text style={[styles.metaDot, { color: colors.textSecondary }]}>•</Text>
                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                        ({restaurant.reviewCount} avis)
                    </Text>
                </View>

                {/* Tags */}
                <View style={styles.tagsRow}>
                    {restaurant.tags?.slice(0, 3).map((tag, index) => (
                        <View key={index} style={[styles.tag, { backgroundColor: isDark ? '#333' : '#F0F0F0' }]}>
                            <Text style={[styles.tagText, { color: colors.textSecondary }]}>{tag}</Text>
                        </View>
                    ))}
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="light-content" />

            {/* Header Premium */}
            <LinearGradient
                colors={['#FF5722', '#E64A19', '#BF360C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <View style={styles.headerTop}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Icon name="arrow-left" size={24} color={COLORS.white} />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle}>🍔 TransiGo Food</Text>
                        <Text style={styles.headerSubtitle}>
                            {language === 'fr' ? 'Faites-vous livrer en un clic' : 'Get delivered in one click'}
                        </Text>
                    </View>
                    <TouchableOpacity style={styles.cartIconButton}>
                        <Icon name="cart-outline" size={24} color={COLORS.white} />
                    </TouchableOpacity>
                </View>

                {/* Barre de recherche */}
                <View style={styles.searchContainer}>
                    <View style={styles.searchBar}>
                        <Icon name="search" size={20} color="#666" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder={language === 'fr' ? 'Pizza, burger, africain...' : 'Pizza, burger, african...'}
                            placeholderTextColor="#999"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Icon name="close-circle" size={20} color="#999" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </LinearGradient>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Promos carousel */}
                <View style={styles.promosSection}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.promosScroll}
                        pagingEnabled
                        snapToInterval={width - 60}
                        decelerationRate="fast"
                    >
                        {PROMOS.map((promo) => (
                            <TouchableOpacity key={promo.id} activeOpacity={0.9}>
                                <LinearGradient
                                    colors={promo.gradient as any}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.promoCard}
                                >
                                    <Text style={styles.promoTitle}>
                                        {language === 'fr' ? promo.title : promo.titleEn}
                                    </Text>
                                    <Text style={styles.promoSubtitle}>
                                        {language === 'fr' ? promo.subtitle : promo.subtitleEn}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Catégories */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        {language === 'fr' ? '🍽️ Catégories' : '🍽️ Categories'}
                    </Text>
                </View>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoriesContainer}
                >
                    {CATEGORIES.map((category) => {
                        const isSelected = selectedCategory === category.id;
                        return (
                            <TouchableOpacity
                                key={category.id}
                                onPress={() => setSelectedCategory(category.id)}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={isSelected ? category.gradient as any : [isDark ? '#333' : '#F5F5F5', isDark ? '#333' : '#F5F5F5']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.categoryChip}
                                >
                                    <Text style={styles.categoryIcon}>{category.icon}</Text>
                                    <Text style={[
                                        styles.categoryName,
                                        { color: isSelected ? COLORS.white : colors.text }
                                    ]}>
                                        {language === 'fr' ? category.name : category.nameEn}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* Restaurants populaires */}
                {selectedCategory === 'all' && featuredRestaurants.length > 0 && (
                    <>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                🔥 {language === 'fr' ? 'Populaires' : 'Popular'}
                            </Text>
                            <TouchableOpacity>
                                <Text style={styles.seeAllText}>
                                    {language === 'fr' ? 'Voir tout' : 'See all'} →
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.featuredScroll}
                        >
                            {featuredRestaurants.map((restaurant) => renderRestaurantCard(restaurant, true))}
                        </ScrollView>
                    </>
                )}

                {/* Tri */}
                <View style={styles.sortContainer}>
                    <Text style={[styles.sortLabel, { color: colors.textSecondary }]}>
                        {language === 'fr' ? 'Trier:' : 'Sort:'}
                    </Text>
                    {[
                        { key: 'rating', label: '⭐ Note', labelEn: '⭐ Rating' },
                        { key: 'distance', label: '📍 Proche', labelEn: '📍 Near' },
                        { key: 'time', label: '⚡ Rapide', labelEn: '⚡ Fast' },
                    ].map((sort) => (
                        <TouchableOpacity
                            key={sort.key}
                            style={[
                                styles.sortButton,
                                sortBy === sort.key && styles.sortButtonActive
                            ]}
                            onPress={() => setSortBy(sort.key as any)}
                        >
                            <Text style={[
                                styles.sortButtonText,
                                { color: sortBy === sort.key ? COLORS.white : colors.textSecondary }
                            ]}>
                                {language === 'fr' ? sort.label : sort.labelEn}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Liste des restaurants */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        🏪 {filteredRestaurants.length} {language === 'fr' ? 'Restaurants' : 'Restaurants'}
                    </Text>
                </View>
                <View style={styles.restaurantsGrid}>
                    {filteredRestaurants.map((restaurant) => renderRestaurantCard(restaurant, false))}
                </View>

                {/* Vide */}
                {filteredRestaurants.length === 0 && (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyEmoji}>🍽️</Text>
                        <Text style={[styles.emptyText, { color: colors.text }]}>
                            {language === 'fr' ? 'Aucun restaurant trouvé' : 'No restaurant found'}
                        </Text>
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

    // Header
    header: {
        paddingTop: 50,
        paddingBottom: SPACING.lg,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        marginBottom: SPACING.md,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleContainer: {
        flex: 1,
        marginLeft: SPACING.md,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    headerSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 2,
    },
    cartIconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Search
    searchContainer: {
        paddingHorizontal: SPACING.lg,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        paddingHorizontal: SPACING.md,
        paddingVertical: 14,
        borderRadius: 16,
        gap: SPACING.sm,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 5,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#1A1A1A',
    },

    scrollContent: {
        paddingTop: SPACING.md,
    },

    // Promos
    promosSection: {
        marginBottom: SPACING.md,
    },
    promosScroll: {
        paddingHorizontal: SPACING.lg,
        gap: SPACING.md,
    },
    promoCard: {
        width: width - 60,
        height: 100,
        borderRadius: 16,
        padding: SPACING.lg,
        justifyContent: 'center',
        marginRight: SPACING.md,
    },
    promoTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    promoSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 4,
    },

    // Section headers
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        marginTop: SPACING.md,
        marginBottom: SPACING.sm,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    seeAllText: {
        fontSize: 14,
        color: '#FF5722',
        fontWeight: '600',
    },

    // Categories
    categoriesContainer: {
        paddingHorizontal: SPACING.lg,
        gap: SPACING.sm,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 25,
        marginRight: SPACING.sm,
        gap: 8,
    },
    categoryIcon: {
        fontSize: 20,
    },
    categoryName: {
        fontSize: 14,
        fontWeight: '600',
    },

    // Featured
    featuredScroll: {
        paddingHorizontal: SPACING.lg,
    },
    featuredCard: {
        width: 220,
        borderRadius: 16,
        marginRight: SPACING.md,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 5,
    },
    featuredCover: {
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
    },
    featuredEmoji: {
        fontSize: 50,
    },

    // Sort
    sortContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        marginTop: SPACING.md,
        gap: SPACING.xs,
    },
    sortLabel: {
        fontSize: 13,
        marginRight: SPACING.xs,
    },
    sortButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 15,
        backgroundColor: 'transparent',
    },
    sortButtonActive: {
        backgroundColor: '#FF5722',
    },
    sortButtonText: {
        fontSize: 12,
        fontWeight: '500',
    },

    // Restaurants
    restaurantsGrid: {
        paddingHorizontal: SPACING.lg,
    },
    restaurantCard: {
        borderRadius: 16,
        marginBottom: SPACING.md,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    restaurantCardClosed: {
        opacity: 0.6,
    },
    restaurantCover: {
        height: 140,
        justifyContent: 'center',
        alignItems: 'center',
    },
    restaurantEmoji: {
        fontSize: 60,
    },
    promoBadge: {
        position: 'absolute',
        top: 12,
        left: 12,
        backgroundColor: '#FF1744',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    promoBadgeText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: 'bold',
    },
    deliveryTimeBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 20,
        gap: 4,
    },
    deliveryTimeIcon: {
        fontSize: 12,
    },
    deliveryTimeText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: '600',
    },
    closedOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closedBadge: {
        backgroundColor: '#FF1744',
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 20,
    },
    closedText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: 'bold',
    },
    restaurantInfo: {
        padding: SPACING.md,
    },
    restaurantHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    restaurantName: {
        fontSize: 16,
        fontWeight: '700',
        flex: 1,
        marginRight: SPACING.sm,
    },
    ratingBadge: {
        backgroundColor: '#FFF3E0',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 12,
    },
    ratingText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#FF5722',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    metaText: {
        fontSize: 12,
    },
    metaDot: {
        marginHorizontal: 6,
    },
    tagsRow: {
        flexDirection: 'row',
        gap: 6,
    },
    tag: {
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 12,
    },
    tagText: {
        fontSize: 11,
        fontWeight: '500',
    },

    // Empty
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyEmoji: {
        fontSize: 60,
        marginBottom: SPACING.md,
    },
    emptyText: {
        fontSize: 16,
    },
});
