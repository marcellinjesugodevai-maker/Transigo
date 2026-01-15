// =============================================
// TRANSIGO DRIVER - LOGIN SCREEN (Phone + Password)
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
import { router } from 'expo-router'; // Fix: Import router
import { WelcomeImage } from '../onboarding/welcomeAsset';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase, driverService } from '../../src/services/supabaseService';
import { useDriverStore } from '../../src/stores/driverStore';
import { pushNotificationService } from '../../src/services/pushNotificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AuthMode = 'login' | 'register';

const COLORS = {
    primary: '#00C853', // Green 600
    white: '#ffffff',
    black: '#1a1a1a',
    gray: '#6b7280',
    lightGreen: '#DCFCE7',
};

export default function LoginScreen() {
    const [mode, setMode] = useState<AuthMode>('login');

    // Login State
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');

    // Register State
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

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

            const { data: driver, error } = await supabase
                .from('drivers')
                .select('*')
                .eq('phone', formattedPhone)
                .single();

            if (error || !driver) {
                Alert.alert('Erreur', 'Compte chauffeur non trouvé. Inscrivez-vous d\'abord.');
                return;
            }

            if (driver.password !== password) {
                Alert.alert('Erreur', 'Mot de passe incorrect');
                return;
            }

            useDriverStore.getState().setDriver({
                id: driver.id,
                firstName: driver.first_name,
                lastName: driver.last_name,
                phone: driver.phone,
                email: driver.email || '',
                rating: driver.rating || 5.0,
                totalRides: driver.total_rides || 0,
                level: driver.level || 'bronze',
                commissionRate: driver.commission_rate || 15,
                joinedAt: new Date(driver.created_at),
                isVerified: driver.is_verified,
                vehiclePlate: driver.vehicle_plate,
                profileType: driver.profile_type
            });

            if (driver.vehicle_brand) {
                useDriverStore.getState().setVehicle({
                    id: 'veh-' + driver.id,
                    brand: driver.vehicle_brand,
                    model: driver.vehicle_model,
                    year: driver.vehicle_year,
                    plate: driver.vehicle_plate,
                    color: driver.vehicle_color,
                    type: driver.vehicle_type || 'standard',
                });
            }

            try {
                const pushToken = await pushNotificationService.registerForPushNotificationsAsync();
                if (pushToken) {
                    await driverService.updatePushToken(driver.id, pushToken);
                }
            } catch (e) {
                console.log('Error registering push token on login:', e);
            }

            // Mettre à jour hasSeenOnboarding pour éviter le retour à l'intro
            await AsyncStorage.setItem('hasSeenOnboarding', 'true');

            // REDIRECTION LOGIC
            if (driver.vehicle_plate === 'PENDING') {
                // Step 1: New Account -> Onboarding
                Alert.alert('Compte Créé', 'Veuillez finaliser votre inscription véhicule.');
                router.replace('/onboarding/intro');
            } else if (!driver.is_verified) {
                // Step 2: Documents Submitted but Not Verified -> Status Screen
                router.replace('/(auth)/register-success');
            } else {
                // Step 3: Verified -> Home
                Alert.alert('Bienvenue !', `Bonjour ${driver.first_name} 👋`);
                router.replace('/(tabs)/home');
            }

        } catch (error: any) {
            console.error(error);
            Alert.alert('Erreur', error.message || 'Connexion échouée');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async () => {
        if (!firstName || !lastName || !phone || !password) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
            return;
        }

        setIsLoading(true);
        try {
            const formattedPhone = formatPhone(phone);

            // Check duplicate
            const { data: existing } = await supabase.from('drivers').select('id').eq('phone', formattedPhone).single();
            if (existing) {
                Alert.alert('Erreur', 'Ce numéro est déjà inscrit. Connectez-vous.');
                setIsLoading(false);
                setMode('login');
                return;
            }

            // Insert new driver (profile_type NOT set yet - will be set in choose-profile screen)
            const { data: newDriver, error } = await supabase.from('drivers').insert({
                first_name: firstName,
                last_name: lastName,
                phone: formattedPhone,
                password: password,
                is_verified: false,
                is_online: false,
                // profile_type et vehicle_type seront définis dans l'écran de choix de profil
                vehicle_plate: 'PENDING', // Required by DB
                rating: 5.0
            }).select().single();

            if (error) throw error;

            // Auto Login (sans profileType - sera défini dans choose-profile)
            useDriverStore.getState().setDriver({
                id: newDriver.id,
                firstName: newDriver.first_name,
                lastName: newDriver.last_name,
                phone: newDriver.phone,
                email: newDriver.email || '',
                rating: 5.0,
                totalRides: 0,
                level: 'bronze',
                commissionRate: 15,
                joinedAt: new Date(),
                isVerified: false,
                vehiclePlate: 'PENDING',
                profileType: undefined // Sera défini dans choose-profile
            });

            // Redirect to Onboarding Intro
            Alert.alert('Compte créé !', 'Continuons pour activer votre profil.');
            router.replace('/onboarding/intro');

        } catch (error: any) {
            console.error(error);
            Alert.alert('Erreur', error.message || 'Inscription échouée');
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = () => {
        const message = encodeURIComponent('Bonjour, j\'ai oublié mon mot de passe TransiGo Driver. Mon numéro: ' + phone);
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
                        source={{ uri: WelcomeImage }}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <Text style={styles.appName}>TransiGo Business</Text>
                    <Text style={styles.subtitle}>Espace Partenaire</Text>
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

                {/* Login Form */}
                {mode === 'login' && (
                    <View style={styles.form}>
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
                            <Text style={styles.inputIcon}>🔒</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Mot de passe"
                                placeholderTextColor={COLORS.gray}
                                secureTextEntry={!showPassword}
                                value={password}
                                onChangeText={setPassword}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <Text>{showPassword ? '🙈' : '👁️'}</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotBtn}>
                            <Text style={styles.forgotText}>Mot de passe oublié ? Contactez WhatsApp</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleLogin}
                            disabled={isLoading}
                            style={styles.submitBtn}
                        >
                            <LinearGradient
                                colors={[COLORS.primary, '#00A344']}
                                style={styles.gradient}
                            >
                                <Text style={styles.submitText}>
                                    {isLoading ? 'Chargement...' : 'Se connecter'}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Register Form (Simple) */}
                {mode === 'register' && (
                    <View style={styles.form}>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <View style={[styles.inputContainer, { flex: 1 }]}>
                                <Text style={styles.inputIcon}>👤</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Prénom"
                                    placeholderTextColor={COLORS.gray}
                                    value={firstName}
                                    onChangeText={setFirstName}
                                />
                            </View>
                            <View style={[styles.inputContainer, { flex: 1 }]}>
                                <Text style={styles.inputIcon}>👤</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Nom"
                                    placeholderTextColor={COLORS.gray}
                                    value={lastName}
                                    onChangeText={setLastName}
                                />
                            </View>
                        </View>

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
                            <Text style={styles.inputIcon}>🔒</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Mot de passe"
                                placeholderTextColor={COLORS.gray}
                                secureTextEntry={!showPassword}
                                value={password}
                                onChangeText={setPassword}
                            />
                        </View>
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputIcon}>🔒</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Confirmer mot de passe"
                                placeholderTextColor={COLORS.gray}
                                secureTextEntry={!showPassword}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                            />
                        </View>

                        <TouchableOpacity
                            onPress={handleRegister}
                            disabled={isLoading}
                            style={styles.submitBtn}
                        >
                            <LinearGradient
                                colors={[COLORS.primary, '#00A344']}
                                style={styles.gradient}
                            >
                                <Text style={styles.submitText}>S'inscrire</Text>
                                <Text style={{ fontSize: 18, color: COLORS.white, marginLeft: 8 }}>➡️</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Info */}
                <Text style={styles.infoText}>
                    En continuant, vous acceptez les conditions d'utilisation de TransiGo
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
        padding: 24,
        justifyContent: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    logo: {
        width: 100,
        height: 100,
    },
    appName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginTop: 12,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.gray,
        marginTop: 4,
    },
    modeToggle: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
        padding: 4,
        marginBottom: 24,
    },
    modeBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
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
        gap: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        gap: 12,
    },
    inputIcon: {
        fontSize: 18,
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
        marginTop: 16,
        borderRadius: 12,
        overflow: 'hidden',
    },
    gradient: {
        paddingVertical: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    submitText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
    },
    infoText: {
        textAlign: 'center',
        color: COLORS.gray,
        fontSize: 12,
        marginTop: 40,
    },
    // Styles for Instructions (Unused now but kept safe)
    registerInfo: {
        backgroundColor: '#f9f9f9',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
    },
    registerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.black,
        marginBottom: 8,
        textAlign: 'center',
    },
    registerSubtitle: {
        fontSize: 14,
        color: COLORS.gray,
        marginBottom: 24,
        textAlign: 'center',
    },
    benefitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        width: '100%',
    },
    benefitText: {
        marginLeft: 12,
        fontSize: 14,
        color: COLORS.black,
        flex: 1,
    }
});
