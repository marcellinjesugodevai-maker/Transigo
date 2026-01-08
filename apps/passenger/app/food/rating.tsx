// =============================================
// TRANSIGO FOOD - NOTATION (PREMIUM)
// Évaluation élégante de la commande
// =============================================

import { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Alert,
    StatusBar,
    Animated,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, RADIUS } from '@/constants';
import { useThemeStore, useLanguageStore } from '@/stores';
import { getTranslation } from '@/i18n/translations';

const QUICK_TAGS = [
    { id: 'fast', label: 'Rapide', labelEn: 'Fast', emoji: '⚡' },
    { id: 'tasty', label: 'Délicieux', labelEn: 'Tasty', emoji: '😋' },
    { id: 'hot', label: 'Chaud', labelEn: 'Hot', emoji: '🔥' },
    { id: 'generous', label: 'Généreux', labelEn: 'Generous', emoji: '🍽️' },
    { id: 'clean', label: 'Propre', labelEn: 'Clean', emoji: '✨' },
    { id: 'friendly', label: 'Sympa', labelEn: 'Friendly', emoji: '😊' },
];

export default function FoodRatingScreen() {
    const params = useLocalSearchParams();
    const { isDark, colors } = useThemeStore();
    const { language } = useLanguageStore();
    const t = (key: any) => getTranslation(key, language);

    const restaurantName = params.restaurant_name as string || 'Restaurant';
    const riderName = params.rider_name as string || 'Livreur';
    const total = Number(params.total) || 0;

    const [restaurantRating, setRestaurantRating] = useState(5);
    const [riderRating, setRiderRating] = useState(5);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [comment, setComment] = useState('');

    const toggleTag = (tagId: string) => {
        if (selectedTags.includes(tagId)) {
            setSelectedTags(selectedTags.filter(t => t !== tagId));
        } else {
            setSelectedTags([...selectedTags, tagId]);
        }
    };

    const handleSubmit = () => {
        Alert.alert(
            '🎉 Merci !',
            language === 'fr'
                ? 'Votre avis compte beaucoup pour nous. À très bientôt sur TransiGo Food !'
                : 'Your feedback means a lot to us. See you soon on TransiGo Food!',
            [{ text: 'OK', onPress: () => router.replace('/(tabs)/home') }]
        );
    };

    const handleSkip = () => {
        router.replace('/(tabs)/home');
    };

    const renderStars = (rating: number, setRating: (r: number) => void, size: number = 32) => (
        <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                    key={star}
                    onPress={() => setRating(star)}
                    style={styles.starButton}
                >
                    <Text style={[
                        styles.star,
                        { fontSize: size },
                        star <= rating ? styles.starActive : styles.starInactive
                    ]}>
                        ★
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    const getMoodEmoji = (rating: number) => {
        if (rating <= 1) return '😞';
        if (rating <= 2) return '😕';
        if (rating <= 3) return '😐';
        if (rating <= 4) return '😊';
        return '🤩';
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="light-content" />

            {/* Header with celebration */}
            <LinearGradient
                colors={['#4CAF50', '#2E7D32']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <View style={styles.confettiContainer}>
                    {['🎉', '✨', '🎊', '⭐', '💫'].map((emoji, i) => (
                        <Text key={i} style={[styles.confetti, { left: `${10 + i * 18}%` }]}>{emoji}</Text>
                    ))}
                </View>
                <Text style={styles.headerEmoji}>🍔</Text>
                <Text style={styles.headerTitle}>
                    {language === 'fr' ? 'Bon appétit !' : 'Enjoy your meal!'}
                </Text>
                <Text style={styles.headerSubtitle}>
                    {language === 'fr' ? 'Comment était votre commande ?' : 'How was your order?'}
                </Text>
            </LinearGradient>

            {/* Content */}
            <View style={styles.content}>
                {/* Receipt summary */}
                <View style={[styles.receiptCard, { backgroundColor: colors.card }]}>
                    <View style={styles.receiptRow}>
                        <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>
                            {language === 'fr' ? 'Total payé' : 'Total paid'}
                        </Text>
                        <Text style={styles.receiptValue}>{total.toLocaleString('fr-FR')} F</Text>
                    </View>
                </View>

                {/* Restaurant rating */}
                <View style={[styles.ratingCard, { backgroundColor: colors.card }]}>
                    <View style={styles.ratingHeader}>
                        <Text style={styles.ratingEmoji}>🍽️</Text>
                        <Text style={[styles.ratingTitle, { color: colors.text }]}>
                            {restaurantName}
                        </Text>
                        <Text style={styles.moodEmoji}>{getMoodEmoji(restaurantRating)}</Text>
                    </View>
                    {renderStars(restaurantRating, setRestaurantRating, 36)}
                </View>

                {/* Rider rating */}
                <View style={[styles.ratingCard, { backgroundColor: colors.card }]}>
                    <View style={styles.ratingHeader}>
                        <Text style={styles.ratingEmoji}>🏍</Text>
                        <Text style={[styles.ratingTitle, { color: colors.text }]}>
                            {riderName}
                        </Text>
                        <Text style={styles.moodEmoji}>{getMoodEmoji(riderRating)}</Text>
                    </View>
                    {renderStars(riderRating, setRiderRating, 36)}
                </View>

                {/* Quick tags */}
                <View style={[styles.tagsCard, { backgroundColor: colors.card }]}>
                    <Text style={[styles.tagsTitle, { color: colors.text }]}>
                        💬 {language === 'fr' ? 'Tags rapides' : 'Quick tags'}
                    </Text>
                    <View style={styles.tagsGrid}>
                        {QUICK_TAGS.map((tag) => (
                            <TouchableOpacity
                                key={tag.id}
                                style={[
                                    styles.tagChip,
                                    { backgroundColor: isDark ? '#252525' : '#F5F5F5' },
                                    selectedTags.includes(tag.id) && styles.tagChipSelected
                                ]}
                                onPress={() => toggleTag(tag.id)}
                            >
                                <Text style={styles.tagEmoji}>{tag.emoji}</Text>
                                <Text style={[
                                    styles.tagLabel,
                                    { color: selectedTags.includes(tag.id) ? COLORS.white : colors.text }
                                ]}>
                                    {language === 'fr' ? tag.label : tag.labelEn}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Comment */}
                <View style={[styles.commentCard, { backgroundColor: colors.card }]}>
                    <Text style={[styles.commentLabel, { color: colors.text }]}>
                        📝 {language === 'fr' ? 'Commentaire' : 'Comment'}
                    </Text>
                    <TextInput
                        style={[styles.commentInput, {
                            color: colors.text,
                            backgroundColor: isDark ? '#252525' : '#F5F5F5'
                        }]}
                        placeholder={language === 'fr' ? 'Partagez votre expérience...' : 'Share your experience...'}
                        placeholderTextColor={colors.textSecondary}
                        value={comment}
                        onChangeText={setComment}
                        multiline
                    />
                </View>

                {/* Buttons */}
                <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleSubmit}
                    activeOpacity={0.95}
                >
                    <LinearGradient
                        colors={['#FF5722', '#E64A19']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.submitGradient}
                    >
                        <Text style={styles.submitText}>
                            {language === 'fr' ? '✓ Envoyer mon avis' : '✓ Submit review'}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                    <Text style={[styles.skipText, { color: colors.textSecondary }]}>
                        {language === 'fr' ? 'Passer pour l\'instant' : 'Skip for now'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

    // Header
    header: {
        alignItems: 'center',
        paddingTop: 60,
        paddingBottom: 40,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    confettiContainer: {
        position: 'absolute',
        top: 20,
        left: 0,
        right: 0,
        height: 40,
    },
    confetti: {
        position: 'absolute',
        fontSize: 20,
    },
    headerEmoji: {
        fontSize: 64,
        marginBottom: SPACING.sm,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    headerSubtitle: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 6,
    },

    // Content
    content: {
        flex: 1,
        padding: SPACING.lg,
        marginTop: -20,
    },

    // Receipt
    receiptCard: {
        borderRadius: 16,
        padding: SPACING.md,
        marginBottom: SPACING.md,
    },
    receiptRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    receiptLabel: {
        fontSize: 14,
    },
    receiptValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#4CAF50',
    },

    // Rating cards
    ratingCard: {
        borderRadius: 16,
        padding: SPACING.md,
        marginBottom: SPACING.md,
    },
    ratingHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    ratingEmoji: {
        fontSize: 24,
        marginRight: SPACING.sm,
    },
    ratingTitle: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
    },
    moodEmoji: {
        fontSize: 28,
    },
    starsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    starButton: {
        padding: 4,
    },
    star: {},
    starActive: {
        color: '#FFD700',
    },
    starInactive: {
        color: '#E0E0E0',
    },

    // Tags
    tagsCard: {
        borderRadius: 16,
        padding: SPACING.md,
        marginBottom: SPACING.md,
    },
    tagsTitle: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: SPACING.sm,
    },
    tagsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tagChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
        gap: 6,
    },
    tagChipSelected: {
        backgroundColor: '#FF5722',
    },
    tagEmoji: {
        fontSize: 16,
    },
    tagLabel: {
        fontSize: 13,
        fontWeight: '500',
    },

    // Comment
    commentCard: {
        borderRadius: 16,
        padding: SPACING.md,
        marginBottom: SPACING.lg,
    },
    commentLabel: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: SPACING.sm,
    },
    commentInput: {
        padding: SPACING.md,
        borderRadius: 12,
        minHeight: 80,
        textAlignVertical: 'top',
        fontSize: 14,
    },

    // Buttons
    submitButton: {},
    submitGradient: {
        paddingVertical: 18,
        borderRadius: 30,
        alignItems: 'center',
        shadowColor: '#FF5722',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 6,
    },
    submitText: {
        fontSize: 17,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    skipButton: {
        alignItems: 'center',
        paddingVertical: SPACING.md,
    },
    skipText: {
        fontSize: 14,
    },
});
