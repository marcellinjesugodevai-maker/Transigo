import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    StatusBar,
    Animated,
    Alert,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { useRideRequests } from '../src/services/useRideRequests';
import { useDriverStore } from '../src/stores/driverStore';

const { width } = Dimensions.get('window');

const COLORS = {
    primary: '#FF6B00',
    secondary: '#00C853',
    white: '#FFFFFF',
    black: '#1A1A2E',
    gray: '#757575',
    listening: '#F44336', // Rouge pour écoute
};

export default function VoiceCopilotScreen() {
    const { driver, isOnline } = useDriverStore();
    const { currentRequest, acceptRide } = useRideRequests(driver, isOnline);

    const [isListening, setIsListening] = useState(false);
    const [statusText, setStatusText] = useState("Appuyez pour parler");
    const [recognizedText, setRecognizedText] = useState("");

    // Animation de pulsation pour le micro
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (isListening) {
            startPulse();
            // Simulation de reconnaissance après 3 secondes
            const timer = setTimeout(() => {
                handleSimulation();
            }, 3000);
            return () => clearTimeout(timer);
        } else {
            pulseAnim.setValue(1);
        }
    }, [isListening]);

    const startPulse = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.2, duration: 500, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
            ])
        ).start();
    };

    const toggleListening = () => {
        if (!isListening) {
            setIsListening(true);
            setStatusText("Je vous écoute...");
            setRecognizedText("");
            Speech.speak("Je vous écoute.", { language: 'fr-FR' });
        } else {
            setIsListening(false);
            setStatusText("Appuyez pour parler");
        }
    };

    const handleSimulation = () => {
        setIsListening(false);
        const commands = [
            {
                text: "Accepter la course",
                action: async () => {
                    if (currentRequest && driver) {
                        const success = await acceptRide(driver.id);
                        if (success) {
                            Alert.alert("Succès", "Course acceptée par la voix ! ✅");
                            router.replace('/driver-navigation?type=pickup');
                        }
                    } else {
                        Alert.alert("Commande", "Aucune course disponible à accepter.");
                    }
                }
            },
            { text: "Appeler le client", action: () => Alert.alert("Commande", "Appel en cours... 📞") },
            { text: "Rentrer à la maison", action: () => router.push('/home-direction') },
            { text: "Mes gains", action: () => router.push('/(tabs)/earnings') }
        ];

        // Pour la démo, on privilégie l'acceptation si une requête est en cours
        let chosenCmd;
        if (currentRequest) {
            chosenCmd = commands[0];
        } else {
            // Sinon choix aléatoire parmi les autres
            const others = commands.slice(1);
            chosenCmd = others[Math.floor(Math.random() * others.length)];
        }

        setRecognizedText(chosenCmd.text);
        setStatusText("Commande reconnue !");
        Speech.speak(`D'accord, je lance : ${chosenCmd.text}`, { language: 'fr-FR' });

        // Exécuter l'action après un court délai
        setTimeout(() => {
            chosenCmd.action();
        }, 1500);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={['#1A1A2E', '#16213E']} style={styles.background}>

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="close" size={28} color={COLORS.white} />
                    </TouchableOpacity>
                    <Text style={styles.title}>TransiGo Copilot 🎙️</Text>
                </View>

                {/* Main Content */}
                <View style={styles.content}>
                    <Text style={styles.statusText}>{statusText}</Text>
                    {recognizedText ? (
                        <Text style={styles.recognizedText}>"{recognizedText}"</Text>
                    ) : null}

                    <View style={styles.micContainer}>
                        {isListening && (
                            <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulseAnim }], opacity: 0.3 }]} />
                        )}
                        <TouchableOpacity
                            style={[styles.micButton, isListening && styles.micButtonActive]}
                            onPress={toggleListening}
                            activeOpacity={0.8}
                        >
                            <Ionicons name={isListening ? "mic" : "mic-outline"} size={48} color={COLORS.white} />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.hintText}>
                        Essayez : "Accepter la course", "Appeler", "Mes gains"...
                    </Text>
                </View>

            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    background: { flex: 1 },
    header: { paddingTop: 50, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center' },
    backButton: { padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, marginRight: 16 },
    title: { fontSize: 20, fontWeight: 'bold', color: COLORS.white },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
    statusText: { fontSize: 24, color: COLORS.white, fontWeight: '600', marginBottom: 20, textAlign: 'center' },
    recognizedText: { fontSize: 18, color: COLORS.secondary, fontStyle: 'italic', marginBottom: 40, textAlign: 'center' },
    micContainer: { position: 'relative', width: 150, height: 150, justifyContent: 'center', alignItems: 'center', marginBottom: 50 },
    pulseCircle: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: COLORS.primary },
    micButton: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', elevation: 10, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 10 },
    micButtonActive: { backgroundColor: COLORS.listening },
    hintText: { color: COLORS.gray, textAlign: 'center', fontSize: 14, position: 'absolute', bottom: 60 },
});
