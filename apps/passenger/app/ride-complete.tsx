// =============================================
// TRANSIGO - RIDE COMPLETE SCREEN
// Fin de course avec évaluation
// =============================================

import { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Dimensions,
    ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@/components/Icon';
import { COLORS, SPACING, RADIUS } from '@/constants';
import { useRideStore, useThemeStore, useLanguageStore } from '@/stores';
import { getTranslation } from '@/i18n/translations';

const { width } = Dimensions.get('window');

export default function RideCompleteScreen() {
    const params = useLocalSearchParams();
    const { isDark, colors } = useThemeStore();
    const { language } = useLanguageStore();
    const t = (key: any) => getTranslation(key, language);

    const { assignedDriver, estimatedPrice, resetAll } = useRideStore();

    const [rating, setRating] = useState(0);
    const [tip, setTip] = useState(0);
    const [comment, setComment] = useState('');

    const price = Number(params.price) || estimatedPrice || 2500;

    const driver = assignedDriver || {
        firstName: 'Kouassi',
        lastName: 'Jean-Marc',
    };

    const tipOptions = [0, 200, 500, 1000];

    const handleComplete = () => {
        // Reset le store et retourner à l'accueil
        resetAll();
        router.replace('/(tabs)/home');
    };

    const renderStars = () => {
        return [1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                style={styles.starButton}
            >
                <Text style={[styles.starEmoji, rating >= star && styles.starActive]}>
                    {rating >= star ? '⭐' : '☆'}
                </Text>
            </TouchableOpacity>
        ));
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.successCircle}>
                        <Text style={styles.successEmoji}>✅</Text>
                    </View>
                    <Text style={[styles.successTitle, { color: colors.text }]}>
                        {language === 'fr' ? 'Course terminée !' : 'Ride completed!'}
                    </Text>
                    <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
                        {language === 'fr'
                            ? 'Merci d\'avoir voyagé avec TransiGo'
                            : 'Thank you for riding with TransiGo'}
                    </Text>
                </View>

                {/* Prix */}
                <View style={[styles.priceCard, { backgroundColor: colors.card }]}>
                    <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>
                        {language === 'fr' ? 'Montant total' : 'Total amount'}
                    </Text>
                    <Text style={styles.priceValue}>
                        {(price + tip).toLocaleString('fr-FR')} FCFA
                    </Text>
                    {tip > 0 && (
                        <Text style={[styles.tipIncluded, { color: '#4CAF50' }]}>
                            {language === 'fr' ? `Pourboire de ${tip} F inclus` : `${tip} F tip included`}
                        </Text>
                    )}
                </View>

                {/* Évaluation */}
                <View style={[styles.ratingCard, { backgroundColor: colors.card }]}>
                    <View style={styles.driverHeader}>
                        <View style={styles.driverAvatar}>
                            <Text style={styles.avatarEmoji}>👨🏾</Text>
                        </View>
                        <View style={styles.driverInfo}>
                            <Text style={[styles.driverName, { color: colors.text }]}>
                                {driver.firstName} {driver.lastName}
                            </Text>
                            <Text style={[styles.ratingPrompt, { color: colors.textSecondary }]}>
                                {language === 'fr' ? 'Comment était votre trajet ?' : 'How was your ride?'}
                            </Text>
                        </View>
                    </View>

                    {/* Étoiles */}
                    <View style={styles.starsContainer}>
                        {renderStars()}
                    </View>

                    {/* Commentaire */}
                    <TextInput
                        style={[
                            styles.commentInput,
                            {
                                backgroundColor: isDark ? '#252525' : colors.background,
                                color: colors.text,
                                borderColor: isDark ? '#333' : '#E0E0E0'
                            }
                        ]}
                        placeholder={language === 'fr' ? 'Ajouter un commentaire (optionnel)' : 'Add a comment (optional)'}
                        placeholderTextColor={colors.textSecondary}
                        value={comment}
                        onChangeText={setComment}
                        multiline
                        numberOfLines={3}
                    />
                </View>

                {/* Pourboire */}
                <View style={[styles.tipCard, { backgroundColor: colors.card }]}>
                    <Text style={[styles.tipTitle, { color: colors.text }]}>
                        {language === 'fr' ? '💝 Ajouter un pourboire' : '💝 Add a tip'}
                    </Text>
                    <View style={styles.tipOptions}>
                        {tipOptions.map((amount) => (
                            <TouchableOpacity
                                key={amount}
                                style={[
                                    styles.tipButton,
                                    {
                                        backgroundColor: isDark ? '#252525' : colors.background,
                                        borderColor: tip === amount ? COLORS.primary : 'transparent',
                                    },
                                    tip === amount && styles.tipButtonActive
                                ]}
                                onPress={() => setTip(amount)}
                            >
                                <Text style={[
                                    styles.tipButtonText,
                                    { color: tip === amount ? COLORS.primary : colors.text }
                                ]}>
                                    {amount === 0
                                        ? (language === 'fr' ? 'Non' : 'No')
                                        : `${amount} F`}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Boutons d'action */}
                <View style={styles.bottomContainer}>
                    {/* Bouton Envoyer l'avis */}
                    <TouchableOpacity
                        style={[styles.submitRatingButton, { opacity: rating > 0 ? 1 : 0.5 }]}
                        onPress={() => {
                            if (rating > 0) {
                                // TODO: Envoyer l'avis au backend
                                console.log('Rating:', rating, 'Comment:', comment, 'Tip:', tip);
                                alert(language === 'fr' ? 'Merci pour votre avis !' : 'Thank you for your feedback!');
                            }
                        }}
                        disabled={rating === 0}
                        activeOpacity={0.9}
                    >
                        <LinearGradient
                            colors={['#4CAF50', '#388E3C']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.submitRatingGradient}
                        >
                            <Icon name="star" size={20} color={COLORS.white} />
                            <Text style={styles.submitRatingText}>
                                {language === 'fr' ? 'Envoyer mon avis' : 'Submit my rating'}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Bouton Retour à l'accueil */}
                    <TouchableOpacity
                        style={styles.homeButton}
                        onPress={handleComplete}
                        activeOpacity={0.9}
                    >
                        <LinearGradient
                            colors={[COLORS.primary, COLORS.primaryDark]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.homeButtonGradient}
                        >
                            <Icon name="home" size={20} color={COLORS.white} />
                            <Text style={styles.homeButtonText}>
                                {language === 'fr' ? 'Retour à l\'accueil' : 'Back to home'}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 60,
        paddingHorizontal: SPACING.lg,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 20,
    },

    // Header
    header: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    successCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#E8F5E9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    successEmoji: {
        fontSize: 40,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    successSubtitle: {
        fontSize: 14,
        textAlign: 'center',
    },

    // Prix
    priceCard: {
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        alignItems: 'center',
        marginBottom: SPACING.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    priceLabel: {
        fontSize: 14,
        marginBottom: 4,
    },
    priceValue: {
        fontSize: 36,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    tipIncluded: {
        fontSize: 12,
        marginTop: 4,
    },

    // Rating
    ratingCard: {
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        marginBottom: SPACING.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    driverHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    driverAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    avatarEmoji: {
        fontSize: 32,
    },
    driverInfo: {
        flex: 1,
    },
    driverName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    ratingPrompt: {
        fontSize: 14,
    },
    starsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: SPACING.md,
    },
    starButton: {
        padding: 8,
    },
    starEmoji: {
        fontSize: 36,
        opacity: 0.3,
    },
    starActive: {
        opacity: 1,
    },
    commentInput: {
        borderRadius: RADIUS.md,
        padding: SPACING.md,
        fontSize: 14,
        minHeight: 80,
        textAlignVertical: 'top',
        borderWidth: 1,
    },

    // Tip
    tipCard: {
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        marginBottom: SPACING.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    tipTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: SPACING.md,
        textAlign: 'center',
    },
    tipOptions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    tipButton: {
        flex: 1,
        paddingVertical: 12,
        marginHorizontal: 4,
        borderRadius: RADIUS.md,
        alignItems: 'center',
        borderWidth: 2,
    },
    tipButtonActive: {
        borderColor: COLORS.primary,
    },
    tipButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },

    // Bottom
    bottomContainer: {
        paddingBottom: 40,
        gap: 12,
    },
    submitRatingButton: {
        marginBottom: 0,
    },
    submitRatingGradient: {
        flexDirection: 'row',
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 5,
    },
    submitRatingText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    homeButton: {
        marginTop: 0,
    },
    homeButtonGradient: {
        flexDirection: 'row',
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 5,
    },
    homeButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.white,
    },
});
