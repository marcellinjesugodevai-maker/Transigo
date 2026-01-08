// =============================================
// TRANSIGO - SERVICES SCREEN (NAVIGATION INTELLIGENTE)
// =============================================

import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, Alert } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@/components/Icon';
import { COLORS, SPACING, RADIUS } from '@/constants';
import { useThemeStore, useLanguageStore } from '@/stores';
import { getTranslation } from '@/i18n/translations';

type ServiceType = 'vtc' | 'delivery' | 'food' | 'lottery';

interface Service {
    id: string;
    icon: string;
    name: string;
    description: string;
    descriptionEn: string;
    color: string;
    type: ServiceType;
    vehicleType?: string;
    route?: string;
}

const SERVICES: Service[] = [
    {
        id: '1',
        icon: 'car',
        name: 'TransiGo Classic',
        description: 'Économique et rapide',
        descriptionEn: 'Affordable and fast',
        color: COLORS.primary,
        type: 'vtc',
        vehicleType: 'standard'
    },
    {
        id: '2',
        icon: 'car-sport',
        name: 'TransiGo Comfort',
        description: 'Confort premium + AC',
        descriptionEn: 'Premium comfort + AC',
        color: '#7B1FA2',
        type: 'vtc',
        vehicleType: 'comfort'
    },
    {
        id: '3',
        icon: 'bus',
        name: 'TransiGo XL',
        description: 'Pour groupes (6 places)',
        descriptionEn: 'For groups (6 seats)',
        color: '#00BCD4',
        type: 'vtc',
        vehicleType: 'van'
    },
    {
        id: '4',
        icon: 'bicycle',
        name: 'TransiGo Moto',
        description: 'Rapide en 2 roues',
        descriptionEn: 'Fast on 2 wheels',
        color: '#4CAF50',
        type: 'vtc',
        vehicleType: 'moto'
    },
    {
        id: '5',
        icon: 'cube',
        name: 'TransiGo Delivery',
        description: 'Livraison rapide',
        descriptionEn: 'Fast delivery',
        color: '#FF9800',
        type: 'delivery',
        route: '/delivery'
    },
    {
        id: '7',
        icon: 'game-controller',
        name: 'Loterie TransiGo',
        description: 'Gagnez des cadeaux',
        descriptionEn: 'Win prizes',
        color: '#FFD700',
        type: 'lottery',
        route: '/lottery'
    },
];

