// =============================================
// TRANSIGO - SUBSCRIPTIONS SCREEN (ABONNEMENTS)
// =============================================

import { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@/components/Icon';
import { COLORS, SPACING } from '@/constants';

const PLANS = [
    {
        id: 'basic',
        name: 'Basique',
        rides: 10,
        price: 20000,
        discount: '10%',
        color: '#2196F3',
        features: ['10 courses/mois', '-10% sur chaque course', 'Support prioritaire'],
    },
    {
        id: 'premium',
        name: 'Premium',
        rides: 20,
        price: 35000,
        discount: '20%',
        color: COLORS.primary,
        popular: true,
        features: ['20 courses/mois', '-20% sur chaque course', 'Support VIP', 'Annulation gratuite'],
    },
    {
        id: 'unlimited',
        name: 'Illimité',
        rides: 50,
        price: 75000,
        discount: '30%',
        color: '#7B1FA2',
        features: ['50 courses/mois', '-30% sur chaque course', 'Support VIP 24/7', 'Priorité chauffeur', 'Annulation gratuite'],
    },
];

export default function SubscriptionsScreen() {
    const [selectedPlan, setSelectedPlan] = useState(PLANS[1]);

    const handleSubscribe = () => {
        Alert.alert(
            'Confirmation',
            `Souscrire à l'abonnement ${selectedPlan.name} pour ${selectedPlan.price.toLocaleString('fr-FR')} FCFA/mois ?`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Confirmer',
                    onPress: () => {
                        Alert.alert('Succès', 'Abonnement activé avec succès !');
                        router.back();
                    },
                },
            ]
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
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
                <Text style={styles.headerTitle}>Abonnements</Text>
                <View style={{ width: 40 }} />
            </LinearGradient>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.title}>Choisissez votre formule</Text>
                <Text style={styles.subtitle}>
                    Économisez jusqu'à 30% sur vos courses
                </Text>

                {/* Plans */}
                <View style={styles.plansContainer}>
                    {PLANS.map((plan) => {
                        const isSelected = selectedPlan.id === plan.id;
                        return (
                            <TouchableOpacity
                                key={plan.id}
                                style={[
                                    styles.planCard,
                                    isSelected && styles.planCardSelected,
                                ]}
                                onPress={() => setSelectedPlan(plan)}
                                activeOpacity={0.9}
                            >
                                {plan.popular && (
                                    <View style={styles.popularBadge}>
                                        <Text style={styles.popularText}>POPULAIRE</Text>
                                    </View>
                                )}

                                <LinearGradient
                                    colors={[plan.color, plan.color + 'DD']}
                                    style={styles.planHeader}
                                >
                                    <Text style={styles.planName}>{plan.name}</Text>
                                    <Text style={styles.planDiscount}>{plan.discount}</Text>
                                </LinearGradient>

                                <View style={styles.planBody}>
                                    <View style={styles.priceContainer}>
                                        <Text style={styles.price}>
                                            {plan.price.toLocaleString('fr-FR')}
                                        </Text>
                                        <Text style={styles.currency}>FCFA/mois</Text>
                                    </View>

                                    <View style={styles.featuresContainer}>
                                        {plan.features.map((feature, index) => (
                                            <View key={index} style={styles.featureRow}>
                                                <Text style={styles.checkIcon}>✓</Text>
                                                <Text style={styles.featureText}>{feature}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>

                                {isSelected && (
                                    <View style={styles.selectedIndicator}>
                                        <Text style={styles.selectedIcon}>✓</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Avantages */}
                <View style={styles.benefitsCard}>
                    <Text style={styles.benefitsTitle}>Pourquoi s'abonner ?</Text>
                    <View style={styles.benefitsList}>
                        <View style={styles.benefitItem}>
                            <Text style={styles.benefitIcon}>💰</Text>
                            <Text style={styles.benefitText}>Économies garanties</Text>
                        </View>
                        <View style={styles.benefitItem}>
                            <Text style={styles.benefitIcon}>⚡</Text>
                            <Text style={styles.benefitText}>Priorité sur les chauffeurs</Text>
                        </View>
                        <View style={styles.benefitItem}>
                            <Text style={styles.benefitIcon}>🎁</Text>
                            <Text style={styles.benefitText}>Bonus et avantages exclusifs</Text>
                        </View>
                    </View>
                </View>

                {/* Bouton souscrire */}
                <TouchableOpacity
                    style={styles.subscribeButton}
                    onPress={handleSubscribe}
                    activeOpacity={0.9}
                >
                    <LinearGradient
                        colors={[selectedPlan.color, selectedPlan.color + 'DD']}
                        style={styles.subscribeButtonGradient}
                    >
                        <Text style={styles.subscribeButtonText}>
                            Souscrire à {selectedPlan.name}
                        </Text>
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

    // Header
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

    // Content
    scrollContent: {
        padding: SPACING.lg,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: SPACING.sm,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: SPACING.xl,
    },

    // Plans
    plansContainer: {
        gap: SPACING.md,
        marginBottom: SPACING.xl,
    },
    planCard: {
        borderRadius: 20,
        backgroundColor: COLORS.white,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
        position: 'relative',
    },
    planCardSelected: {
        borderWidth: 3,
        borderColor: COLORS.primary,
    },
    popularBadge: {
        position: 'absolute',
        top: 16,
        right: 16,
        backgroundColor: '#4CAF50',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        zIndex: 2,
    },
    popularText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    planHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.lg,
    },
    planName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    planDiscount: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    planBody: {
        padding: SPACING.lg,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: SPACING.lg,
    },
    price: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    currency: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginLeft: 4,
    },
    featuresContainer: {
        gap: SPACING.sm,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkIcon: {
        fontSize: 16,
        color: '#4CAF50',
        marginRight: SPACING.sm,
        fontWeight: 'bold',
    },
    featureText: {
        fontSize: 14,
        color: COLORS.text,
    },
    selectedIndicator: {
        position: 'absolute',
        bottom: 16,
        right: 16,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedIcon: {
        fontSize: 18,
        color: COLORS.white,
        fontWeight: 'bold',
    },

    // Benefits
    benefitsCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: SPACING.lg,
        marginBottom: SPACING.xl,
    },
    benefitsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: SPACING.md,
    },
    benefitsList: {
        gap: SPACING.md,
    },
    benefitItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    benefitIcon: {
        fontSize: 24,
        marginRight: SPACING.md,
    },
    benefitText: {
        fontSize: 14,
        color: COLORS.text,
    },

    // Subscribe button
    subscribeButton: {
        marginBottom: 20,
    },
    subscribeButtonGradient: {
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    subscribeButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.white,
    },
});
