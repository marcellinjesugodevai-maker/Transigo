import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useDriverRegStore } from '../../src/stores/driverRegStore';

const { width } = Dimensions.get('window');

const COLORS = {
    primary: '#FF6B00',
    secondary: '#00C853',
    purple: '#9C27B0',
    white: '#FFFFFF',
    black: '#1A1A2E',
    gray: '#757575',
    lightGray: '#F5F5F5',
};

const PROFILES = [
    {
        id: 'driver',
        icon: 'car-sport',
        emoji: '🚗',
        title: 'Chauffeur VTC',
        description: 'Transport de passagers',
        color: COLORS.primary,
        gradient: ['#FF6B00', '#FF8C00'],
    },
    {
        id: 'delivery',
        icon: 'cube',
        emoji: '📦',
        title: 'Livreur',
        description: 'Livraison colis & repas',
        color: COLORS.secondary,
        gradient: ['#00C853', '#00A344'],
    },
    {
        id: 'seller',
        icon: 'storefront',
        emoji: '🏪',
        title: 'Vendeur',
        description: 'Vendre sur TransiGo',
        color: COLORS.purple,
        gradient: ['#9C27B0', '#7B1FA2'],
    },
];

export default function ChooseProfileScreen() {
    const { updateData } = useDriverRegStore();

    const handleSelectProfile = (profileId: 'driver' | 'delivery' | 'seller') => {
        // Save profile type to registration store
        updateData({ profileType: profileId });

        // Navigate to vehicle/documents based on profile
        if (profileId === 'driver') {
            router.push('/(auth)/register-vehicle');
        } else if (profileId === 'delivery') {
            router.push('/(auth)/register-delivery-preferences');
        } else {
            router.push('/(auth)/register-documents'); // Sellers skip vehicle
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16 }}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.black} />
                </TouchableOpacity>
                <Text style={styles.title}>TransiGo Business</Text>
                <Text style={styles.subtitle}>
                    Choisissez votre activité principale
                </Text>
            </View>

            <View style={styles.profilesContainer}>
                {PROFILES.map((profile) => (
                    <TouchableOpacity
                        key={profile.id}
                        style={styles.profileCard}
                        onPress={() => handleSelectProfile(profile.id as 'driver' | 'delivery' | 'seller')}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={profile.gradient as any}
                            style={styles.cardGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <View style={styles.iconContainer}>
                                <Text style={styles.emoji}>{profile.emoji}</Text>
                            </View>
                            <Text style={styles.profileTitle}>{profile.title}</Text>
                            <Text style={styles.profileDesc}>{profile.description}</Text>
                            <View style={styles.arrowContainer}>
                                <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={styles.footerText}>
                Vous pourrez ajouter d'autres activités plus tard
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
        paddingTop: 60,
        paddingHorizontal: 24,
    },
    header: {
        marginBottom: 30,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.black,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.gray,
    },
    profilesContainer: {
        flex: 1,
        justifyContent: 'center',
        gap: 16,
    },
    profileCard: {
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    cardGradient: {
        padding: 24,
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    emoji: {
        fontSize: 28,
    },
    profileTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.white,
        flex: 1,
    },
    profileDesc: {
        position: 'absolute',
        bottom: 12,
        left: 100,
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
    },
    arrowContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerText: {
        textAlign: 'center',
        color: COLORS.gray,
        fontSize: 14,
        marginBottom: 40,
    },
});
