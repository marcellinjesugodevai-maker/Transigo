// =============================================
// TRANSIGO - CENTRE DE NOTIFICATIONS
// Historique et paramètres des notifications
// =============================================

import { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@/components/Icon';
import { COLORS, SPACING, RADIUS } from '@/constants';
import { useThemeStore, useLanguageStore } from '@/stores';
import { getTranslation } from '@/i18n/translations';

// Notifications simulées
const NOTIFICATIONS = [
    {
        id: 'n1',
        type: 'promo',
        title: '🎉 -30% sur votre prochaine course !',
        message: 'Utilisez le code TRANSIGO30 avant dimanche.',
        time: 'Il y a 2h',
        read: false,
        icon: '🎁',
        color: '#E91E63'
    },
    {
        id: 'n2',
        type: 'ride',
        title: '🚗 Course terminée',
        message: 'Votre course vers Aéroport FHB a été complétée. Total: 3500 F',
        time: 'Il y a 5h',
        read: false,
        icon: '🚗',
        color: '#4CAF50'
    },
    {
        id: 'n3',
        type: 'food',
        title: '🍔 Commande livrée !',
        message: 'Votre commande de Poulet Braisé a été livrée.',
        time: 'Hier',
        read: true,
        icon: '🍔',
        color: '#FF5722'
    },
    {
        id: 'n4',
        type: 'wallet',
        title: '💰 Recharge réussie',
        message: '5000 F ajoutés à votre portefeuille via Wave.',
        time: 'Hier',
        read: true,
        icon: '💰',
        color: '#2196F3'
    },
    {
        id: 'n5',
        type: 'lottery',
        title: '🎰 Vous avez gagné !',
        message: '1000 F ajoutés à votre portefeuille grâce à la loterie.',
        time: 'Il y a 2 jours',
        read: true,
        icon: '🎰',
        color: '#FFD700'
    },
    {
        id: 'n6',
        type: 'promo',
        title: '🍕 Pizza à -50% ce week-end',
        message: 'Profitez de -50% sur Pizza Express tout le week-end !',
        time: 'Il y a 3 jours',
        read: true,
        icon: '🍕',
        color: '#FF9800'
    },
];

type TabType = 'all' | 'settings';

export default function NotificationsScreen() {
    const { isDark, colors } = useThemeStore();
    const { language } = useLanguageStore();
    const t = (key: any) => getTranslation(key, language);

    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [notifications, setNotifications] = useState(NOTIFICATIONS);

    // Paramètres
    const [pushEnabled, setPushEnabled] = useState(true);
    const [rideNotifs, setRideNotifs] = useState(true);
    const [promoNotifs, setPromoNotifs] = useState(true);
    const [foodNotifs, setFoodNotifs] = useState(true);
    const [walletNotifs, setWalletNotifs] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [vibrationEnabled, setVibrationEnabled] = useState(true);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAsRead = (id: string) => {
        setNotifications(notifications.map(n =>
            n.id === id ? { ...n, read: true } : n
        ));
    };

    const markAllAsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
    };

    const deleteNotification = (id: string) => {
        setNotifications(notifications.filter(n => n.id !== id));
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <LinearGradient
                colors={['#2196F3', '#1976D2']}
                style={styles.header}
            >
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Icon name="arrow-back" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>🔔 Notifications</Text>
                    {unreadCount > 0 && (
                        <View style={styles.unreadBadge}>
                            <Text style={styles.unreadText}>{unreadCount}</Text>
                        </View>
                    )}
                </View>
                {activeTab === 'all' && unreadCount > 0 && (
                    <TouchableOpacity onPress={markAllAsRead}>
                        <Text style={styles.markAllText}>
                            {language === 'fr' ? 'Tout lire' : 'Read all'}
                        </Text>
                    </TouchableOpacity>
                )}
            </LinearGradient>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'all' && styles.tabActive]}
                    onPress={() => setActiveTab('all')}
                >
                    <Text style={styles.tabIcon}>📋</Text>
                    <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
                        {language === 'fr' ? 'Historique' : 'History'}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'settings' && styles.tabActive]}
                    onPress={() => setActiveTab('settings')}
                >
                    <Text style={styles.tabIcon}>⚙️</Text>
                    <Text style={[styles.tabText, activeTab === 'settings' && styles.tabTextActive]}>
                        {language === 'fr' ? 'Paramètres' : 'Settings'}
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* ===== HISTORIQUE ===== */}
                {activeTab === 'all' && (
                    <>
                        {notifications.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyIcon}>🔔</Text>
                                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                                    {language === 'fr' ? 'Aucune notification' : 'No notifications'}
                                </Text>
                            </View>
                        ) : (
                            notifications.map((notif) => (
                                <TouchableOpacity
                                    key={notif.id}
                                    style={[
                                        styles.notifCard,
                                        { backgroundColor: colors.card },
                                        !notif.read && styles.notifCardUnread
                                    ]}
                                    onPress={() => markAsRead(notif.id)}
                                    onLongPress={() => deleteNotification(notif.id)}
                                    activeOpacity={0.9}
                                >
                                    <View style={[styles.notifIcon, { backgroundColor: notif.color + '20' }]}>
                                        <Text style={styles.notifIconText}>{notif.icon}</Text>
                                    </View>
                                    <View style={styles.notifContent}>
                                        <Text style={[styles.notifTitle, { color: colors.text }]}>
                                            {notif.title}
                                        </Text>
                                        <Text style={[styles.notifMessage, { color: colors.textSecondary }]} numberOfLines={2}>
                                            {notif.message}
                                        </Text>
                                        <Text style={[styles.notifTime, { color: colors.textSecondary }]}>
                                            {notif.time}
                                        </Text>
                                    </View>
                                    {!notif.read && <View style={styles.unreadDot} />}
                                </TouchableOpacity>
                            ))
                        )}

                        <Text style={[styles.hint, { color: colors.textSecondary }]}>
                            💡 {language === 'fr' ? 'Appui long pour supprimer' : 'Long press to delete'}
                        </Text>
                    </>
                )}

                {/* ===== PARAMÈTRES ===== */}
                {activeTab === 'settings' && (
                    <>
                        {/* Global */}
                        <View style={[styles.settingsCard, { backgroundColor: colors.card }]}>
                            <Text style={[styles.settingsTitle, { color: colors.text }]}>
                                🔔 {language === 'fr' ? 'Général' : 'General'}
                            </Text>

                            <View style={styles.settingItem}>
                                <View style={styles.settingInfo}>
                                    <Text style={styles.settingIcon}>📲</Text>
                                    <Text style={[styles.settingLabel, { color: colors.text }]}>
                                        {language === 'fr' ? 'Notifications push' : 'Push notifications'}
                                    </Text>
                                </View>
                                <Switch
                                    value={pushEnabled}
                                    onValueChange={setPushEnabled}
                                    trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
                                    thumbColor={COLORS.white}
                                />
                            </View>

                            <View style={styles.settingItem}>
                                <View style={styles.settingInfo}>
                                    <Text style={styles.settingIcon}>🔊</Text>
                                    <Text style={[styles.settingLabel, { color: colors.text }]}>
                                        {language === 'fr' ? 'Son' : 'Sound'}
                                    </Text>
                                </View>
                                <Switch
                                    value={soundEnabled}
                                    onValueChange={setSoundEnabled}
                                    trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
                                    thumbColor={COLORS.white}
                                />
                            </View>

                            <View style={styles.settingItem}>
                                <View style={styles.settingInfo}>
                                    <Text style={styles.settingIcon}>📳</Text>
                                    <Text style={[styles.settingLabel, { color: colors.text }]}>
                                        {language === 'fr' ? 'Vibration' : 'Vibration'}
                                    </Text>
                                </View>
                                <Switch
                                    value={vibrationEnabled}
                                    onValueChange={setVibrationEnabled}
                                    trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
                                    thumbColor={COLORS.white}
                                />
                            </View>
                        </View>

                        {/* Types de notifications */}
                        <View style={[styles.settingsCard, { backgroundColor: colors.card }]}>
                            <Text style={[styles.settingsTitle, { color: colors.text }]}>
                                📂 {language === 'fr' ? 'Types de notifications' : 'Notification types'}
                            </Text>

                            <View style={styles.settingItem}>
                                <View style={styles.settingInfo}>
                                    <Text style={styles.settingIcon}>🚗</Text>
                                    <Text style={[styles.settingLabel, { color: colors.text }]}>
                                        {language === 'fr' ? 'Courses & Livraisons' : 'Rides & Deliveries'}
                                    </Text>
                                </View>
                                <Switch
                                    value={rideNotifs}
                                    onValueChange={setRideNotifs}
                                    trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
                                    thumbColor={COLORS.white}
                                />
                            </View>

                            <View style={styles.settingItem}>
                                <View style={styles.settingInfo}>
                                    <Text style={styles.settingIcon}>🍔</Text>
                                    <Text style={[styles.settingLabel, { color: colors.text }]}>
                                        TransiGo Food
                                    </Text>
                                </View>
                                <Switch
                                    value={foodNotifs}
                                    onValueChange={setFoodNotifs}
                                    trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
                                    thumbColor={COLORS.white}
                                />
                            </View>

                            <View style={styles.settingItem}>
                                <View style={styles.settingInfo}>
                                    <Text style={styles.settingIcon}>🎁</Text>
                                    <Text style={[styles.settingLabel, { color: colors.text }]}>
                                        {language === 'fr' ? 'Promos & Offres' : 'Promos & Offers'}
                                    </Text>
                                </View>
                                <Switch
                                    value={promoNotifs}
                                    onValueChange={setPromoNotifs}
                                    trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
                                    thumbColor={COLORS.white}
                                />
                            </View>

                            <View style={styles.settingItem}>
                                <View style={styles.settingInfo}>
                                    <Text style={styles.settingIcon}>💰</Text>
                                    <Text style={[styles.settingLabel, { color: colors.text }]}>
                                        {language === 'fr' ? 'Portefeuille' : 'Wallet'}
                                    </Text>
                                </View>
                                <Switch
                                    value={walletNotifs}
                                    onValueChange={setWalletNotifs}
                                    trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
                                    thumbColor={COLORS.white}
                                />
                            </View>
                        </View>
                    </>
                )}

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
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerContent: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: SPACING.md },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.white },
    unreadBadge: {
        backgroundColor: '#FF5252',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        marginLeft: 8,
    },
    unreadText: { color: COLORS.white, fontSize: 12, fontWeight: 'bold' },
    markAllText: { color: COLORS.white, fontSize: 13, fontWeight: '500' },

    // Tabs
    tabsContainer: {
        flexDirection: 'row',
        marginHorizontal: SPACING.lg,
        marginTop: SPACING.md,
        backgroundColor: '#E0E0E0',
        borderRadius: 16,
        padding: 4,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 6,
    },
    tabActive: { backgroundColor: '#FFF' },
    tabIcon: { fontSize: 18 },
    tabText: { fontSize: 13, fontWeight: '600', color: '#666' },
    tabTextActive: { color: '#2196F3' },

    content: { padding: SPACING.lg },

    // Empty
    emptyState: { alignItems: 'center', paddingVertical: 60 },
    emptyIcon: { fontSize: 60, marginBottom: SPACING.md },
    emptyTitle: { fontSize: 18, fontWeight: '600' },

    // Notification Card
    notifCard: {
        flexDirection: 'row',
        padding: SPACING.md,
        borderRadius: 16,
        marginBottom: SPACING.sm,
        alignItems: 'flex-start',
    },
    notifCardUnread: {
        borderLeftWidth: 4,
        borderLeftColor: '#2196F3',
    },
    notifIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notifIconText: { fontSize: 24 },
    notifContent: { flex: 1, marginLeft: SPACING.sm },
    notifTitle: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
    notifMessage: { fontSize: 13, lineHeight: 18, marginBottom: 4 },
    notifTime: { fontSize: 11 },
    unreadDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#2196F3',
        marginTop: 4,
    },
    hint: { fontSize: 12, textAlign: 'center', marginTop: SPACING.md },

    // Settings
    settingsCard: { padding: SPACING.md, borderRadius: 16, marginBottom: SPACING.md },
    settingsTitle: { fontSize: 16, fontWeight: '700', marginBottom: SPACING.sm },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    settingInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    settingIcon: { fontSize: 20 },
    settingLabel: { fontSize: 14 },
});
