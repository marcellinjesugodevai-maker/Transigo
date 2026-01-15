import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useDriverRegStore } from '../../src/stores/driverRegStore';

const COLORS = { primary: '#FF6B00', secondary: '#00C853', secondaryDark: '#00A344', white: '#FFFFFF', black: '#1A1A2E', gray100: '#F5F5F5', gray600: '#757575', selected: '#E8F5E9' };

const VEHICLE_TYPES = [
    { id: 'standard', label: 'Standard', emoji: '🚗' },
    { id: 'comfort', label: 'Confort', emoji: '🚙' },
    { id: 'luxury', label: 'Luxe', emoji: '💎' },
    { id: 'family', label: 'Famille', emoji: '🚐' },
    { id: 'moto', label: 'Moto', emoji: '🏍️' },
];

export default function RegisterVehicleScreen() {
    const { data, updateData } = useDriverRegStore();
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        if (!data.vehicleBrand) newErrors.brand = 'Marque requise';
        if (!data.vehicleModel) newErrors.model = 'Modèle requis';
        if (!data.vehiclePlate) newErrors.plate = 'Immatriculation requise';
        if (!data.vehicleColor) newErrors.color = 'Couleur requise';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validate()) {
            router.push('/(auth)/register-documents');
        }
    };

    const isMoto = data.vehicleType === 'moto';
    const vehicleLabel = isMoto ? 'Moto' : 'Véhicule';

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Text style={{ fontSize: 24 }}>⬅️</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Infos {vehicleLabel}</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.progressContainer}>
                <View style={[styles.progressStep, { backgroundColor: COLORS.secondary }]}><Text style={{ color: 'white', fontSize: 14 }}>✅</Text></View>
                <View style={[styles.progressLine, { backgroundColor: COLORS.secondary }]} />
                <View style={[styles.progressStep, styles.activeStep]}><Text style={styles.stepText}>2</Text></View>
                <View style={styles.progressLine} />
                <View style={styles.progressStep}><Text style={[styles.stepText, { color: COLORS.gray600 }]}>3</Text></View>
            </View>
            <Text style={styles.stepTitle}>Détails du Transport</Text>

            <ScrollView contentContainerStyle={styles.form}>

                <Text style={styles.sectionLabel}>Type de {isMoto ? 'transport' : 'véhicule'}</Text>
                <View style={styles.typeContainer}>
                    {VEHICLE_TYPES.map((type) => (
                        <TouchableOpacity
                            key={type.id}
                            style={[styles.typeOption, data.vehicleType === type.id && styles.typeOptionSelected]}
                            onPress={() => updateData({ vehicleType: type.id as any })}
                        >
                            <Text style={{ fontSize: 28 }}>{type.emoji}</Text>
                            <Text style={[styles.typeText, data.vehicleType === type.id && styles.typeTextSelected]}>{type.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                        <Text style={styles.label}>Marque</Text>
                        <TextInput
                            style={[styles.input, errors.brand && styles.inputError]}
                            placeholder={isMoto ? "Yamaha" : "Toyota"}
                            value={data.vehicleBrand}
                            onChangeText={(t) => updateData({ vehicleBrand: t })}
                        />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                        <Text style={styles.label}>Modèle</Text>
                        <TextInput
                            style={[styles.input, errors.model && styles.inputError]}
                            placeholder={isMoto ? "X-Max" : "Corolla"}
                            value={data.vehicleModel}
                            onChangeText={(t) => updateData({ vehicleModel: t })}
                        />
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Année</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="2018"
                        keyboardType="numeric"
                        value={data.vehicleYear}
                        onChangeText={(t) => updateData({ vehicleYear: t })}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Plaque d'immatriculation</Text>
                    <TextInput
                        style={[styles.input, errors.plate && styles.inputError]}
                        placeholder="1234 XY 01"
                        autoCapitalize="characters"
                        value={data.vehiclePlate}
                        onChangeText={(t) => updateData({ vehiclePlate: t })}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Couleur de la {isMoto ? 'moto' : 'voiture'}</Text>
                    <TextInput
                        style={[styles.input, errors.color && styles.inputError]}
                        placeholder="Gris, Blanc, Noir..."
                        value={data.vehicleColor}
                        onChangeText={(t) => updateData({ vehicleColor: t })}
                    />
                </View>

            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                    <LinearGradient colors={[COLORS.secondary, COLORS.secondaryDark]} style={styles.gradientBtn}>
                        <Text style={styles.nextText}>Suivant</Text>
                        <Text style={{ fontSize: 20, color: COLORS.white }}>➡️</Text>
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

    sectionLabel: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
    typeContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
    typeOption: { flex: 1, alignItems: 'center', padding: 12, borderWidth: 1, borderColor: COLORS.gray100, borderRadius: 12, marginHorizontal: 4 },
    typeOptionSelected: { borderColor: COLORS.secondary, backgroundColor: COLORS.selected },
    typeText: { marginTop: 8, fontSize: 12, fontWeight: '500', color: COLORS.gray600 },
    typeTextSelected: { color: COLORS.secondary, fontWeight: 'bold' },

    row: { flexDirection: 'row' },

    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.gray100 },
    nextButton: { borderRadius: 12, overflow: 'hidden' },
    gradientBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, gap: 8 },
    nextText: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },
});
