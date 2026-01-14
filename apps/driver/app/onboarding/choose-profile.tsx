import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert, Image as RNImage } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useDriverRegStore } from '../../src/stores/driverRegStore';
import { useDriverStore } from '../../src/stores/driverStore';
import { supabase } from '../../src/services/supabaseService';
import { useState } from 'react';

const { width } = Dimensions.get('window');
import { DriverImage, DeliveryImage, SellerImage } from './profileAssets';

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
        image: DriverImage,
        title: 'Chauffeur VTC',
        description: 'Transport de passagers',
        color: COLORS.primary,
        gradient: ['#FF6B00', '#FF8C00'],
        comingSoon: false,
    },
    {
        id: 'delivery',
        image: DeliveryImage,
        title: 'Livreur',
        description: 'Livraison colis & repas',
        color: COLORS.secondary,
        gradient: ['#00C853', '#00A344'],
        comingSoon: false,
    },
    {
        id: 'seller',
        image: SellerImage,
        title: 'Vendeur',
        description: 'Vendre sur TransiGo',
        color: COLORS.purple,
        gradient: ['#9C9C9C', '#757575'], // Grayed out for coming soon
        comingSoon: true,
    },
];

export default function ChooseProfileScreen() {
    const { updateData } = useDriverRegStore();
    const { driver, setDriver } = useDriverStore();
    const [isLoading, setIsLoading] = useState(false);

    const handleSelectProfile = async (profileId: 'driver' | 'delivery' | 'seller') => {
        if (!driver?.id) {
            Alert.alert('Erreur', 'Veuillez vous reconnecter.');
            router.replace('/(auth)/login');
            return;
        }

        setIsLoading(true);

        try {
            // 1. Mettre à jour dans Supabase
            const { error } = await supabase
                .from('drivers')
                .update({
                    profile_type: profileId,
                    vehicle_type: profileId === 'delivery' ? 'moto' : 'standard'
                })
                .eq('id', driver.id);

            if (error) throw error;

            // 2. Mettre à jour le store local
            setDriver({
                ...driver,
                profileType: profileId
            });

            // 3. Mettre à jour le store d'inscription
            updateData({ profileType: profileId });

            // 4. Naviguer vers l'écran suivant
            if (profileId === 'driver') {
                router.push('/(auth)/register-vehicle');
            } else if (profileId === 'delivery') {
                router.push('/(auth)/register-delivery-preferences');
            } else {
                router.push('/(auth)/register-documents');
            }
        } catch (error: any) {
            console.error('Error updating profile type:', error);
            Alert.alert('Erreur', 'Impossible de sauvegarder le profil. Réessayez.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 24, color: COLORS.black }}>⬅️</Text>
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
                        style={[styles.profileCard, profile.comingSoon && styles.profileCardDisabled]}
                        onPress={() => !profile.comingSoon && handleSelectProfile(profile.id as 'driver' | 'delivery' | 'seller')}
                        activeOpacity={profile.comingSoon ? 1 : 0.8}
                        disabled={profile.comingSoon}
                    >
                        <LinearGradient
                            colors={profile.gradient as any}
                            style={styles.cardGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            {/* Profile Image */}
                            <View style={styles.iconContainer}>
                                <RNImage source={{ uri: profile.image }} style={styles.profileImage} resizeMode="contain" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={styles.profileTitle}>{profile.title}</Text>
                                    {profile.comingSoon && (
                                        <View style={styles.comingSoonBadge}>
                                            <Text style={styles.comingSoonText}>Bientôt</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.profileDescInline}>{profile.description}</Text>
                            </View>
                            <View style={styles.arrowContainer}>
                                <Text style={{ fontSize: 20, color: COLORS.white }}>
                                    {profile.comingSoon ? "🔒" : "➡️"}
                                </Text>
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
        width: 100,
        height: 70,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    profileImage: {
        width: '100%',
        height: '100%',
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
    profileCardDisabled: {
        opacity: 0.85,
    },
    comingSoonBadge: {
        backgroundColor: 'rgba(255,255,255,0.3)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        marginLeft: 8,
    },
    comingSoonText: {
        color: COLORS.white,
        fontSize: 10,
        fontWeight: '600',
    },
    profileDescInline: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 4,
    },
});
