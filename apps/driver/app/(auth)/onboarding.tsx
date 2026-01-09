// =============================================
// TRANSIGO BUSINESS - ONBOARDING SCREEN
// 3 slides for 3 profile types: Driver, Delivery, Seller
// Pure Code Version (No Images)
// =============================================

import { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
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
    orangeDark: '#E67600',
    purple: '#7B1FA2',
    purpleDark: '#4A148C',
    white: '#FFFFFF',
    black: '#1A1A2E',
    gray: '#757575',
    background: '#E8F5E9',
};

// =============================================
// ILLUSTRATION COMPONENTS (Pure Code - No Images)
// =============================================

// Slide 1: VTC Driver - Car with GPS and motion
const DriverIllustration = () => (
    <View style={illustrationStyles.container}>
        <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            style={illustrationStyles.circle}
        >
            {/* GPS Pin above car */}
            <View style={illustrationStyles.gpsContainer}>
                <Ionicons name="location" size={36} color="#fff" />
                <View style={illustrationStyles.gpsPulse} />
            </View>

            {/* Car with motion effect */}
            <View style={illustrationStyles.carRow}>
                <View style={illustrationStyles.motionLines}>
                    <View style={[illustrationStyles.motionLine, { width: 20 }]} />
                    <View style={[illustrationStyles.motionLine, { width: 30 }]} />
                    <View style={[illustrationStyles.motionLine, { width: 25 }]} />
                </View>
                <Ionicons name="car-sport" size={70} color="#fff" />
            </View>

            {/* Sparkles */}
            <View style={[illustrationStyles.sparkle, { top: 25, right: 35 }]}>
                <Ionicons name="sparkles" size={18} color="rgba(255,255,255,0.7)" />
            </View>
            <View style={[illustrationStyles.sparkle, { top: 45, left: 35 }]}>
                <Ionicons name="star" size={14} color="rgba(255,255,255,0.5)" />
            </View>
            <View style={[illustrationStyles.sparkle, { bottom: 35, right: 45 }]}>
                <Ionicons name="star" size={12} color="rgba(255,255,255,0.6)" />
            </View>
        </LinearGradient>
    </View>
);

// Slide 2: Delivery - Scooter with package
const DeliveryIllustration = () => (
    <View style={illustrationStyles.container}>
        <LinearGradient
            colors={[COLORS.orange, COLORS.orangeDark]}
            style={illustrationStyles.circle}
        >
            {/* Package icon */}
            <View style={illustrationStyles.packageIcon}>
                <Ionicons name="cube" size={32} color="#fff" />
            </View>

            {/* Scooter/Bicycle */}
            <View style={illustrationStyles.vehicleContainer}>
                <Ionicons name="bicycle" size={65} color="#fff" />
            </View>

            {/* Speed lines */}
            <View style={[illustrationStyles.speedLine, { top: '40%', left: 25 }]} />
            <View style={[illustrationStyles.speedLine, { top: '50%', left: 20, width: 25 }]} />

            {/* Sparkles */}
            <View style={[illustrationStyles.sparkle, { top: 30, right: 40 }]}>
                <Ionicons name="time" size={20} color="rgba(255,255,255,0.7)" />
            </View>
        </LinearGradient>
    </View>
);

// Slide 3: Seller - Shopping cart with money
const SellerIllustration = () => (
    <View style={illustrationStyles.container}>
        <LinearGradient
            colors={[COLORS.purple, COLORS.purpleDark]}
            style={illustrationStyles.circle}
        >
            {/* Money icons floating */}
            <View style={[illustrationStyles.moneyIcon, { top: 25, left: 50 }]}>
                <Ionicons name="cash" size={24} color="rgba(255,255,255,0.8)" />
            </View>
            <View style={[illustrationStyles.moneyIcon, { top: 35, right: 45 }]}>
                <Ionicons name="logo-usd" size={20} color="rgba(255,255,255,0.7)" />
            </View>

            {/* Shopping cart */}
            <View style={illustrationStyles.cartContainer}>
                <Ionicons name="cart" size={70} color="#fff" />
            </View>

            {/* Products badge */}
            <View style={illustrationStyles.productBadge}>
                <Ionicons name="pricetag" size={22} color="rgba(255,255,255,0.9)" />
            </View>

            {/* Coins */}
            <View style={[illustrationStyles.sparkle, { bottom: 40, left: 55 }]}>
                <View style={illustrationStyles.coin} />
            </View>
            <View style={[illustrationStyles.sparkle, { bottom: 50, right: 50 }]}>
                <View style={[illustrationStyles.coin, { width: 10, height: 10 }]} />
            </View>
        </LinearGradient>
    </View>
);

