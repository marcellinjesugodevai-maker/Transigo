import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, StatusBar, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import { openNavigation } from '../src/utils/navigation';
import { rideService } from '../src/services/supabaseService';

const COLORS = {
    primary: '#FF6B00',
    secondary: '#00C853',
    white: '#FFFFFF',
    black: '#1A1A2E',
    gray: '#757575',
    lightGray: '#F5F5F5',
};

export default function RideBoardingScreen() {
    const params = useLocalSearchParams();
    const rideId = params.rideId as string;
    const passengerName = params.passenger as string || 'Kofi Asante';
    const price = params.price as string || '2500';
    // Destination coordinates (from params or defaults for testing)
    const destLat = parseFloat(params.destLat as string) || 5.3700;
    const destLng = parseFloat(params.destLng as string) || -4.0120;
    const destAddress = params.destination as string || 'Cocody Riviera 2';

    // Simuler un état "En attente"
    const [status, setStatus] = useState('waiting'); // waiting, boarding

    const handleStartRide = async () => {
        if (rideId) {
            await rideService.updateRideStatus(rideId, 'in_progress');
        }

        // Annonce vocale de bienvenue (Effet Premium & Sécurité)
        Speech.speak(`Bonjour ${passengerName}, bienvenue à bord de TransiGo. Nous sommes partis pour votre destination. Pour votre sécurité, je vous invite à attacher votre ceinture. Installez-vous confortablement et profitez du trajet.`, {
            language: 'fr-FR',
            rate: 0.95,
            pitch: 1.0
        });

        // Ouvrir Google Maps / Waze avec les coordonnées de destination
        openNavigation(destLat, destLng, destAddress);
    };

    const handleCancel = () => {
        Alert.alert(
            "Annuler la course",
            "Êtes-vous sûr de vouloir annuler ? Des frais peuvent s'appliquer.",
            [
                { text: "Non", style: "cancel" },
                {
                    text: "Oui, Annuler", style: "destructive", onPress: async () => {
                        if (rideId) {
                            await rideService.updateRideStatus(rideId, 'cancelled');
                        }
                        router.replace('/(tabs)/home');
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            <View style={styles.header}>
                <Text style={styles.headerTitle}>Arrivé au point de prise en charge</Text>
            </View>

            <View style={styles.content}>
                {/* Info Passager */}
                <View style={styles.passengerCard}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{passengerName.charAt(0)}</Text>
                        </View>
                        <View style={styles.badgeContainer}>
                            <Text style={{ fontSize: 12 }}>⭐</Text>
                            <Text style={styles.badgeText}>4.8</Text>
                        </View>
                    </View>
                    <Text style={styles.passengerName}>{passengerName}</Text>
                    <Text style={styles.paymentMethod}>Paiement Espèces • {price} FCFA</Text>

                    <View style={styles.actionsRow}>
                        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push(`/driver-chat?name=${passengerName}`)}>
                            <Text style={{ fontSize: 24 }}>💬</Text>
                            <Text style={styles.actionText}>Message</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionBtn}>
                            <Text style={{ fontSize: 24 }}>📞</Text>
                            <Text style={styles.actionText}>Appeler</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Status Animation */}
                <View style={styles.statusContainer}>
                    <View style={styles.pulseDisk}>
                        <Text style={{ fontSize: 40 }}>🧘</Text>
                    </View>
                    <Text style={styles.statusText}>En attente du passager...</Text>
                    <Text style={styles.timerText}>02:30 min d'attente gratuite</Text>
                </View>

                {/* Slider / Button to Start */}
                <View style={styles.footer}>
                    <TouchableOpacity style={styles.startBtn} onPress={handleStartRide}>
                        <LinearGradient
                            colors={[COLORS.secondary, '#00A344']}
                            style={styles.gradientBtn}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.startBtnText}>DÉMARRER LA COURSE</Text>
                            <Text style={{ fontSize: 24, color: COLORS.white }}>➡️</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
                        <Text style={styles.cancelText}>Annuler la course</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.lightGray },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: COLORS.white,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.black },
    content: { flex: 1, padding: 20, justifyContent: 'space-between' },
    passengerCard: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    avatarContainer: { marginBottom: 10 },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#E3F2FD',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: { fontSize: 32, fontWeight: 'bold', color: '#1565C0' },
    badgeContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: COLORS.primary,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    badgeText: { color: COLORS.white, fontWeight: 'bold', fontSize: 12, marginLeft: 2 },
    passengerName: { fontSize: 20, fontWeight: 'bold', color: COLORS.black, marginBottom: 5 },
    paymentMethod: { fontSize: 14, color: COLORS.gray, marginBottom: 20 },
    actionsRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-around' },
    actionBtn: { alignItems: 'center' },
    actionText: { marginTop: 5, color: COLORS.primary, fontWeight: '600' },

    statusContainer: { alignItems: 'center', justifyContent: 'center', flex: 1 },
    pulseDisk: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#E8F5E9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 2,
        borderColor: COLORS.secondary,
    },
    statusText: { fontSize: 18, fontWeight: '600', color: COLORS.black, marginBottom: 5 },
    timerText: { fontSize: 14, color: COLORS.gray },

    footer: { width: '100%' },
    startBtn: { marginBottom: 15, shadowColor: COLORS.secondary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
    gradientBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 16 },
    startBtnText: { color: COLORS.white, fontSize: 18, fontWeight: 'bold', marginRight: 10, letterSpacing: 1 },
    cancelBtn: { alignItems: 'center', padding: 10 },
    cancelText: { color: '#F44336', fontSize: 16, fontWeight: '500' },
});

