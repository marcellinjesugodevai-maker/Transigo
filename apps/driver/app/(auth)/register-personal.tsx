import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useDriverRegStore } from '../../src/stores/driverRegStore';

const COLORS = { primary: '#FF6B00', secondary: '#00C853', secondaryDark: '#00A344', white: '#FFFFFF', black: '#1A1A2E', gray100: '#F5F5F5', gray600: '#757575' };

export default function RegisterPersonalScreen() {
    const { data, updateData } = useDriverRegStore();

    // Local state for validation feedback
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        if (!data.firstName) newErrors.firstName = 'Prénom requis';
        if (!data.lastName) newErrors.lastName = 'Nom requis';
        if (!data.phone || data.phone.length < 10) newErrors.phone = 'Numéro invalide';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validate()) {
            router.push('/(auth)/register-vehicle');
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.black} />
                </TouchableOpacity>
                <Text style={styles.title}>Inscrivez-vous</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.progressContainer}>
                <View style={[styles.progressStep, styles.activeStep]}><Text style={styles.stepText}>1</Text></View>
                <View style={styles.progressLine} />
                <View style={styles.progressStep}><Text style={[styles.stepText, { color: COLORS.gray600 }]}>2</Text></View>
                <View style={styles.progressLine} />
                <View style={styles.progressStep}><Text style={[styles.stepText, { color: COLORS.gray600 }]}>3</Text></View>
            </View>
            <Text style={styles.stepTitle}>Informations Personnelles</Text>

            <ScrollView contentContainerStyle={styles.form}>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Prénom</Text>
                    <TextInput
                        style={[styles.input, errors.firstName && styles.inputError]}
                        placeholder="Moussa"
                        value={data.firstName}
                        onChangeText={(t) => updateData({ firstName: t })}
                    />
                    {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Nom</Text>
                    <TextInput
                        style={[styles.input, errors.lastName && styles.inputError]}
                        placeholder="Koné"
                        value={data.lastName}
                        onChangeText={(t) => updateData({ lastName: t })}
                    />
                    {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Numéro de téléphone</Text>
                    <View style={styles.phoneContainer}>
                        <View style={styles.phonePrefix}>
                            <Text style={styles.phonePrefixText}>🇨🇮 +225</Text>
                        </View>
                        <TextInput
                            style={[styles.input, styles.phoneInput, errors.phone && styles.inputError]}
                            placeholder="07 XX XX XX XX"
                            keyboardType="phone-pad"
                            value={data.phone}
                            onChangeText={(t) => updateData({ phone: t })}
                        />
                    </View>
                    {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email (Optionnel)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="exemple@email.com"
                        keyboardType="email-address"
                        value={data.email}
                        onChangeText={(t) => updateData({ email: t })}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Ville</Text>
                    <TextInput
                        style={styles.input}
                        value={data.city}
                        onChangeText={(t) => updateData({ city: t })}
                    />
                </View>

            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                    <LinearGradient colors={[COLORS.secondary, COLORS.secondaryDark]} style={styles.gradientBtn}>
                        <Text style={styles.nextText}>Suivant</Text>
                        <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.white, paddingTop: 50 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
    backBtn: { padding: 8 },
    title: { fontSize: 20, fontWeight: 'bold' },

    progressContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    progressStep: { width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.gray100, justifyContent: 'center', alignItems: 'center' },
    activeStep: { backgroundColor: COLORS.secondary },
    stepText: { fontWeight: 'bold', color: COLORS.white },
    progressLine: { width: 40, height: 2, backgroundColor: COLORS.gray100 },

    stepTitle: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, paddingHorizontal: 20 },

    form: { paddingHorizontal: 24, paddingBottom: 100 },
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 14, color: COLORS.gray600, marginBottom: 8, fontWeight: '500' },
    input: { backgroundColor: COLORS.gray100, borderRadius: 12, padding: 16, fontSize: 16, color: COLORS.black },
    inputError: { borderWidth: 1, borderColor: 'red' },
    errorText: { color: 'red', fontSize: 12, marginTop: 4 },

    phoneContainer: { flexDirection: 'row', alignItems: 'center' },
    phonePrefix: { backgroundColor: '#E8E8E8', padding: 16, borderTopLeftRadius: 12, borderBottomLeftRadius: 12, marginRight: 0 },
    phonePrefixText: { fontWeight: 'bold' },
    phoneInput: { borderTopLeftRadius: 0, borderBottomLeftRadius: 0, flex: 1 },

    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.gray100 },
    nextButton: { borderRadius: 12, overflow: 'hidden' },
    gradientBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, gap: 8 },
    nextText: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },
});
