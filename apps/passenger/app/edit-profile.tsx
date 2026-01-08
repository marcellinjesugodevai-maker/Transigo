// =============================================
// TRANSIGO - EDIT PROFILE SCREEN
// =============================================

import { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@/components/Icon';
import { COLORS, SPACING } from '@/constants';
import { useAuthStore, useLanguageStore, useThemeStore } from '@/stores';
import { getTranslation } from '@/i18n/translations';

export default function EditProfileScreen() {
    const { user } = useAuthStore();
    const { language } = useLanguageStore();
    const { colors } = useThemeStore();
    const t = (key: any) => getTranslation(key, language);

    const [firstName, setFirstName] = useState(user?.firstName || '');
    const [lastName, setLastName] = useState(user?.lastName || '');
    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [birthDate, setBirthDate] = useState('');
    const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');

    const handleSave = () => {
        Alert.alert('Succès', 'Profil mis à jour !', [
            { text: 'OK', onPress: () => router.back() },
        ]);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
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
                <Text style={styles.headerTitle}>{t('editProfile')}</Text>
                <View style={{ width: 40 }} />
            </LinearGradient>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Photo de profil */}
                <View style={styles.photoSection}>
                    <View style={styles.photoContainer}>
                        <Text style={styles.photoEmoji}>👨</Text>
                        <TouchableOpacity style={styles.editPhotoButton} activeOpacity={0.9}>
                            <Icon name="camera" size={20} color={COLORS.white} />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.photoLabel}>Changer la photo</Text>
                </View>

                {/* Formulaire */}
                <View style={styles.form}>
                    {/* Prénom */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Prénom</Text>
                        <TextInput
                            style={styles.input}
                            value={firstName}
                            onChangeText={setFirstName}
                            placeholder="Jean"
                            placeholderTextColor={COLORS.textSecondary}
                        />
                    </View>

                    {/* Nom */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Nom</Text>
                        <TextInput
                            style={styles.input}
                            value={lastName}
                            onChangeText={setLastName}
                            placeholder="Kouassi"
                            placeholderTextColor={COLORS.textSecondary}
                        />
                    </View>

                    {/* Email */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.input}
                            value={email}
                            onChangeText={setEmail}
                            placeholder="jean.k@gmail.com"
                            placeholderTextColor={COLORS.textSecondary}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    {/* Téléphone */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Téléphone</Text>
                        <TextInput
                            style={styles.input}
                            value={phone}
                            onChangeText={setPhone}
                            placeholder="+225 07 00 11 22"
                            placeholderTextColor={COLORS.textSecondary}
                            keyboardType="phone-pad"
                        />
                    </View>

                    {/* Date de naissance */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Date de naissance</Text>
                        <TextInput
                            style={styles.input}
                            value={birthDate}
                            onChangeText={setBirthDate}
                            placeholder="01/01/1990"
                            placeholderTextColor={COLORS.textSecondary}
                            keyboardType="numeric"
                        />
                    </View>

                    {/* Genre */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Genre</Text>
                        <View style={styles.genderContainer}>
                            {[
                                { value: 'male', label: 'Homme', icon: '👨' },
                                { value: 'female', label: 'Femme', icon: '👩' },
                                { value: 'other', label: 'Autre', icon: '👤' },
                            ].map((item) => (
                                <TouchableOpacity
                                    key={item.value}
                                    style={[
                                        styles.genderButton,
                                        gender === item.value && styles.genderButtonActive,
                                    ]}
                                    onPress={() => setGender(item.value as any)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.genderIcon}>{item.icon}</Text>
                                    <Text
                                        style={[
                                            styles.genderText,
                                            gender === item.value && styles.genderTextActive,
                                        ]}
                                    >
                                        {item.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Bouton enregistrer */}
                <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSave}
                    activeOpacity={0.9}
                >
                    <LinearGradient
                        colors={[COLORS.primary, COLORS.primaryDark]}
                        style={styles.saveButtonGradient}
                    >
                        <Text style={styles.saveButtonText}>{t('save')}</Text>
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
    scrollContent: {
        padding: SPACING.lg,
    },
    photoSection: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    photoContainer: {
        position: 'relative',
        marginBottom: SPACING.sm,
    },
    photoEmoji: {
        fontSize: 80,
    },
    editPhotoButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    photoLabel: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '600',
    },
    form: {
        gap: SPACING.md,
    },
    inputGroup: {
        marginBottom: SPACING.sm,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: SPACING.sm,
    },
    input: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        paddingHorizontal: SPACING.md,
        paddingVertical: 14,
        fontSize: 15,
        color: COLORS.text,
        borderWidth: 1,
        borderColor: COLORS.background,
    },
    genderContainer: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    genderButton: {
        flex: 1,
        backgroundColor: COLORS.white,
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.background,
    },
    genderButtonActive: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primaryBg,
    },
    genderIcon: {
        fontSize: 24,
        marginBottom: 4,
    },
    genderText: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    genderTextActive: {
        color: COLORS.primary,
    },
    saveButton: {
        marginTop: SPACING.xl,
        borderRadius: 16,
        overflow: 'hidden',
    },
    saveButtonGradient: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.white,
    },
});
