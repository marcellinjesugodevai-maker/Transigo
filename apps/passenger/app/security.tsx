// =============================================
// TRANSIGO - SECURITY SCREEN
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
import { useLanguageStore, useThemeStore } from '@/stores';
import { getTranslation } from '@/i18n/translations';

export default function SecurityScreen() {
    const { language } = useLanguageStore();
    const { isDark, colors } = useThemeStore();
    const t = (key: any) => getTranslation(key, language);

    const [biometricEnabled, setBiometricEnabled] = useState(false);
    const [pinEnabled, setPinEnabled] = useState(false);

    const handleChangePassword = () => {
        Alert.alert('Changer mot de passe', 'Fonctionnalité à venir');
    };

    const handleLogoutAll = () => {
        Alert.alert(
            'Déconnexion',
            'Déconnecter tous les appareils ?',
            [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Déconnecter', style: 'destructive' },
            ]
        );
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
                <Text style={styles.headerTitle}>{t('security')}</Text>
                <View style={{ width: 40 }} />
            </LinearGradient>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Mot de passe */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Authentification</Text>
                    <TouchableOpacity
                        style={[styles.settingItem, { backgroundColor: colors.card }]}
                        onPress={handleChangePassword}
                        activeOpacity={0.8}
                    >
                        <View style={styles.settingLeft}>
                            <View style={[styles.iconContainer, { backgroundColor: '#2196F320' }]}>
                                <Icon name="lock-closed" size={20} color="#2196F3" />
                            </View>
                            <Text style={[styles.settingText, { color: colors.text }]}>{language === 'fr' ? 'Changer mot de passe' : 'Change password'}</Text>
                        </View>
                        <Icon name="chevron-forward" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>

                    {/* PIN */}
                    <View style={[styles.settingItem, { backgroundColor: colors.card }]}>
                        <View style={styles.settingLeft}>
                            <View style={[styles.iconContainer, { backgroundColor: '#FF980020' }]}>
                                <Icon name="keypad" size={20} color="#FF9800" />
                            </View>
                            <Text style={[styles.settingText, { color: colors.text }]}>{language === 'fr' ? 'Code PIN' : 'PIN Code'}</Text>
                        </View>
                        <Switch
                            value={pinEnabled}
                            onValueChange={setPinEnabled}
                            trackColor={{ false: colors.textSecondary + '30', true: COLORS.primary + '50' }}
                            thumbColor={pinEnabled ? COLORS.primary : colors.card}
                        />
                    </View>

                    {/* Biométrique */}
                    <View style={[styles.settingItem, { backgroundColor: colors.card }]}>
                        <View style={styles.settingLeft}>
                            <View style={[styles.iconContainer, { backgroundColor: '#4CAF5020' }]}>
                                <Icon name="finger-print" size={20} color="#4CAF50" />
                            </View>
                            <Text style={[styles.settingText, { color: colors.text }]}>{language === 'fr' ? 'Authentification biométrique' : 'Biometric authentication'}</Text>
                        </View>
                        <Switch
                            value={biometricEnabled}
                            onValueChange={setBiometricEnabled}
                            trackColor={{ false: colors.textSecondary + '30', true: COLORS.primary + '50' }}
                            thumbColor={biometricEnabled ? COLORS.primary : colors.card}
                        />
                    </View>
                </View>

                {/* Sessions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Sessions Actives</Text>
                    <View style={styles.sessionCard}>
                        <View style={styles.sessionHeader}>
                            <Text style={styles.sessionIcon}>📱</Text>
                            <View style={styles.sessionInfo}>
                                <Text style={styles.sessionDevice}>iPhone 13 Pro</Text>
                                <Text style={styles.sessionLocation}>Abidjan, Côte d'Ivoire</Text>
                                <Text style={styles.sessionTime}>Actuellement active</Text>
                            </View>
                        </View>
                        <View style={styles.currentBadge}>
                            <Text style={styles.currentText}>Cet appareil</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.logoutAllButton}
                        onPress={handleLogoutAll}
                        activeOpacity={0.9}
                    >
                        <Text style={styles.logoutAllText}>Déconnecter tous les appareils</Text>
                    </TouchableOpacity>
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
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: SPACING.md,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 12,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    settingText: {
        fontSize: 15,
        fontWeight: '500',
        color: COLORS.text,
    },
    sessionCard: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: SPACING.md,
        marginBottom: SPACING.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    sessionHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: SPACING.sm,
    },
    sessionIcon: {
        fontSize: 32,
        marginRight: SPACING.md,
    },
    sessionInfo: {
        flex: 1,
    },
    sessionDevice: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 2,
    },
    sessionLocation: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginBottom: 2,
    },
    sessionTime: {
        fontSize: 12,
        color: COLORS.primary,
    },
    currentBadge: {
        backgroundColor: COLORS.primaryBg,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    currentText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    logoutAllButton: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        paddingVertical: 14,
        borderWidth: 2,
        borderColor: '#F44336',
        alignItems: 'center',
    },
    logoutAllText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#F44336',
    },
});
