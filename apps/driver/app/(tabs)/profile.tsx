import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useDriverStore } from '../../src/stores/driverStore';
import { useProfileTerms } from '../../src/hooks/useProfileTerms';
import { authService } from '../../src/services/supabaseService';

const COLORS = { primary: '#FF6B00', secondary: '#00C853', secondaryDark: '#00A344', white: '#FFFFFF', black: '#1A1A2E', gray50: '#FAFAFA', gray100: '#F5F5F5', gray600: '#757575', error: '#FF3D00' };

export default function ProfileScreen() {
    const { driver, vehicle } = useDriverStore();
    const terms = useProfileTerms(); // Dynamic terminology

    const handleLogout = async () => {
        await authService.signOut();
        router.replace('/(auth)/login');
    };

    const menuItems = [
        { icon: 'car-outline', label: 'Mon véhicule', route: '/driver-vehicle' },
        { icon: 'document-text-outline', label: 'Documents', route: '/driver-documents' },
        { icon: 'wallet-outline', label: 'Paiements', route: '/wallet' },
        { icon: 'notifications-outline', label: 'Notifications', route: '/driver-notifications' },
        { icon: 'help-circle-outline', label: 'Aide', route: '/help' },
    ];

    if (!driver) return null;

    return (
        <ScrollView style={styles.container}>
            {/* Header */}
            <LinearGradient colors={[COLORS.secondary, COLORS.secondaryDark]} style={styles.header}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {driver.firstName?.charAt(0)}{driver.lastName?.charAt(0)}
                    </Text>
                </View>
                <Text style={styles.name}>{driver.firstName} {driver.lastName}</Text>
                <View style={styles.ratingRow}>
                    <Ionicons name="star" size={18} color="#FFB800" />
                    <Text style={styles.rating}>{driver.rating || 5.0}</Text>
                    <Text style={styles.rides}>• {driver.totalRides || 0} {terms.trips}</Text>
                </View>
                <View style={styles.levelBadge}>
                    <Text style={styles.levelText}>🏆 Niveau {driver.level?.toUpperCase() || 'BRONZE'}</Text>
                </View>
            </LinearGradient>

            {/* Vehicle Info */}
            <TouchableOpacity style={styles.vehicleCard} onPress={() => router.push('/driver-vehicle')}>
                <Ionicons
                    name={driver.profileType === 'delivery' ? 'bicycle' : 'car'}
                    size={32}
                    color={COLORS.secondary}
                />
                <View style={styles.vehicleInfo}>
                    <Text style={styles.vehicleName}>
                        {vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Véhicule non défini'}
                    </Text>
                    <Text style={styles.vehiclePlate}>
                        {vehicle?.plate || 'Plaque d\'immatriculation'}
                    </Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color={COLORS.gray600} />
            </TouchableOpacity>

            {/* Menu */}
            <View style={styles.menu}>
                {menuItems.map((item, i) => (
                    <TouchableOpacity
                        key={i}
                        style={styles.menuItem}
                        onPress={() => item.route && router.push(item.route as any)}
                    >
                        <Ionicons name={item.icon as any} size={22} color={COLORS.gray600} />
                        <Text style={styles.menuLabel}>{item.label}</Text>
                        <Ionicons name="chevron-forward" size={20} color={COLORS.gray600} />
                    </TouchableOpacity>
                ))}
            </View>

            {/* Logout */}
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={22} color={COLORS.error} />
                <Text style={styles.logoutText}>Déconnexion</Text>
            </TouchableOpacity>

            <Text style={styles.version}>TransiGo Driver v1.0.0</Text>
            <View style={{ height: 100 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.gray50 },
    header: { paddingTop: 70, paddingBottom: 30, alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    avatarText: { fontSize: 32, fontWeight: 'bold', color: COLORS.secondary },
    name: { fontSize: 22, fontWeight: 'bold', color: COLORS.white },
    ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 },
    rating: { fontSize: 16, fontWeight: '600', color: COLORS.white },
    rides: { fontSize: 14, color: COLORS.white, opacity: 0.9 },
    levelBadge: { backgroundColor: '#FFD700', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginTop: 12 },
    levelText: { fontSize: 14, fontWeight: '600', color: COLORS.black },
    vehicleCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, marginHorizontal: 24, marginTop: -20, padding: 16, borderRadius: 16, elevation: 5 },
    vehicleInfo: { flex: 1, marginLeft: 12 },
    vehicleName: { fontSize: 16, fontWeight: '600', color: COLORS.black },
    vehiclePlate: { fontSize: 14, color: COLORS.gray600 },
    menu: { backgroundColor: COLORS.white, marginHorizontal: 24, marginTop: 24, borderRadius: 16 },
    menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
    menuLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: COLORS.black, marginLeft: 12 },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 24, marginTop: 24, padding: 16, backgroundColor: '#FFEBEE', borderRadius: 12 },
    logoutText: { fontSize: 16, fontWeight: '600', color: COLORS.error, marginLeft: 8 },
    version: { textAlign: 'center', fontSize: 12, color: COLORS.gray600, marginTop: 24 },
});
