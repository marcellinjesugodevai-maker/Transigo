// =============================================
// TRANSIGO BUSINESS - PENDING VALIDATION SCREEN
// Écran d'attente après soumission des documents
// =============================================

import { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Linking,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../src/services/supabaseService';
import { useDriverStore } from '../../src/stores/driverStore';

const COLORS = {
    primary: '#00C853',
    primaryDark: '#00A344',
    white: '#FFFFFF',
    black: '#1A1A2E',
    gray100: '#F5F5F5',
    gray300: '#E0E0E0',
    gray600: '#757575',
    success: '#4CAF50',
    warning: '#FF9800',
    info: '#2196F3',
};

const WHATSAPP_NUMBER = '+2250141628232';

interface Step {
    id: number;
    title: string;
    description: string;
    emoji: string;
    status: 'completed' | 'current' | 'pending';
}

export default function RegisterPendingScreen() {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const { driver } = useDriverStore();

    const steps: Step[] = [
        {
            id: 1,
            title: 'Documents envoyés',
            description: 'Vos documents ont été soumis avec succès',
            emoji: '📄',
            status: 'completed',
        },
        {
            id: 2,
            title: 'Vérification en cours',
            description: 'Notre équipe examine votre dossier (24-72h)',
            emoji: '🔍',
            status: 'current',
        },
        {
            id: 3,
            title: 'Appel de confirmation',
            description: 'Vous serez contacté par téléphone ou WhatsApp',
            emoji: '📞',
            status: 'pending',
        },
        {
            id: 4,
            title: 'Visite à l\'agence',
            description: 'Remise des documents originaux',
            emoji: '🏢',
            status: 'pending',
        },
    ];

    const documentsToPresent = (() => {
        if (driver?.profileType === 'delivery') {
            return [
                'Photo d\'identité (originale)',
                'CNI ou Passeport (original)',
                'Attestation de résidence (originale)',
            ];
        }
        return [
            'CNI ou Passeport (original)',
            'Permis de conduire (original)',
            'Carte grise du véhicule (original)',
            'Attestation d\'assurance (original)',
            'Photo d\'identité récente',
        ];
    })();

    const handleRefreshStatus = async () => {
        if (!driver?.id) return;

        setIsRefreshing(true);
        try {
            const { data, error } = await supabase
                .from('drivers')
                .select('is_verified')
                .eq('id', driver.id)
                .single();

            if (error) throw error;

            if (data?.is_verified) {
                // Update local store
                useDriverStore.getState().setDriver({
                    ...driver,
                    isVerified: true,
                });
                Alert.alert(
                    '🎉 Félicitations !',
                    'Votre compte a été validé. Vous pouvez maintenant recevoir des courses !',
                    [{ text: 'Commencer', onPress: () => router.replace('/(tabs)/home') }]
                );
            } else {
                Alert.alert(
                    'En cours de traitement',
                    'Votre dossier est toujours en cours de vérification. Vous serez contacté sous 72h.'
                );
            }
        } catch (error) {
            console.error('Error checking status:', error);
            Alert.alert('Erreur', 'Impossible de vérifier le statut. Réessayez plus tard.');
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleWhatsAppContact = () => {
        const message = encodeURIComponent(
            `Bonjour, je suis ${driver?.firstName || 'un nouveau partenaire'} et j'ai soumis mon dossier d'inscription sur TransiGo Business. J'aimerais avoir des informations sur l'état de ma demande.`
        );
        Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}?text=${message}`);
    };

    const handleCallAgency = () => {
        Linking.openURL(`tel:${WHATSAPP_NUMBER}`);
    };

    const getStepStyle = (status: Step['status']) => {
        switch (status) {
            case 'completed':
                return { bg: COLORS.success, icon: 'checkmark' as const };
            case 'current':
                return { bg: COLORS.warning, icon: null };
            case 'pending':
                return { bg: COLORS.gray300, icon: null };
        }
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                style={styles.header}
            >
                <View style={styles.successIconContainer}>
                    <Text style={{ fontSize: 70, color: COLORS.white }}>✅</Text>
                </View>
                <Text style={styles.headerTitle}>Dossier Soumis !</Text>
                <Text style={styles.headerSubtitle}>
                    Votre demande est en cours de traitement
                </Text>
            </LinearGradient>

            {/* Timeline */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>📋 Étapes de validation</Text>
                <View style={styles.timeline}>
                    {steps.map((step, index) => {
                        const stepStyle = getStepStyle(step.status);
                        return (
                            <View key={step.id} style={styles.timelineItem}>
                                <View style={styles.timelineLeft}>
                                    <View style={[styles.timelineDot, { backgroundColor: stepStyle.bg }]}>
                                        {step.status === 'completed' ? (
                                            <Text style={{ fontSize: 14, color: COLORS.white }}>✅</Text>
                                        ) : step.status === 'current' ? (
                                            <ActivityIndicator size="small" color={COLORS.white} />
                                        ) : (
                                            <Text style={styles.stepNumber}>{step.id}</Text>
                                        )}
                                    </View>
                                    {index < steps.length - 1 && (
                                        <View style={[
                                            styles.timelineLine,
                                            { backgroundColor: step.status === 'completed' ? COLORS.success : COLORS.gray300 }
                                        ]} />
                                    )}
                                </View>
                                <View style={styles.timelineContent}>
                                    <View style={styles.timelineHeader}>
                                        <Text style={{ fontSize: 18 }}>{step.emoji}</Text>
                                        <Text style={[
                                            styles.timelineTitle,
                                            step.status === 'pending' && { color: COLORS.gray600 }
                                        ]}>
                                            {step.title}
                                        </Text>
                                    </View>
                                    <Text style={styles.timelineDescription}>{step.description}</Text>
                                </View>
                            </View>
                        );
                    })}
                </View>
            </View>

            {/* Info Card - Contact */}
            <View style={styles.section}>
                <View style={[styles.infoCard, { borderLeftColor: COLORS.info }]}>
                    <View style={styles.infoCardHeader}>
                        <Text style={{ fontSize: 22 }}>📞</Text>
                        <Text style={styles.infoCardTitle}>Vous serez contacté sous 72h</Text>
                    </View>
                    <Text style={styles.infoCardText}>
                        Notre équipe vous appellera ou vous contactera via WhatsApp pour confirmer
                        votre inscription et planifier votre visite à l'agence.
                    </Text>
                </View>
            </View>

            {/* Documents to bring */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>📁 Documents à apporter à l'agence</Text>
                <View style={styles.documentsCard}>
                    {documentsToPresent.map((doc, index) => (
                        <View key={index} style={styles.documentItem}>
                            <Text style={{ fontSize: 18 }}>📁</Text>
                            <Text style={styles.documentText}>{doc}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* Contact Buttons */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>💬 Une question ?</Text>
                <View style={styles.contactButtons}>
                    <TouchableOpacity style={styles.whatsappButton} onPress={handleWhatsAppContact}>
                        <Text style={{ fontSize: 22 }}>💬</Text>
                        <Text style={styles.whatsappButtonText}>Contacter via WhatsApp</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.callButton} onPress={handleCallAgency}>
                        <Text style={{ fontSize: 22 }}>📞</Text>
                        <Text style={styles.callButtonText}>Appeler l'agence</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Refresh Status Button */}
            <View style={styles.section}>
                <TouchableOpacity
                    style={styles.refreshButton}
                    onPress={handleRefreshStatus}
                    disabled={isRefreshing}
                >
                    {isRefreshing ? (
                        <ActivityIndicator color={COLORS.primary} />
                    ) : (
                        <>
                            <Text style={{ fontSize: 18 }}>🔄</Text>
                            <Text style={styles.refreshButtonText}>Actualiser mon statut</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            {/* Logout / Reset Button */}
            <View style={styles.section}>
                <TouchableOpacity
                    style={[styles.refreshButton, { borderColor: 'red', marginTop: -10 }]}
                    onPress={() => {
                        Alert.alert(
                            'Se déconnecter',
                            'Voulez-vous vous déconnecter et recommencer ?',
                            [
                                { text: 'Annuler', style: 'cancel' },
                                {
                                    text: 'Déconnexion',
                                    style: 'destructive',
                                    onPress: () => {
                                        useDriverStore.getState().setDriver(null as any);
                                        router.replace('/(auth)/login');
                                    }
                                }
                            ]
                        );
                    }}
                >
                    <Text style={{ fontSize: 18 }}>🚪</Text>
                    <Text style={[styles.refreshButtonText, { color: 'red' }]}>Se déconnecter</Text>
                </TouchableOpacity>
            </View>

            {/* Footer Note */}
            <View style={styles.footerNote}>
                <Text style={{ fontSize: 14 }}>ℹ️</Text>
                <Text style={styles.footerNoteText}>
                    Vous recevrez une notification dès que votre compte sera validé.
                </Text>
            </View>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.gray100,
    },
    header: {
        paddingTop: 60,
        paddingBottom: 40,
        paddingHorizontal: 20,
        alignItems: 'center',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    successIconContainer: {
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.white,
        textAlign: 'center',
    },
    headerSubtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        marginTop: 8,
    },
    section: {
        paddingHorizontal: 20,
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.black,
        marginBottom: 16,
    },
    timeline: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    timelineItem: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    timelineLeft: {
        alignItems: 'center',
        width: 40,
    },
    timelineDot: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepNumber: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.gray600,
    },
    timelineLine: {
        width: 2,
        flex: 1,
        marginTop: 4,
        minHeight: 30,
    },
    timelineContent: {
        flex: 1,
        paddingLeft: 12,
    },
    timelineHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    timelineTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.black,
    },
    timelineDescription: {
        fontSize: 14,
        color: COLORS.gray600,
        marginTop: 4,
    },
    infoCard: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 16,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    infoCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
    },
    infoCardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.black,
        flex: 1,
    },
    infoCardText: {
        fontSize: 14,
        color: COLORS.gray600,
        lineHeight: 22,
    },
    documentsCard: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    documentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray100,
    },
    documentText: {
        fontSize: 15,
        color: COLORS.black,
        flex: 1,
    },
    contactButtons: {
        gap: 12,
    },
    whatsappButton: {
        backgroundColor: '#25D366',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 14,
        borderRadius: 12,
    },
    whatsappButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
    },
    callButton: {
        backgroundColor: COLORS.white,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    callButtonText: {
        color: COLORS.primary,
        fontSize: 16,
        fontWeight: '600',
    },
    refreshButton: {
        backgroundColor: COLORS.white,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.gray300,
    },
    refreshButtonText: {
        color: COLORS.primary,
        fontSize: 15,
        fontWeight: '500',
    },
    footerNote: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingHorizontal: 20,
        marginTop: 24,
    },
    footerNoteText: {
        fontSize: 13,
        color: COLORS.gray600,
        textAlign: 'center',
    },
});
