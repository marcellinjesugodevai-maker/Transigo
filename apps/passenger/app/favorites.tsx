// =============================================
// TRANSIGO - MES FAVORIS
// Chauffeurs et Restaurants préférés
// =============================================

import { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@/components/Icon';
import { COLORS, SPACING, RADIUS } from '@/constants';
import { useThemeStore, useLanguageStore } from '@/stores';
import { getTranslation } from '@/i18n/translations';

// Données simulées
const FAVORITE_DRIVERS = [
    { id: 'd1', name: 'Koné Ibrahim', avatar: '👨🏾', rating: 4.9, rides: 12, vehicle: 'Toyota Corolla', plate: 'AB-1234-CI' },
    { id: 'd2', name: 'Diallo Mamadou', avatar: '👨🏿', rating: 4.8, rides: 8, vehicle: 'Honda Civic', plate: 'CD-5678-CI' },
    { id: 'd3', name: 'Ouattara Fatou', avatar: '👩🏾', rating: 4.7, rides: 5, vehicle: 'Hyundai Accent', plate: 'EF-9012-CI' },
];

const FAVORITE_RESTAURANTS = [
    { id: 'r1', name: 'Poulet Braisé Chez Tantie', emoji: '🍗', rating: 4.8, orders: 8, category: 'Africain' },
    { id: 'r2', name: 'Pizza Express Abidjan', emoji: '🍕', rating: 4.5, orders: 5, category: 'Italien' },
    { id: 'r3', name: 'Burger King CI', emoji: '🍔', rating: 4.3, orders: 6, category: 'Fast-food' },
    { id: 'r4', name: 'Sushi Palace', emoji: '🍣', rating: 4.7, orders: 3, category: 'Japonais' },
];

type TabType = 'drivers' | 'restaurants';

export default function FavoritesScreen() {
    const { isDark, colors } = useThemeStore();
    const { language } = useLanguageStore();
    const t = (key: any) => getTranslation(key, language);

    const [activeTab, setActiveTab] = useState<TabType>('drivers');
    const [drivers, setDrivers] = useState(FAVORITE_DRIVERS);
    const [restaurants, setRestaurants] = useState(FAVORITE_RESTAURANTS);

    const handleRemoveDriver = (id: string) => {
        Alert.alert(
            language === 'fr' ? 'Retirer des favoris ?' : 'Remove from favorites?',
            language === 'fr' ? 'Ce chauffeur ne sera plus dans vos favoris.' : 'This driver will be removed from your favorites.',
            [
                { text: language === 'fr' ? 'Annuler' : 'Cancel', style: 'cancel' },
                { text: language === 'fr' ? 'Retirer' : 'Remove', style: 'destructive', onPress: () => setDrivers(drivers.filter(d => d.id !== id)) },
            ]
        );
    };

    const handleRemoveRestaurant = (id: string) => {
        Alert.alert(
            language === 'fr' ? 'Retirer des favoris ?' : 'Remove from favorites?',
            language === 'fr' ? 'Ce restaurant ne sera plus dans vos favoris.' : 'This restaurant will be removed from your favorites.',
            [
                { text: language === 'fr' ? 'Annuler' : 'Cancel', style: 'cancel' },
                { text: language === 'fr' ? 'Retirer' : 'Remove', style: 'destructive', onPress: () => setRestaurants(restaurants.filter(r => r.id !== id)) },
            ]
        );
    };

    const handleRequestDriver = (driver: typeof FAVORITE_DRIVERS[0]) => {
        Alert.alert(
            `🚗 ${driver.name}`,
            language === 'fr'
                ? 'Demander ce chauffeur pour votre prochaine course ?'
                : 'Request this driver for your next ride?',
            [
                { text: language === 'fr' ? 'Annuler' : 'Cancel', style: 'cancel' },
                {
                    text: language === 'fr' ? 'Demander' : 'Request',
                    onPress: () => {
                        router.push({
                            pathname: '/(tabs)/home',
                            params: { preferred_driver: driver.id }
                        });
                    }
                },
            ]
        );
    };

    const handleOrderFromRestaurant = (restaurant: typeof FAVORITE_RESTAURANTS[0]) => {
        router.push({
            pathname: '/food/[restaurantId]',
            params: { restaurantId: restaurant.id }
        });
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <LinearGradient
                colors={['#E91E63', '#C2185B']}
                style={styles.header}
            >
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Icon name="arrow-back" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>❤️ {language === 'fr' ? 'Mes Favoris' : 'My Favorites'}</Text>
                <View style={{ width: 44 }} />
            </LinearGradient>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'drivers' && styles.tabActive]}
                    onPress={() => setActiveTab('drivers')}
                >
                    <Text style={styles.tabIcon}>🚗</Text>
                    <Text style={[styles.tabText, activeTab === 'drivers' && styles.tabTextActive]}>
                        {language === 'fr' ? 'Chauffeurs' : 'Drivers'} ({drivers.length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'restaurants' && styles.tabActive]}
                    onPress={() => setActiveTab('restaurants')}
                >
                    <Text style={styles.tabIcon}>🍽️</Text>
                    <Text style={[styles.tabText, activeTab === 'restaurants' && styles.tabTextActive]}>
                        Restaurants ({restaurants.length})
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* ===== CHAUFFEURS ===== */}
                {activeTab === 'drivers' && (
                    <>
                        {drivers.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyIcon}>🚗</Text>
                                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                                    {language === 'fr' ? 'Aucun chauffeur favori' : 'No favorite drivers'}
                                </Text>
                                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                                    {language === 'fr'
                                        ? 'Ajoutez un chauffeur après une course pour le retrouver ici'
                                        : 'Add a driver after a ride to find them here'}
                                </Text>
                            </View>
                        ) : (
                            drivers.map((driver) => (
                                <View key={driver.id} style={[styles.driverCard, { backgroundColor: colors.card }]}>
                                    <View style={styles.driverHeader}>
                                        <View style={styles.driverAvatar}>
                                            <Text style={styles.driverAvatarText}>{driver.avatar}</Text>
                                        </View>
                                        <View style={styles.driverInfo}>
                                            <Text style={[styles.driverName, { color: colors.text }]}>{driver.name}</Text>
                                            <View style={styles.driverMeta}>
                                                <Text style={styles.driverRating}>⭐ {driver.rating}</Text>
                                                <Text style={[styles.driverRides, { color: colors.textSecondary }]}>
                                                    • {driver.rides} {language === 'fr' ? 'courses' : 'rides'}
                                                </Text>
                                            </View>
                                        </View>
                                        <TouchableOpacity onPress={() => handleRemoveDriver(driver.id)}>
                                            <Icon name="heart" size={24} color="#E91E63" />
                                        </TouchableOpacity>
                                    </View>

                                    <View style={styles.driverDetails}>
                                        <View style={styles.driverDetail}>
                                            <Text style={styles.detailIcon}>🚗</Text>
                                            <Text style={[styles.detailText, { color: colors.textSecondary }]}>{driver.vehicle}</Text>
                                        </View>
                                        <View style={styles.driverDetail}>
                                            <Text style={styles.detailIcon}>🔢</Text>
                                            <Text style={[styles.detailText, { color: colors.textSecondary }]}>{driver.plate}</Text>
                                        </View>
                                    </View>

                                    <TouchableOpacity
                                        style={styles.requestButton}
                                        onPress={() => handleRequestDriver(driver)}
                                    >
                                        <LinearGradient
                                            colors={['#4CAF50', '#388E3C']}
                                            style={styles.requestGradient}
                                        >
                                            <Text style={styles.requestText}>
                                                {language === 'fr' ? '🚗 Demander ce chauffeur' : '🚗 Request this driver'}
                                            </Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            ))
                        )}
                    </>
                )}

                {/* ===== RESTAURANTS ===== */}
                {activeTab === 'restaurants' && (
                    <>
                        {restaurants.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyIcon}>🍽️</Text>
                                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                                    {language === 'fr' ? 'Aucun restaurant favori' : 'No favorite restaurants'}
                                </Text>
                                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                                    {language === 'fr'
                                        ? 'Ajoutez un restaurant depuis TransiGo Food'
                                        : 'Add a restaurant from TransiGo Food'}
                                </Text>
                            </View>
                        ) : (
                            restaurants.map((restaurant) => (
                                <TouchableOpacity
                                    key={restaurant.id}
                                    style={[styles.restaurantCard, { backgroundColor: colors.card }]}
                                    onPress={() => handleOrderFromRestaurant(restaurant)}
                                    activeOpacity={0.9}
                                >
                                    <View style={styles.restaurantLeft}>
                                        <View style={styles.restaurantEmoji}>
                                            <Text style={styles.restaurantEmojiText}>{restaurant.emoji}</Text>
                                        </View>
                                        <View style={styles.restaurantInfo}>
                                            <Text style={[styles.restaurantName, { color: colors.text }]}>{restaurant.name}</Text>
                                            <View style={styles.restaurantMeta}>
                                                <Text style={styles.restaurantRating}>⭐ {restaurant.rating}</Text>
                                                <Text style={[styles.restaurantCategory, { color: colors.textSecondary }]}>
                                                    • {restaurant.category}
                                                </Text>
                                            </View>
                                            <Text style={[styles.restaurantOrders, { color: colors.textSecondary }]}>
                                                {restaurant.orders} {language === 'fr' ? 'commandes' : 'orders'}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.restaurantRight}>
                                        <TouchableOpacity onPress={() => handleRemoveRestaurant(restaurant.id)}>
                                            <Icon name="heart" size={24} color="#E91E63" />
                                        </TouchableOpacity>
                                        <Icon name="chevron-forward" size={20} color={colors.textSecondary} />
                                    </View>
                                </TouchableOpacity>
                            ))
                        )}
                    </>
                )}

                {/* Tip */}
                <View style={[styles.tipCard, { backgroundColor: isDark ? '#1E1E1E' : '#FFF3E0' }]}>
                    <Text style={styles.tipIcon}>💡</Text>
                    <Text style={[styles.tipText, { color: colors.text }]}>
                        {language === 'fr'
                            ? 'Astuce : Appuyez sur ❤️ après une course ou commande pour ajouter aux favoris !'
                            : 'Tip: Tap ❤️ after a ride or order to add to favorites!'}
                    </Text>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 50,
        paddingBottom: SPACING.lg,
        paddingHorizontal: SPACING.lg,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.white },

    // Tabs
    tabsContainer: {
        flexDirection: 'row',
        marginHorizontal: SPACING.lg,
        marginTop: SPACING.md,
        backgroundColor: '#E0E0E0',
        borderRadius: 16,
        padding: 4,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 6,
    },
    tabActive: { backgroundColor: '#FFF' },
    tabIcon: { fontSize: 18 },
    tabText: { fontSize: 13, fontWeight: '600', color: '#666' },
    tabTextActive: { color: '#E91E63' },

    content: { padding: SPACING.lg },

    // Empty
    emptyState: { alignItems: 'center', paddingVertical: 60 },
    emptyIcon: { fontSize: 60, marginBottom: SPACING.md },
    emptyTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
    emptySubtitle: { fontSize: 14, textAlign: 'center' },

    // Driver Card
    driverCard: { padding: SPACING.md, borderRadius: 16, marginBottom: SPACING.md },
    driverHeader: { flexDirection: 'row', alignItems: 'center' },
    driverAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#E91E6320',
        justifyContent: 'center',
        alignItems: 'center',
    },
    driverAvatarText: { fontSize: 28 },
    driverInfo: { flex: 1, marginLeft: SPACING.sm },
    driverName: { fontSize: 16, fontWeight: '700' },
    driverMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
    driverRating: { fontSize: 14, fontWeight: '600' },
    driverRides: { fontSize: 13, marginLeft: 4 },
    driverDetails: { flexDirection: 'row', marginTop: SPACING.sm, gap: SPACING.md },
    driverDetail: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    detailIcon: { fontSize: 14 },
    detailText: { fontSize: 13 },
    requestButton: { marginTop: SPACING.md },
    requestGradient: { paddingVertical: 12, borderRadius: 25, alignItems: 'center' },
    requestText: { color: COLORS.white, fontWeight: '600', fontSize: 14 },

    // Restaurant Card
    restaurantCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        borderRadius: 16,
        marginBottom: SPACING.md,
    },
    restaurantLeft: { flexDirection: 'row', flex: 1, alignItems: 'center' },
    restaurantEmoji: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: '#FFF3E0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    restaurantEmojiText: { fontSize: 28 },
    restaurantInfo: { marginLeft: SPACING.sm, flex: 1 },
    restaurantName: { fontSize: 15, fontWeight: '600' },
    restaurantMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
    restaurantRating: { fontSize: 13, fontWeight: '600' },
    restaurantCategory: { fontSize: 12, marginLeft: 4 },
    restaurantOrders: { fontSize: 12, marginTop: 2 },
    restaurantRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },

    // Tip
    tipCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        borderRadius: 16,
        marginTop: SPACING.md,
        gap: SPACING.sm,
    },
    tipIcon: { fontSize: 24 },
    tipText: { flex: 1, fontSize: 13 },
});
