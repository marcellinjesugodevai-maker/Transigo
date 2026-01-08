import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
import { router } from 'expo-router';
import { COLORS } from '@/constants';
import { useAuthStore } from '@/stores';

const { width } = Dimensions.get('window');

export default function SplashScreen() {
    const { isAuthenticated } = useAuthStore();

    // Animation values
    const carPositionX = useRef(new Animated.Value(-width)).current;
    const carScale = useRef(new Animated.Value(0.8)).current;
    const brandingOpacity = useRef(new Animated.Value(0)).current;
    const brandingTranslateY = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        // Sequence d'animation
        Animated.sequence([
            // 1. La voiture entre depuis la gauche
            Animated.parallel([
                Animated.timing(carPositionX, {
                    toValue: 0,
                    duration: 1000,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.timing(carScale, {
                    toValue: 1,
                    duration: 1000,
                    easing: Easing.out(Easing.back(1.2)),
                    useNativeDriver: true,
                }),
            ]),
            // 2. Le branding apparaît
            Animated.parallel([
                Animated.timing(brandingOpacity, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.timing(brandingTranslateY, {
                    toValue: 0,
                    duration: 600,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
            ]),
        ]).start();

        // Navigation après l'animation
        const timer = setTimeout(() => {
            if (isAuthenticated) {
                router.replace('/(tabs)/home');
            } else {
                router.replace('/(auth)/onboarding');
            }
        }, 3500);

        return () => clearTimeout(timer);
    }, [isAuthenticated]);

    return (
        <View style={styles.container}>
            {/* Voiture animée */}
            <Animated.View
                style={[
                    styles.carContainer,
                    {
                        transform: [
                            { translateX: carPositionX },
                            { scale: carScale },
                        ],
                    },
                ]}
            >
                <Animated.Image
                    source={{ uri: 'https://zndgvloyaitopczhjddq.supabase.co/storage/v1/object/public/app-assets/splash/car.png?v=4' }}
                    style={styles.premiumCar}
                    resizeMode="contain"
                />
            </Animated.View>

            {/* Branding animé */}
            <Animated.View
                style={[
                    styles.brandingContainer,
                    {
                        opacity: brandingOpacity,
                        transform: [{ translateY: brandingTranslateY }],
                    },
                ]}
            >
                <Text style={styles.appName}>
                    Transi <Text style={{ color: COLORS.primary }}>Go</Text>
                </Text>
                <Text style={styles.tagline}>Votre VTC Premium en Côte d'Ivoire</Text>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    carContainer: {
        width: width * 0.9,
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
    },
    premiumCar: {
        width: '100%',
        height: '100%',
    },
    brandingContainer: {
        alignItems: 'center',
    },
    appName: {
        fontSize: 52,
        fontWeight: 'bold',
        color: '#1A1A1A',
        letterSpacing: 2,
    },
    tagline: {
        fontSize: 16,
        color: '#5D4037',
        marginTop: 12,
        fontStyle: 'italic',
    },
});
