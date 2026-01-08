// =============================================
// TRANSIGO DRIVER - SUPABASE TEST SCREEN
// Vérifier que la connexion Supabase fonctionne
// =============================================

import { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase, driverService, rideService, walletService } from '../src/services/supabaseService';

const COLORS = {
    primary: '#FF6B00',
    success: '#00C853',
    error: '#F44336',
    white: '#FFFFFF',
    black: '#1A1A2E',
    gray100: '#F5F5F5',
    gray600: '#757575',
};

interface TestResult {
    name: string;
    status: 'pending' | 'success' | 'error';
    message?: string;
}

export default function SupabaseTestScreen() {
    const [tests, setTests] = useState<TestResult[]>([
        { name: 'Connexion Supabase', status: 'pending' },
        { name: 'Lecture Table Drivers', status: 'pending' },
        { name: 'Lecture Table Rides', status: 'pending' },
        { name: 'Realtime Subscription', status: 'pending' },
    ]);
    const [isRunning, setIsRunning] = useState(false);

    const updateTest = (index: number, status: TestResult['status'], message?: string) => {
        setTests(prev => prev.map((t, i) =>
            i === index ? { ...t, status, message } : t
        ));
    };

    const runTests = async () => {
        setIsRunning(true);

        // Reset all tests
        setTests(prev => prev.map(t => ({ ...t, status: 'pending', message: undefined })));

        // Test 1: Connexion basique
        try {
            const { data, error } = await supabase.from('drivers').select('count');
            if (error) throw error;
            updateTest(0, 'success', 'Connexion établie ✓');
        } catch (e: any) {
            updateTest(0, 'error', e.message);
        }

        // Test 2: Lecture drivers
        try {
            const { data, error } = await supabase.from('drivers').select('*').limit(5);
            if (error) throw error;
            updateTest(1, 'success', `${data?.length || 0} chauffeur(s) trouvé(s)`);
        } catch (e: any) {
            updateTest(1, 'error', e.message);
        }

        // Test 3: Lecture rides
        try {
            const { data, error } = await supabase.from('rides').select('*').limit(5);
            if (error) throw error;
            updateTest(2, 'success', `${data?.length || 0} course(s) trouvée(s)`);
        } catch (e: any) {
            updateTest(2, 'error', e.message);
        }

        // Test 4: Realtime
        try {
            const channel = supabase
                .channel('test-channel')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'drivers' }, () => { })
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        updateTest(3, 'success', 'Realtime actif ✓');
                        supabase.removeChannel(channel);
                    }
                });

            // Timeout si pas de réponse
            setTimeout(() => {
                if (tests[3].status === 'pending') {
                    updateTest(3, 'error', 'Timeout');
                }
            }, 5000);
        } catch (e: any) {
            updateTest(3, 'error', e.message);
        }

        setIsRunning(false);
    };

    const createTestRide = async () => {
        try {
            const { data, error } = await supabase
                .from('rides')
                .insert({
                    passenger_id: '00000000-0000-0000-0000-000000000001', // ID fictif
                    pickup_address: 'Cocody Riviera 2',
                    pickup_lat: 5.3499,
                    pickup_lng: -4.0166,
                    dropoff_address: 'Plateau Centre',
                    dropoff_lat: 5.3219,
                    dropoff_lng: -4.0156,
                    distance_km: 5.5,
                    duration_min: 15,
                    price: 3500,
                    status: 'requested',
                })
                .select()
                .single();

            if (error) {
                Alert.alert('Erreur', error.message);
            } else {
                Alert.alert('Succès', `Course créée: ${data.id.slice(0, 8)}`);
            }
        } catch (e: any) {
            Alert.alert('Erreur', e.message);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Test Supabase</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content}>
                {/* Statut */}
                <View style={styles.statusCard}>
                    <Text style={styles.statusTitle}>🔌 Connexion Supabase</Text>
                    <Text style={styles.statusUrl}>zndgvloyaitopczhjddq.supabase.co</Text>
                </View>

                {/* Tests */}
                <View style={styles.testsCard}>
                    {tests.map((test, index) => (
                        <View key={index} style={styles.testRow}>
                            <View style={styles.testIcon}>
                                {test.status === 'pending' && (
                                    <Ionicons name="ellipse-outline" size={24} color={COLORS.gray600} />
                                )}
                                {test.status === 'success' && (
                                    <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                                )}
                                {test.status === 'error' && (
                                    <Ionicons name="close-circle" size={24} color={COLORS.error} />
                                )}
                            </View>
                            <View style={styles.testInfo}>
                                <Text style={styles.testName}>{test.name}</Text>
                                {test.message && (
                                    <Text style={[
                                        styles.testMessage,
                                        { color: test.status === 'error' ? COLORS.error : COLORS.success }
                                    ]}>
                                        {test.message}
                                    </Text>
                                )}
                            </View>
                        </View>
                    ))}
                </View>

                {/* Boutons */}
                <TouchableOpacity
                    style={[styles.button, isRunning && styles.buttonDisabled]}
                    onPress={runTests}
                    disabled={isRunning}
                >
                    {isRunning ? (
                        <ActivityIndicator color={COLORS.white} />
                    ) : (
                        <>
                            <Ionicons name="play" size={20} color={COLORS.white} />
                            <Text style={styles.buttonText}>Lancer les tests</Text>
                        </>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.buttonSecondary]}
                    onPress={createTestRide}
                >
                    <Ionicons name="add-circle" size={20} color={COLORS.primary} />
                    <Text style={[styles.buttonText, { color: COLORS.primary }]}>
                        Créer une course test
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.gray100,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.primary,
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    statusCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        alignItems: 'center',
    },
    statusTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.black,
        marginBottom: 8,
    },
    statusUrl: {
        fontSize: 14,
        color: COLORS.gray600,
    },
    testsCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
    },
    testRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray100,
    },
    testIcon: {
        marginRight: 12,
    },
    testInfo: {
        flex: 1,
    },
    testName: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.black,
    },
    testMessage: {
        fontSize: 12,
        marginTop: 4,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        borderRadius: 12,
        marginBottom: 12,
        gap: 8,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonSecondary: {
        backgroundColor: COLORS.white,
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.white,
    },
});
