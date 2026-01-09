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
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '@/constants';

const { width, height } = Dimensions.get('window');

// =============================================
// ILLUSTRATION COMPONENTS (Pure Code - No Images)
// =============================================

// Slide 1: Car + Location Pin
const CarIllustration = () => (
    <View style={illustrationStyles.container}>
        <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            style={illustrationStyles.circle}
        >
            <View style={illustrationStyles.pinContainer}>
                <Ionicons name="location" size={40} color="#fff" />
            </View>
            <View style={illustrationStyles.carContainer}>
                <Ionicons name="car-sport" size={80} color="#fff" />
            </View>
            {/* Sparkles */}
            <View style={[illustrationStyles.sparkle, { top: 30, right: 40 }]}>
                <Ionicons name="sparkles" size={20} color="rgba(255,255,255,0.6)" />
            </View>
            <View style={[illustrationStyles.sparkle, { bottom: 50, left: 30 }]}>
                <Ionicons name="star" size={16} color="rgba(255,255,255,0.5)" />
            </View>
        </LinearGradient>
    </View>
);

// Slide 2: Group of People + Car
const GroupIllustration = () => (
    <View style={illustrationStyles.container}>
        <LinearGradient
            colors={[COLORS.secondary, COLORS.secondaryDark]}
            style={illustrationStyles.circle}
        >
            <View style={illustrationStyles.peopleRow}>
                <Ionicons name="person" size={36} color="#fff" />
                <Ionicons name="person" size={44} color="#fff" style={{ marginHorizontal: -5 }} />
                <Ionicons name="person" size={36} color="#fff" />
            </View>
            <View style={illustrationStyles.groupCarContainer}>
                <Ionicons name="car" size={60} color="#fff" />
            </View>
            {/* Connection lines (simulated) */}
            <View style={illustrationStyles.connectionLine} />
        </LinearGradient>
    </View>
);

// Slide 3: Multi-stop Route
const RouteIllustration = () => (
    <View style={illustrationStyles.container}>
        <LinearGradient
            colors={[COLORS.accent, '#00C853']}
            style={illustrationStyles.circle}
        >
            {/* Route path (curved line simulated with Views) */}
            <View style={illustrationStyles.routePath}>
                <View style={illustrationStyles.routeSegment} />
                <View style={[illustrationStyles.routeSegment, { transform: [{ rotate: '45deg' }], marginTop: -10 }]} />
            </View>
            {/* Location pins */}
            <View style={[illustrationStyles.routePin, { top: 35, left: 50 }]}>
                <Ionicons name="navigate" size={28} color="#fff" />
            </View>
            <View style={[illustrationStyles.routePin, { top: 80, right: 60 }]}>
                <Ionicons name="pin" size={28} color="#fff" />
            </View>
            <View style={[illustrationStyles.routePin, { bottom: 40, right: 45 }]}>
                <Ionicons name="flag" size={28} color="#fff" />
            </View>
        </LinearGradient>
    </View>
);

const illustrationStyles = StyleSheet.create({
    container: {
        width: width * 0.6,
        height: width * 0.6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    circle: {
        width: '100%',
        height: '100%',
        borderRadius: width * 0.3,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 15,
    },
    pinContainer: {
        position: 'absolute',
        top: 35,
    },
    carContainer: {
        marginTop: 20,
    },
    sparkle: {
        position: 'absolute',
    },
    peopleRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 5,
    },
    groupCarContainer: {
        marginTop: 5,
    },
    connectionLine: {
        position: 'absolute',
        width: 60,
        height: 2,
        backgroundColor: 'rgba(255,255,255,0.3)',
        top: '40%',
    },
    routePath: {
        position: 'absolute',
        width: '60%',
        height: '60%',
    },
    routeSegment: {
        width: 80,
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.4)',
        borderRadius: 2,
        marginVertical: 15,
    },
    routePin: {
        position: 'absolute',
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 20,
        padding: 8,
    },
});

// =============================================
// ONBOARDING DATA
// =============================================

interface OnboardingItem {
    id: string;
    illustration: React.ReactNode;
    title: string;
    description: string;
    color: string;
}

const onboardingData: OnboardingItem[] = [
    {
        id: '1',
        illustration: <CarIllustration />,
        title: 'Réservez votre trajet',
        description: 'Commandez un VTC en quelques clics. Simple, rapide et efficace.',
        color: COLORS.primary,
    },
    {
        id: '2',
        illustration: <GroupIllustration />,
        title: 'Courses de groupe',
        description: 'Voyagez ensemble et partagez les frais avec vos amis ou collègues.',
        color: COLORS.secondary,
    },
    {
        id: '3',
        illustration: <RouteIllustration />,
        title: 'Arrêts multiples',
        description: 'Ajoutez plusieurs destinations sur un seul trajet. Pratique et économique.',
        color: COLORS.accent,
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
        if (currentIndex < onboardingData.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
            setCurrentIndex(currentIndex + 1);
        } else {
            router.replace('/(auth)/login');
        }
    };

    const handleSkip = () => {
        router.replace('/(auth)/login');
    };

    const renderItem = ({ item }: { item: OnboardingItem }) => (
        <View style={styles.slide}>
            <View style={styles.illustrationContainer}>
                {item.illustration}
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
        </View>
    );

    const renderDots = () => (
        <View style={styles.dotsContainer}>
            {onboardingData.map((item, index) => {
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
            {/* Skip Button */}
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                <Text style={styles.skipText}>Passer</Text>
            </TouchableOpacity>

            {/* Slides */}
            <Animated.FlatList
                ref={flatListRef}
                data={onboardingData}
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

            {/* Dots */}
            {renderDots()}

            {/* Next Button */}
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryDark]}
                    style={styles.nextButtonGradient}
                >
                    <Text style={styles.nextButtonText}>
                        {currentIndex === onboardingData.length - 1
                            ? 'Commencer'
                            : 'Suivant'}
                    </Text>
                    <Ionicons
                        name={
                            currentIndex === onboardingData.length - 1
                                ? 'checkmark'
                                : 'arrow-forward'
                        }
                        size={24}
                        color="#fff"
                    />
                </LinearGradient>
            </TouchableOpacity>
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
        right: 20,
        zIndex: 10,
        padding: 10,
    },
    skipText: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.gray || '#9E9E9E',
    },
    slide: {
        width,
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING?.['2xl'] || 32,
    },
    illustrationContainer: {
        marginBottom: SPACING?.['2xl'] || 32,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.text || '#212121',
        textAlign: 'center',
        marginBottom: SPACING?.lg || 16,
    },
    description: {
        fontSize: 16,
        color: COLORS.textSecondary || '#757575',
        textAlign: 'center',
        lineHeight: 26,
        paddingHorizontal: SPACING?.lg || 16,
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING?.['2xl'] || 32,
    },
    dot: {
        height: 10,
        borderRadius: 5,
        marginHorizontal: 5,
    },
    nextButton: {
        marginHorizontal: SPACING?.['2xl'] || 32,
        marginBottom: SPACING?.['3xl'] || 48,
        borderRadius: RADIUS?.xl || 16,
        overflow: 'hidden',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 15,
        elevation: 8,
    },
    nextButtonGradient: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: SPACING?.lg || 16,
        gap: SPACING?.sm || 8,
    },
    nextButtonText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
});
