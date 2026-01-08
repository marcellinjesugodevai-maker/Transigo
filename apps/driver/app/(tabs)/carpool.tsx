// Driver Carpool Screen (UI)
import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { useCarpoolDriverStore } from '../../src/stores/carpoolDriverStore';
import { carpoolDriverService } from '../../src/services/carpoolDriverService';

// Define local theme constants since import failed
const COLORS = {
    primary: '#FF6B00',
    background: '#fff',
    card: '#f9f9f9',
    text: '#000',
    white: '#fff'
};
const SPACING = { sm: 12, md: 16, lg: 24 };

export default function CarpoolScreen() {
    const { sharedRides, addSharedRide, updateRideStatus } = useCarpoolDriverStore();

    useEffect(() => {
        // Initial load (optional) could fetch existing rides
        const subscription = carpoolDriverService.subscribeToSharedRides((ride) => {
            // Avoid duplicates is handled in store now
            addSharedRide(ride);
        });
        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const handleAccept = async (rideId: string) => {
        // Assume driverId is available from auth store; using placeholder
        const driverId = 'CURRENT_DRIVER_ID';
        const { ride, error } = await carpoolDriverService.acceptSharedRide(rideId, driverId);
        if (!error && ride) {
            // Update local state to reflect assignment
            updateRideStatus(rideId, 'accepted');
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <Text style={styles.title}>Trajet #{item.id.slice(0, 6)}</Text>
            <Text>De: {item.pickup_address}</Text>
            <Text>Vers: {item.dropoff_address}</Text>
            <Text>Status: {item.status}</Text>
            {item.status === 'open' && (
                <TouchableOpacity style={styles.button} onPress={() => handleAccept(item.id)}>
                    <Text style={styles.buttonText}>Accepter</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Covoiturage - Courses disponibles</Text>
            <FlatList data={sharedRides} keyExtractor={(item) => item.id} renderItem={renderItem} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        padding: SPACING.md,
    },
    header: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: SPACING.lg,
        color: COLORS.text,
    },
    card: {
        backgroundColor: COLORS.card,
        padding: SPACING.md,
        borderRadius: 12,
        marginBottom: SPACING.sm,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    button: {
        marginTop: SPACING.sm,
        backgroundColor: COLORS.primary,
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: COLORS.white,
        fontWeight: '600',
    },
});
