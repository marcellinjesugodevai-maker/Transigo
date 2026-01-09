// =============================================
// TRANSIGO BUSINESS - SPLASH SCREEN
// Premium design with brand colors
// =============================================

import { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Dimensions,
    Image,
    StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useDriverStore } from '../src/stores/driverStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const COLORS = {
    primary: '#00C853',
    primaryDark: '#00A344',
    orange: '#FF8C00',
    white: '#FFFFFF',
    lightGreen: '#E8F5E9',
};

export default function SplashScreen() {
    const { driver } = useDriverStore();
    const [isHydrated, setIsHydrated] = useState(false);

    // Wait for Zustand store to hydrate from SecureStore
    useEffect(() => {
        const unsubFinishHydration = useDriverStore.persist.onFinishHydration(() => {
            setIsHydrated(true);
        });

        // If already hydrated (can happen on fast devices)
        if (useDriverStore.persist.hasHydrated()) {
            setIsHydrated(true);
        }

        return () => {
            unsubFinishHydration();
        };
    }, []);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const slideUpAnim = useRef(new Animated.Value(30)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const circleAnim1 = useRef(new Animated.Value(0)).current;
    const circleAnim2 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Start animations
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }),
            Animated.timing(slideUpAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            }),
        ]).start();

        // Circles animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(circleAnim1, { toValue: 1, duration: 2000, useNativeDriver: true }),
                Animated.timing(circleAnim1, { toValue: 0, duration: 2000, useNativeDriver: true }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(circleAnim2, { toValue: 1, duration: 2500, useNativeDriver: true }),
                Animated.timing(circleAnim2, { toValue: 0, duration: 2500, useNativeDriver: true }),
            ])
        ).start();

        // Pulse animation for loading
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.2, duration: 600, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    // Check onboarding and navigate AFTER hydration
    useEffect(() => {
        if (!isHydrated) return; // Wait for store to be ready

        const checkAndNavigate = async () => {
            await new Promise(resolve => setTimeout(resolve, 1500)); // Shorter delay since we already waited for hydration

            const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');

            if (!hasSeenOnboarding) {
                router.replace('/(auth)/onboarding' as any);
            } else if (!driver) {
                router.replace('/(auth)/login' as any);
            } else {
                // Driver is logged in - go to home
                router.replace('/(tabs)/home' as any);
            }
        };

        checkAndNavigate();
    }, [isHydrated, driver]);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

            <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                style={styles.gradient}
            >
                {/* Decorative circles */}
                <Animated.View
                    style={[
                        styles.circle,
                        styles.circle1,
                        {
                            opacity: circleAnim1.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.2, 0.4],
                            }),
                            transform: [{
                                scale: circleAnim1.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [1, 1.2],
                                }),
                            }],
                        },
                    ]}
                />
                <Animated.View
                    style={[
                        styles.circle,
                        styles.circle2,
                        {
                            opacity: circleAnim2.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.15, 0.3],
                            }),
                            transform: [{
                                scale: circleAnim2.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [1, 1.15],
                                }),
                            }],
                        },
                    ]}
                />
                <Animated.View
                    style={[
                        styles.circle,
                        styles.circle3,
                        {
                            opacity: circleAnim1.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.1, 0.25],
                            }),
                        },
                    ]}
                />

                {/* Orange accent lines */}
                <View style={styles.orangeLine1} />
                <View style={styles.orangeLine2} />

                {/* Main content */}
                <Animated.View
                    style={[
                        styles.content,
                        {
                            opacity: fadeAnim,
                            transform: [
                                { scale: scaleAnim },
                                { translateY: slideUpAnim },
                            ],
                        },
                    ]}
                >
                    {/* Logo */}
                    <Text style={styles.logoText}>TransiGo</Text>

                    {/* Business badge */}
                    <View style={styles.businessBadge}>
                        <Text style={styles.businessText}>BUSINESS</Text>
                    </View>
                </Animated.View>

                {/* Bottom section */}
                <View style={styles.bottomSection}>
                    {/* Loading indicator */}
                    <Animated.View
                        style={[
                            styles.loadingContainer,
                            { transform: [{ scale: pulseAnim }] },
                        ]}
                    >
                        <View style={styles.loadingDot} />
                        <View style={[styles.loadingDot, styles.loadingDotMiddle]} />
                        <View style={styles.loadingDot} />
                    </Animated.View>

                    {/* Tagline */}
                    <Text style={styles.tagline}>Votre partenaire de confiance</Text>
                </View>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
    },

    // Decorative circles
    circle: {
        position: 'absolute',
        borderRadius: 999,
        borderWidth: 2,
        borderColor: COLORS.white,
    },
    circle1: {
        width: 200,
        height: 200,
        top: -50,
        left: -50,
    },
    circle2: {
        width: 300,
        height: 300,
        top: 100,
        right: -100,
    },
    circle3: {
        width: 150,
        height: 150,
        bottom: 150,
        left: -30,
    },

    // Orange accent lines
    orangeLine1: {
        position: 'absolute',
        top: 80,
        right: 30,
        width: 4,
        height: 60,
        backgroundColor: COLORS.orange,
        borderRadius: 2,
    },
    orangeLine2: {
        position: 'absolute',
        bottom: 200,
        left: 40,
        width: 4,
        height: 50,
        backgroundColor: COLORS.orange,
        borderRadius: 2,
    },

    // Main content
    content: {
        alignItems: 'center',
    },
    logoText: {
        fontSize: 52,
        fontWeight: 'bold',
        color: COLORS.white,
        letterSpacing: 1,
        textShadowColor: 'rgba(0,0,0,0.2)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 10,
    },
    businessBadge: {
        backgroundColor: COLORS.orange,
        paddingHorizontal: 24,
        paddingVertical: 8,
        borderRadius: 20,
        marginTop: 12,
        shadowColor: COLORS.orange,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
    },
    businessText: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 3,
    },

    // Bottom section
    bottomSection: {
        position: 'absolute',
        bottom: 80,
        alignItems: 'center',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    loadingDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.white,
        opacity: 0.7,
    },
    loadingDotMiddle: {
        marginHorizontal: 8,
        opacity: 1,
    },
    tagline: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '500',
        opacity: 0.9,
        letterSpacing: 0.5,
    },
});
