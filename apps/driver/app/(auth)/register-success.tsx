import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useDriverRegStore } from '../../src/stores/driverRegStore';
import { useEffect } from 'react';

const COLORS = { primary: '#FF6B00', secondary: '#00C853', secondaryDark: '#00A344', white: '#FFFFFF', black: '#1A1A2E', gray600: '#757575' };

export default function RegisterSuccessScreen() {
    const { reset } = useDriverRegStore();

    useEffect(() => {
        // Reset form data on mount (or unmount)
        return () => reset();
    }, []);

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Text style={{ fontSize: 100 }}>✅</Text>
                </View>
                <Text style={styles.title}>Dossier Reçu !</Text>
                <Text style={styles.message}>
                    Merci d'avoir soumis votre candidature chez TransiGo. Notre équipe va examiner vos documents sous 24h.
                </Text>
                <Text style={styles.subMessage}>
                    Vous recevrez un SMS et un email dès que votre compte sera activé.
                </Text>
            </View>

            <TouchableOpacity style={styles.button} onPress={() => router.navigate('/(auth)/login')}>
                <LinearGradient colors={[COLORS.secondary, COLORS.secondaryDark]} style={styles.gradientBtn}>
                    <Text style={styles.buttonText}>Retour à l'accueil</Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.white, padding: 24, justifyContent: 'center' },
    content: { alignItems: 'center', flex: 1, justifyContent: 'center' },
    iconContainer: { marginBottom: 24 },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
    message: { fontSize: 16, color: COLORS.gray600, textAlign: 'center', marginBottom: 24, lineHeight: 24 },
    subMessage: { fontSize: 14, color: COLORS.black, textAlign: 'center', fontWeight: '500' },

    button: { borderRadius: 12, overflow: 'hidden', marginBottom: 20 },
    gradientBtn: { paddingVertical: 18, alignItems: 'center' },
    buttonText: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },
});
