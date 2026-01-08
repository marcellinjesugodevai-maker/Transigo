// =============================================
// TRANSIGO - PRICE NEGOTIATION SCREEN
// =============================================

import { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@/components/Icon';
import { COLORS, SPACING } from '@/constants';

export default function PriceNegotiationScreen() {
    const params = useLocalSearchParams();
    const suggestedPrice = 2500;

    const [proposedPrice, setProposedPrice] = useState('');
    const [counterOffer, setCounterOffer] = useState<number | null>(null);
    const [negotiationStatus, setNegotiationStatus] = useState<'initial' | 'waiting' | 'countered' | 'accepted'>('initial');

    const handlePropose = () => {
        const price = parseInt(proposedPrice);
        if (isNaN(price) || price <= 0) {
            Alert.alert('Prix invalide', 'Veuillez saisir un prix valide');
            return;
        }

        if (price > suggestedPrice) {
            Alert.alert('Prix trop élevé', `Le prix suggéré est de ${suggestedPrice} FCFA`);
            return;
        }

        // Simuler envoi proposition
        setNegotiationStatus('waiting');

        // Simuler contre-proposition chauffeur après 2s
        setTimeout(() => {
            const counter = Math.round((price + suggestedPrice) / 2);
            setCounterOffer(counter);
            setNegotiationStatus('countered');
        }, 2000);
    };

    const handleAcceptCounter = () => {
        setNegotiationStatus('accepted');
        setTimeout(() => {
            Alert.alert(
                'Prix accepté !',
                `Course confirmée pour ${counterOffer} FCFA`,
                [{ text: 'OK', onPress: () => router.push('/ride/123') }]
            );
        }, 500);
    };

    const handleReject = () => {
        Alert.alert(
            'Contre-proposition rejetée',
            'Voulez-vous proposer un autre prix ?',
            [
                { text: 'Annuler', style: 'cancel', onPress: () => router.back() },
                {
                    text: 'Nouvelle offre', onPress: () => {
                        setNegotiationStatus('initial');
                        setCounterOffer(null);
                        setProposedPrice('');
                    }
                },
            ]
        );
    };

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
                <Text style={styles.headerTitle}>Négocier le prix</Text>
                <View style={{ width: 40 }} />
            </LinearGradient>

            <View style={styles.content}>
                {/* Prix suggéré */}
                <View style={styles.priceCard}>
                    <Text style={styles.label}>Prix suggéré</Text>
                    <Text style={styles.suggestedPrice}>
                        {suggestedPrice.toLocaleString('fr-FR')} FCFA
                    </Text>
                    <Text style={styles.priceSubtext}>
                        Basé sur la distance et la demande
                    </Text>
                </View>

                {/* État initial - Proposition */}
                {negotiationStatus === 'initial' && (
                    <>
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Proposez votre prix</Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ex: 2000"
                                    placeholderTextColor={COLORS.textSecondary}
                                    keyboardType="numeric"
                                    value={proposedPrice}
                                    onChangeText={setProposedPrice}
                                />
                                <Text style={styles.currency}>FCFA</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.proposeButton}
                            onPress={handlePropose}
                            disabled={!proposedPrice}
                            activeOpacity={0.9}
                        >
                            <LinearGradient
                                colors={proposedPrice ? [COLORS.primary, COLORS.primaryDark] : ['#CCCCCC', '#999999']}
                                style={styles.proposeButtonGradient}
                            >
                                <Text style={styles.proposeButtonText}>Proposer ce prix</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </>
                )}

                {/* État waiting */}
                {negotiationStatus === 'waiting' && (
                    <View style={styles.statusCard}>
                        <Text style={styles.statusIcon}>⏳</Text>
                        <Text style={styles.statusTitle}>Négociation en cours...</Text>
                        <Text style={styles.statusText}>
                            Nous cherchons un chauffeur acceptant votre prix
                        </Text>
                    </View>
                )}

                {/* État countered - Contre-proposition */}
                {negotiationStatus === 'countered' && counterOffer && (
                    <>
                        <View style={styles.counterOfferCard}>
                            <Text style={styles.counterLabel}>Contre-proposition du chauffeur</Text>
                            <Text style={styles.counterPrice}>
                                {counterOffer.toLocaleString('fr-FR')} FCFA
                            </Text>
                            <View style={styles.comparisonRow}>
                                <View style={styles.comparisonItem}>
                                    <Text style={styles.comparisonLabel}>Votre offre</Text>
                                    <Text style={styles.comparisonValue}>{proposedPrice} F</Text>
                                </View>
                                <Text style={styles.arrow}>→</Text>
                                <View style={styles.comparisonItem}>
                                    <Text style={styles.comparisonLabel}>Contre-offre</Text>
                                    <Text style={[styles.comparisonValue, { color: COLORS.primary }]}>
                                        {counterOffer} F
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.actionsContainer}>
                            <TouchableOpacity
                                style={styles.rejectButton}
                                onPress={handleReject}
                                activeOpacity={0.9}
                            >
                                <Text style={styles.rejectButtonText}>Refuser</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.acceptButton}
                                onPress={handleAcceptCounter}
                                activeOpacity={0.9}
                            >
                                <LinearGradient
                                    colors={['#4CAF50', '#2E7D32']}
                                    style={styles.acceptButtonGradient}
                                >
                                    <Text style={styles.acceptButtonText}>Accepter</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </>
                )}

                {/* État accepted */}
                {negotiationStatus === 'accepted' && (
                    <View style={styles.statusCard}>
                        <Text style={styles.statusIcon}>✅</Text>
                        <Text style={styles.statusTitle}>Prix accepté !</Text>
                        <Text style={styles.statusText}>
                            Recherche d'un chauffeur en cours...
                        </Text>
                    </View>
                )}

                {/* Info */}
                <View style={styles.infoCard}>
                    <Text style={styles.infoIcon}>💡</Text>
                    <Text style={styles.infoText}>
                        Les chauffeurs peuvent accepter, refuser ou contre-proposer votre prix.
                        Soyez raisonnable pour augmenter vos chances d'acceptation !
                    </Text>
                </View>
            </View>
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
    content: {
        flex: 1,
        padding: SPACING.lg,
    },

    // Prix suggéré
    priceCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: SPACING.lg,
        alignItems: 'center',
        marginBottom: SPACING.xl,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    label: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 8,
    },
    suggestedPrice: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 4,
    },
    priceSubtext: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },

    // Input
    inputContainer: {
        marginBottom: SPACING.xl,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: SPACING.sm,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.primary,
        paddingHorizontal: SPACING.md,
    },
    input: {
        flex: 1,
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
        paddingVertical: SPACING.md,
    },
    currency: {
        fontSize: 16,
        color: COLORS.textSecondary,
        marginLeft: SPACING.sm,
    },

    // Propose Button
    proposeButton: {
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: SPACING.lg,
    },
    proposeButtonGradient: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    proposeButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.white,
    },

    // Status Card
    statusCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: SPACING.xl,
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    statusIcon: {
        fontSize: 60,
        marginBottom: SPACING.md,
    },
    statusTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: SPACING.sm,
    },
    statusText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },

    // Counter Offer
    counterOfferCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: SPACING.lg,
        marginBottom: SPACING.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    counterLabel: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: 8,
    },
    counterPrice: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.primary,
        textAlign: 'center',
        marginBottom: SPACING.lg,
    },
    comparisonRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingTop: SPACING.md,
        borderTopWidth: 1,
        borderTopColor: COLORS.background,
    },
    comparisonItem: {
        alignItems: 'center',
    },
    comparisonLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginBottom: 4,
    },
    comparisonValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    arrow: {
        fontSize: 20,
        color: COLORS.textSecondary,
    },

    // Actions
    actionsContainer: {
        flexDirection: 'row',
        gap: SPACING.md,
        marginBottom: SPACING.lg,
    },
    rejectButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#F44336',
        alignItems: 'center',
    },
    rejectButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#F44336',
    },
    acceptButton: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
    },
    acceptButtonGradient: {
        paddingVertical: 14,
        alignItems: 'center',
    },
    acceptButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.white,
    },

    // Info
    infoCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#E3F2FD',
        borderRadius: 12,
        padding: SPACING.md,
        marginTop: 'auto',
    },
    infoIcon: {
        fontSize: 20,
        marginRight: SPACING.sm,
    },
    infoText: {
        flex: 1,
        fontSize: 12,
        color: '#1976D2',
        lineHeight: 18,
    },
});
