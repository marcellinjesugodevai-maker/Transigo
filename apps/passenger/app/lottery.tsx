// =============================================
// TRANSIGO - LOTERIE (ROUE + GRATTAGE)
// 2 jeux pour gagner des récompenses
// =============================================

import { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Easing,
    Dimensions,
    Alert,
    ScrollView,
    StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@/components/Icon';
import { COLORS, SPACING, RADIUS } from '@/constants';
import { useThemeStore, useLanguageStore } from '@/stores';
import { getTranslation } from '@/i18n/translations';

const { width } = Dimensions.get('window');

// ==================== CONFIGURATION ====================

// Prix disponibles
const PRIZES = [
    { id: 'p500', value: 500, label: '500 F', color: '#4CAF50', icon: '💰', type: 'cash' },
    { id: 'p1000', value: 1000, label: '1 000 F', color: '#2196F3', icon: '💵', type: 'cash' },
    { id: 'p2000', value: 2000, label: '2 000 F', color: '#9C27B0', icon: '🎁', type: 'cash' },
    { id: 'discount_75', value: 75, label: '-75% Course', color: '#E91E63', icon: '🚗', type: 'discount' },
    { id: 'food_20', value: 0, label: '-20% Food', color: '#FF5722', icon: '🍔', type: 'discount' },
    { id: 'delivery', value: 0, label: 'Livraison Offerte', color: '#795548', icon: '📦', type: 'voucher' },
    { id: 'retry', value: 0, label: '+1 Ticket', color: '#00BCD4', icon: '🎫', type: 'ticket' },
    { id: 'nothing', value: 0, label: 'Pas de chance', color: '#9E9E9E', icon: '😅', type: 'nothing' },
];

// Probabilités (total = 1)
// Probabilités (total = 1) - MODE DIFFICILE
const PROBABILITIES = {
    'nothing': 0.60,   // 60% (Perdu)
    'retry': 0.15,     // 15% (Ticket gratuit)
    'food_20': 0.10,   // 10% (Promo Food)
    'delivery': 0.05,  // 5% (Livraison Offerte)
    'p500': 0.05,      // 5% (500 F)
    'p1000': 0.03,     // 3% (1 000 F)
    'p2000': 0.015,    // 1.5% (2 000 F)
    'discount_75': 0.005 // 0.5% (Jackpot -75%)
};

// Symboles pour le grattage
const SCRATCH_SYMBOLS = ['💰', '🎁', '🚗', '🍔', '📦', '⭐', '💎', '🎲'];

type GameTab = 'wheel' | 'scratch';

export default function LotteryScreen() {
    const { isDark, colors } = useThemeStore();
    const { language } = useLanguageStore();
    const t = (key: any) => getTranslation(key, language);

    // États globaux
    const [tickets, setTickets] = useState(3);
    const [totalWinnings, setTotalWinnings] = useState(0);
    const [activeTab, setActiveTab] = useState<GameTab>('wheel');

    // États Roue
    const [isSpinning, setIsSpinning] = useState(false);
    const [wheelResult, setWheelResult] = useState<typeof PRIZES[0] | null>(null);
    const [showWheelResult, setShowWheelResult] = useState(false);

    // États Grattage
    const [scratchCards, setScratchCards] = useState<string[]>([]);
    const [scratchRevealed, setScratchRevealed] = useState<boolean[]>([false, false, false]);
    const [scratchResult, setScratchResult] = useState<typeof PRIZES[0] | null>(null);
    const [showScratchResult, setShowScratchResult] = useState(false);
    const [isScratching, setIsScratching] = useState(false);

    // Animations
    const spinAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const resultAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.08, duration: 600, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    // ==================== FONCTIONS ====================

    const selectRandomPrize = (): typeof PRIZES[0] => {
        const random = Math.random();
        let cumulative = 0;
        for (const prize of PRIZES) {
            cumulative += PROBABILITIES[prize.id as keyof typeof PROBABILITIES] || 0;
            if (random <= cumulative) return prize;
        }
        return PRIZES[PRIZES.length - 1];
    };

    const handlePrizeWon = (prize: typeof PRIZES[0]) => {
        if (prize.type === 'cash') {
            setTotalWinnings(prev => prev + prize.value);
        }
        if (prize.type === 'ticket') {
            setTickets(prev => prev + 1);
        }
    };

    const showResultAnimation = () => {
        resultAnim.setValue(0);
        Animated.spring(resultAnim, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
        }).start();
    };

    // ==================== ROUE ====================

    const handleSpinWheel = () => {
        if (tickets <= 0) {
            Alert.alert('🎫 Plus de tickets', language === 'fr'
                ? 'Faites une course pour gagner des tickets !'
                : 'Complete a ride to earn tickets!');
            return;
        }
        if (isSpinning) return;

        setIsSpinning(true);
        setShowWheelResult(false);
        setTickets(prev => prev - 1);

        const prize = selectRandomPrize();
        const prizeIndex = PRIZES.findIndex(p => p.id === prize.id);
        const segmentAngle = 360 / PRIZES.length;
        const targetAngle = 360 - (prizeIndex * segmentAngle) - segmentAngle / 2;
        const spins = 4 + Math.random() * 3;
        const finalAngle = 360 * spins + targetAngle;

        spinAnim.setValue(0);
        Animated.timing(spinAnim, {
            toValue: finalAngle,
            duration: 4000,
            easing: Easing.bezier(0.2, 0.8, 0.3, 1),
            useNativeDriver: true,
        }).start(() => {
            setWheelResult(prize);
            setIsSpinning(false);
            setShowWheelResult(true);
            handlePrizeWon(prize);
            showResultAnimation();
        });
    };

    const spinInterpolate = spinAnim.interpolate({
        inputRange: [0, 360],
        outputRange: ['0deg', '360deg'],
    });

    // ==================== GRATTAGE ====================

    const generateScratchCards = () => {
        if (tickets <= 0) {
            Alert.alert('🎫 Plus de tickets', language === 'fr'
                ? 'Faites une course pour gagner des tickets !'
                : 'Complete a ride to earn tickets!');
            return;
        }

        setTickets(prev => prev - 1);
        setIsScratching(true);
        setShowScratchResult(false);
        setScratchRevealed([false, false, false]);

        // Générer 3 symboles (parfois identiques pour gagner)
        const random = Math.random();
        let cards: string[];

        if (random < 0.10) {
            // 10% de chance d'avoir 3 identiques (Mode difficile)
            const prize = selectRandomPrize();
            cards = [prize.icon, prize.icon, prize.icon];
            setScratchResult(prize);
        } else {
            // Symboles différents
            const shuffled = [...SCRATCH_SYMBOLS].sort(() => Math.random() - 0.5);
            cards = [shuffled[0], shuffled[1], shuffled[2]];
            setScratchResult(null);
        }

        setScratchCards(cards);
    };

    const revealCard = (index: number) => {
        if (!isScratching || scratchRevealed[index]) return;

        const newRevealed = [...scratchRevealed];
        newRevealed[index] = true;
        setScratchRevealed(newRevealed);

        // Si toutes les cartes sont révélées
        if (newRevealed.every(r => r)) {
            setIsScratching(false);
            setShowScratchResult(true);
            if (scratchResult) {
                handlePrizeWon(scratchResult);
            }
            showResultAnimation();
        }
    };

    // ==================== RENDU ====================

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <LinearGradient
                colors={['#FFD700', '#FFC107', '#FF9800']}
                style={styles.header}
            >
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Icon name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>🎰 Loterie TransiGo</Text>
                    <Text style={styles.headerSubtitle}>
                        {language === 'fr' ? 'Tentez votre chance !' : 'Try your luck!'}
                    </Text>
                </View>
                <View style={styles.ticketBadge}>
                    <Text style={styles.ticketIcon}>🎫</Text>
                    <Text style={styles.ticketCount}>{tickets}</Text>
                </View>
            </LinearGradient>

            {/* Stats */}
            <View style={styles.statsRow}>
                <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                    <Text style={styles.statEmoji}>💰</Text>
                    <Text style={[styles.statValue, { color: colors.text }]}>
                        {totalWinnings.toLocaleString('fr-FR')} F
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                        {language === 'fr' ? 'Gagné' : 'Won'}
                    </Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                    <Text style={styles.statEmoji}>🎫</Text>
                    <Text style={[styles.statValue, { color: colors.text }]}>{tickets}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Tickets</Text>
                </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'wheel' && styles.tabActive]}
                    onPress={() => setActiveTab('wheel')}
                >
                    <Text style={styles.tabIcon}>🎡</Text>
                    <Text style={[styles.tabText, activeTab === 'wheel' && styles.tabTextActive]}>
                        {language === 'fr' ? 'Roue' : 'Wheel'}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'scratch' && styles.tabActive]}
                    onPress={() => setActiveTab('scratch')}
                >
                    <Text style={styles.tabIcon}>🎴</Text>
                    <Text style={[styles.tabText, activeTab === 'scratch' && styles.tabTextActive]}>
                        {language === 'fr' ? 'Grattage' : 'Scratch'}
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* ========== JEU ROUE ========== */}
                {activeTab === 'wheel' && (
                    <View style={styles.gameContainer}>
                        {/* Roue */}
                        <View style={styles.wheelContainer}>
                            <View style={styles.wheelArrow}>
                                <Text style={styles.arrowText}>▼</Text>
                            </View>
                            <View style={styles.wheelBorder}>
                                <Animated.View style={[
                                    styles.wheel,
                                    { transform: [{ rotate: spinInterpolate }] }
                                ]}>
                                    {PRIZES.map((prize, index) => {
                                        const rotation = index * (360 / PRIZES.length);
                                        return (
                                            <View
                                                key={prize.id}
                                                style={[
                                                    styles.segment,
                                                    {
                                                        backgroundColor: prize.color,
                                                        transform: [
                                                            { rotate: `${rotation}deg` },
                                                            { translateY: -90 },
                                                        ],
                                                    }
                                                ]}
                                            >
                                                <Text style={styles.segmentIcon}>{prize.icon}</Text>
                                            </View>
                                        );
                                    })}
                                </Animated.View>
                            </View>
                            <View style={styles.wheelCenter}>
                                <Text style={styles.wheelCenterIcon}>🎰</Text>
                            </View>
                        </View>

                        {/* Bouton Tourner */}
                        <Animated.View style={{ transform: [{ scale: isSpinning ? 1 : pulseAnim }] }}>
                            <TouchableOpacity
                                style={[styles.playButton, isSpinning && styles.playButtonDisabled]}
                                onPress={handleSpinWheel}
                                disabled={isSpinning}
                            >
                                <LinearGradient
                                    colors={isSpinning ? ['#9E9E9E', '#757575'] : ['#FF5722', '#E64A19']}
                                    style={styles.playGradient}
                                >
                                    <Text style={styles.playText}>
                                        {isSpinning ? '🎰 ...' : '🎰 TOURNER !'}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </Animated.View>

                        {/* Résultat Roue */}
                        {showWheelResult && wheelResult && (
                            <Animated.View style={[
                                styles.resultCard,
                                {
                                    backgroundColor: wheelResult.color,
                                    transform: [{ scale: resultAnim }],
                                    opacity: resultAnim,
                                }
                            ]}>
                                <Text style={styles.resultEmoji}>{wheelResult.icon}</Text>
                                <Text style={styles.resultTitle}>
                                    {wheelResult.type === 'nothing'
                                        ? (language === 'fr' ? 'Dommage !' : 'Too bad!')
                                        : (language === 'fr' ? 'Bravo !' : 'Congrats!')}
                                </Text>
                                <Text style={styles.resultPrize}>{wheelResult.label}</Text>
                            </Animated.View>
                        )}
                    </View>
                )}

                {/* ========== JEU GRATTAGE ========== */}
                {activeTab === 'scratch' && (
                    <View style={styles.gameContainer}>
                        <Text style={[styles.scratchTitle, { color: colors.text }]}>
                            🎴 {language === 'fr' ? '3 symboles identiques = Gagné !' : '3 matching symbols = Win!'}
                        </Text>

                        {/* Cartes à gratter */}
                        {scratchCards.length > 0 ? (
                            <View style={styles.scratchGrid}>
                                {scratchCards.map((symbol, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.scratchCard,
                                            { backgroundColor: scratchRevealed[index] ? colors.card : '#FFD700' }
                                        ]}
                                        onPress={() => revealCard(index)}
                                        disabled={scratchRevealed[index]}
                                    >
                                        {scratchRevealed[index] ? (
                                            <Text style={styles.scratchSymbol}>{symbol}</Text>
                                        ) : (
                                            <Text style={styles.scratchHidden}>?</Text>
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ) : (
                            <View style={styles.scratchPlaceholder}>
                                <Text style={styles.scratchPlaceholderIcon}>🎴</Text>
                                <Text style={[styles.scratchPlaceholderText, { color: colors.textSecondary }]}>
                                    {language === 'fr' ? 'Appuyez sur le bouton pour commencer' : 'Press the button to start'}
                                </Text>
                            </View>
                        )}

                        {/* Bouton Gratter */}
                        {!isScratching && (
                            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                                <TouchableOpacity
                                    style={styles.playButton}
                                    onPress={generateScratchCards}
                                >
                                    <LinearGradient
                                        colors={['#9C27B0', '#7B1FA2']}
                                        style={styles.playGradient}
                                    >
                                        <Text style={styles.playText}>
                                            🎴 {language === 'fr' ? 'NOUVEAU GRATTAGE' : 'NEW SCRATCH'}
                                        </Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </Animated.View>
                        )}

                        {/* Résultat Grattage */}
                        {showScratchResult && (
                            <Animated.View style={[
                                styles.resultCard,
                                {
                                    backgroundColor: scratchResult ? scratchResult.color : '#9E9E9E',
                                    transform: [{ scale: resultAnim }],
                                    opacity: resultAnim,
                                }
                            ]}>
                                <Text style={styles.resultEmoji}>
                                    {scratchResult ? scratchResult.icon : '😅'}
                                </Text>
                                <Text style={styles.resultTitle}>
                                    {scratchResult
                                        ? (language === 'fr' ? 'Bravo !' : 'Congrats!')
                                        : (language === 'fr' ? 'Pas de chance !' : 'No luck!')}
                                </Text>
                                <Text style={styles.resultPrize}>
                                    {scratchResult ? scratchResult.label : (language === 'fr' ? 'Réessayez' : 'Try again')}
                                </Text>
                            </Animated.View>
                        )}
                    </View>
                )}

                {/* Comment gagner des tickets */}
                <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
                    <Text style={[styles.infoTitle, { color: colors.text }]}>
                        🎫 {language === 'fr' ? 'Comment gagner des tickets ?' : 'How to earn tickets?'}
                    </Text>
                    {[
                        { icon: '🚗', text: language === 'fr' ? '1 ticket par course VTC' : '1 ticket per VTC ride' },
                        { icon: '📦', text: language === 'fr' ? '1 ticket par livraison' : '1 ticket per delivery' },
                        { icon: '🍔', text: language === 'fr' ? '1 ticket pour 5000 F de Food' : '1 ticket for 5000 F of Food' },
                        { icon: '👥', text: language === 'fr' ? '2 tickets par parrainage' : '2 tickets per referral' },
                    ].map((item, i) => (
                        <View key={i} style={styles.infoItem}>
                            <Text style={styles.infoIcon}>{item.icon}</Text>
                            <Text style={[styles.infoText, { color: colors.text }]}>{item.text}</Text>
                        </View>
                    ))}
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
        flexDirection: 'row',
        alignItems: 'center',
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
        backgroundColor: 'rgba(255,255,255,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerCenter: { flex: 1, marginLeft: SPACING.md },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#333' },
    headerSubtitle: { fontSize: 13, color: '#666', marginTop: 2 },
    ticketBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.5)',
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
        gap: 6,
    },
    ticketIcon: { fontSize: 20 },
    ticketCount: { fontSize: 18, fontWeight: 'bold', color: '#333' },

    // Stats
    statsRow: {
        flexDirection: 'row',
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.md,
        gap: SPACING.sm,
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
        padding: SPACING.md,
        borderRadius: 16,
    },
    statEmoji: { fontSize: 24 },
    statValue: { fontSize: 18, fontWeight: 'bold', marginTop: 4 },
    statLabel: { fontSize: 11, marginTop: 2 },

    // Tabs
    tabsContainer: {
        flexDirection: 'row',
        marginHorizontal: SPACING.lg,
        marginTop: SPACING.md,
        backgroundColor: '#F0F0F0',
        borderRadius: 16,
        padding: 4,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 14,
        gap: 6,
    },
    tabActive: { backgroundColor: '#FFF' },
    tabIcon: { fontSize: 20 },
    tabText: { fontSize: 14, fontWeight: '600', color: '#666' },
    tabTextActive: { color: '#FF5722' },

    content: { paddingTop: SPACING.lg },

    // Game container
    gameContainer: { alignItems: 'center', paddingHorizontal: SPACING.lg },

    // Wheel
    wheelContainer: { alignItems: 'center', marginBottom: SPACING.lg },
    wheelArrow: { zIndex: 10, marginBottom: -10 },
    arrowText: { fontSize: 36, color: '#FF5722' },
    wheelBorder: {
        width: 240,
        height: 240,
        borderRadius: 120,
        backgroundColor: '#333',
        padding: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    wheel: {
        width: 224,
        height: 224,
        borderRadius: 112,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    segment: {
        position: 'absolute',
        width: 60,
        height: 100,
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: 8,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
    },
    segmentIcon: { fontSize: 24 },
    wheelCenter: {
        position: 'absolute',
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#FFD700',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    wheelCenterIcon: { fontSize: 24 },

    // Scratch
    scratchTitle: { fontSize: 16, fontWeight: '600', marginBottom: SPACING.lg, textAlign: 'center' },
    scratchGrid: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.lg },
    scratchCard: {
        width: 90,
        height: 120,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    scratchSymbol: { fontSize: 48 },
    scratchHidden: { fontSize: 48, color: '#333' },
    scratchPlaceholder: { alignItems: 'center', marginVertical: 40 },
    scratchPlaceholderIcon: { fontSize: 60, marginBottom: SPACING.sm },
    scratchPlaceholderText: { fontSize: 14, textAlign: 'center' },

    // Play button
    playButton: { marginBottom: SPACING.lg },
    playButtonDisabled: { opacity: 0.7 },
    playGradient: {
        paddingVertical: 18,
        paddingHorizontal: 50,
        borderRadius: 30,
        shadowColor: '#FF5722',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 6,
    },
    playText: { fontSize: 18, fontWeight: 'bold', color: COLORS.white, letterSpacing: 1 },

    // Result
    resultCard: {
        width: '100%',
        padding: SPACING.lg,
        borderRadius: 20,
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    resultEmoji: { fontSize: 50, marginBottom: 8 },
    resultTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.white },
    resultPrize: { fontSize: 24, fontWeight: 'bold', color: COLORS.white, marginTop: 4 },

    // Info
    infoCard: {
        marginHorizontal: SPACING.lg,
        padding: SPACING.md,
        borderRadius: 16,
    },
    infoTitle: { fontSize: 15, fontWeight: '700', marginBottom: SPACING.sm },
    infoItem: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
    infoIcon: { fontSize: 20 },
    infoText: { fontSize: 14 },
});
