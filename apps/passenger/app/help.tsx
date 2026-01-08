// =============================================
// TRANSIGO - HELP CENTER SCREEN
// =============================================

import { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Linking,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@/components/Icon';
import { COLORS, SPACING } from '@/constants';
import { useLanguageStore, useThemeStore } from '@/stores';
import { getTranslation } from '@/i18n/translations';

const FAQ_CATEGORIES = [
    {
        id: '1',
        title: 'Réservation',
        icon: '🚗',
        questions: 5,
    },
    {
        id: '2',
        title: 'Paiement',
        icon: '💳',
        questions: 4,
    },
    {
        id: '3',
        title: 'Compte',
        icon: '👤',
        questions: 3,
    },
    {
        id: '4',
        title: 'Sécurité',
        icon: '🔒',
        questions: 6,
    },
];

export default function HelpScreen() {
    const { language } = useLanguageStore();
    const { isDark, colors } = useThemeStore();
    const t = (key: any) => getTranslation(key, language);

    const WHATSAPP_NUMBER = '+2250141628232';

    const handleCall = () => {
        Linking.openURL('tel:+2250141628232');
    };

    const handleEmail = () => {
        Linking.openURL('mailto:support@transigo.ci');
    };

    const handleWhatsApp = () => {
        Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}?text=Bonjour, j'ai besoin d'aide avec TransiGo`);
    };

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
                <Text style={styles.headerTitle}>{t('help')}</Text>
                <View style={{ width: 40 }} />
            </LinearGradient>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Contact rapide */}
                <View style={styles.quickContact}>
                    <Text style={styles.sectionTitle}>Contactez-nous</Text>
                    <View style={styles.contactButtons}>
                        <TouchableOpacity
                            style={styles.contactButton}
                            onPress={handleCall}
                            activeOpacity={0.9}
                        >
                            <View style={[styles.contactIcon, { backgroundColor: '#4CAF5020' }]}>
                                <Icon name="call" size={24} color="#4CAF50" />
                            </View>
                            <Text style={styles.contactLabel}>Appeler</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.contactButton}
                            onPress={handleEmail}
                            activeOpacity={0.9}
                        >
                            <View style={[styles.contactIcon, { backgroundColor: '#2196F320' }]}>
                                <Icon name="mail" size={24} color="#2196F3" />
                            </View>
                            <Text style={styles.contactLabel}>Email</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.contactButton}
                            onPress={handleWhatsApp}
                            activeOpacity={0.9}
                        >
                            <View style={[styles.contactIcon, { backgroundColor: '#25D36620' }]}>
                                <Text style={{ fontSize: 24 }}>💬</Text>
                            </View>
                            <Text style={styles.contactLabel}>WhatsApp</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* FAQs par catégorie */}
                <View style={styles.faqSection}>
                    <Text style={styles.sectionTitle}>Questions Fréquentes</Text>
                    {FAQ_CATEGORIES.map((category) => (
                        <TouchableOpacity
                            key={category.id}
                            style={[styles.categoryCard, { backgroundColor: colors.card }]}
                            activeOpacity={0.9}
                        >
                            <View style={styles.categoryLeft}>
                                <Text style={styles.categoryIcon}>{category.icon}</Text>
                                <View>
                                    <Text style={[styles.categoryTitle, { color: colors.text }]}>
                                        {language === 'fr' ? category.title : category.title === 'Paiement' ? 'Payment' : category.title === 'Compte' ? 'Account' : category.title === 'Sécurité' ? 'Security' : 'Booking'}
                                    </Text>
                                    <Text style={styles.categoryCount}>
                                        {category.questions} {language === 'fr' ? 'questions' : 'questions'}
                                    </Text>
                                </View>
                            </View>
                            <Icon name="chevron-forward" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Signaler un problème */}
                <TouchableOpacity
                    style={styles.reportButton}
                    activeOpacity={0.9}
                >
                    <LinearGradient
                        colors={['#F44336', '#D32F2F']}
                        style={styles.reportButtonGradient}
                    >
                        <Icon name="alert-circle" size={24} color={COLORS.white} />
                        <Text style={styles.reportButtonText}>{t('reportIssue')}</Text>
                    </LinearGradient>
                </TouchableOpacity>
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
    quickContact: {
        marginBottom: SPACING.xl,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: SPACING.md,
    },
    contactButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        gap: SPACING.md,
    },
    contactButton: {
        flex: 1,
        alignItems: 'center',
    },
    contactIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    contactLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
    },
    faqSection: {
        marginBottom: SPACING.xl,
    },
    categoryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    categoryLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    categoryIcon: {
        fontSize: 32,
        marginRight: SPACING.md,
    },
    categoryTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 2,
    },
    categoryCount: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    reportButton: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    reportButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: SPACING.sm,
    },
    reportButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.white,
    },
});