export default function ServicesScreen() {
    const { colors, isDark } = useThemeStore();
    const { language } = useLanguageStore();
    const t = (key: any) => getTranslation(key, language);

    const handleServicePress = (service: Service) => {
        if (service.type === 'vtc') {
            // Services VTC → Rediriger vers Home avec véhicule présélectionné
            router.push({
                pathname: '/(tabs)/home',
                params: { vehicleType: service.vehicleType }
            });
        } else if (service.route) {
            // Autres services → Rediriger vers écran dédié
            router.push(service.route as any);
        } else {
            Alert.alert(
                language === 'fr' ? 'Bientôt disponible' : 'Coming soon',
                language === 'fr' ? 'Ce service sera disponible prochainement.' : 'This service will be available soon.'
            );
        }
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: language === 'fr'
                    ? '🚖 Utilise Transi Go pour tes déplacements ! Code parrain: TRANSIGO2024 - Gagne 1000 FCFA sur ta première course. Télécharge l\'app ici: https://transigo.ci'
                    : '🚖 Use Transi Go for your rides! Referral code: TRANSIGO2024 - Get 1000 FCFA on your first ride. Download the app here: https://transigo.ci',
            });
        } catch (error) {
            console.log('Share error:', error);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.card }]}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                    {language === 'fr' ? 'Services' : 'Services'}
                </Text>
                <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                    {language === 'fr' ? 'Choisissez votre service' : 'Choose your service'}
                </Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Section VTC */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    <Icon name="navigate" size={18} color={COLORS.primary} /> {language === 'fr' ? 'Transport' : 'Transport'}
                </Text>
                <View style={styles.servicesGrid}>
                    {SERVICES.filter(s => s.type === 'vtc').map((service) => (
                        <TouchableOpacity
                            key={service.id}
                            style={styles.serviceCard}
                            onPress={() => handleServicePress(service)}
                            activeOpacity={0.9}
                        >
                            <LinearGradient
                                colors={[service.color, service.color + 'CC']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.serviceGradient}
                            >
                                <Icon name={service.icon as any} size={44} color={COLORS.white} />
                                <Text style={styles.serviceName}>{service.name}</Text>
                                <Text style={styles.serviceDescription}>
                                    {language === 'fr' ? service.description : service.descriptionEn}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Section Autres Services */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    <Icon name="options" size={18} color={COLORS.primary} /> {language === 'fr' ? 'Autres services' : 'Other services'}
                </Text>
                <View style={styles.servicesGrid}>
                    {SERVICES.filter(s => s.type !== 'vtc').map((service) => (
                        <TouchableOpacity
                            key={service.id}
                            style={styles.serviceCard}
                            onPress={() => handleServicePress(service)}
                            activeOpacity={0.9}
                        >
                            <LinearGradient
                                colors={[service.color, service.color + 'CC']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.serviceGradient}
                            >
                                <Icon name={service.icon as any} size={44} color={COLORS.white} />
                                <Text style={styles.serviceName}>{service.name}</Text>
                                <Text style={styles.serviceDescription}>
                                    {language === 'fr' ? service.description : service.descriptionEn}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Bannière Parrainage */}
                <TouchableOpacity activeOpacity={0.9} onPress={handleShare}>
                    <LinearGradient
                        colors={['#4CAF50', '#2E7D32']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.promoCard}
                    >
                        <View style={styles.promoContent}>
                            <Icon name="gift" size={40} color={COLORS.white} style={{ marginRight: SPACING.md }} />
                            <View style={styles.promoText}>
                                <Text style={styles.promoTitle}>
                                    {language === 'fr' ? 'Parrainez un ami' : 'Refer a friend'}
                                </Text>
                                <Text style={styles.promoSubtitle}>
                                    {language === 'fr' ? 'Gagnez 1000 FCFA par ami' : 'Earn 1000 FCFA per friend'}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.promoButton}>
                            <Text style={styles.promoButtonText}>
                                {language === 'fr' ? 'Partager' : 'Share'}
                            </Text>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        paddingHorizontal: SPACING.lg,
        paddingTop: 50,
        paddingBottom: SPACING.md,
        backgroundColor: COLORS.white,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    headerSubtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    scrollContent: {
        padding: SPACING.lg,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: SPACING.md,
    },
    servicesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.md,
        marginBottom: SPACING.xl,
    },
    serviceCard: {
        width: '48%',
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 6,
    },
    serviceGradient: {
        padding: SPACING.lg,
        alignItems: 'center',
        minHeight: 160,
        justifyContent: 'center',
    },
    serviceIcon: {
        fontSize: 48,
        marginBottom: SPACING.sm,
    },
    serviceName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.white,
        textAlign: 'center',
        marginBottom: 4,
    },
    serviceDescription: {
        fontSize: 11,
        color: COLORS.white,
        textAlign: 'center',
        opacity: 0.9,
    },
    promoCard: {
        borderRadius: 20,
        padding: SPACING.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 6,
    },
    promoContent: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    promoIcon: {
        fontSize: 40,
        marginRight: SPACING.md,
    },
    promoText: {
        flex: 1,
    },
    promoTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.white,
        marginBottom: 4,
    },
    promoSubtitle: {
        fontSize: 13,
        color: COLORS.white,
        opacity: 0.9,
    },
    promoButton: {
        backgroundColor: COLORS.white,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    promoButtonText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
});
