import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useDriverStore } from '../../src/stores/driverStore';

const COLORS = {
    primary: '#00C853',
    white: '#FFFFFF',
    black: '#1A1A2E',
    gray: '#757575',
    lightGreen: '#E8F5E9'
};

export default function OnboardingIntroScreen() {
    const { driver } = useDriverStore();

    return (
        <View style={styles.container}>
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <Text style={styles.welcome}>Bienvenue {driver?.firstName || 'Partenaire'} !</Text>
                    <Text style={styles.subtitle}>
                        Votre compte est créé. Il ne reste plus qu'à l'activer pour commencer votre activité.
                    </Text>
                </View>

                <Image
                    source={require('../../assets/logo.png')} // Or an illustration
                    style={styles.illustration}
                    resizeMode="contain"
                />

                <View style={styles.stepsContainer}>
                    <Text style={styles.stepsTitle}>Procédure d'activation :</Text>

                    <View style={styles.step}>
                        <View style={styles.stepIcon}>
                            <Text style={styles.stepNumber}>1</Text>
                        </View>
                        <View style={styles.stepTextContainer}>
                            <Text style={styles.stepHeader}>Choix du Profil</Text>
                            <Text style={styles.stepDesc}>Chauffeur, Livreur ou Vendeur</Text>
                        </View>
                    </View>

                    <View style={[styles.line, { height: 20, marginLeft: 19 }]} />

                    <View style={styles.step}>
                        <View style={styles.stepIcon}>
                            <Text style={styles.stepNumber}>2</Text>
                        </View>
                        <View style={styles.stepTextContainer}>
                            <Text style={styles.stepHeader}>Documents Requis</Text>
                            <Text style={styles.stepDesc}>CNI, Permis, Registre...</Text>
                        </View>
                    </View>

                    <View style={[styles.line, { height: 20, marginLeft: 19 }]} />

                    <View style={styles.step}>
                        <View style={[styles.stepIcon, { backgroundColor: COLORS.lightGreen }]}>
                            <Ionicons name="eye" size={20} color={COLORS.primary} />
                        </View>
                        <View style={styles.stepTextContainer}>
                            <Text style={styles.stepHeader}>Vérification</Text>
                            <Text style={styles.stepDesc}>Validation par notre équipe (24h-48h)</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity onPress={() => router.push('/onboarding/choose-profile')} style={styles.btn}>
                    <LinearGradient
                        colors={[COLORS.primary, '#00A344']}
                        style={styles.gradient}
                    >
                        <Text style={styles.btnText}>Compléter mon profil</Text>
                        <Ionicons name="arrow-forward" size={24} color={COLORS.white} />
                    </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.replace('/(tabs)/home')} style={styles.skipBtn}>
                    <Text style={styles.skipText}>Plus tard (Accès limité)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={async () => {
                        try {
                            const SecureStore = require('expo-secure-store');
                            await SecureStore.deleteItemAsync('driver-store');
                        } catch (e) { console.log(e); }
                        router.replace('/(auth)/login');
                    }}
                    style={[styles.skipBtn, { marginTop: 20 }]}
                >
                    <Text style={[styles.skipText, { color: '#ef4444' }]}>🚪 Se déconnecter</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.white },
    content: { padding: 24, paddingBottom: 120 },
    header: { marginTop: 40, marginBottom: 30 },
    welcome: { fontSize: 28, fontWeight: 'bold', color: COLORS.primary, marginBottom: 8 },
    subtitle: { fontSize: 16, color: COLORS.gray, lineHeight: 24 },
    illustration: { width: '100%', height: 150, marginBottom: 40, opacity: 0.8 },

    stepsContainer: { backgroundColor: '#FAFAFA', padding: 20, borderRadius: 16 },
    stepsTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, color: COLORS.black },
    step: { flexDirection: 'row', alignItems: 'center' },
    stepIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
    stepNumber: { color: COLORS.white, fontWeight: 'bold', fontSize: 18 },
    stepTextContainer: { marginLeft: 16, flex: 1 },
    stepHeader: { fontSize: 16, fontWeight: 'bold', color: COLORS.black },
    stepDesc: { fontSize: 14, color: COLORS.gray, marginTop: 2 },
    line: { width: 2, backgroundColor: '#E0E0E0', marginVertical: 4 },

    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: '#F5F5F5' },
    btn: { borderRadius: 12, overflow: 'hidden', marginBottom: 12 },
    gradient: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, gap: 12 },
    btnText: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },
    skipBtn: { alignItems: 'center', padding: 12 },
    skipText: { color: COLORS.gray, fontSize: 14, fontWeight: '500' },
});
