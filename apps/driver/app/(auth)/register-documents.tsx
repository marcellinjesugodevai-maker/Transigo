import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useDriverRegStore } from '../../src/stores/driverRegStore';
import { supabase } from '../../src/services/supabaseService';
import { useDriverStore } from '../../src/stores/driverStore';
import * as ImagePicker from 'expo-image-picker';

const COLORS = { primary: '#00C853', secondary: '#00C853', secondaryDark: '#00A344', white: '#FFFFFF', black: '#1A1A2E', gray100: '#F5F5F5', gray600: '#757575', success: '#4CAF50' };

export default function RegisterDocumentsScreen() {
    const { data, updateData } = useDriverRegStore();
    const [uploading, setUploading] = useState<string | null>(null);

    // Simplified upload function
    const handleUpload = async (docType: string) => {
        try {
            console.log('[Upload] Starting upload for:', docType);

            // Request permissions
            const permResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permResult.granted) {
                Alert.alert('Permission requise', 'Veuillez autoriser l\'accès à la galerie.');
                return;
            }

            // Pick image
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.5,
                base64: true, // Get base64 directly from ImagePicker
            });

            if (result.canceled || !result.assets?.[0]) {
                console.log('[Upload] User cancelled');
                return;
            }

            setUploading(docType);
            console.log('[Upload] Image selected, uploading...');

            const asset = result.assets[0];
            const { driver } = useDriverStore.getState();
            const driverId = driver?.id || 'unknown';
            const fileName = `${driverId}/${docType}_${Date.now()}.jpg`;

            // If base64 is available, use it
            if (asset.base64) {
                // Convert base64 to Uint8Array
                const binaryString = atob(asset.base64);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('driver-documents')
                    .upload(fileName, bytes.buffer, {
                        contentType: 'image/jpeg',
                        upsert: true
                    });

                if (uploadError) {
                    console.error('[Upload] Supabase error:', uploadError);
                    Alert.alert('Erreur Upload', uploadError.message);
                    setUploading(null);
                    return;
                }

                console.log('[Upload] Success:', uploadData);
            } else {
                // Fallback: use fetch to get blob (for web or if base64 not available)
                const response = await fetch(asset.uri);
                const blob = await response.blob();

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('driver-documents')
                    .upload(fileName, blob, {
                        contentType: 'image/jpeg',
                        upsert: true
                    });

                if (uploadError) {
                    console.error('[Upload] Supabase error:', uploadError);
                    Alert.alert('Erreur Upload', uploadError.message);
                    setUploading(null);
                    return;
                }

                console.log('[Upload] Success:', uploadData);
            }

            // Get public URL
            const { data: urlData } = supabase.storage.from('driver-documents').getPublicUrl(fileName);
            const publicUrl = urlData?.publicUrl;
            console.log('[Upload] Public URL:', publicUrl);

            // Store URL in local state
            updateData({ [docType]: publicUrl });
            Alert.alert('Succès', 'Document téléchargé avec succès ✅');

        } catch (e: any) {
            console.error('[Upload] Exception:', e);
            Alert.alert('Erreur', e.message || 'Échec du téléchargement');
        } finally {
            setUploading(null);
        }
    };

    // Check completion based on profile type
    const isComplete = (() => {
        if (data.profileType === 'driver') {
            return data.licenseFront && data.licenseBack && data.registrationCard && data.insurance && data.idCardBoard;
        } else if (data.profileType === 'delivery') {
            return data.idCardBoard; // Simplified: just CNI for delivery
        } else {
            // seller
            return data.idCardBoard && data.businessRegistration;
        }
    })();

    const handleNext = async () => {
        if (!isComplete) {
            Alert.alert('Incomplet', 'Veuillez télécharger tous les documents requis.');
            return;
        }

        // Get driver ID from Zustand store (set during login)
        const { driver } = useDriverStore.getState();

        if (!driver?.id) {
            Alert.alert('Erreur', 'Vous n\'êtes pas connecté. Veuillez vous reconnecter.');
            router.replace('/(auth)/login');
            return;
        }

        try {
            setUploading('submitting');
            console.log('Updating driver:', driver.id);

            // Update driver record
            const { error } = await supabase.from('drivers').update({
                profile_type: data.profileType,
                vehicle_brand: data.vehicleBrand,
                vehicle_model: data.vehicleModel,
                vehicle_year: parseInt(data.vehicleYear) || 2020,
                vehicle_plate: data.vehiclePlate,
                vehicle_color: data.vehicleColor,
                vehicle_type: data.vehicleType || 'standard',
                // Document URLs
                license_front_url: data.licenseFront,
                license_back_url: data.licenseBack,
                registration_card_url: data.registrationCard,
                insurance_url: data.insurance,
                id_card_url: data.idCardBoard,
                // Mark as submitted (still not verified)
                updated_at: new Date().toISOString()
            }).eq('id', driver.id);

            if (error) {
                console.error('Error updating driver:', error);
                Alert.alert("ERREUR DATABASE", JSON.stringify(error));
                throw error;
            }

            // Update local store
            const currentDriver = useDriverStore.getState().driver;
            if (currentDriver) {
                useDriverStore.getState().setDriver({
                    ...currentDriver,
                    vehiclePlate: data.vehiclePlate,
                    isVerified: false,
                    profileType: data.profileType
                });
            }

            // Success - Go to pending validation screen
            router.replace('/(auth)/register-pending' as any);

        } catch (e: any) {
            Alert.alert('Erreur', e.message);
        } finally {
            setUploading(null);
        }
    };

    const renderDocButton = (key: string, label: string) => {
        const isUploaded = !!(data as any)[key];
        const isUploading = uploading === key;

        return (
            <TouchableOpacity
                style={[styles.docButton, isUploaded && styles.docButtonSuccess]}
                onPress={() => handleUpload(key)}
                disabled={isUploading}
            >
                <View style={styles.docIconContainer}>
                    {isUploading ? (
                        <ActivityIndicator color={COLORS.primary} size="small" />
                    ) : isUploaded ? (
                        <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                    ) : (
                        <Ionicons name="cloud-upload-outline" size={24} color={COLORS.gray600} />
                    )}
                </View>
                <View style={styles.docInfo}>
                    <Text style={[styles.docLabel, isUploaded && styles.docLabelSuccess]}>{label}</Text>
                    <Text style={styles.docStatus}>{isUploaded ? 'Téléchargé' : 'Appuyer pour ajouter'}</Text>
                </View>
                {isUploaded && (
                    <TouchableOpacity onPress={() => updateData({ [key]: null })}>
                        <Ionicons name="trash-outline" size={20} color={COLORS.gray600} />
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.black} />
                </TouchableOpacity>
                <Text style={styles.title}>Documents</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.progressContainer}>
                <View style={[styles.progressStep, { backgroundColor: COLORS.secondary }]}><Ionicons name="checkmark" size={16} color="white" /></View>
                <View style={[styles.progressLine, { backgroundColor: COLORS.secondary }]} />
                <View style={[styles.progressStep, { backgroundColor: COLORS.secondary }]}><Ionicons name="checkmark" size={16} color="white" /></View>
                <View style={[styles.progressLine, { backgroundColor: COLORS.secondary }]} />
                <View style={[styles.progressStep, styles.activeStep]}><Text style={styles.stepText}>3</Text></View>
            </View>
            <Text style={styles.stepTitle}>Documents Requis</Text>
            <Text style={styles.stepSubtitle}>Prenez en photo vos documents officiels</Text>

            <ScrollView contentContainerStyle={styles.form}>

                {/* DRIVER: All documents */}
                {data.profileType === 'driver' && (
                    <>
                        <Text style={styles.sectionHeader}>Permis de Conduire</Text>
                        {renderDocButton('licenseFront', 'Recto du Permis')}
                        {renderDocButton('licenseBack', 'Verso du Permis')}

                        <Text style={styles.sectionHeader}>Véhicule</Text>
                        {renderDocButton('registrationCard', 'Carte Grise (Carte Transport)')}
                        {renderDocButton('insurance', "Attestation d'Assurance")}

                        <Text style={styles.sectionHeader}>Identité</Text>
                        {renderDocButton('idCardBoard', "Photo d'identité ou CNI")}
                    </>
                )}

                {/* DELIVERY: Simplified */}
                {data.profileType === 'delivery' && (
                    <>
                        <Text style={styles.sectionHeader}>Identité</Text>
                        {renderDocButton('idCardBoard', "Photo d'identité ou CNI")}
                    </>
                )}

                {/* SELLER: Business documents */}
                {data.profileType === 'seller' && (
                    <>
                        <Text style={styles.sectionHeader}>Identité</Text>
                        {renderDocButton('idCardBoard', "Photo d'identité ou CNI")}

                        <Text style={styles.sectionHeader}>Commerce</Text>
                        {renderDocButton('businessRegistration', 'Registre de Commerce')}
                    </>
                )}

            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.nextButton, !isComplete && styles.disabledBtn]}
                    onPress={handleNext}
                    disabled={!isComplete}
                >
                    <LinearGradient
                        colors={isComplete ? [COLORS.secondary, COLORS.secondaryDark] : [COLORS.gray100, COLORS.gray100]}
                        style={styles.gradientBtn}
                    >
                        <Text style={[styles.nextText, !isComplete && styles.disabledText]}>Soumettre mon dossier</Text>
                        {isComplete && <Ionicons name="checkmark-done" size={20} color={COLORS.white} />}
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
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

    stepTitle: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
    stepSubtitle: { fontSize: 14, color: COLORS.gray600, textAlign: 'center', marginBottom: 24 },

    form: { paddingHorizontal: 24, paddingBottom: 100 },
    sectionHeader: { fontSize: 16, fontWeight: 'bold', marginTop: 16, marginBottom: 12, color: COLORS.black },

    docButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: COLORS.gray100,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    docButtonSuccess: {
        backgroundColor: '#E8F5E9',
        borderColor: COLORS.success,
    },
    docIconContainer: { marginRight: 16 },
    docInfo: { flex: 1 },
    docLabel: { fontSize: 15, fontWeight: '500', color: COLORS.black },
    docLabelSuccess: { color: COLORS.success, fontWeight: '600' },
    docStatus: { fontSize: 12, color: COLORS.gray600 },

    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.gray100 },
    nextButton: { borderRadius: 12, overflow: 'hidden' },
    disabledBtn: { opacity: 0.8 },
    gradientBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, gap: 8 },
    nextText: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },
    disabledText: { color: COLORS.gray600 },
});
