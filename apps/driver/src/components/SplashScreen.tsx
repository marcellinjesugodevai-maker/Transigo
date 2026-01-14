import { WelcomeImage } from '../../app/onboarding/welcomeAsset';
import { View, Text, StyleSheet, Animated, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
    const fadeAnim = new Animated.Value(0);
    const scaleAnim = new Animated.Value(0.8);

    useEffect(() => {
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
        ]).start();

        const timer = setTimeout(() => {
            onFinish();
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <LinearGradient
            colors={['#00C853', '#009624']} // Business Green
            style={styles.container}
        >
            <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
                {/* Logo Placeholder - replace with Image if available */}
                <View style={styles.logoContainer}>
                    <Image
                        source={{ uri: WelcomeImage }}
                        style={styles.logoImage}
                        resizeMode="contain"
                    />
                </View>

                <Text style={styles.appName}>TransiGo Business</Text>
                <Text style={styles.tagline}>Gérez votre activité en toute simplicité</Text>

                <View style={styles.badgesContainer}>
                    <Text style={styles.badge}>🚗 VTC</Text>
                    <Text style={styles.badge}>📦 Livraison</Text>
                    <Text style={styles.badge}>🏪 Vente</Text>
                </View>
            </Animated.View>

            <View style={styles.footer}>
                <Text style={styles.copyright}>© 2026 TransiGo Inc.</Text>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoContainer: {
        width: 120,
        height: 120,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.4)'
    },
    logoImage: {
        width: 80,
        height: 80,
        tintColor: 'white'
    },
    appName: {
        fontSize: 36,
        fontWeight: 'bold',
        color: 'white',
        letterSpacing: 1,
        marginBottom: 8,
    },
    tagline: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        marginBottom: 40,
    },
    badgesContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    badge: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
        overflow: 'hidden',
    },
    footer: {
        position: 'absolute',
        bottom: 40,
    },
    copyright: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12,
    }
});
