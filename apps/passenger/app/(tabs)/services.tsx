// =============================================
// TRANSIGO - SERVICES SCREEN (IMPROVED)
// Only: Delivery, Lottery, Referral
// =============================================

import { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Share,
    Alert,
    Dimensions,
    Clipboard
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@/components/Icon';
import { COLORS, SPACING, RADIUS } from '@/constants';
import { useThemeStore, useLanguageStore, useAuthStore } from '@/stores';
import { getTranslation } from '@/i18n/translations';

const { width } = Dimensions.get('window');

export default function ServicesScreen() {
    const { colors, isDark } = useThemeStore();
    const { language } = useLanguageStore();
    const { user } = useAuthStore();
    const [copiedCode, setCopiedCode] = useState(false);
    const t = (key: any) => getTranslation(key, language);

    // Code de parrainage personnalisé basé sur l'utilisateur
    const referralCode = user?.firstName
        ? `${user.firstName.toUpperCase().substring(0, 4)}${Math.floor(Math.random() * 1000)}`
        : 'TRANSIGO2024';

    const handleDeliveryPress = () => {
        router.push('/delivery');
    };

    const handleLotteryPress = () => {
        router.push('/lottery');
    };

    const handleCopyCode = () => {
        Clipboard.setString(referralCode);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
        Alert.alert(
            '✅ Code copié !',
            `Votre code ${referralCode} a été copié dans le presse-papier.`
        );
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: language === 'fr'
                    ? `🚖 Utilise TransiGo pour tes déplacements et livraisons !\n\n🎁 Mon code parrain: ${referralCode}\n\n💰 Tu gagnes 1000 FCFA sur ta première course !\n\n📲 Télécharge l'app: https://transigo.ci`
                    : `🚖 Use TransiGo for your rides and deliveries!\n\n🎁 My referral code: ${referralCode}\n\n💰 Get 1000 FCFA on your first ride!\n\n📲 Download the app: https://transigo.ci`,
            });
        } catch (error) {
            console.log('Share error:', error);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark || '#E65100']}
                style={styles.header}
            >
                <Text style={styles.headerTitle}>
                    {language === 'fr' ? 'Services' : 'Services'}
                </Text>
                <Text style={styles.headerSubtitle}>
                    {language === 'fr' ? 'Découvrez nos offres exclusives' : 'Discover our exclusive offers'}
                </Text>
            </LinearGradient>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* LIVRAISON - Hero Card (Priority) */}
                <TouchableOpacity
                    style={styles.deliveryHero}
                    onPress={handleDeliveryPress}
                    activeOpacity={0.9}
                >
                    <LinearGradient
                        colors={['#FF9800', '#F57C00']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.deliveryGradient}
                    >
                        <View style={styles.deliveryContent}>
                            <Text style={styles.deliveryEmoji}>📦</Text>
                            <View style={styles.deliveryTextContainer}>
                                <Text style={styles.deliveryTitle}>
                                    {language === 'fr' ? 'TransiGo Delivery' : 'TransiGo Delivery'}
                                </Text>
                                <Text style={styles.deliverySubtitle}>
                                    {language === 'fr'
                                        ? 'Envoyez vos colis partout en ville'
                                        : 'Send your packages anywhere in the city'}
                                </Text>
                                <View style={styles.deliveryBadge}>
                                    <Text style={styles.deliveryBadgeText}>
                                        {language === 'fr' ? '🚀 Livraison rapide' : '🚀 Fast delivery'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                        <View style={styles.deliveryArrow}>
                            <Text style={{ fontSize: 24 }}>→</Text>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>

                {/* COVOITURAGE - New Dynamic Feature */}
                <TouchableOpacity
                    style={styles.carpoolCard}
                    onPress={() => router.push({ pathname: '/(tabs)/home', params: { vehicleType: 'shared' } })}
                    activeOpacity={0.9}
                >
                    <LinearGradient
                        colors={['#4CAF50', '#2E7D32']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.carpoolGradient}
                    >
                        <View style={styles.carpoolHeader}>
                            <Text style={styles.carpoolTitle}>
                                {language === 'fr' ? 'Covoiturage Dynamique' : 'Dynamic Carpooling'}
                            </Text>
                            <View style={styles.newBadge}>
                                <Text style={styles.newBadgeText}>NEW</Text>
                            </View>
                        </View>
                        <Text style={styles.carpoolSubtitle}>
                            {language === 'fr'
                                ? 'Partagez un trajet et payez jusqu\'à 60% moins cher'
                                : 'Share a ride and pay up to 60% less'}
                        </Text>
                        <View style={styles.carpoolFooter}>
                            <View style={styles.interceptBadge}>
                                <Icon name="radio" size={12} color="#fff" />
                                <Text style={styles.interceptBadgeText}>Interception en temps réel</Text>
                            </View>
                            <Text style={styles.carpoolArrow}>→</Text>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Lottery Card (Secondary) */}
                <TouchableOpacity
                    style={styles.lotteryCard}
                    onPress={handleLotteryPress}
                    activeOpacity={0.9}
                >
                    <LinearGradient
                        colors={['#FFD700', '#FFA000']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.lotteryGradient}
                    >
                        <Text style={styles.lotteryEmoji}>🎰</Text>
                        <View style={styles.lotteryText}>
                            <Text style={styles.lotteryTitle}>
                                {language === 'fr' ? 'Loterie TransiGo' : 'TransiGo Lottery'}
                            </Text>
                            <Text style={styles.lotterySubtitle}>
                                {language === 'fr' ? 'Tentez votre chance et gagnez !' : 'Try your luck and win!'}
                            </Text>
                        </View>
                        <Text style={{ fontSize: 20 }}>🏆</Text>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Parrainage Section */}
                <View style={[styles.referralSection, { backgroundColor: colors.card }]}>
                    <View style={styles.referralHeader}>
                        <View style={styles.referralIconContainer}>
                            <Icon name="people" size={28} color={COLORS.primary} />
                        </View>
                        <View style={styles.referralHeaderText}>
                            <Text style={[styles.referralTitle, { color: colors.text }]}>
                                {language === 'fr' ? 'Programme de Parrainage' : 'Referral Program'}
                            </Text>
                            <Text style={[styles.referralSubtitle, { color: colors.textSecondary }]}>
                                {language === 'fr' ? 'Invitez vos amis et gagnez' : 'Invite friends and earn'}
                            </Text>
                        </View>
                    </View>

                    {/* Rewards Info */}
                    <View style={styles.rewardsRow}>
                        <View style={[styles.rewardCard, { backgroundColor: isDark ? '#1a472a' : '#E8F5E9' }]}>
                            <Icon name="gift" size={24} color="#4CAF50" />
                            <Text style={[styles.rewardAmount, { color: colors.text }]}>1000 FCFA</Text>
                            <Text style={[styles.rewardLabel, { color: colors.textSecondary }]}>
                                {language === 'fr' ? 'Pour vous' : 'For you'}
                            </Text>
                        </View>
                        <View style={styles.rewardPlus}>
                            <Icon name="add" size={20} color={colors.textSecondary} />
                        </View>
                        <View style={[styles.rewardCard, { backgroundColor: isDark ? '#2d3a4a' : '#E3F2FD' }]}>
                            <Icon name="person-add" size={24} color="#2196F3" />
                            <Text style={[styles.rewardAmount, { color: colors.text }]}>1000 FCFA</Text>
                            <Text style={[styles.rewardLabel, { color: colors.textSecondary }]}>
                                {language === 'fr' ? 'Pour l\'ami' : 'For friend'}
                            </Text>
                        </View>
                    </View>

                    {/* Referral Code */}
                    <View style={styles.codeSection}>
                        <Text style={[styles.codeLabel, { color: colors.textSecondary }]}>
                            {language === 'fr' ? 'Votre code parrain' : 'Your referral code'}
                        </Text>
                        <TouchableOpacity
                            style={[styles.codeBox, { backgroundColor: isDark ? '#333' : '#f5f5f5' }]}
                            onPress={handleCopyCode}
                        >
                            <Text style={[styles.codeText, { color: colors.text }]}>
                                {referralCode}
                            </Text>
                            <View style={styles.copyButton}>
                                <Icon
                                    name={copiedCode ? "checkmark" : "copy"}
                                    size={20}
                                    color={copiedCode ? "#4CAF50" : COLORS.primary}
                                />
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Share Button */}
                    <TouchableOpacity
                        style={styles.shareButton}
                        onPress={handleShare}
                        activeOpacity={0.9}
                    >
                        <LinearGradient
                            colors={['#4CAF50', '#2E7D32']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.shareButtonGradient}
                        >
                            <Icon name="share-social" size={22} color="#fff" />
                            <Text style={styles.shareButtonText}>
                                {language === 'fr' ? 'Partager avec mes amis' : 'Share with friends'}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Stats */}
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={[styles.statNumber, { color: COLORS.primary }]}>0</Text>
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                                {language === 'fr' ? 'Amis invités' : 'Friends invited'}
                            </Text>
                        </View>
                        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                        <View style={styles.statItem}>
                            <Text style={[styles.statNumber, { color: '#4CAF50' }]}>0 FCFA</Text>
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                                {language === 'fr' ? 'Gains totaux' : 'Total earnings'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* How it works */}
                <View style={[styles.howItWorks, { backgroundColor: colors.card }]}>
                    <Text style={[styles.howTitle, { color: colors.text }]}>
                        {language === 'fr' ? 'Comment ça marche ?' : 'How does it work?'}
                    </Text>

                    <View style={styles.stepRow}>
                        <View style={[styles.stepNumber, { backgroundColor: COLORS.primary }]}>
                            <Text style={styles.stepNumberText}>1</Text>
                        </View>
                        <Text style={[styles.stepText, { color: colors.text }]}>
                            {language === 'fr'
                                ? 'Partagez votre code avec vos amis'
                                : 'Share your code with friends'}
                        </Text>
                    </View>

                    <View style={styles.stepRow}>
                        <View style={[styles.stepNumber, { backgroundColor: COLORS.primary }]}>
                            <Text style={styles.stepNumberText}>2</Text>
                        </View>
                        <Text style={[styles.stepText, { color: colors.text }]}>
                            {language === 'fr'
                                ? 'Votre ami s\'inscrit avec votre code'
                                : 'Your friend signs up with your code'}
                        </Text>
                    </View>

                    <View style={styles.stepRow}>
                        <View style={[styles.stepNumber, { backgroundColor: COLORS.primary }]}>
                            <Text style={styles.stepNumberText}>3</Text>
                        </View>
                        <Text style={[styles.stepText, { color: colors.text }]}>
                            {language === 'fr'
                                ? 'Vous recevez tous les deux 1000 FCFA'
                                : 'You both receive 1000 FCFA'}
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: SPACING.lg,
        paddingTop: 60,
        paddingBottom: SPACING.xl,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 4,
    },
    scrollContent: {
        padding: SPACING.lg,
        paddingBottom: 100,
    },
    servicesRow: {
        flexDirection: 'row',
        gap: SPACING.md,
        marginBottom: SPACING.lg,
    },
    serviceCard: {
        flex: 1,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
    },
    serviceGradient: {
        padding: SPACING.lg,
        alignItems: 'center',
        minHeight: 160,
    },
    serviceIconBg: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    serviceName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    serviceDescription: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
    },
    serviceArrow: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    referralSection: {
        borderRadius: 20,
        padding: SPACING.lg,
        marginBottom: SPACING.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    referralHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    referralIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255,152,0,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    referralHeaderText: {
        flex: 1,
    },
    referralTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    referralSubtitle: {
        fontSize: 13,
        marginTop: 2,
    },
    rewardsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    rewardCard: {
        flex: 1,
        padding: SPACING.md,
        borderRadius: 16,
        alignItems: 'center',
    },
    rewardAmount: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 8,
    },
    rewardLabel: {
        fontSize: 12,
        marginTop: 2,
    },
    rewardPlus: {
        paddingHorizontal: SPACING.sm,
    },
    codeSection: {
        marginBottom: SPACING.lg,
    },
    codeLabel: {
        fontSize: 13,
        marginBottom: 8,
    },
    codeBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: SPACING.md,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.primary,
        borderStyle: 'dashed',
    },
    codeText: {
        fontSize: 20,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    copyButton: {
        padding: 8,
    },
    shareButton: {
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: SPACING.lg,
    },
    shareButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 10,
    },
    shareButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: 12,
        marginTop: 4,
    },
    statDivider: {
        width: 1,
        height: 40,
    },
    howItWorks: {
        borderRadius: 20,
        padding: SPACING.lg,
    },
    howTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: SPACING.lg,
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    stepNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    stepNumberText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    stepText: {
        flex: 1,
        fontSize: 14,
    },
    // Delivery Hero Card Styles
    deliveryHero: {
        borderRadius: 24,
        overflow: 'hidden',
        marginBottom: SPACING.lg,
        shadowColor: '#FF9800',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    deliveryGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: SPACING.xl,
        minHeight: 140,
    },
    deliveryContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    deliveryEmoji: {
        fontSize: 60,
        marginRight: SPACING.lg,
    },
    deliveryTextContainer: {
        flex: 1,
    },
    deliveryTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    deliverySubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        marginBottom: SPACING.sm,
    },
    deliveryBadge: {
        backgroundColor: 'rgba(255,255,255,0.25)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    deliveryBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#fff',
    },
    deliveryArrow: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Lottery Card Styles
    lotteryCard: {
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: SPACING.lg,
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 6,
    },
    lotteryGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.lg,
    },
    lotteryEmoji: {
        fontSize: 40,
        marginRight: SPACING.md,
    },
    lotteryText: {
        flex: 1,
    },
    lotteryTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    lotterySubtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 2,
    },
    // Carpool Card Styles
    carpoolCard: {
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: SPACING.lg,
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 6,
    },
    carpoolGradient: {
        padding: 20,
    },
    carpoolHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    carpoolTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    newBadge: {
        backgroundColor: '#FFEB3B',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    newBadgeText: {
        color: '#000',
        fontSize: 10,
        fontWeight: 'bold',
    },
    carpoolSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        marginBottom: 16,
    },
    carpoolFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    interceptBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    interceptBadgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600',
    },
    carpoolArrow: {
        color: '#fff',
        fontSize: 24,
    },
});
