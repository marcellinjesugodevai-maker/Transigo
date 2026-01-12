// =============================================
// TRANSIGO DRIVER - SCHEDULED RIDES SCREEN
// Voir et accepter les réservations planifiées
// =============================================

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useDriverStore } from '../src/stores/driverStore';
import { supabase } from '../src/services/supabaseService';

const COLORS = {
    primary: '#FF6B00',
    primaryDark: '#E65100',
    white: '#FFFFFF',
    black: '#1A1A2E',
    gray50: '#FAFAFA',
    gray100: '#F5F5F5',
    gray500: '#9E9E9E',
    gray600: '#757575',
    success: '#4CAF50',
    error: '#F44336',
    blue: '#2196F3',
};

interface ScheduledRide {
    id: string;
    user_id: string;
    pickup_address: string;
    dropoff_address: string;
    scheduled_date: string;
    scheduled_time: string;
    vehicle_type: string;
    estimated_price: number;
    status: string;
    driver_id?: string;
    driver_name?: string;
}

export default function ScheduledRidesScreen() {
    const { driver } = useDriverStore();
    const [activeTab, setActiveTab] = useState<'available' | 'mine'>('available');
    const [availableRides, setAvailableRides] = useState<ScheduledRide[]>([]);
    const [myRides, setMyRides] = useState<ScheduledRide[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const today = new Date().toISOString().split('T')[0];

            // Réservations disponibles
            const { data: available } = await supabase
                .from('scheduled_rides')
                .select('*')
                .gte('scheduled_date', today)
                .eq('status', 'pending')
                .is('driver_id', null)
                .order('scheduled_date', { ascending: true })
                .order('scheduled_time', { ascending: true });

            if (available) setAvailableRides(available);

            // Mes réservations acceptées
            if (driver?.id) {
                const { data: mine } = await supabase
                    .from('scheduled_rides')
                    .select('*')
                    .eq('driver_id', driver.id)
                    .gte('scheduled_date', today)
                    .in('status', ['confirmed', 'driver_on_way', 'in_progress'])
                    .order('scheduled_date', { ascending: true })
                    .order('scheduled_time', { ascending: true });

                if (mine) setMyRides(mine);
            }
        } catch (error) {
            console.error('Error loading scheduled rides:', error);
        }
        setIsLoading(false);
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadData().then(() => setRefreshing(false));
    }, []);

    const handleAcceptRide = async (ride: ScheduledRide) => {
        if (!driver?.id) {
            Alert.alert('Erreur', 'Vous devez être connecté');
            return;
        }

        Alert.alert(
            '📅 Accepter cette réservation ?',
            `${formatDate(ride.scheduled_date)} à ${ride.scheduled_time}\n${ride.pickup_address} → ${ride.dropoff_address}\n\nPrix : ${ride.estimated_price.toLocaleString()} F`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Accepter',
                    onPress: async () => {
                        const { error } = await supabase
                            .from('scheduled_rides')
                            .update({
                                driver_id: driver.id,
                                driver_name: driver.first_name || 'Chauffeur',
                                status: 'confirmed',
                            })
                            .eq('id', ride.id)
                            .eq('status', 'pending');

                        if (error) {
                            Alert.alert('Erreur', 'Cette réservation a déjà été prise');
                        } else {
                            Alert.alert('✅ Réservation acceptée !', 'Le passager sera notifié.');
                            loadData();
                        }
                    },
                },
            ]
        );
    };

    const handleStartRide = async (ride: ScheduledRide) => {
        Alert.alert(
            'Démarrer la course ?',
            'Vous êtes en route vers le passager.',
            [
                { text: 'Non', style: 'cancel' },
                {
                    text: 'Oui',
                    onPress: async () => {
                        await supabase
                            .from('scheduled_rides')
                            .update({ status: 'driver_on_way' })
                            .eq('id', ride.id);
                        loadData();
                    },
                },
            ]
        );
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
    };

    const isToday = (dateStr: string) => {
        const today = new Date().toISOString().split('T')[0];
        return dateStr === today;
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                style={styles.header}
            >
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>📅 Réservations</Text>
                <View style={{ width: 40 }} />
            </LinearGradient>

            {/* Tabs */}
            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'available' && styles.tabActive]}
                    onPress={() => setActiveTab('available')}
                >
                    <Text style={[styles.tabText, activeTab === 'available' && styles.tabTextActive]}>
                        🔍 Disponibles ({availableRides.length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'mine' && styles.tabActive]}
                    onPress={() => setActiveTab('mine')}
                >
                    <Text style={[styles.tabText, activeTab === 'mine' && styles.tabTextActive]}>
                        ✅ Mes courses ({myRides.length})
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
                }
            >
                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                        <Text style={styles.loadingText}>Chargement...</Text>
                    </View>
                ) : (
                    <>
                        {activeTab === 'available' && (
                            <>
                                {availableRides.length === 0 ? (
                                    <View style={styles.emptyState}>
                                        <Text style={styles.emptyIcon}>📅</Text>
                                        <Text style={styles.emptyTitle}>Aucune réservation disponible</Text>
                                        <Text style={styles.emptyText}>
                                            Les nouvelles réservations apparaîtront ici
                                        </Text>
                                    </View>
                                ) : (
                                    availableRides.map(ride => (
                                        <View key={ride.id} style={styles.rideCard}>
                                            <View style={styles.rideHeader}>
                                                <View>
                                                    <Text style={styles.dateText}>
                                                        {formatDate(ride.scheduled_date)}
                                                        {isToday(ride.scheduled_date) && (
                                                            <Text style={styles.todayBadge}> AUJOURD'HUI</Text>
                                                        )}
                                                    </Text>
                                                    <Text style={styles.timeText}>{ride.scheduled_time}</Text>
                                                </View>
                                                <View style={styles.priceBadge}>
                                                    <Text style={styles.priceText}>
                                                        {ride.estimated_price.toLocaleString()} F
                                                    </Text>
                                                </View>
                                            </View>

                                            <View style={styles.routeContainer}>
                                                <View style={styles.routePoint}>
                                                    <View style={[styles.dot, { backgroundColor: COLORS.success }]} />
                                                    <Text style={styles.routeText}>{ride.pickup_address}</Text>
                                                </View>
                                                <View style={styles.routeLine} />
                                                <View style={styles.routePoint}>
                                                    <View style={[styles.dot, { backgroundColor: COLORS.primary }]} />
                                                    <Text style={styles.routeText}>{ride.dropoff_address}</Text>
                                                </View>
                                            </View>

                                            <TouchableOpacity
                                                style={styles.acceptButton}
                                                onPress={() => handleAcceptRide(ride)}
                                            >
                                                <LinearGradient
                                                    colors={[COLORS.success, '#388E3C']}
                                                    style={styles.acceptButtonGradient}
                                                >
                                                    <Text style={styles.acceptButtonText}>✓ Accepter</Text>
                                                </LinearGradient>
                                            </TouchableOpacity>
                                        </View>
                                    ))
                                )}
                            </>
                        )}

                        {activeTab === 'mine' && (
                            <>
                                {myRides.length === 0 ? (
                                    <View style={styles.emptyState}>
                                        <Text style={styles.emptyIcon}>🚗</Text>
                                        <Text style={styles.emptyTitle}>Aucune course acceptée</Text>
                                        <Text style={styles.emptyText}>
                                            Acceptez des réservations pour les voir ici
                                        </Text>
                                    </View>
                                ) : (
                                    myRides.map(ride => (
                                        <View key={ride.id} style={styles.rideCard}>
                                            <View style={styles.rideHeader}>
                                                <View>
                                                    <Text style={styles.dateText}>
                                                        {formatDate(ride.scheduled_date)}
                                                        {isToday(ride.scheduled_date) && (
                                                            <Text style={styles.todayBadge}> AUJOURD'HUI</Text>
                                                        )}
                                                    </Text>
                                                    <Text style={styles.timeText}>{ride.scheduled_time}</Text>
                                                </View>
                                                <View style={[styles.statusBadge, { backgroundColor: COLORS.success + '20' }]}>
                                                    <Text style={[styles.statusText, { color: COLORS.success }]}>
                                                        ✅ Confirmé
                                                    </Text>
                                                </View>
                                            </View>

                                            <View style={styles.routeContainer}>
                                                <View style={styles.routePoint}>
                                                    <View style={[styles.dot, { backgroundColor: COLORS.success }]} />
                                                    <Text style={styles.routeText}>{ride.pickup_address}</Text>
                                                </View>
                                                <View style={styles.routeLine} />
                                                <View style={styles.routePoint}>
                                                    <View style={[styles.dot, { backgroundColor: COLORS.primary }]} />
                                                    <Text style={styles.routeText}>{ride.dropoff_address}</Text>
                                                </View>
                                            </View>

                                            <View style={styles.rideFooter}>
                                                <Text style={styles.priceLabel}>
                                                    💰 {ride.estimated_price.toLocaleString()} F
                                                </Text>
                                                {ride.status === 'confirmed' && (
                                                    <TouchableOpacity
                                                        style={styles.startButton}
                                                        onPress={() => handleStartRide(ride)}
                                                    >
                                                        <Text style={styles.startButtonText}>🚗 Démarrer</Text>
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        </View>
                                    ))
                                )}
                            </>
                        )}
                    </>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.gray50 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16 },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
    backIcon: { fontSize: 24, color: COLORS.white },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.white },
    tabs: { flexDirection: 'row', marginHorizontal: 16, marginTop: -10, zIndex: 10 },
    tab: { flex: 1, backgroundColor: COLORS.white, paddingVertical: 12, borderRadius: 12, marginHorizontal: 4, alignItems: 'center', elevation: 4 },
    tabActive: { backgroundColor: COLORS.primary },
    tabText: { fontSize: 12, fontWeight: '600', color: COLORS.gray600 },
    tabTextActive: { color: COLORS.white },
    content: { padding: 16, paddingTop: 20 },
    loadingContainer: { alignItems: 'center', paddingVertical: 60 },
    loadingText: { marginTop: 12, color: COLORS.gray600 },
    emptyState: { alignItems: 'center', paddingVertical: 60 },
    emptyIcon: { fontSize: 60, marginBottom: 16 },
    emptyTitle: { fontSize: 18, fontWeight: '600', color: COLORS.black, marginBottom: 8 },
    emptyText: { fontSize: 14, color: COLORS.gray500, textAlign: 'center' },
    rideCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 12, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8 },
    rideHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    dateText: { fontSize: 16, fontWeight: 'bold', color: COLORS.black },
    todayBadge: { fontSize: 11, color: COLORS.primary, fontWeight: 'bold' },
    timeText: { fontSize: 14, color: COLORS.primary, fontWeight: '600', marginTop: 2 },
    priceBadge: { backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    priceText: { color: COLORS.white, fontWeight: 'bold', fontSize: 14 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusText: { fontSize: 11, fontWeight: 'bold' },
    routeContainer: { marginBottom: 12 },
    routePoint: { flexDirection: 'row', alignItems: 'center' },
    dot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
    routeLine: { width: 2, height: 16, backgroundColor: COLORS.gray100, marginLeft: 4, marginVertical: 2 },
    routeText: { fontSize: 14, color: COLORS.black, flex: 1 },
    acceptButton: { borderRadius: 12, overflow: 'hidden' },
    acceptButtonGradient: { paddingVertical: 14, alignItems: 'center' },
    acceptButtonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 15 },
    rideFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.gray100 },
    priceLabel: { fontSize: 16, fontWeight: 'bold', color: COLORS.black },
    startButton: { backgroundColor: COLORS.blue, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
    startButtonText: { color: COLORS.white, fontWeight: 'bold' },
});
