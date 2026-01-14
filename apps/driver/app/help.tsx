import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const COLORS = {
    primary: '#FF6B00',
    secondary: '#00C853',
    secondaryDark: '#00A344',
    white: '#FFFFFF',
    black: '#1A1A2E',
    gray50: '#FAFAFA',
    gray600: '#757575'
};

export default function HelpScreen() {
    const router = useRouter();
    const faqItems = [
        { q: 'Comment recharger mon compte ?', a: 'Allez dans l\'onglet Wallet et cliquez sur le bouton de recharge.' },
        { q: 'Ma livraison est annulée, que faire ?', a: 'Si une livraison est annulée par le client, vous recevrez une notification et serez remis en file d\'attente.' },
        { q: 'Comment changer mon véhicule ?', a: 'Allez dans Profil > Mon véhicule. Toute modification nécessite une validation.' },
        { q: 'Délai de paiement', a: 'Les retraits sont traités sous 24h ouvrées.' },
    ];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <LinearGradient colors={[COLORS.secondary, COLORS.secondaryDark]} style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Text style={{ fontSize: 24, color: COLORS.white }}>⬅️</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Aide & Support</Text>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.sectionTitle}>Questions Fréquentes</Text>

                {faqItems.map((item, i) => (
                    <View key={i} style={styles.faqItem}>
                        <Text style={styles.question}>{item.q}</Text>
                        <Text style={styles.answer}>{item.a}</Text>
                    </View>
                ))}

                <View style={styles.contactSection}>
                    <Text style={styles.contactTitle}>Besoin d'aide supplémentaire ?</Text>
                    <Text style={styles.contactDesc}>
                        Nos équipes sont disponibles 7j/7 pour vous accompagner.
                    </Text>

                    <TouchableOpacity
                        style={[styles.contactBtn, { backgroundColor: COLORS.primary, marginBottom: 12 }]}
                        onPress={() => router.push('/support-chat')}
                    >
                        <Text style={{ fontSize: 24, marginRight: 10 }}>💬</Text>
                        <Text style={styles.contactBtnText}>Discussion en direct</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.contactBtn}>
                        <Text style={{ fontSize: 24, marginRight: 10 }}>📱</Text>
                        <Text style={styles.contactBtnText}>Contacter sur WhatsApp</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.contactBtn, { backgroundColor: COLORS.black, marginTop: 12 }]}>
                        <Text style={{ fontSize: 24, marginRight: 10 }}>✉️</Text>
                        <Text style={styles.contactBtnText}>Envoyer un email</Text>
                    </TouchableOpacity>
                </View>
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
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.black, marginBottom: 15 },
    faqItem: {
        backgroundColor: COLORS.white,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        elevation: 1,
    },
    question: { fontSize: 15, fontWeight: 'bold', color: COLORS.black, marginBottom: 8 },
    answer: { fontSize: 13, color: COLORS.gray600, lineHeight: 18 },
    contactSection: {
        marginTop: 30,
        padding: 24,
        backgroundColor: '#E8F5E9',
        borderRadius: 20,
        alignItems: 'center',
    },
    contactTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.black, textAlign: 'center' },
    contactDesc: { fontSize: 13, color: COLORS.gray600, textAlign: 'center', marginTop: 8, marginBottom: 20 },
    contactBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#25D366',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        width: '100%',
        justifyContent: 'center',
    },
    contactBtnText: { color: COLORS.white, fontSize: 15, fontWeight: 'bold', marginLeft: 10 },
});
