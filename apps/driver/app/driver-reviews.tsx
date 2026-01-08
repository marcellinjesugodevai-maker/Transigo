// =============================================
// TRANSIGO BUSINESS - AVIS & REVIEWS
// Historique des notes et avis (À synchroniser avec Supabase)
// =============================================

import { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useDriverStore } from '../src/stores/driverStore';

const COLORS = {
    primary: '#FF6B00',
    secondary: '#00C853',
    secondaryDark: '#00A344',
    white: '#FFFFFF',
    black: '#1A1A2E',
    gray50: '#FAFAFA',
    gray100: '#F5F5F5',
    gray600: '#757575',
};

export default function DriverReviewsScreen() {
    const { driver } = useDriverStore();
    const [loading, setLoading] = useState(true);
    const [reviews, setReviews] = useState<any[]>([]);

    useEffect(() => {
        // TODO: Fetch real reviews from Supabase
        const timer = setTimeout(() => setLoading(false), 1000);
        return () => clearTimeout(timer);
    }, []);

    const renderStars = (rating: number, size: number = 16) => {
        return (
            <View style={{ flexDirection: 'row', gap: 2 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                        key={star}
                        name={star <= rating ? 'star' : 'star-outline'}
                        size={size}
                        color="#FFB800"
                    />
                ))}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <LinearGradient colors={['#FFB800', '#FF9800']} style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>⭐ Mes Avis</Text>
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Rating overview */}
                <View style={styles.overviewCard}>
                    <View style={styles.overviewCenter}>
                        <Text style={styles.overallRating}>{driver?.rating || 5.0}</Text>
                        {renderStars(Math.round(driver?.rating || 5), 24)}
                        <Text style={styles.totalReviews}>Basé sur {driver?.totalRides || 0} courses</Text>
                    </View>
                </View>

                {/* Empty State */}
                {loading ? (
                    <View style={styles.emptyState}>
                        <ActivityIndicator size="large" color={COLORS.secondary} />
                        <Text style={styles.loadingText}>Chargement...</Text>
                    </View>
                ) : reviews.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>💬</Text>
                        <Text style={styles.emptyTitle}>Aucun avis pour le moment</Text>
                        <Text style={styles.emptySubtitle}>
                            Les avis de vos clients apparaîtront ici une fois qu'ils auront noté vos services.
                        </Text>
                    </View>
                ) : null}

                {/* Coming Soon Notice */}
                <View style={styles.comingSoonCard}>
                    <Ionicons name="time-outline" size={24} color={COLORS.primary} />
                    <View style={styles.comingSoonContent}>
                        <Text style={styles.comingSoonTitle}>Système d'avis à venir</Text>
                        <Text style={styles.comingSoonText}>
                            Bientôt, vos clients pourront laisser des avis détaillés après chaque livraison.
                        </Text>
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.gray50 },

    // Header
    header: {
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerContent: { flex: 1, marginLeft: 12 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.white },

    content: { padding: 16 },

    // Overview
    overviewCard: {
        backgroundColor: COLORS.white,
        padding: 24,
        borderRadius: 16,
        marginBottom: 20,
        alignItems: 'center',
    },
    overviewCenter: { alignItems: 'center' },
    overallRating: { fontSize: 56, fontWeight: 'bold', color: COLORS.black },
    totalReviews: { fontSize: 14, color: COLORS.gray600, marginTop: 8 },

    // Empty state
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: COLORS.gray600,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.black,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: COLORS.gray600,
        textAlign: 'center',
        paddingHorizontal: 32,
        lineHeight: 20,
    },

    // Coming soon
    comingSoonCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF3E0',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#FFE0B2',
        marginTop: 20,
    },
    comingSoonContent: {
        flex: 1,
        marginLeft: 12,
    },
    comingSoonTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 4,
    },
    comingSoonText: {
        fontSize: 12,
        color: COLORS.gray600,
        lineHeight: 18,
    },
});
