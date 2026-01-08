// =============================================
// TRANSIGO - GROUP RIDE INVITATION SCREEN
// =============================================

import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@/components/Icon';
import { COLORS, SPACING } from '@/constants';

export default function GroupRideInviteScreen() {
    const { inviteId } = useLocalSearchParams();

    // Mock data - normalement venant du backend
    const invitation = {
        initiatorName: 'Jean Kouassi',
        pickup: 'Cocody, Riviera 2',
        dropoff: 'Plateau, Centre-ville',
        scheduledTime: '18:00',
        amount: 625, // 2500/4 personnes
        totalParticipants: 4,
    };

    const handleAccept = () => {
        Alert.alert(
            'Paiement',
            `Confirmez le paiement de ${invitation.amount} FCFA`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Payer',
                    onPress: () => {
                        Alert.alert('Succès !', 'Paiement effectué. Course confirmée.', [
                            { text: 'OK', onPress: () => router.replace('/(tabs)/home') },
                        ]);
                    },
                },
            ]
        );
    };

    const handleDecline = () => {
        Alert.alert('Refusé', 'Vous avez refusé cette invitation.', [
            { text: 'OK', onPress: () => router.replace('/(tabs)/home') },
        ]);
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                style={styles.header}
            >
                <Text style={styles.headerIcon}>👥</Text>
                <Text style={styles.headerTitle}>Invitation Course Groupée</Text>
            </LinearGradient>

            <View style={styles.content}>
                {/* Initiator */}
                <View style={styles.initiatorCard}>
                    <Text style={styles.initiatorLabel}>Organisateur</Text>
                    <Text style={styles.initiatorName}>{invitation.initiatorName}</Text>
                </View>

                {/* Route */}
                <View style={styles.routeCard}>
                    <Text style={styles.cardTitle}>Itinéraire</Text>
                    <View style={styles.routePoint}>
                        <View style={styles.pickupDot} />
                        <Text style={styles.locationText}>{invitation.pickup}</Text>
                    </View>
                    <View style={styles.routeLine} />
                    <View style={styles.routePoint}>
                        <View style={styles.dropoffDot} />
                        <Text style={styles.locationText}>{invitation.dropoff}</Text>
                    </View>
                </View>

                {/* Details */}
                <View style={styles.detailsCard}>
                    <View style={styles.detailRow}>
                        <Icon name="time" size={20} color={COLORS.textSecondary} />
                        <Text style={styles.detailText}>Départ : {invitation.scheduledTime}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Icon name="people" size={20} color={COLORS.textSecondary} />
                        <Text style={styles.detailText}>{invitation.totalParticipants} personnes</Text>
                    </View>
                </View>

                {/* Price */}
                <View style={styles.priceCard}>
                    <Text style={styles.priceLabel}>Votre part</Text>
                    <Text style={styles.priceValue}>{invitation.amount.toLocaleString('fr-FR')} F</Text>
                    <Text style={styles.priceSubtext}>
                        Prix total divisé par {invitation.totalParticipants} personnes
                    </Text>
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={styles.declineButton}
                        onPress={handleDecline}
                        activeOpacity={0.9}
                    >
                        <Text style={styles.declineButtonText}>Refuser</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.acceptButton}
                        onPress={handleAccept}
                        activeOpacity={0.9}
                    >
                        <LinearGradient
                            colors={['#4CAF50', '#2E7D32']}
                            style={styles.acceptButtonGradient}
                        >
                            <Text style={styles.acceptButtonText}>Accepter & Payer</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
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
        alignItems: 'center',
        paddingTop: 60,
        paddingBottom: SPACING.xl,
        paddingHorizontal: SPACING.lg,
    },
    headerIcon: {
        fontSize: 60,
        marginBottom: SPACING.sm,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    content: {
        flex: 1,
        padding: SPACING.lg,
    },
    initiatorCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: SPACING.lg,
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    initiatorLabel: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 4,
    },
    initiatorName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    routeCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: SPACING.lg,
        marginBottom: SPACING.md,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: SPACING.md,
    },
    routePoint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    pickupDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#4CAF50',
    },
    dropoffDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: COLORS.primary,
    },
    routeLine: {
        width: 2,
        height: 20,
        backgroundColor: COLORS.background,
        marginLeft: 5,
        marginVertical: 4,
    },
    locationText: {
        flex: 1,
        fontSize: 15,
        color: COLORS.text,
    },
    detailsCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: SPACING.lg,
        gap: SPACING.sm,
        marginBottom: SPACING.md,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    detailText: {
        fontSize: 15,
        color: COLORS.text,
    },
    priceCard: {
        backgroundColor: COLORS.primaryBg,
        borderRadius: 16,
        padding: SPACING.xl,
        alignItems: 'center',
        marginBottom: SPACING.xl,
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    priceLabel: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 4,
    },
    priceValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 4,
    },
    priceSubtext: {
        fontSize: 12,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    actions: {
        flexDirection: 'row',
        gap: SPACING.sm,
        marginTop: 'auto',
    },
    declineButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#F44336',
        alignItems: 'center',
    },
    declineButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#F44336',
    },
    acceptButton: {
        flex: 1,
        borderRadius: 16,
        overflow: 'hidden',
    },
    acceptButtonGradient: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    acceptButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.white,
    },
});
