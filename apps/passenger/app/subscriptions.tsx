// =============================================
// TRANSIGO - SUBSCRIPTIONS SCREEN (Abonnements)
// Connecté à Supabase
// =============================================

import { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@/components/Icon';
import { COLORS, SPACING } from '@/constants';
import {
    subscriptionsService,
    SUBSCRIPTION_PLANS,
    SubscriptionDB
} from '@/services/subscriptionsService';

export default function SubscriptionsScreen() {
    const [currentSubscription, setCurrentSubscription] = useState<SubscriptionDB | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubscribing, setIsSubscribing] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadSubscription();
    }, []);

    const loadSubscription = async () => {
        setIsLoading(true);
        const { subscription } = await subscriptionsService.getMySubscription();
        setCurrentSubscription(subscription || null);
        setIsLoading(false);
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadSubscription().then(() => setRefreshing(false));
    }, []);

    const handleSubscribe = async (planId: string) => {
        const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
        if (!plan) return;

        Alert.alert(
            `${plan.emoji} Souscrire à ${plan.name} ?`,
            `${plan.price.toLocaleString('fr-FR')} F/mois\n\n${plan.features.join('\n')}`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Souscrire',
                    onPress: async () => {
                        setIsSubscribing(true);
                        const { subscription, error } = await subscriptionsService.subscribe(planId);
                        setIsSubscribing(false);

                        if (error) {
                            Alert.alert('Erreur', error.message || 'Impossible de souscrire');
                            return;
                        }

                        if (subscription) {
                            setCurrentSubscription(subscription);
                            Alert.alert(
                                '🎉 Félicitations !',
                                `Vous êtes maintenant abonné au plan ${plan.name}.\n\n${plan.rides} courses disponibles ce mois.`
                            );
                        }
                    },
                },
            ]
        );
    };

    const handleCancel = async () => {
        if (!currentSubscription) return;

        Alert.alert(
            'Annuler l\'abonnement ?',
            'Vous perdrez vos avantages immédiatement.',
            [
                { text: 'Non', style: 'cancel' },
                {
                    text: 'Oui, annuler',
                    style: 'destructive',
                    onPress: async () => {
                        const { success } = await subscriptionsService.cancelSubscription(currentSubscription.id);
                        if (success) {
                            setCurrentSubscription(null);
                            Alert.alert('Abonnement annulé', 'Vous pouvez vous réabonner à tout moment.');
                        }
                    },
                },
            ]
        );
    };

    const handlePause = async () => {
        if (!currentSubscription) return;

        const { success } = await subscriptionsService.togglePause(currentSubscription.id, currentSubscription.status);
        if (success) {
            loadSubscription();
        }
    };

    const ridesRemaining = currentSubscription
        ? currentSubscription.rides_per_month - currentSubscription.rides_used
        : 0;

    return (
        <View style={styles.container}>
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
                <Text style={styles.headerTitle}>💎 Abonnements</Text>
                <View style={{ width: 40 }} />
            </LinearGradient>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[COLORS.primary]}
                    />
                }
            >
                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                        <Text style={styles.loadingText}>Chargement...</Text>
                    </View>
                ) : currentSubscription ? (
                    /* Abonnement actif */
                    <View>
                        <View style={styles.currentPlanCard}>
                            <LinearGradient
                                colors={[COLORS.primary, COLORS.primaryDark]}
                                style={styles.currentPlanGradient}
                            >
                                <View style={styles.currentPlanHeader}>
                                    <Text style={styles.currentPlanEmoji}>
                                        {SUBSCRIPTION_PLANS.find(p => p.id === currentSubscription.plan_name)?.emoji || '⭐'}
                                    </Text>
                                    <View>
                                        <Text style={styles.currentPlanName}>
                                            Plan {currentSubscription.plan_name.charAt(0).toUpperCase() + currentSubscription.plan_name.slice(1)}
                                        </Text>
                                        <Text style={styles.currentPlanStatus}>
                                            {currentSubscription.status === 'active' ? '✅ Actif' : '⏸️ En pause'}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.ridesCounter}>
                                    <Text style={styles.ridesNumber}>{ridesRemaining}</Text>
                                    <Text style={styles.ridesLabel}>courses restantes</Text>
                                </View>

                                <View style={styles.progressBar}>
                                    <View
                                        style={[
                                            styles.progressFill,
                                            { width: `${(currentSubscription.rides_used / currentSubscription.rides_per_month) * 100}%` }
                                        ]}
                                    />
                                </View>
                                <Text style={styles.progressText}>
                                    {currentSubscription.rides_used}/{currentSubscription.rides_per_month} utilisées
                                </Text>

                                <View style={styles.planDetails}>
                                    <View style={styles.planDetailItem}>
                                        <Text style={styles.planDetailLabel}>Prix mensuel</Text>
                                        <Text style={styles.planDetailValue}>
                                            {currentSubscription.price_per_month.toLocaleString('fr-FR')} F
                                        </Text>
                                    </View>
                                    <View style={styles.planDetailItem}>
                                        <Text style={styles.planDetailLabel}>Réduction</Text>
                                        <Text style={styles.planDetailValue}>
                                            -{currentSubscription.discount_percentage}%
                                        </Text>
                                    </View>
                                </View>
                            </LinearGradient>
                        </View>

                        <View style={styles.actionButtons}>
                            <TouchableOpacity
                                style={styles.pauseButton}
                                onPress={handlePause}
                            >
                                <Text style={styles.pauseButtonText}>
                                    {currentSubscription.status === 'active' ? '⏸️ Mettre en pause' : '▶️ Reprendre'}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={handleCancel}
                            >
                                <Text style={styles.cancelButtonText}>Annuler</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    /* Pas d'abonnement - Afficher les plans */
                    <View>
                        <View style={styles.infoCard}>
                            <Text style={styles.infoIcon}>💡</Text>
                            <Text style={styles.infoText}>
                                Économisez jusqu'à 30% avec nos abonnements mensuels !
                            </Text>
                        </View>

                        {SUBSCRIPTION_PLANS.map((plan) => (
                            <TouchableOpacity
                                key={plan.id}
                                style={[styles.planCard, plan.popular && styles.planCardPopular]}
                                onPress={() => handleSubscribe(plan.id)}
                                disabled={isSubscribing}
                                activeOpacity={0.9}
                            >
                                {plan.popular && (
                                    <View style={styles.popularBadge}>
                                        <Text style={styles.popularText}>⭐ POPULAIRE</Text>
                                    </View>
                                )}

                                <View style={styles.planHeader}>
                                    <Text style={styles.planEmoji}>{plan.emoji}</Text>
                                    <View style={styles.planInfo}>
                                        <Text style={styles.planName}>{plan.name}</Text>
                                        <Text style={styles.planRides}>{plan.rides === 999 ? 'Illimité' : `${plan.rides} courses/mois`}</Text>
                                    </View>
                                    <View style={styles.planPriceContainer}>
                                        <Text style={styles.planPrice}>{plan.price.toLocaleString('fr-FR')} F</Text>
                                        <Text style={styles.planPeriod}>/mois</Text>
                                    </View>
                                </View>

                                <View style={styles.planFeatures}>
                                    {plan.features.map((feature, i) => (
                                        <Text key={i} style={styles.featureText}>✓ {feature}</Text>
                                    ))}
                                </View>

                                <View style={styles.discountBadge}>
                                    <Text style={styles.discountText}>-{plan.discount}% sur chaque course</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
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
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.white },
    scrollContent: { padding: SPACING.lg },
    loadingContainer: { alignItems: 'center', paddingVertical: 60 },
    loadingText: { marginTop: 12, color: COLORS.textSecondary },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primaryBg,
        borderRadius: 12,
        padding: SPACING.md,
        marginBottom: SPACING.lg,
    },
    infoIcon: { fontSize: 24, marginRight: SPACING.sm },
    infoText: { flex: 1, fontSize: 13, color: COLORS.primary, lineHeight: 18 },
    currentPlanCard: { borderRadius: 20, overflow: 'hidden', marginBottom: SPACING.lg },
    currentPlanGradient: { padding: SPACING.xl },
    currentPlanHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.lg },
    currentPlanEmoji: { fontSize: 48, marginRight: SPACING.md },
    currentPlanName: { fontSize: 24, fontWeight: 'bold', color: COLORS.white },
    currentPlanStatus: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
    ridesCounter: { alignItems: 'center', marginBottom: SPACING.md },
    ridesNumber: { fontSize: 64, fontWeight: 'bold', color: COLORS.white },
    ridesLabel: { fontSize: 16, color: 'rgba(255,255,255,0.8)' },
    progressBar: {
        height: 8,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: SPACING.sm,
    },
    progressFill: { height: '100%', backgroundColor: COLORS.white, borderRadius: 4 },
    progressText: { fontSize: 12, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
    planDetails: { flexDirection: 'row', justifyContent: 'space-around', marginTop: SPACING.lg, paddingTop: SPACING.lg, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' },
    planDetailItem: { alignItems: 'center' },
    planDetailLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
    planDetailValue: { fontSize: 18, fontWeight: 'bold', color: COLORS.white, marginTop: 4 },
    actionButtons: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.xl },
    pauseButton: { flex: 1, backgroundColor: COLORS.white, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
    pauseButtonText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 14 },
    cancelButton: { flex: 1, backgroundColor: '#F4433620', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
    cancelButtonText: { color: '#F44336', fontWeight: 'bold', fontSize: 14 },
    planCard: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: SPACING.lg,
        marginBottom: SPACING.md,
        borderWidth: 2,
        borderColor: COLORS.white,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    planCardPopular: { borderColor: COLORS.primary },
    popularBadge: {
        position: 'absolute',
        top: -1,
        right: -1,
        backgroundColor: COLORS.primary,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderTopRightRadius: 18,
        borderBottomLeftRadius: 12,
    },
    popularText: { color: COLORS.white, fontSize: 10, fontWeight: 'bold' },
    planHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
    planEmoji: { fontSize: 40, marginRight: SPACING.md },
    planInfo: { flex: 1 },
    planName: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
    planRides: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
    planPriceContainer: { alignItems: 'flex-end' },
    planPrice: { fontSize: 22, fontWeight: 'bold', color: COLORS.primary },
    planPeriod: { fontSize: 12, color: COLORS.textSecondary },
    planFeatures: { marginBottom: SPACING.md },
    featureText: { fontSize: 13, color: COLORS.text, marginBottom: 4 },
    discountBadge: { backgroundColor: '#4CAF5020', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
    discountText: { color: '#4CAF50', fontSize: 13, fontWeight: '600' },
});
