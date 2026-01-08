// =============================================
// TRANSIGO - REGISTER SCREEN
// =============================================

import { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@/components/Icon';
import { COLORS, SPACING, RADIUS } from '@/constants';
import { isValidEmail, isValidIvorianPhone } from '@transigo/shared';

export default function RegisterScreen() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isStudent, setIsStudent] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleRegister = async () => {
        // Validation
        if (!firstName || !lastName) {
            Alert.alert('Erreur', 'Veuillez entrer votre nom complet');
            return;
        }
        if (!isValidIvorianPhone(phone)) {
            Alert.alert('Erreur', 'Numéro de téléphone invalide');
            return;
        }
        if (email && !isValidEmail(email)) {
            Alert.alert('Erreur', 'Email invalide');
            return;
        }
        if (password.length < 6) {
            Alert.alert('Erreur', 'Mot de passe trop court (min 6 caractères)');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
            return;
        }

        setIsLoading(true);

        try {
            // TODO: Implement actual registration API call
            await new Promise((resolve) => setTimeout(resolve, 1500));

            // Navigate to OTP verification
            router.push({
                pathname: '/(auth)/verify',
                params: { phone, isNewUser: 'true' },
            });
        } catch (error) {
            Alert.alert('Erreur', 'Inscription échouée. Veuillez réessayer.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                {/* Header */}
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Icon name="arrow-back" size={24} color={COLORS.black} />
                </TouchableOpacity>

                <View style={styles.header}>
                    <Text style={styles.title}>Créer un compte</Text>
                    <Text style={styles.subtitle}>
                        Rejoignez TransiGo et voyagez malin !
                    </Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    {/* Name Row */}
                    <View style={styles.row}>
                        <View style={[styles.inputContainer, { flex: 1 }]}>
                            <TextInput
                                style={styles.input}
                                placeholder="Prénom"
                                placeholderTextColor={COLORS.gray400}
                                value={firstName}
                                onChangeText={setFirstName}
                            />
                        </View>
                        <View style={[styles.inputContainer, { flex: 1 }]}>
                            <TextInput
                                style={styles.input}
                                placeholder="Nom"
                                placeholderTextColor={COLORS.gray400}
                                value={lastName}
                                onChangeText={setLastName}
                            />
                        </View>
                    </View>

                    {/* Phone */}
                    <View style={styles.inputContainer}>
                        <View style={styles.phonePrefix}>
                            <Text style={styles.phonePrefixText}>🇨🇮 +225</Text>
                        </View>
                        <TextInput
                            style={styles.phoneInput}
                            placeholder="07 XX XX XX XX"
                            placeholderTextColor={COLORS.gray400}
                            keyboardType="phone-pad"
                            value={phone}
                            onChangeText={setPhone}
                            maxLength={14}
                        />
                    </View>

                    {/* Email (Optional) */}
                    <View style={styles.inputContainer}>
                        <Icon
                            name="mail-outline"
                            size={22}
                            color={COLORS.gray500}
                            style={styles.inputIcon}
                        />
                        <TextInput
                            style={styles.inputWithIcon}
                            placeholder="Email (optionnel)"
                            placeholderTextColor={COLORS.gray400}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={email}
                            onChangeText={setEmail}
                        />
                    </View>

                    {/* Password */}
                    <View style={styles.inputContainer}>
                        <Icon
                            name="lock-closed-outline"
                            size={22}
                            color={COLORS.gray500}
                            style={styles.inputIcon}
                        />
                        <TextInput
                            style={styles.inputWithIcon}
                            placeholder="Mot de passe"
                            placeholderTextColor={COLORS.gray400}
                            secureTextEntry={!showPassword}
                            value={password}
                            onChangeText={setPassword}
                        />
                        <TouchableOpacity
                            onPress={() => setShowPassword(!showPassword)}
                            style={styles.eyeIcon}
                        >
                            <Icon
                                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                size={22}
                                color={COLORS.gray500}
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Confirm Password */}
                    <View style={styles.inputContainer}>
                        <Icon
                            name="lock-closed-outline"
                            size={22}
                            color={COLORS.gray500}
                            style={styles.inputIcon}
                        />
                        <TextInput
                            style={styles.inputWithIcon}
                            placeholder="Confirmer mot de passe"
                            placeholderTextColor={COLORS.gray400}
                            secureTextEntry={!showPassword}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                        />
                    </View>

                    {/* Student Toggle */}
                    <TouchableOpacity
                        style={styles.studentToggle}
                        onPress={() => setIsStudent(!isStudent)}
                    >
                        <View
                            style={[
                                styles.checkbox,
                                isStudent && styles.checkboxChecked,
                            ]}
                        >
                            {isStudent && (
                                <Icon name="checkmark" size={16} color={COLORS.white} />
                            )}
                        </View>
                        <View style={styles.studentInfo}>
                            <Text style={styles.studentText}>Je suis étudiant</Text>
                            <Text style={styles.studentSubtext}>
                                Bénéficiez de -30% sur toutes vos courses
                            </Text>
                        </View>
                        <View style={styles.studentBadge}>
                            <Text style={styles.studentBadgeText}>-30%</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Register Button - Pill Style */}
                    <TouchableOpacity
                        style={styles.registerButton}
                        onPress={handleRegister}
                        disabled={isLoading}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={[COLORS.primary, COLORS.primaryDark]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.registerButtonGradient}
                        >
                            <View style={styles.buttonContent}>
                                <Text style={styles.registerButtonText}>
                                    {isLoading ? 'Inscription...' : "S'inscrire"}
                                </Text>
                                <Icon name="arrow-forward" size={20} color={COLORS.white} />
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* Login Link */}
                <View style={styles.loginContainer}>
                    <Text style={styles.loginText}>Déjà un compte ?</Text>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text style={styles.loginLink}>Se connecter</Text>
                    </TouchableOpacity>
                </View>

                {/* Terms */}
                <Text style={styles.terms}>
                    En vous inscrivant, vous acceptez nos{' '}
                    <Text style={styles.termsLink}>Conditions d'utilisation</Text> et
                    notre <Text style={styles.termsLink}>Politique de confidentialité</Text>
                </Text>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: SPACING['2xl'],
        paddingTop: 60,
        paddingBottom: 40,
    },
    backButton: {
        marginBottom: SPACING.lg,
    },
    header: {
        marginBottom: SPACING['2xl'],
    },
    title: {
        fontSize: 28,
        fontFamily: 'Poppins-Bold',
        color: COLORS.black,
        marginBottom: SPACING.sm,
    },
    subtitle: {
        fontSize: 16,
        fontFamily: 'Poppins-Regular',
        color: COLORS.gray600,
    },
    form: {
        marginBottom: SPACING['2xl'],
    },
    row: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.gray100,
        borderRadius: RADIUS.lg,
        marginBottom: SPACING.lg,
        overflow: 'hidden',
    },
    input: {
        flex: 1,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.lg,
        fontSize: 16,
        fontFamily: 'Poppins-Regular',
        color: COLORS.black,
    },
    inputIcon: {
        paddingLeft: SPACING.lg,
    },
    inputWithIcon: {
        flex: 1,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.lg,
        fontSize: 16,
        fontFamily: 'Poppins-Regular',
        color: COLORS.black,
    },
    phonePrefix: {
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.lg,
        backgroundColor: COLORS.gray200,
    },
    phonePrefixText: {
        fontSize: 16,
        fontFamily: 'Poppins-Medium',
        color: COLORS.black,
    },
    phoneInput: {
        flex: 1,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.lg,
        fontSize: 16,
        fontFamily: 'Poppins-Regular',
        color: COLORS.black,
    },
    eyeIcon: {
        paddingRight: SPACING.lg,
    },
    studentToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.secondaryBg,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        marginBottom: SPACING.xl,
        borderWidth: 1,
        borderColor: COLORS.secondary,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: COLORS.secondary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    checkboxChecked: {
        backgroundColor: COLORS.secondary,
    },
    studentInfo: {
        flex: 1,
    },
    studentText: {
        fontSize: 16,
        fontFamily: 'Poppins-SemiBold',
        color: COLORS.black,
    },
    studentSubtext: {
        fontSize: 12,
        fontFamily: 'Poppins-Regular',
        color: COLORS.gray600,
    },
    studentBadge: {
        backgroundColor: COLORS.secondary,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
        borderRadius: RADIUS.md,
    },
    studentBadgeText: {
        fontSize: 14,
        fontFamily: 'Poppins-Bold',
        color: COLORS.white,
    },
    registerButton: {
        borderRadius: RADIUS.full,
        overflow: 'hidden',
        marginTop: SPACING.md,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 15,
        elevation: 10,
        transform: [{ scale: 1 }],
    },
    registerButtonGradient: {
        paddingVertical: 16,
        paddingHorizontal: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    registerButtonText: {
        fontSize: 18,
        fontFamily: 'Poppins-Bold',
        color: COLORS.white,
        letterSpacing: 0.5,
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: SPACING.xs,
        marginBottom: SPACING.xl,
    },
    loginText: {
        fontSize: 14,
        fontFamily: 'Poppins-Regular',
        color: COLORS.gray600,
    },
    loginLink: {
        fontSize: 14,
        fontFamily: 'Poppins-SemiBold',
        color: COLORS.primary,
    },
    terms: {
        fontSize: 12,
        fontFamily: 'Poppins-Regular',
        color: COLORS.gray500,
        textAlign: 'center',
        lineHeight: 18,
    },
    termsLink: {
        color: COLORS.primary,
        fontFamily: 'Poppins-Medium',
    },
});

