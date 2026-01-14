// =============================================
// TRANSIGO BUSINESS - ONBOARDING SCREEN
// Minimalist text-only version with progress bar
// Same style as Passenger app
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
    Image,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DriverImage, DeliveryImage, SellerImage } from '../onboarding/profileAssets';

const { width } = Dimensions.get('window');

const COLORS = {
    primary: '#00C853',
    primaryDark: '#00A344',
    background: '#E8F5E9',
    text: '#212121',
    textSecondary: '#757575',
    gray: '#757575',
};

// =============================================
// ONBOARDING DATA - Base64 Images
// =============================================

interface OnboardingSlide {
    id: string;
    image: string;
    title: string;
    description: string;
}

const SLIDES: OnboardingSlide[] = [
    {
        id: '1',
        image: DriverImage,
        title: 'Devenez Chauffeur VTC',
        description: 'Transportez des passagers et générez des revenus selon votre emploi du temps.',
    },
    {
        id: '2',
        image: DeliveryImage,
        title: 'Livrez des colis',
        description: 'Effectuez des livraisons rapides avec votre moto ou vélo. Flexibilité totale.',
    },
    {
        id: '3',
        image: SellerImage, // Using Seller Image as placeholder for "Economics/Business" theme
        title: 'Gagnez plus',
        description: 'Commissions avantageuses, paiements rapides et bonus réguliers.',
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
            handleGetStarted();
        }
    };

    const handleSkip = async () => {
        await AsyncStorage.setItem('hasSeenOnboarding', 'true');
        router.replace('/(auth)/login' as any);
    };

    const handleGetStarted = async () => {
        await AsyncStorage.setItem('hasSeenOnboarding', 'true');
        router.replace('/(auth)/login' as any);
    };

    const renderItem = ({ item }: { item: OnboardingSlide }) => (
        <View style={styles.slide}>
            {/* Image */}
            <View style={styles.imageContainer}>
                <Image
                    source={{ uri: item.image }}
                    style={styles.image}
                    resizeMode="contain"
                />
            </View>

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
                        colors={[COLORS.primary, COLORS.primaryDark]}
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
        backgroundColor: COLORS.background,
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
        color: COLORS.gray,
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
        backgroundColor: COLORS.primary,
        borderRadius: 3,
    },
    progressText: {
        marginTop: 8,
        fontSize: 14,
        color: COLORS.gray,
        fontWeight: '500',
    },
    slide: {
        width,
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    imageContainer: {
        width: width * 0.8,
        height: width * 0.8,
        marginBottom: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: 16,
    },
    description: {
        fontSize: 18,
        color: COLORS.textSecondary,
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
        shadowColor: COLORS.primary,
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
