// =============================================
// TRANSIGO - REFERRAL SCREEN (PARRAINAGE)
// =============================================

import { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Share,
    Alert,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@/components/Icon';
import { COLORS, SPACING } from '@/constants';
import { useLanguageStore, useThemeStore, useAuthStore } from '@/stores';
import { getTranslation } from '@/i18n/translations';

export default function ReferralScreen() {
    const { language } = useLanguageStore();
    const { colors, isDark } = useThemeStore();
    const { user } = useAuthStore();
    const t = (key: any) => getTranslation(key, language);

    const referralCode = user?.firstName?.substring(0, 3).toUpperCase() + "2026";
    const referralLink = `https://transigo.ci/invite/${referralCode}`;

    const handleShare = async () => {
        try {
            const result = await Share.share({
                message: `Rejoins-moi sur TransiGo ! Utilise mon code ${referralCode} pour gagner 1000 FCFA sur ta première course. Télécharge l'app ici : ${referralLink}`,
            });
            if (result.action === Share.sharedAction) {
                // Shared
            }
        } catch (error: any) {
            Alert.alert(error.message);
        }
    };

    const copyToClipboard = () => {
        // Ici on simulerait une copie presse-papier
        Alert.alert(t('success') || 'Succès', t('codeCopied') || 'Code copié !');
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <LinearGradient
                colors={['#4CAF50', '#2E7D32']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                    activeOpacity={0.8}
                >
                    <Icon name="arrow-back" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('referral') || 'Parrainage'}</Text>
                <View style={{ width: 40 }} />
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.imageContainer}>
                    <Text style={styles.giftEmoji}>🎁</Text>
                </View>

                <Text style={[styles.title, { color: colors.text }]}>Invitez des amis, gagnez de l'argent !</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    Partagez votre code avec vos proches. Dès qu'ils effectuent leur première course, vous recevez 1000 FCFA dans votre cagnotte.
                </Text>

                {/* Code Card */}
                <View style={[styles.codeCard, { backgroundColor: colors.card, borderColor: isDark ? '#333' : '#F0F0F0' }]}>
                    <Text style={[styles.codeLabel, { color: colors.textSecondary }]}>Votre code de parrainage</Text>
                    <TouchableOpacity onPress={copyToClipboard} style={styles.codeContainer}>
                        <Text style={[styles.codeText, { color: colors.text }]}>{referralCode}</Text>
                        <Icon name="copy-outline" size={20} color={COLORS.primary} />
                    </TouchableOpacity>
                </View>

                {/* Steps */}
                <View style={styles.stepsContainer}>
                    <View style={styles.stepItem}>
                        <View style={[styles.stepNumber, { backgroundColor: COLORS.primary }]}>
                            <Text style={styles.stepNumberText}>1</Text>
                        </View>
                        <Text style={[styles.stepText, { color: colors.text }]}>Partagez votre code unique</Text>
                    </View>
                    <View style={styles.stepItem}>
                        <View style={[styles.stepNumber, { backgroundColor: COLORS.primary }]}>
                            <Text style={styles.stepNumberText}>2</Text>
                        </View>
                        <Text style={[styles.stepText, { color: colors.text }]}>Votre ami s'inscrit et fait une course</Text>
                    </View>
                    <View style={styles.stepItem}>
                        <View style={[styles.stepNumber, { backgroundColor: COLORS.primary }]}>
                            <Text style={styles.stepNumberText}>3</Text>
                        </View>
                        <Text style={[styles.stepText, { color: colors.text }]}>Vous recevez 1000 FCFA chacun !</Text>
                    </View>
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
                        style={styles.shareGradient}
                    >
                        <Icon name="share-social" size={20} color={COLORS.white} />
                        <Text style={styles.shareText}>Partager l'invitation</Text>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Stats */}
                <View style={[styles.statsCard, { backgroundColor: isDark ? colors.card : '#F5F5F5' }]}>
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: colors.text }]}>0</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Amis parrainés</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: '#4CAF50' }]}>0 F</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Gagnés au total</Text>
                    </View>
                </View>
            </ScrollView>

            {/* Blocking Overlay */}
            <View style={[StyleSheet.absoluteFill, {
                backgroundColor: 'rgba(0,0,0,0.85)',
                justifyContent: 'center',
                alignItems: 'center',
                padding: 40,
                zIndex: 1000
            }]}>
                <View style={{
                    backgroundColor: colors.card,
                    borderRadius: 24,
                    padding: 30,
                    alignItems: 'center',
                    width: '100%',
                    borderWidth: 1,
                    borderColor: COLORS.primary + '40'
                }}>
                    <View style={{
                        width: 80,
                        height: 80,
                        borderRadius: 40,
                        backgroundColor: COLORS.primary + '20',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: 20
                    }}>
                        <Icon name="lock-closed" size={40} color={COLORS.primary} />
                    </View>

                    <Text style={{
                        fontSize: 22,
                        fontWeight: 'bold',
                        color: colors.text,
                        textAlign: 'center',
                        marginBottom: 12
                    }}>
                        Prochainement
                    </Text>

                    <Text style={{
                        fontSize: 14,
                        color: colors.textSecondary,
                        textAlign: 'center',
                        lineHeight: 22,
                        marginBottom: 30
                    }}>
                        Cette fonctionnalité sera activée dès que le système de parrainage et les paiements mobiles seront finalisés. Merci de votre patience !
                    </Text>

                    <TouchableOpacity
                        style={{
                            backgroundColor: COLORS.primary,
                            paddingHorizontal: 30,
                            paddingVertical: 14,
                            borderRadius: 16,
                            width: '100%'
                        }}
                        onPress={() => router.back()}
                    >
                        <Text style={{
                            color: '#FFF',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            fontSize: 16
                        }}>
                            Retour
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 50,
        paddingBottom: SPACING.lg,
        paddingHorizontal: SPACING.lg,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    scrollContent: {
        padding: SPACING.lg,
        alignItems: 'center',
    },
    imageContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#4CAF5020',
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: SPACING.xl,
    },
    giftEmoji: {
        fontSize: 60,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: SPACING.sm,
    },
    subtitle: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: SPACING.xl,
    },
    codeCard: {
        width: '100%',
        borderRadius: 20,
        padding: SPACING.lg,
        alignItems: 'center',
        borderWidth: 1,
        marginBottom: SPACING.xl,
    },
    codeLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: SPACING.sm,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    codeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    codeText: {
        fontSize: 28,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    stepsContainer: {
        width: '100%',
        gap: SPACING.md,
        marginBottom: SPACING.xl,
    },
    stepItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    stepNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepNumberText: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 14,
    },
    stepText: {
        fontSize: 14,
        fontWeight: '500',
    },
    shareButton: {
        width: '100%',
        marginBottom: SPACING.xl,
    },
    shareGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        gap: 10,
    },
    shareText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
    statsCard: {
        width: '100%',
        flexDirection: 'row',
        padding: SPACING.lg,
        borderRadius: 16,
        alignItems: 'center',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 11,
    },
    divider: {
        width: 1,
        height: 40,
        backgroundColor: '#DDD',
        marginHorizontal: SPACING.md,
    },
});
