// =============================================
// TRANSIGO DRIVER - COVOITURAGE INTELLIGENT
// Mode Personnel + Mode En Course - Connecté Supabase
// =============================================

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    TextInput,
    StatusBar,
    Alert,
    Switch,
    Animated,
    Dimensions,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useDriverStore } from '../../src/stores/driverStore';
import { carpoolDriverService } from '../../src/services/carpoolDriverService';
import { supabase } from '../../src/services/supabaseService';

const { width } = Dimensions.get('window');

const COLORS = {
    primary: '#00C853',
    primaryDark: '#00A344',
    secondary: '#FF6B00',
    secondaryLight: '#FF8C42',
    white: '#FFFFFF',
    black: '#1A1A2E',
    gray50: '#FAFAFA',
    gray100: '#F5F5F5',
    gray200: '#EEEEEE',
    gray400: '#BDBDBD',
    gray500: '#9E9E9E',
    gray600: '#757575',
    error: '#F44336',
    success: '#4CAF50',
    purple: '#9C27B0',
    blue: '#2196F3',
};

interface SharedRide {
    id: string;
    creator_id: string;
    driver_id?: string;
    driver_name?: string;
    pickup_address: string;
    pickup_lat: number;
    pickup_lon: number;
    dropoff_address: string;
    dropoff_lat: number;
    dropoff_lon: number;
    base_price: number;
    current_price_per_person: number;
    max_passengers: number;
    current_passengers: number;
    is_accepting_passengers: boolean;
    status: string;
    ride_type: string;
    created_at: string;
}

interface Passenger {
    id: string;
    user_name: string;
    pickup_address: string;
    dropoff_address: string;
    price_to_pay: number;
    status: string;
}

