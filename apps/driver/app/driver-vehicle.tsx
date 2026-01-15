import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useDriverStore } from '../src/stores/driverStore';

const COLORS = {
    primary: '#FF6B00',
    secondary: '#00C853',
    secondaryDark: '#00A344',
    white: '#FFFFFF',
    black: '#1A1A2E',
    gray50: '#FAFAFA',
    gray100: '#F5F5F5',
    gray600: '#757575'
};

export default function DriverVehicleScreen() {
    const { driver, vehicle } = useDriverStore();

    const isDelivery = driver?.profileType === 'delivery';

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <LinearGradient colors={[COLORS.secondary, COLORS.secondaryDark]} style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Text style={{ fontSize: 24, color: COLORS.white }}>⬅️</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mon véhicule</Text>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.vehicleIconContainer}>
                    <Text style={{ fontSize: 80 }}>
                        {isDelivery ? '🚲' : '🚗'}
                    </Text>
                </View>

                <View style={styles.infoSection}>
                    <Text style={styles.sectionLabel}>Détails du véhicule</Text>

                    <View style={styles.infoRow}>
                        <Text style={styles.fieldLabel}>Marque</Text>
                        <Text style={styles.fieldValue}>{vehicle?.brand || 'Non spécifié'}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.fieldLabel}>Modèle</Text>
                        <Text style={styles.fieldValue}>{vehicle?.model || 'Non spécifié'}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.fieldLabel}>Plaque</Text>
                        <Text style={styles.fieldValue}>{vehicle?.plate || 'Non spécifié'}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.fieldLabel}>Couleur</Text>
                        <Text style={styles.fieldValue}>{vehicle?.color || 'Non spécifié'}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.fieldLabel}>Type</Text>
                        <Text style={styles.fieldValue}>{vehicle?.type?.toUpperCase() || 'Non spécifié'}</Text>
                    </View>
                </View>

                <TouchableOpacity style={styles.editBtn}>
                    <Text style={styles.editBtnText}>Modifier les informations</Text>
                </TouchableOpacity>

                <Text style={styles.note}>
                    Note: Toute modification sera soumise à une nouvelle validation par l'équipe administrative.
                </Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.gray50 },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.white },
    content: { padding: 20 },
    vehicleIconContainer: {
        alignItems: 'center',
        marginVertical: 30,
        backgroundColor: COLORS.white,
        padding: 40,
        borderRadius: 100,
        alignSelf: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    infoSection: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 20,
        elevation: 2,
    },
    sectionLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.black,
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray100,
        paddingBottom: 10,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray100,
    },
    fieldLabel: { fontSize: 14, color: COLORS.gray600 },
    fieldValue: { fontSize: 14, fontWeight: '600', color: COLORS.black },
    editBtn: {
        backgroundColor: COLORS.secondary,
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 30,
    },
    editBtnText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
    note: {
        textAlign: 'center',
        fontSize: 12,
        color: COLORS.gray600,
        marginTop: 20,
        fontStyle: 'italic',
    },
});

