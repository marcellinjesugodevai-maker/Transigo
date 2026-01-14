// =============================================
// TRANSIGO - ACTIVITY SCREEN (VERSION AMÉLIORÉE)
// Historique complet avec filtres et statistiques
// =============================================

import { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    FlatList,
    Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@/components/Icon';
import { COLORS, SPACING, RADIUS } from '@/constants';
import { useLanguageStore, useThemeStore } from '@/stores';
import { getTranslation } from '@/i18n/translations';

const { width } = Dimensions.get('window');

type ActivityType = 'vtc' | 'delivery' | 'food';
type ActivityStatus = 'en_cours' | 'terminee' | 'annulee';

interface Activity {
    id: string;
    type: ActivityType;
    date: string;
    price: number;
    from: string;
    to: string;
    driver?: {
        name: string;
        avatar: string;
        rating: number;
    };
    restaurant?: string;
    items?: number;
    status: ActivityStatus;
}


// Types d'activité
const ACTIVITY_TYPES = [
    { id: 'all', label: 'Tout', labelEn: 'All', icon: '📋', color: '#673AB7' },
    { id: 'vtc', label: 'Courses', labelEn: 'Rides', icon: '🚗', color: '#4CAF50' },
    { id: 'food', label: 'Food', labelEn: 'Food', icon: '🍔', color: '#FF9800' },
    { id: 'delivery', label: 'Livraison', labelEn: 'Delivery', icon: '📦', color: '#2196F3' },
];

// Statuts
const STATUS_FILTERS = [
    { id: 'all', label: 'Tous', labelEn: 'All' },
    { id: 'en_cours', label: 'En cours', labelEn: 'Ongoing' },
    { id: 'terminee', label: 'Terminé', labelEn: 'Completed' },
    { id: 'annulee', label: 'Annulé', labelEn: 'Cancelled' },
];

// Données chargées depuis Supabase
import { useAuthStore } from '@/stores';
import { rideService } from '@/services/supabaseService';
import { useFocusEffect } from 'expo-router';
import React, { useCallback } from 'react';

export default function ActivityScreen() {
    const { language } = useLanguageStore();
    const { isDark, colors } = useThemeStore();
    const { user } = useAuthStore();
    const t = (key: any) => getTranslation(key, language);

    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedType, setSelectedType] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');

    // Charger l'historique
    useFocusEffect(
        useCallback(() => {
            if (!user) return;

            const fetchHistory = async () => {
                setLoading(true);
                const { rides, error } = await rideService.getRideHistory(user.id);

                if (rides) {
                    const mappedActivities: Activity[] = rides.map((r: any) => ({
                        id: r.id,
                        type: r.category === 'delivery' ? 'delivery' : 'vtc', // Adapter selon votre schéma
                        date: new Date(r.created_at).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                        }),
                        price: r.price,
                        from: r.pickup_address,
                        to: r.dropoff_address,
                        driver: r.drivers ? {
                            name: `${r.drivers.first_name} ${r.drivers.last_name}`,
                            avatar: '👨🏾', // Avatar par défaut si pas d'URL
                            rating: r.drivers.rating || 5.0
                        } : undefined,
                        status: r.status === 'completed' ? 'terminee' : r.status === 'cancelled' ? 'annulee' : 'en_cours',
                    }));
                    setActivities(mappedActivities);
                }
                setLoading(false);
            };

            fetchHistory();
        }, [user])
    );

    // Filtrer les activités
    const filteredActivities = activities.filter(a => {
        const typeMatch = selectedType === 'all' || a.type === selectedType;
        const statusMatch = selectedStatus === 'all' || a.status === selectedStatus;
        return typeMatch && statusMatch;
    });

    // Statistiques
    const totalActivities = activities.length;
    const totalSpent = activities.filter(a => a.status === 'terminee').reduce((sum, a) => sum + a.price, 0);
    const vtcCount = activities.filter(a => a.type === 'vtc').length;
    const foodCount = activities.filter(a => a.type === 'food').length;
    const deliveryCount = activities.filter(a => a.type === 'delivery').length;

    const getTypeIcon = (type: ActivityType) => {
        switch (type) {
            case 'vtc': return '🚗';
            case 'food': return '🍔';
            case 'delivery': return '📦';
        }
    };

    const getTypeColor = (type: ActivityType) => {
        switch (type) {
            case 'vtc': return '#4CAF50';
            case 'food': return '#FF9800';
            case 'delivery': return '#2196F3';
        }
    };

    const getStatusBadge = (status: ActivityStatus) => {
        switch (status) {
            case 'en_cours':
                return { label: language === 'fr' ? 'EN COURS' : 'ONGOING', color: COLORS.primary, bg: COLORS.primary + '20' };
            case 'terminee':
                return { label: language === 'fr' ? 'TERMINÉE' : 'COMPLETED', color: '#4CAF50', bg: '#4CAF5020' };
            case 'annulee':
                return { label: language === 'fr' ? 'ANNULÉE' : 'CANCELLED', color: '#E91E63', bg: '#E91E6320' };
        }
    };

    const renderActivity = ({ item }: { item: Activity }) => {
        const statusBadge = getStatusBadge(item.status);
        const typeColor = getTypeColor(item.type);

        return (
            <TouchableOpacity
                style={[styles.activityCard, { backgroundColor: colors.card }]}
                onPress={() => router.push(`/ride/${item.id}`)}
                activeOpacity={0.9}
            >
                {/* Type badge */}
                <View style={[styles.typeBadge, { backgroundColor: typeColor }]}>
                    <Text style={styles.typeIcon}>{getTypeIcon(item.type)}</Text>
                </View>

                {/* Content */}
                <View style={styles.activityContent}>
                    {/* Header */}
                    <View style={styles.activityHeader}>
                        <View>
                            <Text style={[styles.activityDate, { color: colors.textSecondary }]}>
                                {item.date}
                            </Text>
                            {item.restaurant && (
                                <Text style={[styles.restaurantName, { color: colors.text }]}>
                                    🍽️ {item.restaurant}
                                </Text>
                            )}
                        </View>
                        <View style={styles.priceContainer}>
                            <Text style={[
                                styles.activityPrice,
                                { color: item.status === 'annulee' ? colors.textSecondary : '#4CAF50' },
                                item.status === 'annulee' && styles.priceStriked
                            ]}>
                                {item.price.toLocaleString('fr-FR')} F
                            </Text>
                            {item.items && (
                                <Text style={[styles.itemsCount, { color: colors.textSecondary }]}>
                                    {item.items} {language === 'fr' ? 'articles' : 'items'}
                                </Text>
                            )}
                        </View>
                    </View>

                    {/* Route */}
                    <View style={styles.routeSection}>
                        <View style={styles.routePoint}>
                            <View style={[styles.dotStart, { borderColor: typeColor }]} />
                            <Text style={[styles.routeText, { color: colors.text }]} numberOfLines={1}>
                                {item.from}
                            </Text>
                        </View>
                        <View style={styles.routeLine}>
                            <View style={[styles.lineVertical, { backgroundColor: typeColor + '50' }]} />
                        </View>
                        <View style={styles.routePoint}>
                            <View style={[styles.dotEnd, { backgroundColor: typeColor }]} />
                            <Text style={[styles.routeText, { color: colors.text }]} numberOfLines={1}>
                                {item.to}
                            </Text>
                        </View>
                    </View>

                    {/* Footer */}
                    <View style={styles.activityFooter}>
                        {item.driver ? (
                            <View style={styles.driverInfo}>
                                <Text style={styles.driverAvatar}>{item.driver.avatar}</Text>
                                <Text style={[styles.driverName, { color: colors.text }]}>{item.driver.name}</Text>
                                <Text style={styles.driverRating}>⭐ {item.driver.rating}</Text>
                            </View>
                        ) : (
                            <View style={styles.driverInfo}>
                                <Text style={styles.driverAvatar}>🚫</Text>
                                <Text style={[styles.driverName, { color: colors.textSecondary }]}>
                                    {language === 'fr' ? 'Aucun chauffeur' : 'No driver'}
                                </Text>
                            </View>
                        )}
                        <View style={[styles.statusBadge, { backgroundColor: statusBadge.bg }]}>
                            <Text style={[styles.statusText, { color: statusBadge.color }]}>
                                {statusBadge.label}
                            </Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header avec gradient */}
            <LinearGradient
                colors={['#673AB7', '#512DA8']}
                style={styles.header}
            >
                <Text style={styles.headerTitle}>
                    📋 {language === 'fr' ? 'Mon Activité' : 'My Activity'}
                </Text>

                {/* Stats rapides */}
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{totalActivities}</Text>
                        <Text style={styles.statLabel}>{language === 'fr' ? 'Total' : 'Total'}</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{(totalSpent / 1000).toFixed(0)}k F</Text>
                        <Text style={styles.statLabel}>{language === 'fr' ? 'Dépensé' : 'Spent'}</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>🚗 {vtcCount}</Text>
                        <Text style={styles.statLabel}>VTC</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>🍔 {foodCount}</Text>
                        <Text style={styles.statLabel}>Food</Text>
                    </View>
                </View>
            </LinearGradient>

            {/* Filtres par type */}
            <View style={[styles.filtersContainer, { backgroundColor: colors.card }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {ACTIVITY_TYPES.map((type) => (
                        <TouchableOpacity
                            key={type.id}
                            style={[
                                styles.filterChip,
                                selectedType === type.id && { backgroundColor: type.color }
                            ]}
                            onPress={() => setSelectedType(type.id)}
                        >
                            <Text style={styles.filterIcon}>{type.icon}</Text>
                            <Text style={[
                                styles.filterLabel,
                                { color: selectedType === type.id ? COLORS.white : colors.text }
                            ]}>
                                {language === 'fr' ? type.label : type.labelEn}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Filtres par statut */}
            <View style={[styles.statusFilters, { backgroundColor: colors.background }]}>
                {STATUS_FILTERS.map((status) => (
                    <TouchableOpacity
                        key={status.id}
                        style={[
                            styles.statusChip,
                            { backgroundColor: selectedStatus === status.id ? colors.text : 'transparent' }
                        ]}
                        onPress={() => setSelectedStatus(status.id)}
                    >
                        <Text style={[
                            styles.statusChipText,
                            { color: selectedStatus === status.id ? colors.background : colors.textSecondary }
                        ]}>
                            {language === 'fr' ? status.label : status.labelEn}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Liste des activités */}
            <FlatList
                data={filteredActivities}
                renderItem={renderActivity}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>📭</Text>
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                            {language === 'fr' ? 'Aucune activité trouvée' : 'No activity found'}
                        </Text>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },

    // Header
    header: {
        paddingTop: 50,
        paddingBottom: SPACING.lg,
        paddingHorizontal: SPACING.lg,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.white,
        marginBottom: SPACING.md,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 16,
        paddingVertical: SPACING.md,
    },
    statItem: { alignItems: 'center' },
    statValue: { fontSize: 18, fontWeight: 'bold', color: COLORS.white },
    statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
    statDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.2)' },

    // Filters
    filtersContainer: {
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.lg,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
        marginRight: SPACING.sm,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    filterIcon: { fontSize: 16, marginRight: 6 },
    filterLabel: { fontSize: 13, fontWeight: '600' },

    statusFilters: {
        flexDirection: 'row',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
        gap: SPACING.sm,
    },
    statusChip: {
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 16,
    },
    statusChipText: { fontSize: 12, fontWeight: '600' },

    // List
    listContent: { padding: SPACING.lg, paddingTop: SPACING.sm },

    // Activity card
    activityCard: {
        flexDirection: 'row',
        borderRadius: 16,
        marginBottom: SPACING.md,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    typeBadge: {
        width: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    typeIcon: { fontSize: 20 },
    activityContent: {
        flex: 1,
        padding: SPACING.md,
    },

    // Header
    activityHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.sm,
    },
    activityDate: { fontSize: 12 },
    restaurantName: { fontSize: 14, fontWeight: '600', marginTop: 2 },
    priceContainer: { alignItems: 'flex-end' },
    activityPrice: { fontSize: 16, fontWeight: 'bold' },
    priceStriked: { textDecorationLine: 'line-through' },
    itemsCount: { fontSize: 11, marginTop: 2 },

    // Route
    routeSection: { marginBottom: SPACING.sm },
    routePoint: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    dotStart: {
        width: 10,
        height: 10,
        borderRadius: 5,
        borderWidth: 2,
        backgroundColor: 'transparent',
    },
    dotEnd: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    routeLine: { marginLeft: 4, height: 12 },
    lineVertical: { width: 2, height: '100%' },
    routeText: { flex: 1, fontSize: 13 },

    // Footer
    activityFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    driverInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    driverAvatar: { fontSize: 20 },
    driverName: { fontSize: 13, fontWeight: '500' },
    driverRating: { fontSize: 12, color: '#FF9800' },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    statusText: { fontSize: 10, fontWeight: 'bold' },

    // Empty
    emptyContainer: { alignItems: 'center', paddingVertical: 60 },
    emptyIcon: { fontSize: 60, marginBottom: SPACING.md },
    emptyText: { fontSize: 16 },
});
