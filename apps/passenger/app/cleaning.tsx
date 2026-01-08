import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import Icon from '@/components/Icon';
import { COLORS, SPACING } from '@/constants';
import { LinearGradient } from 'expo-linear-gradient';

export default function CleaningScreen() {
    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <LinearGradient
                    colors={[COLORS.primary + '20', COLORS.primary + '05']}
                    style={styles.iconContainer}
                >
                    <Icon name="construct" size={64} color={COLORS.primary} />
                </LinearGradient>
                <Text style={styles.title}>En Construction</Text>
                <Text style={styles.subtitle}>
                    Cette fonctionnalité sera bientôt disponible dans la prochaine mise à jour de TransiGo.
                </Text>

                <TouchableOpacity style={styles.button} onPress={() => router.back()}>
                    <Text style={styles.buttonText}>Retour</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        padding: SPACING.xl,
    },
    content: {
        alignItems: 'center',
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    title: {
        fontSize: 24,
        fontFamily: 'Poppins-Bold',
        color: COLORS.black,
        marginBottom: SPACING.sm,
    },
    subtitle: {
        fontSize: 16,
        fontFamily: 'Poppins-Regular',
        color: COLORS.gray600,
        textAlign: 'center',
        marginBottom: SPACING['3xl'],
        lineHeight: 24,
    },
    button: {
        backgroundColor: COLORS.gray100,
        paddingHorizontal: SPACING['2xl'],
        paddingVertical: SPACING.md,
        borderRadius: 30,
    },
    buttonText: {
        fontSize: 16,
        fontFamily: 'Poppins-Medium',
        color: COLORS.black,
    },
});

