import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { openNavigation } from '../src/utils/navigation';

export default function RideActiveScreen() {
    const params = useLocalSearchParams();
    // Destination coordinates (from params or defaults)
    const destLat = parseFloat(params.destLat as string) || 5.3700;
    const destLng = parseFloat(params.destLng as string) || -4.0120;

    const handleOpenNavigation = () => {
        openNavigation(destLat, destLng, 'Destination');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Course en cours...</Text>
            <Text style={styles.subtitle}>Le trajet a commencé.</Text>

            <TouchableOpacity style={styles.btn} onPress={handleOpenNavigation}>
                <Text style={styles.btnText}>Ouvrir Google Maps</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
    subtitle: { fontSize: 16, color: '#666', marginBottom: 30 },
    btn: { backgroundColor: '#00C853', padding: 15, borderRadius: 10 },
    btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
