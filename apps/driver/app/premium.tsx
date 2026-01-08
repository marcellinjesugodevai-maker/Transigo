// =============================================
// TRANSIGO DRIVER - PREMIUM & MONETISATION
// Boost, Abonnements, Wallet avancé
// =============================================

import { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Dimensions,
    Alert,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const COLORS = {
    primary: '#FF6B00',
    secondary: '#00C853',
    secondaryDark: '#00A344',
    white: '#FFFFFF',
    black: '#1A1A2E',
    gray50: '#FAFAFA',
    gray100: '#F5F5F5',
    gray600: '#757575',
    gold: '#FFD700',
    premium: '#FF9800',
    premiumDark: '#F57C00',
};

import { useDriverPremiumsStore } from '../src/stores/driverPremiumsStore';

// Boost options
const BOOST_OPTIONS = [
    { id: 'b1', duration: '1 heure', price: 500, multiplier: 1.5, popular: false },
    { id: 'b2', duration: '3 heures', price: 1200, multiplier: 1.5, popular: true },
    { id: 'b3', duration: '6 heures', price: 2000, multiplier: 1.5, popular: false },
];

// Subscription plans
const SUBSCRIPTIONS = [
    {
        id: 's1',
        name: 'Gratuit',
        price: 0,
        commission: 15,
        features: ['Accès basique', 'Support standard'],
        current: false,
    },
    {
        id: 's2',
        name: 'Pro',
        price: 5000,
        period: 'semaine',
        commission: 8,
        features: ['Commission réduite 8%', 'Priorité courses', 'Support 24/7', 'Analytics avancés', 'Pas de pub'],
        current: true,
        badge: '⭐',
    },
    {
        id: 's3',
        name: 'Premium',
        price: 15000,
        period: 'mois',
        commission: 5,
        features: ['Commission 5%', 'Priorité maximale', 'Courses VIP', 'Boost 2h/jour gratuit', 'Assurance premium', 'Badge Premium visible'],
        popular: true,
        badge: '👑',
    },
];

// Wallet info (Mock transactions, but balance from store)
const MOCK_TRANSACTIONS = [
    { id: 't1', type: 'earning', amount: 45000, description: 'Gains du jour', date: 'Aujourd\'hui' },
    { id: 't2', type: 'tip', amount: 2500, description: 'Pourboire reçu', date: 'Aujourd\'hui' },
    { id: 't3', type: 'withdrawal', amount: -50000, description: 'Retrait Orange Money', date: 'Hier' },
    { id: 't4', type: 'bonus', amount: 5000, description: 'Bonus objectif', date: 'Hier' },
    { id: 't5', type: 'subscription', amount: -5000, description: 'Abonnement Pro', date: 'Lun' },
];

/* Removed static WALLET const, using store */


export default function PremiumScreen() {
    const { subscription, subscribe, savings, addToSavings } = useDriverPremiumsStore();
    const [activeTab, setActiveTab] = useState<'boost' | 'subscription' | 'wallet'>('boost');
    const [selectedBoost, setSelectedBoost] = useState<string | null>(null);

    const handleSubscribe = (planId: string) => {
        subscribe(planId as any); // Simplification typage
        Alert.alert('Félicitations !', 'Vous êtes maintenant abonné.');
    };

    const handleBoost = () => {
        if (!selectedBoost) {
            Alert.alert('Sélection requise', 'Veuillez choisir une durée de boost');
            return;
        }
        const boost = BOOST_OPTIONS.find(b => b.id === selectedBoost);
        Alert.alert(
            '🚀 Activer le Boost ?',
            `Boost x${boost?.multiplier} pendant ${boost?.duration} pour ${boost?.price} F`,
            [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Confirmer', onPress: () => Alert.alert('✅ Boost activé !', 'Vous apparaissez en priorité') },
            ]
        );
    };

    const getTransactionIcon = (type: string) => {
        switch (type) {
            case 'earning': return { icon: '💰', color: COLORS.secondary };
            case 'tip': return { icon: '🎁', color: COLORS.premium };
            case 'withdrawal': return { icon: '🏦', color: COLORS.primary };
            case 'bonus': return { icon: '🎯', color: '#9C27B0' };
            case 'subscription': return { icon: '⭐', color: '#2196F3' };
            default: return { icon: '💸', color: COLORS.gray600 };
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <LinearGradient colors={[COLORS.premium, COLORS.premiumDark]} style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>👑 Premium & Wallet</Text>
                    <Text style={styles.headerSubtitle}>Boosters, abonnements, portefeuille</Text>
                </View>
            </LinearGradient>

            {/* Tabs */}
            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'boost' && styles.tabActive]}
                    onPress={() => setActiveTab('boost')}
                >
                    <Text style={[styles.tabText, activeTab === 'boost' && styles.tabTextActive]}>🚀 Boost</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'subscription' && styles.tabActive]}
                    onPress={() => setActiveTab('subscription')}
                >
                    <Text style={[styles.tabText, activeTab === 'subscription' && styles.tabTextActive]}>⭐ Abonnement</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'wallet' && styles.tabActive]}
                    onPress={() => setActiveTab('wallet')}
                >
                    <Text style={[styles.tabText, activeTab === 'wallet' && styles.tabTextActive]}>💳 Wallet</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {activeTab === 'boost' && (
                    <>
                        {/* Boost explanation */}
                        <View style={styles.boostExplain}>
                            <Text style={styles.boostExplainIcon}>🚀</Text>
                            <View style={styles.boostExplainText}>
                                <Text style={styles.boostExplainTitle}>Boost = Plus de courses</Text>
                                <Text style={styles.boostExplainDesc}>Apparaissez en priorité auprès des passagers et recevez plus de demandes !</Text>
                            </View>
                        </View>

                        {/* Boost options */}
                        <Text style={styles.sectionTitle}>Choisissez votre boost</Text>
                        {BOOST_OPTIONS.map((boost) => (
                            <TouchableOpacity
                                key={boost.id}
                                style={[styles.boostCard, selectedBoost === boost.id && styles.boostCardSelected]}
                                onPress={() => setSelectedBoost(boost.id)}
                            >
                                {boost.popular && <View style={styles.popularBadge}><Text style={styles.popularText}>Populaire</Text></View>}
                                <View style={styles.boostContent}>
                                    <Text style={styles.boostDuration}>{boost.duration}</Text>
                                    <Text style={styles.boostMultiplier}>x{boost.multiplier} priorité</Text>
                                </View>
                                <View style={styles.boostPriceBox}>
                                    <Text style={styles.boostPrice}>{boost.price} F</Text>
                                </View>
                                <View style={[styles.radioOuter, selectedBoost === boost.id && styles.radioOuterSelected]}>
                                    {selectedBoost === boost.id && <View style={styles.radioInner} />}
                                </View>
                            </TouchableOpacity>
                        ))}

                        {/* Activate button */}
                        <TouchableOpacity style={styles.activateBtn} onPress={handleBoost}>
                            <LinearGradient colors={[COLORS.secondary, COLORS.secondaryDark]} style={styles.activateBtnGradient}>
                                <Text style={styles.activateBtnText}>ACTIVER LE BOOST</Text>
                                <Ionicons name="rocket" size={20} color={COLORS.white} />
                            </LinearGradient>
                        </TouchableOpacity>
                    </>
                )}

                {activeTab === 'subscription' && (
                    <>
                        {SUBSCRIPTIONS.map((sub) => {
                            const isCurrent = subscription.plan === sub.id || (sub.id === 'free' && subscription.plan === 'free');
                            return (
                                <View key={sub.id} style={[styles.subCard, sub.popular && styles.subCardPopular, isCurrent && styles.subCardCurrent]}>
                                    {sub.popular && <View style={styles.subPopularBadge}><Text style={styles.subPopularText}>🔥 MEILLEUR</Text></View>}
                                    {isCurrent && <View style={styles.subCurrentBadge}><Text style={styles.subCurrentText}>ACTUEL</Text></View>}

                                    <View style={styles.subHeader}>
                                        <View>
                                            <Text style={styles.subName}>{sub.badge} {sub.name}</Text>
                                            <Text style={styles.subCommission}>Commission: {sub.commission}%</Text>
                                        </View>
                                        <View style={styles.subPriceBox}>
                                            {sub.price > 0 ? (
                                                <>
                                                    <Text style={styles.subPrice}>{sub.price.toLocaleString('fr-FR')} F</Text>
                                                    <Text style={styles.subPeriod}>/{sub.period}</Text>
                                                </>
                                            ) : (
                                                <Text style={styles.subPrice}>Gratuit</Text>
                                            )}
                                        </View>
                                    </View>

                                    <View style={styles.subFeatures}>
                                        {sub.features.map((feature, i) => (
                                            <View key={i} style={styles.subFeature}>
                                                <Ionicons name="checkmark-circle" size={16} color={COLORS.secondary} />
                                                <Text style={styles.subFeatureText}>{feature}</Text>
                                            </View>
                                        ))}
                                    </View>

                                    {!isCurrent && sub.price > 0 && (
                                        <TouchableOpacity style={styles.subBtn} onPress={() => handleSubscribe(sub.id)}>
                                            <Text style={styles.subBtnText}>Choisir ce plan</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            );
                        })}
                    </>
                )}

                {activeTab === 'wallet' && (
                    <>
                        {/* Balance card */}
                        <View style={styles.balanceCard}>
                            <LinearGradient colors={[COLORS.secondary, COLORS.secondaryDark]} style={styles.balanceGradient}>
                                <Text style={styles.balanceLabel}>Solde disponible</Text>
                                <Text style={styles.balanceAmount}>{savings.balance.toLocaleString('fr-FR')} F</Text>
                                <View style={styles.balancePending}>
                                    <Text style={styles.balancePendingText}>+ 12 500 F en pourboires</Text>
                                </View>

                                <View style={styles.withdrawOptions}>
                                    <TouchableOpacity style={styles.withdrawBtn}>
                                        <Ionicons name="flash" size={18} color={COLORS.secondary} />
                                        <Text style={styles.withdrawBtnText}>Instantané (2%)</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.withdrawBtn, styles.withdrawBtnPrimary]}>
                                        <Ionicons name="time" size={18} color={COLORS.white} />
                                        <Text style={[styles.withdrawBtnText, { color: COLORS.white }]}>24h (Gratuit)</Text>
                                    </TouchableOpacity>
                                </View>
                            </LinearGradient>
                        </View>

                        {/* Savings goal */}
                        <View style={styles.savingsCard}>
                            <View style={styles.savingsHeader}>
                                <Text style={styles.savingsTitle}>🎯 Objectif épargne</Text>
                                <Text style={styles.savingsAuto}>{savings.autoSavePercentage}% auto-épargne</Text>
                            </View>
                            <View style={styles.savingsProgress}>
                                <View style={[styles.savingsBar, { width: `${(savings.balance / savings.goal) * 100}%` }]} />
                            </View>
                            <Text style={styles.savingsAmount}>
                                {savings.balance.toLocaleString('fr-FR')} / {savings.goal.toLocaleString('fr-FR')} F
                            </Text>
                        </View>

                        {/* Transactions */}
                        <Text style={styles.sectionTitle}>Dernières transactions</Text>
                        {MOCK_TRANSACTIONS.map((tx) => {
                            const { icon, color } = getTransactionIcon(tx.type);
                            return (
                                <View key={tx.id} style={styles.txCard}>
                                    <View style={[styles.txIcon, { backgroundColor: color + '20' }]}>
                                        <Text style={styles.txIconText}>{icon}</Text>
                                    </View>
                                    <View style={styles.txInfo}>
                                        <Text style={styles.txDesc}>{tx.description}</Text>
                                        <Text style={styles.txDate}>{tx.date}</Text>
                                    </View>
                                    <Text style={[styles.txAmount, { color: tx.amount > 0 ? COLORS.secondary : COLORS.primary }]}>
                                        {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString('fr-FR')} F
                                    </Text>
                                </View>
                            );
                        })}
                    </>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.gray50 },

    header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    headerContent: {},
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.white },
    headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4 },

    tabs: { flexDirection: 'row', backgroundColor: COLORS.white, marginHorizontal: 16, marginTop: -16, borderRadius: 16, padding: 4, elevation: 5 },
    tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
    tabActive: { backgroundColor: COLORS.premium },
    tabText: { fontSize: 11, fontWeight: '600', color: COLORS.gray600 },
    tabTextActive: { color: COLORS.white },

    content: { padding: 16 },

    sectionTitle: { fontSize: 15, fontWeight: 'bold', color: COLORS.black, marginBottom: 12, marginTop: 16 },

    // Boost
    boostExplain: { flexDirection: 'row', backgroundColor: '#FFF8E1', padding: 16, borderRadius: 16, marginBottom: 16 },
    boostExplainIcon: { fontSize: 30 },
    boostExplainText: { flex: 1, marginLeft: 12 },
    boostExplainTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.black },
    boostExplainDesc: { fontSize: 12, color: COLORS.gray600, marginTop: 4 },

    boostCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 2, borderColor: 'transparent' },
    boostCardSelected: { borderColor: COLORS.premium },
    popularBadge: { position: 'absolute', top: -8, right: 16, backgroundColor: COLORS.primary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    popularText: { fontSize: 9, fontWeight: 'bold', color: COLORS.white },
    boostContent: { flex: 1 },
    boostDuration: { fontSize: 16, fontWeight: 'bold', color: COLORS.black },
    boostMultiplier: { fontSize: 12, color: COLORS.premium },
    boostPriceBox: { backgroundColor: COLORS.premium + '20', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, marginRight: 12 },
    boostPrice: { fontSize: 16, fontWeight: 'bold', color: COLORS.premium },
    radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: COLORS.gray600, justifyContent: 'center', alignItems: 'center' },
    radioOuterSelected: { borderColor: COLORS.premium },
    radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.premium },

    activateBtn: { marginTop: 20, borderRadius: 16, overflow: 'hidden' },
    activateBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8 },
    activateBtnText: { fontSize: 16, fontWeight: 'bold', color: COLORS.white },

    // Subscription
    subCard: { backgroundColor: COLORS.white, borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 2, borderColor: 'transparent' },
    subCardPopular: { borderColor: COLORS.gold },
    subCardCurrent: { borderColor: COLORS.secondary },
    subPopularBadge: { position: 'absolute', top: -10, right: 20, backgroundColor: COLORS.gold, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 },
    subPopularText: { fontSize: 10, fontWeight: 'bold', color: COLORS.black },
    subCurrentBadge: { position: 'absolute', top: -10, left: 20, backgroundColor: COLORS.secondary, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 },
    subCurrentText: { fontSize: 10, fontWeight: 'bold', color: COLORS.white },
    subHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    subName: { fontSize: 20, fontWeight: 'bold', color: COLORS.black },
    subCommission: { fontSize: 12, color: COLORS.gray600, marginTop: 2 },
    subPriceBox: { alignItems: 'flex-end' },
    subPrice: { fontSize: 22, fontWeight: 'bold', color: COLORS.premium },
    subPeriod: { fontSize: 12, color: COLORS.gray600 },
    subFeatures: { gap: 8 },
    subFeature: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    subFeatureText: { fontSize: 13, color: COLORS.black },
    subBtn: { backgroundColor: COLORS.premium, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 16 },
    subBtnText: { fontSize: 14, fontWeight: 'bold', color: COLORS.white },

    // Wallet
    balanceCard: { borderRadius: 20, overflow: 'hidden', marginBottom: 16 },
    balanceGradient: { padding: 24 },
    balanceLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
    balanceAmount: { fontSize: 36, fontWeight: 'bold', color: COLORS.white, marginTop: 4 },
    balancePending: { backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: 8 },
    balancePendingText: { fontSize: 12, color: COLORS.white },
    withdrawOptions: { flexDirection: 'row', gap: 10, marginTop: 20 },
    withdrawBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white, paddingVertical: 12, borderRadius: 12, gap: 6 },
    withdrawBtnPrimary: { backgroundColor: 'rgba(0,0,0,0.2)' },
    withdrawBtnText: { fontSize: 12, fontWeight: '600', color: COLORS.secondary },

    savingsCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 16 },
    savingsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    savingsTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.black },
    savingsAuto: { fontSize: 11, color: COLORS.secondary },
    savingsProgress: { height: 10, backgroundColor: COLORS.gray100, borderRadius: 5, overflow: 'hidden' },
    savingsBar: { height: '100%', backgroundColor: COLORS.secondary, borderRadius: 5 },
    savingsAmount: { fontSize: 12, color: COLORS.gray600, marginTop: 8, textAlign: 'right' },

    txCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 12, padding: 14, marginBottom: 8 },
    txIcon: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
    txIconText: { fontSize: 18 },
    txInfo: { flex: 1, marginLeft: 12 },
    txDesc: { fontSize: 13, fontWeight: '500', color: COLORS.black },
    txDate: { fontSize: 11, color: COLORS.gray600, marginTop: 2 },
    txAmount: { fontSize: 14, fontWeight: 'bold' },
});
