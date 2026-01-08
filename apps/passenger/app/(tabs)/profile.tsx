// =============================================
// TRANSIGO - PROFILE SCREEN (NOUVELLE MAQUETTE)
// =============================================

import { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    Alert,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@/components/Icon';
import { COLORS, SPACING } from '@/constants';
import { useAuthStore, useLanguageStore, useThemeStore } from '@/stores';
import { getTranslation } from '@/i18n/translations';

interface MenuItem {
    icon: string;
    label: string;
    route: string;
    badge?: string;
    badgeColor?: string;
    rightText?: string;
}

const MENU_ITEMS: MenuItem[] = [
    { icon: 'person', label: 'Modifier profil', route: '/edit-profile' },
    { icon: 'wallet', label: 'Mon Portefeuille', route: '/wallet', badge: 'Actif', badgeColor: '#4CAF50' },
    { icon: 'stats-chart', label: 'Mes statistiques', route: '/statistics', badge: 'Nouveau', badgeColor: '#9C27B0' },
    { icon: 'heart', label: 'Mes favoris', route: '/favorites', badge: 'Nouveau', badgeColor: '#E91E63' },
    { icon: 'location', label: 'Adresses enregistrées', route: '/saved-addresses' },
    { icon: 'card', label: 'Moyens de paiement', route: '/payment-methods' },
    {
        icon: 'gift',
        label: 'Parrainage',
        route: '/referral',
        badge: 'Cadeau',
        badgeColor: '#4CAF50',
    },
    { icon: 'ticket', label: 'Mes abonnements', route: '/subscriptions' },
    { icon: 'calendar', label: 'Trajets réguliers', route: '/recurring-rides' },
    {
        icon: 'school',
        label: 'Statut étudiant',
        route: '/student-status',
        badge: '-30%',
        badgeColor: COLORS.primary,
    },
    { icon: 'shield', label: 'Sécurité', route: '/security' },
    { icon: 'alert-circle', label: 'Mode SOS', route: '/sos', badge: 'Protégé', badgeColor: '#E91E63' },
    { icon: 'trophy', label: 'Défis & Badges', route: '/challenges', badge: 'Expert', badgeColor: '#9C27B0' },
    {
        icon: 'language',
        label: 'Langue',
        route: '/language-selector',
        rightText: 'Français (CI)',
    },
    { icon: 'notifications', label: 'Notifications', route: '/notifications' },
    { icon: 'moon', label: 'Mode sombre', route: '/theme-selector' },
    { icon: 'game-controller', label: 'Loterie', route: '/lottery', badge: 'Jouer', badgeColor: '#FFD700' },
    { icon: 'analytics', label: 'Prédiction IA', route: '/price-prediction', badge: 'Beta', badgeColor: '#673AB7' },
    { icon: 'mic', label: 'Commande Vocale', route: '/voice-command', badge: 'Vocal', badgeColor: '#E91E63' },
    { icon: 'notifications-outline', label: 'Alerte Prix Bas', route: '/price-alert', badge: 'Alerte', badgeColor: '#2196F3' },
];

const HELP_ITEMS: MenuItem[] = [
    { icon: 'help-circle', label: 'Aide', route: '/help' },
    { icon: 'document', label: 'Conditions Générales', route: '/terms' },
];

export default function ProfileScreen() {
    const { user, logout } = useAuthStore();
    const { language } = useLanguageStore();
    const { isDark, toggleTheme, colors } = useThemeStore();
    const t = (key: any) => getTranslation(key, language);

    const handleLogout = () => {
        Alert.alert(
            t('logout'),
            language === 'fr' ? 'Voulez-vous vraiment vous déconnecter ?' : 'Do you really want to logout?',
            [
                { text: t('cancel'), style: 'cancel' },
                {
                    text: t('logout'),
                    style: 'destructive',
                    onPress: () => {
                        logout();
                        router.replace('/(auth)/login');
                    },
                },
            ]
        );
    };

    const renderMenuItem = (item: MenuItem) => (
        <TouchableOpacity
            key={item.label}
            style={[styles.menuItem, { borderBottomColor: isDark ? '#333' : '#F0F0F0' }]}
            onPress={() => router.push(item.route as any)}
            activeOpacity={0.8}
        >
            <View style={styles.menuItemLeft}>
                <View style={[styles.iconContainer, { backgroundColor: isDark ? colors.primary + '20' : '#FFF4E6' }]}>
                    <Icon name={item.icon as any} size={20} color={COLORS.primary} />
                </View>
                <Text style={[styles.menuItemText, { color: colors.text }]}>{item.label}</Text>
            </View>
            <View style={styles.menuItemRight}>
                {item.badge && (
                    <View
                        style={[
                            styles.badge,
                            { backgroundColor: item.badgeColor + '20' },
                        ]}
                    >
                        <Text style={[styles.badgeText, { color: item.badgeColor }]}>
                            {item.badge}
                        </Text>
                    </View>
                )}
                {item.rightText && (
                    <Text style={[styles.rightText, { color: colors.textSecondary }]}>{item.rightText}</Text>
                )}
                <Icon name="chevron-forward" size={20} color={colors.textSecondary} />
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header avec gradient */}
            <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <View style={styles.headerTop}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                        activeOpacity={0.8}
                    >
                        <Icon name="arrow-back" size={24} color={COLORS.white} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('profile')}</Text>
                    <TouchableOpacity
                        style={styles.menuButton}
                        onPress={() => router.push('/referral')}
                        activeOpacity={0.8}
                    >
                        <Icon name="gift" size={20} color={COLORS.white} />
                    </TouchableOpacity>
                </View>

                {/* Photo de profil */}
                <View style={styles.profileSection}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Icon name="person" size={50} color={COLORS.primary} />
                        </View>
                        <TouchableOpacity style={styles.editBadge} activeOpacity={0.8} onPress={() => router.push('/edit-profile')}>
                            <Icon name="pencil" size={14} color={COLORS.primary} />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.userName}>
                        {user?.firstName} {user?.lastName}
                    </Text>
                    <Text style={styles.userContact}>
                        {user?.email || 'jean.k@gmail.com'} • {user?.phone || '+225 07 00 11 22'}
                    </Text>
                </View>
            </LinearGradient>

            {/* Étoile */}
            <View style={styles.starContainer}>
                <Icon name="star" size={24} color="#FFD700" />
            </View>

            {/* Menu */}
            <ScrollView
                style={[styles.scrollView, { backgroundColor: colors.background }]}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Menu principal */}
                <View style={[styles.menuSection, { backgroundColor: colors.card, shadowColor: isDark ? '#000' : '#000' }]}>
                    {MENU_ITEMS.map(renderMenuItem)}

                    {/* Mode sombre avec toggle */}
                    <View style={[styles.menuItem, { borderBottomColor: isDark ? '#333' : '#F0F0F0' }]}>
                        <View style={styles.menuItemLeft}>
                            <View style={[styles.iconContainer, { backgroundColor: isDark ? colors.primary + '20' : '#FFF4E6' }]}>
                                <Icon name="moon" size={20} color={COLORS.primary} />
                            </View>
                            <Text style={[styles.menuItemText, { color: colors.text }]}>{t('darkMode')}</Text>
                        </View>
                        <Switch
                            value={isDark}
                            onValueChange={toggleTheme}
                            trackColor={{
                                false: '#E0E0E0',
                                true: COLORS.primary + '50',
                            }}
                            thumbColor={isDark ? COLORS.primary : '#F5F5F5'}
                        />
                    </View>
                </View>

                {/* Section Aide */}
                <View style={[styles.menuSection, { backgroundColor: colors.card }]}>
                    {HELP_ITEMS.map(renderMenuItem)}
                </View>

                {/* Déconnexion */}
                <TouchableOpacity
                    style={[styles.logoutButton, { backgroundColor: colors.card }]}
                    onPress={handleLogout}
                    activeOpacity={0.8}
                >
                    <Icon name="log-out-outline" size={22} color="#F44336" />
                    <Text style={styles.logoutText}>{t('logout')}</Text>
                </TouchableOpacity>

                {/* Version */}
                <Text style={styles.versionText}>TransiGo V1.0.3</Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },

    // Header
    header: {
        paddingTop: 50,
        paddingBottom: 30,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        marginBottom: 20,
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
    menuButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuIcon: {
        fontSize: 24,
        color: COLORS.white,
    },

    // Profil
    profileSection: {
        alignItems: 'center',
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: SPACING.md,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    avatarText: {
        fontSize: 50,
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    editIcon: {
        fontSize: 14,
    },
    userName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.white,
        marginBottom: 4,
    },
    userContact: {
        fontSize: 12,
        color: COLORS.white,
        opacity: 0.9,
    },

    // Étoile
    starContainer: {
        alignItems: 'center',
        marginTop: -12,
        marginBottom: SPACING.md,
    },
    starIcon: {
        fontSize: 24,
    },

    // ScrollView
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: SPACING.lg,
        paddingBottom: 40,
    },

    // Menu
    menuSection: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        marginBottom: SPACING.md,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.background,
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: COLORS.primaryBg,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    menuItemText: {
        fontSize: 15,
        fontWeight: '500',
        color: COLORS.text,
    },
    menuItemRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    rightText: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },

    // Déconnexion
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 16,
        paddingVertical: SPACING.md,
        marginBottom: SPACING.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    logoutText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#F44336',
        marginLeft: SPACING.sm,
    },

    // Version
    versionText: {
        fontSize: 12,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginTop: SPACING.sm,
    },
});
