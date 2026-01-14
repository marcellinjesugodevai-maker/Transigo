// =============================================
// TRANSIGO DRIVER - NOTIFICATIONS
// Centre de notifications chauffeur
// =============================================

import { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
    primary: '#FF6B00',
    secondary: '#00C853',
    secondaryDark: '#00A344',
    white: '#FFFFFF',
    black: '#1A1A2E',
    gray50: '#FAFAFA',
    gray100: '#F5F5F5',
    gray600: '#757575',
};

interface Notification {
    id: string;
    type: 'bonus' | 'info' | 'warning' | 'promo' | 'review';
    title: string;
    message: string;
    time: string;
    read: boolean;
}

const NOTIFICATIONS: Notification[] = [
    {
        id: '1',
        type: 'bonus',
        title: '💰 Bonus Heure de Pointe !',
        message: 'Gagnez +500 FCFA par course entre 17h et 20h ce soir.',
        time: 'Il y a 10 min',
        read: false,
    },
    {
        id: '2',
        type: 'review',
        title: '⭐ Nouvel avis reçu',
        message: 'Kofi Asante vous a donné 5 étoiles et un pourboire de 500 F !',
        time: 'Il y a 30 min',
        read: false,
    },
    {
        id: '3',
        type: 'promo',
        title: '🎯 Objectif Atteint !',
        message: 'Félicitations ! Vous avez complété 10 courses. Bonus de 5000 F débloqué.',
        time: 'Il y a 2h',
        read: false,
    },
    {
        id: '4',
        type: 'info',
        title: '📋 Mise à jour documents',
        message: 'Votre assurance expire dans 15 jours. Pensez à la renouveler.',
        time: 'Hier, 18:30',
        read: true,
    },
    {
        id: '5',
        type: 'warning',
        title: '⚠️ Taux d\'acceptation bas',
        message: 'Votre taux d\'acceptation est passé à 85%. Maintenez-le au-dessus de 90%.',
        time: 'Hier, 14:00',
        read: true,
    },
    {
        id: '6',
        type: 'bonus',
        title: '🎉 Week-end Bonus',
        message: 'Ce week-end, gagnez +1000 F pour chaque course vers l\'aéroport !',
        time: 'Lun, 1 Jan',
        read: true,
    },
    {
        id: '7',
        type: 'info',
        title: '📱 Nouvelle fonctionnalité',
        message: 'Vous pouvez maintenant voir vos objectifs journaliers dans l\'app.',
        time: 'Dim, 31 Dec',
        read: true,
    },
];

export default function DriverNotificationsScreen() {
    const [notifications, setNotifications] = useState(NOTIFICATIONS);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAsRead = (id: string) => {
        setNotifications(notifications.map(n =>
            n.id === id ? { ...n, read: true } : n
        ));
    };

    const markAllAsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
    };

    const getTypeIcon = (type: Notification['type']) => {
        switch (type) {
            case 'bonus': return { icon: '💰', color: COLORS.secondary, bg: '#E8F5E9' };
            case 'review': return { icon: '⭐', color: '#FFB800', bg: '#FFF8E1' };
            case 'promo': return { icon: '🏆', color: '#9C27B0', bg: '#F3E5F5' };
            case 'info': return { icon: 'ℹ️', color: '#2196F3', bg: '#E3F2FD' };
            case 'warning': return { icon: '⚠️', color: '#FF9800', bg: '#FFF3E0' };
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <LinearGradient colors={[COLORS.secondary, COLORS.secondaryDark]} style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Text style={{ fontSize: 24, color: COLORS.white }}>⬅️</Text>
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>🔔 Notifications</Text>
                    {unreadCount > 0 && (
                        <View style={styles.unreadBadge}>
                            <Text style={styles.unreadText}>{unreadCount} non lues</Text>
                        </View>
                    )}
                </View>
                {unreadCount > 0 && (
                    <TouchableOpacity onPress={markAllAsRead}>
                        <Text style={styles.markAllText}>Tout marquer lu</Text>
                    </TouchableOpacity>
                )}
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {notifications.map((notification) => {
                    const typeStyle = getTypeIcon(notification.type);

                    return (
                        <TouchableOpacity
                            key={notification.id}
                            style={[
                                styles.notificationCard,
                                !notification.read && styles.notificationUnread
                            ]}
                            onPress={() => markAsRead(notification.id)}
                            activeOpacity={0.8}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: typeStyle.bg }]}>
                                <Text style={{ fontSize: 22 }}>{typeStyle.icon}</Text>
                            </View>
                            <View style={styles.notificationContent}>
                                <Text style={styles.notificationTitle}>{notification.title}</Text>
                                <Text style={styles.notificationMessage}>{notification.message}</Text>
                                <Text style={styles.notificationTime}>{notification.time}</Text>
                            </View>
                            {!notification.read && <View style={styles.unreadDot} />}
                        </TouchableOpacity>
                    );
                })}

                {notifications.length === 0 && (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>🔕</Text>
                        <Text style={styles.emptyText}>Aucune notification</Text>
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.gray50 },

    // Header
    header: {
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerContent: { flex: 1, marginLeft: 12 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.white },
    unreadBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
        alignSelf: 'flex-start',
        marginTop: 4,
    },
    unreadText: { fontSize: 11, color: COLORS.white },
    markAllText: { fontSize: 12, color: COLORS.white, textDecorationLine: 'underline' },

    content: { padding: 16 },

    // Notification card
    notificationCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: COLORS.white,
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
    },
    notificationUnread: {
        borderLeftWidth: 4,
        borderLeftColor: COLORS.secondary,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationContent: { flex: 1, marginLeft: 12 },
    notificationTitle: { fontSize: 14, fontWeight: '600', color: COLORS.black, marginBottom: 4 },
    notificationMessage: { fontSize: 13, color: COLORS.gray600, lineHeight: 18 },
    notificationTime: { fontSize: 11, color: COLORS.gray600, marginTop: 6 },
    unreadDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.secondary,
        marginLeft: 8,
    },

    // Empty
    emptyContainer: { alignItems: 'center', paddingVertical: 60 },
    emptyIcon: { fontSize: 50, marginBottom: 12 },
    emptyText: { fontSize: 14, color: COLORS.gray600 },
});
