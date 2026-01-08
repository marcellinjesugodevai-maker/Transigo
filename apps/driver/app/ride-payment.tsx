import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

export default function RidePaymentScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Paiement</Text>
            <Text style={styles.subtitle}>Course terminée. En attente de paiement.</Text>

            <TouchableOpacity style={styles.btn} onPress={() => router.replace('/(tabs)/home')}>
                <Text style={styles.btnText}>Retour Accueil</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
    subtitle: { fontSize: 16, color: '#666', marginBottom: 30 },
    btn: { backgroundColor: '#FF6B00', padding: 15, borderRadius: 10 },
    btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
