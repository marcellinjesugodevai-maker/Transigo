// =============================================
// TRANSIGO BUSINESS - ONBOARDING SCREEN
// 3 slides for 3 profile types: Driver, Delivery, Seller
// =============================================

import { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Image,
    StatusBar,
    FlatList,
    Animated,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const COLORS = {
    primary: '#00C853',
    primaryDark: '#00A344',
    orange: '#FF8C00',
    white: '#FFFFFF',
    black: '#1A1A2E',
    gray: '#757575',
};

// Images must be required at top-level for Metro bundler
const IMAGES = {
    driver: require('../../assets/images/onboarding/driver.png'),
    delivery: require('../../assets/images/onboarding/delivery.png'),
    seller: require('../../assets/images/onboarding/seller.png'),
};

// Onboarding slides data
const SLIDES = [
    {
        id: 'driver',
        title: 'Chauffeur VTC',
        subtitle: 'Conduisez et gagnez',
        description: 'Transportez des passagers dans votre véhicule et générez des revenus selon votre emploi du temps.',
        icon: '🚗',
        image: IMAGES.driver,
    },
    {
        id: 'delivery',
        title: 'Livreur',
        subtitle: 'Livrez rapidement',
        description: 'Effectuez des livraisons de colis et repas. Flexibilité totale avec votre moto ou vélo.',
        icon: '📦',
        image: IMAGES.delivery,
    },
    {
        id: 'seller',
        title: 'Vendeur',
        subtitle: 'Vendez en ligne',
        description: 'Proposez vos produits sur notre plateforme et touchez des milliers de clients.',
        icon: '🛒',
        image: IMAGES.seller,
    },
];

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

    const renderSlide = ({ item, index }: { item: typeof SLIDES[0]; index: number }) => {
        return (
            <View style={styles.slide}>
                {/* Image container */}
                <View style={styles.imageContainer}>
                    <Image
                        source={item.image}
                        style={styles.slideImage}
                        resizeMode="cover"
                    />
                    {/* Gradient overlay at bottom */}
                    <LinearGradient
                        colors={['transparent', COLORS.white]}
                        style={styles.imageGradient}
                    />
                </View>

                {/* Content */}
                <View style={styles.slideContent}>
                    <View style={styles.iconBadge}>
                        <Text style={styles.iconText}>{item.icon}</Text>
                    </View>

                    <Text style={styles.slideTitle}>{item.title}</Text>
                    <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
                    <Text style={styles.slideDescription}>{item.description}</Text>
                </View>
            </View>
        );
    };

    const renderPagination = () => {
        return (
            <View style={styles.pagination}>
                {SLIDES.map((_, index) => {
                    const inputRange = [
                        (index - 1) * width,
                        index * width,
                        (index + 1) * width,
                    ];

                    const dotWidth = scrollX.interpolate({
                        inputRange,
                        outputRange: [10, 30, 10],
                        extrapolate: 'clamp',
                    });

                    const dotOpacity = scrollX.interpolate({
                        inputRange,
                        outputRange: [0.4, 1, 0.4],
                        extrapolate: 'clamp',
                    });

                    return (
                        <Animated.View
                            key={index}
                            style={[
                                styles.dot,
                                {
                                    width: dotWidth,
                                    opacity: dotOpacity,
                                    backgroundColor: index === currentIndex ? COLORS.primary : COLORS.gray,
                                },
                            ]}
                        />
                    );
                })}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

            {/* Header with Skip button */}
            <View style={styles.header}>
                <View style={styles.headerLeft} />
                <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                    <Text style={styles.skipText}>Passer</Text>
                    <Ionicons name="arrow-forward" size={16} color={COLORS.gray} />
                </TouchableOpacity>
            </View>

            {/* Slides */}
            <FlatList
                ref={flatListRef}
                data={SLIDES}
                renderItem={renderSlide}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: false }
                )}
                onMomentumScrollEnd={(event) => {
                    const index = Math.round(event.nativeEvent.contentOffset.x / width);
                    setCurrentIndex(index);
                }}
                scrollEventThrottle={16}
            />

            {/* Pagination dots */}
            {renderPagination()}

            {/* Bottom buttons */}
            <View style={styles.bottomSection}>
                <TouchableOpacity
                    style={styles.nextButton}
                    onPress={handleNext}
                    activeOpacity={0.9}
                >
                    <LinearGradient
                        colors={[COLORS.primary, COLORS.primaryDark]}
                        style={styles.nextButtonGradient}
                    >
                        <Text style={styles.nextButtonText}>
                            {currentIndex === SLIDES.length - 1 ? 'Commencer' : 'Suivant'}
                        </Text>
                        <Ionicons
                            name={currentIndex === SLIDES.length - 1 ? 'checkmark' : 'arrow-forward'}
                            size={22}
                            color={COLORS.white}
                        />
                    </LinearGradient>
                </TouchableOpacity>

                {/* Profile indicators */}
                <View style={styles.profileIndicators}>
                    {SLIDES.map((slide, index) => (
                        <View
                            key={slide.id}
                            style={[
                                styles.profileIndicator,
                                currentIndex === index && styles.profileIndicatorActive,
                            ]}
                        >
                            <Text style={styles.profileIndicatorIcon}>{slide.icon}</Text>
                        </View>
                    ))}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 10,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    headerLeft: {
        width: 60,
    },
    skipButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 20,
    },
    skipText: {
        color: COLORS.gray,
        fontSize: 14,
        fontWeight: '600',
        marginRight: 4,
    },

    // Slide
    slide: {
        width: width,
        flex: 1,
    },
    imageContainer: {
        height: height * 0.55,
        position: 'relative',
    },
    slideImage: {
        width: '100%',
        height: '100%',
    },
    imageGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 100,
    },

    // Content
    slideContent: {
        flex: 1,
        paddingHorizontal: 30,
        paddingTop: 20,
        alignItems: 'center',
    },
    iconBadge: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconText: {
        fontSize: 28,
    },
    slideTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.black,
        marginBottom: 8,
        textAlign: 'center',
    },
    slideSubtitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.orange,
        marginBottom: 12,
        textAlign: 'center',
    },
    slideDescription: {
        fontSize: 15,
        color: COLORS.gray,
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 10,
    },

    // Pagination
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
    },
    dot: {
        height: 10,
        borderRadius: 5,
        marginHorizontal: 5,
    },

    // Bottom
    bottomSection: {
        paddingHorizontal: 30,
        paddingBottom: 40,
        alignItems: 'center',
    },
    nextButton: {
        width: '100%',
        marginBottom: 20,
    },
    nextButtonGradient: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
        borderRadius: 30,
    },
    nextButtonText: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: 'bold',
        marginRight: 8,
    },

    // Profile indicators
    profileIndicators: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
    },
    profileIndicator: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    profileIndicatorActive: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary + '20',
    },
    profileIndicatorIcon: {
        fontSize: 20,
    },
});
