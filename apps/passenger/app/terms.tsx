// =============================================
// TRANSIGO - TERMS & CONDITIONS SCREEN
// =============================================

import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@/components/Icon';
import { COLORS, SPACING } from '@/constants';
import { useThemeStore, useLanguageStore } from '@/stores';
import { getTranslation } from '@/i18n/translations';

export default function TermsScreen() {
    const { colors, isDark } = useThemeStore();
    const { language } = useLanguageStore();
    const t = language ? (key: any) => getTranslation(key, language) : null;
    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                style={styles.header}
            >
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                    activeOpacity={0.8}
                >
                    <Icon name="arrow-back" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t ? (t('terms') || 'Conditions Générales') : 'Conditions Générales'}</Text>
                <View style={{ width: 40 }} />
            </LinearGradient>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {language === 'fr' ? (
                    <>
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>1. Objet</Text>
                            <Text style={[styles.text, { color: colors.textSecondary }]}>
                                Les présentes Conditions Générales d'Utilisation ("CGU") régissent l'utilisation
                                de l'application mobile TransiGo ("l'Application"), plateforme de mise en relation
                                entre passagers et chauffeurs de véhicules de transport avec chauffeur (VTC) en
                                Côte d'Ivoire.
                            </Text>
                        </View>

                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>2. Acceptation des CGU</Text>
                            <Text style={[styles.text, { color: colors.textSecondary }]}>
                                L'utilisation de l'Application implique l'acceptation pleine et entière des présentes
                                CGU. Si vous n'acceptez pas ces conditions, vous ne devez pas utiliser l'Application.
                            </Text>
                        </View>

                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>3. Services Proposés</Text>
                            <Text style={[styles.text, { color: colors.textSecondary }]}>
                                TransiGo met à disposition une plateforme technologique permettant aux utilisateurs
                                de réserver des courses auprès de chauffeurs de VTC partenaires. Les services incluent :
                            </Text>
                            <Text style={[styles.bulletText, { color: colors.textSecondary }]}>• Réservation de courses en temps réel</Text>
                            <Text style={[styles.bulletText, { color: colors.textSecondary }]}>• Suivi GPS du chauffeur</Text>
                            <Text style={[styles.bulletText, { color: colors.textSecondary }]}>• Paiement sécurisé (carte, mobile money, espèces)</Text>
                            <Text style={[styles.bulletText, { color: colors.textSecondary }]}>• Système de notation</Text>
                            <Text style={[styles.bulletText, { color: colors.textSecondary }]}>• Historique des courses</Text>
                        </View>
                    </>
                ) : (
                    <>
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>1. Purpose</Text>
                            <Text style={[styles.text, { color: colors.textSecondary }]}>
                                These Terms of Use ("TOU") govern the use of the TransiGo mobile application ("the Application"),
                                a platform connecting passengers with chauffeurs of private hire vehicles (PHV) in Ivory Coast.
                            </Text>
                        </View>

                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>2. Acceptance</Text>
                            <Text style={[styles.text, { color: colors.textSecondary }]}>
                                Use of the Application implies full and complete acceptance of these TOU.
                                If you do not accept these conditions, you must not use the Application.
                            </Text>
                        </View>

                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>3. Services Provided</Text>
                            <Text style={[styles.text, { color: colors.textSecondary }]}>
                                TransiGo provides a technological platform allowing users to book rides with partner PHV drivers.
                                Services include:
                            </Text>
                            <Text style={[styles.bulletText, { color: colors.textSecondary }]}>• Real-time ride booking</Text>
                            <Text style={[styles.bulletText, { color: colors.textSecondary }]}>• GPS tracking of the driver</Text>
                            <Text style={[styles.bulletText, { color: colors.textSecondary }]}>• Secure payment (card, mobile money, cash)</Text>
                            <Text style={[styles.bulletText, { color: colors.textSecondary }]}>• Rating system</Text>
                            <Text style={[styles.bulletText, { color: colors.textSecondary }]}>• Trip history</Text>
                        </View>
                    </>
                )}

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{language === 'fr' ? '10. Contact' : '10. Contact'}</Text>
                    <Text style={[styles.text, { color: colors.textSecondary }]}>
                        {language === 'fr' ? 'Pour toute question concernant ces CGU, veuillez nous contacter à :' : 'For any questions regarding these TOU, please contact us at:'}
                    </Text>
                    <Text style={styles.contactText}>Email : legal@transigo.ci</Text>
                    <Text style={styles.contactText}>{language === 'fr' ? 'Téléphone' : 'Phone'} : +225 07 00 00 11 22</Text>
                </View>

                <View style={[styles.footer, { borderTopColor: isDark ? '#333' : '#F0F0F0' }]}>
                    <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                        {language === 'fr' ? 'Dernière mise à jour : 2 janvier 2026' : 'Last updated: January 2, 2026'}
                    </Text>
                    <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                        Version 1.0.3
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
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
        backgroundColor: 'rgba(255,255,255,0.3)',
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
    },
    section: {
        marginBottom: SPACING.xl,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: SPACING.sm,
    },
    text: {
        fontSize: 14,
        lineHeight: 22,
        marginBottom: SPACING.sm,
    },
    bulletText: {
        fontSize: 14,
        lineHeight: 22,
        marginLeft: SPACING.md,
        marginBottom: 4,
    },
    contactText: {
        fontSize: 14,
        color: COLORS.primary,
        lineHeight: 22,
        fontWeight: '500',
    },
    footer: {
        marginTop: SPACING.xl,
        paddingTop: SPACING.lg,
        borderTopWidth: 1,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        marginBottom: 4,
    },
});