const illustrationStyles = StyleSheet.create({
    container: {
        width: width * 0.55,
        height: width * 0.55,
        justifyContent: 'center',
        alignItems: 'center',
    },
    circle: {
        width: '100%',
        height: '100%',
        borderRadius: width * 0.275,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 15,
    },
    gpsContainer: {
        position: 'absolute',
        top: 30,
        alignItems: 'center',
    },
    gpsPulse: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.5)',
        marginTop: -5,
    },
    carRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 15,
    },
    motionLines: {
        marginRight: 5,
        justifyContent: 'center',
        gap: 6,
    },
    motionLine: {
        height: 3,
        backgroundColor: 'rgba(255,255,255,0.4)',
        borderRadius: 2,
    },
    sparkle: {
        position: 'absolute',
    },
    packageIcon: {
        position: 'absolute',
        top: 35,
        right: 55,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
        padding: 6,
    },
    vehicleContainer: {
        marginTop: 10,
    },
    speedLine: {
        position: 'absolute',
        height: 3,
        width: 20,
        backgroundColor: 'rgba(255,255,255,0.4)',
        borderRadius: 2,
    },
    moneyIcon: {
        position: 'absolute',
    },
    cartContainer: {
        marginTop: 5,
    },
    productBadge: {
        position: 'absolute',
        bottom: 45,
        right: 60,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 10,
        padding: 5,
    },
    coin: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: 'rgba(255,215,0,0.8)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
    },
});

// =============================================
// ONBOARDING DATA
// =============================================

interface OnboardingSlide {
    id: string;
    illustration: React.ReactNode;
    title: string;
    subtitle: string;
    description: string;
    color: string;
}

const SLIDES: OnboardingSlide[] = [
    {
        id: 'driver',
        illustration: <DriverIllustration />,
        title: 'Chauffeur VTC',
        subtitle: 'Conduisez et gagnez',
        description: 'Transportez des passagers dans votre véhicule et générez des revenus selon votre emploi du temps.',
        color: COLORS.primary,
    },
    {
        id: 'delivery',
        illustration: <DeliveryIllustration />,
        title: 'Livreur',
        subtitle: 'Livrez rapidement',
        description: 'Effectuez des livraisons de colis et repas. Flexibilité totale avec votre moto ou vélo.',
        color: COLORS.orange,
    },
    {
        id: 'seller',
        illustration: <SellerIllustration />,
        title: 'Vendeur',
        subtitle: 'Vendez en ligne',
        description: 'Proposez vos produits sur notre plateforme et touchez des milliers de clients.',
        color: COLORS.purple,
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

    const handleGetStarted = async () => {
        await AsyncStorage.setItem('hasSeenOnboarding', 'true');
        router.replace('/(auth)/login');
    };

    const handleSkip = async () => {
        await AsyncStorage.setItem('hasSeenOnboarding', 'true');
        router.replace('/(auth)/login');
    };

    const renderItem = ({ item }: { item: OnboardingSlide }) => (
        <View style={styles.slide}>
            {/* Illustration */}
            <View style={styles.illustrationContainer}>
                {item.illustration}
            </View>

            {/* Text Content */}
            <View style={styles.textContainer}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={[styles.subtitle, { color: item.color }]}>{item.subtitle}</Text>
                <Text style={styles.description}>{item.description}</Text>
            </View>
        </View>
    );

    const renderDots = () => (
        <View style={styles.dotsContainer}>
            {SLIDES.map((item, index) => {
                const inputRange = [
                    (index - 1) * width,
                    index * width,
                    (index + 1) * width,
                ];
                const dotWidth = scrollX.interpolate({
                    inputRange,
                    outputRange: [10, 28, 10],
                    extrapolate: 'clamp',
                });
                const backgroundColor = scrollX.interpolate({
                    inputRange,
                    outputRange: [COLORS.gray, item.color, COLORS.gray],
                    extrapolate: 'clamp',
                });

                return (
                    <Animated.View
                        key={index}
                        style={[
                            styles.dot,
                            {
                                width: dotWidth,
                                backgroundColor,
                            },
                        ]}
                    />
                );
            })}
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            {/* Header with Logo */}
            <View style={styles.header}>
                <Text style={styles.logoText}>
                    <Text style={{ color: COLORS.primary }}>TransiGo</Text>
                    <Text style={{ color: COLORS.black }}> Business</Text>
                </Text>
            </View>

            {/* Skip Button */}
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                <Text style={styles.skipText}>Passer</Text>
            </TouchableOpacity>

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

            {/* Bottom Section */}
            <View style={styles.bottomSection}>
                {/* Dots */}
                {renderDots()}

                {/* Next Button */}
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
                        <Ionicons
                            name={currentIndex === SLIDES.length - 1 ? 'checkmark' : 'arrow-forward'}
                            size={22}
                            color="#fff"
                        />
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
    header: {
        paddingTop: 60,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    logoText: {
        fontSize: 22,
        fontWeight: 'bold',
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
    slide: {
        width,
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    illustrationContainer: {
        marginBottom: 40,
    },
    textContainer: {
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.black,
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 16,
    },
    description: {
        fontSize: 15,
        color: COLORS.gray,
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 16,
    },
    bottomSection: {
        paddingBottom: 50,
        paddingHorizontal: 32,
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    dot: {
        height: 10,
        borderRadius: 5,
        marginHorizontal: 5,
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
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    nextButtonText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#fff',
    },
});
