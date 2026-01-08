// =============================================
// TRANSIGO - LOGIN SCREEN (Phone + Password)
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
    Image,
    Linking,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@/components/Icon';
import { COLORS, SPACING, RADIUS } from '@/constants';
import { useAuthStore } from '@/stores';
import { supabase, userService } from '@/services/supabaseService';
import { pushNotificationService } from '@/services/pushNotificationService';

type AuthMode = 'login' | 'register';

export default function LoginScreen() {
    const [mode, setMode] = useState<AuthMode>('login');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuthStore();

    const formatPhone = (p: string) => {
        const cleaned = p.replace(/\D/g, '');
        return `+225${cleaned}`;
    };

    const handleLogin = async () => {
        if (phone.length < 10) {
            Alert.alert('Erreur', 'Numéro de téléphone invalide');
            return;
        }
        if (password.length < 6) {
            Alert.alert('Erreur', 'Mot de passe trop court (min 6 caractères)');
            return;
        }

        setIsLoading(true);

        try {
            const formattedPhone = formatPhone(phone);

            // Check if user exists
            const { data: user, error } = await supabase
                .from('users')
                .select('*')
                .eq('phone', formattedPhone)
                .single();

            if (error || !user) {
                Alert.alert('Erreur', 'Compte non trouvé. Inscrivez-vous d\'abord.');
                return;
            }

            // Verify password (simple comparison for demo - use bcrypt in production)
            if (user.password !== password) {
                Alert.alert('Erreur', 'Mot de passe incorrect');
                return;
            }

            // Login successful
            const userData = {
                id: user.id,
                phone: user.phone,
                email: user.email || '',
                firstName: user.first_name,
                lastName: user.last_name || '',
                role: 'passenger' as const,
                isVerified: true,
                language: 'fr' as const,
                createdAt: new Date(user.created_at),
                updatedAt: new Date(user.updated_at || Date.now()),
            };

            login(userData, user.id);

            // Register Push Token
            try {
                const pushToken = await pushNotificationService.registerForPushNotificationsAsync();
                if (pushToken) {
                    await userService.updatePushToken(user.id, pushToken);
                }
            } catch (e) {
                console.log('Error registering push token on login:', e);
            }

            router.replace('/(tabs)/home');

        } catch (error: any) {
            console.error(error);
            Alert.alert('Erreur', error.message || 'Connexion échouée');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async () => {
        if (phone.length < 10) {
            Alert.alert('Erreur', 'Numéro de téléphone invalide');
            return;
        }
        if (!firstName.trim()) {
            Alert.alert('Erreur', 'Prénom requis');
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
            const formattedPhone = formatPhone(phone);

            // Check if already exists
            const { data: existing } = await supabase
                .from('users')
                .select('id')
                .eq('phone', formattedPhone)
                .single();

            if (existing) {
                Alert.alert('Erreur', 'Ce numéro est déjà inscrit. Connectez-vous.');
                setMode('login');
                return;
            }

            // Create user
            const { data: newUser, error } = await supabase
                .from('users')
                .insert({
                    phone: formattedPhone,
                    first_name: firstName.trim(),
                    password: password, // In production, HASH this!
                })
                .select()
                .single();

            if (error) throw error;

            Alert.alert('Succès', 'Compte créé ! Vous pouvez maintenant vous connecter.');
            setMode('login');
            setPassword('');
            setConfirmPassword('');

        } catch (error: any) {
            console.error(error);
            Alert.alert('Erreur', error.message || 'Inscription échouée');
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = () => {
        const message = encodeURIComponent('Bonjour, j\'ai oublié mon mot de passe TransiGo. Mon numéro: ' + phone);
        Linking.openURL(`https://wa.me/2250141628232?text=${message}`);
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Logo */}
                <View style={styles.logoContainer}>
                    <Image
                        source={require('../../assets/logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <Text style={styles.appName}>TransiGo</Text>
                    <Text style={styles.subtitle}>VTC Côte d'Ivoire</Text>
                </View>

                {/* Mode Toggle */}
                <View style={styles.modeToggle}>
                    <TouchableOpacity
                        style={[styles.modeBtn, mode === 'login' && styles.modeBtnActive]}
                        onPress={() => setMode('login')}
                    >
                        <Text style={[styles.modeBtnText, mode === 'login' && styles.modeBtnTextActive]}>
                            Connexion
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.modeBtn, mode === 'register' && styles.modeBtnActive]}
                        onPress={() => setMode('register')}
                    >
                        <Text style={[styles.modeBtnText, mode === 'register' && styles.modeBtnTextActive]}>
                            Inscription
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    {mode === 'register' && (
                        <View style={styles.inputContainer}>
                            <Icon name="person-outline" size={20} color={COLORS.gray} />
                            <TextInput
                                style={styles.input}
                                placeholder="Prénom"
                                placeholderTextColor={COLORS.gray}
                                value={firstName}
                                onChangeText={setFirstName}
                            />
                        </View>
                    )}

                    <View style={styles.inputContainer}>
                        <Text style={styles.phonePrefix}>🇨🇮 +225</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Numéro de téléphone"
                            placeholderTextColor={COLORS.gray}
                            keyboardType="phone-pad"
                            value={phone}
                            onChangeText={setPhone}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Icon name="lock-closed-outline" size={20} color={COLORS.gray} />
                        <TextInput
                            style={styles.input}
                            placeholder="Mot de passe"
                            placeholderTextColor={COLORS.gray}
                            secureTextEntry={!showPassword}
                            value={password}
                            onChangeText={setPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            <Icon
                                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                size={20}
                                color={COLORS.gray}
                            />
                        </TouchableOpacity>
                    </View>

                    {mode === 'register' && (
                        <View style={styles.inputContainer}>
                            <Icon name="lock-closed-outline" size={20} color={COLORS.gray} />
                            <TextInput
                                style={styles.input}
                                placeholder="Confirmer le mot de passe"
                                placeholderTextColor={COLORS.gray}
                                secureTextEntry={!showPassword}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                            />
                        </View>
                    )}

                    {mode === 'login' && (
                        <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotBtn}>
                            <Text style={styles.forgotText}>Mot de passe oublié ? Contactez WhatsApp</Text>
                        </TouchableOpacity>
                    )}

                    {/* Submit Button */}
                    <TouchableOpacity
                        onPress={mode === 'login' ? handleLogin : handleRegister}
                        disabled={isLoading}
                        style={styles.submitBtn}
                    >
                        <LinearGradient
                            colors={['#f97316', '#ea580c']}
                            style={styles.gradient}
                        >
                            <Text style={styles.submitText}>
                                {isLoading ? 'Chargement...' : mode === 'login' ? 'Se connecter' : 'S\'inscrire'}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
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
        padding: SPACING.lg,
        justifyContent: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logo: {
        width: 100,
        height: 100,
    },
    appName: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginTop: SPACING.sm,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.gray,
        marginTop: 4,
    },
    modeToggle: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9',
        borderRadius: RADIUS.lg,
        padding: 4,
        marginBottom: SPACING.xl,
    },
    modeBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: RADIUS.md,
        alignItems: 'center',
    },
    modeBtnActive: {
        backgroundColor: COLORS.white,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    modeBtnText: {
        fontSize: 14,
        color: COLORS.gray,
        fontWeight: '500',
    },
    modeBtnTextActive: {
        color: COLORS.primary,
        fontWeight: '600',
    },
    form: {
        gap: SPACING.md,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: RADIUS.md,
        paddingHorizontal: SPACING.md,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        gap: SPACING.sm,
    },
    phonePrefix: {
        fontSize: 14,
        color: COLORS.black,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: COLORS.black,
    },
    forgotBtn: {
        alignSelf: 'flex-end',
    },
    forgotText: {
        color: COLORS.primary,
        fontSize: 13,
    },
    submitBtn: {
        marginTop: SPACING.md,
        borderRadius: RADIUS.md,
        overflow: 'hidden',
    },
    gradient: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    submitText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
    },
});
