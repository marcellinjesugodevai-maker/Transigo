// =============================================
// TRANSIGO - STUDENT STATUS SCREEN
// =============================================

import { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Image,
    Alert,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@/components/Icon';
import { COLORS, SPACING } from '@/constants';
import { useAuthStore, useLanguageStore, useStudentStatusStore, useThemeStore } from '@/stores';
import { getTranslation } from '@/i18n/translations';

export default function StudentStatusScreen() {
    const { status, submitVerification, resetStatus, mockVerify } = useStudentStatusStore();
    const { language } = useLanguageStore();
    const { colors } = useThemeStore();
    const t = (key: any) => getTranslation(key, language);

    const [university, setUniversity] = useState(status.university || '');
    const [studentId, setStudentId] = useState(status.studentId || '');
    const [loading, setLoading] = useState(false);

    const handleSubmit = () => {
        if (!university || !studentId) {
            Alert.alert(t('error'), language === 'fr' ? 'Veuillez remplir tous les champs' : 'Please fill all fields');
            return;
        }

        setLoading(true);
        // Simulation d'upload
        setTimeout(() => {
            submitVerification({
                university,
                studentId,
                cardImageUri: 'https://via.placeholder.com/400x250.png?text=Carte+Etudiant',
            });
            setLoading(false);
            Alert.alert(t('success'), language === 'fr' ? 'Votre demande a été envoyée avec succès.' : 'Your request has been sent successfully.');
        }, 1500);
    };

    const renderHeader = () => (
        <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            style={styles.header}
        >
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
                activeOpacity={0.8}
            >
                <Icon name="arrow-back" size={24} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('studentStatusTitle')}</Text>
            <View style={{ width: 40 }} />
        </LinearGradient>
    );

    const renderNone = () => (
        <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.infoCard}>
                <Text style={styles.infoEmoji}>🎓</Text>
                <Text style={styles.infoTitle}>{t('studentBenefit')}</Text>
                <Text style={styles.infoText}>
                    {language === 'fr'
                        ? "En tant qu'étudiant, TransiGo vous accompagne dans vos déplacements quotidiens avec une réduction permanente."
                        : "As a student, TransiGo supports you in your daily commutes with a permanent discount."}
                </Text>
            </View>

            <View style={styles.form}>
                <Text style={styles.label}>{t('studentUniversity')}</Text>
                <View style={styles.inputContainer}>
                    <Icon name="school" size={20} color={COLORS.textSecondary} />
                    <TextInput
                        style={styles.input}
                        placeholder="Ex: UFHB, INP-HB..."
                        value={university}
                        onChangeText={setUniversity}
                    />
                </View>

                <Text style={styles.label}>{t('studentIdNumber')}</Text>
                <View style={styles.inputContainer}>
                    <Icon name="card" size={20} color={COLORS.textSecondary} />
                    <TextInput
                        style={styles.input}
                        placeholder={language === 'fr' ? "Votre numéro matricule" : "Your ID number"}
                        value={studentId}
                        onChangeText={setStudentId}
                    />
                </View>

                <Text style={styles.label}>{t('studentCardPhoto')}</Text>
                <TouchableOpacity style={styles.uploadBox} activeOpacity={0.7}>
                    <Icon name="camera" size={32} color={COLORS.primary} />
                    <Text style={styles.uploadText}>
                        {language === 'fr' ? 'Cliquer pour prendre une photo' : 'Click to take a photo'}
                    </Text>
                    <Text style={styles.uploadSubtext}>
                        {language === 'fr' ? 'recto de la carte en cours de validité' : 'front of your valid ID card'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleSubmit}
                    disabled={loading}
                    activeOpacity={0.9}
                >
                    <LinearGradient
                        colors={[COLORS.primary, COLORS.primaryDark]}
                        style={styles.submitButtonGradient}
                    >
                        <Text style={styles.submitButtonText}>
                            {loading
                                ? (language === 'fr' ? 'Envoi en cours...' : 'Sending...')
                                : t('studentSubmit')}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );

    const renderPending = () => (
        <View style={styles.centerContent}>
            <View style={styles.statusIconContainer}>
                <Icon name="time" size={80} color={COLORS.primary} />
            </View>
            <Text style={styles.statusTitle}>Demande en cours</Text>
            <Text style={styles.statusText}>
                Nos équipes vérifient vos informations. Vous recevrez une notification
                dès que votre statut sera validé.
            </Text>
            <Text style={styles.statusTextSmall}>Demande envoyée le {status.submittedAt?.toLocaleDateString() || 'récemment'}</Text>

            {/* Bouton pour simulateur de test */}
            <TouchableOpacity
                style={styles.mockButton}
                onPress={mockVerify}
            >
                <Text style={styles.mockButtonText}>[DEBUG] Simuler Validation</Text>
            </TouchableOpacity>
        </View>
    );

    const renderVerified = () => (
        <View style={styles.centerContent}>
            <View style={[styles.statusIconContainer, { backgroundColor: '#4CAF5020' }]}>
                <Icon name="checkmark-circle" size={80} color="#4CAF50" />
            </View>
            <Text style={[styles.statusTitle, { color: '#4CAF50' }]}>Statut Validé !</Text>
            <Text style={styles.statusText}>
                Félicitations ! Vous bénéficiez désormais de -30% sur tous vos trajets réguliers
                et courses classiques.
            </Text>

            <View style={styles.benefitCard}>
                <Text style={styles.benefitTitle}>Avantage Étudiant Actif</Text>
                <View style={styles.benefitRow}>
                    <Icon name="star" size={16} color={COLORS.primary} />
                    <Text style={styles.benefitText}>Réduction permanente de 30%</Text>
                </View>
                <View style={styles.benefitRow}>
                    <Icon name="flash" size={16} color={COLORS.primary} />
                    <Text style={styles.benefitText}>Accès prioritaire aux services</Text>
                </View>
            </View>

            <TouchableOpacity
                style={styles.resetButton}
                onPress={resetStatus}
            >
                <Text style={styles.resetButtonText}>Réinitialiser (démo)</Text>
            </TouchableOpacity>
        </View>
    );

    const renderRejected = () => (
        <View style={styles.centerContent}>
            <View style={[styles.statusIconContainer, { backgroundColor: '#F4433620' }]}>
                <Icon name="close-circle" size={80} color="#F44336" />
            </View>
            <Text style={[styles.statusTitle, { color: '#F44336' }]}>Demande Rejetée</Text>
            <Text style={styles.statusText}>
                {status.rejectionReason || "Votre carte n'a pas pu être validée. Assurez-vous que la photo est lisible."}
            </Text>

            <TouchableOpacity
                style={styles.submitButton}
                onPress={resetStatus}
                activeOpacity={0.9}
            >
                <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryDark]}
                    style={styles.submitButtonGradient}
                >
                    <Text style={styles.submitButtonText}>Réessayer</Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {renderHeader()}
            {status.status === 'none' && renderNone()}
            {status.status === 'pending' && renderPending()}
            {status.status === 'verified' && renderVerified()}
            {status.status === 'rejected' && renderRejected()}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 50,
        paddingBottom: SPACING.lg,
        paddingHorizontal: SPACING.lg,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    content: {
        padding: SPACING.lg,
    },
    centerContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.xl,
    },
    infoCard: {
        backgroundColor: COLORS.primaryBg,
        borderRadius: 20,
        padding: SPACING.lg,
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    infoEmoji: {
        fontSize: 40,
        marginBottom: SPACING.sm,
    },
    infoTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.primary,
        textAlign: 'center',
        marginBottom: SPACING.sm,
    },
    infoText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },
    form: {
        gap: SPACING.md,
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: -8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 12,
        paddingHorizontal: SPACING.md,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        gap: SPACING.sm,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: COLORS.text,
    },
    uploadBox: {
        height: 150,
        backgroundColor: COLORS.white,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: COLORS.primary,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    uploadText: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.text,
    },
    uploadSubtext: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    submitButton: {
        marginTop: SPACING.md,
        borderRadius: 12,
        overflow: 'hidden',
    },
    submitButtonGradient: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    statusIconContainer: {
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: COLORS.primaryBg,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    statusTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: SPACING.md,
    },
    statusText: {
        fontSize: 15,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: SPACING.lg,
    },
    statusTextSmall: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: SPACING.md,
    },
    benefitCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: SPACING.lg,
        marginTop: SPACING.xl,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    benefitTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: SPACING.md,
    },
    benefitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        marginBottom: SPACING.sm,
    },
    benefitText: {
        fontSize: 14,
        color: COLORS.text,
    },
    mockButton: {
        marginTop: SPACING.xl * 2,
        padding: 10,
    },
    mockButtonText: {
        color: COLORS.primary,
        fontSize: 12,
    },
    resetButton: {
        marginTop: SPACING.lg,
    },
    resetButtonText: {
        color: COLORS.textSecondary,
        fontSize: 13,
    },
});
