// =============================================
// TRANSIGO PASSENGER - ONBOARDING SCREEN
// Minimalist text-only version with progress bar
// =============================================

import { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    FlatList,
    TouchableOpacity,
    Animated,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, RADIUS } from '@/constants';

const { width } = Dimensions.get('window');

// =============================================
// ONBOARDING DATA - Text only with native emojis
// =============================================

interface OnboardingSlide {
    id: string;
    emoji: string;
    title: string;
    description: string;
}

const SLIDES: OnboardingSlide[] = [
    {
        id: '1',
        emoji: '🚗',
        title: 'Réservez en un clic',
        description: 'Commandez votre VTC en quelques secondes. Simple, rapide et efficace.',
    },
    {
        id: '2',
        emoji: '👥',
        title: 'Voyagez en groupe',
        description: 'Partagez les frais avec vos amis ou collègues. Économique et convivial.',
    },
    {
        id: '3',
        emoji: '📍➡️📍',
        title: 'Multi-destinations',
        description: 'Ajoutez plusieurs arrêts sur votre trajet. Pratique pour vos courses.',
    },
];

// =============================================
// MAIN COMPONENT
// =============================================

export default function OnboardingScreen() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const scrollX = useRef(new Animated.Value(0)).current;

    const handleNext = () => {
        if (currentIndex < SLIDES.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
            setCurrentIndex(currentIndex + 1);
        } else {
            router.replace('/(auth)/login');
        }
    };

    const handleSkip = () => {
        router.replace('/(auth)/login');
    };

    const renderItem = ({ item }: { item: OnboardingSlide }) => (
        <View style={styles.slide}>
            {/* Emoji */}
            <Text style={styles.emoji}>{item.emoji}</Text>

            {/* Title */}
            <Text style={styles.title}>{item.title}</Text>

            {/* Description */}
            <Text style={styles.description}>{item.description}</Text>
        </View>
    );

    // Progress bar component
    const ProgressBar = () => {
        const progress = ((currentIndex + 1) / SLIDES.length) * 100;

        return (
            <View style={styles.progressContainer}>
                <View style={styles.progressBackground}>
                    <Animated.View
                        style={[
                            styles.progressFill,
                            { width: `${progress}%` }
                        ]}
                    />
                </View>
                <Text style={styles.progressText}>
                    {currentIndex + 1} / {SLIDES.length}
                </Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Skip Button */}
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                <Text style={styles.skipText}>Passer</Text>
            </TouchableOpacity>

            {/* Progress Bar */}
            <View style={styles.progressWrapper}>
                <ProgressBar />
            </View>

            {/* Slides */}
            <Animated.FlatList
                ref={flatListRef}
                data={SLIDES}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: false }
                )}
                onMomentumScrollEnd={(e) => {
                    const index = Math.round(e.nativeEvent.contentOffset.x / width);
                    setCurrentIndex(index);
                }}
            />

            {/* Next Button */}
            <View style={styles.bottomSection}>
                <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                    <LinearGradient
                        colors={['#00C853', '#00A344']}
                        style={styles.nextButtonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Text style={styles.nextButtonText}>
                            {currentIndex === SLIDES.length - 1 ? 'Commencer' : 'Suivant'}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background || '#E8D5C8',
    },
    skipButton: {
        position: 'absolute',
        top: 60,
        right: 24,
        zIndex: 10,
        padding: 8,
    },
    skipText: {
        fontSize: 15,
        fontWeight: '500',
        color: COLORS.gray || '#757575',
    },
    progressWrapper: {
        paddingTop: 100,
        paddingHorizontal: 32,
    },
    progressContainer: {
        alignItems: 'center',
    },
    progressBackground: {
        width: '100%',
        height: 6,
        backgroundColor: 'rgba(0, 200, 83, 0.2)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#00C853',
        borderRadius: 3,
    },
    progressText: {
        marginTop: 8,
        fontSize: 14,
        color: COLORS.gray || '#757575',
        fontWeight: '500',
    },
    slide: {
        width,
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emoji: {
        fontSize: 80,
        marginBottom: 32,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.text || '#212121',
        textAlign: 'center',
        marginBottom: 16,
    },
    description: {
        fontSize: 18,
        color: COLORS.textSecondary || '#757575',
        textAlign: 'center',
        lineHeight: 28,
    },
    bottomSection: {
        paddingHorizontal: 32,
        paddingBottom: 50,
    },
    nextButton: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#00C853',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 8,
    },
    nextButtonGradient: {
        paddingVertical: 18,
        alignItems: 'center',
    },
    nextButtonText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
});
