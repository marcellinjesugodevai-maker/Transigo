// =============================================
// TRANSIGO - COMMANDE VOCALE
// "Hey TransiGo, réserve-moi un taxi"
// =============================================

import { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
    StatusBar,
    Alert,
    ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@/components/Icon';
import { COLORS, SPACING } from '@/constants';
import { useThemeStore, useLanguageStore } from '@/stores';
import { getTranslation } from '@/i18n/translations';
import { locationService } from '@/services/locationService';

const { width } = Dimensions.get('window');

// Commandes reconnues
const VOICE_COMMANDS = [
    {
        keywords: ['taxi', 'course', 'voiture', 'vtc', 'ride', 'car'],
        action: 'book_ride',
        response: 'Je prépare votre course...',
        responseEn: 'Preparing your ride...',
        route: '/(tabs)/home'
    },
    {
        keywords: ['aéroport', 'airport', 'fhb'],
        action: 'book_airport',
        response: 'Course vers l\'Aéroport FHB...',
        responseEn: 'Ride to FHB Airport...',
        route: '/(tabs)/home'
    },
    {
        keywords: ['livraison', 'colis', 'delivery', 'package'],
        action: 'delivery',
        response: 'Ouverture de TransiGo Delivery...',
        responseEn: 'Opening TransiGo Delivery...',
        route: '/delivery'
    },
    {
        keywords: ['manger', 'food', 'restaurant', 'nourriture', 'faim'],
        action: 'food',
        response: 'Ouverture de TransiGo Food...',
        responseEn: 'Opening TransiGo Food...',
        route: '/food'
    },
    {
        keywords: ['solde', 'portefeuille', 'wallet', 'argent', 'balance'],
        action: 'wallet',
        response: 'Affichage de votre solde...',
        responseEn: 'Showing your balance...',
        route: '/(tabs)/wallet'
    },
    {
        keywords: ['historique', 'courses', 'history', 'trips'],
        action: 'history',
        response: 'Affichage de votre historique...',
        responseEn: 'Showing your history...',
        route: '/(tabs)/activity'
    },
    {
        keywords: ['aide', 'help', 'support', 'problème'],
        action: 'help',
        response: 'Ouverture de l\'aide...',
        responseEn: 'Opening help...',
        route: '/help'
    },
    {
        keywords: ['loterie', 'jeu', 'lottery', 'game', 'gagner'],
        action: 'lottery',
        response: 'Ouverture de la loterie...',
        responseEn: 'Opening lottery...',
        route: '/lottery'
    },
];

// Exemples de commandes
const EXAMPLE_COMMANDS = [
    '🚗 "Réserve-moi un taxi"',
    '✈️ "Je veux aller à l\'aéroport"',
    '📦 "Envoyer un colis"',
    '🍔 "J\'ai faim"',
    '💰 "Quel est mon solde ?"',
    '📜 "Montre mon historique"',
    '🎰 "Jouer à la loterie"',
];

export default function VoiceCommandScreen() {
    const { isDark, colors } = useThemeStore();
    const { language } = useLanguageStore();
    const t = (key: any) => getTranslation(key, language);

    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [response, setResponse] = useState('');
    const [showExamples, setShowExamples] = useState(true);

    // Animations
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const waveAnim1 = useRef(new Animated.Value(0.3)).current;
    const waveAnim2 = useRef(new Animated.Value(0.3)).current;
    const waveAnim3 = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        if (isListening) {
            // Animation pulsation
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.2, duration: 500, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
                ])
            ).start();

            // Animation ondes
            const animateWave = (anim: Animated.Value, delay: number) => {
                Animated.loop(
                    Animated.sequence([
                        Animated.delay(delay),
                        Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }),
                        Animated.timing(anim, { toValue: 0.3, duration: 400, useNativeDriver: true }),
                    ])
                ).start();
            };

            animateWave(waveAnim1, 0);
            animateWave(waveAnim2, 150);
            animateWave(waveAnim3, 300);
        } else {
            pulseAnim.setValue(1);
            waveAnim1.setValue(0.3);
            waveAnim2.setValue(0.3);
            waveAnim3.setValue(0.3);
        }
    }, [isListening]);

    const processCommand = async (text: string) => {
        const lowerText = text.toLowerCase();

        // 1. Détection de destination (Geocoding réel)
        const destinationPatterns = [
            /aller à (.+)/i,
            /aller au (.+)/i,
            /aller aux (.+)/i,
            /vers (.+)/i,
            /destination (.+)/i,
            /amène-moi à (.+)/i,
            /amène-moi au (.+)/i,
            /dépose-moi à (.+)/i
        ];

        let targetPlace = '';
        for (const pattern of destinationPatterns) {
            const match = lowerText.match(pattern);
            if (match && match[1]) {
                targetPlace = match[1].trim();
                break;
            }
        }

        if (targetPlace) {
            setResponse(language === 'fr' ? `Recherche de "${targetPlace}"...` : `Searching for "${targetPlace}"...`);
            const results = await locationService.searchPlaces(targetPlace);

            if (results && results.length > 0) {
                const bestMatch = results[0];
                setResponse(language === 'fr'
                    ? `Destination trouvée : ${bestMatch.display_name.split(',')[0]}. On y va !`
                    : `Destination found: ${bestMatch.display_name.split(',')[0]}. Let's go!`);

                setTimeout(() => {
                    router.push({
                        pathname: '/(tabs)/home',
                        params: {
                            destLat: bestMatch.latitude.toString(),
                            destLng: bestMatch.longitude.toString(),
                            destName: bestMatch.display_name.split(',')[0]
                        }
                    });
                }, 1500);
                return;
            } else {
                setResponse(language === 'fr'
                    ? `Je n'ai pas trouvé "${targetPlace}". Essayez d'être plus précis.`
                    : `I couldn't find "${targetPlace}". Try being more specific.`);
                return;
            }
        }

        // 2. Commandes statiques (Fallback)
        for (const cmd of VOICE_COMMANDS) {
            for (const keyword of cmd.keywords) {
                if (lowerText.includes(keyword)) {
                    setResponse(language === 'fr' ? cmd.response : cmd.responseEn);
                    setTimeout(() => {
                        router.push(cmd.route as any);
                    }, 1500);
                    return;
                }
            }
        }

        // Commande non reconnue
        setResponse(language === 'fr'
            ? 'Je n\'ai pas compris. Essayez une autre commande.'
            : 'I didn\'t understand. Try another command.');
    };

    const startListening = () => {
        setIsListening(true);
        setShowExamples(false);
        setTranscript('');
        setResponse('');

        // Simulation d'écoute (en production, utiliser expo-speech ou une API de reconnaissance vocale)
        // Pour la démo, on simule avec un délai
        setTimeout(() => {
            // Simuler une commande aléatoire pour la démo
            const demoCommands = [
                'Réserve-moi un taxi',
                'Je veux aller à l\'aéroport',
                'J\'ai faim',
                'Quel est mon solde ?',
            ];
            const randomCmd = demoCommands[Math.floor(Math.random() * demoCommands.length)];
            setTranscript(randomCmd);
            setIsListening(false);
            processCommand(randomCmd);
        }, 2000);
    };

    const stopListening = () => {
        setIsListening(false);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <LinearGradient
                colors={['#673AB7', '#512DA8']}
                style={styles.header}
            >
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Icon name="arrow-back" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>🎤 {language === 'fr' ? 'Commande Vocale' : 'Voice Command'}</Text>
                    <Text style={styles.headerSubtitle}>
                        {language === 'fr' ? 'Parlez, TransiGo vous écoute' : 'Speak, TransiGo listens'}
                    </Text>
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Zone d'écoute */}
                <View style={styles.listeningZone}>
                    {/* Ondes sonores */}
                    {isListening && (
                        <View style={styles.wavesContainer}>
                            <Animated.View style={[styles.wave, { opacity: waveAnim1, transform: [{ scale: waveAnim1 }] }]} />
                            <Animated.View style={[styles.wave, styles.wave2, { opacity: waveAnim2, transform: [{ scale: waveAnim2 }] }]} />
                            <Animated.View style={[styles.wave, styles.wave3, { opacity: waveAnim3, transform: [{ scale: waveAnim3 }] }]} />
                        </View>
                    )}

                    {/* Bouton micro */}
                    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                        <TouchableOpacity
                            style={[styles.micButton, isListening && styles.micButtonActive]}
                            onPress={isListening ? stopListening : startListening}
                            activeOpacity={0.9}
                        >
                            <LinearGradient
                                colors={isListening ? ['#E91E63', '#C2185B'] : ['#4CAF50', '#388E3C']}
                                style={styles.micGradient}
                            >
                                <Icon name={isListening ? 'mic' : 'mic-outline'} size={60} color={COLORS.white} />
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>

                    <Text style={[styles.statusText, { color: colors.text }]}>
                        {isListening
                            ? (language === 'fr' ? '🎙️ Je vous écoute...' : '🎙️ Listening...')
                            : (language === 'fr' ? 'Appuyez pour parler' : 'Tap to speak')}
                    </Text>
                </View>

                {/* Transcription */}
                {transcript && (
                    <View style={[styles.transcriptCard, { backgroundColor: colors.card }]}>
                        <Text style={[styles.transcriptLabel, { color: colors.textSecondary }]}>
                            {language === 'fr' ? 'Vous avez dit :' : 'You said:'}
                        </Text>
                        <Text style={[styles.transcriptText, { color: colors.text }]}>
                            "{transcript}"
                        </Text>
                    </View>
                )}

                {/* Réponse */}
                {response && (
                    <View style={styles.responseCard}>
                        <LinearGradient
                            colors={['#4CAF50', '#388E3C']}
                            style={styles.responseGradient}
                        >
                            <Text style={styles.responseIcon}>🤖</Text>
                            <Text style={styles.responseText}>{response}</Text>
                        </LinearGradient>
                    </View>
                )}

                {/* Exemples */}
                {showExamples && (
                    <View style={[styles.examplesCard, { backgroundColor: colors.card }]}>
                        <Text style={[styles.examplesTitle, { color: colors.text }]}>
                            💡 {language === 'fr' ? 'Exemples de commandes' : 'Example commands'}
                        </Text>
                        {EXAMPLE_COMMANDS.map((cmd, index) => (
                            <View key={index} style={styles.exampleItem}>
                                <Text style={[styles.exampleText, { color: colors.textSecondary }]}>{cmd}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Info */}
                <View style={[styles.infoCard, { backgroundColor: isDark ? '#1E1E1E' : '#E3F2FD' }]}>
                    <Text style={styles.infoIcon}>ℹ️</Text>
                    <Text style={[styles.infoText, { color: colors.text }]}>
                        {language === 'fr'
                            ? 'La reconnaissance vocale fonctionne en français et anglais. Parlez clairement pour de meilleurs résultats.'
                            : 'Voice recognition works in French and English. Speak clearly for better results.'}
                    </Text>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },

    // Header
    header: {
        paddingTop: 50,
        paddingBottom: SPACING.lg,
        paddingHorizontal: SPACING.lg,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    headerContent: {},
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.white },
    headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },

    content: { padding: SPACING.lg, alignItems: 'center' },

    // Listening zone
    listeningZone: { alignItems: 'center', marginVertical: SPACING.xl },
    wavesContainer: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
    wave: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        borderWidth: 2,
        borderColor: '#673AB7',
    },
    wave2: { width: 260, height: 260, borderRadius: 130 },
    wave3: { width: 320, height: 320, borderRadius: 160 },

    micButton: {},
    micButtonActive: {},
    micGradient: {
        width: 140,
        height: 140,
        borderRadius: 70,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#673AB7',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 10,
    },
    statusText: { fontSize: 16, marginTop: SPACING.lg, fontWeight: '500' },

    // Transcript
    transcriptCard: {
        width: '100%',
        padding: SPACING.md,
        borderRadius: 16,
        marginTop: SPACING.md,
    },
    transcriptLabel: { fontSize: 12, marginBottom: 4 },
    transcriptText: { fontSize: 18, fontWeight: '600', fontStyle: 'italic' },

    // Response
    responseCard: { width: '100%', marginTop: SPACING.md },
    responseGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        borderRadius: 16,
        gap: SPACING.sm,
    },
    responseIcon: { fontSize: 28 },
    responseText: { flex: 1, fontSize: 16, color: COLORS.white, fontWeight: '500' },

    // Examples
    examplesCard: {
        width: '100%',
        padding: SPACING.md,
        borderRadius: 16,
        marginTop: SPACING.lg,
    },
    examplesTitle: { fontSize: 16, fontWeight: '700', marginBottom: SPACING.sm },
    exampleItem: { paddingVertical: 8 },
    exampleText: { fontSize: 14 },

    // Info
    infoCard: {
        flexDirection: 'row',
        padding: SPACING.md,
        borderRadius: 16,
        marginTop: SPACING.md,
        gap: SPACING.sm,
    },
    infoIcon: { fontSize: 20 },
    infoText: { flex: 1, fontSize: 13 },
});
