import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useDriverStore } from '../src/stores/driverStore';
import { driverService } from '../src/services/supabaseService';

const COLORS = {
    primary: '#FF6B00',
    secondary: '#00C853',
    secondaryDark: '#00A344',
    white: '#FFFFFF',
    black: '#1A1A2E',
    gray50: '#FAFAFA',
    gray100: '#F5F5F5',
    gray600: '#757575',
    success: '#4CAF50',
    warning: '#FF9800'
};

export default function DriverDocumentsScreen() {
    const { driver: storeDriver } = useDriverStore();
    const [loading, setLoading] = useState(true);
    const [driverData, setDriverData] = useState<any>(null);

    useEffect(() => {
        if (storeDriver?.id) {
            fetchLatestDocs();
        }
    }, [storeDriver?.id]);

    const fetchLatestDocs = async () => {
        setLoading(true);
        const { driver, error } = await driverService.getProfile(storeDriver!.id);
        if (driver) {
            setDriverData(driver);
        }
        setLoading(false);
    };

    const documents = [
        { key: 'id_card_url', label: 'Carte d\'Identité / Passeport', url: driverData?.id_card_url },
        { key: 'license_front_url', label: 'Permis de conduire (Recto)', url: driverData?.license_front_url },
        { key: 'license_back_url', label: 'Permis de conduire (Verso)', url: driverData?.license_back_url },
        { key: 'registration_card_url', label: 'Carte Grise du véhicule', url: driverData?.registration_card_url },
        { key: 'insurance_url', label: 'Attestation d\'assurance', url: driverData?.insurance_url },
    ];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <LinearGradient colors={[COLORS.secondary, COLORS.secondaryDark]} style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Text style={{ fontSize: 24, color: COLORS.white }}>⬅️</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Documents</Text>
            </LinearGradient>

            {loading ? (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color={COLORS.secondary} />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.statusBanner}>
                        <Text style={{ fontSize: 24, marginRight: 10 }}>
                            {driverData?.is_verified ? '✅' : '⏳'}
                        </Text>
                        <View style={styles.statusInfo}>
                            <Text style={styles.statusTitle}>
                                {driverData?.is_verified ? 'Compte vérifié' : 'Vérification en cours'}
                            </Text>
                            <Text style={styles.statusDesc}>
                                {driverData?.is_verified
                                    ? 'Tous vos documents ont été validés. Bonne route !'
                                    : 'Nos équipes examinent vos documents. Délai estimé : 24-48h.'}
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.sectionTitle}>Liste des documents</Text>

                    {documents.map((doc) => (
                        <View key={doc.key} style={styles.docItem}>
                            <View style={styles.docInfo}>
                                <Text style={{ fontSize: 28, color: COLORS.secondary, marginRight: 15 }}>📄</Text>
                                <View style={styles.docText}>
                                    <Text style={styles.docLabel}>{doc.label}</Text>
                                    <View style={styles.docStatusRow}>
                                        <Text style={[
                                            styles.docStatusText,
                                            { color: doc.url ? COLORS.success : COLORS.gray600 }
                                        ]}>
                                            {doc.url ? '● Soumis' : '○ Manquant'}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                            {doc.url ? (
                                <Text style={{ fontSize: 20, color: COLORS.success }}>✅</Text>
                            ) : (
                                <TouchableOpacity style={styles.uploadBtn}>
                                    <Text style={styles.uploadBtnText}>Charger</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ))}

                    <View style={styles.helpCard}>
                        <Text style={styles.helpTitle}>Un problème avec vos documents ?</Text>
                        <Text style={styles.helpDesc}>
                            Si un document a été rejeté, vous recevrez une notification précisant le motif. Contactez le support pour plus d'aide.
                        </Text>
                        <TouchableOpacity
                            style={styles.supportBtn}
                            onPress={() => router.push('/help')}
                        >
                            <Text style={styles.supportBtnText}>Contacter le support</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            )}
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
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    content: { padding: 20 },
    statusBanner: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        padding: 16,
        borderRadius: 16,
        marginBottom: 24,
        alignItems: 'center',
        elevation: 2,
    },
    statusInfo: { marginLeft: 15, flex: 1 },
    statusTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.black },
    statusDesc: { fontSize: 13, color: COLORS.gray600, marginTop: 4 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.black, marginBottom: 15 },
    docItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.white,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        elevation: 1,
    },
    docInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    docText: { marginLeft: 15 },
    docLabel: { fontSize: 14, fontWeight: '600', color: COLORS.black },
    docStatusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    docStatusText: { fontSize: 12, fontWeight: '500' },
    uploadBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: COLORS.gray100,
    },
    uploadBtnText: { fontSize: 12, fontWeight: '600', color: COLORS.secondary },
    helpCard: {
        backgroundColor: '#E8F5E9',
        padding: 20,
        borderRadius: 16,
        marginTop: 20,
    },
    helpTitle: { fontSize: 15, fontWeight: 'bold', color: COLORS.black },
    helpDesc: { fontSize: 13, color: COLORS.gray600, marginTop: 8, lineHeight: 18 },
    supportBtn: {
        marginTop: 15,
        alignSelf: 'flex-start',
    },
    supportBtnText: { color: COLORS.secondary, fontWeight: 'bold', fontSize: 14 },
});