export default function CarpoolScreen() {
    const { driver } = useDriverStore();
    const [activeMode, setActiveMode] = useState<'personal' | 'inride' | 'join'>('personal');
    const [carpoolEnabled, setCarpoolEnabled] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Trajets et passagers
    const [myActiveRide, setMyActiveRide] = useState<SharedRide | null>(null);
    const [availableRides, setAvailableRides] = useState<SharedRide[]>([]);
    const [passengers, setPassengers] = useState<Passenger[]>([]);

    // Formulaire trajet personnel
    const [myRoute, setMyRoute] = useState({
        pickup: '',
        dropoff: '',
        time: '',
        seats: '3',
        price: '',
    });
    const [isPublishing, setIsPublishing] = useState(false);

    // Stats
    const [stats, setStats] = useState({ rides: 0, earnings: 0, passengers: 0 });

    // Animation
    const pulseAnim = useState(new Animated.Value(1))[0];

    // Charger les données au démarrage
    useEffect(() => {
        loadData();
        subscribeToRealtime();
    }, []);

    useEffect(() => {
        if (carpoolEnabled && myActiveRide) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
                ])
            ).start();
        }
    }, [carpoolEnabled, myActiveRide]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // Charger mon trajet actif
            if (driver?.id) {
                const { data: myRides } = await supabase
                    .from('shared_rides')
                    .select('*')
                    .eq('driver_id', driver.id)
                    .in('status', ['searching', 'driver_assigned', 'in_progress'])
                    .order('created_at', { ascending: false })
                    .limit(1);

                if (myRides && myRides.length > 0) {
                    setMyActiveRide(myRides[0]);
                    // Charger les passagers
                    const { passengers: pax } = await carpoolDriverService.getRidePassengers(myRides[0].id);
                    if (pax) setPassengers(pax);
                }
            }

            // Charger trajets disponibles (pour mode "Rejoindre")
            const { data: rides } = await supabase
                .from('shared_rides')
                .select('*')
                .eq('is_accepting_passengers', true)
                .eq('ride_type', 'driver_planned')
                .in('status', ['searching', 'driver_assigned'])
                .order('created_at', { ascending: false })
                .limit(20);

            if (rides) setAvailableRides(rides);

            // Charger stats
            if (driver?.id) {
                const { data: completedRides } = await supabase
                    .from('shared_rides')
                    .select('id, base_price, current_passengers')
                    .eq('driver_id', driver.id)
                    .eq('status', 'completed');

                if (completedRides) {
                    const totalEarnings = completedRides.reduce((sum, r) => sum + r.base_price, 0);
                    const totalPassengers = completedRides.reduce((sum, r) => sum + r.current_passengers, 0);
                    setStats({
                        rides: completedRides.length,
                        earnings: totalEarnings,
                        passengers: totalPassengers,
                    });
                }
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }
        setIsLoading(false);
    };

    const subscribeToRealtime = () => {
        if (!driver?.id) return;

        // S'abonner aux nouveaux passagers sur mon trajet
        if (myActiveRide) {
            carpoolDriverService.subscribeToPassengers(myActiveRide.id, (newPassenger) => {
                setPassengers(prev => [...prev, newPassenger]);
                Alert.alert(
                    '🎉 Nouveau passager !',
                    `${newPassenger.user_name} veut rejoindre votre trajet\n+${newPassenger.price_to_pay.toLocaleString()} F`
                );
            });
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadData().then(() => setRefreshing(false));
    }, []);

    const handlePublishRoute = async () => {
        if (!myRoute.pickup || !myRoute.dropoff || !myRoute.price) {
            Alert.alert('⚠️ Champs requis', 'Remplissez le départ, la destination et le prix');
            return;
        }

        if (!driver?.id) {
            Alert.alert('Erreur', 'Vous devez être connecté');
            return;
        }

        setIsPublishing(true);
        try {
            const { ride, error } = await carpoolDriverService.publishRoute({
                driverId: driver.id,
                driverName: driver.first_name || 'Chauffeur',
                driverPhone: driver.phone || '',
                pickup: { address: myRoute.pickup, lat: 5.36, lon: -4.0 },
                dropoff: { address: myRoute.dropoff, lat: 5.32, lon: -4.02 },
                trajectory: [],
                basePrice: parseInt(myRoute.price),
                vehicleType: 'classic',
                destinationMode: 'custom',
            });

            if (error) throw error;

            setMyActiveRide(ride);
            Alert.alert('🎉 Trajet publié !', 'Les passagers peuvent maintenant vous rejoindre.');
            setMyRoute({ pickup: '', dropoff: '', time: '', seats: '3', price: '' });
        } catch (error: any) {
            Alert.alert('Erreur', error.message || 'Impossible de publier le trajet');
        }
        setIsPublishing(false);
    };

    const handleCancelRide = async () => {
        if (!myActiveRide) return;

        Alert.alert(
            'Annuler le trajet ?',
            'Les passagers seront notifiés.',
            [
                { text: 'Non', style: 'cancel' },
                {
                    text: 'Oui, annuler',
                    style: 'destructive',
                    onPress: async () => {
                        const { error } = await carpoolDriverService.updateRideStatus(myActiveRide.id, 'cancelled');
                        if (!error) {
                            setMyActiveRide(null);
                            setPassengers([]);
                        }
                    }
                }
            ]
        );
    };

    const handleCompleteRide = async () => {
        if (!myActiveRide) return;

        Alert.alert(
            'Terminer le trajet ?',
            'La commission sera prélevée du total.',
            [
                { text: 'Non', style: 'cancel' },
                {
                    text: 'Terminer',
                    onPress: async () => {
                        const { error } = await carpoolDriverService.updateRideStatus(myActiveRide.id, 'completed');
                        if (!error) {
                            const total = passengers.reduce((sum, p) => sum + p.price_to_pay, 0);
                            const commission = Math.round(total * 0.12);
                            Alert.alert(
                                '✅ Trajet terminé !',
                                `Total : ${total.toLocaleString()} F\nCommission (12%) : ${commission.toLocaleString()} F\nVous recevez : ${(total - commission).toLocaleString()} F`
                            );
                            setMyActiveRide(null);
                            setPassengers([]);
                            loadData(); // Refresh stats
                        }
                    }
                }
            ]
        );
    };

    const handleToggleCarpoolInRide = async (value: boolean) => {
        setCarpoolEnabled(value);
        if (myActiveRide) {
            await supabase
                .from('shared_rides')
                .update({ is_accepting_passengers: value })
                .eq('id', myActiveRide.id);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                style={styles.header}
            >
                <View style={styles.headerTop}>
                    <View>
                        <Text style={styles.headerTitle}>🚗 Covoiturage</Text>
                        <Text style={styles.headerSubtitle}>
                            Partagez, économisez, gagnez plus
                        </Text>
                    </View>
                    <View style={styles.toggleContainer}>
                        <Text style={styles.toggleLabel}>
                            {carpoolEnabled ? 'Actif' : 'Inactif'}
                        </Text>
                        <Switch
                            value={carpoolEnabled}
                            onValueChange={handleToggleCarpoolInRide}
                            trackColor={{ false: COLORS.gray400, true: COLORS.secondaryLight }}
                            thumbColor={carpoolEnabled ? COLORS.secondary : COLORS.white}
                        />
                    </View>
                </View>

                {/* Stats */}
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{stats.rides}</Text>
                        <Text style={styles.statLabel}>Trajets</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{(stats.earnings / 1000).toFixed(0)}K</Text>
                        <Text style={styles.statLabel}>Gagnés</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{stats.passengers}</Text>
                        <Text style={styles.statLabel}>Passagers</Text>
                    </View>
                </View>
            </LinearGradient>

            {/* Mode Selector */}
            <View style={styles.modeSelector}>
                <TouchableOpacity
                    style={[styles.modeBtn, activeMode === 'personal' && styles.modeBtnActive]}
                    onPress={() => setActiveMode('personal')}
                >
                    <Text style={styles.modeBtnIcon}>🏠</Text>
                    <Text style={[styles.modeBtnText, activeMode === 'personal' && styles.modeBtnTextActive]}>
                        Mon Trajet
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.modeBtn, activeMode === 'inride' && styles.modeBtnActive]}
                    onPress={() => setActiveMode('inride')}
                >
                    <Text style={styles.modeBtnIcon}>🔄</Text>
                    <Text style={[styles.modeBtnText, activeMode === 'inride' && styles.modeBtnTextActive]}>
                        En Course
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.modeBtn, activeMode === 'join' && styles.modeBtnActive]}
                    onPress={() => setActiveMode('join')}
                >
                    <Text style={styles.modeBtnIcon}>🔍</Text>
                    <Text style={[styles.modeBtnText, activeMode === 'join' && styles.modeBtnTextActive]}>
                        Autres
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView
                style={styles.content}
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
                        {/* MODE 1: Trajet Personnel */}
                        {activeMode === 'personal' && (
                            <View>
                                <View style={styles.infoCard}>
                                    <Text style={styles.infoIcon}>💡</Text>
                                    <Text style={styles.infoText}>
                                        Publiez votre trajet personnel et gagnez de l'argent même en rentrant chez vous !
                                    </Text>
                                </View>

                                {myActiveRide ? (
                                    <View style={styles.publishedCard}>
                                        <View style={styles.publishedHeader}>
                                            <Text style={styles.publishedIcon}>✅</Text>
                                            <Text style={styles.publishedTitle}>Trajet actif</Text>
                                        </View>
                                        <View style={styles.routeDisplay}>
                                            <View style={styles.routePoint}>
                                                <View style={[styles.dot, { backgroundColor: COLORS.primary }]} />
                                                <Text style={styles.routeText}>{myActiveRide.pickup_address}</Text>
                                            </View>
                                            <View style={styles.routeLine} />
                                            <View style={styles.routePoint}>
                                                <View style={[styles.dot, { backgroundColor: COLORS.secondary }]} />
                                                <Text style={styles.routeText}>{myActiveRide.dropoff_address}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.publishedInfo}>
                                            <Text style={styles.publishedInfoItem}>
                                                💰 {myActiveRide.current_price_per_person.toLocaleString()} F/place
                                            </Text>
                                            <Text style={styles.publishedInfoItem}>
                                                👥 {passengers.length} passager(s)
                                            </Text>
                                        </View>

                                        {/* Liste passagers */}
                                        {passengers.length > 0 && (
                                            <View style={styles.passengersList}>
                                                <Text style={styles.passengersTitle}>Passagers :</Text>
                                                {passengers.map((p, i) => (
                                                    <View key={p.id} style={styles.passengerItem}>
                                                        <Text style={styles.passengerEmoji}>👤</Text>
                                                        <View style={styles.passengerInfo}>
                                                            <Text style={styles.passengerName}>{p.user_name}</Text>
                                                            <Text style={styles.passengerRoute}>
                                                                {p.pickup_address} → {p.dropoff_address}
                                                            </Text>
                                                        </View>
                                                        <Text style={styles.passengerPrice}>
                                                            {p.price_to_pay.toLocaleString()} F
                                                        </Text>
                                                    </View>
                                                ))}
                                            </View>
                                        )}

                                        <View style={styles.actionButtons}>
                                            <TouchableOpacity style={styles.completeBtn} onPress={handleCompleteRide}>
                                                <Text style={styles.completeBtnText}>✅ Terminer</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelRide}>
                                                <Text style={styles.cancelBtnText}>Annuler</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ) : (
                                    <View style={styles.formCard}>
                                        <Text style={styles.formTitle}>📤 Publier mon trajet</Text>

                                        <View style={styles.inputGroup}>
                                            <Text style={styles.inputLabel}>🟢 Départ</Text>
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Ex: Cocody Angré"
                                                placeholderTextColor={COLORS.gray500}
                                                value={myRoute.pickup}
                                                onChangeText={t => setMyRoute({ ...myRoute, pickup: t })}
                                            />
                                        </View>

                                        <View style={styles.inputGroup}>
                                            <Text style={styles.inputLabel}>🟠 Destination</Text>
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Ex: Plateau Centre"
                                                placeholderTextColor={COLORS.gray500}
                                                value={myRoute.dropoff}
                                                onChangeText={t => setMyRoute({ ...myRoute, dropoff: t })}
                                            />
                                        </View>

                                        <View style={styles.inputRow}>
                                            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                                                <Text style={styles.inputLabel}>⏰ Heure</Text>
                                                <TextInput
                                                    style={styles.input}
                                                    placeholder="18:00"
                                                    placeholderTextColor={COLORS.gray500}
                                                    value={myRoute.time}
                                                    onChangeText={t => setMyRoute({ ...myRoute, time: t })}
                                                />
                                            </View>
                                            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                                                <Text style={styles.inputLabel}>👥 Places</Text>
                                                <TextInput
                                                    style={styles.input}
                                                    placeholder="3"
                                                    placeholderTextColor={COLORS.gray500}
                                                    keyboardType="number-pad"
                                                    value={myRoute.seats}
                                                    onChangeText={t => setMyRoute({ ...myRoute, seats: t })}
                                                />
                                            </View>
                                        </View>

                                        <View style={styles.inputGroup}>
                                            <Text style={styles.inputLabel}>💰 Prix par place (FCFA)</Text>
                                            <TextInput
                                                style={styles.input}
                                                placeholder="1500"
                                                placeholderTextColor={COLORS.gray500}
                                                keyboardType="number-pad"
                                                value={myRoute.price}
                                                onChangeText={t => setMyRoute({ ...myRoute, price: t })}
                                            />
                                        </View>

                                        <TouchableOpacity
                                            style={[styles.publishBtn, isPublishing && styles.publishBtnDisabled]}
                                            onPress={handlePublishRoute}
                                            disabled={isPublishing}
                                        >
                                            <LinearGradient
                                                colors={isPublishing ? [COLORS.gray500, COLORS.gray600] : [COLORS.primary, COLORS.primaryDark]}
                                                style={styles.publishBtnGradient}
                                            >
                                                <Text style={styles.publishBtnText}>
                                                    {isPublishing ? '⏳ Publication...' : '🚀 Publier'}
                                                </Text>
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        )}

                        {/* MODE 2: En Course */}
                        {activeMode === 'inride' && (
                            <View>
                                <View style={[styles.infoCard, { backgroundColor: COLORS.blue + '15' }]}>
                                    <Text style={styles.infoIcon}>🔄</Text>
                                    <Text style={[styles.infoText, { color: COLORS.blue }]}>
                                        Pendant une course VTC normale, activez le covoiturage pour accepter des passagers sur votre route.
                                    </Text>
                                </View>

                                <View style={styles.inRideToggle}>
                                    <View>
                                        <Text style={styles.inRideToggleTitle}>🔄 Covoit en cours de route</Text>
                                        <Text style={styles.inRideToggleSubtitle}>
                                            {carpoolEnabled ? 'Les passagers peuvent vous voir' : 'Activer pour gagner plus'}
                                        </Text>
                                    </View>
                                    <Switch
                                        value={carpoolEnabled}
                                        onValueChange={handleToggleCarpoolInRide}
                                        trackColor={{ false: COLORS.gray400, true: COLORS.primaryDark }}
                                        thumbColor={carpoolEnabled ? COLORS.primary : COLORS.white}
                                    />
                                </View>

                                <View style={styles.gainsExplanation}>
                                    <Text style={styles.gainsTitle}>💰 Comment ça marche ?</Text>
                                    <Text style={styles.gainsText}>
                                        • Passager 1 paye moins (-20%){'\n'}
                                        • Passager 2 paye son trajet{'\n'}
                                        • Vous gagnez plus (+12% minimum){'\n'}
                                        • Commission prélevée à la fin
                                    </Text>
                                </View>
                            </View>
                        )}

                        {/* MODE 3: Autres trajets */}
                        {activeMode === 'join' && (
                            <View>
                                <View style={[styles.infoCard, { backgroundColor: COLORS.purple + '15' }]}>
                                    <Text style={styles.infoIcon}>👀</Text>
                                    <Text style={[styles.infoText, { color: COLORS.purple }]}>
                                        Trajets publiés par d'autres chauffeurs
                                    </Text>
                                </View>

                                {availableRides.length === 0 ? (
                                    <View style={styles.emptyState}>
                                        <Text style={styles.emptyIcon}>🚗</Text>
                                        <Text style={styles.emptyTitle}>Aucun trajet disponible</Text>
                                        <Text style={styles.emptyText}>
                                            Les trajets des autres chauffeurs apparaîtront ici
                                        </Text>
                                    </View>
                                ) : (
                                    availableRides.map(ride => (
                                        <View key={ride.id} style={styles.rideCard}>
                                            <View style={styles.rideHeader}>
                                                <View style={styles.rideDriverInfo}>
                                                    <Text style={styles.rideDriverPhoto}>👨🏾</Text>
                                                    <View>
                                                        <Text style={styles.rideDriverName}>{ride.driver_name || 'Chauffeur'}</Text>
                                                        <Text style={styles.rideDriverRating}>⭐ 4.8</Text>
                                                    </View>
                                                </View>
                                                <View style={styles.ridePriceTag}>
                                                    <Text style={styles.ridePriceValue}>
                                                        {ride.current_price_per_person.toLocaleString()} F
                                                    </Text>
                                                    <Text style={styles.ridePriceLabel}>/place</Text>
                                                </View>
                                            </View>
                                            <View style={styles.rideRoute}>
                                                <View style={styles.routePoint}>
                                                    <View style={[styles.dot, { backgroundColor: COLORS.primary }]} />
                                                    <Text style={styles.routeText}>{ride.pickup_address}</Text>
                                                </View>
                                                <View style={styles.routeLine} />
                                                <View style={styles.routePoint}>
                                                    <View style={[styles.dot, { backgroundColor: COLORS.secondary }]} />
                                                    <Text style={styles.routeText}>{ride.dropoff_address}</Text>
                                                </View>
                                            </View>
                                            <View style={styles.rideFooter}>
                                                <Text style={styles.rideFooterItem}>
                                                    👥 {ride.current_passengers}/{ride.max_passengers} places
                                                </Text>
                                            </View>
                                        </View>
                                    ))
                                )}
                            </View>
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
    header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    headerTitle: { fontSize: 26, fontWeight: 'bold', color: COLORS.white },
    headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
    toggleContainer: { alignItems: 'center' },
    toggleLabel: { fontSize: 11, color: COLORS.white, marginBottom: 4 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14, paddingVertical: 12 },
    statItem: { alignItems: 'center' },
    statValue: { fontSize: 18, fontWeight: 'bold', color: COLORS.white },
    statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
    statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
    modeSelector: { flexDirection: 'row', marginHorizontal: 16, marginTop: -10, zIndex: 10 },
    modeBtn: { flex: 1, backgroundColor: COLORS.white, paddingVertical: 12, borderRadius: 12, marginHorizontal: 4, alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8 },
    modeBtnActive: { backgroundColor: COLORS.secondary },
    modeBtnIcon: { fontSize: 20, marginBottom: 2 },
    modeBtnText: { fontSize: 11, fontWeight: '600', color: COLORS.gray600 },
    modeBtnTextActive: { color: COLORS.white },
    content: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
    loadingContainer: { alignItems: 'center', paddingVertical: 60 },
    loadingText: { marginTop: 12, color: COLORS.gray600 },
    infoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary + '15', borderRadius: 12, padding: 14, marginBottom: 16 },
    infoIcon: { fontSize: 24, marginRight: 12 },
    infoText: { flex: 1, fontSize: 13, color: COLORS.primaryDark, lineHeight: 18 },
    formCard: { backgroundColor: COLORS.white, borderRadius: 20, padding: 20, elevation: 3, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10 },
    formTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.black, marginBottom: 16 },
    inputGroup: { marginBottom: 14 },
    inputLabel: { fontSize: 13, fontWeight: '600', color: COLORS.gray600, marginBottom: 6 },
    input: { backgroundColor: COLORS.gray100, borderRadius: 12, padding: 14, fontSize: 15, color: COLORS.black },
    inputRow: { flexDirection: 'row' },
    publishBtn: { marginTop: 8 },
    publishBtnDisabled: { opacity: 0.7 },
    publishBtnGradient: { paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
    publishBtnText: { fontSize: 16, fontWeight: 'bold', color: COLORS.white },
    publishedCard: { backgroundColor: COLORS.white, borderRadius: 20, padding: 20, elevation: 3 },
    publishedHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    publishedIcon: { fontSize: 28, marginRight: 10 },
    publishedTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary },
    routeDisplay: { marginBottom: 12 },
    routePoint: { flexDirection: 'row', alignItems: 'center' },
    dot: { width: 12, height: 12, borderRadius: 6, marginRight: 10 },
    routeLine: { width: 2, height: 20, backgroundColor: COLORS.gray200, marginLeft: 5, marginVertical: 4 },
    routeText: { fontSize: 15, color: COLORS.black, flex: 1 },
    publishedInfo: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
    publishedInfoItem: { fontSize: 14, color: COLORS.gray600 },
    passengersList: { marginBottom: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.gray100 },
    passengersTitle: { fontSize: 14, fontWeight: '600', color: COLORS.black, marginBottom: 8 },
    passengerItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
    passengerEmoji: { fontSize: 24, marginRight: 10 },
    passengerInfo: { flex: 1 },
    passengerName: { fontSize: 14, fontWeight: '600', color: COLORS.black },
    passengerRoute: { fontSize: 12, color: COLORS.gray500 },
    passengerPrice: { fontSize: 14, fontWeight: 'bold', color: COLORS.primary },
    actionButtons: { flexDirection: 'row', gap: 12 },
    completeBtn: { flex: 1, backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
    completeBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: 15 },
    cancelBtn: { flex: 1, backgroundColor: COLORS.error + '15', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
    cancelBtnText: { color: COLORS.error, fontWeight: '600', fontSize: 15 },
    inRideToggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 14, padding: 16, marginBottom: 16, elevation: 2 },
    inRideToggleTitle: { fontSize: 15, fontWeight: '600', color: COLORS.black },
    inRideToggleSubtitle: { fontSize: 12, color: COLORS.gray500, marginTop: 2 },
    gainsExplanation: { backgroundColor: COLORS.gray100, borderRadius: 14, padding: 16, marginTop: 8 },
    gainsTitle: { fontSize: 14, fontWeight: '600', color: COLORS.black, marginBottom: 8 },
    gainsText: { fontSize: 13, color: COLORS.gray600, lineHeight: 20 },
    emptyState: { alignItems: 'center', paddingVertical: 40 },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyTitle: { fontSize: 18, fontWeight: '600', color: COLORS.black, marginBottom: 8 },
    emptyText: { fontSize: 14, color: COLORS.gray500, textAlign: 'center' },
    rideCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 12, elevation: 3 },
    rideHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    rideDriverInfo: { flexDirection: 'row', alignItems: 'center' },
    rideDriverPhoto: { fontSize: 36, marginRight: 12 },
    rideDriverName: { fontSize: 15, fontWeight: '600', color: COLORS.black },
    rideDriverRating: { fontSize: 13, color: COLORS.gray500 },
    ridePriceTag: { alignItems: 'flex-end' },
    ridePriceValue: { fontSize: 18, fontWeight: 'bold', color: COLORS.secondary },
    ridePriceLabel: { fontSize: 11, color: COLORS.gray500 },
    rideRoute: { marginBottom: 12 },
    rideFooter: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.gray100 },
    rideFooterItem: { fontSize: 12, color: COLORS.gray600 },
});
