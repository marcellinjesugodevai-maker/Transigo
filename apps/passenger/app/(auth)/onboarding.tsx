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
import { Image } from 'expo-image';



import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@/components/Icon';
import { COLORS, SPACING, RADIUS } from '@/constants';

const { width, height } = Dimensions.get('window');

interface OnboardingItem {
    id: string;
    image: any;
    title: string;
    description: string;
    color: string;
}

const onboardingData: OnboardingItem[] = [
    {
        id: '1',
        image: require('../../assets/onboarding/travel.png'),
        title: 'Voyagez en Toute Liberté',
        description:
            'Commandez une course en quelques secondes...',
        color: COLORS.primary,
    },
    {
        id: '2',
        image: require('../../assets/onboarding/negotiate.png'),
        title: 'Négociez Votre Prix',
        description:
            'Proposez votre prix en FCFA et choisissez la meilleure offre...',
        color: COLORS.secondary,
    },
    {
        id: '3',
        image: require('../../assets/onboarding/safety.png'),
        title: 'Sécurité Maximale',
        description:
            'Voyagez en toute sérénité avec nos chauffeurs vérifiés et certifiés.',
        color: COLORS.primary,
    },
];


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
            <View style={styles.imageContainer}>
                <Image
                    source={item.image}
                    style={styles.illustration}
                    contentFit="contain"
                />
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
        </View>
    );

    const renderDots = () => (
        <View style={styles.dotsContainer}>
            {onboardingData.map((_, index) => {
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
                const opacity = scrollX.interpolate({
                    inputRange,
                    outputRange: [0.3, 1, 0.3],
                    extrapolate: 'clamp',
                });

                return (
                    <Animated.View
                        key={index}
                        style={[
                            styles.dot,
                            {
                                width: dotWidth,
                                opacity,
                                backgroundColor: COLORS.primary,
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
                    <Icon
                        name={
                            currentIndex === onboardingData.length - 1
                                ? 'checkmark'
                                : 'arrow-forward'
                        }
                        size={24}
                        color={COLORS.white}
                    />
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#E8D5C8',
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
        fontFamily: 'Poppins-Medium',
        color: COLORS.gray600,
    },
    slide: {
        width,
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING['2xl'],
    },
    imageContainer: {
        width: width * 0.8,
        height: width * 0.8,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING['2xl'],
    },
    illustration: {
        width: '100%',
        height: '100%',
    },
    title: {
        fontSize: 28,
        fontFamily: 'Poppins-Bold',
        color: COLORS.black,
        textAlign: 'center',
        marginBottom: SPACING.lg,
    },
    description: {
        fontSize: 16,
        fontFamily: 'Poppins-Regular',
        color: COLORS.gray600,
        textAlign: 'center',
        lineHeight: 26,
        paddingHorizontal: SPACING.lg,
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING['2xl'],
    },
    dot: {
        height: 10,
        borderRadius: 5,
        marginHorizontal: 5,
    },
    nextButton: {
        marginHorizontal: SPACING['2xl'],
        marginBottom: SPACING['3xl'],
        borderRadius: RADIUS.xl,
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
        paddingVertical: SPACING.lg,
        gap: SPACING.sm,
    },
    nextButtonText: {
        fontSize: 18,
        fontFamily: 'Poppins-SemiBold',
        color: COLORS.white,
    },
});

