// =============================================
// TRANSIGO - WALLET SCREEN (NOUVELLE MAQUETTE)
// =============================================

import { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Clipboard,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Icon from '@/components/Icon';
import { COLORS, SPACING, RADIUS } from '@/constants';
import { formatCurrency } from '@transigo/shared';

// Transactions fictives
const TRANSACTIONS = [
    {
        id: '1',
        type: 'recharge',
        title: 'Recharge Mobile Money',
        description: '14:30 • Orange Money',
        amount: 5000,
        date: 'Aujourd\'hui',
        icon: '💳',
        iconBg: '#4CAF50',
    },
    {
        id: '2',
        type: 'ride',
        title: 'Course vers Plateau',
        description: '12:15 • TransiGo Classic',
        amount: -2500,
        date: 'Aujourd\'hui',
        icon: '🚗',
        iconBg: COLORS.primary,
    },
    {
        id: '3',
        type: 'recharge',
        title: 'Recharge Wave',
        description: 'Hier • 18:45',
        amount: 10000,
        date: 'Hier',
        icon: '💳',
        iconBg: '#4CAF50',
    },
];

export default function WalletScreen() {
    const [balance] = useState(2500);
    const walletId = '8829 **** 1023';

    const copyWalletId = () => {
        Clipboard.setString('8829123456781023');
        Alert.alert('Copié', 'ID Wallet copié dans le presse-papier');
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                    activeOpacity={0.8}
                >
                    <Icon name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mon Portefeuille</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Carte de solde */}
                <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.balanceCard}
                >
                    <View style={styles.balanceHeader}>
                        <Text style={styles.balanceLabel}>Solde actuel</Text>
                        <View style={styles.walletIconContainer}>
                            <Text style={styles.walletIcon}>💳</Text>
                        </View>
                    </View>

                    <Text style={styles.balanceAmount}>
                        {balance.toLocaleString('fr-FR')} FCFA
                    </Text>

                    <TouchableOpacity
                        style={styles.walletIdContainer}
                        onPress={copyWalletId}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.walletIdText}>
                            TransiGo Wallet ID: {walletId}
                        </Text>
                        <Text style={styles.copyIcon}>📋</Text>
                    </TouchableOpacity>
                </LinearGradient>

                {/* Boutons d'actions */}
                <View style={styles.actionsContainer}>
                    {/* Recharger */}
                    <TouchableOpacity
                        style={[styles.actionButton, styles.actionButtonPrimary]}
                        activeOpacity={0.9}
                    >
                        <LinearGradient
                            colors={[COLORS.primary, COLORS.primaryDark]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.actionButtonGradient}
                        >
                            <Text style={styles.actionIconPrimary}>+</Text>
                            <Text style={styles.actionTextPrimary}>Recharger</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Retirer */}
                    <TouchableOpacity
                        style={styles.actionButton}
                        activeOpacity={0.9}
                    >
                        <View style={styles.actionButtonWhite}>
                            <Text style={styles.actionIcon}>↑</Text>
                            <Text style={styles.actionText}>Retirer</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Transférer */}
                    <TouchableOpacity
                        style={styles.actionButton}
                        activeOpacity={0.9}
                    >
                        <View style={styles.actionButtonWhite}>
                            <Text style={styles.actionIcon}>⇄</Text>
                            <Text style={styles.actionText}>Transférer</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Offres Spéciales */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Offres Spéciales</Text>
                    <TouchableOpacity activeOpacity={0.8}>
                        <Text style={styles.seeAllButton}>Voir tout</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.offerCard}>
                    <View style={styles.offerIconContainer}>
                        <Text style={styles.offerIcon}>🎫</Text>
                    </View>
                    <View style={styles.offerInfo}>
                        <Text style={styles.offerTitle}>Pass Étudiant</Text>
                        <Text style={styles.offerDiscount}>-30%</Text>
                        <Text style={styles.offerDetails}>
                            Valable sur 10 courses • Expire le 30 Déc
                        </Text>
                    </View>
                    <TouchableOpacity style={styles.activateButton} activeOpacity={0.9}>
                        <Text style={styles.activateButtonText}>Activer</Text>
                    </TouchableOpacity>
                </View>

                {/* Historique des transactions */}
                <Text style={styles.sectionTitle}>Historique des transactions</Text>

                <Text style={styles.dateLabel}>AUJOURD'HUI</Text>

                {TRANSACTIONS.map((transaction) => (
                    <View key={transaction.id} style={styles.transactionCard}>
                        <View
                            style={[
                                styles.transactionIcon,
                                { backgroundColor: transaction.iconBg + '20' },
                            ]}
                        >
                            <Text style={styles.transactionEmoji}>{transaction.icon}</Text>
                        </View>
                        <View style={styles.transactionInfo}>
                            <Text style={styles.transactionTitle}>{transaction.title}</Text>
                            <Text style={styles.transactionDescription}>
                                {transaction.description}
                            </Text>
                        </View>
                        <Text
                            style={[
                                styles.transactionAmount,
                                transaction.amount > 0
                                    ? styles.transactionAmountPositive
                                    : styles.transactionAmountNegative,
                            ]}
                        >
                            {transaction.amount > 0 ? '+' : ''}
                            {transaction.amount.toLocaleString('fr-FR')} F
                        </Text>
                    </View>
                ))}
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingTop: 50,
        paddingBottom: SPACING.md,
        backgroundColor: COLORS.white,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },

    // ScrollView
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: SPACING.lg,
    },

    // Carte de solde
    balanceCard: {
        borderRadius: 24,
        padding: SPACING.lg,
        marginBottom: SPACING.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
    },
    balanceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    balanceLabel: {
        fontSize: 14,
        color: COLORS.white,
        opacity: 0.9,
    },
    walletIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    walletIcon: {
        fontSize: 20,
    },
    balanceAmount: {
        fontSize: 36,
        fontWeight: 'bold',
        color: COLORS.white,
        marginBottom: SPACING.md,
    },
    walletIdContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    walletIdText: {
        fontSize: 12,
        color: COLORS.white,
        opacity: 0.8,
    },
    copyIcon: {
        fontSize: 16,
    },

    // Actions
    actionsContainer: {
        flexDirection: 'row',
        gap: SPACING.md,
        marginBottom: SPACING.xl,
    },
    actionButton: {
        flex: 1,
    },
    actionButtonPrimary: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    actionButtonGradient: {
        paddingVertical: SPACING.lg,
        alignItems: 'center',
        borderRadius: 20,
    },
    actionButtonWhite: {
        backgroundColor: COLORS.white,
        paddingVertical: SPACING.lg,
        alignItems: 'center',
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    actionIconPrimary: {
        fontSize: 28,
        color: COLORS.white,
        marginBottom: 4,
    },
    actionIcon: {
        fontSize: 28,
        color: COLORS.primary,
        marginBottom: 4,
    },
    actionTextPrimary: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.white,
    },
    actionText: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.text,
    },

    // Section Header
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: SPACING.md,
    },
    seeAllButton: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.primary,
    },

    // Offre
    offerCard: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: SPACING.md,
        marginBottom: SPACING.xl,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        alignItems: 'center',
    },
    offerIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 12,
        backgroundColor: '#7B1FA2' + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    offerIcon: {
        fontSize: 24,
    },
    offerInfo: {
        flex: 1,
    },
    offerTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 2,
    },
    offerDiscount: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#7B1FA2',
        marginBottom: 4,
    },
    offerDetails: {
        fontSize: 11,
        color: COLORS.textSecondary,
    },
    activateButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#7B1FA2',
    },
    activateButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#7B1FA2',
    },

    // Historique
    dateLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginBottom: SPACING.md,
        letterSpacing: 0.5,
    },
    transactionCard: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: SPACING.md,
        marginBottom: SPACING.md,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    transactionIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    transactionEmoji: {
        fontSize: 24,
    },
    transactionInfo: {
        flex: 1,
    },
    transactionTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 4,
    },
    transactionDescription: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    transactionAmount: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    transactionAmountPositive: {
        color: '#4CAF50',
    },
    transactionAmountNegative: {
        color: COLORS.text,
    },
});
